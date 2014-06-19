"use strict";

function getXmlHttp()
{
	if(window.XMLHttpRequest) return new XMLHttpRequest();
    var xmlhttp;
    try {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
          xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (E) {xmlhttp = false;}
    }
    return xmlhttp;
}

var DB =
{
    HTTP:null,
    DBName:"GraphDB",
    LastName:null,
    LastUser:null,
    LastLocal:true,
    CurrentUser:null,
    Users:null,
    /////////// Работа с JSON /////////////////////////////////////////////////
    /*ItemToJSON: function(i)
    {
        return JSON.stringify(i, function(key, value)
        {
            if(key === "")
            {
                var vr = new Object();
                for(var x in value) if(value.hasOwnProperty(x) && typeof value[x] !== "function") vr[x] = value[x];
                if(!vr._) vr._ = value.constructor.name;
                return vr;
            }
            if(key == "_") return value;
            if(key.charAt(0) === '_') return undefined;
            if(value && typeof value == "object")
            {
                if(value instanceof Array)
                    return value;
                if(value.GetId) return value.GetId();
                var i = Items.indexOf(value);
                    return i < 0 ? value : i;
            }
            return value;
        });
    },*/
    GetJSON: function()
    {
        workspace.sheets["лист 1"] = Items;
        return JSON.stringify(workspace, function(key, value)
        {
        	if(key !== "_" && key.charAt(0) === '_') return undefined;
        	if(typeof value === "object" && value.ctor)
        	{
       			var r = {_:value.ctor};
       			for(var x in value) if(value.hasOwnProperty(x) && typeof value[x] !== "function") 
       				r[x] = value[x];
       			var dep = value.dep;
       			for(var x in dep)
       			{
       				var p = dep[x];
       				if(r[p] instanceof Array)
       				{
       					var s = r[p], d = [];
       					for(var y in s) d[y] = Main.GetId(s[y]);
       					r[p] = d;
       				}
       				else r[p] = Main.GetId(r[p]);
       			}
        		return r;       		
        	}
        	return value;
        });
    },
    LoadJSON: function(Text) 
    {
        var errors = [];
        Items = [];
        /*function rv(k, v)
        {
        	if(typeof v === "object" && typeof v._ === "string")
        	{
        		var r = new Main.Ctors[v._];
        		for(var x in v) if(x !== "_") r[x] = v[x];
        		return r;
        	}
        	return v;
        }*/
        ////////// Парсим JSON ////
        try{workspace = JSON.parse(Text);} catch(e) 
        {
            errors.push("JSON parse error: " + e.message);
            return;
        }
        ////////// Пересоздаём /////
        function recreate(v, par)
        {
        	function link(v, rn)
        	{
        		var r = null;
        		if(typeof rn === "number") r = par[rn];
        		else if(typeof rn === "string")
    			{
        	        var a = rn.split('.');
        	        for(var x in a)
        	        {
        	            if(x == 0) r = par[a[x]];
        	            else r = r.child(a[x]);
        	            if(!r) throw "Unrecognized id '" + rn + "'";
        	        }
    			}
        		if(r._der) r._der.push(v);
        		else r._der = [v];
        		return r;
        	}
        	if(typeof v === "object" && typeof v._ === "string")
        	{
        		var r = new Main.Ctors[v._]; // Пересоздаём
        		for(var x in v) if(x !== "_")
        		{
        			var t = v[x];
        			if(typeof t === "object") t = recreate(t, v);
        			r[x] = t ? t : v[x];
        		}
        		
        		
        		if(r.dep) for(var x in r.dep) // Линкуем
        		{
        			var d = r.dep[x];
        			if(r[d] instanceof Array) for(var y in r[d])
        				r[d][y] = link(r, r[d][y]);
        			else r[d] = link(r, r[d]);
        		}
        		
        		if(r.onLoad) r.onLoad(); // Уведомляем
        		return r;        		
        	}
        	else
        		for(var x in v) if(v[x] && typeof v[x] === "object") 
        		{
        			var t = recreate(v[x], v); 
        			if(t) v[x] = t;
        		}
        	return null;
        }
        recreate(workspace);
        
        
        
        
        Items = workspace.sheets["лист 1"];
        /*for(var i in Items) try
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
        }*/
        function toObj(o, id)
        {
        	var r = Main.ById(id);
        	if(!r._der) r._der = [o];
        	else r._der.push(o);
        	return r;
        }
        for(var i in Items) if(Items[i]) try 
        {
        	var r = Items[i];
    		var dep = r.dep;
    		if(dep) for(var x in dep)
    		{
    			var p = dep[x];
    			if(r[p] instanceof Array) for(var y in r[p]) r[p][y] = toObj(r, r[p][y]);
    			else r[p] = toObj(r, r[p]);
    		}

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
        Main.Redraw();
        return errors;
    },
    ////////////////////////// Локальное хранилище ///////////////////////////////////////////////////////////////////
    LocalSave: function(Name) {localStorage["graph_" + Name] = DB.GetJSON();},
    LocalLoad: function(Name) 
    {
        var v = localStorage["graph_" + Name];
        if(!v) return;
        var e = DB.LoadJSON(v);
        if(e && e.length > 0) alert("При загрузке произошли ошибки:\n" + e.join("\n"));
    },
    LocalList: function()
    {
        var r = [];
        for(var x in localStorage)
            if(x.substr(0, 6) == "graph_") r.push(x.substr(6));
        return r;
    },
    ///////////////////////// Удалённое хранилище ///////////////////////////////////
    RemoteSave: function(Name)
    {
        if(!DB.HTTP) DB.HTTP = getXmlHttp();
        var h = DB.HTTP;
        if(!h) {alert("Ошибка создания XMLHttpRequest."); return;}
        h.open("POST", "/g-put.php?file=" + Name, false);
        var text = DB.GetJSON();
        h.send(text);
    },
    RemoteLoad: function(User, Name)
    {
        if(!DB.HTTP) DB.HTTP = getXmlHttp();
        var h = DB.HTTP;
        if(!h) {alert("Ошибка создания XMLHttpRequest."); return;}
        var req = "/g-get.php?file=" + Name;
        if(User) req += "&user=" + User;
        h.open("GET", req, false);
        h.send(null);
        if(h.status != 200) {alert("Неверный ответ сервера:" + h.status); return;}
        var v = h.responseText;
        var e = DB.LoadJSON(v);
        if(e && e.length > 0) alert("При загрузке произошли ошибки:\n" + e.join("\n"));
    },
    RemoteList: function(User)
    {
        if(!DB.HTTP) DB.HTTP = getXmlHttp();
        var h = DB.HTTP;
        if(!h) {alert("Ошибка создания XMLHttpRequest."); return;}
        var r = "/g-list.php";
        if(User) r += "?user=" + User;
        h.open("GET", r, false);
        h.send(null);
        if(h.status != 200) {alert("Неверный ответ сервера:" + h.status); return;}
        var data;
        var text = h.responseText;
        if(text == "") return null;
        try{data = JSON.parse(text);} catch(e){alert("JSON parse error: " + e.message); return;}
        var r = [];
        for(var x in data) r.push(data[x].name);
        return r;
    },
    RemoteUsers: function()
    {
        if(!DB.HTTP) DB.HTTP = getXmlHttp();
        var h = DB.HTTP;
        if(!h) {console.log("Ошибка создания XMLHttpRequest."); return;}
        try
        {
            h.open("GET", "/g-users.php", false);
            h.send(null);
        } catch(e) {console.log("GET error: " + e.message); return;}
        if(h.status != 200) {console.log("Неверный ответ сервера:" + h.status); return;}
        var data;
        try{data = JSON.parse(h.responseText);} catch(e){console.log("JSON parse error: " + e.message); return;}
        DB.CurrentUser = data.shift();
        return data;
    },
    Save:function()
    {
        if(DB.LastLocal) DB.LocalSave(DB.LastName);
        else DB.RemoteSave(DB.LastName);
    },
    OnSaveButton: function()
    {
        var n = document.getElementById("savename").value;
        if(n == "") return;
        DB.LastName = n;
        var sl = document.getElementById("savelocal");
        DB.LastLocal = sl.checked;
        DB.Save();
        hideModal("savedialog");
    },
    OnLoadButton: function()
    {
        var n = document.getElementById("loadname").value;
        if(n == "") return;
        var u = document.getElementById("loaduser").value;
        if(u > 0) DB.RemoteLoad(u, n);
        else DB.LocalLoad(n);
        hideModal("loaddialog");
        DB.LastUser = u;
        DB.LastName = n;
        DB.LastLocal = (u == 0);
    },
    OnSaveAs:function()
    {
        document.getElementById("savename").value = DB.LastName ? DB.LastName : "";
        document.getElementById("savelocal").checked = DB.LastLocal;
        DB.OnSaveLocalChange();
        showModal("savedialog");
    },
    OnSaveLocalChange:function()
    {
        var options = document.getElementById("savelist");
        options.length = 0;
        var sl = document.getElementById("savelocal");
        var list;
        if(sl.checked) list = DB.LocalList();
        else
        {
            list = DB.RemoteList();
            if(!list) 
            {
                if(!DB.CurrentUser) alert("Для сохранения на сервере требуется авторизация.");
                sl.checked = true;
                return;
            }
        }
        for(var x in list)
        {
            var e = document.createElement("option");
            e.innerHTML = list[x];
            options.appendChild(e);
        }
    },
    OnSave: function()
    {
        if(DB.LastName) DB.Save();
        else DB.OnSaveAs();
    },
    OnOpenUserChange: function()
    {
        var options = document.getElementById("loadname");
        options.length = 0;
        var u = document.getElementById("loaduser").value;
        var list = u > 0 ? DB.RemoteList(u) : DB.LocalList();
        for(var x in list)
        {
            var e = document.createElement("option");
            e.innerHTML = list[x];
            options.appendChild(e);
        }
    },
    OnOpen:function()
    {
        DB.OnOpenUserChange();
        showModal("loaddialog");
    },
    OnInit: function()
    {
        if(CMenu)
        {
            CMenu.Add({file:
            {
                _1:{label: "-"},
                save:{label: "Сохранить", click:this.OnSave},
                saveas:{label: "Сохранить как", click:this.OnSaveAs},
                _2:{label: "-"},
                open:{label: "Открыть", click:this.OnOpen},
                lastfiles:{label: "Последние"}
            }});
        }
        if(location.protocol === "http:") DB.Users = DB.RemoteUsers();
        var options = document.getElementById("loaduser");
        options.length = 0;
        var e = document.createElement("option");
        e.text = "Локальный";
        e.value = 0;
        options.appendChild(e);            
        var users = DB.Users;
        if(users) for(var x in users)
        {
            var e = document.createElement("option");
            e.text = users[x].name;
            e.value = users[x].id;
            if(users[x].id == DB.CurrentUser) e.defaultSelected = true;
            options.appendChild(e);
        } else
        {
            var sl = document.getElementById("savelocal");
            sl.checked = true;
            sl.disabled = true;
            DB.LastLocal = true;
        }       
    }
};
Main.Modules.push(DB);
