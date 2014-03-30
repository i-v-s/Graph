function Cnn(x, y)
{
    this.x = x;
    this.y = y;
    this._der = [];
    this.Serialize = function() {return this.x.toString() + "," + this.y;};
    this.pos = function() {return {x:this.x, y:this.y};};
    this.Draw = function(Type)
    {
    	ctx.fillStyle = this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000");
        //if(Type > 0 || this.Sel)
        {
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1, 0, 2 * Math.PI, false);
            //ctx.fillStyle = '#000000';
            ctx.fill();
            //ctx.stroke();
         } //else ctx.strokeRect(this.x - 1, this.y - 1, 3, 3);
    };
    this.MoveBy = function(dx, dy)
    {
        if(!this.Moved)
        {
            this.x += dx;
            this.y += dy;
            this.Moved = true;
            if(this.Owner) this.Owner.OnPtMoveBy(this, dx, dy);
        }
    };
    this.Hit = function(x, y)
    {
        var dx = Math.abs(this.x - x);
        var dy = Math.abs(this.y - y);
        if(dx < Main.adm && dy < Main.adm)
        {
            Main.MX = this.x;
            Main.MY = this.y;
            Main.hitPriority = 0;
            return this;
        } else return null;
    };
    this.RHit = function(l, t, r, b)
    {
        return l < this.x && t < this.y && r > this.x && b > this.y;
    };
    this.OnDblClick = function()
    {
        if(Dialogs) Dialogs.Create(
        {
            title:"Свойства",
            update:Main.Redraw,
            data:
            {
                x:"X",
                y:"Y"
            }
        }, this);
    };
    this.GetPSel = function() {return this.Sel;};
    this.Sel = false;
    this.Moved = false;
}


