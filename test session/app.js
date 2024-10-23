const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const path = require('path');

const app = express();

// Set view engine to EJS
app.set('view engine', 'ejs');

// Middleware for parsing incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session management
app.use(session({
    secret: 'secret', // Secret for signing the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: true // Save uninitialized session
}));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to protect routes and ensure session management
app.use((req, res, next) => {
    if (!req.session.user && req.path !== '/auth/login' && req.path !== '/auth/register') {
        // If the user is not logged in and trying to access a protected route, redirect to login page
        return res.redirect('/auth/login');
    } else if (req.session.user && req.path === '/') {
        // If the user is logged in and tries to access the root, redirect to the profile page
        return res.redirect('/auth/profile');
    }
    next();
});

// Use the authentication routes for all requests starting with '/auth'
app.use('/auth', authRoutes);

// Redirect root to profile or login based on session status
app.get('/', (req, res) => {
    if (req.session.user) {
        // Redirect logged-in users to their profile
        return res.redirect('/auth/profile');
    } else {
        // Redirect non-logged-in users to the login page
        return res.redirect('/auth/login');
    }
});

// Handle undefined routes with a 404 error
app.use((req, res) => {
    res.status(404).send('404 - Not Found');
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
