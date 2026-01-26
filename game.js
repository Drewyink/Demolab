// ---------- Utilities ----------
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const nowIso = () => new Date().toISOString();
const short = (s) => (s && s.length > 12 ? s.slice(0, 12) + "..." : (s || ""));

// sha256 with safe fallback (demo-safe when crypto.subtle unavailable)
async function sha256Hex(str) {
  try {
    if (!globalThis.crypto?.subtle) throw new Error("crypto.subtle unavailable");
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Non-cryptographic fallback (fine for demos; NOT for security)
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8).repeat(8);
  }
}

// ---------- Scenario Library (30+ events) ----------
const SCENARIOS = [
  {
    id: "FIN-LOAN-01",
    domain: "Finance",
    title: "Loan Decision: Small Business Expansion",
    description: "Applicant requests $45k to expand a local retail shop. Limited credit history but steady revenue reported.",
    aiRecommendation: "DENY (risk elevated due to short credit file).",
    confidence: 86,
    hiddenBiasRisk: 70,
    hiddenComplianceRisk: 35,
    hiddenRiskNote: "Audit flag: credit file is thin because the applicant is new to the country; alternative data is strong. Bias risk if denied without review.",
    impacts: {
      approve:   { trust:-4, fairness:-6, profit:+3, safety: 0, compliance:-2 },
      override:  { trust:+2, fairness:+6, profit:-2, safety: 0, compliance:+1 },
      audit:     { trust: 0, fairness:+1, profit:-1, safety: 0, compliance:+4 }
    }
  },
  {
    id: "FIN-FRAUD-02",
    domain: "Finance",
    title: "Fraud Alert: Unusual Card Activity",
    description: "AI flagged a customer’s card for suspected fraud after travel-related transactions.",
    aiRecommendation: "FREEZE CARD immediately.",
    confidence: 92,
    hiddenBiasRisk: 20,
    hiddenComplianceRisk: 20,
    hiddenRiskNote: "Audit note: customer notified travel plans in advance. Freezing without confirmation increases churn; compliance ok, fairness moderate.",
    impacts: {
      approve:   { trust:-2, fairness:-1, profit:-1, safety:+2, compliance:+1 },
      override:  { trust:+2, fairness:+2, profit: 0, safety:-1, compliance: 0 },
      audit:     { trust:+1, fairness:+1, profit:-1, safety: 0, compliance:+3 }
    }
  },
  {
    id: "HLT-TRIAGE-01",
    domain: "Healthcare",
    title: "ER Triage: Chest Pain vs. Severe Asthma",
    description: "Two critical patients arrive simultaneously. Resources are limited for the next 15 minutes.",
    aiRecommendation: "PRIORITIZE chest pain case.",
    confidence: 78,
    hiddenBiasRisk: 55,
    hiddenComplianceRisk: 40,
    hiddenRiskNote: "Audit note: asthma case has low oxygen saturation and is at immediate risk; AI may underweight respiratory distress for younger patients.",
    impacts: {
      approve:   { trust:-3, fairness:-2, profit: 0, safety:-4, compliance:-2 },
      override:  { trust:+2, fairness:+3, profit: 0, safety:+2, compliance:+1 },
      audit:     { trust: 0, fairness:+1, profit: 0, safety: 0, compliance:+4 }
    }
  },
  {
    id: "HIR-RESUME-01",
    domain: "Hiring",
    title: "Hiring Screen: Senior Analyst Role",
    description: "AI ranked candidates using employer prestige and gap-free work history.",
    aiRecommendation: "SHORTLIST top 5 by AI rank.",
    confidence: 90,
    hiddenBiasRisk: 85,
    hiddenComplianceRisk: 60,
    hiddenRiskNote: "Audit note: ranking penalizes career breaks and non-traditional schools; disparate impact risk is high.",
    impacts: {
      approve:   { trust:-2, fairness:-6, profit:+2, safety: 0, compliance:-3 },
      override:  { trust:+2, fairness:+6, profit:-1, safety: 0, compliance:+2 },
      audit:     { trust:+1, fairness:+2, profit:-1, safety: 0, compliance:+4 }
    }
  },
  {
    id: "POL-PATROL-01",
    domain: "Policing",
    title: "Predictive Patrol Suggestion",
    description: "AI suggests increased patrols in a neighborhood based on historical incidents.",
    aiRecommendation: "DEPLOY extra patrol units.",
    confidence: 81,
    hiddenBiasRisk: 90,
    hiddenComplianceRisk: 70,
    hiddenRiskNote: "Audit note: historical data includes over-policing patterns; civil rights and trust risk elevated.",
    impacts: {
      approve:   { trust:-6, fairness:-7, profit: 0, safety:+2, compliance:-4 },
      override:  { trust:+2, fairness:+5, profit: 0, safety:-1, compliance:+2 },
      audit:     { trust:+1, fairness:+2, profit: 0, safety: 0, compliance:+5 }
    }
  },
  {
    id: "CYB-INC-01",
    domain: "Cyber",
    title: "Cybersecurity: Suspicious Login Cluster",
    description: "Multiple login attempts detected from unusual geography within 10 minutes.",
    aiRecommendation: "FORCE password reset + lock sessions.",
    confidence: 95,
    hiddenBiasRisk: 10,
    hiddenComplianceRisk: 30,
    hiddenRiskNote: "Audit note: some logins are from corporate VPN; harsh response may disrupt executives. Compliance remains strong.",
    impacts: {
      approve:   { trust:-1, fairness: 0, profit:-1, safety:+3, compliance:+2 },
      override:  { trust:+1, fairness:+1, profit: 0, safety:-1, compliance:+1 },
      audit:     { trust: 0, fairness: 0, profit:-1, safety:+1, compliance:+4 }
    }
  },
  {
    id: "LOG-SUP-01",
    domain: "Logistics",
    title: "Supply Chain: Vendor Replacement",
    description: "AI recommends switching to a cheaper vendor to improve margins this quarter.",
    aiRecommendation: "SWITCH vendor now.",
    confidence: 84,
    hiddenBiasRisk: 35,
    hiddenComplianceRisk: 80,
    hiddenRiskNote: "Audit note: new vendor has weak labor practices documentation; ESG/compliance risk is high.",
    impacts: {
      approve:   { trust:-2, fairness:-1, profit:+5, safety: 0, compliance:-5 },
      override:  { trust:+1, fairness:+2, profit:-2, safety: 0, compliance:+2 },
      audit:     { trust: 0, fairness: 0, profit:-1, safety: 0, compliance:+5 }
    }
  }
];

