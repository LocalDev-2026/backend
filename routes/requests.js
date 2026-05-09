const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, checkRole } = require('../middleware/auth');

// @route   POST api/requests
// @desc    Create a content request
// @access  Private (Host)
router.post('/', [auth, checkRole(['host'])], (req, res) => {
    const { listingId, type, images, videoUrl, description } = req.body;
    const hostId = req.user.id;

    if (!listingId || !type) {
        return res.status(400).json({ msg: 'Listing ID and type are required' });
    }

    const query = `INSERT INTO content_requests 
        (hostId, listingId, type, images, videoUrl, description, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending')`;

    const params = [
        hostId, listingId, type,
        images ? JSON.stringify(images) : null,
        videoUrl || null,
        description || null
    ];

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, msg: 'Content request submitted' });
    });
});

// @route   GET api/requests/my-requests
// @desc    Get current host's requests
// @access  Private (Host)
router.get('/my-requests', [auth, checkRole(['host'])], (req, res) => {
    const query = `
        SELECT r.*, l.title as listingTitle 
        FROM content_requests r 
        LEFT JOIN listings l ON r.listingId = l.id 
        WHERE r.hostId = ?
        ORDER BY r.createdAt DESC
    `;
    db.all(query, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const requests = rows.map(row => ({
            ...row,
            images: row.images ? JSON.parse(row.images) : []
        }));
        res.json(requests);
    });
});

// @route   GET api/requests/pending
// @desc    Get all pending requests
// @access  Private (Admin)
router.get('/pending', [auth, checkRole(['admin'])], (req, res) => {
    const query = `
        SELECT r.*, l.title as listingTitle 
        FROM content_requests r 
        LEFT JOIN listings l ON r.listingId = l.id 
        WHERE r.status = 'pending'
        ORDER BY r.createdAt ASC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const requests = rows.map(row => ({
            ...row,
            images: row.images ? JSON.parse(row.images) : []
        }));
        res.json(requests);
    });
});

// @route   PATCH api/requests/:id/status
// @desc    Update request status and apply changes if approved
// @access  Private (Admin)
router.patch('/:id/status', [auth, checkRole(['admin'])], (req, res) => {
    const { status } = req.body;
    const requestId = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status' });
    }

    db.get("SELECT * FROM content_requests WHERE id = ?", [requestId], (err, request) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        db.run("UPDATE content_requests SET status = ? WHERE id = ?", [status, requestId], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            if (status === 'approved') {
                // Apply changes to the listing
                db.get("SELECT * FROM listings WHERE id = ?", [request.listingId], (err, listing) => {
                    if (err || !listing) return res.json({ msg: 'Request approved but failed to find listing to update.' });

                    let updateQuery = "";
                    let updateParams = [];

                    if (request.type === 'images' && request.images) {
                        const existingImages = listing.images ? JSON.parse(listing.images) : [];
                        const newImages = JSON.parse(request.images);
                        const combined = [...existingImages, ...newImages];
                        updateQuery = "UPDATE listings SET images = ? WHERE id = ?";
                        updateParams = [JSON.stringify(combined), listing.id];
                    } else if (request.type === 'video' && request.videoUrl) {
                        updateQuery = "UPDATE listings SET videoUrl = ? WHERE id = ?";
                        updateParams = [request.videoUrl, listing.id];
                    } else if (request.type === 'description' && request.description) {
                        updateQuery = "UPDATE listings SET description = ? WHERE id = ?";
                        updateParams = [request.description, listing.id];
                    }

                    if (updateQuery) {
                        db.run(updateQuery, updateParams, (err) => {
                            if (err) console.error('Failed to update listing:', err);
                            res.json({ msg: 'Request approved and listing updated' });
                        });
                    } else {
                        res.json({ msg: 'Request approved' });
                    }
                });
            } else {
                res.json({ msg: `Request ${status}` });
            }
        });
    });
});

module.exports = router;
