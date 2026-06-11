// ============================================
// CSV Parsing Functions - Enhanced
// ============================================

function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
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
    if (!dateStr) return null;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
        let year = parts[0].length === 4 ? parts[0] : parts[2];
        let month = parts[1];
        let day = parts[0].length === 4 ? parts[1] : parts[0];
        
        if (parts[0].length !== 4) {
            day = parts[0];
            month = parts[1];
            year = parts[2];
        }
        
        year = year.length === 2 ? '20' + year : year;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    try {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {}
    
    return null;
}

function handleMetaAdsUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = parseCSV(event.target.result);
            const statusEl = document.getElementById('metaAdsStatus');
            
            let count = 0;
            const dailyData = {};
            
            data.forEach(row => {
                // Meta Ads columns: "Awal pelaporan" (start date)
                let dateStr = row['awal pelaporan'] || row['akhir pelaporan'] || row['date'] || '';
                const spend = parseFloat(row['jumlah yang dibelanjakan (idr)'] || row['spend'] || row['cost'] || 0);
                const clicks = parseInt(row['klik tautan unik'] || row['clicks'] || row['link click'] || 0);
                
                if (dateStr && spend > 0) {
                    const normalizedDate = normalizeDate(dateStr);
                    
                    if (normalizedDate) {
                        if (!dailyData[normalizedDate]) {
                            dailyData[normalizedDate] = { spend: 0, clicks: 0, count: 0 };
                        }
                        dailyData[normalizedDate].spend += spend;
                        dailyData[normalizedDate].clicks += clicks;
                        dailyData[normalizedDate].count++;
                    }
                }
            });

            // Apply aggregated data
            for (const [date, values] of Object.entries(dailyData)) {
                let report = app.reports.find(r => r.date === date);
                
                if (!report) {
                    report = createNewReport(date);
                    app.reports.push(report);
                }
                
                report.metaSpend = values.spend;
                report.metaClicks = values.clicks;
                count++;
            }

            app.saveData();
            statusEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${count} hari diproses (Total spend: ${formatCurrency(Object.values(dailyData).reduce((sum, v) => sum + v.spend, 0))})`;
            e.target.value = '';
        } catch (error) {
            document.getElementById('metaAdsStatus').innerHTML = 
                `<i class="fas fa-exclamation-circle text-danger"></i> Error: ${error.message}`;
        }
    };
    reader.readAsText(file);
}

function handleShopeeClicksUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = parseCSV(event.target.result);
            const statusEl = document.getElementById('shopeeClicksStatus');
            
            let count = 0;
            const dailyData = {};
            
            data.forEach(row => {
                // Shopee Clicks columns
                let dateStr = row['日期'] || row['date'] || row['tanggal'] || '';
                const clicks = parseInt(row['点击数'] || row['clicks'] || row['klik'] || 0);

                if (dateStr && clicks > 0) {
                    const normalizedDate = normalizeDate(dateStr);
                    if (normalizedDate) {
                        if (!dailyData[normalizedDate]) {
                            dailyData[normalizedDate] = { clicks: 0, count: 0 };
                        }
                        dailyData[normalizedDate].clicks += clicks;
                        dailyData[normalizedDate].count++;
                    }
                }
            });

            // Apply aggregated data
            for (const [date, values] of Object.entries(dailyData)) {
                let report = app.reports.find(r => r.date === date);
                
                if (!report) {
                    report = createNewReport(date);
                    app.reports.push(report);
                }
                
                report.shopeeClicks = values.clicks;
                count++;
            }

            app.saveData();
            statusEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${count} hari diproses (Total clicks: ${Object.values(dailyData).reduce((sum, v) => sum + v.clicks, 0)})`;
            e.target.value = '';
        } catch (error) {
            document.getElementById('shopeeClicksStatus').innerHTML = 
                `<i class="fas fa-exclamation-circle text-danger"></i> Error: ${error.message}`;
        }
    };
    reader.readAsText(file);
}

function handleShopeeCommissionUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = parseCSV(event.target.result);
            const statusEl = document.getElementById('shopeeCommissionStatus');
            
            let count = 0;
            const dailyData = {};
            
            data.forEach(row => {
                // Shopee Commission columns
                let dateStr = row['waktu pemesanan'] || row['waktu klik'] || row['日期'] || row['date'] || row['tanggal'] || '';
                const commission = parseFloat(row['komisi bersih affiliate (rp)'] || row['total komisi per pesanan(rp)'] || row['commission'] || 0);
                const orders = parseInt(row['status pemesanan'] === 'selesai' ? 1 : 0);

                if (dateStr) {
                    const normalizedDate = normalizeDate(dateStr);
                    if (normalizedDate) {
                        if (!dailyData[normalizedDate]) {
                            dailyData[normalizedDate] = { commission: 0, orders: 0, count: 0 };
                        }
                        if (commission > 0) {
                            dailyData[normalizedDate].commission += commission;
                        }
                        if (orders > 0) {
                            dailyData[normalizedDate].orders += orders;
                        }
                        dailyData[normalizedDate].count++;
                    }
                }
            });

            // Apply aggregated data
            for (const [date, values] of Object.entries(dailyData)) {
                let report = app.reports.find(r => r.date === date);
                
                if (!report) {
                    report = createNewReport(date);
                    app.reports.push(report);
                }
                
                report.commission += values.commission;
                report.orders += values.orders;
                count++;
            }

            app.saveData();
            const totalCommission = Object.values(dailyData).reduce((sum, v) => sum + v.commission, 0);
            statusEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${count} hari diproses (Total komisi: ${formatCurrency(totalCommission)})`;
            e.target.value = '';
        } catch (error) {
            document.getElementById('shopeeCommissionStatus').innerHTML = 
                `<i class="fas fa-exclamation-circle text-danger"></i> Error: ${error.message}`;
        }
    };
    reader.readAsText(file);
}
