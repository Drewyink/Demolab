-- Facets Configuration Software - Seed Data
-- Password for all users: Facets2024!

-- Users (passwords are bcrypt hashed for "Facets2024!")
INSERT INTO users (id, username, password_hash, full_name, email, role) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@facets-sandbox.com', 'admin'),
('a1b2c3d4-0001-0001-0001-000000000002', 'jsmith', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', 'jsmith@facets-sandbox.com', 'manager'),
('a1b2c3d4-0001-0001-0001-000000000003', 'mjohnson', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Johnson', 'mjohnson@facets-sandbox.com', 'analyst'),
('a1b2c3d4-0001-0001-0001-000000000004', 'lwilliams', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lisa Williams', 'lwilliams@facets-sandbox.com', 'viewer')
ON CONFLICT (username) DO NOTHING;

-- Products
INSERT INTO products (id, name, code, type, description, carrier, effective_date) VALUES
('b1b2c3d4-0001-0001-0001-000000000001', 'Blue Shield Medical', 'BSM-2024', 'medical', 'Comprehensive medical coverage through Blue Shield network', 'Blue Shield of California', '2024-01-01'),
('b1b2c3d4-0001-0001-0001-000000000002', 'Delta Dental', 'DD-2024', 'dental', 'Full dental coverage including orthodontia', 'Delta Dental', '2024-01-01'),
('b1b2c3d4-0001-0001-0001-000000000003', 'VSP Vision', 'VSP-2024', 'vision', 'Comprehensive eye care and eyewear benefits', 'VSP Vision Care', '2024-01-01'),
('b1b2c3d4-0001-0001-0001-000000000004', 'Express Scripts Rx', 'ESR-2024', 'pharmacy', 'Prescription drug benefit management', 'Express Scripts', '2024-01-01'),
('b1b2c3d4-0001-0001-0001-000000000005', 'Behavioral Health Plus', 'BHP-2024', 'behavioral', 'Mental health and substance abuse treatment', 'Magellan Health', '2024-01-01')
ON CONFLICT (code) DO NOTHING;

-- Plans
INSERT INTO plans (id, name, code, product_id, plan_type, deductible, oop_max, premium_individual, premium_family, description, effective_date) VALUES
('c1b2c3d4-0001-0001-0001-000000000001', 'Platinum PPO 500', 'PPO-PLAT-500', 'b1b2c3d4-0001-0001-0001-000000000001', 'PPO', 500.00, 3000.00, 320.00, 890.00, 'Top-tier PPO with low deductible and broad network access', '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000002', 'Gold HMO 1000', 'HMO-GOLD-1000', 'b1b2c3d4-0001-0001-0001-000000000001', 'HMO', 1000.00, 5000.00, 240.00, 680.00, 'Gold HMO with coordinated care model and PCP requirement', '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000003', 'Silver HDHP 2500', 'HDHP-SIL-2500', 'b1b2c3d4-0001-0001-0001-000000000001', 'HDHP', 2500.00, 7500.00, 180.00, 490.00, 'High-deductible health plan eligible for HSA contributions', '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000004', 'Dental Basic', 'DEN-BASIC', 'b1b2c3d4-0001-0001-0001-000000000002', 'other', 50.00, 1500.00, 28.00, 75.00, 'Basic dental with preventive and restorative coverage', '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000005', 'Dental Plus', 'DEN-PLUS', 'b1b2c3d4-0001-0001-0001-000000000002', 'other', 25.00, 3000.00, 52.00, 140.00, 'Enhanced dental including orthodontia for adults and children', '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000006', 'Vision Standard', 'VIS-STD', 'b1b2c3d4-0001-0001-0001-000000000003', 'other', 0.00, 500.00, 12.00, 32.00, 'Annual eye exam plus frames or contacts allowance', '2024-01-01')
ON CONFLICT (code) DO NOTHING;

-- Benefits
INSERT INTO benefits (plan_id, name, category, coverage_type, coverage_value, copay, coinsurance, prior_auth_required, notes) VALUES
-- Platinum PPO benefits
('c1b2c3d4-0001-0001-0001-000000000001', 'Preventive Care', 'preventive', 'percentage', 100.00, 0.00, 0.00, false, 'Covered 100% in-network, no cost sharing'),
('c1b2c3d4-0001-0001-0001-000000000001', 'Primary Care Visit', 'primary_care', 'flat_amount', 20.00, 20.00, 0.00, false, '$20 copay after deductible'),
('c1b2c3d4-0001-0001-0001-000000000001', 'Specialist Visit', 'specialist', 'flat_amount', 40.00, 40.00, 0.00, false, '$40 copay after deductible'),
('c1b2c3d4-0001-0001-0001-000000000001', 'Emergency Room', 'emergency', 'flat_amount', 150.00, 150.00, 0.00, false, 'Waived if admitted'),
('c1b2c3d4-0001-0001-0001-000000000001', 'Inpatient Hospital', 'hospital', 'percentage', 80.00, 0.00, 20.00, true, 'Prior auth required, 20% coinsurance after deductible'),
('c1b2c3d4-0001-0001-0001-000000000001', 'Mental Health', 'mental_health', 'flat_amount', 20.00, 20.00, 0.00, false, 'Parity with medical benefits'),
-- Gold HMO benefits
('c1b2c3d4-0001-0001-0001-000000000002', 'Preventive Care', 'preventive', 'percentage', 100.00, 0.00, 0.00, false, 'No cost sharing required'),
('c1b2c3d4-0001-0001-0001-000000000002', 'Primary Care Visit', 'primary_care', 'flat_amount', 25.00, 25.00, 0.00, false, 'Must use PCP in network'),
('c1b2c3d4-0001-0001-0001-000000000002', 'Specialist Visit', 'specialist', 'flat_amount', 50.00, 50.00, 0.00, true, 'Referral from PCP required'),
('c1b2c3d4-0001-0001-0001-000000000002', 'Emergency Room', 'emergency', 'flat_amount', 200.00, 200.00, 0.00, false, 'In-network nationwide for emergencies'),
-- HDHP benefits
('c1b2c3d4-0001-0001-0001-000000000003', 'Preventive Care', 'preventive', 'percentage', 100.00, 0.00, 0.00, false, 'Before deductible, 100% covered'),
('c1b2c3d4-0001-0001-0001-000000000003', 'Primary Care Visit', 'primary_care', 'percentage', 80.00, 0.00, 20.00, false, 'After deductible, 20% coinsurance'),
('c1b2c3d4-0001-0001-0001-000000000003', 'Specialist Visit', 'specialist', 'percentage', 80.00, 0.00, 20.00, false, 'After deductible, 20% coinsurance'),
-- Dental Basic benefits
('c1b2c3d4-0001-0001-0001-000000000004', 'Preventive & Diagnostic', 'preventive', 'percentage', 100.00, 0.00, 0.00, false, 'Cleanings, x-rays, exams covered 100%'),
('c1b2c3d4-0001-0001-0001-000000000004', 'Basic Restorative', 'other', 'percentage', 80.00, 0.00, 20.00, false, 'Fillings, simple extractions'),
('c1b2c3d4-0001-0001-0001-000000000004', 'Major Restorative', 'other', 'percentage', 50.00, 0.00, 50.00, true, 'Crowns, bridges, dentures');

-- Pricing
INSERT INTO pricing (plan_id, tier, rate_type, amount, effective_date) VALUES
('c1b2c3d4-0001-0001-0001-000000000001', 'individual', 'monthly', 320.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000001', 'individual_spouse', 'monthly', 620.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000001', 'individual_children', 'monthly', 580.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000001', 'family', 'monthly', 890.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000002', 'individual', 'monthly', 240.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000002', 'individual_spouse', 'monthly', 460.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000002', 'individual_children', 'monthly', 430.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000002', 'family', 'monthly', 680.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000003', 'individual', 'monthly', 180.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000003', 'individual_spouse', 'monthly', 340.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000003', 'individual_children', 'monthly', 310.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000003', 'family', 'monthly', 490.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000004', 'individual', 'monthly', 28.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000004', 'family', 'monthly', 75.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000005', 'individual', 'monthly', 52.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000005', 'family', 'monthly', 140.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000006', 'individual', 'monthly', 12.00, '2024-01-01'),
('c1b2c3d4-0001-0001-0001-000000000006', 'family', 'monthly', 32.00, '2024-01-01');

-- Members
INSERT INTO members (id, member_id, first_name, last_name, email, phone, date_of_birth, gender, address, city, state, zip, plan_id, employer, effective_date) VALUES
('d1b2c3d4-0001-0001-0001-000000000001', 'MBR-001', 'Robert', 'Anderson', 'randerson@email.com', '555-234-5678', '1985-03-15', 'male', '123 Oak Street', 'Sacramento', 'CA', '95814', 'c1b2c3d4-0001-0001-0001-000000000001', 'TechCorp Inc.', '2024-01-01'),
('d1b2c3d4-0001-0001-0001-000000000002', 'MBR-002', 'Sarah', 'Martinez', 'smartinez@email.com', '555-345-6789', '1990-07-22', 'female', '456 Pine Ave', 'San Francisco', 'CA', '94102', 'c1b2c3d4-0001-0001-0001-000000000002', 'HealthStar LLC', '2024-01-01'),
('d1b2c3d4-0001-0001-0001-000000000003', 'MBR-003', 'James', 'Thompson', 'jthompson@email.com', '555-456-7890', '1978-11-08', 'male', '789 Elm Drive', 'Los Angeles', 'CA', '90001', 'c1b2c3d4-0001-0001-0001-000000000003', 'BuildRight Co.', '2024-01-01'),
('d1b2c3d4-0001-0001-0001-000000000004', 'MBR-004', 'Emily', 'Chen', 'echen@email.com', '555-567-8901', '1995-02-14', 'female', '321 Maple Lane', 'San Diego', 'CA', '92101', 'c1b2c3d4-0001-0001-0001-000000000001', 'InnovateTech', '2024-02-01'),
('d1b2c3d4-0001-0001-0001-000000000005', 'MBR-005', 'David', 'Wilson', 'dwilson@email.com', '555-678-9012', '1982-09-30', 'male', '654 Cedar Road', 'Oakland', 'CA', '94601', 'c1b2c3d4-0001-0001-0001-000000000002', 'Pacific Logistics', '2024-01-15'),
('d1b2c3d4-0001-0001-0001-000000000006', 'MBR-006', 'Jennifer', 'Davis', 'jdavis@email.com', '555-789-0123', '1988-05-19', 'female', '987 Birch Blvd', 'San Jose', 'CA', '95101', 'c1b2c3d4-0001-0001-0001-000000000003', 'GreenEnergy Corp', '2024-03-01'),
('d1b2c3d4-0001-0001-0001-000000000007', 'MBR-007', 'Michael', 'Garcia', 'mgarcia@email.com', '555-890-1234', '1975-12-25', 'male', '147 Willow Way', 'Fresno', 'CA', '93701', 'c1b2c3d4-0001-0001-0001-000000000001', 'Valley Farms', '2024-01-01'),
('d1b2c3d4-0001-0001-0001-000000000008', 'MBR-008', 'Ashley', 'Brown', 'abrown@email.com', '555-901-2345', '1993-04-07', 'female', '258 Spruce Court', 'Long Beach', 'CA', '90801', 'c1b2c3d4-0001-0001-0001-000000000002', 'Harbor Shipping', '2024-02-15');

-- Claims
INSERT INTO claims (id, claim_number, member_id, plan_id, service_date, provider_name, diagnosis_code, procedure_code, billed_amount, allowed_amount, paid_amount, amount, description, status, processed_date) VALUES
('e1b2c3d4-0001-0001-0001-000000000001', 'CLM-001', 'd1b2c3d4-0001-0001-0001-000000000001', 'c1b2c3d4-0001-0001-0001-000000000001', '2024-01-15', 'Dr. Smith Family Practice', 'Z00.00', '99213', 250.00, 180.00, 160.00, 250.00, 'Office visit - routine checkup', 'paid', '2024-01-20'),
('e1b2c3d4-0001-0001-0001-000000000002', 'CLM-002', 'd1b2c3d4-0001-0001-0001-000000000002', 'c1b2c3d4-0001-0001-0001-000000000002', '2024-01-22', 'Bay Area Specialists', 'M54.5', '99214', 350.00, 280.00, 230.00, 350.00, 'Specialist consultation - back pain', 'paid', '2024-01-28'),
('e1b2c3d4-0001-0001-0001-000000000003', 'CLM-003', 'd1b2c3d4-0001-0001-0001-000000000003', 'c1b2c3d4-0001-0001-0001-000000000003', '2024-02-05', 'Memorial Hospital', 'J06.9', '99283', 1200.00, 950.00, 0.00, 1200.00, 'Emergency room visit - upper respiratory', 'pending', NULL),
('e1b2c3d4-0001-0001-0001-000000000004', 'CLM-004', 'd1b2c3d4-0001-0001-0001-000000000004', 'c1b2c3d4-0001-0001-0001-000000000001', '2024-02-10', 'Pacific Imaging Center', 'G43.009', '70553', 2400.00, 1800.00, 1440.00, 2400.00, 'MRI Brain without contrast', 'approved', '2024-02-15'),
('e1b2c3d4-0001-0001-0001-000000000005', 'CLM-005', 'd1b2c3d4-0001-0001-0001-000000000005', 'c1b2c3d4-0001-0001-0001-000000000002', '2024-02-18', 'Sunvalley Lab Services', 'Z00.00', '80053', 180.00, 120.00, 95.00, 180.00, 'Comprehensive metabolic panel', 'paid', '2024-02-22'),
('e1b2c3d4-0001-0001-0001-000000000006', 'CLM-006', 'd1b2c3d4-0001-0001-0001-000000000006', 'c1b2c3d4-0001-0001-0001-000000000003', '2024-03-01', 'City Orthopedics', 'M17.11', '99215', 420.00, 380.00, 0.00, 420.00, 'Knee consultation - osteoarthritis', 'in_review', NULL),
('e1b2c3d4-0001-0001-0001-000000000007', 'CLM-007', 'd1b2c3d4-0001-0001-0001-000000000007', 'c1b2c3d4-0001-0001-0001-000000000001', '2024-03-08', 'Central Valley Surgery', 'K80.20', '47562', 8500.00, 6800.00, 0.00, 8500.00, 'Laparoscopic cholecystectomy', 'pending', NULL),
('e1b2c3d4-0001-0001-0001-000000000008', 'CLM-008', 'd1b2c3d4-0001-0001-0001-000000000008', 'c1b2c3d4-0001-0001-0001-000000000002', '2024-03-12', 'Harbor Mental Health', 'F41.1', '90837', 200.00, 160.00, 135.00, 200.00, 'Individual psychotherapy 60 min', 'paid', '2024-03-18'),
('e1b2c3d4-0001-0001-0001-000000000009', 'CLM-009', 'd1b2c3d4-0001-0001-0001-000000000001', 'c1b2c3d4-0001-0001-0001-000000000001', '2024-03-20', 'Capitol Pharmacy', 'E11.9', '99232', 90.00, 75.00, 0.00, 90.00, 'Diabetes medication - insulin', 'denied', '2024-03-25'),
('e1b2c3d4-0001-0001-0001-000000000010', 'CLM-010', 'd1b2c3d4-0001-0001-0001-000000000003', 'c1b2c3d4-0001-0001-0001-000000000003', '2024-03-25', 'Northgate Physical Therapy', 'M54.5', '97110', 320.00, 280.00, 224.00, 320.00, 'Therapeutic exercises x16 units', 'approved', '2024-03-28');

-- Update denial reason for denied claim
UPDATE claims SET denial_reason = 'Service not covered under current formulary. Please submit with prior authorization or formulary exception form.' WHERE claim_number = 'CLM-009';
