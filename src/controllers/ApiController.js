const Account = require('../models/Account');

class ApiController {
    // Callback Topup (Dipanggil oleh script Python)
    static callbackTopup(req, res) {
        const { nick, status, action, qty } = req.body;
        
        if (status === 'success') {
            const multiplier = parseInt(qty) || 1;
            
            if (action === 'force_add') {
                // Topup Paksa (Tambah Stok)
                const success = Account.addStock(nick, multiplier);
                if (success) console.log(`[API] Topup Sukses: ${nick} (x${multiplier})`);
            } else {
                // Pelunasan Hutang (Cuma hapus flag pending)
                // Implementasi sederhana, kalau mau detail bisa update Account.js
                const { index, all } = Account.findByNick(nick);
                if (index !== -1 && all[index].pending_wdp) {
                    all[index].pending_wdp = false;
                    if(all[index].last_req) delete all[index].last_req;
                    Account.saveAll(all);
                    console.log(`[API] Hutang Lunas: ${nick}`);
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
}

module.exports = ApiController;