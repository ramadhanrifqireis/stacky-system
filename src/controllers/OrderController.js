const Account = require('../models/Account');
const Order = require('../models/Order');
const Log = require('../models/Log');
const gameConfig = require('../../config/game');

class OrderController {
    static cashier(req, res) {
        const accounts = Account.getAll();
        const available = []; 
        const forecast = []; 
        const preorder = [];
        const TARGET = gameConfig.limits.target_dm;

        accounts.forEach(acc => {
            const pot = Account.calculatePotential(acc);
            if (pot.real >= TARGET) available.push(acc);
            else if (pot.potential_capped >= TARGET) forecast.push(acc);
            else preorder.push(acc);
        });

        res.render('cashier', { available, forecast, preorder, accounts, products: [] });
    }

    static monitor(req, res) {
        const active = Order.getActive();
        const history = Order.getHistory();
        res.render('orders', { active, history, searchQuery: req.query.q || "" });
    }

    static process(req, res) {
        const { orderId, item, targetId, targetZone, targetNick, buyer, qty, akunAdmin } = req.body;
        
        const { index, all } = Account.findByNick(akunAdmin);
        if (index !== -1) {
            const nominal = parseInt(qty) || 0; 
            all[index].diamond -= nominal;
            Account.saveAll(all);

            const newOrder = {
                id: orderId,
                item_name: item,
                target_data: `${targetId} (${targetZone}) ${targetNick || ''}`.trim(),
                target_id_search: targetId,
                buyer_name: buyer,
                executor: akunAdmin,
                nominal: nominal,
                qty: parseInt(qty) || 1,
                created_at: Date.now(),
                due_date: Date.now() + (7 * 24 * 60 * 60 * 1000), 
                status: 'PENDING',
                notified: false
            };
            
            Order.addActive(newOrder);
            Log.add('NEW_ORDER', `Order ${orderId} dibuat oleh ${akunAdmin}`);
        }
        res.redirect('/');
    }

    static finish(req, res) {
        const { id } = req.body;
        Order.moveActiveToHistory(id, 'DONE');
        Log.add('ORDER_DONE', `Order ${id} selesai.`);
        res.redirect('/orders');
    }

    static cancel(req, res) {
        const { id } = req.body;
        const order = Order.moveActiveToHistory(id, 'CANCELLED');
        if (order) {
            const { index, all } = Account.findByNick(order.executor);
            if (index !== -1) {
                all[index].diamond += order.nominal;
                Account.saveAll(all);
            }
            Log.add('ORDER_CANCEL', `Order ${id} dibatalkan. Stok refund.`);
        }
        res.redirect('/orders');
    }
}

module.exports = OrderController;