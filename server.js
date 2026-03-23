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
app.use(express.static(path.resolve(__dirname)));

// ─── IN-MEMORY STORE ──────────────────────────────────────────────────────────
const db = {
  members: [], products: [], plans: [], benefits: [], pricing: [],
  claims: [], audit_logs: [],
  groups: [], providers: [], authorizations: []
};

function seedDB() {
  const pid1 = uuidv4(), pid2 = uuidv4(), pid3 = uuidv4(), pid4 = uuidv4();
  db.products = [
    { id: pid1, product_code: 'PROD-HMO', product_name: 'HMO Basic', product_type: 'medical', description: 'Health Maintenance Organization basic coverage', status: 'active', created_at: new Date() },
    { id: pid2, product_code: 'PROD-PPO', product_name: 'PPO Plus', product_type: 'medical', description: 'Preferred Provider Organization plus coverage', status: 'active', created_at: new Date() },
    { id: pid3, product_code: 'PROD-DEN', product_name: 'Dental Select', product_type: 'dental', description: 'Full dental coverage including orthodontics', status: 'active', created_at: new Date() },
    { id: pid4, product_code: 'PROD-VIS', product_name: 'Vision Care', product_type: 'vision', description: 'Comprehensive vision care plan', status: 'active', created_at: new Date() }
  ];
  db.plans = [
    { id: uuidv4(), plan_code: 'PLN-001', plan_name: 'Bronze HMO', product_id: pid1, plan_type: 'hmo', effective_date: '2026-01-01', termination_date: '2026-12-31', deductible: 1500.00, oop_max: 5000.00, premium: 320.00, status: 'active', created_at: new Date() },
    { id: uuidv4(), plan_code: 'PLN-002', plan_name: 'Silver PPO', product_id: pid2, plan_type: 'ppo', effective_date: '2026-01-01', termination_date: '2026-12-31', deductible: 800.00, oop_max: 3500.00, premium: 480.00, status: 'active', created_at: new Date() },
    { id: uuidv4(), plan_code: 'PLN-003', plan_name: 'Gold PPO Elite', product_id: pid2, plan_type: 'ppo', effective_date: '2026-01-01', termination_date: '2026-12-31', deductible: 300.00, oop_max: 2000.00, premium: 720.00, status: 'active', created_at: new Date() },
    { id: uuidv4(), plan_code: 'PLN-004', plan_name: 'Platinum HDHP', product_id: pid1, plan_type: 'hdhp', effective_date: '2026-01-01', termination_date: '2026-12-31', deductible: 1400.00, oop_max: 3000.00, premium: 560.00, status: 'active', created_at: new Date() }
  ];
  db.members = [
    { id: uuidv4(), member_id: 'MBR-001', first_name: 'James', last_name: 'Carter', dob: '1985-03-15', email: 'james.carter@email.com', phone: '555-0101', plan_id: null, enrollment_tier: 'employee_only', enrollment_date: '2026-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-002', first_name: 'Sarah', last_name: 'Nguyen', dob: '1990-07-22', email: 'sarah.nguyen@email.com', phone: '555-0102', plan_id: null, enrollment_tier: 'employee_spouse', enrollment_date: '2026-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-003', first_name: 'Robert', last_name: 'Kim', dob: '1978-11-04', email: 'robert.kim@email.com', phone: '555-0103', plan_id: null, enrollment_tier: null, enrollment_date: null, status: 'inactive', created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-004', first_name: 'Maria', last_name: 'Santos', dob: '1995-05-30', email: 'maria.santos@email.com', phone: '555-0104', plan_id: null, enrollment_tier: 'family', enrollment_date: '2026-01-01', status: 'active', created_at: new Date() }
  ];
  db.benefits = [
    { id: uuidv4(), benefit_code: 'BEN-PCP', benefit_name: 'Primary Care Visit', plan_type: 'hmo', benefit_type: 'medical', copay: 20.00, coinsurance: 0, covered: 'yes', prior_auth_required: 'no', status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-SPC', benefit_name: 'Specialist Visit', plan_type: 'ppo', benefit_type: 'medical', copay: 50.00, coinsurance: 20, covered: 'yes', prior_auth_required: 'no', status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-ER', benefit_name: 'Emergency Room', plan_type: 'all', benefit_type: 'medical', copay: 250.00, coinsurance: 20, covered: 'yes', prior_auth_required: 'no', status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-RX-GEN', benefit_name: 'Generic Prescriptions', plan_type: 'all', benefit_type: 'pharmacy', copay: 10.00, coinsurance: 0, covered: 'yes', prior_auth_required: 'no', status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-MRI', benefit_name: 'MRI / CT Scan', plan_type: 'all', benefit_type: 'imaging', copay: 0, coinsurance: 20, covered: 'yes', prior_auth_required: 'yes', status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-PREV', benefit_name: 'Preventive Care (ACA)', plan_type: 'all', benefit_type: 'preventive', copay: 0, coinsurance: 0, covered: 'yes', prior_auth_required: 'no', status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-RX-BRAND', benefit_name: 'Brand Prescriptions', plan_type: 'all', benefit_type: 'pharmacy', copay: 40.00, coinsurance: 0, covered: 'yes', prior_auth_required: 'no', status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-RX-SPEC', benefit_name: 'Specialty Pharmacy', plan_type: 'all', benefit_type: 'pharmacy', copay: 0, coinsurance: 20, covered: 'yes', prior_auth_required: 'yes', status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-SURG', benefit_name: 'Inpatient Surgery', plan_type: 'all', benefit_type: 'surgical', copay: 0, coinsurance: 20, covered: 'yes', prior_auth_required: 'yes', status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-DENT-PREV', benefit_name: 'Dental Preventive', plan_type: 'all', benefit_type: 'dental', copay: 0, coinsurance: 0, covered: 'yes', prior_auth_required: 'no', status: 'active', created_at: new Date() }
  ];
  db.pricing = [
    { id: uuidv4(), pricing_code: 'PRC-001', plan_id: null, tier: 'employee_only', base_premium: 320.00, employer_contribution: 250.00, employee_contribution: 70.00, effective_date: '2026-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), pricing_code: 'PRC-002', plan_id: null, tier: 'employee_spouse', base_premium: 640.00, employer_contribution: 450.00, employee_contribution: 190.00, effective_date: '2026-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), pricing_code: 'PRC-003', plan_id: null, tier: 'employee_child', base_premium: 500.00, employer_contribution: 380.00, employee_contribution: 120.00, effective_date: '2026-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), pricing_code: 'PRC-004', plan_id: null, tier: 'family', base_premium: 900.00, employer_contribution: 600.00, employee_contribution: 300.00, effective_date: '2026-01-01', status: 'active', created_at: new Date() }
  ];
  db.claims = [
    { id: uuidv4(), claim_number: 'CLM-2026-001', member_id: null, plan_id: null, claim_type: 'professional_837p', service_date: '2026-03-10', claim_date: '2026-03-15', provider: 'City Medical Center', diagnosis_code: 'Z00.00', procedure_code: '99213', billed_amount: 250.00, allowed_amount: 180.00, paid_amount: 144.00, status: 'paid', notes: '', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2026-002', member_id: null, plan_id: null, claim_type: 'professional_837p', service_date: '2026-04-05', claim_date: '2026-04-10', provider: 'Westside Specialist Group', diagnosis_code: 'M54.5', procedure_code: '99214', billed_amount: 420.00, allowed_amount: 310.00, paid_amount: 248.00, status: 'pending', notes: 'Awaiting EOB', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2026-003', member_id: null, plan_id: null, claim_type: 'institutional_837i', service_date: '2026-04-20', claim_date: '2026-04-25', provider: 'Metro Emergency Hospital', diagnosis_code: 'S09.90', procedure_code: '99283', billed_amount: 3200.00, allowed_amount: 2400.00, paid_amount: 1920.00, status: 'paid', notes: '', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2026-004', member_id: null, plan_id: null, claim_type: 'institutional_837i', service_date: '2026-06-15', claim_date: '2026-06-20', provider: 'Valley Surgical Center', diagnosis_code: 'K40.90', procedure_code: '49505', billed_amount: 12500.00, allowed_amount: 9000.00, paid_amount: 0, status: 'in_review', notes: 'Prior auth submitted — awaiting UM decision', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2026-005', member_id: null, plan_id: null, claim_type: 'professional_837p', service_date: '2026-08-10', claim_date: '2026-08-15', provider: 'City Medical Center', diagnosis_code: 'I10', procedure_code: '99215', billed_amount: 380.00, allowed_amount: 280.00, paid_amount: 0, status: 'denied', notes: 'Out of network — no OON benefit', created_at: new Date() }
  ];
  db.groups = [
    { id: uuidv4(), group_id: 'GRP-001', employer_name: 'Acme Technology Corp', tax_id: '12-3456789', sic_code: '7372', industry: 'technology', group_size: 120, contract_start: '2026-01-01', renewal_date: '2026-12-31', contribution_model: 'defined_contribution', employer_contribution_pct: 75, waiting_period_days: 30, oe_month: 10, contact_name: 'Linda Davis', contact_email: 'hr@acmetech.com', contact_phone: '555-1000', billing_address: '100 Tech Blvd, Austin TX 78701', plan_offerings: 'Silver PPO, Gold PPO Elite, Dental Select', cobra_eligible: 'yes', erisa_plan: 'yes', status: 'active', notes: '', created_at: new Date() },
    { id: uuidv4(), group_id: 'GRP-002', employer_name: 'Blue Ridge Community Hospital', tax_id: '98-7654321', sic_code: '8062', industry: 'healthcare', group_size: 450, contract_start: '2026-01-01', renewal_date: '2026-12-31', contribution_model: 'defined_benefit', employer_contribution_pct: 90, waiting_period_days: 0, oe_month: 11, contact_name: 'Marcus Webb', contact_email: 'benefits@brchosp.org', contact_phone: '555-2000', billing_address: '500 Hospital Way, Asheville NC 28801', plan_offerings: 'HMO Basic, PPO Plus, Platinum HDHP, Dental Select, Vision Care', cobra_eligible: 'yes', erisa_plan: 'yes', status: 'active', notes: 'Key account — annual review April', created_at: new Date() },
    { id: uuidv4(), group_id: 'GRP-003', employer_name: 'Main Street Diner Group', tax_id: '55-1122334', sic_code: '5812', industry: 'hospitality', group_size: 18, contract_start: '2026-04-01', renewal_date: '2026-03-31', contribution_model: 'split', employer_contribution_pct: 50, waiting_period_days: 60, oe_month: 3, contact_name: 'Tony Rizzo', contact_email: 'tony@mainstreetdiner.com', contact_phone: '555-3000', billing_address: '22 Main St, Greenville SC 29601', plan_offerings: 'Bronze HMO', cobra_eligible: 'no', erisa_plan: 'yes', status: 'pending', notes: 'New group — awaiting final contract signatures', created_at: new Date() }
  ];
  db.providers = [
    { id: uuidv4(), npi: '1234567890', provider_name: 'City Medical Center', provider_type: 'facility', specialty: 'hospital', taxonomy_code: '282N00000X', network: 'in_network', fee_schedule: 'drg', credentialing_status: 'credentialed', capitation_eligible: 'no', pcp_panel_open: 'na', sanctioned: 'no', status: 'active', created_at: new Date() },
    { id: uuidv4(), npi: '0987654321', provider_name: 'Dr. Sarah Patel', first_name: 'Sarah', last_name: 'Patel', provider_type: 'individual', specialty: 'primary_care', taxonomy_code: '207Q00000X', network: 'in_network', fee_schedule: 'rbrvs', credentialing_status: 'credentialed', capitation_eligible: 'yes', capitation_pmpm: 22.50, pcp_panel_open: 'yes', panel_capacity: 500, sanctioned: 'no', status: 'active', created_at: new Date() },
    { id: uuidv4(), npi: '1122334455', provider_name: 'Westside Specialist Group', provider_type: 'group', specialty: 'internal_medicine', taxonomy_code: '207R00000X', network: 'preferred', fee_schedule: 'rbrvs', credentialing_status: 'credentialed', capitation_eligible: 'no', pcp_panel_open: 'no', sanctioned: 'no', status: 'active', created_at: new Date() }
  ];
  db.authorizations = [
    { id: uuidv4(), auth_number: 'AUTH-2026-001', member_id: null, provider_id: null, auth_type: 'inpatient', service_requested: 'Inpatient hospitalization — cardiac catheterization', diagnosis_code: 'I25.10', procedure_code: '93454', units_requested: 3, units_approved: 2, effective_date: '2026-04-15', expiration_date: '2026-07-15', um_decision: 'approved', decision_date: '2026-04-10', decision_by: 'Dr. Kelsey Morton, MD', urgency: 'routine', status: 'active', notes: 'Approved for 2-day inpatient stay', created_at: new Date() },
    { id: uuidv4(), auth_number: 'AUTH-2026-002', member_id: null, provider_id: null, auth_type: 'specialty_rx', service_requested: 'Adalimumab 40mg — rheumatoid arthritis', diagnosis_code: 'M05.79', procedure_code: 'J0135', units_requested: 12, units_approved: 0, effective_date: null, expiration_date: null, um_decision: 'pending', decision_date: null, decision_by: null, urgency: 'routine', status: 'pending', notes: 'Awaiting clinical documentation from prescribing physician', created_at: new Date() },
    { id: uuidv4(), auth_number: 'AUTH-2026-003', member_id: null, provider_id: null, auth_type: 'outpatient_surgery', service_requested: 'Knee arthroscopy — right knee', diagnosis_code: 'M23.61', procedure_code: '29881', units_requested: 1, units_approved: 0, effective_date: null, expiration_date: null, um_decision: 'denied', decision_date: '2026-05-02', decision_by: 'UM Team', urgency: 'routine', status: 'closed', notes: 'Denied — conservative treatment required first (PT x12 visits)', created_at: new Date() }
  ];
  console.log('✅ In-memory DB seeded');
}

// ─── FIX #1: Always seed in-memory first, THEN try Postgres ──────────────────
// Previously seedDB() was only called on PG failure — causing a race condition
// where db.groups was an empty array if a request arrived before the async
// pool.query('SELECT 1') promise resolved. Now in-memory data is always ready.
seedDB();

// ─── POSTGRES (optional) ──────────────────────────────────────────────────────
let pool = null;
let usePostgres = false;

if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
    pool.query('SELECT 1')
      .then(() => { console.log('✅ PostgreSQL connected'); usePostgres = true; })
      .catch(err => { console.log('⚠ PG failed, staying in-memory:', err.message); });
  } catch (e) { console.log('⚠ pg module error:', e.message); }
} else {
  console.log('ℹ No DATABASE_URL — using in-memory store');
}

