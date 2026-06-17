
function parseFile(file){
 return new Promise(resolve=>{
  Papa.parse(file,{header:true,skipEmptyLines:true,complete:r=>resolve(r.data)});
 });
}

async function proses(){
 const meta=document.getElementById('meta').files[0];
 const click=document.getElementById('click').files[0];
 const comm=document.getElementById('comm').files[0];

 if(!meta||!click||!comm){alert('Upload 3 CSV');return;}

 const m=await parseFile(meta);
 const c=await parseFile(click);
 const o=await parseFile(comm);

 let klikMeta=0, spend=0;

 m.forEach(r=>{
   klikMeta += Number(r['Klik Tautan']||0);
   spend += Number(r['Jumlah yang dibelanjakan (IDR)']||0);
 });

 const klikShopee=c.length;
 const orderan=o.length;

 let komisi=0;
 o.forEach(r=>{
   komisi += Number(r['Komisi Bersih Affiliate (Rp)']||0);
 });

 const tgl=new Date().toLocaleDateString('id-ID');

 document.getElementById('hasil').innerHTML=`
 <table>
 <tr>
 <th>Tanggal</th>
 <th>Klik Meta</th>
 <th>Klik Shopee</th>
 <th>Orderan Shopee</th>
 <th>Spend Meta</th>
 <th>Komisi Shopee</th>
 </tr>
 <tr>
 <td>${tgl}</td>
 <td>${klikMeta.toLocaleString('id-ID')}</td>
 <td>${klikShopee.toLocaleString('id-ID')}</td>
 <td>${orderan.toLocaleString('id-ID')}</td>
 <td>Rp${spend.toLocaleString('id-ID')}</td>
 <td>Rp${komisi.toLocaleString('id-ID')}</td>
 </tr>
 <tr>
 <th>TOTAL</th>
 <th>${klikMeta.toLocaleString('id-ID')}</th>
 <th>${klikShopee.toLocaleString('id-ID')}</th>
 <th>${orderan.toLocaleString('id-ID')}</th>
 <th>Rp${spend.toLocaleString('id-ID')}</th>
 <th>Rp${komisi.toLocaleString('id-ID')}</th>
 </tr>
 </table>`;
}
