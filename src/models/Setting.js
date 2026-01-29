const JSONDriver = require('./JSONDriver');
const db = new JSONDriver('database/core/settings.json', { 
    logGroupId: "", 
    price_targets: { WDP_TR: "0", WDP_BR: "0" } 
});

class Setting {
    static get() {
        return db.read();
    }

    static update(key, value) {
        const data = db.read();
        data[key] = value; // Update value by key
        db.write(data);
        return data;
    }
}

module.exports = Setting;
