"""Détails d'Euratechnologies pour le campus 3D, d'après tools/osm/osm_eura.json : le jardin Le Blan-Lafont (contour,
allées, petits ponts), les passerelles sur la Deûle. Même projection que tools/build_eura.py (on en exécute le début).
Écrit js/eura_details.js (généré, ne pas modifier). Usage : python3 tools/build_eura_details.py"""
import json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = (ROOT / "tools" / "build_eura.py").read_text(encoding="utf-8")
ns = {"__file__": str(ROOT / "tools" / "build_eura.py")}
exec(compile(src[:src.index("# Wenov n'occupe pas tout l'îlot")], "build_eura.py (début)", "exec"), ns)
mp, G = ns["mp"], ns["G"]

els = json.load(open(ROOT / "tools" / "osm" / "osm_eura.json", encoding="utf-8"))["elements"]
def pts(e): return [G(mp(c)) for c in e.get("geometry", []) if c]
def flat(q): return [v for p in q for v in p]
def inside(x, z, p):
	ins = False
	for i in range(len(p)):
		(xi, zi), (xj, zj) = p[i], p[i-1]
		if (zi > z) != (zj > z) and x < (xj-xi)*(z-zi)/(zj-zi) + xi: ins = not ins
	return ins
def length(q): return sum(math.dist(q[i], q[i+1]) for i in range(len(q)-1))

garden = next(e for e in els if e.get("type") == "way" and e.get("id") == 117108920)
gp = pts(garden)[:-1]
out = { "garden":flat(gp), "paths":[], "gbridges":[], "footbridges":[] }
for e in els:
	t = e.get("tags", {})
	if e.get("type") != "way" or "geometry" not in e: continue
	hw = t.get("highway")
	if hw not in ("footway", "pedestrian", "path", "cycleway", "steps"): continue
	q = pts(e)
	if len(q) < 2: continue
	mid = q[len(q)//2] if len(q) > 2 else ((q[0][0]+q[1][0])/2, (q[0][1]+q[1][1])/2)
	inG = inside(*mid, gp)
	if t.get("bridge"):
		L = length(q)
		if inG: out["gbridges"].append(flat(q))
		elif L > 9 and t.get("bridge") == "movable" or L > 14: out["footbridges"].append([t.get("bridge"), flat(q)])
	elif inG: out["paths"].append([hw, flat(q)])

js = ("/* Généré par tools/build_eura_details.py — ne pas modifier à la main.\n"
      "   Données © les contributeurs d'OpenStreetMap (ODbL). Coordonnées d'Euratechnologies (voir tools/build_eura.py). */\n"
      "export const EURA_DETAILS = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
(ROOT / "js" / "eura_details.js").write_text(js, encoding="utf-8")
print({k: len(v) for k, v in out.items()})
