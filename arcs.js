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
        if(Math.abs(Math.sqrt(dx * dx + dy * dy) - this.R) > 3) return false;
        var a = Math.atan2(dy, dx);
        if(a > this.a1 || a < this.a2) return false;
        return true;
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
    Ar:null,
    Drawing:false,
    PointAlign:true,
    MainRedraw:null,
    Redraw:function()
    {
        CArc.MainRedraw();
        CArc.Ar.Draw(1);
    },
    OnMouseMove:function(x, y)
    {
        if(CArc.PointAlign) Main.OnAlignedMove(x, y);
        else Main.OnFreeMove(x, y);
        if(CArc.Drawing)
        {
            if(CArc.Pt.x != Main.MX || CArc.Pt.y != Main.MY)
            {
                Main.NeedRedraw = true;
                CArc.Pt.x = Main.MX;
                CArc.Pt.y = Main.MY;
            }
        }
    },
    OnLeftDown:function(x, y)
    {
        var point;
        if(CArc.Pt)
        {
            if(CArc.PointAlign && MouseObject && MouseObject instanceof Point)
            {
                point = MouseObject;
                CArc.Ar.p2 = point;
            }
            else
            {
                Items.push(CArc.Pt);
                point = CArc.Pt;
            }
            Items.push(CArc.Ar);
        }
        else
        {
            if(CArc.PointAlign && MouseObject && MouseObject instanceof Point)
                point = MouseObject;
            else
                Items.push(point = new Point(Main.MX, Main.MY));
        }
        CArc.Pt = new Point(Main.MX, Main.MY);
        CArc.Ar = new Arc(point, CArc.Pt, 90);

        if(!CArc.Drawing)
        {
            CArc.Drawing = true;
            CArc.MainRedraw = Main.Redraw;
            Main.SetRedraw(CArc.Redraw);
        }
        Main.NeedRedraw = true;
    },
    OnRightDown:function(x, y)
    {
        CArc.Pt = 0;
        CArc.Ar = 0;
        CArc.Drawing = false;
        Main.PopMouseLeft();
    },
    OnRightUp: function(x, y)
    {
        Main.PopMouseRight()
        Main.PopMouseMove();
        Main.PopRedraw();
        Main.Redraw();
    },
    OnCreate: function()
    {
        //var BLine = document.getElementById("BLine");
        Main.SetMouseMove(CArc.OnMouseMove);
        Main.SetMouseLeft(CArc.OnLeftDown, function(x, y){});
        Main.SetMouseRight(CArc.OnRightDown, CArc.OnRightUp);
    },
    OnInit:function()
    {
        if(CMenu)
        {
            //if(!CMenu.isEmpty(CMenu.file)) CMenu.file.ldbsep = "-";
            CMenu.create.arc = {label:"Дугу", onclick:CArc.OnCreate};
            //CMenu.file.locsave = {label:"Сохранить в браузере", onclick:null};
        }
    }
}

Main.Modules.push(CArc);