-- password for all users is: password
-- The /api/setup endpoint will fix the hash on first deploy

INSERT INTO users (id, username, password_hash, full_name, email, role) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'admin',     'PLACEHOLDER', 'System Administrator', 'admin@facets.com',    'admin'),
('a1b2c3d4-0001-0001-0001-000000000002', 'jsmith',    'PLACEHOLDER', 'Jane Smith',           'jsmith@facets.com',   'manager'),
('a1b2c3d4-0001-0001-0001-000000000003', 'mjohnson',  'PLACEHOLDER', 'Mike Johnson',         'mjohnson@facets.com', 'analyst'),
('a1b2c3d4-0001-0001-0001-000000000004', 'lwilliams', 'PLACEHOLDER', 'Lisa Williams',        'lwilliams@facets.com','viewer')
ON CONFLICT (username) DO NOTHING;

INSERT INTO products (id, name, code, type, description, carrier, effective_date) VALUES
('b1000000-0000-0000-0000-000000000001', 'Blue Shield Medical',   'BSM-2024', 'medical',    'Comprehensive medical coverage', 'Blue Shield',    '2024-01-01'),
('b1000000-0000-0000-0000-000000000002', 'Delta Dental',          'DD-2024',  'dental',     'Full dental coverage',           'Delta Dental',   '2024-01-01'),
('b1000000-0000-0000-0000-000000000003', 'VSP Vision',            'VSP-2024', 'vision',     'Eye care and eyewear benefits',  'VSP Vision Care','2024-01-01'),
('b1000000-0000-0000-0000-000000000004', 'Express Scripts Rx',    'ESR-2024', 'pharmacy',   'Prescription drug benefits',     'Express Scripts','2024-01-01'),
('b1000000-0000-0000-0000-000000000005', 'Behavioral Health Plus','BHP-2024', 'behavioral', 'Mental health treatment',        'Magellan Health','2024-01-01')
ON CONFLICT (code) DO NOTHING;

INSERT INTO plans (id, name, code, product_id, plan_type, deductible, oop_max, premium_individual, premium_family, effective_date) VALUES
('c1000000-0000-0000-0000-000000000001', 'Platinum PPO 500',  'PPO-PLAT-500',  'b1000000-0000-0000-0000-000000000001', 'PPO',  500,  3000, 320, 890, '2024-01-01'),
('c1000000-0000-0000-0000-000000000002', 'Gold HMO 1000',     'HMO-GOLD-1000', 'b1000000-0000-0000-0000-000000000001', 'HMO', 1000,  5000, 240, 680, '2024-01-01'),
('c1000000-0000-0000-0000-000000000003', 'Silver HDHP 2500',  'HDHP-SIL-2500', 'b1000000-0000-0000-0000-000000000001', 'HDHP',2500,  7500, 180, 490, '2024-01-01'),
('c1000000-0000-0000-0000-000000000004', 'Dental Basic',      'DEN-BASIC',     'b1000000-0000-0000-0000-000000000002', 'other', 50,  1500,  28,  75, '2024-01-01'),
('c1000000-0000-0000-0000-000000000005', 'Dental Plus',       'DEN-PLUS',      'b1000000-0000-0000-0000-000000000002', 'other', 25,  3000,  52, 140, '2024-01-01'),
('c1000000-0000-0000-0000-000000000006', 'Vision Standard',   'VIS-STD',       'b1000000-0000-0000-0000-000000000003', 'other',  0,   500,  12,  32, '2024-01-01')
ON CONFLICT (code) DO NOTHING;

