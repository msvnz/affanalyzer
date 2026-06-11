
let current={};
function parseFile(file){
 return new Promise(r=>Papa.parse(file,{header:true,skipEmptyLines:true,complete:x=>r(x.data)}));
}
async function processFiles(){
 const m=document.getElementById('meta').files[0];
 const c=document.getElementById('click').files[0];
 const cm=document.getElementById('comm').files[0];
 if(!m||!c||!cm){alert('Pilih 3 CSV');return;}
 const meta=await parseFile(m), click=await parseFile(c), comm=await parseFile(cm);
 let spend=0,klikMeta=0,komisi=0;
 meta.forEach(r=>{
   spend+=Number(r['Jumlah yang dibelanjakan (IDR)']||0);
   klikMeta+=Number(r['Klik Tautan Unik']||0);
 });
 komisi=comm.reduce((a,r)=>a+Number(r['Komisi Bersih Affiliate (Rp)']||0),0);
 const klikShopee=click.length,pesanan=comm.length,profit=komisi-spend,roi=spend?profit/spend*100:0;
 current={spend,klikMeta,klikShopee,pesanan,komisi,profit,roi};
 document.getElementById('kpi').innerHTML=`
 <div class="col">Spend<br>${spend.toLocaleString()}</div>
 <div class="col">Komisi<br>${komisi.toLocaleString()}</div>
 <div class="col">Profit<br>${profit.toLocaleString()}</div>
 <div class="col">ROI<br>${roi.toFixed(1)}%</div>`;
}
function saveToday(){
 if(!current.spend){alert('Hitung KPI dulu');return;}
 let d=JSON.parse(localStorage.getItem('affhistory')||'[]');
 d.push({...current,date:new Date().toISOString().slice(0,10)});
 localStorage.setItem('affhistory',JSON.stringify(d));
 renderHistory();
}
function renderHistory(){
 let d=JSON.parse(localStorage.getItem('affhistory')||'[]');
 let html='<tr><th>Tanggal</th><th>Spend</th><th>Komisi</th><th>Profit</th><th>ROI</th></tr>';
 d.forEach(x=>html+=`<tr><td>${x.date}</td><td>${x.spend}</td><td>${x.komisi}</td><td>${x.profit}</td><td>${x.roi.toFixed(1)}%</td></tr>`);
 document.getElementById('history').innerHTML=html;
 const ctx=document.getElementById('chart');
 new Chart(ctx,{type:'line',data:{labels:d.map(x=>x.date),datasets:[{label:'Profit',data:d.map(x=>x.profit)}]}});
}
renderHistory();
