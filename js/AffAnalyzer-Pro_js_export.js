import { StorageEngine } from './storage.js';

export const Exporter = {
    exportToJSON() {
        const db = StorageEngine.getDB();
        const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AffAnalyzer_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    },

    exportToCSV() {
        const db = StorageEngine.getDB();
        let csvContent = "data:text/csv;charset=utf-8,Tanggal,Spend,Klik Meta,Klik Shopee,Order,Komisi,Profit\n";
        
        Object.keys(db).forEach(date => {
            const r = db[date];
            const profit = r.commission - r.spend;
            csvContent += `${date},${r.spend},${r.klikMeta},${r.klikShopee},${r.order},${r.commission},${profit}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const a = document.createElement('a');
        a.href = encodedUri;
        a.download = "Rekap_AffAnalyzer_Pro.csv";
        a.click();
    }
};