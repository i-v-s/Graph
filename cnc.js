"use strict";

function LineArcCross(cx, cy, R, p, v) // Центр дуги x, y; Радиус R; Начало отрезка p; Вектор направления v
{
	var dx = p.x - cx; 
  	var dy = p.y - cy;
  	var Bd = v.x * dx + v.y * dy;
  	var d2 = dx * dx + dy * dy;
  	var t = Bd * Bd - d2 + R * R;
  	if(t < 0) {alert("Корень отрицательного числа!");}
  	var sr = Math.sqrt(t);
  	t = sr + Bd;
  	if(t > 0) t -= 2 * sr;
  	p.x -= v.x * t;
  	p.y -= v.y * t;
  	ctx.fillStyle = "#000000";
  	//ctx.fillRect(p.x, p.y, 1, 1);
  	return p;
}

function ShiftedCross(P, A, B, shift, rea) // Точка P, предыдущий сегмент A, последующий сегмент B, сдвиг shift
{
   	var p = P.pos();
	if(!A)
	{
	    var vB = B.vec(P);
	    p.x += shift * vB.y;
	    p.y -= shift * vB.x;
		return p;
	}
	if(!B)
	{
	    var vA = A.vec(P);
	    p.x -= shift * vA.y;
	    p.y += shift * vA.x;
		return p;
	}
   	var vA = A.vec(P);
    var vB = B.vec(P);
   	var m = (vA.x * vB.y - vA.y * vB.x);// * shift;
   	var t = (m >= -0.00000001);
	if(shift < 0) t = !t;
   	if(t || !rea)
   	{ // Поиск пересечения
		if(B instanceof Line)
		{
			if(A instanceof Line)
	    	{
			    var k = (1 + vA.x * vB.x + vA.y * vB.y) / m;
			    p.x += shift * (vB.x * k + vB.y);
			    p.y += shift * (vB.y * k - vB.x);
			    return p;
  			}
  			else
  			{
  				var R = (A.p2 === P) ? A.R + shift : A.R - shift;
  				p.x += shift * vB.y;
  				p.y -= shift * vB.x; // Конечная точка отрезка
  				return LineArcCross(A.cx, A.cy, R, p, vB);
  			}
    	} 
    	else
    	{
			var Rb = (B.p1 === P) ? B.R + shift : B.R - shift;
    		if(A instanceof Line)
    		{   			
  				p.x -= shift * vA.y;
  				p.y += shift * vA.x; // Конечная точка отрезка
  				return LineArcCross(B.cx, B.cy, Rb, p, vA);
    		}
    		else
    		{
  				p.x -= shift * vA.y;
  				p.y += shift * vA.x; // Конечная точка отрезка
  				return LineArcCross(B.cx, B.cy, Rb, p, vA);  			
    		}
		}
    }
    else
    { // Расчёт колена
    	if(shift < 0)
    	{
    		p.a1 = Math.atan2(-vA.x, vA.y);
    		p.a2 = Math.atan2(vB.x, -vB.y);
    	}
    	else
    	{
    		p.a1 = Math.atan2(vA.x, -vA.y); // p.a1 = (A instanceof Arc) ? (P === A.p1 ? A.a1 : A.a2) : Math.atan2(vA.x, -vA.y);
    		p.a2 = Math.atan2(-vB.x, vB.y); // p.a2 = (B instanceof Arc) ? (P === B.p1 ? B.a1 : B.a2) : Math.atan2(-vB.x, vB.y);
    	}
    	p.vB = vB;
    	return p;
    }
}

