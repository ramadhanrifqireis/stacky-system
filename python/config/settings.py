import os

class Config:
    # Koneksi ke Node.js (Backend)
    API_BASE_URL = os.getenv("API_URL", "http://localhost:3000/api")
    
    # Identitas Bot
    BOT_NAME = "Stacky-Python-Unit-01"
    USER_AGENT = "Stacky-Python/2.0"
    
    # Interval Detik (Agar tidak memberatkan CPU HP)
    CHECK_INTERVAL = 5  
    RETRY_DELAY = 10    
