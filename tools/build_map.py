#!/usr/bin/env python3
"""
Construit js/vauban.js à partir des extraits OpenStreetMap de tools/osm/.

  osm2.json : bâtiments, rues, espaces verts du quartier Vauban
  osm3.json : arbres d'alignement
  osm5.json : Deûle, Jardin Vauban, Bois de Boulogne, Euratechnologies

Projection : mètres autour de l'Hôtel Académique, rotation pour mettre le
boulevard Vauban à l'horizontale (la cour d'honneur face à la caméra),
échelle S. Au-delà de R0 mètres, les distances sont compressées (FAR) pour
garder la Citadelle et Euratechnologies à portée de vue.

Données © les contributeurs d'OpenStreetMap (ODbL).
Usage : python tools/build_map.py
"""
import json, math, hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OSM = ROOT / "tools" / "osm"
LAT0, LON0 = 50.63266, 3.04639
K = math.cos(math.radians(LAT0)) * 111320
S, R0, FAR, OZ = 0.4, 330.0, 0.33, -4.0
CORE = 345.0          # rayon (m) des bâtiments et rues dessinés

def mp(p): return ((p["lon"] - LON0) * K, -(p["lat"] - LAT0) * 110540)
def load(n): return json.load(open(OSM / n, encoding="utf-8"))["elements"]
def h(i, n=1000): return int(hashlib.md5(str(i).encode()).hexdigest(), 16) % n
def area(p): return abs(sum(p[i][0]*p[i-1][1] - p[i-1][0]*p[i][1] for i in range(len(p)))) / 2
def cen(p): return (sum(x for x, _ in p)/len(p), sum(z for _, z in p)/len(p))

def obb(p):
    best = None
    for i in range(len(p) - 1):
        a = math.atan2(p[i+1][1]-p[i][1], p[i+1][0]-p[i][0])
        r = extents(p, a)
        if best is None or r[2]*r[3] < best[2]*best[3]: best = (a,) + r[:2] + r[2:]
    return best   # (angle, cx, cz, long, short) ; long le long de l'angle
def extents(p, a):
    c, s = math.cos(a), math.sin(a)
    us = [x*c + z*s for x, z in p]; vs = [-x*s + z*c for x, z in p]
    cu, cv = (max(us)+min(us))/2, (max(vs)+min(vs))/2
    return (cu*c - cv*s, cu*s + cv*c, max(us)-min(us), max(vs)-min(vs))

core = load("osm2.json"); trees_n = load("osm3.json"); far = load("osm5.json")
byid = {e["id"]: e for e in core}
P = lambda e: [mp(q) for q in e["geometry"]]

# --- repère : boulevard Vauban -> axe x ; Hôtel Académique -> -z ---
bv = [mp(q) for e in core if e["tags"].get("name") == "Boulevard Vauban" for q in e["geometry"]]
bv = [q for q in bv if -320 < q[1] < 240 and -300 < q[0] < 400]
mx, mz = cen(bv)
sxx = sum((x-mx)**2 for x, _ in bv); szz = sum((z-mz)**2 for _, z in bv); sxz = sum((x-mx)*(z-mz) for x, z in bv)
ang = 0.5 * math.atan2(2*sxz, sxx - szz)
ux, uz = math.cos(ang), math.sin(ang)

HA_IDS, CHAPEL_ID, COURT_ID = [41470264], 132909342, 308253887
FALISE_IDS = [832959069]          # 13 rue de Toul (la rotonde)
RIZOMM_ID = 832959068               # 41 rue du Port
ha_pts = [q for i in HA_IDS + [CHAPEL_ID] for q in P(byid[i])]
a_ha = obb(P(byid[41470264]))[0]
hc = extents(ha_pts, a_ha)
HAC = (hc[0], hc[1])
if (-uz)*(mx-HAC[0]) + ux*(mz-HAC[1]) < 0: ux, uz = -ux, -uz
vx, vz = -uz, ux

