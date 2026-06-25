export function parseCommissionReport(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const data = results.data;
                const headers = results.meta.fields;

                if (!headers || headers.length === 0) {
                    reject({ type: 'format', message: 'File CSV komisi kosong.' });
                    return;
                }

                // Cari kolom komisi secara super fleksibel (cocok untuk bahasa Indonesia / Inggris)
                const commField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('komisi') || 
                           low.includes('commission') || 
                           low.includes('net') || 
                           low.includes('earning') || 
                           low.includes('pendapatan');
                });
                
                // Cari kolom tag link atau sub ID secara fleksibel
                const tagField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('tag') || 
                           low.includes('sub_id') || 
                           low.includes('sub id') || 
                           low.includes('adv_sub');
                });

                if (!commField) {
                    reject({ 
                        type: 'column', 
                        message: `Kolom Komisi Bersih tidak terdeteksi. Kolom teratas: [${headers.slice(0, 4).join(', ')}]` 
                    });
                    return;
                }

                let totalOrders = data.length;
                let totalCommission = 0;
                let tagCommBreakdown = {};

                data.forEach(row => {
                    // Bersihkan karakter aneh dan ambil angka desimal/float nya saja
                    let commRaw = row[commField] ? String(row[commField]).replace(/[^0-9.-]+/g,"") : '0';
                    let comm = parseFloat(commRaw) || 0;
                    totalCommission += comm;

                    // Mapping tag link
                    let tag = 'No Tag';
                    if (tagField && row[tagField]) {
                        tag = String(row[tagField]).trim() || 'No Tag';
                    }

                    if (!tagCommBreakdown[tag]) {
                        tagCommBreakdown[tag] = { clicks: 0, orders: 0, commission: 0 };
                    }
                    tagCommBreakdown[tag].orders += 1;
                    tagCommBreakdown[tag].commission += comm;
                });

                resolve({
                    totalOrders,
                    totalCommission,
                    tagCommBreakdown
                });
            },
            error: function(err) {
                reject({ type: 'format', message: err.message });
            }
        });
    });
}
