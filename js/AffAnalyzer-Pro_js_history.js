import { StorageEngine } from './storage.js';

export const HistoryManager = {
    renderHistory(onDetailClickCallback) {
        const container = document.getElementById('history-container');
        container.innerHTML = '';
        const allData = StorageEngine.getAllReports();

        const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

        Object.keys(allData).reverse().forEach(dateStr => {
            const item = allData[dateStr];
            const profit = item.commission - item.spend;

            const cardHtml = `
                <div class="col">
                    <div class="card bg-grey text-white p-3 h-100 border-top border-primary border-4">
                        <h5 class="card-title text-primary"><i class="bi bi-calendar-event"></i> Laporan ${dateStr}</h5>
                        <div class="card-body px-0 py-2 small">
                            <div>Biaya Iklan: <strong>${formatIDR(item.spend)}</strong></div>
                            <div>Komisi: <strong>${formatIDR(item.commission)}</strong></div>
                            <div>Klik Shopee: <strong>${item.klikShopee}</strong></div>
                            <div class="${profit >= 0 ? 'text-success':'text-danger'}">Profit: <strong>${formatIDR(profit)}</strong></div>
                        </div>
                        <button class="btn btn-sm btn-primary mt-2 btn-detail-trigger" data-date="${dateStr}">
                            <i class="bi bi-eye"></i> Detail
                        </button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });

        document.querySelectorAll('.btn-detail-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const date = e.currentTarget.getAttribute('data-date');
                onDetailClickCallback(date);
            });
        });

        this.renderRekapTable(allData);
    },

    renderRekapTable(allData) {
        const tbody = document.getElementById('table-rekap-body');
        tbody.innerHTML = '';
        const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

        Object.keys(allData).forEach(dateStr => {
            const item = allData[dateStr];
            const profit = item.commission - item.spend;
            const roi = item.spend > 0 ? ((profit / item.spend) * 100).toFixed(1) : 0;

            const tr = `
                <tr>
                    <td>${dateStr}</td>
                    <td>${item.klikMeta}</td>
                    <td>${item.klikShopee}</td>
                    <td>${item.order}</td>
                    <td>${formatIDR(item.spend)}</td>
                    <td>${formatIDR(item.commission)}</td>
                    <td class="${profit >= 0 ? 'text-success':'text-danger'}">${formatIDR(profit)}</td>
                    <td>${roi}%</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', tr);
        });
    },

    showModalDetail(dateStr) {
        const report = StorageEngine.getReport(dateStr);
        if(!report) return;

        const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
        const profit = report.commission - report.spend;

        document.getElementById('md-tanggal').innerText = dateStr;
        document.getElementById('md-spend').innerText = formatIDR(report.spend);
        document.getElementById('md-klik-meta').innerText = report.klikMeta;
        document.getElementById('md-klik-shopee').innerText = report.klikShopee;
        document.getElementById('md-order').innerText = report.order;
        document.getElementById('md-komisi').innerText = formatIDR(report.commission);
        document.getElementById('md-profit').innerText = formatIDR(profit);
        document.getElementById('md-roi').innerText = `${report.spend > 0 ? ((profit/report.spend)*100).toFixed(2) : 0}%`;
        document.getElementById('md-cpc').innerText = formatIDR(report.klikMeta > 0 ? report.spend/report.klikMeta : 0);
        document.getElementById('md-cr').innerText = `${report.klikShopee > 0 ? ((report.order/report.klikShopee)*100).toFixed(2) : 0}%`;

        const mtBody = document.getElementById('md-tag-body');
        mtBody.innerHTML = '';
        Object.keys(report.tags || {}).forEach(t => {
            const tagData = report.tags[t];
            mtBody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${t}</td>
                    <td>${tagData.clicks || 0}</td>
                    <td>${tagData.orders || 0}</td>
                    <td>${formatIDR(tagData.commission || 0)}</td>
                </tr>
            `);
        });

        const modal = new bootstrap.Modal(document.getElementById('detailModal'));
        modal.show();
    }
};