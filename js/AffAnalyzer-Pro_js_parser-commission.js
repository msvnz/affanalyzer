export function parseCommissionReport(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const data = results.data;
                const headers = results.meta.fields;

                const commField = headers.find(h => h.includes('Komisi Bersih Affiliate (Rp)') || h.toLowerCase().includes('komisi') || h.toLowerCase().includes('commission'));
                const tagField = headers.find(h => h.toLowerCase().includes('tag_link1') || h.toLowerCase().includes('tag link') || h.toLowerCase().includes('sub_id1'));

                if (!commField) {
                    reject({ type: 'column', message: 'Komisi Bersih Affiliate (Rp)' });
                    return;
                }

                let totalOrders = data.length;
                let totalCommission = 0;
                let tagCommBreakdown = {};

                data.forEach(row => {
                    let comm = parseFloat(String(row[commField]).replace(/[^0-9.-]+/g,"")) || 0;
                    totalCommission += comm;

                    let tag = tagField ? (row[tagField] || 'No Tag') : 'No Tag';
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