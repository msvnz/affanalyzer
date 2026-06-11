// ============================================
// CSV Parsing Functions - Debug Enhanced
// ============================================

function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];
    
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
    
    console.log('Parsed CSV:', { headers, rowCount: data.length, firstRow: data[0] });
    return data;
}

function normalizeDate(dateStr) {
    if (!dateStr || dateStr === 'archived') return null;
    
    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Format DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
        let year, month, day;
        
        if (parts[0].length === 4) {
            // YYYY-MM-DD format
            year = parts[0];
            month = parts[1];
            day = parts[2];
        } else {
            // DD-MM-YYYY format
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

function findColumnByKeywords(headers, keywords) {
    const headerLower = headers.map(h => h.toLowerCase());
    
    for (let keyword of keywords) {
        const found = headerLower.findIndex(h => h.includes(keyword.toLowerCase()));
        if (found !== -1) return headers[found];
    }
    return null;
}

function handleMetaAdsUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const text = event.target.result;
            const data = parseCSV(text);
            const statusEl = document.getElementById('metaAdsStatus');
            
            if (data.length === 0) {
                statusEl.innerHTML = `<i class="fas fa-exclamation-circle text-warning"></i> Tidak ada data ditemukan`;
                return;
            }

            // Get headers
            const headers = Object.keys(data[0]);
            console.log('Meta Ads Headers:', headers);
            
            // Find relevant columns
            const dateCol = findColumnByKeywords(headers, ['awal pelaporan', 'akhir pelaporan', 'date', 'tanggal']);
            const spendCol = findColumnByKeywords(headers, ['jumlah yang dibelanjakan', 'spend', 'biaya', 'cost', 'idr']);
            const clickCol = findColumnByKeywords(headers, ['klik tautan', 'klik', 'click', 'link click']);
            
            console.log('Found columns:', { dateCol, spendCol, clickCol });
            
            let count = 0;
            const dailyData = {};
            
            data.forEach((row, idx) => {
                let dateStr = dateCol ? row[dateCol] : '';
                let spend = spendCol ? parseFloat(row[spendCol]) : 0;
                let clicks = clickCol ? parseInt(row[clickCol]) : 0;
                
                console.log(`Row ${idx}:`, { dateStr, spend, clicks, rowStatus: row['Berakhir'] || row['Status'] });
                
                if (dateStr && dateStr !== 'archived' && !isNaN(spend) && spend >= 0) {
                    const normalizedDate = normalizeDate(dateStr);
                    
                    if (normalizedDate) {
                        if (!dailyData[normalizedDate]) {
                            dailyData[normalizedDate] = { spend: 0, clicks: 0 };
                        }
                        dailyData[normalizedDate].spend += spend;
                        dailyData[normalizedDate].clicks += clicks;
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
            const totalSpend = Object.values(dailyData).reduce((sum, v) => sum + v.spend, 0);
            statusEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${count} hari diproses | Spend: ${formatCurrency(totalSpend)}`;
            e.target.value = '';
        } catch (error) {
            console.error('Meta Ads Error:', error);
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
            const text = event.target.result;
            const data = parseCSV(text);
            const statusEl = document.getElementById('shopeeClicksStatus');
            
            if (data.length === 0) {
                statusEl.innerHTML = `<i class="fas fa-exclamation-circle text-warning"></i> Tidak ada data ditemukan`;
                return;
            }

            // Get headers
            const headers = Object.keys(data[0]);
            console.log('Shopee Clicks Headers:', headers);
            
            // Find relevant columns
            const dateCol = findColumnByKeywords(headers, ['日期', 'date', 'tanggal', 'waktu']);
            const clickCol = findColumnByKeywords(headers, ['点击数', 'clicks', 'klik', 'click']);
            
            console.log('Found columns:', { dateCol, clickCol });
            
            let count = 0;
            const dailyData = {};
            
            data.forEach((row, idx) => {
                let dateStr = dateCol ? row[dateCol] : '';
                let clicks = clickCol ? parseInt(row[clickCol]) : 0;
                
                console.log(`Row ${idx}:`, { dateStr, clicks });
                
                if (dateStr && !isNaN(clicks) && clicks > 0) {
                    const normalizedDate = normalizeDate(dateStr);
                    if (normalizedDate) {
                        if (!dailyData[normalizedDate]) {
                            dailyData[normalizedDate] = { clicks: 0 };
                        }
                        dailyData[normalizedDate].clicks += clicks;
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
            const totalClicks = Object.values(dailyData).reduce((sum, v) => sum + v.clicks, 0);
            statusEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${count} hari diproses | Clicks: ${totalClicks}`;
            e.target.value = '';
        } catch (error) {
            console.error('Shopee Clicks Error:', error);
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
            const text = event.target.result;
            const data = parseCSV(text);
            const statusEl = document.getElementById('shopeeCommissionStatus');
            
            if (data.length === 0) {
                statusEl.innerHTML = `<i class="fas fa-exclamation-circle text-warning"></i> Tidak ada data ditemukan`;
                return;
            }

            // Get headers
            const headers = Object.keys(data[0]);
            console.log('Shopee Commission Headers:', headers);
            
            // Find relevant columns
            const dateCol = findColumnByKeywords(headers, ['waktu pemesanan', 'waktu klik', '日期', 'date', 'tanggal']);
            const commissionCol = findColumnByKeywords(headers, ['komisi bersih', 'komisi affiliate', 'komisi', 'commission']);
            const statusCol = findColumnByKeywords(headers, ['status pemesanan', 'status', 'order status']);
            
            console.log('Found columns:', { dateCol, commissionCol, statusCol });
            
            let count = 0;
            const dailyData = {};
            
            data.forEach((row, idx) => {
                let dateStr = dateCol ? row[dateCol] : '';
                let commission = commissionCol ? parseFloat(row[commissionCol]) : 0;
                let status = statusCol ? row[statusCol] : '';
                let orders = (status && status.toLowerCase().includes('selesai')) ? 1 : 0;
                
                console.log(`Row ${idx}:`, { dateStr, commission, status, orders });
                
                if (dateStr && !isNaN(commission) && commission > 0) {
                    const normalizedDate = normalizeDate(dateStr);
                    if (normalizedDate) {
                        if (!dailyData[normalizedDate]) {
                            dailyData[normalizedDate] = { commission: 0, orders: 0 };
                        }
                        dailyData[normalizedDate].commission += commission;
                        dailyData[normalizedDate].orders += orders;
                        count++;
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
                
                if (!report.commission) report.commission = 0;
                if (!report.orders) report.orders = 0;
                
                report.commission += values.commission;
                report.orders += values.orders;
            }

            app.saveData();
            const totalCommission = Object.values(dailyData).reduce((sum, v) => sum + v.commission, 0);
            statusEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${Object.keys(dailyData).length} hari | Komisi: ${formatCurrency(totalCommission)}`;
            e.target.value = '';
        } catch (error) {
            console.error('Shopee Commission Error:', error);
            document.getElementById('shopeeCommissionStatus').innerHTML = 
                `<i class="fas fa-exclamation-circle text-danger"></i> Error: ${error.message}`;
        }
    };
    reader.readAsText(file);
}
