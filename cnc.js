
function LineArcCross(cx, cy, R, p, v) // Центр дуги x, y; Радиус R; Начало отрезка p; Вектор направления v
{
	var dx = p.x - cx; 
  	var dy = p.y - cy;
  	var Bd = v.x * dx + v.y * dy;
  	var d2 = dx * dx + dy * dy;
  	var t = Math.sqrt(Bd * Bd - d2 + R * R) - Bd;
  	p.x += v.x * t;
  	p.y += v.y * t;
  	return p;
}

function ShiftedCross(P, A, B, shift) // Точка P, предыдущий сегмент A, последующий сегмент B, сдвиг shift
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
   	var m = vA.x * vB.y - vA.y * vB.x;
   	if(m > 0)
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
  				var R = A.R + shift;
  				p.x += shift * vB.y;
  				p.y -= shift * vB.x; // Конечная точка отрезка
  				return LineArcCross(A.cx, A.cy, R, p, vB);
  			}
    	} 
    	else
    	{
    		if(A instanceof Line)
    		{   			
  				var R = B.R + shift;
  				p.x -= shift * vA.y;
  				p.y += shift * vA.x; // Конечная точка отрезка
  				return LineArcCross(B.cx, B.cy, R, p, vA);
    		}
    		else
    		{
  				var R = B.R + shift;
  				p.x -= shift * vA.y;
  				p.y += shift * vA.x; // Конечная точка отрезка
  				return LineArcCross(B.cx, B.cy, R, p, vA);

    			
    		}
		}
    }
    else
    { // Расчёт колена
    	p.a1 = (A instanceof Arc) ? (P === A.p1 ? A.a1 : A.a2) : Math.atan2(vA.x, -vA.y);
    	p.vB = vB;
    	p.a2 = (B instanceof Arc) ? (P === B.p1 ? B.a1 : B.a2) : Math.atan2(-vB.x, vB.y);
    	return p;
    }
}

function GPath()
{
	this.s = null; // 
	this._p = null; // Массив точек пути {G, p}
	this.sh = 7;
	this.Draw = function(Type)
	{
        ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";//this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        var sl = this.s.length - 1;

        var P = this.s[0].p; // Текущая точка
        var closed = (P === this.s[sl].p); // Контур замкнут?

        var A = closed ? this.s[sl].g : null; // Сегмент до точки
        var B = this.s[1].g; // Сегмент после точки

        var p1 = ShiftedCross(P, A, B, this.sh);
        for(var x = 1; x <= sl; x++)
        {
        	P = this.s[x].p;
        	A = B;
        	if(x < sl)
        		B = this.s[x + 1].g;
        	else B = closed ? this.s[1].g : null;
        	var p2 = ShiftedCross(P, A, B, this.sh);
        	// Рисуем сегмент:
        	if(A instanceof Arc)
        	{
        		var a1 = A.a1, a2 = A.a2;
        		if(p1.a1 === undefined) a1 = Math.atan2(p1.y - A.cy, p1.x - A.cx);
        		if(p2.a1 === undefined) a2 = Math.atan2(p2.y - A.cy, p2.x - A.cx);
        		ctx.arc(A.cx, A.cy, A.R + this.sh, a1, a2);
        	}
        	else 
        	{
        		if(x == 1)
        		{
        		 	if(p1.vB) {p1.x += this.sh * p1.vB.y; p1.y -= this.sh * p1.vB.x;}
        			ctx.moveTo(p1.x, p1.y);
        		}
        		if(p2.a1 === undefined) ctx.lineTo(p2.x, p2.y);
        	}
        	// Рисуем колено:
        	if(p2.a1 !== undefined)
        		ctx.arc(p2.x, p2.y, this.sh, p2.a1, p2.a2);
        	p1 = p2;

        }
        ctx.stroke();		
	};
	this.ToGCode = function(dx, dy, z, Gz, Prep)
	{
        var p = this.s[0].p.pos();
        var R = new Array(this.s.length);
        R[0] = Gz + " X" + (p.x + dx) + " Y" + (p.y + dy) + " Z" + z + "\n" + Prep;
        for(var x in this.s) if(x > 0)
        {
        	p = this.s[x].p.pos();
        	if(this.s[x].g instanceof Line)
        		R[x] = "G1 X" + (p.x + dx) + " Y" + (p.y + dy);
        	else
        		R[x] = "(??? X" + (p.x + dx) + " Y" + (p.y + dy) + ")";
        }
        return R.join("\n");
	};
	this.Hit = function(x, y)
	{
		return null;
	}


}


var CGPath = 
{
	dx:0,
	dy:0,
	safeZ:0,
	defZ:0,
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
			if(Items[x].Sel && (Items[x] instanceof Line || Items[x] instanceof Arc) && Items[x].p1 !== Items[x].p2) s.push(Items[x]);
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
		var R = [];
		for(x in Items) if(Items[x].ToGCode)
		{
			R.push(Items[x].ToGCode(CGPath.dx, CGPath.dy, Items[x].z ? Items[x].z : CGPath.defZ, "G1", ""));
			R.push("G0 Z" + CGPath.safeZ);
		} 
		document.getElementById("goutarea").value = R.join("\n");
		showModal("goutdialog");
	},
    OnInit:function()
    {
    	CMenu.Add({
    		create:{
    			gpath: {label: "Путь ЧПУ", click: this.OnCreate}
    		},
    		cnc:{label: "ЧПУ",
    			out: {label: "Вывести GCode", click: this.GetGCode}
    		}

    	});
    }
}

Main.Modules.push(CGPath);