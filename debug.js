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
	OnInit:function()
	{
    	CMenu.Add({
    		debug:{label: "Отладка",
    			out:{label: "В консоль", click: this.Dump},
    			json:{label: "В JSON", click: this.JSON},
    			der:{label: "_der", click: this.der}
    		}
    	});
	}
}

Main.Modules.push(CDebug);