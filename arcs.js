function Arc(p1, p2, A)
{
    this.p1 = typeof p1 == "number" ? Items[p1] : p1;
    this.p2 = typeof p2 == "number" ? Items[p2] : p2;
    this.a = A * Math.PI / 360;
    this.Serialize = function() { return Items.indexOf(this.p1).toString() + ',' + Items.indexOf(this.p2) + ',' + (this.a * 360 / Math.PI);}
    this.Update = function()
    {
        var dx = (this.p2.x - this.p1.x) * 0.5;
        var dy = (this.p2.y - this.p1.y) * 0.5;
        var ct = 1.0 / Math.tan(this.a);
        var rx = dx + dy * ct;
        var ry = dy - dx * ct;
        this.cx = this.p1.x + rx;
        this.cy = this.p1.y + ry;
        this.R = Math.sqrt(rx * rx + ry * ry);
        this.a1 = Math.atan2(-ry, -rx);
        this.a2 = Math.atan2(this.p2.y - this.cy, this.p2.x - this.cx);
    }
    this.Update();
    this.Draw = function(Type)
    {
        ctx.strokeStyle = this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        ctx.beginPath();
        this.Update();
        ctx.arc(this.cx, this.cy, this.R, this.a1, this.a2, true);
        ctx.stroke();
    };
    this.Hit = function(x, y)
    {
        this.Update();
        var dx = x - this.cx;
        var dy = y - this.cy;
        if(Math.abs(Math.sqrt(dx * dx + dy * dy) - this.R) > 3) return null;
        var a = Math.atan2(dy, dx);
        if(a > this.a1 || a < this.a2) return null;
        return this;
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
}

var CArc =
{
    Pt:null,
    Obj:null,
    MainRedraw:null,
    Redraw:function()
    {
        CArc.MainRedraw();
        CArc.Obj.Draw(1);
    },
    OnCreate: function() { Main.Call(States.prearc);},
    OnInit:function()
    {
        States.prearc =
        {
            move: function(x, y) {if(Main.PointAlign) Main.OnAlignedMove(x, y); else Main.OnFreeMove(x, y);},
            leftup: function(x, y) {
                CArc.MainRedraw = State.redraw;
                var point;
                if(Main.PointAlign && MouseObject && MouseObject.pos) point = MouseObject; // Выбираем первую точку
                else Items.push(point = new Point(Main.MX, Main.MY)); // или создаём
                CArc.Pt = new Point(Main.MX, Main.MY); // Создаём вторую точку
                CArc.Obj = new Arc(point, CArc.Pt, 90); // Создаём линию
                Main.Goto(States.nxarc);
            },
            rightup: Main.Pop
        };
        States.nxarc =
        {
            redraw: CArc.Redraw,
            move: function(x, y)
            {
                if(Main.PointAlign) Main.OnAlignedMove(x, y); else Main.OnFreeMove(x, y);
                if(CArc.Pt.x != Main.MX || CArc.Pt.y != Main.MY) {Main.NeedRedraw = true; CArc.Pt.x = Main.MX; CArc.Pt.y = Main.MY;}
            },
            leftup: function(x, y)
            {
                var point;
                if(Main.PointAlign && MouseObject && MouseObject.pos) CArc.Obj.p2 = point = MouseObject; // Выбираем вторую точку из под мыши
                else Items.push(point = CArc.Pt); // или предыдущюю
                Items.push(CArc.Obj); // Отправляем линию. Теперь вторая точка используется как первая для новой линии.
                CArc.Pt = new Point(Main.MX, Main.MY); // Создаём вторую точку
                CArc.Obj = new Arc(point, CArc.Pt, 90);
            },
            rightup: Main.Pop
        };
        
        if(CMenu)
        {
            //if(!CMenu.isEmpty(CMenu.file)) CMenu.file.ldbsep = "-";
            CMenu.create.arc = {label:"Дугу", onclick:CArc.OnCreate};
        }
    }
}

Main.Modules.push(CArc);