def G(q, compress=True):
    dx, dz = q[0]-HAC[0], q[1]-HAC[1]
    d = math.hypot(dx, dz)
    if compress and d > R0:
        f = (R0 + (d-R0)*FAR) / d; dx *= f; dz *= f
    return (round(S*(dx*ux + dz*uz), 2), round(S*(dx*vx + dz*vz) + OZ, 2))
def Gdir(a):
    c, s = math.cos(a), math.sin(a)
    return math.atan2(c*vx + s*vz, c*ux + s*uz)
def dist(q): return math.hypot(q[0]-HAC[0], q[1]-HAC[1])
def flat(pts): return [v for q in pts for v in q]

# --- bâtiments « héros » (modèles faits main) ---
def hero(pts, a, ref=None):
    cx, cz, L, D = extents(pts, a)
    al = Gdir(a)
    if al > math.pi/2: al -= math.pi
    if al < -math.pi/2: al += math.pi
    g = G((cx, cz))
    return { "x":g[0], "z":g[1], "ang":round(al,4), "L":round(L*S,2), "D":round(D*S,2) }
def local(hs, q):
    g = G(q); dx, dz = g[0]-hs["x"], g[1]-hs["z"]; a = hs["ang"]
    return (dx*math.cos(a) + dz*math.sin(a), -dx*math.sin(a) + dz*math.cos(a))
HA = hero(ha_pts, a_ha)
court = local(HA, cen(P(byid[COURT_ID])))
if court[1] < 0: HA["ang"] = round(HA["ang"] + math.pi, 4); court = local(HA, cen(P(byid[COURT_ID])))
HA["chapelSide"] = 1 if local(HA, cen(P(byid[CHAPEL_ID])))[0] > 0 else -1

fal_pts = [q for i in FALISE_IDS for q in P(byid[i])]
FAL = hero(fal_pts, obb(P(byid[FALISE_IDS[0]]))[0])
if FAL["L"] < FAL["D"]: FAL["ang"] = round(FAL["ang"] + math.pi/2, 4); FAL["L"], FAL["D"] = FAL["D"], FAL["L"]
rot = []
for i in FALISE_IDS:
    p = P(byid[i])
    for k in range(1, len(p)-1):
        if math.dist(p[k], p[k-1]) < 3 and math.dist(p[k], p[k+1]) < 3: rot.append(p[k])
if rot:
    lx, lz = local(FAL, cen(rot))
    if abs(lx)/FAL["L"] > abs(lz)/FAL["D"]: FAL["rotunda"] = ["+x" if lx > 0 else "-x", round(lz, 2)]
    else: FAL["rotunda"] = ["+z" if lz > 0 else "-z", round(lx, 2)]

# --- bâtiments génériques ---
NAMED = {}
KW_CAMPUS = ("junia", "isa ", "hei ", "faculté", "campus", "esme", "ieseg", "institut", "colson", "schuman", "albert le grand", "all ", "restaurant universitaire", "maison de l'étudiant", "classes prépa")
BRICK = 5; PAINT = 7
buildings, pois_src = [], {}
skip = set(HA_IDS + [CHAPEL_ID] + FALISE_IDS)
def inside(x, z, p):
    c = False; j = len(p) - 1
    for i in range(len(p)):
        (xi, zi), (xj, zj) = p[i], p[j]
        if (zi > z) != (zj > z) and x < (xj - xi)*(z - zi)/(zj - zi) + xi: c = not c
        j = i
    return c
def bbox(p): xs = [v[0] for v in p]; zs = [v[1] for v in p]; return (min(xs), min(zs), max(xs), max(zs))
def overlap(p, bp, q, bq, st=.5):
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
cands = []
for e in core:
    t = e["tags"]
    if "building" not in t or e["id"] in skip: continue
    p = P(e)
    if len(p) < 4 or dist(cen(p)) > CORE: continue
    q = [p[0]]
    for v in p[1:]:
        if math.dist(v, q[-1]) > .8: q.append(v)
    if len(q) < 4: continue
    if q[0] == q[-1] or math.dist(q[0], q[-1]) < .8: q = q[:-1]
    A = area(q)
    if A < 12: continue
    cands.append((e, q, A, bbox(q)))
