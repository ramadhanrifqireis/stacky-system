import hashlib
import requests
import json
from config.secrets import DIGIFLAZZ_USER, DIGIFLAZZ_KEY

class DigiflazzAPI:
    def __init__(self):
        self.base_url = "https://api.digiflazz.com/v1"

    def generate_signature(self, ref_id, cmd="deposit"):
        """Membuat Signature MD5 (Wajib untuk Digiflazz)"""
        # Rumus: username + key + ref_id
        raw = f"{DIGIFLAZZ_USER}{DIGIFLAZZ_KEY}{ref_id}"
        return hashlib.md5(raw.encode()).hexdigest()

    def cek_saldo(self):
        """Mengecek Real Stock (Saldo) kita di Digiflazz"""
        payload = {
            "cmd": "deposit",
            "username": DIGIFLAZZ_USER,
            "sign": self.generate_signature("depo")
        }
        try:
            resp = requests.post(f"{self.base_url}/ceksaldo", json=payload)
            return resp.json()
        except Exception as e:
            return {"data": {"deposit": 0}, "error": str(e)}

    def topup(self, sku, customer_no, ref_id):
        """Eksekusi Transaksi (The Real Deal)"""
        payload = {
            "username": DIGIFLAZZ_USER,
            "buyer_sku_code": sku,
            "customer_no": customer_no,
            "ref_id": ref_id,
            "sign": self.generate_signature(ref_id)
        }
        
        # Logika request ke Endpoint Transaksi Digiflazz
        try:
            resp = requests.post(f"{self.base_url}/transaction", json=payload)
            return resp.json()
        except Exception as e:
            return {"data": {"status": "Gagal", "message": str(e)}}
