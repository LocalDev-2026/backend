const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'naryn.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Delete non-seed users (Assuming seed users have IDs 1, 2, 3)
    db.run("DELETE FROM users WHERE id > 3", function(err) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Deleted ${this.changes} newly registered user(s).`);
    });

    db.all("SELECT id, name, email, role FROM users", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Remaining Users (Seed Accounts):");
        console.table(rows);
    });
});
