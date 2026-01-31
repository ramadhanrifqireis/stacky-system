const Account = require('../models/Account');
const Order = require('../models/Order');
const Setting = require('../models/Setting');

class ApiController {
    // Callback Topup (Dipanggil oleh script Python / setelah Digiflazz success)
    static callbackTopup(req, res) {
        const { nick, status, action, qty } = req.body;
        
        if (status === 'success') {
            const multiplier = parseInt(qty) || 1;
            
            if (action === 'force_add') {
                // Topup Paksa: selalu tambah stok real (abaikan pending)
                const success = Account.addStock(nick, multiplier);
                if (success) console.log(`[API] Topup Paksa: ${nick} +${multiplier} paket`);
            } else {
                // Normal: bayar hutang dulu (pending_wdp), sisa baru tambah real
                const result = Account.applyDigiSuccess(nick, multiplier);
                if (result.success) {
                    if (result.paidDebt > 0) console.log(`[API] Hutang lunas: ${nick} (${result.paidDebt} paket)`);
                    if (result.addedReal > 0) console.log(`[API] Stok real: ${nick} +${result.addedReal} paket`);
                }
            }
            res.json({ status: 'success' });
        } else {
            res.status(404).json({ status: 'failed' });
        }
    }

    // Clear Pending Flag
    static clearPending(req, res) {
        const { nick } = req.body;
        const { index, all } = Account.findByNick(nick);
        
        if (index !== -1) {
            all[index].pending_wdp = false;
            if(all[index].last_req) delete all[index].last_req;
            Account.saveAll(all);
            res.json({ status: 'cleared' });
        } else {
            res.json({ status: 'failed' });
        }
    }
    
    static updateOrderStatus(req, res) {
        const { orderId, status, note, sn } = req.body;
        
        const activeOrders = Order.getActive()
        
        console.log(`[API] Order ${orderId} updated to ${status}. Note: ${note}`);
        res.json({ status: 'ok' });
    }

    /** Simpan target harga WDP BR & TR untuk notifikasi (Termux) */
    static saveWdpTargets(req, res) {
        const WDP_BR = String(req.body.WDP_BR || '0').trim();
        const WDP_TR = String(req.body.WDP_TR || '0').trim();
        const targets = Setting.get('price_targets') || { WDP_BR: '0', WDP_TR: '0' };
        targets.WDP_BR = WDP_BR || '0';
        targets.WDP_TR = WDP_TR || '0';
        Setting.update('price_targets', targets);
        console.log('[API] WDP targets saved:', targets);
        res.redirect('/real-stock');
    }
}

module.exports = ApiController;