require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── IN-MEMORY STORE ──────────────────────────────────────────────────────────
const db = {
  members: [], products: [], plans: [], benefits: [],
  pricing: [], claims: [], audit_logs: []
};

function seedDB() {
  db.products = [
    { id: uuidv4(), product_code: 'PROD-HMO', product_name: 'HMO Basic', product_type: 'medical', description: 'Health Maintenance Organization basic coverage', status: 'active', created_at: new Date() },
    { id: uuidv4(), product_code: 'PROD-PPO', product_name: 'PPO Plus', product_type: 'medical', description: 'Preferred Provider Organization plus coverage', status: 'active', created_at: new Date() },
    { id: uuidv4(), product_code: 'PROD-DEN', product_name: 'Dental Select', product_type: 'dental', description: 'Full dental coverage', status: 'active', created_at: new Date() },
    { id: uuidv4(), product_code: 'PROD-VIS', product_name: 'Vision Care', product_type: 'vision', description: 'Comprehensive vision care plan', status: 'active', created_at: new Date() }
  ];
  db.plans = [
    { id: uuidv4(), plan_code: 'PLN-001', plan_name: 'Bronze HMO', effective_date: '2024-01-01', termination_date: '2024-12-31', deductible: 1500, oop_max: 5000, premium: 320, status: 'active', created_at: new Date() },
    { id: uuidv4(), plan_code: 'PLN-002', plan_name: 'Silver PPO', effective_date: '2024-01-01', termination_date: '2024-12-31', deductible: 800, oop_max: 3500, premium: 480, status: 'active', created_at: new Date() },
    { id: uuidv4(), plan_code: 'PLN-003', plan_name: 'Gold PPO Elite', effective_date: '2024-01-01', termination_date: '2024-12-31', deductible: 300, oop_max: 2000, premium: 720, status: 'active', created_at: new Date() },
    { id: uuidv4(), plan_code: 'PLN-004', plan_name: 'Platinum HMO', effective_date: '2024-01-01', termination_date: '2024-12-31', deductible: 0, oop_max: 1500, premium: 950, status: 'active', created_at: new Date() }
  ];
  db.members = [
    { id: uuidv4(), member_id: 'MBR-001', first_name: 'James', last_name: 'Carter', dob: '1985-03-15', email: 'james.carter@email.com', phone: '555-0101', status: 'active', created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-002', first_name: 'Sarah', last_name: 'Nguyen', dob: '1990-07-22', email: 'sarah.nguyen@email.com', phone: '555-0102', status: 'active', created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-003', first_name: 'Robert', last_name: 'Kim', dob: '1978-11-04', email: 'robert.kim@email.com', phone: '555-0103', status: 'inactive', created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-004', first_name: 'Maria', last_name: 'Santos', dob: '1995-05-30', email: 'maria.santos@email.com', phone: '555-0104', status: 'active', created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-005', first_name: 'David', last_name: 'Williams', dob: '1982-09-12', email: 'david.w@email.com', phone: '555-0105', status: 'active', created_at: new Date() }
  ];
  db.benefits = [
    { id: uuidv4(), benefit_code: 'BEN-PCP', benefit_name: 'Primary Care Visit', benefit_type: 'medical', copay: 20, coinsurance: 0.10, covered: true, prior_auth_required: false, created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-SPC', benefit_name: 'Specialist Visit', benefit_type: 'medical', copay: 50, coinsurance: 0.20, covered: true, prior_auth_required: false, created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-ER', benefit_name: 'Emergency Room', benefit_type: 'medical', copay: 250, coinsurance: 0.20, covered: true, prior_auth_required: false, created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-RX', benefit_name: 'Prescription Drugs', benefit_type: 'pharmacy', copay: 15, coinsurance: 0.15, covered: true, prior_auth_required: false, created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-MRI', benefit_name: 'MRI/CT Scan', benefit_type: 'imaging', copay: 0, coinsurance: 0.20, covered: true, prior_auth_required: true, created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-SUR', benefit_name: 'Outpatient Surgery', benefit_type: 'surgical', copay: 0, coinsurance: 0.20, covered: true, prior_auth_required: true, created_at: new Date() }
  ];
  db.pricing = [
    { id: uuidv4(), pricing_code: 'PRC-001', tier: 'employee_only', base_premium: 320, employer_contribution: 250, employee_contribution: 70, effective_date: '2024-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), pricing_code: 'PRC-002', tier: 'employee_spouse', base_premium: 640, employer_contribution: 450, employee_contribution: 190, effective_date: '2024-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), pricing_code: 'PRC-003', tier: 'employee_child', base_premium: 500, employer_contribution: 380, employee_contribution: 120, effective_date: '2024-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), pricing_code: 'PRC-004', tier: 'family', base_premium: 900, employer_contribution: 600, employee_contribution: 300, effective_date: '2024-01-01', status: 'active', created_at: new Date() }
  ];
  db.claims = [
    { id: uuidv4(), claim_number: 'CLM-2024-001', service_date: '2024-03-10', claim_date: '2024-03-15', provider: 'City Medical Center', diagnosis_code: 'Z00.00', procedure_code: '99213', billed_amount: 250, allowed_amount: 180, paid_amount: 144, status: 'paid', notes: '', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2024-002', service_date: '2024-04-05', claim_date: '2024-04-10', provider: 'Westside Specialist Group', diagnosis_code: 'M54.5', procedure_code: '99214', billed_amount: 420, allowed_amount: 310, paid_amount: 0, status: 'pending', notes: 'Awaiting EOB', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2024-003', service_date: '2024-04-20', claim_date: '2024-04-25', provider: 'Metro Emergency Hospital', diagnosis_code: 'S09.90', procedure_code: '99283', billed_amount: 3200, allowed_amount: 2400, paid_amount: 1920, status: 'paid', notes: '', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2024-004', service_date: '2024-06-15', claim_date: '2024-06-20', provider: 'Valley Surgical Center', diagnosis_code: 'K40.90', procedure_code: '49505', billed_amount: 12500, allowed_amount: 9000, paid_amount: 0, status: 'in_review', notes: 'Prior auth submitted', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2024-005', service_date: '2024-08-10', claim_date: '2024-08-15', provider: 'City Medical Center', diagnosis_code: 'I10', procedure_code: '99215', billed_amount: 380, allowed_amount: 0, paid_amount: 0, status: 'denied', notes: 'Out of network', created_at: new Date() }
  ];
  console.log('✅ In-memory DB seeded');
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function memAll(table) { return [...db[table]]; }
function memFind(table, id) { return db[table].find(r => r.id === id); }
function memCreate(table, data) {
  const record = { id: uuidv4(), ...data, created_at: new Date() };
  db[table].push(record);
  addAudit('CREATE', table, record.id, record);
  return record;
}
function memUpdate(table, id, data) {
  const idx = db[table].findIndex(r => r.id === id);
  if (idx === -1) return null;
  db[table][idx] = { ...db[table][idx], ...data, updated_at: new Date() };
  addAudit('UPDATE', table, id, data);
  return db[table][idx];
}
function memDelete(table, id) {
  const idx = db[table].findIndex(r => r.id === id);
  if (idx === -1) return false;
  addAudit('DELETE', table, id, {});
  db[table].splice(idx, 1);
  return true;
}
function addAudit(action, table_name, record_id, changes) {
  db.audit_logs.unshift({ id: uuidv4(), action, table_name, record_id, changes: JSON.stringify(changes), performed_by: 'system', created_at: new Date() });
  if (db.audit_logs.length > 200) db.audit_logs.pop();
}

// ─── POSTGRES (optional) ──────────────────────────────────────────────────────
let pool = null;
let usePostgres = false;

if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    pool.query('SELECT 1')
      .then(() => { console.log('✅ PostgreSQL connected'); usePostgres = true; })
      .catch(err => { console.log('⚠ PG failed, using memory:', err.message); seedDB(); });
  } catch(e) { console.log('⚠ PG error, using memory:', e.message); seedDB(); }
} else {
  console.log('ℹ No DATABASE_URL — using in-memory store');
  seedDB();
}

