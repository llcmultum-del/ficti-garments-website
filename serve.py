import http.server, os
os.chdir("/Users/bensmith/Desktop/Ficti Garments /Website")
handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.HTTPServer(("", 3456), handler)
httpd.serve_forever()
