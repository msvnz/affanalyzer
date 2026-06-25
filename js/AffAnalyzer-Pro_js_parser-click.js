export function parseClickReport(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const data = results.data;
                const headers = results.meta.fields;
                
                const tagField = headers.find(h => h.toLowerCase().includes('tag link') || h.toLowerCase().includes('sub_id') || h.toLowerCase().includes('tag_link1'));
                
                if (!tagField) {
                    reject({ type: 'column', message: 'Tag Link / Tag_link1' });
                    return;
                }

                let totalClicks = data.length;
                let tagBreakdown = {};

                data.forEach(row => {
                    let tag = row[tagField] || 'No Tag';
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