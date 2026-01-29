const DigiflazzService = require('../services/DigiflazzService');
const JSONDriver = require('../models/JSONDriver');

class ProductController {
    
    // Halaman "Real Stock"
    static async realStock(req, res) {
        // 1. Ambil Data Live dari Digiflazz
        const liveProducts = await DigiflazzService.getPriceList();
        
        // 2. Filter hanya produk yang kita jual (misal: Mobile Legends)
        const mlbbProducts = liveProducts.filter(p => 
            p.brand === "MOBILE LEGENDS" && p.buyer_product_status === true
        );

        // 3. Render ke Dashboard
        // Admin bisa lihat mana yang Gangguan (Stok Kosong di Pusat)
        res.render('realstock', { 
            products: mlbbProducts,
            saldo: await DigiflazzService.checkBalance() // Opsional
        }); 
    }
}

module.exports = ProductController;
