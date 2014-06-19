"use strict";

var KiCAD = new function()
{
	var Km = 0.05;
	var defw = 0.5;
	if(!workspace.partLib) workspace.partLib = {};
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
    function ConnDraw(Type)
    {
    	ctx.fillStyle = this._sel ? "#FF0000" :(Type > 0 ? "#808080": Main.Color);
        if(Type > 0 || this._sel || !this._der || this._der.length === 0 || this._der.length > 2)
        {
            ctx.lineWidth = 1;
            ctx.beginPath();
            var p = this;
            if(p.x === undefined) p = this.pos();
            ctx.arc(p.x, p.y, 1, 0, 2 * Math.PI, false);
            ctx.fill();
         }
    };
	
	function Component(d)
	{
		var res = null;
		var fields = [];
		var CmpName;
		for(var t in d)
		{
			var l = d[t];
			var f = split(l);
			switch(l[0])
			{
			case 'L': 
				CmpName = f[1].toUpperCase();
				res = new Main.Ctors["Part_" + CmpName]();  
				//Name = f[2];
				break;
			case 'F': 
				fields[parseInt(f[1])] = new schematic.Field(res, {
					t: f[2], x: Km * parseInt(f[4]), y: Km * parseInt(f[5]), hp: f[8],
					s: Km * parseInt(f[6]), v: f[3] == "V", h:parseInt(f[7]) == 1 
				}); 
				break;
			case '\t': 
				if(f.length == 3)
				{
					res.x = parseInt(f[1]) * Km;
					res.y = parseInt(f[2]) * Km;
				}
				else
					res.M = [parseFloat(f[0]), parseFloat(f[1]), -parseFloat(f[2]), -parseFloat(f[3])];
				break;
			}
		}
		for(var t in fields)
		{
			fields[t].x -= res.x;
			fields[t].y -= res.y;			
		}
		if(fields[0]) res.name = fields[0]; 
		if(fields[1]) res.val = fields[1]; 
		if(fields[2]) res.foot = fields[2]; 
		return res;
	}	
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
				pts[pn].draw = ConnDraw;
			}
			return pts[pn];
		}
		function GetPinPts(c, pts) // Вернуть текущие координаты всех точек в виде KiCAD
		{
			for(var t in c._p)
			{
				var p = c._p[t].pos();
				var n = (p.x / Km).toString() + " " + (p.y / Km).toString();
				pts[n] = c._p[t]; 
			}
		};
		
		for(var x in data) if(data[x] == "$Comp")
		{
			var d = [];
			for(x++; data[x] != "$EndComp"; x++) d.push(data[x]);
			var comp = Component(d);
			GetPinPts(comp, pts);
			Items.push(comp);
		}
        var Lines = [];
		for(var x in data)
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
				Lines.push(L);
			}
		}
        for(var x in data) if(data[x].substr(0, 10) == "Connection")
		{
			var c = split(data[x].substr(13));
			var P = GetPt(c[0], c[1]);//new Cnn(parseInt(c[0]) * Km, parseInt(c[1]) * Km);
            for(var l in Lines) // Если соединение находится на какой-либо линии, то её следует разорвать
            {
                var L = Lines[l];
                if(L.p1 === P || L.p2 === P) continue; // Уже соединена
                var p1 = L.p1.pos();
                var p2 = L.p2.pos();
                var e = 0.0001;
                var p = P.pos();
                var xx = p.x - e, yy = p.y - e;
                if((xx > p1.x && xx > p2.x) || (yy > p1.y && yy > p2.y)) continue;
                xx = p.x + e; yy = p.y + e;
                if((xx < p1.x && xx < p2.x) || (yy < p1.y && yy < p2.y)) continue;
                var dx = p2.x - p1.x, dy = p2.y - p1.y;
                var m = dx * (p.y - p1.y) - dy * (p.x - p1.x);
                var l = Math.sqrt(dx * dx + dy * dy);
                m /= l;
                if(Math.abs(m) < e) 
                { 
                    var L1 = new Line(P, L.p2);
                    L.setP2(P);
                    if(L.color) L1.color = L.color;
                    Lines.push(L1);
                }
            }
		}
        Items = Items.concat(Lines);
		pts = null;	
		Main.Redraw();
	};
	function loadLib(e)
	{
		var Lib = workspace.partLib, obj, br, s;
		function SetB(x, y) {if(x > br.r) br.r = x; if(y > br.b) br.b = y; if(x < br.l) br.l = x; if(y < br.t) br.t = y;};
		function loadField(o, s)
		{
			return new schematic.Field(o, {t:s[1], s: Km * parseInt(s[4]), x: Km * parseInt(s[2]), y: Km * parseInt(s[3])});
		}
		var data = e.target.result;
		data = data.split((data.search("\r\n") !== -1) ? "\r\n" : "\n");
		
		for(var x = 0, l = data.length; x < l; x++)
		{
			var d = data[x];
			if(d == "" || d[0] == "#") continue;
			s = split(d);
			if(s[0] === "DEF")
			{
				var Name = s[1].toUpperCase();
				if(Name == "~GND") Name = "GND";
				
				if(Lib[Name]) // Такой компонент в библиотеке уже есть 
				{
					x++;
					do {s = data[x++];} while(s !== "ENDDEF" && x < l);
					continue;
				}
				obj = Lib[Name] = new schematic.PartDef(Name); // F:поля, N:имена, lrtb:ограничивающий прямоугольник
				schematic.addToLib(Name, obj);
				br = obj.br;
			}
			else if(s[0] === "ALIAS") for(var y = 1, ll = s.length; y < ll; y++)
			{
				Lib[s[y]] = Lib[Name];
				obj.names.push(s[y]);
			}
			else if(s[0][0] == 'F')
			{
				var f = loadField(obj, s);
				switch(s[0].substr(1)) 
				{
				case '0': obj.defName = f; break;
				case '1': obj.defVal = f; break;
				case '2': obj.defFoot = f; break;
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
					case 'X': // Контакт: X имя номер x y длина направление ШрифтИмени ШрифтНомера 1 1 ElType GraphStyle
						var X = parseInt(s[3]) * Km;
						var Y = -parseInt(s[4]) * Km;
						var pin = {
							x:X, y:Y, 
							o:s[6], // направление D U L R
							n:s[1], // имя
							et:s[11], // электрический тип
							gs:s[12] // графический вид 
						};
						obj.pins[s[2]] = pin;
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
						/*if(s[1] != "~")
						{
							if(s[2] !== "" && s[2] !== s[1])
							{
								Draw.push("ctx.textBaseline = 'bottom';");
								Draw.push("ctx.fillText('" + s[2] + "'," + Xn.toString() + "," + Yn.toString() + ");");
							}
						}*/
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
					case 'A': // Дуга A x y R a1 a2 0 1 0 N x1 y1 x2 y2
						var X = parseInt(s[1]) * Km;
						var Y = -parseInt(s[2]) * Km;
						var a2 = (-parseInt(s[4]) * Math.PI / 1800).toString();
						var a1 = (-parseInt(s[5]) * Math.PI / 1800).toString();
						//var x1 = parseInt(s[10]) * Km - X;
						//var y1 = parseInt(s[11]) * Km - Y;
						var R = parseInt(s[3]) * Km;//Math.sqrt(x1 * x1 + y1 * y1);
						SetB(X + R, Y + R); SetB(X - R, Y - R);
						Draw.push("ctx.beginPath();");
			            Draw.push("ctx.arc(" + X.toString() + "," + Y.toString() + ", " + R.toString() + ", " + a1 + "," + a2 + ", false);");
						Draw.push("ctx.stroke();");						
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
	this.OnCreate = function(e)
	{
		var m = Lib[e.target.innerText];
		var comp = new Component(m);
		Items.push(comp);		
		
	};
	this.OnImport = function()
	{
		var imp = document.getElementById("import");
		imp.onchange = processFiles;
		imp.click();	
	};
}();


CMenu.Add({
    file:{
    	gpath: {label: "Импорт", click: KiCAD.OnImport}
    		}});

