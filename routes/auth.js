const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Route to register a new user (can be restricted to Admin in a full app)
router.post('/register', async (req, res) => {
    const { username, password, role_name } = req.body; // e.g., 'Admin', 'Manager', 'Staff'

    try {
        // Find role_id from role_name
        const roleRes = await db.query('SELECT role_id FROM Roles WHERE role_name = $1', [role_name]);
        if (roleRes.rows.length === 0) {
            return res.status(400).json({ message: "Invalid role specified" });
        }
        const role_id = roleRes.rows[0].role_id;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert user into database
        const newUser = await db.query(
            'INSERT INTO Users (username, password_hash, role_id) VALUES ($1, $2, $3) RETURNING user_id, username',
            [username, password_hash, role_id]
        );
        
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// Route to log a user in
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const userRes = await db.query('SELECT * FROM Users WHERE username = $1', [username]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const payload = { id: user.user_id, username: user.username };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;