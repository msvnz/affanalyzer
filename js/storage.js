const DB_KEY = 'affanalyzer_pro_db';

export const StorageEngine = {
    getDB() {
        const data = localStorage.getItem(DB_KEY);
        return data ? JSON.parse(data) : {};
    },

    saveDayReport(dateStr, data) {
        const db = this.getDB();
        db[dateStr] = data;
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    },

    getReport(dateStr) {
        return this.getDB()[dateStr] || null;
    },

    getAllReports() {
        return this.getDB();
    },

    importDB(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (typeof parsed === 'object' && parsed !== null) {
                localStorage.setItem(DB_KEY, JSON.stringify(parsed));
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
};
