"use strict";
/*
Система дифференциальных уравнений:

	X(0) = X0;

	X' = <dX> = f(X, t);

	где X - вектор переменных состояния,
		dX - вектор производных переменных состояния,
		f - функция расчёта производных X по времени,
		t - время, с.

Принцип работы явных методов интегрирования:

	X(t + h) = Метод(X(t), X(t - h) .., f)

	где h - шаг времени.

Система уравнений узловых потенциалов:

	Y * V = I

	где Y - матрица проводимостей,
		V - вектор напряжений в узлах. Некоторые элементы V заданы постоянными, остальные неизвестны. 
			Некоторые не могут быть вычислены.
		I - вектор задающих (втекающих) токов в узлах 

Функция расчёта производных f(X, t):

	Дано: X, t, Vc(некоторые напряжения заданы жёстко)
	0. 							(при необходимости сформировать матрицу проводимостей Y, используя методы putY)
	1. X => I, Vc               (используются методы устройств addI())
	2. V = Y^(-1) * I			(решение системы уравнений узловых потенциалов) 
	3. X, V, t => dX			(используются методы устройств f())
	
Функция съёма данных для визуализации get(X, t):

	Шаги до 3 совпадают с f(X, t). Функция get должна вызываться сразу после запуска f(X, t), где X и t
	соответствуют текущему состоянию. 

Методы устройств

	addI(X, t): добавить задающие токи (или задать напряжения) в узлы, в соответствии с текущим состоянием устройства
	putY(?): добавить проводимости в ветви
	get(X, t): получить данные устройства, которые будут отправлены визуальному компоненту через onMsg
	onStep(X, t): уведомление устройства о произведённом шаге интегрирования. 
		Устройство может потребовать откатиться и изменить параметры

Могут происходить события, в результате которых матрица проводимостей Y будет изменена
*/
var Models = {};
var Net = null;

function createVec(n)
{
	if(Float64Array) return new Float64Array(n);
	var r = Array(n); 
	while(n--) r[n] = 0.0;
	return r;
}

