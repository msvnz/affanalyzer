// Import fungsi parser dari modul masing-masing
import { parseMetaAds } from './parser-meta.js';
import { parseClickReport } from './parser-click.js';
import { parseCommissionReport } from './parser-commission.js';

// Selector Element DOM
const fileMetaInput = document.getElementById('file-meta');
const fileClickInput = document.getElementById('file-click');
const fileCommissionInput = document.getElementById('file-commission');
const btnSubmitLaporan = document.getElementById('btn-submit-laporan');

// 1. EVENT LISTENER: SAAT HALAMAN SELESAI DI-LOAD BROWSER
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Ambil database array history dari browser
        const currentHistory = JSON.parse(localStorage.getItem('affAnalyzerData')) || [];
        
        if (currentHistory.length > 0) {
            // Tampilkan data ke dashboard utama & grafik
            renderDashboardGlobal(currentHistory);
            
            // Ambil data hari terakhir untuk merender analisa breakdown tag link
            const dataTerakhir = currentHistory[currentHistory.length - 1];
            if (dataTerakhir && dataTerakhir.tagDetails) {
                renderTagAnalysis(dataTerakhir.tagDetails, dataTerakhir.totalCommission || 0);
            }
        } else {
            showEmptyDashboard();
        }
    } catch (err) {
        console.error("Error saat memuat data awal halaman:", err);
    }
});

// 2. EVENT LISTENER: PROSES UPLOAD & AUTOMATIC ACCUMULATIVE STORAGE
if (btnSubmitLaporan) {
    btnSubmitLaporan.addEventListener('click', async function() {
        try {
            // Validasi keberadaan elemen input sebelum membaca file
            if (!fileMetaInput || !fileClickInput || !fileCommissionInput) {
                alert("Error: Elemen input file CSV tidak ditemukan di HTML lu!");
                return;
            }

            const fileMeta = fileMetaInput.files[0];
            const fileClick = fileClickInput.files[0];
            const fileCommission = fileCommissionInput.files[0];

            // Validasi wajib isi ketiga file
            if (!fileMeta || !fileClick || !fileCommission) {
                alert("Harap masukkan ketiga file CSV terlebih dahulu secara bersamaan!");
                return;
            }

            // Jalankan parser secara simultan
            const metaResult = await parseMetaAds(fileMeta);
            const clickResult = await parseClickReport(fileClick);
            const commissionResult = await parseCommissionReport(fileCommission);

            // Gabungkan data (Tanggal otomatis bersumber murni dari metaResult.date)
            const currentLogReport = combineReports(metaResult, clickResult, commissionResult);
            
            // Ambil database array lama dari LocalStorage
            let currentHistory = JSON.parse(localStorage.getItem('affAnalyzerData')) || [];

            // Cek apakah tanggal dari file CSV ini sudah pernah di-upload sebelumnya
            const existingDataIndex = currentHistory.findIndex(item => item.date === currentLogReport.date);

            if (existingDataIndex !== -1) {
                // Konfirmasi overwrite jika tanggal kembar
                if (confirm(`Data Rekap untuk tanggal [ ${currentLogReport.date} ] sudah pernah tersimpan.\nApakah lu mau memperbarui (overwrite) data tanggal tersebut?`)) {
                    currentHistory[existingDataIndex] = currentLogReport;
                } else {
                    return; // Batalkan proses, data lama aman
                }
            } else {
                // Jika tanggal baru, langsung tambahkan ke dalam array list history
                currentHistory.push(currentLogReport);
            }

            // Urutkan history dari tanggal terlama ke terbaru agar plot grafik Chart.js rapi
            currentHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Simpan permanen kembali ke LocalStorage
            localStorage.setItem('affAnalyzerData', JSON.stringify(currentHistory));

            alert(`Sukses! Rekap data tanggal ${currentLogReport.date} otomatis tersimpan.`);
            
            // Refresh halaman agar tampilan web ter-update otomatis
            window.location.reload();

        } catch (error) {
            console.error("Error pada proses submit:", error);
            alert(`Gagal memproses laporan: ${error.message || error}`);
        }
    });
}

