
document.getElementById('tgl').value=new Date().toISOString().slice(0,10);
const fmt=n=>'Rp '+Number(n).toLocaleString('id-ID');

function data(){return JSON.parse(localStorage.getItem('affreports')||'[]')}
function save(d){localStorage.setItem('affreports',JSON.stringify(d))}

function saveReport(){
 let d=data();
 let item={
  tgl:tgl.value, spend:+spend.value||0, komisi:+komisi.value||0,
  klik:+klik.value||0, pesanan:+pesanan.value||0
 };
 d.unshift(item);
 save(d);
 render();
}

function showDetail(i){
 let r=data()[i];
 let profit=r.komisi-r.spend;
 let roi=r.spend?((profit/r.spend)*100).toFixed(1):0;
 detailBody.innerHTML=`
 <b>${r.tgl}</b><hr>
 Spend: ${fmt(r.spend)}<br>
 Komisi: ${fmt(r.komisi)}<br>
 Klik Shopee: ${r.klik}<br>
 Pesanan: ${r.pesanan}<br>
 Profit: ${fmt(profit)}<br>
 ROI: ${roi}%`;
 new bootstrap.Modal(document.getElementById('detailModal')).show();
}

function delReport(i){
 let d=data(); d.splice(i,1); save(d); render();
}

function render(){
 let d=data();
 let spendM=0, komM=0;
 reports.innerHTML='';
 d.forEach((r,i)=>{
  let profit=r.komisi-r.spend;
  let roi=r.spend?(profit/r.spend).toFixed(2):0;
  spendM+=r.spend; komM+=r.komisi;
  reports.innerHTML += `
  <div class="report-card">
  <div class="row align-items-center">
   <div class="col-md-3"><b>Laporan ${r.tgl}</b></div>
   <div class="col-md-2">${fmt(r.spend)}</div>
   <div class="col-md-2">${fmt(r.komisi)}</div>
   <div class="col-md-1">${r.klik}</div>
   <div class="col-md-2"><span class="badge badge-profit">${fmt(profit)}</span><br>ROAS: ${roi}x</div>
   <div class="col-md-2">
   <button class="btn btn-sm btn-outline-primary" onclick="showDetail(${i})">Detail</button>
   <button class="btn btn-sm btn-outline-danger" onclick="delReport(${i})">🗑</button>
   </div>
  </div></div>`;
 });

 let profitM=komM-spendM;
 let roiM=spendM?((profitM/spendM)*100).toFixed(1):0;

 spendMonth.innerHTML=fmt(spendM);
 komisiMonth.innerHTML=fmt(komM);
 profitMonth.innerHTML=fmt(profitM);
 roiMonth.innerHTML=roiM+'%';

 const ctx=document.getElementById('chart');
 if(window.myChart) window.myChart.destroy();
 window.myChart=new Chart(ctx,{
 type:'line',
 data:{labels:d.map(x=>x.tgl).reverse(),
 datasets:[{label:'Profit',data:d.map(x=>x.komisi-x.spend).reverse()}]}
 });
}
render();
