function Block(r)//x, y, w, h, Text)
{
    for(x in r) if(r.hasOwnProperty(x)) this[x] = r[x];
    this._P = [
        {
            pos:function(){return {x:this.o.x, y:this.o.y}},
            MoveBy:function(x, y){this.o.x += x; this.o.y += y; this.o.w -= x; this.o.h -= y;}
        },
        {
            pos:function(){return {x:this.o.x + this.o.w, y:this.o.y}},
            MoveBy:function(x, y){this.o.w += x; this.o.y += y; this.o.h -= y;}
        },
        {
            pos:function(){return {x:this.o.x, y:this.o.y + this.o.h}},
            MoveBy:function(x, y){this.o.x += x; this.o.h += y; this.o.w -= x;}
        },
        {
            pos:function(){return {x:this.o.x + this.o.w, y:this.o.y + this.o.h}},
            MoveBy:function(x, y){this.o.w += x; this.o.h += y;}
        },
        {
            pos:function(){return {x:this.o.x + (this.o.w >> 1), y:this.o.y}},
            MoveBy:function(x, y){this.o.y += y; this.o.h -= y;}
        },
        {
            pos:function(){return {x:this.o.x + (this.o.w >> 1), y:this.o.y + this.o.h}},
            MoveBy:function(x, y){this.o.h += y;}
        },
        {
            pos:function(){return {x:this.o.x, y:this.o.y + (this.o.h >> 1)}},
            MoveBy:function(x, y){this.o.x += x; this.o.w -= x;}
        },
        {
            pos:function(){return {x:this.o.x + this.o.w, y:this.o.y + (this.o.h >> 1)}},
            MoveBy:function(x, y){this.o.w += x;}
        }

    ];
    var PtDraw = function(Type)
    {
        ctx.strokeStyle = this.Sel ? "#FF0000" : "#000000";
        var p = this.pos();
        if(Type > 0 || this.Sel)
        {
            ctx.strokeRect(p.x - 2, p.y - 2, 5, 5);
        } //else ctx.strokeRect(this.x - 1, this.y - 1, 3, 3);
    }
    var GetId = function(){ return '' + Items.indexOf(this.o) + '.' + this.x};
    for(var x = this._P.length - 1; x >= 0; x--)
    {
        this._P[x].o = this;
        this._P[x].x = x;
        this._P[x].Draw = PtDraw;
        this._P[x].GetId = GetId;
    }

    if(this.text) this.text = this.text.split("\n");
    this.Child = function(c) {return this._P[c];}
    this.MoveBy = function(dx, dy)
    {
        if(!this.Moved)
        {
            this.x += dx; this.y += dy;
            for(var x = this._P.length - 1; x >= 0; x--) this._P[x].Moved = true;
        };
    }
    this.Draw = function(Type)
    {
        //var x = this._P[0].x, y = this._P[0].y;
        ctx.fillStyle = this.Sel ? "#FFE0E0" :(Type > 0 ? "#E0E0E0": "#FFFFFF");// = Type ? "": ;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        var step = 20;
        var a = this.x + 3, b = this.y + (step >> 1);
        ctx.textBaseline = "top";
        ctx.fillStyle = "#000000";
        ctx.font = "20px monospace";
        var x, e;
        if(this.text)for(x = 0, e = this.text.length; x < e; x++, b += step)
            ctx.fillText(this.text[x], a, b);
        if(this.Sel || Type > 0) for(x = this._P.length - 1; x >= 0; x--) this._P[x].Draw(1);
    };//ctx.strokeRect(this.P1.x, this.P1.y, this.w, this.h);};
    this.OnLoad = function(Sel)
    {
        if(this.x && this.y && this.w && this.h) return true;
        return false;
    };
    this.Hit = function(x, y)
    {
        for(var i = this._P.length - 1; i >= 0; i--)
        {
            var p = this._P[i].pos();
            if(Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3)
                return this._P[i];
        }
        if(x < this.x) return null;
        if(x > this.x + this.w) return null;
        if(y < this.y) return null;
        if(y > this.y + this.h) return null;
        return this;
    }
    this.OnOk = function()
    {
        var Memo = document.getElementById("blocktext");
        this.text = undefined;
        if(Memo.value !== "") this.text = Memo.value.split("\n");
        hideBlockDialog();
    }
    this.AutoSize = function()
    {
        ctx.font = "20px monospace";
        var l = this.text.length;
        this.h = l * 20 + 20;
        var mx = 10;
        for(var x = 0; x < l; x++)
        {
            var w = ctx.measureText(this.text[x]).width;
            if(w > mx) mx = w;
        }
        this.w = mx + 5;

    }
    this.OnDblClick = function()
    {
        if(Dialogs) Dialogs.Create(
        {
            title:"Свойства",
            update:Main.Redraw,
            data:
            {
                text:{name:"Текст", tag:"textarea"},
                x:"X",
                y:"Y",
                w:"Ширина",
                h:"Высота"
            }
        }, this);        
        /*var Memo = document.getElementById("blocktext");
        Memo.value = this.text ? this.text.join("\n") : "";
        showBlockDialog();*/
    }
}

var CBlock =
{
    MainRedraw:null,
    Obj:null,
    OnCreate: function() { Main.Call(States.preblock);},
    OnInit:function()
    {
        Main.Ctors["Block"] = Block;
        States.preblock =
        {
            move: function(x, y) {if(Main.PointAlign) Main.OnAlignedMove(x, y); else Main.OnFreeMove(x, y);},
            leftup: function(x, y) {
                CBlock.MainRedraw = State.redraw;
                var p;
                if(Main.PointAlign && MouseObject && MouseObject.pos) // Выбираем первую точку
                {
                    p = MouseObject.pos();
                    CBlock.Obj = new Block({x:p.x, y:p.y, w:1, h:1});
                }
                else CBlock.Obj = new Block({x:Main.MX, y:Main.MY, w:1, h:1}); // или создаём

                Main.Goto(States.nxblock);
            },
            rightup: Main.Pop
        };
        States.nxblock =
        {
            redraw:function()
            {
                CBlock.MainRedraw();
                CBlock.Obj.Draw(1);
            },
            move: function(x, y)
            {
                if(Main.PointAlign) Main.OnAlignedMove(x, y); else Main.OnFreeMove(x, y);
                if(CBlock.Obj.x + CBlock.Obj.w != Main.MX || CBlock.Obj.y + CBlock.Obj.h != Main.MY)
                {
                    Main.NeedRedraw = true;
                    CBlock.Obj.w = Main.MX - CBlock.Obj.x;
                    CBlock.Obj.h = Main.MY - CBlock.Obj.y;
                }
            },
            leftup: function(x, y)
            {
                var o = CBlock.Obj;
                if(o.w < 0) { o.x += o.w; o.w = -o.w;}
                if(o.h < 0) { o.y += o.h; o.h = -o.h;}
                Items.push(o);
                Main.Pop();
            }
        };
        CMenu.Add({create:{_: {label: "Блок", click: this.OnCreate}}});
    }
}

Main.Modules.push(CBlock);