-- Product
INSERT OR REPLACE INTO products(product_id, product_name, lob, effective_date, term_date)
VALUES ('PPOGOLD2026', 'PPO Gold 2026', 'Commercial', '2026-01-01', '2026-12-31');

-- Plan
INSERT OR REPLACE INTO plans(plan_id, product_id, plan_name, benefit_year, effective_date, term_date, network_model, notes)
VALUES ('PPO-GOLD-26', 'PPOGOLD2026', 'PPO Gold 2026 - Standard', 'Calendar', '2026-01-01', '2026-12-31', 'INN_OON',
        'Demo plan: Preventive 100% INN, PCP $25, Specialist $50, ER $250 + 20% (waive if admitted), Inpatient 80/20 after ded.');

-- Networks
INSERT OR REPLACE INTO networks(network_id, network_name) VALUES ('NET-INN-01', 'Preferred PPO Network');
INSERT OR REPLACE INTO networks(network_id, network_name) VALUES ('NET-OON-99', 'Out-of-Network');

INSERT OR REPLACE INTO plan_networks(plan_id, tier_code, network_id) VALUES ('PPO-GOLD-26', 'INN', 'NET-INN-01');
INSERT OR REPLACE INTO plan_networks(plan_id, tier_code, network_id) VALUES ('PPO-GOLD-26', 'OON', 'NET-OON-99');

-- Accumulators (limits in cents)
INSERT OR REPLACE INTO accumulators(accumulator_id, plan_id, tier_code, accumulator_type, ind_limit_cents, fam_limit_cents, embedded_family, reset_cycle)
VALUES
('INN_DED', 'PPO-GOLD-26', 'INN', 'DED', 100000, 200000, 1, 'Calendar'),
('INN_OOP', 'PPO-GOLD-26', 'INN', 'OOP', 350000, 700000, 1, 'Calendar'),
('OON_DED', 'PPO-GOLD-26', 'OON', 'DED', 250000, 500000, 0, 'Calendar'),
('OON_OOP', 'PPO-GOLD-26', 'OON', 'OOP', 800000, 1600000, 0, 'Calendar');

-- Benefit Rules (priority lower = first)
-- Preventive CPT 99381-99397
INSERT OR REPLACE INTO benefit_rules(rule_id, plan_id, tier_code, code_type, code_start, code_end, label, covered, deductible_applies, copay_cents, member_coins_pct, auth_required, er_waive_copay_if_admit, priority, effective_date, term_date, notes)
VALUES
('R1', 'PPO-GOLD-26', 'INN', 'CPT', 99381, 99397, 'Preventive Care', 1, 0, 0, 0, 0, 0, 10, '2026-01-01', '2099-12-31', 'Covered 100% INN'),
('R2', 'PPO-GOLD-26', 'OON', 'CPT', 99381, 99397, 'Preventive Care', 1, 1, 0, 40, 0, 0, 20, '2026-01-01', '2099-12-31', 'OON 60% after deductible');

-- PCP 99213
INSERT OR REPLACE INTO benefit_rules VALUES
('R3','PPO-GOLD-26','INN','CPT',99213,99213,'Primary Care Visit',1,0,2500,0,0,0,30,'2026-01-01','2099-12-31','$25 copay; no deductible'),
('R4','PPO-GOLD-26','OON','CPT',99213,99213,'Primary Care Visit',1,1,0,40,0,0,40,'2026-01-01','2099-12-31','OON 60% after deductible');

-- Specialist 99214
INSERT OR REPLACE INTO benefit_rules VALUES
('R5','PPO-GOLD-26','INN','CPT',99214,99214,'Specialist Visit',1,0,5000,0,0,0,50,'2026-01-01','2099-12-31','$50 copay; no deductible'),
('R6','PPO-GOLD-26','OON','CPT',99214,99214,'Specialist Visit',1,1,0,40,0,0,60,'2026-01-01','2099-12-31','OON 60% after deductible');

-- ER 99285 (INN: $250 copay then 20% on remainder, waive copay if admitted)
INSERT OR REPLACE INTO benefit_rules VALUES
('R7','PPO-GOLD-26','INN','CPT',99285,99285,'Emergency Room',1,0,25000,20,0,1,70,'2026-01-01','2099-12-31','$250 copay then 80/20; waive if admitted'),
('R8','PPO-GOLD-26','OON','CPT',99285,99285,'Emergency Room',1,1,0,40,0,0,80,'2026-01-01','2099-12-31','OON 60% after deductible');

-- Inpatient revenue 0100-0199 (store as 100-199)
INSERT OR REPLACE INTO benefit_rules VALUES
('R9','PPO-GOLD-26','INN','REV',100,199,'Inpatient Hospital',1,1,0,20,1,0,90,'2026-01-01','2099-12-31','Deductible then 80/20; auth required'),
('R10','PPO-GOLD-26','OON','REV',100,199,'Inpatient Hospital',1,1,0,40,1,0,100,'2026-01-01','2099-12-31','OON 60% after deductible; auth required');

-- Pricing (fee schedule)
INSERT OR REPLACE INTO fee_schedule(fee_id, plan_id, tier_code, code_type, code_start, code_end, allowed_cents, priority)
VALUES
('F1','PPO-GOLD-26','INN','CPT',99213,99213,15000,10),
('F2','PPO-GOLD-26','INN','CPT',99214,99214,25000,10),
('F3','PPO-GOLD-26','INN','CPT',99285,99285,200000,10),
('F4','PPO-GOLD-26','INN','CPT',99381,99397,30000,10),
('F5','PPO-GOLD-26','INN','REV',100,199,1000000,10),

('F6','PPO-GOLD-26','OON','CPT',99213,99213,15000,10),
('F7','PPO-GOLD-26','OON','CPT',99214,99214,25000,10),
('F8','PPO-GOLD-26','OON','CPT',99285,99285,200000,10),
('F9','PPO-GOLD-26','OON','CPT',99381,99397,30000,10),
('F10','PPO-GOLD-26','OON','REV',100,199,1000000,10);

-- Sample member similar to screenshot
INSERT OR REPLACE INTO members(
  member_id, mbi, status, record_source, user_entered, date_entered,
  salutation, first_name, mi, last_name,
  dob, sex, ssn,
  plan_id, pbp, segment_id, effective_date, term_date
) VALUES (
  'TMS00000583', 'EAUIEXLMEM15', 'PENDING', 'Data-entry', 'PDM Administrator', '2011-11-14 00:00:00',
  '', 'STEVE', '', 'SMITH',
  '1971-10-01', 'M', '',
  'PPO-GOLD-26', '007', '', '2026-01-01', '2026-12-31'
);

-- Seed member accumulator balances
INSERT OR REPLACE INTO member_accumulator_balances(member_id, plan_id, tier_code, accumulator_type, ytd_cents)
VALUES
('TMS00000583','PPO-GOLD-26','INN','DED',0),
('TMS00000583','PPO-GOLD-26','INN','OOP',0),
('TMS00000583','PPO-GOLD-26','OON','DED',0),
('TMS00000583','PPO-GOLD-26','OON','OOP',0);

INSERT INTO audit_log(action, entity_type, entity_id, details)
VALUES ('seed', 'system', 'init', 'Seeded PPO Gold 2026 plan, rules, pricing, and sample member.');
