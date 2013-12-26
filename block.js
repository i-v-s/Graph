function Block(r)//x, y, w, h, Text)
{
    this.SetFontSize = function(s)
    {
        this.fsize = s;
        this._font = s.toString() + "px monospace";
        ctx.font = this._font;
        this._dx = ctx.measureText("X").width;
    }
    this.SetFontSize(10);
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
            ctx.lineWidth = 1;
            ctx.strokeRect(p.x - 2, p.y - 2, 4, 4);
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
    };
    this.GetTextLayout = function()
    {
        var step = this.fsize;
        var l = this.text ? this.text.length : 0;
        var y = this.y + (this.h * 0.5) - (l * step / 2);
        return {
            x: this.x + step,
            y: y,
            dx: this._dx,
            dy: step
        };
    }
    this.Draw = function(Type)
    {
        //var x = this._P[0].x, y = this._P[0].y;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000";
        ctx.fillStyle = this.Sel ? "#FFE0E0" :/*(Type > 0 ? "#E0E0E0":*/ "#FFFFFF";//);// = Type ? "": ;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        if(this.text)
        {
            var l = this.GetTextLayout();
            var a = l.x, b = l.y;
            ctx.textBaseline = "top";
            ctx.fillStyle = "#000000";
            ctx.font = this._font;
            var x, e;
            for(x = 0, e = this.text.length; x < e; x++, b += l.dy)
                ctx.fillText(this.text[x], a, b);
        }
        if(this.Sel || Type > 0) for(var x = this._P.length; x--; ) this._P[x].Draw(1);
    };
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
        if(this.text)
        {
            var txt = this.text;
            var l = this.GetTextLayout();
            var step = 20;
            var Y = Math.floor((y - l.y) / l.dy);
            var X = Math.floor((x - l.x) / l.dx);
            if(X >= 0 && Y >= 0 && Y < txt.length && X < txt[Y].length)
            {
                var t = txt[Y];
                var e = /\w/;
                if(!e.test(t.charAt(X))) return this;
                var minX = X;
                while(minX > 0 && e.test(t.charAt(minX - 1))) minX--;
                var maxX = X + 1;
                while(maxX < t.length && e.test(t.charAt(maxX))) maxX++;
                maxX--;

                var r = 
                {
                    o:this,
                    x:minX,
                    l:maxX - minX + 1,
                    y:Y,
                    Draw: function(Type)
                    {
                        var l = this.o.GetTextLayout();
                        var x = l.x + this.x * l.dx;
                        var y = l.y + this.y * l.dy;
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "#000";
                        ctx.strokeRect(x, y + 1, this.l * l.dx, l.dy + 1);
                    },
                    pos: function()
                    {
                        var l = this.o.GetTextLayout();
                        var x = l.x + (this.x + this.l) * l.dx;
                        var y = l.y + (this.y + 1) * l.dy + 2;
                        return {x: x, y: y}
                    }
                };
                return r;
            }
        } 
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
        ctx.font = this._font;
        var l = this.text.length;
        var lay = this.GetTextLayout();
        this.h = (l + 1) * lay.dy;
        var mx = 10;
        for(var x = 0; x < l; x++)
        {
            var w = ctx.measureText(this.text[x]).width;
            if(w > mx) mx = w;
        }
        this.w = mx + (lay.x - this.x) * 2;
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