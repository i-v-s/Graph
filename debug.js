var CDebug =
{
	Dump:function()
	{
		for(i in Items) if(Items[i].Sel)
		{
			console.log(Items[i]);

		}

	},
	JSON:function()
	{
		for(i in Items) if(Items[i].Sel)
		{
			console.log("" + i + ": " + DB.ItemToJSON(Items[i]));
		}
	},
	der:function()
	{
		for(i in Items) if(Items[i].Sel)
		{
			console.log("" + i + " .der: ");
			for(d in Items[i]._der)
				console.log("	" + Main.GetId(Items[i]._der[d]));
		}
	},
	glob:function()
	{
		var Y = 0, X = 0;
		for(var x in window) if(window.hasOwnProperty(x))
		{
			var v = window[x];
			var text = x;
			if((typeof v !== "object" && typeof v !== "function") || v === null) text += ": " + v;
			var b = new Block({x:X, y:Y, w:300, h:45, text:text});
			b.AutoSize();
			b.obj = v;
			Items.push(b);
			Y += 60;
			if(Y > 800) {Y = 0; X += 350;}
		}
		Main.Redraw();
	},
	list:function()
	{
		for(var x in Items) if(Items[x].Sel)
		{
			var i = Items[x];
			var X = i.x + i.w + 20;
			var Y = i.y;
			var obj = i.obj;
			if(typeof obj === "function")
			{
				var b = new Block({x:X, y:Y, w:300, h:45, text:"" + obj});
				b.obj = v;
				b.AutoSize();
				Items.push(b);
			}
			else
			for(var y in obj) if(obj.hasOwnProperty(y))
			{
				var v = obj[y];
				var text = y;
				if((typeof v !== "object" && typeof v !== "function") || v === null) text += ": " + v;
				var b = new Block({x:X, y:Y, w:300, h:45, text:text});
				b.obj = v;
				b.AutoSize();
				Items.push(b);
				Y += 60;
			}
		}
		Main.Redraw();		
	},
	run:function()
	{
		for(var x in Items) if(Items[x].Sel && Items[x].text)
		{
			var text = Items[x].text.join("\n");
			eval(text);
		}
	},
	OnInit:function()
	{
    	CMenu.Add({
    		debug:{label: "Отладка",
    			out:{label: "В консоль", click: this.Dump},
    			json:{label: "В JSON", click: this.JSON},
    			der:{label: "_der", click: this.der},
    			glob:{label: "Глобальные объекты", click: this.glob},
    			list:{label: "Поля объекта", click: this.list},
    			run:{label: "Запустить", click: this.run}
    		}
    	});
	}
};

Main.Modules.push(CDebug);