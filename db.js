db = openDatabase("GraphDB", "0.1", "A db of blockscheme.", 20000);
if(!db) {alert("Failed to connect to database.");}
db.transaction(function(tx) {
    tx.executeSql("SELECT COUNT(*) FROM ToDo", [], function (result) { alert('dsfsdf') }, function (tx, error) {
        tx.executeSql("CREATE TABLE Scheme (id REAL UNIQUE, label TEXT, timestamp REAL)", [], null, null);
    })});

db.transaction(function(tx) {
    tx.executeSql("INSERT INTO Scheme (label, timestamp) values(?, ?)", ["Купить iPad или HP Slate", new Date().getTime()], null, null);
});