# 🚀 Stacky System (Refactored)

Sistem manajemen stok dan otomatisasi pesanan berbasis Node.js dengan arsitektur MVC (Model-View-Controller). Didesain untuk dijalankan di lingkungan Termux (Android) dengan fitur notifikasi native.

## 🌟 Fitur Utama
* **MVC Architecture**: Kode rapi, modular, dan mudah dikembangkan.
* **Smart Scheduler**: Otomatisasi klaim WDP harian & pengecekan order jatuh tempo.
* **Termux Notification**: Integrasi notifikasi langsung ke Status Bar Android.
* **JSON Database Driver**: Penyimpanan data ringan tanpa database SQL yang berat.
* **Price Watcher**: (Coming Soon) Monitoring harga pasar otomatis.

## 📂 Struktur Folder
* `src/models`: Logika manipulasi data (JSON).
* `src/controllers`: Logika bisnis dan penghubung tampilan.
* `src/services`: Service latar belakang (Scheduler, Notifier).
* `config`: Pengaturan sistem dan game.

## 📦 Cara Install (Termux)

1.  Clone repository ini atau copy ke `$HOME`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Jalankan aplikasi:
    ```bash
    node app.js
    ```

## ⚠️ Catatan
Folder `database/` tidak disertakan dalam repository ini demi keamanan data. Sistem akan membuat file database kosong secara otomatis saat pertama kali dijalankan.

---
*Developed by Imam - Informatics Student*
