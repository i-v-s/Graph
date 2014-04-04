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
		var Def = null;
		for(var t in d)
		{
			var l = d[t];
			var f = split(l); //l.split(' ');
			switch(l[0])
			{
			case 'L': 
				CmpName = f[1].toUpperCase();
				if(Lib[CmpName]) Def = Lib[CmpName];  
				Name = f[2]; 
				break;
			case 'F': 
				Fields[parseInt(f[1])] = 
				{
					t: f[2], x: Km * parseInt(f[4]), y: Km * parseInt(f[5]), hp: f[8],
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
					M = [parseFloat(f[0]), parseFloat(f[1]), -parseFloat(f[2]), -parseFloat(f[3])];
				break;
			}
		}
		for(var t in Fields)
		{
			Fields[t].x -= x;
			Fields[t].y -= y;			
		}
		var Pins = {};
		function GetPinPos(n)
		{
			var p = Def.pin[n];
			return {x:x + M[0] * p.x + M[1] * p.y, y:y - M[3] * p.y - M[2] * p.x};			
		}
		var th = this;
	    this.MoveBy = function(dx, dy)
	    {
	        if(!th.Moved)
	        {
	            x += dx;
	            y += dy;
	            //for(var t in Fields) {Fields[t].x += dx; Fields[t].y += dy;}
	            th.Moved = true;
	        }
	    };
		if(Def)for(var t in Def.pin) Pins[t] = 
		{
			p:t, 
			pos:function(){return GetPinPos(this.p);},
			MoveBy:this.MoveBy
		};
		this.GetPinPts = function(pts) // Вернуть текущие координаты всех точек в виде KiCAD
		{
			if(Def) for(var t in Def.pin)
			{
				var p = GetPinPos(t);
				var n = (p.x / Km).toString() + " " + (p.y / Km).toString();
				pts[n] = Pins[t]; 
			}
		};
		this.Hit = function(X, Y)
		{
			if(!Def) return null;
			X -= x; Y -= y;
    		var d = M[0] * M[3] - M[1] * M[2];
    		var A = X * d * M[3] + Y * -d * M[1];
    		var B = X * -d * M[2] + Y * d * M[0];
    		if(A > Def.l && A < Def.r && B > Def.t && B < Def.b) return this;
			return null;
		};
		this.RHit = function(l, t, r, b)
		{
			if(!Def) return false;
			var a = Def.l * M[0] + Def.t * M[1] + x;
			if(a < l || a > r) return false; 
			a = Def.r * M[0] + Def.b * M[1] + x;
			if(a < l || a > r) return false; 

			var a = y - (Def.l * M[2] + Def.t * M[3]);
			if(a < t || a > b) return false; 
			a = y - (Def.r * M[2] + Def.b * M[3]);
			if(a < t || a > b) return false; 
			return true;
		};
	    this.Draw = function(Type)
	    {
	    	var color = (Type > 0 || this.Sel) ? "#F00000" : "#800000";
	    	ctx.fillStyle = color;
	    	ctx.strokeStyle = color;

	    	if(Def) 
	    	{
	    		ctx.transform(M[0], M[1], M[2], M[3], x, y);
	    		Def.D();
	    		//var d = M[0] * M[3] - M[1] * M[2];
	    		//ctx.transform(d * M[3], -d * M[1], -d * M[2], d * M[0], 0, 0);
	            ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
	    	}
	    	for(var t in Fields)
	    	{
	    		var f = Fields[t];
	    		if(!f.t || f.h) continue;
	    		ctx.font = f.s.toString() + "px monospace";
	    		ctx.textBaseline = "middle";// top, bottom
	    		
	    		if(f.hp == 'C')	ctx.textAlign =  "center";
	    		else if(f.hp == 'L') ctx.textAlign =  "left";
	    		else if(f.hp == 'R') ctx.textAlign =  "right";
	    		
	    		var fx = x + f.x * M[0] + f.y * M[1];
	    		var fy = y - f.x * M[2] - f.y * M[3];
	    		if(f.v ^ (M[0] === 0.0)) 
	    		{
	    			//ctx.rotate(-Math.PI * 0.5);
		    		ctx.transform(0, -1.0, 1.0, 0, fx, fy);
	    			ctx.fillText(f.t, 0, 0);
		            ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
	    		}
	    		else ctx.fillText(f.t, fx, fy);
	    	}
	    };
		this.GetInfo = function(){return {
			CmpName: CmpName,
			Name:Name,
			Def:Def,
			Fields:Fields,
			Pins:Pins
		};};
	    this.GetPSel = function() {return this.Sel;};
	    this.Sel = false;
	}	
    function ConnDraw(Type)
    {
    	ctx.fillStyle = this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000");
        if(Type > 0 || this.Sel || this._der.length === 0 || this._der.length > 2)
        {
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1, 0, 2 * Math.PI, false);
            //ctx.fillStyle = '#000000';
            ctx.fill();
            //ctx.stroke();
         } //else ctx.strokeRect(this.x - 1, this.y - 1, 3, 3);
    };
	function loadSch(e)
	{
		var data = e.target.result;
		var sep = '\n';
		if(data.search("\r\n") !== -1) sep = "\r\n";
		data = data.split(sep);
		var pts = {};
		function GetPt(a, b)
		{
			var pn = a + " " + b;
			if(!pts[pn])
			{
				Items.push(pts[pn] = new Point(parseInt(a) * Km, parseInt(b) * Km));
				pts[pn].Draw = ConnDraw;
			}
			return pts[pn];
		}
		for(var x = 0, l = data.length; x < l; x++) if(data[x] == "$Comp")
		{
			var d = [];
			for(x++; data[x] != "$EndComp"; x++) d.push(data[x]);
			var comp = new Component(d);
			comp.GetPinPts(pts);
			Items.push(comp);
		}
		for(var x = 0, l = data.length; x < l; x++)
		{
			var s = data[x];
			if(s == "Wire Wire Line" || s == "Entry Wire Line" || s == "Wire Bus Line")
			{
				var c = split(data[++x]);
				var P1 = GetPt(c[0], c[1]); 
				var P2 = GetPt(c[2], c[3]);
				var L = new Line(P1, P2);
				if(s == "Entry Wire Line") L.color = "#008000";
				else if(s == "Wire Bus Line") L.color = "#000080";
				Items.push(L);
			}
			else
			if(s.substr(0, 10) == "Connection")
			{
				var c = split(s.substr(13));
				var P = GetPt(c[0], c[1]);//new Cnn(parseInt(c[0]) * Km, parseInt(c[1]) * Km);
			}
		}
		pts = null;	
	};
	function loadLib(e)
	{
		var data = e.target.result;
		var sep = '\n';
		if(data.search("\r\n") !== -1) sep = "\r\n";
		data = data.split(sep);

		for(var x = 0, l = data.length; x < l; x++)
		{
			var d = data[x];
			if(d == "" || d[0] == "#") continue;
			var s = split(d);
			var obj;
			function SetB(x, y) {if(x > obj.r) obj.r = x; if(y > obj.b) obj.b = y; if(x < obj.l) obj.l = x; if(y < obj.t) obj.t = y;};
			if(s[0] === "DEF")
			{
				var Name = s[1].toUpperCase();
				if(Name == "~GND") Name = "GND";
				obj = Lib[Name] = {F:[], N:[Name], pin:{}, l:0,r:0,t:0,b:0}; // F:поля, N:имена, lrtb:ограничивающий прямоугольник
			}
			else if(s[0] === "ALIAS")
			{
				for(var y = 1, ll = s.length; y < ll; y++)
				{
					Lib[s[y]] = obj;
					obj.N.push(s[y]);
				}
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
						var A = parseInt(s[5]) * Km;
						var B = -parseInt(s[6]) * Km;
						SetB(A, B);
						Draw.push("ctx.moveTo(" + A.toString() + "," + B.toString() + ");");
						var X, Y, t = 7;
						while(--n)
						{
							X = parseInt(s[t++]) * Km;
							Y = -parseInt(s[t++]) * Km;
							SetB(X, Y);
							Draw.push("ctx.lineTo(" + X.toString() + "," + Y.toString() + ");");							
						}
						if((A == X && B == Y) || s[t] == "F") Draw.push("ctx.closePath();");
						if(s[t] == "F") Draw.push("ctx.fill();");
						Draw.push("ctx.stroke();");
							
						break;
					case 'X': // Контакт X имя номер x y длина направление ШрифтИмени ШрифтНомера
						var X = parseInt(s[3]) * Km;
						var Y = -parseInt(s[4]) * Km;
						obj.pin[s[2]] = {x:X, y:Y};
						var L = parseInt(s[5]) * Km;
						if(!L) break;//L = Km * 40;
						Draw.push("ctx.beginPath(); ctx.lineWidth = " + defw.toString());
						Draw.push("ctx.moveTo(" + X.toString() + "," + Y.toString() + ");");
						var Xn = X, Yn = Y;
						switch(s[6])
						{
						case 'D': Y += L; Yn += L/2; break;
						case 'U': Y -= L; Yn -= L/2; break;
						case 'L': X -= L; Xn -= L/2; break;
						case 'R': X += L; Xn += L/2; break;
						}
						Draw.push("ctx.lineTo(" + X.toString() + "," + Y.toString() + ");");
						Draw.push("ctx.stroke();");
						if(s[1] != "~")
						{
							if(s[2] !== "" && s[2] !== s[1])
							{
								Draw.push("ctx.textBaseline = 'bottom';");
								Draw.push("ctx.fillText('" + s[2] + "'," + Xn.toString() + "," + Yn.toString() + ");");
							}
						}
						break;
					case 'C': // Окружность C x y R
						var X = parseInt(s[1]) * Km;
						var Y = -parseInt(s[2]) * Km;
						var R = parseInt(s[3]) * Km;
						SetB(X + R, Y + R); SetB(X - R, Y - R);
						Draw.push("ctx.beginPath();");
			            Draw.push("ctx.arc(" + X.toString() + "," + Y.toString() + ", " + R.toString() + ", 0, 2 * Math.PI, false);");
						Draw.push("ctx.closePath(); ctx.stroke();");
						break;
					case 'S': // Прямоугольник S X1 Y1 X2 Y2 0 1 0 F
						var X = parseInt(s[1]) * Km;
						var Y = -parseInt(s[2]) * Km;
						var W = parseInt(s[3]) * Km;
						var H = -parseInt(s[4]) * Km;
						SetB(X, Y); SetB(W, H);
						W -= X; H -= Y;
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
						var Y = -(parseInt(s[3]) * Km).toString();
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

