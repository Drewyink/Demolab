const $ = (s, el=document)=>el.querySelector(s);
const $$ = (s, el=document)=>Array.from(el.querySelectorAll(s));
const money = (n)=> (Number(n||0)).toFixed(2);

function toast(msg){
  const t=$("#toast"); if(!t) return;
  t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2600);
}
async function api(path, opts={}){
  const res = await fetch(path, { headers:{ "Content-Type":"application/json" }, ...opts });
  const ct = res.headers.get("content-type")||"";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if(!res.ok) throw new Error(data?.error || data || `HTTP ${res.status}`);
  return data;
}
async function me(){
  return api("/api/auth/me",{ method:"GET", headers:{} });
}
function requireKeys(obj, keys){
  for(const k of keys){ if(obj[k]===undefined || obj[k]==="") throw new Error(`Missing ${k}`); }
}
function setActive(view){
  $$(".chip").forEach(c=>c.classList.toggle("active", c.dataset.view===view));
  $$(".view").forEach(v=>v.style.display = (v.id===`view-${view}` ? "block":"none"));
}

async function initNav(){
  $$(".chip").forEach(ch=>ch.addEventListener("click",()=>{ setActive(ch.dataset.view); }));
  $("#btnLogout")?.addEventListener("click", async ()=>{
    await api("/api/auth/logout",{ method:"POST", body:"{}" });
    location.href="/login.html";
  });
}

async function loadKpis(){
  const s=await api("/api/summary",{ method:"GET", headers:{} });
  $("#kpiProduct").textContent = s.product ? s.product.product_name : "—";
  $("#kpiPlan").textContent = s.plan ? s.plan.plan_name : "—";
  $("#kpiMembers").textContent = s.memberCount;
  $("#kpiRules").textContent = s.ruleCount;
  $("#kpiClaims").textContent = s.claimCount;
}

async function loadProducts(){
  const rows=await api("/api/products",{ method:"GET", headers:{} });
  const tb=$("#tblProducts tbody"); tb.innerHTML="";
  rows.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.product_id}</td><td>${r.product_name}</td><td>${r.carrier}</td><td>${r.lob}</td><td>${r.effective_date}</td><td>${r.term_date}</td>`;
    tb.appendChild(tr);
  });
  const sel=$("#selPlanProduct"); if(sel){
    sel.innerHTML = rows.map(r=>`<option value="${r.product_id}">${r.product_id} • ${r.product_name}</option>`).join("");
  }
}
async function createProduct(){
  const o={
    product_id: $("#p_product_id").value.trim(),
    product_name: $("#p_product_name").value.trim(),
    carrier: $("#p_carrier").value.trim(),
    lob: $("#p_lob").value.trim(),
    network_model: $("#p_network_model").value,
    effective_date: $("#p_eff").value,
    term_date: $("#p_term").value
  };
  requireKeys(o, ["product_id","product_name","carrier","lob","effective_date","term_date"]);
  await api("/api/products",{ method:"POST", body: JSON.stringify(o) });
  toast("Product created"); await loadProducts(); await loadKpis();
}

async function loadPlans(){
  const rows=await api("/api/plans",{ method:"GET", headers:{} });
  const tb=$("#tblPlans tbody"); tb.innerHTML="";
  rows.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.plan_id}</td><td>${r.product_id}</td><td>${r.plan_name}</td><td>${r.benefit_year_type}</td><td>${r.pcp_required? "Yes":"No"}</td><td>${r.effective_date}</td><td>${r.term_date}</td>`;
    tb.appendChild(tr);
  });
  const sel=$("#selBenefitPlan"); if(sel){
    sel.innerHTML=rows.map(r=>`<option value="${r.plan_id}">${r.plan_id} • ${r.plan_name}</option>`).join("");
  }
  const sel2=$("#selPricePlan"); if(sel2){
    sel2.innerHTML=rows.map(r=>`<option value="${r.plan_id}">${r.plan_id} • ${r.plan_name}</option>`).join("");
  }
  const sel3=$("#selMemberPlan"); if(sel3){
    sel3.innerHTML=rows.map(r=>`<option value="${r.plan_id}">${r.plan_id} • ${r.plan_name}</option>`).join("");
  }
  const sel4=$("#selClaimPlan"); if(sel4){
    sel4.innerHTML=`<option value="">(Use member’s plan)</option>` + rows.map(r=>`<option value="${r.plan_id}">${r.plan_id} • ${r.plan_name}</option>`).join("");
  }
}
async function createPlan(){
  const o={
    plan_id: $("#pl_plan_id").value.trim(),
    product_id: $("#selPlanProduct").value,
    plan_name: $("#pl_plan_name").value.trim(),
    benefit_year_type: $("#pl_by").value,
    pcp_required: $("#pl_pcp").checked?1:0,
    effective_date: $("#pl_eff").value,
    term_date: $("#pl_term").value,
    notes: $("#pl_notes").value.trim()
  };
  requireKeys(o, ["plan_id","product_id","plan_name","benefit_year_type","effective_date","term_date"]);
  await api("/api/plans",{ method:"POST", body: JSON.stringify(o) });
  toast("Plan created"); await loadPlans(); await loadKpis();
}

