import time
import random
from core.logger import log
from config.settings import Config
from .base_worker import BaseWorker

class TopupListener(BaseWorker):
    def run(self):
        log.info("🕵️ Topup Listener: Siap memantau mutasi/SMS...")
        
        while True:
            try:
                # --- [TEMPAT KODE KOMPLEKSMU DISINI] ---
                # Contoh Logika:
                # 1. Baca notifikasi bar / SMS terbaru
                # 2. Regex parsing: "Terima Rp 100.000 dari FULAN"
                # 3. If found -> Panggil self.api.lapor_topup()
                
                # [SIMULASI] Pura-pura menemukan topup (Hapus ini nanti)
                # if random.randint(1, 100) > 95:
                #    log.info("💰 Mendeteksi Topup Masuk!")
                #    self.api.lapor_topup("tacer17", 1) # Lapor ke Node.js
                
                # Tidur sejenak biar HP gak panas
                time.sleep(Config.CHECK_INTERVAL)

            except Exception as e:
                log.error(f"⚠️ Error di TopupListener: {e}")
                time.sleep(Config.RETRY_DELAY) # Tunggu sebelum coba lagi
