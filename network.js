
function Network()
{
	var Nodes = [];
	var Models = {};
	var Devices = [];
	var Errors = [];
	function Load(Items)
	{
		for(var i in Items) if(Items[i].GetInfo)
		{
			var info = Items[i].GetInfo();
			var Model = null;
			if(info.Def)
			{
				var N = info.Def.N;
				for(var n in N) if(Model = Models[N[n]]) break;
			}
			if(!Model) 
			{
				Errors.push("Не найдена модель для компонента '" + info.Name + "'.");
				continue;
			}
			// Нашли модель, создаём устройство
			var dev = {M:Model, Name:info.Name, N:[]};
			
		}
		else if(Items[i].p1 && Items[i].p2)
		{
			// Линия
			
		}
	}
	
	this.Solve = function()
	{
		Load(Items);
	};
	Models.R = { // Резистор
		AddI:function(I, V){},
		AddY:function(B)
		{
			B[0].y += 1.0 / R;// Здесь устройство должно ввести поправки в матрицу проводимости(куда именно?)
			B[0](1.0 / R); // Или так
		},
		Nodes: [{N:1}, {N:2}],
		Branches: [{p:0, q: 1}]
	};	
}

var Net = new Network();

CMenu.Add({
    net:{label:"Электроника",
    	run: {label: "Пуск", click: Net.Solve}
    		}});

