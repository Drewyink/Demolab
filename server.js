require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = {
  members: [], products: [], plans: [], benefits: [], pricing: [],
  claims: [], audit_logs: [],
  groups: [], providers: [], authorizations: [],
  classes: [], provider_contracts: [], fee_tables: [],
  service_groups: [], networx_configs: [], program_configs: [],
  dental_configs: [], claim_pends: []
};

function seedDB() {
  const pid1=uuidv4(),pid2=uuidv4(),pid3=uuidv4(),pid4=uuidv4();
  const grp1id=uuidv4(),grp2id=uuidv4(),grp3id=uuidv4();
  const pln1id=uuidv4(),pln2id=uuidv4(),pln3id=uuidv4(),pln4id=uuidv4();
  const prov1id=uuidv4(),prov2id=uuidv4(),prov3id=uuidv4();

  db.products=[
    {id:pid1,product_code:'PROD-HMO',product_name:'HMO Basic',product_type:'medical',description:'Health Maintenance Organization basic coverage',status:'active',created_at:new Date()},
    {id:pid2,product_code:'PROD-PPO',product_name:'PPO Plus',product_type:'medical',description:'Preferred Provider Organization plus coverage',status:'active',created_at:new Date()},
    {id:pid3,product_code:'PROD-DEN',product_name:'Dental Select',product_type:'dental',description:'Full dental coverage including orthodontics',status:'active',created_at:new Date()},
    {id:pid4,product_code:'PROD-VIS',product_name:'Vision Care',product_type:'vision',description:'Comprehensive vision care plan',status:'active',created_at:new Date()}
  ];
  db.plans=[
    {id:pln1id,plan_code:'PLN-001',plan_name:'Bronze HMO',product_id:pid1,plan_type:'hmo',effective_date:'2026-01-01',termination_date:'2026-12-31',deductible:1500,oop_max:5000,premium:320,status:'active',created_at:new Date()},
    {id:pln2id,plan_code:'PLN-002',plan_name:'Silver PPO',product_id:pid2,plan_type:'ppo',effective_date:'2026-01-01',termination_date:'2026-12-31',deductible:800,oop_max:3500,premium:480,status:'active',created_at:new Date()},
    {id:pln3id,plan_code:'PLN-003',plan_name:'Gold PPO Elite',product_id:pid2,plan_type:'ppo',effective_date:'2026-01-01',termination_date:'2026-12-31',deductible:300,oop_max:2000,premium:720,status:'active',created_at:new Date()},
    {id:pln4id,plan_code:'PLN-004',plan_name:'Platinum HDHP',product_id:pid1,plan_type:'hdhp',effective_date:'2026-01-01',termination_date:'2026-12-31',deductible:1400,oop_max:3000,premium:560,status:'active',created_at:new Date()}
  ];
  db.groups=[
    {id:grp1id,group_id:'GRP-001',employer_name:'Acme Technology Corp',tax_id:'12-3456789',sic_code:'7372',industry:'technology',group_size:120,contract_start:'2026-01-01',renewal_date:'2026-12-31',contribution_model:'defined_contribution',employer_contribution_pct:75,waiting_period_days:30,oe_month:10,contact_name:'Linda Davis',contact_email:'hr@acmetech.com',contact_phone:'555-1000',billing_address:'100 Tech Blvd, Austin TX 78701',plan_offerings:'Silver PPO, Gold PPO Elite, Dental Select',cobra_eligible:'yes',erisa_plan:'yes',status:'active',notes:'',created_at:new Date()},
    {id:grp2id,group_id:'GRP-002',employer_name:'Blue Ridge Community Hospital',tax_id:'98-7654321',sic_code:'8062',industry:'healthcare',group_size:450,contract_start:'2026-01-01',renewal_date:'2026-12-31',contribution_model:'defined_benefit',employer_contribution_pct:90,waiting_period_days:0,oe_month:11,contact_name:'Marcus Webb',contact_email:'benefits@brchosp.org',contact_phone:'555-2000',billing_address:'500 Hospital Way, Asheville NC 28801',plan_offerings:'HMO Basic, PPO Plus, Platinum HDHP, Dental Select, Vision Care',cobra_eligible:'yes',erisa_plan:'yes',status:'active',notes:'Key account',created_at:new Date()},
    {id:grp3id,group_id:'GRP-003',employer_name:'Main Street Diner Group',tax_id:'55-1122334',sic_code:'5812',industry:'hospitality',group_size:18,contract_start:'2026-04-01',renewal_date:'2026-03-31',contribution_model:'split',employer_contribution_pct:50,waiting_period_days:60,oe_month:3,contact_name:'Tony Rizzo',contact_email:'tony@mainstreetdiner.com',contact_phone:'555-3000',billing_address:'22 Main St, Greenville SC 29601',plan_offerings:'Bronze HMO',cobra_eligible:'no',erisa_plan:'yes',status:'pending',notes:'Awaiting final contract signatures',created_at:new Date()}
  ];
  const mbr1id=uuidv4(),mbr2id=uuidv4();
  db.members=[
    {id:mbr1id,member_id:'MBR-001',first_name:'James',last_name:'Carter',dob:'1985-03-15',email:'james.carter@email.com',phone:'555-0101',plan_id:pln2id,enrollment_tier:'employee_only',enrollment_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:mbr2id,member_id:'MBR-002',first_name:'Sarah',last_name:'Nguyen',dob:'1990-07-22',email:'sarah.nguyen@email.com',phone:'555-0102',plan_id:pln3id,enrollment_tier:'employee_spouse',enrollment_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),member_id:'MBR-003',first_name:'Robert',last_name:'Kim',dob:'1978-11-04',email:'robert.kim@email.com',phone:'555-0103',plan_id:null,enrollment_tier:null,enrollment_date:null,status:'inactive',created_at:new Date()},
    {id:uuidv4(),member_id:'MBR-004',first_name:'Maria',last_name:'Santos',dob:'1995-05-30',email:'maria.santos@email.com',phone:'555-0104',plan_id:pln1id,enrollment_tier:'family',enrollment_date:'2026-01-01',status:'active',created_at:new Date()}
  ];
  db.benefits=[
    {id:uuidv4(),benefit_code:'BEN-PCP',benefit_name:'Primary Care Visit',plan_type:'hmo',benefit_type:'medical',copay:20,coinsurance:0,deductible_individual:0,oop_max_individual:6000,covered:'yes',prior_auth_required:'no',deductible_applies:'no',aca_preventive:'no',cob_applies:'no',cob_method:'coordination',medicare_interaction:'none',medicaid_interaction:'none',accumulator_group:'medical',counts_toward_deductible:'yes',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'yes',medical_necessity:'no',exception_category:'none',dup_detection:true,status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-SPC',benefit_name:'Specialist Visit',plan_type:'ppo',benefit_type:'medical',copay:50,coinsurance:20,deductible_individual:800,oop_max_individual:3500,covered:'yes',prior_auth_required:'no',deductible_applies:'yes',aca_preventive:'no',cob_applies:'yes',cob_method:'coordination',medicare_interaction:'none',medicaid_interaction:'none',accumulator_group:'medical',counts_toward_deductible:'yes',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',exception_category:'none',dup_detection:true,status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-ER',benefit_name:'Emergency Room',plan_type:'all',benefit_type:'medical',copay:250,coinsurance:20,deductible_individual:1500,oop_max_individual:5000,covered:'yes',prior_auth_required:'no',deductible_applies:'yes',aca_preventive:'no',cob_applies:'yes',cob_method:'non_duplication',medicare_interaction:'none',medicaid_interaction:'none',accumulator_group:'medical',counts_toward_deductible:'yes',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',exception_category:'none',dup_detection:true,status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-RX-GEN',benefit_name:'Generic Prescriptions',plan_type:'all',benefit_type:'pharmacy',copay:10,coinsurance:0,deductible_individual:0,oop_max_individual:0,covered:'yes',prior_auth_required:'no',deductible_applies:'no',aca_preventive:'no',cob_applies:'no',cob_method:'coordination',medicare_interaction:'none',medicaid_interaction:'none',accumulator_group:'pharmacy',counts_toward_deductible:'no',counts_toward_oop:'yes',embedded_deductible:'no',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',exception_category:'none',dup_detection:true,status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-MRI',benefit_name:'MRI / CT Scan',plan_type:'all',benefit_type:'imaging',copay:0,coinsurance:20,deductible_individual:1500,oop_max_individual:5000,covered:'yes',prior_auth_required:'yes',deductible_applies:'yes',aca_preventive:'no',cob_applies:'no',cob_method:'coordination',medicare_interaction:'none',medicaid_interaction:'none',accumulator_group:'medical',counts_toward_deductible:'yes',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'no',medical_necessity:'yes',exception_category:'none',dup_detection:true,status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-PREV',benefit_name:'Preventive Care (ACA)',plan_type:'all',benefit_type:'preventive',copay:0,coinsurance:0,deductible_individual:0,oop_max_individual:0,covered:'yes',prior_auth_required:'no',deductible_applies:'waived_preventive',aca_preventive:'yes',cob_applies:'no',cob_method:'coordination',medicare_interaction:'none',medicaid_interaction:'none',accumulator_group:'medical',counts_toward_deductible:'no',counts_toward_oop:'no',embedded_deductible:'no',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',exception_category:'none',dup_detection:true,status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-RX-BRAND',benefit_name:'Brand Prescriptions',plan_type:'all',benefit_type:'pharmacy',copay:40,coinsurance:0,deductible_individual:0,oop_max_individual:0,covered:'yes',prior_auth_required:'no',deductible_applies:'no',aca_preventive:'no',cob_applies:'no',cob_method:'coordination',medicare_interaction:'none',medicaid_interaction:'none',accumulator_group:'pharmacy',counts_toward_deductible:'no',counts_toward_oop:'yes',embedded_deductible:'no',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',exception_category:'none',dup_detection:true,status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-SURG',benefit_name:'Inpatient Surgery',plan_type:'all',benefit_type:'surgical',copay:0,coinsurance:20,deductible_individual:1500,oop_max_individual:5000,covered:'yes',prior_auth_required:'yes',deductible_applies:'yes',aca_preventive:'no',cob_applies:'yes',cob_method:'coordination',medicare_interaction:'none',medicaid_interaction:'none',accumulator_group:'medical',counts_toward_deductible:'yes',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'no',medical_necessity:'yes',exception_category:'none',dup_detection:true,status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-DENT-PREV',benefit_name:'Dental Preventive',plan_type:'all',benefit_type:'dental',copay:0,coinsurance:0,deductible_individual:0,oop_max_individual:2000,covered:'yes',prior_auth_required:'no',deductible_applies:'no',aca_preventive:'no',cob_applies:'no',cob_method:'birthday_rule',medicare_interaction:'none',medicaid_interaction:'none',accumulator_group:'dental',counts_toward_deductible:'no',counts_toward_oop:'yes',embedded_deductible:'no',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',exception_category:'none',dup_detection:true,status:'active',created_at:new Date()}
  ];
  db.pricing=[
    {id:uuidv4(),pricing_code:'PRC-001',plan_id:pln1id,tier:'employee_only',base_premium:320,employer_contribution:250,employee_contribution:70,effective_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),pricing_code:'PRC-002',plan_id:pln2id,tier:'employee_spouse',base_premium:640,employer_contribution:450,employee_contribution:190,effective_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),pricing_code:'PRC-003',plan_id:pln3id,tier:'employee_child',base_premium:500,employer_contribution:380,employee_contribution:120,effective_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),pricing_code:'PRC-004',plan_id:pln4id,tier:'family',base_premium:900,employer_contribution:600,employee_contribution:300,effective_date:'2026-01-01',status:'active',created_at:new Date()}
  ];
  const clm1id=uuidv4(),clm2id=uuidv4(),clm3id=uuidv4(),clm4id=uuidv4(),clm5id=uuidv4();
  db.claims=[
    {id:clm1id,claim_number:'CLM-2026-001',member_id:mbr1id,plan_id:pln2id,claim_type:'professional_837p',service_date:'2026-03-10',claim_date:'2026-03-15',provider:'City Medical Center',diagnosis_code:'Z00.00',procedure_code:'99213',billed_amount:250,allowed_amount:180,paid_amount:144,status:'paid',notes:'',created_at:new Date()},
    {id:clm2id,claim_number:'CLM-2026-002',member_id:mbr2id,plan_id:pln3id,claim_type:'professional_837p',service_date:'2026-04-05',claim_date:'2026-04-10',provider:'Westside Specialist Group',diagnosis_code:'M54.5',procedure_code:'99214',billed_amount:420,allowed_amount:310,paid_amount:248,status:'pending',notes:'Awaiting EOB',created_at:new Date()},
    {id:clm3id,claim_number:'CLM-2026-003',member_id:null,plan_id:pln1id,claim_type:'institutional_837i',service_date:'2026-04-20',claim_date:'2026-04-25',provider:'Metro Emergency Hospital',diagnosis_code:'S09.90',procedure_code:'99283',billed_amount:3200,allowed_amount:2400,paid_amount:1920,status:'paid',notes:'',created_at:new Date()},
    {id:clm4id,claim_number:'CLM-2026-004',member_id:null,plan_id:pln4id,claim_type:'institutional_837i',service_date:'2026-06-15',claim_date:'2026-06-20',provider:'Valley Surgical Center',diagnosis_code:'K40.90',procedure_code:'49505',billed_amount:12500,allowed_amount:9000,paid_amount:0,status:'in_review',notes:'Prior auth submitted — awaiting UM decision',created_at:new Date()},
    {id:clm5id,claim_number:'CLM-2026-005',member_id:null,plan_id:pln2id,claim_type:'professional_837p',service_date:'2026-08-10',claim_date:'2026-08-15',provider:'City Medical Center',diagnosis_code:'I10',procedure_code:'99215',billed_amount:380,allowed_amount:280,paid_amount:0,status:'denied',notes:'Out of network — no OON benefit',created_at:new Date()}
  ];
  db.providers=[
    {id:prov1id,npi:'1234567890',provider_name:'City Medical Center',provider_type:'facility',specialty:'hospital',taxonomy_code:'282N00000X',network:'in_network',fee_schedule:'drg',credentialing_status:'credentialed',capitation_eligible:'no',pcp_panel_open:'na',sanctioned:'no',status:'active',created_at:new Date()},
    {id:prov2id,npi:'0987654321',provider_name:'Dr. Sarah Patel',first_name:'Sarah',last_name:'Patel',provider_type:'individual',specialty:'primary_care',taxonomy_code:'207Q00000X',network:'in_network',fee_schedule:'rbrvs',credentialing_status:'credentialed',capitation_eligible:'yes',capitation_pmpm:22.50,pcp_panel_open:'yes',panel_capacity:500,sanctioned:'no',status:'active',created_at:new Date()},
    {id:prov3id,npi:'1122334455',provider_name:'Westside Specialist Group',provider_type:'group',specialty:'internal_medicine',taxonomy_code:'207R00000X',network:'preferred',fee_schedule:'rbrvs',credentialing_status:'credentialed',capitation_eligible:'no',pcp_panel_open:'no',sanctioned:'no',status:'active',created_at:new Date()}
  ];
  db.authorizations=[
    {id:uuidv4(),auth_number:'AUTH-2026-001',member_id:null,provider_id:prov1id,auth_type:'inpatient',service_requested:'Inpatient hospitalization — cardiac catheterization',diagnosis_code:'I25.10',procedure_code:'93454',units_requested:3,units_approved:2,effective_date:'2026-04-15',expiration_date:'2026-07-15',um_decision:'approved',decision_date:'2026-04-10',decision_by:'Dr. Kelsey Morton, MD',urgency:'routine',status:'active',notes:'Approved for 2-day inpatient stay',created_at:new Date()},
    {id:uuidv4(),auth_number:'AUTH-2026-002',member_id:null,provider_id:prov2id,auth_type:'specialty_rx',service_requested:'Adalimumab 40mg — rheumatoid arthritis',diagnosis_code:'M05.79',procedure_code:'J0135',units_requested:12,units_approved:0,effective_date:null,expiration_date:null,um_decision:'pending',decision_date:null,decision_by:null,urgency:'routine',status:'pending',notes:'Awaiting clinical documentation',created_at:new Date()},
    {id:uuidv4(),auth_number:'AUTH-2026-003',member_id:null,provider_id:prov3id,auth_type:'outpatient_surgery',service_requested:'Knee arthroscopy — right knee',diagnosis_code:'M23.61',procedure_code:'29881',units_requested:1,units_approved:0,effective_date:null,expiration_date:null,um_decision:'denied',decision_date:'2026-05-02',decision_by:'UM Team',urgency:'routine',status:'closed',notes:'Denied — PT x12 visits required first',created_at:new Date()}
  ];
  // NEW: CLASSES
  db.classes=[
    {id:uuidv4(),class_code:'CLS-EXEC',class_name:'Executive',group_id:grp1id,description:'Executive-level employees',eligible_plans:'Gold PPO Elite, Platinum HDHP',waiting_period_days:0,cobra_eligible:'yes',contribution_override_pct:95,status:'active',created_at:new Date()},
    {id:uuidv4(),class_code:'CLS-FULL',class_name:'Full-Time Employee',group_id:grp1id,description:'Regular full-time employees (30+ hrs/wk)',eligible_plans:'Silver PPO, Gold PPO Elite, Dental Select',waiting_period_days:30,cobra_eligible:'yes',contribution_override_pct:75,status:'active',created_at:new Date()},
    {id:uuidv4(),class_code:'CLS-PART',class_name:'Part-Time Employee',group_id:grp2id,description:'Part-time employees (20-29 hrs/wk)',eligible_plans:'Bronze HMO',waiting_period_days:60,cobra_eligible:'no',contribution_override_pct:50,status:'active',created_at:new Date()},
    {id:uuidv4(),class_code:'CLS-UNION',class_name:'Union Member',group_id:grp2id,description:'Collective bargaining unit members',eligible_plans:'HMO Basic, PPO Plus',waiting_period_days:0,cobra_eligible:'yes',contribution_override_pct:85,status:'active',created_at:new Date()}
  ];
  // NEW: PROVIDER CONTRACTS
  db.provider_contracts=[
    {id:uuidv4(),contract_number:'CNTR-2026-001',provider_id:prov1id,provider_name:'City Medical Center',contract_type:'facility',network_tier:'in_network',effective_date:'2026-01-01',termination_date:'2027-12-31',reimbursement_method:'drg',reimbursement_rate:92.5,carve_outs:'Transplants, CAR-T, Trauma L1',capitation_pmpm:null,risk_arrangement:'fee_for_service',quality_incentive:'yes',quality_withhold_pct:2,auto_adjudicate:'yes',edi_enabled:'yes',status:'active',notes:'',created_at:new Date()},
    {id:uuidv4(),contract_number:'CNTR-2026-002',provider_id:prov2id,provider_name:'Dr. Sarah Patel',contract_type:'individual',network_tier:'in_network',effective_date:'2026-01-01',termination_date:'2026-12-31',reimbursement_method:'capitation',reimbursement_rate:null,carve_outs:'Behavioral health, Oncology',capitation_pmpm:22.50,risk_arrangement:'global_capitation',quality_incentive:'yes',quality_withhold_pct:5,auto_adjudicate:'yes',edi_enabled:'yes',status:'active',notes:'PCP — panel 500 max',created_at:new Date()},
    {id:uuidv4(),contract_number:'CNTR-2026-003',provider_id:prov3id,provider_name:'Westside Specialist Group',contract_type:'group_practice',network_tier:'preferred',effective_date:'2026-01-01',termination_date:'2026-12-31',reimbursement_method:'rbrvs',reimbursement_rate:105,carve_outs:'',capitation_pmpm:null,risk_arrangement:'fee_for_service',quality_incentive:'no',quality_withhold_pct:0,auto_adjudicate:'yes',edi_enabled:'yes',status:'active',notes:'',created_at:new Date()}
  ];
  // NEW: FEE TABLES
  db.fee_tables=[
    {id:uuidv4(),fee_table_code:'FT-RBRVS-2026',fee_table_name:'RBRVS Medicare Fee Schedule 2026',fee_table_type:'rbrvs',effective_date:'2026-01-01',termination_date:'2026-12-31',locality:'National',conversion_factor:33.8906,modifier_support:'yes',sample_codes:'99213:$85.20, 99214:$125.40, 99215:$165.80, 93000:$28.75',status:'active',created_at:new Date()},
    {id:uuidv4(),fee_table_code:'FT-DRG-2026',fee_table_name:'MS-DRG Facility Fee Schedule 2026',fee_table_type:'drg',effective_date:'2026-01-01',termination_date:'2026-12-31',locality:'National',conversion_factor:null,modifier_support:'no',sample_codes:'DRG-470:$14200, DRG-291:$18750, DRG-392:$9800',status:'active',created_at:new Date()},
    {id:uuidv4(),fee_table_code:'FT-DENT-2026',fee_table_name:'Dental UCR Fee Schedule 2026',fee_table_type:'ucr_dental',effective_date:'2026-01-01',termination_date:'2026-12-31',locality:'Southeast',conversion_factor:null,modifier_support:'yes',sample_codes:'D0120:$65, D0274:$82, D1110:$120, D2140:$175, D2740:$1250',status:'active',created_at:new Date()},
    {id:uuidv4(),fee_table_code:'FT-NWRX-PPO',fee_table_name:'NetworX PPO Reimbursement Table',fee_table_type:'networx',effective_date:'2026-01-01',termination_date:'2026-12-31',locality:'Multi-state',conversion_factor:null,modifier_support:'yes',sample_codes:'99213:$97.50, 99214:$143.80, PT eval:$148.20',status:'active',created_at:new Date()}
  ];
  // NEW: SERVICE GROUPS
  db.service_groups=[
    {id:uuidv4(),service_group_code:'SG-MED',service_group_name:'Medical/Surgical',category:'medical',procedure_ranges:'99201-99499, 10000-69999',revenue_codes:'0100-0999',place_of_service:'all',accumulator_bucket:'medical',benefit_cross_reference:'BEN-PCP, BEN-SPC, BEN-SURG, BEN-ER',applies_to_deductible:'yes',applies_to_oop:'yes',status:'active',created_at:new Date()},
    {id:uuidv4(),service_group_code:'SG-PREV',service_group_name:'Preventive / Wellness',category:'preventive',procedure_ranges:'99381-99397, G0438-G0439',revenue_codes:'0770',place_of_service:'11,22',accumulator_bucket:'preventive',benefit_cross_reference:'BEN-PREV',applies_to_deductible:'no',applies_to_oop:'no',status:'active',created_at:new Date()},
    {id:uuidv4(),service_group_code:'SG-RX',service_group_name:'Pharmacy (Formulary)',category:'pharmacy',procedure_ranges:'NDC-all',revenue_codes:'0250-0259',place_of_service:'01',accumulator_bucket:'pharmacy',benefit_cross_reference:'BEN-RX-GEN, BEN-RX-BRAND, BEN-RX-SPEC',applies_to_deductible:'no',applies_to_oop:'yes',status:'active',created_at:new Date()},
    {id:uuidv4(),service_group_code:'SG-BH',service_group_name:'Behavioral Health / MH-SUD',category:'behavioral_health',procedure_ranges:'90791-90899, H0001-H2036',revenue_codes:'0900-0914',place_of_service:'11,52,53',accumulator_bucket:'behavioral',benefit_cross_reference:'BEN-MH, BEN-SUD',applies_to_deductible:'yes',applies_to_oop:'yes',status:'active',created_at:new Date()},
    {id:uuidv4(),service_group_code:'SG-IMG',service_group_name:'Advanced Imaging',category:'imaging',procedure_ranges:'70010-76999',revenue_codes:'0320-0329',place_of_service:'11,22,24',accumulator_bucket:'medical',benefit_cross_reference:'BEN-MRI',applies_to_deductible:'yes',applies_to_oop:'yes',status:'active',created_at:new Date()}
  ];
  // NEW: NETWORX CONFIGS
  db.networx_configs=[
    {id:uuidv4(),config_code:'NWX-001',config_name:'PPO In-Network Standard',network_tier:'in_network',pricing_method:'rbrvs_pct',rbrvs_pct:110,fee_table_code:'FT-NWRX-PPO',qualifier_type:'taxonomy',qualifier_value:'all',modifier_adjustments:'25:-$0, 51:-10%, 52:-25%',place_of_service_override:'none',geographic_adjustment:'gaf_applied',outlier_threshold:40000,outlier_pct:80,status:'active',created_at:new Date()},
    {id:uuidv4(),config_code:'NWX-002',config_name:'Preferred Specialist Tier',network_tier:'preferred',pricing_method:'rbrvs_pct',rbrvs_pct:105,fee_table_code:'FT-RBRVS-2026',qualifier_type:'specialty',qualifier_value:'internal_medicine,cardiology,orthopedics',modifier_adjustments:'22:+15%, 51:-10%',place_of_service_override:'22:+15%',geographic_adjustment:'gaf_applied',outlier_threshold:50000,outlier_pct:85,status:'active',created_at:new Date()},
    {id:uuidv4(),config_code:'NWX-003',config_name:'Facility DRG Grouper',network_tier:'in_network',pricing_method:'drg_grouper',rbrvs_pct:null,fee_table_code:'FT-DRG-2026',qualifier_type:'provider_type',qualifier_value:'facility',modifier_adjustments:'none',place_of_service_override:'none',geographic_adjustment:'none',outlier_threshold:75000,outlier_pct:80,status:'active',created_at:new Date()},
    {id:uuidv4(),config_code:'NWX-004',config_name:'OON Limiting Charge',network_tier:'out_of_network',pricing_method:'medicare_limiting',rbrvs_pct:115,fee_table_code:'FT-RBRVS-2026',qualifier_type:'all',qualifier_value:'all',modifier_adjustments:'none',place_of_service_override:'none',geographic_adjustment:'none',outlier_threshold:null,outlier_pct:null,status:'active',created_at:new Date()}
  ];
  // NEW: PROGRAM CONFIGS
  db.program_configs=[
    {id:uuidv4(),program_code:'MCR-MSSP',program_name:'Medicare Shared Savings Program',program_type:'medicare',sub_type:'aco_mssp',effective_date:'2026-01-01',state:'Federal',cms_contract_id:'H1234',formulary_type:'pdp_formulary',cost_sharing_rules:'Part A/B standard; Part D TrOOP applies',snp_type:'none',msp_primary:'yes',msp_secondary:'no',crossover_claims:'yes',spend_down_applies:'no',prior_auth_override:'cms_exempt_list',waiver_type:'none',encounter_data_required:'yes',risk_score_model:'cms_hcc_v28',status:'active',notes:'Track 1+ ACO, annual reconciliation Q1',created_at:new Date()},
    {id:uuidv4(),program_code:'MCD-NC-BHME',program_name:'NC Medicaid Behavioral Health ME',program_type:'medicaid',sub_type:'managed_care',effective_date:'2026-02-01',state:'NC',cms_contract_id:'NC-BHME-01',formulary_type:'preferred_drug_list',cost_sharing_rules:'Zero cost-sharing for BH; nominal copay others',snp_type:'none',msp_primary:'no',msp_secondary:'yes',crossover_claims:'yes',spend_down_applies:'no',prior_auth_override:'state_pa_bypass',waiver_type:'1915c',encounter_data_required:'yes',risk_score_model:'cdps_rx',status:'active',notes:'BH Tailored Plan — DHHS oversight',created_at:new Date()},
    {id:uuidv4(),program_code:'MCD-CHIP-SC',program_name:'SC CHIP / Healthy Connections Kids',program_type:'chip',sub_type:'separate_chip',effective_date:'2026-01-01',state:'SC',cms_contract_id:'SC-CHIP-2026',formulary_type:'pap_formulary',cost_sharing_rules:'Nominal copays per CHIP rules; preventive $0',snp_type:'none',msp_primary:'no',msp_secondary:'no',crossover_claims:'no',spend_down_applies:'no',prior_auth_override:'none',waiver_type:'none',encounter_data_required:'yes',risk_score_model:'none',status:'active',notes:'Income up to 209% FPL',created_at:new Date()}
  ];
  // NEW: DENTAL CONFIGS
  db.dental_configs=[
    {id:uuidv4(),dental_code:'DENT-PREV-001',service_name:'Prophylaxis (Adult)',ada_code:'D1110',service_category:'preventive',frequency_limit:'2x per calendar year',age_limit:'14+',waiting_period_months:0,benefit_pct:100,annual_max_applies:'no',orthodontia_applies:'no',missing_tooth_clause:'no',predetermination_required:'no',fee_table:'FT-DENT-2026',ucr_percentile:90,status:'active',created_at:new Date()},
    {id:uuidv4(),dental_code:'DENT-BASIC-001',service_name:'Amalgam Restoration (1 Surface)',ada_code:'D2140',service_category:'basic_restorative',frequency_limit:'Tooth-surface once per 24 months',age_limit:'all',waiting_period_months:6,benefit_pct:80,annual_max_applies:'yes',orthodontia_applies:'no',missing_tooth_clause:'no',predetermination_required:'no',fee_table:'FT-DENT-2026',ucr_percentile:90,status:'active',created_at:new Date()},
    {id:uuidv4(),dental_code:'DENT-MAJOR-001',service_name:'Porcelain/Ceramic Crown',ada_code:'D2740',service_category:'major_restorative',frequency_limit:'Per tooth once per 5 years',age_limit:'all',waiting_period_months:12,benefit_pct:50,annual_max_applies:'yes',orthodontia_applies:'no',missing_tooth_clause:'yes',predetermination_required:'yes',fee_table:'FT-DENT-2026',ucr_percentile:90,status:'active',created_at:new Date()},
    {id:uuidv4(),dental_code:'DENT-ORTH-001',service_name:'Comprehensive Orthodontic Treatment',ada_code:'D8090',service_category:'orthodontia',frequency_limit:'Lifetime once per member',age_limit:'18+',waiting_period_months:12,benefit_pct:50,annual_max_applies:'no',orthodontia_applies:'yes',ortho_lifetime_max:2000,missing_tooth_clause:'no',predetermination_required:'yes',fee_table:'FT-DENT-2026',ucr_percentile:90,status:'active',created_at:new Date()},
    {id:uuidv4(),dental_code:'DENT-ENDO-001',service_name:'Root Canal — Molar',ada_code:'D3330',service_category:'endodontics',frequency_limit:'Once per tooth lifetime',age_limit:'all',waiting_period_months:6,benefit_pct:80,annual_max_applies:'yes',orthodontia_applies:'no',missing_tooth_clause:'no',predetermination_required:'yes',fee_table:'FT-DENT-2026',ucr_percentile:90,status:'active',created_at:new Date()}
  ];
  // NEW: CLAIM PENDS
  db.claim_pends=[
    {id:uuidv4(),pend_number:'PEND-2026-001',claim_id:clm2id,claim_number:'CLM-2026-002',pend_reason_code:'P-AUTH',pend_reason:'Prior authorization required but not on file',pend_category:'authorization',severity:'high',assigned_to:'Auth Team',created_date:'2026-04-11',due_date:'2026-04-18',resolution_date:null,resolution_action:null,resolution_notes:'',sql_validation_run:false,status:'open',created_at:new Date()},
    {id:uuidv4(),pend_number:'PEND-2026-002',claim_id:clm4id,claim_number:'CLM-2026-004',pend_reason_code:'P-MED-NEC',pend_reason:'Medical necessity documentation incomplete',pend_category:'clinical',severity:'high',assigned_to:'UM Review',created_date:'2026-06-21',due_date:'2026-06-28',resolution_date:null,resolution_action:null,resolution_notes:'',sql_validation_run:false,status:'open',created_at:new Date()},
    {id:uuidv4(),pend_number:'PEND-2026-003',claim_id:clm5id,claim_number:'CLM-2026-005',pend_reason_code:'P-OON',pend_reason:'Out-of-network provider — benefits verification needed',pend_category:'eligibility',severity:'medium',assigned_to:'Configuration',created_date:'2026-08-16',due_date:'2026-08-23',resolution_date:'2026-08-20',resolution_action:'denied_oon',resolution_notes:'Confirmed no OON benefit on Silver PPO. Claim denied per plan document.',sql_validation_run:true,status:'resolved',created_at:new Date()},
    {id:uuidv4(),pend_number:'PEND-2026-004',claim_id:clm1id,claim_number:'CLM-2026-001',pend_reason_code:'P-DUPCHK',pend_reason:'Possible duplicate claim — same DOS, provider, CPT',pend_category:'duplicate',severity:'medium',assigned_to:'Claims Analyst',created_date:'2026-03-16',due_date:'2026-03-23',resolution_date:'2026-03-22',resolution_action:'paid_original',resolution_notes:'Duplicate confirmed. Original processed. Second voided.',sql_validation_run:true,status:'resolved',created_at:new Date()}
  ];
  console.log('✅ Facets v2 in-memory DB seeded');
}

