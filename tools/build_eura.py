#!/usr/bin/env python3
"""
Construit js/euramap.js : le quartier d'Euratechnologies (Bois-Blancs, Lille) autour de Wenov,
à partir de l'extrait OpenStreetMap tools/osm/osm_eura.json (même format que js/vauban.js).

Projection : mètres autour du bloc Wenov (avenue de Bretagne, rue des Templiers, allée Clémentine
Deman, allée du Donjon), rotation pour mettre l'avenue de Bretagne à l'horizontale, échelle S
identique à Vauban. Pas de compression : tout est à l'échelle sur CORE mètres.

Wenov n'est pas dessiné dans OpenStreetMap : son emprise est reconstituée à partir des rues qui
bordent l'îlot, et il est modélisé à la main (js/eura.js), comme le Blan-Lafont et sa tour.

Données © les contributeurs d'OpenStreetMap (ODbL) ; bâtiments © IGN BD TOPO (Licence Ouverte Etalab 2.0).
Usage : python tools/build_eura.py
"""
import json, math, hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LAT0, LON0 = 50.63419, 3.02354          # Student Factory : repère de travail
K = math.cos(math.radians(LAT0)) * 111320
S, CORE = 0.4, 420.0

E = json.load(open(ROOT / "tools" / "osm" / "osm_eura.json", encoding="utf-8"))["elements"]
def mp(p): return ((p["lon"] - LON0) * K, -(p["lat"] - LAT0) * 110540)
def h(i, n=1000): return int(hashlib.md5(str(i).encode()).hexdigest(), 16) % n
def area(p): return abs(sum(p[i][0]*p[i-1][1] - p[i-1][0]*p[i][1] for i in range(len(p)))) / 2
def cen(p): return (sum(x for x, _ in p)/len(p), sum(z for _, z in p)/len(p))
def extents(p, a):
    c, s = math.cos(a), math.sin(a)
    us = [x*c + z*s for x, z in p]; vs = [-x*s + z*c for x, z in p]
    cu, cv = (max(us)+min(us))/2, (max(vs)+min(vs))/2
    return (cu*c - cv*s, cu*s + cv*c, max(us)-min(us), max(vs)-min(vs))
def obb(p):
    best = None
    for i in range(len(p) - 1):
        a = math.atan2(p[i+1][1]-p[i][1], p[i+1][0]-p[i][0]); r = extents(p, a)
        if best is None or r[2]*r[3] < best[2]*best[3]: best = (a,) + r
    return best
def inside(x, z, p):
    c = False; j = len(p) - 1
    for i in range(len(p)):
        (xi, zi), (xj, zj) = p[i], p[j]
        if (zi > z) != (zj > z) and x < (xj - xi)*(z - zi)/(zj - zi) + xi: c = not c
        j = i
    return c
def bbox(p): xs = [v[0] for v in p]; zs = [v[1] for v in p]; return (min(xs), min(zs), max(xs), max(zs))
P = lambda e: [mp(q) for q in e["geometry"]]
ways = [e for e in E if e["type"] == "way" and "geometry" in e]
byname = lambda n: [e for e in ways if e.get("tags", {}).get("name") == n]

# --- l'îlot Wenov : coins = croisements des quatre rues qui le bordent ---
def line(name, hw=None):
    pts = []
    for e in byname(name):
        if hw and e["tags"].get("highway") not in hw: continue
        pts += P(e)
    return pts
def fit(pts):                      # droite des moindres carrés : (point, direction)
    mx, mz = cen(pts)
    sxx = sum((x-mx)**2 for x, _ in pts); szz = sum((z-mz)**2 for _, z in pts); sxz = sum((x-mx)*(z-mz) for x, z in pts)
    a = .5*math.atan2(2*sxz, sxx - szz); return (mx, mz, math.cos(a), math.sin(a))
