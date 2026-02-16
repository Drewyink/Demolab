import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "facets.db");
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

function execFile(rel){
  const p = path.join(__dirname, "..", rel);
  db.exec(fs.readFileSync(p, "utf8"));
}
function id(prefix){ return prefix + "-" + Math.random().toString(16).slice(2).toUpperCase(); }

execFile("db/schema.sql");

db.exec("DELETE FROM users; DELETE FROM products; DELETE FROM plans; DELETE FROM benefit_rules; DELETE FROM fee_schedule; DELETE FROM accumulators; DELETE FROM members; DELETE FROM member_accumulator_balances; DELETE FROM claims; DELETE FROM audit_log;");

const pw = "Passw0rd!";
db.prepare("INSERT INTO users(user_id,email,full_name,password_hash,role) VALUES (?,?,?,?,?)")
  .run(id("USR"), "admin@echolink.local", "Echolink Admin", bcrypt.hashSync(pw,10), "admin");
db.prepare("INSERT INTO users(user_id,email,full_name,password_hash,role) VALUES (?,?,?,?,?)")
  .run(id("USR"), "student@echolink.local", "Student User", bcrypt.hashSync(pw,10), "student");

db.prepare(`INSERT INTO products(product_id,product_name,carrier,lob,network_model,effective_date,term_date)
            VALUES (?,?,?,?,?,?,?)`)
  .run("PPOGOLD2026","PPO Gold 2026","EchoHealth Insurance","Commercial","INN_OON","2026-01-01","2026-12-31");

db.prepare(`INSERT INTO plans(plan_id,product_id,plan_name,benefit_year_type,pcp_required,effective_date,term_date,notes)
            VALUES (?,?,?,?,?,?,?,?)`)
  .run("PPO-GOLD-26","PPOGOLD2026","PPO Gold 2026","Calendar",1,"2026-01-01","2026-12-31","Mock configuration for training. Simplified adjudication.");

const acc = db.prepare(`INSERT INTO accumulators(acc_id,plan_id,tier,accumulator_type,ind_limit_cents,fam_limit_cents,embedded_family)
                        VALUES (?,?,?,?,?,?,?)`);
acc.run(id("ACC"),"PPO-GOLD-26","INN","DED",100000,200000,1);
acc.run(id("ACC"),"PPO-GOLD-26","INN","OOP",350000,700000,1);
acc.run(id("ACC"),"PPO-GOLD-26","OON","DED",250000,500000,0);
acc.run(id("ACC"),"PPO-GOLD-26","OON","OOP",800000,1600000,0);

const rule = db.prepare(`INSERT INTO benefit_rules(
  benefit_id,plan_id,tier,service_category,code_type,code_start,code_end,covered,deductible_applies,copay_cents,coins_pct,
  accumulator_applied,auth_required,er_waive_copay_if_admit,priority,effective_date,term_date,notes
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const eff="2026-01-01", term="2026-12-31";
rule.run(id("BEN"),"PPO-GOLD-26","INN","Preventive Care","CPT",99381,99397,1,0,0,0,"None",0,0,5,eff,term,"100% covered INN");
rule.run(id("BEN"),"PPO-GOLD-26","INN","Primary Care Visit","CPT",99200,99299,1,0,2500,0,"OOP",0,0,10,eff,term,"Copay before deductible");
rule.run(id("BEN"),"PPO-GOLD-26","INN","Emergency Room","CPT",99281,99285,1,0,25000,20,"OOP",0,1,15,eff,term,"Copay then coins; waive if admitted");
rule.run(id("BEN"),"PPO-GOLD-26","INN","Advanced Imaging","CPT",70551,70553,1,1,0,20,"Both",1,0,30,eff,term,"Prior auth required");
rule.run(id("BEN"),"PPO-GOLD-26","INN","Lab Tests","CPT",80000,89999,1,1,0,20,"Both",0,0,40,eff,term,"");
rule.run(id("BEN"),"PPO-GOLD-26","OON","OON Professional","CPT",1,99999,1,1,0,60,"Both",0,0,50,eff,term,"Default OON rule");

const pr = db.prepare(`INSERT INTO fee_schedule(price_id,plan_id,tier,code_type,code_start,code_end,allowed_cents,priority)
                       VALUES (?,?,?,?,?,?,?,?)`);
pr.run(id("PRC"),"PPO-GOLD-26","INN","CPT",99213,99213,15000,10);
pr.run(id("PRC"),"PPO-GOLD-26","INN","CPT",99281,99285,120000,10);
pr.run(id("PRC"),"PPO-GOLD-26","INN","CPT",70551,70553,90000,10);
pr.run(id("PRC"),"PPO-GOLD-26","INN","CPT",80000,89999,4000,50);

db.prepare(`INSERT INTO members(member_id,first_name,last_name,status,dob,sex,mbi,tier_code,plan_id,effective_date,term_date)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
  .run("M100245","Jordan","Smith","ACTIVE","1985-04-22","M","MBI1234567","INN","PPO-GOLD-26","2026-01-01",null);
db.prepare(`INSERT INTO member_accumulator_balances(member_id,plan_id,tier,accumulator_type,ytd_cents) VALUES (?,?,?,?,0)`)
  .run("M100245","PPO-GOLD-26","INN","DED");
db.prepare(`INSERT INTO member_accumulator_balances(member_id,plan_id,tier,accumulator_type,ytd_cents) VALUES (?,?,?,?,0)`)
  .run("M100245","PPO-GOLD-26","INN","OOP");

console.log("Initialized DB:", dbPath);
console.log("Admin: admin@echolink.local / Passw0rd!");
console.log("Student: student@echolink.local / Passw0rd!");
