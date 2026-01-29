const JSONDriver = require('./JSONDriver');

// Simpan di folder database/core atau config, terserah kamu. 
// Di sini saya taruh di database/core/settings.json agar kumpul.
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
        data[key] = value;
        db.write(data);
        return data;
    }
}

module.exports = Setting;