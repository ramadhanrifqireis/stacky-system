const JSONDriver = require('./JSONDriver');
// Pastikan path ini sesuai lokasi file market.json kamu
const db = new JSONDriver('database/analytics/market.json', { history: [] });

class Market {
    static getHistory() {
        return db.read().history || [];
    }

    static addHistory(scanResult) {
        const data = db.read();
        if (!data.history) data.history = [];
        
        // Masukkan data baru ke paling atas (unshift)
        data.history.unshift(scanResult);
        
        // Batasi history biar gak kegedean (misal max 50)
        if (data.history.length > 50) data.history.pop();
        
        db.write(data);
    }
}

module.exports = Market;
