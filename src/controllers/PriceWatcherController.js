const Market = require('../models/Market');
const ScraperService = require('../services/ScraperService');

class PriceWatcherController {
    // Tampilkan Halaman Price Watcher
    static index(req, res) {
        const history = Market.getHistory();
        res.render('priceWatcher', { history });
    }

    // API untuk Scan Harga (Triggered by Button)
    static async scan(req, res) {
        const { url } = req.body;
        
        if (!url) return res.json({ success: false, message: "URL tidak boleh kosong!" });

        // 1. Panggil Service untuk kerja berat
        const result = await ScraperService.scanStarlight(url);

        // 2. Jika sukses, simpan ke Database via Model
        if (result.success) {
            Market.addHistory(result.data);
            return res.json({ success: true, data: result.data });
        } else {
            return res.json({ success: false, message: result.message });
        }
    }
}

module.exports = PriceWatcherController;
