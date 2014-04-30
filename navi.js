"use strict";

var Navi =
{
    OnMove: function(mx, my)
    {
        Main.OffsetX += mx * Main.Scale - Main.MX;
        Main.OffsetY += my * Main.Scale - Main.MY;
        ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
        Main.Redraw();
    },
    OnMouseWheel: function(evt)
    {
        var mp = Main.GetMousePos(evt.pageX, evt.pageY);
        var e = /*window.event ||*/ evt; // old IE support
        e.preventDefault();
        var delta = e.wheelDelta || -e.detail;
        var OScale = Main.Scale;
        if(delta == 0) return;
        var m = 1.2;
        if(delta < 0) m = 1.0 / m;  	
        Main.Scale *= m;
        Main.adm /= m;
        OScale -= Main.Scale;
        Main.OffsetX += mp.x * OScale;
        Main.OffsetY += mp.y * OScale;
        //ctx.strokeRect(Main.LastX, Main.LastY, 2, 2);
        ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
        //ctx.strokeRect(Main.LastX, Main.LastY, 2, 2);
        Main.Redraw();
    },
    OnInit: function(canvas, ctx)
    {
        //Main.SetMouseRight(Navi.OnRightDown, Navi.OnRightUp);
        States.free.rightdown = function(x, y)
        {
            Main.MX = x * Main.Scale;
            Main.MY = y * Main.Scale;
            Main.Call(States.navi);
        },

        States.navi = {move: Navi.OnMove, rightup: Main.Pop, leftup:Main.Pop};
        if(CToolbar)
        {
        	States.free.hand = function() {Main.Call("hand");};
        	States.select.hand = function() {Main.Goto("hand");};
        	States.onlymove.hand = function() {Main.Goto("hand");};
        	States.hand = 
        	{
        	    _enter:function() {CToolbar.hand.check(true);},
        		leftdown:States.free.rightdown,
        		hand: Main.Pop,
        	    _leave:function() {CToolbar.hand.check(false);},
                select:function() {Main.Goto("select");},
                onlymove:function() {Main.Goto("onlymove");}                	    
        	};
        }
        if(canvas.addEventListener) {
            // IE9, Chrome, Safari, Opera
            canvas.addEventListener("mousewheel", Navi.OnMouseWheel, false);
            // Firefox
            canvas.addEventListener("DOMMouseScroll", Navi.OnMouseWheel, false);
        }else canvas.attachEvent("onmousewheel", Navi.OnMouseWheel);
    }
};

Main.Modules.push(Navi);