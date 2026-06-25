let chartKeuanganInstance = null;
let chartTrafficInstance = null;

export function renderCharts(allReports) {
    const dates = Object.keys(allReports);
    const spends = [];
    const commissions = [];
    const profits = [];
    const clicksMeta = [];
    const clicksShopee = [];

    dates.forEach(d => {
        const r = allReports[d];
        spends.push(r.spend);
        commissions.push(r.commission);
        profits.push(r.commission - r.spend);
        clicksMeta.push(r.klikMeta);
        clicksShopee.push(r.klikShopee);
    });

    const ctxKeuangan = document.getElementById('chart-keuangan').getContext('2d');
    if(chartKeuanganInstance) chartKeuanganInstance.destroy();
    chartKeuanganInstance = new Chart(ctxKeuangan, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                { label: 'Spend', borderColor: '#dc3545', data: spends, fill: false },
                { label: 'Komisi', borderColor: '#198754', data: commissions, fill: false },
                { label: 'Profit', borderColor: '#0dcaf0', data: profits, fill: false }
            ]
        },
        options: { responsive: true, scales: { y: { grid: { color: '#343a40' } } } }
    });

    const ctxTraffic = document.getElementById('chart-traffic').getContext('2d');
    if(chartTrafficInstance) chartTrafficInstance.destroy();
    chartTrafficInstance = new Chart(ctxTraffic, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                { label: 'Klik Meta', backgroundColor: '#0d6efd', data: clicksMeta },
                { label: 'Klik Shopee', backgroundColor: '#ffc107', data: clicksShopee }
            ]
        },
        options: { responsive: true, scales: { y: { grid: { color: '#343a40' } } } }
    });
}
