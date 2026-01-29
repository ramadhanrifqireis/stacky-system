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

// === REAL STOCK & SUPPLY (Kulakan / Supply) ===
router.get('/real-stock', ProductController.realStock); // <--- INI URL YANG HILANG TADI!
router.post('/process-order-digi', OrderController.processDigi); // Ini untuk tombol "Gas Order"

// === PRICE WATCHER ===
router.get('/price-watcher', PriceWatcherController.index);

module.exports = router;