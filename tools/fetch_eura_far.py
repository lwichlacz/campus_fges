"""
Télécharge les bâtiments de la BD TOPO (IGN) autour d'Euratechnologies, jusqu'à 1,3 km, pour l'horizon du quartier.
Chaque bâtiment est réduit à son rectangle englobant orienté : [cx, cz, angle, longueur, largeur, hauteur, matériau des murs, surface]
en mètres autour du repère de tools/build_eura.py (Student Factory). Résultat : tools/osm/bdtopo_eura_far.json.

Données © IGN, BD TOPO (Licence Ouverte Etalab 2.0), service WFS de la Géoplateforme.
Usage : python tools/fetch_eura_far.py   (puis python tools/build_eura.py)
"""
import json, math, time, urllib.request, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LAT0, LON0 = 50.63419, 3.02354
K = math.cos(math.radians(LAT0)) * 111320
R = 1300.0
BB = (LAT0 - R/110540, LON0 - R/K, LAT0 + R/110540, LON0 + R/K)
def mp(lon, lat): return ((lon - LON0)*K, -(lat - LAT0)*110540)
def area(p): return abs(sum(p[i][0]*p[i-1][1] - p[i-1][0]*p[i][1] for i in range(len(p))))/2
def obb(p):
    best = None
    for i in range(len(p)):
        a = math.atan2(p[(i+1) % len(p)][1] - p[i][1], p[(i+1) % len(p)][0] - p[i][0]); c, s = math.cos(a), math.sin(a)
        us = [x*c + z*s for x, z in p]; vs = [-x*s + z*c for x, z in p]
        L, D = max(us) - min(us), max(vs) - min(vs)
        if best is None or L*D < best[3]*best[4]:
            cu, cv = (max(us) + min(us))/2, (max(vs) + min(vs))/2
            best = (a, cu*c - cv*s, cu*s + cv*c, L, D)
    return best

out, start = [], 0
while True:
    q = urllib.parse.urlencode({ "SERVICE":"WFS", "VERSION":"2.0.0", "REQUEST":"GetFeature", "TYPENAMES":"BDTOPO_V3:batiment",
        "OUTPUTFORMAT":"application/json", "COUNT":5000, "STARTINDEX":start, "SORTBY":"cleabs",
        "PROPERTYNAME":"hauteur,materiaux_des_murs,construction_legere,geometrie",
        "BBOX":f"{BB[0]},{BB[1]},{BB[2]},{BB[3]},urn:ogc:def:crs:EPSG::4326" })
    req = urllib.request.Request("https://data.geopf.fr/wfs/ows?" + q, headers={ "User-Agent":"campus-fges-build/1.0" })
    for attempt in range(4):
        try: d = json.load(urllib.request.urlopen(req, timeout=120)); break
        except Exception as ex: print("nouvel essai :", ex); time.sleep(5)
    else: raise SystemExit("WFS indisponible")
    fs = d.get("features", [])
    for f in fs:
        pr, g = f["properties"], f["geometry"]
        if not g or pr.get("construction_legere"): continue
        ring = g["coordinates"][0][0] if g["type"] == "MultiPolygon" else g["coordinates"][0]
        p = [mp(c[0], c[1]) for c in ring[:-1]]
        if len(p) < 3: continue
        A = area(p)
        if A < 40: continue
        cx, cz = sum(x for x, _ in p)/len(p), sum(z for _, z in p)/len(p)
        if math.hypot(cx, cz) < 300 or math.hypot(cx, cz) > R: continue          # le cœur détaillé est retiré par build_eura.py
        a, ox, oz, L, D = obb(p)
        out.append([round(ox, 1), round(oz, 1), round(a, 3), round(L, 1), round(D, 1), round(pr.get("hauteur") or 0, 1), (pr.get("materiaux_des_murs") or "")[:2], round(A)])
    print(f"{start + len(fs)} bâtiments lus, {len(out)} gardés")
    if len(fs) < 5000: break
    start += 5000
(ROOT / "tools" / "osm" / "bdtopo_eura_far.json").write_text(json.dumps({ "source":"IGN BD TOPO V3 (Licence Ouverte Etalab 2.0) · environs d'Euratechnologies", "buildings":out }, separators=(",", ":")), encoding="utf-8")
