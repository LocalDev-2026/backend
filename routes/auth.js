const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role || 'tourist'],
            function (err) {
                if (err) return res.status(500).json({ msg: err.message });

                const userId = this.lastID;
                jwt.sign(
                    { id: userId, role: role || 'tourist' },
                    process.env.JWT_SECRET || 'naryn_secret',
                    { expiresIn: 3600 },
                    (err, token) => {
                        if (err) throw err;
                        res.json({
                            token,
                            user: { id: userId, name, email, role: role || 'tourist' }
                        });
                    }
                );
            }
        );
    });
});

// @route   POST api/auth/login
// @desc    Authenticate user
// @access  Public
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (!user) return res.status(400).json({ msg: 'User does not exist' });

        bcrypt.compare(password, user.password).then(isMatch => {
            if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

            jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET || 'naryn_secret',
                { expiresIn: 3600 },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token,
                        user: { id: user.id, name: user.name, email: user.email, role: user.role }
                    });
                }
            );
        });
    });
});

module.exports = router;
