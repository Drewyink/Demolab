import express from "express";
import helmet from "helmet";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "echolink-training-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax" }
}));

app.use(express.static(path.join(__dirname, "public")));

const db = new Database(path.join(__dirname, "facets.db"));
db.pragma("foreign_keys = ON");

const cents = (d)=>Math.round(Number(d||0)*100);
const dollars = (c)=>Number(((c||0)/100).toFixed(2));
const id = (p)=>p+"-"+Math.random().toString(16).slice(2).toUpperCase();
const actor = (req)=>req.session?.user?.email || "anonymous";
const now = ()=>new Date().toISOString().slice(0,19).replace("T"," ");

function audit(req, action, entity_type, entity_id, details){
  db.prepare("INSERT INTO audit_log(actor,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)")
    .run(actor(req), action, entity_type, entity_id||null, JSON.stringify(details||{}));
}

function requireAuth(req,res,next){
  if(!req.session?.user) return res.status(401).json({ error:"Unauthorized" });
  next();
}

/* AUTH */
app.post("/api/auth/register",(req,res)=>{
  const { email, full_name, password } = req.body || {};
  if(!email || !full_name || !password) return res.status(400).json({ error:"email, full_name, password required" });
  if(password.length < 6) return res.status(400).json({ error:"Password must be at least 6 characters" });

  const e = email.toLowerCase();
  if(db.prepare("SELECT 1 FROM users WHERE email=?").get(e)) return res.status(409).json({ error:"Email already exists" });

  const user_id = id("USR");
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users(user_id,email,full_name,password_hash,role) VALUES (?,?,?,?,?)")
    .run(user_id, e, full_name, hash, "student");
  audit(req,"auth.register","user",user_id,{ email:e, full_name });
  res.json({ ok:true });
});

app.post("/api/auth/login",(req,res)=>{
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error:"email and password required" });

  const u = db.prepare("SELECT user_id,email,full_name,password_hash,role FROM users WHERE email=?").get(email.toLowerCase());
  if(!u || !bcrypt.compareSync(password, u.password_hash)) return res.status(401).json({ error:"Invalid credentials" });

  req.session.user = { user_id:u.user_id, email:u.email, full_name:u.full_name, role:u.role };
  audit(req,"auth.login","user",u.user_id,{});
  res.json({ ok:true, user:req.session.user });
});

app.post("/api/auth/logout", requireAuth, (req,res)=>{
  const u = req.session.user;
  req.session.destroy(()=>{});
  audit({ session:{ user:u } },"auth.logout","user",u.user_id,{});
  res.json({ ok:true });
});

app.get("/api/auth/me",(req,res)=> res.json({ user:req.session?.user || null }));

/* PRODUCTS */
app.get("/api/products", requireAuth,(req,res)=>{
  res.json(db.prepare("SELECT * FROM products ORDER BY effective_date DESC").all());
});
app.post("/api/products", requireAuth,(req,res)=>{
  const p=req.body||{};
  for(const k of ["product_id","product_name","carrier","lob","effective_date","term_date"])
    if(!p[k]) return res.status(400).json({ error:`Missing ${k}` });
  db.prepare(`INSERT INTO products(product_id,product_name,carrier,lob,network_model,effective_date,term_date)
              VALUES (?,?,?,?,?,?,?)`)
    .run(p.product_id,p.product_name,p.carrier,p.lob,p.network_model||"INN_OON",p.effective_date,p.term_date);
  audit(req,"product.create","product",p.product_id,p);
  res.json({ ok:true });
});
app.put("/api/products/:id", requireAuth,(req,res)=>{
  const pid=req.params.id;
  const ex=db.prepare("SELECT * FROM products WHERE product_id=?").get(pid);
  if(!ex) return res.status(404).json({ error:"Not found" });
  const p={...ex,...(req.body||{})};
  db.prepare(`UPDATE products SET product_name=?,carrier=?,lob=?,network_model=?,effective_date=?,term_date=? WHERE product_id=?`)
    .run(p.product_name,p.carrier,p.lob,p.network_model,p.effective_date,p.term_date,pid);
  audit(req,"product.update","product",pid,req.body);
  res.json({ ok:true });
});