async function loadBenefits(){
  const plan_id=$("#selBenefitPlan").value;
  const tier=$("#b_tier_filter").value;
  const rows=await api(`/api/benefits?plan_id=${encodeURIComponent(plan_id)}&tier=${encodeURIComponent(tier)}`,{ method:"GET", headers:{} });
  const tb=$("#tblBenefits tbody"); tb.innerHTML="";
  rows.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.benefit_id}</td><td>${r.tier}</td><td>${r.service_category}</td><td>${r.code_type}</td><td>${r.code_start}-${r.code_end}</td>
      <td>${r.covered? "Y":"N"}</td><td>${r.deductible_applies? "Y":"N"}</td><td>${money((r.copay_cents||0)/100)}</td><td>${r.coins_pct}%</td>
      <td>${r.accumulator_applied}</td><td>${r.auth_required? "Y":"N"}</td><td>${r.priority}</td>`;
    tb.appendChild(tr);
  });
}
async function createBenefit(){
  const plan_id=$("#selBenefitPlan").value;
  const o={
    plan_id,
    tier: $("#b_tier").value,
    service_category: $("#b_service").value.trim(),
    code_type: $("#b_code_type").value,
    code_start: $("#b_code_start").value,
    code_end: $("#b_code_end").value,
    covered: $("#b_covered").checked?1:0,
    deductible_applies: $("#b_ded").checked?1:0,
    copay: $("#b_copay").value,
    coins_pct: $("#b_coins").value,
    accumulator_applied: $("#b_acc").value,
    auth_required: $("#b_auth").checked?1:0,
    er_waive_copay_if_admit: $("#b_waive").checked?1:0,
    priority: $("#b_pri").value,
    effective_date: $("#b_eff").value,
    term_date: $("#b_term").value,
    notes: $("#b_notes").value.trim()
  };
  requireKeys(o, ["plan_id","tier","service_category","code_type","code_start","code_end","effective_date","term_date"]);
  await api("/api/benefits",{ method:"POST", body: JSON.stringify(o) });
  toast("Benefit rule added"); await loadBenefits(); await loadKpis();
}

async function loadPricing(){
  const plan_id=$("#selPricePlan").value;
  const tier=$("#pr_tier_filter").value;
  const rows=await api(`/api/pricing?plan_id=${encodeURIComponent(plan_id)}&tier=${encodeURIComponent(tier)}`,{ method:"GET", headers:{} });
  const tb=$("#tblPricing tbody"); tb.innerHTML="";
  rows.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.price_id}</td><td>${r.tier}</td><td>${r.code_type}</td><td>${r.code_start}-${r.code_end}</td><td>${money(r.allowed_amount)}</td><td>${r.priority}</td>`;
    tb.appendChild(tr);
  });
}
async function createPrice(){
  const plan_id=$("#selPricePlan").value;
  const o={
    plan_id,
    tier: $("#pr_tier").value,
    code_type: $("#pr_code_type").value,
    code_start: $("#pr_code_start").value,
    code_end: $("#pr_code_end").value,
    allowed_amount: $("#pr_allowed").value,
    priority: $("#pr_pri").value
  };
  requireKeys(o, ["plan_id","tier","code_type","code_start","code_end","allowed_amount"]);
  await api("/api/pricing",{ method:"POST", body: JSON.stringify(o) });
  toast("Fee schedule row added"); await loadPricing();
}

