"""Calage du campus 3D sur la photo aérienne de l'IGN : pour chaque quartier, la position des coins de la photo
dans les coordonnées du jeu (même projection que tools/build_map.py et tools/build_eura.py, dont on exécute le début).
Écrit tools/film/calage.json, lu par tools/film/calage.js (vue de dessus superposée à la photo, dans le navigateur).
Usage : python3 tools/calage.py"""
import json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def head(script, marker):
	src = (ROOT / "tools" / script).read_text(encoding="utf-8")
	ns = {"__file__": str(ROOT / "tools" / script)}
	exec(compile(src[:src.index(marker)], script + " (début)", "exec"), ns)
	return ns

out = {}
for name, script, marker, photo, box in [
	("vauban", "build_map.py", "# --- bâtiments « héros »", "ortho_zone.jpg", (50.6250, 3.0338, 50.6363, 3.0514)),
	("eura", "build_eura.py", "# Wenov n'occupe pas tout l'îlot", "ortho_eura.jpg", (50.6295, 3.0165, 50.6389, 3.0307)),
]:
	ns = head(script, marker)
	mp, G = ns["mp"], ns["G"]
	la0, lo0, la1, lo1 = box
	# coins de l'image : haut-gauche, haut-droit, bas-gauche (sans la compression du lointain de Vauban)
	g = (lambda q: G(q, False)) if name == "vauban" else G
	corners = [g(mp({"lat":la1, "lon":lo0})), g(mp({"lat":la1, "lon":lo1})), g(mp({"lat":la0, "lon":lo0}))]
	shutil.copy(ROOT / "tools" / "osm" / photo, ROOT / "tools" / "film" / ("_ortho_" + name + ".jpg"))
	out[name] = {"photo": "_ortho_" + name + ".jpg", "corners": corners}
	print(name, corners)
(ROOT / "tools" / "film" / "calage.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
