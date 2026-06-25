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

                // Pencarian kolom Biaya/Spend yang fleksibel
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

                if (!spendField) {
                    reject({ 
                        type: 'column', 
                        message: `Kolom Biaya/Spend tidak ditemukan.` 
                    });
                    return;
                }

                results.data.forEach(row => {
                    // CRITICAL FIX: Abaikan baris ringkasan "Total" dari Meta Ads biar gak kehitung double!
                    const firstColumnValue = Object.values(row)[0] ? String(Object.values(row)[0]).toLowerCase() : '';
                    const isTotalRow = Object.values(row).some(val => String(val).toLowerCase() === 'total' || String(val).toLowerCase() === 'jumlah total');
                    
                    if (isTotalRow || firstColumnValue === 'total') {
                        return; // Skip baris ini, lanjut ke baris berikutnya
                    }

                    // Cari tanggal laporan
                    const dateField = headers.find(h => {
                        const low = h.toLowerCase();
                        return low.includes('hari') || low.includes('tanggal') || low.includes('date') || low.includes('start');
                    });
                    
                    if (dateField && row[dateField]) {
                        date = row[dateField];
                    }

                    // Ambil nominal spend asli
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
