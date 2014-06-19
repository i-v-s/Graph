
(function ()
{
	var tn2313 = 
	{
		ctor: function(fields, n)
		{
			//var n1 = nodes[1], n2 = nodes[2];
			if(typeof AVR === "undefined") importScripts("avrsim.js");
			var avr = new AVR("ATtiny2313");
			var hex = ":020000020000FC";
			hex += ":0200000027C017";
			hex += ":10001A0000C0DF9A15B01D9217FCDF9843954E3742";
			hex += ":10002A0089F4DF98442746B9A0E6E199FECF4EBB92";
			hex += ":10003A001D901DBA00240CBAE29AE19A43954E37F4";
			hex += ":10004A00A1F701C018950FED0DBFB898C09ADF98B7";
			hex += ":10005A00C298D79ABA9A4427BB27A0E652E000244E";
			hex += ":10006A00112422240A94F1F71A94E1F72A94D1F779";
			hex += ":10007A0000241124B099FECF00980BEA06B900E1DA";
			hex += ":0C008A0003B900E807B9369A7894FFCF5C";
			hex += ":00000001FF";
			avr.LoadIntelHex(hex);
			
			var b = avr.build();
			if(b.t) console.log(b.t);
			if(b.e && b.e.length) 
				for(var i in b.e)
					console.log(b.e[i]);
			avr.Reset();
			this.onStep = function(X, t)
			{
				if(!avr.run) avr.build();
				avr.run(t * 1000000);
			};

		},
		nodes: {},
	};
	var n = tn2313.nodes;
	for(var x = 1; x <= 20; x++) n[x] = null;
	
	schematic.models["ATTINY2313A-S"] = tn2313; 


})();