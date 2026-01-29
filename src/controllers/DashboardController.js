const Account = require('../models/Account');
const Order = require('../models/Order');

class DashboardController {
    static index(req, res) {
        const accounts = Account.getAll();
        const activeOrders = Order.getActive();
        
        let totalAset = 0;
        accounts.forEach(acc => {
            const pot = Account.calculatePotential(acc);
            totalAset += pot.potential_capped;
        });

        res.render('home', { 
            totalAset, 
            activeCount: activeOrders.length 
        });
    }

    static settings(req, res) {
        const accounts = Account.getAll();
        // Kita belum bikin controller settings update, tapi render datanya dulu
        // Nanti bisa panggil Setting.get() disini
        const Setting = require('../models/Setting');
        const set = Setting.get();

        res.render('settings', { 
            groupName: set.logGroupId || '-', 
            groupId: set.logGroupId || '-', 
            accounts: accounts, 
            products: [] 
        });
    }
}

module.exports = DashboardController;