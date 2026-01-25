// server.js
import express from "express";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

import { snapshot, ensureAgency, createUser, getAgency, SYMBOLS } from "./store.js";
import { initLedger, ledger, verifyChain } from "./ledger.js";
import {
  adminCreditUSD, adminMint, adminVerifyUser, adminFreezeUser, adminRevokeKYC, adminFlagUser,
  setSettlementMode, setCircuitBreakerParams,
  placeLimitOrder, placeMarketOrder, cancelOrder,
  tickSettlement
} from "./engine.js";

initLedger();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

const ADMIN_KEY = "ADMIN_DEMO_KEY";

function safe(res, fn){
  try { fn(); } catch(e){ res.status(400).json({ error: e.message }); }
}

// --- Agencies ---
app.get("/api/agencies", (req,res)=> safe(res, ()=>{
  res.json({ agencies: [...getAgency().keys()].map(id => getAgency().get(id).public()) });
}));

app.post("/api/agencies", (req,res)=> safe(res, ()=>{
  const { agencyId, name } = req.body;
  const a = ensureAgency(agencyId, name);
  res.json({ agency: a.public() });
  broadcast();
}));

// --- Symbols ---
app.get("/api/symbols", (req,res)=> res.json({ symbols: SYMBOLS }));

// --- Snapshot (optionally scoped) ---
app.get("/api/snapshot", (req,res)=> safe(res, ()=>{
  const agencyId = req.query.agencyId || null;
  res.json(snapshot(agencyId));
}));

// --- Users ---
app.post("/api/users", (req,res)=> safe(res, ()=>{
  const { agencyId, id, name } = req.body;
  if(!agencyId || !id || !name) throw new Error("agencyId, id, name required");
  ensureAgency(agencyId);
  const u = createUser({ agencyId, id, name });
  res.json({ user: u.public() });
  broadcast();
}));

// --- Admin / Regulator ---
function assertAdmin(adminKey){
  if(adminKey !== ADMIN_KEY) throw new Error("UNAUTHORIZED");
}

app.post("/api/admin/verify", (req,res)=> safe(res, ()=>{
  const { adminKey, agencyId, userId } = req.body;
  assertAdmin(adminKey);
  const u = adminVerifyUser({ agencyId, userId });
  res.json({ user: u.public() });
  broadcast();
}));

app.post("/api/admin/revoke-kyc", (req,res)=> safe(res, ()=>{
  const { adminKey, agencyId, userId } = req.body;
  assertAdmin(adminKey);
  const u = adminRevokeKYC({ agencyId, userId });
  res.json({ user: u.public() });
  broadcast();
}));

app.post("/api/admin/freeze", (req,res)=> safe(res, ()=>{
  const { adminKey, agencyId, userId, frozen } = req.body;
  assertAdmin(adminKey);
  const u = adminFreezeUser({ agencyId, userId, frozen: !!frozen });
  res.json({ user: u.public() });
  broadcast();
}));

app.post("/api/admin/flag", (req,res)=> safe(res, ()=>{
  const { adminKey, agencyId, userId, flag, value } = req.body;
  assertAdmin(adminKey);
  const u = adminFlagUser({ agencyId, userId, flag, value: !!value });
  res.json({ user: u.public() });
  broadcast();
}));

app.post("/api/admin/credit-usd", (req,res)=> safe(res, ()=>{
  const { adminKey, agencyId, userId, amount } = req.body;
  assertAdmin(adminKey);
  const u = adminCreditUSD({ agencyId, userId, amount: Number(amount) });
  res.json({ user: u.public() });
  broadcast();
}));

app.post("/api/admin/mint", (req,res)=> safe(res, ()=>{
  const { adminKey, agencyId, userId, symbol, qty } = req.body;
  assertAdmin(adminKey);
  const u = adminMint({ agencyId, userId, symbol, qty: Number(qty) });
  res.json({ user: u.public() });
  broadcast();
}));

app.post("/api/admin/settlement-mode", (req,res)=> safe(res, ()=>{
  const { adminKey, agencyId, mode, tPlusDelaySeconds } = req.body;
  assertAdmin(adminKey);
  const a = setSettlementMode({ agencyId, mode, tPlusDelaySeconds: Number(tPlusDelaySeconds) });
  res.json({ agency: a.public() });
  broadcast();
}));

app.post("/api/admin/circuit-breaker", (req,res)=> safe(res, ()=>{
  const { adminKey, agencyId, pct, haltSeconds } = req.body;
  assertAdmin(adminKey);
  const a = setCircuitBreakerParams({ agencyId, pct: Number(pct), haltSeconds: Number(haltSeconds) });
  res.json({ agency: a.public() });
  broadcast();
}));

// --- Orders ---
app.post("/api/orders/limit", (req,res)=> safe(res, ()=>{
  const { agencyId, userId, symbol, side, qty, price } = req.body;
  const out = placeLimitOrder({
    agencyId,
    userId,
    symbol,
    side,
    qty: Number(qty),
    price: Number(price)
  });
  res.json(out);
  broadcast();
}));

app.post("/api/orders/market", (req,res)=> safe(res, ()=>{
  const { agencyId, userId, symbol, side, qty } = req.body;
  const out = placeMarketOrder({
    agencyId,
    userId,
    symbol,
    side,
    qty: Number(qty)
  });
  res.json(out);
  broadcast();
}));

app.post("/api/orders/cancel", (req,res)=> safe(res, ()=>{
  const { agencyId, userId, orderId } = req.body;
  const out = cancelOrder({ agencyId, userId, orderId });
  res.json(out);
  broadcast();
}));

// --- Ledger ---
app.get("/api/ledger", (req,res)=> safe(res, ()=>{
  const agencyId = req.query.agencyId || null;
  res.json({
    verify: verifyChain(),
    chain: ledger.chain.slice(-200).filter(b => !agencyId || b.data?.agencyId === agencyId || b.type === "GENESIS")
  });
}));

const server = app.listen(3000, ()=> {
  console.log("Running on http://localhost:3000");
  console.log("Admin demo key:", ADMIN_KEY);
});

// WebSocket live updates
const wss = new WebSocketServer({ server });

function broadcast(){
  const payload = JSON.stringify({ type:"SNAPSHOT", data: snapshot(null) });
  for(const c of wss.clients){
    if(c.readyState === 1) c.send(payload);
  }
}

wss.on("connection", (ws)=>{
  ws.send(JSON.stringify({ type:"SNAPSHOT", data: snapshot(null) }));
});

// Settlement ticker (simulated)
setInterval(()=> {
  const changed = tickSettlement();
  if(changed) broadcast();
}, 1000);
