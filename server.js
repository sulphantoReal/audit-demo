const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// In-memory database
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE users (id INT, username TEXT, role TEXT)");
    db.run("INSERT INTO users VALUES (1, 'admin', 'administrator')");
    db.run("INSERT INTO users VALUES (2, 'alice', 'user')");
});

// --- Option 2: File Verification Route ---
app.get('/.well-known/hmw-verify.txt', (req, res) => {
    res.type('text/plain');
    res.send('2ac7b84079db40a0c5e6b8d9ebc79db5');
});

// 1. Home page (Missing Security Headers)
app.get('/', (req, res) => {
    res.send(`
        <h1>Vulnerability Audit Demo Target</h1>
        <p>Target active. Run your audit against this endpoint.</p>
        <form action="/search" method="GET">
            <input type="text" name="q" placeholder="Search user...">
            <button type="submit">Search</button>
        </form>
    `);
});

// 2. Reflected XSS Vulnerability
app.get('/search', (req, res) => {
    const query = req.query.q || '';
    res.send(`<h2>Search Results for: ${query}</h2><a href="/">Back</a>`);
});

// 3. SQL Injection Vulnerability
app.get('/api/user', (req, res) => {
    const userId = req.query.id;
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// 4. Stress Test / Load Route
app.get('/stress-test', (req, res) => {
    let sum = 0;
    for (let i = 0; i < 1e7; i++) {
        sum += i;
    }
    res.send(`Stress test completed. Result: ${sum}`);
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
