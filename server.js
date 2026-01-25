// server.js (ESM) - AI Face Aging Demo + Account System
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { nanoid } from "nanoid";
import fs from "fs";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { getPresets, applyAgePreset } from "./image/aging.js";
import { loadJson, saveJson, nowIso } from "./storage/store.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Folders
fs.mkdirSync(path.join(__dirname, "storage/uploads"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "storage/outputs"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "storage/data"), { recursive: true });

// Static frontend + outputs
app.use(express.static(path.join(__dirname, "public")));
app.use("/outputs", express.static(path.join(__dirname, "storage/outputs")));

// Data files (file-based persistence)
const USERS_FILE = path.join(__dirname, "storage/data/users.json");
const SESS_FILE  = path.join(__dirname, "storage/data/sessions.json");
const RESULTS_FILE = path.join(__dirname, "storage/data/results.json");

function getUsers(){ return loadJson(USERS_FILE, { users: [] }); }
function setUsers(d){ saveJson(USERS_FILE, d); }

function getSessions(){ return loadJson(SESS_FILE, { sessions: [] }); }
function setSessions(d){ saveJson(SESS_FILE, d); }

function getResults(){ return loadJson(RESULTS_FILE, { results: [] }); }
function setResults(d){ saveJson(RESULTS_FILE, d); }

// Helpers
function normalizeEmail(email){
  return String(email || "").trim().toLowerCase();
}

function issueSession(userId){
  const token = nanoid(32);
  const sessions = getSessions();
  sessions.sessions = sessions.sessions.filter(s => s.userId !== userId); // one active session per user (simple)
  sessions.sessions.push({
    token,
    userId,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 1000*60*60*24*7).toISOString() // 7 days
  });
  setSessions(sessions);
  return token;
}

function clearSession(token){
  const sessions = getSessions();
  sessions.sessions = sessions.sessions.filter(s => s.token !== token);
  setSessions(sessions);
}

function authMiddleware(req, res, next){
  const token = req.cookies?.sid;
  if(!token) return res.status(401).json({ ok:false, error:"Not logged in" });
  const sessions = getSessions();
  const s = sessions.sessions.find(x => x.token === token);
  if(!s) return res.status(401).json({ ok:false, error:"Session expired" });
  if(new Date(s.expiresAt).getTime() < Date.now()){
    clearSession(token);
    return res.status(401).json({ ok:false, error:"Session expired" });
  }
  req.userId = s.userId;
  next();
}

// Health
app.get("/api/health", (req, res) => res.json({ ok:true, service:"ai-face-aging-accounts" }));

// Auth: signup
app.post("/api/auth/signup", async (req, res) => {
  try{
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const name = String(req.body.name || "").trim() || "Student";
    if(!email || !email.includes("@")) throw new Error("Enter a valid email");
    if(password.length < 8) throw new Error("Password must be at least 8 characters");

    const users = getUsers();
    if(users.users.some(u => u.email === email)) throw new Error("Email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = nanoid(10);
    users.users.push({ id:userId, email, name, passwordHash, createdAt: nowIso() });
    setUsers(users);

    const token = issueSession(userId);
    res.cookie("sid", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true behind HTTPS custom domain
      maxAge: 1000*60*60*24*7
    });

    res.json({ ok:true, user: { id:userId, email, name } });
  }catch(e){
    res.status(400).json({ ok:false, error: e.message || "Signup failed" });
  }
});

// Auth: login
app.post("/api/auth/login", async (req, res) => {
  try{
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const users = getUsers();
    const u = users.users.find(x => x.email === email);
    if(!u) throw new Error("Invalid email or password");
    const ok = await bcrypt.compare(password, u.passwordHash);
    if(!ok) throw new Error("Invalid email or password");

    const token = issueSession(u.id);
    res.cookie("sid", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000*60*60*24*7
    });

    res.json({ ok:true, user: { id:u.id, email:u.email, name:u.name } });
  }catch(e){
    res.status(400).json({ ok:false, error: e.message || "Login failed" });
  }
});

// Auth: logout
app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies?.sid;
  if(token) clearSession(token);
  res.clearCookie("sid");
  res.json({ ok:true });
});

// Current user
app.get("/api/me", authMiddleware, (req, res) => {
  const users = getUsers();
  const u = users.users.find(x => x.id === req.userId);
  if(!u) return res.status(401).json({ ok:false, error:"User not found" });

  const results = getResults().results.filter(r => r.userId === u.id).slice(-50).reverse();
  res.json({ ok:true, user:{ id:u.id, email:u.email, name:u.name }, results });
});

// Presets
app.get("/api/presets", (req, res) => res.json({ presets: getPresets() }));

// Upload config
const upload = multer({
  dest: path.join(__dirname, "storage/uploads"),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg","image/png","image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Only JPG/PNG/WebP allowed"), ok);
  }
});

// Generate (requires login so we can save history)
app.post("/api/age", authMiddleware, upload.single("image"), async (req, res) => {
  try{
    if(!req.file) throw new Error("No image uploaded");
    const preset = String(req.body.preset || "").trim();
    const valid = getPresets().map(p => p.id);
    if(!valid.includes(preset)) throw new Error(`Invalid preset. Use: ${valid.join(", ")}`);

    const inPath = req.file.path;
    const outId = nanoid(10);
    const outName = `${outId}-${preset}.jpg`;
    const outPath = path.join(__dirname, "storage/outputs", outName);

    const meta = await applyAgePreset({ inputPath: inPath, outputPath: outPath, preset });
    fs.unlink(inPath, ()=>{});

    const results = getResults();
    results.results.push({
      id: outId,
      userId: req.userId,
      preset,
      outputUrl: `/outputs/${outName}`,
      createdAt: nowIso(),
      meta
    });
    setResults(results);

    res.json({ ok:true, preset, outputUrl: `/outputs/${outName}`, meta });
  }catch(e){
    res.status(400).json({ ok:false, error: e.message || "Failed" });
  }
});

// Fallback
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log("AI Face Aging + Accounts running on http://localhost:" + PORT));
