export const Dashboard = {
    renderKPI(data) {
        const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

        const profit = data.commission - data.spend;
        const roi = data.spend > 0 ? ((profit / data.spend) * 100).toFixed(2) : 0;
        const roas = data.spend > 0 ? (data.commission / data.spend).toFixed(2) : 0;
        const cpc = data.klikMeta > 0 ? (data.spend / data.klikMeta) : 0;
        const cr = data.klikShopee > 0 ? ((data.order / data.klikShopee) * 100).toFixed(2) : 0;

        document.getElementById('kpi-spend').innerText = formatIDR(data.spend);
        document.getElementById('kpi-klik-meta').innerText = data.klikMeta.toLocaleString('id-ID');
        document.getElementById('kpi-klik-shopee').innerText = data.klikShopee.toLocaleString('id-ID');
        document.getElementById('kpi-order').innerText = data.order.toLocaleString('id-ID');
        document.getElementById('kpi-komisi').innerText = formatIDR(data.commission);
        
        const profitEl = document.getElementById('kpi-profit');
        profitEl.innerText = formatIDR(profit);
        profitEl.className = profit >= 0 ? "text-success fw-bold" : "text-danger fw-bold";

        document.getElementById('kpi-roi').innerText = `${roi}%`;
        document.getElementById('kpi-roas').innerText = `${roas}x`;
        document.getElementById('kpi-cpc').innerText = formatIDR(cpc);
        document.getElementById('kpi-cr').innerText = `${cr}%`;
    }
};
