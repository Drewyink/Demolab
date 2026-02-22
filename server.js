require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── IN-MEMORY STORE ──────────────────────────────────────────────────────────
const { v4: uuidv4 } = require('uuid');

const db = {
  members: [], products: [], plans: [], benefits: [],
  pricing: [], claims: [], audit_logs: []
};

function seedDB() {
  db.products = [
    { id: uuidv4(), product_code: 'PROD-HMO',  product_name: 'HMO Basic',      product_type: 'medical', description: 'Health Maintenance Organization basic coverage',    status: 'active', created_at: new Date() },
    { id: uuidv4(), product_code: 'PROD-PPO',  product_name: 'PPO Plus',        product_type: 'medical', description: 'Preferred Provider Organization plus coverage',     status: 'active', created_at: new Date() },
    { id: uuidv4(), product_code: 'PROD-DEN',  product_name: 'Dental Select',   product_type: 'dental',  description: 'Full dental coverage including orthodontics',       status: 'active', created_at: new Date() },
    { id: uuidv4(), product_code: 'PROD-VIS',  product_name: 'Vision Care',     product_type: 'vision',  description: 'Comprehensive vision care plan',                    status: 'active', created_at: new Date() }
  ];
  db.plans = [
    { id: uuidv4(), plan_code: 'PLN-001', plan_name: 'Bronze HMO',    product_id: null, effective_date: '2024-01-01', termination_date: '2024-12-31', deductible: 1500.00, oop_max: 5000.00, premium: 320.00, status: 'active', created_at: new Date() },
    { id: uuidv4(), plan_code: 'PLN-002', plan_name: 'Silver PPO',    product_id: null, effective_date: '2024-01-01', termination_date: '2024-12-31', deductible: 800.00,  oop_max: 3500.00, premium: 480.00, status: 'active', created_at: new Date() },
    { id: uuidv4(), plan_code: 'PLN-003', plan_name: 'Gold PPO Elite',product_id: null, effective_date: '2024-01-01', termination_date: '2024-12-31', deductible: 300.00,  oop_max: 2000.00, premium: 720.00, status: 'active', created_at: new Date() },
    { id: uuidv4(), plan_code: 'PLN-004', plan_name: 'Platinum HMO',  product_id: null, effective_date: '2024-01-01', termination_date: '2024-12-31', deductible: 0.00,    oop_max: 1500.00, premium: 950.00, status: 'active', created_at: new Date() }
  ];
  db.members = [
    { id: uuidv4(), member_id: 'MBR-001', first_name: 'James',  last_name: 'Carter',  dob: '1985-03-15', email: 'james.carter@email.com',  phone: '555-0101', plan_id: null, enrollment_tier: null, enrollment_date: null, status: 'active',   created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-002', first_name: 'Sarah',  last_name: 'Nguyen',  dob: '1990-07-22', email: 'sarah.nguyen@email.com',  phone: '555-0102', plan_id: null, enrollment_tier: null, enrollment_date: null, status: 'active',   created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-003', first_name: 'Robert', last_name: 'Kim',     dob: '1978-11-04', email: 'robert.kim@email.com',    phone: '555-0103', plan_id: null, enrollment_tier: null, enrollment_date: null, status: 'inactive', created_at: new Date() },
    { id: uuidv4(), member_id: 'MBR-004', first_name: 'Maria',  last_name: 'Santos',  dob: '1995-05-30', email: 'maria.santos@email.com',  phone: '555-0104', plan_id: null, enrollment_tier: null, enrollment_date: null, status: 'active',   created_at: new Date() }
  ];
  db.benefits = [
    { id: uuidv4(), benefit_code: 'BEN-PCP', benefit_name: 'Primary Care Visit', plan_id: null, benefit_type: 'medical',   copay: 20.00,  coinsurance: 0.10, covered: true, prior_auth_required: false, created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-SPC', benefit_name: 'Specialist Visit',   plan_id: null, benefit_type: 'medical',   copay: 50.00,  coinsurance: 0.20, covered: true, prior_auth_required: false, created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-ER',  benefit_name: 'Emergency Room',     plan_id: null, benefit_type: 'medical',   copay: 250.00, coinsurance: 0.20, covered: true, prior_auth_required: false, created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-RX',  benefit_name: 'Prescription Drugs', plan_id: null, benefit_type: 'pharmacy',  copay: 15.00,  coinsurance: 0.15, covered: true, prior_auth_required: false, created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-MRI', benefit_name: 'MRI/CT Scan',        plan_id: null, benefit_type: 'imaging',   copay: 0.00,   coinsurance: 0.20, covered: true, prior_auth_required: true,  created_at: new Date() },
    { id: uuidv4(), benefit_code: 'BEN-SUR', benefit_name: 'Outpatient Surgery', plan_id: null, benefit_type: 'surgical',  copay: 0.00,   coinsurance: 0.20, covered: true, prior_auth_required: true,  created_at: new Date() }
  ];
  db.pricing = [
    { id: uuidv4(), pricing_code: 'PRC-001', plan_id: null, tier: 'employee_only',   base_premium: 320.00, employer_contribution: 250.00, employee_contribution: 70.00,  effective_date: '2024-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), pricing_code: 'PRC-002', plan_id: null, tier: 'employee_spouse', base_premium: 640.00, employer_contribution: 450.00, employee_contribution: 190.00, effective_date: '2024-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), pricing_code: 'PRC-003', plan_id: null, tier: 'employee_child',  base_premium: 500.00, employer_contribution: 380.00, employee_contribution: 120.00, effective_date: '2024-01-01', status: 'active', created_at: new Date() },
    { id: uuidv4(), pricing_code: 'PRC-004', plan_id: null, tier: 'family',          base_premium: 900.00, employer_contribution: 600.00, employee_contribution: 300.00, effective_date: '2024-01-01', status: 'active', created_at: new Date() }
  ];
  db.claims = [
    { id: uuidv4(), claim_number: 'CLM-2024-001', member_id: null, plan_id: null, service_date: '2024-03-10', claim_date: '2024-03-15', provider: 'City Medical Center',      diagnosis_code: 'Z00.00', procedure_code: '99213', billed_amount: 250.00,   allowed_amount: 180.00,  paid_amount: 144.00,  status: 'paid',      notes: '', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2024-002', member_id: null, plan_id: null, service_date: '2024-04-05', claim_date: '2024-04-10', provider: 'Westside Specialist Group', diagnosis_code: 'M54.5',  procedure_code: '99214', billed_amount: 420.00,   allowed_amount: 310.00,  paid_amount: 248.00,  status: 'pending',   notes: 'Awaiting EOB', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2024-003', member_id: null, plan_id: null, service_date: '2024-04-20', claim_date: '2024-04-25', provider: 'Metro Emergency Hospital',  diagnosis_code: 'S09.90', procedure_code: '99283', billed_amount: 3200.00,  allowed_amount: 2400.00, paid_amount: 1920.00, status: 'paid',      notes: '', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2024-004', member_id: null, plan_id: null, service_date: '2024-06-15', claim_date: '2024-06-20', provider: 'Valley Surgical Center',   diagnosis_code: 'K40.90', procedure_code: '49505', billed_amount: 12500.00, allowed_amount: 9000.00, paid_amount: 7200.00, status: 'in_review', notes: 'Prior auth submitted', created_at: new Date() },
    { id: uuidv4(), claim_number: 'CLM-2024-005', member_id: null, plan_id: null, service_date: '2024-08-10', claim_date: '2024-08-15', provider: 'City Medical Center',      diagnosis_code: 'I10',    procedure_code: '99215', billed_amount: 380.00,   allowed_amount: 280.00,  paid_amount: 224.00,  status: 'denied',    notes: 'Out of network provider', created_at: new Date() }
  ];
  console.log('✅ In-memory DB seeded with sample data');
}

