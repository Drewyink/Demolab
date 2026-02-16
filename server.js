import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Render Proxy Trust
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.static("public"));

// Persistent Database Path for Render
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "facets.db");
const db = new Database(DB_PATH);

// Initialize Schema if empty
const schema = fs.readFileSync(path.join(__dirname, "db/schema.sql"), "utf8");
db.exec(schema);

app.use(session({
  name: "facets.sid",
  secret: process.env.SESSION_SECRET || "trizetto_sandbox_99",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", 
    sameSite: "lax",
    maxAge: 28800000 // 8 hours (Standard Shift)
  }
}));

// --- AUTH ROUTES ---
app.post("/api/auth/register", async (req, res) => {
  const { email, name, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.prepare("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)")
      .run(email, name, hash);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: "User exists" }); }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (user && await bcrypt.compare(password, user.password_hash)) {
    req.session.user = { id: user.id, name: user.name };
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Invalid Credentials" });
});

// --- FACETS DATA ROUTES ---
app.get("/api/facets/members", (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");
  const members = db.prepare("SELECT * FROM members LIMIT 10").all();
  res.json(members);
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Facets Sandbox Online: ${PORT}`));