INSERT INTO members (id, member_id, first_name, last_name, email, phone, date_of_birth, gender, city, state, plan_id, employer, effective_date) VALUES
('d1000000-0000-0000-0000-000000000001', 'MBR-001', 'Robert',   'Anderson', 'randerson@email.com', '555-234-5678', '1985-03-15', 'male',   'Sacramento',  'CA', 'c1000000-0000-0000-0000-000000000001', 'TechCorp Inc.',    '2024-01-01'),
('d1000000-0000-0000-0000-000000000002', 'MBR-002', 'Sarah',    'Martinez', 'smartinez@email.com', '555-345-6789', '1990-07-22', 'female', 'San Francisco','CA', 'c1000000-0000-0000-0000-000000000002', 'HealthStar LLC',   '2024-01-01'),
('d1000000-0000-0000-0000-000000000003', 'MBR-003', 'James',    'Thompson', 'jthompson@email.com', '555-456-7890', '1978-11-08', 'male',   'Los Angeles', 'CA', 'c1000000-0000-0000-0000-000000000003', 'BuildRight Co.',   '2024-01-01'),
('d1000000-0000-0000-0000-000000000004', 'MBR-004', 'Emily',    'Chen',     'echen@email.com',     '555-567-8901', '1995-02-14', 'female', 'San Diego',   'CA', 'c1000000-0000-0000-0000-000000000001', 'InnovateTech',     '2024-02-01'),
('d1000000-0000-0000-0000-000000000005', 'MBR-005', 'David',    'Wilson',   'dwilson@email.com',   '555-678-9012', '1982-09-30', 'male',   'Oakland',     'CA', 'c1000000-0000-0000-0000-000000000002', 'Pacific Logistics', '2024-01-15'),
('d1000000-0000-0000-0000-000000000006', 'MBR-006', 'Jennifer', 'Davis',    'jdavis@email.com',    '555-789-0123', '1988-05-19', 'female', 'San Jose',    'CA', 'c1000000-0000-0000-0000-000000000003', 'GreenEnergy Corp', '2024-03-01'),
('d1000000-0000-0000-0000-000000000007', 'MBR-007', 'Michael',  'Garcia',   'mgarcia@email.com',   '555-890-1234', '1975-12-25', 'male',   'Fresno',      'CA', 'c1000000-0000-0000-0000-000000000001', 'Valley Farms',     '2024-01-01'),
('d1000000-0000-0000-0000-000000000008', 'MBR-008', 'Ashley',   'Brown',    'abrown@email.com',    '555-901-2345', '1993-04-07', 'female', 'Long Beach',  'CA', 'c1000000-0000-0000-0000-000000000002', 'Harbor Shipping',  '2024-02-15')
ON CONFLICT (member_id) DO NOTHING;

INSERT INTO benefits (plan_id, name, category, coverage_type, coverage_value, copay, coinsurance, prior_auth_required) VALUES
('c1000000-0000-0000-0000-000000000001', 'Preventive Care',   'preventive',   'percentage', 100, 0,   0,  false),
('c1000000-0000-0000-0000-000000000001', 'Primary Care',      'primary_care', 'flat_amount', 20, 20,  0,  false),
('c1000000-0000-0000-0000-000000000001', 'Specialist',        'specialist',   'flat_amount', 40, 40,  0,  false),
('c1000000-0000-0000-0000-000000000001', 'Emergency Room',    'emergency',    'flat_amount',150,150,  0,  false),
('c1000000-0000-0000-0000-000000000001', 'Inpatient Hospital','hospital',     'percentage',  80,  0, 20,  true),
('c1000000-0000-0000-0000-000000000002', 'Preventive Care',   'preventive',   'percentage', 100,  0,  0,  false),
('c1000000-0000-0000-0000-000000000002', 'Primary Care',      'primary_care', 'flat_amount', 25, 25,  0,  false),
('c1000000-0000-0000-0000-000000000002', 'Specialist',        'specialist',   'flat_amount', 50, 50,  0,  true),
('c1000000-0000-0000-0000-000000000003', 'Preventive Care',   'preventive',   'percentage', 100,  0,  0,  false),
('c1000000-0000-0000-0000-000000000003', 'Primary Care',      'primary_care', 'percentage',  80,  0, 20,  false),
('c1000000-0000-0000-0000-000000000004', 'Preventive Dental', 'preventive',   'percentage', 100,  0,  0,  false),
('c1000000-0000-0000-0000-000000000004', 'Basic Restorative', 'other',        'percentage',  80,  0, 20,  false);

