// engine.js
import { ensureAgency, user, book, SYMBOLS, defaultRefPrice } from "./store.js";
import { addBlock } from "./ledger.js";

let orderSeq = 1;
let tradeSeq = 1;

function now(){ return Date.now(); }

function sortBooks(ob){
  ob.bids.sort((a,b)=>(b.price-a.price)||(a.ts-b.ts));
  ob.asks.sort((a,b)=>(a.price-b.price)||(a.ts-b.ts));
}

function assertTradable(a, symbol){
  const h = a.halts[symbol];
  if(h.haltedUntil > now()){
    throw new Error(`TRADING_HALTED: ${symbol} until ${new Date(h.haltedUntil).toLocaleTimeString()} (${h.reason})`);
  }
}

function applyUserRiskSignals(u, qty, price){
  const t = now();
  // high velocity: > 6 orders in last 60s
  u.stats.ordersLastMinute = u.stats.ordersLastMinute.filter(x => t - x < 60000);
  u.stats.ordersLastMinute.push(t);
  if(u.stats.ordersLastMinute.length > 6) u.flags.highVelocity = true;

  // oversized: trade value > 250k
  if(qty * price > 250000) u.flags.oversizedOrders = true;

  // if either is true, mark suspicious (regulator can clear)
  if(u.flags.highVelocity || u.flags.oversizedOrders) u.flags.suspicious = true;
}

function canPlace(u, side, symbol, qty, price){
  if(!u.verified) throw new Error("KYC_REQUIRED");
  if(u.frozen) throw new Error("ACCOUNT_FROZEN");
  if(qty<=0 || price<=0) throw new Error("INVALID_PARAMS");
  if(side==="BUY"){
    if(u.usd < qty*price) throw new Error("INSUFFICIENT_USD");
  }else{
    if((u.tokens[symbol]||0) < qty) throw new Error("INSUFFICIENT_TOKENS");
  }
}

function reserve(u, side, symbol, qty, price){
  if(side==="BUY"){
    const amt = qty*price;
    u.usd -= amt;
    return { usdReserved: amt, tokensReserved: 0 };
  }else{
    u.tokens[symbol] -= qty;
    return { usdReserved: 0, tokensReserved: qty };
  }
}

function release(u, side, symbol, leftoverQty, price, reserveInfo){
  if(leftoverQty<=0) return;
  if(side==="BUY"){
    const refund = leftoverQty * price;
    u.usd += refund;
    reserveInfo.usdReserved -= refund;
  }else{
    u.tokens[symbol] += leftoverQty;
    reserveInfo.tokensReserved -= leftoverQty;
  }
}

function circuitBreakerCheck(a, symbol, tradePrice){
  const h = a.halts[symbol];
  const ref = h.refPrice || defaultRefPrice(symbol);
  const pctMove = Math.abs((tradePrice - ref) / ref) * 100;

  if(pctMove >= a.cbPct){
    h.haltedUntil = now() + a.cbHaltSeconds*1000;
    h.reason = `Volatility ${pctMove.toFixed(2)}% >= ${a.cbPct}%`;
    // keep refPrice unchanged during halt
    addBlock("CIRCUIT_BREAKER_HALT", { agencyId:a.id, symbol, tradePrice, refPrice:ref, pctMove });
  } else {
    // update ref price slowly (last trade)
    h.refPrice = tradePrice;
  }
}

function settleOrQueue(a, trade){
  if(a.settlementMode === "INSTANT"){
    // immediate settlement: credit buyer tokens, seller USD
    const buyer = user(a.id, trade.buyerId);
    const seller = user(a.id, trade.sellerId);
    buyer.tokens[trade.symbol] += trade.qty;
    seller.usd += trade.qty * trade.price;
    trade.status = "SETTLED";
    addBlock("TRADE_SETTLED", trade);
  } else {
    trade.status = "PENDING";
    trade.settleAt = now() + a.tPlusDelaySeconds*1000;
    a.pendingSettlements.push(trade);
    addBlock("TRADE_QUEUED_T_PLUS_1", trade);
  }
}

