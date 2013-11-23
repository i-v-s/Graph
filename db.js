var LocDB =
{
    DBName:"GraphDB",
    LastName:null,
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
                var a = /*i.Serialize ? i.Serialize() :*/ JSON.stringify(i, function(key, value)
                {
                    if(key === "") return value;
                    if(key == "Moved" || key == "Sel" || key.charAt(0) === '_') return undefined;
                    if(value && typeof value == "object")
                    {
                        if(value instanceof Array)
                            return value;
                        if(value.GetId) return value.GetId();
                        var i = Items.indexOf(value);
                        return i < 0 ? undefined : i;
                    }
                    return value;
                });
                var c = Items[x].constructor.name;
                //console.log(c + "(" + a + ")");
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
                var errors = [];
                for(var i = 0; i < l; i++)
                {
                    var row = result.rows.item(i);
                    try
                    {
                        var item = new Main.Ctors[row.class];
                        var data = JSON.parse(row.data);
                        for(var x in data) if(data.hasOwnProperty(x)) item[x] = data[x];
                        Items[i] = item;
                    }
                    catch(e)
                    {
                        Items[i] = undefined;
                        errors.push("Error parsing object " + i + " [class: '" + row['class'] + "', data: '" + row["data"] +"']: "+ e.message);
                    }
                }
                for(var i = 0; i < l; i++) if(Items[i])
                try {
                    if(Items[i].OnLoad && !Items[i].OnLoad())
                    {
                        errors.push("Error in object " + i + " [class: '" + Items[i].constructor.name + "', data: '" + result.rows.item(i).data +"']: OnLoad() failed");
                        Items[i] = undefined;
                        continue;
                    }
                } catch(e) 
                {
                    Items[i] = undefined; 
                    errors.push("Error in object .OnLoad " + i + " [class: '" + row['class'] + "', data: '" + row["data"] +"']: "+ e.message);
                }
                var r = 0;
                for(var i = 0; i < l; i++) if(Items[i]) Items[r++] = Items[i];
                Items.length = r;
                for(e in errors) console.log(errors[e]);
                Main.Redraw();
            }, null);
        })
    },
    OnSaveButton: function()
    {
        var n = document.getElementById("savename").value;
        if(n == "") return;
        LocDB.LastName = n;
        LocDB.Save(LocDB.DBName, n);
        hideSaveDialog();
    },
    OnLoadButton: function()
    {
        var n = document.getElementById("loadname").value;
        if(n == "") return;
        LocDB.LastName = n;
        LocDB.Load(LocDB.DBName, n);
        hideLoadDialog();
    },
    OnInit: function()
    {
        if(CMenu)
        {
            if(!CMenu.isEmpty(CMenu.file)) CMenu.file.ldbsep = "-";
            CMenu.file.locsave = {label:"Сохранить в браузере", onclick:function()
            {
                if(LocDB.LastName) document.getElementById("savename").value = LocDB.LastName;
                var db = openDatabase(LocDB.DBName, "0.1", "A db of blockscheme.", 20000);
                if(!db) {alert("Failed to connect to database."); return;}
                db.transaction(function(tx)
                {
                    tx.executeSql("select name from sqlite_master where type = 'table' ORDER BY name", [], function(tx, result)
                    {
                        var l = result.rows.length;
                        require(["dijit/registry"], function(registry){
                            var v = registry.byId('savename').store.data;
                            v.length = 0;
                            for(var i = 0; i < l; i++)
                            {
                                var name = result.rows.item(i).name;
                                if(name.charAt(0) == '_') continue;
                                v.push({id:name, name:name, value:name});
                            }
                        });
                    }, null);
                })
                OnSaveButton = LocDB.OnSaveButton;
                showSaveDialog();
            }};
            CMenu.file.locload = {label:"Загрузить из браузера", onclick:function()
            {
                var db = openDatabase(LocDB.DBName, "0.1", "A db of blockscheme.", 20000);
                if(!db) {alert("Failed to connect to database."); return;}

                db.transaction(function(tx)
                {
                    tx.executeSql("select name from sqlite_master where type = 'table' ORDER BY name", [], function(tx, result)
                    {
                        var l = result.rows.length;
                        var s = document.getElementById("loadname").options;
                        s.length = 0;
                        for(var i = 0; i < l; i++)
                        {
                            var name = result.rows.item(i).name;
                            if(name.charAt(0) == '_') continue;
                            s.add(new Option(name, name));
                        }
                    }, null);
                })

                OnLoadButton = LocDB.OnLoadButton;
                showLoadDialog();
            }};
        }
    }
}
Main.Modules.push(LocDB);