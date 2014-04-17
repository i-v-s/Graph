function int32(v)
{
	this.v = v;
}

function uint32(v)
{
	if(v < 0) v += 0x100000000;
	this.v = v;
}

uint32.prototype.int = function() {return this.v;}
uint32.prototype['+'] = function(v)
{
	return new uint32(this.v + v.int());
};

var i1 = new uint32(-1);
var i2 = new uint32(1);
var r = i1['+'](i2);

console.log(i1.int().toString(16) + "  " + i1.int());
console.log((~0 >> 1).toString(16));
// unsigned распространяется
/*
{
	int A = 0;
	int B = A + 3;

}
*/

RAM.A = new int(0);
RAM.B = new int(A['+'](3));

function CVM(code)
{
	var Syntax = {
		
		[
		["type name ;", declareVar],
		["type name = exp ;", declareVar],
		["type name ( arglist ) { statements }", defineFunc],
		[""]
	]};
	var namespace = {
		int:0, //int32
		char:0, //int8
		void:0
	};
	var nsStack = [namespace];
	var lxStack = [];
	for(var x in code)
	{
		var c = code(x);


	}
}