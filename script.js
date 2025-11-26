// script.js — application logic for index.html + dashboard.html

/* ---------------- Helpers ---------------- */
const uid = (pref='ID') => pref + '-' + Math.random().toString(36).slice(2,9).toUpperCase();
const daysBetween = (a,b) => Math.ceil((new Date(b) - new Date(a)) / (24*3600*1000));
const fmt = d => new Date(d).toLocaleDateString();
const clamp = (v,min,max) => Math.max(min, Math.min(max, v));

/* ---------------- Ensure demo data exists ---------------- */
(function ensureDemoData(){
  if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify(window.DEMO_USERS || []));
  if (!localStorage.getItem('drugs')) localStorage.setItem('drugs', JSON.stringify(window.DEMO_DRUGS || []));
})();

/* ---------------- INDEX PAGE LOGIC ---------------- */
if (location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/index.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const demoBtn = document.getElementById('demoBtn');
    const backToLogin = document.getElementById('backToLogin');

    // toggle tabs
    loginTab.addEventListener('click', () => { loginTab.classList.add('active'); signupTab.classList.remove('active'); loginForm.style.display='block'; signupForm.style.display='none'; });
    signupTab.addEventListener('click', () => { signupTab.classList.add('active'); loginTab.classList.remove('active'); signupForm.style.display='block'; loginForm.style.display='none'; });

    // fill departments in signup and login
    const signupDept = document.getElementById('signupDept');
    const loginDept = document.getElementById('loginDept');
    (window.DEPARTMENTS || []).forEach(d => { signupDept.appendChild(new Option(d,d)); loginDept.appendChild(new Option(d,d)); });

    // show dept select only for non-admin in login
    const loginRole = document.getElementById('loginRole');
    loginRole.addEventListener('change', e => {
      const lbl = document.getElementById('loginDeptLabel');
      lbl.style.display = e.target.value === 'Admin' ? 'none' : 'block';
    });
    // default toggle
    loginRole.dispatchEvent(new Event('change'));

    // demo auto login (pharmacist)
    demoBtn.addEventListener('click', () => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const demo = users.find(u => u.email === 'pharma@hospital.local') || users[0];
      if (!demo) return alert('No demo users present');
      const session = { email: demo.email, name: demo.name, role: demo.role, department: demo.department };
      localStorage.setItem('session', JSON.stringify(session));
      window.location.href = 'dashboard.html';
    });

    // login submit
    loginForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const pass = document.getElementById('loginPass').value;
      const role = document.getElementById('loginRole').value;
      const dept = role === 'Admin' ? 'All' : document.getElementById('loginDept').value;
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const found = users.find(u => u.email.toLowerCase() === email && u.password === pass && u.role === role && (role === 'Admin' || u.department === dept));
      if (!found) { alert('Invalid credentials. Use demo accounts or sign up.'); return; }
      const session = { email: found.email, name: found.name, role: found.role, department: found.role === 'Admin' ? 'All' : found.department };
      localStorage.setItem('session', JSON.stringify(session));
      window.location.href = 'dashboard.html';
    });

    // signup submit
    signupForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim().toLowerCase();
      const pass = document.getElementById('signupPass').value;
      const role = document.getElementById('signupRole').value;
      const dept = document.getElementById('signupDept').value;
      if (!name || !email || !pass) return alert('Please fill all signup fields.');
      let users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.find(u => u.email.toLowerCase() === email)) return alert('User already exists.');
      const newUser = { email, password: pass, role, department: role === 'Admin' ? 'All' : dept, name };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      alert('Account created. You can now login.');
      // switch to login
      loginTab.click();
    });

    backToLogin.addEventListener('click', () => loginTab.click());
  });
}

