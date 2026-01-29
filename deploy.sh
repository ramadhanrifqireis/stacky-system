#!/bin/bash

# --- KONFIGURASI ---
SOURCE_PATH="/sdcard/stacky-new"  # Lokasi folder kamu di File Manager
DEST_PATH="$HOME/stacky-system"   # Nama folder baru di dalam Termux

clear
echo "=========================================="
echo "   🚀 STACKY SYSTEM DEPLOYER"
echo "=========================================="

# 1. SETUP STORAGE
echo "[1/5] 📂 Meminta izin akses storage..."
termux-setup-storage
sleep 2 # Beri waktu sebentar
echo "      ✅ Izin diproses."

# 2. CEK SUMBER
echo "[2/5] 🔍 Mengecek folder sumber di: $SOURCE_PATH"
if [ ! -d "$SOURCE_PATH" ]; then
    echo "❌ ERROR: Folder tidak ditemukan di $SOURCE_PATH"
    echo "Pastikan kamu sudah membuat folder 'stacky-new' di penyimpanan internal."
    exit 1
fi
echo "      ✅ Folder sumber ditemukan."

# 3. PROSES COPY
if [ -d "$DEST_PATH" ]; then
    echo "[3/5] ⚠️  Versi lama ditemukan. Menghapus untuk update..."
    rm -rf "$DEST_PATH"
fi

echo "[3/5] 📦 Menyalin file ke Termux..."
cp -r "$SOURCE_PATH" "$DEST_PATH"
echo "      ✅ Copy selesai."

# 4. INSTALASI DEPENDENCIES
echo "[4/5] ⏳ Menginstall modul Node.js (npm install)..."
cd "$DEST_PATH"

if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json tidak ditemukan! Pastikan file ini ada."
    exit 1
fi

# Install paket (Hanya install dependencies, abaikan devDependencies biar cepat)
npm install --production --silent
echo "      ✅ Modul berhasil diinstall."

# 5. FINISHING
echo "=========================================="
echo "✅ DEPLOY SUKSES!"
echo "=========================================="
echo "Aplikasi siap digunakan."
echo ""
echo "👉 Ketik perintah ini untuk menjalankan:"
echo "   cd stacky-system && node app.js"
echo ""
