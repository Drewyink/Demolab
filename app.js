// public/app.js (Accounts + Saved Results)
const $ = (id)=>document.getElementById(id);

let fileBlob = null;
let fileName = null;
let presets = [];
let me = null;

async function api(path, method="GET", body=null){
  const opts = { method, body, headers: {} };
  if(body && !(body instanceof FormData)){
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function setStatus(msg){ $("status").textContent = msg; }
function setAuthState(msg){ $("authState").textContent = msg; }

function renderPresets(){
  $("preset").innerHTML = presets.map(p=>`<option value="${p.id}">${p.label}</option>`).join("");
  $("presetChips").innerHTML = presets.map(p=>`<div class="chip" data-id="${p.id}">${p.label}</div>`).join("");
  [...$("presetChips").querySelectorAll(".chip")].forEach(chip=>{
    chip.onclick = ()=>{ $("preset").value = chip.dataset.id; };
  });
}

function renderResults(){
  const wrap = $("results");
  const list = me?.results || [];
  if(!me){
    wrap.innerHTML = `<div class="small muted">Log in to see and save your results.</div>`;
    return;
  }
  if(list.length === 0){
    wrap.innerHTML = `<div class="small muted">No saved outputs yet. Generate an age preset.</div>`;
    return;
  }
  wrap.innerHTML = list.map(r=>{
    const presetObj = presets.find(p=>p.id===r.preset);
    return `
      <div class="result-card">
        <img src="${r.outputUrl}" alt="${r.preset}"/>
        <div class="meta">
          <div>
            <div class="mono small">${presetObj?.label || r.preset}</div>
            <div class="small muted">${new Date(r.createdAt).toLocaleString()}</div>
          </div>
          <a class="btn secondary" href="${r.outputUrl}" download>Download</a>
        </div>
      </div>
    `;
  }).join("");
}

function updateAuthUI(){
  if(me?.user){
    setAuthState(`Logged in as: ${me.user.name} (${me.user.email})`);
    $("authForms").classList.add("hidden");
    $("btnLogout").classList.remove("hidden");
  }else{
    setAuthState("Not logged in. Create an account or log in to save results.");
    $("authForms").classList.remove("hidden");
    $("btnLogout").classList.add("hidden");
  }
  renderResults();
}

async function refreshMe(){
  try{
    me = await api("/api/me");
  }catch{
    me = null;
  }
  updateAuthUI();
}

async function loadPresets(){
  const out = await api("/api/presets");
  presets = out.presets;
  renderPresets();
}

function showPreview(blob){
  const url = URL.createObjectURL(blob);
  $("preview").src = url;
  $("previewWrap").classList.remove("hidden");
}

$("btnLoad").onclick = ()=>{
  const f = $("file").files?.[0];
  if(!f) return alert("Choose a file first");
  fileBlob = f;
  fileName = f.name;
  showPreview(f);
  setStatus(`Loaded: ${f.name} (${Math.round(f.size/1024)} KB)`);
};

$("btnClear").onclick = ()=>{
  fileBlob = null;
  fileName = null;
  $("file").value = "";
  $("previewWrap").classList.add("hidden");
  $("preview").src = "";
  setStatus("Cleared.");
};

$("btnSignup").onclick = async ()=>{
  try{
    const name = $("suName").value.trim();
    const email = $("suEmail").value.trim();
    const password = $("suPass").value;
    setAuthState("Creating account...");
    await api("/api/auth/signup", "POST", { name, email, password });
    await refreshMe();
    setAuthState("Account created ✅");
  }catch(e){
    setAuthState("Error: " + e.message);
  }
};

$("btnLogin").onclick = async ()=>{
  try{
    const email = $("liEmail").value.trim();
    const password = $("liPass").value;
    setAuthState("Logging in...");
    await api("/api/auth/login", "POST", { email, password });
    await refreshMe();
    setAuthState("Logged in ✅");
  }catch(e){
    setAuthState("Error: " + e.message);
  }
};

$("btnLogout").onclick = async ()=>{
  await api("/api/auth/logout", "POST", {});
  me = null;
  updateAuthUI();
  setAuthState("Logged out.");
};

$("btnRefreshMe").onclick = refreshMe;

$("btnGenerate").onclick = async ()=>{
  try{
    if(!me) throw new Error("Please log in first.");
    if(!fileBlob) throw new Error("Upload and load a selfie first.");

    const presetId = $("preset").value;
    const presetObj = presets.find(p=>p.id===presetId);

    setStatus(`Generating ${presetObj?.label || presetId}...`);
    const fd = new FormData();
    fd.append("image", fileBlob, fileName || "selfie.jpg");
    fd.append("preset", presetId);

    const out = await api("/api/age", "POST", fd);
    setStatus(`Done ✅ Generated ${presetObj?.label || presetId}`);

    // refresh saved results
    await refreshMe();
  }catch(e){
    setStatus("Error: " + e.message);
  }
};

// boot
(async ()=>{
  await loadPresets();
  await refreshMe();
  renderResults();
})();
