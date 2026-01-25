const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const app = express();
// Using /tmp/ ensures the app has write permissions in most cloud environments
const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

db.defaults({ users: [], chain: [], logs: [] }).write();

app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'provenance-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS/SSL
}));

const createHash = (data) => crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

const recordEvent = (user, action, details) => {
    db.get('logs').push({
        timestamp: new Date().toLocaleString(),
        user: user || 'System',
        action,
        details
    }).write();
};

// --- ROUTES ---
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (db.get('users').find({ username }).value()) return res.status(400).json({ error: "User exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    db.get('users').push({ username, password: hashedPassword }).write();
    recordEvent(username, "SIGNUP", "Account created");
    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.get('users').find({ username }).value();
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = username;
        recordEvent(username, "LOGIN", "Success");
        res.json({ success: true });
    } else {
        recordEvent(username, "FAILED_LOGIN", "Invalid attempt");
        res.status(401).json({ error: "Invalid credentials" });
    }
});

app.get('/api/me', (req, res) => res.json({ user: req.session.user || null }));

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/history', (req, res) => res.json(db.get('chain').value()));

app.post('/api/update', (req, res) => {
    if (!req.session.user) return res.status(403).json({ error: "Unauthorized" });
    const { status, location, lat, lng } = req.body;
    const chain = db.get('chain').value();
    const prevHash = chain.length > 0 ? chain[chain.length - 1].hash : "0000-GENESIS";
    
    const newBlock = {
        id: chain.length + 1,
        timestamp: new Date().toLocaleString(),
        status, location, lat, lng,
        handler: req.session.user,
        prevHash,
        hash: ""
    };
    newBlock.hash = createHash(newBlock);
    db.get('chain').push(newBlock).write();
    recordEvent(req.session.user, "BLOCK_CREATED", `Added: ${status}`);
    res.status(201).json(newBlock);
});

app.get('/api/verify', (req, res) => {
    const chain = db.get('chain').value();
    let isValid = true;
    for (let i = 0; i < chain.length; i++) {
        const block = chain[i];
        const currentHash = block.hash;
        const checkBlock = { ...block, hash: "" };
        if (currentHash !== createHash(checkBlock)) { isValid = false; break; }
    }
    res.json({ isValid });
});

app.get('/api/logs', (req, res) => res.json(db.get('logs').value().reverse().slice(0, 50)));

app.post('/api/tamper', (req, res) => {
    let chain = db.get('chain').value();
    if(chain.length > 0) {
        chain[0].location = "⚠️ TAMPERED";
        db.write();
        res.json({ success: true });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
