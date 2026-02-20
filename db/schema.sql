CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  dob DATE,
  email VARCHAR(200),
  phone VARCHAR(30),
  plan_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_code VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_code VARCHAR(50) UNIQUE NOT NULL,
  plan_name VARCHAR(200) NOT NULL,
  product_id UUID REFERENCES products(id),
  effective_date DATE,
  termination_date DATE,
  deductible NUMERIC(10,2) DEFAULT 0,
  oop_max NUMERIC(10,2) DEFAULT 0,
  premium NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benefit_code VARCHAR(50) UNIQUE NOT NULL,
  benefit_name VARCHAR(200) NOT NULL,
  plan_id UUID REFERENCES plans(id),
  benefit_type VARCHAR(50),
  copay NUMERIC(10,2) DEFAULT 0,
  coinsurance NUMERIC(5,4) DEFAULT 0,
  covered BOOLEAN DEFAULT true,
  prior_auth_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pricing_code VARCHAR(50) UNIQUE NOT NULL,
  plan_id UUID REFERENCES plans(id),
  tier VARCHAR(50),
  base_premium NUMERIC(10,2) DEFAULT 0,
  employer_contribution NUMERIC(10,2) DEFAULT 0,
  employee_contribution NUMERIC(10,2) DEFAULT 0,
  effective_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  member_id UUID REFERENCES members(id),
  plan_id UUID REFERENCES plans(id),
  service_date DATE,
  claim_date DATE,
  provider VARCHAR(200),
  diagnosis_code VARCHAR(20),
  procedure_code VARCHAR(20),
  billed_amount NUMERIC(12,2) DEFAULT 0,
  allowed_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(20),
  table_name VARCHAR(100),
  record_id UUID,
  changes TEXT,
  performed_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW()
);
