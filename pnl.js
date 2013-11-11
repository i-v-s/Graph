
function Point(x, y)
{
    this.x = x;
    this.y = y;
    this.Serialize = function() {return this.x.toString() + "," + this.y;}
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
        if(dx < 3 && dy < 3)
        {
            Main.MX = this.x;
            Main.MY = this.y;
            return true;
        } else return false;
    };
    this.GetPSel = function() {return this.Sel;}
    this.Sel = false;
    this.Moved = false;
}

function Line(p1, p2)
{
    this.p1 = typeof p1 == "number" ? Items[p1] : p1;
    this.p2 = typeof p2 == "number" ? Items[p2] : p2;
    this.Serialize = function() { return Items.indexOf(this.p1).toString() + ',' + Items.indexOf(this.p2);}
    this.Draw = function(Type)
    {
        ctx.strokeStyle = this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
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
        if(x > this.p1.x && x > this.p2.x) return false;
        if(y > this.p1.y && y > this.p2.y) return false;
        if(x < this.p1.x && x < this.p2.x) return false;
        if(y < this.p1.y && y < this.p2.y) return false;
        var dx = this.p2.x - this.p1.x, dy = this.p2.y - this.p1.y;
        var m = (dx) * (y - this.p1.y) - (dy) * (x - this.p1.x);
        var l = Math.sqrt(dx * dx + dy * dy);
        m /= l;
        return Math.abs(m) < 5;
    };
    this.GetPSel = function() {return this.Sel || this.p1.Sel || this.p2.Sel;};
    this.Sel = false;
    this.Moved = false;
}

var CLine =
{
    Pt:null,
    Ln:null,
    Drawing:false,
    PointAlign:true,
    MainRedraw:null,
    Redraw:function()
    {
        CLine.MainRedraw();
        CLine.Ln.Draw(1);
    },
    OnMouseMove:function(x, y)
    {
        if(CLine.PointAlign) Main.OnAlignedMove(x, y);
        else Main.OnFreeMove(x, y);
        if(CLine.Drawing)
        {
            if(CLine.Pt.x != Main.MX || CLine.Pt.y != Main.MY)
            {
                Main.NeedRedraw = true;
                CLine.Pt.x = Main.MX;
                CLine.Pt.y = Main.MY;
            }
        }
    },
    OnLeftDown:function(x, y)
    {
        var point;
        if(CLine.Pt)
        {
            if(CLine.PointAlign && MouseObject && MouseObject instanceof Point)
            {
                point = MouseObject;
                CLine.Ln.p2 = point;
            }
            else
            {
                Items.push(CLine.Pt);
                point = CLine.Pt;
            }
            Items.push(CLine.Ln);
        }
        else
        {
            if(CLine.PointAlign && MouseObject && MouseObject instanceof Point)
                point = MouseObject;
            else
                Items.push(point = new Point(Main.MX, Main.MY));
        }
        CLine.Pt = new Point(Main.MX, Main.MY);
        CLine.Ln = new Line(point, CLine.Pt);

        if(!CLine.Drawing)
        {
            CLine.Drawing = true;
            CLine.MainRedraw = Main.Redraw;
            Main.SetRedraw(CLine.Redraw);
        }
        Main.NeedRedraw = true;
    },
    OnRightDown:function(x, y)
    {
        CLine.Pt = 0;
        CLine.Ln = 0;
        CLine.Drawing = false;
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
        Main.SetMouseMove(CLine.OnMouseMove);
        Main.SetMouseLeft(CLine.OnLeftDown, function(x, y){});
        Main.SetMouseRight(CLine.OnRightDown, CLine.OnRightUp);
    }
}

