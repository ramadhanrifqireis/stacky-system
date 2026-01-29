const express = require('express');
const router = express.Router();

const InventoryController = require('../controllers/InventoryController');
const ApiController = require('../controllers/ApiController'); // Pastikan file ini ada dari langkah sebelumnya
const PriceWatcherController = require('../controllers/PriceWatcherController');

// === API INTERNAL (AJAX Web) ===
router.post('/update-stok', InventoryController.updateStock);
router.post('/scan-price', PriceWatcherController.scanPrice);
router.post('/clear-pending', ApiController.clearPending);

// === API EKSTERNAL (Python/Termux) ===
router.post('/callback-topup', ApiController.callbackTopup);

module.exports = router;