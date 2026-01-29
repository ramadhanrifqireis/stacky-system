const Account = require('../models/Account');
const Log = require('../models/Log'); // Pakai Model Log yang baru

class InventoryController {
    static index(req, res) {
        const accounts = Account.getAll();
        const auditLog = Log.getAll(); // Jauh lebih rapi daripada baca file manual

        res.render('inventory', { 
            accounts: accounts, 
            audit: auditLog 
        });
    }

    static updateStock(req, res) {
        const { nick, amount, wdp, is_adjustment } = req.body;
        
        const newDm = parseInt(amount);
        const newWdp = parseInt(wdp);
        const isAdjust = String(is_adjustment) === 'true';

        const result = Account.updateStock(nick, newDm, newWdp);

        if (result.success) {
            // Catat ke Log
            const actionType = isAdjust ? 'MANUAL_FIX' : 'REQ_CREDIT';
            const detailMsg = isAdjust 
                ? `Koreksi Data ${nick} (Mode Penyesuaian)`
                : `Input Stok ${nick} (Manual Web)`;
            
            Log.add(actionType, detailMsg);

            console.log(`[INVENTORY] Update ${nick} sukses.`);
            res.json({ status: 'ok' });
        } else {
            res.status(404).json({ status: 'failed', message: result.message });
        }
    }
}

module.exports = InventoryController;