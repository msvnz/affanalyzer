export function parseMetaAds(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy', // Mengabaikan baris kosong di atas/bawah secara agresif
            complete: function(results) {
                let totalSpend = 0;
                let totalClicks = 0;
                let date = '';

                const headers = results.meta.fields;
                if (!headers || headers.length === 0) {
                    reject({ type: 'format', message: 'File CSV kosong atau tidak memiliki header.' });
                    return;
                }

                // 1. Cari kolom Biaya/Spend secara sangat fleksibel
                const spendField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('dibelanjakan') || 
                           low.includes('spend') || 
                           low.includes('biaya') || 
                           low.includes('amount') ||
                           (low.includes('idr') && (low.includes('jumlah') || low.includes('total')));
                });

                // 2. Cari kolom Hasil/Klik secara fleksibel
                const resultField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('hasil') || 
                           low.includes('results') || 
                           low.includes('klik tautan') || 
                           low.includes('link click') ||
                           low.includes('clicks');
                });

                // 3. Cari kolom Indikator Hasil (Opsional, untuk validasi jenis klik)
                const indicatorField = headers.find(h => {
                    const low = h.toLowerCase();
                    return low.includes('indikator') || low.includes('indicator');
                });

                if (!spendField) {
                    reject({ 
                        type: 'column', 
                        message: `Kolom Jumlah yang dibelanjakan (Spend) tidak ditemukan.` 
                    });
                    return;
                }

                // Mulai looping data per baris kampanye
                results.data.forEach(row => {
                    // Validasi: Lewati baris jika seluruh kolomnya kosong
                    if (!Object.values(row).some(val => val !== null && val !== '')) return;

                    // FILTER KEAMANAN: Abaikan jika ini baris rangkuman "Total" bawaan Meta
                    const isTotalRow = Object.values(row).some(val => {
                        const lowVal = String(val).toLowerCase();
                        return lowVal === 'total' || lowVal === 'jumlah total';
                    });
                    
                    if (isTotalRow) return; // Langsung lompat ke baris berikutnya

                    // 4. Cari dan ambil tanggal laporan (Awal Pelaporan / Hari)
                    const dateField = headers.find(h => {
                        const low = h.toLowerCase();
                        return low.includes('hari') || low.includes('tanggal') || low.includes('date') || low.includes('awal') || low.includes('start');
                    });
                    
                    if (dateField && row[dateField] && !date) {
                        date = String(row[dateField]).trim();
                    }

                    // 5. Ekstrak nilai Spend (Uang) -> Bersihkan teks Rp, koma, titik, dll.
                    if (row[spendField]) {
                        let spendRaw = String(row[spendField]).replace(/[^0-9.-]+/g, "");
                        totalSpend += parseFloat(spendRaw) || 0;
                    }

                    // 6. Ekstrak nilai Klik Tautan (Hasil)
                    if (resultField && row[resultField]) {
                        let clicksRaw = String(row[resultField]).replace(/[^0-9]+/g, "");
                        let clicksVal = parseInt(clicksRaw) || 0;

                        // Jika ada kolom indikator, pastikan benar-content klik tautan
                        if (indicatorField && row[indicatorField]) {
                            const indValue = String(row[indicatorField]).toLowerCase();
                            if (indValue.includes('link_click') || indValue.includes('klik tautan') || indValue.includes('tautan')) {
                                totalClicks += clicksVal;
                            } else {
                                totalClicks += clicksVal; // Fallback jika indikator teksnya bervariasi
                            }
                        } else {
                            totalClicks += clicksVal;
                        }
                    }
                });

                // Jika di file tidak ada tanggal terdeteksi, pakai tanggal hari ini
                if (!date) {
                    date = new Date().toLocaleDateString('id-ID');
                }

                // Kirim hasil akhir parsing yang sudah bersih
                resolve({
                    spend: Math.round(totalSpend), // Dibulatkan agar rapi di dashboard
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
