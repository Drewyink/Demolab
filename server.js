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
    { id: uuidv4(), benefit_code: 'BEN-PCP', benefit_name: 'Primary Care Visit', plan_type: 'hmo', benefit_type: 'medical', copay: 20.00, coinsurance: 0, deductible_individual: 0, oop_max_individual: 6000, covered: 'yes', prior_auth_required: 'no', deductible_applies: 'no', aca_preventive: 'no', cob_applies: 'no', cob_method: 'coordination', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'medical', counts_toward_deductible: 'yes', counts_toward_oop: 'yes', embedded_deductible: 'yes', hsa_eligible: 'na', referral_required: 'yes', medical_necessity: 'no', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-SPC', benefit_name: 'Specialist Visit', plan_type: 'ppo', benefit_type: 'medical', copay: 50.00, coinsurance: 20, deductible_individual: 800, oop_max_individual: 3500, covered: 'yes', prior_auth_required: 'no', deductible_applies: 'yes', aca_preventive: 'no', cob_applies: 'yes', cob_method: 'coordination', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'medical', counts_toward_deductible: 'yes', counts_toward_oop: 'yes', embedded_deductible: 'yes', hsa_eligible: 'na', referral_required: 'no', medical_necessity: 'no', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-ER', benefit_name: 'Emergency Room', plan_type: 'all', benefit_type: 'medical', copay: 250.00, coinsurance: 20, deductible_individual: 1500, oop_max_individual: 5000, covered: 'yes', prior_auth_required: 'no', deductible_applies: 'yes', aca_preventive: 'no', cob_applies: 'yes', cob_method: 'non_duplication', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'medical', counts_toward_deductible: 'yes', counts_toward_oop: 'yes', embedded_deductible: 'yes', hsa_eligible: 'na', referral_required: 'no', medical_necessity: 'no', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-RX-GEN', benefit_name: 'Generic Prescriptions', plan_type: 'all', benefit_type: 'pharmacy', copay: 10.00, coinsurance: 0, deductible_individual: 0, oop_max_individual: 0, covered: 'yes', prior_auth_required: 'no', deductible_applies: 'no', aca_preventive: 'no', cob_applies: 'no', cob_method: 'coordination', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'pharmacy', counts_toward_deductible: 'no', counts_toward_oop: 'yes', embedded_deductible: 'no', hsa_eligible: 'na', referral_required: 'no', medical_necessity: 'no', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-MRI', benefit_name: 'MRI / CT Scan', plan_type: 'all', benefit_type: 'imaging', copay: 0, coinsurance: 20, deductible_individual: 1500, oop_max_individual: 5000, covered: 'yes', prior_auth_required: 'yes', deductible_applies: 'yes', aca_preventive: 'no', cob_applies: 'no', cob_method: 'coordination', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'medical', counts_toward_deductible: 'yes', counts_toward_oop: 'yes', embedded_deductible: 'yes', hsa_eligible: 'na', referral_required: 'no', medical_necessity: 'yes', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-PREV', benefit_name: 'Preventive Care (ACA)', plan_type: 'all', benefit_type: 'preventive', copay: 0, coinsurance: 0, deductible_individual: 0, oop_max_individual: 0, covered: 'yes', prior_auth_required: 'no', deductible_applies: 'waived_preventive', aca_preventive: 'yes', cob_applies: 'no', cob_method: 'coordination', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'medical', counts_toward_deductible: 'no', counts_toward_oop: 'no', embedded_deductible: 'no', hsa_eligible: 'na', referral_required: 'no', medical_necessity: 'no', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-RX-BRAND', benefit_name: 'Brand Prescriptions', plan_type: 'all', benefit_type: 'pharmacy', copay: 40.00, coinsurance: 0, deductible_individual: 0, oop_max_individual: 0, covered: 'yes', prior_auth_required: 'no', deductible_applies: 'no', aca_preventive: 'no', cob_applies: 'no', cob_method: 'coordination', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'pharmacy', counts_toward_deductible: 'no', counts_toward_oop: 'yes', embedded_deductible: 'no', hsa_eligible: 'na', referral_required: 'no', medical_necessity: 'no', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-RX-SPEC', benefit_name: 'Specialty Pharmacy', plan_type: 'all', benefit_type: 'pharmacy', copay: 0, coinsurance: 20, deductible_individual: 0, oop_max_individual: 0, covered: 'yes', prior_auth_required: 'yes', deductible_applies: 'no', aca_preventive: 'no', cob_applies: 'no', cob_method: 'coordination', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'pharmacy', counts_toward_deductible: 'no', counts_toward_oop: 'yes', embedded_deductible: 'no', hsa_eligible: 'na', referral_required: 'no', medical_necessity: 'yes', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-SURG', benefit_name: 'Inpatient Surgery', plan_type: 'all', benefit_type: 'surgical', copay: 0, coinsurance: 20, deductible_individual: 1500, oop_max_individual: 5000, covered: 'yes', prior_auth_required: 'yes', deductible_applies: 'yes', aca_preventive: 'no', cob_applies: 'yes', cob_method: 'coordination', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'medical', counts_toward_deductible: 'yes', counts_toward_oop: 'yes', embedded_deductible: 'yes', hsa_eligible: 'na', referral_required: 'no', medical_necessity: 'yes', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-DENT-PREV', benefit_name: 'Dental Preventive', plan_type: 'all', benefit_type: 'dental', copay: 0, coinsurance: 0, deductible_individual: 0, oop_max_individual: 2000, covered: 'yes', prior_auth_required: 'no', deductible_applies: 'no', aca_preventive: 'no', cob_applies: 'no', cob_method: 'birthday_rule', medicare_interaction: 'none', medicaid_interaction: 'none', accumulator_group: 'dental', counts_toward_deductible: 'no', counts_toward_oop: 'yes', embedded_deductible: 'no', hsa_eligible: 'na', referral_required: 'no', medical_necessity: 'no', exception_category: 'none', dup_detection: true, status: 'active', created_at: new Date() }
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

// ─── POSTGRES (optional) ──────────────────────────────────────────────────────
let pool = null;
let usePostgres = false;

if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
    pool.query('SELECT 1').then(() => { console.log('✅ PostgreSQL connected'); usePostgres = true; })
      .catch(err => { console.log('⚠ PG failed, using in-memory:', err.message); seedDB(); });
  } catch (e) { console.log('⚠ pg module error:', e.message); seedDB(); }
} else {
  console.log('ℹ No DATABASE_URL — using in-memory store');
  seedDB();
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
// Full expanded CRUD — stores all fields in memory, basic fields in Postgres
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
crudRoutes(app, 'groups', 'groups',
  async (d) => { const r = await pgQuery(`INSERT INTO groups(id,group_id,employer_name,status) VALUES($1,$2,$3,$4) RETURNING *`,[uuidv4(),d.group_id,d.employer_name,d.status||'active']); return r.rows[0]; },
  async (id, d) => { const r = await pgQuery(`UPDATE groups SET group_id=$1,employer_name=$2,status=$3,updated_at=NOW() WHERE id=$4 RETURNING *`,[d.group_id,d.employer_name,d.status,id]); return r.rows[0]; }
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

app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT, () => console.log(`🚀 Facets running on port ${PORT}`));