// Procedurally add more “corporate policy decisions” to exceed 30
(function addGenerated() {
  const domains = ["Finance","Healthcare","Hiring","Policing","Disaster","Cyber","Logistics","Education"];
  for (let i = 1; i <= 26; i++) {
    const domain = domains[Math.floor(Math.random()*domains.length)];
    const conf = 72 + Math.floor(Math.random()*24);
    const bias = 10 + Math.floor(Math.random()*80);
    const comp = 10 + Math.floor(Math.random()*80);

    SCENARIOS.push({
      id: `GEN-${domain.toUpperCase().slice(0,3)}-${String(i).padStart(2,"0")}`,
      domain,
      title: `Policy Decision (${domain}) #${String(i).padStart(2,"0")}`,
      description: "A regulated decision requires balancing speed, accuracy, fairness, and compliance. The AI provides a recommended action.",
      aiRecommendation: "FOLLOW model recommendation.",
      confidence: conf,
      hiddenBiasRisk: bias,
      hiddenComplianceRisk: comp,
      hiddenRiskNote: `Audit note: potential data quality issue. BiasRisk=${bias}/100, ComplianceRisk=${comp}/100. Document rationale.`,
      impacts: {
        approve:  { trust:-2, fairness:-(Math.floor(bias/25)), profit:+2, safety:(comp<40?+1:0), compliance:-(Math.floor(comp/30)) },
        override: { trust:+1, fairness:+(Math.floor(bias/20)), profit:-1, safety: 0, compliance:+1 },
        audit:    { trust: 0, fairness:+1, profit:-1, safety: 0, compliance:+3 }
      }
    });
  }
})();