/* PLANS */
app.get("/api/plans", requireAuth,(req,res)=>{
  res.json(db.prepare("SELECT * FROM plans ORDER BY effective_date DESC").all());
});
app.post("/api/plans", requireAuth,(req,res)=>{
  const p=req.body||{};
  for(const k of ["plan_id","product_id","plan_name","benefit_year_type","effective_date","term_date"])
    if(!p[k]) return res.status(400).json({ error:`Missing ${k}` });
  db.prepare(`INSERT INTO plans(plan_id,product_id,plan_name,benefit_year_type,pcp_required,effective_date,term_date,notes)
              VALUES (?,?,?,?,?,?,?,?)`)
    .run(p.plan_id,p.product_id,p.plan_name,p.benefit_year_type,Number(p.pcp_required||0),p.effective_date,p.term_date,p.notes||"");
  audit(req,"plan.create","plan",p.plan_id,p);
  res.json({ ok:true });
});
app.put("/api/plans/:id", requireAuth,(req,res)=>{
  const plan_id=req.params.id;
  const ex=db.prepare("SELECT * FROM plans WHERE plan_id=?").get(plan_id);
  if(!ex) return res.status(404).json({ error:"Not found" });
  const p={...ex,...(req.body||{})};
  db.prepare(`UPDATE plans SET product_id=?,plan_name=?,benefit_year_type=?,pcp_required=?,effective_date=?,term_date=?,notes=? WHERE plan_id=?`)
    .run(p.product_id,p.plan_name,p.benefit_year_type,Number(p.pcp_required||0),p.effective_date,p.term_date,p.notes||"",plan_id);
  audit(req,"plan.update","plan",plan_id,req.body);
  res.json({ ok:true });
});

