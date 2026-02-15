import express from "express";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new Database(path.join(__dirname, "facets.db"));

function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, "db/schema.sql"), "utf8");
  db.exec(schema);
  const seed = fs.readFileSync(path.join(__dirname, "db/seed.sql"), "utf8");
  db.exec(seed);
}
initDb();

const cents = (dollars) => Math.round(Number(dollars) * 100);
const dollars = (c) => Number((c / 100).toFixed(2));

function audit(action, entity_type, entity_id, detailsObj) {
  const stmt = db.prepare(`
    INSERT INTO audit_log(actor, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run("training-user", action, entity_type, entity_id || null, JSON.stringify(detailsObj || {}));
}

function getAllowed(plan_id, tier, code_type, code_value) {
  const row = db.prepare(`
    SELECT allowed_cents
    FROM fee_schedule
    WHERE plan_id=? AND tier_code=? AND code_type=? AND ? BETWEEN code_start AND code_end
    ORDER BY priority ASC
    LIMIT 1
  `).get(plan_id, tier, code_type, code_value);

  return row ? row.allowed_cents : null;
}

function matchRule(plan_id, tier, code_type, code_value, svcDate) {
  const row = db.prepare(`
    SELECT *
    FROM benefit_rules
    WHERE plan_id=?
      AND tier_code=?
      AND code_type=?
      AND ? BETWEEN code_start AND code_end
      AND ? BETWEEN effective_date AND term_date
    ORDER BY priority ASC
    LIMIT 1
  `).get(plan_id, tier, code_type, code_value, svcDate);

  return row || null;
}

function getBalance(member_id, plan_id, tier, type) {
  const row = db.prepare(`
    SELECT ytd_cents
    FROM member_accumulator_balances
    WHERE member_id=? AND plan_id=? AND tier_code=? AND accumulator_type=?
  `).get(member_id, plan_id, tier, type);
  return row ? row.ytd_cents : 0;
}

function setBalance(member_id, plan_id, tier, type, ytd_cents) {
  db.prepare(`
    INSERT INTO member_accumulator_balances(member_id, plan_id, tier_code, accumulator_type, ytd_cents)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(member_id, plan_id, tier_code, accumulator_type)
    DO UPDATE SET ytd_cents=excluded.ytd_cents
  `).run(member_id, plan_id, tier, type, ytd_cents);
}

function getAccumulatorLimits(plan_id, tier, type) {
  const row = db.prepare(`
    SELECT ind_limit_cents, fam_limit_cents, embedded_family
    FROM accumulators
    WHERE plan_id=? AND tier_code=? AND accumulator_type=?
  `).get(plan_id, tier, type);
  return row || null;
}

/**
 * Claim Engine (simplified but realistic flow):
 * 1) Find allowed amount (pricing)
 * 2) Match benefit rule (coverage + cost share)
 * 3) Apply copay (ER waive if admitted)
 * 4) Apply deductible (if rule says applies)
 * 5) Apply coinsurance on remaining
 * 6) Cap at OOP remaining (simplified)
 * 7) Update accumulator balances
 */
function adjudicate({ member_id, plan_id, tier_code, code_type, code_value, billed_cents, admitted, svc_date }) {
  const trace = [];
  const allowed = getAllowed(plan_id, tier_code, code_type, code_value);
  const allowed_cents = allowed ?? billed_cents;
  trace.push({ step: "pricing", detail: `Allowed=${allowed ? allowed_cents : billed_cents} cents (fee schedule ${allowed ? "hit" : "miss"})` });

  const rule = matchRule(plan_id, tier_code, code_type, code_value, svc_date);
  if (!rule) {
    trace.push({ step: "rule", detail: "No matching rule → DENY" });
    return { status: "DENY", allowed_cents, member_pay_cents: allowed_cents, plan_pay_cents: 0, applied_rule_id: null, trace };
  }
  trace.push({ step: "rule", detail: `Matched ${rule.rule_id} ${rule.label} (priority ${rule.priority})` });

  if (rule.covered === 0) {
    trace.push({ step: "coverage", detail: "Rule covered=0 → DENY" });
    return { status: "DENY", allowed_cents, member_pay_cents: allowed_cents, plan_pay_cents: 0, applied_rule_id: rule.rule_id, trace };
  }

  let remaining = allowed_cents;
  let memberPay = 0;

  // Copay
  let copay = rule.copay_cents || 0;
  if (rule.er_waive_copay_if_admit === 1 && admitted === 1) {
    trace.push({ step: "er", detail: "Admitted=1 → ER copay waived" });
    copay = 0;
  }
  if (copay > 0) {
    const applied = Math.min(copay, remaining);
    memberPay += applied;
    remaining -= applied;
    trace.push({ step: "copay", detail: `Applied copay ${applied} cents; remaining=${remaining}` });
  } else {
    trace.push({ step: "copay", detail: "No copay" });
  }

  // Deductible
  let dedApplied = 0;
  if (rule.deductible_applies === 1 && remaining > 0) {
    const lim = getAccumulatorLimits(plan_id, tier_code, "DED");
    const ytd = getBalance(member_id, plan_id, tier_code, "DED");
    const indLimit = lim?.ind_limit_cents ?? 0;
    const rem = Math.max(0, indLimit - ytd);
    dedApplied = Math.min(rem, remaining);
    memberPay += dedApplied;
    remaining -= dedApplied;
    trace.push({ step: "deductible", detail: `DED rem=${rem}; applied=${dedApplied}; remaining=${remaining}` });
  } else {
    trace.push({ step: "deductible", detail: "Deductible not applied" });
  }

  // Coinsurance (member percent)
  const pct = Math.max(0, Math.min(100, rule.member_coins_pct || 0));
  let coinsMember = 0;
  let coinsPlan = 0;
  if (remaining > 0) {
    coinsMember = Math.round(remaining * (pct / 100));
    coinsPlan = remaining - coinsMember;
    memberPay += coinsMember;
    trace.push({ step: "coins", detail: `Coins member=${coinsMember} (${pct}%) plan=${coinsPlan}` });
  }

  // OOP cap (simplified)
  const oopLim = getAccumulatorLimits(plan_id, tier_code, "OOP");
  const oopYtd = getBalance(member_id, plan_id, tier_code, "OOP");
  const oopIndLimit = oopLim?.ind_limit_cents ?? 9e15;
  const oopRem = Math.max(0, oopIndLimit - oopYtd);
  if (memberPay > oopRem) {
    const shift = memberPay - oopRem;
    memberPay = oopRem;
    trace.push({ step: "oop", detail: `OOP cap hit; shifted ${shift} cents to plan` });
  } else {
    trace.push({ step: "oop", detail: `OOP remaining=${oopRem}; memberPay within cap` });
  }

  const planPay = allowed_cents - memberPay;

  // Update accumulators
  if (dedApplied > 0) {
    const ytd = getBalance(member_id, plan_id, tier_code, "DED");
    setBalance(member_id, plan_id, tier_code, "DED", ytd + dedApplied);
  }
  const oopY = getBalance(member_id, plan_id, tier_code, "OOP");
  setBalance(member_id, plan_id, tier_code, "OOP", oopY + memberPay);

  trace.push({ step: "acc_update", detail: `Updated balances: +DED=${dedApplied}, +OOP=${memberPay}` });

  return {
    status: "PAY",
    allowed_cents,
    member_pay_cents: memberPay,
    plan_pay_cents: planPay,
    applied_rule_id: rule.rule_id,
    trace
  };
}

/* ===== API ===== */

app.get("/api/summary", (req, res) => {
  const plan = db.prepare(`SELECT * FROM plans WHERE plan_id=?`).get("PPO-GOLD-26");
  const product = db.prepare(`SELECT * FROM products WHERE product_id=?`).get(plan.product_id);
  const rules = db.prepare(`SELECT COUNT(*) as c FROM benefit_rules WHERE plan_id=?`).get(plan.plan_id);
  const claims = db.prepare(`SELECT COUNT(*) as c FROM claims`).get();
  res.json({ product, plan, ruleCount: rules.c, claimCount: claims.c });
});

app.get("/api/members", (req, res) => {
  const q = (req.query.q || "").trim();
  const rows = q
    ? db.prepare(`
        SELECT * FROM members
        WHERE mbi LIKE ? OR member_id LIKE ? OR last_name LIKE ? OR first_name LIKE ?
        ORDER BY date_entered DESC
        LIMIT 50
      `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
    : db.prepare(`SELECT * FROM members ORDER BY date_entered DESC LIMIT 50`).all();
  res.json(rows);
});

app.get("/api/members/:id", (req, res) => {
  const m = db.prepare(`SELECT * FROM members WHERE member_id=?`).get(req.params.id);
  if (!m) return res.status(404).json({ error: "Not found" });
  const balances = db.prepare(`
    SELECT tier_code, accumulator_type, ytd_cents
    FROM member_accumulator_balances
    WHERE member_id=? AND plan_id=?
    ORDER BY tier_code, accumulator_type
  `).all(m.member_id, m.plan_id);

  res.json({ member: m, balances });
});

app.put("/api/members/:id", (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  const existing = db.prepare(`SELECT * FROM members WHERE member_id=?`).get(id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const stmt = db.prepare(`
    UPDATE members
    SET status=?,
        salutation=?,
        first_name=?,
        mi=?,
        last_name=?,
        dob=?,
        sex=?,
        ssn=?,
        plan_id=?,
        pbp=?,
        segment_id=?,
        effective_date=?,
        term_date=?,
        user_modified=?,
        date_modified=?
    WHERE member_id=?
  `);

  stmt.run(
    body.status || existing.status,
    body.salutation ?? existing.salutation,
    body.first_name || existing.first_name,
    body.mi ?? existing.mi,
    body.last_name || existing.last_name,
    body.dob ?? existing.dob,
    body.sex ?? existing.sex,
    body.ssn ?? existing.ssn,
    body.plan_id || existing.plan_id,
    body.pbp ?? existing.pbp,
    body.segment_id ?? existing.segment_id,
    body.effective_date || existing.effective_date,
    body.term_date ?? existing.term_date,
    "tmsadmin",
    new Date().toISOString().slice(0, 19).replace("T", " "),
    id
  );

  audit("member.update", "member", id, { changed: body });
  res.json({ ok: true });
});

app.get("/api/products", (req, res) => {
  res.json(db.prepare(`SELECT * FROM products ORDER BY effective_date DESC`).all());
});

app.post("/api/products", (req, res) => {
  const p = req.body;
  db.prepare(`
    INSERT INTO products(product_id, product_name, lob, effective_date, term_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(p.product_id, p.product_name, p.lob, p.effective_date, p.term_date);
  audit("product.create", "product", p.product_id, p);
  res.json({ ok: true });
});

app.get("/api/plans", (req, res) => {
  res.json(db.prepare(`SELECT * FROM plans ORDER BY effective_date DESC`).all());
});

app.post("/api/plans", (req, res) => {
  const p = req.body;
  db.prepare(`
    INSERT INTO plans(plan_id, product_id, plan_name, benefit_year, effective_date, term_date, network_model, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(p.plan_id, p.product_id, p.plan_name, p.benefit_year, p.effective_date, p.term_date, p.network_model, p.notes || "");
  audit("plan.create", "plan", p.plan_id, p);
  res.json({ ok: true });
});

app.get("/api/benefits/:planId", (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM benefit_rules
    WHERE plan_id=?
    ORDER BY priority ASC
  `).all(req.params.planId);
  res.json(rows);
});

app.post("/api/benefits/:planId", (req, res) => {
  const r = req.body;
  const planId = req.params.planId;
  db.prepare(`
    INSERT INTO benefit_rules(
      rule_id, plan_id, tier_code, code_type, code_start, code_end, label,
      covered, deductible_applies, copay_cents, member_coins_pct, auth_required,
      er_waive_copay_if_admit, priority, effective_date, term_date, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    r.rule_id, planId, r.tier_code, r.code_type, r.code_start, r.code_end, r.label,
    r.covered, r.deductible_applies, r.copay_cents, r.member_coins_pct, r.auth_required,
    r.er_waive_copay_if_admit, r.priority, r.effective_date, r.term_date, r.notes || ""
  );
  audit("benefit.create", "benefit_rule", r.rule_id, r);
  res.json({ ok: true });
});

app.get("/api/pricing/:planId", (req, res) => {
  res.json(db.prepare(`
    SELECT * FROM fee_schedule
    WHERE plan_id=?
    ORDER BY priority ASC
  `).all(req.params.planId));
});

app.post("/api/claims/adjudicate", (req, res) => {
  const input = req.body;

  const member = db.prepare(`SELECT * FROM members WHERE member_id=?`).get(input.member_id);
  if (!member) return res.status(404).json({ error: "Member not found" });

  const plan_id = input.plan_id || member.plan_id;

  const result = adjudicate({
    member_id: member.member_id,
    plan_id,
    tier_code: input.tier_code,
    code_type: input.code_type,
    code_value: Number(input.code_value),
    billed_cents: cents(input.billed_amount || 0),
    admitted: input.admitted ? 1 : 0,
    svc_date: input.svc_date || "2026-02-01"
  });

  const claimId = "CLM-" + Math.random().toString(16).slice(2).toUpperCase();
  db.prepare(`
    INSERT INTO claims(
      claim_id, member_id, plan_id, tier_code, code_type, code_value,
      admitted, billed_cents, allowed_cents, status,
      member_pay_cents, plan_pay_cents, applied_rule_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    claimId, member.member_id, plan_id, input.tier_code, input.code_type, Number(input.code_value),
    input.admitted ? 1 : 0,
    cents(input.billed_amount || 0),
    result.allowed_cents,
    result.status,
    result.member_pay_cents,
    result.plan_pay_cents,
    result.applied_rule_id
  );

  audit("claim.adjudicate", "claim", claimId, { input, result });

  const balances = db.prepare(`
    SELECT tier_code, accumulator_type, ytd_cents
    FROM member_accumulator_balances
    WHERE member_id=? AND plan_id=?
    ORDER BY tier_code, accumulator_type
  `).all(member.member_id, plan_id);

  res.json({
    claim_id: claimId,
    status: result.status,
    allowed: dollars(result.allowed_cents),
    member_pay: dollars(result.member_pay_cents),
    plan_pay: dollars(result.plan_pay_cents),
    applied_rule_id: result.applied_rule_id,
    trace: result.trace,
    balances: balances.map(b => ({ ...b, ytd: dollars(b.ytd_cents) }))
  });
});

app.get("/api/claims", (req, res) => {
  res.json(db.prepare(`
    SELECT * FROM claims
    ORDER BY created_at DESC
    LIMIT 50
  `).all().map(c => ({
    ...c,
    billed: dollars(c.billed_cents),
    allowed: dollars(c.allowed_cents),
    member_pay: dollars(c.member_pay_cents),
    plan_pay: dollars(c.plan_pay_cents)
  })));
});

app.get("/api/audit", (req, res) => {
  res.json(db.prepare(`
    SELECT * FROM audit_log
    ORDER BY audit_id DESC
    LIMIT 200
  `).all());
});

app.listen(3000, () => console.log("Facets Sandbox running on http://localhost:3000"));