// ─── POSTGRES (optional) ──────────────────────────────────────────────────────
let pool = null;
let usePostgres = false;

if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    pool.query('SELECT 1').then(() => {
      console.log('✅ PostgreSQL connected');
      usePostgres = true;
    }).catch(err => {
      console.log('⚠ PostgreSQL failed, using in-memory:', err.message);
      seedDB();
    });
  } catch (e) {
    console.log('⚠ pg module error, using in-memory:', e.message);
    seedDB();
  }
} else {
  console.log('ℹ No DATABASE_URL — using in-memory store');
  seedDB();
}

// ─── IN-MEMORY CRUD HELPERS ───────────────────────────────────────────────────
function memAll(table) { return [...db[table]]; }
function memFind(table, id) { return db[table].find(r => r.id === id); }
function memCreate(table, data) {
  const record = { id: uuidv4(), ...data, created_at: new Date() };
  db[table].push(record);
  auditLog('CREATE', table, record.id, record);
  return record;
}
function memUpdate(table, id, data) {
  const idx = db[table].findIndex(r => r.id === id);
  if (idx === -1) return null;
  db[table][idx] = { ...db[table][idx], ...data, updated_at: new Date() };
  auditLog('UPDATE', table, id, data);
  return db[table][idx];
}
function memDelete(table, id) {
  const idx = db[table].findIndex(r => r.id === id);
  if (idx === -1) return false;
  auditLog('DELETE', table, id, {});
  db[table].splice(idx, 1);
  return true;
}
function auditLog(action, table_name, record_id, changes) {
  db.audit_logs.unshift({ id: uuidv4(), action, table_name, record_id, changes: JSON.stringify(changes), performed_by: 'system', created_at: new Date() });
  if (db.audit_logs.length > 500) db.audit_logs.pop();
}

