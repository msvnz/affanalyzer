export function parseMetaAds(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy', // Mengabaikan baris kosong di akhir file secara agresif
            complete: function(results) {
                let totalSpend = 0;
                let totalClicks = 0;
                let date = '';
                let campaignDetails = {}; // Menampung pecahan spend per kampanye

                const headers = results.meta.fields;
                if (!headers || headers.length === 0) {
                    reject({ type: 'format', message: 'File CSV Meta kosong atau tidak memiliki header.' });
                    return;
                }

                // Cek ketersediaan kolom wajib (Jumlah yang dibelanjakan)
                const hasSpend = headers.includes('Jumlah yang dibelanjakan (IDR)');
                const hasResult = headers.includes('Hasil');
                const hasIndicator = headers.includes('Indikator Hasil');

                if (!hasSpend) {
                    reject({ type: 'column', message: 'Kolom "Jumlah yang dibelanjakan (IDR)" tidak ditemukan.' });
                    return;
                }

                results.data.forEach(row => {
                    // FILTER 1: Lewati jika baris benar-benar kosong
                    if (!Object.values(row).some(val => val !== null && val !== '')) return;

                    // FILTER 2: Abaikan baris ringkasan "Total" dari Meta Ads biar gak double spend
                    const isTotalRow = Object.values(row).some(val => {
                        const lowVal = String(val).toLowerCase();
                        return lowVal === 'total' || lowVal === 'jumlah total';
                    });
                    if (isTotalRow) return;

                    // OTOMATIS AMBIL TANGGAL (Mendukung kolom 'Hari', 'Tanggal', atau 'Awal pelaporan')
                    if (row['Hari'] || row['Tanggal'] || row['Awal pelaporan']) {
                        date = row['Hari'] || row['Tanggal'] || row['Awal pelaporan'];
                    }

                    // HITUNG SPEND
                    let spend = parseFloat(String(row['Jumlah yang dibelanjakan (IDR)']).replace(/[^0-9.-]+/g,"")) || 0;
                    totalSpend += spend;

                    // BREAKDOWN SPEND PER KAMPANYE (Biar sinkron ke tabel bawah app.js)
                    // Mengakomodasi jika header berupa 'Nama kampanye' atau 'Nama iklan'
                    let campName = row['Nama kampanye'] || row['Nama iklan'] || 'Unknown';
                    if (!campaignDetails[campName]) {
                        campaignDetails[campName] = { spend: 0 };
                    }
                    campaignDetails[campName].spend += spend;

                    // HITUNG CLICKS (Logika asli bawaan lu yang sudah work)
                    if (hasIndicator && hasResult) {
                        if (String(row['Indikator Hasil']).includes('actions:link_click') || String(row['Indikator Hasil']).includes('Klik Tautan')) {
                            totalClicks += parseInt(row['Hasil']) || 0;
                        }
                    } else if (headers.includes('Klik Tautan (Semua)')) {
                        totalClicks += parseInt(row['Klik Tautan (Semua)']) || 0;
                    }
                });

                // Bersihkan teks tanggal jika ada spasi bawaan dari CSV
                if (date) {
                    date = String(date).trim();
                }

                // Kirim data hasil parsing yang sudah rapi ke app.js
                resolve({
                    spend: Math.round(totalSpend), // Dibulatkan biar rapi di dashboard utama
                    clicks: totalClicks,
                    date: date || new Date().toLocaleDateString('id-ID'),
                    campaignDetails: campaignDetails // Dikirimkan agar otomatis masuk rekap harian per tag
                });
            },
            error: function(err) {
                reject({ type: 'format', message: err.message });
            }
        });
    });
}
