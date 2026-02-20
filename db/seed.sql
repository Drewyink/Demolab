INSERT INTO products (product_code, product_name, product_type, description, status) VALUES
('PROD-HMO', 'HMO Basic', 'medical', 'Health Maintenance Organization basic coverage', 'active'),
('PROD-PPO', 'PPO Plus', 'medical', 'Preferred Provider Organization plus coverage', 'active'),
('PROD-DEN', 'Dental Select', 'dental', 'Full dental coverage including orthodontics', 'active'),
('PROD-VIS', 'Vision Care', 'vision', 'Comprehensive vision care plan', 'active')
ON CONFLICT (product_code) DO NOTHING;

INSERT INTO plans (plan_code, plan_name, effective_date, termination_date, deductible, oop_max, premium, status) VALUES
('PLN-001', 'Bronze HMO', '2024-01-01', '2024-12-31', 1500.00, 5000.00, 320.00, 'active'),
('PLN-002', 'Silver PPO', '2024-01-01', '2024-12-31', 800.00, 3500.00, 480.00, 'active'),
('PLN-003', 'Gold PPO Elite', '2024-01-01', '2024-12-31', 300.00, 2000.00, 720.00, 'active'),
('PLN-004', 'Platinum HMO', '2024-01-01', '2024-12-31', 0.00, 1500.00, 950.00, 'active')
ON CONFLICT (plan_code) DO NOTHING;

INSERT INTO members (member_id, first_name, last_name, dob, email, phone, status) VALUES
('MBR-001', 'James', 'Carter', '1985-03-15', 'james.carter@email.com', '555-0101', 'active'),
('MBR-002', 'Sarah', 'Nguyen', '1990-07-22', 'sarah.nguyen@email.com', '555-0102', 'active'),
('MBR-003', 'Robert', 'Kim', '1978-11-04', 'robert.kim@email.com', '555-0103', 'inactive'),
('MBR-004', 'Maria', 'Santos', '1995-05-30', 'maria.santos@email.com', '555-0104', 'active'),
('MBR-005', 'David', 'Williams', '1982-09-12', 'david.williams@email.com', '555-0105', 'active'),
('MBR-006', 'Lisa', 'Johnson', '1975-01-28', 'lisa.johnson@email.com', '555-0106', 'active')
ON CONFLICT (member_id) DO NOTHING;

INSERT INTO benefits (benefit_code, benefit_name, benefit_type, copay, coinsurance, covered, prior_auth_required) VALUES
('BEN-PCP', 'Primary Care Visit', 'medical', 20.00, 0.10, true, false),
('BEN-SPC', 'Specialist Visit', 'medical', 50.00, 0.20, true, false),
('BEN-ER', 'Emergency Room', 'medical', 250.00, 0.20, true, false),
('BEN-RX-GEN', 'Generic Prescription', 'pharmacy', 10.00, 0.00, true, false),
('BEN-RX-BRAND', 'Brand Prescription', 'pharmacy', 35.00, 0.20, true, false),
('BEN-MRI', 'MRI / CT Scan', 'imaging', 0.00, 0.20, true, true),
('BEN-SUR-OUT', 'Outpatient Surgery', 'surgical', 0.00, 0.20, true, true),
('BEN-SUR-IN', 'Inpatient Surgery', 'surgical', 0.00, 0.20, true, true),
('BEN-DENTAL-CLEAN', 'Dental Cleaning', 'dental', 0.00, 0.00, true, false),
('BEN-VISION-EXAM', 'Vision Exam', 'vision', 10.00, 0.00, true, false),
('BEN-MENTAL', 'Mental Health Visit', 'behavioral', 30.00, 0.20, true, false)
ON CONFLICT (benefit_code) DO NOTHING;

INSERT INTO pricing (pricing_code, tier, base_premium, employer_contribution, employee_contribution, effective_date, status) VALUES
('PRC-001', 'employee_only', 320.00, 250.00, 70.00, '2024-01-01', 'active'),
('PRC-002', 'employee_spouse', 640.00, 450.00, 190.00, '2024-01-01', 'active'),
('PRC-003', 'employee_child', 500.00, 380.00, 120.00, '2024-01-01', 'active'),
('PRC-004', 'family', 900.00, 600.00, 300.00, '2024-01-01', 'active'),
('PRC-005', 'employee_only', 480.00, 380.00, 100.00, '2024-01-01', 'active'),
('PRC-006', 'family', 1200.00, 800.00, 400.00, '2024-01-01', 'active')
ON CONFLICT (pricing_code) DO NOTHING;

INSERT INTO claims (claim_number, service_date, claim_date, provider, diagnosis_code, procedure_code, billed_amount, allowed_amount, paid_amount, status, notes) VALUES
('CLM-2024-001', '2024-03-10', '2024-03-15', 'City Medical Center', 'Z00.00', '99213', 250.00, 180.00, 144.00, 'paid', ''),
('CLM-2024-002', '2024-04-05', '2024-04-10', 'Westside Specialist Group', 'M54.5', '99214', 420.00, 310.00, 248.00, 'pending', 'Awaiting EOB'),
('CLM-2024-003', '2024-04-20', '2024-04-25', 'Metro Emergency Hospital', 'S09.90', '99283', 3200.00, 2400.00, 1920.00, 'paid', ''),
('CLM-2024-004', '2024-05-01', '2024-05-06', 'Sunrise Radiology', 'M51.16', '72148', 1800.00, 1200.00, 960.00, 'paid', 'MRI lumbar spine'),
('CLM-2024-005', '2024-05-14', '2024-05-19', 'Downtown Pharmacy', 'E11.9', '99999', 85.00, 75.00, 63.75, 'paid', 'Insulin prescription'),
('CLM-2024-006', '2024-06-02', '2024-06-07', 'Valley Surgical Center', 'K40.90', '49505', 12500.00, 9000.00, 7200.00, 'in_review', 'Prior auth submitted'),
('CLM-2024-007', '2024-06-15', '2024-06-20', 'Northside Family Practice', 'J06.9', '99212', 150.00, 110.00, 88.00, 'paid', ''),
('CLM-2024-008', '2024-07-03', '2024-07-08', 'Bay Area Dental', 'K02.9', 'D1110', 180.00, 180.00, 180.00, 'paid', 'Preventive - no cost share'),
('CLM-2024-009', '2024-07-22', '2024-07-27', 'Mental Health Associates', 'F32.1', '90837', 200.00, 150.00, 105.00, 'pending', ''),
('CLM-2024-010', '2024-08-10', '2024-08-15', 'City Medical Center', 'I10', '99215', 380.00, 280.00, 224.00, 'denied', 'Out of network provider')
ON CONFLICT (claim_number) DO NOTHING;
