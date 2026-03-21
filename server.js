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
    {id:pid1,product_code:'ECL-HMO',product_name:'EchoLink HMO Clinic Select',product_type:'medical',description:'Health Maintenance Organization',status:'active',created_at:new Date()},
    {id:pid2,product_code:'ECL-PPO',product_name:'EchoLink PPO Open Access',product_type:'medical',description:'Preferred Provider Organization',status:'active',created_at:new Date()},
    {id:pid3,product_code:'ECL-CDH',product_name:'EchoLink CDH / HDHP + HSA',product_type:'medical',description:'Consumer-Directed Health Plan',status:'active',created_at:new Date()},
    {id:pid4,product_code:'ECL-DEN',product_name:'EchoLink Dental Essentials',product_type:'dental',description:'Dental PPO',status:'active',created_at:new Date()}
  ];
  db.plans=[
    {id:pln1id,plan_code:'ECL-HMO-BRZ',plan_name:'EchoLink HMO Bronze',product_code:'ECL-HMO',plan_type:'hmo',network:'inn_only',referral_required:'yes',deductible:3000,family_deductible:6000,oop_max:7350,family_oop_max:14700,premium:289,effective_date:'2026-01-01',termination_date:'2026-12-31',embedded_deductible:true,cdh_eligible:false,cob_enabled:true,aca_compliant:true,status:'active',created_at:new Date()},
    {id:pln2id,plan_code:'ECL-PPO-SLV',plan_name:'EchoLink PPO Silver',product_code:'ECL-PPO',plan_type:'ppo',network:'inn_oon',referral_required:'no',deductible:1200,family_deductible:2400,oop_max:5500,family_oop_max:11000,premium:495,effective_date:'2026-01-01',termination_date:'2026-12-31',embedded_deductible:true,cdh_eligible:false,cob_enabled:true,aca_compliant:true,status:'active',created_at:new Date()},
    {id:pln3id,plan_code:'ECL-CDH-1500',plan_name:'EchoLink HDHP + HSA',product_code:'ECL-CDH',plan_type:'cdh',network:'inn_oon',referral_required:'no',deductible:1600,family_deductible:3200,oop_max:8050,family_oop_max:16100,premium:389,effective_date:'2026-01-01',termination_date:'2026-12-31',embedded_deductible:true,cdh_eligible:true,cob_enabled:true,aca_compliant:true,status:'active',created_at:new Date()},
    {id:pln4id,plan_code:'ECL-DEN-01',plan_name:'EchoLink Dental Essentials',product_code:'ECL-DEN',plan_type:'dental',network:'dental_ppo',referral_required:'no',deductible:75,family_deductible:150,oop_max:1500,family_oop_max:3000,premium:39,effective_date:'2026-01-01',termination_date:'2026-12-31',embedded_deductible:false,cdh_eligible:false,cob_enabled:true,aca_compliant:true,status:'active',created_at:new Date()}
  ];
  db.groups=[
    {id:grp1id,group_id:'GRP-ECL-2026-001',employer_name:'EchoLink Clinics & Urgent Care Network',short_name:'EchoLink Solutions',tax_id:'56-7890123',sic_code:'8011',industry:'healthcare',group_size:275,effective_date:'2026-01-01',termination_date:'2026-12-31',plan_year_start:'January',plan_year_end:'December',contract_start:'2026-01-01',renewal_date:'2026-12-31',group_type:'fully_insured',state_of_issue:'NC',contribution_model:'defined_contribution',employer_contribution_pct:75,waiting_period_days:30,oe_month:11,contact_name:'Sandra Mitchell',contact_title:'HR Benefits Manager',contact_email:'s.mitchell@echolinkclinics.com',contact_phone:'(704) 555-0192',contact2_name:'James Okafor',contact2_email:'j.okafor@echolinkclinics.com',street_address:'4200 EchoLink Medical Parkway',suite:'Suite 100',city:'Charlotte',state:'NC',zip:'28202',phone:'(704) 555-0190',fax:'(704) 555-0191',billing_frequency:'monthly',billing_method:'list_bill',billing_contact:'Sandra Mitchell',grace_period:30,billing_address:'4200 EchoLink Medical Parkway Suite 100 Charlotte NC 28202',plan_offerings:'EchoLink HMO Bronze, EchoLink PPO Silver, EchoLink CDH HDHP + HSA, EchoLink Dental Essentials',cobra_eligible:'yes',erisa_plan:'yes',aca_applicable:'yes',erisa_year:'2026',status:'active',notes:'Primary training group 2026 cohort sandbox',created_at:new Date()},
    {id:grp2id,group_id:'GRP-002',employer_name:'Blue Ridge Community Hospital',short_name:'BRCH',tax_id:'98-7654321',sic_code:'8062',industry:'healthcare',group_size:450,effective_date:'2026-01-01',termination_date:'2026-12-31',plan_year_start:'January',plan_year_end:'December',contract_start:'2026-01-01',renewal_date:'2026-12-31',group_type:'fully_insured',state_of_issue:'NC',contribution_model:'defined_benefit',employer_contribution_pct:90,waiting_period_days:0,oe_month:11,contact_name:'Marcus Webb',contact_title:'Benefits Director',contact_email:'benefits@brchosp.org',contact_phone:'555-2000',street_address:'500 Hospital Way',city:'Asheville',state:'NC',zip:'28801',phone:'555-2000',billing_frequency:'monthly',billing_method:'list_bill',billing_contact:'Marcus Webb',grace_period:30,billing_address:'500 Hospital Way Asheville NC 28801',plan_offerings:'HMO Basic, PPO Plus, Platinum HDHP, Dental Select',cobra_eligible:'yes',erisa_plan:'yes',aca_applicable:'yes',status:'active',notes:'Key account',created_at:new Date()},
    {id:grp3id,group_id:'GRP-003',employer_name:'Main Street Diner Group',short_name:'Main Street Diner',tax_id:'55-1122334',sic_code:'5812',industry:'hospitality',group_size:18,effective_date:'2026-04-01',termination_date:'2026-03-31',plan_year_start:'April',plan_year_end:'March',contract_start:'2026-04-01',renewal_date:'2026-03-31',group_type:'fully_insured',state_of_issue:'SC',contribution_model:'split',employer_contribution_pct:50,waiting_period_days:60,oe_month:3,contact_name:'Tony Rizzo',contact_title:'Owner',contact_email:'tony@mainstreetdiner.com',contact_phone:'555-3000',street_address:'22 Main St',city:'Greenville',state:'SC',zip:'29601',phone:'555-3000',billing_frequency:'monthly',billing_method:'summary_bill',billing_contact:'Tony Rizzo',grace_period:30,billing_address:'22 Main St Greenville SC 29601',plan_offerings:'Bronze HMO',cobra_eligible:'no',erisa_plan:'yes',aca_applicable:'no',status:'pending',notes:'Awaiting final contract signatures',created_at:new Date()}
  ];
  const mbr1id=uuidv4(),mbr2id=uuidv4();
  db.members=[
    {id:mbr1id,member_id:'ECL-MBR-001',first_name:'John',last_name:'HMO',dob:'1985-03-15',email:'john.hmo@echolink.com',phone:'555-0101',plan_id:pln1id,enrollment_tier:'employee_only',enrollment_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:mbr2id,member_id:'ECL-MBR-002',first_name:'Sara',last_name:'HMO Family',dob:'1990-07-22',email:'sara.hmofamily@echolink.com',phone:'555-0102',plan_id:pln1id,enrollment_tier:'family',enrollment_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),member_id:'ECL-MBR-003',first_name:'Mike',last_name:'PPO',dob:'1978-11-04',email:'mike.ppo@echolink.com',phone:'555-0103',plan_id:pln2id,enrollment_tier:'employee_only',enrollment_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),member_id:'ECL-MBR-004',first_name:'Ana',last_name:'PPO COB',dob:'1995-05-30',email:'ana.ppocob@echolink.com',phone:'555-0104',plan_id:pln2id,enrollment_tier:'employee_spouse',enrollment_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),member_id:'ECL-MBR-005',first_name:'David',last_name:'CDH',dob:'1982-08-20',email:'david.cdh@echolink.com',phone:'555-0105',plan_id:pln3id,enrollment_tier:'employee_only',enrollment_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),member_id:'ECL-MBR-006',first_name:'Lisa',last_name:'CDH Family',dob:'1988-12-11',email:'lisa.cdhfamily@echolink.com',phone:'555-0106',plan_id:pln3id,enrollment_tier:'family',enrollment_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),member_id:'ECL-MBR-007',first_name:'Tom',last_name:'Dental',dob:'1975-04-03',email:'tom.dental@echolink.com',phone:'555-0107',plan_id:pln4id,enrollment_tier:'employee_only',enrollment_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),member_id:'ECL-MBR-008',first_name:'Emma',last_name:'Dental Ortho',dob:'1998-09-17',email:'emma.ortho@echolink.com',phone:'555-0108',plan_id:pln4id,enrollment_tier:'employee_child',enrollment_date:'2026-01-01',status:'active',created_at:new Date()}
  ];
  db.benefits=[
    {id:uuidv4(),benefit_code:'BEN-PCP',benefit_name:'Primary Care Visit',plan_type:'hmo',benefit_type:'medical',copay:25,coinsurance:0,deductible_individual:3000,oop_max_individual:7350,covered:'yes',prior_auth_required:'no',deductible_applies:'no',aca_preventive:'no',cob_applies:'yes',cob_method:'non_duplication',accumulator_group:'medical',counts_toward_deductible:'no',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'yes',medical_necessity:'no',status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-SPC',benefit_name:'Specialist Visit',plan_type:'all',benefit_type:'medical',copay:60,coinsurance:0,deductible_individual:0,oop_max_individual:0,covered:'yes',prior_auth_required:'no',deductible_applies:'no',aca_preventive:'no',cob_applies:'yes',cob_method:'non_duplication',accumulator_group:'medical',counts_toward_deductible:'no',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-ER',benefit_name:'Emergency Room',plan_type:'all',benefit_type:'medical',copay:300,coinsurance:0,deductible_individual:0,oop_max_individual:0,covered:'yes',prior_auth_required:'no',deductible_applies:'no',aca_preventive:'no',cob_applies:'yes',cob_method:'non_duplication',accumulator_group:'medical',counts_toward_deductible:'no',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-MRI',benefit_name:'MRI / CT Scan',plan_type:'all',benefit_type:'imaging',copay:0,coinsurance:20,deductible_individual:1500,oop_max_individual:5000,covered:'yes',prior_auth_required:'yes',deductible_applies:'yes',aca_preventive:'no',cob_applies:'yes',cob_method:'non_duplication',accumulator_group:'medical',counts_toward_deductible:'yes',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'no',medical_necessity:'yes',status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-PREV',benefit_name:'Preventive Care (ACA)',plan_type:'all',benefit_type:'preventive',copay:0,coinsurance:0,deductible_individual:0,oop_max_individual:0,covered:'yes',prior_auth_required:'no',deductible_applies:'no',aca_preventive:'yes',cob_applies:'no',cob_method:'coordination',accumulator_group:'preventive',counts_toward_deductible:'no',counts_toward_oop:'no',embedded_deductible:'no',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-RX-GEN',benefit_name:'Generic Rx',plan_type:'all',benefit_type:'pharmacy',copay:10,coinsurance:0,deductible_individual:0,oop_max_individual:0,covered:'yes',prior_auth_required:'no',deductible_applies:'no',aca_preventive:'no',cob_applies:'no',cob_method:'coordination',accumulator_group:'pharmacy',counts_toward_deductible:'no',counts_toward_oop:'yes',embedded_deductible:'no',hsa_eligible:'na',referral_required:'no',medical_necessity:'no',status:'active',created_at:new Date()},
    {id:uuidv4(),benefit_code:'BEN-SURG',benefit_name:'Outpatient Surgery',plan_type:'all',benefit_type:'surgical',copay:0,coinsurance:20,deductible_individual:1500,oop_max_individual:5000,covered:'yes',prior_auth_required:'yes',deductible_applies:'yes',aca_preventive:'no',cob_applies:'yes',cob_method:'non_duplication',accumulator_group:'medical',counts_toward_deductible:'yes',counts_toward_oop:'yes',embedded_deductible:'yes',hsa_eligible:'na',referral_required:'no',medical_necessity:'yes',status:'active',created_at:new Date()}
  ];
  db.pricing=[
    {id:uuidv4(),pricing_code:'PRC-ECL-HMO-EE',plan_id:pln1id,tier:'employee_only',base_premium:289,employer_contribution:200,employee_contribution:89,effective_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),pricing_code:'PRC-ECL-HMO-ES',plan_id:pln1id,tier:'employee_spouse',base_premium:578,employer_contribution:350,employee_contribution:228,effective_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),pricing_code:'PRC-ECL-HMO-EC',plan_id:pln1id,tier:'employee_child',base_premium:520,employer_contribution:320,employee_contribution:200,effective_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),pricing_code:'PRC-ECL-HMO-FAM',plan_id:pln1id,tier:'family',base_premium:780,employer_contribution:450,employee_contribution:330,effective_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),pricing_code:'PRC-ECL-PPO-EE',plan_id:pln2id,tier:'employee_only',base_premium:495,employer_contribution:350,employee_contribution:145,effective_date:'2026-01-01',status:'active',created_at:new Date()},
    {id:uuidv4(),pricing_code:'PRC-ECL-DEN-EE',plan_id:pln4id,tier:'employee_only',base_premium:39,employer_contribution:25,employee_contribution:14,effective_date:'2026-01-01',status:'active',created_at:new Date()}
  ];
  const clm1id=uuidv4(),clm2id=uuidv4(),clm3id=uuidv4();
  db.claims=[
    {id:clm1id,claim_number:'CLM-2026-001',member_id:mbr1id,plan_id:pln1id,claim_type:'professional_837p',service_date:'2026-01-15',claim_date:'2026-01-20',provider:'EchoLink Medical Group',diagnosis_code:'Z00.00',procedure_code:'99395',billed_amount:180,allowed_amount:180,paid_amount:180,status:'paid',notes:'Preventive - $0 member',created_at:new Date()},
    {id:clm2id,claim_number:'CLM-2026-002',member_id:mbr2id,plan_id:pln1id,claim_type:'professional_837p',service_date:'2026-01-20',claim_date:'2026-01-25',provider:'Summit Imaging Center',diagnosis_code:'G43.909',procedure_code:'70553',billed_amount:1800,allowed_amount:1200,paid_amount:0,status:'pending',notes:'PA required - awaiting auth',created_at:new Date()},
    {id:clm3id,claim_number:'CLM-2026-003',member_id:null,plan_id:pln2id,claim_type:'professional_837p',service_date:'2026-02-01',claim_date:'2026-02-05',provider:'Metro Regional Hospital',diagnosis_code:'K40.90',procedure_code:'27447',billed_amount:15000,allowed_amount:10000,paid_amount:0,status:'pending',notes:'Surgery without PA - pended',created_at:new Date()}
  ];
  db.providers=[
    {id:prov1id,npi:'1234567890',provider_name:'EchoLink Medical Group',provider_type:'group',specialty:'primary_care',network:'in_network',fee_schedule:'rbrvs',credentialing_status:'credentialed',status:'active',created_at:new Date()},
    {id:prov2id,npi:'0987654321',provider_name:'Metro Regional Hospital',provider_type:'facility',specialty:'hospital',network:'in_network',fee_schedule:'drg',credentialing_status:'credentialed',status:'active',created_at:new Date()},
    {id:prov3id,npi:'1122334455',provider_name:'Summit Imaging Center',provider_type:'facility',specialty:'radiology',network:'in_network',fee_schedule:'rbrvs',credentialing_status:'credentialed',status:'active',created_at:new Date()}
  ];
  db.authorizations=[
    {id:uuidv4(),auth_number:'AUTH-2026-001',member_id:mbr1id,provider_id:prov3id,auth_type:'outpatient_imaging',service_requested:'MRI Brain with contrast',diagnosis_code:'G43.909',procedure_code:'70553',units_requested:1,units_approved:1,effective_date:'2026-01-15',expiration_date:'2026-04-15',um_decision:'approved',status:'active',notes:'Approved - valid 90 days',created_at:new Date()}
  ];
  db.classes=[
    {id:uuidv4(),class_code:'CLS-FULL',class_name:'Full-Time Employee',group_id:grp1id,description:'Regular full-time employees 30+ hrs/wk',eligible_plans:'EchoLink HMO Bronze, EchoLink PPO Silver, EchoLink CDH HDHP + HSA, EchoLink Dental Essentials',waiting_period_days:30,cobra_eligible:'yes',contribution_override_pct:75,status:'active',created_at:new Date()},
    {id:uuidv4(),class_code:'CLS-PART',class_name:'Part-Time Employee',group_id:grp1id,description:'Part-time employees 20-29 hrs/wk',eligible_plans:'EchoLink Dental Essentials',waiting_period_days:30,cobra_eligible:'no',contribution_override_pct:50,status:'active',created_at:new Date()},
    {id:uuidv4(),class_code:'CLS-EXEC',class_name:'Executive / Leadership',group_id:grp1id,description:'Director level and above',eligible_plans:'EchoLink PPO Silver, EchoLink CDH HDHP + HSA, EchoLink Dental Essentials',waiting_period_days:0,cobra_eligible:'yes',contribution_override_pct:95,status:'active',created_at:new Date()},
    {id:uuidv4(),class_code:'CLS-UNION',class_name:'Union Employee',group_id:grp1id,description:'Collective bargaining unit members',eligible_plans:'EchoLink HMO Bronze, EchoLink Dental Essentials',waiting_period_days:30,cobra_eligible:'yes',contribution_override_pct:85,status:'active',created_at:new Date()}
  ];
  db.provider_contracts=[
    {id:uuidv4(),contract_number:'CNTR-2026-001',provider_id:prov2id,provider_name:'Metro Regional Hospital',contract_type:'facility',network_tier:'in_network',effective_date:'2026-01-01',termination_date:'2026-12-31',reimbursement_method:'drg',reimbursement_rate:92.5,status:'active',created_at:new Date()},
    {id:uuidv4(),contract_number:'CNTR-2026-002',provider_id:prov1id,provider_name:'EchoLink Medical Group',contract_type:'group_practice',network_tier:'in_network',effective_date:'2026-01-01',termination_date:'2026-12-31',reimbursement_method:'rbrvs',reimbursement_rate:110,status:'active',created_at:new Date()},
    {id:uuidv4(),contract_number:'CNTR-2026-003',provider_id:prov3id,provider_name:'Summit Imaging Center',contract_type:'facility',network_tier:'in_network',effective_date:'2026-01-01',termination_date:'2026-12-31',reimbursement_method:'rbrvs',reimbursement_rate:105,status:'active',created_at:new Date()}
  ];
  db.fee_tables=[
    {id:uuidv4(),fee_table_code:'FT-RBRVS-2026',fee_table_name:'RBRVS Medicare Fee Schedule 2026',fee_table_type:'rbrvs',effective_date:'2026-01-01',termination_date:'2026-12-31',conversion_factor:33.8906,status:'active',created_at:new Date()},
    {id:uuidv4(),fee_table_code:'FT-DRG-2026',fee_table_name:'MS-DRG Facility Fee Schedule 2026',fee_table_type:'drg',effective_date:'2026-01-01',termination_date:'2026-12-31',conversion_factor:null,status:'active',created_at:new Date()},
    {id:uuidv4(),fee_table_code:'FT-DENT-2026',fee_table_name:'Dental UCR Fee Schedule 2026',fee_table_type:'ucr_dental',effective_date:'2026-01-01',termination_date:'2026-12-31',conversion_factor:null,status:'active',created_at:new Date()}
  ];
  db.service_groups=[
    {id:uuidv4(),service_group_code:'SG-MED',service_group_name:'Medical/Surgical',category:'medical',procedure_ranges:'99201-99499, 10000-69999',accumulator_bucket:'medical',applies_to_deductible:'yes',applies_to_oop:'yes',status:'active',created_at:new Date()},
    {id:uuidv4(),service_group_code:'SG-PREV',service_group_name:'Preventive / Wellness',category:'preventive',procedure_ranges:'99381-99397',accumulator_bucket:'preventive',applies_to_deductible:'no',applies_to_oop:'no',status:'active',created_at:new Date()},
    {id:uuidv4(),service_group_code:'SG-RX',service_group_name:'Pharmacy',category:'pharmacy',procedure_ranges:'NDC-all',accumulator_bucket:'pharmacy',applies_to_deductible:'no',applies_to_oop:'yes',status:'active',created_at:new Date()}
  ];
  db.networx_configs=[
    {id:uuidv4(),config_code:'NWX-001',config_name:'PPO In-Network Standard',network_tier:'in_network',pricing_method:'rbrvs_pct',rbrvs_pct:110,fee_table_code:'FT-RBRVS-2026',status:'active',created_at:new Date()},
    {id:uuidv4(),config_code:'NWX-002',config_name:'Facility DRG Grouper',network_tier:'in_network',pricing_method:'drg_grouper',fee_table_code:'FT-DRG-2026',status:'active',created_at:new Date()}
  ];
  db.program_configs=[
    {id:uuidv4(),program_code:'MCR-MSSP',program_name:'Medicare Shared Savings Program',program_type:'medicare',effective_date:'2026-01-01',state:'Federal',crossover_claims:'yes',msp_secondary:'no',status:'active',created_at:new Date()}
  ];
  db.dental_configs=[
    {id:uuidv4(),dental_code:'DENT-PREV-001',service_name:'Prophylaxis (Adult)',ada_code:'D1110',service_category:'preventive',frequency_limit:'2x per calendar year',benefit_pct:100,annual_max_applies:'no',status:'active',created_at:new Date()},
    {id:uuidv4(),dental_code:'DENT-BASIC-001',service_name:'Amalgam Restoration',ada_code:'D2140',service_category:'basic_restorative',frequency_limit:'Once per 24 months per surface',benefit_pct:80,annual_max_applies:'yes',status:'active',created_at:new Date()},
    {id:uuidv4(),dental_code:'DENT-MAJOR-001',service_name:'Porcelain Crown',ada_code:'D2740',service_category:'major_restorative',frequency_limit:'Once per 5 years per tooth',benefit_pct:50,annual_max_applies:'yes',status:'active',created_at:new Date()},
    {id:uuidv4(),dental_code:'DENT-ORTH-001',service_name:'Comprehensive Orthodontic Treatment',ada_code:'D8090',service_category:'orthodontia',frequency_limit:'Lifetime once per member',benefit_pct:50,annual_max_applies:'no',orthodontia_applies:'yes',status:'active',created_at:new Date()}
  ];
  db.claim_pends=[
    {id:uuidv4(),pend_number:'PEND-2026-001',claim_id:clm2id,claim_number:'CLM-2026-002',pend_reason_code:'P-AUTH',pend_reason:'Prior authorization required but not on file',pend_category:'authorization',severity:'high',assigned_to:'Auth Team',created_date:'2026-01-21',due_date:'2026-01-28',status:'open',created_at:new Date()},
    {id:uuidv4(),pend_number:'PEND-2026-002',claim_id:clm3id,claim_number:'CLM-2026-003',pend_reason_code:'P-AUTH',pend_reason:'Surgery submitted without prior authorization',pend_category:'authorization',severity:'high',assigned_to:'UM Review',created_date:'2026-02-06',due_date:'2026-02-13',status:'open',created_at:new Date()}
  ];
  console.log('✅ Facets v2 in-memory DB seeded');
}

