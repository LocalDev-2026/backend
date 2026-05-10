const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'naryn.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, name, email, role FROM users", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Registered Users:");
    console.table(rows);
});