# OpenStreetMap contient parfois le même bâtiment deux fois (bâtiment + « partie de bâtiment ») :
# si deux emprises se recouvrent à plus de 30 % de la plus petite, on ne garde que la plus grande.
drop = set()
for a in range(len(cands)):
    for b in range(a + 1, len(cands)):
        ea, qa, Aa, ba = cands[a]; eb, qb, Ab, bb = cands[b]
        o = overlap(qa, ba, qb, bb)
        if o > .3*min(Aa, Ab): drop.add(a if Aa < Ab else b)
print("bâtiments en double retirés :", len(drop))
bpolys = [(c[1], c[3]) for k, c in enumerate(cands) if k not in drop] + [(P(byid[i]), bbox(P(byid[i]))) for i in skip if i in byid]
for k, (e, q, A, _) in enumerate(cands):
    if k in drop: continue
    t = e["tags"]
    n = (t.get("name") or "").lower(); b = t.get("building", "yes")
    if "rameau" in n: kind = "glass"
    elif b in ("church", "chapel", "cathedral") or t.get("amenity") == "place_of_worship": kind = "church"
    elif t.get("leisure") == "sports_centre" or "omnisports" in n: kind = "sport"
    elif b == "dormitory" or "résidence" in n: kind = "dorm"
    elif b in ("university", "college", "school") or any(k in n for k in KW_CAMPUS): kind = "campus"
    elif b in ("garage", "garages", "shed", "roof", "carport", "hut") or A < 30: kind = "shed"
    else: kind = "house"
    lv = t.get("building:levels")
    try: lv = max(1, min(14, int(float(lv))))
    except: lv = None
    r = h(e["id"])
    if lv is None:
        lv = { "house":[2,3,3,3,4][r % 5], "campus":4, "dorm":5, "sport":2, "church":3, "glass":2, "shed":1 }[kind]
        if b in ("apartments", "commercial", "office") and kind == "house": lv = 5
    a, cx, cz, L, D = obb(q)
    roof = 0
    if kind in ("house", "church") and A/(L*D) > .78 and D < 17:
        al = Gdir(a); g = G((cx, cz))
        roof = [g[0], g[1], round(al, 3), round(L*S, 2), round(D*S, 2)]
    col = (r // 7) % (BRICK + PAINT) if kind in ("house", "dorm") else (r // 7) % 3
    gp = [G(v) for v in q]
    if area(gp) < 0: pass
    rec = { "house":0, "campus":1, "dorm":2, "sport":3, "church":4, "glass":5, "shed":6 }[kind]
    buildings.append([rec, lv, col, roof, flat(gp)])
    if t.get("name"): pois_src[t["name"]] = (len(buildings)-1, gp, lv)

# --- rues ---
WID = { "primary":12, "secondary":10, "tertiary":9, "residential":7.5, "living_street":6, "unclassified":7, "pedestrian":6, "service":4.5 }
roads = []
walk_nodes, walk_edges, idx = [], {}, {}
def node(q):
    k = (round(q[0]*2), round(q[1]*2))
    if k not in idx: idx[k] = len(walk_nodes); walk_nodes.append(G(q))
    return idx[k]
for e in core:
    t = e["tags"]; hw = t.get("highway")
    if hw not in WID: continue
    p = P(e)
    keep = [q for q in p if dist(q) < CORE + 30]
    if len(keep) < 2: continue
    w = WID[hw]
    code = 2 if t.get("name") == "Boulevard Vauban" else (1 if hw in ("pedestrian", "living_street") else 0)
    # une rue ne passe jamais à travers un bâtiment (passages couverts, porches) : on la coupe
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
        # on ne garde que les sommets utiles (tous les ~6 m, plus les extrémités)
        pts = [run[0]] + [v for k, v in enumerate(run[1:-1], 1) if k % 6 == 0] + [run[-1]]
        roads.append([round(w*S, 2), code, flat(G(q) for q in pts)])
    if hw != "service":
        ks = [q for q in p if dist(q) < 300]
        for a_, b_ in zip(ks, ks[1:]):
            i, j = node(a_), node(b_)
            if i != j: walk_edges[(min(i,j), max(i,j))] = round(w*S, 2)
# plus grande composante connexe
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
walk = { "n": flat(walk_nodes[o] for o in keepn), "e": [v for (i,j), w in walk_edges.items() if i in remap and j in remap for v in (remap[i], remap[j], w)] }

# --- espaces verts ---
greens = []
for e in core:
    t = e["tags"]
    if "building" in t or "highway" in t: continue
    kind = t.get("leisure") or t.get("landuse")
    if kind not in ("park", "garden", "pitch", "grass", "playground"): continue
    p = P(e)
    if len(p) < 4 or dist(cen(p)) > CORE: continue
    code = 2 if e["id"] == 95069542 else (1 if kind == "pitch" else 0)
    greens.append([code, flat(G(q) for q in p[:-1] if True)])

# --- arbres ---
trees = flat(G(mp(n)) for n in trees_n if n["type"] == "node" and dist(mp(n)) < CORE)

# --- lointain : Deûle, parcs, Citadelle, Euratechnologies ---
canals, parks, blan = [], [], None
for e in far:
    t = e["tags"]; p = P(e)
    if t.get("waterway") == "canal": canals.append(flat(G(q) for q in p))
    elif t.get("name") in ("Jardin Vauban", "Bois de Boulogne"): parks.append([t["name"], flat(G(q) for q in p[:-1])])
    elif "Blan-Lafont" in (t.get("name") or ""): blan = { "pts":flat(G(q) for q in p[:-1]), "ang":round(Gdir(obb(p)[0]),3) }
cit = G((-135, -947))

def poi(name):
    for k, v in pois_src.items():
        if name.lower() in k.lower():
            i, gp, lv = v
            c = cen(gp)
            return { "i":i, "x":round(c[0],2), "z":round(c[1],2), "lv":lv }
    return None
POIS = {
    "bu": poi("Robert Schuman"), "resto": poi("Restaurant universitaire"), "all": poi("All - Univ"),
    "maison": poi("maison de l'étudiant"), "sport": poi("omnisports"), "rameau": poi("Palais Rameau"),
    "residence": poi("Résidence Saint-Michel"), "rizomm": poi("Faculté de Gestion"), "isa": poi("ISA Lille"), "raphael": poi("Institut des stratégies")
}
jb = next((g for g in greens if g[0] == 2), None)
if jb: POIS["jardin"] = { "x":round(sum(jb[1][0::2])/(len(jb[1])/2),2), "z":round(sum(jb[1][1::2])/(len(jb[1])/2),2), "lv":0 }

out = {
    "S":S, "ha":HA, "falise":FAL, "court":[round(c,2) for c in court], "buildings":buildings, "roads":roads, "greens":greens,
    "trees":trees, "walk":walk, "canals":canals, "parks":parks, "blan":blan, "citadelle":cit, "pois":POIS
}
js = ("/* Généré par tools/build_map.py — ne pas modifier à la main.\n"
      "   Données © les contributeurs d'OpenStreetMap (ODbL). */\n"
      "export const MAP = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
(ROOT / "js" / "vauban.js").write_text(js, encoding="utf-8")
print(f"bâtiments {len(buildings)}  rues {len(roads)}  verts {len(greens)}  arbres {len(trees)//2}  marche {len(walk['n'])//2} nœuds")
print("HA", HA, "cour", out["court"]); print("Falise", FAL)
print("POIs", {k:(v and (v['x'], v['z'])) for k, v in POIS.items()})
print("Citadelle", cit, "Blan", blan and blan["pts"][:2], "taille", round(len(js)/1024), "Ko")
