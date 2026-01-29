const fs = require('fs');
const path = require('path');

/**
 * JSONDriver - Pengelola File Database
 * Menggantikan fungsi fs.readFileSync manual yang berantakan.
 */
class JSONDriver {
    /**
     * @param {string} filePath - Lokasi file relatif dari root project
     * @param {any} defaultData - Data default jika file kosong
     */
    constructor(filePath, defaultData = []) {
        // Menggunakan process.cwd() agar path selalu benar saat dijalankan dari root
        this.filePath = path.resolve(process.cwd(), filePath);
        this.defaultData = defaultData;
        this.ensureFileExists();
    }

    // Pastikan file dan foldernya ada, jika tidak, buat baru
    ensureFileExists() {
        if (!fs.existsSync(this.filePath)) {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            
            this.write(this.defaultData);
            console.log(`[DB] File baru dibuat: ${this.filePath}`);
        }
    }

    // Baca data (Aman dari error JSON malformed)
    read() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            if (!data) return this.defaultData;
            return JSON.parse(data);
        } catch (err) {
            console.error(`[DB ERROR] Gagal membaca ${this.filePath}:`, err.message);
            return this.defaultData;
        }
    }

    // Tulis data
    write(data) {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (err) {
            console.error(`[DB ERROR] Gagal menyimpan ke ${this.filePath}:`, err.message);
            return false;
        }
    }
}

module.exports = JSONDriver;