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
router.get('/store', (req, res) => res.render('store/home')); // Static Page

// === INVENTORY & GUDANG ===
router.get('/inventory', InventoryController.index);

// === PRICE WATCHER ===
router.get('/price-watcher', PriceWatcherController.index);

// === KASIR & ORDER ===
router.get('/cashier', OrderController.cashier);
router.get('/orders', OrderController.monitor);

// Action Routes (Form Submit)
router.post('/process-order', OrderController.process);
router.post('/finish-order', OrderController.finish);
router.post('/cancel-order', OrderController.cancel);

module.exports = router;