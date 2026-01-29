const JSONDriver = require('./JSONDriver');
const gameConfig = require('../../config/game');

// Perhatikan path-nya: kita asumsikan file kamu ada di 'database/core/accounts.json'
// atau sesuaikan dengan folder tempat kamu menaruh file-file baru tersebut.
const db = new JSONDriver('database/core/accounts.json', []); 

class Account {
    static getAll() {
        const data = db.read();
        // Karena struktur barumu langsung Array [...], kita langsung return
        return Array.isArray(data) ? data : [];
    }

    static saveAll(accounts) {
        // Langsung simpan array, tidak perlu dibungkus object lagi
        db.write(accounts);
    }

    static findByNick(nick) {
        const accounts = this.getAll();
        const index = accounts.findIndex(a => a.nick === nick);
        return { data: accounts[index], index, all: accounts };
    }

    static calculatePotential(account) {
        const realDm = account.diamond || 0;
        const wdpDays = account.wdp_days || 0;
        const potentialFromWdp = wdpDays * gameConfig.limits.wdp_daily_reward;
        const cappedWdp = Math.min(potentialFromWdp, gameConfig.limits.cap_potential);
        
        return {
            real: realDm,
            potential_raw: realDm + potentialFromWdp,
            potential_capped: realDm + cappedWdp
        };
    }

    static updateStock(nick, amount, wdpDays) {
        const { index, all } = this.findByNick(nick);
        if (index === -1) return { success: false, message: 'Akun tidak ditemukan' };

        const acc = all[index];
        const oldDm = acc.diamond;
        
        acc.diamond = amount;
        if (wdpDays !== undefined) acc.wdp_days = wdpDays;

        this.saveAll(all);
        return { success: true, oldDm, newDm: acc.diamond, account: acc };
    }
    
    static addStock(nick, multiplier = 1) {
        const { index, all } = this.findByNick(nick);
        if (index === -1) return false;

        all[index].diamond += (gameConfig.limits.topup_pack_dm * multiplier);
        all[index].wdp_days = (all[index].wdp_days || 0) + (gameConfig.limits.wdp_days_per_pack * multiplier);
        
        if (all[index].pending_wdp) delete all[index].pending_wdp;
        
        this.saveAll(all);
        return true;
    }
}

module.exports = Account;