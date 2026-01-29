const crypto = require('crypto'); // Built-in Node.js
const axios = require('axios');
const digiConfig = require('../../config/digiflazz'); // File config baru

class DigiflazzService {
    
    // Generate Signature versi Node.js
    static sign(cmd) {
        const raw = digiConfig.user + digiConfig.key + cmd;
        return crypto.createHash('md5').update(raw).digest('hex');
    }

    // Ambil Daftar Harga Real-time
    static async getPriceList() {
        try {
            const payload = {
                cmd: "prepaid",
                username: digiConfig.user,
                sign: this.sign("pricelist")
            };
            
            const response = await axios.post("https://api.digiflazz.com/v1/price-list", payload);
            return response.data.data || [];
        } catch (error) {
            console.error("[DIGI] Gagal ambil harga:", error.message);
            return [];
        }
    }
}

module.exports = DigiflazzService;
