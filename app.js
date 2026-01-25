// public/app.js
const $ = (id)=>document.getElementById(id);

let snap = null;
let currentAgencyId = null;
let currentUserId = null;

async function api(path, method="GET", body=null){
  const res = await fetch(path, {
    method,
    headers: body ? {"Content-Type":"application/json"} : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function fmtAgency(a){
  return `Agency: ${a.name} (${a.id})
Settlement: ${a.settlementMode} (delay=${a.tPlusDelaySeconds}s)
Circuit Breaker: ${a.cbPct}% halt=${a.cbHaltSeconds}s`;
}

function fmtUser(u){
  const flags = Object.entries(u.flags||{}).map(([k,v])=>`${k}:${v}`).join("  ");
  return `User: ${u.name} (${u.id})  agency=${u.agencyId}
Verified: ${u.verified}  Frozen: ${u.frozen}
Flags: ${flags}
USD: $${Number(u.usd).toFixed(2)}
Tokens: ${Object.entries(u.tokens||{}).map(([k,v])=>`${k}:${v}`).join("  ")}`;
}

function fillSelect(select, items, value){
  select.innerHTML = items.map(x => `<option value="${x}">${x}</option>`).join("");
  if(value && items.includes(value)) select.value = value;
}

function scopedKey(agencyId, symbol){
  return `${agencyId}:${symbol}`;
}

function currentAgency(){
  return (snap?.agencies||[]).find(a=>a.id===currentAgencyId) || null;
}

function currentUser(){
  return (snap?.users||[]).find(u=>u.id===currentUserId && u.agencyId===currentAgencyId) || null;
}

function render(){
  if(!snap) return;

  // agencies
  const agencies = snap.agencies || [];
  if(agencies.length===0){
    // create a default agency in UI prompt
  }
  const agencySelect = $("agencySelect");
  fillSelect(agencySelect, agencies.map(a=>a.id), currentAgencyId || agencies[0]?.id);
  currentAgencyId = agencySelect.value || null;

  const a = currentAgency();
  $("agencyInfo").textContent = a ? fmtAgency(a) : "No agency selected";

  // reflect settings controls
  if(a){
    $("settlementMode").value = a.settlementMode;
    $("tPlusDelay").value = a.tPlusDelaySeconds;
    $("cbPct").value = a.cbPct;
    $("cbHalt").value = a.cbHaltSeconds;
  }

  // users in agency
  const users = (snap.users||[]).filter(u=>u.agencyId===currentAgencyId);
  fillSelect($("userSelect"), users.map(u=>u.id), currentUserId || users[0]?.id);
  currentUserId = $("userSelect").value || null;

  const u = currentUser();
  $("userInfo").textContent = u ? fmtUser(u) : "No user selected";

  // symbols
  const symbols = ["AAPL","MSFT","TSLA"];
  fillSelect($("symbol"), symbols, $("symbol").value || symbols[0]);
  fillSelect($("bookSymbol"), symbols, $("bookSymbol").value || symbols[0]);
  fillSelect($("mintSymbol"), symbols, $("mintSymbol").value || symbols[0]);

  // order type toggles price input
  $("price").style.display = $("orderType").value === "LIMIT" ? "" : "none";

  // order books
  const sym = $("bookSymbol").value;
  const key = scopedKey(currentAgencyId, sym);
  const book = snap.books?.[key];

  const banner = $("haltBanner");
  if(book?.halted){
    banner.className = "banner danger";
    banner.style.display = "block";
    banner.textContent = `TRADING HALTED for ${sym} until ${new Date(book.haltedUntil).toLocaleTimeString()} — ${book.haltReason} (ref=${book.refPrice})`;
  }else{
    banner.className = "banner";
    banner.style.display = "none";
    banner.textContent = "";
  }

  $("bids").innerHTML = (book?.bids||[]).slice(0,14).map(o =>
    `#${o.orderId} ${o.userId} ${o.type} BUY ${o.remaining}/${o.qty} @ ${Number(o.price).toFixed(2)}`
  ).join("<br>") || "(none)";

  $("asks").innerHTML = (book?.asks||[]).slice(0,14).map(o =>
    `#${o.orderId} ${o.userId} ${o.type} SELL ${o.remaining}/${o.qty} @ ${Number(o.price).toFixed(2)}`
  ).join("<br>") || "(none)";

  // trades (scoped)
  const trades = (snap.trades||[]).filter(t=>t.agencyId===currentAgencyId).slice().reverse();
  $("trades").innerHTML = trades.map(t=>{
    const st = t.status || "SETTLED";
    const settle = t.settleAt ? ` settleAt=${new Date(t.settleAt).toLocaleTimeString()}` : "";
    return `[${new Date(t.ts).toLocaleTimeString()}] ${t.symbol} ${t.qty} @ ${t.price} | buyer=${t.buyerId} seller=${t.sellerId} (${t.tradeId}) ${st}${settle}`;
  }).join("<br>") || "(no trades yet)";
}

async function refresh(){
  snap = await api("/api/snapshot");
  render();
}

function wsConnect(){
  const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);
  ws.onmessage = (evt)=>{
    const msg = JSON.parse(evt.data);
    if(msg.type==="SNAPSHOT"){
      snap = msg.data;
      render();
    }
  };
}

// --- Agency UI ---
$("btnCreateAgency").onclick = async ()=>{
  const agencyId = $("newAgencyId").value.trim();
  const name = $("newAgencyName").value.trim() || agencyId;
  if(!agencyId) return alert("Enter agency id");
  try{
    await api("/api/agencies","POST",{ agencyId, name });
    $("newAgencyId").value = "";
    $("newAgencyName").value = "";
    await refresh();
    $("agencySelect").value = agencyId;
    currentAgencyId = agencyId;
    render();
  }catch(e){ alert(e.message); }
};

$("agencySelect").onchange = ()=>{ currentAgencyId = $("agencySelect").value; currentUserId=null; render(); };
$("btnRefresh").onclick = refresh;

// --- Users ---
$("btnCreateUser").onclick = async ()=>{
  if(!currentAgencyId) return alert("Create/select an agency first");
  const id = $("newUserId").value.trim();
  const name = $("newUserName").value.trim();
  if(!id || !name) return alert("Enter user id + name");
  try{
    await api("/api/users","POST",{ agencyId: currentAgencyId, id, name });
    $("newUserId").value = "";
    $("newUserName").value = "";
    await refresh();
    $("userSelect").value = id;
    currentUserId = id;
    render();
  }catch(e){ alert(e.message); }
};

$("userSelect").onchange = ()=>{ currentUserId = $("userSelect").value; render(); };

$("orderType").onchange = ()=> render();
$("bookSymbol").onchange = ()=> render();

// --- Admin controls ---
function adminPayload(extra={}){
  return { adminKey: $("adminKey").value, agencyId: currentAgencyId, userId: currentUserId, ...extra };
}
function ensureSelected(){
  if(!currentAgencyId) throw new Error("Select an agency");
  if(!currentUserId) throw new Error("Select a user");
}

$("btnVerify").onclick = async ()=>{
  try{ ensureSelected(); await api("/api/admin/verify","POST", adminPayload()); } catch(e){ alert(e.message); }
};
$("btnRevokeKyc").onclick = async ()=>{
  try{ ensureSelected(); await api("/api/admin/revoke-kyc","POST", adminPayload()); } catch(e){ alert(e.message); }
};
$("btnFreeze").onclick = async ()=>{
  try{
    ensureSelected();
    const u = currentUser();
    await api("/api/admin/freeze","POST", adminPayload({ frozen: !u?.frozen }));
  }catch(e){ alert(e.message); }
};
$("btnFlagSuspicious").onclick = async ()=>{
  try{
    ensureSelected();
    const u = currentUser();
    await api("/api/admin/flag","POST", adminPayload({ flag:"suspicious", value: !u?.flags?.suspicious }));
  }catch(e){ alert(e.message); }
};
$("btnClearFlags").onclick = async ()=>{
  try{
    ensureSelected();
    // clear velocity + oversized; suspicious will recompute
    await api("/api/admin/flag","POST", adminPayload({ flag:"highVelocity", value:false }));
    await api("/api/admin/flag","POST", adminPayload({ flag:"oversizedOrders", value:false }));
    await api("/api/admin/flag","POST", adminPayload({ flag:"suspicious", value:false }));
  }catch(e){ alert(e.message); }
};

$("btnCredit").onclick = async ()=>{
  try{ ensureSelected(); await api("/api/admin/credit-usd","POST", adminPayload({ amount: 10000 })); } catch(e){ alert(e.message); }
};
$("btnMint").onclick = async ()=>{
  try{ ensureSelected(); await api("/api/admin/mint","POST", adminPayload({ symbol:$("mintSymbol").value, qty:Number($("mintQty").value) })); } catch(e){ alert(e.message); }
};

$("btnSetMode").onclick = async ()=>{
  try{
    if(!currentAgencyId) throw new Error("Select an agency");
    await api("/api/admin/settlement-mode","POST", {
      adminKey: $("adminKey").value,
      agencyId: currentAgencyId,
      mode: $("settlementMode").value,
      tPlusDelaySeconds: Number($("tPlusDelay").value)
    });
  }catch(e){ alert(e.message); }
};

$("btnSetCB").onclick = async ()=>{
  try{
    if(!currentAgencyId) throw new Error("Select an agency");
    await api("/api/admin/circuit-breaker","POST", {
      adminKey: $("adminKey").value,
      agencyId: currentAgencyId,
      pct: Number($("cbPct").value),
      haltSeconds: Number($("cbHalt").value)
    });
  }catch(e){ alert(e.message); }
};

// --- Orders ---
$("btnPlace").onclick = async ()=>{
  try{
    ensureSelected();
    const orderType = $("orderType").value;
    const side = $("side").value;
    const symbol = $("symbol").value;
    const qty = Number($("qty").value);

    let out;
    if(orderType === "MARKET"){
      out = await api("/api/orders/market","POST", { agencyId: currentAgencyId, userId: currentUserId, symbol, side, qty });
    }else{
      const price = Number($("price").value);
      out = await api("/api/orders/limit","POST", { agencyId: currentAgencyId, userId: currentUserId, symbol, side, qty, price });
    }
    $("orderResult").textContent = `Order ${out.order.orderId} ${out.order.type} placed. Trades: ${out.trades.length}`;
    $("bookSymbol").value = symbol;
    render();
  }catch(e){
    $("orderResult").textContent = `Error: ${e.message}`;
  }
};

// --- Ledger ---
$("btnLedger").onclick = async ()=>{
  try{
    if(!currentAgencyId) throw new Error("Select an agency");
    const out = await api(`/api/ledger?agencyId=${encodeURIComponent(currentAgencyId)}`);
    $("ledgerVerify").textContent = out.verify.ok ? "Chain OK ✅ (quorum sigs)" : `Chain Broken ❌ at ${out.verify.at}`;
    $("ledger").innerHTML = out.chain.slice().reverse().map(b=>{
      const time = new Date(b.ts).toLocaleTimeString();
      const sigs = (b.sigs||[]).slice(0,2).map(s=>`${s.validatorId}:${s.sig.slice(0,8)}..`).join(" ");
      return `${b.index} ${time} ${b.type}
prev=${b.prevHash.slice(0,10)}.. hash=${b.hash.slice(0,10)}..
sigs=${sigs}
data=${JSON.stringify(b.data)}`;
    }).join("<br><br>");
  }catch(e){ alert(e.message); }
};

// boot
refresh();
wsConnect();
