function Rect(r)//x, y, w, h, Text)
{
    this.P = [new Point(x, y), new Point(x + w, y), new Point(x, y + h), new Point(x + w, y + h)];
    for(var x = 0; x < 4; x++) this.P[x].Owner = this;
    this.L = [new Line(this.P[0], this.P[1]), new Line(this.P[0], this.P[2]), new Line(this.P[2], this.P[3]), new Line(this.P[1], this.P[3])];
    this.Text = Text.split("\n");
    this.OnPtMoveBy = function(Pt, dx, dy)
    {
        if(Pt === this.P[0]) { if(dy != 0 && !this.P[1].Sel) this.P[1].MoveBy(0, dy); if(dx != 0 && !this.P[2].Sel) this.P[2].MoveBy(dx, 0);}
        if(Pt === this.P[1]) { if(dy != 0 && !this.P[0].Sel) this.P[0].MoveBy(0, dy); if(dx != 0 && !this.P[3].Sel) this.P[3].MoveBy(dx, 0);}
        if(Pt === this.P[2]) { if(dy != 0 && !this.P[3].Sel) this.P[3].MoveBy(0, dy); if(dx != 0 && !this.P[0].Sel) this.P[0].MoveBy(dx, 0);}
        if(Pt === this.P[3]) { if(dy != 0 && !this.P[2].Sel) this.P[2].MoveBy(0, dy); if(dx != 0 && !this.P[1].Sel) this.P[1].MoveBy(dx, 0);}
    }
    this.MoveBy = function(dx, dy)
    {
        if(!this.Moved) for(var x = 0; x < 4; x++) this.P[x].MoveBy(dx, dy);
    }
    this.Draw = function(Type)
    {
        var x = this.P[0].x, y = this.P[0].y;
        ctx.fillStyle = this.Sel ? "#FFE0E0" :(Type > 0 ? "#E0E0E0": "#FFFFFF");// = Type ? "": ;
        ctx.fillRect(x, y, this.P[3].x - x, this.P[3].y - y);
        var step = 20;
        var a = this.P[0].x + 3, b = this.P[0].y + (step >> 1);
        ctx.textBaseline = "top";
        ctx.fillStyle = "#000000";
        ctx.font = "20px monospace";
        for(var x = 0, e = this.Text.length; x < e; x++, b += step)
            ctx.fillText(this.Text[x], a, b);
    };//ctx.strokeRect(this.P1.x, this.P1.y, this.w, this.h);};
    this.OnSel = function(Sel)
    {
        var Memo = document.getElementById("Memo");
        if(Sel) Memo.value = this.Text.join("\n");
        else
        {
            this.Text = Memo.value.split("\n");
            Memo.value = "";
        }
    }
    this.Store = function(v)
    {
        var x;
        for(x = 0; x < 4; x++) v.push(this.P[x]);
        for(x = 0; x < 4; x++) v.push(this.L[x]);
        v.push(this);
    }
    this.Hit = function(x, y)
    {
        if(x > this.P[0].x && x > this.P[3].x) return false;
        if(x < this.P[0].x && x < this.P[3].x) return false;
        if(y > this.P[0].y && y > this.P[3].y) return false;
        if(y < this.P[0].y && y < this.P[3].y) return false;
        return true;
    }
}

var CRect =
{
    PointAlign:true,
    Bl:null,
    Pt:null,
    Redraw:function()
    {
        CRect.MainRedraw();
        CRect.Bl.Draw(1);
    },
    OnLeftDown:function(x, y)
    {
        var point;
        if(CRect.Pt)
        {
            if(CRect.PointAlign && MouseObject && MouseObject instanceof Point)
            {
                point = MouseObject;
                CRect.Bl.p2 = point;
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
        CLine.Bl = new Rect( point, CLine.Pt);

        if(!CLine.Drawing)
        {
            CLine.Drawing = true;
            CLine.MainRedraw = Main.Redraw;
            Main.SetRedraw(CLine.Redraw);
        }
        Main.NeedRedraw = true;
    },
    OnCreate: function()
    {
        //var BLine = document.getElementById("BLine");
        Main.SetMouseMove(CRect.OnMouseMove);
        Main.SetMouseLeft(CRect.OnLeftDown, function(x, y){});
        Main.SetMouseRight(CRect.OnRightDown, CRect.OnRightUp);
    },
    OnInit:function()
    {
        if(CMenu)
        {
            //if(!CMenu.isEmpty(CMenu.file)) CMenu.file.ldbsep = "-";
            CMenu.create.block = {label:"Блок", onclick:CRect.OnCreate};
            //CMenu.file.locsave = {label:"Сохранить в браузере", onclick:null};
        }
    }
}

Main.Modules.push(CRect);