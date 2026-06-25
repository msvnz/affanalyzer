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
                const hasSpend = headers.includes('Jumlah yang dibelanjakan (IDR)');
                const hasResult = headers.includes('Hasil');
                const hasIndicator = headers.includes('Indikator Hasil');

                if (!hasSpend) {
                    reject({ type: 'column', message: 'Jumlah yang dibelanjakan (IDR)' });
                    return;
                }

                results.data.forEach(row => {
                    if(row['Hari'] || row['Tanggal']) {
                        date = row['Hari'] || row['Tanggal'];
                    }

                    let spend = parseFloat(String(row['Jumlah yang dibelanjakan (IDR)']).replace(/[^0-9.-]+/g,"")) || 0;
                    totalSpend += spend;

                    if (hasIndicator && hasResult) {
                        if (String(row['Indikator Hasil']).includes('actions:link_click') || String(row['Indikator Hasil']).includes('Klik Tautan')) {
                            totalClicks += parseInt(row['Hasil']) || 0;
                        }
                    } else if (headers.includes('Klik Tautan (Semua)')) {
                        totalClicks += parseInt(row['Klik Tautan (Semua)']) || 0;
                    }
                });

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
