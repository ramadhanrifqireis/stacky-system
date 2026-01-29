#!/bin/bash

# Konfigurasi Path
SOURCE_DIR="/sdcard/stacky-new"
DEST_DIR="$HOME/stacky-system"

echo "=========================================="
echo "   🚀 STACKY MIGRATION ASSISTANT"
echo "=========================================="

# 1. Cek apakah folder sumber ada
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Folder $SOURCE_DIR tidak ditemukan di memori internal!"
    exit 1
fi

# 2. Setup Folder Tujuan
echo "📂 Menyiapkan folder tujuan di: $DEST_DIR"
mkdir -p "$DEST_DIR"

# 3. Proses Copy (Menggunakan Rsync untuk Exclude)
# Kita pastikan rsync terinstall dulu
if ! command -v rsync &> /dev/null; then
    echo "⚙️ Menginstall rsync..."
    pkg install rsync -y
fi

echo "📦 Memindahkan file (Melewati database & node_modules)..."

# Command sakti rsync
# -a: Archive mode (preserve permission)
# -v: Verbose
# --exclude: Jangan bawa folder ini
rsync -av --exclude 'node_modules' \
          --exclude 'database' \
          --exclude '.git' \
          "$SOURCE_DIR/" "$DEST_DIR/"

echo "------------------------------------------"
echo "✅ Migrasi Selesai!"
echo "👉 Silakan masuk ke folder: cd ~/stacky-system"
echo "👉 Lalu install modul: npm install"
echo "👉 Dan restore database asli Anda secara manual jika diperlukan."
echo "=========================================="
