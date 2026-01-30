const Account = require('../models/Account');
const Log = require('../models/Log');

class InventoryController {
    
    static async index(req, res) {
        try {
            const rawAccounts = await Account.getAll();
            
            // MAPPING KHUSUS SESUAI STRUKTUR DATAMU (nick, wdp_days)
            const accounts = rawAccounts.map(acc => {
                return {
                    // Kunci Utama: 'nick'
                    nickname: acc.nick || acc.nickname || 'Tanpa Nama',
                    
                    // Info tambahan
                    id: acc.id || '-',
                    
                    // Pastikan angka
                    diamond: parseInt(acc.diamond || 0),
                    
                    // Kunci WDP: 'wdp_days'
                    wdp_remaining: parseInt(acc.wdp_days || acc.wdp_remaining || 0)
                };
            });

            // Hitung Total Aset Diamond (Bukan WDP)
            const totalDiamond = accounts.reduce((sum, acc) => sum + acc.diamond, 0);
            
            res.render('inventory', { 
                page: 'inventory',
                accounts,
                totalDiamond
            });

        } catch (error) {
            console.error("[INVENTORY ERROR]", error);
            res.render('inventory', { page: 'inventory', accounts: [], totalDiamond: 0 });
        }
    }

    static async updateStock(req, res) {
        try {
            // Kita terima 'nickname' dari form, tapi di database itu 'nick'
            const { nickname, action, amount, days, notes } = req.body;
            let accounts = await Account.getAll();
            
            // Cari akun berdasarkan 'nick'
            const accountIndex = accounts.findIndex(a => 
                (a.nick || '').toLowerCase() === nickname.toLowerCase()
            );

            if (accountIndex === -1) {
                console.log(`❌ Gagal update: Akun dengan nick '${nickname}' tidak ditemukan.`);
                return res.redirect('/inventory');
            }

            // Ambil referensi akun
            let account = accounts[accountIndex];

            // Inisialisasi value jika null (sesuai key database)
            if (account.diamond === undefined) account.diamond = 0;
            if (account.wdp_days === undefined) account.wdp_days = 0;

            let logMessage = "";
            let change = 0;

            switch (action) {
                case 'inject_wdp':
                    // Rumus: +80 DM & +7 Hari (ke wdp_days)
                    const qty = parseInt(amount);
                    const addDM = qty * 80;
                    const addDays = qty * 7;
                    
                    account.diamond += addDM;
                    account.wdp_days += addDays; // Update ke key asli
                    
                    logMessage = `[INJECT] ${account.nick}: +${qty} Paket (+${addDM} DM, +${addDays} Hari)`;
                    break;

                case 'manual_dm':
                    change = parseInt(amount);
                    account.diamond += change;
                    logMessage = `[MANUAL] ${account.nick}: Diamond ${change > 0 ? '+' : ''}${change}`;
                    break;

                case 'manual_days':
                    change = parseInt(days);
                    account.wdp_days += change; // Update ke key asli
                    if (account.wdp_days < 0) account.wdp_days = 0;
                    logMessage = `[MANUAL] ${account.nick}: WDP ${change > 0 ? '+' : ''}${change} Hari`;
                    break;
            }

            // Simpan array yang sudah dimodifikasi
            await Account.saveAll(accounts);
            await Log.create(logMessage);

            console.log(`✅ Sukses Update: ${logMessage}`);
            res.redirect('/inventory');

        } catch (error) {
            console.error("[UPDATE ERROR]", error);
            res.status(500).send("Gagal update data.");
        }
    }

    static async deleteAccount(req, res) {
        try {
            const { nickname } = req.body;
            let accounts = await Account.getAll();
            
            // Filter hapus berdasarkan 'nick'
            const newAccounts = accounts.filter(a => a.nick !== nickname);
            
            await Account.saveAll(newAccounts);
            await Log.create(`[DELETE] Menghapus akun: ${nickname}`);
            res.redirect('/inventory');
        } catch (error) {
            res.status(500).send("Gagal hapus akun.");
        }
    }
}

module.exports = InventoryController;