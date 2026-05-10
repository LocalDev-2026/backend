const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET api/hosts/:id
// @desc    Get host profile and all their approved listings
// @access  Public
router.get('/:id', (req, res) => {
    const hostId = req.params.id;

    db.get("SELECT id, name, avatar, businessName, businessDescription FROM users WHERE id = ? AND role = 'host'", [hostId], (err, host) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!host) return res.status(404).json({ msg: 'Host not found' });

        db.all("SELECT * FROM listings WHERE hostId = ? AND status = 'approved'", [hostId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            const listings = rows.map(row => ({
                ...row,
                images: row.images ? JSON.parse(row.images) : [],
                videos: row.videos ? JSON.parse(row.videos) : [],
                amenities: row.amenities ? JSON.parse(row.amenities) : []
            }));

            res.json({
                host,
                listings
            });
        });
    });
});

// @route   PATCH api/hosts/profile
// @desc    Update current host's business profile
// @access  Private (Host)
router.patch('/profile', [auth, checkRole(['host'])], (req, res) => {
    const { businessName, businessDescription } = req.body;
    
    const query = "UPDATE users SET businessName = ?, businessDescription = ? WHERE id = ?";
    db.run(query, [businessName || null, businessDescription || null, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ msg: 'Profile updated' });
    });
});

module.exports = router;
