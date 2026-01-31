const DigiflazzService = require('../services/DigiflazzService');
const Account = require('../models/Account');
const Setting = require('../models/Setting');
const Notifier = require('../services/Notifier');

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit - jeda & interval refresh
let realStockCache = { ts: 0, products: [], saldo: 0, wdp_cheapest: null };

/** State: sudah kirim notif saat harga <= target (reset ketika harga naik lagi) */
let wdpTargetNotified = { WDP_BR: false, WDP_TR: false };

/** Refresh cache dari API Digiflazz (dipanggil oleh realStock saat cache kedaluwarsa atau oleh timer 5 menit) */
async function fetchAndUpdateCache() {
    const now = Date.now();
    const [products, saldo, wdpCheapest] = await Promise.all([
        DigiflazzService.getPriceList(),
        DigiflazzService.checkBalance(),
        DigiflazzService.getWdpCheapestPublic()
    ]);
    realStockCache = {
        ts: now,
        products: Array.isArray(products) ? products : [],
        saldo: saldo || 0,
        wdp_cheapest: wdpCheapest && (wdpCheapest.brazil != null || wdpCheapest.turkey != null) ? wdpCheapest : null
    };
    checkWdpTargetsAndNotify(realStockCache.products);
    return realStockCache;
}

/** Ambil harga saat ini untuk WDP_BR dan WDP_TR dari pricelist (sku yang diset di Digiflazz) */
function getWdpCurrentPricesBySku(products) {
    if (!Array.isArray(products)) return { WDP_BR: null, WDP_TR: null };
    const getPrice = (p) => (p.price != null ? p.price : p.seller_price);
    const findBySku = (sku) => {
        const found = products.find(p => (p.buyer_sku_code || '').toString() === sku);
        return found && (found.price != null || found.seller_price != null) ? getPrice(found) : null;
    };
    return {
        WDP_BR: findBySku('WDP_BR'),
        WDP_TR: findBySku('WDP_TR')
    };
}

/** Cek target WDP: jika harga saat ini <= target, kirim notif ke perangkat (Termux API) */
function checkWdpTargetsAndNotify(products) {
    const current = getWdpCurrentPricesBySku(products);
    const targets = Setting.get('price_targets') || { WDP_BR: '0', WDP_TR: '0' };
    const targetBr = parseInt(targets.WDP_BR, 10) || 0;
    const targetTr = parseInt(targets.WDP_TR, 10) || 0;

    if (current.WDP_BR != null && targetBr > 0) {
        if (current.WDP_BR <= targetBr) {
            if (!wdpTargetNotified.WDP_BR) {
                Notifier.send(
                    'WDP BR Target Reached',
                    `Harga WDP Brazil Rp ${Number(current.WDP_BR).toLocaleString('id-ID')} ≤ target Rp ${targetBr.toLocaleString('id-ID')}. Siap beli!`,
                    'wdp_target_br'
                );
                wdpTargetNotified.WDP_BR = true;
            }
        } else {
            wdpTargetNotified.WDP_BR = false;
        }
    }
    if (current.WDP_TR != null && targetTr > 0) {
        if (current.WDP_TR <= targetTr) {
            if (!wdpTargetNotified.WDP_TR) {
                Notifier.send(
                    'WDP TR Target Reached',
                    `Harga WDP Turkey Rp ${Number(current.WDP_TR).toLocaleString('id-ID')} ≤ target Rp ${targetTr.toLocaleString('id-ID')}. Siap beli!`,
                    'wdp_target_tr'
                );
                wdpTargetNotified.WDP_TR = true;
            }
        } else {
            wdpTargetNotified.WDP_TR = false;
        }
    }
}

class ProductController {
    /** Refresh cache dari API; dipanggil otomatis tiap 5 menit agar data selalu updated */
    static async refreshCache() {
        try {
            console.log('[REAL-STOCK] Auto-refresh: mengambil data Digiflazz...');
            await fetchAndUpdateCache();
            console.log('[REAL-STOCK] Auto-refresh selesai.');
        } catch (e) {
            console.error('[REAL-STOCK] Auto-refresh error:', e.message);
        }
    }

    static async realStock(req, res) {
        try {
            const accounts = Account.getAll();
            const now = Date.now();
            // Jeda 5 menit: refresh halaman TIDAK memanggil API, hanya pakai cache
            const useCache = realStockCache.ts > 0 && (now - realStockCache.ts < CACHE_TTL_MS);
            let products = realStockCache.products;
            let saldo = realStockCache.saldo;

            if (!useCache) {
                console.log('[REAL-STOCK] Cache kedaluwarsa atau pertama kali — memanggil API Digiflazz');
                await fetchAndUpdateCache();
                products = realStockCache.products;
                saldo = realStockCache.saldo;
            } else {
                console.log('[REAL-STOCK] Menggunakan cache (tidak memanggil API)');
            }

            // Filter aman (Pastikan products adalah array)
            const safeProducts = Array.isArray(products) ? products : [];

            // Filter hanya Mobile Legends (Sesuaikan brand jika perlu)
            const filtered = safeProducts.filter(p => {
                const brand = (p.brand || '').toString();
                const name = (p.product_name || '').toString().toLowerCase();
                return (
                    p.buyer_product_status === true &&
                    p.category === "Games" &&
                    (brand.includes("MOBILE LEGENDS") || name.includes("mobile legends"))
                );
            });

            // Urutkan harga termurah (pastikan price number agar view tidak throw)
            filtered.forEach(p => {
                if (p.price == null || typeof p.price !== 'number') p.price = 0;
            });
            filtered.sort((a, b) => (a.price || 0) - (b.price || 0));

            const wdp_cheapest = realStockCache.wdp_cheapest || { brazil: null, turkey: null, min: null };
            const wdp_current_prices = getWdpCurrentPricesBySku(realStockCache.products);
            const price_targets = Setting.get('price_targets') || { WDP_BR: '0', WDP_TR: '0' };

            const nextRefreshAt = realStockCache.ts + CACHE_TTL_MS;
            res.render('mainStock', { 
                products: filtered, 
                saldo: saldo || 0,
                accounts: accounts || [],
                wdp_cheapest: wdp_cheapest,
                wdp_current_prices: wdp_current_prices,
                price_targets: price_targets,
                cache_info: {
                    cached_at: realStockCache.ts,
                    next_refresh_at: nextRefreshAt,
                    wait_ms: Math.max(0, nextRefreshAt - now)
                }
            });

        } catch (e) {
            console.error("[CONTROLLER ERROR]", e);
            const def = { WDP_BR: null, WDP_TR: null };
            res.render('mainStock', { products: [], saldo: 0, accounts: [], wdp_cheapest: { brazil: null, turkey: null, min: null }, wdp_current_prices: def, price_targets: { WDP_BR: '0', WDP_TR: '0' }, cache_info: { cached_at: 0, next_refresh_at: 0, wait_ms: 0 } });
        }
    }
}

// Refresh otomatis tiap 5 menit agar data Digiflazz selalu updated; refresh halaman tetap pakai cache (tidak request API)
setInterval(() => {
    ProductController.refreshCache().catch(() => {});
}, CACHE_TTL_MS);
setTimeout(() => ProductController.refreshCache().catch(() => {}), 8000);

module.exports = ProductController;