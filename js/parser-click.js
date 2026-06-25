export function parseClickReport(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const data = results.data;
                const headers = results.meta.fields;
                
                if (!headers || headers.length === 0) {
                    reject({ type: 'format', message: 'File CSV klik kosong.' });
                    return;
                }

                // Cari kolom penanda sub_id / tag link secara fleksibel
                const tagField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('tag') || 
                           low.includes('sub_id') || 
                           low.includes('sub id') || 
                           low.includes('link1') ||
                           low.includes('adv_sub');
                });
                
                if (!tagField) {
                    reject({ 
                        type: 'column', 
                        message: `Kolom Tag Link atau Sub ID tidak ditemukan. Kolom teratas: [${headers.slice(0, 4).join(', ')}]` 
                    });
                    return;
                }

                let totalClicks = data.length;
                let tagBreakdown = {};

                data.forEach(row => {
                    // Ambil string tag, bersihkan spasi di ujungnya
                    let tag = row[tagField] ? String(row[tagField]).trim() : 'No Tag';
                    if (tag === '') tag = 'No Tag';

                    if (!tagBreakdown[tag]) {
                        tagBreakdown[tag] = { clicks: 0, orders: 0, commission: 0 };
                    }
                    tagBreakdown[tag].clicks += 1;
                });

                resolve({
                    totalClicks,
                    tagBreakdown
                });
            },
            error: function(err) {
                reject({ type: 'format', message: err.message });
            }
        });
    });
}
