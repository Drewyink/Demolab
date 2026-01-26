const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Admin token (set this in Render Environment Variables) ---
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// --- Basic security headers (simple + safe defaults) ---
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Allow embedding inside WordPress iframe
  // NOTE: Some platforms prefer Content-Security-Policy frame-ancestors. This keeps it permissive.
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use(express.json({ limit: "300kb" }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

const SCORES_PATH = path.join(__dirname, "scores.json");

function loadScores() {
  try {
    if (!fs.existsSync(SCORES_PATH)) return [];
    const raw = fs.readFileSync(SCORES_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveScores(scores) {
  fs.writeFileSync(SCORES_PATH, JSON.stringify(scores, null, 2));
}

function sanitizeName(name) {
  if (typeof name !== "string") return "Anonymous";
  const trimmed = name.trim().slice(0, 24);
  return trimmed.length ? trimmed.replace(/[^\w\s.\-]/g, "") : "Anonymous";
}

function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? Math.floor(n) : min;
  return Math.max(min, Math.min(max, x));
}

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "ai-ethics-simulator", time: new Date().toISOString() });
});

// API: Daily seed (for daily challenge consistency)
app.get("/api/daily-seed", (req, res) => {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const seed = `${y}-${m}-${day}`;
  res.json({ seed });
});

// API: Submit score
// Body: { name, daysSurvived, bestDay, ledgerValid, dailyMode, seed, breaches }
app.post("/api/score", (req, res) => {
  const body = req.body || {};
  const name = sanitizeName(body.name);

  const daysSurvived = clampInt(body.daysSurvived, 0, 9999);
  const bestDay = clampInt(body.bestDay, 0, 9999);
  const ledgerValid = Boolean(body.ledgerValid);

  const dailyMode = Boolean(body.dailyMode);
  const seed = typeof body.seed === "string" ? body.seed.slice(0, 32) : "";
  const breaches = clampInt(body.breaches, 0, 999);

  const scores = loadScores();

  const record = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name,
    daysSurvived,
    bestDay,
    ledgerValid,
    dailyMode,
    seed,
    breaches,
    createdAt: new Date().toISOString(),
    ua: (req.headers["user-agent"] || "").slice(0, 120)
  };

  scores.push(record);

  // Keep only latest 800 records to avoid unlimited growth
  const trimmed = scores.slice(-800);
  saveScores(trimmed);

  res.json({ ok: true, record });
});

// API: Leaderboard (top by bestDay; valid ledger only)
app.get("/api/leaderboard", (req, res) => {
  const scores = loadScores();

  const daily = String(req.query.daily || "").toLowerCase() === "1";
  const seed = typeof req.query.seed === "string" ? req.query.seed.slice(0, 32) : "";

  const valid = scores.filter(s => s && s.ledgerValid);

  const filtered = daily
    ? valid.filter(s => s.dailyMode && (!seed || s.seed === seed))
    : valid;

  filtered.sort((a, b) => (b.bestDay - a.bestDay) || (b.daysSurvived - a.daysSurvived));

  const top = filtered.slice(0, 20).map(s => ({
    name: s.name,
    bestDay: s.bestDay,
    daysSurvived: s.daysSurvived,
    dailyMode: s.dailyMode,
    seed: s.seed,
    breaches: s.breaches,
    createdAt: s.createdAt
  }));

  res.json({ ok: true, top });
});

// --- Admin endpoint: view raw scores (requires ADMIN_TOKEN) ---
// Usage: /api/admin/scores?token=YOUR_TOKEN
app.get("/api/admin/scores", (req, res) => {
  const token = String(req.query.token || "");
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const scores = loadScores();
  // Return last 200 only
  const latest = scores.slice(-200).reverse();
  res.json({ ok: true, count: latest.length, latest });
});

// Fallback: SPA-like behavior
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Ethics Simulator v2 running on port ${PORT}`);
});
