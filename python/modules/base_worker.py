class BaseWorker:
    def __init__(self, api_client):
        self.api = api_client

    def run(self):
        """Logika utama worker harus ditulis di sini"""
        raise NotImplementedError("Setiap worker wajib punya fungsi run()")
