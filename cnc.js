function GPath()
{
	this.s = null; // 
	this._p = null; // Массив точек пути {G, p}
	this.sh = 7;
	this.Draw = function(Type)
	{
        ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";//this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        ctx.lineWidth = 4;
        ctx.beginPath();
        var sl = this.s.length - 1;
        var p = this.s[0].p.pos();
        var v = this.s[1].g.vec(this.s[0].p);
        p.x += v.y * this.sh;
        p.y -= v.x * this.sh;
        ctx.moveTo(p.x, p.y);
        for(var x = 0; x <= sl; x++) if(x > 0)
        {       	
        	var pt =  this.s[x].p;
        	var va = this.s[x].g.vec(pt), vb, m;
        	if(x < sl)
        	{
        		vb = this.s[x + 1].g.vec(pt);
        		m = va.x * vb.y - va.y * vb.x;


        	}

        	p = pt.pos();
        	var a1 = Math.atan2(va.x, -va.y);
	        var ax = p.x - va.y * this.sh;
    	    var ay = p.y + va.x * this.sh;
        	ctx.lineTo(ax, ay);

        	if(x < sl) // Строим "колено"
        	{
        		var bx = p.x + vb.y * this.sh;
		        var by = p.y - vb.x * this.sh;
		        var a2 = Math.atan2(-vb.x, vb.y);
		        if(m < 0) ctx.arc(p.x, p.y, this.sh, a1, a2);
		        else ctx.moveTo(bx, by);
        	}
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
			for(var x in s)  if(s[x]) for(var y in r)
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
	Create: function()
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
	menu: [
	{
        path: "createmenu",
        label: "Путь ЧПУ",
        click:null
    },
    {
    	path: "cncmenu",
    	label: "Вывести GCode",
    	click:null
    }],
    OnInit:function()
    {
    	this.menu[0].click = this.Create;
    	this.menu[1].click = this.GetGCode;
    }
}

Main.Modules.push(CGPath);