import { auth, onAuthStateChanged, colRelatorios, query, where, getDocs } from './firebase.js';

onAuthStateChanged(auth, (user)=>{ if(!user) location.href='index.html'; });

function toYMD(dt){
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const d = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function setDefaultMonth(){
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  document.getElementById('mesInputMes').value = ym;
}

async function fetchMonthTotals(year, month){
  const from = new Date(year, month-1, 1);
  const to = new Date(year, month, 1);
  const q1 = query(colRelatorios, where('data','>=', toYMD(from)), where('data','<', toYMD(to)));
  const snap = await getDocs(q1);
  let simples=0, hig=0, exc=0;
  snap.forEach(ss=>{
    const t = (ss.data().tipo)||'';
    if(t==='Lavagem Simples') simples++;
    else if(t==='Higienização') hig++;
    else exc++;
  });
  return {simples,hig,exc,total: simples+hig+exc};
}

async function drawChart(){
  const ym = document.getElementById('mesInputMes').value;
  if(!ym) return;
  const [y,m] = ym.split('-').map(n=>parseInt(n,10));
  const data = await fetchMonthTotals(y,m);
  const ctx = document.getElementById('chartMes');
  if(window.Chart){
    if(window._chartMes) window._chartMes.destroy();
    

window._chartMes = new Chart(ctx, {
  type:'bar',
  data:{
    labels:['Simples','Higienização','Exceções','Total'],
    datasets:[{
      label:'Lavagens no mês',
      data:[data.simples, data.hig, data.exc, data.total],
      backgroundColor:['#4e79a7','#f28e2b','#e15759','#76b7b2'],
      barThickness: 28
    }]
  },
  options:{
    responsive:true,
    plugins:{ datalabels:{ anchor:'end', align:'start' } }
  },
  plugins:[ChartDataLabels]
});


async function exportPPT(){
  const data = await drawChart();
  if(!window.PptxGenJS) return;
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  slide.addText('Lavagens no mês', { x:0.5, y:0.3, fontSize:20, bold:true });
  const canvas = document.getElementById('chartMes');
  if(canvas){
    const dataUrl = canvas.toDataURL('image/png');
    slide.addImage({ data:dataUrl, x:0.5, y:1, w:9 });
  }
  if(data){
    slide.addText(`Simples: ${data.simples} | Hig.: ${data.hig} | Exceções: ${data.exc} | Total: ${data.total}`, { x:0.5, y:5.7, fontSize:14 });
  }
  await pptx.writeFile({ fileName: 'lavagens-mes.pptx' });
}

document.getElementById('btnAtualizarMes').addEventListener('click', drawChart);
document.getElementById('btnExportPptMes').addEventListener('click', exportPPT);
document.addEventListener('DOMContentLoaded', ()=>{ setDefaultMonth(); drawChart(); });

try{
  document.getElementById('totalLavagensMes').textContent = 'Total de lavagens: ' + data.total;
}catch(e){}