async function loadMembers(){
  const q=$("#m_search").value.trim();
  const rows=await api(`/api/members?q=${encodeURIComponent(q)}`,{ method:"GET", headers:{} });
  const tb=$("#tblMembers tbody"); tb.innerHTML="";
  rows.forEach(m=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td><button class="btn ghost" data-mid="${m.member_id}" style="padding:6px 10px;border-radius:10px">Open</button></td>
      <td>${m.member_id}</td><td>${m.first_name}</td><td>${m.last_name}</td><td>${m.status}</td><td>${m.plan_id}</td><td>${m.tier_code}</td><td>${m.effective_date}</td>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll("button[data-mid]").forEach(b=>b.addEventListener("click",()=>openMember(b.dataset.mid)));
}
async function createMember(){
  const o={
    member_id: $("#m_id").value.trim(),
    first_name: $("#m_fn").value.trim(),
    last_name: $("#m_ln").value.trim(),
    status: $("#m_status").value,
    dob: $("#m_dob").value,
    sex: $("#m_sex").value,
    mbi: $("#m_mbi").value.trim(),
    tier_code: $("#m_tier").value,
    plan_id: $("#selMemberPlan").value,
    effective_date: $("#m_eff").value,
    term_date: $("#m_term").value || null
  };
  requireKeys(o, ["member_id","first_name","last_name","plan_id","tier_code","effective_date"]);
  await api("/api/members",{ method:"POST", body: JSON.stringify(o) });
  toast("Member created"); await loadMembers(); await loadKpis();
}
async function openMember(member_id){
  const data=await api(`/api/members/${encodeURIComponent(member_id)}`,{ method:"GET", headers:{} });
  $("#m_detail").style.display="block";
  $("#md_title").textContent = `${data.member.member_id} • ${data.member.first_name} ${data.member.last_name}`;
  $("#md_plan").textContent = data.member.plan_id;
  $("#md_tier").textContent = data.member.tier_code;
  $("#md_status").textContent = data.member.status;
  $("#md_dates").textContent = `${data.member.effective_date} → ${data.member.term_date || "open"}`;
  const tb=$("#tblBalances tbody"); tb.innerHTML="";
  data.balances.forEach(b=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${b.tier}</td><td>${b.accumulator_type}</td><td>${money(b.ytd)}</td>`;
    tb.appendChild(tr);
  });
  $("#claim_member_id").value = data.member.member_id;
  $("#claim_tier").value = data.member.tier_code;
}

async function submitClaim(){
  const o={
    member_id: $("#claim_member_id").value.trim(),
    plan_id: $("#selClaimPlan").value,
    tier: $("#claim_tier").value,
    dos: $("#claim_dos").value,
    provider_name: $("#claim_provider").value.trim(),
    code_type: $("#claim_code_type").value,
    code: $("#claim_code").value,
    billed_amount: $("#claim_billed").value,
    admitted: $("#claim_admit").checked
  };
  requireKeys(o, ["member_id","tier","dos","provider_name","code_type","code","billed_amount"]);
  const res=await api("/api/claims/adjudicate",{ method:"POST", body: JSON.stringify(o) });
  $("#claim_result").style.display="block";
  $("#cr_status").innerHTML = res.result.status==="PAY"
    ? `<span class="badge pay">PAY</span>`
    : `<span class="badge deny">DENY</span>`;
  $("#cr_allowed").textContent = money(res.result.allowed_amount);
  $("#cr_member").textContent = money(res.result.member);
  $("#cr_plan").textContent = money(res.result.plan);
  $("#cr_detail").textContent = `Copay ${money(res.result.copay_applied)}, Deductible ${money(res.result.deductible_applied)}, Coins ${money(res.result.coins_applied)}, Rule ${res.result.applied_benefit_id||"—"}`;
  const tbt=$("#tblTrace tbody"); tbt.innerHTML="";
  res.trace.forEach(s=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${s.step}</td><td>${s.detail}</td>`;
    tbt.appendChild(tr);
  });
  const tbb=$("#tblBalances2 tbody"); tbb.innerHTML="";
  res.balances.forEach(b=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${b.tier}</td><td>${b.accumulator_type}</td><td>${money(b.ytd)}</td>`;
    tbb.appendChild(tr);
  });
  toast(`Claim ${res.claim_id} saved`);
  await loadClaims();
}
async function loadClaims(){
  const rows=await api("/api/claims",{ method:"GET", headers:{} });
  const tb=$("#tblClaims tbody"); tb.innerHTML="";
  rows.forEach(c=>{
    const tr=document.createElement("tr");
    const badge = c.status==="PAY" ? "pay":"deny";
    tr.innerHTML=`<td>${c.claim_id}</td><td>${c.member_id}</td><td>${c.plan_id}</td><td>${c.tier}</td><td>${c.dos}</td><td>${c.provider_name}</td>
      <td>${c.code_type} ${c.code_value}</td><td>${money(c.billed_amount)}</td><td>${money(c.allowed_amount)}</td>
      <td><span class="badge ${badge}">${c.status}</span></td><td>${money(c.member_amount)}</td><td>${money(c.plan_amount)}</td><td>${c.applied_benefit_id||"—"}</td>`;
    tb.appendChild(tr);
  });
}

async function loadAudit(){
  const rows=await api("/api/audit",{ method:"GET", headers:{} });
  const tb=$("#tblAudit tbody"); tb.innerHTML="";
  rows.forEach(a=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${a.audit_id}</td><td>${a.created_at}</td><td>${a.actor}</td><td>${a.action}</td><td>${a.entity_type}</td><td>${a.entity_id||""}</td>
      <td><code style="white-space:nowrap">${JSON.stringify(a.details).slice(0,220)}</code></td>`;
    tb.appendChild(tr);
  });
}

