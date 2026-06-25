export function parseMetaAds(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                let totalSpend = 0;
                let totalClicks = 0;
                let date = '';

                const headers = results.meta.fields;
                if (!headers || headers.length === 0) {
                    reject({ type: 'format', message: 'File CSV kosong atau tidak memiliki header.' });
                    return;
                }

                // Pencarian kolom Biaya/Spend yang sangat fleksibel (Abaikan kapitalisasi & spasi)
                const spendField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('dibelanjakan') || 
                           low.includes('spend') || 
                           low.includes('biaya') || 
                           low.includes('amount') ||
                           (low.includes('idr') && (low.includes('jumlah') || low.includes('total')));
                });

                // Pencarian kolom Hasil/Klik Tautan secara fleksibel
                const resultField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('hasil') || 
                           low.includes('results') || 
                           low.includes('klik tautan') || 
                           low.includes('link click') ||
                           low.includes('clicks');
                });

                const indicatorField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('indikator') || low.includes('indicator');
                });

                // Jika kolom pencatat biaya iklan sama sekali tidak terdeteksi
                if (!spendField) {
                    reject({ 
                        type: 'column', 
                        message: `Kolom Biaya/Spend tidak ditemukan. Kolom yang ada: [${headers.slice(0, 4).join(', ')}...]` 
                    });
                    return;
                }

                results.data.forEach(row => {
                    // Cari tanggal laporan (Meta Ads biasanya pakai 'Hari', 'Tanggal', atau 'Reporting Starts')
                    const dateField = headers.find(h => {
                        const low = h.toLowerCase();
                        return low.includes('hari') || low.includes('tanggal') || low.includes('date') || low.includes('start');
                    });
                    
                    if (dateField && row[dateField]) {
                        date = row[dateField];
                    }

                    // Bersihkan nominal uang dari simbol Rp, titik, koma, atau spasi (biar aman dikalkulasi secara float)
                    let spendRaw = row[spendField] ? String(row[spendField]).replace(/[^0-9.-]+/g,"") : '0';
                    totalSpend += parseFloat(spendRaw) || 0;

                    // Kalkulasi jumlah Klik Tautan
                    if (indicatorField && resultField && row[indicatorField]) {
                        const indValue = String(row[indicatorField]).toLowerCase();
                        if (indValue.includes('link_click') || indValue.includes('klik tautan') || indValue.includes('tautan')) {
                            totalClicks += parseInt(row[resultField]) || 0;
                        }
                    } else if (resultField && row[resultField]) {
                        totalClicks += parseInt(row[resultField]) || 0;
                    }
                });

                // Set ke tanggal hari ini jika kolom tanggal tidak ditemukan di file
                if (!date) {
                    date = new Date().toLocaleDateString('id-ID');
                }

                resolve({
                    spend: totalSpend,
                    clicks: totalClicks,
                    date: date
                });
            },
            error: function(err) {
                reject({ type: 'format', message: err.message });
            }
        });
    });
}