/* BENEFITS */
app.get("/api/benefits", requireAuth,(req,res)=>{
  const plan_id=(req.query.plan_id||"").toString();
  if(!plan_id) return res.status(400).json({ error:"plan_id required" });
  const tier=(req.query.tier||"").toString();
  const rows = tier
    ? db.prepare("SELECT * FROM benefit_rules WHERE plan_id=? AND tier=? ORDER BY priority ASC").all(plan_id,tier)
    : db.prepare("SELECT * FROM benefit_rules WHERE plan_id=? ORDER BY priority ASC").all(plan_id);
  res.json(rows);
});
app.post("/api/benefits", requireAuth,(req,res)=>{
  const r=req.body||{};
  for(const k of ["plan_id","tier","service_category","code_type","code_start","code_end","effective_date","term_date"])
    if(r[k]===undefined||r[k]==="") return res.status(400).json({ error:`Missing ${k}` });

  const benefit_id=id("BEN");
  db.prepare(`INSERT INTO benefit_rules(
    benefit_id,plan_id,tier,service_category,code_type,code_start,code_end,covered,deductible_applies,copay_cents,coins_pct,
    accumulator_applied,auth_required,er_waive_copay_if_admit,priority,effective_date,term_date,notes
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    benefit_id,r.plan_id,r.tier,r.service_category,r.code_type,Number(r.code_start),Number(r.code_end),
    Number(r.covered??1),Number(r.deductible_applies??0),cents(r.copay??0),Number(r.coins_pct??0),
    r.accumulator_applied||"OOP",Number(r.auth_required??0),Number(r.er_waive_copay_if_admit??0),Number(r.priority??100),
    r.effective_date,r.term_date,r.notes||""
  );
  audit(req,"benefit.create","benefit_rule",benefit_id,r);
  res.json({ ok:true, benefit_id });
});
app.put("/api/benefits/:id", requireAuth,(req,res)=>{
  const bid=req.params.id;
  const ex=db.prepare("SELECT * FROM benefit_rules WHERE benefit_id=?").get(bid);
  if(!ex) return res.status(404).json({ error:"Not found" });
  const r={...ex,...(req.body||{})};
  db.prepare(`UPDATE benefit_rules SET
    plan_id=?,tier=?,service_category=?,code_type=?,code_start=?,code_end=?,
    covered=?,deductible_applies=?,copay_cents=?,coins_pct=?,accumulator_applied=?,
    auth_required=?,er_waive_copay_if_admit=?,priority=?,effective_date=?,term_date=?,notes=?
    WHERE benefit_id=?`).run(
    r.plan_id,r.tier,r.service_category,r.code_type,Number(r.code_start),Number(r.code_end),
    Number(r.covered),Number(r.deductible_applies),Number(r.copay_cents),Number(r.coins_pct),
    r.accumulator_applied,Number(r.auth_required),Number(r.er_waive_copay_if_admit),Number(r.priority),
    r.effective_date,r.term_date,r.notes||"",bid
  );
  audit(req,"benefit.update","benefit_rule",bid,req.body);
  res.json({ ok:true });
});

/* PRICING */
app.get("/api/pricing", requireAuth,(req,res)=>{
  const plan_id=(req.query.plan_id||"").toString();
  if(!plan_id) return res.status(400).json({ error:"plan_id required" });
  const tier=(req.query.tier||"").toString();
  const rows = tier
    ? db.prepare("SELECT * FROM fee_schedule WHERE plan_id=? AND tier=? ORDER BY priority ASC").all(plan_id,tier)
    : db.prepare("SELECT * FROM fee_schedule WHERE plan_id=? ORDER BY priority ASC").all(plan_id);
  res.json(rows.map(r=>({ ...r, allowed_amount:dollars(r.allowed_cents) })));
});
app.post("/api/pricing", requireAuth,(req,res)=>{
  const p=req.body||{};
  for(const k of ["plan_id","tier","code_type","code_start","code_end","allowed_amount"])
    if(p[k]===undefined||p[k]==="") return res.status(400).json({ error:`Missing ${k}` });
  const price_id=id("PRC");
  db.prepare(`INSERT INTO fee_schedule(price_id,plan_id,tier,code_type,code_start,code_end,allowed_cents,priority)
              VALUES (?,?,?,?,?,?,?,?)`).run(
    price_id,p.plan_id,p.tier,p.code_type,Number(p.code_start),Number(p.code_end),cents(p.allowed_amount),Number(p.priority??100)
  );
  audit(req,"pricing.create","fee_schedule",price_id,p);
  res.json({ ok:true, price_id });
});

/* MEMBERS */
app.get("/api/members", requireAuth,(req,res)=>{
  const q=(req.query.q||"").toString().trim();
  const rows = q
    ? db.prepare(`SELECT * FROM members WHERE member_id LIKE ? OR mbi LIKE ? OR last_name LIKE ? OR first_name LIKE ? ORDER BY created_at DESC LIMIT 100`)
      .all(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`)
    : db.prepare("SELECT * FROM members ORDER BY created_at DESC LIMIT 100").all();
  res.json(rows);
});
app.get("/api/members/:id", requireAuth,(req,res)=>{
  const m=db.prepare("SELECT * FROM members WHERE member_id=?").get(req.params.id);
  if(!m) return res.status(404).json({ error:"Not found" });
  const balances=db.prepare(`SELECT tier,accumulator_type,ytd_cents FROM member_accumulator_balances
                             WHERE member_id=? AND plan_id=? ORDER BY tier,accumulator_type`).all(m.member_id,m.plan_id);
  res.json({ member:m, balances: balances.map(b=>({ ...b, ytd:dollars(b.ytd_cents) })) });
});
app.post("/api/members", requireAuth,(req,res)=>{
  const m=req.body||{};
  for(const k of ["member_id","first_name","last_name","plan_id","tier_code","effective_date"])
    if(!m[k]) return res.status(400).json({ error:`Missing ${k}` });

  db.prepare(`INSERT INTO members(member_id,first_name,last_name,status,dob,sex,mbi,tier_code,plan_id,effective_date,term_date,updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    m.member_id,m.first_name,m.last_name,m.status||"ACTIVE",m.dob||null,m.sex||null,m.mbi||null,
    m.tier_code,m.plan_id,m.effective_date,m.term_date||null,now()
  );

  for(const accType of ["DED","OOP"]){
    db.prepare(`INSERT OR IGNORE INTO member_accumulator_balances(member_id,plan_id,tier,accumulator_type,ytd_cents)
                VALUES (?,?,?,?,0)`).run(m.member_id,m.plan_id,m.tier_code,accType);
  }
  audit(req,"member.create","member",m.member_id,m);
  res.json({ ok:true });
});
app.put("/api/members/:id", requireAuth,(req,res)=>{
  const idm=req.params.id;
  const ex=db.prepare("SELECT * FROM members WHERE member_id=?").get(idm);
  if(!ex) return res.status(404).json({ error:"Not found" });
  const m={...ex,...(req.body||{})};
  db.prepare(`UPDATE members SET first_name=?,last_name=?,status=?,dob=?,sex=?,mbi=?,tier_code=?,plan_id=?,effective_date=?,term_date=?,updated_at=? WHERE member_id=?`)
    .run(m.first_name,m.last_name,m.status,m.dob||null,m.sex||null,m.mbi||null,m.tier_code,m.plan_id,m.effective_date,m.term_date||null,now(),idm);
  audit(req,"member.update","member",idm,req.body);
  res.json({ ok:true });
});

/* CLAIMS ENGINE */
function getAllowed(plan_id,tier,code_type,code_value){
  const row=db.prepare(`
    SELECT allowed_cents FROM fee_schedule
    WHERE plan_id=? AND tier=? AND code_type=? AND ? BETWEEN code_start AND code_end
    ORDER BY priority ASC LIMIT 1
  `).get(plan_id,tier,code_type,code_value);
  return row?row.allowed_cents:null;
}
function matchRule(plan_id,tier,code_type,code_value,svcDate){
  return db.prepare(`
    SELECT * FROM benefit_rules
    WHERE plan_id=? AND tier=? AND code_type=? AND ? BETWEEN code_start AND code_end
      AND ? BETWEEN effective_date AND term_date
    ORDER BY priority ASC LIMIT 1
  `).get(plan_id,tier,code_type,code_value,svcDate) || null;
}
function getBal(member_id,plan_id,tier,type){
  const row=db.prepare(`SELECT ytd_cents FROM member_accumulator_balances WHERE member_id=? AND plan_id=? AND tier=? AND accumulator_type=?`)
    .get(member_id,plan_id,tier,type);
  return row?row.ytd_cents:0;
}
function setBal(member_id,plan_id,tier,type,ytd){
  db.prepare(`
    INSERT INTO member_accumulator_balances(member_id,plan_id,tier,accumulator_type,ytd_cents)
    VALUES (?,?,?,?,?)
    ON CONFLICT(member_id,plan_id,tier,accumulator_type) DO UPDATE SET ytd_cents=excluded.ytd_cents
  `).run(member_id,plan_id,tier,type,ytd);
}
function limit(plan_id,tier,type){
  const row=db.prepare("SELECT ind_limit_cents FROM accumulators WHERE plan_id=? AND tier=? AND accumulator_type=?").get(plan_id,tier,type);
  return row?row.ind_limit_cents:9e15;
}
function adjudicate({ member_id, plan_id, tier, code_type, code_value, billed_cents, admitted, svc_date }){
  const trace=[];
  const allowed = getAllowed(plan_id,tier,code_type,code_value);
  const allowed_cents = allowed ?? billed_cents;
  trace.push({ step:"pricing", detail:`Allowed=${allowed_cents} cents (${allowed? "fee schedule hit":"fee schedule miss"})` });

  const rule = matchRule(plan_id,tier,code_type,code_value,svc_date);
  if(!rule){
    trace.push({ step:"rule", detail:"No matching benefit rule → DENY" });
    return { status:"DENY", allowed_cents, member_pay_cents:allowed_cents, plan_pay_cents:0, applied_benefit_id:null, trace,
      copay_applied:0, deductible_applied:0, coins_applied:0 };
  }
  trace.push({ step:"rule", detail:`Matched ${rule.benefit_id} ${rule.service_category} (priority ${rule.priority})` });
  if(Number(rule.covered)===0){
    trace.push({ step:"coverage", detail:"covered=0 → DENY" });
    return { status:"DENY", allowed_cents, member_pay_cents:allowed_cents, plan_pay_cents:0, applied_benefit_id:rule.benefit_id, trace,
      copay_applied:0, deductible_applied:0, coins_applied:0 };
  }

  let remaining=allowed_cents;
  let memberPay=0;

  let copay=Number(rule.copay_cents||0);
  if(Number(rule.er_waive_copay_if_admit)===1 && admitted===1){
    trace.push({ step:"er", detail:"Admitted=1 → ER copay waived" });
    copay=0;
  }
  let copayApplied=0;
  if(copay>0){
    copayApplied=Math.min(copay,remaining);
    memberPay+=copayApplied; remaining-=copayApplied;
    trace.push({ step:"copay", detail:`Applied ${copayApplied}; remaining=${remaining}` });
  } else trace.push({ step:"copay", detail:"No copay" });

  let dedApplied=0;
  if(Number(rule.deductible_applies)===1 && remaining>0){
    const ytd=getBal(member_id,plan_id,tier,"DED");
    const rem=Math.max(0, limit(plan_id,tier,"DED") - ytd);
    dedApplied=Math.min(rem,remaining);
    memberPay+=dedApplied; remaining-=dedApplied;
    trace.push({ step:"deductible", detail:`DED remaining=${rem}; applied=${dedApplied}; remaining=${remaining}` });
  } else trace.push({ step:"deductible", detail:"Deductible not applied" });

  const pct=Math.max(0,Math.min(100,Number(rule.coins_pct||0)));
  let coinsApplied=0;
  if(remaining>0){
    coinsApplied=Math.round(remaining*(pct/100));
    memberPay+=coinsApplied;
    trace.push({ step:"coins", detail:`Member coins=${coinsApplied} (${pct}%)` });
  } else trace.push({ step:"coins", detail:"No remaining after copay/ded" });

  const oopLimit=limit(plan_id,tier,"OOP");
  const oopYtd=getBal(member_id,plan_id,tier,"OOP");
  const oopRem=Math.max(0, oopLimit-oopYtd);
  if(memberPay>oopRem){
    const shift=memberPay-oopRem;
    memberPay=oopRem;
    trace.push({ step:"oop", detail:`OOP cap hit; shifted ${shift} cents to plan` });
  } else trace.push({ step:"oop", detail:`OOP remaining=${oopRem}; within cap` });

  const planPay=Math.max(0, allowed_cents-memberPay);

  if(dedApplied>0){
    setBal(member_id,plan_id,tier,"DED", getBal(member_id,plan_id,tier,"DED")+dedApplied);
  }
  setBal(member_id,plan_id,tier,"OOP", getBal(member_id,plan_id,tier,"OOP")+memberPay);
  trace.push({ step:"acc_update", detail:`Updated +DED=${dedApplied}, +OOP=${memberPay}` });

  return { status:"PAY", allowed_cents, member_pay_cents:memberPay, plan_pay_cents:planPay, applied_benefit_id:rule.benefit_id,
    trace, copay_applied:copayApplied, deductible_applied:dedApplied, coins_applied:coinsApplied };
}

app.post("/api/claims/adjudicate", requireAuth,(req,res)=>{
  const i=req.body||{};
  for(const k of ["member_id","tier","code_type","code","billed_amount","dos","provider_name"])
    if(i[k]===undefined||i[k]==="") return res.status(400).json({ error:`Missing ${k}` });

  const member=db.prepare("SELECT * FROM members WHERE member_id=?").get(i.member_id);
  if(!member) return res.status(404).json({ error:"Member not found" });

  const plan_id=i.plan_id || member.plan_id;
  const result=adjudicate({
    member_id:member.member_id, plan_id, tier:i.tier, code_type:i.code_type, code_value:Number(i.code),
    billed_cents:cents(i.billed_amount), admitted:i.admitted?1:0, svc_date:i.dos
  });

  const claim_id=id("CLM");
  db.prepare(`INSERT INTO claims(
    claim_id,member_id,plan_id,tier,dos,provider_name,code_type,code_value,admitted,billed_cents,allowed_cents,status,
    member_pay_cents,plan_pay_cents,applied_benefit_id
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    claim_id,member.member_id,plan_id,i.tier,i.dos,i.provider_name,i.code_type,Number(i.code),i.admitted?1:0,
    cents(i.billed_amount),result.allowed_cents,result.status,result.member_pay_cents,result.plan_pay_cents,result.applied_benefit_id
  );

  audit(req,"claim.adjudicate","claim",claim_id,{ input:i, result });
  const balances=db.prepare(`SELECT tier,accumulator_type,ytd_cents FROM member_accumulator_balances WHERE member_id=? AND plan_id=? ORDER BY tier,accumulator_type`)
    .all(member.member_id,plan_id);

  res.json({
    claim_id,
    result:{
      status:result.status,
      allowed_amount:dollars(result.allowed_cents),
      member:dollars(result.member_pay_cents),
      plan:dollars(result.plan_pay_cents),
      copay_applied:dollars(result.copay_applied),
      deductible_applied:dollars(result.deductible_applied),
      coins_applied:dollars(result.coins_applied),
      applied_benefit_id:result.applied_benefit_id
    },
    trace: result.trace,
    balances: balances.map(b=>({ ...b, ytd:dollars(b.ytd_cents) }))
  });
});

app.get("/api/claims", requireAuth,(req,res)=>{
  const rows=db.prepare("SELECT * FROM claims ORDER BY created_at DESC LIMIT 100").all();
  res.json(rows.map(c=>({
    ...c,
    billed_amount:dollars(c.billed_cents),
    allowed_amount:dollars(c.allowed_cents),
    member_amount:dollars(c.member_pay_cents),
    plan_amount:dollars(c.plan_pay_cents)
  })));
});

/* DASH + AUDIT */
app.get("/api/summary", requireAuth,(req,res)=>{
  const plan=db.prepare("SELECT * FROM plans ORDER BY effective_date DESC LIMIT 1").get();
  const product=plan?db.prepare("SELECT * FROM products WHERE product_id=?").get(plan.product_id):null;
  const ruleCount=db.prepare("SELECT COUNT(*) c FROM benefit_rules").get().c;
  const claimCount=db.prepare("SELECT COUNT(*) c FROM claims").get().c;
  const memberCount=db.prepare("SELECT COUNT(*) c FROM members").get().c;
  res.json({ product, plan, ruleCount, claimCount, memberCount });
});

app.get("/api/audit", requireAuth,(req,res)=>{
  const cid=(req.query.claim_id||"").toString().trim();
  const rows = cid
    ? db.prepare("SELECT * FROM audit_log WHERE entity_id=? ORDER BY audit_id DESC LIMIT 300").all(cid)
    : db.prepare("SELECT * FROM audit_log ORDER BY audit_id DESC LIMIT 300").all();
  res.json(rows.map(r=>({ ...r, details: safeJson(r.details) })));
});
function safeJson(s){ try{return JSON.parse(s);}catch{return { raw:s }; } }

app.listen(PORT, ()=>console.log(`EcholinkSolutions Facets Sandbox running on http://localhost:${PORT}`));

