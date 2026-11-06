"""
Reçoit les vignettes envoyées par tools/fiches/captures.js et les enregistre dans img/fiches/<jeu>.jpg
(1200 × 783, JPEG progressif). Ctrl+C pour arrêter.

Usage : python tools/fiches/recepteur.py      (Pillow nécessaire : pip install pillow)
"""
import base64, io, re, http.server
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "img" / "fiches"
W, H = 1200, 783


class Recoit(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()

    def do_POST(self):
        nom = self.path.strip("/")
        if not re.fullmatch(r"[a-z0-9-]+", nom):
            self.send_response(400); self.cors(); self.end_headers(); return
        data = self.rfile.read(int(self.headers["Content-Length"])).decode()
        im = Image.open(io.BytesIO(base64.b64decode(data.split(",", 1)[1]))).convert("RGB")
        # recadrage au centre à la proportion 1200 × 783, puis réduction
        r = W / H
        w, h = im.size
        if w / h > r: nw = round(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        else: nh = round(w / r); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
        im = im.resize((W, H), Image.LANCZOS)
        OUT.mkdir(parents=True, exist_ok=True)
        im.save(OUT / f"{nom}.jpg", quality=82, optimize=True, progressive=True)
        print(f"img/fiches/{nom}.jpg ({(OUT / f'{nom}.jpg').stat().st_size // 1024} Ko)")
        self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b"ok")

    def log_message(self, *a): pass


if __name__ == "__main__":
    print("Récepteur des vignettes sur http://127.0.0.1:8769 (Ctrl+C pour arrêter)")
    http.server.HTTPServer(("127.0.0.1", 8769), Recoit).serve_forever()
