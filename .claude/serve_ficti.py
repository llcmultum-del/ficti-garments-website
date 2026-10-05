import http.server, sys

SITE_DIR = "/Users/bensmith/Desktop/Ficti Garments /Website"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SITE_DIR, **kwargs)
    def log_message(self, fmt, *args):
        pass

httpd = http.server.HTTPServer(("127.0.0.1", 3456), Handler)
sys.stdout.write("READY\n")
sys.stdout.flush()
httpd.serve_forever()