function GPath()
{
	this.s = null; // 
	this._p = null; // Массив точек пути {G, p}
	this.SP = {x:0, y:0};
	this.rea = true; // Округлять внешние углы?
	this.draw = function(Type)
	{
        ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";//this._sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        var shift = this.sh;
        if(!shift) shift = CGPath.shift;
        ctx.lineWidth = 2 * Math.abs(shift);
        if(this.inv) shift = -shift;
        ctx.beginPath();
        var sl = this.s.length - 1;

        var P = this.s[0].p; // Текущая точка
        var closed = (P === this.s[sl].p); // Контур замкнут?

        var A = closed ? this.s[sl].g : null; // Сегмент до точки
        var B = this.s[1].g; // Сегмент после точки

        var p1 = ShiftedCross(P, A, B, shift, this.rea);
        var p0 = p1;
        for(var x = 1; x <= sl; x++)
        {
        	P = this.s[x].p;
        	A = B;
        	if(x < sl)
        		B = this.s[x + 1].g;
        	else B = closed ? this.s[1].g : null;
        	var p2 = ShiftedCross(P, A, B, shift, this.rea);
        	// Рисуем сегмент:
        	if(A instanceof Arc)
        	{
        		if(A.p2 === P)
        		{
        			var a1 = A.a1, a2 = A.a2;
        			if(p1.a1 === undefined) a1 = Math.atan2(p1.y - A.cy, p1.x - A.cx);
        			if(p2.a1 === undefined) a2 = Math.atan2(p2.y - A.cy, p2.x - A.cx);
        			ctx.arc(A.cx, A.cy, A.R + shift, a1, a2);
        		} else {
        			var a1 = A.a2, a2 = A.a1;
        			if(p1.a1 === undefined) a1 = Math.atan2(p1.y - A.cy, p1.x - A.cx);
        			if(p2.a1 === undefined) a2 = Math.atan2(p2.y - A.cy, p2.x - A.cx);
        			ctx.arc(A.cx, A.cy, A.R - shift, a1, a2, true);
        		}
        	}
        	else 
        	{
        		if(x == 1)
        		{
        		 	if(p1.vB) {p1.x += shift * p1.vB.y; p1.y -= shift * p1.vB.x;}
        			ctx.moveTo(p1.x, p1.y);
        		}
        		if(p2.a1 === undefined) ctx.lineTo(p2.x, p2.y);
        	}
        	// Рисуем колено:
        	if(p2.a1 !== undefined)
        		ctx.arc(p2.x, p2.y, Math.abs(shift), p2.a1, p2.a2, shift < 0);
        	p1 = p2;
        }
        if(Type === "GCode") return;
        ctx.stroke();
        // Рисуем указатель начала
        shift = this.sh;
        if(!shift) shift = CGPath.shift;
        var p = p0;//this.s[0].p.pos();
        var v = this.s[1].g.vec(this.s[0].p);
		if(this._sel) ctx.fillStyle = "rgba(255, 80, 80, 0.8)";
		else ctx.fillStyle = Type ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.5)";//this._sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x - shift * v.y, p.y + shift * v.x);
        //p.x += this.sh * v.y; 
        //p.y -= this.sh * v.x;
        this.SP.x = p.x + 2 * shift * v.x;
        this.SP.y = p.y + 2 * shift * v.y;
        ctx.lineTo(p.x + 2 * shift * v.x, p.y + 2 * shift * v.y);
        p.x += shift * v.y; 
        p.y -= shift * v.x;
        ctx.lineTo(p.x, p.y);       
        ctx.fill();
	};
	this.Hit = function(x, y)
	{
		if(Math.abs(x - this.SP.x) < Main.adm && Math.abs(y - this.SP.y) < Main.adm) return this;
		return null;
	};
    this.OnLoad = function() 
    {
    	for(var x = this.s.length; x--; )
    	{
    		var s = this.s[x];
    		s.g = Main.ById(s.g);
    		s.p = Main.ById(s.p);    		
    	}
    	return true;
    },
	this.ToGCode = function(dx, dy, z, safez, prec) // dx, dy: смещение, z - рабочая высота, safez - вертикальный заход
	{
		var old_ctx = ctx;
		var R = [];
		var LastX = null;
		var LastY = null;
		var feed = this.feed ? this.feed : CGPath.feed;
		try
		{
			ctx = 
			{
				beginPath: function(){},
				moveTo: function(x, y) // Выход на начало работы
				{
					if(typeof safez === "number") 
					{
						R.push("G0 X" + (x + dx).toFixed(prec) + " Y" + (dy - y).toFixed(prec) + " Z" + safez.toFixed(prec));
						R.push("G1 Z" + z + " F" + feed);
					}
					else
					{
						R.push("G1 X" + (x + dx).toFixed(prec) + " Y" + (dy - y).toFixed(prec) + " Z" + z.toFixed(prec) + " F" + feed);
					}
				},
				lineTo: function(x, y)
				{
					var X = (x + dx).toFixed(prec);
					var Y = (dy - y).toFixed(prec);
					if(LastX !== X || LastY !== Y) R.push("G1 X" + X + " Y" + Y);
					LastX = X;
					LastY = Y;
				},
				arc: function(x, y, Rd, a1, a2, rev)
				{
					var r = rev ? "G3" : "G2";
					var I = -Rd * Math.cos(a1);
					var J = Rd * Math.sin(a1);
					var X = (dx + x - I).toFixed(prec);
					var Y = (dy - y - J).toFixed(prec);
					if(LastX !== X || LastY !== Y) R.push("G1 X" + X + " Y" + Y);
					X = (dx + x + Rd * Math.cos(a2)).toFixed(prec);
					Y = (dy - y - Rd * Math.sin(a2)).toFixed(prec);
					R.push(r + " X" + X + " Y" + Y + " I" + I.toFixed(prec) + " J" + J.toFixed(prec));
					LastX = X;
					LastY = Y;
				}
			};
			this.draw("GCode");
		} catch(e)
		{
			ctx = old_ctx;
			alert("Ошибка вывода G-Code: " + e.message);
			return null;
		}

		ctx = old_ctx;
        return R.join("\n");
	};
	this.Reverse = function()
	{
		this.s.reverse();
		for(var x = this.s.length; --x;)
		{
			this.s[x].g = this.s[x - 1].g;
		}
		this.s[0].g = null;
		this.inv = !this.inv;
	};
};