def cross(l1, l2):
    x1, z1, u1, v1 = l1; x2, z2, u2, v2 = l2
    d = u1*v2 - v1*u2; t = ((x2-x1)*v2 - (z2-z1)*u2)/d
    return (x1 + u1*t, z1 + v1*t)
near = lambda pts, c, r: [q for q in pts if math.dist(q, c) < r]
BRET = fit(near(line("Avenue de Bretagne", ("residential",)), (-90, -45), 90))
TEMP = fit(near(line("Rue des Templiers", ("residential",)), (-110, 40), 80))
DEMA = fit(near(line("Allée Clémentine Deman"), (-45, 0), 70))
DONJ = fit(near(line("Allée du Donjon"), (-50, 80), 45))
corners = [cross(BRET, TEMP), cross(BRET, DEMA), cross(DEMA, DONJ), cross(DONJ, TEMP)]
WC = cen(corners)
print("îlot Wenov (m) :", [tuple(round(v) for v in c) for c in corners], "centre", tuple(round(v) for v in WC))

# --- repère : centre = Wenov, avenue de Bretagne à l'horizontale, le Blan-Lafont devant ---
ax = math.atan2(BRET[3], BRET[2]); ux, uz = math.cos(ax), math.sin(ax)
blan_e = next(e for e in ways if "Blan-Lafont" in (e.get("tags", {}).get("name") or "") and "building" in e["tags"])
tour_e = next(e for e in ways if (e.get("tags", {}).get("name") or "").lower() == "la tour d'euratechnologies")
bc = cen(P(blan_e))
if (-uz)*(bc[0]-WC[0]) + ux*(bc[1]-WC[1]) < 0: ux, uz = -ux, -uz
vx, vz = -uz, ux
def G(q): dx, dz = q[0]-WC[0], q[1]-WC[1]; return (round(S*(dx*ux + dz*uz), 2), round(S*(dx*vx + dz*vz), 2))
def Gdir(a): c, s = math.cos(a), math.sin(a); return math.atan2(c*vx + s*vz, c*ux + s*uz)
def dist(q): return math.hypot(q[0]-WC[0], q[1]-WC[1])
def flat(pts): return [v for q in pts for v in q]

# emprise de Wenov, un peu en retrait des rues (trottoirs)
wen = [G(c) for c in corners]
wcx, wcz = cen(wen)
wen_in = [(round(wcx + (x-wcx)*.86, 2), round(wcz + (z-wcz)*.86, 2)) for x, z in wen]
hand = [flat(wen_in)]

# --- bâtiments ---
BLAN_ID = blan_e["id"]
blan = { "pts":flat(G(q) for q in P(blan_e)[:-1]), "ang":round(Gdir(obb(P(blan_e))[0]), 3) }
tp = P(tour_e); ta, tcx, tcz, tL, tD = obb(tp)
blan["tower"] = { "x":G((tcx, tcz))[0], "z":G((tcx, tcz))[1], "ang":round(Gdir(ta), 3), "L":round(tL*S, 2), "D":round(tD*S, 2) }
hand.append(blan["pts"])
wen_m = [tuple(c) for c in corners]
OFFICE_NAMES = ("tour d'euratechnologies", "french tech", "diamant", "terraneo", "black hat", "doge", "triptic", "auditorium", "bâtiment place", "crédit agricole", "rives de l'isle - bâtiment e", "rives de l'isle - bâtiment b", "oscillium")
cands = []
for e in ways:
    t = e.get("tags", {})
    if "building" not in t or e["id"] in (BLAN_ID, tour_e["id"]): continue
    if t.get("building") in ("construction", "roof") or t.get("layer", "0").startswith("-"): continue
    p = P(e)
    if len(p) < 4 or dist(cen(p)) > CORE: continue
    if inside(*cen(p), wen_m): continue                     # morceaux de Wenov présents dans OSM
    q = [p[0]]
    for v in p[1:]:
        if math.dist(v, q[-1]) > .8: q.append(v)
    if len(q) < 4: continue
    if math.dist(q[0], q[-1]) < .8: q = q[:-1]
    A = area(q)
    if A < 12: continue
    cands.append((e, q, A, bbox(q)))
