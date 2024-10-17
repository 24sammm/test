const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nodemysql'
});

connection.connect((err) => {
    if (err) {
        console.error("Error Connecting to MYSQL", err.stack);
        return;
    }
    console.log("Connection MySQL Done with id" + connection.threadId);
});

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routing (create, read, update, delete)
app.get('/', (req, res) => {
    const query = 'SELECT * FROM users';
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.render('index', { users: results });
    });
});

// Create/input/insert
app.post('/add', (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
        return res.status(400).send('Semua field harus diisi');
    }
    const query = 'INSERT INTO users (name, email, phone) VALUES (?, ?, ?)';
    connection.query(query, [name, email, phone], (err, result) => {
        if (err) {
            console.error('Error adding user:', err);
            res.status(500).send('Error adding user');
        } else {
            console.log(`User added successfully with ID: ${result.insertId}`);
            res.redirect('/');
        }
    });
});

// Edit user form
app.get('/edit/:id', (req, res) => {
    const query = 'SELECT * FROM users WHERE id = ?';
    connection.query(query, [req.params.id], (err, result) => {
        if (err) throw err;
        res.render('edit', { user: result[0] });
    });
});

// Update user data
app.post('/update/:id', (req, res) => {
    const { name, email, phone } = req.body;
    const userId = req.params.id;
    const query = 'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?';
    
    connection.query(query, [name, email, phone, userId], (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            res.status(500).send('Error updating user');
        } else {
            console.log(`User with ID: ${userId} updated successfully`);
            res.redirect('/');
        }
    });
});

// Delete
app.get('/delete/:id', (req, res) => {
    const userId = req.params.id;
    console.log(`Trying to delete user with ID: ${userId}`);
    
    const query = 'DELETE FROM users WHERE id = ?';
    connection.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            res.status(500).send('Error deleting user');
        } else {
            console.log(`User with ID: ${userId} deleted successfully`);
            res.redirect('/');
        }
    });
});

app.listen(3000, () => {
    console.log("Server berjalan di port 3000, buka web melalui http://localhost:3000");
});