var CGPath = 
{
	sizeX:324,
	sizeY:224,
	safeZ:-29,
	stepZ:1,
	topZ:-30,
	depthZ:5,
	shift:2.5,
	feed:100,
	showArea:false,
    ParamDlg:
	{
		title:"Параметры ЧПУ",
		update:Main.Redraw,
		data:
		{
			sizeX:"Длина рабочей области",
			sizeY:"Ширина рабочей области",
			safeZ:"Безопасная высота",
			topZ:"Высота поверхности заготовки",
			depthZ:"Толщина заготовки",
			stepZ:"Шаг по высоте",
			shift:"Радиус инструмента",
			feed:"Подача, мм/мин"
		}
	},
	Scan:function(s, r)
	{
		var l = r.length - 1;
		do
		{ 
			var w = false;
			for(var x = 0, e = s.length; x < e; x++)  if(s[x]) for(var y in r)
			{
				var ss = s[x];
				var rr = r[y];
				if(y != 0 && y != l && (ss.p1 === rr.p || ss.p2 === rr.p)) return "Найдено ветвление пути";
				if(ss.p1 === rr.p) 
				{
					if(y == l) r.push({p: ss.p2, g: ss}); // Добавить в конец
					else {r[0].g = ss; r.unshift({p: ss.p2, g: null});} // Добавить в начало
				}
				else if(ss.p2 === rr.p)
				{
					if(y == l) r.push({p: ss.p1, g: ss});
					else {r[0].g = ss; r.unshift({p: ss.p1, g: null});}
				} else continue; // ничего не совпало
				l++;
				s[x] = undefined;
				w = true;
				break;
			}
		} while(w);
		return null;
	},
	OnCreate: function()
	{
		var s = [];
		for(var x in Items)
			if(Items[x]._sel && (Items[x] instanceof Line || Items[x] instanceof Arc) && Items[x].p1 !== Items[x].p2) s.push(Items[x]);
		if(s.length == 0) {alert("Не выделено ни одной линии или дуги."); return;};


		var t = s.shift();
		var e, x, l;
		do 
		{
			var r = [{p: t.p1, g: null}, {p: t.p2, g: t}];
			if(e = CGPath.Scan(s, r)) { alert(e); return;}
			var p = new GPath();
			p.s = r;
			Items.push(p);
			for(x = 0, l = s.length; x < l; x++) if(t = s[x]) { s[x] = undefined; break;}
		} while(x < l);
		Main.Redraw();
	},
	GetGCode:function()
	{
		var safeZ = CGPath.safeZ;
		var topZ = CGPath.topZ;
		var stepZ = Math.abs(CGPath.stepZ);
		var depthZ = CGPath.depthZ;
		//if(safeZ > topZ) stepZ = -stepZ;
		var R = [];
		for(var x in Items)
		{
			var item = Items[x];
			if(item.ToGCode) for(var dz = 0; dz <= depthZ; dz += stepZ)
			{
				var z = (safeZ > topZ) ? topZ - dz : topZ + dz;
        		var closed = (item.s[0].p === item.s[item.s.length - 1].p);
				var r = Items[x].ToGCode(0, CGPath.sizeY, z, (closed && dz) ? null : safeZ, 3);
				if(r === null) return;
				R.push(r);
				if(!closed || dz + stepZ > depthZ) R.push("G0 Z" + safeZ.toFixed(3));
			}
		} 
		R.push("M2");
		R.push("%");
		document.getElementById("goutarea").value = R.join("\n");
		showModal("goutdialog");
	},
	Inverse: function()
	{
		for(var x in Items) if(Items[x]._sel && Items[x] instanceof GPath) Items[x].inv = !Items[x].inv;
		Main.Redraw();
	},
	chRound: function()
	{
		for(var x in Items) if(Items[x]._sel && Items[x] instanceof GPath) Items[x].rea = !Items[x].rea;
		Main.Redraw();
	},
	Reverse: function()
	{
		for(var x in Items) if(Items[x]._sel && Items[x] instanceof GPath) Items[x].Reverse();
		Main.Redraw();
	},
	MainClear: null,
	OnInit:function()
    {
    	Main.Ctors["GPath"] = GPath;
    	CGPath.MainClear = Main.Clear;
    	Main.Clear = function()
    	{
    		CGPath.MainClear();
    		if(CGPath.showArea)
    		{
    			ctx.strokeStyle = "#408040";
    			ctx.lineWidth = 1.0;    		
    			ctx.strokeRect(0, 0, CGPath.sizeX, CGPath.sizeY);
    		}
    	};
    	CMenu.Add({
    		create:{
    			gpath: {label: "Путь ЧПУ", click: this.OnCreate}
    		},
    		cnc:{label: "ЧПУ",
    			_p: {label: "Параметры", click: function(){Dialogs.Create(CGPath.ParamDlg, CGPath);}},
    			out: {label: "Вывести GCode", click: this.GetGCode},
    			_1: {label: "Сменить направление", click: this.Reverse},
    			_2: {label: "Сменить смещение", click: this.Inverse},
    			_3: {label: "Сменить скругление", click: this.chRound}
    		}

    	});
    }
};

Main.Modules.push(CGPath);