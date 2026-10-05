#!/usr/bin/env python3
"""Serveur local de développement sans cache (évite de tester une ancienne version des fichiers).
Usage : python tools/serve.py   puis ouvrir http://localhost:8765"""
import http.server, functools, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

if __name__ == "__main__":
    handler = functools.partial(NoCache, directory=ROOT)
    http.server.ThreadingHTTPServer(("", 8765), handler).serve_forever()
