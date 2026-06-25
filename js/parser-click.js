export function parseClickReport(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const data = results.data;
                const headers = results.meta.fields;
                
                // Cari kolom sub_id atau tag link secara fleksibel
                const tagField = headers.find(h => 
                    h.toLowerCase().includes('tag link') || 
                    h.toLowerCase().includes('tag_link1') || 
                    h.toLowerCase().includes('sub id 1') || 
                    h.toLowerCase().includes('sub_id1') || 
                    h.toLowerCase().includes('sub id')
                );
                
                if (!tagField) {
                    reject({ type: 'column', message: 'Kolom Tag Link / Sub ID tidak ditemukan' });
                    return;
                }

                let totalClicks = data.length;
                let tagBreakdown = {};

                data.forEach(row => {
                    let tag = row[tagField] ? String(row[tagField]).trim() : 'No Tag';
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
