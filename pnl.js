
function Point(x, y)
{
    this.x = x;
    this.y = y;
    this.Serialize = function() {return this.x.toString() + "," + this.y;}
    this.pos = function() {return {x:this.x, y:this.y};}
    this.Draw = function(Type)
    {
        ctx.strokeStyle = this.Sel ? "#FF0000" : "#000000";
        if(Type > 0 || this.Sel)
        {
            ctx.strokeRect(this.x - 2, this.y - 2, 5, 5);
        } //else ctx.strokeRect(this.x - 1, this.y - 1, 3, 3);
    };
    this.MoveBy = function(dx, dy)
    {
        if(!this.Moved)
        {
            this.x += dx;
            this.y += dy;
            this.Moved = true;
            if(this.Owner) this.Owner.OnPtMoveBy(this, dx, dy);
        }
    }
    this.Hit = function(x, y)
    {
        var dx = Math.abs(this.x - x);
        var dy = Math.abs(this.y - y);
        if(dx < Main.adm && dy < Main.adm)
        {
            Main.MX = this.x;
            Main.MY = this.y;
            return this;
        } else return null;
    };
    this.GetPSel = function() {return this.Sel;}
    this.Sel = false;
    this.Moved = false;
}

function Line(p1, p2)
{
    this.p1 = p1;
    this.p2 = p2;
    this.Serialize = function() { return Items.indexOf(this.p1).toString() + ',' + Items.indexOf(this.p2);}
    this.OnLoad = function() { return (this.p1 = Main.ById(this.p1)) && (this.p2 = Main.ById(this.p2))},
    this.Draw = function(Type)
    {
        ctx.strokeStyle = this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        ctx.beginPath();
        var p = this.p1.pos();
        ctx.moveTo(p.x, p.y);
        p = this.p2.pos();
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    };
    this.MoveBy = function(dx, dy)
    {
        if(!this.Moved)
        {
            this.p1.MoveBy(dx, dy);
            this.p2.MoveBy(dx, dy);
            this.Moved = true;
        }
    };
    this.Hit = function(x, y)
    {
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
        return Math.abs(m) < Main.adm ? this : null;
    };
    this.GetPSel = function() {return this.Sel || this.p1.Sel || this.p2.Sel;};
    this.Sel = false;
    this.Moved = false;
}

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
                if(Main.PointAlign && MouseObject && MouseObject.pos) CLine.Obj.p2 = point = MouseObject; // Выбираем вторую точку из под мыши
                else Items.push(point = CLine.Pt); // или предыдущюю
                Items.push(CLine.Obj); // Отправляем линию. Теперь вторая точка используется как первая для новой линии.
                CLine.Pt = new Point(Main.MX, Main.MY); // Создаём вторую точку
                CLine.Obj = new Line(point, CLine.Pt);
            },
            rightup: Main.Pop
        };
        CLine.menu[0].click = CLine.OnCreate;
    },
    menu: [{
        path: "createmenu",
        label: "Линию",
        click:null
    }]
}

Main.Modules.push(CLine);