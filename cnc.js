function GPath()
{
	this.s = null; // 
	this._p = null; // Массив точек пути {G, p}
	this.sh = 5;
	this.Draw = function(Type)
	{
        ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";//this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        ctx.lineWidth = 4;
        ctx.beginPath();

        var p = this.s[0].p.pos();
        ctx.moveTo(p.x, p.y);
        for(var x in this.s) if(x > 0)
        {
        	p = this.s[x].p.pos();
        	ctx.lineTo(p.x, p.y);
    	}
        ctx.stroke();		
	},
	this.Hit = function(x, y)
	{
		return null;
	}


}


var CGPath = 
{

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
		var e;
		d:do
		{
			var r = [{p: t.p1, g: null}, {p: t.p2, g: t}];
			if(e = CGPath.Scan(s, r)) { alert(e); return;}
			var p = new GPath();
			p.s = r;
			Items.push(p);
			for(var x in s) if(s[x]) continue d;
		} while(false);
		Main.Redraw();
	},
	menu: [{
        path: "createmenu",
        label: "Путь ЧПУ",
        click:null
    }],
    OnInit:function()
    {
    	this.menu[0].click = this.Create;
    }
}

Main.Modules.push(CGPath);