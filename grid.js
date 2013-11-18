var Grid = {
    MainClear: Main.Clear,
    MainRedraw: Main.Redraw,
    MAM: null,
    Step:20,
    Draw: function()
    {
        Grid.MainClear();
        var w = canvas.width, h = canvas.height;
        ctx.beginPath();
        var x;
        var os = 1 / Main.Scale;
        ctx.lineWidth = 0.5;
        var step = Grid.Step;
        for(x = Math.ceil(-Main.OffsetX / (step * Main.Scale)) * step; x * Main.Scale + Main.OffsetX < w; x += step)
        {
            ctx.moveTo(x, -Main.OffsetY * os);
            ctx.lineTo(x, (h - Main.OffsetY) * os);
        }
        for(x = Math.ceil(-Main.OffsetY / (step * Main.Scale)) * step; x * Main.Scale + Main.OffsetY < h; x += step)
        {
            ctx.moveTo(-Main.OffsetX * os, x);
            ctx.lineTo((w - Main.OffsetX) * os, x);
        }
        ctx.strokeStyle = "#808080";
        ctx.stroke();
        ctx.lineWidth = 1.0;
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    OnAlignedMove: function(x, y)
    {
        Grid.MAM(x, y);
        if(!MouseObject)
        {
            x = Math.ceil(x / Grid.Step - 1) * Grid.Step;
            y = Math.ceil(y / Grid.Step - 1) * Grid.Step;
            if(x != Main.MX || y != Main.MY) Main.NeedRedraw = true;
            Main.MX = x;
            Main.MY = y;
        }
    },
    Redraw: function()
    {
        Grid.MainRedraw();
        if(!MouseObject)
        {
            var x = Main.MX;
            var y = Main.MY;
            ctx.beginPath();
            var s = 3;
            ctx.moveTo(x, y - s);
            ctx.lineTo(x, y + s);
            ctx.moveTo(x - s, y);
            ctx.lineTo(x + s, y);
            ctx.strokeStyle = "#008000";
            ctx.stroke();
        }

    }
}

Main.Clear = Grid.Draw;
Grid.MAM = Main.OnAlignedMove;
Main.OnAlignedMove = Grid.OnAlignedMove;
States.free.redraw = Grid.Redraw;