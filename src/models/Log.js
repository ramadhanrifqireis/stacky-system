const JSONDriver = require('./JSONDriver');

const db = new JSONDriver('database/core/logs.json', { audit: [] });

class Log {
    static getAll() {
        return db.read().audit || [];
    }

    static add(action, details) {
        const data = db.read();
        if (!data.audit) data.audit = [];

        const newLog = {
            time: new Date().toLocaleString('id-ID'),
            action: action,
            details: details
        };

        data.audit.unshift(newLog);
        
        // Batasi log biar file gak meledak (Max 100)
        if (data.audit.length > 100) data.audit.pop();
        
        db.write(data);
    }
}

module.exports = Log;