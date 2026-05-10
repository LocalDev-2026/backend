const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET api/listings
// @desc    Get all listings (with filters)
// @access  Public
router.get('/', (req, res) => {
    const { category, minPrice, maxPrice, minRating, status } = req.query;
    let query = "SELECT * FROM listings WHERE 1=1";
    let params = [];

    if (status && status !== 'all') {
        query += " AND status = ?";
        params.push(status);
    } else if (!status) {
        query += " AND status = 'approved'";
    }

    if (category) {
        query += " AND category = ?";
        params.push(category);
    }
    if (minPrice) {
        query += " AND price >= ?";
        params.push(minPrice);
    }
    if (maxPrice) {
        query += " AND price <= ?";
        params.push(maxPrice);
    }
    if (minRating) {
        query += " AND rating >= ?";
        params.push(minRating);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Parse JSON strings back to arrays/objects
        const listings = rows.map(row => ({
            ...row,
            images: row.images ? JSON.parse(row.images) : [],
            videos: row.videos ? JSON.parse(row.videos) : [],
            amenities: row.amenities ? JSON.parse(row.amenities) : []
        }));
        res.json(listings);
    });
});

// @route   GET api/listings/my-listings
// @desc    Get current host's listings
// @access  Private (Host)
router.get('/my-listings', [auth, checkRole(['host'])], (req, res) => {
    db.all("SELECT * FROM listings WHERE hostId = ?", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const listings = rows.map(row => ({
            ...row,
            images: row.images ? JSON.parse(row.images) : [],
            videos: row.videos ? JSON.parse(row.videos) : [],
            amenities: row.amenities ? JSON.parse(row.amenities) : []
        }));
        res.json(listings);
    });
});

// @route   GET api/listings/:id
// @desc    Get single listing
// @access  Public
router.get('/:id', (req, res) => {
    const query = `
        SELECT l.*, u.name as hostName, u.avatar as hostAvatar, u.businessName 
        FROM listings l 
        JOIN users u ON l.hostId = u.id 
        WHERE l.id = ?`;
    db.get(query, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ msg: 'Listing not found' });

        const listing = {
            ...row,
            images: row.images ? JSON.parse(row.images) : [],
            videos: row.videos ? JSON.parse(row.videos) : [],
            amenities: row.amenities ? JSON.parse(row.amenities) : []
        };
        res.json(listing);
    });
});

// @route   POST api/listings
// @desc    Create a listing
// @access  Private (Host/Admin)
router.post('/', [auth, checkRole(['host', 'admin'])], (req, res) => {
    const { title, category, price, location, description, images, videos, amenities, availableRooms, maxGuests } = req.body;
    const hostId = req.user.id;

    const query = `INSERT INTO listings 
        (hostId, title, category, price, location, description, images, videos, amenities, availableRooms, maxGuests, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        hostId, title, category, price, location, description,
        JSON.stringify(images || []),
        JSON.stringify(videos || []),
        JSON.stringify(amenities || []),
        availableRooms, maxGuests,
        'pending' // Always pending by default
    ];

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, msg: 'Listing submitted for approval' });
    });
});

// @route   PATCH api/listings/:id/status
// @desc    Update listing status (Approve/Reject)
// @access  Private (Admin)
router.patch('/:id/status', [auth, checkRole(['admin'])], (req, res) => {
    const { status } = req.body;
    db.run("UPDATE listings SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ msg: 'Listing approved successfully' });
    });
});

module.exports = router;
