var CMenu =
{
    Root:null,
    Insert:function(id, label, onclick)
    {
        var fm = document.getElementById(id);
        var li = document.createElement("li");
        li.innerHTML = label;
        li.onclick = onclick;
        fm.appendChild(li);
    },
    InsertRec:function(r)
    {
        var fm = document.getElementById(r.path);
        var li = document.createElement("li");
        if(r.label === "-") 
            li.className = "msep";
        else 
            li.innerHTML = r.label;
        li.onclick = r.click;
        fm.appendChild(li);
    }
}

