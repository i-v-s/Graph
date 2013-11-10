document.oncontextmenu = function (){return false};
var Pts = [new Point(10, 10), new Point(100, 30), new Point(30, 40)];
Items = [Pts[0], Pts[1], Pts[2], new Line(Pts[0], Pts[1]), new Line(Pts[1], Pts[2]), new Line(Pts[2], Pts[0])];
var p1 = new Point(200, 100), p2 = new Point(300, 150);
Items.push(p1, p2, new Arc(p1, p2, 90));

//var R = new Rect(200, 200, 50, 50, "Text");
//R.Store(Items);