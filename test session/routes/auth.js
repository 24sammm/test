const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // Koneksi database

// Register page
router.get('/register', (req, res) => {
    res.render('register', { message: null });
});

// Register form submission
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Cek apakah username sudah ada
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            return res.render('register', { message: 'Username already exists!' });
        }

        // Hash password dan simpan ke database
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
            if (err) throw err;
            return res.redirect('/auth/login');
        });
    });
});

// Login page
router.get('/login', (req, res) => {
    res.render('login', { message: null });
});

// Login form submission
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Query untuk mendapatkan data user dari database
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
            return res.render('login', { message: 'Incorrect username or password!' });
        }

        // Bandingkan password yang dimasukkan dengan yang ada di database
        const user = result[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.render('login', { message: 'Incorrect username or password!' });
        }

        // Set session user
        req.session.user = { id: user.id, username: user.username };
        return res.redirect('/auth/profile');
    });
});

// Profile page
router.get('/profile', (req, res) => {
    // Cek session user
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    // Fetch user data berdasarkan session id
    const userId = req.session.user.id;
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) throw err;
        res.render('profile', { user: result[0] });
    });
});

// Profile update (Edit)
router.post('/profile', async (req, res) => {
    const { full_name, email, password } = req.body; // Include new fields
    const userId = req.session.user.id;

    const updateData = [full_name, email];
    let query = 'UPDATE users SET full_name = ?, email = ?';
    
    // Hash password jika disediakan
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.push(hashedPassword);
        query += ', password = ?';
    }
    
    query += ' WHERE id = ?';
    updateData.push(userId);

    // Update data user di database
    db.query(query, updateData, (err, result) => {
        if (err) throw err;
        // Update session dengan data baru
        req.session.user.full_name = full_name; 
        return res.redirect('/auth/profile');
    });
});

// Add user (for admin or current user)
router.post('/add-user', async (req, res) => {
    const { username, password } = req.body;

    // Cek apakah user sudah ada
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            return res.redirect('/auth/profile'); // Handle jika user sudah ada
        }

        // Hash password dan simpan ke database
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
            if (err) throw err;
            return res.redirect('/auth/profile');
        });
    });
});

// Edit user
router.post('/edit-user/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { username } = req.body;

    // Update data user di database
    db.query('UPDATE users SET username = ? WHERE id = ?', [username, userId], (err, result) => {
        if (err) throw err;
        return res.redirect('/auth/profile');
    });
});

// Delete user
router.post('/delete-user/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    // Hapus user dari database
    db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) throw err;
        return res.redirect('/auth/profile');
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) throw err;
        res.redirect('/auth/login');
    });
});

module.exports = router;
