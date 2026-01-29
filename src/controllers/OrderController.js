const Account = require('../models/Account');
const Order = require('../models/Order');
const Log = require('../models/Log'); // Pastikan ini ada
const gameConfig = require('../../config/game');

class OrderController {
    // 1. Halaman Kasir (/cashier)
    static cashier(req, res) {
        const accounts = Account.getAll();
        const available = []; 
        const forecast = []; 
        const preorder = [];
        const TARGET = gameConfig.limits.target_dm;

        // Logika sortir akun
        accounts.forEach(acc => {
            const pot = Account.calculatePotential(acc);
            if (pot.real >= TARGET) available.push(acc);
            else if (pot.potential_capped >= TARGET) forecast.push(acc);
            else preorder.push(acc);
        });

        res.render('cashier', { 
            available, forecast, preorder, 
            accounts, products: [] 
        });
    }

    // 2. Halaman Monitor Order (/orders)
    static monitor(req, res) {
        const active = Order.getActive();
        const history = Order.getHistory();
        res.render('orders', { active, history, searchQuery: req.query.q || "" });
    }

    // 3. Proses Order Manual (/process-order)
    static process(req, res) {
        const { orderId, item, targetId, targetZone, targetNick, buyer, qty, akunAdmin } = req.body;
        
        const { index, all } = Account.findByNick(akunAdmin);
        
        if (index !== -1) {
            const nominal = parseInt(qty) || 0; 
            
            // Kurangi Stok Real
            all[index].diamond -= nominal;
            Account.saveAll(all);

            // Simpan Order
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
                type: 'MANUAL', // Pembeda dengan Digiflazz
                notified: false
            };
            
            Order.addActive(newOrder);
            Log.add('NEW_ORDER', `Order Manual ${orderId} dibuat oleh ${akunAdmin}`);
        }
        res.redirect('/');
    }

    // 4. Proses Order Digiflazz H2H (/process-order-digi)
    static processDigi(req, res) {
        const { sku, item_name, target_data, buyer_name, modal_price } = req.body;
        
        // Generate Order ID Unik (OD + Timestamp)
        const orderId = "OD" + Date.now();
        
        const newOrder = {
            id: orderId,
            sku: sku, // Penting untuk Python
            item_name: item_name,
            target_data: target_data,
            target_id_search: target_data,
            buyer_name: buyer_name,
            nominal: parseInt(modal_price), // Harga Modal
            
            type: "DIGI", // Flagging Khusus untuk Python
            status: "PENDING", // Python akan cari status ini
            sn: "",
            note: "",
            
            created_at: Date.now(),
            notified: false
        };

        Order.addActive(newOrder);
        // Cek apakah Log model sudah diimport, jika belum hapus baris Log.add
        if (Log && Log.add) {
            Log.add('NEW_ORDER_DIGI', `Order H2H ${orderId} (${sku}) dibuat.`);
        }
        
        console.log(`[ORDER] Order H2H Siap Dieksekusi: ${orderId}`);
        res.redirect('/orders'); // Lempar ke halaman monitoring
    }

    // 5. Selesaikan Order (/finish-order)
    static finish(req, res) {
        const { id } = req.body;
        Order.moveActiveToHistory(id, 'DONE');
        if (Log && Log.add) Log.add('ORDER_DONE', `Order ${id} selesai.`);
        res.redirect('/orders');
    }

    // 6. Batalkan Order (/cancel-order)
    static cancel(req, res) {
        const { id } = req.body;
        const order = Order.moveActiveToHistory(id, 'CANCELLED');
        
        if (order) {
            // Jika Manual, Balikin Stok ke Akun
            if (order.type !== 'DIGI') {
                const { index, all } = Account.findByNick(order.executor);
                if (index !== -1) {
                    all[index].diamond += order.nominal;
                    Account.saveAll(all);
                }
            }
            if (Log && Log.add) Log.add('ORDER_CANCEL', `Order ${id} dibatalkan.`);
        }
        res.redirect('/orders');
    }
}

module.exports = OrderController;