const crypto = require('crypto');
const axios = require('axios');
const digiConfig = require('../../config/digiflazz');

class DigiflazzService {
    static sign(cmd) {
        const raw = digiConfig.user + digiConfig.key + cmd;
        return crypto.createHash('md5').update(raw).digest('hex');
    }

    static async getPriceList() {
        try {
            const payload = {
                cmd: "prepaid",
                username: digiConfig.user,
                sign: this.sign("pricelist")
            };
            
            console.log("[DIGI] Mengambil data produk...");
            const response = await axios.post("https://api.digiflazz.com/v1/price-list", payload, { timeout: 30000 });
            
            // --- FIX UTAMA: Validasi Array ---
            const result = response.data.data;
            if (Array.isArray(result)) {
                return result; 
            } else {
                console.error("[DIGI ERROR] Respon bukan Array:", JSON.stringify(response.data));
                return []; // Balikin array kosong biar Web GAK CRASH
            }

        } catch (error) {
            console.error("[DIGI NETWORK ERROR]", error.message);
            return []; // Tetap aman walau error
        }
    }

    static async checkBalance() {
        try {
            const payload = {
                cmd: "deposit",
                username: digiConfig.user,
                sign: this.sign("depo")
            };
            const response = await axios.post("https://api.digiflazz.com/v1/cek-saldo", payload, { timeout: 10000 });
            return (response.data && response.data.data) ? response.data.data.deposit : 0;
        } catch (error) {
            console.error("[DIGI BALANCE ERROR]", error.message);
            return 0;
        }
    }
}

module.exports = DigiflazzService;