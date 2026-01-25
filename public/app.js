let isLoginMode = true;
let selectedCoords = null;
let map, markers = [], polyline;

async function handleAuth() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await fetch(isLoginMode ? '/api/login' : '/api/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });
    if (res.ok) isLoginMode ? initApp() : toggleAuthMode();
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Login' : 'Sign Up';
}

async function initApp() {
    const res = await fetch('/api/me');
    const { user } = await res.json();
    if (!user) return;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    document.getElementById('user-display').innerText = user;
    initMap(); updateUI();
}

function initMap() {
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    polyline = L.polyline([], {color: '#3498db'}).addTo(map);
    map.on('click', e => {
        selectedCoords = e.latlng;
        document.getElementById('coords').value = `${e.latlng.lat.toFixed(2)},${e.latlng.lng.toFixed(2)}`;
    });
}

async function updateUI() {
    const res = await fetch('/api/history');
    const history = await res.json();
    document.getElementById('timeline').innerHTML = history.map(b => `
        <div class="block"><h4>${b.status}</h4><p>${b.location}</p><small>${b.hash.substring(0,8)}</small></div>
    `).join(' → ');
    
    markers.forEach(m => map.removeLayer(m));
    const pts = history.map(b => {
        markers.push(L.marker([b.lat, b.lng]).addTo(map));
        return [b.lat, b.lng];
    });
    polyline.setLatLngs(pts);
    fetchLogs();
}

async function addStep() {
    await fetch('/api/update', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            status: document.getElementById('stage').value,
            location: document.getElementById('city').value,
            lat: selectedCoords.lat, lng: selectedCoords.lng
        })
    });
    updateUI();
}

async function fetchLogs() {
    const res = await fetch('/api/logs');
    const logs = await res.json();
    document.getElementById('audit-body').innerHTML = logs.map(l => `
        <tr><td>${l.timestamp}</td><td>${l.user}</td><td>${l.action}</td><td>${l.details}</td></tr>
    `).join('');
}

async function verifyChain() {
    const res = await fetch('/api/verify');
    const { isValid } = await res.json();
    const s = document.getElementById('v-status');
    s.innerText = isValid ? "✅ Verified" : "❌ Compromised";
    s.style.color = isValid ? "green" : "red";
}

async function simulateTamper() {
    await fetch('/api/tamper', {method: 'POST'});
    updateUI();
}

async function logout() {
    await fetch('/api/logout', {method: 'POST'});
    location.reload();
}

initApp();
