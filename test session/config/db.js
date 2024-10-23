const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'session_js'
});

db.connect ((err) => {
    if (err) throw err;
    console.log('Database connected...');
});
module.exports = db;