async function pgq(text, params = []) {
  const c = await pool.connect();
  try { return await c.query(text, params); } finally { c.release(); }
}

// ─── CRUD FACTORY ─────────────────────────────────────────────────────────────
function crud(route, table, pgInsert, pgUpdate) {
  app.get(`/api/${route}`, async (req, res) => {
    try {
      if (usePostgres) { const r = await pgq(`SELECT * FROM ${table} ORDER BY created_at DESC`); return res.json(r.rows); }
      res.json(memAll(table));
    } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
  });

  app.get(`/api/${route}/:id`, async (req, res) => {
    try {
      if (usePostgres) { const r = await pgq(`SELECT * FROM ${table} WHERE id=$1`, [req.params.id]); return r.rows.length ? res.json(r.rows[0]) : res.status(404).json({ error: 'Not found' }); }
      const rec = memFind(table, req.params.id);
      rec ? res.json(rec) : res.status(404).json({ error: 'Not found' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.post(`/api/${route}`, async (req, res) => {
    try {
      if (usePostgres) { return res.status(201).json(await pgInsert(req.body)); }
      res.status(201).json(memCreate(table, req.body));
    } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
  });

  app.put(`/api/${route}/:id`, async (req, res) => {
    try {
      if (usePostgres) { const r = await pgUpdate(req.params.id, req.body); return r ? res.json(r) : res.status(404).json({ error: 'Not found' }); }
      const rec = memUpdate(table, req.params.id, req.body);
      rec ? res.json(rec) : res.status(404).json({ error: 'Not found' });
    } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
  });

  app.delete(`/api/${route}/:id`, async (req, res) => {
    try {
      if (usePostgres) { await pgq(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]); return res.json({ success: true }); }
      memDelete(table, req.params.id) ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────
crud('members', 'members',
  async d => (await pgq(`INSERT INTO members(id,member_id,first_name,last_name,dob,email,phone,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [uuidv4(),d.member_id,d.first_name,d.last_name,d.dob||null,d.email||null,d.phone||null,d.status||'active'])).rows[0],
  async (id,d) => (await pgq(`UPDATE members SET member_id=$1,first_name=$2,last_name=$3,dob=$4,email=$5,phone=$6,status=$7,updated_at=NOW() WHERE id=$8 RETURNING *`, [d.member_id,d.first_name,d.last_name,d.dob||null,d.email||null,d.phone||null,d.status,id])).rows[0]
);

crud('products', 'products',
  async d => (await pgq(`INSERT INTO products(id,product_code,product_name,product_type,description,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [uuidv4(),d.product_code,d.product_name,d.product_type||'medical',d.description||'',d.status||'active'])).rows[0],
  async (id,d) => (await pgq(`UPDATE products SET product_code=$1,product_name=$2,product_type=$3,description=$4,status=$5,updated_at=NOW() WHERE id=$6 RETURNING *`, [d.product_code,d.product_name,d.product_type,d.description||'',d.status,id])).rows[0]
);

crud('plans', 'plans',
  async d => (await pgq(`INSERT INTO plans(id,plan_code,plan_name,effective_date,termination_date,deductible,oop_max,premium,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [uuidv4(),d.plan_code,d.plan_name,d.effective_date||null,d.termination_date||null,d.deductible||0,d.oop_max||0,d.premium||0,d.status||'active'])).rows[0],
  async (id,d) => (await pgq(`UPDATE plans SET plan_code=$1,plan_name=$2,effective_date=$3,termination_date=$4,deductible=$5,oop_max=$6,premium=$7,status=$8,updated_at=NOW() WHERE id=$9 RETURNING *`, [d.plan_code,d.plan_name,d.effective_date||null,d.termination_date||null,d.deductible||0,d.oop_max||0,d.premium||0,d.status,id])).rows[0]
);

crud('benefits', 'benefits',
  async d => (await pgq(`INSERT INTO benefits(id,benefit_code,benefit_name,benefit_type,copay,coinsurance,covered,prior_auth_required) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [uuidv4(),d.benefit_code,d.benefit_name,d.benefit_type||'medical',d.copay||0,d.coinsurance||0,d.covered!==false,d.prior_auth_required||false])).rows[0],
  async (id,d) => (await pgq(`UPDATE benefits SET benefit_code=$1,benefit_name=$2,benefit_type=$3,copay=$4,coinsurance=$5,covered=$6,prior_auth_required=$7,updated_at=NOW() WHERE id=$8 RETURNING *`, [d.benefit_code,d.benefit_name,d.benefit_type,d.copay||0,d.coinsurance||0,d.covered!==false,d.prior_auth_required||false,id])).rows[0]
);

crud('pricing', 'pricing',
  async d => (await pgq(`INSERT INTO pricing(id,pricing_code,tier,base_premium,employer_contribution,employee_contribution,effective_date,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [uuidv4(),d.pricing_code,d.tier,d.base_premium||0,d.employer_contribution||0,d.employee_contribution||0,d.effective_date||null,d.status||'active'])).rows[0],
  async (id,d) => (await pgq(`UPDATE pricing SET pricing_code=$1,tier=$2,base_premium=$3,employer_contribution=$4,employee_contribution=$5,effective_date=$6,status=$7,updated_at=NOW() WHERE id=$8 RETURNING *`, [d.pricing_code,d.tier,d.base_premium||0,d.employer_contribution||0,d.employee_contribution||0,d.effective_date||null,d.status,id])).rows[0]
);

crud('claims', 'claims',
  async d => (await pgq(`INSERT INTO claims(id,claim_number,service_date,claim_date,provider,diagnosis_code,procedure_code,billed_amount,allowed_amount,paid_amount,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`, [uuidv4(),d.claim_number,d.service_date||null,d.claim_date||null,d.provider||'',d.diagnosis_code||'',d.procedure_code||'',d.billed_amount||0,d.allowed_amount||0,d.paid_amount||0,d.status||'pending',d.notes||''])).rows[0],
  async (id,d) => (await pgq(`UPDATE claims SET claim_number=$1,service_date=$2,claim_date=$3,provider=$4,diagnosis_code=$5,procedure_code=$6,billed_amount=$7,allowed_amount=$8,paid_amount=$9,status=$10,notes=$11,updated_at=NOW() WHERE id=$12 RETURNING *`, [d.claim_number,d.service_date||null,d.claim_date||null,d.provider||'',d.diagnosis_code||'',d.procedure_code||'',d.billed_amount||0,d.allowed_amount||0,d.paid_amount||0,d.status,d.notes||'',id])).rows[0]
);

// ─── AUDIT ────────────────────────────────────────────────────────────────────
app.get('/api/audit', async (req, res) => {
  try {
    if (usePostgres) { const r = await pgq('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200'); return res.json(r.rows); }
    res.json(memAll('audit_logs'));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── STATS ────────────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    if (usePostgres) {
      const [m,p,pl,b,c,pr,am] = await Promise.all([
        pgq('SELECT COUNT(*) FROM members'),
        pgq('SELECT COUNT(*) FROM products'),
        pgq('SELECT COUNT(*) FROM plans'),
        pgq('SELECT COUNT(*) FROM benefits'),
        pgq(`SELECT COUNT(*), COALESCE(SUM(billed_amount),0) as total, COUNT(*) FILTER(WHERE status='pending') as pending FROM claims`),
        pgq('SELECT COUNT(*) FROM pricing'),
        pgq(`SELECT COUNT(*) FROM members WHERE status='active'`)
      ]);
      return res.json({ members: +m.rows[0].count, products: +p.rows[0].count, plans: +pl.rows[0].count, benefits: +b.rows[0].count, pricing: +pr.rows[0].count, claims: +c.rows[0].count, total_claims_amount: (+c.rows[0].total).toFixed(2), pending_claims: +c.rows[0].pending, active_members: +am.rows[0].count });
    }
    const totalBilled = db.claims.reduce((s,c) => s + parseFloat(c.billed_amount||0), 0);
    res.json({ members: db.members.length, products: db.products.length, plans: db.plans.length, benefits: db.benefits.length, pricing: db.pricing.length, claims: db.claims.length, total_claims_amount: totalBilled.toFixed(2), pending_claims: db.claims.filter(c=>c.status==='pending').length, active_members: db.members.filter(m=>m.status==='active').length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: usePostgres ? 'postgres' : 'memory', uptime: process.uptime() }));

// ─── FALLBACK ─────────────────────────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🚀 Facets running on port ${PORT}`));
