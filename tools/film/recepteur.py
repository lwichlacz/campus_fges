"""Reçoit la vidéo tournée par tools/film/film.js (POST) et l'écrit dans le dépôt.
Usage : python3 tools/film/recepteur.py   (port 8767, n'écoute que sur cette machine)"""
import http.server, pathlib, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parents[2]
class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "http://localhost:8765"); self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS"); self.send_header("Access-Control-Allow-Headers", "Content-Type")
    def do_OPTIONS(self): self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(self.path).query))
        dest = (ROOT / q.get("sortie", "docs/validation-web/media/campus-3d.mp4")).resolve()
        if ROOT not in dest.parents or dest.suffix not in (".mp4", ".webm", ".jpg"):
            self.send_response(400); self.cors(); self.end_headers(); return
        n = int(self.headers["Content-Length"]); dest.write_bytes(self.rfile.read(n))
        self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(f"écrit {dest.relative_to(ROOT)} ({n} octets)".encode())
http.server.HTTPServer(("127.0.0.1", 8767), H).serve_forever()
