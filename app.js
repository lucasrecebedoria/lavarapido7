// app.js (trecho final para correção de totais e gráfico)

async function drawProdInline(){
  async function fetchMonthRows(){
    try{
      const { colRelatorios, query, where, getDocs } = await import('./firebase.js');
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth()+1, 1);
      const toYMD = (dt)=> dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,'0')+"-"+String(dt.getDate()).padStart(2,'0');
      const q1 = query(colRelatorios, where('data','>=', toYMD(from)), where('data','<', toYMD(to)));
      const snap = await getDocs(q1);
      const rows = [];
      snap.forEach(ss=>{
        const d = ss.data();
        const created = d.created_at 
          ? (typeof d.created_at.toDate === 'function' ? d.created_at.toDate() : new Date(d.created_at)) 
          : new Date(d.data+"T00:00:00");
        rows.push({ created, tipo: d.tipo });
      });
      return rows;
    }catch(e){ 
      console.error(e); 
      return []; 
    }
  }

  const rows = await fetchMonthRows();
  const now = new Date();
  const diasNoMes = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

  const countsSimples = new Array(diasNoMes).fill(0);
  const countsHig = new Array(diasNoMes).fill(0);
  const countsExc = new Array(diasNoMes).fill(0);

  rows.forEach(r=>{
    const d = r.created.getDate();
    if(d>=1 && d<=diasNoMes){
      if(r.tipo === 'Lavagem Simples') countsSimples[d-1]++;
      else if(r.tipo === 'Higienização') countsHig[d-1]++;
      else countsExc[d-1]++;
    }
  });

  const ctx = document.getElementById('chartProdInline');
  if(window.Chart && ctx){
    if(window._chartProdInline) window._chartProdInline.destroy();
    window._chartProdInline = new Chart(ctx, {
      type:'bar',
      data:{
        labels: Array.from({length:diasNoMes}, (_,i)=> String(i+1)),
        datasets:[
          { label:'Simples', data: countsSimples, backgroundColor:'#4e79a7', barThickness:14 },
          { label:'Higienização', data: countsHig, backgroundColor:'#f28e2c', barThickness:14 },
          { label:'Exceção', data: countsExc, backgroundColor:'#59a14f', barThickness:14 }
        ]
      },
      options:{
        responsive:true,
        plugins:{ 
          datalabels:{ 
            anchor:'end', align:'start', formatter:(v)=> v>0?v:"", font:{weight:'bold'} 
          } 
        },
        scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } }
      },
      plugins:[ChartDataLabels]
    });
  }

  const total = [...countsSimples,...countsHig,...countsExc].reduce((a,b)=>a+b,0);
  const info = document.getElementById('totalLavagensProd');
  if(info) info.textContent = "Total de lavagens no mês: " + total;
}
