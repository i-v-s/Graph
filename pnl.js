"use strict";

function Point(x, y)
{
    this.x = x;
    this.y = y;
    this._der = [];
    this._sel = false;
    this._mov = false;
}

Point.prototype = 
{
    serialize: function() {return this.x.toString() + "," + this.y;},
    pos: function() {return {x:this.x, y:this.y};},
    Draw: function(Type)
    {
        ctx.strokeStyle = this._sel ? "#FF0000" : "#000000";
        if(Type > 0 || this._sel || !this._der.length)
        {
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - 2, this.y - 2, 4, 4);
        } //else ctx.strokeRect(this.x - 1, this.y - 1, 3, 3);
    },
    moveBy: function(dx, dy)
    {
        if(!this._mov)
        {
            this.x += dx;
            this.y += dy;
            this._mov = true;
            if(this.Owner) this.Owner.OnPtMoveBy(this, dx, dy);
        }
    },
    Hit: function(x, y)
    {
        var dx = Math.abs(this.x - x);
        var dy = Math.abs(this.y - y);
        if(dx < Main.adm && dy < Main.adm)
        {
            Main.MX = this.x;
            Main.MY = this.y;
            Main.hitPriority = 0;
            return this;
        } else return null;
    },
    RHit: function(l, t, r, b) {return l < this.x && t < this.y && r > this.x && b > this.y;},
    OnDblClick: function()
    {
        if(Dialogs) Dialogs.Create(
        {
            title:"Свойства",
            update:Main.Redraw,
            data:
            {
                x:"X",
                y:"Y"
            }
        }, this);
    },
    GetPSel: function() {return this._sel;}
};

function Line(p1, p2)
{
    this.p1 = p1;
    this.p2 = p2;
    if(typeof p1 === "object" ) PushDer(p1, this);
    if(typeof p2 === "object" ) PushDer(p2, this);
    this._sel = false;
    this._mov = false;
}


Line.prototype = 
{
    serialize: function() { return Items.indexOf(this.p1).toString() + ',' + Items.indexOf(this.p2);},
    OnLoad: function()
    { 
        this.p1 = Main.ById(this.p1);
        this.p2 = Main.ById(this.p2);
        if(!(this.p1 && this.p2)) return false;
        this.p1._der.push(this);
        this.p2._der.push(this);
        return  true;
    },
    Draw: function(Type)
    {
        var color = this.color ? this.color : Main.Color;
        ctx.strokeStyle = this._sel ? "#FF0000" :(Type > 0 ? "#808080": color);
        ctx.lineWidth = this.width ? this.width : 0.5;
        ctx.beginPath();
        var p = this.p1.pos();
        ctx.moveTo(p.x, p.y);
        p = this.p2.pos();
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    },
    moveBy: function(dx, dy)
    {
        if(!this._mov)
        {
            this.p1.moveBy(dx, dy);
            this.p2.moveBy(dx, dy);
            this._mov = true;
        }
    },
    Hit: function(x, y)
    {
        if(Main.hitPriority <= 1) return null;
        var p1 = this.p1.pos();
        var p2 = this.p2.pos();
        var xx = x - Main.adm;
        var yy = y - Main.adm;
        if(xx > p1.x && xx > p2.x) return null;
        if(yy > p1.y && yy > p2.y) return null;
        xx = x + Main.adm;
        yy = y + Main.adm;
        if(xx < p1.x && xx < p2.x) return null;
        if(yy < p1.y && yy < p2.y) return null;
        var dx = p2.x - p1.x, dy = p2.y - p1.y;
        var m = (dx) * (y - p1.y) - (dy) * (x - p1.x);
        var l = Math.sqrt(dx * dx + dy * dy);
        m /= l;
        if(Math.abs(m) < Main.adm) { Main.hitPriority = 1; return this;}
        return  null;
    },
    RHit: function(l, t, r, b)
    {
        var p1 = this.p1.pos();
        var p2 = this.p2.pos();
        return (p1.x > l && p1.y > t && p1.x < r && p1.y < b) && (p2.x > l && p2.y > t && p2.x < r && p2.y < b);
    },
    setP2: function(P)
    {
        RemoveFromArray(this.p2._der, this);
        this.p2 = P;
        PushDer(P, this);
    },
    setP1: function(P)
    {
        RemoveFromArray(this.p1._der, this);
        this.p1 = P;
        PushDer(P, this);
    },   
    del: function()
    {
        RemoveFromArray(this.p1._der, this);
        RemoveFromArray(this.p2._der, this);
    },
    vec: function(p)
    {
        var a = this.p1.pos();
        var b = this.p2.pos();
        var x = b.x - a.x;
        var y = b.y - a.y;
        var l = Math.sqrt(x * x + y * y);
        if(l > 0.000000001) {x /= l; y /= l;}
        if(p === this.p1) return {x: x, y: y};
        if(p === this.p2) return {x: -x, y: -y};
    },
    GetPSel: function() {return this._sel || this.p1._sel || this.p2._sel;}
};

var CLine =
{
    Pt:null,
    Obj:null,
    MainRedraw:null,
    Redraw:function()
    {
        CLine.MainRedraw();
        CLine.Obj.Draw(1);
    },
    OnCreate: function() { Main.Call(States.preline);},
    OnInit:function()
    {
        Main.Ctors["Point"] = Point;
        Main.Ctors["Line"] = Line;
        States.preline =
        {
            move: function(x, y) {if(Main.PointAlign) Main.OnAlignedMove(x, y); else Main.OnFreeMove(x, y);},
            leftup: function(x, y) {
                CLine.MainRedraw = State.redraw;
                var point;
                if(Main.PointAlign && MouseObject && MouseObject.pos) point = MouseObject; // Выбираем первую точку
                else Items.push(point = new Point(Main.MX, Main.MY)); // или создаём
                CLine.Pt = new Point(Main.MX, Main.MY); // Создаём вторую точку
                CLine.Obj = new Line(point, CLine.Pt); // Создаём линию
                Main.Goto(States.nxline);
            },
            rightup: Main.Pop
        };
        States.nxline =
        {
            redraw: CLine.Redraw,
            move: function(x, y)
            {
                if(Main.PointAlign) Main.OnAlignedMove(x, y); else Main.OnFreeMove(x, y);
                if(CLine.Pt.x != Main.MX || CLine.Pt.y != Main.MY) {Main.NeedRedraw = true; CLine.Pt.x = Main.MX; CLine.Pt.y = Main.MY;}
            },
            leftup: function(x, y)
            {
                var point;
                if(Main.PointAlign && MouseObject && MouseObject.pos) 
                {
                    RemoveFromArray(CLine.Obj.p2._der, CLine.Obj);
                    CLine.Obj.p2 = point = MouseObject; // Выбираем вторую точку из под мыши
                    PushDer(point, CLine.Obj);
                }
                else Items.push(point = CLine.Pt); // или предыдущюю
                Items.push(CLine.Obj); // Отправляем линию. Теперь вторая точка используется как первая для новой линии.
                CLine.Pt = new Point(Main.MX, Main.MY); // Создаём вторую точку
                CLine.Obj = new Line(point, CLine.Pt);
            }
        };
        CMenu.Add({create:{_: {label: "Линию", click: this.OnCreate}}});
    }
};

Main.Modules.push(CLine);