// ALWAYS use in-memory — ignore Postgres even if connected
seedDB();
console.log('ℹ Running in in-memory mode');

function memAll(t){return[...db[t]];}
function memFind(t,id){return db[t].find(r=>r.id===id);}
function memCreate(t,data){const rec={id:uuidv4(),...data,created_at:new Date()};db[t].push(rec);auditLog('CREATE',t,rec.id,rec);return rec;}
function memUpdate(t,id,data){const i=db[t].findIndex(r=>r.id===id);if(i===-1)return null;db[t][i]={...db[t][i],...data,updated_at:new Date()};auditLog('UPDATE',t,id,data);return db[t][i];}
function memDelete(t,id){const i=db[t].findIndex(r=>r.id===id);if(i===-1)return false;auditLog('DELETE',t,id,{});db[t].splice(i,1);return true;}
function auditLog(action,table_name,record_id,changes){db.audit_logs.unshift({id:uuidv4(),action,table_name,record_id,changes:JSON.stringify(changes),performed_by:'system',created_at:new Date()});if(db.audit_logs.length>1000)db.audit_logs.pop();}

function crudRoutes(app,route,table){
  app.get(`/api/${route}`,async(req,res)=>{try{res.json(memAll(table));}catch(e){res.status(500).json({error:e.message});}});
  app.get(`/api/${route}/:id`,async(req,res)=>{try{const rec=memFind(table,req.params.id);rec?res.json(rec):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
  app.post(`/api/${route}`,async(req,res)=>{try{res.status(201).json(memCreate(table,req.body));}catch(e){res.status(500).json({error:e.message});}});
  app.put(`/api/${route}/:id`,async(req,res)=>{try{const rec=memUpdate(table,req.params.id,req.body);rec?res.json(rec):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
  app.delete(`/api/${route}/:id`,async(req,res)=>{try{memDelete(table,req.params.id)?res.json({success:true}):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
}

['members','products','plans','pricing','claims','groups','providers','authorizations'].forEach(r=>crudRoutes(app,r,r));
crudRoutes(app,'classes','classes');
crudRoutes(app,'provider-contracts','provider_contracts');
crudRoutes(app,'fee-tables','fee_tables');
crudRoutes(app,'service-groups','service_groups');
crudRoutes(app,'networx-configs','networx_configs');
crudRoutes(app,'program-configs','program_configs');
crudRoutes(app,'dental-configs','dental_configs');
crudRoutes(app,'claim-pends','claim_pends');

app.get('/api/benefits',async(req,res)=>{try{res.json(memAll('benefits'));}catch(e){res.status(500).json({error:e.message});}});
app.get('/api/benefits/:id',async(req,res)=>{try{const rec=memFind('benefits',req.params.id);rec?res.json(rec):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
app.post('/api/benefits',async(req,res)=>{try{res.status(201).json(memCreate('benefits',req.body));}catch(e){res.status(500).json({error:e.message});}});
app.put('/api/benefits/:id',async(req,res)=>{try{const rec=memUpdate('benefits',req.params.id,req.body);rec?res.json(rec):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});
app.delete('/api/benefits/:id',async(req,res)=>{try{memDelete('benefits',req.params.id)?res.json({success:true}):res.status(404).json({error:'Not found'});}catch(e){res.status(500).json({error:e.message});}});

app.post('/api/claim-pends/:id/resolve',(req,res)=>{
  const{resolution_action,resolution_notes,resolved_by}=req.body;
  const rec=memUpdate('claim_pends',req.params.id,{status:'resolved',resolution_date:new Date().toISOString().split('T')[0],resolution_action:resolution_action||'manual_review',resolution_notes:resolution_notes||'',resolved_by:resolved_by||''});
  rec?res.json(rec):res.status(404).json({error:'Not found'});
});

const SQL_QUERIES=[
  {query_type:'benefit_gaps',name:'Benefit Coverage Gaps',category:'Configuration',description:'Plans missing mandatory ACA essential health benefit categories',risk_level:'HIGH',sql_template:'SELECT p.plan_code FROM plans p LEFT JOIN benefits b ON b.plan_type=p.plan_type WHERE p.status=\'active\' GROUP BY p.id HAVING NOT array_agg(b.benefit_type) @> ARRAY[\'medical\',\'pharmacy\',\'preventive\'];'},
  {query_type:'pricing_orphans',name:'Pricing Orphans',category:'Configuration',description:'Pricing records not linked to any active plan',risk_level:'MEDIUM',sql_template:'SELECT pr.pricing_code FROM pricing pr LEFT JOIN plans p ON pr.plan_id=p.id WHERE p.id IS NULL;'},
  {query_type:'duplicate_claims',name:'Duplicate Claim Detection',category:'Claims',description:'Claims matching same member, DOS, provider, and procedure',risk_level:'HIGH',sql_template:'SELECT a.claim_number, b.claim_number AS duplicate FROM claims a JOIN claims b ON a.member_id=b.member_id AND a.service_date=b.service_date AND a.procedure_code=b.procedure_code AND a.id<>b.id;'},
  {query_type:'pend_aging',name:'Pend Aging Report',category:'Claims',description:'Pends open beyond SLA threshold of 7 days',risk_level:'HIGH',sql_template:'SELECT pend_number, due_date, CURRENT_DATE - due_date AS days_overdue FROM claim_pends WHERE status=\'open\' AND due_date < CURRENT_DATE ORDER BY days_overdue DESC;'},
  {query_type:'auth_expiry',name:'Authorization Expiry Check',category:'Authorization',description:'Active authorizations that have expired',risk_level:'HIGH',sql_template:'SELECT auth_number, expiration_date, CURRENT_DATE - expiration_date AS days_expired FROM authorizations WHERE status!=\'closed\' AND expiration_date < CURRENT_DATE;'},
  {query_type:'member_no_plan',name:'Members Without Plan Assignment',category:'Eligibility',description:'Active members not enrolled in any plan',risk_level:'MEDIUM',sql_template:'SELECT member_id, first_name, last_name FROM members WHERE status=\'active\' AND plan_id IS NULL;'},
  {query_type:'contract_expiry',name:'Contract Expiry Warning',category:'Network',description:'Provider contracts expiring within 90 days',risk_level:'MEDIUM',sql_template:'SELECT contract_number, provider_name, termination_date FROM provider_contracts WHERE status=\'active\' AND termination_date <= CURRENT_DATE + INTERVAL \'90 days\';'},
  {query_type:'networx_gaps',name:'NetworX Config Gaps',category:'Pricing',description:'Network tiers missing NetworX pricing configuration',risk_level:'MEDIUM',sql_template:'SELECT p.network FROM providers p LEFT JOIN networx_configs nc ON nc.network_tier=p.network WHERE nc.id IS NULL GROUP BY p.network;'},
  {query_type:'oop_exceeded',name:'OOP Maximum Exceeded',category:'Financial',description:'Claims where paid amount exceeds plan OOP maximum',risk_level:'HIGH',sql_template:'SELECT c.claim_number, p.plan_name, c.paid_amount, p.oop_max FROM claims c JOIN plans p ON c.plan_id=p.id WHERE c.paid_amount > p.oop_max AND c.status=\'paid\';'},
  {query_type:'dental_freq_exceeded',name:'Dental Frequency Limit Breach',category:'Dental',description:'Dental claims exceeding configured frequency limits',risk_level:'MEDIUM',sql_template:'SELECT c.member_id, c.procedure_code, COUNT(*) FROM claims c JOIN dental_configs d ON c.procedure_code=d.ada_code GROUP BY c.member_id, c.procedure_code HAVING COUNT(*) > 2;'},
  {query_type:'medicaid_crossover',name:'Medicaid Crossover Claims',category:'Government',description:'Claims flagged for Medicare/Medicaid crossover processing',risk_level:'MEDIUM',sql_template:'SELECT c.claim_number, \'MSP_SECONDARY\' AS crossover FROM claims c CROSS JOIN program_configs pc WHERE pc.msp_secondary=\'yes\' AND c.status IN (\'pending\',\'in_review\');'},
  {query_type:'missing_npi',name:'Claims with Invalid NPI',category:'Claims',description:'Claims submitted with NPI not in provider master',risk_level:'HIGH',sql_template:'SELECT c.claim_number, c.provider FROM claims c LEFT JOIN providers p ON p.npi=c.provider_npi WHERE p.id IS NULL AND c.status NOT IN (\'voided\',\'denied\');'}
];

app.get('/api/sql-validate/queries',(req,res)=>res.json(SQL_QUERIES));

app.post('/api/sql-validate',(req,res)=>{
  const{query_type}=req.body;
  const ts=new Date().toISOString();
  let results=[],status='PASS',sql_template='';
  const q=SQL_QUERIES.find(x=>x.query_type===query_type);
  if(!q)return res.status(400).json({error:'Unknown query_type'});
  sql_template=q.sql_template;

  if(query_type==='benefit_gaps'){
    const req_cats=['medical','pharmacy','preventive'];
    db.plans.filter(p=>p.status==='active').forEach(plan=>{
      const covered=[...new Set(db.benefits.filter(b=>b.plan_type===plan.plan_type||b.plan_type==='all').map(b=>b.benefit_type))];
      const missing=req_cats.filter(c=>!covered.includes(c));
      if(missing.length)results.push({plan_code:plan.plan_code,plan_name:plan.plan_name,missing_categories:missing.join(', '),severity:'HIGH'});
    });
    if(results.length)status='FAIL';
  }else if(query_type==='duplicate_claims'){
    const seen={};
    db.claims.forEach(c=>{const k=`${c.member_id}|${c.service_date}|${c.provider}|${c.procedure_code}`;if(seen[k])results.push({original:seen[k],duplicate:c.claim_number,service_date:c.service_date,procedure_code:c.procedure_code});else seen[k]=c.claim_number;});
    if(results.length)status='FAIL';
  }else if(query_type==='pend_aging'){
    const today=new Date();
    results=db.claim_pends.filter(p=>p.status==='open'&&new Date(p.due_date)<today).map(p=>({pend_number:p.pend_number,claim_number:p.claim_number,due_date:p.due_date,days_overdue:Math.floor((today-new Date(p.due_date))/86400000),assigned_to:p.assigned_to}));
    if(results.length)status='WARN';
  }else if(query_type==='member_no_plan'){
    results=db.members.filter(m=>m.status==='active'&&!m.plan_id).map(m=>({member_id:m.member_id,name:`${m.first_name} ${m.last_name}`}));
    if(results.length)status='WARN';
  }else if(query_type==='contract_expiry'){
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()+90);
    results=db.provider_contracts.filter(c=>c.status==='active'&&new Date(c.termination_date)<=cutoff).map(c=>({contract_number:c.contract_number,provider_name:c.provider_name,termination_date:c.termination_date,days_until_expiry:Math.floor((new Date(c.termination_date)-new Date())/86400000)}));
    if(results.length)status='WARN';
  }else if(query_type==='pricing_orphans'){
    const ids=new Set(db.plans.map(p=>p.id));
    results=db.pricing.filter(p=>p.plan_id&&!ids.has(p.plan_id)).map(p=>({pricing_code:p.pricing_code,plan_id:p.plan_id,tier:p.tier}));
    if(results.length)status='WARN';
  }else if(query_type==='oop_exceeded'){
    db.claims.forEach(c=>{const plan=db.plans.find(p=>p.id===c.plan_id);if(plan&&c.paid_amount>plan.oop_max&&c.status==='paid')results.push({claim_number:c.claim_number,plan_name:plan.plan_name,paid_amount:c.paid_amount,oop_max:plan.oop_max});});
    if(results.length)status='FAIL';
  }else if(query_type==='dental_freq_exceeded'){
    const grouped={};
    db.claims.filter(c=>c.procedure_code&&c.procedure_code.startsWith('D')).forEach(c=>{const k=`${c.member_id}|${c.procedure_code}`;grouped[k]=(grouped[k]||0)+1;});
    Object.entries(grouped).forEach(([k,count])=>{if(count>2){const[mbr,code]=k.split('|');results.push({member_id:mbr,procedure_code:code,claim_count:count});}});
    if(results.length)status='FAIL';
  }else if(query_type==='auth_expiry'){
    const today=new Date();
    results=db.authorizations.filter(a=>a.status!=='closed'&&a.expiration_date&&new Date(a.expiration_date)<today).map(a=>({auth_number:a.auth_number,expiration_date:a.expiration_date}));
    if(results.length)status='WARN';
  }else if(query_type==='networx_gaps'){
    const configured=new Set(db.networx_configs.map(n=>n.network_tier));
    const tiers=[...new Set(db.providers.map(p=>p.network))];
    results=tiers.filter(t=>!configured.has(t)).map(t=>({network_tier:t,issue:'No NetworX config'}));
    if(results.length)status='WARN';
  }else if(query_type==='medicaid_crossover'){
    const hasCrossover=db.program_configs.some(pc=>pc.crossover_claims==='yes');
    if(hasCrossover)results=db.claims.filter(c=>['pending','in_review'].includes(c.status)).map(c=>({claim_number:c.claim_number,crossover_flag:'MSP_REVIEW'}));
    status=results.length?'INFO':'PASS';
  }else{
    status='PASS';results=[];
  }
  res.json({query_type,timestamp:ts,row_count:results.length,status,results,sql_template});
});

app.get('/api/audit',async(req,res)=>{try{res.json(memAll('audit_logs'));}catch(e){res.status(500).json({error:e.message});}});

app.get('/api/stats',(req,res)=>{
  const totalBilled=db.claims.reduce((s,c)=>s+parseFloat(c.billed_amount||0),0);
  res.json({members:db.members.length,products:db.products.length,plans:db.plans.length,benefits:db.benefits.length,pricing:db.pricing.length,claims:db.claims.length,groups:db.groups.length,providers:db.providers.length,authorizations:db.authorizations.length,classes:db.classes.length,provider_contracts:db.provider_contracts.length,fee_tables:db.fee_tables.length,service_groups:db.service_groups.length,networx_configs:db.networx_configs.length,program_configs:db.program_configs.length,dental_configs:db.dental_configs.length,claim_pends:db.claim_pends.length,total_claims_amount:totalBilled.toFixed(2),pending_claims:db.claims.filter(c=>c.status==='pending').length,open_pends:db.claim_pends.filter(p=>p.status==='open').length,active_members:db.members.filter(m=>m.status==='active').length});
});

app.get('/api/health',(req,res)=>res.json({status:'ok',mode:'memory',uptime:process.uptime(),version:'2.0.0'}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`🚀 Facets v2 running on port ${PORT}`));