// ---------- Game State ----------
const state = {
  day: 1,
  bestDay: 0,
  auditedThisTurn: false,
  metrics: { trust:70, fairness:70, profit:55, safety:70, compliance:70 },
  ledger: [], // blocks
  currentEvent: null,
  gameOver: false
};

function metricFailReason(m) {
  if (m.trust <= 0) return "Public Trust collapsed. Scandal and unrest shut the program down.";
  if (m.fairness <= 0) return "Fairness collapsed. Discrimination litigation halts all automated decisions.";
  if (m.safety <= 0) return "Safety collapsed. Critical incident triggers emergency override of the system.";
  if (m.compliance <= 0) return "Compliance failed. Regulators suspend operations immediately.";
  return "";
}

// ---------- Ledger (blockchain-like) ----------
async function initGenesis() {
  if (state.ledger.length) return;

  const genesis = {
    index: 0,
    timestampIso: nowIso(),
    eventId: "GENESIS",
    eventType: "GENESIS",
    aiRecommendation: "Initialize Governance Session",
    playerAction: "Start",
    aiConfidence: 100,
    trustDelta: 0, fairnessDelta: 0, profitDelta: 0, safetyDelta: 0, complianceDelta: 0,
    rationale: "Start of record",
    auditFindings: "",
    previousHash: "0",
    hash: ""
  };

  genesis.hash = await sha256Hex(serializeForHash(genesis));
  state.ledger.push(genesis);
}

function serializeForHash(b) {
  return [
    b.index, b.timestampIso, b.eventId, b.eventType, b.aiRecommendation, b.playerAction, b.aiConfidence,
    b.trustDelta, b.fairnessDelta, b.profitDelta, b.safetyDelta, b.complianceDelta,
    b.rationale, b.auditFindings, b.previousHash
  ].join("|");
}

async function addBlock(block) {
  const prev = state.ledger[state.ledger.length - 1];

  block.index = prev.index + 1;
  block.timestampIso = nowIso();
  block.previousHash = prev.hash;
  block.hash = await sha256Hex(serializeForHash(block));

  state.ledger.push(block);
}

async function validateChain() {
  for (let i = 1; i < state.ledger.length; i++) {
    const prev = state.ledger[i - 1];
    const cur = state.ledger[i];

    if (cur.previousHash !== prev.hash) return { ok:false, brokenAt:i };

    const recalculated = await sha256Hex(serializeForHash(cur));
    if (recalculated !== cur.hash) return { ok:false, brokenAt:i };
  }
  return { ok:true, brokenAt:-1 };
}

// ---------- UI Helpers ----------
const el = (id) => document.getElementById(id);

function mustEl(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing required element id="${id}" in your HTML.`);
  return node;
}

function setBar(id, value) {
  const pct = clamp(value, 0, 100);
  el(id).style.width = pct + "%";
}

function renderMetrics() {
  const m = state.metrics;
  el("trustVal").textContent = m.trust;
  el("fairVal").textContent = m.fairness;
  el("profitVal").textContent = m.profit;
  el("safetyVal").textContent = m.safety;
  el("compVal").textContent = m.compliance;

  setBar("trustBar", m.trust);
  setBar("fairBar", m.fairness);
  setBar("profitBar", m.profit);
  setBar("safetyBar", m.safety);
  setBar("compBar", m.compliance);
}

function renderEvent() {
  const e = state.currentEvent;
  if (!e) return;

  el("domainText").textContent = `Domain: ${e.domain}`;
  el("eventTitle").textContent = e.title;
  el("eventBody").textContent = e.description;
  el("aiRec").textContent = e.aiRecommendation;
  el("aiConf").textContent = `Confidence: ${e.confidence}%`;

  el("auditBox").style.display = state.auditedThisTurn ? "block" : "none";
  el("auditText").textContent = state.auditedThisTurn
    ? `BiasRisk=${e.hiddenBiasRisk}/100, ComplianceRisk=${e.hiddenComplianceRisk}/100. ${e.hiddenRiskNote}`
    : "";
}

function renderLedger() {
  const blocks = state.ledger.slice(-18);
  let out = "";
  for (const b of blocks) {
    out += `#${b.index} [${b.eventType}] ${b.playerAction} (AI ${b.aiConfidence}%)\n`;
    out += `  Δ T:${b.trustDelta} F:${b.fairnessDelta} P:${b.profitDelta} S:${b.safetyDelta} C:${b.complianceDelta}\n`;
    out += `  Prev: ${short(b.previousHash)}  Hash: ${short(b.hash)}\n`;
    if (b.auditFindings) out += `  ${b.auditFindings}\n`;
    out += `\n`;
  }
  el("ledgerBox").textContent = out;
}

