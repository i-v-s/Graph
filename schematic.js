"use strict";
// Символы электронных элементов

var schematic = new function()
{
	this.models = {};
	/////////////// Описание детали //////////////////////////
	this.PartDef = function PartDef(name) 
	{
		this.pins = {}; // Описания контактов
		this.br = {l:0, r:0, t:0, b:0}; // Ограничивающий прямоугольник
		this.names = [name]; // Наименования детали
	};
	this.PartDef.prototype = // Методы всех деталей
	{
		//ctor:"Part",
		toJSON: function()
		{
			var r = {_:this.M ? "Part_" + this.names[0] : "PartDef"};
			for(var x in this) if(this.hasOwnProperty(x))
			{
				if(typeof this[x] === "function") r[x] = this[x].toString();
				else r[x] = this[x];
			}
			return r;
		},
		onLoad: function()
		{
			if(this.M)
			{
				if(this.name) this.name._o = this;
				if(this.foot) this.foot._o = this;
				if(this.val) this.val._o = this;
				return;
			}
			function Part()
			{
				this.x = 0; 
				this.y = 0;
				this.M = [1, 0, 0, 1];
				if(this.defName) 
				{
					this.name = new Field(this, this.defName);
					this.name.t += "?";
				}
				if(this.defVal) this.val = new Field(this, this.defVal);
				if(this.defFoot) this.foot = new Field(this, this.defFoot);
				var p = {}; 
				for(var x in this.pins) p[x] = new Pin(this, this.pins[x]);
				this._p = p; 			
			};
			for(var x in this)
				if(typeof this[x] === "string" && this[x].substr(0, 8) === "function")
					this[x] = eval("(" + this[x] + ")");
			Part.prototype = this;
			Main.Ctors["Part_" + this.names[0]] = Part; 
		},
		moveBy: function(dx, dy) { if(!this._mov) {this.x += dx; this.y += dy; this._mov = true;}},
		draw: function(Type)
		{
			var color = (Type > 0 || this._sel) ? "#F00000" : "#800000";
			var M = this.M;
			ctx.fillStyle = color;
			ctx.strokeStyle = color;
			if(this.D)
			{
				ctx.transform(M[0], M[1], M[2], M[3], this.x, this.y);
				this.D();
				ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
			}
			if(this.name) this.name.draw(0);
			if(this.val) this.val.draw(0);
			if(this.foot) this.foot.draw(0);
			for(var t in this.fields) this.fields[t].draw(0);
			var pins = this._p;
			for(var x in pins) if(MouseObject !== pins[x]) pins[x].draw(0);
		},
	    GetPSel: function() {return this._sel;},
		Hit: function(X, Y)
		{
			var M = this.M;
			var pins = this.pins;
			X -= this.x; Y -= this.y;
			for(var t in pins)
			{
				var p = pins[t];
				var x = M[0] * p.x + M[1] * p.y - X;
				var y = M[3] * p.y - M[2] * p.x - Y;
				if(Math.abs(x) < Main.adm && Math.abs(y) < Main.adm) return this._p[t];
			}
    		var d = M[0] * M[3] - M[1] * M[2];
    		var A = X * d * M[3] + Y * -d * M[1];
    		var B = X * -d * M[2] + Y * d * M[0];
    		var br = this.br;
    		if(A > br.l && A < br.r && B > br.t && B < br.b) return this;
			return null;
		},
		RHit: function(l, t, r, b)
		{
			var br = this.br;
			if(!br) return false;
			var x = this.x, y = this.y, M = this.M;
			var a = br.l * M[0] + br.t * M[1] + x;
			if(a < l || a > r) return false; 
			a = br.r * M[0] + br.b * M[1] + x;
			if(a < l || a > r) return false; 

			var a = y - (br.l * M[2] + br.t * M[3]);
			if(a < t || a > b) return false; 
			a = y - (br.r * M[2] + br.b * M[3]);
			if(a < t || a > b) return false; 
			return true;
		},
		partInfo: function()
		{
			return {
				name:this.name.t,
				val:this.val.t
			};
		},
		onMsg: function(msg)
		{
			if(msg.val) this.val.t = msg.val;
		},
		child: function(c) {return this._p[c];}
	};
	Main.Ctors["PartDef"] = this.PartDef;
	//////////// Контакт ///////////////////////////////
	function Pin(o, p) 
	{
		this.o = o;
		this.p = p;
	};
	(this.Pin = Pin).prototype = // Методы всех контактов
	{
		pos:function()
		{
			var x = this.p.x, y = this.p.y, M = this.o.M;
			return {x: this.o.x + M[0] * x + M[1] * y, y: this.o.y + M[3] * y + M[2] * x};
		},
		moveBy:function(x, y){this.o.moveBy(x, y);},
        GetId:function()
        { 
        	var p = this.o._p, i = "?";
        	for(var x in p) if(p[x] === this) {i = x; break;}
        	return '' + Items.indexOf(this.o) + '.' + i;
        },
        draw: function(Type)
        {
        	ctx.fillStyle = this._sel ? "#FF0000" :(Type > 0 ? "#808080": Main.Color);
            if(Type > 0 || this._sel || !this._der || this._der.length === 0 || this._der.length > 2)
            {
                ctx.lineWidth = 1;
                ctx.beginPath();
                var p = this.pos();
                ctx.arc(p.x, p.y, 1, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        }
	};
	///////////////// Поле /////////////////////////////
	function Field(o, value)
	{
		if(typeof value === "string") this.t = text;
		else for(var x in value) this[x] = value[x];
		this._o = o;
	}
	(this.Field = Field).prototype =
	{
		ctor:"Field",
		ta:{C:"center", L:"left", R:"right"},
		draw: function(Type)
		{
			if(!this.t || this.h) return;
			ctx.font = this.s.toString() + "px monospace";
			ctx.textBaseline = "middle";// top, bottom
		
			ctx.textAlign = this.ta[this.hp];
			var x = this.x, y = this.y, M = this._o.M;
			var fx = this._o.x + x * M[0] + y * M[1];
			var fy = this._o.y - x * M[2] - y * M[3];
			if(this.v ^ (M[0] === 0.0)) 
			{
				//ctx.rotate(-Math.PI * 0.5);
				ctx.transform(0, -1.0, 1.0, 0, fx, fy);
				ctx.fillText(this.t, 0, 0);
				ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
			}
			else ctx.fillText(this.t, fx, fy);			
		}
	};
	Main.Ctors["Field"] = this.Field;
	
	////////////// Создание экземпляров детали /////////////////////
	if(!workspace.partLib)
	{
		var w = workspace;
		workspace = {partLib:{}};
		for(var x in w) workspace[x] = w[x];
	}
	var lib = workspace.partLib;
	//var ctors = {};
	
	this.addToLib = function(name, obj)
	{
		function Part()
		{
			this.x = 0; 
			this.y = 0;
			this.M = [1, 0, 0, 1];
			if(this.defName) 
			{
				this.name = new Field(this, this.defName);
				this.name.t += "?";
			}
			if(this.defVal) this.val = new Field(this, this.defVal);
			if(this.defFoot) this.foot = new Field(this, this.defFoot);
			var p = {}; 
			for(var x in this.pins) p[x] = new Pin(this, this.pins[x]);
			this._p = p; 			
		};
		Part.prototype = obj;
		lib[name] = obj;
		Main.Ctors["Part_" + name] = Part;
		var menu = {label:"Компонент"};
		menu[name] = {label:name, click: this.onCreate};
		CMenu.Add({create:{kicad:menu}});
	};
	
	this.onCreate = function(e)
	{
		var m = Main.Ctors["Part_" + e.target.innerText];
		Items.push(new m());		
	};
}();

(function ()
{
	var LED = new schematic.PartDef("LED");
	LED.br = {l:-2.5, r: 6.25, t: -2.5, b: 4}; // bounding rect
	LED.pins = {1:{x:-10, y: 0}, 2:{x: 10, y: 0}}; // pins
	schematic.models.LED = {
		ctor: function(fields, nodes, brs)
		{
			var y = 1.0 / 30.0;
			var br = brs[0];
			var n1 = nodes[1], n2 = nodes[2];
			this.putY = function()
			{
				br.y = y;
			};
			this.get = function()
			{
				return {I:(n1.V - n2.V) * y};
			};
		},
		nodes: {1:null, 2:null},
		branches: [{p:1, q: 2}]
	};
	LED.onMsg = function(msg)
	{
		var I = msg.I;
		if(I < 0.001) I = 0.0;
		if(I > 0.100) I = 0.1;
		this.I = (I * 10);
	};

	LED.D = function() 
	{
		if(this.I)
		{
			var fs = ctx.fillStyle; 
			ctx.fillStyle = "rgba(240, 136, 05, " + this.I + ")";
			ctx.beginPath();
			ctx.arc(0, 0, 8, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.fillStyle = fs; 
		}
		ctx.beginPath(); ctx.lineWidth = 0.5;
		ctx.moveTo(2.5,-2.5);
		ctx.lineTo(2.5,2.5);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(-2.5,-2.5);
		ctx.lineTo(2.5,0);
		ctx.lineTo(-2.5,2.5);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(3.25,2);
		ctx.lineTo(5.5,4);
		ctx.lineTo(5.25,2.75);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(4,1.25);
		ctx.lineTo(6.25,3.25);
		ctx.lineTo(6,2);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(-10,0);
		ctx.lineTo(-2.5,0);
		ctx.stroke();
		ctx.textBaseline = 'bottom';
		ctx.fillText('1',-6.25,0);
		ctx.beginPath();
		ctx.moveTo(10,0);
		ctx.lineTo(2.5,0);
		ctx.stroke();
		ctx.fillText('2',6.25,0);
	};
	schematic.addToLib("LED", LED);


})();