async function main(){
  const auth = await me();
  if(!auth.user){ location.href="/login.html"; return; }
  $("#who").textContent = `${auth.user.full_name} (${auth.user.role})`;
  await initNav();
  await loadKpis();
  await loadProducts();
  await loadPlans();
  await loadMembers();
  await loadBenefits();
  await loadPricing();
  await loadClaims();
  await loadAudit();

  $("#btnProductCreate").addEventListener("click", async ()=>{ try{ await createProduct(); }catch(e){ toast(e.message);} });
  $("#btnPlanCreate").addEventListener("click", async ()=>{ try{ await createPlan(); }catch(e){ toast(e.message);} });
  $("#btnBenefitCreate").addEventListener("click", async ()=>{ try{ await createBenefit(); }catch(e){ toast(e.message);} });
  $("#btnPriceCreate").addEventListener("click", async ()=>{ try{ await createPrice(); }catch(e){ toast(e.message);} });
  $("#btnMemberCreate").addEventListener("click", async ()=>{ try{ await createMember(); }catch(e){ toast(e.message);} });
  $("#btnMemberSearch").addEventListener("click", async ()=>{ try{ await loadMembers(); }catch(e){ toast(e.message);} });
  $("#selBenefitPlan").addEventListener("change", loadBenefits);
  $("#b_tier_filter").addEventListener("change", loadBenefits);
  $("#selPricePlan").addEventListener("change", loadPricing);
  $("#pr_tier_filter").addEventListener("change", loadPricing);
  $("#btnClaimSubmit").addEventListener("click", async ()=>{ try{ await submitClaim(); }catch(e){ toast(e.message);} });
  $("#btnAuditRefresh").addEventListener("click", async ()=>{ try{ await loadAudit(); }catch(e){ toast(e.message);} });
}
main().catch(e=>toast(e.message));
