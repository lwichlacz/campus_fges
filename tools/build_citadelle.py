"""Détails de la Citadelle pour le campus 3D, d'après l'extrait OpenStreetMap tools/osm/osm_citadelle.json :
murailles (escarpes de brique), murs de soutènement, talus, demi-lunes, fossés en eau, ponts, bois, bâtiments nommés.
Même projection que tools/build_map.py (on en exécute le début). Écrit js/citadelle_osm.js (généré, ne pas modifier).
Usage : python3 tools/build_citadelle.py"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = (ROOT / "tools" / "build_map.py").read_text(encoding="utf-8")
head = src[:src.index("# --- bâtiments « héros »")]          # constantes et projection (mp, G), sans construire la carte
ns = {"__file__": str(ROOT / "tools" / "build_map.py")}
exec(compile(head, "build_map.py (début)", "exec"), ns)
mp, G = ns["mp"], ns["G"]

els = json.load(open(ROOT / "tools" / "osm" / "osm_citadelle.json", encoding="utf-8"))["elements"]
def pts(e): return [G(mp(c)) for c in e.get("geometry", []) if c]
def flat(q): return [v for p in q for v in p]
def closed(e):
	g = e.get("geometry", [])
	return len(g) > 3 and g[0]["lat"] == g[-1]["lat"] and g[0]["lon"] == g[-1]["lon"]

out = { "walls":[], "water":[], "bridges":[], "woods":[], "named":[], "grass":[] }
KIND = { "city_wall":0, "retaining_wall":1, "wall":3 }
for e in els:
	t = e.get("tags", {})
	if e.get("type") != "way" or "geometry" not in e: continue
	q = pts(e)
	if len(q) < 2: continue
	name = t.get("name", "")
	if t.get("barrier") in KIND: out["walls"].append([KIND[t["barrier"]], int(closed(e)), name, flat(q)])
	elif t.get("man_made") == "embankment":
		out["walls"].append([2, int(closed(e)), name, flat(q)])
		if t.get("natural") == "wood" and closed(e): out["woods"].append(flat(q[:-1]))
		if t.get("landuse") == "grass" and closed(e): out["grass"].append(flat(q[:-1]))
	elif t.get("natural") == "water" and closed(e): out["water"].append([name, flat(q[:-1])])
	elif t.get("man_made") == "bridge" and closed(e): out["bridges"].append(flat(q[:-1]))
	elif t.get("natural") == "wood" and closed(e): out["woods"].append(flat(q[:-1]))
	elif t.get("landuse") == "military" and closed(e): out["military"] = flat(q[:-1])
	if "building" in t and closed(e) and (name or t["building"] == "chapel"):
		out["named"].append([name or "Chapelle", t["building"], flat(q[:-1])])

# Esplanade du Champ de Mars (relation OSM 10754117, tools/osm/osm_champ_de_mars.json) : contours extérieurs raboutés
_cm = ROOT / "tools" / "osm" / "osm_champ_de_mars.json"
out["champ"] = []
if _cm.exists():
	for rel in json.load(open(_cm, encoding="utf-8"))["elements"]:
		ways = [[(c["lat"], c["lon"]) for c in m["geometry"]] for m in rel.get("members", []) if m.get("role") == "outer" and m.get("geometry")]
		while ways:
			ring = ways.pop(0)
			while ring[0] != ring[-1]:
				for i, w in enumerate(ways):
					if w[0] == ring[-1]: ring += w[1:]; ways.pop(i); break
					if w[-1] == ring[-1]: ring += w[::-1][1:]; ways.pop(i); break
				else: break
			out["champ"].append(flat(G(mp({"lat":la, "lon":lo})) for la, lo in ring[:-1]))
# direction du sud-ouest en coordonnées du campus (la carte est tournée) : orientation de la Porte Dauphine
_c = next(e for e in els if e.get("tags", {}).get("historic") == "castle" and "geometry" in e)["geometry"]
_lat = sum(c["lat"] for c in _c)/len(_c); _lon = sum(c["lon"] for c in _c)/len(_c)
_a = G(mp({"lat":_lat, "lon":_lon})); _b = G(mp({"lat":_lat - .0007, "lon":_lon - .0007/0.635}))
_l = ((_b[0]-_a[0])**2 + (_b[1]-_a[1])**2) ** .5
out["sw"] = [round((_b[0]-_a[0])/_l, 3), round((_b[1]-_a[1])/_l, 3)]
js = ("/* Généré par tools/build_citadelle.py — ne pas modifier à la main.\n"
      "   Données © les contributeurs d'OpenStreetMap (ODbL). Coordonnées du campus (voir tools/build_map.py).\n"
      "   walls : [genre (0 muraille, 1 mur de soutènement, 2 talus, 3 mur), fermé, nom, points] */\n"
      "export const CIT = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
(ROOT / "js" / "citadelle_osm.js").write_text(js, encoding="utf-8")
print({k: len(v) for k, v in out.items()})
