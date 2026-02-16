PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  product_id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  carrier TEXT NOT NULL,
  lob TEXT NOT NULL,
  network_model TEXT NOT NULL DEFAULT 'INN_OON',
  effective_date TEXT NOT NULL,
  term_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  plan_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  benefit_year_type TEXT NOT NULL DEFAULT 'Calendar',
  pcp_required INTEGER NOT NULL DEFAULT 0,
  effective_date TEXT NOT NULL,
  term_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS members (
  member_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  dob TEXT,
  sex TEXT,
  mbi TEXT,
  tier_code TEXT NOT NULL DEFAULT 'INN',
  plan_id TEXT NOT NULL REFERENCES plans(plan_id),
  effective_date TEXT NOT NULL,
  term_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS benefit_rules (
  benefit_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('INN','OON')),
  service_category TEXT NOT NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('CPT','REV')),
  code_start INTEGER NOT NULL,
  code_end INTEGER NOT NULL,
  covered INTEGER NOT NULL DEFAULT 1,
  deductible_applies INTEGER NOT NULL DEFAULT 0,
  copay_cents INTEGER NOT NULL DEFAULT 0,
  coins_pct INTEGER NOT NULL DEFAULT 0,
  accumulator_applied TEXT NOT NULL DEFAULT 'OOP',
  auth_required INTEGER NOT NULL DEFAULT 0,
  er_waive_copay_if_admit INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 100,
  effective_date TEXT NOT NULL,
  term_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_rules_match
ON benefit_rules(plan_id, tier, code_type, code_start, code_end, effective_date, term_date, priority);

CREATE TABLE IF NOT EXISTS fee_schedule (
  price_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('INN','OON')),
  code_type TEXT NOT NULL CHECK (code_type IN ('CPT','REV')),
  code_start INTEGER NOT NULL,
  code_end INTEGER NOT NULL,
  allowed_cents INTEGER NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100
);

CREATE INDEX IF NOT EXISTS idx_fee_match
ON fee_schedule(plan_id, tier, code_type, code_start, code_end, priority);

CREATE TABLE IF NOT EXISTS accumulators (
  acc_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('INN','OON')),
  accumulator_type TEXT NOT NULL CHECK (accumulator_type IN ('DED','OOP')),
  ind_limit_cents INTEGER NOT NULL,
  fam_limit_cents INTEGER NOT NULL DEFAULT 0,
  embedded_family INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS member_accumulator_balances (
  member_id TEXT NOT NULL REFERENCES members(member_id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('INN','OON')),
  accumulator_type TEXT NOT NULL CHECK (accumulator_type IN ('DED','OOP')),
  ytd_cents INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(member_id, plan_id, tier, accumulator_type)
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(member_id),
  plan_id TEXT NOT NULL REFERENCES plans(plan_id),
  tier TEXT NOT NULL CHECK (tier IN ('INN','OON')),
  dos TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('CPT','REV')),
  code_value INTEGER NOT NULL,
  admitted INTEGER NOT NULL DEFAULT 0,
  billed_cents INTEGER NOT NULL,
  allowed_cents INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PAY','DENY')),
  member_pay_cents INTEGER NOT NULL,
  plan_pay_cents INTEGER NOT NULL,
  applied_benefit_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
