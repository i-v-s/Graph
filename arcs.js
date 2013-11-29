function Arc(p1, p2, A)
{
    this.p1 = p1;
    this.p2 = p2;
    this.a = A * Math.PI / 180;
    this.Serialize = function() { return Items.indexOf(this.p1).toString() + ',' + Items.indexOf(this.p2) + ',' + (this.a * 180 / Math.PI);}
    this.toJSON = function(key){return {p1:Main.GetId(this.p1), p2:Main.GetId(this.p2), a: this.a * 180 / Math.PI, _:"Arc"};};
    this.OnLoad = function() {this.p1 = Main.ById(this.p1); this.p2 = Main.ById(this.p2); this.a *=  Math.PI / 180; return this.p1 && this.p2;},
    this._P =
    {
        o: this,
        pos: function() {return {x:this.o.cx, y:this.o.cy};},
        MoveBy: function(x, y)
        {
            var A = this.o.p1.pos();
            var B = this.o.p2.pos();
            var ABx = B.x - A.x;
            var ABy = B.y - A.y;
            var AB2 = ABx * ABx + ABy * ABy;
            var ABd2 = Math.sqrt(AB2) * 0.5;
            var t = ABd2 * Math.tan((Math.PI - this.o.a) * 0.5) - (ABy * x - ABx * y) / ABd2 * 0.5;
            //console.log("a = " + (this.o.a * 180 / Math.PI) + ", AB = " + (ABd2 * 2) + ", M = " + ((ABy * x - ABx * y) / ABd2 * 0.5));
            this.o.a = 2 * Math.atan2(ABd2, t);
        },
        GetId: function(){ return '' + Main.GetId(this.o) + ".0"},
        Draw: function(Type)
        {
            ctx.strokeStyle = this.Sel ? "#FF0000" : "#000000";
            var p = this.pos();
            if(Type > 0 || this.Sel) ctx.strokeRect(p.x - 2, p.y - 2, 5, 5);
        }
    };
    this.Child = function(c) {return this._P;};
    this.Update = function()
    {
        var p1 = this.p1.pos();
        var p2 = this.p2.pos();
        var dx = (p2.x - p1.x) * 0.5;
        var dy = (p2.y - p1.y) * 0.5;
        var ct = 1.0 / Math.tan(this.a * 0.5);
        var rx = dx - dy * ct;
        var ry = dy + dx * ct;
        this.cx = p1.x + rx;
        this.cy = p1.y + ry;
        this.R = Math.sqrt(rx * rx + ry * ry);
        this.a1 = Math.atan2(-ry, -rx);
        this.a2 = Math.atan2(p2.y - this.cy, p2.x - this.cx);
    }
    if(p1) this.Update();
    this.Draw = function(Type)
    {
        ctx.strokeStyle = this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        ctx.beginPath();
        this.Update();
        ctx.arc(this.cx, this.cy, this.R, this.a1, this.a2);
        ctx.stroke();
        if(this.Sel || Type > 0) this._P.Draw(1);
    };
    this.Hit = function(x, y)
    {
        this.Update();
        var p = this._P.pos();
        var adm = Main.adm;
        if(Math.abs(p.x - x) < adm && Math.abs(p.y - y) < adm) return this._P;
        var dx = x - this.cx;
        var dy = y - this.cy;
        if(Math.abs(Math.sqrt(dx * dx + dy * dy) - this.R) > adm) return null;
        var a = Math.atan2(dy, dx);
        if(this.a2 > this.a1) return (a > this.a2 || a < this.a1) ? null : this;
        else return (a > this.a2 && a < this.a1) ? null : this;
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
        Main.Ctors["Arc"] = Arc;
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
        
        this.menu[0].click = CArc.OnCreate;
    },
    menu: [{
        path: "createmenu",
        label: "Дугу",
        click:null
    }]
}

Main.Modules.push(CArc);