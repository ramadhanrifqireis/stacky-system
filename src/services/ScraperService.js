const axios = require('axios');
const cheerio = require('cheerio');

class ScraperService {
    /**
     * Helper: Cari list produk dari JSON itemku yang strukturnya suka berubah
     */
    static findProductList(obj) {
        if (!obj || typeof obj !== 'object') return null;
        if (Array.isArray(obj) && obj.length > 0 && (obj[0].price !== undefined || obj[0].seller_price !== undefined)) {
            return obj;
        }
        
        const keys = ['data', 'items', 'products', 'result', 'feed', 'search_result'];
        for (const key of keys) {
            if (obj[key]) {
                const found = this.findProductList(obj[key]);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Logic Inti Scraping
     */
    static async scanStarlight(targetUrl) {
        try {
            console.log(`🕵️ SCRAPER: Memulai scan ke ${targetUrl.substring(0, 30)}...`);
            
            const { data } = await axios.get(targetUrl, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Origin': 'https://itemku.com', 
                    'Referer': 'https://itemku.com/' 
                }
            });

            let jsonRaw = null;
            if (typeof data === 'object') {
                jsonRaw = data;
            } else {
                const $ = cheerio.load(data);
                const nextData = $('script#__NEXT_DATA__').html();
                if (nextData) jsonRaw = JSON.parse(nextData);
            }

            if (!jsonRaw) throw new Error("Gagal membaca struktur data Itemku.");

            const productList = this.findProductList(jsonRaw);
            if (!productList || productList.length === 0) throw new Error("Data produk kosong/tidak ditemukan.");

            // Format Hasil
            let result = {
                date: new Date().toLocaleString('id-ID'),
                name: "Hasil Scan Starlight Card",
                lowPrice: 0,
                competitors: 0,
                myPrice: 0,
                myRank: "-",
                url: targetUrl
            };

            const myShopName = "Hai Imam"; // Bisa ambil dari Config nanti
            const competitors = [];

            productList.forEach(item => {
                const name = (item.name || "").toLowerCase();
                // Filter ketat: Harus ada kata 'starlight' dan 'card'
                if (!name.includes("starlight") || !name.includes("card")) return;

                const price = parseInt(item.price || item.seller_price || item.display_price || 0);
                const shopName = item.seller?.shop_name || item.shop_name || "Unknown";
                
                if (price > 5000 && shopName !== "Unknown") {
                    const isMe = shopName.toLowerCase().trim() === myShopName.toLowerCase().trim();
                    competitors.push({
                        name: shopName,
                        price: price,
                        isMe: isMe
                    });
                    if (isMe) result.myPrice = price;
                }
            });

            // Sorting Harga Termurah
            competitors.sort((a, b) => a.price - b.price);
            
            result.competitors = competitors.length;
            if (competitors.length > 0) {
                result.lowPrice = competitors[0].price;
                const myRankIdx = competitors.findIndex(c => c.isMe);
                result.myRank = myRankIdx !== -1 ? `#${myRankIdx + 1}` : "-";
            }

            return { success: true, data: result };

        } catch (error) {
            console.error("❌ SCRAPER ERROR:", error.message);
            return { success: false, message: error.message };
        }
    }
}

module.exports = ScraperService;
