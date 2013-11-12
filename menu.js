var CMenu =
{
    file:
    {
        label:"Файл"


    },
    edit:
    {
        label:"Правка"/*,
        delete:{
            label:"Удалить",
            onclick:Main.Delete
        }*/
    },
    create:
    {
        label:"Создать"
    },
    isEmpty: function(i)
    {
        for(var y in i) if(i.hasOwnProperty(y) && y != "label" && typeof i[y] != "function")
            return false;
        return true;
    }
}

function DojoMenu()
{
    require([
        "dijit/Menu",
        "dijit/MenuItem",
        "dijit/MenuBar",
        "dijit/MenuBarItem",
        "dijit/PopupMenuBarItem",
        "dijit/MenuSeparator",
        "dojo/domReady!"
    ], function(Menu, MenuItem, MenuBar, MenuBarItem, PopupMenuBarItem, MenuSeparator)
    {
        // create the Menu container
        var mainMenu = new MenuBar({}, "mainMenu");
        var x = 0;
        var p = CMenu;
        var m = mainMenu;
        for(var x in CMenu) if(CMenu.hasOwnProperty(x) && typeof CMenu[x] != "function")
        {
            var p = CMenu[x];
            var s = {id: x, label: p.label};
            if(p.onclick) s.onClick = p.onclick;
            var sm = null;
            for(var y in p) if(p.hasOwnProperty(y) && y != "label" && typeof p[y] != "function")
            {
                var pp = p[y];
                if(!s.popup) s.popup = new Menu({id: x + "Menu"});
                if(pp == "-")
                    s.popup.addChild(new MenuSeparator());
                else
                {
                    var ss = {id: y, label: pp.label};
                    if(pp.onclick) ss.onClick = pp.onclick;
                    s.popup.addChild(new MenuItem(ss));
                }
            }
            m.addChild(s.popup ? new PopupMenuBarItem(s) : new MenuBarItem(s));
            if(s.popup) s.popup.startup();
        }
        mainMenu.startup();
    });
}


Main.CreateMenu = function(menu, id, name, handler)
{
    require([
        "dojo/dom",
        "dojo/parser",
        "dijit/registry",
        "dijit/Menu",
        "dijit/MenuItem"],
        function(dom, parser, registry, Menu, MenuItem){
            var i = {id: id, label: name};
            var mi = new MenuItem(i);
            var m = registry.byId(menu);
            m.addChild(mi);

        });
}
DojoMenu();