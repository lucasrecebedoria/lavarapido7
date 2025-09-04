import { auth, onAuthStateChanged, colRelatoriosMensais, query, where, getDocs } from './firebase.js';

onAuthStateChanged(auth, (user)=>{ if(!user) location.href='index.html'; });

function setDefaultMonth(){
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  document.getElementById('mesInputCmp').value = ym;
}

function weekOfMonth(dateStr){
  const [y,m,d] = dateStr.split('-').map(n=>parseInt(n,10));
  const dt = new Date(y, m-1, d);
  const first = new Date(y, m-1, 1);
  const offset = Math.floor((dt.getDate() + first.getDay() - 1)/7) + 1; // 1..6
  return offset;
}

async function loadChart(){
  const ym = document.getElementById('mesInputCmp').value;
  if(!ym) return;
  const q = query(colRelatoriosMensais, where('ym','==', ym));
  const snap = await getDocs(q);

  const byWeek = new Map();
  snap.forEach(ss=>{
    const d = ss.data();
    const w = d.data ? weekOfMonth(d.data) : 1;
    if(!byWeek.has(w)) byWeek.set(w, {});
    const o = byWeek.get(w);
    const t = d.tipo || 'Outro';
    o[t] = (o[t]||0) + 1;
  });

  const semanas = Array.from(byWeek.keys()).sort((a,b)=>a-b);
  const tipos = Array.from(new Set([].concat(...Array.from(byWeek.values()).map(o=>Object.keys(o))))).sort();
  const datasets = tipos.map(tp => ({ label: tp, data: semanas.map(w=> (byWeek.get(w)[tp]||0)) }));

  const ctx = document.getElementById('chartCmp');
  if(window.Chart){
    if(window._chartCmp) window._chartCmp.destroy();
    window._chartCmp = new Chart(ctx, {
      type:'bar',
      data:{ labels: semanas.map(s=>'Semana '+s), datasets },
      options:{ responsive:true }
    });
  }
}

document.getElementById('mesInputCmp').addEventListener('change', loadChart);
document.addEventListener('DOMContentLoaded', ()=>{ setDefaultMonth(); loadChart(); });
