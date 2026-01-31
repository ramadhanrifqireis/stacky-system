import os
from pathlib import Path

# Project root: dari python/config/settings.py -> naik 2 level = python -> 1 level = root
# Berjalan benar baik saat dijalankan dari root (npm start) maupun dari folder python
_BASE_FILE = Path(__file__).resolve()
BASE_DIR = _BASE_FILE.parent.parent.parent  # project root
DATABASE_DIR = BASE_DIR / "database"
DATABASE_CORE_DIR = DATABASE_DIR / "core"
ORDERS_JSON = DATABASE_CORE_DIR / "orders.json"


class Config:
    # Koneksi ke Node.js (Backend)
    API_BASE_URL = os.getenv("API_URL", "http://localhost:3000/api")

    # Identitas Bot
    BOT_NAME = "Stacky-Python-Unit-01"
    USER_AGENT = "Stacky-Python/2.0"

    # Interval Detik (Agar tidak memberatkan CPU HP)
    CHECK_INTERVAL = 5
    RETRY_DELAY = 10    
