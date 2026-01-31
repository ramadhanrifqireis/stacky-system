import sys
import time
from core.logger import log
from core.api_client import ApiClient
from modules.topup_listener import TopupListener

# Fix Python crash di Windows: terminal default bukan UTF-8, emoji error
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass  # Fallback jika reconfigure tidak tersedia (Python lama)


def main():
    log.info("==========================================")
    log.info("   🚀 STACKY PYTHON EXECUTOR (PRO)       ")
    log.info("==========================================")

    # 1. Siapkan Alat Komunikasi
    client = ApiClient()

    # 2. Siapkan Pekerja (Workers)
    # Kalau nanti ada worker lain (misal PriceChecker), tinggal tambah disini
    workers = [
        TopupListener(client)
    ]

    # 3. Jalankan Semua Pekerja
    try:
        # Untuk saat ini kita jalankan sequential (bergantian) dalam loop
        # Jika butuh parallel (multithreading), bisa di-upgrade nanti
        log.info("🔥 Memulai Loop Pekerja...")
        
        for worker in workers:
            worker.run() # Saat ini TopupListener punya while True sendiri

    except KeyboardInterrupt:
        log.warning("🛑 Bot dimatikan manual (CTRL+C).")
    except Exception as e:
        log.critical(f"💀 Error Fatal di Main: {e}")

if __name__ == "__main__":
    # Delay start biar Node.js siap duluan
    time.sleep(2)
    main()
