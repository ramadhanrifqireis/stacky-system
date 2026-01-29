const DigiflazzService = require('../services/DigiflazzService');

class ProductController {
    static async realStock(req, res) {
        try {
            const [products, saldo] = await Promise.all([
                DigiflazzService.getPriceList(),
                DigiflazzService.checkBalance()
            ]);

            // Filter aman (Pastikan products adalah array)
            const safeProducts = Array.isArray(products) ? products : [];

            // Filter hanya Mobile Legends (Sesuaikan brand jika perlu)
            const filtered = safeProducts.filter(p => 
                p.buyer_product_status === true && 
                p.category === "Games" &&
                (p.brand.includes("MOBILE LEGENDS") || p.product_name.toLowerCase().includes("mobile legends"))
            );

            // Urutkan harga termurah
            filtered.sort((a, b) => a.price - b.price);

            res.render('realstock', { 
                products: filtered, 
                saldo: saldo 
            });

        } catch (e) {
            console.error("[CONTROLLER ERROR]", e);
            // Render halaman kosong jika error parah, jangan biarkan white screen
            res.render('realstock', { products: [], saldo: 0 });
        }
    }
}

module.exports = ProductController;