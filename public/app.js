/* ============================================================
   FACETS CONFIGURATION SOFTWARE - CLIENT JS
   ============================================================ */

const API = '';

// ============================================================
// AUTH
// ============================================================
const Auth = {
  token: null,
  user: null,

  init() {
    this.token = localStorage.getItem('facets_token');
    const userData = localStorage.getItem('facets_user');
    if (userData) this.user = JSON.parse(userData);
  },

  async login(username, password) {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('facets_token', this.token);
    localStorage.setItem('facets_user', JSON.stringify(this.user));
    return data;
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('facets_token');
    localStorage.removeItem('facets_user');
    window.location.href = '/';
  },

  async request(method, path, body) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    if (res.status === 401 || res.status === 403) { this.logout(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  delete(path) { return this.request('DELETE', path); },
};

// ============================================================
// TOAST
// ============================================================
function toast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || icons.info}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3500);
}

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function confirm(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-header"><span class="modal-title">Confirm Action</span></div>
        <div class="modal-body"><p style="color:var(--gray-300)">${message}</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="confirm-no">Cancel</button>
          <button class="btn btn-danger" id="confirm-yes">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirm-yes').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#confirm-no').onclick = () => { overlay.remove(); resolve(false); };
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

// ============================================================
// FORMATTING HELPERS
// ============================================================
function fmtMoney(val) {
  if (val == null || val === '') return '—';
  return '$' + parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function badge(val, type) {
  const t = type || (val || '').toLowerCase().replace(/\s/g, '_');
  return `<span class="badge badge-${t}">${val || 'N/A'}</span>`;
}

function initials(name) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
}

// ============================================================
// SIDEBAR INIT
// ============================================================
function initLayout() {
  if (!Auth.token) return;

  const page = window.location.pathname.replace('/', '') || 'index';

  // Set user info
  const userNameEl = document.getElementById('user-name');
  const userRoleEl = document.getElementById('user-role');
  const userAvatarEl = document.getElementById('user-avatar');

  if (Auth.user) {
    if (userNameEl) userNameEl.textContent = Auth.user.full_name;
    if (userRoleEl) userRoleEl.textContent = Auth.user.role;
    if (userAvatarEl) userAvatarEl.textContent = initials(Auth.user.full_name);
  }

  // Mark active nav
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    if (el.dataset.page === page) el.classList.add('active');
  });
}

// ============================================================
// GUARD - Redirect to login if not authenticated
// ============================================================
function requireAuth() {
  Auth.init();
  if (!Auth.token) { window.location.href = '/'; return false; }
  return true;
}

// ============================================================
// PAGINATION HELPER
// ============================================================
class Paginator {
  constructor({ container, infoEl, onPage }) {
    this.container = container;
    this.infoEl = infoEl;
    this.onPage = onPage;
    this.page = 1;
    this.total = 0;
    this.limit = 20;
  }

  render() {
    const totalPages = Math.ceil(this.total / this.limit);
    const start = Math.min((this.page - 1) * this.limit + 1, this.total);
    const end = Math.min(this.page * this.limit, this.total);

    if (this.infoEl) {
      this.infoEl.textContent = this.total === 0 ? 'No results' : `Showing ${start}–${end} of ${this.total}`;
    }

    if (!this.container) return;
    this.container.innerHTML = '';

    const prev = document.createElement('button');
    prev.textContent = '←';
    prev.disabled = this.page <= 1;
    prev.onclick = () => { this.page--; this.onPage(this.page); };
    this.container.appendChild(prev);

    const maxPages = 7;
    const pages = [];
    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.page > 3) pages.push('...');
      for (let i = Math.max(2, this.page-1); i <= Math.min(totalPages-1, this.page+1); i++) pages.push(i);
      if (this.page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    pages.forEach(p => {
      const btn = document.createElement('button');
      btn.textContent = p;
      if (p === '...') { btn.disabled = true; }
      else {
        if (p === this.page) btn.classList.add('active');
        btn.onclick = () => { this.page = p; this.onPage(p); };
      }
      this.container.appendChild(btn);
    });

    const next = document.createElement('button');
    next.textContent = '→';
    next.disabled = this.page >= totalPages;
    next.onclick = () => { this.page++; this.onPage(this.page); };
    this.container.appendChild(next);
  }

  update(total, page) {
    this.total = total;
    this.page = page;
    this.render();
  }
}

// ============================================================
// EXPORT TO CSV
// ============================================================
function exportCSV(data, filename) {
  if (!data || !data.length) { toast('No data to export', 'warning'); return; }
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row =>
    keys.map(k => {
      const val = row[k] != null ? String(row[k]) : '';
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g,'""')}"` : val;
    }).join(',')
  )].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
  toast('Export complete', 'success');
}

// ============================================================
// Auto-init on page load
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  initLayout();

  // Close modals on overlay click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.add('hidden');
    }
  });

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.onclick = () => Auth.logout();
});
