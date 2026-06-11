// ============================================
// AffAnalyzer Pro - Main Application Logic
// ============================================

// Data Management
const app = {
    reports: [],
    charts: {},
    currentReportId: null,

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDashboard();
    },

    loadData() {
        const saved = localStorage.getItem('affAnalyzerData');
        this.reports = saved ? JSON.parse(saved) : [];
    },

    saveData() {
        localStorage.setItem('affAnalyzerData', JSON.stringify(this.reports));
        this.updateDashboard();
    },

    setupEventListeners() {
        // File uploads
        document.getElementById('metaAdsFile')?.addEventListener('change', e => this.handleMetaAdsUpload(e));
        document.getElementById('shopeeClicksFile')?.addEventListener('change', e => this.handleShopeeClicksUpload(e));
        document.getElementById('shopeeCommissionFile')?.addEventListener('change', e => this.handleShopeeCommissionUpload(e));
        
        // Import file
        document.getElementById('importFileInput')?.addEventListener('change', e => this.handleImportBackup(e));
    }
};

// ============================================
// CSV Parsing Functions
// ============================================

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const obj = {};
        
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        
        data.push(obj);
    }
    
    return data;
}

function normalizeDate(dateStr) {
    // Handle various date formats
    if (!dateStr) return null;
    
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Try DD/MM/YYYY or MM/DD/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        let year = parts[2];
        let month = parts[1];
        let day = parts[0];
        
        // Assume DD/MM/YYYY if first part > 12
        if (parseInt(parts[0]) > 12) {
            day = parts[0];
            month = parts[1];
        } else {
            day = parts[0];
            month = parts[1];
        }
        
        year = year.length === 2 ? '20' + year : year;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try parsing as date string
    try {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {}
    
    return null;
}

app.handleMetaAdsUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = parseCSV(event.target.result);
            const statusEl = document.getElementById('metaAdsStatus');
            
            data.forEach(row => {
                // Look for date column (various possible names)
                const dateKey = Object.keys(row).find(k => 
                    k.toLowerCase().includes('date') || k.toLowerCase().includes('date')
                );
                const spendKey = Object.keys(row).find(k => 
                    k.toLowerCase().includes('spend') || k.toLowerCase().includes('cost') || k.toLowerCase().includes('biaya')
                );
                const clicksKey = Object.keys(row).find(k => 
                    k.toLowerCase().includes('click') || k.toLowerCase().includes('clk')
                );

                if (dateKey && spendKey && clicksKey) {
                    const normalizedDate = normalizeDate(row[dateKey]);
                    if (normalizedDate) {
                        let report = app.reports.find(r => r.date === normalizedDate);
                        
                        if (!report) {
                            report = createNewReport(normalizedDate);
                            app.reports.push(report);
                        }
                        
                        report.metaSpend = parseFloat(row[spendKey]) || 0;
                        report.metaClicks = parseInt(row[clicksKey]) || 0;
                    }
                }
            });

            app.saveData();
            statusEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${data.length} baris diproses`;
            e.target.value = '';
        } catch (error) {
            document.getElementById('metaAdsStatus').innerHTML = 
                `<i class="fas fa-exclamation-circle text-danger"></i> Error: ${error.message}`;
        }
    };
    reader.readAsText(file);
};

app.handleShopeeClicksUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = parseCSV(event.target.result);
            const statusEl = document.getElementById('shopeeClicksStatus');
            
            data.forEach(row => {
                // Shopee uses Chinese headers
                const dateKey = Object.keys(row).find(k => 
                    k.includes('日期') || k.toLowerCase().includes('date')
                );
                const clicksKey = Object.keys(row).find(k => 
                    k.includes('点击数') || k.includes('点击') || k.toLowerCase().includes('click')
                );

                if (dateKey && clicksKey) {
                    const normalizedDate = normalizeDate(row[dateKey]);
                    if (normalizedDate) {
                        let report = app.reports.find(r => r.date === normalizedDate);
                        
                        if (!report) {
                            report = createNewReport(normalizedDate);
                            app.reports.push(report);
                        }
                        
                        report.shopeeClicks = parseInt(row[clicksKey]) || 0;
                    }
                }
            });

            app.saveData();
            statusEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${data.length} baris diproses`;
            e.target.value = '';
        } catch (error) {
            document.getElementById('shopeeClicksStatus').innerHTML = 
                `<i class="fas fa-exclamation-circle text-danger"></i> Error: ${error.message}`;
        }
    };
    reader.readAsText(file);
};