# doublons (bâtiment + partie de bâtiment) : on garde le plus grand
def overlap(p, bp, q, bq, st=1.0):
    x0, z0, x1, z1 = max(bp[0], bq[0]), max(bp[1], bq[1]), min(bp[2], bq[2]), min(bp[3], bq[3])
    if x1 <= x0 or z1 <= z0: return 0
    n = 0; x = x0 + st/2
    while x < x1:
        z = z0 + st/2
        while z < z1:
            if inside(x, z, p) and inside(x, z, q): n += 1
            z += st
        x += st
    return n*st*st
drop = set()
for a in range(len(cands)):
    for b in range(a + 1, len(cands)):
        ba, bb_ = cands[a][3], cands[b][3]
        if ba[2] < bb_[0] or bb_[2] < ba[0] or ba[3] < bb_[1] or bb_[3] < ba[1]: continue
        o = overlap(cands[a][1], ba, cands[b][1], bb_)
        if o > .3*min(cands[a][2], cands[b][2]): drop.add(a if cands[a][2] < cands[b][2] else b)
print("doublons retirés :", len(drop))

# --- BD TOPO (IGN) : emprises du cadastre, étages, hauteur du toit, matériaux (tools/osm/bdtopo_eura.json) ---
# OpenStreetMap garde les bâtiments nommés, les bureaux et les écoles ; ailleurs, la BD TOPO remplace les maisons devinées.
VX = 2.3/(3.1*S)                     # un étage = 2,3 unités dans ce quartier (échelle des modèles faits main de Wenov)
def mat1(code):
    for ch in (code or ""):
        if ch != "0": return ch
    return None
def bd_levels(b):
    h_, e_ = b["h"], b["e"]
    if h_ and h_ > 0:
        lh = max(1, round(h_/3.1)); return min(18, e_ if e_ and abs(e_ - lh) <= 1 else lh)
    return min(18, e_ or 2)
def bd_col(b, r):
    m = mat1(b["mw"])
    if m == "4": return r % 5 if r % 100 < 85 else 5 + r % 7
    if m in ("1", "2"): return (5, 6, 9, 10, 7)[r % 5]
    if m in ("3", "5"): return (11, 7, 8, 6)[r % 4]
    return r % 12
def bd_rec(b, q, A, kind=None, lv=None, col=None):
    r = h(b["id"])
    if not kind:
        kind = "church" if b["n"] in ("Eglise", "Chapelle") else "sport" if b["u"] == "Sportif" else \
               "shed" if b["u"] == "Annexe" or b["l"] or A < 30 or (b["h"] or 9) < 3.5 else "house"
    rt = b["rt"]; roof, rh = 0, 0
    if kind in ("house", "church", "campus") and rt and rt >= 1.2 and not (rt > 7 and A > 400):
        rh = round(min(rt, 6)*S*VX, 2)
        a, cx, cz, L, D = obb(q)
        if A/(L*D) > .8 and D <= 18: roof = [*G((cx, cz)), round(Gdir(a), 3), round(L*S, 2), round(D*S, 2)]
    m = mat1(b["mw"]); style = 1 if (m == "3" or b["n"].startswith("Industriel")) and kind == "house" else 0
    rm = { "1":1, "2":2, "3":3 }.get(mat1(b["mr"]), 0) or (0 if not rh else (1 if r % 10 < 7 else 2))
    rec = { "house":0, "campus":1, "modern":1, "sport":3, "church":4, "shed":6, "office":7 }[kind]
    return [rec, lv or bd_levels(b), bd_col(b, r) if col is None else col, roof, flat(G(v) for v in q), rh, style, rm]