// 3. FUNGSI GABUNGKAN DATA (Mencocokkan Spend Meta dengan Tag Shopee)
function combineReports(metaData, clickData, commissionData) {
    let finalData = {
        date: metaData.date,
        totalSpend: metaData.spend || 0,
        totalClicks: clickData.totalClicks || 0,
        totalOrders: commissionData.totalOrders || 0,
        totalCommission: commissionData.totalCommission || 0,
        tagDetails: {}
    };

    // Ambil data breakdown bawaan parser (pastikan tidak undefined)
    const clickBreakdown = clickData.tagBreakdown || {};
    const commBreakdown = commissionData.tagCommBreakdown || {};

    // Gabungkan semua key tag unik dari Shopee Click & Shopee Commission
    const allTags = new Set([
        ...Object.keys(clickBreakdown),
        ...Object.keys(commBreakdown)
    ]);

    // Set kerangka struktur awal data tiap tag
    allTags.forEach(tag => {
        const clickInfo = clickBreakdown[tag] || { clicks: 0 };
        const commInfo = commBreakdown[tag] || { orders: 0, commission: 0 };

        finalData.tagDetails[tag] = {
            clicks: clickInfo.clicks || 0,
            orders: commInfo.orders || 0,
            commission: commInfo.commission || 0,
            spend: 0 // Inisialisasi awal default 0
        };
    });

    // Petakan Spend Meta per Kampanye masuk ke Tag Shopee yang namanya mirip/cocok
    if (metaData.campaignDetails) {
        Object.keys(metaData.campaignDetails).forEach(campName => {
            const campSpend = metaData.campaignDetails[campName].spend || 0;

            // Logika toleransi kemiripan string nama kampanye & tag shopee (Insensitive Case)
            const matchedTag = Object.keys(finalData.tagDetails).find(tag => 
                tag.toLowerCase().includes(campName.toLowerCase()) || 
                campName.toLowerCase().includes(tag.toLowerCase())
            );

            if (matchedTag) {
                finalData.tagDetails[matchedTag].spend += campSpend;
            } else {
                // Jika iklan jalan tapi di shopee hari itu belum ada klik/order, baris tetap dibuat agar spend tidak hilang
                finalData.tagDetails[campName] = {
                    clicks: 0,
                    orders: 0,
                    commission: 0,
                    spend: campSpend
                };
            }
        });
    }

    return finalData;
}

// 4. FUNGSI RENDER TABEL ANALISA BREAKDOWN PER TAG LINK
function renderTagAnalysis(tagDetails, totalCommissionGlobal) {
    try {
        const tbody = document.getElementById('table-tag-body');
        if (!tbody) return; // Keluar dengan aman jika element tabel belum ada di HTML
        
        tbody.innerHTML = ''; // Bersihkan baris lama

        Object.keys(tagDetails).forEach(tag => {
            const data = tagDetails[tag];
            const spend = data.spend || 0;

            // Hitung Conversion Rate (CR)
            const cr = data.clicks > 0 ? ((data.orders / data.clicks) * 100).toFixed(2) : '0.00';
            
            // Hitung persentase kontribusi komisi tag ini terhadap total pendapatan komisi global
            const pctKomisi = totalCommissionGlobal > 0 ? ((data.commission / totalCommissionGlobal) * 100).toFixed(2) : '0.00';

            // Hitung ROI per produk iklan: ((Komisi - Spend Meta) / Spend Meta) * 100
            let roiHTML = '-';
            if (spend > 0) {
                let roi = ((data.commission - spend) / spend) * 100;
                const roiClass = roi >= 0 ? 'text-success' : 'text-danger';
                roiHTML = `<span class="${roiClass} fw-bold">${roi.toFixed(2)}%</span>`;
            }

            // Tembakkan data ke baris tabel HTML
            const rowHTML = `
                <tr>
                    <td class="fw-bold text-info">${tag}</td>
                    <td class="text-warning fw-bold">Rp ${spend.toLocaleString('id-ID')}</td>
                    <td>${(data.clicks || 0).toLocaleString('id-ID')}</td>
                    <td>${(data.orders || 0).toLocaleString('id-ID')}</td>
                    <td class="text-success fw-bold">Rp ${(data.commission || 0).toLocaleString('id-ID')}</td>
                    <td>${cr}%</td>
                    <td>${pctKomisi}%</td>
                    <td>${roiHTML}</td>
                </tr>
            `;
            
            tbody.insertAdjacentHTML('beforeend', rowHTML);
        });

        // Tampilkan section tabel jika sebelumnya disembunyikan
        const tagSection = document.getElementById('tag-section');
        if (tagSection) tagSection.classList.remove('d-none');

    } catch (err) {
        console.error("Gagal merender tabel analisa tag:", err);
    }
}

// 5. FUNGSI GLOBAL RENDER DASHBOARD UTAMA
function renderDashboardGlobal(historyData) {
    try {
        if (!historyData || historyData.length === 0) return;

        // Ambil data rekap paling terakhir untuk performa hari ini
        const dataTerakhir = historyData[historyData.length - 1];
        
        // Taruh data ke card dashboard utama lu (Proteksi: Hanya diisi jika ID-nya eksis di HTML)
        const spendDisplay = document.getElementById('total-spend-display');
        const commDisplay = document.getElementById('total-comm-display');

        if (spendDisplay && dataTerakhir.totalSpend !== undefined) {
            spendDisplay.innerText = `Rp ${dataTerakhir.totalSpend.toLocaleString('id-ID')}`;
        }
        if (commDisplay && dataTerakhir.totalCommission !== undefined) {
            commDisplay.innerText = `Rp ${dataTerakhir.totalCommission.toLocaleString('id-ID')}`;
        }
        
        console.log("Database history termuat saat ini:", historyData);
        
        // JIKA LU PUNYA LOGIKACHART / GRAFIK bawaan sendiri, masukkan/panggil di bawah sini:
        // misal: updateMyChartJs(historyData);

    } catch (err) {
        console.error("Gagal merender card dashboard global:", err);
    }
}

function showEmptyDashboard() {
    console.log("Belum ada database rekap history di browser ini.");
}