// ─── IN-MEMORY HELPERS ────────────────────────────────────────────────────────
function memAll(t) { return [...db[t]]; }
function memFind(t, id) { return db[t].find(r => r.id === id); }
function memCreate(t, data) {
  const rec = { id: uuidv4(), ...data, created_at: new Date() };
  db[t].push(rec);
  auditLog('CREATE', t, rec.id, rec);
  return rec;
}
function memUpdate(t, id, data) {
  const i = db[t].findIndex(r => r.id === id);
  if (i === -1) return null;
  db[t][i] = { ...db[t][i], ...data, updated_at: new Date() };
  auditLog('UPDATE', t, id, data);
  return db[t][i];
}
function memDelete(t, id) {
  const i = db[t].findIndex(r => r.id === id);
  if (i === -1) return false;
  auditLog('DELETE', t, id, {});
  db[t].splice(i, 1);
  return true;
}
function auditLog(action, table_name, record_id, changes) {
  db.audit_logs.unshift({ id: uuidv4(), action, table_name, record_id, changes: JSON.stringify(changes), performed_by: 'system', created_at: new Date() });
  if (db.audit_logs.length > 1000) db.audit_logs.pop();
}

async function pgQuery(text, params = []) {
  const client = await pool.connect();
  try { return await client.query(text, params); } finally { client.release(); }
}

