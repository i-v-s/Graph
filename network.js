"use strict";
function Network()
{
	var Nodes = []; // Узлы
	var Branches = [];
	var Models = {}; // Математические модели
	var Devices = []; // Устройства
	var Errors = [];
	var YList = []; // Матрица проводимости в виде связного списка
    var FreeY = null; // Указатель на свободный элемент в YList
	var LU = []; // Триангулированная матрица cplx L, U; // L = Yij, Yii для V; U = Yji, 0 для I
	//CNode * Node;
	//CYArray * Y;
	function Node(pin) // Создаёт новый узел и привязывает к объекту
	{
		var pins = [];
		if(pin) 
		{
			pin._enode = this;
			pins.push(pin);
		}
		this.Original = null;
		this.Sorted = null;
		this.T = false; // Тип
		this.V = 0.0; // Напряжение (относительно земли)
        this.I = 0.0; // Задающий (втекающий) ток
		this.y = 0.0; // Проводимость (относительно земли)
		this.bc = 0;
		this.Drop = function() {pins = null;};
		this.Add = function(pin) 
		{// Добавляет объект к узлу. Если объект привязан к другому узлу, то сливает узлы в один
			if(pin._enode) this.Join(pin._enode);
			else {pin._enode = this; pins.push(pin);}
		};
		this.GetPins = function() {return pins;};
		this.Join = function(node) // сливает два узла в один
		{
            if(node === this) return;
			if(node.T)
			{
				if(this.T && this.V !== node.V)
				{
					throw("Замыкание между шинами питания " + this.V + "В и " + node.V + "В");
					//Errors.push("Замыкание между шинами питания " + this.V + "В и " + node.V + "В");
					return;
				}
				node.Join(this);
				return;
			}
			var p = node.GetPins();
			for(var t in p)
			{
				var pt = p[t];
				pins.push(pt);
				pt._enode = this;
			}
			node.Drop();
		};
		Nodes.push(this);
	}
	(new Node(null)).T = true;
	var GND = Nodes.pop();
	function NodeByV(V, pin) // Ищет узел с заданным напряжением. Если такого нет, создаёт новый 
	{
		if(V === 0.0) {GND.Add(pin); return GND;} // GND
		if(typeof V === "number") for(var t in Nodes)
			if(Nodes[t].T && Nodes[t].V === V)
			{
				Nodes[t].Add(pin);
				return Nodes[t];
			}
		var n = new Node(pin);
		n.T = true;
		n.V = V;
		return n;
	}
	function Load(Items)
	{
		for(var i in Items) if(Items[i].GetInfo)
		{
			var info = Items[i].GetInfo();
			var Model = null;
			var ModelName = "";
			if(info.Def)
			{
				var N = info.Def.N;
				for(var n in N)
                {
                    Model = Models[N[n]];
					if(Model)
					{
						ModelName = N[n];
						break;
					}
                }
			}
			if(!Model) 
			{
				Errors.push("Не найдена модель для компонента '" + info.Name + "', тип " + info.CmpName);
				continue;
			}
			// Нашли модель, создаём устройство
			var pins = info.Pins;
			var mpins = Model.nodes;
			var dev = {M:Model, Name:info.Name, info:info, pins:pins};
			for(var t in mpins) // Проходим по узлам модели
			{
				var p = pins[t];
				if(!p && t[0] !== '_') Errors.push("Узел " + t + " мат. модели " + ModelName + " не существует.");
				if(mpins[t] && mpins[t].T) // Узел с заданным напряжением
				{
					NodeByV(mpins[t].V, p); // Ищем такой же, если не нашли - добавляем
					continue;
				}			
				new Node(p);			
			}			
			Devices.push(dev);
		}
		else if(Items[i].p1 && Items[i].p2)
		{
            /*DumpNodes();
            console.log("Соединение " + Main.GetId(Items[i].p1) + " - "+ Main.GetId(Items[i].p2));*/
			// Линия
			var p1 = Items[i].p1;
			var p2 = Items[i].p2;
			if(!p1._enode) new Node(p1);
			p1._enode.Add(p2);
		}
		// Чистим узлы:
		var l = 0;
		for(var t = 0, e = Nodes.length; t < e; t++) if(Nodes[t].GetPins()) Nodes[l++] = Nodes[t];
		Nodes.length = l;
		// Чистим устройства, создаём ветви и инициализируем контакты
		l = 0;
		for(var t = 0, e = Devices.length; t < e; t++)
		{
			var d = Devices[t];
			var dN = [];
			for(var k in d.pins) dN[k] = d.pins[k]._enode;
			var dB = [];
			for(var b in d.M.branches)
			{
				var B = d.M.branches[b];
				var p = dN[B.p];
				var q = dN[B.q];
				if(p === undefined || q === undefined) Errors.push("Ветвь в модели задана не верно");
				var br = {p:p, q:q, y: 0.0};
				dB.push(br);
				Branches.push(br);
			}
			if(!d.M.ctor) continue;
			//var t = d.M.ctor.toString();
			d = new d.M.ctor(d.info.Fields, dN, dB);
			if(d.AddI || d.AddY) Devices[l++] = d;
		}
		Devices.length = l;
	}
	var Y = null;

	//! Метод формирования матрицы проводимостей Y в виде связного списка Y
	function PrepareYList()
	{
		// Инициализируем проводимости
		for(var n in Nodes) Nodes[n].y = 0.0;
		for(var b in Branches) Branches[b].y = 0.0;
		for(var d in Devices) if(Devices[d].AddY) Devices[d].AddY();
		
		Y = null;
		var Size = Nodes.length + Branches.length * 2;
		YList = Array(Size + 1);
		var y = 0; //YList;
		for(var n in Nodes) if(!Nodes[n].T) // Заполняем Y из узлов
		{
			var N = Nodes[n];
			N.YList = YList[y] = {Node: N, y: N.y};
			N.bc = 0;
			N.Mark = 0;
			y++;
		}
		else
			Nodes[n].YList = null;
		
		//UsualNodeCount = (int)(y - YList) - 1;
		
		//! Метод создания проводимости между узлами
		/*CYList * */ function AddBranch(N, AdjacentNode)
		{
			var Last = N.YList;
			if(AdjacentNode === null) return n;
			for(var List = Last; List; List = List.Next) 
				if(List.Node === AdjacentNode)
					return List;
				else
					Last = List;
			N.bc++;		
			var d = {Next: null, Node: AdjacentNode, y: 0, Sources: 0};
			Last.Next = d;
			YList[y++] = d;
			return d;
		}

		for(var B in Branches)  // Заполняем Y из ветвей
		{
			var b = Branches[B]
            if(b.y === 0) continue;
            var p = b.p, q = b.q;
			if(p && p.YList)
			{
				AddBranch(p, q).y -= b.y;;
				//l->AddBranch(b->pYpq);
                p.YList.y += b.y;
			}
			if(q && q.YList)
			{
				AddBranch(q, p).y -= b.y;
				//l->AddBranch(b->pYqp);
                q.YList.y += b.y; // Диагональ
			}
		}
        FreeY = YList[y];
		if(y < Size)
		{
			var t = Size - 1;
			YList[t] = {Next: null};
			for(t--; t >= y; t--)
				YList[t] = {Next: YList[t + 1]};			
		}

		/*if(UseFastTriangulation)
		{
			Y = (CYArray *) malloc(YSize * sizeof(CYArray));
			memset(Y, 0, YSize * sizeof(CYArray));
			YisValid = false;
		}*/
	}
	var UseFastTriangulation = false;
	var UseBestDiagonal = false;
	var MinimalNorm = 0.0000001;
	
    function norm(x){return x * x;}	
	//! Метод исключения узла
	function ExcludeNode(Node)
	{
		var MinBranchCount = Node.bc;
		var maxd = MinimalNorm;
	/*#if _DEBUG
		int deb_bc = MinBranchCount;
	#endif*/
		var Result = null;
		// Выделяем часть триангулированной матрицы, относящуюся к исключаемому узлу
		
		var ilu = LU.length; 
		LU.length = ilu + MinBranchCount + 1;
		//cplx * * plu;
		/*if(UseFastTriangulation)
			plu = pLU.Alloc(MinBranchCount * MinBranchCount);*/
		var Yii = Node.YList;
		var Diag = 1.0 / Yii.y;
		// Отключаем узел от смежных
		var Prev = Yii;
		for(var j = Yii.Next; j; j = j.Next, ilu++/*, LUIndex++*/)
		{
			//_ASSERTE(deb_bc--);
			var jNode = j.Node;
			jNode.bc--;
			var lu = LU[ilu] = {L: Diag * j.y, U:0.0, Node: jNode};
			/*if(UseFastTriangulation) 
			{
				j->FillSources(LUIndex);//&lu->L);
				if(j->Branches)
				{
					lu->Y = &Y[j - YList - 1];
					j->FillBranches(&lu->Y->Yij);
				}
				else
					lu->Y = 0;
			}*/
			if(jNode.T) continue;
	/*#ifdef _DEBUG
			int f = 1;
			int deb_bc1 = Node->BranchCount;
	#endif*/
			for(var k = jNode.YList; k; k = k.Next) // Идём вокруг j
			{
				var kNode = k.Node;
				if(kNode === Node) 
				{
					//_ASSERTE(f--);// Надо проверять - найден ли этот узел.
					lu.U = Diag * k.y;
					/*if(UseFastTriangulation) 
					{
						k->FillSources(LUIndex | 0x80000000);//&lu->U);
						if(k->Branches)
						{
							k->FillBranches(&Y[j - YList - 1].Yji);
							_ASSERTE(j - YList - 1 < YSize);
						}
					}*/
					k = Prev;
	                var t = FreeY;
	                FreeY = Prev.Next;
	                Prev.Next = FreeY.Next;
	                FreeY.Next = t;
				}
				else
				{ // Отмечаем в узле k узел j и связь, приведшую от него в k.
					kNode.Mark = jNode;
					kNode.YMark = k;
					Prev = k;
				};
			}
			//_ASSERTE(!f);
			for(var k = Yii.Next; k; k = k.Next) // Идём вокруг i
			{
				var kNode = k.Node;
				var Yjk;
				if(kNode.Mark !== jNode) // Связи Yjk не было, создаём
				{
					Yjk = NewElement(YList, FreeY);
					Prev = Prev.Next = Yjk;
					Prev.Node = kNode;
					Prev.y = -(k.y * lu.U);
					Prev.Sources = 0;
					Prev.Branches = 0;
					jNode.BranchCount++;
				}
				else
				{ 
					Yjk = kNode.YMark;
					Yjk.y -= k.y * lu.U;
				};
				//_ASSERTE(deb_bc1--);
				//if(UseFastTriangulation) Yjk->AddSource(*(plu++)); // Добавляем plu в список влияющих на Yjk
			}
			//_ASSERTE(!deb_bc1);
			Prev.Next = 0; // Завершаем список ветвей j
			Prev = j;
			// Определяем - не стал ли узел оптимальным для следующего исключения
			var bc = jNode.bc;
			if(MinBranchCount >= bc)
			{
				var d = norm(jNode.YList.y);
				if(d > ((MinBranchCount > bc) ? MinimalNorm : maxd))
				{
					maxd = d;
					Result = jNode;
					MinBranchCount = bc;
				};
			};
		}
		//_ASSERTE(!deb_bc);
		/*if(UseFastTriangulation)
			pLU.Last->Last = plu - 1;*/
		LU[ilu] = {L: Diag, Node: null/*, Y: Y + (Yii - YList - 1),*/ };
		//Node.pY = &lu->Y->Yij;
		//Yii->FillSources(LUIndex++);//&lu->L);
		// Освобождаем элементы Yij для экономии памяти
		Prev.Next = FreeY;
		FreeY = Yii;
		return Result;
	}

	function TriangulateYList()
	{	
		//LU.Reset();
		//LUIndex = 1;
		//pLU.Reset();

		// Инициализируем Sorted/Original, вытаскиваем базовые в конец
		var Base = Nodes.length;
		var Usual = 0;//CNode * Usual = Nodes;
		for(var n in Nodes)
		{
			var Node = Nodes[n];
			if(Node.T)
			{
				Node.Sorted = Nodes[--Base];
				Nodes[Base].Original = Node;
			}
			else
			{
				Nodes[Usual].Original = Node;
				Node.Sorted = Nodes[Usual++];
			}
		}
		//this->Base = Base;
		var Threshold = 0;
		var OptimalNode = null;
		for(var nn = 0; nn < Base; nn++)
		{
			var Node = Nodes[nn];
			if(!OptimalNode) // Ищем оптимальный узел
			{
				var MinBC = 1 << 30;
				if(UseBestDiagonal) 
				{
					var max = MinimalDiagonalNorm;
					for(var n = nn; n < Base; n++)
					{
						var o = Nodes[n].Original;
						var bc = o.bc;
						if(bc <= MinBC)
						{
							var m = norm(o.YList.y);
							if(m > ((bc < MinBC) ? MinimalDiagonalNorm : max))
							{
								max = m;
								MinBC = bc;
								OptimalNode = o;
							};
						};
					}
					if(max < MinimalNorm) OptimalNode = 0;
				}
				else for(var n = nn; n < Base; n++)
				{
					var o = Nodes[n].Original;
					var bc = o.bc;
					if(bc <= Threshold) 
					{
						//_ASSERTE(bc == Threshold);
						if(norm(o.YList.y) < MinimalNorm)
							continue;
						OptimalNode = o;
						break;
					}
					if(bc < MinBC)
					{
						if(norm(o.YList.y) < MinimalNorm)
							continue;
						MinBC = bc;
						OptimalNode = o;
					}
				}
			}
			/*if(!OptimalNode)
			{
				//ATLTRACE("\nНе найден узел с надёжной диагональю. Осталось исключить %d. Текущий: %d", (CNode *)(&Base->SData) - (CNode *)Node, Node->Original - Nodes);
				this->Base = (CNode *)((char *)Node - ((char *)&Nodes->SData - (char *)Nodes));
				for(CNode * b = this->Base; b < Base; b++)
				{
					var t = b.Original;
					t.T = "MISSED";
					t.pY = null;
				}

				var iNode = Node.Original;
				for(CPFlat<CLU>::CPiece * List = LU.Last; List; List = List->Prev)
				{
					CLU * first = List->GetFirst();
					for(CLU * lu = List->Last; lu >= first; lu--)
					{
						if(CNode * jNode = lu->Node)
						{
							if(jNode->Type == CNode::MISSED)
							{
								iNode->Type = CNode::MISSED;
								iNode->pY = 0;
							}
						}
						else 
						{
							(*(CNode * *)&Node)--;
							iNode = Node->Original;
						}
					}
				}
				break;
				/*ATLTRACE("\nНе найден узел с надёжной диагональю. Осталось исключить %d. Текущий: %d", (CNode *)(&Base->SData) - (CNode *)Node, Node->Original - Nodes);
				DeleteList(YList);
				YList = 0;
				LU.Reset();
				pLU.Reset();
				return false;* /
			}*/
			// Ставим оптимальный узел на текущую позицию
			var Old = Node.Original;
			if(Old !== OptimalNode)
			{
				(Old.Sorted = OptimalNode.Sorted).Original = Old;
				Node.Original = OptimalNode;
				OptimalNode.Sorted = Node;
			}
			// Исключаем узел
			Threshold = OptimalNode.bc;
			OptimalNode = ExcludeNode(OptimalNode);
		}
		//if(UseFastTriangulation) IdxToPointers();
		YList = null;
		return true;
	}
	function Dump()
	{
		for(var t in Nodes)
		{
			var r = "Узел " + t;
			var n = Nodes[t];
			for(var f in n)
			{
				var v = n[f];
				if(typeof v === "function") continue;
				if(f === "YList") for(var y in YList) if(v === YList[y])
				{
					v = "YList[" + y + "]";
					break;
				}
				if(f === "Original" || f === "Sorted") for(var t in Nodes) if(Nodes[t] === v) 
				{
					v = "Nodes[" + t + "]";
					break;
				}
				
				r += " " + f + ": " + v;
			}
			console.log(r);			
		}
		for(var t in Branches)
		{
			var b = Branches[t];
			var r = "Ветвь";
			if(b.p === null) r += " p:GND";
			else for(var n in Nodes) if(Nodes[n] === b.p) {r += " p:" + n; break;} 
			if(b.q === null) r += " q:GND";
			else for(var n in Nodes) if(Nodes[n] === b.q) {r += " q:" + n; break;}
			r += " y = " + b.y;
			console.log(r);
		}
		for(var t in Devices)
		{
			var d = Devices[t];
			var r = "Устройство " + d.Name;
			var m = d.M;
			for(var mm in Models) if(Models[mm] == m)
			{
				r += " модель " + mm;
				break;
			}
			for(var n in d.N) 
            {
                var dnn = d.N[n];
                if(dnn === null) r += " пин " + n + ":GND";
                else for (var t in Nodes) if (Nodes[t] === dnn) 
                {
			        r += " пин " + n + ":" + t;
			        break;
			    }
			}
			console.log(r);
		}
		for(var t in YList)
		{
			var r = "YList[" + t + "]";
			for(k in YList[t])
			{
				var v = YList[t][k];
				if(k == "Node") for(n in Nodes) if(Nodes[n] === v) v = "Nodes[" + n + "]";
				if(k == "Next") for(y in YList) if(YList[y] === v) v = "YList[" + y + "]";
				r += " " + k + ": " + v; 
			}
			console.log(r);
		}
        for(var t in LU)
        {
            var r = "LU[" + t + "]";
            for(k in LU[t])
            {
                var v = LU[t][k];
                if(k === "Node") for(n in Nodes) if(Nodes[n] === v) v = "Nodes[" + n + "]";
                r += " " + k + ": " + v;
            }
			console.log(r);
        }
		if(Errors.length) for(var e in Errors) console.log(Errors[e]);
		
	}
    function Test()
    {
		// Инициализируем проводимости
		for(var n in Nodes) {Nodes[n].y = 0.0; Nodes[n].I = 0;}
		for(var b in Branches) Branches[b].y = 0.0;
		for(var d in Devices)
        {
            if(Devices[d].AddY) Devices[d].AddY();
            if(Devices[d].AddI) Devices[d].AddI();
        }
        // Проверяем уравнение Y * V = I
        var I = Array(Nodes.length);
        for(var i = Nodes.length; i--;) I[i] = 0.0;
        for(var n in Nodes) I[n] -= Nodes[n].y * Nodes[n].V;
        for(var b in Branches)
        {
            var B = Branches[b];
            var Vp = B.p ? B.p.V : 0.0;
            var Vq = B.q ? B.q.V : 0.0;
            var p = Nodes.indexOf(B.p);
            var q = Nodes.indexOf(B.q);
            var dI = (Vp - Vq) * B.y;
            if(p >= 0)
                I[p] += dI;
            if(q >= 0)
                I[q] -= dI;
        }
        for(var n in Nodes) 
            if(!Nodes[n].T && I[n] != Nodes[n].I) 
                console.log("В узле " + n + " не совпадают задающие токи. Задано " + Nodes[n].I + ", получено " + I[n]);
    };
	this.Solve = function () 
    {
	    Load(Items);
	    PrepareYList();
	    TriangulateYList();

        for(var n in Nodes) Nodes[n].I = 0.0;
        for(var d in Devices) if(Devices[d].AddI) Devices[d].AddI();
        for(var n in Nodes) if(!Nodes[n].T) Nodes[n].V = Nodes[n].I;
        
	    var Node = 0;
	    var iNode = Nodes[Node].Original;
	    // Прямой ход решения
	    for(var ilu in LU) 
        {
	        var lu = LU[ilu];
	        var jNode = lu.Node;
	        if(jNode) jNode.V -= iNode.V * lu.U;
	        else 
            {
                var n = Nodes[++Node];
                iNode = n ? n.Original : null;
            }
	    }
	    // Обратный ход решения
	    for(var ilu = LU.length - 1; ilu >= 0; ilu--) 
        {
	        var lu = LU[ilu];
	        var jNode = lu.Node;
	        if(jNode) iNode.V -= jNode.V * lu.L;
	        else 
            {
	            iNode = Nodes[--Node].Original;
	            iNode.V *= lu.L;
	        }
	    }

	    Dump();
        Test();
	};
	Models.GND = { // Земля
		nodes: {1:{T:2, V:0.0}}
	};
	Models["+5V"] = { // +5В
		nodes: {1:{T:2, V:5.0}}
	};
	Models.R = { // Резистор
		ctor: function(fields, nodes, brs)
		{
			var y = 1.0 / parseFloat(fields[1].t);
			this.AddY = function()
			{
				brs[0].y += y;
			};
		},
		nodes: {1:null, 2:null},
		branches: [{p:1, q: 2}]
	};	
    Models.INDUCTOR = { // Индуктивность
        ctor: function(fields, nodes, brs)
        {
            this.I = 1.0;
            this.dI = 0.0;
            var R = 0;
			var oL = 1.0 / parseFloat(fields[1].t);
			
	        this.AddI = function()
	        { // Ток вытекает из узла 2 в узел 1
	            nodes[1].I += this.I;
	            nodes[2].I -= this.I;
	        };
	        this.f = function()
	        {
	            this.dI = (nodes[2].V - nodes[1].V - this.I * R) * oL;
	        };
        },
		nodes: {1:null, 2:null}, // Два узла, ветвей нет
        intvars: "I"
    };
}

