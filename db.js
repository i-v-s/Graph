var LocDB =
{
    Save: function(DB, Table)
    {
        var db = openDatabase(DB, "0.1", "A db of blockscheme.", 20000);
        if(!db) {alert("Failed to connect to database."); return;}
        db.transaction(function(tx)
        {
            tx.executeSql("DROP TABLE IF EXISTS " + Table, [], null, null)
            tx.executeSql("CREATE TABLE " + Table + " (id REAL UNIQUE, class TEXT, data TEXT, timestamp REAL)", [], null, null);

            tx.executeSql("DELETE FROM " + Table, [], null, null);
            for(var x = 0, e = Items.length; x < e; x++)
            {
                var i = Items[x];
                var a = i.Serialize ? i.Serialize() : JSON.stringify(i, function(key, value)
                {
                    if(key == "Moved" || key == "Sel") return undefined;
                    if(value && typeof value == "object") return Items.indexOf(value);
                    return value;
                });
                var c = Items[x].constructor.name;
                console.log(c + "(" + a + ")");
                tx.executeSql("INSERT INTO " + Table + " (class, data) values(?, ?)", [c, a], null, null);
            };
        })
    },
    Load: function(DB, Table)
    {
        var db = openDatabase(DB, "0.1", "A db of blockscheme.", 20000);
        if(!db) {alert("Failed to connect to database."); return;}
        db.transaction(function(tx)
        {
            tx.executeSql("SELECT * FROM " + Table, [], function(tx, result)
            {
                var l = result.rows.length;
                Items.length = l;
                for(var i = 0; i < l; i++)
                {
                    var row = result.rows.item(i);
                    Items[i] = eval("new " + row['class'] + "(" + row['data'] + ")");
                    //document.write('<b>' + ['label'] + '</b><br />');
                }
                Main.Redraw();
            }, null);
        })
    },
    OnSaveButton:function()
    {
        var s = document.getElementById("savename");
        LocDB.Save("GraphDB", s.value);
        hideSaveDialog();
    },
    OnInit: function()
    {
        if(CMenu)
        {
            if(!CMenu.isEmpty(CMenu.file)) CMenu.file.ldbsep = "-";
            CMenu.file.locsave = {label:"Сохранить в браузере", onclick:function()
            {
                OnSaveButton = LocDB.OnSaveButton;
                showSaveDialog();
            }};
            CMenu.file.locload = {label:"Загрузить из браузера"};
        }
    }
}
Main.Modules.push(LocDB);