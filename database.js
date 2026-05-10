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
        avatar TEXT,
        businessName TEXT,
        businessDescription TEXT
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
        videos TEXT, -- JSON string of video URLs
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

    // Content Requests table
    db.run(`CREATE TABLE IF NOT EXISTS content_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostId INTEGER NOT NULL,
        listingId INTEGER NOT NULL,
        type TEXT NOT NULL,
        images TEXT, -- JSON string of image URLs
        videos TEXT,
        description TEXT,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hostId) REFERENCES users (id),
        FOREIGN KEY (listingId) REFERENCES listings (id)
    )`);

    // Seed initial users if empty
    db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (row && row.count === 0) {
            const salt = bcrypt.genSaltSync(10);
            const hashedPw = bcrypt.hashSync('password123', salt);

            db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Alice Tourist', 'alice@example.com', hashedPw, 'tourist']);
            db.run("INSERT INTO users (name, email, password, role, businessName, businessDescription) VALUES (?, ?, ?, ?, ?, ?)",
                ['Bob Host', 'bob@example.com', hashedPw, 'host', 'Bob\'s Adventures', 'We offer the best guesthouses and ski trips in Naryn!']);
            db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Admin User', 'admin@naryn.com', hashedPw, 'admin']);
            console.log('Seed users created.');
        }
    });
    // Seed initial listings if empty
    db.get("SELECT count(*) as count FROM listings", (err, row) => {
        if (row && row.count === 0) {
            const initialListings = [
                {
                    hostId: 2,
                    title: 'Cozy Yurt in Tash Rabat',
                    category: 'guesthouse',
                    price: 35,
                    location: 'Tash Rabat, Naryn',
                    description: 'Experience authentic nomadic life in a comfortable yurt near the historic Tash Rabat Caravanserai.',
                    images: JSON.stringify(['https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80']),
                    amenities: JSON.stringify(['Breakfast', 'Hiking', 'Parking', 'Heating']),
                    availableRooms: 3,
                    maxGuests: 4,
                    status: 'approved',
                    rating: 4.8,
                    reviews: 24
                },
                {
                    hostId: 2,
                    title: 'Naryn River Breeze Hotel',
                    category: 'resort',
                    price: 65,
                    location: 'Naryn Riverside',
                    description: 'A premium riverside resort offering stunning mountain views and modern amenities.',
                    images: JSON.stringify(['https://images.unsplash.com/photo-1625244724123-1ee70e28f145?w=1200&q=80']),
                    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Hot Shower', 'Restaurant', 'Gym']),
                    availableRooms: 8,
                    maxGuests: 3,
                    status: 'approved',
                    rating: 4.6,
                    reviews: 15
                }
            ];

            const insertQuery = `INSERT INTO listings 
                (hostId, title, category, price, location, description, images, amenities, availableRooms, maxGuests, status, rating, reviews) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            initialListings.forEach(l => {
                db.run(insertQuery, [
                    l.hostId, l.title, l.category, l.price, l.location, l.description,
                    l.images, l.amenities, l.availableRooms, l.maxGuests, l.status, l.rating, l.reviews
                ]);
            });
            console.log('Seed listings created.');
        }
    });
});

module.exports = db;
