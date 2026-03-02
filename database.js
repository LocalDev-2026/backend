const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'naryn.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'tourist',
        avatar TEXT
    )`);

    // Listings table
    db.run(`CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostId INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        images TEXT, -- JSON string of image URLs
        rating REAL DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        availableRooms INTEGER,
        maxGuests INTEGER,
        amenities TEXT, -- JSON string of amenities
        FOREIGN KEY (hostId) REFERENCES users (id)
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listingId INTEGER NOT NULL,
        touristId INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        totalPrice REAL NOT NULL,
        FOREIGN KEY (listingId) REFERENCES listings (id),
        FOREIGN KEY (touristId) REFERENCES users (id)
    )`);

    // Seed initial users if empty
    db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (row && row.count === 0) {
            const salt = bcrypt.genSaltSync(10);
            const hashedPw = bcrypt.hashSync('password123', salt);

            db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Alice Tourist', 'alice@example.com', hashedPw, 'tourist']);
            db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Bob Host', 'bob@example.com', hashedPw, 'host']);
            db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Admin User', 'admin@naryn.com', hashedPw, 'admin']);
            console.log('Seed users created.');
        }
    });
});

module.exports = db;