// ─── ROUTE FACTORY ────────────────────────────────────────────────────────────
function crudRoutes(app, route, table, pgInsert, pgUpdate) {
  app.get(`/api/${route}`, async (req, res) => {
    try {
      if (usePostgres) { const r = await pgQuery(`SELECT * FROM ${table} ORDER BY created_at DESC`); return res.json(r.rows); }
      res.json(memAll(table));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get(`/api/${route}/:id`, async (req, res) => {
    try {
      if (usePostgres) { const r = await pgQuery(`SELECT * FROM ${table} WHERE id=$1`, [req.params.id]); return r.rows.length ? res.json(r.rows[0]) : res.status(404).json({ error: 'Not found' }); }
      const rec = memFind(table, req.params.id); rec ? res.json(rec) : res.status(404).json({ error: 'Not found' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post(`/api/${route}`, async (req, res) => {
    try {
      if (usePostgres) { const r = await pgInsert(req.body); return res.status(201).json(r); }
      res.status(201).json(memCreate(table, req.body));
    } catch (e) { console.error(`POST /api/${route}:`, e.message); res.status(500).json({ error: e.message }); }
  });
  app.put(`/api/${route}/:id`, async (req, res) => {
    try {
      if (usePostgres) { const r = await pgUpdate(req.params.id, req.body); return r ? res.json(r) : res.status(404).json({ error: 'Not found' }); }
      const rec = memUpdate(table, req.params.id, req.body); rec ? res.json(rec) : res.status(404).json({ error: 'Not found' });
    } catch (e) { console.error(`PUT /api/${route}:`, e.message); res.status(500).json({ error: e.message }); }
  });
  app.delete(`/api/${route}/:id`, async (req, res) => {
    try {
      if (usePostgres) { await pgQuery(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]); return res.json({ success: true }); }
      memDelete(table, req.params.id) ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}

// ─── MEMBERS ──────────────────────────────────────────────────────────────────
crudRoutes(app, 'members', 'members',
  async (d) => { try { const r = await pgQuery(`INSERT INTO members(id,member_id,first_name,last_name,dob,email,phone,plan_id,enrollment_tier,enrollment_date,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [uuidv4(),d.member_id,d.first_name,d.last_name,d.dob||null,d.email||null,d.phone||null,d.plan_id||null,d.enrollment_tier||null,d.enrollment_date||null,d.status||'active']); return r.rows[0]; } catch(e) { const r = await pgQuery(`INSERT INTO members(id,member_id,first_name,last_name,dob,email,phone,plan_id,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[uuidv4(),d.member_id,d.first_name,d.last_name,d.dob||null,d.email||null,d.phone||null,d.plan_id||null,d.status||'active']); return r.rows[0]; } },
  async (id, d) => { try { const r = await pgQuery(`UPDATE members SET member_id=$1,first_name=$2,last_name=$3,dob=$4,email=$5,phone=$6,plan_id=$7,enrollment_tier=$8,enrollment_date=$9,status=$10,updated_at=NOW() WHERE id=$11 RETURNING *`,[d.member_id,d.first_name,d.last_name,d.dob||null,d.email||null,d.phone||null,d.plan_id||null,d.enrollment_tier||null,d.enrollment_date||null,d.status,id]); return r.rows[0]; } catch(e) { const r = await pgQuery(`UPDATE members SET member_id=$1,first_name=$2,last_name=$3,dob=$4,email=$5,phone=$6,plan_id=$7,status=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,[d.member_id,d.first_name,d.last_name,d.dob||null,d.email||null,d.phone||null,d.plan_id||null,d.status,id]); return r.rows[0]; } }
);

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
crudRoutes(app, 'products', 'products',
  async (d) => { const r = await pgQuery(`INSERT INTO products(id,product_code,product_name,product_type,description,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[uuidv4(),d.product_code,d.product_name,d.product_type||'medical',d.description||'',d.status||'active']); return r.rows[0]; },
  async (id, d) => { const r = await pgQuery(`UPDATE products SET product_code=$1,product_name=$2,product_type=$3,description=$4,status=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,[d.product_code,d.product_name,d.product_type,d.description||'',d.status,id]); return r.rows[0]; }
);

// ─── PLANS ────────────────────────────────────────────────────────────────────
crudRoutes(app, 'plans', 'plans',
  async (d) => { const r = await pgQuery(`INSERT INTO plans(id,plan_code,plan_name,product_id,effective_date,termination_date,deductible,oop_max,premium,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[uuidv4(),d.plan_code,d.plan_name,d.product_id||null,d.effective_date||null,d.termination_date||null,d.deductible||0,d.oop_max||0,d.premium||0,d.status||'active']); return r.rows[0]; },
  async (id, d) => { const r = await pgQuery(`UPDATE plans SET plan_code=$1,plan_name=$2,product_id=$3,effective_date=$4,termination_date=$5,deductible=$6,oop_max=$7,premium=$8,status=$9,updated_at=NOW() WHERE id=$10 RETURNING *`,[d.plan_code,d.plan_name,d.product_id||null,d.effective_date||null,d.termination_date||null,d.deductible||0,d.oop_max||0,d.premium||0,d.status,id]); return r.rows[0]; }
);

// ─── BENEFITS ─────────────────────────────────────────────────────────────────
app.get('/api/benefits', async (req, res) => {
  try {
    if (usePostgres) { const r = await pgQuery('SELECT * FROM benefits ORDER BY created_at DESC'); return res.json(r.rows); }
    res.json(memAll('benefits'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/benefits/:id', async (req, res) => {
  try {
    if (usePostgres) { const r = await pgQuery('SELECT * FROM benefits WHERE id=$1', [req.params.id]); return r.rows.length ? res.json(r.rows[0]) : res.status(404).json({ error: 'Not found' }); }
    const rec = memFind('benefits', req.params.id); rec ? res.json(rec) : res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/benefits', async (req, res) => {
  try {
    const d = req.body;
    if (usePostgres) {
      const r = await pgQuery('INSERT INTO benefits(id,benefit_code,benefit_name,plan_id,benefit_type,copay,coinsurance,covered,prior_auth_required) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
        [uuidv4(),d.benefit_code,d.benefit_name,d.plan_id||null,d.benefit_type||'medical',d.copay||0,d.coinsurance||0,d.covered||'yes',d.prior_auth_required||'no']);
      return res.status(201).json(r.rows[0]);
    }
    res.status(201).json(memCreate('benefits', d));
  } catch (e) { console.error('POST /api/benefits:', e.message); res.status(500).json({ error: e.message }); }
});
app.put('/api/benefits/:id', async (req, res) => {
  try {
    const d = req.body;
    if (usePostgres) {
      const r = await pgQuery('UPDATE benefits SET benefit_code=$1,benefit_name=$2,plan_id=$3,benefit_type=$4,copay=$5,coinsurance=$6,covered=$7,prior_auth_required=$8,updated_at=NOW() WHERE id=$9 RETURNING *',
        [d.benefit_code,d.benefit_name,d.plan_id||null,d.benefit_type,d.copay||0,d.coinsurance||0,d.covered||'yes',d.prior_auth_required||'no',req.params.id]);
      return r.rows[0] ? res.json(r.rows[0]) : res.status(404).json({ error: 'Not found' });
    }
    const rec = memUpdate('benefits', req.params.id, d); rec ? res.json(rec) : res.status(404).json({ error: 'Not found' });
  } catch (e) { console.error('PUT /api/benefits:', e.message); res.status(500).json({ error: e.message }); }
});
app.delete('/api/benefits/:id', async (req, res) => {
  try {
    if (usePostgres) { await pgQuery('DELETE FROM benefits WHERE id=$1', [req.params.id]); return res.json({ success: true }); }
    memDelete('benefits', req.params.id) ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PRICING ──────────────────────────────────────────────────────────────────
crudRoutes(app, 'pricing', 'pricing',
  async (d) => { const r = await pgQuery(`INSERT INTO pricing(id,pricing_code,plan_id,tier,base_premium,employer_contribution,employee_contribution,effective_date,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[uuidv4(),d.pricing_code,d.plan_id||null,d.tier,d.base_premium||0,d.employer_contribution||0,d.employee_contribution||0,d.effective_date||null,d.status||'active']); return r.rows[0]; },
  async (id, d) => { const r = await pgQuery(`UPDATE pricing SET pricing_code=$1,plan_id=$2,tier=$3,base_premium=$4,employer_contribution=$5,employee_contribution=$6,effective_date=$7,status=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,[d.pricing_code,d.plan_id||null,d.tier,d.base_premium||0,d.employer_contribution||0,d.employee_contribution||0,d.effective_date||null,d.status,id]); return r.rows[0]; }
);

// ─── CLAIMS ───────────────────────────────────────────────────────────────────
crudRoutes(app, 'claims', 'claims',
  async (d) => { const r = await pgQuery(`INSERT INTO claims(id,claim_number,member_id,plan_id,service_date,claim_date,provider,diagnosis_code,procedure_code,billed_amount,allowed_amount,paid_amount,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,[uuidv4(),d.claim_number,d.member_id||null,d.plan_id||null,d.service_date||null,d.claim_date||null,d.provider||'',d.diagnosis_code||'',d.procedure_code||'',d.billed_amount||0,d.allowed_amount||0,d.paid_amount||0,d.status||'pending',d.notes||'']); return r.rows[0]; },
  async (id, d) => { const r = await pgQuery(`UPDATE claims SET claim_number=$1,member_id=$2,plan_id=$3,service_date=$4,claim_date=$5,provider=$6,diagnosis_code=$7,procedure_code=$8,billed_amount=$9,allowed_amount=$10,paid_amount=$11,status=$12,notes=$13,updated_at=NOW() WHERE id=$14 RETURNING *`,[d.claim_number,d.member_id||null,d.plan_id||null,d.service_date||null,d.claim_date||null,d.provider||'',d.diagnosis_code||'',d.procedure_code||'',d.billed_amount||0,d.allowed_amount||0,d.paid_amount||0,d.status,d.notes||'',id]); return r.rows[0]; }
);

// ─── GROUPS ───────────────────────────────────────────────────────────────────
// FIX #2: Full INSERT/UPDATE with all 22 fields the form sends.
// Original only saved 4 columns (id, group_id, employer_name, status),
// losing industry, group_size, contribution model, contract dates,
// contact info, plan_offerings, cobra/erisa flags, notes, etc.
crudRoutes(app, 'groups', 'groups',
  async (d) => {
    const r = await pgQuery(
      `INSERT INTO groups(
        id,group_id,employer_name,tax_id,sic_code,industry,group_size,
        contract_start,renewal_date,contribution_model,employer_contribution_pct,
        waiting_period_days,oe_month,plan_offerings,
        contact_name,contact_email,contact_phone,billing_address,
        cobra_eligible,erisa_plan,notes,status
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *`,
      [
        uuidv4(),d.group_id,d.employer_name,d.tax_id||'',d.sic_code||'',
        d.industry||'other',d.group_size||0,
        d.contract_start||null,d.renewal_date||null,
        d.contribution_model||'defined_contribution',
        d.employer_contribution_pct||0,d.waiting_period_days||0,d.oe_month||10,
        d.plan_offerings||'',
        d.contact_name||'',d.contact_email||'',d.contact_phone||'',d.billing_address||'',
        d.cobra_eligible||'yes',d.erisa_plan||'yes',
        d.notes||'',d.status||'active'
      ]
    );
    return r.rows[0];
  },
  async (id, d) => {
    const r = await pgQuery(
      `UPDATE groups SET
        group_id=$1,employer_name=$2,tax_id=$3,sic_code=$4,industry=$5,
        group_size=$6,contract_start=$7,renewal_date=$8,
        contribution_model=$9,employer_contribution_pct=$10,
        waiting_period_days=$11,oe_month=$12,plan_offerings=$13,
        contact_name=$14,contact_email=$15,contact_phone=$16,billing_address=$17,
        cobra_eligible=$18,erisa_plan=$19,notes=$20,status=$21,updated_at=NOW()
      WHERE id=$22 RETURNING *`,
      [
        d.group_id,d.employer_name,d.tax_id||'',d.sic_code||'',
        d.industry||'other',d.group_size||0,
        d.contract_start||null,d.renewal_date||null,
        d.contribution_model||'defined_contribution',
        d.employer_contribution_pct||0,d.waiting_period_days||0,d.oe_month||10,
        d.plan_offerings||'',
        d.contact_name||'',d.contact_email||'',d.contact_phone||'',d.billing_address||'',
        d.cobra_eligible||'yes',d.erisa_plan||'yes',
        d.notes||'',d.status||'active',
        id
      ]
    );
    return r.rows[0];
  }
);

// ─── PROVIDERS ────────────────────────────────────────────────────────────────
crudRoutes(app, 'providers', 'providers',
  async (d) => { const r = await pgQuery(`INSERT INTO providers(id,npi,provider_name,provider_type,specialty,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[uuidv4(),d.npi,d.provider_name,d.provider_type||'individual',d.specialty||'',d.status||'active']); return r.rows[0]; },
  async (id, d) => { const r = await pgQuery(`UPDATE providers SET npi=$1,provider_name=$2,provider_type=$3,specialty=$4,status=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,[d.npi,d.provider_name,d.provider_type,d.specialty||'',d.status,id]); return r.rows[0]; }
);

// ─── AUTHORIZATIONS ───────────────────────────────────────────────────────────
crudRoutes(app, 'authorizations', 'authorizations',
  async (d) => { const r = await pgQuery(`INSERT INTO authorizations(id,auth_number,member_id,auth_type,service_requested,um_decision,status) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[uuidv4(),d.auth_number,d.member_id||null,d.auth_type||'outpatient',d.service_requested||'',d.um_decision||'pending',d.status||'pending']); return r.rows[0]; },
  async (id, d) => { const r = await pgQuery(`UPDATE authorizations SET auth_number=$1,member_id=$2,auth_type=$3,service_requested=$4,um_decision=$5,status=$6,updated_at=NOW() WHERE id=$7 RETURNING *`,[d.auth_number,d.member_id||null,d.auth_type,d.service_requested||'',d.um_decision,d.status,id]); return r.rows[0]; }
);

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
app.get('/api/audit', async (req, res) => {
  try {
    if (usePostgres) { const r = await pgQuery('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500'); return res.json(r.rows); }
    res.json(memAll('audit_logs'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── STATS ────────────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    if (usePostgres) {
      const [mem, prod, plans, ben, claims, prc, grp, prov, auths] = await Promise.all([
        pgQuery('SELECT COUNT(*) FROM members'), pgQuery('SELECT COUNT(*) FROM products'),
        pgQuery('SELECT COUNT(*) FROM plans'), pgQuery('SELECT COUNT(*) FROM benefits'),
        pgQuery("SELECT COUNT(*),COALESCE(SUM(billed_amount),0) as total,COUNT(*) FILTER(WHERE status='pending') as pending FROM claims"),
        pgQuery('SELECT COUNT(*) FROM pricing'), pgQuery('SELECT COUNT(*) FROM groups'),
        pgQuery('SELECT COUNT(*) FROM providers'), pgQuery('SELECT COUNT(*) FROM authorizations')
      ]);
      const activeMem = await pgQuery("SELECT COUNT(*) FROM members WHERE status='active'");
      return res.json({ members:+mem.rows[0].count, products:+prod.rows[0].count, plans:+plans.rows[0].count, benefits:+ben.rows[0].count, pricing:+prc.rows[0].count, claims:+claims.rows[0].count, groups:+grp.rows[0].count, providers:+prov.rows[0].count, authorizations:+auths.rows[0].count, total_claims_amount:parseFloat(claims.rows[0].total).toFixed(2), pending_claims:+claims.rows[0].pending, active_members:+activeMem.rows[0].count });
    }
    const totalBilled = db.claims.reduce((s,c) => s + parseFloat(c.billed_amount||0), 0);
    res.json({
      members: db.members.length, products: db.products.length, plans: db.plans.length,
      benefits: db.benefits.length, pricing: db.pricing.length, claims: db.claims.length,
      groups: db.groups.length, providers: db.providers.length, authorizations: db.authorizations.length,
      total_claims_amount: totalBilled.toFixed(2),
      pending_claims: db.claims.filter(c => c.status==='pending').length,
      active_members: db.members.filter(m => m.status==='active').length
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (req,res) => res.json({ status:'ok', mode: usePostgres?'postgres':'memory', uptime:process.uptime() }));

app.get('*', (req,res) => res.sendFile(path.resolve(__dirname,'index.html')));

app.listen(PORT, () => console.log(`🚀 Facets running on port ${PORT}`));

// ═══════════════════════════════════════════════════════════════════════════
// ─── MISSING API ROUTES — added to fix pages that were returning 404 ──────
// ═══════════════════════════════════════════════════════════════════════════

// ─── SERVICE GROUPS ───────────────────────────────────────────────────────────
db['service-groups'] = [
  { id: uuidv4(), service_group_code: 'SG-MED', service_group_name: 'Medical Services', category: 'medical', accumulator_bucket: 'medical', procedure_ranges: '99201-99499', revenue_codes: '', place_of_service: '11,21,22', benefit_cross_reference: 'BEN-PCP,BEN-SPC', applies_to_deductible: 'yes', applies_to_oop: 'yes', status: 'active', created_at: new Date() },
  { id: uuidv4(), service_group_code: 'SG-RX', service_group_name: 'Pharmacy Services', category: 'pharmacy', accumulator_bucket: 'pharmacy', procedure_ranges: '', revenue_codes: '0250-0259', place_of_service: '01', benefit_cross_reference: 'BEN-RX-GEN,BEN-RX-BRAND', applies_to_deductible: 'no', applies_to_oop: 'yes', status: 'active', created_at: new Date() },
  { id: uuidv4(), service_group_code: 'SG-SURG', service_group_name: 'Surgical Services', category: 'surgical', accumulator_bucket: 'medical', procedure_ranges: '10004-69990', revenue_codes: '0360-0369', place_of_service: '21,24', benefit_cross_reference: 'BEN-SURG', applies_to_deductible: 'yes', applies_to_oop: 'yes', status: 'active', created_at: new Date() },
  { id: uuidv4(), service_group_code: 'SG-DENT', service_group_name: 'Dental Services', category: 'dental', accumulator_bucket: 'dental', procedure_ranges: 'D0100-D9999', revenue_codes: '0320', place_of_service: '11', benefit_cross_reference: 'BEN-DENT-PREV', applies_to_deductible: 'no', applies_to_oop: 'yes', status: 'active', created_at: new Date() },
  { id: uuidv4(), service_group_code: 'SG-IMG', service_group_name: 'Imaging & Radiology', category: 'imaging', accumulator_bucket: 'medical', procedure_ranges: '70010-79999', revenue_codes: '0320,0324', place_of_service: '11,19,22', benefit_cross_reference: 'BEN-MRI', applies_to_deductible: 'yes', applies_to_oop: 'yes', status: 'active', created_at: new Date() }
];
app.get('/api/service-groups', (req,res) => res.json([...db['service-groups']]));
app.get('/api/service-groups/:id', (req,res) => { const r=db['service-groups'].find(x=>x.id===req.params.id); r?res.json(r):res.status(404).json({error:'Not found'}); });
app.post('/api/service-groups', (req,res) => { const r={id:uuidv4(),...req.body,created_at:new Date()}; db['service-groups'].push(r); res.status(201).json(r); });
app.put('/api/service-groups/:id', (req,res) => { const i=db['service-groups'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['service-groups'][i]={...db['service-groups'][i],...req.body,updated_at:new Date()}; res.json(db['service-groups'][i]); });
app.delete('/api/service-groups/:id', (req,res) => { const i=db['service-groups'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['service-groups'].splice(i,1); res.json({success:true}); });

// ─── PROVIDER CONTRACTS ───────────────────────────────────────────────────────
db['provider-contracts'] = [
  { id: uuidv4(), contract_number: 'CTR-2026-001', provider_name: 'City Medical Center', contract_type: 'facility', network_tier: 'in_network', reimbursement_method: 'drg', reimbursement_rate: 92.00, capitation_pmpm: 0, risk_arrangement: 'none', quality_incentive: 'yes', quality_withhold_pct: 2, auto_adjudicate: 'yes', edi_enabled: 'yes', effective_date: '2026-01-01', termination_date: '2026-12-31', carve_outs: 'transplants,CAR-T', notes: 'Tier 1 facility — auto-adjudicate all DRG claims', status: 'active', created_at: new Date() },
  { id: uuidv4(), contract_number: 'CTR-2026-002', provider_name: 'Dr. Sarah Patel', contract_type: 'individual', network_tier: 'in_network', reimbursement_method: 'rbrvs', reimbursement_rate: 110.00, capitation_pmpm: 22.50, risk_arrangement: 'partial_capitation', quality_incentive: 'yes', quality_withhold_pct: 5, auto_adjudicate: 'yes', edi_enabled: 'yes', effective_date: '2026-01-01', termination_date: '2026-12-31', carve_outs: '', notes: 'PCP capitation model — panel capped at 500', status: 'active', created_at: new Date() },
  { id: uuidv4(), contract_number: 'CTR-2026-003', provider_name: 'Westside Specialist Group', contract_type: 'group', network_tier: 'preferred', reimbursement_method: 'rbrvs', reimbursement_rate: 105.00, capitation_pmpm: 0, risk_arrangement: 'none', quality_incentive: 'no', quality_withhold_pct: 0, auto_adjudicate: 'yes', edi_enabled: 'yes', effective_date: '2026-01-01', termination_date: '2026-12-31', carve_outs: '', notes: '', status: 'active', created_at: new Date() }
];
app.get('/api/provider-contracts', (req,res) => res.json([...db['provider-contracts']]));
app.get('/api/provider-contracts/:id', (req,res) => { const r=db['provider-contracts'].find(x=>x.id===req.params.id); r?res.json(r):res.status(404).json({error:'Not found'}); });
app.post('/api/provider-contracts', (req,res) => { const r={id:uuidv4(),...req.body,created_at:new Date()}; db['provider-contracts'].push(r); res.status(201).json(r); });
app.put('/api/provider-contracts/:id', (req,res) => { const i=db['provider-contracts'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['provider-contracts'][i]={...db['provider-contracts'][i],...req.body,updated_at:new Date()}; res.json(db['provider-contracts'][i]); });
app.delete('/api/provider-contracts/:id', (req,res) => { const i=db['provider-contracts'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['provider-contracts'].splice(i,1); res.json({success:true}); });

// ─── FEE TABLES ───────────────────────────────────────────────────────────────
db['fee-tables'] = [
  { id: uuidv4(), fee_table_code: 'FT-RBRVS-NAT', fee_table_name: 'RBRVS National Standard', fee_table_type: 'rbrvs', locality: 'National', conversion_factor: 38.87, effective_date: '2026-01-01', termination_date: '2026-12-31', modifier_support: 'yes', sample_codes: '99213,99214,99215', status: 'active', created_at: new Date() },
  { id: uuidv4(), fee_table_code: 'FT-DRG-2026', fee_table_name: 'DRG Grouper 2026', fee_table_type: 'drg', locality: 'National', conversion_factor: 1.00, effective_date: '2026-01-01', termination_date: '2026-12-31', modifier_support: 'no', sample_codes: 'DRG-470,DRG-291,DRG-392', status: 'active', created_at: new Date() },
  { id: uuidv4(), fee_table_code: 'FT-DENT-ADA', fee_table_name: 'ADA Dental Fee Schedule', fee_table_type: 'dental', locality: 'National', conversion_factor: 1.00, effective_date: '2026-01-01', termination_date: '2026-12-31', modifier_support: 'no', sample_codes: 'D0120,D0210,D1110', status: 'active', created_at: new Date() },
  { id: uuidv4(), fee_table_code: 'FT-RBRVS-CAL', fee_table_name: 'RBRVS California Locality', fee_table_type: 'rbrvs', locality: 'California', conversion_factor: 41.20, effective_date: '2026-01-01', termination_date: '2026-12-31', modifier_support: 'yes', sample_codes: '99213,99214', status: 'active', created_at: new Date() }
];
app.get('/api/fee-tables', (req,res) => res.json([...db['fee-tables']]));
app.get('/api/fee-tables/:id', (req,res) => { const r=db['fee-tables'].find(x=>x.id===req.params.id); r?res.json(r):res.status(404).json({error:'Not found'}); });
app.post('/api/fee-tables', (req,res) => { const r={id:uuidv4(),...req.body,created_at:new Date()}; db['fee-tables'].push(r); res.status(201).json(r); });
app.put('/api/fee-tables/:id', (req,res) => { const i=db['fee-tables'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['fee-tables'][i]={...db['fee-tables'][i],...req.body,updated_at:new Date()}; res.json(db['fee-tables'][i]); });
app.delete('/api/fee-tables/:id', (req,res) => { const i=db['fee-tables'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['fee-tables'].splice(i,1); res.json({success:true}); });

// ─── NETWORX PRICING CONFIGS ─────────────────────────────────────────────────
db['networx-configs'] = [
  { id: uuidv4(), config_code: 'NX-INN-RBRVS', config_name: 'In-Network RBRVS Pricing', network_tier: 'in_network', pricing_method: 'rbrvs', rbrvs_pct: 110.00, fee_table_code: 'FT-RBRVS-NAT', qualifier_type: 'none', qualifier_value: '', modifier_adjustments: 'yes', place_of_service_override: 'no', geographic_adjustment: 'yes', outlier_threshold: 50000, outlier_pct: 80, status: 'active', created_at: new Date() },
  { id: uuidv4(), config_code: 'NX-PREF-RBRVS', config_name: 'Preferred Network RBRVS', network_tier: 'preferred', pricing_method: 'rbrvs', rbrvs_pct: 105.00, fee_table_code: 'FT-RBRVS-NAT', qualifier_type: 'specialty', qualifier_value: 'internal_medicine,cardiology', modifier_adjustments: 'yes', place_of_service_override: 'no', geographic_adjustment: 'yes', outlier_threshold: 75000, outlier_pct: 75, status: 'active', created_at: new Date() },
  { id: uuidv4(), config_code: 'NX-OON-UCR', config_name: 'Out-of-Network UCR', network_tier: 'out_of_network', pricing_method: 'ucr', rbrvs_pct: 80.00, fee_table_code: '', qualifier_type: 'none', qualifier_value: '', modifier_adjustments: 'no', place_of_service_override: 'no', geographic_adjustment: 'yes', outlier_threshold: 100000, outlier_pct: 60, status: 'active', created_at: new Date() },
  { id: uuidv4(), config_code: 'NX-CAP-PCP', config_name: 'PCP Capitation Model', network_tier: 'in_network', pricing_method: 'capitation', rbrvs_pct: 0, fee_table_code: '', qualifier_type: 'specialty', qualifier_value: 'primary_care,family_medicine', modifier_adjustments: 'no', place_of_service_override: 'no', geographic_adjustment: 'no', outlier_threshold: 0, outlier_pct: 0, status: 'active', created_at: new Date() }
];
app.get('/api/networx-configs', (req,res) => res.json([...db['networx-configs']]));
app.get('/api/networx-configs/:id', (req,res) => { const r=db['networx-configs'].find(x=>x.id===req.params.id); r?res.json(r):res.status(404).json({error:'Not found'}); });
app.post('/api/networx-configs', (req,res) => { const r={id:uuidv4(),...req.body,created_at:new Date()}; db['networx-configs'].push(r); res.status(201).json(r); });
app.put('/api/networx-configs/:id', (req,res) => { const i=db['networx-configs'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['networx-configs'][i]={...db['networx-configs'][i],...req.body,updated_at:new Date()}; res.json(db['networx-configs'][i]); });
app.delete('/api/networx-configs/:id', (req,res) => { const i=db['networx-configs'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['networx-configs'].splice(i,1); res.json({success:true}); });

// ─── GOVERNMENT PROGRAMS (Medicaid / Medicare) ────────────────────────────────
db['program-configs'] = [
  { id: uuidv4(), program_code: 'PGM-MCR-ADV', program_name: 'Medicare Advantage Plan', program_type: 'medicare', sub_type: 'mapd', state: 'National', cms_contract_id: 'H1234', effective_date: '2026-01-01', formulary_type: 'standard', snp_type: 'none', msp_primary: 'medicare', msp_secondary: 'commercial', crossover_claims: 'yes', spend_down_applies: 'no', prior_auth_override: 'cms_exempt', waiver_type: 'none', risk_score_model: 'v28', encounter_data_required: 'yes', cost_sharing_rules: 'cms_standard', status: 'active', created_at: new Date() },
  { id: uuidv4(), program_code: 'PGM-MCD-FFS', program_name: 'Medicaid Fee-for-Service', program_type: 'medicaid', sub_type: 'ffs', state: 'TX', cms_contract_id: 'TX-MCD-001', effective_date: '2026-01-01', formulary_type: 'state_pdl', snp_type: 'none', msp_primary: 'medicaid', msp_secondary: 'none', crossover_claims: 'yes', spend_down_applies: 'yes', prior_auth_override: 'state_exempt', waiver_type: '1115_waiver', risk_score_model: 'none', encounter_data_required: 'no', cost_sharing_rules: 'state_standard', status: 'active', created_at: new Date() },
  { id: uuidv4(), program_code: 'PGM-DSNP-001', program_name: 'D-SNP Dual Eligible Plan', program_type: 'medicare', sub_type: 'dsnp', state: 'TX', cms_contract_id: 'H5678', effective_date: '2026-01-01', formulary_type: 'enhanced', snp_type: 'dual_eligible', msp_primary: 'medicare', msp_secondary: 'medicaid', crossover_claims: 'yes', spend_down_applies: 'no', prior_auth_override: 'cms_exempt', waiver_type: 'mou', risk_score_model: 'v28', encounter_data_required: 'yes', cost_sharing_rules: 'zero_cost_share', status: 'active', created_at: new Date() }
];
app.get('/api/program-configs', (req,res) => res.json([...db['program-configs']]));
app.get('/api/program-configs/:id', (req,res) => { const r=db['program-configs'].find(x=>x.id===req.params.id); r?res.json(r):res.status(404).json({error:'Not found'}); });
app.post('/api/program-configs', (req,res) => { const r={id:uuidv4(),...req.body,created_at:new Date()}; db['program-configs'].push(r); res.status(201).json(r); });
app.put('/api/program-configs/:id', (req,res) => { const i=db['program-configs'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['program-configs'][i]={...db['program-configs'][i],...req.body,updated_at:new Date()}; res.json(db['program-configs'][i]); });
app.delete('/api/program-configs/:id', (req,res) => { const i=db['program-configs'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['program-configs'].splice(i,1); res.json({success:true}); });

// ─── CLAIM PENDS ──────────────────────────────────────────────────────────────
db['claim-pends'] = [
  { id: uuidv4(), pend_number: 'PND-2026-001', claim_id: 'CLM-2026-002', reason_code: 'AUTH-001', category: 'authorization', severity: 'high', assigned_to: 'UM Team', due_date: '2026-04-20', description: 'Prior auth not on file for specialty service', resolution_action: null, resolved_by: null, resolution_notes: null, status: 'open', created_at: new Date() },
  { id: uuidv4(), pend_number: 'PND-2026-002', claim_id: 'CLM-2026-004', reason_code: 'COB-002', category: 'coordination_of_benefits', severity: 'medium', assigned_to: 'COB Team', due_date: '2026-06-30', description: 'COB information missing — member may have other coverage', resolution_action: null, resolved_by: null, resolution_notes: null, status: 'open', created_at: new Date() },
  { id: uuidv4(), pend_number: 'PND-2026-003', claim_id: 'CLM-2026-001', reason_code: 'DUP-001', category: 'duplicate', severity: 'low', assigned_to: 'Claims Team', due_date: '2026-03-25', description: 'Possible duplicate claim — same DOS and procedure', resolution_action: 'denied_duplicate', resolved_by: 'J. Smith', resolution_notes: 'Confirmed duplicate — original CLM-2026-001 already paid', status: 'resolved', created_at: new Date() }
];
app.get('/api/claim-pends', (req,res) => res.json([...db['claim-pends']]));
app.get('/api/claim-pends/:id', (req,res) => { const r=db['claim-pends'].find(x=>x.id===req.params.id); r?res.json(r):res.status(404).json({error:'Not found'}); });
app.post('/api/claim-pends', (req,res) => { const r={id:uuidv4(),...req.body,created_at:new Date()}; db['claim-pends'].push(r); res.status(201).json(r); });
app.put('/api/claim-pends/:id', (req,res) => { const i=db['claim-pends'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['claim-pends'][i]={...db['claim-pends'][i],...req.body,updated_at:new Date()}; res.json(db['claim-pends'][i]); });
app.post('/api/claim-pends/:id/resolve', (req,res) => { const i=db['claim-pends'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['claim-pends'][i]={...db['claim-pends'][i],...req.body,status:'resolved',updated_at:new Date()}; res.json(db['claim-pends'][i]); });
app.delete('/api/claim-pends/:id', (req,res) => { const i=db['claim-pends'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['claim-pends'].splice(i,1); res.json({success:true}); });

// ─── CLASSES ──────────────────────────────────────────────────────────────────
db['classes'] = [
  { id: uuidv4(), class_code: 'CLS-FT', class_name: 'Full-Time Employees', description: 'Standard full-time employees working 30+ hours/week', eligible_plans: 'Bronze HMO, Silver PPO, Gold PPO Elite, Platinum HDHP', waiting_period_days: 30, contribution_override_pct: 75, cobra_eligible: 'yes', status: 'active', created_at: new Date() },
  { id: uuidv4(), class_code: 'CLS-PT', class_name: 'Part-Time Employees', description: 'Part-time employees working 20-29 hours/week', eligible_plans: 'Bronze HMO, Silver PPO', waiting_period_days: 60, contribution_override_pct: 50, cobra_eligible: 'yes', status: 'active', created_at: new Date() },
  { id: uuidv4(), class_code: 'CLS-EXEC', class_name: 'Executive / Management', description: 'Director level and above — enhanced benefits', eligible_plans: 'Gold PPO Elite, Platinum HDHP', waiting_period_days: 0, contribution_override_pct: 90, cobra_eligible: 'yes', status: 'active', created_at: new Date() },
  { id: uuidv4(), class_code: 'CLS-CONTR', class_name: 'Contract / Temporary', description: 'Contract workers — limited benefit eligibility', eligible_plans: 'Bronze HMO', waiting_period_days: 90, contribution_override_pct: 25, cobra_eligible: 'no', status: 'active', created_at: new Date() }
];
app.get('/api/classes', (req,res) => res.json([...db['classes']]));
app.get('/api/classes/:id', (req,res) => { const r=db['classes'].find(x=>x.id===req.params.id); r?res.json(r):res.status(404).json({error:'Not found'}); });
app.post('/api/classes', (req,res) => { const r={id:uuidv4(),...req.body,created_at:new Date()}; db['classes'].push(r); res.status(201).json(r); });
app.put('/api/classes/:id', (req,res) => { const i=db['classes'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['classes'][i]={...db['classes'][i],...req.body,updated_at:new Date()}; res.json(db['classes'][i]); });
app.delete('/api/classes/:id', (req,res) => { const i=db['classes'].findIndex(x=>x.id===req.params.id); if(i===-1)return res.status(404).json({error:'Not found'}); db['classes'].splice(i,1); res.json({success:true}); });

// ─── SQL VALIDATOR ────────────────────────────────────────────────────────────
app.post('/api/sql-validate', (req,res) => {
  const { sql } = req.body;
  if (!sql || !sql.trim()) return res.status(400).json({ error: 'No SQL provided' });
  const upper = sql.toUpperCase().trim();
  const forbidden = ['DROP ', 'TRUNCATE ', 'DELETE ', 'UPDATE ', 'INSERT ', 'ALTER ', 'CREATE ', 'GRANT ', 'REVOKE '];
  const blocked = forbidden.find(k => upper.includes(k));
  if (blocked) return res.json({ valid: false, error: `⛔ ${blocked.trim()} statements are not permitted in the validator` });
  if (!upper.startsWith('SELECT')) return res.json({ valid: false, error: '⚠ Only SELECT statements are supported' });
  // Simulate result for demo
  const tables = { MEMBERS: db.members, PLANS: db.plans, GROUPS: db['groups'] || db.groups, CLAIMS: db.claims, BENEFITS: db.benefits, PROVIDERS: db.providers };
  const matchedTable = Object.keys(tables).find(t => upper.includes(`FROM ${t}`));
  if (matchedTable) {
    const rows = tables[matchedTable].slice(0, 10);
    return res.json({ valid: true, rows, rowCount: rows.length, message: `✅ Query OK — ${rows.length} rows returned (demo mode)` });
  }
  res.json({ valid: true, rows: [], rowCount: 0, message: '✅ Query parsed OK — no matching demo table found' });
});


