function getXmlHttp()
{
    var xmlhttp;
    try {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
          xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (E) {xmlhttp = false;}
    }
    if (!xmlhttp && typeof XMLHttpRequest != 'undefined') xmlhttp = new XMLHttpRequest();
    return xmlhttp;
}

var DB =
{
    DBName:"GraphDB",
    LastName:null,
    GetJSON: function()
    {
        var a = [];
        for(var x in Items)
        {
            var i = Items[x];
            a[x] = JSON.stringify(i, function(key, value)
            {
                if(key === "")
                {
                    var vr = new Object();
                    for(var x in value) if(value.hasOwnProperty(x) && typeof value[x] !== "function") vr[x] = value[x];
                    if(!vr._) vr._ = value.constructor.name;
                    return vr;
                }
                if(key == "_") return value;
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
        };
        return("[" + a.join(',\n') + "]");
    },
    LoadJSON: function(Text) 
    {
        var errors = [];
        Items = [];
        try{Items = JSON.parse(Text);} catch(e)
        {
            errors.push("JSON parse error: " + e.message);
            return;
        }
        for(var i in Items) try
        {
            var data = Items[i];           
            var item = new Main.Ctors[data._];
            for(var x in data) if(data.hasOwnProperty(x) && x !== "_") item[x] = data[x];
            Items[i] = item;
        }
        catch(e)
        {
            errors.push("Error creating object " + i + " [class: '" + Items[i]._ + "', data: '" + JSON.stringify(Items[i]) +"']: "+ e.message);
            Items[i] = undefined;
        }
        for(var i in Items) if(Items[i]) try 
        {
            if(Items[i].OnLoad && !Items[i].OnLoad())
            {
                errors.push("Error in object " + i + " [class: '" + Items[i].constructor.name + "', data: '" + JSON.stringify(Items[i]) +"']: OnLoad() failed");
                Items[i] = undefined;
            }
        } 
        catch(e) 
        {
            errors.push("Error in object .OnLoad " + i + " [class: '" + Items[i].constructor.name + "']: "+ e.message);
            Items[i] = undefined; 
        }
        var r = 0;
        for(var i = 0, l = Items.length; i < l; i++) if(Items[i]) Items[r++] = Items[i];
        Items.length = r;
        //for(e in errors) console.log(errors[e]);
        return errors;
    },
    Save: function(DBName, Table)
    {
        var db = openDatabase(DBName, "0.1", "A db of blockscheme.", 20000);
        if(!db) {alert("Failed to connect to database."); return;}
        db.transaction(function(tx)
        {
            tx.executeSql("DROP TABLE IF EXISTS " + Table, [], null, null)
            tx.executeSql("CREATE TABLE " + Table + " (id REAL UNIQUE, data TEXT, timestamp REAL)", [], null, null);

            tx.executeSql("DELETE FROM " + Table, [], null, null);
            var r = DB.GetJSON();
            console.log(r);
            tx.executeSql("INSERT INTO " + Table + " (data) values(?)", [r], null, null);
        })
    },
    Load: function(DBName, Table)
    {
        var db = openDatabase(DBName, "0.1", "A db of blockscheme.", 20000);
        if(!db) {alert("Failed to connect to database."); return;}
        db.transaction(function(tx)
        {
            tx.executeSql("SELECT * FROM " + Table, [], function(tx, result)
            {
                var errors = DB.LoadJSON(result.rows.item(0).data);
                if(errors.length > 0) alert("При загрузке произошли ошибки:\n" + errors.join("\n"));
                Main.Redraw();
            }, null);
        })
    },
    OnSaveButton: function()
    {
        var n = document.getElementById("savename").value;
        if(n == "") return;
        DB.LastName = n;
        DB.Save(DB.DBName, n);
        hideSaveDialog();
    },
    OnLoadButton: function()
    {
        var n = document.getElementById("loadname").value;
        if(n == "") return;
        DB.LastName = n;
        DB.Load(DB.DBName, n);
        hideLoadDialog();
    },
    OnRemLoadButton: function()
    {
        var n = document.getElementById("loadname").value;
        if(n == "") return;
        DB.LastName = n;
        var h = getXmlHttp();
        if(!h) {alert("Ошибка создания XMLHttpRequest."); return;}
        h.open("GET", "/g-get.php?file=" + n, false);
        h.send(null);
        if(h.status != 200) alert("Неверный ответ сервера:" + h.status);
        var errors = LoadJSON(h.responseText);
        if(errors.length > 0) alert("При загрузке произошли ошибки:\n" + errors.join("\n"));
        Main.Redraw();
        hideLoadDialog();
    },
    OnInit: function()
    {
        if(CMenu)
        {
            if(!CMenu.isEmpty(CMenu.file)) CMenu.file.ldbsep = "-";
            CMenu.file.locsave = {label:"Сохранить в браузере", onclick:function()
            {
                if(DB.LastName) document.getElementById("savename").value = DB.LastName;
                var db = openDatabase(DB.DBName, "0.1", "A db of blockscheme.", 20000);
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
                OnSaveButton = DB.OnSaveButton;
                showSaveDialog();
            }};
            CMenu.file.locload = {label:"Загрузить из браузера", onclick:function()
            {
                var db = openDatabase(DB.DBName, "0.1", "A db of blockscheme.", 20000);
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

                OnLoadButton = DB.OnLoadButton;
                showLoadDialog();
            }};
            CMenu.file.remload = {label:"Загрузить с сервера", onclick:function() 
            {
                var h = getXmlHttp();
                if(!h) {alert("Ошибка создания XMLHttpRequest."); return;}
                h.open("GET", "/g-list.php", false);
                h.send(null);
                if(h.status != 200) alert("Неверный ответ сервера:" + h.status);
                var data;
                try{data = JSON.parse(h.responseText);} catch(e)
                {
                    alert("JSON parse error: " + e.message);
                    return;
                }
                var s = document.getElementById("loadname").options;
                s.length = 0;
                for(var i in data)
                {
                    var name = data[i].name;
                    s.add(new Option(name, name));
                }
                OnLoadButton = DB.OnRemLoadButton;
                showLoadDialog();
            }};
        }
    }
}
Main.Modules.push(DB);