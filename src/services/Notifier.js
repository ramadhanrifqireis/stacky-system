const { exec } = require('child_process');

class Notifier {
    /**
     * Kirim notifikasi sistem
     * @param {string} title - Judul Notifikasi
     * @param {string} message - Isi Pesan
     * @param {string} id - ID unik untuk notifikasi (opsional)
     */
    static send(title, message, id = 'stacky_alert') {
        // Cek apakah kita jalan di Android (Termux)
        const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');

        if (isTermux) {
            // Escape tanda petik agar command tidak error
            const safeTitle = title.replace(/"/g, '\\"');
            const safeMsg = message.replace(/"/g, '\\"');
            
            const cmd = `termux-notification --title "${safeTitle}" --content "${safeMsg}" --priority high --id "${id}"`;
            
            exec(cmd, (error) => {
                if (error) {
                    console.error(`[NOTIF FAIL] Gagal kirim ke Termux API: ${error.message}`);
                }
            });
        } else {
            // Fallback untuk Windows/Development (Cuma log aja)
            console.log('\n🔔 [MOCK NOTIFICATION] -----------------------');
            console.log(`Title : ${title}`);
            console.log(`Msg   : ${message}`);
            console.log('-----------------------------------------------\n');
        }
    }
}

module.exports = Notifier;