function NetLoader()
{
	var Models = {}; // Математические модели
	var Errors = [];
	function Dump(Devices, Nodes, Branches)
	{
		for(var t in Nodes)
		{
			var r = "Узел " + t;
			var n = Nodes[t];
			for(var f in n)
				r += " " + f + ": " + n[f];
			console.log(r);			
		}
		for(var t in Branches)
		{
			var b = Branches[t];
			var r = "Ветвь";
			if(b.p === null) r += " p:GND";
			else r += " p:" + b.p; 
			if(b.q === null) r += " q:GND";
			else r += " q:" + b.q;
			r += " y = " + b.y;
			console.log(r);
		}
		for(var t in Devices)
		{
			var d = Devices[t];
			var r = "Устройство " + d.i;
			var m = d.m;
			for(var mm in Models) if(Models[mm] == m)
			{
				r += " модель " + mm;
				break;
			}
			for(var n in d.n) 
            {
                var dnn = d.n[n];
                if(dnn === null) r += " пин " + n + ":GND";
                else r += " пин " + n + ":" + dnn;
			}
			console.log(r);
		}
		if(Errors.length) for(var e in Errors) console.log(Errors[e]);
		
	}

	function Load(Items)
	{
		var Devices = [], Nodes = [], Branches = [];
		
		var GND = {T:true, V:0, pins:[]};
		function Add(n, pin) 
		{// Добавляет объект к узлу. Если объект привязан к другому узлу, то сливает узлы в один
			if(pin._enode) Join(n, pin._enode);
			else {pin._enode = n; n.pins.push(pin);}
		};
		function Join(n, node) // сливает два узла в один
		{
	        if(node === n) return;
			if(node.T)
			{
				if(n.T)
				{ 
					if(n.V !== node.V) throw("Замыкание между шинами питания " + n.V + "В и " + node.V + "В");
				}
				else
				{
					Join(node, n);
					return;
				}
			}
			var p = node.pins;
			for(var t in p)
			{
				n.pins.push(p[t]);
				p[t]._enode = n;
			}
			delete node.pins;
		};
		function NodeByV(V, pin) // Ищет узел с заданным напряжением. Если такого нет, создаёт новый 
		{
			if(V === 0.0) {Add(GND, pin); return GND;} // GND
			if(typeof V === "number") for(var t in Nodes)
				if(Nodes[t].T && Nodes[t].V === V) {Add(Nodes[t], pin); return Nodes[t];}
			var n = {V:V, T:true, pins:[pin]};
			Nodes.push(n);
			return pin._enode = n;
		}		
		function Node(pin) // Создаёт новый узел и привязывает к объекту
		{
			this.pins = [];
			if(pin) {pin._enode = this; this.pins.push(pin);};
			this.T = false; // Тип
			this.V = 0.0; // Напряжение (относительно земли)
			Nodes.push(this);
		}
		
		for(var i in Items) if(Items[i].GetInfo)
		{
			var info = Items[i].GetInfo();
			var Model = null, ModelName = "";
			if(info.Def)
			{
				var N = info.Def.N;
				for(var n in N)
                {
                    Model = Models[N[n]]; // Поиск модели по алиасам компонента
					if(Model) {ModelName = N[n]; break;}
                }
			}
			if(!Model) {Errors.push("Не найдена модель для компонента '" + info.Name + "', тип " + info.CmpName); continue;}
			// Нашли модель, создаём устройство
			var pins = info.Pins;
			var mpins = Model.nodes;
			var dev = {i:info.Name, m:ModelName, n:pins, b:null, f:{v:info.Fields[1].t}};
			for(var t in mpins) // Проходим по узлам модели
			{
				var p = pins[t];
				if(!p && t[0] !== '_') Errors.push("Узел " + t + " мат. модели " + ModelName + " не существует.");
				if(mpins[t] && mpins[t].T) // Узел с заданным напряжением
				{
					NodeByV(mpins[t].V, p); // Ищем такой же, если не нашли - добавляем
					continue;
				}			
				new Node(p);			
			}			
			Devices.push(dev);
		}
		else if(Items[i].p1 && Items[i].p2)
		{
            //DumpNodes(GND);
            //console.log("Соединение " + Main.GetId(Items[i].p1) + " - "+ Main.GetId(Items[i].p2));
			// Линия
			var p1 = Items[i].p1;
			var p2 = Items[i].p2;
			if(!p1._enode) new Node(p1);
			Add(p1._enode, p2);
		}
		// Чистим узлы:
		var l = 0;
		for(var t = 0, e = Nodes.length; t < e; t++) if(Nodes[t].pins) 
		{
			Nodes[l++] = Nodes[t];
			delete Nodes[t].pins;
		}
		Nodes.length = l;
		// Чистим устройства, создаём ветви и инициализируем контакты
		var l = 0;
		for(var t = 0, e = Devices.length; t < e; t++)
		{
			var d = Devices[t];
			for(var k in d.n)
			{
				var node = d.n[k]._enode;
				if(node === GND) d.n[k] = null;
				else for(var n in Nodes) if(Nodes[n] === node) {d.n[k] = parseInt(n); break;}
			}
			var dB = [];
			var br = Models[d.m].branches;
			for(var b in br)
			{
				var B = br[b];
				var p = d.n[B.p];
				var q = d.n[B.q];
				if(p === undefined || q === undefined) Errors.push("Ветвь в модели задана не верно");
				var br = {p:p, q:q};
				dB.push(Branches.length);
				Branches.push(br);
			}
			d.b = dB;
			if(Models[d.m].ctor) Devices[l++] = Devices[t];
		}
		Devices.length = l;
		// Чистим экранные элементы
		for(var i in Items) if(Items[i]._enode) Items[i]._enode = null; 
		return {Devices: Devices, Nodes:Nodes, Branches:Branches};
	}
	function StoreModel(Model)
	{
		var r = {ctor :Model.ctor.toString()};
		if(Model.nodes) r.nodes = Model.nodes;
		if(Model.branches) r.branches = Model.branches;
		return r;
	}
	function onMessage(e)
	{
		
		
	}
	this.Run = function()
	{
		var worker;
		try {
			worker = new Worker("engine.js");
		} catch(e) {alert("Не удалось создать объект Worker. " + e.message); return;}
		// Готовим модели:
		var models = {};
		for(var x in Models) if(Models[x].ctor) models[x] = StoreModel(Models[x]);
		// Загружаем схему
		var Sh = Load(Items);
		//Dump(Sh.Devices, Sh.Nodes, Sh.Branches);
		// Загружаем узлы
		var data = {Models:models, Devices:Sh.Devices, Nodes: Sh.Nodes, Branches:Sh.Branches};
		data.cmd = "solve";
		worker.addEventListener('message', onMessage);
		worker.postMessage(data);
	};
	Models.GND = { // Земля
		nodes: {1:{T:2, V:0.0}}
	};
	Models["+5V"] = { // +5В
		nodes: {1:{T:2, V:5.0}}
	};
	Models.R = { // Резистор
		ctor: function(fields, nodes, brs)
		{
			var y = 1.0 / parseFloat(fields.v);
			var br = brs[0];
			this.AddY = function()
			{
				br.y += y;
			};
		},
		nodes: {1:null, 2:null},
		branches: [{p:1, q: 2}]
	};
	Models.Probe = {
			ctor: function(fields, nodes, brs)
			{
				
			},
			nodes: {1:null}
	};
	Models.INDUCTOR = { // Индуктивность
		ctor: function(fields, nodes, brs)
		{
			this.I = 1.0;
	        this.dI = 0.0;
	        var R = 0;
			var oL = 1.0 / parseFloat(fields.v);
			var n1 = nodes[1], n2 = nodes[2];
				
		    this.AddI = function()
		    { // Ток вытекает из узла 2 в узел 1
		        n1.I += this.I;
		        n2.I -= this.I;
		    };
		    this.f = function()
		    {
		        this.dI = (n2.V - n1.V - this.I * R) * oL;
		    };
	    },
		nodes: {1:null, 2:null}, // Два узла, ветвей нет
	    intvars: "I"
	};
}

var Net = new Network();
var Loader = new NetLoader();

CMenu.Add({
    net:{label:"Электроника",
    	run: {label: "Пуск", click: Net.Solve},
		runw: {label: "Пуск Worker", click: Loader.Run}
    		}});