BD = []
for b in json.load(open(ROOT / "tools" / "osm" / "bdtopo_eura.json", encoding="utf-8"))["buildings"]:
    q = [mp({ "lon":c[0], "lat":c[1] }) for c in b["g"]]
    q2 = [q[0]]
    for v in q[1:]:
        if math.dist(v, q2[-1]) > .8: q2.append(v)
    if len(q2) > 1 and math.dist(q2[0], q2[-1]) < .8: q2 = q2[:-1]
    if len(q2) < 3 or area(q2) < 12: continue
    c = cen(q2)
    if dist(c) > CORE or inside(*c, wen_m) or inside(*c, P(blan_e)) or inside(*c, tp): continue          # Wenov, Blan-Lafont : faits main
    BD.append((b, q2, area(q2), c))
keep = [k for k in range(len(cands)) if k not in drop]
pieces, free = {}, []
for bd in BD:
    k = next((k for k in keep if inside(*bd[3], cands[k][1])), None)
    if k is None: free.append(bd)
    else: pieces.setdefault(k, []).append(bd)
print("BD TOPO :", len(BD), "bâtiments, dont", len(free), "absents d'OpenStreetMap")

buildings, pois_src = [], {}
for k, (e, q, A, _) in enumerate(cands):
    if k in drop: continue
    t = e["tags"]; n = (t.get("name") or "").lower(); b = t.get("building", "yes")
    ps = pieces.get(k, [])
    osm_house = not t.get("name") and b not in ("church", "chapel", "office", "commercial", "school", "college", "university") and not any(w in n for w in OFFICE_NAMES)
    if ps and osm_house:
        for bb, bq, bA, _ in ps: buildings.append(bd_rec(bb, bq, bA))
        continue
    lv = t.get("building:levels")
    try: lv = max(1, min(18, int(float(lv))))
    except: lv = None
    if not lv and t.get("height"):
        try: lv = max(1, min(18, round(float(t["height"])/3)))
        except: pass
    if b in ("church", "chapel") or t.get("amenity") == "place_of_worship" or n.startswith("église") or "clocher" in n: kind = "church"
    elif b in ("office", "commercial") or any(w in n for w in OFFICE_NAMES): kind = "office"
    elif b in ("school", "college", "university") or n.startswith(("école", "collège", "lycée")): kind = "campus"
    elif b in ("apartments", "residential", "dormitory") and (lv or 0) >= 4: kind = "modern"
    elif "sport" in n or b == "sports_hall": kind = "sport"
    elif b in ("garage", "garages", "shed", "hut", "carport") or A < 30: kind = "shed"
    elif b == "parking": kind = "modern"
    else: kind = "house"
    r = h(e["id"])
    if lv is None:
        lv = { "house":[2,2,3,2,3][r % 5], "campus":3, "modern":5, "office":5, "sport":2, "church":3, "shed":1 }[kind]
        if b in ("apartments",) and kind == "house": lv = 4
    a, cx, cz, L, D = obb(q)
    roof = 0
    if kind in ("house", "church") and A/(L*D) > .78 and D < 15 and lv <= 3:
        roof = [*G((cx, cz)), round(Gdir(a), 3), round(L*S, 2), round(D*S, 2)]
    col = (r // 7) % 12 if kind == "house" else (r // 7) % 4
    rec = { "house":0, "campus":1, "modern":1, "sport":3, "church":4, "shed":6, "office":7 }[kind]
    if kind == "modern": col = 1                                     # béton clair des immeubles récents
    gp = [G(v) for v in q]
    if ps and not t.get("building:levels"):          # bâtiment nommé : sa hauteur réelle d'après la BD TOPO
        lv = max(bd_levels(x[0]) for x in ps)
    buildings.append([rec, lv, col, roof, flat(gp)])
    if t.get("name"): pois_src[t["name"]] = (len(buildings) - 1, gp, lv)
for bb, bq, bA, _ in free: buildings.append(bd_rec(bb, bq, bA))
print("bâtiments :", len(buildings))

# --- rues ---
WID = { "primary":12, "secondary":10, "tertiary":9, "residential":7.5, "living_street":6, "unclassified":7, "pedestrian":6, "service":4.5, "cycleway":3 }
bpolys = [(c[1], c[3]) for k, c in enumerate(cands) if k not in drop] + [(wen_m, bbox(wen_m))]
roads, walk_nodes, walk_edges, idx = [], [], {}, {}
def node(q):
    k = (round(q[0]*2), round(q[1]*2))
    if k not in idx: idx[k] = len(walk_nodes); walk_nodes.append(G(q))
    return idx[k]
for e in ways:
    t = e.get("tags", {}); hw = t.get("highway")
    if hw not in WID or t.get("tunnel") == "yes" or t.get("layer", "0").startswith("-"): continue
    p = P(e)
    keep = [q for q in p if dist(q) < CORE + 30]
    if len(keep) < 2: continue
    w = WID[hw]
    code = 1 if hw in ("pedestrian", "living_street") else 0
    dense = [keep[0]]
    for a_, b_ in zip(keep, keep[1:]):
        m = max(1, int(math.dist(a_, b_)))
        dense += [(a_[0] + (b_[0]-a_[0])*k/m, a_[1] + (b_[1]-a_[1])*k/m) for k in range(1, m + 1)]
    blocked = [any(bb[0] <= x <= bb[2] and bb[1] <= z <= bb[3] and inside(x, z, bp) for bp, bb in bpolys) for x, z in dense]
    runs, cur = [], []
    for v, bl in zip(dense, blocked):
        if bl:
            if len(cur) >= 2: runs.append(cur)
            cur = []
        else: cur.append(v)
    if len(cur) >= 2: runs.append(cur)
    for run in runs:
        pts = [run[0]] + [v for k, v in enumerate(run[1:-1], 1) if k % 6 == 0] + [run[-1]]
        roads.append([round(w*S, 2), code, flat(G(q) for q in pts)])
    if hw not in ("service", "cycleway"):
        ks = [q for q in p if dist(q) < CORE - 40]
        for a_, b_ in zip(ks, ks[1:]):
            i, j = node(a_), node(b_)
            if i != j: walk_edges[(min(i, j), max(i, j))] = round(w*S, 2)
adj = {}
for (i, j) in walk_edges: adj.setdefault(i, []).append(j); adj.setdefault(j, []).append(i)
seen, best = set(), []
for s0 in adj:
    if s0 in seen: continue
    comp, st = [], [s0]; seen.add(s0)
    while st:
        u = st.pop(); comp.append(u)
        for v in adj[u]:
            if v not in seen: seen.add(v); st.append(v)
    if len(comp) > len(best): best = comp
keepn = sorted(best); remap = { o:i for i, o in enumerate(keepn) }
walk = { "n":flat(walk_nodes[o] for o in keepn), "e":[v for (i, j), w in walk_edges.items() if i in remap and j in remap for v in (remap[i], remap[j], w)] }

# --- espaces verts, eau, arbres ---
greens, named_greens = [], {}
for e in ways:
    t = e.get("tags", {})
    if "building" in t or "highway" in t: continue
    kind = t.get("leisure") or t.get("landuse") or t.get("natural")
    if kind not in ("park", "garden", "pitch", "grass", "playground", "recreation_ground", "wood", "scrub", "meadow", "forest"): continue
    p = P(e)
    if len(p) < 4 or dist(cen(p)) > CORE + 60: continue
    code = 1 if kind == "pitch" else 2 if kind in ("wood", "forest", "scrub") else 0
    greens.append([code, flat(G(q) for q in p[:-1])])
    if t.get("name"): named_greens[t["name"]] = G(cen(p))
water = []
for e in E:
    t = e.get("tags", {})
    if t.get("natural") != "water": continue
    if e["type"] == "way" and "geometry" in e:
        p = P(e)
        if len(p) >= 4 and math.dist(p[0], p[-1]) < 1: water.append(flat(G(q) for q in p[:-1]))
    elif e["type"] == "relation":
        for m in e.get("members", []):
            if m.get("role") == "outer" and m.get("geometry"):
                p = [mp(q) for q in m["geometry"]]
                if len(p) >= 4: water.append(flat(G(q) for q in p[:-1]))
water = [w for w in water if min(math.hypot(w[i], w[i+1]) for i in range(0, len(w), 2)) < (CORE + 200)*S]
trees = flat(G(mp(n)) for n in E if n["type"] == "node" and n.get("tags", {}).get("natural") == "tree" and dist(mp(n)) < CORE)

# --- lieux à épingler (positions réelles) ---
def poi_b(name):
    for k, v in pois_src.items():
        if name.lower() in k.lower():
            i, gp, lv = v; c = cen(gp); return { "i":i, "x":round(c[0], 2), "z":round(c[1], 2), "lv":lv }
    return None
def node_named(name, key=None):
    for n in E:
        t = n.get("tags", {})
        if n["type"] == "node" and name.lower() in (t.get("name") or "").lower() and (not key or key in t):
            g = G(mp(n)); return { "x":g[0], "z":g[1] }
    return None
metro = node_named("Canteleu", "railway")
exits = [G(mp(n)) for n in E if n["type"] == "node" and n.get("tags", {}).get("railway") == "subway_entrance" and metro and math.dist(G(mp(n)), (metro["x"], metro["z"])) < 12]
POIS = {
    "frenchtech": poi_b("French Tech"), "factory": poi_b("Student Factory"),
    "diamant": poi_b("Le Diamant"), "parking": poi_b("Parking Euratechnologies"), "rives": poi_b("Rives de l'Isle - Bâtiment C"),
}
SPOTS = {
    "edn": node_named("École du numérique"), "hiptown": node_named("Hiptown Euratech"), "marta": node_named("Marta"),
    "gongettes": node_named("Gong'ettes"), "vlille": node_named("Euratechnologies", "amenity"),
    "metro": metro and { **metro, "exits":[list(e) for e in exits] },
    "jardinblan": named_greens.get("Jardin Le Blan - Lafont") and dict(zip(("x", "z"), named_greens["Jardin Le Blan - Lafont"])),
    "ada": named_greens.get("Square Ada Lovelace") and dict(zip(("x", "z"), named_greens["Square Ada Lovelace"])),
    "katherine": named_greens.get("Square Katherine Johnson") and dict(zip(("x", "z"), named_greens["Square Katherine Johnson"])),
    "hedy": named_greens.get("Jardin Hedy Lamarr") and dict(zip(("x", "z"), named_greens["Jardin Hedy Lamarr"])),
}
out = {
    "S":S, "wenov":{ "pts":flat(wen_in), "street":flat(wen) }, "blan":blan, "hand":hand, "buildings":buildings, "roads":roads,
    "greens":greens, "trees":trees, "walk":walk, "canals":[], "water":water, "parks":[], "pois":POIS, "spots":SPOTS
}
js = ("/* Généré par tools/build_eura.py — ne pas modifier à la main.\n"
      "   Quartier Euratechnologies (Bois-Blancs, Lille). Données © les contributeurs d'OpenStreetMap (ODbL). */\n"
      "export const EMAP = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
(ROOT / "js" / "euramap.js").write_text(js, encoding="utf-8")
print(f"bâtiments {len(buildings)}  rues {len(roads)}  verts {len(greens)}  eau {len(water)}  arbres {len(trees)//2}  marche {len(walk['n'])//2} nœuds  taille {round(len(js)/1024)} Ko")
print("Wenov", out["wenov"]["pts"]); print("Blan", blan["pts"][:4], blan["ang"])
print("POIS", {k:(v and (v['x'], v['z'])) for k, v in POIS.items()}); print("SPOTS", {k:(v and (v['x'], v['z'])) for k, v in SPOTS.items()})
