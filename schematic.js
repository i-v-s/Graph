"use strict";
// Символы электронных элементов

(function()
{
	if(!workspace.componentLib) workspace.componentLib = {};
	var lib = workspace.componentLib;
	function Component()
	{
		this.x = 0;
		this.y = 0;
		this.M = [1, 0, 0, 1];
		
	}

	var compBase = 
	{
	    moveBy: function(dx, dy)
	    {
	        if(!this._mov)
	        {
	            this.x += dx;
	            this.y += dy;
	            this._mov = true;
	        }
	    },
		Hit: function(X, Y)
		{
			for(var t in Pins)
			{
				var p = GetPinPos(t);
				p.x -= X; p.y -= Y;
				if(Math.abs(p.x) < Main.adm && Math.abs(p.y) < Main.adm) return Pins[t];
			}
			X -= this.x; Y -= this.y;
    		var d = M[0] * M[3] - M[1] * M[2];
    		var A = X * d * M[3] + Y * -d * M[1];
    		var B = X * -d * M[2] + Y * d * M[0];
    		if(A > Def.l && A < Def.r && B > Def.t && B < Def.b) return this;
			return null;
		},
		RHit: function(l, t, r, b)
		{
			if(!Def) return false;
			var x = this.x, y = this.y;
			var a = Def.l * M[0] + Def.t * M[1] + x;
			if(a < l || a > r) return false; 
			a = Def.r * M[0] + Def.b * M[1] + x;
			if(a < l || a > r) return false; 

			var a = y - (Def.l * M[2] + Def.t * M[3]);
			if(a < t || a > b) return false; 
			a = y - (Def.r * M[2] + Def.b * M[3]);
			if(a < t || a > b) return false; 
			return true;
		},
	    Draw: function(Type)
	    {
	    	var color = (Type > 0 || this._sel) ? "#F00000" : "#800000";
	    	ctx.fillStyle = color;
	    	ctx.strokeStyle = color;

	    	if(Def) 
	    	{
	    		ctx.transform(M[0], M[1], M[2], M[3], this.x, this.y);
	    		Def.D();
	    		//var d = M[0] * M[3] - M[1] * M[2];
	    		//ctx.transform(d * M[3], -d * M[1], -d * M[2], d * M[0], 0, 0);
	            ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
	    	}
	    	for(var t in this.fields)
	    	{
	    		var f = this.fields[t];
	    		if(!f.t || f.h) continue;
	    		ctx.font = f.s.toString() + "px monospace";
	    		ctx.textBaseline = "middle";// top, bottom
	    		
	    		if(f.hp == 'C')	ctx.textAlign =  "center";
	    		else if(f.hp == 'L') ctx.textAlign =  "left";
	    		else if(f.hp == 'R') ctx.textAlign =  "right";
	    		
	    		var fx = this.x + f.x * M[0] + f.y * M[1];
	    		var fy = this.y - f.x * M[2] - f.y * M[3];
	    		if(f.v ^ (M[0] === 0.0)) 
	    		{
	    			//ctx.rotate(-Math.PI * 0.5);
		    		ctx.transform(0, -1.0, 1.0, 0, fx, fy);
	    			ctx.fillText(f.t, 0, 0);
		            ctx.setTransform(Main.Scale, 0, 0, Main.Scale, Main.OffsetX, Main.OffsetY);
	    		}
	    		else ctx.fillText(f.t, fx, fy);
	    		for(var x in Pins) if(MouseObject !== Pins[x]) Pins[x].Draw(0);
	    	};
	    }
	};
	Component.prototype = compBase;



})();