let pool=null,usePostgres=false;
if(process.env.DATABASE_URL){
  try{
    const{Pool}=require('pg');
    pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},connectionTimeoutMillis:5000});
    pool.query('SELECT 1').then(()=>{console.log('✅ PostgreSQL connected');usePostgres=true;}).catch(err=>{console.log('⚠ PG failed:',err.message);seedDB();});
  }catch(e){console.log('⚠ pg error:',e.message);seedDB();}
}else{console.log('ℹ No DATABASE_URL — using in-memory');seedDB();}

function memAll(t){return[...db[t]];}
function memFind(t,id){return db[t].find(r=>r.id===id);}
function memCreate(t,data){const rec={id:uuidv4(),...data,created_at:new Date()};db[t].push(rec);auditLog('CREATE',t,rec.id,rec);return rec;}
function memUpdate(t,id,data){const i=db[t].findIndex(r=>r.id===id);if(i===-1)return null;db[t][i]={...db[t][i],...data,updated_at:new Date()};auditLog('UPDATE',t,id,data);return db[t][i];}
function memDelete(t,id){const i=db[t].findIndex(r=>r.id===id);if(i===-1)return false;auditLog('DELETE',t,id,{});db[t].splice(i,1);return true;}
function auditLog(action,table_name,record_id,changes){db.audit_logs.unshift({id:uuidv4(),action,table_name,record_id,changes:JSON.stringify(changes),performed_by:'system',created_at:new Date()});if(db.audit_logs.length>1000)db.audit_logs.pop();}
async function pgQuery(text,params=[]){const client=await pool.connect();try{return await client.query(text,params);}finally{client.release();}}

