/**
 * KONFIGURASI APLIKASI UTAMA
 * Menyimpan pengaturan server dan identitas toko.
 */

module.exports = {
    server: {
        port: 3000, // Port default
        env: 'development', // Mode pengembangan
    },
    system: {
        timezone: 'Asia/Jakarta', 
        currencyLocale: 'id-ID',
    },
    shop: {
        name: "Hai Imam", 
        owner: "Imam"
    }
};