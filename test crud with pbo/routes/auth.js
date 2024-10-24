const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Import bcrypt for hashing passwords
const db = require('../config/db'); // Ensure database connection is correct

// Register Page
router.get('/register', (req, res) => {
    res.render('register'); // Render the registration page
});

// Process Registration
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Custom validation
    const errors = [];
    if (!username || typeof username !== 'string') {
        errors.push({ msg: 'Username is required.' });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        errors.push({ msg: 'Valid email is required.' });
    }
    if (!password || password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters long.' });
    }

    if (errors.length > 0) {
        return res.status(400).render('register', { errors });
    }

    // Check if the username or email already exists
    const userCheckQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
    db.query(userCheckQuery, [username, email], async (err, results) => {
        if (err) {
            console.error('Error checking user existence: ', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            return res.status(400).render('register', { errors: [{ msg: 'Username or email already exists.' }] });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const query = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
        
        db.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting data: ', err);
                return res.status(500).send('Error registering user');
            }
            res.redirect('/auth/login');
        });
    });
});

// Login Page
router.get('/login', (req, res) => {
    res.render('login'); // Render the login page
});

// Process Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Custom validation
    const errors = [];
    if (!username || typeof username !== 'string') {
        errors.push({ msg: 'Username is required.' });
    }
    if (!password || typeof password !== 'string') {
        errors.push({ msg: 'Password is required.' });
    }

    if (errors.length > 0) {
        return res.status(400).render('login', { errors });
    }

    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], (err, result) => {
        if (err) {
            console.error('Error fetching user: ', err);
            return res.status(500).send('Error logging in');
        }

        if (result.length > 0) {
            const user = result[0];
            if (bcrypt.compareSync(password, user.password)) {
                req.session.user = user; // Store user data in session
                res.redirect('/auth/profile'); // Redirect to profile
            } else {
                res.render('login', { error: 'Incorrect password.' }); // If password is incorrect
            }
        } else {
            res.render('login', { error: 'User not found.' }); // If user not found
        }
    });
});

// Profile Page
router.get('/profile', (req, res) => {
    if (req.session.user) {
        res.render('profile', { user: req.session.user }); // Render profile page
    } else {
        res.redirect('/auth/login'); // Redirect to login if not logged in
    }
});

// Edit Profile Page
router.get('/profile/edit', (req, res) => {
    if (req.session.user) {
        res.render('edit_profile', { user: req.session.user }); // Render edit profile page
    } else {
        res.redirect('/auth/login'); // Redirect to login if not logged in
    }
});

// Process Profile Update
router.post('/update', (req, res) => {
    const { username, email, program, createdAt } = req.body;

    // Custom validation
    const errors = [];
    if (!username || typeof username !== 'string') {
        errors.push({ msg: 'Username is required.' });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        errors.push({ msg: 'Valid email is required.' });
    }
    if (!program || typeof program !== 'string') {
        errors.push({ msg: 'Study program is required.' });
    }

    if (!createdAt || typeof createdAt !== 'string') {
        errors.push({ msg: 'createdAt is required.' });
    }

    if (errors.length > 0) {
        return res.status(400).render('edit_profile', { user: req.session.user, errors });
    }

    // Update user logic here...
    let updateQuery = "UPDATE users SET username = ?, email = ?, program = ?, createdAt = ? WHERE id = ?";
    const queryParams = [username, email, program, createdAt, req.session.user.id];

    db.query(updateQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error updating data: ', err);
            return res.status(500).send('Error updating profile');
        }

        // Update session user after profile changes
        req.session.user.username = username;
        req.session.user.email = email;
        req.session.user.program = program;
        req.session.user.createdAt = createdAt;

        res.redirect('/auth/profile'); // Redirect to profile after successful update
    });
});

// Process Account Deletion
router.post('/profile/delete', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized access');
    }

    const userId = req.session.user.id;

    const deleteQuery = "DELETE FROM users WHERE id = ?";
    db.query(deleteQuery, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user: ', err);
            return res.status(500).send('Error deleting account');
        }

        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send('Error logging out');
            }
            res.redirect('/auth/login'); // Redirect to login after account deletion
        });
    });
});

// Process Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/auth/login'); // Redirect to login after logout
    });
});

module.exports = router;