app.handleShopeeCommissionUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = parseCSV(event.target.result);
            const statusEl = document.getElementById('shopeeCommissionStatus');
            
            data.forEach(row => {
                // Shopee commission headers
                const dateKey = Object.keys(row).find(k => 
                    k.includes('日期') || k.toLowerCase().includes('date')
                );
                const ordersKey = Object.keys(row).find(k => 
                    k.includes('订单数') || k.includes('订单') || k.toLowerCase().includes('order')
                );
                const commissionKey = Object.keys(row).find(k => 
                    k.includes('佣金') || k.toLowerCase().includes('commission') || k.toLowerCase().includes('komisi')
                );

                if (dateKey && ordersKey && commissionKey) {
                    const normalizedDate = normalizeDate(row[dateKey]);
                    if (normalizedDate) {
                        let report = app.reports.find(r => r.date === normalizedDate);
                        
                        if (!report) {
                            report = createNewReport(normalizedDate);
                            app.reports.push(report);
                        }
                        
                        report.orders = parseInt(row[ordersKey]) || 0;
                        report.commission = parseFloat(row[commissionKey]) || 0;
                    }
                }
            });

            app.saveData();
            statusEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${data.length} baris diproses`;
            e.target.value = '';
        } catch (error) {
            document.getElementById('shopeeCommissionStatus').innerHTML = 
                `<i class="fas fa-exclamation-circle text-danger"></i> Error: ${error.message}`;
        }
    };
    reader.readAsText(file);
};

// ============================================
// Report Management
// ============================================

function createNewReport(date) {
    return {
        id: Date.now() + Math.random(),
        date: date,
        metaSpend: 0,
        metaClicks: 0,
        shopeeClicks: 0,
        orders: 0,
        commission: 0
    };
}

function calculateMetrics(report) {
    const totalSpend = report.metaSpend;
    const totalClicks = report.metaClicks + report.shopeeClicks;
    const totalCommission = report.commission;
    
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const cr = totalClicks > 0 ? (report.orders / totalClicks) * 100 : 0;
    const profit = totalCommission - totalSpend;
    const roi = totalSpend > 0 ? (profit / totalSpend) * 100 : 0;

    return {
        totalSpend,
        totalClicks,
        cpc,
        cr,
        profit,
        roi,
        totalCommission
    };
}

function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayReport = app.reports.find(r => r.date === today);
    const metrics = todayReport ? calculateMetrics(todayReport) : {
        totalSpend: 0,
        totalClicks: 0,
        cpc: 0,
        cr: 0,
        profit: 0,
        roi: 0,
        totalCommission: 0
    };

    // Update KPI cards
    document.getElementById('todaySpend').textContent = formatCurrency(metrics.totalSpend);
    document.getElementById('todayCommission').textContent = formatCurrency(metrics.totalCommission);
    document.getElementById('todayProfit').textContent = formatCurrency(metrics.profit);
    document.getElementById('todayProfitStatus').textContent = metrics.profit >= 0 ? 
        `<i class="fas fa-arrow-up"></i> Profit` : `<i class="fas fa-arrow-down"></i> Rugi`;
    document.getElementById('todayROI').textContent = metrics.roi.toFixed(2) + '%';
    
    // Update secondary stats
    document.getElementById('todayMetaClicks').textContent = todayReport?.metaClicks || 0;
    document.getElementById('todayCPC').textContent = formatCurrency(metrics.cpc);
    document.getElementById('todayShopeeClicks').textContent = todayReport?.shopeeClicks || 0;
    document.getElementById('todayOrders').textContent = todayReport?.orders || 0;
    document.getElementById('todayCR').textContent = metrics.cr.toFixed(2) + '%';
    document.getElementById('totalReports').textContent = app.reports.length;

    updateReportsTable();
    updateMonthlyData();
    updateCharts();
}

function updateReportsTable() {
    const tbody = document.getElementById('reportsTableBody');
    
    if (app.reports.length === 0) {
        tbody.innerHTML = `
            <tr class="text-center">
                <td colspan="7" class="text-muted py-4">Belum ada laporan. <a href="#" onclick="showUpload()">Upload data</a></td>
            </tr>
        `;
        return;
    }

    const sortedReports = [...app.reports].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sortedReports.map(report => {
        const metrics = calculateMetrics(report);
        const profitClass = metrics.profit >= 0 ? 'badge-profit' : 'badge-loss';
        const profitText = metrics.profit >= 0 ? 
            `<span class="${profitClass}">+${formatCurrency(metrics.profit)}</span>` :
            `<span class="${profitClass}">${formatCurrency(metrics.profit)}</span>`;

        return `
            <tr>
                <td><strong>${new Date(report.date).toLocaleDateString('id-ID')}</strong></td>
                <td>${formatCurrency(metrics.totalSpend)}</td>
                <td>${formatCurrency(metrics.totalCommission)}</td>
                <td>${report.shopeeClicks}</td>
                <td>${profitText}</td>
                <td>${metrics.roi.toFixed(2)}%</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="showDetailReport(${report.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteReport(${report.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateMonthlyData() {
    const today = new Date();
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    
    const monthReports = app.reports.filter(r => r.date.startsWith(currentMonth));
    
    let totalSpend = 0, totalCommission = 0, totalProfit = 0;

    monthReports.forEach(report => {
        const metrics = calculateMetrics(report);
        totalSpend += metrics.totalSpend;
        totalCommission += metrics.totalCommission;
        totalProfit += metrics.profit;
    });

    const monthlyROI = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;

    document.getElementById('monthlySpend').textContent = formatCurrency(totalSpend);
    document.getElementById('monthlyCommission').textContent = formatCurrency(totalCommission);
    document.getElementById('monthlyProfit').textContent = formatCurrency(totalProfit);
    document.getElementById('monthlyROI').textContent = monthlyROI.toFixed(2) + '%';
}

