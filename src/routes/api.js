const express = require('express');
const router = express.Router();

const InventoryController = require('../controllers/InventoryController');
const ApiController = require('../controllers/ApiController');
const PriceWatcherController = require('../controllers/PriceWatcherController');

// Internal API (AJAX Web)
router.post('/update-stok', InventoryController.updateStock);
router.post('/clear-pending', ApiController.clearPending);
router.post('/scan-price', PriceWatcherController.scan); // <--- Endpoint baru
router.post('/update-order-status', ApiController.updateOrderStatus);

// External API (Python)
router.post('/callback-topup', ApiController.callbackTopup);

module.exports = router;
