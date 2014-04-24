"use strict";

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
		for(var x in Dlg.data) 
		{
			var v = Dlg.data[x];

			var tr = document.createElement("tr");
			var td = document.createElement("td");
			tr.appendChild(td);
			if(typeof v === "object") td.innerHTML = v.name;
			else td.innerHTML = v;

			td = document.createElement("td");
			var tag = "input";
			if(typeof v === "object" && v.tag) tag = v.tag;
			var i = document.createElement(tag);
			var val = Obj[x];
			if(tag === "textarea") val = val ? val.join("\n") : "";
			var tp = typeof val;
			if(tp === "number") i.type = "number";
			else i.type = "text";
			i.align = "right";
			i.value = (val !== undefined) ? val : "";
			i.__obj = Obj;
			i.__var = x;
			if(Dlg.update) i.__upd = Dlg.update;
			i.onchange = function()
			{
				var v = this.value;
				if(this.type === "number") v = parseFloat(v);
				if(this.type === "textarea") v = v.split("\n");
				this.__obj[this.__var] = v;
				if(this.__upd) this.__upd();
			};
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
			if(this.__mx !== undefined && this.__my !== undefined && e.target.tagName === "H1")
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
};