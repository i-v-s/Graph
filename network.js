"use strict";

function NetLoader()
{
	var Models = schematic.models; // Математические модели
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
			if(typeof b.y === "number") r += " y = " + b.y;
			if(typeof b.V === "number") r += " V = " + b.V;
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
	}

	function Load(Items)
	{
		var Devices = [], Nodes = [], Branches = [], DevMap = [];
		
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
		for(var i in Items) if(Items[i].partInfo)
		{
			var item = Items[i];
			var info = item.partInfo();
			var Model = item.model, ModelName = "";
			if(!Model) for(var n in item.names)
            {
                Model = Models[item.names[n]]; // Поиск модели по алиасам компонента
                if(Model) {ModelName = item.names[n]; break;}
            }
			if(!Model) {Errors.push("Не найдена модель для компонента '" + info.name + "', тип " + item.names[0]); continue;}
			// Нашли модель, создаём устройство
			var pins = item._p;
			var mpins = Model.nodes;
			var dev = {i:info.name, m:ModelName, n:[], b:null, f:{v:info.val}};
			for(var t in mpins) // Проходим по узлам модели
			{
				var p = pins[t];
				dev.n[t] = p;
				if(!p && t[0] !== '_') Errors.push("Узел " + t + " мат. модели " + ModelName + " не существует.");
				if(mpins[t] && mpins[t].T) // Узел с заданным напряжением
				{
					NodeByV(mpins[t].V, p); // Ищем такой же, если не нашли - добавляем
					continue;
				}			
				new Node(p);			
			}			
			Devices.push(dev);
			DevMap.push(Items[i]);
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
		for(var t = 0, e = Nodes.length; t < e; t++) if(Nodes[t].pins) Nodes[l++] = Nodes[t];
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
			if(Models[d.m].ctor) 
			{
				Devices[l] = Devices[t];
				DevMap[l++] = DevMap[t];
			}
		}
		Devices.length = l;
		DevMap.length = l;
		// Снова чистим узлы
		for(var t in Nodes)
		{
			var p = Nodes[t].pins;
			for(var x in p) p[x]._enode = undefined;
			delete Nodes[t].pins;
		}
		for(var x in GND.pins) GND.pins[x]._enode = undefined;
		return {Devices: Devices, Nodes:Nodes, Branches:Branches, DevMap:DevMap};
	}
	function StoreModel(Model)
	{
		var r = {};
		for(var t in Model) r[t] = Model[t];  
		if(r.ctor) r.ctor = r.ctor.toString();
		return r;
	}
	var DevMap;
	function onMessage(e)
	{
		for(var x in e.data)
			DevMap[x].onMsg(e.data[x]);
		Main.Redraw();
	}
	var worker = null;
	this.run = function()
	{
		if(worker) worker.terminate();
		worker = null;
		try {
			worker = new Worker("engine.js");
		} catch(e) {alert("Не удалось создать объект Worker. " + e.message); return;}
		// Готовим модели:
		var models = {};
		for(var x in Models) if(Models[x].ctor) models[x] = StoreModel(Models[x]);
		// Загружаем схему
		var Sh = Load(Items);
		DevMap = Sh.DevMap;
		if(Errors.length) for(var e in Errors) console.log(Errors[e]);
		Dump(Sh.Devices, Sh.Nodes, Sh.Branches);
		// Загружаем узлы
		var data = {Models:models, Devices:Sh.Devices, Nodes: Sh.Nodes, Branches:Sh.Branches};
		data.cmd = "start";
		worker.addEventListener('message', onMessage);
		worker.postMessage(data);
	};
	this.stop = function()
	{
		if(worker) worker.terminate();	
		worker = null;
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
			brs[0].y = y;
			/*var br = brs[0];
			this.addY = function()
			{
				br.y += y;
			};*/
		},
		nodes: {1:null, 2:null},
		branches: [{p:1, q: 2}]
	};
	Models.TST = {
		ctor: function(fields, nodes, brs)
		{
			var n = nodes[1];
			this.get = function()
			{
				return {val:n.V.toPrecision(3) + "В"};
			};
		},
		nodes: {1:null}
	};
	Models.INDUCTOR = { // Индуктивность
		ctor: function(fields, nodes, brs, X0, o)
		{
			X0[o] = 0.0;
	        var R = 0;
			var oL = 1.0 / parseFloat(fields.v);
			var n1 = nodes[1], n2 = nodes[2];
				
		    this.addI = function(X)
		    { // Ток вытекает из узла 2 в узел 1
		        n1.I += X[o];
		        n2.I -= X[o];
		    };
		    this.f = function(dX, X)
		    {
		        dX[o] = (n2.V - n1.V - X[o] * R) * oL;
		    };
	    },
		nodes: {1:null, 2:null}, // Два узла, ветвей нет
	    sc: 1 // число переменных состояния
	};
	Models.C = { // Конденсатор
		ctor: function(fields, nodes, brs, X0, o)
		{
			X0[o] = 0.0;
			var n1 = nodes[1], n2 = nodes[2];
			var oC = 1.0 / parseFloat(fields.v);
			this.f = function(dX, X)
			{
				dX[o] = 0;//I * oC;// Ток???
			};
		},
		nodes: {1:null, 2:null}, // Два узла
		branches: [{p:1, q: 2, V: 0}],		
		sc: 1
	};
}

var Loader = new NetLoader();

CMenu.Add({
    net:{label:"Электроника",
    	//run: {label: "Пуск", click: Net.Solve},
		runw: {label: "Пуск Worker", click: Loader.run},
		stopw: {label: "Завершить Worker", click: Loader.stop}
    		}});