/* ---------------- DASHBOARD PAGE LOGIC ---------------- */
if (location.pathname.endsWith('dashboard.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    // data
    let DRUGS = JSON.parse(localStorage.getItem('drugs') || '[]');
    const USERS = JSON.parse(localStorage.getItem('users') || '[]');
    const session = JSON.parse(localStorage.getItem('session') || 'null');
    if (!session) { window.location.href = 'index.html'; return; }

    // dom refs
    const welcome = document.getElementById('welcome');
    const logoutBtn = document.getElementById('logoutBtn');
    const deptFilter = document.getElementById('deptFilter');
    const inventoryTbody = document.querySelector('#inventoryTable tbody');
    const totalDrugsEl = document.getElementById('totalDrugs');
    const lowStockEl = document.getElementById('lowStock');
    const expiringSoonEl = document.getElementById('expiringSoon');
    const tempRisksEl = document.getElementById('tempRisks');
    const addBtn = document.getElementById('addBtn');
    const searchInput = document.getElementById('searchInput');
    const scanInput = document.getElementById('scanInput');
    const addScanBtn = document.getElementById('scanBtn');
    const toggleSim = document.getElementById('toggleSim');
    const exportBtn = document.getElementById('exportBtn');
    const alertsList = document.getElementById('alertsList');
    const forecastDrug = document.getElementById('forecastDrug');
    const forecastMonths = document.getElementById('forecastMonths');
    const generateForecast = document.getElementById('generateForecast');
    const forecastCanvas = document.getElementById('forecastChart');

    welcome.textContent = `${session.name} • ${session.role} • ${session.department}`;
    document.getElementById('sessionInfo').textContent = `${session.name} • ${session.role}`;

    logoutBtn.addEventListener('click', () => { localStorage.removeItem('session'); window.location.href='index.html'; });

    // NAV VIEW SWITCH
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        document.getElementById('inventoryView').style.display = view === 'inventory' ? 'block' : 'none';
        document.getElementById('alertsView').style.display = view === 'alerts' ? 'block' : 'none';
        document.getElementById('forecastView').style.display = view === 'forecast' ? 'block' : 'none';
      });
    });

    // populate dept filter
    function populateDeptFilter(){
      deptFilter.innerHTML = '';
      const all = document.createElement('option'); all.value = 'All'; all.textContent='All Departments'; deptFilter.appendChild(all);
      (window.DEPARTMENTS || []).forEach(d => { deptFilter.appendChild(new Option(d,d)); });
      if (session.role !== 'Admin') deptFilter.value = session.department;
    }
    populateDeptFilter();

    // visible drugs based on role & filter
    function visibleDrugs(){
      let arr = DRUGS.slice();
      if (session.role !== 'Admin') arr = arr.filter(d => d.department === session.department);
      const df = deptFilter.value || 'All';
      if (df !== 'All') arr = arr.filter(d => d.department === df);
      return arr;
    }

    // render table
    function renderInventory(){
      inventoryTbody.innerHTML = '';
      const q = (searchInput.value || '').trim().toLowerCase();
      const list = visibleDrugs().filter(d => !q || d.name.toLowerCase().includes(q) || (d.barcode && d.barcode.toLowerCase().includes(q)) || d.id.toLowerCase().includes(q));
      // FEFO
      list.sort((a,b) => new Date(a.expiry) - new Date(b.expiry));
      list.forEach(d => {
        const tr = document.createElement('tr');
        const days = daysBetween(new Date(), new Date(d.expiry));
        const tempOk = d.temp >= d.safeRange.min && d.temp <= d.safeRange.max;
        tr.innerHTML = `
          <td><strong>${d.name}</strong><div class="muted small">${d.id} • ${d.barcode || ''}</div></td>
          <td>${d.department}</td>
          <td>${d.stock}</td>
          <td>${fmt(d.expiry)} <div class="muted small">${days}d</div></td>
          <td>${d.temp.toFixed(1)}°C ${tempOk ? '' : '<span style="color:var(--danger);font-weight:700">⚠</span>'}</td>
          <td>${d.restockAt}</td>
          <td class="actions"></td>
        `;
        // actions
        const actionsTd = tr.querySelector('.actions');
        const edit = document.createElement('button'); edit.className='btn'; edit.textContent='Edit';
        edit.addEventListener('click', ()=> openDrugModal('edit', d));
        const restock = document.createElement('button'); restock.className='btn ghost'; restock.textContent='Restock';
        restock.addEventListener('click', ()=> openDrugModal('restock', d));
        const del = document.createElement('button'); del.className='btn ghost'; del.textContent='Delete';
        del.addEventListener('click', ()=> { if (confirm(`Delete ${d.name}?`)) { DRUGS = DRUGS.filter(x=>x.id!==d.id); save(); renderInventory(); renderAlerts(); } });
        actionsTd.appendChild(edit); actionsTd.appendChild(restock); actionsTd.appendChild(del);
        inventoryTbody.appendChild(tr);
      });
      updateOverview();
      populateForecastSelect();
    }

    // overview
    function updateOverview(){
      const v = visibleDrugs();
      totalDrugsEl.textContent = v.length;
      lowStockEl.textContent = v.filter(d=>d.stock <= d.restockAt).length;
      expiringSoonEl.textContent = v.filter(d=>daysBetween(new Date(), new Date(d.expiry)) <= 30).length;
      tempRisksEl.textContent = v.filter(d=>d.temp < d.safeRange.min || d.temp > d.safeRange.max).length;
    }

    // save
    function save(){ localStorage.setItem('drugs', JSON.stringify(DRUGS)); }

    // add button
    addBtn.addEventListener('click', ()=> openDrugModal('add', null));

    // quick scan / add
    addScanBtn.addEventListener('click', ()=> {
      const q = (scanInput.value||'').trim();
      if (!q) return alert('Enter barcode or name to scan');
      const found = DRUGS.find(d => d.barcode === q || d.id === q || d.name.toLowerCase() === q.toLowerCase());
      if (found) { openDrugModal('edit', found); } else {
        // open add modal and prefill
        openDrugModal('add', null, q);
      }
      scanInput.value = '';
    });

    // dept filter + search events
    deptFilter.addEventListener('change', ()=> { renderInventory(); renderAlerts(); });
    searchInput.addEventListener('input', ()=> renderInventory());

    /* Alerts auto-gen + log */
    const ALERT_LOG = [];
    function pushAlert(level, text) {
      ALERT_LOG.unshift({ id: uid('A'), level, text, at: new Date().toISOString() });
      if (ALERT_LOG.length>200) ALERT_LOG.pop();
      renderAlerts();
    }
    function renderAlerts(){
      alertsList.innerHTML = '';
      // autos
      const autos = [];
      visibleDrugs().forEach(d => {
        const days = daysBetween(new Date(), new Date(d.expiry));
        if (days <= 30) autos.push({level: days<=7 ? 'critical':'warn', text:`Expiring: ${d.name} in ${days} days`});
        if (d.stock <= d.restockAt) autos.push({level:'warn', text:`Low stock: ${d.name} (${d.stock})`});
        if (d.temp < d.safeRange.min || d.temp > d.safeRange.max) autos.push({level:'critical', text:`Temp alert: ${d.name} ${d.temp.toFixed(1)}°C (safe ${d.safeRange.min}-${d.safeRange.max})`});
      });
      autos.forEach(a => {
        const div = document.createElement('div'); div.className='alert'; div.innerHTML = `<strong>${a.text}</strong><div class="muted small">${new Date().toLocaleString()}</div>`;
        alertsList.appendChild(div);
      });
      if (ALERT_LOG.length){
        const hr = document.createElement('hr'); alertsList.appendChild(hr);
        ALERT_LOG.slice(0,30).forEach(a => {
          const div = document.createElement('div'); div.className='alert'; div.innerHTML = `<div>${a.text}</div><div class="muted small">${new Date(a.at).toLocaleString()}</div>`;
          alertsList.appendChild(div);
        });
      }
    }

    /* Modal — create/edit/restock */
    function openDrugModal(mode='add', drug=null, prefill='') {
      // create modal overlay
      const overlay = document.createElement('div'); overlay.style = 'position:fixed;inset:0;background:rgba(6,12,30,0.45);display:flex;align-items:center;justify-content:center;z-index:9999';
      const card = document.createElement('div'); card.style = 'width:720px;max-width:94%;background:#fff;padding:18px;border-radius:12px';
      const title = document.createElement('h3'); title.textContent = mode==='add' ? 'Add Drug' : mode==='edit' ? `Edit — ${drug.name}` : `Restock — ${drug.name}`;
      const form = document.createElement('div');
      form.style = 'display:flex;flex-direction:column;gap:8px;margin-top:10px';
      if (mode === 'restock') {
        form.innerHTML = `<label>Amount to add<input id="m_amount" type="number" value="50"></label>`;
      } else {
        form.innerHTML = `
          <label>Name<input id="m_name" value="${drug?drug.name:''}"></label>
          <label>Barcode<input id="m_barcode" value="${drug?drug.barcode:prefill}"></label>
          <label>Department
            <select id="m_dept">${window.DEPARTMENTS.map(d=>`<option value="${d}" ${drug && drug.department===d ? 'selected':''}>${d}</option>`).join('')}</select>
          </label>
          <label>Stock<input id="m_stock" type="number" value="${drug?drug.stock:0}"></label>
          <label>Expiry<input id="m_expiry" type="date" value="${drug?new Date(drug.expiry).toISOString().slice(0,10):''}"></label>
          <label>Temperature (°C)<input id="m_temp" type="number" step="0.1" value="${drug?drug.temp:22}"></label>
          <label>Restock threshold<input id="m_restock" type="number" value="${drug?drug.restockAt:50}"></label>
          <label>Safe temp range (min-max)<input id="m_safe" value="${drug?drug.safeRange.min+'-'+drug.safeRange.max:''}"></label>
        `;
      }
      const actions = document.createElement('div'); actions.style = 'display:flex;gap:8px;justify-content:flex-end;margin-top:8px';
      const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Cancel';
      const save = document.createElement('button'); save.className='btn primary'; save.textContent = mode==='restock' ? 'Restock' : 'Save';
      actions.appendChild(cancel); actions.appendChild(save);
      card.appendChild(title); card.appendChild(form); card.appendChild(actions);
      overlay.appendChild(card); document.body.appendChild(overlay);
      cancel.addEventListener('click', ()=> overlay.remove());
      save.addEventListener('click', ()=> {
        if (mode === 'restock') {
          const amt = Number(card.querySelector('#m_amount').value)||0;
          drug.stock = Math.max(0, drug.stock + amt);
          save(); pushAlert('info', `Restocked ${drug.name} +${amt}`); renderInventory(); overlay.remove(); return;
        }
        const name = card.querySelector('#m_name').value.trim();
        if (!name) return alert('Name required');
        const barcode = card.querySelector('#m_barcode').value.trim();
        const department = card.querySelector('#m_dept').value;
        const stock = Number(card.querySelector('#m_stock').value)||0;
        const expVal = card.querySelector('#m_expiry').value;
        const expiry = expVal ? new Date(expVal).toISOString() : new Date(Date.now()+365*24*3600*1000).toISOString();
        const temp = Number(card.querySelector('#m_temp').value)||22;
        const restockAt = Number(card.querySelector('#m_restock').value)||50;
        const safeRaw = card.querySelector('#m_safe').value || '2-30';
        const parts = safeRaw.split('-').map(s=>Number(s.trim())||0);
        const safeRange = { min: parts[0]||2, max: parts[1]||30 };
        if (mode === 'edit') {
          drug.name = name; drug.barcode = barcode; drug.department = department; drug.stock = stock;
          drug.expiry = expiry; drug.temp = temp; drug.restockAt = restockAt; drug.safeRange = safeRange;
          save(); pushAlert('info', `Updated ${drug.name}`); renderInventory(); overlay.remove(); return;
        } else {
          const newDrug = { id: uid('D'), name, barcode, department, stock, expiry, temp, restockAt, safeRange };
          DRUGS.push(newDrug); save(); pushAlert('success', `Added ${name}`); renderInventory(); overlay.remove(); return;
        }
      });
    }

    /* Simulate IoT (5s) */
    let simTimer = null;
    let SIM_ON = true;
    function startSim(){
      if (simTimer) clearInterval(simTimer);
      simTimer = setInterval(()=> {
        DRUGS.forEach(d => {
          const delta = (Math.random()*2 - 1);
          const spike = (Math.random() < 0.03) ? (Math.random() < 0.5 ? -4 : 4) : 0;
          d.temp = clamp(d.temp + delta + spike, -10, 60);
          if (Math.random() < 0.03) d.stock = Math.max(0, d.stock - Math.floor(Math.random()*2));
        });
        save(); // persist
        // auto alerts
        DRUGS.forEach(d => {
          if (d.temp < d.safeRange.min - 1 || d.temp > d.safeRange.max + 1) pushAlert('critical', `IoT: ${d.name} temp ${d.temp.toFixed(1)}°C`);
          if (d.stock <= d.restockAt - 5) pushAlert('warn', `Stock dipping: ${d.name} ${d.stock}`);
        });
        renderInventory();
      }, 5000);
    }
    function stopSim(){ if (simTimer) clearInterval(simTimer); simTimer = null; }
    toggleSim.addEventListener('click', ()=> {
      SIM_ON = !SIM_ON;
      if (SIM_ON) { startSim(); toggleSim.textContent='Stop IoT'; } else { stopSim(); toggleSim.textContent='Start IoT'; }
    });
    startSim();

    /* Forecasting */
    function simulateHistory(drug, months=12){
      const base = Math.max(3, Math.round(drug.stock/8));
      const arr = [];
      for (let i=0;i<months;i++){
        const seasonal = 1 + 0.12*Math.sin((i/12)*Math.PI*2 + (drug.name.length%5));
        const noise = (Math.random()-0.5)*0.3;
        arr.push(Math.max(0, Math.round(base * seasonal * (1+noise))));
      }
      return arr;
    }
    function linearForecast(hist, future){
      const n = hist.length;
      if (n < 2) return Array(future).fill(hist[hist.length-1]||0);
      let sx=0, sy=0, sxy=0, sxx=0;
      for (let i=0;i<n;i++){ sx+=i; sy+=hist[i]; sxy+=i*hist[i]; sxx+=i*i; }
      const slope = (n*sxy - sx*sy) / (n*sxx - sx*sx);
      const intercept = (sy - slope*sx)/n;
      const out=[];
      for (let f=1; f<=future; f++){ const x = n-1 + f; let y = intercept + slope*x; if (y<0) y=0; out.push(Math.round(y)); }
      return out;
    }

    let chart = null;
    function populateForecastSelect(){
      forecastDrug.innerHTML = '';
      visibleDrugs().forEach(d => forecastDrug.appendChild(new Option(`${d.name} • ${d.department}`, d.id)));
    }
    function generateForecastChart(id, months){
      const drug = DRUGS.find(x=>x.id===id); if (!drug) return;
      const hist = simulateHistory(drug, 12);
      const fc = linearForecast(hist, months);
      const labels = [];
      const now = new Date();
      for (let i=11;i>=0;i--) labels.push(new Date(now.getFullYear(), now.getMonth()-i,1).toLocaleString('default',{month:'short'}));
      for (let i=1;i<=months;i++) labels.push(new Date(now.getFullYear(), now.getMonth()+i,1).toLocaleString('default',{month:'short'}));
      const histSeries = hist.concat(Array(months).fill(null));
      const fcSeries = Array(11).fill(null).concat([hist[11]]).concat(fc);
      if (chart) chart.destroy();
      chart = new Chart(forecastCanvas, {
        type:'line',
        data:{ labels, datasets:[
          { label:'Historical', data: histSeries, borderColor:'#0061ff', tension:0.3, fill:false, borderWidth:2 },
          { label:'Forecast', data: fcSeries, borderColor:'#ff7a59', tension:0.3, borderDash:[6,4], fill:false, borderWidth:2 }
        ]},
        options:{ responsive:true, plugins:{legend:{position:'top'}} }
      });
    }
    generateForecast.addEventListener('click', ()=>{
      const id = forecastDrug.value; const months = Number(forecastMonths.value)||6;
      if (!id) return alert('Select a drug to forecast');
      generateForecastChart(id, months);
    });

    function populateForecastSelect(){ forecastDrug.innerHTML=''; visibleDrugs().forEach(d => forecastDrug.appendChild(new Option(`${d.name} • ${d.department}`, d.id))); }

    /* Helpers: push alert wrapper (for logs) */
    const ALERTS = [];
    function pushAlert(level, text){
      ALERTS.unshift({ id: uid('A'), level, text, at:new Date().toISOString() });
      if (ALERTS.length>200) ALERTS.pop();
    }

    /* Utility: export CSV */
    function exportCSV(){
      const rows = [['id','name','department','stock','expiry','temp','restockAt','safeMin','safeMax','barcode']];
      DRUGS.forEach(d => rows.push([d.id,d.name,d.department,d.stock,d.expiry,d.temp,d.restockAt,d.safeRange.min,d.safeRange.max,d.barcode||'']));
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'drugs_export.csv'; a.click();
    }
    exportBtn.addEventListener('click', exportCSV);
    window.exportCSV = exportCSV;

    /* populate forecast select helper (duplicate safe) */
    function populateForecastSelect(){ forecastDrug.innerHTML=''; visibleDrugs().forEach(d => forecastDrug.appendChild(new Option(`${d.name} • ${d.department}`, d.id))); }

    /* initial render & utility wiring */
    function save(){ localStorage.setItem('drugs', JSON.stringify(DRUGS)); }
    function renderAlerts(){ renderAlerts; } // placeholder to avoid lint error

    // initial population
    populateDeptFilter();
    renderInventory();
    renderAlerts();
    populateForecastSelect();
    if (forecastDrug.options.length) generateForecastChart(forecastDrug.value, Number(forecastMonths.value)||6);

    // small safety: re-read DRUGS on storage changes
    window.addEventListener('storage', ()=> { DRUGS = JSON.parse(localStorage.getItem('drugs')||'[]'); renderInventory(); });

    /* Expose some functions for debugging */
    window.app = { renderInventory, openDrugModal, pushAlert, exportCSV };
  });
}
