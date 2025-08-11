
const STORAGE = "rehab-tracker-v2";

function startOfWeek(d = new Date()){
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // lunes
  x.setDate(x.getDate() + diff);
  x.setHours(0,0,0,0);
  return x;
}
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function iso(d){ return d.toISOString().slice(0,10); }
function fmt(d){
  return d.toLocaleDateString("es-AR",{weekday:"short", day:"2-digit", month:"2-digit"});
}

const DEFAULT_EX = [
  {id:"flex-ext-1", name:"Flexo‑extensión de tobillo — Sesión 1", detail:"3×15 (mañana)"},
  {id:"flex-ext-2", name:"Flexo‑extensión de tobillo — Sesión 2", detail:"3×15 (tarde/noche)"},
  {id:"heel-raises", name:"Elevaciones de talón (ambos pies)", detail:"3×10 diario, lento"},
  {id:"bike", name:"Bicicleta fija sin carga", detail:"10–15 min diario"},
  {id:"stretch", name:"Elongación suave tríceps sural", detail:"3×20 s diario, sin dolor"},
  {id:"balance", name:"Equilibrio en un pie (apoyo cerca)", detail:"3×30 s diario"}
];

function load(weekStartISO){
  let data = {};
  try{ data = JSON.parse(localStorage.getItem(STORAGE) || "{}"); }catch{}
  if(!data[weekStartISO]){
    const checks = {};
    for(let i=0;i<7;i++){ checks[iso(addDays(new Date(weekStartISO), i))] = {}; }
    data[weekStartISO] = { exercises: DEFAULT_EX, checks };
    localStorage.setItem(STORAGE, JSON.stringify(data));
  }
  return data[weekStartISO];
}
function save(weekStartISO, state){
  let data = {};
  try{ data = JSON.parse(localStorage.getItem(STORAGE) || "{}"); }catch{}
  data[weekStartISO] = state;
  localStorage.setItem(STORAGE, JSON.stringify(data));
}

const weekRangeEl = document.getElementById("weekRange");
const prevWeekBtn = document.getElementById("prevWeek");
const nextWeekBtn = document.getElementById("nextWeek");
const exerciseList = document.getElementById("exerciseList");
const addExerciseBtn = document.getElementById("addExercise");
const exName = document.getElementById("exName");
const exDetail = document.getElementById("exDetail");
const daysGrid = document.getElementById("daysGrid");
const resetWeekBtn = document.getElementById("resetWeek");
const progressBar = document.getElementById("progressBar");
const progressPct = document.getElementById("progressPct");

let weekStart = startOfWeek();
let state = null;

function render(){
  const end = addDays(weekStart, 6);
  weekRangeEl.textContent = `${fmt(weekStart)} – ${fmt(end)}`;

  state = load(iso(weekStart));
  renderExercises();
  renderDays();
  updateProgress();
}

function renderExercises(){
  exerciseList.innerHTML = "";
  state.exercises.forEach(ex => {
    const li = document.createElement("li");
    li.className = "exercise";
    const left = document.createElement("div");
    left.innerHTML = `<div>${ex.name}</div>${ex.detail?`<div class="meta">${ex.detail}</div>`:""}`;
    const del = document.createElement("button");
    del.textContent = "Eliminar";
    del.onclick = () => {
      state.exercises = state.exercises.filter(e => e.id !== ex.id);
      Object.keys(state.checks).forEach(dayISO => { delete state.checks[dayISO][ex.id]; });
      save(iso(weekStart), state); render();
    };
    li.appendChild(left); li.appendChild(del);
    exerciseList.appendChild(li);
  });
}

function renderDays(){
  daysGrid.innerHTML = "";
  for(let i=0;i<7;i++){
    const d = addDays(weekStart, i);
    const dISO = iso(d);
    const map = state.checks[dISO] || {};
    const day = document.createElement("div");
    day.className = "day";
    const header = document.createElement("div");
    header.className = "header";
    header.innerHTML = `<div class="title">${fmt(d)}</div>`;
    const btns = document.createElement("div");
    btns.className = "btns";
    const all = document.createElement("button"); all.className = "btn ok"; all.textContent = "Marcar todo";
    all.onclick = () => {
      state.exercises.forEach(ex => map[ex.id] = true);
      state.checks[dISO] = map; save(iso(weekStart), state); render();
    };
    const reset = document.createElement("button"); reset.className = "btn"; reset.textContent = "Reset día";
    reset.onclick = () => { state.checks[dISO] = {}; save(iso(weekStart), state); render(); };
    const headWrap = document.createElement("header");
    headWrap.appendChild(header); headWrap.appendChild(btns);
    day.appendChild(headWrap);
    btns.appendChild(all); btns.appendChild(reset);

    state.exercises.forEach(ex => {
      const row = document.createElement("label");
      row.className = "check";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!map[ex.id];
      cb.onchange = () => { map[ex.id] = cb.checked; state.checks[dISO] = map; save(iso(weekStart), state); updateProgress(); };
      const text = document.createElement("div");
      text.innerHTML = `<div>${ex.name}</div>${ex.detail?`<div class="small">${ex.detail}</div>`:""}`;
      row.appendChild(cb); row.appendChild(text);
      day.appendChild(row);
    });
    daysGrid.appendChild(day);
  }
}

function updateProgress(){
  const total = state.exercises.length * 7;
  let done = 0;
  Object.values(state.checks).forEach(map => {
    state.exercises.forEach(ex => { if(map[ex.id]) done++; });
  });
  const pct = total ? Math.round((done/total)*100) : 0;
  progressBar.style.width = pct + "%";
  progressPct.textContent = pct + "%";
}

prevWeekBtn.onclick = () => { weekStart = addDays(weekStart, -7); render(); };
nextWeekBtn.onclick = () => { weekStart = addDays(weekStart, 7); render(); };
resetWeekBtn.onclick = () => {
  Object.keys(state.checks).forEach(k => state.checks[k] = {});
  save(iso(weekStart), state); render();
};
addExerciseBtn.onclick = () => {
  const name = exName.value.trim();
  const detail = exDetail.value.trim();
  if(!name) return;
  state.exercises.push({ id: Date.now().toString(), name, detail });
  exName.value = ""; exDetail.value = "";
  save(iso(weekStart), state); render();
};

if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js'); }
render();
