import logging
import sys

# Format Log: [JAM] [LEVEL] PESAN
LOG_FORMAT = "[%(asctime)s] [%(levelname)s] %(message)s"
DATE_FORMAT = "%H:%M:%S"

def setup_logger(name="StackyBot"):
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # Handler ke Layar (Console)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
    console_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    return logger

# Buat instance global biar bisa dipanggil dimana aja
log = setup_logger()
