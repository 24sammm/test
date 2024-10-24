const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth'); // Ensure this route handles profile updates
const path = require('path');

const app = express();

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Middleware to parse request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'your_secret_key', // Change this to a secure random key in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve static files (CSS, JS, images, etc.) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check if user is authenticated
app.use((req, res, next) => {
    if (!req.session.user && !['/auth/login', '/auth/register'].includes(req.path)) {
        return res.redirect('/auth/login');
    }
    next();
});

// Authentication routes
app.use('/auth', authRoutes);

// Home route redirects to profile if logged in, otherwise to login
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/auth/profile');
    } else {
        return res.redirect('/auth/login');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!'); // Custom error handling can be improved
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
