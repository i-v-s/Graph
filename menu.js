var CMenu =
{
    Root:null,
    Add:function(o, r)
    {
        if(!r) r = this.Root;
        for(var i in o) if(o.hasOwnProperty(i) && i != "label" && i != "click")
        {
            var id = "menu" + i;
            var li = null;
            if(i != "_")for(var t in r.children) 
                if(r.children[t].id == id) 
                    {
                        li = r.children[t];
                        break;
                    }
            if(!li)
            {
                li = document.createElement("li");
                li.innerHTML = o[i].label;
                if(i != "_") li.id = id;
                li.onclick = o[i].click;
                r.appendChild(li);
            }
            var o2 = o[i];
            for(var g in o2) if(o2.hasOwnProperty(g) && g != "label" && g != "click")
            {
                var ul = li.getElementsByTagName('ul')[0];
                if(!ul)
                {
                    var ul = document.createElement("ul");
                    li.appendChild(ul);
                }
                this.Add(o2, ul);
                break;
            }

        }


    }

}

CMenu.Root = document.getElementById("mainmenu");