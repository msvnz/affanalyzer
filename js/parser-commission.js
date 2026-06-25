export function parseCommissionReport(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy', // Lebih agresif mengabaikan baris kosong di awal/akhir
            complete: function(results) {
                let data = results.data;
                let headers = results.meta.fields;

                // ANTISIPASI 1: Jika Shopee menyertakan baris judul/info di 1-2 baris pertama sebelum header asli
                if (headers && headers.length === 1 && data.length > 0) {
                    // Cari baris yang benar-benar berisi struktur tabel komisi
                    const validRowIndex = data.findIndex(row => {
                        const values = Object.values(row).join('').toLowerCase();
                        return values.includes('komisi') || values.includes('commission') || values.includes('sub_id');
                    });

                    if (validRowIndex !== -1) {
                        // Ambil sisa data di bawah baris pemisah tersebut
                        const rawLines = data.slice(validRowIndex);
                        const csvText = Papa.unparse(rawLines);
                        const reParsed = Papa.parse(csvText, { header: true, skipEmptyLines: 'greedy' });
                        data = reParsed.data;
                        headers = reParsed.meta.fields;
                    }
                }

                if (!headers || headers.length === 0) {
                    reject({ type: 'format', message: 'Format file CSV komisi tidak terbaca.' });
                    return;
                }

                // ANTISIPASI 2: Cari kolom nominal uang komisi (Bahasa Indonesia & Inggris)
                const commField = headers.find(h => {
                    const low = h.toLowerCase();
                    return (low.includes('komisi') && low.includes('bersih')) || 
                           low.includes('commission') || 
                           low.includes('estimasi komisi') ||
                           low.includes('net_commission') ||
                           low.includes('earning');
                });
                
                // ANTISIPASI 3: Cari kolom Sub ID / Tag Link
                const tagField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('tag_link1') || 
                           low.includes('sub_id1') || 
                           low.includes('sub id 1') || 
                           low.includes('tag link') ||
                           low.includes('sub_id') ||
                           low.includes('adv_sub');
                });

                if (!commField) {
                    reject({ 
                        type: 'column', 
                        message: `Kolom Komisi tidak terdeteksi. Kolom teratas: [${headers.slice(0, 3).join(', ')}]` 
                    });
                    return;
                }

                let totalOrders = 0;
                let totalCommission = 0;
                let tagCommBreakdown = {};

                data.forEach(row => {
                    // Abaikan jika baris kosong atau baris total/summary dari Shopee
                    if (!row[commField] || String(row[commField]).toLowerCase().includes('total')) return;

                    // Bersihkan karakter uang (Rp, koma, titik, spasi)
                    let commRaw = String(row[commField]).replace(/[^0-9.-]+/g,"");
                    let comm = parseFloat(commRaw) || 0;
                    
                    // Validasi apakah ini baris data transaksi asli (punya nilai komisi atau record valid)
                    if (comm >= 0) {
                        totalOrders += 1;
                        totalCommission += comm;

                        // Mapping tag link harian
                        let tag = 'No Tag';
                        if (tagField && row[tagField]) {
                            tag = String(row[tagField]).trim() || 'No Tag';
                        }

                        if (!tagCommBreakdown[tag]) {
                            tagCommBreakdown[tag] = { clicks: 0, orders: 0, commission: 0 };
                        }
                        tagCommBreakdown[tag].orders += 1;
                        tagCommBreakdown[tag].commission += comm;
                    }
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
