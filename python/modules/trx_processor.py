import time
from core.digiflazz_api import DigiflazzAPI
from core.api_client import ApiClient 
from core.logger import log

class TrxProcessor:
    def __init__(self, api_client):
        self.digi = DigiflazzAPI()
        self.api = api_client # Konek ke Node.js

    def run(self):
        log.info("💳 Digiflazz Processor: Memantau Order Baru...")
        
        while True:
            try:
                # 1. Minta daftar semua Active Orders dari Node.js
                # Kita asumsikan ada endpoint API untuk get orders, atau baca JSON langsung
                # Agar aman dan cepat, kita baca JSON langsung saja lewat file sharing (karena 1 mesin)
                # TAPI, cara profesional adalah lewat API. Mari kita pakai API Client.
                
                # --- CARA CEPAT (BACA FILE JSON) ---
                # Path multi-platform via settings (pathlib)
                import json
                from config.settings import ORDERS_JSON

                path = ORDERS_JSON
                if path.exists():
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                    active_orders = data.get('active', [])
                    
                    # Cari order yang STATUS=PENDING dan TYPE=DIGI
                    for order in active_orders:
                        if order.get('status') == 'PENDING' and order.get('type') == 'DIGI':
                            
                            order_id = order['id']
                            sku = order['sku']
                            target = order['target_data'] # Perlu parsing jika ada spasi
                            
                            # Bersihkan Target (Ambil angka saja, misal "12345 (2020)" -> "123452020")
                            # Atau sesuaikan aturan Digiflazz (Biasanya User ID + Zone ID digabung)
                            clean_target = "".join(filter(str.isdigit, target))
                            
                            log.info(f"🔄 EKSEKUSI ORDER: {order_id} | SKU: {sku} | Target: {clean_target}")
                            
                            # 2. Update status jadi PROCESSING dulu biar gak dieksekusi double
                            # (Harusnya update via API Node, tapi di sini kita pakai api_client helper)
                            # Untuk simplicity, kita anggap langsung eksekusi:
                            
                            # 3. TEMBAK KE DIGIFLAZZ
                            # result = self.digi.topup(sku, clean_target, order_id)
                            
                            # --- SIMULASI SUKSES (SAFETY FIRST) ---
                            # Hapus komen di atas dan komen baris ini jika sudah siap saldo!
                            result = {
                                "data": {
                                    "status": "Pending", # Biasanya Digiflazz status awal Pending
                                    "sn": "",
                                    "message": "Transaksi dibuat"
                                }
                            }
                            # --------------------------------------

                            log.info(f"✅ Respon Digiflazz: {result}")
                            
                            # 4. Update Status Order di Node.js
                            # Kita butuh endpoint Node.js untuk update status order
                            # Buat endpoint '/api/update-order-status' di Node.js nanti
                            self.api.update_order(order_id, "PROCESSING", result.get('data', {}).get('message'))
                            
                time.sleep(5) # Cek setiap 5 detik

            except Exception as e:
                log.error(f"⚠️ Error Processor: {e}")
                time.sleep(10)