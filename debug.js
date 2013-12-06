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
	OnInit:function()
	{
    	CMenu.Add({
    		debug:{label: "Отладка",
    			out:{label: "Вывести в консоль", click: this.Dump},
    			json:{label: "Вывести в JSON", click: this.JSON}
    		}
    	});
	}
}

Main.Modules.push(CDebug);