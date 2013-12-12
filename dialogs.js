
var Dialogs = 
{
	OnClose: function()
	{
		for(var x = this; x; x = x.parentElement)
			if(x.className == "dialog") 
			{
				x.parentElement.removeChild(x);
				return;
			}
	},

	Create: function(Dlg, Obj)
	{
		var d = document.createElement("div");
		d.className = "dialog";
		var h = document.createElement("h1");
		h.innerHTML = Dlg.title;
		d.appendChild(h);
		var di = document.createElement("div");
		d.appendChild(di);
		var tb = document.createElement("table");
		tb.width = "100%";
		tb.cellspacing = "0";
		tb.cellpadding = "4";
		for(x in Dlg.data) 
		{
			var v = Dlg.data[x];

			var tr = document.createElement("tr");
			var td = document.createElement("td");
			tr.appendChild(td);
			td.innerHTML = v;

			td = document.createElement("td");
			var i = document.createElement("input");
			var val = Obj[x];
			var tp = typeof val;
			if(tp === "number") i.type = "number";
			else i.type = "text";
			i.align = "right";
			i.value = val;
			i.__obj = Obj;
			i.__var = x;
			i.onchange = function()
			{
				var v = this.value;
				if(this.type === "number") v = parseFloat(v);
				this.__obj[this.__var] = v;
				if(this.__obj.Update) this.__obj.Update();
			}
			td.appendChild(i);
			tr.appendChild(td);
			tb.appendChild(tr);
		}
		di.appendChild(tb);

		var div = document.createElement("div");
		div.align = "center";
		var bOk = document.createElement("button");
		bOk.innerHTML = "Закрыть";
		div.appendChild(bOk);
		bOk.onclick = Dialogs.OnClose;

		/*var bCancel = document.createElement("button");
		bCancel.innerHTML = "Отмена";
		bCancel.onclick = OnClose;
		div.appendChild(bCancel);*/

		di.appendChild(div);
		d.onmousemove = function(e)
		{
			if(this.__mx !== undefined && this.__my !== undefined)
			{
				this.style.left = "" + (this.offsetLeft + e.pageX - this.__mx) + "px";
				this.style.top = "" + (this.offsetTop + e.pageY - this.__my) + "px";
				this.__mx = e.pageX; 
				this.__my = e.pageY;
			}
		};
		d.onmousedown = function(e) {if(e.button != 0) return; this.__mx = e.pageX; this.__my = e.pageY;};
		d.onmouseup = function(e) {this.__mx = undefined; this.__my = undefined;};
		document.body.appendChild(d);
		return d;
	}
}