INSERT INTO pricing (plan_id, tier, rate_type, amount, effective_date) VALUES
('c1000000-0000-0000-0000-000000000001', 'individual',          'monthly', 320, '2024-01-01'),
('c1000000-0000-0000-0000-000000000001', 'individual_spouse',   'monthly', 620, '2024-01-01'),
('c1000000-0000-0000-0000-000000000001', 'individual_children', 'monthly', 580, '2024-01-01'),
('c1000000-0000-0000-0000-000000000001', 'family',              'monthly', 890, '2024-01-01'),
('c1000000-0000-0000-0000-000000000002', 'individual',          'monthly', 240, '2024-01-01'),
('c1000000-0000-0000-0000-000000000002', 'individual_spouse',   'monthly', 460, '2024-01-01'),
('c1000000-0000-0000-0000-000000000002', 'family',              'monthly', 680, '2024-01-01'),
('c1000000-0000-0000-0000-000000000003', 'individual',          'monthly', 180, '2024-01-01'),
('c1000000-0000-0000-0000-000000000003', 'family',              'monthly', 490, '2024-01-01'),
('c1000000-0000-0000-0000-000000000004', 'individual',          'monthly',  28, '2024-01-01'),
('c1000000-0000-0000-0000-000000000004', 'family',              'monthly',  75, '2024-01-01'),
('c1000000-0000-0000-0000-000000000006', 'individual',          'monthly',  12, '2024-01-01'),
('c1000000-0000-0000-0000-000000000006', 'family',              'monthly',  32, '2024-01-01');

INSERT INTO claims (id, claim_number, member_id, plan_id, service_date, provider_name, diagnosis_code, procedure_code, billed_amount, allowed_amount, paid_amount, amount, description, status) VALUES
('e1000000-0000-0000-0000-000000000001', 'CLM-001', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '2024-01-15', 'Dr. Smith Family Practice', 'Z00.00', '99213', 250,  180, 160, 250, 'Office visit - routine checkup',      'paid'),
('e1000000-0000-0000-0000-000000000002', 'CLM-002', 'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', '2024-01-22', 'Bay Area Specialists',      'M54.5',  '99214', 350,  280, 230, 350, 'Specialist - back pain',             'paid'),
('e1000000-0000-0000-0000-000000000003', 'CLM-003', 'd1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', '2024-02-05', 'Memorial Hospital',         'J06.9',  '99283',1200,  950,   0,1200, 'ER visit - upper respiratory',       'pending'),
('e1000000-0000-0000-0000-000000000004', 'CLM-004', 'd1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', '2024-02-10', 'Pacific Imaging Center',    'G43.009','70553',2400, 1800,1440,2400, 'MRI Brain without contrast',         'approved'),
('e1000000-0000-0000-0000-000000000005', 'CLM-005', 'd1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', '2024-02-18', 'Sunvalley Lab',             'Z00.00', '80053', 180,  120,  95, 180, 'Comprehensive metabolic panel',      'paid'),
('e1000000-0000-0000-0000-000000000006', 'CLM-006', 'd1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003', '2024-03-01', 'City Orthopedics',          'M17.11', '99215', 420,  380,   0, 420, 'Knee consultation',                  'in_review'),
('e1000000-0000-0000-0000-000000000007', 'CLM-007', 'd1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001', '2024-03-08', 'Central Valley Surgery',    'K80.20', '47562',8500, 6800,   0,8500, 'Laparoscopic cholecystectomy',       'pending'),
('e1000000-0000-0000-0000-000000000008', 'CLM-008', 'd1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', '2024-03-12', 'Harbor Mental Health',      'F41.1',  '90837', 200,  160, 135, 200, 'Individual psychotherapy 60 min',    'paid'),
('e1000000-0000-0000-0000-000000000009', 'CLM-009', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '2024-03-20', 'Capitol Pharmacy',          'E11.9',  '99232',  90,   75,   0,  90, 'Diabetes medication',                'denied'),
('e1000000-0000-0000-0000-000000000010', 'CLM-010', 'd1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', '2024-03-25', 'Northgate Physical Therapy','M54.5',  '97110', 320,  280, 224, 320, 'Therapeutic exercises',              'approved')
ON CONFLICT (claim_number) DO NOTHING;

UPDATE claims SET denial_reason='Not covered under current formulary. Submit prior auth form.' WHERE claim_number='CLM-009';
```

---

The HTML files (`index.html`, `members.html`, `products.html`, `plans.html`, `benefits.html`, `pricing.html`, `claims.html`, `audit.html`), `styles.css`, and `app.js` are **identical** to what was posted above — no changes needed to those.

---

## ⚡ Critical first step after deploying

After you run `schema.sql` and `seed.sql`, visit this URL **once** to fix the passwords:
```
https://your-render-url.onrender.com/api/setup