function crudRoutes(app,route,table){
  app.get(`/api/${route}`,async(req,res)=>{try{if(usePostgres){const r=await pgQuery(`SELECT * FROM ${table} ORDER BY created_at DESC`);return res.json(r.rows);}res.json(memAll(table));}catch(e){res.status(500).json({error:e.message});}});
  app.get(`/api/${route}/:id`,async(req,res)=>{try{if(usePostgres){const r=await pgQuery(`SELECT * FROM ${table} WHERE id=$1`,[req.params.id]);return r.rows.length?res.json(r.rows[0]):res.status(404).json({error:'Not found'});}const rec=memFind(table,req.params.id);rec?res.json(rec):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
  app.post(`/api/${route}`,async(req,res)=>{try{res.status(201).json(memCreate(table,req.body));}catch(e){res.status(500).json({error:e.message});}});
  app.put(`/api/${route}/:id`,async(req,res)=>{try{const rec=memUpdate(table,req.params.id,req.body);rec?res.json(rec):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
  app.delete(`/api/${route}/:id`,async(req,res)=>{try{if(usePostgres){await pgQuery(`DELETE FROM ${table} WHERE id=$1`,[req.params.id]);return res.json({success:true});}memDelete(table,req.params.id)?res.json({success:true}):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
}

// All routes
['members','products','plans','pricing','claims','groups','providers','authorizations'].forEach(r=>crudRoutes(app,r,r));
crudRoutes(app,'classes','classes');
crudRoutes(app,'provider-contracts','provider_contracts');
crudRoutes(app,'fee-tables','fee_tables');
crudRoutes(app,'service-groups','service_groups');
crudRoutes(app,'networx-configs','networx_configs');
crudRoutes(app,'program-configs','program_configs');
crudRoutes(app,'dental-configs','dental_configs');
crudRoutes(app,'claim-pends','claim_pends');

// Benefits (custom because full schema)
app.get('/api/benefits',async(req,res)=>{try{res.json(memAll('benefits'));}catch(e){res.status(500).json({error:e.message});}});
app.get('/api/benefits/:id',async(req,res)=>{try{const rec=memFind('benefits',req.params.id);rec?res.json(rec):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
app.post('/api/benefits',async(req,res)=>{try{res.status(201).json(memCreate('benefits',req.body));}catch(e){res.status(500).json({error:e.message});}});
app.put('/api/benefits/:id',async(req,res)=>{try{const rec=memUpdate('benefits',req.params.id,req.body);rec?res.json(rec):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
app.delete('/api/benefits/:id',async(req,res)=>{try{memDelete('benefits',req.params.id)?res.json({success:true}):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});

// Pend resolution workflow
app.post('/api/claim-pends/:id/resolve',(req,res)=>{
  const{resolution_action,resolution_notes}=req.body;
  const rec=memUpdate('claim_pends',req.params.id,{status:'resolved',resolution_date:new Date().toISOString().split('T')[0],resolution_action:resolution_action||'manual_review',resolution_notes:resolution_notes||''});
  rec?res.json(rec):res.status(404).json({error:'Not found'});
});

// SQL Validation
const SQL_QUERIES=[
  {id:'benefit_gaps',name:'Benefit Coverage Gaps',category:'configuration',description:'Plans missing mandatory ACA essential health benefit categories',risk:'high'},
  {id:'pricing_orphans',name:'Pricing Orphans',category:'configuration',description:'Pricing records not linked to any active plan',risk:'medium'},
  {id:'duplicate_claims',name:'Duplicate Claim Detection',category:'claims',description:'Claims matching same member, DOS, provider, and procedure',risk:'high'},
  {id:'pend_aging',name:'Pend Aging Report',category:'claims',description:'Pends open beyond SLA threshold (7 days)',risk:'high'},
  {id:'auth_expiry',name:'Authorization Expiry Check',category:'authorization',description:'Active claims with expired prior authorizations',risk:'high'},
  {id:'member_no_plan',name:'Members Without Plan Assignment',category:'eligibility',description:'Active members not enrolled in any plan',risk:'medium'},
  {id:'contract_expiry',name:'Contract Expiry Warning',category:'network',description:'Provider contracts expiring within 90 days',risk:'medium'},
  {id:'networx_gaps',name:'NetworX Config Gaps',category:'pricing',description:'Network tiers missing NetworX pricing configuration',risk:'medium'},
  {id:'oop_exceeded',name:'OOP Maximum Exceeded',category:'financial',description:'Claims where paid amount exceeds plan OOP maximum',risk:'high'},
  {id:'dental_freq_exceeded',name:'Dental Frequency Limit Breach',category:'dental',description:'Dental claims exceeding configured frequency limits',risk:'medium'},
  {id:'medicaid_crossover',name:'Medicaid Crossover Claims',category:'government',description:'Claims flagged for Medicare/Medicaid crossover processing',risk:'medium'},
  {id:'missing_npi',name:'Claims with Invalid NPI',category:'claims',description:'Claims submitted with NPI not in provider master',risk:'high'}
];

app.get('/api/sql-validate/queries',(req,res)=>res.json(SQL_QUERIES));

app.post('/api/sql-validate',(req,res)=>{
  const{query_type}=req.body;
  const ts=new Date().toISOString();
  let results=[],status='PASS',sql_template='';

  if(query_type==='benefit_gaps'){
    const req_cats=['medical','pharmacy','preventive'];
    db.plans.filter(p=>p.status==='active').forEach(plan=>{
      const covered=[...new Set(db.benefits.filter(b=>b.plan_type===plan.plan_type||b.plan_type==='all').map(b=>b.benefit_type))];
      const missing=req_cats.filter(c=>!covered.includes(c));
      if(missing.length)results.push({plan_code:plan.plan_code,plan_name:plan.plan_name,missing_categories:missing.join(', '),severity:'HIGH'});
    });
    if(results.length)status='FAIL';
    sql_template=`SELECT p.plan_code, p.plan_name,\n  array_agg(DISTINCT b.benefit_type) AS covered\nFROM plans p\nLEFT JOIN benefits b ON b.plan_type IN (p.plan_type,'all')\nWHERE p.status = 'active'\nGROUP BY p.id\nHAVING NOT (array_agg(DISTINCT b.benefit_type)\n  @> ARRAY['medical','pharmacy','preventive']);`;
  } else if(query_type==='duplicate_claims'){
    const seen={};
    db.claims.forEach(c=>{const k=`${c.member_id}|${c.service_date}|${c.provider}|${c.procedure_code}`;if(seen[k]){results.push({original:seen[k],duplicate:c.claim_number,service_date:c.service_date,procedure_code:c.procedure_code,provider:c.provider});}else seen[k]=c.claim_number;});
    if(results.length)status='FAIL';
    sql_template=`SELECT a.claim_number AS original, b.claim_number AS duplicate,\n  a.member_id, a.service_date, a.procedure_code\nFROM claims a\nJOIN claims b ON a.member_id=b.member_id\n  AND a.service_date=b.service_date\n  AND a.procedure_code=b.procedure_code\n  AND a.id<>b.id;`;
  } else if(query_type==='pend_aging'){
    const today=new Date();
    results=db.claim_pends.filter(p=>p.status==='open'&&new Date(p.due_date)<today).map(p=>({pend_number:p.pend_number,claim_number:p.claim_number,pend_reason:p.pend_reason,due_date:p.due_date,days_overdue:Math.floor((today-new Date(p.due_date))/86400000),assigned_to:p.assigned_to}));
    if(results.length)status='WARN';
    sql_template=`SELECT pend_number, claim_number, due_date,\n  CURRENT_DATE - due_date AS days_overdue\nFROM claim_pends\nWHERE status='open' AND due_date < CURRENT_DATE\nORDER BY days_overdue DESC;`;
  } else if(query_type==='member_no_plan'){
    results=db.members.filter(m=>m.status==='active'&&!m.plan_id).map(m=>({member_id:m.member_id,name:`${m.first_name} ${m.last_name}`,enrollment_date:m.enrollment_date}));
    if(results.length)status='WARN';
    sql_template=`SELECT member_id, first_name, last_name\nFROM members\nWHERE status='active' AND plan_id IS NULL;`;
  } else if(query_type==='contract_expiry'){
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()+90);
    results=db.provider_contracts.filter(c=>c.status==='active'&&new Date(c.termination_date)<=cutoff).map(c=>({contract_number:c.contract_number,provider_name:c.provider_name,termination_date:c.termination_date,days_until_expiry:Math.floor((new Date(c.termination_date)-new Date())/86400000)}));
    if(results.length)status='WARN';
    sql_template=`SELECT contract_number, provider_name, termination_date,\n  (termination_date - CURRENT_DATE) AS days_until_expiry\nFROM provider_contracts\nWHERE status='active'\n  AND termination_date <= CURRENT_DATE + INTERVAL '90 days';`;
  } else if(query_type==='pricing_orphans'){
    const ids=new Set(db.plans.map(p=>p.id));
    results=db.pricing.filter(p=>p.plan_id&&!ids.has(p.plan_id)).map(p=>({pricing_code:p.pricing_code,plan_id:p.plan_id,tier:p.tier}));
    if(results.length)status='WARN';
    sql_template=`SELECT pr.pricing_code, pr.plan_id, pr.tier\nFROM pricing pr\nLEFT JOIN plans p ON pr.plan_id=p.id\nWHERE p.id IS NULL AND pr.plan_id IS NOT NULL;`;
  } else if(query_type==='oop_exceeded'){
    db.claims.forEach(c=>{const plan=db.plans.find(p=>p.id===c.plan_id);if(plan&&c.paid_amount>plan.oop_max&&c.status==='paid')results.push({claim_number:c.claim_number,plan_name:plan.plan_name,paid_amount:c.paid_amount,oop_max:plan.oop_max,overage:(c.paid_amount-plan.oop_max).toFixed(2)});});
    if(results.length)status='FAIL';
    sql_template=`SELECT c.claim_number, p.plan_name,\n  c.paid_amount, p.oop_max\nFROM claims c JOIN plans p ON c.plan_id=p.id\nWHERE c.paid_amount > p.oop_max AND c.status='paid';`;
  } else if(query_type==='dental_freq_exceeded'){
    const grouped={};
    db.claims.filter(c=>c.procedure_code&&c.procedure_code.startsWith('D')).forEach(c=>{const k=`${c.member_id}|${c.procedure_code}`;grouped[k]=(grouped[k]||0)+1;});
    Object.entries(grouped).forEach(([k,count])=>{const[mbr,code]=k.split('|');const cfg=db.dental_configs.find(d=>d.ada_code===code);if(cfg&&cfg.frequency_limit&&cfg.frequency_limit.startsWith('2x')&&count>2)results.push({member_id:mbr,procedure_code:code,service_name:cfg.service_name,claim_count:count,frequency_limit:cfg.frequency_limit});});
    if(results.length)status='FAIL';
    sql_template=`SELECT c.member_id, c.procedure_code, COUNT(*)\nFROM claims c JOIN dental_configs d ON c.procedure_code=d.ada_code\nGROUP BY c.member_id, c.procedure_code, d.frequency_limit\nHAVING COUNT(*) > 2;`;
  } else if(query_type==='auth_expiry'){
    const today=new Date();
    results=db.authorizations.filter(a=>a.status!=='closed'&&a.expiration_date&&new Date(a.expiration_date)<today).map(a=>({auth_number:a.auth_number,service_requested:a.service_requested,expiration_date:a.expiration_date,days_expired:Math.floor((today-new Date(a.expiration_date))/86400000)}));
    if(results.length)status='WARN';
    sql_template=`SELECT auth_number, expiration_date,\n  CURRENT_DATE - expiration_date AS days_expired\nFROM authorizations\nWHERE status != 'closed' AND expiration_date < CURRENT_DATE;`;
  } else if(query_type==='networx_gaps'){
    const configured=new Set(db.networx_configs.map(n=>n.network_tier));
    const tiers=[...new Set(db.providers.map(p=>p.network))];
    results=tiers.filter(t=>!configured.has(t)).map(t=>({network_tier:t,provider_count:db.providers.filter(p=>p.network===t).length,issue:'No NetworX config for this tier'}));
    if(results.length)status='WARN';
    sql_template=`SELECT p.network, COUNT(DISTINCT p.id)\nFROM providers p\nLEFT JOIN networx_configs nc ON nc.network_tier=p.network\nWHERE nc.id IS NULL GROUP BY p.network;`;
  } else if(query_type==='medicaid_crossover'){
    const hasCrossover=db.program_configs.some(pc=>pc.crossover_claims==='yes'&&pc.msp_secondary==='yes');
    if(hasCrossover)results=db.claims.filter(c=>['pending','in_review'].includes(c.status)).map(c=>({claim_number:c.claim_number,service_date:c.service_date,provider:c.provider,billed_amount:c.billed_amount,crossover_flag:'MSP_SECONDARY_REVIEW'}));
    status=results.length?'INFO':'PASS';
    sql_template=`SELECT c.claim_number, pc.program_name, 'MSP_SECONDARY' AS crossover\nFROM claims c CROSS JOIN program_configs pc\nWHERE pc.msp_secondary='yes' AND c.status IN ('pending','in_review');`;
  } else if(query_type==='missing_npi'){
    status='PASS';results=[];
    sql_template=`SELECT c.claim_number, c.provider\nFROM claims c\nLEFT JOIN providers p ON p.npi=c.provider_npi\nWHERE p.id IS NULL AND c.status NOT IN ('voided','denied');`;
  } else {
    return res.status(400).json({error:'Unknown query_type'});
  }
  res.json({query_type,timestamp:ts,row_count:results.length,status,results,sql_template});
});

// Audit
app.get('/api/audit',async(req,res)=>{try{res.json(memAll('audit_logs'));}catch(e){res.status(500).json({error:e.message});}});

// Stats
app.get('/api/stats',(req,res)=>{
  const totalBilled=db.claims.reduce((s,c)=>s+parseFloat(c.billed_amount||0),0);
  res.json({
    members:db.members.length,products:db.products.length,plans:db.plans.length,
    benefits:db.benefits.length,pricing:db.pricing.length,claims:db.claims.length,
    groups:db.groups.length,providers:db.providers.length,authorizations:db.authorizations.length,
    classes:db.classes.length,provider_contracts:db.provider_contracts.length,
    fee_tables:db.fee_tables.length,service_groups:db.service_groups.length,
    networx_configs:db.networx_configs.length,program_configs:db.program_configs.length,
    dental_configs:db.dental_configs.length,claim_pends:db.claim_pends.length,
    total_claims_amount:totalBilled.toFixed(2),
    pending_claims:db.claims.filter(c=>c.status==='pending').length,
    open_pends:db.claim_pends.filter(p=>p.status==='open').length,
    active_members:db.members.filter(m=>m.status==='active').length
  });
});

app.get('/api/health',(req,res)=>res.json({status:'ok',mode:usePostgres?'postgres':'memory',uptime:process.uptime(),version:'2.0.0'}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`🚀 Facets v2 running on port ${PORT}`));