function match(a, symbol){
  const ob = book(a.id, symbol);
  sortBooks(ob);

  const trades = [];

  while(ob.bids.length && ob.asks.length){
    const bid = ob.bids[0];
    const ask = ob.asks[0];
    if(bid.price < ask.price) break;

    // maker = earlier ts
    const maker = bid.ts <= ask.ts ? bid : ask;
    const tradePrice = maker.price;
    const fillQty = Math.min(bid.remaining, ask.remaining);

    const bidU = user(a.id, bid.userId);
    const askU = user(a.id, ask.userId);

    // price improvement refund for buyer when tradePrice < bid.price
    if(tradePrice < bid.price){
      const refund = (bid.price - tradePrice) * fillQty;
      bidU.usd += refund;
      bid.reserveInfo.usdReserved -= refund;
    }

    // settlement: reserves already removed from buyer USD and seller tokens at order placement
    const trade = {
      tradeId: `T${tradeSeq++}`,
      ts: now(),
      agencyId: a.id,
      symbol,
      qty: fillQty,
      price: tradePrice,
      buyerId: bid.userId,
      sellerId: ask.userId
    };

    // risk signals (simple)
    applyUserRiskSignals(bidU, fillQty, tradePrice);
    applyUserRiskSignals(askU, fillQty, tradePrice);

    // circuit breaker check and potential halt AFTER this trade
    circuitBreakerCheck(a, symbol, tradePrice);

    a.trades.push(trade);
    trades.push(trade);
    addBlock("TRADE_MATCHED", trade);

    // settle or queue
    settleOrQueue(a, trade);

    bid.remaining -= fillQty;
    ask.remaining -= fillQty;

    if(bid.remaining === 0){
      bid.status = "FILLED";
      ob.bids.shift();
      addBlock("ORDER_FILLED", { agencyId:a.id, orderId: bid.orderId });
    }
    if(ask.remaining === 0){
      ask.status = "FILLED";
      ob.asks.shift();
      addBlock("ORDER_FILLED", { agencyId:a.id, orderId: ask.orderId });
    }

    sortBooks(ob);

    // if a halt triggered, stop matching further
    if(a.halts[symbol].haltedUntil > now()) break;
  }

  return trades;
}

export function setSettlementMode({ agencyId, mode, tPlusDelaySeconds }){
  const a = ensureAgency(agencyId);
  if(mode !== "INSTANT" && mode !== "T_PLUS_1") throw new Error("mode must be INSTANT or T_PLUS_1");
  a.settlementMode = mode;
  if(Number.isFinite(tPlusDelaySeconds) && tPlusDelaySeconds > 0) a.tPlusDelaySeconds = tPlusDelaySeconds;
  addBlock("SETTLEMENT_MODE_SET", { agencyId:a.id, mode:a.settlementMode, tPlusDelaySeconds:a.tPlusDelaySeconds });
  return a;
}

export function setCircuitBreakerParams({ agencyId, pct, haltSeconds }){
  const a = ensureAgency(agencyId);
  if(Number.isFinite(pct) && pct > 0) a.cbPct = pct;
  if(Number.isFinite(haltSeconds) && haltSeconds > 0) a.cbHaltSeconds = haltSeconds;
  addBlock("CIRCUIT_BREAKER_PARAMS", { agencyId:a.id, pct:a.cbPct, haltSeconds:a.cbHaltSeconds });
  return a;
}

// --- Admin/Regulator ---
export function adminVerifyUser({ agencyId, userId }){
  const u = user(agencyId, userId);
  u.verified = true;
  addBlock("KYC_VERIFIED", { agencyId, userId });
  return u;
}
export function adminRevokeKYC({ agencyId, userId }){
  const u = user(agencyId, userId);
  u.verified = false;
  addBlock("KYC_REVOKED", { agencyId, userId });
  return u;
}
export function adminFreezeUser({ agencyId, userId, frozen }){
  const u = user(agencyId, userId);
  u.frozen = frozen;
  addBlock("ACCOUNT_FREEZE_SET", { agencyId, userId, frozen });
  return u;
}
export function adminFlagUser({ agencyId, userId, flag, value }){
  const u = user(agencyId, userId);
  if(!u.flags.hasOwnProperty(flag)) throw new Error("Unknown flag");
  u.flags[flag] = value;
  // if clearing all, also clear suspicious if others false
  if(flag !== "suspicious" && value === false){
    u.flags.suspicious = (u.flags.highVelocity || u.flags.oversizedOrders);
  }
  addBlock("USER_FLAG_SET", { agencyId, userId, flag, value });
  return u;
}
export function adminCreditUSD({ agencyId, userId, amount }){
  if(amount<=0) throw new Error("INVALID_PARAMS");
  const u = user(agencyId, userId);
  u.usd += amount;
  addBlock("USD_CREDIT", { agencyId, userId, amount });
  return u;
}
export function adminMint({ agencyId, userId, symbol, qty }){
  if(!SYMBOLS.includes(symbol)) throw new Error("UNKNOWN_SYMBOL");
  if(qty<=0) throw new Error("INVALID_PARAMS");
  const u = user(agencyId, userId);
  u.tokens[symbol] += qty;
  addBlock("MINT", { agencyId, userId, symbol, qty });
  return u;
}

