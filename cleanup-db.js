const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'naryn.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Delete test listings (title contains 'Test' or 'QA')
    db.run("DELETE FROM listings WHERE title LIKE '%Test%' OR title LIKE '%QA%'", function(err) {
        if (err) {
            console.error('Error deleting listings:', err.message);
        } else {
            console.log(`Deleted ${this.changes} test listings.`);
        }
    });

    // 2. Delete test users (email contains 'test' or 'qa')
    db.run("DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%qa%'", function(err) {
        if (err) {
            console.error('Error deleting users:', err.message);
        } else {
            console.log(`Deleted ${this.changes} test users.`);
        }
    });

    // 3. Clean up orphans
    db.run("DELETE FROM content_requests WHERE listingId NOT IN (SELECT id FROM listings)", function(err) {
        if (err) console.error(err.message);
    });
    db.run("DELETE FROM bookings WHERE listingId NOT IN (SELECT id FROM listings)", function(err) {
        if (err) console.error(err.message);
    });
});

db.close();
