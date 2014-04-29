var CToolbar = function()
{
	function ToolButton(name)
	{
		this.e = document.getElementById("icon-" + name); 
	}
	
	ToolButton.prototype = 
	{
		show: function(b) {this.e.style.display = b ? "block" : "none";},
		check: function(b) 
		{
			if(b) this.e.classList.add("checked");
			else this.e.classList.remove("checked");
			this.c = b;
		}
	};
	
	return {
		hand: new ToolButton("hand"),
		select: new ToolButton("select"),
		move: new ToolButton("move"),
		cancel: new ToolButton("cancel")
	};
}();

CToolbar.cancel.e.onclick = function()
{
	if(State.rightup)
	{
		State.rightup(); 
		Main.Redraw();
	} 
	if(!State.rightup) 
		CToolbar.cancel.show(false);
};

CToolbar.select.e.onclick = function()
{
	if(State.select) State.select();
};

CToolbar.hand.e.onclick = function()
{
	if(State.hand) State.hand();
};

CToolbar.move.e.onclick = function()
{
	if(State.onlymove) State.onlymove();
};