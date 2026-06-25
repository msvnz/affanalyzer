export function parseCommissionReport(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const data = results.data;
                const headers = results.meta.fields;

                // Cari kolom komisi secara fleksibel
                const commField = headers.find(h => 
                    h.includes('Komisi Bersih') || 
                    h.toLowerCase().includes('komisi') || 
                    h.toLowerCase().includes('commission') || 
                    h.toLowerCase().includes('earnings')
                );
                
                // Cari kolom tag/sub_id di laporan komisi
                const tagField = headers.find(h => 
                    h.toLowerCase().includes('tag_link1') || 
                    h.toLowerCase().includes('tag link') || 
                    h.toLowerCase().includes('sub_id1') || 
                    h.toLowerCase().includes('sub id 1')
                );

                if (!commField) {
                    reject({ type: 'column', message: 'Kolom Komisi Bersih tidak ditemukan' });
                    return;
                }

                let totalOrders = data.length;
                let totalCommission = 0;
                let tagCommBreakdown = {};

                data.forEach(row => {
                    let commVal = String(row[commField] || '0').replace(/[^0-9.-]+/g,"");
                    let comm = parseFloat(commVal) || 0;
                    totalCommission += comm;

                    let tag = tagField ? (row[tagField] ? String(row[tagField]).trim() : 'No Tag') : 'No Tag';
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
