import { parseMetaAds } from './parser-meta.js';
import { parseClickReport } from './parser-click.js';
import { parseCommissionReport } from './parser-commission.js';
import { StorageEngine } from './storage.js';
import { Dashboard } from './dashboard.js';
import { HistoryManager } from './history.js';
import { renderCharts } from './chart.js';
import { Exporter } from './export.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initUploadForm();
    initBackupRestore();
    loadInitialData();
});

function showToast(msg, isError = false) {
    const toastEl = document.getElementById('liveToast');
    const toastMsg = document.getElementById('toast-message');
    toastEl.className = `toast align-items-center text-white ${isError ? 'bg-danger':'bg-success'} border-0`;
    toastMsg.innerText = msg;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function initNavigation() {
    document.querySelectorAll('.nav-target').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-target').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));

            e.currentTarget.classList.add('active');
            const target = e.currentTarget.getAttribute('data-target');
            document.getElementById(target).classList.remove('d-none');
            
            if (target === 'dashboard-section' || target === 'history-section') {
                loadInitialData();
            }
        });
    });
}

function loadInitialData() {
    const allReports = StorageEngine.getAllReports();
    const dates = Object.keys(allReports);
    
    if (dates.length > 0) {
        const latestDate = dates[dates.length - 1];
        document.getElementById('current-report-date').innerText = `Laporan Terakhir: ${latestDate}`;
        Dashboard.renderKPI(allReports[latestDate]);
        renderCharts(allReports);
        renderGlobalTagAnalysis(allReports);
    }
    
    HistoryManager.renderHistory((date) => {
        HistoryManager.showModalDetail(date);
    });
}

function initUploadForm() {
    const btnSubmit = document.getElementById('btn-submit-laporan');
    
    btnSubmit.addEventListener('click', async () => {
        const fileMeta = document.getElementById('file-meta').files[0];
        const fileClick = document.getElementById('file-click').files[0];
        const fileComm = document.getElementById('file-commission').files[0];

        if (!fileMeta || !fileClick || !fileComm) {
            showToast('Lu harus upload ketiga file CSV sekalian bro!', true);
            return;
        }

        document.getElementById('loading-spinner').classList.remove('d-none');

        try {
            const metaRes = await parseMetaAds(fileMeta);
            const clickRes = await parseClickReport(fileClick);
            const commRes = await parseCommissionReport(fileComm);

            let combinedTags = {};
            
            Object.keys(clickRes.tagBreakdown).forEach(t => {
                combinedTags[t] = { ...clickRes.tagBreakdown[t] };
            });
            Object.keys(commRes.tagCommBreakdown).forEach(t => {
                if(!combinedTags[t]) combinedTags[t] = { clicks: 0, orders: 0, commission: 0 };
                combinedTags[t].orders = commRes.tagCommBreakdown[t].orders;
                combinedTags[t].commission = commRes.tagCommBreakdown[t].commission;
            });

            const finalReportDay = {
                spend: metaRes.spend,
                klikMeta: metaRes.clicks,
                klikShopee: clickRes.totalClicks,
                order: commRes.totalOrders,
                commission: commRes.totalCommission,
                tags: combinedTags
            };

            let finalReportDate = metaRes.date; 

            StorageEngine.saveDayReport(finalReportDate, finalReportDay);
            
            showToast(`Sukses memproses data untuk laporan tanggal ${finalReportDate}!`);
            document.querySelector('[data-target="dashboard-section"]').click();

        } catch (error) {
            console.error(error);
            if(error.type === 'column') {
                showToast(`Kolom tidak ditemukan: [${error.message}]`, true);
            } else {
                showToast('Format CSV tidak dikenali / error parsing file.', true);
            }
        } finally {
            document.getElementById('loading-spinner').classList.add('d-none');
        }
    });
}

function renderGlobalTagAnalysis(allReports) {
    const tbody = document.getElementById('table-tag-body');
    tbody.innerHTML = '';
    
    let consolidatedTags = {};
    let totalAllCommission = 0;

    Object.keys(allReports).forEach(d => {
        const report = allReports[d];
        Object.keys(report.tags || {}).forEach(t => {
            if(!consolidatedTags[t]) consolidatedTags[t] = { clicks: 0, orders: 0, commission: 0 };
            consolidatedTags[t].clicks += report.tags[t].clicks || 0;
            consolidatedTags[t].orders += report.tags[t].orders || 0;
            consolidatedTags[t].commission += report.tags[t].commission || 0;
            totalAllCommission += report.tags[t].commission || 0;
        });
    });

    const sortedTags = Object.keys(consolidatedTags).sort((a, b) => consolidatedTags[b].commission - consolidatedTags[a].commission);
    const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

    sortedTags.forEach(tag => {
        const item = consolidatedTags[tag];
        const cr = item.clicks > 0 ? ((item.orders / item.clicks) * 100).toFixed(1) : 0;
        const percentage = totalAllCommission > 0 ? ((item.commission / totalAllCommission) * 100).toFixed(1) : 0;

        const tr = `
            <tr>
                <td><strong>${tag}</strong></td>
                <td>${item.clicks}</td>
                <td>${item.orders}</td>
                <td class="text-success">${formatIDR(item.commission)}</td>
                <td>${cr}%</td>
                <td>${percentage}%</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

function initBackupRestore() {
    document.getElementById('btn-export-json').addEventListener('click', () => Exporter.exportToJSON());
    document.getElementById('btn-export-csv').addEventListener('click', () => Exporter.exportToCSV());
    
    document.getElementById('btn-import-json').addEventListener('click', () => {
        const fileInput = document.getElementById('file-import-json');
        if(!fileInput.files[0]) {
            showToast('Pilih file backup json dulu!', true);
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const success = StorageEngine.importDB(e.target.result);
            if(success) {
                showToast('Database berhasil di-restore dengan sukses!');
                loadInitialData();
            } else {
                showToast('Gagal restore database. Cek validitas file json.', true);
            }
        };
        reader.readAsText(fileInput.files[0]);
    });
}