// --- Orders ---
export function placeLimitOrder({ agencyId, userId, symbol, side, qty, price }){
  const a = ensureAgency(agencyId);
  assertTradable(a, symbol);

  const u = user(agencyId, userId);
  canPlace(u, side, symbol, qty, price);

  applyUserRiskSignals(u, qty, price);

  const reserveInfo = reserve(u, side, symbol, qty, price);
  const order = {
    orderId: `O${orderSeq++}`,
    ts: now(),
    agencyId,
    userId,
    symbol,
    side,
    type: "LIMIT",
    price,
    qty,
    remaining: qty,
    status: "OPEN",
    reserveInfo
  };

  const ob = book(agencyId, symbol);
  if(side === "BUY") ob.bids.push(order);
  else ob.asks.push(order);

  a.orders.set(order.orderId, order);
  addBlock("ORDER_PLACED", { agencyId, orderId: order.orderId, userId, symbol, side, type:"LIMIT", price, qty });

  sortBooks(ob);
  const trades = match(a, symbol);

  return { order: scrub(order), trades };
}

export function placeMarketOrder({ agencyId, userId, symbol, side, qty }){
  const a = ensureAgency(agencyId);
  assertTradable(a, symbol);
  const ob = book(agencyId, symbol);
  sortBooks(ob);

  // Estimate worst-case price for reserve:
  // BUY: use best asks up to qty; SELL: best bids up to qty
  const levels = side === "BUY" ? ob.asks : ob.bids;
  let remaining = qty;
  let estCost = 0;
  for(const lvl of levels){
    if(remaining<=0) break;
    const take = Math.min(remaining, lvl.remaining);
    estCost += take * lvl.price;
    remaining -= take;
  }
  if(remaining > 0) throw new Error("INSUFFICIENT_LIQUIDITY");

  const u = user(agencyId, userId);

  // For BUY market, we validate against estimated cost; for SELL market, validate tokens qty
  if(side === "BUY"){
    canPlace(u, "BUY", symbol, 1, 1); // check KYC/frozen
    if(u.usd < estCost) throw new Error("INSUFFICIENT_USD");
  } else {
    canPlace(u, "SELL", symbol, qty, 1); // tokens check uses qty and price placeholder
  }

  // We create a MARKET order with price cap/floor from top of book for reserve simplicity.
  // Reserve at estimated cost for BUY, or tokens qty for SELL.
  const reserveInfo = side === "BUY"
    ? (u.usd -= estCost, { usdReserved: estCost, tokensReserved:0 })
    : (u.tokens[symbol] -= qty, { usdReserved:0, tokensReserved:qty });

  const order = {
    orderId: `O${orderSeq++}`,
    ts: now(),
    agencyId,
    userId,
    symbol,
    side,
    type: "MARKET",
    price: side === "BUY" ? Number.MAX_SAFE_INTEGER : 0,
    qty,
    remaining: qty,
    status: "OPEN",
    reserveInfo
  };

  addBlock("ORDER_PLACED", { agencyId, orderId: order.orderId, userId, symbol, side, type:"MARKET", qty });

  // Execute immediately by crossing with the book.
  const trades = [];
  while(order.remaining > 0){
    sortBooks(ob);
    const top = side === "BUY" ? ob.asks[0] : ob.bids[0];
    if(!top) break;

    // Check halt again mid-flight
    if(a.halts[symbol].haltedUntil > now()) break;

    const fillQty = Math.min(order.remaining, top.remaining);
    const tradePrice = top.price;

    // For BUY, ensure we have reserved enough (we reserved estCost). We also handle refunds for unused reserve later.
    // For SELL, tokens already reserved.

    const trade = {
      tradeId: `T${tradeSeq++}`,
      ts: now(),
      agencyId: a.id,
      symbol,
      qty: fillQty,
      price: tradePrice,
      buyerId: side === "BUY" ? order.userId : top.userId,
      sellerId: side === "BUY" ? top.userId : order.userId
    };

    // risk
    applyUserRiskSignals(user(agencyId, trade.buyerId), fillQty, tradePrice);
    applyUserRiskSignals(user(agencyId, trade.sellerId), fillQty, tradePrice);

    circuitBreakerCheck(a, symbol, tradePrice);

    a.trades.push(trade);
    trades.push(trade);
    addBlock("TRADE_MATCHED", trade);

    settleOrQueue(a, trade);

    // decrement both
    order.remaining -= fillQty;
    top.remaining -= fillQty;

    if(top.remaining === 0){
      top.status = "FILLED";
      if(side === "BUY") ob.asks.shift(); else ob.bids.shift();
      addBlock("ORDER_FILLED", { agencyId:a.id, orderId: top.orderId });
    }

    if(a.halts[symbol].haltedUntil > now()) break;
  }

  // Release unused reserve
  if(side === "BUY"){
    // compute actual spent from trades
    const spent = trades.reduce((s,t)=> s + t.qty*t.price, 0);
    const refund = Math.max(0, reserveInfo.usdReserved - spent);
    u.usd += refund;
    reserveInfo.usdReserved -= refund;
  } else {
    // If not fully filled, return leftover tokens
    const leftover = order.remaining;
    if(leftover > 0){
      u.tokens[symbol] += leftover;
      reserveInfo.tokensReserved -= leftover;
    }
  }

  order.status = order.remaining === 0 ? "FILLED" : "PARTIAL";
  addBlock("MARKET_ORDER_DONE", { agencyId:a.id, orderId: order.orderId, remaining: order.remaining });

  return { order: scrub(order), trades };
}

