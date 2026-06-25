// ==========================================
// 1. IMPORT MODUL (Pastikan path file lu bener)
// ==========================================
import { parseMetaAds } from './parser-meta.js';
import { parseClickReport } from './parser-click.js';
import { parseCommissionReport } from './parser-commission.js';

// Selector Element DOM (Sesuaikan dengan ID di index.html lu!)
const fileMetaInput = document.getElementById('file-meta');
const fileClickInput = document.getElementById('file-click');
const fileCommissionInput = document.getElementById('file-commission');
const btnSubmitLaporan = document.getElementById('btn-submit-laporan');

// ==========================================
// 2. LOAD DATA AWAL SAAT WEB DIBUKA
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Ambil database array history lama dari LocalStorage
        const currentHistory = JSON.parse(localStorage.getItem('affAnalyzerData')) || [];
        
        if (currentHistory.length > 0) {
            // Panggil fungsi render bawaan lu yang lama di sini biar grafik & card gak 0
            if (typeof renderDashboardGlobal === 'function') {
                renderDashboardGlobal(currentHistory);
            }
            
            // Ambil data hari terakhir untuk breakdown tabel tag
            const dataTerakhir = currentHistory[currentHistory.length - 1];
            if (dataTerakhir && dataTerakhir.tagDetails) {
                renderTagAnalysis(dataTerakhir.tagDetails, dataTerakhir.totalCommission || 0);
            }
        } else {
            if (typeof showEmptyDashboard === 'function') showEmptyDashboard();
        }
    } catch (err) {
        console.error("Error loading data awal:", err);
    }
});

// ==========================================
// 3. PROSES SUBMIT & OTOMATIS AKUMULASI SIMPAN
// ==========================================
if (btnSubmitLaporan) {
    btnSubmitLaporan.addEventListener('click', async function() {
        try {
            if (!fileMetaInput || !fileClickInput || !fileCommissionInput) {
                alert("Error: Element input file tidak ditemukan di HTML!");
                return;
            }

            const fileMeta = fileMetaInput.files[0];
            const fileClick = fileClickInput.files[0];
            const fileCommission = fileCommissionInput.files[0];

            if (!fileMeta || !fileClick || !fileCommission) {
                alert("Harap masukkan ketiga file CSV terlebih dahulu secara bersamaan!");
                return;
            }

            // Jalankan parser simultan
            const metaResult = await parseMetaAds(fileMeta);
            const clickResult = await parseClickReport(fileClick);
            const commissionResult = await parseCommissionReport(fileCommission);

            // Gabungkan data (Tanggal otomatis bersumber dari isi file CSV Meta Ads)
            const currentLogReport = combineReports(metaResult, clickResult, commissionResult);
            
            let currentHistory = JSON.parse(localStorage.getItem('affAnalyzerData')) || [];

            // Cek apakah data tanggal ini sudah pernah disubmit sebelumnya
            const existingDataIndex = currentHistory.findIndex(item => item.date === currentLogReport.date);

            if (existingDataIndex !== -1) {
                if (confirm(`Data Rekap untuk tanggal [ ${currentLogReport.date} ] sudah ada.\nApakah lu mau memperbarui data tanggal tersebut?`)) {
                    currentHistory[existingDataIndex] = currentLogReport;
                } else {
                    return; 
                }
            } else {
                currentHistory.push(currentLogReport);
            }

            // Urutkan history berdasarkan tanggal lama ke baru biar grafik rapi
            currentHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Simpan permanen ke LocalStorage
            localStorage.setItem('affAnalyzerData', JSON.stringify(currentHistory));

            alert(`Sukses! Rekap data tanggal ${currentLogReport.date} otomatis tersimpan.`);
            window.location.reload();

        } catch (error) {
            console.error("Error submit:", error);
            alert(`Gagal memproses laporan: ${error.message || error}`);
        }
    });
}

// ==========================================
// 4. LOGIKA INTEGRASI META SPEND & TAG SHOPEE
// ==========================================
function combineReports(metaData, clickData, commissionData) {
    let finalData = {
        date: metaData.date,
        totalSpend: metaData.spend || 0,
        totalClicks: clickData.totalClicks || 0,
        totalOrders: commissionData.totalOrders || 0,
        totalCommission: commissionData.totalCommission || 0,
        tagDetails: {}
    };

    const clickBreakdown = clickData.tagBreakdown || {};
    const commBreakdown = commissionData.tagCommBreakdown || {};

    const allTags = new Set([
        ...Object.keys(clickBreakdown),
        ...Object.keys(commBreakdown)
    ]);

    allTags.forEach(tag => {
        const clickInfo = clickBreakdown[tag] || { clicks: 0 };
        const commInfo = commBreakdown[tag] || { orders: 0, commission: 0 };

        finalData.tagDetails[tag] = {
            clicks: clickInfo.clicks || 0,
            orders: commInfo.orders || 0,
            commission: commInfo.commission || 0,
            spend: 0 
        };
    });

    if (metaData.campaignDetails) {
        Object.keys(metaData.campaignDetails).forEach(campName => {
            const campSpend = metaData.campaignDetails[campName].spend || 0;

            const matchedTag = Object.keys(finalData.tagDetails).find(tag => 
                tag.toLowerCase().includes(campName.toLowerCase()) || 
                campName.toLowerCase().includes(tag.toLowerCase())
            );

            if (matchedTag) {
                finalData.tagDetails[matchedTag].spend += campSpend;
            } else {
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

// ==========================================
// 5. RENDER TABEL ANALISA BREAKDOWN + SPEND & ROI
// ==========================================
function renderTagAnalysis(tagDetails, totalCommissionGlobal) {
    try {
        const tbody = document.getElementById('table-tag-body');
        if (!tbody) return; 
        
        tbody.innerHTML = ''; 

        Object.keys(tagDetails).forEach(tag => {
            const data = tagDetails[tag];
            const spend = data.spend || 0;

            const cr = data.clicks > 0 ? ((data.orders / data.clicks) * 100).toFixed(2) : '0.00';
            const pctKomisi = totalCommissionGlobal > 0 ? ((data.commission / totalCommissionGlobal) * 100).toFixed(2) : '0.00';

            let roiHTML = '-';
            if (spend > 0) {
                let roi = ((data.commission - spend) / spend) * 100;
                const roiClass = roi >= 0 ? 'text-success' : 'text-danger';
                roiHTML = `<span class="${roiClass} fw-bold">${roi.toFixed(2)}%</span>`;
            }

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

        const tagSection = document.getElementById('tag-section');
        if (tagSection) tagSection.classList.remove('d-none');

    } catch (err) {
        console.error("Gagal merender tabel analisa tag:", err);
    }
}

// =========================================================================
// JIKA LU PUNYA FUNGSI BAWAAN LAMA SEPERTI:
// renderDashboardGlobal(), renderTabelHistory(), updateCharts(), showEmptyDashboard()
// PASTIKAN TETAP DITARUH/DIPASTE DI BAGIAN PALING BAWAH SINI AGAR TIDAK HILANG!
// =========================================================================
