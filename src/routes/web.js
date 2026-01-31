const express = require('express');
const router = express.Router();

// Import Controllers
const DashboardController = require('../controllers/DashboardController');
const InventoryController = require('../controllers/InventoryController');
const OrderController = require('../controllers/OrderController');
const PriceWatcherController = require('../controllers/PriceWatcherController');
const ProductController = require('../controllers/ProductController'); // <--- Pastikan ini di-import

// === DASHBOARD ===
router.get('/', DashboardController.index);
router.get('/settings', DashboardController.settings);
router.get('/store', (req, res) => res.render('store/home', { banners: [], games: [] }));

// === INVENTORY ===
router.get('/inventory', InventoryController.index);

// === CASHIER & ORDERS (Permintaan / Demand) ===
router.get('/cashier', OrderController.cashier);
router.get('/orders', OrderController.monitor);

router.post('/process-order', OrderController.process);
router.post('/finish-order', OrderController.finish);
router.post('/cancel-order', OrderController.cancel);
router.post('/delay-order', OrderController.delay);

// === MAIN STOCK (Supply / Topup Digiflazz) ===
router.get('/real-stock', ProductController.realStock); // <--- INI URL YANG HILANG TADI!
router.post('/process-order-digi', OrderController.processDigi); // Ini untuk tombol "Gas Order"

// === PRICE WATCHER ===
router.get('/price-watcher', PriceWatcherController.index);

// === API fallback (agar POST /api/save-product tetap jalan jika request sampai ke web) ===
router.post('/api/save-product', DashboardController.saveProduct);
router.post('/api/save-receipt-template', DashboardController.saveReceiptTemplate);
router.post('/api/save-account', DashboardController.saveAccount);

module.exports = router;