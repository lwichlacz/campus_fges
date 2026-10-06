#!/usr/bin/env python3
"""Serveur local de développement : fichiers sans cache + relais du formulaire vers le CRM.

Usage : python tools/serve.py   puis ouvrir http://localhost:8765

Le relais (POST /api/lead) garde la clé du CRM côté serveur : elle est lue dans le
fichier .env (jamais commité) et n'est jamais envoyée au navigateur.
Avec CRM_LIVE=0 (par défaut), rien n'est transmis : la demande s'affiche dans le terminal.
En production, ce relais doit être reproduit côté serveur (plugin WordPress ou équivalent).
"""
import http.server, functools, os, sys, json, re, time, urllib.request, urllib.error, urllib.parse
from collections import defaultdict, deque

for _s in (sys.stdout, sys.stderr):          # console Windows : accents et flèches sans plantage
    try: _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_env():
    env = {}
    path = os.path.join(ROOT, ".env")
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    env.update({k: v for k, v in os.environ.items() if k.startswith("CRM_")})
    return env

ENV = load_env()
EMAIL = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,190}\.[a-z]{2,}$", re.I)
SCHOOLS = {"FGES", "ISEA", "EDN"}
HITS = defaultdict(deque)          # anti-rafale : 5 envois / 10 min / adresse IP

def clip(v, n):
    v = (v or "").strip() if isinstance(v, str) else ""
    return v[:n] or None

def send_to_crm(payload):
    req = urllib.request.Request(
        ENV.get("CRM_URL", "").rstrip("/") + "/api/webhooks/wordpress-form",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-Import-Token": ENV.get("CRM_IMPORT_TOKEN", "")},
        method="POST")
    with urllib.request.urlopen(req, timeout=12) as r:
        return r.status, json.loads(r.read() or b"{}")

class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        # jamais de fichiers cachés (.env, .git…) ni d'outils serveur
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        parts = [p for p in urllib.parse.unquote(path).replace("\\", "/").split("/") if p]
        if any(p.startswith(".") for p in parts) or (parts and parts[0] in ("tools", "node_modules")):
            self.send_error(404)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def reply(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/lead":
            return self.reply(404, {"ok": False})
        ip = self.client_address[0]
        now = time.time(); q = HITS[ip]
        while q and now - q[0] > 600: q.popleft()
        if len(q) >= 5:
            return self.reply(429, {"ok": False, "error": "Trop d'envois, réessaie dans quelques minutes."})
        try:
            n = int(self.headers.get("Content-Length", "0"))
            if n > 8000: raise ValueError
            d = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self.reply(400, {"ok": False, "error": "Demande illisible."})

        # anti-robots : champ piège rempli ou formulaire envoyé trop vite → on fait semblant
        if d.get("website") or int(d.get("elapsed") or 0) < 3000:
            return self.reply(200, {"ok": True})
        email = (d.get("email") or "").strip().lower()
        if not EMAIL.match(email):
            return self.reply(400, {"ok": False, "error": "Adresse e-mail invalide."})
        if d.get("consentement") is not True:
            return self.reply(400, {"ok": False, "error": "Le consentement est nécessaire pour te recontacter."})

        formations = [f for f in (d.get("formations") or []) if isinstance(f, dict)][:12] or [{}]
        base = {
            "prenom": clip(d.get("prenom"), 80), "nom": clip(d.get("nom"), 80), "email": email,
            "telephone": clip(d.get("telephone"), 30), "code_postal": clip(d.get("code_postal"), 10),
            "consentement": True, "tracking_consentement": d.get("tracking") is True,
            "source_formulaire": "Campus FGES (jeu 3D)",
            "utm_source": clip(d.get("utm_source"), 80) or "campus-3d",
            "utm_medium": clip(d.get("utm_medium"), 80), "utm_campaign": clip(d.get("utm_campaign"), 80),
        }
        sent, live = 0, ENV.get("CRM_LIVE") == "1" and ENV.get("CRM_IMPORT_TOKEN") and ENV.get("CRM_URL")
        for f in formations:
            payload = dict(base)
            if f.get("name"): payload["filieres_visees"] = clip(f.get("name"), 160)
            if f.get("school") in SCHOOLS: payload["entite"] = f["school"]
            if not live:
                print("[CRM — mode essai, rien n'est envoyé]", json.dumps(payload, ensure_ascii=False), flush=True)
                sent += 1; continue
            try:
                code, _ = send_to_crm(payload)
                sent += 1 if code in (200, 201) else 0
            except urllib.error.HTTPError as e:
                print("[CRM] refus", e.code, e.read()[:300], flush=True)
            except Exception as e:
                print("[CRM] injoignable :", e, flush=True)
        q.append(now)
        if sent == 0:
            return self.reply(502, {"ok": False, "error": "Le service est momentanément indisponible. Réessaie plus tard."})
        return self.reply(200, {"ok": True, "sent": sent, "dryRun": not live})

if __name__ == "__main__":
    mode = "ENVOI RÉEL au CRM" if ENV.get("CRM_LIVE") == "1" else "mode essai (rien n'est envoyé au CRM)"
    print(f"Campus FGES → http://localhost:8765   ·   formulaire : {mode}", flush=True)
    handler = functools.partial(Handler, directory=ROOT)
    http.server.ThreadingHTTPServer(("127.0.0.1", 8765), handler).serve_forever()
