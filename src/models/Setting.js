const JSONDriver = require('./JSONDriver');
const db = new JSONDriver('database/core/settings.json', { 
    logGroupId: "", 
    price_targets: { WDP_TR: "0", WDP_BR: "0" } 
});

class Setting {
    /** Get full settings object, or single key: get() / get('receipt_template') */
    static get(key) {
        const data = db.read();
        return key !== undefined ? data[key] : data;
    }

    static update(key, value) {
        const data = db.read();
        data[key] = value;
        db.write(data);
        return data;
    }
}

module.exports = Setting;