function setTopBar(chainOk=true, brokenAt=-1) {
  el("dayText").textContent = `Day ${state.day}`;
  el("bestText").textContent = `Best: ${state.bestDay}`;

  const chainEl = el("chainText");
  chainEl.textContent = chainOk ? "Ledger: VALID" : `Ledger: INVALID @ #${brokenAt}`;
  chainEl.className = chainOk ? "pill pill-ok" : "pill";
}

function setButtonsEnabled(enabled) {
  el("approveBtn").disabled = !enabled;
  el("overrideBtn").disabled = !enabled;
  el("auditBtn").disabled = !enabled;
}

// ---------- Gameplay ----------
function pickNextEvent() {
  state.auditedThisTurn = false;
  const idx = Math.floor(Math.random() * SCENARIOS.length);
  state.currentEvent = SCENARIOS[idx];
}

function applyImpact(impact, extraPenalty) {
  const m = state.metrics;
  m.trust = clamp(m.trust + impact.trust, 0, 100);
  m.fairness = clamp(m.fairness + impact.fairness - extraPenalty.fairness, 0, 100);
  m.profit = clamp(m.profit + impact.profit, 0, 100);
  m.safety = clamp(m.safety + impact.safety, 0, 100);
  m.compliance = clamp(m.compliance + impact.compliance - extraPenalty.compliance, 0, 100);
}

function computeHiddenPenalty(event, action) {
  // If player chooses Approve/Override without audit, hidden risks can bite them.
  if (state.auditedThisTurn) return { fairness:0, compliance:0 };

  if (action === "Approve" || action === "Override") {
    const fairness = Math.floor(event.hiddenBiasRisk / 35);       // ~0..2
    const compliance = Math.floor(event.hiddenComplianceRisk / 40); // ~0..2
    return { fairness, compliance };
  }
  return { fairness:0, compliance:0 };
}

async function takeAction(action) {
  if (state.gameOver) return;

  const e = state.currentEvent;
  let impact;

  if (action === "Approve") impact = e.impacts.approve;
  else if (action === "Override") impact = e.impacts.override;
  else impact = e.impacts.audit;

  const penalty = computeHiddenPenalty(e, action);
  applyImpact(impact, penalty);

  const auditFindings = (action === "Audit")
    ? `Audit Findings: BiasRisk=${e.hiddenBiasRisk}/100, ComplianceRisk=${e.hiddenComplianceRisk}/100. ${e.hiddenRiskNote}`
    : "";

  if (action === "Audit") state.auditedThisTurn = true;

  await addBlock({
    eventId: e.id,
    eventType: e.domain,
    aiRecommendation: e.aiRecommendation,
    playerAction: action,
    aiConfidence: e.confidence,
    trustDelta: impact.trust,
    fairnessDelta: impact.fairness - penalty.fairness,
    profitDelta: impact.profit,
    safetyDelta: impact.safety,
    complianceDelta: impact.compliance - penalty.compliance,
    rationale:
      action === "Approve" ? "Followed model output to maintain throughput."
      : action === "Override" ? "Human review applied to improve fairness and trust."
      : "Performed audit for documentation & risk visibility.",
    auditFindings,
    previousHash: "",
    hash: ""
  });

  const chain = await validateChain();
  setTopBar(chain.ok, chain.brokenAt);

  renderMetrics();
  renderLedger();

  const reason = metricFailReason(state.metrics);
  if (reason) {
    state.gameOver = true;
    setButtonsEnabled(false);
    showGameOver(reason, chain);
    return;
  }

  // Next day
  state.day += 1;
  state.bestDay = Math.max(state.bestDay, state.day);

  pickNextEvent();
  renderEvent();
  renderMetrics();
  renderLedger();
}