export function cancelOrder({ agencyId, userId, orderId }){
  const a = ensureAgency(agencyId);
  const o = a.orders.get(orderId);
  if(!o) throw new Error("ORDER_NOT_FOUND");
  if(o.userId !== userId) throw new Error("FORBIDDEN");
  if(o.status !== "OPEN") throw new Error("NOT_OPEN");

  const ob = book(agencyId, o.symbol);
  const arr = o.side === "BUY" ? ob.bids : ob.asks;
  const idx = arr.findIndex(x => x.orderId === orderId);
  if(idx >= 0) arr.splice(idx, 1);

  const u = user(agencyId, userId);
  release(u, o.side, o.symbol, o.remaining, o.price, o.reserveInfo);

  o.status = "CANCELED";
  addBlock("ORDER_CANCELED", { agencyId, userId, orderId });

  sortBooks(ob);
  return scrub(o);
}

function scrub(o){
  return {
    orderId: o.orderId,
    ts: o.ts,
    agencyId: o.agencyId,
    userId: o.userId,
    symbol: o.symbol,
    side: o.side,
    type: o.type,
    price: o.price,
    qty: o.qty,
    remaining: o.remaining,
    status: o.status
  };
}

// --- Settlement processing (simulated netting) ---
export function tickSettlement(){
  // process due settlements for all agencies
  let changed = false;
  // We can't import agencies map here without circular; so use ensureAgency on known ids isn't possible.
  // Instead, store uses a singleton map; we re-import dynamically:
  // (ESM has live bindings, so we can import agencies from store)
  return processAllAgencies() || changed;
}

import { agencies } from "./store.js";
function processAllAgencies(){
  let changed = false;
  for(const a of agencies.values()){
    if(a.settlementMode !== "T_PLUS_1") continue;
    const due = a.pendingSettlements.filter(t => t.status === "PENDING" && t.settleAt <= now());
    if(!due.length) continue;

    // Net by userId+symbol for tokens and USD
    const net = new Map(); // key = userId -> { usd:0, tokens:{sym:0}}
    function ensureNet(uid){
      if(!net.has(uid)) net.set(uid, { usd:0, tokens:Object.fromEntries(SYMBOLS.map(s=>[s,0])) });
      return net.get(uid);
    }

    for(const t of due){
      const buyerNet = ensureNet(t.buyerId);
      const sellerNet = ensureNet(t.sellerId);
      buyerNet.tokens[t.symbol] += t.qty;
      sellerNet.usd += t.qty * t.price;
      t.status = "SETTLED";
      addBlock("TRADE_SETTLED", t);
    }

    // apply net movements
    for(const [uid, n] of net.entries()){
      const u = user(a.id, uid);
      u.usd += n.usd;
      for(const s of SYMBOLS) u.tokens[s] += n.tokens[s];
    }

    // remove settled
    a.pendingSettlements = a.pendingSettlements.filter(t => t.status !== "SETTLED");
    addBlock("BATCH_NETTING_APPLIED", { agencyId:a.id, settledCount: due.length });
    changed = true;
  }
  return changed;
}