// ─── POSTGRES HELPERS ─────────────────────────────────────────────────────────
async function pgQuery(text, params = []) {
  const client = await pool.connect();
  try { return await client.query(text, params); }
  finally { client.release(); }
}

// ─── ROUTE FACTORY ────────────────────────────────────────────────────────────
function crudRoutes(app, route, table, pgInsert, pgUpdate) {

  app.get(`/api/${route}`, async (req, res) => {
    try {
      if (usePostgres) {
        const r = await pgQuery(`SELECT * FROM ${table} ORDER BY created_at DESC`);
        return res.json(r.rows);
      }
      res.json(memAll(table));
    } catch (e) {
      console.error(`GET /api/${route}:`, e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.get(`/api/${route}/:id`, async (req, res) => {
    try {
      if (usePostgres) {
        const r = await pgQuery(`SELECT * FROM ${table} WHERE id=$1`, [req.params.id]);
        return r.rows.length ? res.json(r.rows[0]) : res.status(404).json({ error: 'Not found' });
      }
      const rec = memFind(table, req.params.id);
      rec ? res.json(rec) : res.status(404).json({ error: 'Not found' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post(`/api/${route}`, async (req, res) => {
    try {
      if (usePostgres) {
        const r = await pgInsert(req.body);
        return res.status(201).json(r);
      }
      res.status(201).json(memCreate(table, req.body));
    } catch (e) {
      console.error(`POST /api/${route}:`, e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.put(`/api/${route}/:id`, async (req, res) => {
    try {
      if (usePostgres) {
        const r = await pgUpdate(req.params.id, req.body);
        return r ? res.json(r) : res.status(404).json({ error: 'Not found' });
      }
      const rec = memUpdate(table, req.params.id, req.body);
      rec ? res.json(rec) : res.status(404).json({ error: 'Not found' });
    } catch (e) {
      console.error(`PUT /api/${route}:`, e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete(`/api/${route}/:id`, async (req, res) => {
    try {
      if (usePostgres) {
        await pgQuery(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
        return res.json({ success: true });
      }
      memDelete(table, req.params.id) ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

// ─── MEMBERS ──────────────────────────────────────────────────────────────────
crudRoutes(app, 'members', 'members',
  async (d) => {
    try {
      const r = await pgQuery(
        `INSERT INTO members(id,member_id,first_name,last_name,dob,email,phone,plan_id,enrollment_tier,enrollment_date,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [uuidv4(), d.member_id, d.first_name, d.last_name, d.dob||null, d.email||null, d.phone||null, d.plan_id||null, d.enrollment_tier||null, d.enrollment_date||null, d.status||'active']
      ); return r.rows[0];
    } catch(e) {
      if (e.message && e.message.includes('column')) {
        const r = await pgQuery(
          `INSERT INTO members(id,member_id,first_name,last_name,dob,email,phone,plan_id,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [uuidv4(), d.member_id, d.first_name, d.last_name, d.dob||null, d.email||null, d.phone||null, d.plan_id||null, d.status||'active']
        ); return r.rows[0];
      }
      throw e;
    }
  },
  async (id, d) => {
    try {
      const r = await pgQuery(
        `UPDATE members SET member_id=$1,first_name=$2,last_name=$3,dob=$4,email=$5,phone=$6,plan_id=$7,enrollment_tier=$8,enrollment_date=$9,status=$10,updated_at=NOW() WHERE id=$11 RETURNING *`,
        [d.member_id, d.first_name, d.last_name, d.dob||null, d.email||null, d.phone||null, d.plan_id||null, d.enrollment_tier||null, d.enrollment_date||null, d.status, id]
      ); return r.rows[0];
    } catch(e) {
      if (e.message && e.message.includes('column')) {
        const r = await pgQuery(
          `UPDATE members SET member_id=$1,first_name=$2,last_name=$3,dob=$4,email=$5,phone=$6,plan_id=$7,status=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
          [d.member_id, d.first_name, d.last_name, d.dob||null, d.email||null, d.phone||null, d.plan_id||null, d.status, id]
        ); return r.rows[0];
      }
      throw e;
    }
  }
);

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
crudRoutes(app, 'products', 'products',
  async (d) => {
    const r = await pgQuery(
      `INSERT INTO products(id,product_code,product_name,product_type,description,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uuidv4(), d.product_code, d.product_name, d.product_type||'medical', d.description||'', d.status||'active']
    ); return r.rows[0];
  },
  async (id, d) => {
    const r = await pgQuery(
      `UPDATE products SET product_code=$1,product_name=$2,product_type=$3,description=$4,status=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,
      [d.product_code, d.product_name, d.product_type, d.description||'', d.status, id]
    ); return r.rows[0];
  }
);

// ─── PLANS ────────────────────────────────────────────────────────────────────
crudRoutes(app, 'plans', 'plans',
  async (d) => {
    const r = await pgQuery(
      `INSERT INTO plans(id,plan_code,plan_name,product_id,effective_date,termination_date,deductible,oop_max,premium,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [uuidv4(), d.plan_code, d.plan_name, d.product_id||null, d.effective_date||null, d.termination_date||null, d.deductible||0, d.oop_max||0, d.premium||0, d.status||'active']
    ); return r.rows[0];
  },
  async (id, d) => {
    const r = await pgQuery(
      `UPDATE plans SET plan_code=$1,plan_name=$2,product_id=$3,effective_date=$4,termination_date=$5,deductible=$6,oop_max=$7,premium=$8,status=$9,updated_at=NOW() WHERE id=$10 RETURNING *`,
      [d.plan_code, d.plan_name, d.product_id||null, d.effective_date||null, d.termination_date||null, d.deductible||0, d.oop_max||0, d.premium||0, d.status, id]
    ); return r.rows[0];
  }
);

// ─── BENEFITS ─────────────────────────────────────────────────────────────────
crudRoutes(app, 'benefits', 'benefits',
  async (d) => {
    const r = await pgQuery(
      `INSERT INTO benefits(id,benefit_code,benefit_name,plan_id,benefit_type,copay,coinsurance,covered,prior_auth_required) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [uuidv4(), d.benefit_code, d.benefit_name, d.plan_id||null, d.benefit_type||'medical', d.copay||0, d.coinsurance||0, d.covered!==false, d.prior_auth_required||false]
    ); return r.rows[0];
  },
  async (id, d) => {
    const r = await pgQuery(
      `UPDATE benefits SET benefit_code=$1,benefit_name=$2,plan_id=$3,benefit_type=$4,copay=$5,coinsurance=$6,covered=$7,prior_auth_required=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [d.benefit_code, d.benefit_name, d.plan_id||null, d.benefit_type, d.copay||0, d.coinsurance||0, d.covered!==false, d.prior_auth_required||false, id]
    ); return r.rows[0];
  }
);

// ─── PRICING ──────────────────────────────────────────────────────────────────
crudRoutes(app, 'pricing', 'pricing',
  async (d) => {
    const r = await pgQuery(
      `INSERT INTO pricing(id,pricing_code,plan_id,tier,base_premium,employer_contribution,employee_contribution,effective_date,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [uuidv4(), d.pricing_code, d.plan_id||null, d.tier, d.base_premium||0, d.employer_contribution||0, d.employee_contribution||0, d.effective_date||null, d.status||'active']
    ); return r.rows[0];
  },
  async (id, d) => {
    const r = await pgQuery(
      `UPDATE pricing SET pricing_code=$1,plan_id=$2,tier=$3,base_premium=$4,employer_contribution=$5,employee_contribution=$6,effective_date=$7,status=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [d.pricing_code, d.plan_id||null, d.tier, d.base_premium||0, d.employer_contribution||0, d.employee_contribution||0, d.effective_date||null, d.status, id]
    ); return r.rows[0];
  }
);

// ─── CLAIMS ───────────────────────────────────────────────────────────────────
crudRoutes(app, 'claims', 'claims',
  async (d) => {
    const r = await pgQuery(
      `INSERT INTO claims(id,claim_number,member_id,plan_id,service_date,claim_date,provider,diagnosis_code,procedure_code,billed_amount,allowed_amount,paid_amount,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [uuidv4(), d.claim_number, d.member_id||null, d.plan_id||null, d.service_date||null, d.claim_date||null, d.provider||'', d.diagnosis_code||'', d.procedure_code||'', d.billed_amount||0, d.allowed_amount||0, d.paid_amount||0, d.status||'pending', d.notes||'']
    ); return r.rows[0];
  },
  async (id, d) => {
    const r = await pgQuery(
      `UPDATE claims SET claim_number=$1,member_id=$2,plan_id=$3,service_date=$4,claim_date=$5,provider=$6,diagnosis_code=$7,procedure_code=$8,billed_amount=$9,allowed_amount=$10,paid_amount=$11,status=$12,notes=$13,updated_at=NOW() WHERE id=$14 RETURNING *`,
      [d.claim_number, d.member_id||null, d.plan_id||null, d.service_date||null, d.claim_date||null, d.provider||'', d.diagnosis_code||'', d.procedure_code||'', d.billed_amount||0, d.allowed_amount||0, d.paid_amount||0, d.status, d.notes||'', id]
    ); return r.rows[0];
  }
);

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
app.get('/api/audit', async (req, res) => {
  try {
    if (usePostgres) {
      const r = await pgQuery('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
      return res.json(r.rows);
    }
    res.json(memAll('audit_logs'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    if (usePostgres) {
      const [mem, prod, plans, ben, claims, prc] = await Promise.all([
        pgQuery('SELECT COUNT(*) FROM members'),
        pgQuery('SELECT COUNT(*) FROM products'),
        pgQuery('SELECT COUNT(*) FROM plans'),
        pgQuery('SELECT COUNT(*) FROM benefits'),
        pgQuery('SELECT COUNT(*), COALESCE(SUM(billed_amount),0) as total, COUNT(*) FILTER(WHERE status=\'pending\') as pending FROM claims'),
        pgQuery('SELECT COUNT(*) FROM pricing')
      ]);
      const activeMem = await pgQuery("SELECT COUNT(*) FROM members WHERE status='active'");
      return res.json({
        members: parseInt(mem.rows[0].count),
        products: parseInt(prod.rows[0].count),
        plans: parseInt(plans.rows[0].count),
        benefits: parseInt(ben.rows[0].count),
        pricing: parseInt(prc.rows[0].count),
        claims: parseInt(claims.rows[0].count),
        total_claims_amount: parseFloat(claims.rows[0].total).toFixed(2),
        pending_claims: parseInt(claims.rows[0].pending),
        active_members: parseInt(activeMem.rows[0].count)
      });
    }
    const totalBilled = db.claims.reduce((s, c) => s + parseFloat(c.billed_amount || 0), 0);
    res.json({
      members: db.members.length,
      products: db.products.length,
      plans: db.plans.length,
      benefits: db.benefits.length,
      pricing: db.pricing.length,
      claims: db.claims.length,
      total_claims_amount: totalBilled.toFixed(2),
      pending_claims: db.claims.filter(c => c.status === 'pending').length,
      active_members: db.members.filter(m => m.status === 'active').length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: usePostgres ? 'postgres' : 'memory', uptime: process.uptime() });
});

// ─── CATCH ALL ────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Facets running on port ${PORT}`));
