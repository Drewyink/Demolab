const{Pool}=require('pg');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});
async function run(){
  try{
    await pool.query(`CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      group_id TEXT, employer_name TEXT, short_name TEXT,
      tax_id TEXT, sic_code TEXT, industry TEXT, group_size INTEGER,
      contract_start TEXT, renewal_date TEXT, contribution_model TEXT,
      employer_contribution_pct INTEGER, waiting_period_days INTEGER,
      oe_month INTEGER, contact_name TEXT, contact_email TEXT,
      contact_phone TEXT, billing_address TEXT, plan_offerings TEXT,
      cobra_eligible TEXT, erisa_plan TEXT, status TEXT, notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log('Table ready');

    const c=await pool.query('SELECT COUNT(*) FROM groups');
    if(parseInt(c.rows[0].count)>0){
      console.log('Already has '+c.rows[0].count+' groups. Done.');
      await pool.end();return;
    }

    await pool.query(`INSERT INTO groups
      (group_id,employer_name,short_name,tax_id,sic_code,industry,group_size,
       contract_start,renewal_date,contribution_model,employer_contribution_pct,
       waiting_period_days,oe_month,contact_name,contact_email,contact_phone,
       billing_address,plan_offerings,cobra_eligible,erisa_plan,status,notes)
      VALUES
      ('GRP-ECL-2026-001','EchoLink Clinics & Urgent Care Network','EchoLink Solutions',
       '56-7890123','8011','healthcare',275,'2026-01-01','2026-12-31',
       'defined_contribution',75,30,11,'Sandra Mitchell',
       's.mitchell@echolinkclinics.com','(704) 555-0192',
       '4200 EchoLink Medical Parkway Suite 100 Charlotte NC 28202',
       'EchoLink HMO Bronze, EchoLink PPO Silver, EchoLink CDH HDHP + HSA, EchoLink Dental Essentials',
       'yes','yes','active','Primary training group 2026 cohort')`);
    console.log('Created GRP-ECL-2026-001');

    await pool.query(`INSERT INTO groups
      (group_id,employer_name,short_name,tax_id,sic_code,industry,group_size,
       contract_start,renewal_date,contribution_model,employer_contribution_pct,
       waiting_period_days,oe_month,contact_name,contact_email,contact_phone,
       billing_address,plan_offerings,cobra_eligible,erisa_plan,status,notes)
      VALUES
      ('GRP-002','Blue Ridge Community Hospital','BRCH','98-7654321','8062',
       'healthcare',450,'2026-01-01','2026-12-31','defined_benefit',90,0,11,
       'Marcus Webb','benefits@brchosp.org','555-2000',
       '500 Hospital Way Asheville NC 28801',
       'HMO Basic, PPO Plus, Dental Select',
       'yes','yes','active','Key account')`);
    console.log('Created GRP-002');

    await pool.query(`INSERT INTO groups
      (group_id,employer_name,short_name,tax_id,sic_code,industry,group_size,
       contract_start,renewal_date,contribution_model,employer_contribution_pct,
       waiting_period_days,oe_month,contact_name,contact_email,contact_phone,
       billing_address,plan_offerings,cobra_eligible,erisa_plan,status,notes)
      VALUES
      ('GRP-003','Main Street Diner Group','Main Street Diner','55-1122334',
       '5812','hospitality',18,'2026-04-01','2026-03-31','split',50,60,3,
       'Tony Rizzo','tony@mainstreetdiner.com','555-3000',
       '22 Main St Greenville SC 29601',
       'Bronze HMO','no','yes','pending','Awaiting signatures')`);
    console.log('Created GRP-003');

    console.log('All 3 groups seeded. Refresh your browser.');
    await pool.end();
  }catch(e){
    console.error('Error:',e.message);
    await pool.end();
  }
}
run();
