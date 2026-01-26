/ ---------- Utilities ----------
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const nowIso = () => new Date().toISOString();
const short = (s) => (s && s.length > 12 ? s.slice(0, 12) + "..." : (s || ""));

async function sha256Hex(str) {
  // Web Crypto SHA-256 (works on modern browsers)
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = Array.from(new Uint8Array(buf));
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Deterministic RNG for Daily Challenge
function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

  // Audit budget / credits
  auditCredits: 3,
  auditMax: 5,

  // Policy breaches (high-risk decisions without audit)
  breachCount: 0,
  breachMax: 3,

  auditedThisTurn: false,

  // Daily challenge mode
  dailyMode: false,
  seed: "",
  rng: Math.random, // will be replaced when daily mode is on

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

function riskLabel(e) {
  const hi = isHighRisk(e);
  return hi ? `HIGH (Bias ${e.hiddenBiasRisk}/100, Comp ${e.hiddenComplianceRisk}/100)` :
              `Normal (Bias ${e.hiddenBiasRisk}/100, Comp ${e.hiddenComplianceRisk}/100)`;
}

function renderEvent() {
  const e = state.currentEvent;
  if (!e) return;

  el("domainText").textContent = `Domain: ${e.domain}`;
  el("eventTitle").textContent = e.title;
  el("eventBody").textContent = e.description;
  el("aiRec").textContent = e.aiRecommendation;
  el("aiConf").textContent = `Confidence: ${e.confidence}%`;
  el("riskLine").textContent = `Risk: ${riskLabel(e)}`;

  el("auditBox").style.display = state.auditedThisTurn ? "block" : "none";
  el("auditText").textContent = state.auditedThisTurn
    ? `BiasRisk=${e.hiddenBiasRisk}/100, ComplianceRisk=${e.hiddenComplianceRisk}/100. ${e.hiddenRiskNote}`
    : "";

  el("policyBox").style.display = "none";
  el("policyText").textContent = "";
}

function renderLedger() {
  const blocks = state.ledger.slice(-18);
  let out = "";
  for (const b of blocks) {
    out += `#${b.index} [${b.eventType}] ${b.playerAction} (AI ${b.aiConfidence}%)\n`;
    out += `  Δ T:${b.trustDelta} F:${b.fairnessDelta} P:${b.profitDelta} S:${b.safetyDelta} C:${b.complianceDelta}\n`;
    out += `  Prev: ${short(b.previousHash)}  Hash: ${short(b.hash)}\n`;
    if (b.auditFindings) out += `  ${b.auditFindings}\n`;
    if (b.rationale) out += `  Note: ${b.rationale}\n`;
    out += `\n`;
  }
  el("ledgerBox").textContent = out;
}

function setTopBar(chainOk=true, brokenAt=-1) {
  el("dayText").textContent = `Day ${state.day}`;
  el("bestText").textContent = `Best: ${state.bestDay}`;
  el("creditsText").textContent = `Audits: ${state.auditCredits}/${state.auditMax}`;
  el("modeText").textContent = state.dailyMode ? "Mode: Daily" : "Mode: Classic";
  el("seedText").textContent = `Seed: ${state.seed || "—"}`;

  const chainEl = el("chainText");
  chainEl.textContent = chainOk ? "Ledger: VALID" : `Ledger: INVALID @ #${brokenAt}`;
  chainEl.className = chainOk ? "pill pill-ok" : "pill pill-bad";
}

function setButtonsEnabled(enabled) {
  el("approveBtn").disabled = !enabled;
  el("overrideBtn").disabled = !enabled;

  // Audit disabled if out of credits
  const canAudit = enabled && state.auditCredits > 0;
  el("auditBtn").disabled = !canAudit;
}

// ---------- Gameplay Rules ----------
function isHighRisk(e) {
  // "More realistic compliance rule": treat as high risk if compliance risk high OR bias risk very high OR confidence is very high
  return (e.hiddenComplianceRisk >= 70) || (e.hiddenBiasRisk >= 80) || (e.confidence >= 92);
}

function applyImpact(impact, extraPenalty) {
  const m = state.metrics;
  m.trust = clamp(m.trust + impact.trust - (extraPenalty.trust || 0), 0, 100);
  m.fairness = clamp(m.fairness + impact.fairness - (extraPenalty.fairness || 0), 0, 100);
  m.profit = clamp(m.profit + impact.profit - (extraPenalty.profit || 0), 0, 100);
  m.safety = clamp(m.safety + impact.safety - (extraPenalty.safety || 0), 0, 100);
  m.compliance = clamp(m.compliance + impact.compliance - (extraPenalty.compliance || 0), 0, 100);
}

function computeHiddenPenalty(event, action) {
  // If player chooses Approve/Override without audit, hidden risks can bite them.
  if (state.auditedThisTurn) return { trust:0, fairness:0, profit:0, safety:0, compliance:0 };

  if (action === "Approve" || action === "Override") {
    const fairness = Math.floor(event.hiddenBiasRisk / 35);          // ~0..2
    const compliance = Math.floor(event.hiddenComplianceRisk / 40);  // ~0..2
    return { trust:0, fairness, profit:0, safety:0, compliance };
  }
  return { trust:0, fairness:0, profit:0, safety:0, compliance:0 };
}

function applyAuditCreditRegen() {
  // Audit credits regen: +1 credit every 2 days (up to max)
  if (state.day > 1 && state.day % 2 === 0) {
    state.auditCredits = Math.min(state.auditMax, state.auditCredits + 1);
  }
}

function applyCompliancePolicy(event, action) {
  // Must-audit rule for high risk decisions
  // If high risk AND action is Approve/Override AND no audit this turn => breach
  if (!isHighRisk(event)) return { breach:false, penalty:{trust:0, compliance:0}, note:"" };

  if ((action === "Approve" || action === "Override") && !state.auditedThisTurn) {
    state.breachCount += 1;

    const penalty = {
      trust: 2,         // subtract 2 trust
      compliance: 8     // subtract 8 compliance
    };

    const note = `POLICY BREACH: High-risk decision taken without audit. Breaches=${state.breachCount}/${state.breachMax}.`;
    return { breach:true, penalty, note };
  }
  return { breach:false, penalty:{trust:0, compliance:0}, note:"" };
}

function pickNextEvent() {
  state.auditedThisTurn = false;

  const r = state.dailyMode ? state.rng() : Math.random();
  const idx = Math.floor(r * SCENARIOS.length);
  state.currentEvent = SCENARIOS[idx];
}

// ---------- Actions ----------
async function takeAction(action) {
  if (state.gameOver) return;

  const e = state.currentEvent;
  let impact;

  if (action === "Approve") impact = e.impacts.approve;
  else if (action === "Override") impact = e.impacts.override;
  else impact = e.impacts.audit;

  // Audit budget
  if (action === "Audit") {
    if (state.auditCredits <= 0) return;
    state.auditCredits -= 1;
    state.auditedThisTurn = true;
  }

  // Basic hidden risk penalty (when you skip audit)
  const hiddenPenalty = computeHiddenPenalty(e, action);

  // Policy breach penalty (high-risk must audit)
  const policy = applyCompliancePolicy(e, action);

  // Apply totals
  applyImpact(impact, {
    trust: (hiddenPenalty.trust || 0) + (policy.penalty.trust || 0),
    fairness: hiddenPenalty.fairness || 0,
    profit: hiddenPenalty.profit || 0,
    safety: hiddenPenalty.safety || 0,
    compliance: (hiddenPenalty.compliance || 0) + (policy.penalty.compliance || 0)
  });

  // UI policy alert
  if (policy.breach) {
    el("policyBox").style.display = "block";
    el("policyText").textContent = policy.note;
  }

  const auditFindings = (action === "Audit")
    ? `Audit Findings: BiasRisk=${e.hiddenBiasRisk}/100, ComplianceRisk=${e.hiddenComplianceRisk}/100. ${e.hiddenRiskNote}`
    : "";

  await addBlock({
    eventId: e.id,
    eventType: e.domain,
    aiRecommendation: e.aiRecommendation,
    playerAction: action,
    aiConfidence: e.confidence,
    trustDelta: impact.trust - (policy.penalty.trust || 0),
    fairnessDelta: impact.fairness - (hiddenPenalty.fairness || 0),
    profitDelta: impact.profit,
    safetyDelta: impact.safety,
    complianceDelta: impact.compliance - (hiddenPenalty.compliance || 0) - (policy.penalty.compliance || 0),
    rationale:
      policy.breach ? "High-risk decision taken without audit (policy violation)."
      : action === "Approve" ? "Followed model output to maintain throughput."
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

  // Breach-based shutdown
  if (state.breachCount >= state.breachMax) {
    state.gameOver = true;
    setButtonsEnabled(false);
    showGameOver("Regulatory shutdown: repeated high-risk decisions were made without audit.", chain);
    return;
  }

  const reason = metricFailReason(state.metrics);
  if (reason) {
    state.gameOver = true;
    setButtonsEnabled(false);
    showGameOver(reason, chain);
    return;
  }

  // Advance day + regen credits
  state.day += 1;
  state.bestDay = Math.max(state.bestDay, state.day);
  applyAuditCreditRegen();

  pickNextEvent();
  renderEvent();
  renderMetrics();
  renderLedger();
  setButtonsEnabled(true);
}

async function auditOnly() {
  if (state.gameOver) return;
  await takeAction("Audit");
}

// ---------- Game Over + API ----------
function showGameOver(reason, chain) {
  el("gameOverReason").textContent = reason;
  el("daysSurvivedText").textContent = String(state.day);
  el("bestDayText").textContent = String(state.bestDay);
  el("ledgerStatusText").textContent = chain.ok ? "VALID" : `INVALID @ #${chain.brokenAt}`;
  el("creditsLeftText").textContent = `${state.auditCredits}/${state.auditMax}`;
  el("breachText").textContent = `${state.breachCount}/${state.breachMax}`;
  el("modeSeedText").textContent = state.dailyMode ? `Daily • ${state.seed}` : "Classic";
  el("submitMsg").textContent = "";
  el("gameOverModal").style.display = "flex";
}

function hideGameOver() {
  el("gameOverModal").style.display = "none";
}

async function submitScore() {
  const name = el("playerName").value || "Anonymous";
  const chain = await validateChain();

  const payload = {
    name,
    daysSurvived: state.day,
    bestDay: state.bestDay,
    ledgerValid: chain.ok,
    dailyMode: state.dailyMode,
    seed: state.seed,
    breaches: state.breachCount
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
  const dailyOnly = el("lbDailyToggle").checked;
  const qs = new URLSearchParams();
  if (dailyOnly) {
    qs.set("daily", "1");
    if (state.seed) qs.set("seed", state.seed);
  }

  try {
    const res = await fetch("/api/leaderboard?" + qs.toString());
    const data = await res.json();
    if (!data.ok) throw new Error("lb");
    const top = data.top || [];

    if (!top.length) {
      el("leaderboard").innerHTML = "<div class='tiny'>No valid ledger runs yet.</div>";
      return;
    }

    el("leaderboard").innerHTML = top.map((r, i) => {
      const tag = r.dailyMode ? ` • Daily` : "";
      return `
        <div class="row">
          <div class="name">${i+1}. ${escapeHtml(r.name)}</div>
          <div class="score">Best ${r.bestDay} • Survived ${r.daysSurvived}${tag}</div>
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

// Daily mode: fetch seed from server
async function fetchTodaySeed() {
  const res = await fetch("/api/daily-seed");
  const data = await res.json();
  return data.seed || "";
}

function setDailyMode(on, seed) {
  state.dailyMode = Boolean(on);
  state.seed = on ? (seed || state.seed) : "";
  if (state.dailyMode) {
    const s = state.seed || "seed";
    state.rng = mulberry32(fnv1a32(s));
  } else {
    state.rng = Math.random;
  }
}

// ---------- Export ledger ----------
function exportLedger() {
  const payload = {
    exportedAt: nowIso(),
    dailyMode: state.dailyMode,
    seed: state.seed,
    breachCount: state.breachCount,
    metrics: state.metrics,
    ledger: state.ledger
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-ethics-ledger-${state.dailyMode ? state.seed : "classic"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Restart ----------
async function restartGame() {
  state.day = 1;
  state.bestDay = 0;
  state.auditCredits = 3;
  state.breachCount = 0;
  state.auditedThisTurn = false;
  state.metrics = { trust:70, fairness:70, profit:55, safety:70, compliance:70 };
  state.ledger = [];
  state.currentEvent = null;
  state.gameOver = false;

  hideGameOver();
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

// ---------- Wire UI ----------
el("approveBtn").addEventListener("click", () => takeAction("Approve"));
el("overrideBtn").addEventListener("click", () => takeAction("Override"));
el("auditBtn").addEventListener("click", () => auditOnly());

el("validateBtn").addEventListener("click", async () => {
  const chain = await validateChain();
  setTopBar(chain.ok, chain.brokenAt);
});

el("exportBtn").addEventListener("click", exportLedger);

el("restartBtn").addEventListener("click", restartGame);
el("submitScoreBtn").addEventListener("click", submitScore);

el("dailyToggle").addEventListener("change", async (e) => {
  const on = e.target.checked;
  if (on && !state.seed) {
    state.seed = await fetchTodaySeed();
  }
  setDailyMode(on, state.seed);
  await restartGame();
});

el("newDailyBtn").addEventListener("click", async () => {
  state.seed = await fetchTodaySeed();
  el("dailyToggle").checked = true;
  setDailyMode(true, state.seed);
  await restartGame();
});

el("lbDailyToggle").addEventListener("change", loadLeaderboard);

// ---------- Boot ----------
(async function boot() {
  await pingApi();

  // Default seed to today (but daily mode is off unless user enables)
  try {
    state.seed = await fetchTodaySeed();
  } catch {
    state.seed = "";
  }

  setDailyMode(false, "");

  await initGenesis();
  pickNextEvent();

  const chain = await validateChain();
  setTopBar(chain.ok, chain.brokenAt);

  renderEvent();
  renderMetrics();
  renderLedger();
  setButtonsEnabled(true);

  await loadLeaderboard();
})();

