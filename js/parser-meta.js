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
                
                // Cari kolom spend secara fleksibel
                const spendField = headers.find(h => h.includes('Jumlah yang dibelanjakan') || h.toLowerCase().includes('spend') || h.includes('IDR'));
                // Cari kolom hasil / klik
                const resultField = headers.find(h => h.toLowerCase().includes('hasil') || h.toLowerCase().includes('results') || h.toLowerCase().includes('klik tautan'));
                const indicatorField = headers.find(h => h.toLowerCase().includes('indikator hasil') || h.toLowerCase().includes('result indicator'));

                if (!spendField) {
                    reject({ type: 'column', message: 'Jumlah yang dibelanjakan (Spend)' });
                    return;
                }

                results.data.forEach(row => {
                    // Ambil tanggal
                    if(row['Hari'] || row['Tanggal'] || row['Reporting Starts'] || row['Mulai Pelaporan']) {
                        date = row['Hari'] || row['Tanggal'] || row['Reporting Starts'] || row['Mulai Pelaporan'];
                    }

                    // Bersihkan nominal uang dari simbol Rp atau titik koma bawaan Excel
                    let spendVal = String(row[spendField] || '0').replace(/[^0-9.-]+/g,"");
                    totalSpend += parseFloat(spendVal) || 0;

                    // Hitung Klik Tautan
                    if (indicatorField && resultField) {
                        if (String(row[indicatorField]).toLowerCase().includes('link_click') || String(row[indicatorField]).toLowerCase().includes('klik tautan')) {
                            totalClicks += parseInt(row[resultField]) || 0;
                        }
                    } else if (resultField) {
                        totalClicks += parseInt(row[resultField]) || 0;
                    }
                });

                // Standardisasi format tanggal dari Meta (YYYY-MM-DD ke format lokal jika perlu)
                resolve({
                    spend: totalSpend,
                    clicks: totalClicks,
                    date: date || new Date().toLocaleDateString('id-ID')
                });
            },
            error: function(err) {
                reject({ type: 'format', message: err.message });
            }
        });
    });
}
