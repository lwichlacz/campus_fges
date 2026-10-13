"""
Année de construction des bâtiments d'Euratechnologies (BD TOPO de l'IGN, champ « date d'apparition »),
pour donner à chaque façade son époque (brique d'avant-guerre, immeuble des années 1950-1980, bâtiment récent).
Résultat : tools/osm/bdtopo_eura_annees.json, { identifiant BD TOPO : année }, lu par tools/build_eura.py.

Données © IGN, BD TOPO (Licence Ouverte Etalab 2.0), service WFS de la Géoplateforme.
Usage : python tools/fetch_eura_annees.py   (puis python tools/build_eura.py)
"""
import json, math, time, urllib.request, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LAT0, LON0 = 50.63419, 3.02354
K = math.cos(math.radians(LAT0)) * 111320
R = 560.0                          # le cœur détaillé (420 m autour de Wenov, qui est à ~90 m du repère) et une marge
BB = (LAT0 - R/110540, LON0 - R/K, LAT0 + R/110540, LON0 + R/K)
years, start = {}, 0
while True:
    q = urllib.parse.urlencode({ "SERVICE":"WFS", "VERSION":"2.0.0", "REQUEST":"GetFeature", "TYPENAMES":"BDTOPO_V3:batiment",
        "OUTPUTFORMAT":"application/json", "COUNT":5000, "STARTINDEX":start, "SORTBY":"cleabs",
        "PROPERTYNAME":"cleabs,date_d_apparition", "BBOX":f"{BB[0]},{BB[1]},{BB[2]},{BB[3]},urn:ogc:def:crs:EPSG::4326" })
    req = urllib.request.Request("https://data.geopf.fr/wfs/ows?" + q, headers={ "User-Agent":"campus-fges-build/1.0" })
    for attempt in range(4):
        try: d = json.load(urllib.request.urlopen(req, timeout=120)); break
        except Exception as ex: print("nouvel essai :", ex); time.sleep(5)
    else: raise SystemExit("WFS indisponible")
    fs = d.get("features", [])
    for f in fs:
        p = f["properties"]; a = p.get("date_d_apparition")
        if a: years[p["cleabs"].replace("BATIMENT", "")] = int(str(a)[:4])
    print(f"{start + len(fs)} bâtiments lus, {len(years)} datés")
    if len(fs) < 5000: break
    start += 5000
(ROOT / "tools" / "osm" / "bdtopo_eura_annees.json").write_text(json.dumps(years, separators=(",", ":")), encoding="utf-8")
