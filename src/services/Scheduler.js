const Account = require('../models/Account');
const Order = require('../models/Order');
const Notifier = require('./Notifier');
const gameConfig = require('../../config/game');

class Scheduler {
    constructor() {
        this.interval = null;
    }

    start() {
        console.log('⏳ SCHEDULER: Service dimulai...');
        
        // Cek saat boot
        this.runDailyTasks();
        this.checkDueOrders();

        // Loop setiap menit (sesuai config)
        this.interval = setInterval(() => {
            this.runDailyTasks();
            this.checkDueOrders();
        }, gameConfig.scheduler.notification_check_interval);
    }

    // TUGAS 1: Auto WDP (Panen Harian)
    runDailyTasks() {
        const now = new Date();
        // Trik konversi ke WIB tanpa library moment.js
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const wibTime = new Date(utc + (3600000 * 7));

        const hour = wibTime.getHours();
        const todayStr = wibTime.toISOString().split('T')[0];

        // Hanya jalan jika jam >= jam reset (15:00 WIB)
        if (hour >= gameConfig.scheduler.wdp_reset_hour) {
            const accounts = Account.getAll();
            let changed = false;
            let totalIncome = 0;

            accounts.forEach(acc => {
                // Logika: Punya sisa hari DAN belum klaim hari ini
                if (acc.wdp_days > 0 && acc.last_wdp_date !== todayStr) {
                    acc.diamond += gameConfig.limits.wdp_daily_reward;
                    acc.wdp_days -= 1;
                    acc.last_wdp_date = todayStr; // Stempel hari ini

                    totalIncome += gameConfig.limits.wdp_daily_reward;
                    changed = true;
                    console.log(`[AUTO-WDP] ✅ Panen ${acc.nick} (+${gameConfig.limits.wdp_daily_reward} DM)`);
                }
            });

            if (changed) {
                Account.saveAll(accounts);
                Notifier.send('💰 PANEN WDP SELESAI', `Total Income hari ini: +${totalIncome} DM`);
            }
        }
    }

    // TUGAS 2: Cek Order Jatuh Tempo (Pengganti Monitor WebHandler)
    checkDueOrders() {
        const orders = Order.getActive();
        const now = Date.now();
        let changed = false;

        orders.forEach(order => {
            // Jika status PENDING, Waktu Habis, dan Belum Dinotifikasi
            if (order.status === 'PENDING' && now >= order.due_date && !order.notified) {
                
                Notifier.send(
                    '📦 ORDER SIAP KIRIM!', 
                    `${order.item_name} (${order.buyer_name}) sudah jatuh tempo!`, 
                    `order_${order.id}`
                );

                // Tandai sudah notif di database agar tidak spam
                Order.markAsNotified(order.id);
            }
        });
    }
}

module.exports = new Scheduler(); // Export instance langsung biar tinggal pakai