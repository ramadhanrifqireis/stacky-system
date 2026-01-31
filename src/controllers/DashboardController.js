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
        const Setting = require('../models/Setting');
        const set = Setting.get();

        res.render('settings', { 
            groupName: set.logGroupId || '-', 
            groupId: set.logGroupId || '-', 
            accounts: accounts, 
            products: set.products || [], 
            receipt_template_a_id: set.receipt_template_a_id != null ? set.receipt_template_a_id : '',
            receipt_template_a_en: set.receipt_template_a_en != null ? set.receipt_template_a_en : '',
            receipt_template_b_id: set.receipt_template_b_id != null ? set.receipt_template_b_id : '',
            receipt_template_b_en: set.receipt_template_b_en != null ? set.receipt_template_b_en : ''
        });
    }

    static saveReceiptTemplate(req, res) {
        const Setting = require('../models/Setting');
        Setting.update('receipt_template_a_id', (req.body.receipt_template_a_id || '').trim());
        Setting.update('receipt_template_a_en', (req.body.receipt_template_a_en || '').trim());
        Setting.update('receipt_template_b_id', (req.body.receipt_template_b_id || '').trim());
        Setting.update('receipt_template_b_en', (req.body.receipt_template_b_en || '').trim());
        res.redirect('/settings');
    }

    static saveProduct(req, res) {
        const Setting = require('../models/Setting');
        const set = Setting.get();
        const products = Array.isArray(set.products) ? set.products : [];
        const action = (req.body.action || '').toLowerCase();
        const id = (req.body.id || '').toString();
        const name = (req.body.name || '').toString().trim();
        const price = parseInt(req.body.price, 10) || 0;

        if (action === 'delete' && id) {
            const next = products.filter(p => String(p.id) !== id);
            Setting.update('products', next);
            return res.redirect('/settings');
        }

        if (!name) return res.redirect('/settings');

        if (action === 'edit' && id) {
            const idx = products.findIndex(p => String(p.id) === id);
            if (idx !== -1) {
                products[idx].name = name;
                products[idx].price = price;
            }
            Setting.update('products', products);
            return res.redirect('/settings');
        }

        if (action === 'add') {
            const newItem = { id: `P${Date.now()}`, name, price };
            products.push(newItem);
            Setting.update('products', products);
            return res.redirect('/settings');
        }

        return res.redirect('/settings');
    }

    /** Tambah / Edit / Hapus akun (Pengaturan & Inventory) */
    static saveAccount(req, res) {
        const action = (req.body.action || '').toLowerCase();
        const nick = (req.body.nick || '').trim();
        const id = (req.body.id || '').trim();
        const oldNick = (req.body.oldNick || '').trim();

        const accounts = Account.getAll();

        if (action === 'delete' && oldNick) {
            const next = accounts.filter(a => (a.nick || '') !== oldNick);
            Account.saveAll(next);
            return res.redirect(req.body.redirect || '/settings');
        }

        if (!nick) return res.redirect(req.body.redirect || '/settings');

        if (action === 'edit' && oldNick) {
            const idx = accounts.findIndex(a => (a.nick || '') === oldNick);
            if (idx !== -1) {
                accounts[idx].nick = nick;
                accounts[idx].id = id || accounts[idx].id;
                Account.saveAll(accounts);
            }
            return res.redirect(req.body.redirect || '/settings');
        }

        if (action === 'add') {
            const exists = accounts.some(a => (a.nick || '').toLowerCase() === nick.toLowerCase());
            if (exists) {
                if (req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(400).json({ ok: false, message: 'Nick sudah ada.' });
                }
                return res.redirect((req.body.redirect || '/inventory') + '?err=duplicate');
            }
            const todayStr = new Date().toISOString().split('T')[0];
            accounts.push({
                id: id || `${Date.now()}(0)`,
                nick,
                diamond: 0,
                wdp_days: 0,
                last_wdp_date: todayStr
            });
            Account.saveAll(accounts);
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.json({ ok: true, message: 'Akun ditambah.' });
            }
            return res.redirect(req.body.redirect || '/inventory');
        }

        return res.redirect(req.body.redirect || '/settings');
    }
}

module.exports = DashboardController;