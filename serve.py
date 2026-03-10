import http.server
import os

PORT = 3000
DIR = "/Users/joe.bruce/Desktop/Claud Code Folder/Portfolio V1"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)
    def log_message(self, format, *args):
        pass

with http.server.HTTPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
