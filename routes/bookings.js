const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, checkRole } = require('../middleware/auth');

// @route   POST api/bookings
// @desc    Create a booking
// @access  Private (Tourist)
router.post('/', auth, (req, res) => {
    const { listingId, date, totalPrice } = req.body;
    const touristId = req.user.id;

    if (!listingId || !date || !totalPrice) {
        return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    const query = "INSERT INTO bookings (listingId, touristId, date, totalPrice, status) VALUES (?, ?, ?, ?, ?)";
    const params = [listingId, touristId, date, totalPrice, 'pending'];

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, msg: 'Booking created' });
    });
});

// @route   GET api/bookings/my-bookings
// @desc    Get current user's bookings
// @access  Private
router.get('/my-bookings', auth, (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    let query;
    if (role === 'host') {
        // As a host, see bookings for your listings
        query = `SELECT b.*, l.title as listingTitle, u.name as touristName 
                 FROM bookings b 
                 JOIN listings l ON b.listingId = l.id 
                 JOIN users u ON b.touristId = u.id
                 WHERE l.hostId = ?`;
    } else {
        // As a tourist, see your own bookings
        query = `SELECT b.*, l.title as listingTitle 
                 FROM bookings b 
                 JOIN listings l ON b.listingId = l.id 
                 WHERE b.touristId = ?`;
    }

    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// @route   PATCH api/bookings/:id/status
// @desc    Update booking status
// @access  Private (Host)
router.patch('/:id/status', auth, (req, res) => {
    const { status } = req.body;
    const userId = req.user.id;

    // Check if user owns the listing
    db.get("SELECT l.hostId FROM bookings b JOIN listings l ON b.listingId = l.id WHERE b.id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ msg: 'Booking not found' });
        
        if (row.hostId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to update this booking' });
        }

        db.run("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ msg: `Booking status updated to ${status}` });
        });
    });
});

module.exports = router;
