"""
Numérote les fichiers JavaScript du site avant chaque mise en ligne.

Sans numéro, un téléphone peut garder en cache d'anciens modules et en mélanger avec des nouveaux
(une nouveauté apparaît, une autre non). Le script ajoute ?v=<empreinte> à chaque import relatif
(js/**/*.js, index.html, liste.html). L'empreinte est commune à tous les fichiers, calculée sur leur
contenu : elle change dès qu'un fichier change, et un module n'est jamais chargé sous deux adresses.

Usage : python tools/version.py   (puis commit et push)
"""
import hashlib, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = sorted((ROOT / "js").rglob("*.js")) + [ROOT / "index.html", ROOT / "liste.html"]
# "./x.js", "../x.js", "js/x.js" entre guillemets, avec ou sans ?v=… déjà posé
SPEC = re.compile(r"""(["'])((?:\.{1,2}/|js/)[^"'?\s]+\.js)(?:\?v=[0-9a-f]+)?\1""")

def strip(t): return SPEC.sub(lambda m: m.group(1) + m.group(2) + m.group(1), t)

texts = {f: f.read_text(encoding="utf-8") for f in FILES}
h = hashlib.sha1()
for f in FILES: h.update(strip(texts[f]).encode("utf-8"))
v = h.hexdigest()[:10]
changed = 0
for f, t in texts.items():
    n = SPEC.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={v}{m.group(1)}", t)
    if n != t:
        f.write_text(n, encoding="utf-8", newline="")
        changed += 1
print(f"version {v} · {changed} fichier(s) mis à jour")
