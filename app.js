const LMP = new Date("2025-10-15T00:00:00+05:30");
const DEFAULT_DELIVERY = "2026-07-02";
const TOTAL_DAYS = 280;

let sessionActive = false;
let sessionStart = null;
let sessionKicks = [];
let currentFilter = { from: "", to: "" };

const $ = id => document.getElementById(id);

function todayKey(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}
function localDateKey(value){
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function prettyDate(value){
  return new Date(value).toLocaleDateString([], {day:"2-digit", month:"short", year:"numeric"});
}
function prettyTime(value){
  return new Date(value).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"});
}
function duration(ms){
  if(!Number.isFinite(ms) || ms < 0) return "--";
  const m = Math.floor(ms/60000);
  const s = Math.floor((ms%60000)/1000);
  return `${m}m ${s}s`;
}
function daysBetween(a,b){
  return Math.floor((b-a)/(1000*60*60*24));
}
function getKicks(){
  try { return JSON.parse(localStorage.getItem("kicksToday") || "[]"); }
  catch(e){ return []; }
}
function setKicks(kicks){
  localStorage.setItem("kicksToday", JSON.stringify(kicks));
}
function getSettings(){
  try { return JSON.parse(localStorage.getItem("settings") || "{}"); }
  catch(e){ return {}; }
}
function setSettings(settings){
  localStorage.setItem("settings", JSON.stringify(settings));
}
function getDeliveryDate(){
  return getSettings().deliveryDate || DEFAULT_DELIVERY;
}
function getHealthLogs(){
  return Object.keys(localStorage)
    .filter(k => k.startsWith("healthLog-"))
    .sort()
    .map(k => {
      try { return JSON.parse(localStorage.getItem(k)); }
      catch(e){ return null; }
    })
    .filter(Boolean);
}
function filteredKicks(){
  const kicks = getKicks();
  const from = currentFilter.from;
  const to = currentFilter.to;
  return kicks.filter(k => {
    const key = localDateKey(k);
    if(from && key < from) return false;
    if(to && key > to) return false;
    return true;
  });
}
function groupKicks(kicks){
  const g = {};
  kicks.forEach(k => {
    const key = localDateKey(k);
    if(!g[key]) g[key] = [];
    g[key].push(k);
  });
  return g;
}
function renderDashboard(){
  const now = new Date();
  const grown = Math.max(0, daysBetween(LMP, now));
  const weeks = Math.floor(grown / 7);
  const days = grown % 7;
  const percent = Math.min(100, Math.round((grown / TOTAL_DAYS) * 100));
  const delivery = new Date(getDeliveryDate() + "T00:00:00+05:30");
  const left = Math.max(0, Math.ceil((delivery - now)/(1000*60*60*24)));
  const allKicks = getKicks();
  const today = localDateKey(new Date());
  const todayCount = allKicks.filter(k => localDateKey(k) === today).length;

  $("gestationText").textContent = `${weeks}w ${days}d`;
  $("growthDaysText").textContent = `${grown} days grown`;
  $("babyAgeText").textContent = `Your baby is ${grown} days grown today.`;
  $("countdownText").textContent = `${left} days`;
  $("deliveryDateText").textContent = `Planned: ${prettyDate(delivery)}`;
  $("progressPercent").textContent = `${percent}%`;
  $("progressBar").style.width = `${percent}%`;
  $("todayKicks").textContent = todayCount;
  $("totalKicks").textContent = allKicks.length;
  $("deliveryDateInput").value = getDeliveryDate();
}
function renderSession(){
  $("sessionCount").textContent = `${sessionKicks.length} kicks`;
  $("startedAt").textContent = sessionStart ? prettyTime(sessionStart) : "--";
  $("lastKick").textContent = sessionKicks.length ? prettyTime(sessionKicks[sessionKicks.length-1]) : "--";
  $("timeToTen").textContent = sessionKicks.length >= 10 && sessionStart
    ? duration(new Date(sessionKicks[9]) - new Date(sessionStart))
    : "--";
}
function renderKicksPage(){
  const kicks = filteredKicks();
  const grouped = groupKicks(kicks);
  const dates = Object.keys(grouped).sort();
  $("filteredTotal").textContent = kicks.length;
  $("filteredFirst").textContent = kicks.length ? `${prettyDate(kicks[0])}, ${prettyTime(kicks[0])}` : "--";
  $("filteredLatest").textContent = kicks.length ? `${prettyDate(kicks[kicks.length-1])}, ${prettyTime(kicks[kicks.length-1])}` : "--";

  $("dailyTotals").innerHTML = dates.slice().reverse().map(date => (
    `<div class="dayRow"><b>${date}</b><span>${grouped[date].length} kicks</span></div>`
  )).join("") || "<p>No kicks found.</p>";

  $("timestampList").innerHTML = kicks.slice().reverse().map(k => (
    `<li>${prettyDate(k)} — ${prettyTime(k)}</li>`
  )).join("") || "<li>No timestamps found.</li>";
}
function renderHealth(){
  const logs = getHealthLogs().reverse();
  $("healthHistory").innerHTML = logs.map(h => {
    const meds = h.udiliv ? [h.udiliv.morning, h.udiliv.afternoon, h.udiliv.night].filter(Boolean).length : 0;
    return `<div class="dayRow"><div><b>${h.date}</b><br><small>Itching: ${h.itching || "--"} | Udiliv: ${meds}/3 | CTG: ${h.ctg || "--"}</small></div><span>BA ${h.bile || "--"}</span></div>`;
  }).join("") || "<p>No health logs yet.</p>";
}
function renderAll(){
  renderDashboard();
  renderSession();
  renderKicksPage();
  renderHealth();
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    tab.classList.add("active");
    $(tab.dataset.screen).classList.add("active");
    renderAll();
  });
});

