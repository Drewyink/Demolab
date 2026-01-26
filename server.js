import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In-memory leaderboard
const scores = []; // {name, daysSurvived, bestDay, ledgerValid, ts}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "ethical-ledger-game" });
});

app.get("/api/leaderboard", (req, res) => {
  // Only show valid-ledger runs
  const top = scores
    .filter(s => s.ledgerValid)
    .sort((a, b) => (b.bestDay - a.bestDay) || (b.daysSurvived - a.daysSurvived) || (b.ts - a.ts))
    .slice(0, 10)
    .map(({ name, daysSurvived, bestDay }) => ({ name, daysSurvived, bestDay }));

  res.json({ ok: true, top });
});

app.post("/api/score", (req, res) => {
  const { name, daysSurvived, bestDay, ledgerValid } = req.body || {};
  if (typeof daysSurvived !== "number" || typeof bestDay !== "number") {
    return res.status(400).json({ ok: false, error: "Invalid payload" });
  }

  scores.push({
    name: String(name || "Anonymous").slice(0, 40),
    daysSurvived,
    bestDay,
    ledgerValid: !!ledgerValid,
    ts: Date.now()
  });

  res.json({ ok: true });
});

// Serve static files
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ethical Ledger Game running on http://localhost:${PORT}`);
});
