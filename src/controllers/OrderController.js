const Account = require('../models/Account');
const Order = require('../models/Order');
const Log = require('../models/Log');
const Setting = require('../models/Setting');
const gameConfig = require('../../config/game');

class OrderController {
    // 1. Halaman Kasir (/cashier) — produk dari Pengaturan (DAFTAR PRODUK)
    static cashier(req, res) {
        const accounts = Account.getAll();
        const set = Setting.get();
        const products = Array.isArray(set.products) ? set.products : [];
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
            accounts, products 
        });
    }

    // 2. Halaman Monitor Order (/orders)
    static monitor(req, res) {
        const rawActive = Order.getActive();
        const rawHistory = Order.getHistory();
        const set = Setting.get();
        const accounts = Account.getAll();
        const normal = (o) => ({
            ...o,
            sender_nick: o.sender_nick || o.executor || '-',
            sender_id: (o.sender_id != null && o.sender_id !== '') ? String(o.sender_id) : ((o.executor_id != null && o.executor_id !== '') ? String(o.executor_id) : '-')
        });
        const active = rawActive.map(normal);
        const history = rawHistory.map(normal);
        res.render('orders', {
            active,
            history,
            searchQuery: req.query.q || "",
            accounts,
            receipt_template_a_id: set.receipt_template_a_id != null ? set.receipt_template_a_id : '',
            receipt_template_a_en: set.receipt_template_a_en != null ? set.receipt_template_a_en : '',
            receipt_template_b_id: set.receipt_template_b_id != null ? set.receipt_template_b_id : '',
            receipt_template_b_en: set.receipt_template_b_en != null ? set.receipt_template_b_en : ''
        });
    }

    // 3. Proses Order Manual (/process-order)
    static process(req, res) {
        const { orderId, item, targetId, targetZone, targetNick, buyer, qty, akunAdmin } = req.body;
        
        const all = Account.getAll();
        const akunList = (akunAdmin || '').split(',').map(s => s.trim()).filter(Boolean);
        const matched = akunList.map(n => all.find(a => a.nick === n)).filter(Boolean);

        if (matched.length > 0) {
            const nominal = parseInt(qty) || 0;
            // Snapshot akun admin saat transaksi (untuk struk Itemku immutable)
            const sender_nick = matched.map(a => a.nick || '-').join(',');
            const sender_id = matched.map(a => a.id || a.game_id || '-').join(',');

            // Kurangi Stok Real (minimal change: potong dari akun pertama)
            const firstIndex = all.findIndex(a => a.nick === matched[0].nick);
            if (firstIndex !== -1) {
                all[firstIndex].diamond -= nominal;
                Account.saveAll(all);
            }

            // Simpan Order
            const newOrder = {
                id: orderId,
                item_name: item,
                target_data: `${targetId} (${targetZone}) ${targetNick || ''}`.trim(),
                target_id_search: targetId,
                buyer_name: buyer,
                executor: akunAdmin,
                sender_nick,
                sender_id,
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
        
        const created_at = Date.now();
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
            
            created_at,
            due_date: created_at + (7 * 24 * 60 * 60 * 1000), // 7 hari, sama seperti manual — agar scheduler kirim notif saat siap kirim
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

    // 5. Selesaikan Order (/finish-order) — generate struk Itemku saat success
    static finish(req, res) {
        const { id } = req.body;
        const active = Order.getActive();
        const order = active.find(o => o.id === id);
        let extraFields = {};
        if (order) {
            const receiptText = OrderController.generateReceiptText(order);
            if (receiptText) extraFields = { receipt_data: receiptText };
        }
        Order.moveActiveToHistory(id, 'DONE', extraFields);
        if (Log && Log.add) Log.add('ORDER_DONE', `Order ${id} selesai.`);
        res.redirect('/orders');
    }

    /** Helper: ambil template lalu replace keyword. type = 'A' (pending/follow) | 'B' (success), lang = 'id' | 'en' */
    static getReceipt(order, type, lang) {
        if (!order) return '';
        const key = type === 'A'
            ? (lang === 'en' ? 'receipt_template_a_en' : 'receipt_template_a_id')
            : (lang === 'en' ? 'receipt_template_b_en' : 'receipt_template_b_id');
        const template = (Setting.get(key) || '').trim();
        const nick = (order.sender_nick || order.executor || '-').toString();
        const gameId = (order.sender_id != null && order.sender_id !== '' ? order.sender_id : '-').toString();
        const dueDate = order.due_date ? new Date(order.due_date) : new Date((order.created_at || Date.now()) + 7 * 24 * 60 * 60 * 1000);
        const d = dueDate.getDate();
        const m = dueDate.getMonth() + 1;
        const y = dueDate.getFullYear();
        const dateString = `${d}/${m}/${y}, pukul 15:00 WIB`;

        const replace = (t) => (t || '')
            .replace(/%BUYER%/g, (order.buyer_name || '-').toString())
            .replace(/%ITEM%/g, (order.item_name || '-').toString())
            .replace(/%SENDER_NICK%/g, nick)
            .replace(/%SENDER_ID%/g, gameId)
            .replace(/%DATE%/g, dateString);

        if (template) return replace(template);

        if (type === 'A') {
            return replace('Halo kak, mohon Add Friend akun ini: %SENDER_NICK% (ID: %SENDER_ID%) agar item bisa dikirim.\nPesanan: %ITEM% | Pembeli: %BUYER% | %DATE%');
        }
        return replace('Pesanan %ITEM% sudah dikirim. Terima kasih, %BUYER%.\n%DATE%');
    }

    /** Generate teks struk B (Success) untuk disimpan saat finish */
    static generateReceiptText(order) {
        return OrderController.getReceipt(order, 'B', 'id');
    }

    /** Generate struk tunda (untuk delay order) */
    static generateDelayReceiptText(order, resumeAt) {
        if (!order) return '';
        const d = new Date(resumeAt);
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}, pukul 15:00 WIB`;
        return `⚠️ PESANAN DITUNDA\nAlasan: Menunggu Add Friend\nEstimasi Kirim: ${dateStr}`;
    }

    // 7. Tunda Order (/delay-order)
    static delay(req, res) {
        const { id, days } = req.body;
        const daysNum = Math.max(1, parseInt(days, 10) || 1);
        const resumeAt = Date.now() + daysNum * 24 * 60 * 60 * 1000;
        const order = Order.getActive().find(o => o.id === id);
        if (!order) {
            return res.redirect('/orders');
        }
        const receiptTunda = OrderController.generateDelayReceiptText(order, resumeAt);
        Order.updateActive(id, { status: 'delayed', resume_at: resumeAt, receipt_data: receiptTunda });
        if (Log && Log.add) Log.add('ORDER_DELAY', `Order ${id} ditunda ${daysNum} hari.`);
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