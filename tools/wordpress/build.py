"""
Prépare l'extension WordPress du campus.

1. Écrit formations.json à la racine du site (lu par l'extension pour le bloc, les liens et les plaquettes)
   et sa copie de secours dans l'extension, à partir de js/data.js.
2. Fabrique tools/wordpress/campus-fges.zip, à téléverser dans WordPress (Extensions → Ajouter → Téléverser).

Usage : python tools/wordpress/build.py   (Node.js nécessaire)
"""
import json, subprocess, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLUGIN = ROOT / "tools" / "wordpress" / "campus-fges"
JS = """
const d = await import(process.argv[1]);
const LV = { prep:"Année préparatoire", L:"Licences et prépas", LP:"Licence professionnelle", M:"Masters", DU:"Diplômes d'université" };
const out = d.FORMATIONS.map(f => {
  const g = d.GAMES[f.id] && d.GAME_INFO[d.GAMES[f.id]];
  return { id:f.id, name:f.name, school:f.school, level:f.level, levelLabel:LV[f.level] || f.level, url:f.url,
    game: g ? { id:d.GAMES[f.id], title:g.title, icon:g.icon, dur:g.dur, pitch:g.pitch } : null };
});
process.stdout.write(JSON.stringify({ formations: out }, null, 1));
"""

def formations_json():
    url = (ROOT / "js" / "data.js").as_uri()
    return subprocess.run(["node", "--input-type=module", "-e", JS, url], capture_output=True, text=True, encoding="utf-8", check=True).stdout

if __name__ == "__main__":
    data = formations_json()
    for p in (ROOT / "formations.json", PLUGIN / "formations.json"):
        p.write_text(data + "\n", encoding="utf-8", newline="\n")
    z = ROOT / "tools" / "wordpress" / "campus-fges.zip"
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(PLUGIN.rglob("*")):
            if f.is_file(): zf.write(f, "campus-fges/" + f.relative_to(PLUGIN).as_posix())
    n = len(json.loads(data)["formations"])
    print(f"formations.json : {n} formations · {z.relative_to(ROOT)} prêt")