function Network(Devices, Nodes, Branches)
{
	// Параметры сети
	var UseFastTriangulation = false;
	var UseBestDiagonal = false;
	var MinimalNorm = 0.0000001;

	//var Nodes = []; // Узлы
	//var Branches = [];
	//var Models = {}; // Математические модели
	//var Devices = []; // Устройства
	var Errors = [];
	var YList = []; // Матрица проводимости в виде связного списка
    var FreeY = null; // Указатель на свободный элемент в YList
	var LU = []; // Триангулированная матрица cplx L, U; // L = Yij, Yii для V; U = Yji, 0 для I
	 
	//CNode * Node;
	//CYArray * Y;
	// Пересоздадим узлы:
	for(var n in Nodes) Nodes[n] = {
		V:Nodes[n].V,
		I:0,
		T:Nodes[n].T,
		bc:0,
		YList:null,
		Original:null, 
		Sorted: null
	};
	var GND = {V:0, T:true, y:0, I:0}; 
	// Пересоздадим ветви:
	for(var n in Branches)
	{
		var b = Branches[n];
		Branches[n] = {
			p: (b.p !== null) ? Nodes[b.p] : null,
			q: (b.q !== null) ? Nodes[b.q] : null,
			y: b.y ? b.y : 0.0
		};
	}
	// Создадим вектор переменных состояния в начальный момент
	var xc = 0;
	for(var n in Devices) if(Models[Devices[n].m].sc) xc += Models[Devices[n].m].sc;
	this.X0 = createVec(xc);
	// Пересоздадим устройства:
	xc = 0;
	var dev_f = []; // Устройства с методом f
	var dev_I = []; // Устройства с методом addI
	var dev_s = []; // Устройства с методом onStep
	for(var n in Devices)
	{
		var d = Devices[n];
		var nodes = {};
		for(var t in d.n)
			nodes[t] = (d.n[t] === null) ? GND : Nodes[d.n[t]];
		var brs = [];
		for(var t in d.b)
			brs[t] = Branches[d.b[t]];
		var m = Models[d.m];
		var nd = new m.ctor(d.f, nodes, brs, this.X0, xc);
		if(m.sc) xc += m.sc;
		nd.i = d.i;
		if(nd.f) dev_f.push(nd);
		if(nd.addI) dev_I.push(nd);
		if(nd.onStep) dev_s.push(nd);
		Devices[n] = nd; 
	}
	
	var Y = null;

	//! Метод формирования матрицы проводимостей Y в виде связного списка Y
	function PrepareYList()
	{
		// Инициализируем проводимости
		//for(var b in Branches) Branches[b].y = 0.0;
		for(var d in Devices) if(Devices[d].putY) Devices[d].putY();
		
		Y = null;
		var Size = Nodes.length + Branches.length * 2;
		YList = Array(Size + 1);
		var y = 0;
		for(var n in Nodes) if(!Nodes[n].T) // Заполняем Y из узлов
		{
			var N = Nodes[n];
			N.YList = YList[y++] = {Node: N, y: 0.0, Next: null};
			N.bc = 0;
			N.Mark = 0;
		}
		else
			Nodes[n].YList = null;
		
		//UsualNodeCount = (int)(y - YList) - 1;
		
		//! Метод создания проводимости между узлами
		function AddBranch(N, AdjacentNode)
		{
			var Last = N.YList;
			if(AdjacentNode === null) return n; // ???
			for(var List = Last; List; List = List.Next)
			{
				if(List.Node === AdjacentNode) return List;
				Last = List;
			}
			N.bc++;		
			var d = {Next: null, Node: AdjacentNode, y: 0, Sources: 0};
			Last.Next = d;
			YList[y++] = d;
			return d;
		}

		for(var B in Branches)  // Заполняем Y из ветвей
		{
			var b = Branches[B], p = b.p, q = b.q;
			/*if(typeof b.E === "number") // ЭДС, необходимо объединить списки
			{
				var ql = q.YList;
				p.YList.y += ql.y;
				q.YList = p.YList;
				
				
				
			}*/
			
            if(!b.y) continue;
			if(p && p.YList)
			{
				AddBranch(p, q).y -= b.y;
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
		
		for(var B in Branches)  // Обработка заданных разностей потенциалов
		{
			
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
		LU.length = 0;
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
			if(!OptimalNode)
			{
				//ATLTRACE("\nНе найден узел с надёжной диагональю. Осталось исключить %d. Текущий: %d", (CNode *)(&Base->SData) - (CNode *)Node, Node->Original - Nodes);
				/*Base = (CNode *)((char *)Node - ((char *)&Nodes->SData - (char *)Nodes));
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
							if(jNode.Type == "MISSED")
							{
								iNode.Type = "MISSED";
								iNode.pY = null;
							}
						}
						else 
						{
							(*(CNode * *)&Node)--;
							iNode = Node->Original;
						}
					}
				}*/
				break;
				/*ATLTRACE("\nНе найден узел с надёжной диагональю. Осталось исключить %d. Текущий: %d", (CNode *)(&Base->SData) - (CNode *)Node, Node->Original - Nodes);
				DeleteList(YList);
				YList = 0;
				LU.Reset();
				pLU.Reset();
				return false;*/
			}
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
				if(k == "Next") for(n in YList) if(YList[n] === v) v = "YList[" + n + "]";
				r += " " + k + ": " + v; 
			}
			console.log(r);
		}
        for(var t in LU)
        {
            var r = "LU[" + t + "]";
            for(var k in LU[t])
            {
                var v = LU[t][k];
                if(k === "Node") for(n in Nodes) if(Nodes[n] === v) v = "Nodes[" + n + "]";
                r += " " + k + ": " + v;
            }
			console.log(r);
        }
		if(Errors.length) for(var e in Errors) console.log(Errors[e]);
		
	}
    function Test(X, t)
    {
		// Инициализируем проводимости
		for(var n in Nodes) {Nodes[n].y = 0.0; Nodes[n].I = 0;}
		//for(var b in Branches) Branches[b].y = 0.0;
		for(var d in Devices)
        {
            if(Devices[d].putY) Devices[d].putY();
            if(Devices[d].addI) Devices[d].addI(X, t);
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
            if(!Nodes[n].T && Math.abs(I[n] - Nodes[n].I) > 1E-6) 
                console.log("В узле " + n + " не совпадают задающие токи. Задано " + Nodes[n].I + ", получено " + I[n]);
    };
    this.getResult = function(X, t)
    {
    	var Result = [];
    	for(var d in Devices)
    	{
    		var dev = Devices[d];
    		if(!dev.get) continue;
    		Result[d] = dev.get(X, t);
    	}
    	return Result;
    };
    this.onStep = function(X, t)
    { // Уведомление от метода интегрирования об успешно завершённом шаге
    	for(var d in dev_s) dev_s[d].onStep(X, t);
    };
	this.f = function(dX, X, t) 
    {// Следует получить вектор производных dY из вектора Y и из вектора постоянных напряжений в узлах
	    PrepareYList();
	    TriangulateYList();

        for(var n in Nodes) Nodes[n].I = 0.0;
        for(var d in dev_I) dev_I[d].addI(X, t);
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

	    //Dump();
        Test(X, t);
        for(var d in dev_f) dev_f[d].f(dX, X, t);
	};

}


function Euler(Devices, Net, cb)
{
	var h = 0.00000001;
	var X = Net.X0;
	var dX = createVec(X.length);
	var d = +new Date() + 100; 
	this.Run = function()
	{
		var c = 0;
		for(var t = 0; t < 0.01; t += h)
		{
			Net.f(dX, X, t);
			if(c++ > 100)
			{
				if(+new Date() >= d)
				{
					cb(Net.getResult(X, t));
					d = +new Date() + 100;
				}
				c = 0;
			}
			for(var x in X) X[x] += dX[x] * h;
			Net.onStep(X, t);
		}
	};
}


self.addEventListener("message", function(e)
{
	function toFunc(text, name)
	{
		var x, y, e = text.length;
		for(x = 0; text[x] !== '('; x++){if(x >= e) return null;}
		for(y = x; text[y] !== ')'; y++){if(y >= e) return null;}
		var p = text.substr(x + 1, y - x - 1).split(',');
		return new Function(p[0], p[1], p[2], p[3], p[4], text.substr(y + 1));
	}
	var data = e.data;
	if(data.Models) for(var m in data.Models)
	{
		var model = data.Models[m];
		model.ctor = toFunc(model.ctor, m);
		Models[m] = model;
	}
	if(data.Devices || data.Nodes || data.Branches)
	{
		Net = new Network(data.Devices, data.Nodes, data.Branches);
		
	}
	switch(data.cmd)
	{
	case 'static':
		Net.f(createVec(Net.X0.length), Net.X0, 0);
		self.postMessage(Net.GetResult());
		break;
	case 'start':
		var int = new Euler(data.Devices, Net, self.postMessage);
		int.Run();
		break;
	};

}, false);