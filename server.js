require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'facets-dev-secret-change-in-prod';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(403).json({ error: 'Invalid token' }); }
};

// Audit logger
const logAudit = async (userId, action, entity, entityId, oldData, newData, req) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [uuidv4(), userId, action, entity, entityId,
       oldData ? JSON.stringify(oldData) : null,
       newData ? JSON.stringify(newData) : null,
       req.ip, req.headers['user-agent']]
    );
  } catch (e) { console.error('Audit log error:', e.message); }
};

// ============================================================
// AUTH ROUTES
// ============================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username=$1 AND is_active=true', [username]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    await pool.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role, email: user.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id,username,full_name,role,email,last_login FROM users WHERE id=$1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// DASHBOARD
// ============================================================
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [members, products, plans, claims, pendingClaims] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM members WHERE is_active=true'),
      pool.query('SELECT COUNT(*) FROM products WHERE is_active=true'),
      pool.query('SELECT COUNT(*) FROM plans WHERE is_active=true'),
      pool.query('SELECT COUNT(*) FROM claims'),
      pool.query("SELECT COUNT(*) FROM claims WHERE status='pending'"),
    ]);
    const claimsTotal = await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM claims');
    const recentActivity = await pool.query(
      `SELECT al.*, u.full_name FROM audit_logs al 
       LEFT JOIN users u ON al.user_id=u.id 
       ORDER BY al.created_at DESC LIMIT 10`
    );
    res.json({
      stats: {
        members: parseInt(members.rows[0].count),
        products: parseInt(products.rows[0].count),
        plans: parseInt(plans.rows[0].count),
        claims: parseInt(claims.rows[0].count),
        pendingClaims: parseInt(pendingClaims.rows[0].count),
        claimsTotal: parseFloat(claimsTotal.rows[0].total)
      },
      recentActivity: recentActivity.rows
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// MEMBERS
// ============================================================
app.get('/api/members', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 20, status } = req.query;
    let query = `SELECT m.*, p.name as plan_name FROM members m LEFT JOIN plans p ON m.plan_id=p.id WHERE 1=1`;
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (m.first_name ILIKE $${params.length} OR m.last_name ILIKE $${params.length} OR m.email ILIKE $${params.length} OR m.member_id ILIKE $${params.length})`; }
    if (status) { params.push(status === 'active'); query += ` AND m.is_active=$${params.length}`; }
    const countResult = await pool.query(query.replace('SELECT m.*, p.name as plan_name', 'SELECT COUNT(*)'), params);
    query += ` ORDER BY m.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
    const result = await pool.query(query, params);
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/members/:id', authenticateToken, async (req, res) => {
  try {
    const member = await pool.query(`SELECT m.*, p.name as plan_name FROM members m LEFT JOIN plans p ON m.plan_id=p.id WHERE m.id=$1`, [req.params.id]);
    if (!member.rows.length) return res.status(404).json({ error: 'Member not found' });
    const claims = await pool.query('SELECT * FROM claims WHERE member_id=$1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ ...member.rows[0], claims: claims.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/members', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, date_of_birth, gender, address, city, state, zip, plan_id, employer, effective_date } = req.body;
    const member_id = 'MBR-' + Date.now().toString(36).toUpperCase();
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO members (id,member_id,first_name,last_name,email,phone,date_of_birth,gender,address,city,state,zip,plan_id,employer,effective_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [id, member_id, first_name, last_name, email, phone, date_of_birth, gender, address, city, state, zip, plan_id, employer, effective_date]
    );
    await logAudit(req.user.id, 'CREATE', 'member', id, null, result.rows[0], req);
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/members/:id', authenticateToken, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM members WHERE id=$1', [req.params.id]);
    if (!old.rows.length) return res.status(404).json({ error: 'Not found' });
    const { first_name, last_name, email, phone, date_of_birth, gender, address, city, state, zip, plan_id, employer, effective_date, is_active } = req.body;
    const result = await pool.query(
      `UPDATE members SET first_name=$1,last_name=$2,email=$3,phone=$4,date_of_birth=$5,gender=$6,address=$7,city=$8,state=$9,zip=$10,plan_id=$11,employer=$12,effective_date=$13,is_active=$14,updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [first_name, last_name, email, phone, date_of_birth, gender, address, city, state, zip, plan_id, employer, effective_date, is_active, req.params.id]
    );
    await logAudit(req.user.id, 'UPDATE', 'member', req.params.id, old.rows[0], result.rows[0], req);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/members/:id', authenticateToken, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM members WHERE id=$1', [req.params.id]);
    await pool.query('UPDATE members SET is_active=false,updated_at=NOW() WHERE id=$1', [req.params.id]);
    await logAudit(req.user.id, 'DEACTIVATE', 'member', req.params.id, old.rows[0], null, req);
    res.json({ message: 'Member deactivated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// PRODUCTS
// ============================================================
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE is_active=true ORDER BY name');
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, code, type, description, carrier, effective_date, termination_date } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO products (id,name,code,type,description,carrier,effective_date,termination_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, name, code, type, description, carrier, effective_date, termination_date]
    );
    await logAudit(req.user.id, 'CREATE', 'product', id, null, result.rows[0], req);
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    const { name, code, type, description, carrier, effective_date, termination_date, is_active } = req.body;
    const result = await pool.query(
      `UPDATE products SET name=$1,code=$2,type=$3,description=$4,carrier=$5,effective_date=$6,termination_date=$7,is_active=$8,updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name, code, type, description, carrier, effective_date, termination_date, is_active, req.params.id]
    );
    await logAudit(req.user.id, 'UPDATE', 'product', req.params.id, old.rows[0], result.rows[0], req);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active=false WHERE id=$1', [req.params.id]);
    await logAudit(req.user.id, 'DELETE', 'product', req.params.id, null, null, req);
    res.json({ message: 'Product deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// PLANS
// ============================================================
app.get('/api/plans', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pl.*, pr.name as product_name FROM plans pl LEFT JOIN products pr ON pl.product_id=pr.id WHERE pl.is_active=true ORDER BY pl.name`
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/plans', authenticateToken, async (req, res) => {
  try {
    const { name, code, product_id, plan_type, deductible, oop_max, premium_individual, premium_family, description, effective_date } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO plans (id,name,code,product_id,plan_type,deductible,oop_max,premium_individual,premium_family,description,effective_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, name, code, product_id, plan_type, deductible, oop_max, premium_individual, premium_family, description, effective_date]
    );
    await logAudit(req.user.id, 'CREATE', 'plan', id, null, result.rows[0], req);
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/plans/:id', authenticateToken, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM plans WHERE id=$1', [req.params.id]);
    const { name, code, product_id, plan_type, deductible, oop_max, premium_individual, premium_family, description, effective_date, is_active } = req.body;
    const result = await pool.query(
      `UPDATE plans SET name=$1,code=$2,product_id=$3,plan_type=$4,deductible=$5,oop_max=$6,premium_individual=$7,premium_family=$8,description=$9,effective_date=$10,is_active=$11,updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, code, product_id, plan_type, deductible, oop_max, premium_individual, premium_family, description, effective_date, is_active, req.params.id]
    );
    await logAudit(req.user.id, 'UPDATE', 'plan', req.params.id, old.rows[0], result.rows[0], req);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/plans/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE plans SET is_active=false WHERE id=$1', [req.params.id]);
    await logAudit(req.user.id, 'DELETE', 'plan', req.params.id, null, null, req);
    res.json({ message: 'Plan deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// BENEFITS
// ============================================================
app.get('/api/benefits', authenticateToken, async (req, res) => {
  try {
    const { plan_id } = req.query;
    let query = `SELECT b.*, p.name as plan_name FROM benefits b LEFT JOIN plans p ON b.plan_id=p.id WHERE 1=1`;
    const params = [];
    if (plan_id) { params.push(plan_id); query += ` AND b.plan_id=$${params.length}`; }
    query += ' ORDER BY b.category, b.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/benefits', authenticateToken, async (req, res) => {
  try {
    const { plan_id, name, category, coverage_type, coverage_value, copay, coinsurance, prior_auth_required, notes } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO benefits (id,plan_id,name,category,coverage_type,coverage_value,copay,coinsurance,prior_auth_required,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, plan_id, name, category, coverage_type, coverage_value, copay, coinsurance, prior_auth_required, notes]
    );
    await logAudit(req.user.id, 'CREATE', 'benefit', id, null, result.rows[0], req);
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/benefits/:id', authenticateToken, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM benefits WHERE id=$1', [req.params.id]);
    const { plan_id, name, category, coverage_type, coverage_value, copay, coinsurance, prior_auth_required, notes } = req.body;
    const result = await pool.query(
      `UPDATE benefits SET plan_id=$1,name=$2,category=$3,coverage_type=$4,coverage_value=$5,copay=$6,coinsurance=$7,prior_auth_required=$8,notes=$9,updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [plan_id, name, category, coverage_type, coverage_value, copay, coinsurance, prior_auth_required, notes, req.params.id]
    );
    await logAudit(req.user.id, 'UPDATE', 'benefit', req.params.id, old.rows[0], result.rows[0], req);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/benefits/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM benefits WHERE id=$1', [req.params.id]);
    await logAudit(req.user.id, 'DELETE', 'benefit', req.params.id, null, null, req);
    res.json({ message: 'Benefit deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// PRICING
// ============================================================
app.get('/api/pricing', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.*, p.name as plan_name FROM pricing pr LEFT JOIN plans p ON pr.plan_id=p.id ORDER BY p.name, pr.tier, pr.effective_date DESC`
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pricing', authenticateToken, async (req, res) => {
  try {
    const { plan_id, tier, rate_type, amount, effective_date, termination_date, age_band_min, age_band_max, notes } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO pricing (id,plan_id,tier,rate_type,amount,effective_date,termination_date,age_band_min,age_band_max,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, plan_id, tier, rate_type, amount, effective_date, termination_date, age_band_min, age_band_max, notes]
    );
    await logAudit(req.user.id, 'CREATE', 'pricing', id, null, result.rows[0], req);
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/pricing/:id', authenticateToken, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM pricing WHERE id=$1', [req.params.id]);
    const { plan_id, tier, rate_type, amount, effective_date, termination_date, age_band_min, age_band_max, notes } = req.body;
    const result = await pool.query(
      `UPDATE pricing SET plan_id=$1,tier=$2,rate_type=$3,amount=$4,effective_date=$5,termination_date=$6,age_band_min=$7,age_band_max=$8,notes=$9,updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [plan_id, tier, rate_type, amount, effective_date, termination_date, age_band_min, age_band_max, notes, req.params.id]
    );
    await logAudit(req.user.id, 'UPDATE', 'pricing', req.params.id, old.rows[0], result.rows[0], req);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/pricing/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM pricing WHERE id=$1', [req.params.id]);
    await logAudit(req.user.id, 'DELETE', 'pricing', req.params.id, null, null, req);
    res.json({ message: 'Pricing record deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// CLAIMS
// ============================================================
app.get('/api/claims', authenticateToken, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    let query = `SELECT c.*, m.first_name||' '||m.last_name as member_name, m.member_id as member_number, p.name as plan_name
                 FROM claims c 
                 LEFT JOIN members m ON c.member_id=m.id 
                 LEFT JOIN plans p ON c.plan_id=p.id 
                 WHERE 1=1`;
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (c.claim_number ILIKE $${params.length} OR m.first_name ILIKE $${params.length} OR m.last_name ILIKE $${params.length})`; }
    if (status) { params.push(status); query += ` AND c.status=$${params.length}`; }
    const countResult = await pool.query(query.replace(`SELECT c.*, m.first_name||' '||m.last_name as member_name, m.member_id as member_number, p.name as plan_name`, 'SELECT COUNT(*)'), params);
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
    const result = await pool.query(query, params);
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/claims', authenticateToken, async (req, res) => {
  try {
    const { member_id, plan_id, service_date, provider_name, diagnosis_code, procedure_code, billed_amount, allowed_amount, paid_amount, description } = req.body;
    const claim_number = 'CLM-' + Date.now().toString(36).toUpperCase();
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO claims (id,claim_number,member_id,plan_id,service_date,provider_name,diagnosis_code,procedure_code,billed_amount,allowed_amount,paid_amount,amount,description,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending') RETURNING *`,
      [id, claim_number, member_id, plan_id, service_date, provider_name, diagnosis_code, procedure_code, billed_amount, allowed_amount, paid_amount, billed_amount, description]
    );
    await logAudit(req.user.id, 'CREATE', 'claim', id, null, result.rows[0], req);
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/claims/:id', authenticateToken, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM claims WHERE id=$1', [req.params.id]);
    const { status, paid_amount, allowed_amount, denial_reason, notes } = req.body;
    const result = await pool.query(
      `UPDATE claims SET status=$1,paid_amount=$2,allowed_amount=$3,denial_reason=$4,notes=$5,updated_at=NOW(),
       processed_date=CASE WHEN $1 IN ('approved','denied') THEN NOW() ELSE processed_date END
       WHERE id=$6 RETURNING *`,
      [status, paid_amount, allowed_amount, denial_reason, notes, req.params.id]
    );
    await logAudit(req.user.id, 'UPDATE', 'claim', req.params.id, old.rows[0], result.rows[0], req);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// AUDIT LOGS
// ============================================================
app.get('/api/audit', authenticateToken, async (req, res) => {
  try {
    const { entity, action, user_id, page = 1, limit = 50, date_from, date_to } = req.query;
    let query = `SELECT al.*, u.full_name, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id WHERE 1=1`;
    const params = [];
    if (entity) { params.push(entity); query += ` AND al.entity_type=$${params.length}`; }
    if (action) { params.push(action); query += ` AND al.action=$${params.length}`; }
    if (user_id) { params.push(user_id); query += ` AND al.user_id=$${params.length}`; }
    if (date_from) { params.push(date_from); query += ` AND al.created_at>=$${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND al.created_at<=$${params.length}`; }
    const countResult = await pool.query(query.replace('SELECT al.*, u.full_name, u.username', 'SELECT COUNT(*)'), params);
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
    const result = await pool.query(query, params);
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Users list for audit filter
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, full_name, role FROM users WHERE is_active=true ORDER BY full_name');
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve HTML pages
const pages = ['members','products','plans','benefits','pricing','claims','audit'];
pages.forEach(p => {
  app.get(`/${p}`, (req, res) => res.sendFile(path.join(__dirname, 'public', `${p}.html`)));
});

app.listen(PORT, () => console.log(`🚀 Facets Sandbox running on port ${PORT}`));
