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
            
            // Timeout 25 detik (jaga-jaga sinyal lemot)
            const response = await axios.post("https://api.digiflazz.com/v1/price-list", payload, { timeout: 25000 });
            
            // === BAGIAN PERBAIKAN (ANTI-CRASH) ===
            const result = response.data.data;
            
            // Cek: Apakah ini beneran Array (Daftar Produk)?
            if (Array.isArray(result)) {
                return result; 
            } else {
                // Kalau bukan Array (berarti pesan error), catat di log tapi JANGAN CRASH
                console.error("⚠️ [DIGI API ERROR] Respon bukan list produk:", JSON.stringify(result));
                return []; // Kasih daftar kosong biar web tetap kebuka
            }
            // ======================================

        } catch (error) {
            console.error("❌ [DIGI KONEKSI GAGAL]", error.message);
            // Cek kalau ada respon error dari server
            if (error.response) {
                console.error("Detail Error:", JSON.stringify(error.response.data));
            }
            return []; // Tetap return array kosong biar aman
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
            
            return (response.data && response.data.data && response.data.data.deposit) 
                ? response.data.data.deposit 
                : 0;
        } catch (error) {
            console.error("❌ [DIGI SALDO ERROR]", error.message);
            return 0;
        }
    }
}

module.exports = DigiflazzService;