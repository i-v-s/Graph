db = openDatabase("GraphDB", "0.1", "A db of blockscheme.", 20000);
if(!db) {alert("Failed to connect to database.");}
db.transaction(function(tx)
    {
        tx.executeSql("SELECT COUNT(*) FROM ToDo", [], function (result) { alert('dsfsdf') },
            function (tx, error)
            {
                tx.executeSql("CREATE TABLE Scheme1 (id REAL UNIQUE, class TEXT, data TEXT, timestamp REAL)", [], null, null);
            })
    });
//var b = JSON.stringify(Items,);
for(var x = 0, e = Items.length; x < e; x++)
{
    var i = Items[x];
    var a = i.Serialize ? i.Serialize() : JSON.stringify(i, function(key, value)
    {
        if(key == "Moved" || key == "Sel") return undefined;
        if(value && typeof value == "object") return Items.indexOf(value);
            //for(y = 0; y < x; y++) if(Items[y] === value) return y;
        return value;
    });
    var c = Items[x].constructor.name;
    console.log(c + "(" + a + ")");
    db.transaction(function(tx) {
        tx.executeSql("INSERT INTO Scheme1 (class, data) values(?, ?)", [c, a], null, null);
    });
}
