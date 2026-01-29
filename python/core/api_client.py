import requests
import time
from .logger import log
from config.settings import Config

class ApiClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': Config.USER_AGENT})

    def lapor_topup(self, nick, qty, action="force_add"):
        """Mengirim laporan topup sukses ke Node.js"""
        payload = {
            "nick": nick,
            "status": "success",
            "action": action,
            "qty": qty
        }
        
        try:
            url = f"{Config.API_BASE_URL}/callback-topup"
            log.info(f"📡 Mengirim laporan untuk: {nick}...")
            
            response = self.session.post(url, json=payload, timeout=5)
            
            if response.status_code == 200:
                log.info(f"✅ Laporan Diterima: {response.json()}")
                return True
            else:
                log.error(f"❌ Server Menolak ({response.status_code}): {response.text}")
                return False

        except requests.exceptions.ConnectionError:
            log.critical("❌ Gagal terhubung ke Node.js! Pastikan 'npm start' sudah jalan.")
            return False
        except Exception as e:
            log.error(f"⚠️ Error tak terduga: {e}")
            return False
