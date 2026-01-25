// store.js
export const SYMBOLS = ["AAPL", "MSFT", "TSLA"];

export class Agency {
  constructor({ agencyId, name }){
    this.id = agencyId;
    this.name = name || agencyId;
    this.settlementMode = "INSTANT"; // or "T_PLUS_1"
    this.tPlusDelaySeconds = 30; // simulated "T+1" delay
    this.cbPct = 10; // circuit breaker % move
    this.cbHaltSeconds = 30;

    this.users = new Map(); // userId -> User
    this.orderBooks = new Map(); // symbol -> { bids:[], asks:[] }
    this.orders = new Map(); // orderId -> Order
    this.trades = []; // last trades
    this.pendingSettlements = []; // pending trades for T+1 settlement

    // circuit breaker per symbol
    this.halts = {}; // symbol -> { haltedUntil, reason, refPrice }

    for(const s of SYMBOLS){
      this.orderBooks.set(s, { bids:[], asks:[] });
      this.halts[s] = { haltedUntil: 0, reason: "", refPrice: defaultRefPrice(s) };
    }
  }

  public(){
    return {
      id: this.id,
      name: this.name,
      settlementMode: this.settlementMode,
      tPlusDelaySeconds: this.tPlusDelaySeconds,
      cbPct: this.cbPct,
      cbHaltSeconds: this.cbHaltSeconds,
      halts: this.halts
    };
  }
}

export class User {
  constructor({ agencyId, id, name }){
    this.agencyId = agencyId;
    this.id = id;
    this.name = name;
    this.verified = false;
    this.frozen = false;
    this.flags = {
      suspicious: false,
      highVelocity: false,
      oversizedOrders: false
    };
    this.usd = 0;
    this.tokens = Object.fromEntries(SYMBOLS.map(s=>[s,0]));
    this.stats = {
      ordersLastMinute: [], // timestamps
    };
  }

  public(){
    return {
      agencyId: this.agencyId,
      id: this.id,
      name: this.name,
      verified: this.verified,
      frozen: this.frozen,
      flags: this.flags,
      usd: this.usd,
      tokens: this.tokens
    };
  }
}

export const agencies = new Map();

export function defaultRefPrice(symbol){
  if(symbol === "AAPL") return 150;
  if(symbol === "MSFT") return 320;
  if(symbol === "TSLA") return 220;
  return 100;
}

export function ensureAgency(agencyId, name){
  const id = (agencyId || "").trim();
  if(!id) throw new Error("agencyId required");
  if(!agencies.has(id)){
    agencies.set(id, new Agency({ agencyId:id, name }));
  }
  return agencies.get(id);
}

export function getAgency(){
  return agencies;
}

export function createUser({ agencyId, id, name }){
  const a = ensureAgency(agencyId);
  if(a.users.has(id)) throw new Error("User already exists in this agency");
  const u = new User({ agencyId, id, name });
  a.users.set(id, u);
  return u;
}

export function user(agencyId, userId){
  const a = ensureAgency(agencyId);
  const u = a.users.get(userId);
  if(!u) throw new Error("User not found");
  return u;
}

export function book(agencyId, symbol){
  const a = ensureAgency(agencyId);
  const ob = a.orderBooks.get(symbol);
  if(!ob) throw new Error("UNKNOWN_SYMBOL");
  return ob;
}

export function snapshot(agencyId=null){
  // If agencyId null => full multi-tenant snapshot for UI
  const agenciesOut = [...agencies.values()].map(a => a.public());

  const scoped = agencyId ? [ensureAgency(agencyId)] : [...agencies.values()];
  const users = [];
  const books = {};
  const trades = [];

  for(const a of scoped){
    for(const u of a.users.values()){
      users.push(u.public());
    }
    for(const [sym, ob] of a.orderBooks.entries()){
      const key = `${a.id}:${sym}`;
      books[key] = {
        agencyId: a.id,
        symbol: sym,
        bids: ob.bids.map(o => stripOrder(o)),
        asks: ob.asks.map(o => stripOrder(o)),
        halted: a.halts[sym].haltedUntil > Date.now(),
        haltedUntil: a.halts[sym].haltedUntil,
        haltReason: a.halts[sym].reason,
        refPrice: a.halts[sym].refPrice,
      };
    }
    trades.push(...a.trades.slice(-50).map(t => ({...t})));
  }

  return { agencies: agenciesOut, users, books, trades };
}

export function stripOrder(o){
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
