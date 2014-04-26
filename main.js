"use strict";
var Items = [];
var MouseObject = null;
var SelRect = null;
var ctx = null;
var canvas = null;

function RemoveFromArray(a, v)
{
    var o = 0;
    for(var i = 0, e = a.length; i < e; i++)
    {
        var t = a[i];
        if(t !== v) a[o++] = t;
    }
    a.length = o;
}

function PushDer(o, d) // Добавить к объекту o зависимый от него d
{
    if(o._der) o._der.push(d);
    else o._der = [d];
}

var workspace = // Рабочее пространство со всеми сохраняемыми данными
{
    sheets:{} // Листы
}

var Main = {
    Scale: 1.0,
    OffsetX: 0.0,
    OffsetY: 0.0,
    adm:1, // Допуск при выборе
    NeedRedraw: false,
    PointAlign:true,
    MX: 0, MY: 0,
    Modules:[],
    Ctors:{},
    Color: "#000",
    Back: "#FFF",
    font: '10px monospace',
    hitPriority: 100,
    OnCSS: function(f)
    {
    	switch(f)
    	{
    	case "lite.css":
    	default:
    		Grid.Style = "#808080";
            Main.Color = "#000";
    		Main.Back = "#FFF";
    		break;
    	case "matrix.css":
    		Grid.Style = "#2A8106";
            Main.Color = "#76E215";
    		Main.Back = "#FFF";
    		break;
    	}
        Main.Redraw();
    },
    Clear: function()
    {
        ctx.clearRect(-Main.OffsetX / Main.Scale, -Main.OffsetY / Main.Scale, canvas.width / Main.Scale, canvas.height / Main.Scale);
    },
    Redraw: function()
    {
        //Main.OnCSS();
        Main.Clear();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        var left, top, right, bottom;
        var err = [];
        if(SelRect)
        {
            left = SelRect.left();
            top = SelRect.top();
            right = SelRect.right();
            bottom = SelRect.bottom();
        }
        var md = true;
        var Selected = [];
        var Touched = [];
        for(var x in Items)
        {
            var f = Items[x];
            if(f === MouseObject) {(f._sel ? Selected : Touched).push(f); md = false; continue;}
            if(f._sel) {Selected.push(f); continue;}
            if(SelRect && f.RHit && f.RHit(left, top, right, bottom)) {Touched.push(f); continue;}
            
            try {f.Draw(0);} 
            catch(e) {if(Items[x]) err.push("#" + x + " " + Items[x].constructor.name); Items[x] = null;}
        }
        for(var x in Selected)
        {
            try {Selected[x].Draw(0);} 
            catch(e) {if(Selected[x]) err.push("#" + x + " " + Selected[x].constructor.name); /*Items[x] = null;*/}
        }
        for(var x in Touched)
        {
            try {Touched[x].Draw(1);} 
            catch(e) {if(Touched[x]) err.push("#" + x + " " + Touched[x].constructor.name); /*Items[x] = null;*/}
        }        
        if(md && MouseObject) MouseObject.Draw(1);
        ctx.strokeStyle = "#8080FF";
        if(SelRect) SelRect.Stroke();
        if(err.length > 0)
        {
            var y = 0;
            for(var x = 0; x < Items.length; x++) if(Items[x]) Items[y++] = Items[x];
            Items.length = y;
            alert("Ошибка отрисовки объектов: \n" + err.join("\n"));
        }
    },
    DeleteAll: function()
    {
        Items.length = 0;
        Main.Redraw();
    },
    Delete: function()
    {
        var x, y;
        for(var x = 0, y = 0, e = Items.length; x < e; x++)
        {
            var i = Items[x];
            if((i.GetPSel && !i.GetPSel()) || !i._sel) Items[y++] = i;
            else
            {
                if(i.del) i.del();
                i.deleted = true;
            }
        }
        Items.length = y;
        Main.Redraw();
    },
    OnFreeMove:function(mx, my) // Свободное движение мыши
    {
        var mo = null;
        Main.hitPriority = 100;
        for(var x = Items.length; x--;)
        {
            var t = Items[x].Hit(mx, my);
            if(t) mo = t;
            //if(mo) break;
        }
        if(MouseObject != mo){MouseObject = mo; Main.NeedRedraw = true;}
    },
    OnAlignedMove:function(mx, my) // Движение с привязкой к объектам
    {
        var mo = null;
        Main.hitPriority = 100;
        for(var x = Items.length; x--;)
        {
            var t = Items[x].Hit(mx, my);
            if(t) mo = t;
            //if(mo) break;
        }
        if(Main.EveryRedraw || MouseObject != mo){MouseObject = mo; Main.NeedRedraw = true;}
    },
    OnMouseMove: null,
    OnLeftUp: function(mx, my)
    {
        if(SelRect)
        {
            if(SelRect.w == 0 && SelRect.h == 0)
            {
                if(MouseObject)
                {
                    if(MouseObject.OnSel) MouseObject.OnSel(!MouseObject._sel);
                    MouseObject._sel = !MouseObject._sel;
                }
                else for(var x = 0; x < Items.length; x++)
                {
                    if(Items[x].OnSel && Items[x]._sel) Items[x].OnSel(false);
                    Items[x]._sel = false;
                }
            } 
            else
            {
                var left = SelRect.left();
                var top = SelRect.top();
                var right = SelRect.right();
                var bottom = SelRect.bottom();

                for(var x = 0; x < Items.length; x++) if(Items[x].RHit && Items[x].RHit(left, top, right, bottom))
                {
                    if(Items[x].OnSel && !Items[x]._sel) Items[x].OnSel(true);
                    Items[x]._sel = true;
                }
            }
        }

        SelRect = null;
        Main.Pop();
        Main.NeedRedraw = true;
    },
    OnObjMove: function(mx, my) // Перемещение объектов с левой кнопкой
    {
        var dx = mx - Main.MX;
        var dy = my - Main.MY;
        Main.MX = mx;
        Main.MY = my;
        var x;
        if(!MouseObject._sel)
        {
            for(var x = 0; x < Items.length; x++) Items[x]._sel = false;
            MouseObject._sel = true;
        }
        for(var x = 0, e = Items.length; x < e; x++) if(Items[x]._sel && Items[x].moveBy) { Items[x].moveBy(dx, dy); Items[x]._mov = true;}
        if(!MouseObject._mov && MouseObject.moveBy)
            MouseObject.moveBy(dx, dy);
        for(var x = 0; x < Items.length; x++) Items[x]._mov = false;
        MouseObject._mov = false;
        Main.NeedRedraw = true;
    },
    OnSelMove: function(x, y) // Перемещение рамки выделения
    {
        SelRect.w = x - SelRect.x;
        SelRect.h = y - SelRect.y;
        Main.NeedRedraw = true;
    },
    GetId: function(o)
    {
        if(o.GetId) return o.GetId();
        return Items.indexOf(o);
    },
    ById: function(id)
    {
        if(typeof id === "object") return id;
        if(typeof id === "number") return Items[id];
        var a = id.split('.');
        var r = null;
        for(var x in a)
        {
            if(x == 0) r = Items[a[x]];
            else r = r.Child(a[x]);
            if(!r) throw "Unrecognized id '" + id + "'";
        }
        return r;
    },
    Goto:function(state)
    {
        if(typeof state === "string") state = States[state];
        var NewState = {}; // Новое состояние - комбинация предущего и требуемого
        for(var x in State) if(State.hasOwnProperty(x)) NewState[x] = State[x];
        for(var x in state) if(state.hasOwnProperty(x)) NewState[x] = state[x];
        if(state.leftdown && !state.leftup) NewState.leftup = undefined;
        else if(state.leftup && !state.leftdown) NewState.leftdown = undefined;
        if(state.rightdown && !state.rightup) NewState.rightup = undefined;
        else if(state.rightup && !state.rightdown) NewState.rightdown = undefined;

        State = NewState;
    },
    Call:function(state)
    {
        Stack.push(State);
        Main.Goto(state);
    },
    Pop:function()
    {
        if(Stack.length == 0) throw "Main.Pop() stack overrun!";
        State = Stack.pop();
    },
    GetMousePos: function(evt)
    {
        var box = canvas.getBoundingClientRect();
        var body = document.body;
        var docElem = document.documentElement;
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;
        var top  = box.top +  scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        return {x:(evt.pageX - left - Main.OffsetX) / Main.Scale, y:(evt.pageY - top - Main.OffsetY) / Main.Scale};
    },
    OnMouse: function(evt, method)
    {
        if(method)
        {
            var mp = Main.GetMousePos(evt);
            method(mp.x, mp.y);
            if(Main.NeedRedraw) {Main.NeedRedraw = false; State.redraw();}
        }
    },
    OnProps: function()
    {
        for(var x in Items) if(Items[x]._sel && Items[x].OnDblClick) { Items[x].OnDblClick(); break;}
    },
    Init: function()
    {
        document.oncontextmenu = function (){return false;};
        State = States.free;
        Main.OnMouseMove = Main.OnFreeMove;
        canvas = document.getElementById("canvas");
        ctx = canvas.getContext('2d');
        canvas.height = canvas.clientHeight;
        canvas.width = canvas.clientWidth;
        window.onresize = function()
        {
            canvas.height = canvas.clientHeight;
            canvas.width = canvas.clientWidth;
            ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
            Main.Redraw();
        };
        canvas.onmousedown = function(evt)
        {
            var b = evt.button;
            Main.MouseDown = b;
            switch(b)
            {
                case 0: Main.OnMouse(evt, State.leftdown); break;//if(Main.OnLeftDown) Main.OnLeftDown(x, y); break;
                case 2: Main.OnMouse(evt, State.rightdown);break;//if(Main.OnRightDown) Main.OnRightDown(x, y); break;
            }
        };
        canvas.onmouseup = function(evt)
        {
            switch(Main.MouseDown)
            {
                case 0: Main.OnMouse(evt, State.leftup); break;//if(Main.OnLeftUp) Main.OnLeftUp(x, y); break;
                case 2: Main.OnMouse(evt, State.rightup); break;//if(Main.OnRightUp) Main.OnRightUp(x, y); break;
            }
            Main.MouseDown = null;
        };
        canvas.onmousemove = function(evt) {Main.OnMouse(evt, State.move);};
        canvas.ondblclick = function(evt) {Main.OnMouse(evt, State.dblclick);evt.preventDefault();};
        canvas.onkeydown = function()
        {
            alert("kd");

        };
        if(window.CMenu)
        {
            CMenu.Add({
                file:{_: {label: "Новый", click: Main.DeleteAll}}, 
                edit:{
                    _: {label: "Удалить", click: Main.Delete},
                    _1:{label: "Свойства", click: Main.OnProps}
                }
            });
        }
        for(var x in Main.Modules)
            if(Main.Modules[x].OnInit) Main.Modules[x].OnInit(canvas, ctx);
        Main.Redraw();
    }
};


var Stack = [];
var States =
{
    free:
    {
        redraw: Main.Redraw,
        move:Main.OnFreeMove,
        leftdown: function(x, y) { Main.MX = x; Main.MY = y; SelRect = new SimpleRect(Main.MX, Main.MY, 0, 0);Main.Call(MouseObject ? "objmove" : "selmove");},
        dblclick:function(x, y) {if(MouseObject && MouseObject.OnDblClick) MouseObject.OnDblClick(x, y);}
    },
    selmove:{move:Main.OnSelMove, leftup:Main.OnLeftUp},
    objmove:{move:Main.OnObjMove, leftup:Main.OnLeftUp}
};
var State = States.free;

function SimpleRect(x, y, w, h)
{
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.left = function() {return this.w > 0 ? this.x : this.x + this.w;};
    this.top = function() {return this.h > 0 ? this.y : this.y + this.h;};
    this.right = function() {return this.w < 0 ? this.x : this.x + this.w;};
    this.bottom = function() {return this.h < 0 ? this.y : this.y + this.h;};
    this.Stroke = function() {ctx.strokeRect(this.x, this.y, this.w, this.h);};
}