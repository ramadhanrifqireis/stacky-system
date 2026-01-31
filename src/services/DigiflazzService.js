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

    /**
     * API publik Digiflazz: daftar harga WDP termurah (tanpa auth).
     * Sumber: https://digiflazz.com/api/v1/product?search=weekly%20diamond%20pass
     * Mengembalikan { brazil, turkey, min } untuk Indonesia & Turkey saja.
     */
    static async getWdpCheapestPublic() {
        try {
            const response = await axios.get(
                'https://digiflazz.com/api/v1/product?search=weekly%20diamond%20pass',
                { timeout: 10000 }
            );
            const data = response.data && response.data.data;
            if (!Array.isArray(data)) return { brazil: null, turkey: null, min: null };

            let brazil = null, turkey = null;
            data.forEach(item => {
                const type = (item.type || '').toString();
                const price = item.lowest_price != null ? parseInt(item.lowest_price, 10) : null;
                if (type === 'Brazil' && price != null) brazil = price;
                if (type === 'Turkey' && price != null) turkey = price;
            });
            const min = [brazil, turkey].filter(Boolean).length ? Math.min(...[brazil, turkey].filter(Boolean)) : null;
            return { brazil, turkey, min };
        } catch (error) {
            console.error("[DIGI WDP PUBLIC]", error.message);
            return { brazil: null, turkey: null, min: null };
        }
    }
}

module.exports = DigiflazzService;