$("startBtn").onclick = () => {
  sessionActive = true;
  sessionStart = new Date();
  sessionKicks = [];
  $("kickBtn").disabled = false;
  $("endBtn").disabled = false;
  $("startBtn").disabled = true;
  renderAll();
};
$("kickBtn").onclick = () => {
  if(!sessionActive) return;
  const stamp = new Date().toISOString();
  sessionKicks.push(stamp);
  const all = getKicks();
  all.push(stamp);
  setKicks(all);
  renderAll();
  if(navigator.vibrate) navigator.vibrate(35);
};
$("endBtn").onclick = () => {
  sessionActive = false;
  $("kickBtn").disabled = true;
  $("endBtn").disabled = true;
  $("startBtn").disabled = false;
  renderAll();
};
$("clearSessionBtn").onclick = () => {
  if(confirm("This clears only the current session display, not saved history.")){
    sessionKicks = [];
    sessionStart = sessionActive ? new Date() : null;
    renderAll();
  }
};
$("applyFilter").onclick = () => {
  currentFilter.from = $("fromDate").value;
  currentFilter.to = $("toDate").value;
  renderKicksPage();
};
$("clearFilter").onclick = () => {
  currentFilter = {from:"", to:""};
  $("fromDate").value = "";
  $("toDate").value = "";
  renderKicksPage();
};
$("healthDate").value = todayKey();
$("saveHealth").onclick = () => {
  const date = $("healthDate").value || todayKey();
  const log = {
    date,
    fasting: $("fasting").value,
    bile: $("bile").value,
    sgot: $("sgot").value,
    sgpt: $("sgpt").value,
    ctg: $("ctg").value,
    itching: $("itching").value,
    notes: $("notes").value,
    udiliv: {
      morning: $("morn").checked,
      afternoon: $("aft").checked,
      night: $("night").checked
    }
  };
  localStorage.setItem("healthLog-" + date, JSON.stringify(log));
  alert("Health log saved.");
  renderAll();
};
$("saveSettings").onclick = () => {
  setSettings({deliveryDate: $("deliveryDateInput").value || DEFAULT_DELIVERY});
  alert("Delivery date saved.");
  renderAll();
};

function download(filename, text, type="text/plain"){
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
$("exportBackup").onclick = () => {
  const data = {};
  Object.keys(localStorage).forEach(k => data[k] = localStorage.getItem(k));
  download("from-bump-to-baby-backup.json", JSON.stringify(data, null, 2), "application/json");
};
$("importFile").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(!confirm("Import this backup? It will restore saved values from the file.")) return;
      Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
      alert("Backup imported.");
      renderAll();
    } catch(err){
  console.error(err);
  alert("IMPORT ERROR: " + err.message);
}
  };
  reader.readAsText(file);
};
$("exportCSV").onclick = () => {
  const kicks = filteredKicks();
  const rows = ["Date,Time,ISO Timestamp"];
  kicks.forEach(k => rows.push(`${localDateKey(k)},${prettyTime(k)},${k}`));
  download("kick-history.csv", rows.join("\n"), "text/csv");
};
$("exportPDF").onclick = () => {
  const kicks = filteredKicks();
  const grouped = groupKicks(kicks);
  const logs = getHealthLogs();
  const win = window.open("", "_blank");
  const dailyRows = Object.keys(grouped).sort().map(d => `<tr><td>${d}</td><td>${grouped[d].length}</td></tr>`).join("");
  const healthRows = logs.map(h => `<tr><td>${h.date}</td><td>${h.bile || "--"}</td><td>${h.sgot || "--"}</td><td>${h.sgpt || "--"}</td><td>${h.itching || "--"}</td><td>${h.ctg || "--"}</td></tr>`).join("");
  win.document.write(`
    <html><head><title>Doctor Report</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#222}
      h1{color:#6c4b8b} table{border-collapse:collapse;width:100%;margin:14px 0}
      th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f0e8f6}
      .small{color:#666;font-size:13px}
    </style></head><body>
    <h1>From Bump to Baby — Doctor Report</h1>
    <p class="small">Generated: ${new Date().toLocaleString()}</p>
    <h2>Pregnancy Summary</h2>
    <p><b>LMP:</b> 15 Oct 2025</p>
    <p><b>Planned delivery/C-section:</b> ${prettyDate(new Date(getDeliveryDate()+"T00:00:00+05:30"))}</p>
    <p><b>Total kicks in selected range:</b> ${kicks.length}</p>
    <p><b>Range:</b> ${currentFilter.from || "All"} to ${currentFilter.to || "All"}</p>
    <h2>Daily Kick Totals</h2>
    <table><tr><th>Date</th><th>Kicks</th></tr>${dailyRows || "<tr><td colspan='2'>No kicks</td></tr>"}</table>
    <h2>Health Logs</h2>
    <table><tr><th>Date</th><th>Bile Acids</th><th>SGOT</th><th>SGPT</th><th>Itching</th><th>CTG</th></tr>${healthRows || "<tr><td colspan='6'>No logs</td></tr>"}</table>
    <script>window.print()</script>
    </body></html>
  `);
  win.document.close();
};

renderAll();

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js");
}
