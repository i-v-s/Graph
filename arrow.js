function Arrow(a)
{
    for(var x = 0, e = a.length; x < e; x++) if(typeof a[x] == "number") a[x] = Items[a[x]];
    this.ps = a;
    this.Serialize = function()
    {
        var r = "[";
        for(var x = 0, e = this.ps.length; x < e;)
        {
            r += Items.indexOf(this.ps[x]);
            if(++x < e) r += ",";
        }
        return r + "]";
    }

    this.Draw = function(Type)
    {
        if(this.ps.length < 2) return;
        ctx.strokeStyle = this.Sel ? "#FF0000" :(Type > 0 ? "#808080": "#000000");
        ctx.beginPath();
        ctx.lineWidth = 2;
        var p = this.ps[0].pos();
        ctx.moveTo(p.x, p.y);
        var e = this.ps.length;
        for(var x = 1; x < e; x++)
        {
            p = this.ps[x].pos();
            ctx.lineTo(p.x, p.y);
        }
        p = this.ps[e - 1].pos();
        var X = p.x;
        var Y = p.y;
        p = this.ps[e - 2].pos();
        var dx = X - p.x;
        var dy = Y - p.y;
        var l = Math.sqrt(dx * dx + dy * dy) / 3;
        if(l > 0)
        {
            var xl = 3;
            dx /= l;
            dy /= l;
            ctx.moveTo(X - xl * dx - dy, Y - xl * dy + dx);
            ctx.lineTo(X, Y);
            ctx.lineTo(X - xl * dx + dy, Y - xl * dy - dx);
        }
        ctx.stroke();
    };
    this.MoveBy = function(dx, dy)
    {
        if(!this.Moved)
        {
            for(var x = 0, e = this.ps.length; x < e; x++)
                this.ps[x].MoveBy(dx, dy);
            this.Moved = true;
        }
    };
    this.Hit = function(x, y)
    {
        var pr = 3;
        var p1 = this.ps[0].pos();
        for(var t = 0, e = this.ps.length - 1; t < e; t++)
        {
            var p = p1;
            var p1 = this.ps[t + 1].pos();
            if(x - pr > p.x && x - pr > p1.x) continue;
            if(y - pr > p.y && y - pr > p1.y) continue;
            if(x + pr < p.x && x + pr < p1.x) continue;
            if(y + pr < p.y && y + pr < p1.y) continue;
            var dx = p1.x - p.x, dy = p1.y - p.y;
            var m = (dx) * (y - p.y) - (dy) * (x - p.x);
            var l = Math.sqrt(dx * dx + dy * dy);
            m /= l;
            if(Math.abs(m) < pr) return this;
        }
        return null;
    };
    this.GetPSel = function() 
    {
        if(this.Sel) return true;
        for(var t = 0, e = this.ps.length; t < e;t++)
            if(this.ps[t].Sel) return true;
        return  false;
    };
    this.Sel = false;
    this.Moved = false;
}

var CArrow =
{
    Pt:null,
    Obj:null,
    MainRedraw:null,
    OnCreate: function() { Main.Call(States.prearrow);},
    OnInit:function()
    {
        States.prearrow =
        {
            move: function(x, y) {if(Main.PointAlign) Main.OnAlignedMove(x, y); else Main.OnFreeMove(x, y);},
            leftup: function(x, y)
            {
                CArrow.MainRedraw = State.redraw;
                var point;
                if(Main.PointAlign && MouseObject && MouseObject.pos) point = MouseObject; // Выбираем первую точку
                else Items.push(point = new Point(Main.MX, Main.MY)); // или создаём
                CArrow.Pt = new Point(Main.MX, Main.MY); // Создаём вторую точку
                CArrow.Obj = new Arrow([point, CArrow.Pt]); // Создаём линию
                Main.Goto(States.nxarrow);
            },
            rightup: Main.Pop
        };
        States.nxarrow =
        {
            redraw: function()
            {
                CArrow.MainRedraw();
                CArrow.Obj.Draw(1);
            },
            move: function(x, y)
            {
                if(Main.PointAlign) Main.OnAlignedMove(x, y); else Main.OnFreeMove(x, y);
                if(CArrow.Pt.x != Main.MX || CArrow.Pt.y != Main.MY) {Main.NeedRedraw = true; CArrow.Pt.x = Main.MX; CArrow.Pt.y = Main.MY;}
            },
            leftup: function(x, y)
            {
                if(Main.PointAlign && MouseObject && MouseObject.pos)
                {
                    var ps = CArrow.Obj.ps;
                    ps[ps.length - 1] = MouseObject;
                }
                else
                {
                    Items.push(CArrow.Pt);
                    CArrow.Pt = new Point(Main.MX, Main.MY);
                }
                CArrow.Obj.ps.push(CArrow.Pt);
            },
            rightup: function(x, y)
            {
                CArrow.Obj.ps.pop();
                if(CArrow.Obj.ps.length > 1) Items.push(CArrow.Obj);
                else Items.pop();
                CArrow.Obj = null;
                CArrow.Pt = null;
                Main.Pop();
            }
        }
        if(CMenu)
        {
            //if(!CMenu.isEmpty(CMenu.file)) CMenu.file.ldbsep = "-";
            CMenu.create.arrow = {label:"Стрелку", onclick:CArrow.OnCreate};
        }
    }
}

Main.Modules.push(CArrow);