// ledger.js
import crypto from "crypto";

export const ledger = {
  chain: [],
  validators: [
    { id:"v1", secret:"validator_secret_1" },
    { id:"v2", secret:"validator_secret_2" },
    { id:"v3", secret:"validator_secret_3" },
  ],
  quorum: 2
};

function sha256(str){
  return crypto.createHash("sha256").update(str).digest("hex");
}

function hmac(secret, msg){
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

function signBlockHash(hash){
  // simulate permissioned validator signatures
  const sigs = ledger.validators.map(v => ({
    validatorId: v.id,
    sig: hmac(v.secret, hash)
  }));
  // return all signatures, verification checks quorum validity
  return sigs;
}

export function initLedger(){
  if(ledger.chain.length) return;
  const block = {
    index: 0,
    ts: Date.now(),
    type: "GENESIS",
    data: { msg: "Permissioned Tokenized Exchange Ledger" },
    prevHash: "0".repeat(64),
  };
  const clone = { ...block };
  const hash = sha256(JSON.stringify(clone));
  block.hash = hash;
  block.sigs = signBlockHash(hash);
  ledger.chain.push(block);
}

export function addBlock(type, data){
  const prev = ledger.chain[ledger.chain.length - 1];
  const block = {
    index: prev.index + 1,
    ts: Date.now(),
    type,
    data,
    prevHash: prev.hash,
  };
  const clone = { ...block };
  const hash = sha256(JSON.stringify(clone));
  block.hash = hash;
  block.sigs = signBlockHash(hash);
  ledger.chain.push(block);
  return block;
}

export function verifyChain(){
  // verify hash links + signatures (quorum)
  for(let i=1;i<ledger.chain.length;i++){
    const b = ledger.chain[i];
    const prev = ledger.chain[i-1];
    if(b.prevHash !== prev.hash) return { ok:false, at:i, reason:"prevHash mismatch" };

    const clone = { ...b };
    delete clone.hash;
    delete clone.sigs;
    const recompute = sha256(JSON.stringify(clone));
    if(b.hash !== recompute) return { ok:false, at:i, reason:"hash mismatch" };

    // quorum sigs
    let valid = 0;
    for(const s of (b.sigs||[])){
      const v = ledger.validators.find(x=>x.id===s.validatorId);
      if(!v) continue;
      const expected = hmac(v.secret, b.hash);
      if(expected === s.sig) valid++;
    }
    if(valid < ledger.quorum) return { ok:false, at:i, reason:"insufficient validator sigs" };
  }
  return { ok:true };
}