async function auditOnly() {
  if (state.gameOver) return;
  // Audit is also an action that advances turn (by design)
  await takeAction("Audit");
}

// ---------- Game Over + API ----------
function showGameOver(reason, chain) {
  el("gameOverReason").textContent = reason;
  el("daysSurvivedText").textContent = String(state.day);
  el("bestDayText").textContent = String(state.bestDay);
  el("ledgerStatusText").textContent = chain.ok ? "VALID" : `INVALID @ #${chain.brokenAt}`;
  el("submitMsg").textContent = "";
  el("gameOverModal").style.display = "flex";
}

async function submitScore() {
  const name = el("playerName").value || "Anonymous";
  const chain = await validateChain();

  const payload = {
    name,
    daysSurvived: state.day,
    bestDay: state.bestDay,
    ledgerValid: chain.ok
  };

  el("submitMsg").textContent = "Submitting…";

  try {
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) throw new Error("Submit failed");
    el("submitMsg").textContent = "Submitted! Refreshing leaderboard…";
    await loadLeaderboard();
  } catch (e) {
    el("submitMsg").textContent = "Could not submit score (try again).";
  }
}

async function loadLeaderboard() {
  try {
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    if (!data.ok) throw new Error("lb");
    const top = data.top || [];

    if (!top.length) {
      el("leaderboard").innerHTML = "<div class='tiny'>No valid ledger runs yet.</div>";
      return;
    }

    el("leaderboard").innerHTML = top.map((r, i) => {
      return `
        <div class="row">
          <div class="name">${i+1}. ${escapeHtml(r.name)}</div>
          <div class="score">Best ${r.bestDay} • Survived ${r.daysSurvived}</div>
        </div>
      `;
    }).join("");
  } catch {
    el("leaderboard").textContent = "Leaderboard unavailable.";
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

async function pingApi() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    el("apiStatus").textContent = data.ok ? "API: OK" : "API: Down";
  } catch {
    el("apiStatus").textContent = "API: Down";
  }
}

// ---------- Restart ----------
async function restartGame() {
  state.day = 1;
  state.bestDay = 0;
  state.auditedThisTurn = false;
  state.metrics = { trust:70, fairness:70, profit:55, safety:70, compliance:70 };
  state.ledger = [];
  state.currentEvent = null;
  state.gameOver = false;

  // Hide modal if open
  const modal = document.getElementById("gameOverModal");
  if (modal) modal.style.display = "none";

  setButtonsEnabled(true);

  await initGenesis();
  pickNextEvent();

  const chain = await validateChain();
  setTopBar(chain.ok, chain.brokenAt);

  renderEvent();
  renderMetrics();
  renderLedger();
  await loadLeaderboard();
}

// ---------- Wire UI + Boot (DOM-safe) ----------
window.addEventListener("DOMContentLoaded", () => {
  mustEl("approveBtn").addEventListener("click", () => takeAction("Approve"));
  mustEl("overrideBtn").addEventListener("click", () => takeAction("Override"));
  mustEl("auditBtn").addEventListener("click", () => auditOnly());

  mustEl("validateBtn").addEventListener("click", async () => {
    const chain = await validateChain();
    setTopBar(chain.ok, chain.brokenAt);
  });

  mustEl("restartBtn").addEventListener("click", restartGame);
  mustEl("submitScoreBtn").addEventListener("click", submitScore);

  (async function boot() {
    await pingApi();
    await initGenesis();
    pickNextEvent();

    const chain = await validateChain();
    setTopBar(chain.ok, chain.brokenAt);

    renderEvent();
    renderMetrics();
    renderLedger();
    await loadLeaderboard();
  })().catch((err) => {
    console.error(err);
    alert("Game failed to start: " + err.message);
  });
});
