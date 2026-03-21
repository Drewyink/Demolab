// ─── FACETS APP.JS ────────────────────────────────────────────────────────────

const toastContainer = (() => {
  const el = document.createElement('div');
  el.className = 'toast-container';
  document.body.appendChild(el);
  return el;
})();

function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span style="font-size:16px;font-weight:700">${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  toastContainer.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100%)'; t.style.transition='0.3s'; setTimeout(()=>t.remove(),300); }, 3500);
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try { const d = await res.json(); errMsg = d.error || d.message || errMsg; } catch { try { errMsg = await res.text() || errMsg; } catch {} }
    toast(`Error: ${errMsg}`, 'error');
    throw new Error(errMsg);
  }
  return res.json();
}

function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `<div class="modal" style="width:380px"><div class="modal-header"><span class="modal-title">⚠ Confirm</span></div><div class="modal-body"><p style="color:var(--text2);line-height:1.6">${msg}</p></div><div class="modal-footer"><button class="btn btn-secondary" id="conf-no">Cancel</button><button class="btn btn-danger" id="conf-yes">Delete</button></div></div>`;
    document.body.appendChild(overlay);
    document.getElementById('conf-no').onclick = () => { overlay.remove(); resolve(false); };
    document.getElementById('conf-yes').onclick = () => { overlay.remove(); resolve(true); };
  });
}

function currency(v) {
  return '$' + parseFloat(v||0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); } catch { return '—'; }
}

function relTime(ts) {
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff/60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m/60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  } catch { return '—'; }
}

function badge(text, type) {
  if (!text) return '—';
  return `<span class="badge badge-${(type||text).toLowerCase().replace(/[\s_]+/g,'-')}">${text}</span>`;
}

function genCode(prefix, length = 3) {
  return `${prefix}-${Math.floor(Math.random()*Math.pow(10,length)).toString().padStart(length,'0')}`;
}

function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const update = () => { el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }); };
  update(); setInterval(update, 1000);
}

function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(el => {
    const href = el.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) el.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', () => { startClock(); setActiveNav(); });