var KiCAD = new function()
{
	var Km = 0.05;
	var defw = 0.5;
	var Lib = {};
	function split(a)
	{
		var r = [];
		var st = null;
		for(var x = 0, l = a.length; x < l; x++)
		{
			if(a[x] == ' ' || a[x] == '\t')
			{
				if(st !== null) {r.push(a.substr(st, x - st)); st = null;}
			}
			else if(a[x] == '"')
			{
				var t = ++x;
				while(a[x] != '"' && x < l) x++;
				r.push(a.substr(t, x - t));
			}
			else if(st === null) st = x;
		}
		if(st !== null) r.push(a.substr(st));
		return r;
	}
	function Component(d)
	{
		var Fields = [];
		var M = null; // Матрица поворота
		var CmpName, Name;
		var x = 0.0, y = 0.0;
		var D = null;
		for(var t in d)
		{
			var l = d[t];
			var f = split(l); //l.split(' ');
			switch(l[0])
			{
			case 'L': 
				CmpName = f[1].toUpperCase();
				if(Lib[CmpName]) D = Lib[CmpName].D;
				Name = f[2]; 
				break;
			case 'F': 
				Fields[parseInt(f[1])] = 
				{
					t: f[2], x: Km * parseInt(f[4]), y: Km * parseInt(f[5]),
					s: Km * parseInt(f[6]), v: f[3] == "V", h:parseInt(f[7]) == 1 
				}; 
				break;
			case '\t': 
				if(f.length == 3)
				{
					x = parseInt(f[1]) * Km;
					y = parseInt(f[2]) * Km;
				}
				else
					M = [parseFloat(f[0]), parseFloat(f[1]), parseFloat(f[2]), parseFloat(f[3])];
				break;
			}
		}
		this.Hit = function() {return null;};
	    this.Draw = function(Type)
	    {
	    	ctx.fillStyle = "#800000";
	    	ctx.strokeStyle = "#800000";
	    	if(D) 
	    	{
	    		ctx.transform(M[0], M[1], M[2], M[3], x, y);
	    		D();
	    		//var d = M[0] * M[3] - M[1] * M[2];
	    		//ctx.transform(d * M[3], -d * M[1], -d * M[2], d * M[0], 0, 0);
	            ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
	    	}
	    	for(var t in Fields)
	    	{
	    		var f = Fields[t];
	    		if(!f.t || f.h) continue;
	    		ctx.font = f.s.toString() + "px monospace";
	    		if(f.v) 
	    		{
	    			ctx.rotate(-Math.PI * 0.5);
	    			ctx.fillText(f.t, f.x, f.y);
	    			ctx.rotate(Math.PI * 0.5);
	    		}
	    		else ctx.fillText(f.t, f.x, f.y);
	    	}
	    };
	}	
	function loadSch(e)
	{
		var data = e.target.result.split('\n');
			
		for(var x = 0, l = data.length; x < l; x++)
		{
			var s = data[x];
			if(s == "Wire Wire Line" || s == "Entry Wire Line" || s == "Wire Bus Line")
			{
				var c = split(data[++x]);
				var P1 = new Point(parseInt(c[0]) * Km, parseInt(c[1]) * Km); 
				var P2 = new Point(parseInt(c[2]) * Km, parseInt(c[3]) * Km);
				var L = new Line(P1, P2);
				if(s == "Entry Wire Line") L.color = "#008000";
				else if(s == "Wire Bus Line") L.color = "#000080";
				Items.push(P1, P2, L);
			}
			else
			if(s.substr(0, 10) == "Connection")
			{
				var c = split(s.substr(13));
				var P = new Cnn(parseInt(c[0]) * Km, parseInt(c[1]) * Km);
				Items.push(P);		
			}
			else if(s == "$Comp")
			{
				var d = [];
				for(x++; data[x] != "$EndComp"; x++) d.push(data[x]);
				Items.push(new Component(d));
			}
		}
			
	};
	function loadLib(e)
	{
		var data = e.target.result.split('\n');
		for(var x = 0, l = data.length; x < l; x++)
		{
			var d = data[x];
			if(d == "" || d[0] == "#") continue;
			var s = split(d);
			var obj;
			if(s[0] === "DEF")
			{
				var Name = s[1].toUpperCase();
				if(Name == "~GND") Name = "GND";
				obj = Lib[Name] = {F:[]};
			}
			else if(s[0] === "ALIAS")
			{
				for(var y = 1, ll = s.length; y < ll; y++)
					Lib[s[y]] = obj;
			}
			else if(s[0][0] == 'F')
			{
				obj.F[s[0].substr(1)] = 
				{
					n: s[1]
				};
			}
			else
			if(s[0] == "DRAW")
			{
				var Draw = [];
				while(x < l && data[++x] !== "ENDDRAW")
				{
					s = split(data[x]);
					switch(s[0])
					{
					case 'P': // Линии P К-воТочек 0 1 толщина (x y) .. (x y) N
						var w = (parseInt(s[4]) * Km);
						if(w === 0.0) w = defw;
						Draw.push("ctx.beginPath(); ctx.lineWidth = " + w.toString());
						var n = parseInt(s[1]);
						var A = (parseInt(s[5]) * Km).toString();
						var B = (parseInt(s[6]) * Km).toString();
						Draw.push("ctx.moveTo(" + A.toString() + "," + B.toString() + ");");
						var X, Y, t = 7;
						while(--n)
						{
							X = (parseInt(s[t++]) * Km).toString();
							Y = (parseInt(s[t++]) * Km).toString();
							Draw.push("ctx.lineTo(" + X.toString() + "," + Y.toString() + ");");							
						}
						if((A == X && B == Y) || s[t] == "F") Draw.push("ctx.closePath();");
						if(s[t] == "F") Draw.push("ctx.fill();");
						Draw.push("ctx.stroke();");
							
						break;
					case 'X': // Контакт X имя номер x y длина направление ШрифтИмени ШрифтНомера
						Draw.push("ctx.beginPath(); ctx.lineWidth = " + defw.toString());
						var X = parseInt(s[3]) * Km;
						var Y = parseInt(s[4]) * Km;
						var L = parseInt(s[5]) * Km;
						if(!L) L = Km * 40;
						Draw.push("ctx.moveTo(" + X.toString() + "," + Y.toString() + ");");
						switch(s[6])
						{
						case 'U': Y += L; break;
						case 'D': Y -= L; break;
						case 'L': X -= L; break;
						case 'R': X += L; break;
						}
						Draw.push("ctx.lineTo(" + X.toString() + "," + Y.toString() + ");");
						Draw.push("ctx.stroke();");
						break;
					case 'C': // Окружность C x y R
						var X = (parseInt(s[1]) * Km).toString();
						var Y = (parseInt(s[2]) * Km).toString();
						var R = (parseInt(s[3]) * Km).toString();
						Draw.push("ctx.beginPath();");
			            Draw.push("ctx.arc(" + X + "," + Y + ", " + R + ", 0, 2 * Math.PI, false);");
						Draw.push("ctx.closePath(); ctx.stroke();");
						break;
					case 'S': // Прямоугольник S X1 Y1 X2 Y2 0 1 0 F
						var X = parseInt(s[1]) * Km;
						var Y = parseInt(s[2]) * Km;
						var W = parseInt(s[3]) * Km - X;
						var H = parseInt(s[4]) * Km - Y;
						X = X.toString();
						Y = Y.toString();
						W = W.toString();
						H = H.toString();
						var w = parseInt(s[7]) * Km;
						if(w === 0.0) w = defw;
						Draw.push("ctx.lineWidth = " + w +";"); 
						if(s[8] == "F")
							Draw.push("ctx.fillRect(" + X + "," + Y + ", " + W + ", " + H +");"); 
						Draw.push("ctx.strokeRect(" + X + "," + Y + ", " + W + ", " + H +");"); 
						break;
					case 'T':// Текст T 0 x y size 0 0 0 текст вид 0 С С
						var X = (parseInt(s[2]) * Km).toString();
						var Y = (parseInt(s[3]) * Km).toString();
						var S = (parseInt(s[3]) * Km).toString();
						var t = s[8];
			    		Draw.push("ctx.font = '" + S + "px monospace';");
			    		Draw.push("ctx.fillText('" + t + "'," + X + "," + Y + ");");						
						break;
					}
				}
				obj.D = new Function(Draw.join("\n"));
			}
			
		}
		
	};
	function processFiles(evt) 
	{
		var files = evt.target.files;
		for(var x = 0, l = files.length; x < l; x++) if(/\w+\.lib$/i.test(files[x].name))
		{
			var reader = new FileReader();
			reader.onload = loadLib;
			reader.readAsText(files[x]);
		}		
		for(var x = 0, l = files.length; x < l; x++) if(/\w+\.sch$/i.test(files[x].name))
		{
			var reader = new FileReader();
			reader.onload = loadSch;
			reader.readAsText(files[x]);
		}
		
	};
	this.OnImport = function()
	{
		var imp = document.getElementById("import");
		imp.onchange = processFiles;// "KiCAD.processFiles(this.files)";
		imp.click();	
	};
}();


CMenu.Add({
    file:{
    	gpath: {label: "Импорт", click: KiCAD.OnImport}
    		}});

