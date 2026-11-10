"""
Numérote les fichiers JavaScript du site avant chaque mise en ligne.

Sans numéro, un téléphone peut garder en cache d'anciens modules et en mélanger avec des nouveaux
(une nouveauté apparaît, une autre non). Le script ajoute ?v=<empreinte> à chaque import relatif
(js/**/*.js, index.html, liste.html). L'empreinte est commune à tous les fichiers, calculée sur leur
contenu : elle change dès qu'un fichier change, et un module n'est jamais chargé sous deux adresses.

three.js (vendor/three-<version>/) n'est pas numéroté : son dossier porte déjà sa version, et il reste
ainsi en cache d'une mise en ligne à l'autre.

Le script réécrit aussi la liste de précache de sw.js (borne hors ligne) : la version du cache et
l'adresse exacte de chaque fichier, numéro compris.

Usage : python tools/version.py   (puis commit et push)
"""
import hashlib, json, re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
FILES = sorted((ROOT / "js").rglob("*.js")) + [ROOT / "index.html", ROOT / "liste.html"]
# "./x.js", "../x.js", "js/x.js" entre guillemets, avec ou sans ?v=… déjà posé (sauf vendor/)
SPEC = re.compile(r"""(["'])((?:\.{1,2}/|js/)(?!vendor/)[^"'?\s]+\.js)(?:\?v=[0-9a-f]+)?\1""")

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

# Précache du service worker : tout ce qu'il faut pour que le campus et les jeux tournent sans réseau.
def rel(p): return quote(p.relative_to(ROOT).as_posix())
pre = ["./", "index.html", "liste.html", "credits.html", "formations.json"]
pre += [f"{rel(p)}?v={v}" for p in sorted((ROOT / "js").rglob("*.js"))]
pre += [rel(p) for p in sorted((ROOT / "vendor").rglob("*.js"))]
pre += [rel(p) for p in sorted((ROOT / "img").glob("*")) if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".svg", ".webp")]
sw = ROOT / "sw.js"
s = sw.read_text(encoding="utf-8")
s2 = re.sub(r'const VERSION = "[^"]*";', f'const VERSION = "{v}";', s)
s2 = re.sub(r"const FILES = \[[\s\S]*?\];", "const FILES = " + json.dumps(pre, indent="\t") + ";", s2)
if s2 != s:
    sw.write_text(s2, encoding="utf-8", newline="")
    changed += 1
print(f"version {v} · {changed} fichier(s) mis à jour · précache : {len(pre)} fichiers")
