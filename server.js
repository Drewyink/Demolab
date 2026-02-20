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
const JWT_SECRET = process.env.JWT_SECRET || 'facets-dev-secret-2024';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// ── SETUP — visit /api/setup once after first deploy ──────────
app.get('/api/setup', async (req, res) => {
  try {
    const hash = await bcrypt.hash('password', 10);
    // create tables
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'analyst',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'medical',
        description TEXT,
        carrier VARCHAR(100),
        effective_date DATE,
        termination_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        product_id UUID REFERENCES products(id),
        plan_type VARCHAR(50),
        deductible DECIMAL(10,2) DEFAULT 0,
        oop_max DECIMAL(10,2) DEFAULT 0,
        premium_individual DECIMAL(10,2) DEFAULT 0,
        premium_family DECIMAL(10,2) DEFAULT 0,
        description TEXT,
        effective_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_id VARCHAR(30) UNIQUE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        date_of_birth DATE,
        gender VARCHAR(20),
        address VARCHAR(200),
        city VARCHAR(100),
        state VARCHAR(2),
        zip VARCHAR(10),
        plan_id UUID REFERENCES plans(id),
        employer VARCHAR(100),
        effective_date DATE,
        termination_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS benefits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        coverage_type VARCHAR(30),
        coverage_value DECIMAL(10,2),
        copay DECIMAL(10,2) DEFAULT 0,
        coinsurance DECIMAL(5,2) DEFAULT 0,
        prior_auth_required BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pricing (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
        tier VARCHAR(30),
        rate_type VARCHAR(30) DEFAULT 'monthly',
        amount DECIMAL(10,2) NOT NULL,
        effective_date DATE NOT NULL,
        termination_date DATE,
        age_band_min INTEGER,
        age_band_max INTEGER,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        claim_number VARCHAR(30) UNIQUE NOT NULL,
        member_id UUID REFERENCES members(id),
        plan_id UUID REFERENCES plans(id),
        service_date DATE,
        provider_name VARCHAR(100),
        diagnosis_code VARCHAR(20),
        procedure_code VARCHAR(20),
        billed_amount DECIMAL(10,2),
        allowed_amount DECIMAL(10,2),
        paid_amount DECIMAL(10,2),
        amount DECIMAL(10,2),
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        denial_reason TEXT,
        notes TEXT,
        processed_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        old_data JSONB,
        new_data JSONB,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`);

    // upsert users with real hash
    await pool.query(`
      INSERT INTO users (username, password_hash, full_name, email, role) VALUES
        ('admin',     $1, 'System Administrator', 'admin@facets.com',    'admin'),
        ('jsmith',    $1, 'Jane Smith',           'jsmith@facets.com',   'manager'),
        ('mjohnson',  $1, 'Mike Johnson',         'mjohnson@facets.com', 'analyst'),
        ('lwilliams', $1, 'Lisa Williams',        'lwilliams@facets.com','viewer')
      ON CONFLICT (username) DO UPDATE SET password_hash = $1
    `, [hash]);

    // seed products
    await pool.query(`
      INSERT INTO products (name, code, type, carrier, effective_date) VALUES
        ('Blue Shield Medical',   'BSM-2024', 'medical',    'Blue Shield',     '2024-01-01'),
        ('Delta Dental',          'DD-2024',  'dental',     'Delta Dental',    '2024-01-01'),
        ('VSP Vision',            'VSP-2024', 'vision',     'VSP Vision Care', '2024-01-01'),
        ('Express Scripts Rx',    'ESR-2024', 'pharmacy',   'Express Scripts', '2024-01-01'),
        ('Behavioral Health Plus','BHP-2024', 'behavioral', 'Magellan Health', '2024-01-01')
      ON CONFLICT (code) DO NOTHING
    `);

    // seed plans
    const prods = await pool.query(`SELECT id, code FROM products`);
    const pid = {};
    prods.rows.forEach(p => pid[p.code] = p.id);

    await pool.query(`
      INSERT INTO plans (name, code, product_id, plan_type, deductible, oop_max, premium_individual, premium_family, effective_date) VALUES
        ('Platinum PPO 500',  'PPO-PLAT-500',  $1, 'PPO',   500, 3000, 320, 890, '2024-01-01'),
        ('Gold HMO 1000',     'HMO-GOLD-1000', $1, 'HMO',  1000, 5000, 240, 680, '2024-01-01'),
        ('Silver HDHP 2500',  'HDHP-SIL-2500', $1, 'HDHP', 2500, 7500, 180, 490, '2024-01-01'),
        ('Dental Basic',      'DEN-BASIC',      $2, 'other',  50, 1500,  28,  75, '2024-01-01'),
        ('Dental Plus',       'DEN-PLUS',       $2, 'other',  25, 3000,  52, 140, '2024-01-01'),
        ('Vision Standard',   'VIS-STD',        $3, 'other',   0,  500,  12,  32, '2024-01-01')
      ON CONFLICT (code) DO NOTHING
    `, [pid['BSM-2024'], pid['DD-2024'], pid['VSP-2024']]);

    const plns = await pool.query(`SELECT id, code FROM plans`);
    const pl = {};
    plns.rows.forEach(p => pl[p.code] = p.id);

    // seed members
    await pool.query(`
      INSERT INTO members (member_id, first_name, last_name, email, phone, date_of_birth, gender, city, state, plan_id, employer, effective_date) VALUES
        ('MBR-001','Robert',  'Anderson','randerson@email.com','555-234-5678','1985-03-15','male',  'Sacramento',  'CA',$1,'TechCorp Inc.', '2024-01-01'),
        ('MBR-002','Sarah',   'Martinez','smartinez@email.com','555-345-6789','1990-07-22','female','San Francisco','CA',$2,'HealthStar LLC','2024-01-01'),
        ('MBR-003','James',   'Thompson','jthompson@email.com','555-456-7890','1978-11-08','male',  'Los Angeles', 'CA',$3,'BuildRight Co.','2024-01-01'),
        ('MBR-004','Emily',   'Chen',    'echen@email.com',    '555-567-8901','1995-02-14','female','San Diego',   'CA',$1,'InnovateTech',  '2024-02-01'),
        ('MBR-005','David',   'Wilson',  'dwilson@email.com',  '555-678-9012','1982-09-30','male',  'Oakland',     'CA',$2,'Pacific Logistics','2024-01-15'),
        ('MBR-006','Jennifer','Davis',   'jdavis@email.com',   '555-789-0123','1988-05-19','female','San Jose',    'CA',$3,'GreenEnergy Corp','2024-03-01'),
        ('MBR-007','Michael', 'Garcia',  'mgarcia@email.com',  '555-890-1234','1975-12-25','male',  'Fresno',      'CA',$1,'Valley Farms',  '2024-01-01'),
        ('MBR-008','Ashley',  'Brown',   'abrown@email.com',   '555-901-2345','1993-04-07','female','Long Beach',  'CA',$2,'Harbor Shipping','2024-02-15')
      ON CONFLICT (member_id) DO NOTHING
    `, [pl['PPO-PLAT-500'], pl['HMO-GOLD-1000'], pl['HDHP-SIL-2500']]);

    // seed benefits
    await pool.query(`
      INSERT INTO benefits (plan_id, name, category, coverage_type, coverage_value, copay, coinsurance, prior_auth_required) VALUES
        ($1,'Preventive Care',   'preventive',  'percentage',100, 0,  0, false),
        ($1,'Primary Care',      'primary_care','flat_amount', 20,20,  0, false),
        ($1,'Specialist',        'specialist',  'flat_amount', 40,40,  0, false),
        ($1,'Emergency Room',    'emergency',   'flat_amount',150,150, 0, false),
        ($1,'Inpatient Hospital','hospital',    'percentage',  80, 0, 20, true),
        ($2,'Preventive Care',   'preventive',  'percentage',100, 0,  0, false),
        ($2,'Primary Care',      'primary_care','flat_amount', 25,25,  0, false),
        ($2,'Specialist',        'specialist',  'flat_amount', 50,50,  0, true),
        ($3,'Preventive Care',   'preventive',  'percentage',100, 0,  0, false),
        ($3,'Primary Care',      'primary_care','percentage',  80, 0, 20, false)
    `, [pl['PPO-PLAT-500'], pl['HMO-GOLD-1000'], pl['HDHP-SIL-2500']]);

    // seed pricing
    await pool.query(`
      INSERT INTO pricing (plan_id, tier, rate_type, amount, effective_date) VALUES
        ($1,'individual',         'monthly',320,'2024-01-01'),
        ($1,'individual_spouse',  'monthly',620,'2024-01-01'),
        ($1,'individual_children','monthly',580,'2024-01-01'),
        ($1,'family',             'monthly',890,'2024-01-01'),
        ($2,'individual',         'monthly',240,'2024-01-01'),
        ($2,'individual_spouse',  'monthly',460,'2024-01-01'),
        ($2,'family',             'monthly',680,'2024-01-01'),
        ($3,'individual',         'monthly',180,'2024-01-01'),
        ($3,'family',             'monthly',490,'2024-01-01')
    `, [pl['PPO-PLAT-500'], pl['HMO-GOLD-1000'], pl['HDHP-SIL-2500']]);

    // seed claims
    const mems = await pool.query(`SELECT id, member_id FROM members`);
    const mb = {};
    mems.rows.forEach(m => mb[m.member_id] = m.id);

    await pool.query(`
      INSERT INTO claims (claim_number, member_id, plan_id, service_date, provider_name, diagnosis_code, procedure_code, billed_amount, allowed_amount, paid_amount, amount, description, status) VALUES
        ('CLM-001',$1,$4,'2024-01-15','Dr. Smith Family Practice','Z00.00','99213', 250, 180,160, 250,'Office visit - routine checkup','paid'),
        ('CLM-002',$2,$5,'2024-01-22','Bay Area Specialists',      'M54.5', '99214', 350, 280,230, 350,'Specialist - back pain',        'paid'),
        ('CLM-003',$3,$6,'2024-02-05','Memorial Hospital',         'J06.9', '99283',1200, 950,  0,1200,'ER visit',                      'pending'),
        ('CLM-004',$1,$4,'2024-02-10','Pacific Imaging Center',    'G43.009','70553',2400,1800,1440,2400,'MRI Brain',                   'approved'),
        ('CLM-005',$2,$5,'2024-02-18','Sunvalley Lab',             'Z00.00','80053', 180, 120, 95, 180,'Metabolic panel',               'paid'),
        ('CLM-006',$3,$6,'2024-03-01','City Orthopedics',          'M17.11','99215', 420, 380,  0, 420,'Knee consultation',             'in_review'),
        ('CLM-007',$1,$4,'2024-03-08','Central Valley Surgery',    'K80.20','47562',8500,6800,  0,8500,'Cholecystectomy',               'pending'),
        ('CLM-008',$2,$5,'2024-03-12','Harbor Mental Health',      'F41.1', '90837', 200, 160,135, 200,'Psychotherapy 60 min',          'paid'),
        ('CLM-009',$1,$4,'2024-03-20','Capitol Pharmacy',          'E11.9', '99232',  90,  75,  0,  90,'Diabetes medication',           'denied'),
        ('CLM-010',$3,$6,'2024-03-25','Northgate Physical Therapy','M54.5', '97110', 320, 280,224, 320,'Therapeutic exercises',         'approved')
      ON CONFLICT (claim_number) DO NOTHING
    `, [mb['MBR-001'], mb['MBR-002'], mb['MBR-003'],
        pl['PPO-PLAT-500'], pl['HMO-GOLD-1000'], pl['HDHP-SIL-2500']]);

    await pool.query(`UPDATE claims SET denial_reason='Not covered. Submit prior auth form.' WHERE claim_number='CLM-009'`);

    res.json({ success: true, message: 'Database initialized! Login with: admin / password' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── AUTH ──────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(403).json({ error: 'Invalid token' }); }
};

const audit = async (userId, action, entity, entityId, oldData, newData, req) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (id,user_id,action,entity_type,entity_id,old_data,new_data,ip_address,user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [uuidv4(), userId, action, entity, entityId,
       oldData ? JSON.stringify(oldData) : null,
       newData ? JSON.stringify(newData) : null,
       req.ip, req.headers['user-agent']]
    );
  } catch(e) { console.error('audit err', e.message); }
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const r = await pool.query('SELECT * FROM users WHERE username=$1 AND is_active=true', [username]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    await pool.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
  } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT id,username,full_name,role,email FROM users WHERE id=$1', [req.user.id]);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── MEMBERS ───────────────────────────────────────────────────
app.get('/api/members', auth, async (req, res) => {
  try {
    const { search, page=1, limit=20, status } = req.query;
    let q = `SELECT m.*, p.name as plan_name FROM members m LEFT JOIN plans p ON m.plan_id=p.id WHERE 1=1`;
    const params = [];
    if (search) { params.push(`%${search}%`); q += ` AND (m.first_name ILIKE $${params.length} OR m.last_name ILIKE $${params.length} OR m.email ILIKE $${params.length} OR m.member_id ILIKE $${params.length})`; }
    if (status) { params.push(status==='active'); q += ` AND m.is_active=$${params.length}`; }
    const total = await pool.query(q.replace('SELECT m.*, p.name as plan_name','SELECT COUNT(*)'), params);
    q += ` ORDER BY m.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(parseInt(limit),(parseInt(page)-1)*parseInt(limit));
    const r = await pool.query(q, params);
    res.json({ data: r.rows, total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/members', auth, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, date_of_birth, gender, address, city, state, zip, plan_id, employer, effective_date } = req.body;
    const id = uuidv4();
    const member_id = 'MBR-' + Date.now().toString(36).toUpperCase();
    const r = await pool.query(
      `INSERT INTO members (id,member_id,first_name,last_name,email,phone,date_of_birth,gender,address,city,state,zip,plan_id,employer,effective_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [id,member_id,first_name,last_name,email,phone,date_of_birth||null,gender,address,city,state,zip,plan_id||null,employer,effective_date||null]
    );
    await audit(req.user.id,'CREATE','member',id,null,r.rows[0],req);
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/members/:id', auth, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM members WHERE id=$1',[req.params.id]);
    const { first_name,last_name,email,phone,date_of_birth,gender,address,city,state,zip,plan_id,employer,effective_date,termination_date,is_active } = req.body;
    const r = await pool.query(
      `UPDATE members SET first_name=$1,last_name=$2,email=$3,phone=$4,date_of_birth=$5,gender=$6,address=$7,city=$8,state=$9,zip=$10,plan_id=$11,employer=$12,effective_date=$13,termination_date=$14,is_active=$15,updated_at=NOW() WHERE id=$16 RETURNING *`,
      [first_name,last_name,email,phone,date_of_birth||null,gender,address,city,state,zip,plan_id||null,employer,effective_date||null,termination_date||null,is_active,req.params.id]
    );
    await audit(req.user.id,'UPDATE','member',req.params.id,old.rows[0],r.rows[0],req);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/members/:id', auth, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM members WHERE id=$1',[req.params.id]);
    await pool.query('UPDATE members SET is_active=false,updated_at=NOW() WHERE id=$1',[req.params.id]);
    await audit(req.user.id,'DEACTIVATE','member',req.params.id,old.rows[0],null,req);
    res.json({ message:'Member deactivated' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── PRODUCTS ──────────────────────────────────────────────────
app.get('/api/products', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM products WHERE is_active=true ORDER BY name')).rows); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const { name, code, type, description, carrier, effective_date, termination_date } = req.body;
    const id = uuidv4();
    const r = await pool.query(
      `INSERT INTO products (id,name,code,type,description,carrier,effective_date,termination_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id,name,code,type,description,carrier,effective_date||null,termination_date||null]
    );
    await audit(req.user.id,'CREATE','product',id,null,r.rows[0],req);
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM products WHERE id=$1',[req.params.id]);
    const { name, code, type, description, carrier, effective_date, termination_date, is_active } = req.body;
    const r = await pool.query(
      `UPDATE products SET name=$1,code=$2,type=$3,description=$4,carrier=$5,effective_date=$6,termination_date=$7,is_active=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [name,code,type,description,carrier,effective_date||null,termination_date||null,is_active,req.params.id]
    );
    await audit(req.user.id,'UPDATE','product',req.params.id,old.rows[0],r.rows[0],req);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active=false WHERE id=$1',[req.params.id]);
    await audit(req.user.id,'DELETE','product',req.params.id,null,null,req);
    res.json({ message:'Product deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── PLANS ─────────────────────────────────────────────────────
app.get('/api/plans', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT pl.*, pr.name as product_name FROM plans pl LEFT JOIN products pr ON pl.product_id=pr.id WHERE pl.is_active=true ORDER BY pl.name`);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/plans', auth, async (req, res) => {
  try {
    const { name, code, product_id, plan_type, deductible, oop_max, premium_individual, premium_family, description, effective_date } = req.body;
    const id = uuidv4();
    const r = await pool.query(
      `INSERT INTO plans (id,name,code,product_id,plan_type,deductible,oop_max,premium_individual,premium_family,description,effective_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id,name,code,product_id||null,plan_type,deductible||0,oop_max||0,premium_individual||0,premium_family||0,description,effective_date||null]
    );
    await audit(req.user.id,'CREATE','plan',id,null,r.rows[0],req);
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/plans/:id', auth, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM plans WHERE id=$1',[req.params.id]);
    const { name, code, product_id, plan_type, deductible, oop_max, premium_individual, premium_family, description, effective_date, is_active } = req.body;
    const r = await pool.query(
      `UPDATE plans SET name=$1,code=$2,product_id=$3,plan_type=$4,deductible=$5,oop_max=$6,premium_individual=$7,premium_family=$8,description=$9,effective_date=$10,is_active=$11,updated_at=NOW() WHERE id=$12 RETURNING *`,
      [name,code,product_id||null,plan_type,deductible||0,oop_max||0,premium_individual||0,premium_family||0,description,effective_date||null,is_active,req.params.id]
    );
    await audit(req.user.id,'UPDATE','plan',req.params.id,old.rows[0],r.rows[0],req);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/plans/:id', auth, async (req, res) => {
  try {
    await pool.query('UPDATE plans SET is_active=false WHERE id=$1',[req.params.id]);
    await audit(req.user.id,'DELETE','plan',req.params.id,null,null,req);
    res.json({ message:'Plan deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── BENEFITS ──────────────────────────────────────────────────
app.get('/api/benefits', auth, async (req, res) => {
  try {
    const { plan_id } = req.query;
    let q = `SELECT b.*, p.name as plan_name FROM benefits b LEFT JOIN plans p ON b.plan_id=p.id WHERE 1=1`;
    const params = [];
    if (plan_id) { params.push(plan_id); q += ` AND b.plan_id=$1`; }
    q += ' ORDER BY b.category, b.name';
    res.json((await pool.query(q, params)).rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/benefits', auth, async (req, res) => {
  try {
    const { plan_id, name, category, coverage_type, coverage_value, copay, coinsurance, prior_auth_required, notes } = req.body;
    const id = uuidv4();
    const r = await pool.query(
      `INSERT INTO benefits (id,plan_id,name,category,coverage_type,coverage_value,copay,coinsurance,prior_auth_required,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id,plan_id,name,category,coverage_type,coverage_value||null,copay||0,coinsurance||0,prior_auth_required||false,notes]
    );
    await audit(req.user.id,'CREATE','benefit',id,null,r.rows[0],req);
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/benefits/:id', auth, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM benefits WHERE id=$1',[req.params.id]);
    const { plan_id, name, category, coverage_type, coverage_value, copay, coinsurance, prior_auth_required, notes } = req.body;
    const r = await pool.query(
      `UPDATE benefits SET plan_id=$1,name=$2,category=$3,coverage_type=$4,coverage_value=$5,copay=$6,coinsurance=$7,prior_auth_required=$8,notes=$9,updated_at=NOW() WHERE id=$10 RETURNING *`,
      [plan_id,name,category,coverage_type,coverage_value||null,copay||0,coinsurance||0,prior_auth_required||false,notes,req.params.id]
    );
    await audit(req.user.id,'UPDATE','benefit',req.params.id,old.rows[0],r.rows[0],req);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/benefits/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM benefits WHERE id=$1',[req.params.id]);
    await audit(req.user.id,'DELETE','benefit',req.params.id,null,null,req);
    res.json({ message:'Benefit deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── PRICING ───────────────────────────────────────────────────
app.get('/api/pricing', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT pr.*, p.name as plan_name FROM pricing pr LEFT JOIN plans p ON pr.plan_id=p.id ORDER BY p.name, pr.tier`);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pricing', auth, async (req, res) => {
  try {
    const { plan_id, tier, rate_type, amount, effective_date, termination_date, age_band_min, age_band_max, notes } = req.body;
    const id = uuidv4();
    const r = await pool.query(
      `INSERT INTO pricing (id,plan_id,tier,rate_type,amount,effective_date,termination_date,age_band_min,age_band_max,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id,plan_id,tier,rate_type,amount,effective_date,termination_date||null,age_band_min||null,age_band_max||null,notes]
    );
    await audit(req.user.id,'CREATE','pricing',id,null,r.rows[0],req);
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/pricing/:id', auth, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM pricing WHERE id=$1',[req.params.id]);
    const { plan_id, tier, rate_type, amount, effective_date, termination_date, age_band_min, age_band_max, notes } = req.body;
    const r = await pool.query(
      `UPDATE pricing SET plan_id=$1,tier=$2,rate_type=$3,amount=$4,effective_date=$5,termination_date=$6,age_band_min=$7,age_band_max=$8,notes=$9,updated_at=NOW() WHERE id=$10 RETURNING *`,
      [plan_id,tier,rate_type,amount,effective_date,termination_date||null,age_band_min||null,age_band_max||null,notes,req.params.id]
    );
    await audit(req.user.id,'UPDATE','pricing',req.params.id,old.rows[0],r.rows[0],req);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/pricing/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM pricing WHERE id=$1',[req.params.id]);
    await audit(req.user.id,'DELETE','pricing',req.params.id,null,null,req);
    res.json({ message:'Pricing deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── CLAIMS ────────────────────────────────────────────────────
app.get('/api/claims', auth, async (req, res) => {
  try {
    const { search, status, page=1, limit=20 } = req.query;
    let q = `SELECT c.*, m.first_name||' '||m.last_name as member_name, m.member_id as member_number, p.name as plan_name FROM claims c LEFT JOIN members m ON c.member_id=m.id LEFT JOIN plans p ON c.plan_id=p.id WHERE 1=1`;
    const params = [];
    if (search) { params.push(`%${search}%`); q += ` AND (c.claim_number ILIKE $${params.length} OR m.first_name ILIKE $${params.length} OR m.last_name ILIKE $${params.length})`; }
    if (status) { params.push(status); q += ` AND c.status=$${params.length}`; }
    const total = await pool.query(q.replace(`SELECT c.*, m.first_name||' '||m.last_name as member_name, m.member_id as member_number, p.name as plan_name`,'SELECT COUNT(*)'), params);
    q += ` ORDER BY c.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(parseInt(limit),(parseInt(page)-1)*parseInt(limit));
    const r = await pool.query(q, params);
    res.json({ data: r.rows, total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/claims', auth, async (req, res) => {
  try {
    const { member_id, plan_id, service_date, provider_name, diagnosis_code, procedure_code, billed_amount, allowed_amount, paid_amount, description } = req.body;
    const id = uuidv4();
    const claim_number = 'CLM-' + Date.now().toString(36).toUpperCase();
    const r = await pool.query(
      `INSERT INTO claims (id,claim_number,member_id,plan_id,service_date,provider_name,diagnosis_code,procedure_code,billed_amount,allowed_amount,paid_amount,amount,description,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending') RETURNING *`,
      [id,claim_number,member_id,plan_id||null,service_date,provider_name,diagnosis_code,procedure_code,billed_amount,allowed_amount||null,paid_amount||null,billed_amount,description]
    );
    await audit(req.user.id,'CREATE','claim',id,null,r.rows[0],req);
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/claims/:id', auth, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM claims WHERE id=$1',[req.params.id]);
    const { status, paid_amount, allowed_amount, denial_reason, notes } = req.body;
    const r = await pool.query(
      `UPDATE claims SET status=$1,paid_amount=$2,allowed_amount=$3,denial_reason=$4,notes=$5,updated_at=NOW(),processed_date=CASE WHEN $1 IN ('approved','denied','paid') THEN NOW() ELSE processed_date END WHERE id=$6 RETURNING *`,
      [status,paid_amount||null,allowed_amount||null,denial_reason,notes,req.params.id]
    );
    await audit(req.user.id,'UPDATE','claim',req.params.id,old.rows[0],r.rows[0],req);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── AUDIT ─────────────────────────────────────────────────────
app.get('/api/audit', auth, async (req, res) => {
  try {
    const { entity, action, user_id, page=1, limit=50, date_from, date_to } = req.query;
    let q = `SELECT al.*, u.full_name, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id WHERE 1=1`;
    const params = [];
    if (entity) { params.push(entity); q += ` AND al.entity_type=$${params.length}`; }
    if (action) { params.push(action); q += ` AND al.action=$${params.length}`; }
    if (user_id) { params.push(user_id); q += ` AND al.user_id=$${params.length}`; }
    if (date_from) { params.push(date_from); q += ` AND al.created_at>=$${params.length}`; }
    if (date_to) { params.push(date_to); q += ` AND al.created_at<=$${params.length}`; }
    const total = await pool.query(q.replace('SELECT al.*, u.full_name, u.username','SELECT COUNT(*)'), params);
    q += ` ORDER BY al.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(parseInt(limit),(parseInt(page)-1)*parseInt(limit));
    const r = await pool.query(q, params);
    res.json({ data: r.rows, total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT id,username,full_name,role FROM users WHERE is_active=true ORDER BY full_name')).rows); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (req, res) => res.json({ status:'ok', time: new Date().toISOString() }));

['members','products','plans','benefits','pricing','claims','audit'].forEach(p => {
  app.get(`/${p}`, (req, res) => res.sendFile(path.join(__dirname, 'public', `${p}.html`)));
});

app.listen(PORT, () => console.log(`Facets running on port ${PORT}`));
```

---

The HTML files, `styles.css`, and `app.js` are **exactly the same** as the previous response — copy them from there.

---

## ⚡ AFTER YOU DEPLOY — do this ONE time:

**Visit this URL in your browser:**
```
https://demolab-9odr.onrender.com/api/setup
