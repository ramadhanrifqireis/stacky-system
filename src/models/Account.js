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
        if (all[index].last_req) delete all[index].last_req;
        
        this.saveAll(all);
        return true;
    }

    /**
     * Dipanggil saat topup Digiflazz sukses.
     * Jika akun punya pending_wdp (hutang): lunasi dulu (kurangi last_req), sisa baru tambah stok real.
     * @param {string} nick - Nick akun
     * @param {number} packs - Jumlah paket topup (1 paket = 80 DM + 7 hari)
     * @returns {{ success: boolean, paidDebt: number, addedReal: number }}
     */
    static applyDigiSuccess(nick, packs = 1) {
        const { index, all } = this.findByNick(nick);
        if (index === -1) return { success: false, paidDebt: 0, addedReal: 0 };

        const acc = all[index];
        const packDm = gameConfig.limits.topup_pack_dm;
        const packDays = gameConfig.limits.wdp_days_per_pack;

        let paidDebt = 0;
        let addedReal = packs;

        if (acc.pending_wdp && acc.last_req && typeof acc.last_req === 'object') {
            const req = acc.last_req;
            const dm = (req.dm || 0);
            const days = (req.days || 0);
            const packsDebt = Math.min(
                Math.floor(dm / packDm),
                Math.floor(days / packDays)
            );
            paidDebt = Math.min(packs, packsDebt);
            addedReal = Math.max(0, packs - paidDebt);

            if (paidDebt > 0) {
                req.dm = Math.max(0, dm - paidDebt * packDm);
                req.days = Math.max(0, days - paidDebt * packDays);
                if (req.dm <= 0 && req.days <= 0) {
                    delete acc.pending_wdp;
                    delete acc.last_req;
                }
            }
        }

        if (addedReal > 0) {
            acc.diamond = (acc.diamond || 0) + (packDm * addedReal);
            acc.wdp_days = (acc.wdp_days || 0) + (packDays * addedReal);
            if (acc.pending_wdp) delete acc.pending_wdp;
            if (acc.last_req) delete acc.last_req;
        }

        this.saveAll(all);
        return { success: true, paidDebt, addedReal };
    }
}

module.exports = Account;