function showDetailReport(reportId) {
    const report = app.reports.find(r => r.id === reportId);
    if (!report) return;

    app.currentReportId = reportId;
    const metrics = calculateMetrics(report);

    const detailHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Tanggal:</strong> ${new Date(report.date).toLocaleDateString('id-ID')}</p>
                <p><strong>Spend:</strong> ${formatCurrency(metrics.totalSpend)}</p>
                <p><strong>Komisi:</strong> ${formatCurrency(metrics.totalCommission)}</p>
                <p><strong>Klik Meta:</strong> ${report.metaClicks}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Klik Shopee:</strong> ${report.shopeeClicks}</p>
                <p><strong>Pesanan:</strong> ${report.orders}</p>
                <p><strong>CPC:</strong> ${formatCurrency(metrics.cpc)}</p>
                <p><strong>CR:</strong> ${metrics.cr.toFixed(2)}%</p>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-md-6">
                <h6>ROI</h6>
                <h4 class="${metrics.roi >= 0 ? 'text-success' : 'text-danger'}">
                    ${metrics.roi.toFixed(2)}%
                </h4>
            </div>
            <div class="col-md-6">
                <h6>Profit/Rugi</h6>
                <h4 class="${metrics.profit >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(metrics.profit)}
                </h4>
            </div>
        </div>
    `;

    document.getElementById('detailContent').innerHTML = detailHTML;
    new bootstrap.Modal(document.getElementById('detailModal')).show();
}

function showCreateReportModal() {
    document.getElementById('createDate').valueAsDate = new Date();
    new bootstrap.Modal(document.getElementById('createReportModal')).show();
}

function saveCreateReport() {
    const report = {
        id: Date.now() + Math.random(),
        date: document.getElementById('createDate').value,
        metaSpend: parseFloat(document.getElementById('createSpend').value) || 0,
        metaClicks: parseInt(document.getElementById('createMetaClicks').value) || 0,
        shopeeClicks: parseInt(document.getElementById('createShopeeClicks').value) || 0,
        orders: parseInt(document.getElementById('createOrders').value) || 0,
        commission: parseFloat(document.getElementById('createCommission').value) || 0
    };

    app.reports.push(report);
    app.saveData();
    bootstrap.Modal.getInstance(document.getElementById('createReportModal')).hide();
}

function editCurrentReport() {
    const report = app.reports.find(r => r.id === app.currentReportId);
    if (!report) return;

    document.getElementById('editDate').value = report.date;
    document.getElementById('editSpend').value = report.metaSpend;
    document.getElementById('editCommission').value = report.commission;
    document.getElementById('editMetaClicks').value = report.metaClicks;
    document.getElementById('editShopeeClicks').value = report.shopeeClicks;
    document.getElementById('editOrders').value = report.orders;

    bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
    new bootstrap.Modal(document.getElementById('editModal')).show();
}

function saveEditReport() {
    const report = app.reports.find(r => r.id === app.currentReportId);
    if (!report) return;

    report.date = document.getElementById('editDate').value;
    report.metaSpend = parseFloat(document.getElementById('editSpend').value) || 0;
    report.commission = parseFloat(document.getElementById('editCommission').value) || 0;
    report.metaClicks = parseInt(document.getElementById('editMetaClicks').value) || 0;
    report.shopeeClicks = parseInt(document.getElementById('editShopeeClicks').value) || 0;
    report.orders = parseInt(document.getElementById('editOrders').value) || 0;

    app.saveData();
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    alert('Laporan berhasil diperbarui');
}

function deleteCurrentReport() {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    
    app.reports = app.reports.filter(r => r.id !== app.currentReportId);
    app.saveData();
    bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
    alert('Laporan berhasil dihapus');
}

function deleteReport(reportId) {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    
    app.reports = app.reports.filter(r => r.id !== reportId);
    app.saveData();
}

// ============================================
// Navigation Functions
// ============================================

function hideAllSections() {
    document.querySelectorAll('.section').forEach(s => s.classList.add('d-none'));
}

function showDashboard() {
    hideAllSections();
    document.getElementById('dashboard').classList.remove('d-none');
    setTimeout(() => updateCharts(), 100);
}

function showUpload() {
    hideAllSections();
    document.getElementById('upload').classList.remove('d-none');
}

function showReports() {
    hideAllSections();
    document.getElementById('reports').classList.remove('d-none');
}

function showMonthly() {
    hideAllSections();
    document.getElementById('monthly').classList.remove('d-none');
    setTimeout(() => updateCharts(), 100);
}

function showAnalytics() {
    hideAllSections();
    document.getElementById('analytics').classList.remove('d-none');
    setTimeout(() => updateCharts(), 100);
}

// ============================================
// Chart Functions
// ============================================

function updateCharts() {
    updateProfit7DaysChart();
    updateRevenueCompositionChart();
    updateMonthlyPerformanceChart();
    updateCommissionChart();
    updateSpendChart();
    updateROIChart();
    updateCRChart();
}

function updateProfit7DaysChart() {
    const today = new Date();
    const dates = [];
    const profits = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const report = app.reports.find(r => r.date === dateStr);
        const metrics = report ? calculateMetrics(report) : { profit: 0 };

        dates.push(new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' }));
        profits.push(metrics.profit);
    }

    createChart('profitChart7Days', 'line', {
        labels: dates,
        datasets: [{
            label: 'Profit (Rp)',
            data: profits,
            borderColor: '#00b894',
            backgroundColor: 'rgba(0, 184, 148, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#00b894',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        }]
    });
}

function updateRevenueCompositionChart() {
    const today = new Date();
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    
    const monthReports = app.reports.filter(r => r.date.startsWith(currentMonth));
    let totalCommission = 0;

    monthReports.forEach(report => {
        totalCommission += report.commission;
    });

    const metaSpent = monthReports.reduce((sum, r) => sum + r.metaSpend, 0);
    const profit = totalCommission - metaSpent;

    createChart('revenueCompositionChart', 'doughnut', {
        labels: ['Komisi', 'Biaya Iklan', 'Profit'],
        datasets: [{
            data: [totalCommission, metaSpent, Math.max(0, profit)],
            backgroundColor: [
                '#4ecdc4',
                '#ff6b6b',
                '#95e1d3'
            ],
            borderColor: '#fff',
            borderWidth: 2
        }]
    });
}

function updateMonthlyPerformanceChart() {
    const today = new Date();
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    
    const monthReports = app.reports
        .filter(r => r.date.startsWith(currentMonth))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const dates = [];
    const spends = [];
    const commissions = [];
    const profits = [];

    monthReports.forEach(report => {
        const metrics = calculateMetrics(report);
        dates.push(new Date(report.date).getDate());
        spends.push(metrics.totalSpend);
        commissions.push(metrics.totalCommission);
        profits.push(metrics.profit);
    });

    createChart('monthlyPerformanceChart', 'bar', {
        labels: dates.map(d => `${d} ${today.toLocaleDateString('id-ID', { month: 'short' })}`),
        datasets: [
            {
                label: 'Spend (Rp)',
                data: spends,
                backgroundColor: '#ff6b6b',
                borderRadius: 6
            },
            {
                label: 'Komisi (Rp)',
                data: commissions,
                backgroundColor: '#4ecdc4',
                borderRadius: 6
            },
            {
                label: 'Profit (Rp)',
                data: profits,
                backgroundColor: '#95e1d3',
                borderRadius: 6
            }
        ]
    });
}

function updateCommissionChart() {
    const last30Days = getLast30Days();
    const commissions = [];

    last30Days.forEach(dateStr => {
        const report = app.reports.find(r => r.date === dateStr);
        commissions.push(report ? report.commission : 0);
    });

    createChart('commissionChart', 'line', {
        labels: last30Days.map(d => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })),
        datasets: [{
            label: 'Komisi Harian (Rp)',
            data: commissions,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            tension: 0.4,
            fill: true
        }]
    });
}

function updateSpendChart() {
    const last30Days = getLast30Days();
    const spends = [];

    last30Days.forEach(dateStr => {
        const report = app.reports.find(r => r.date === dateStr);
        spends.push(report ? report.metaSpend : 0);
    });

    createChart('spendChart', 'area', {
        labels: last30Days.map(d => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })),
        datasets: [{
            label: 'Spend Harian (Rp)',
            data: spends,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            tension: 0.4,
            fill: true
        }]
    });
}

function updateROIChart() {
    const last30Days = getLast30Days();
    const rois = [];

    last30Days.forEach(dateStr => {
        const report = app.reports.find(r => r.date === dateStr);
        const metrics = report ? calculateMetrics(report) : { roi: 0 };
        rois.push(metrics.roi);
    });

    createChart('roiChart', 'line', {
        labels: last30Days.map(d => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })),
        datasets: [{
            label: 'ROI (%)',
            data: rois,
            borderColor: '#ffd93d',
            backgroundColor: 'rgba(255, 217, 61, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#ffd93d'
        }]
    });
}

function updateCRChart() {
    const last30Days = getLast30Days();
    const crs = [];

    last30Days.forEach(dateStr => {
        const report = app.reports.find(r => r.date === dateStr);
        const metrics = report ? calculateMetrics(report) : { cr: 0 };
        crs.push(metrics.cr);
    });

    createChart('crChart', 'bar', {
        labels: last30Days.map(d => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })),
        datasets: [{
            label: 'Conversion Rate (%)',
            data: crs,
            backgroundColor: '#6c5ce7',
            borderRadius: 6
        }]
    });
}

function createChart(canvasId, type, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (app.charts[canvasId]) {
        app.charts[canvasId].destroy();
    }

    app.charts[canvasId] = new Chart(canvas, {
        type: type,
        data: config,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (type === 'bar' || type === 'line') {
                                if (config.datasets[0]?.label?.includes('(Rp)')) {
                                    return formatCurrency(value);
                                } else if (config.datasets[0]?.label?.includes('%')) {
                                    return value.toFixed(1) + '%';
                                }
                            }
                            return value;
                        }
                    }
                }
            }
        }
    });
}

function getLast30Days() {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
}

// ============================================
// Backup & Restore Functions
// ============================================

function exportBackup() {
    const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: app.reports
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `affanalyzer-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importBackup() {
    document.getElementById('importFileInput').click();
}

app.handleImportBackup = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const backup = JSON.parse(event.target.result);
            
            if (!backup.data || !Array.isArray(backup.data)) {
                throw new Error('Format backup tidak valid');
            }

            if (confirm('Ini akan menimpa semua data yang ada. Lanjutkan?')) {
                app.reports = backup.data;
                app.saveData();
                alert('Data berhasil di-restore');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
};

function clearAllData() {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data? Ini tidak bisa dibatalkan!')) {
        app.reports = [];
        app.saveData();
        alert('Semua data berhasil dihapus');
    }
}

// ============================================
// Utility Functions
// ============================================

function formatCurrency(value) {
    if (value === 0) return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
}

// ============================================
// Initialize Application
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    app.init();
    showDashboard();
});
