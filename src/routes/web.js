const express = require('express');
const router = express.Router();

// Import Semua Controller
const DashboardController = require('../controllers/DashboardController');
const InventoryController = require('../controllers/InventoryController');
const OrderController = require('../controllers/OrderController');
const PriceWatcherController = require('../controllers/PriceWatcherController');

// === DASHBOARD ===
router.get('/', DashboardController.index);
router.get('/settings', DashboardController.settings);
router.get('/store', (req, res) => res.render('store/home', { banners: [], games: [] }));

// === INVENTORY ===
router.get('/inventory', InventoryController.index);

// === CASHIER & ORDERS ===
router.get('/cashier', OrderController.cashier);
router.get('/orders', OrderController.monitor);
router.post('/process-order', OrderController.process);
router.post('/finish-order', OrderController.finish);
router.post('/cancel-order', OrderController.cancel);
router.post('/process-order-digi', OrderController.processDigi);

// === PRICE WATCHER (New!) ===
router.get('/price-watcher', PriceWatcherController.index);

module.exports = router;
