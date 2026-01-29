/**
 * KONFIGURASI LOGIKA GAME/BISNIS
 * Ubah angka di sini jika ingin mengubah aturan main.
 */

module.exports = {
    limits: {
        target_dm: 300,        // Target stok aman (sebelumnya di webHandler.js)
        cap_potential: 140,    // Maksimal potensi WDP yang dihitung
        wdp_daily_reward: 20,  // Berapa DM didapat per hari WDP
        wdp_days_per_pack: 7,  // 1 Paket topup = 7 hari
        topup_pack_dm: 80,     // 1 Paket topup = 80 DM
    },
    scheduler: {
        wdp_reset_hour: 15,    // Jam 15:00 WIB reset server MLBB
        notification_check_interval: 60000, // Cek notif tiap 60 detik
    }
};