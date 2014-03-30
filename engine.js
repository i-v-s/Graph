var Engine = 
{
	Run: function()
	{

	},
	OnInit: function()
	{
    	CMenu.Add({
    		run:{label: "Исполнение",
    			run:{label: "Запустить", click: this.run}
    		}});
	}
};


Main.Modules.push(Engine);