var Items = [];
var MouseObject = null;
var SelRect = null;
var ctx = null;
var canvas = null;

function DownUp(Down, Up)
{
    this.d = Down;
    this.u = Up;
}

var Main = {
    Scale: 1.0,
    OffsetX: 0.0,
    OffsetY: 0.0,
    adm:3, // Допуск при выборе
    NeedRedraw: false,
    MouseDown: null,
    OnRightDown: null,
    PointAlign:true,
    MX: 0, MY: 0,
    Modules:[],

    Clear: function()
    {
        ctx.clearRect(-Main.OffsetX / Main.Scale, -Main.OffsetY / Main.Scale, canvas.width / Main.Scale, canvas.height / Main.Scale);
    },
    Redraw: function()
    {
        Main.Clear();
        for(var x = 0; x < Items.length; x++)
        {
            var f = Items[x];
            if(f !== MouseObject) f.Draw(0);
        }
        if(MouseObject) MouseObject.Draw(1);
        //ctx.stroke();
        ctx.strokeStyle = "#8080FF";
        //if(SelRect) SelRect.Stroke();
    },
    DeleteAll: function()
    {
        Items.length = 0;
        Main.Redraw();
    },
    Delete: function()
    {
        var x, y;
        for(x = 0, y = 0, e = Items.length; x < e; x++)
        {
            var i = Items[x];
            if((i.GetPSel && !i.GetPSel()) || !i.Sel) Items[y++] = i;
        }
        Items.length = y;
        Main.Redraw();
    },
    /*OnLeftDown:function(x, y)
    {
        Main.MX = x;
        Main.MY = y;
        SelRect = new SimpleRect(Main.MX, Main.MY, 0, 0);
        Main.SetMouseMove(MouseObject ? Main.OnObjMove : Main.OnSelMove);
    },*/
    OnFreeMove:function(mx, my) // Свободное движение мыши
    {
        var mo = null;
        for(x = 0; x < Items.length; x++)
        {
            mo = Items[x].Hit(mx, my);
            if(mo) break;
        }
        if(MouseObject != mo){MouseObject = mo; Main.NeedRedraw = true;}
    },
    OnAlignedMove:function(mx, my) // Движение с привязкой к объектам
    {
        var mo = null;
        for(x = 0; x < Items.length; x++)
        {
            mo = Items[x].Hit(mx, my);
            if(mo)break;
        }
        if(Main.EveryRedraw || MouseObject != mo){MouseObject = mo; Main.NeedRedraw = true;}
    },
    OnMouseMove: null,
    OnLeftUp: function(mx, my)
    {
        if(SelRect && SelRect.x == Main.MX && SelRect.y == Main.MY)
        {
            if(MouseObject)
            {
                if(MouseObject.OnSel) MouseObject.OnSel(!MouseObject.Sel);
                MouseObject.Sel = !MouseObject.Sel;
            }
            else for(var x = 0; x < Items.length; x++)
            {
                if(Items[x].OnSel && Items[x].Sel) Items[x].OnSel(false);
                Items[x].Sel = false;
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
        if(!MouseObject.Sel)
        {
            for(x = 0; x < Items.length; x++) Items[x].Sel = false;
            MouseObject.Sel = true;
        }
        for(x = 0; x < Items.length; x++) if(Items[x].Sel) { Items[x].MoveBy(dx, dy); Items[x].Moved = true;}
        if(!MouseObject.Moved && MouseObject.MoveBy)
            MouseObject.MoveBy(dx, dy);
        for(x = 0; x < Items.length; x++) Items[x].Moved = false;
        MouseObject.Moved = false;
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
        var x;
        for(x in State) if(State.hasOwnProperty(x)) NewState[x] = State[x];
        for(x in state) if(state.hasOwnProperty(x)) NewState[x] = state[x];
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
        var body = document.body
        var docElem = document.documentElement
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
        var clientTop = docElem.clientTop || body.clientTop || 0
        var clientLeft = docElem.clientLeft || body.clientLeft || 0
        var top  = box.top +  scrollTop - clientTop
        var left = box.left + scrollLeft - clientLeft
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
    Init: function()
    {
        State = States.free;
        Main.OnMouseMove = Main.OnFreeMove;
        canvas = document.getElementById("canvas");
        ctx = canvas.getContext('2d');
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
        canvas.onmousemove = function(evt)
        {
            Main.OnMouse(evt, State.move);
        };
        canvas.onkeydown = function()
        {
            alert("kd");

        }
        if(CMenu)
        {
            CMenu.file.new = {label:"Новый", onclick:Main.DeleteAll};
            CMenu.edit.delete = {label:"Удалить", onclick:Main.Delete};
        }
        for(var x = 0, e = Main.Modules.length; x < e; x++)
            if(Main.Modules[x].OnInit) Main.Modules[x].OnInit(canvas, ctx);
        this.Redraw();
    }
};


var Stack = [];
var States =
{
    free:{redraw: Main.Redraw, move:Main.OnFreeMove, leftdown: function(x, y) { Main.MX = x; Main.MY = y; SelRect = new SimpleRect(Main.MX, Main.MY, 0, 0);Main.Call(MouseObject ? "objmove" : "selmove");}},
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
}