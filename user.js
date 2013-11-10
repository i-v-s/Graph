document.oncontextmenu = function (){return false};
var Pts = [new Point({x:10, y:10}), new Point({x:100, y:30}), new Point({x:30, y:40})];
Items = [Pts[0], Pts[1], Pts[2], new Line({p1:Pts[0], p2:Pts[1]}), new Line({p1:Pts[1], p2:Pts[2]}), new Line({p1:Pts[2], p2:Pts[0]})];
var p1 = new Point({x:200, y:100}), p2 = new Point({x:300, y:150});
Items.push(p1, p2, new Arc(p1, p2, 90));

//var R = new Rect(200, 200, 50, 50, "Text");
//R.Store(Items);