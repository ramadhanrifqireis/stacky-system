const axios = require('axios');
const cheerio = require('cheerio');
const JSONDriver = require('../models/JSONDriver');

// Driver khusus untuk market analytics
const db = new JSONDriver('database/analytics/market.json', { history: [] });

class PriceWatcherController {
    // Halaman Price Watcher (/price-watcher)
    static index(req, res) {
        const data = db.read();
        res.render('priceWatcher', { history: data.history || [] });
    }

    // API: Scan Harga (Dipanggil via AJAX)
    static async scanPrice(req, res) {
        try {
            const targetUrl = req.body.url;
            console.log(`[SCRAPER] Memulai scan: ${targetUrl.substring(0, 30)}...`);
            
            // --- LOGIKA SCRAPING (Sama seperti lama, tapi dirapikan) ---
            const { data } = await axios.get(targetUrl, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Origin': 'https://itemku.com', 
                    'Referer': 'https://itemku.com/' 
                }
            });

            // Helper function (Bisa dipindah ke utils sebenarnya)
            const findProductList = (obj) => {
                if (!obj || typeof obj !== 'object') return null;
                if (Array.isArray(obj) && obj.length > 0 && obj[0]?.price !== undefined) return obj;
                
                for (const key in obj) {
                    if (typeof obj[key] === 'object') {
                        const found = findProductList(obj[key]);
                        if (found) return found;
                    }
                }
                return null;
            };

            let jsonRaw = null;
            if (typeof data === 'object') {
                jsonRaw = data;
            } else {
                const $ = cheerio.load(data);
                const nextData = $('script#__NEXT_DATA__').html();
                if (nextData) jsonRaw = JSON.parse(nextData);
            }

            const productList = findProductList(jsonRaw);
            if (!productList) return res.json({ success: false, message: "Data produk tidak ditemukan." });

            // Analisa Data
            let result = {
                date: new Date().toLocaleString('id-ID'),
                name: "Hasil Scan Starlight Card",
                lowPrice: 0, competitors: 0, myPrice: 0, myRank: "-", url: targetUrl
            };
            
            const MY_SHOP_NAME = "Hai Imam"; // Bisa ambil dari config/app.js
            let competitors = [];

            productList.forEach(item => {
                const name = (item.name || "").toLowerCase();
                if (!name.includes("starlight") || !name.includes("card")) return;

                const price = parseInt(item.price || item.display_price || 0);
                const shopName = item.seller?.shop_name || item.shop_name || "Unknown";

                if (price > 5000) {
                    competitors.push({ name: shopName, price, isMe: shopName.toLowerCase() === MY_SHOP_NAME.toLowerCase() });
                }
            });

            competitors.sort((a, b) => a.price - b.price);
            
            result.competitors = competitors.length;
            if (competitors.length > 0) result.lowPrice = competitors[0].price;
            
            const myData = competitors.find(c => c.isMe);
            if (myData) {
                result.myPrice = myData.price;
                result.myRank = "#" + (competitors.indexOf(myData) + 1);
            }

            // SIMPAN KE DATABASE
            const currentDb = db.read();
            if (!currentDb.history) currentDb.history = [];
            currentDb.history.unshift(result);
            if (currentDb.history.length > 50) currentDb.history.pop(); // Batasi 50 history
            db.write(currentDb);

            res.json({ success: true, data: result });

        } catch (error) {
            console.error("[SCRAPER ERROR]", error.message);
            res.json({ success: false, message: "Gagal: " + error.message });
        }
    }
}

module.exports = PriceWatcherController;