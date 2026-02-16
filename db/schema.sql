PRAGMA foreign_keys = ON;

-- ===== Core setup objects =====
CREATE TABLE IF NOT EXISTS products (
  product_id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  lob TEXT NOT NULL,                  -- line of business: Commercial, Medicare, Medicaid
  effective_date TEXT NOT NULL,        -- YYYY-MM-DD
  term_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plans (
  plan_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  benefit_year TEXT NOT NULL DEFAULT 'Calendar',
  effective_date TEXT NOT NULL,
  term_date TEXT NOT NULL,
  network_model TEXT NOT NULL DEFAULT 'INN_OON',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS networks (
  network_id TEXT PRIMARY KEY,
  network_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_networks (
  plan_id TEXT NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  tier_code TEXT NOT NULL,            -- INN or OON
  network_id TEXT NOT NULL REFERENCES networks(network_id),
  PRIMARY KEY (plan_id, tier_code)
);

-- ===== Accumulators =====
CREATE TABLE IF NOT EXISTS accumulators (
  accumulator_id TEXT PRIMARY KEY,    -- e.g., INN_DED, INN_OOP
  plan_id TEXT NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  tier_code TEXT NOT NULL,            -- INN/OON
  accumulator_type TEXT NOT NULL,      -- DED, OOP, LIFETIME
  ind_limit_cents INTEGER NOT NULL,
  fam_limit_cents INTEGER NOT NULL,
  embedded_family INTEGER NOT NULL DEFAULT 1,
  reset_cycle TEXT NOT NULL DEFAULT 'Calendar'
);

-- Per member accumulator balances (YTD)
CREATE TABLE IF NOT EXISTS member_accumulator_balances (
  member_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  tier_code TEXT NOT NULL,
  accumulator_type TEXT NOT NULL,
  ytd_cents INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (member_id, plan_id, tier_code, accumulator_type)
);

-- ===== Benefit configuration =====
CREATE TABLE IF NOT EXISTS benefit_rules (
  rule_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  tier_code TEXT NOT NULL,            -- INN/OON
  code_type TEXT NOT NULL,            -- CPT, REV
  code_start INTEGER NOT NULL,
  code_end INTEGER NOT NULL,
  label TEXT NOT NULL,

  covered INTEGER NOT NULL DEFAULT 1,         -- 1=covered, 0=denied
  deductible_applies INTEGER NOT NULL DEFAULT 0,
  copay_cents INTEGER NOT NULL DEFAULT 0,
  member_coins_pct INTEGER NOT NULL DEFAULT 0, -- 0..100

  auth_required INTEGER NOT NULL DEFAULT 0,

  er_waive_copay_if_admit INTEGER NOT NULL DEFAULT 0,

  priority INTEGER NOT NULL DEFAULT 100,
  effective_date TEXT NOT NULL DEFAULT '2026-01-01',
  term_date TEXT NOT NULL DEFAULT '2099-12-31',

  notes TEXT
);

-- ===== Pricing =====
CREATE TABLE IF NOT EXISTS fee_schedule (
  fee_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  tier_code TEXT NOT NULL,
  code_type TEXT NOT NULL,            -- CPT/REV
  code_start INTEGER NOT NULL,
  code_end INTEGER NOT NULL,
  allowed_cents INTEGER NOT NULL,     -- fixed allowed for demo
  priority INTEGER NOT NULL DEFAULT 100
);

-- ===== Members (Enrollment Admin UI) =====
CREATE TABLE IF NOT EXISTS members (
  member_id TEXT PRIMARY KEY,
  mbi TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  record_source TEXT NOT NULL DEFAULT 'Data-entry',
  user_entered TEXT NOT NULL DEFAULT 'PDM Administrator',
  date_entered TEXT NOT NULL DEFAULT (datetime('now')),
  user_modified TEXT,
  date_modified TEXT,

  salutation TEXT,
  first_name TEXT NOT NULL,
  mi TEXT,
  last_name TEXT NOT NULL,

  dob TEXT,
  sex TEXT,
  ssn TEXT,

  plan_id TEXT NOT NULL REFERENCES plans(plan_id),
  pbp TEXT,
  segment_id TEXT,
  effective_date TEXT NOT NULL,
  term_date TEXT
);

-- ===== Claims & audit =====
CREATE TABLE IF NOT EXISTS claims (
  claim_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(member_id),
  plan_id TEXT NOT NULL REFERENCES plans(plan_id),
  tier_code TEXT NOT NULL,
  code_type TEXT NOT NULL,
  code_value INTEGER NOT NULL,
  admitted INTEGER NOT NULL DEFAULT 0,
  billed_cents INTEGER NOT NULL,
  allowed_cents INTEGER NOT NULL,
  status TEXT NOT NULL,               -- PAY/DENY
  member_pay_cents INTEGER NOT NULL,
  plan_pay_cents INTEGER NOT NULL,
  applied_rule_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  actor TEXT NOT NULL DEFAULT 'training-user',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT
);
