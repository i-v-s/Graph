function AVR(Model)
{
	var RAM, ROM;
	if(Model == "ATtiny2313") 
	{
		RAM = new Array(32 + 64 + 128); // R + IO + RAM 
		ROM = new Array(1024);
	}
	else return null;
	function Ins(Name, Code, Flag, Func)
	{
		return {N:Name, C:Code, F:Flag, E:Func};
	}
	var Ctr = 0; 			// Счётчик циклов
	var PC = 0;		// Указатель на инструкцию
	var C = 0, N = 0, Z = 0, I = 0, S = 0, V = 0, T = 0, H = 0; 	// Флаги
	var Flags = "ITHSVNZC";
	for(var x in RAM) RAM[x] = 0;
	var SetF = function(Code)   
	{
		return Flags.charAt((Code >> 4) & 0x7) + (Code & 0x80) ? " = true;" : " = false;";
	};
	function SetFlags(t)
	{
		var F = RAM[0x5F];
		F &= 0x8;
		if(t) F &= ~2; else F |= 2;
		if(t & 0x80) F |= 0x4; else F &= ~0x4;
		RAM[0x5F] = F;
	}
	function Ret(Code)
	{
		var SP = RAM[0x5D] + (RAM[0x5E] << 8);
		SP += 2;
		RAM[0x5D] = SP & 0xFF;
		RAM[0x5E] = (SP >> 8) & 0xFF;
		PC = RAM[SP] + (RAM[SP + 1] << 8);
		if(Code & 0x10) RAM[0x5F] |= 0x80;
		Ctr += 3;
	}
	function GetZ() {return RAM[30] + (RAM[31] << 8);}
	function GetRAM(a) {return RAM[a];}
	function rGetRAM(a) {return "RAM[" + ((typeof a === "number") ? "0x" + a.toString(16) : a) + "]";}
	function SetRAM(a, v) {RAM[a] = v;}
	function rSetRAM(a, v)
	{
		if(a == 0x5F)
		{
			var r = "";
			for(var x = 0; x < 8; x++)
				r += Flags.charAt(x) + " = " + ((1 << x) & v) ? "true" : "false";
		}
		if(typeof a === "number") a = "0x" + a.toString(16);
		return "RAM[" + a + "] = " + v + ";";
	}
	function SetBI(Code)
	{
		var a = 0x20 + ((Code >> 3) & 0x1F);
		var v = rGetRAM(a);
		var m = 1 << (Code & 7);
		return rSetRAM(a, (Code & 0x200) ? v + " | 0x" + m.toString(16) : (v + " & 0x" + (0xFF ^ m).toString(16)));
	}
	function EOR(Code)
	{
		var d = 0x1F & (Code >> 4);
		var r = (Code & 0xF) | ((Code >> 5) & 0x10);
		var o = "t = RAM[" + d + "] ^= RAM[" + r + "]; ";
		o += "V = false; Z = !t; S = N = t > 0x80;";
		//var F = RAM[0x5F];
		//F &= 0x8;
		//if(t) F &= ~2; else F |= 2;
		//if(t & 0x80) F |= 0x14; else F &= ~0x14;
		//RAM[0x5F] = F;
		return o;
	}
	function BRxx(Code, Stack)
	{
		var o = 0x7F & (Code >> 3);
		Stack.push(PC);
		PC += o;
		if(o & 0x40) PC -= 0x80;   
		return "{PC = 0x" + PC.toString(16) + ";Ctr++; continue;}";
	}
	var ISET = [
	    {Syntax: "O", Items:
	    	[
	        Ins("nop",   0x0000, 		  0, function(){}),
	        Ins("sec",   0x9408, 		  0, SetF),
	        Ins("clc",   0x9488, 		  0, SetF),
	        Ins("sen",   0x9428, 		  0, SetF),
	        Ins("cln",   0x94a8, 		  0, SetF),
	        Ins("sez",   0x9418,          0, SetF),
	        Ins("clz",   0x9498,          0, SetF),
	        Ins("sei",   0x9478,          0, SetF),
	        Ins("cli",   0x94f8,          0, SetF),
	        Ins("ses",   0x9448,          0, SetF),
	        Ins("cls",   0x94c8,          0, SetF),
	        Ins("sev",   0x9438,          0, SetF),
	        Ins("clv",   0x94b8,          0, SetF),
	        Ins("set",   0x9468,          0, SetF),
	        Ins("clt",   0x94e8,          0, SetF),
	        Ins("seh",   0x9458,          0, SetF),
	        Ins("clh",   0x94d8,          0, SetF),
	        Ins("sleep", 0x9588,          0, function(){}),
	        Ins("wdr",   0x95a8,          0, function(){}),
	        Ins("ijmp",  0x9409, "TINY1X", function(){PC = GetZ(); Ctr++;}),
	        Ins("eijmp", 0x9419, "NO_EIJMP",function(){PC = GetZ() + (EIND << 16); Ctr++;}),
	        Ins("icall", 0x9509, "TINY1X", function(){}),
	        Ins("eicall",0x9519, "NO_EICALL", function(){}),
	        Ins("ret",   0x9508,          0, Ret),
	        Ins("reti",  0x9518,          0, Ret),
	        Ins("spm",   0x95e8, "NO_SPM", function(){}),
	        Ins("espm",  0x95f8, "NO_ESPM", function(){}),
	        Ins("break", 0x9598, "NO_BREAK", function(){}),
	        Ins("lpm",   0x95c8, "NO_LPM", function(){RAM[0] = ROM[GetZ()]; Ctr += 2;}),
	        Ins("elpm",  0x95d8, "NO_ELPM", function(){})
	        ]},
		{Syntax: "O s", s:0x70, Items:
			[	        
		    Ins("bset",  0x9408,          0, SetF),
		    Ins("bclr",  0x9488,          0, SetF)
		    ]},
		{Syntax: "O l", l:0x0FFF, Items:
			[
			Ins("rjmp",  0xC000, 0, function(Code)
			{
				var o = Code & 0x0FFF;
				if(o & 0x800) o -= 0x1000;
				PC += o;
				return "PC = 0x" + PC.toString(16) + "; continue;";
			}) 
			 
			]},
		{Syntax: "O r, i", i:0x0F0F, r:0x00F0, Items:
			[
			Ins("ldi", 0xE000, 0, "RAM[`16 | 0xF & (Code >> 4)`] = `Code & 0xF | 0xF0 & (Code >> 4)`;")
			]},
		{Syntax: "O p, r", p:0x060F, r:0x01F0, Items:
			[
			Ins("out", 0xB800, 0, "`rSetRAM(0x20 + (Code & 0xF | ((Code & 0x600) >> 5)), 'RAM[' + ((Code >> 4) & 0x1F) + ']')`")	
			]},
		{Syntax: "O p, b", p:0x00F8, b:0x7, Items:
			[
			Ins("cbi", 0x9800, 0, SetBI),
			Ins("sbi", 0x9A00, 0, SetBI)
			]},
		{Syntax: "O d, r", d:0x1F0, r:0x20F, Items:
			[
			Ins("eor", 0x2400, 0, EOR)
			 
			]},
		{Syntax: "O r", r:0x1F0, Items:
			[
			Ins("inc", 0x9403, 0, function(Code){SetFlags(RAM[(Code >> 4) & 0x1F]++);}),
			Ins("dec", 0x940A, 0, function(Code)
				{
					var a = (Code >> 4) & 0x1F; 
					var r = "t = RAM[" + a + "] - 1; if(t < 0) t += 256; RAM[" + a + "] = t;"; 
					r += "Z = !t; N = t > 0x80; V = t === 0x7F; S = N ^ V;";
					return r;
				})
			]},
		{Syntax: "O l", l:0x03F8, Items:
			[
			Ins("brne", 0xF401, 0, "if(!Z)`BRxx(Code, Stack)`;"), 
			Ins("breq", 0xF001, 0, "if(Z)`BRxx(Code)`;") 
			]}
	];
	for(var i in ISET)
	{
		var m = 0xFFFF;
		for(var j in ISET[i]) if(j != "Syntax" && j != "Items") m &= ~ISET[i][j];
		ISET[i].m = m;
	}
	                                      
	this.GetRAM = function(){ return RAM;};
	this.GetROM = function(){ return ROM;};
	this.GetPC = function(){return PC;};
	this.SetPC = function(pc){PC = pc;};
	this.GetCycles = function(){return Ctr;};
	this.LoadIntelHex = function(Hex)
	{
		for(var i = 0, len = Hex.length; i < len; i++)
		{
			if(Hex.charAt(i) == ':')
			{
				var l = parseInt(Hex.substring(i + 1, i + 3), 16);
				var a = parseInt(Hex.substring(i + 3, i + 7), 16) >> 1;
				var t = parseInt(Hex.substring(i + 7, i + 9), 16);
				i += 9;
				if(t === 0) for(; l > 0; i += 4, a++, l -= 2)
					ROM[a] = parseInt(Hex.substring(i, i + 2), 16) | (parseInt(Hex.substring(i + 2, i + 4), 16) << 8); 
				else i += l * 2;
				i++;
			}
		}
		
	};
	function FindOp(Code)
	{
		for(var i in ISET)
		{
			var iset = ISET[i];
			var c = Code & iset.m;
			for(var j in iset.Items) 
				if(iset.Items[j].C === c)
					return iset.Items[j];
		}
		return null;
	};
	this.Disasm = function(Addr)
	{
		var Code = ROM[Addr];
		
	};
	this.Build = function() // Строим JS функцию из массива ROM
	{
		Data = [];
		var Stack = [0];
		var errors = [];
		while(Stack.length)
		{
			PC = Stack.pop();
			if(Data[PC] && Data[PC].e) continue;
			var pc = PC;
			var op, Code = ROM[PC++];
			if(op = FindOp(Code)) // Если нашли код, то пытаемся собрать выражение для инструкции,
			{
				var exp = "";
				if(typeof op.E === "function") exp = op.E(Code); // вызывая функцию
				else 
				{ // или из строки.		
					var y = 0, m = false;
					for(var t = op.E, l = t.length, x = 0; x < l; x++)
					{
						var c = t.charAt(x);
						if(c === "`")
						{
							if(y < x) 
							{
								var v = t.substring(y, x);
								exp += m ? eval(v) : v;
							}
							y = x + 1;
							m = !m;
						}
					}
					if(y < x) {var v = t.substring(y, x); exp += m ? eval(v) : v;}
				}
				if(!exp) {errors.push(pc.toString(16) + ": Code " + Code.toString(16) + " ("+ op.N + ") undefined exp!"); PC = null;continue;}
				if(!Data[pc]) Data[pc] = {l: false, e: exp};
				else Data[pc].e = exp;
				//var text = pc.toString(16) + ": " + exp;
				//console.log(text);
				if(PC !== pc + 1 && PC !== null) 
				{ 
					if(!Data[PC]) Data[PC] = {e:null, l:true};
					else Data[PC].l = true;
				}  
			}
			else {errors.push(pc.toString(16) + ": Code " + Code.toString(16) + " not found!"); PC = null;continue;}
			if(PC != null) Stack.push(PC);
		}
		var Text = "this.Runf = function(){var t; PC = 0; main: while(1) switch(PC){\n";
		Data[0].l = true; 
		for(var x in Data)
		{
			if(Data[x].l) Text += "case 0x" + parseInt(x).toString(16) + ":";
			if(Data[x].e) Text += Data[x].e + "\n";
		}
		Text += "break main;}}";
		eval(Text);
		return {e:errors ? errors : undefined, d:Data, t:Text};
	};
	this.DataRun = function(Data, Time)
	{
		Ctr = 0;
		PC = 0;
		while(Ctr++ < Time)
		{
			var exp = Data[PC++].e;
			eval("do{" + exp + "}while(0);");
		}
		
	};
	this.Run = function(Time)
	{
		//RAM[0x5F] = 0;
		do
		{
			var op, Code = ROM[PC];
			if(op = FindOp(Code))
			{
				Ctr++;
				//document.body.appendChild(document.createElement("br"));
				//document.body.appendChild(document.createTextNode("" + PC + " " + op.N));
				PC++;
				op.E(Code);
				//for(var x = 0; x < 32; x++) if(RAM[x] !== undefined) document.body.appendChild(document.createTextNode(" R" + x + " = " + RAM[x].toString(16) + "  "));
				//document.body.appendChild(document.createTextNode(" F = " + RAM[0x5F].toString(16) + "  "));
				
			}
			else {PC--; return "Code " + Code.toString(16) + " not found!";}
		} while(Time > Ctr);
		return null;
	};
	return this;
}

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

var avr = new AVR("ATtiny2313");
avr.LoadIntelHex(hex);

var b = avr.Build();
if(b.e && b.e.length) 
	for(i in b.e)
		console.log(b.e[i]);
if(b.t) console.log(b.t);
avr.Runf();
console.log("Completed");

//avr.DataRun(b.d, 5000000);
//var e = avr.Run(5000000);
//var ram = avr.GetRAM();

/*for(var x = 0; x < ram.length; x++)
	if(ram[x] !== undefined)
	document.body.appendChild(document.createTextNode("R" + x + " = " + ram[x].toString(16) + "  "));
if(e) document.body.appendChild(document.createTextNode(e + "  "));
var text = "PC = " + avr.GetPC();
text += ", Ctr = " + avr.GetCycles();
document.body.appendChild(document.createTextNode(text));*/

