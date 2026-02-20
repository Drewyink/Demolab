Schema · SQL
Copy

-- Facets Configuration Software Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin','manager','analyst','viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('medical','dental','vision','pharmacy','behavioral','life','disability','other')),
    description TEXT,
    carrier VARCHAR(100),
    effective_date DATE,
    termination_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id),
    plan_type VARCHAR(50) CHECK (plan_type IN ('HMO','PPO','EPO','HDHP','POS','INDEMNITY','other')),
    deductible DECIMAL(10,2),
    oop_max DECIMAL(10,2),
    premium_individual DECIMAL(10,2),
    premium_family DECIMAL(10,2),
    description TEXT,
    effective_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id VARCHAR(30) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male','female','non-binary','other','prefer_not_to_say')),
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
);

-- Benefits table
CREATE TABLE IF NOT EXISTS benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('preventive','primary_care','specialist','emergency','hospital','mental_health','prescription','lab','imaging','therapy','other')),
    coverage_type VARCHAR(30) CHECK (coverage_type IN ('percentage','flat_amount','not_covered','unlimited')),
    coverage_value DECIMAL(10,2),
    copay DECIMAL(10,2),
    coinsurance DECIMAL(5,2),
    prior_auth_required BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing table
CREATE TABLE IF NOT EXISTS pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    tier VARCHAR(30) CHECK (tier IN ('individual','individual_spouse','individual_children','family')),
    rate_type VARCHAR(30) CHECK (rate_type IN ('monthly','annual','weekly','per_pay_period')),
    amount DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    termination_date DATE,
    age_band_min INTEGER,
    age_band_max INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims table
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
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_review','approved','denied','paid','appealed')),
    denial_reason TEXT,
    notes TEXT,
    processed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_plan ON members(plan_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_claims_member ON claims(member_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_benefits_plan ON benefits(plan_id);
CREATE INDEX IF NOT EXISTS idx_pricing_plan ON pricing(plan_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
