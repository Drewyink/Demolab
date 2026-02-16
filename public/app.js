const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
const money = (n) => `$${Number(n).toFixed(2)}`;

function setActive(navId){
  $$(".sidebtn").forEach(b => b.classList.toggle("active", b.dataset.nav === navId));
}

async function api(url, opts){
  const res = await fetch(url, { headers: { "Content-Type":"application/json" }, ...opts });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}
