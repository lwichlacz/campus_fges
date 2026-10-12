#!/usr/bin/env python3
"""
Construit js/vauban.js à partir des extraits OpenStreetMap de tools/osm/.

  osm2.json : bâtiments, rues, espaces verts du quartier Vauban
  osm3.json : arbres d'alignement
  osm5.json : Deûle, Jardin Vauban, Bois de Boulogne, Euratechnologies
  osm_ext.json : quartier entre le campus et les deux stations de métro
  bdtopo.json : bâtiments de la BD TOPO de l'IGN (emprises, hauteurs, toits, matériaux, années)
  ortho_zone.jpg, ortho_large.jpg : photo aérienne de l'IGN (couleur des toits, sol, arbres)

Projection : mètres autour de l'Hôtel Académique, rotation pour mettre le
boulevard Vauban à l'horizontale (la cour d'honneur face à la caméra),
échelle S. Au-delà de R0 mètres, les distances sont compressées (FAR) pour
garder la Citadelle et Euratechnologies à portée de vue.

Données © les contributeurs d'OpenStreetMap (ODbL) ; © IGN, BD TOPO et BD ORTHO (Licence Ouverte Etalab 2.0).
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
# osm_ext.json : bâtiments, rues, verts et arbres entre le campus et les deux stations de métro (Overpass)
_ext = load("osm_ext.json") if (OSM / "osm_ext.json").exists() else []
_ids = {e["id"] for e in core}
core = core + [e for e in _ext if e["type"] == "way" and "geometry" in e and e["id"] not in _ids and e.get("tags")]
_tids = {e["id"] for e in trees_n}
trees_n = trees_n + [e for e in _ext if e["type"] == "node" and e.get("tags", {}).get("natural") == "tree" and e["id"] not in _tids]
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
# le cœur du campus garde l'extrait d'origine (osm2) ; osm_ext ne complète que l'extérieur du cercle CORE
core = [e for e in core if e["id"] in _ids or math.dist(cen(P(e)), HAC) > CORE]
byid = {e["id"]: e for e in core}

# --- zone dessinée à l'échelle réelle : le cœur du campus et le chemin jusqu'aux deux stations de la ligne 2 ---
# C'est l'enveloppe convexe du cercle du campus (CORE) et d'un cercle autour de chaque station : le quartier
# est continu de l'Hôtel Académique aux bouches de métro. Au-delà, le lointain est compressé (FAR) comme avant.
STATIONS_SRC = [("cormontaigne", "Cormontaigne", 50.6262337, 3.0402863), ("portdelille", "Port de Lille", 50.6299287, 3.0357396)]
R_ST = 120.0
def hull(pts):
    pts = sorted(set(pts))
    def cross(o, a, b): return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
    lo, hi = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(hi) >= 2 and cross(hi[-2], hi[-1], p) <= 0: hi.pop()
        hi.append(p)
    return lo[:-1] + hi[:-1]
_circ = [(HAC, CORE)] + [(mp({ "lat":la, "lon":lo }), R_ST) for _, _, la, lo in STATIONS_SRC]
ZONE = hull([(round(c[0] + r*math.cos(k/48*math.tau), 3), round(c[1] + r*math.sin(k/48*math.tau), 3)) for c, r in _circ for k in range(48)])
def zone_r(a):
    """rayon de la zone (m) depuis l'Hôtel Académique dans la direction a"""
    dx, dz = math.cos(a), math.sin(a); best = CORE
    for i in range(len(ZONE)):
        (x1, z1), (x2, z2) = ZONE[i], ZONE[(i+1) % len(ZONE)]
        ax, az, bx, bz = x1-HAC[0], z1-HAC[1], x2-HAC[0], z2-HAC[1]
        den = dx*(bz-az) - dz*(bx-ax)
        if abs(den) < 1e-9: continue
        t = (ax*(bz-az) - az*(bx-ax)) / den; s = (ax*dz - az*dx) / den
        if t > 0 and -1e-9 <= s <= 1 + 1e-9: best = max(best, t)
    return best
_ZR = [zone_r(k/720*math.tau) for k in range(720)]
def zr(dx, dz):
    a = math.atan2(dz, dx) % math.tau; f = a/math.tau*720; i = int(f) % 720
    return _ZR[i] + (_ZR[(i+1) % 720] - _ZR[i])*(f - int(f))
def in_zone(q, m=0):
    dx, dz = q[0]-HAC[0], q[1]-HAC[1]
    return math.hypot(dx, dz) < zr(dx, dz) + m

def G(q, compress=True):
    dx, dz = q[0]-HAC[0], q[1]-HAC[1]
    d = math.hypot(dx, dz)
    R0d = zr(dx, dz) - (CORE - R0) if d > 1e-6 else R0
    if compress and d > R0d:
        f = (R0d + (d-R0d)*FAR) / d; dx *= f; dz *= f
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
    if len(p) < 4 or not in_zone(cen(p), -4): continue
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
CELL = 25.0
def cells(bb): return [(i, j) for i in range(int(bb[0]//CELL), int(bb[2]//CELL) + 1) for j in range(int(bb[1]//CELL), int(bb[3]//CELL) + 1)]
cgrid = {}
for k, c in enumerate(cands):
    for cl in cells(c[3]): cgrid.setdefault(cl, []).append(k)
pairs = set()
for lst in cgrid.values():
    for x in range(len(lst)):
        for y in range(x + 1, len(lst)): pairs.add((lst[x], lst[y]))
for a, b in sorted(pairs):
    ea, qa, Aa, ba = cands[a]; eb, qb, Ab, bb = cands[b]
    o = overlap(qa, ba, qb, bb)
    if o > .3*min(Aa, Ab): drop.add(a if Aa < Ab else b)
print("bâtiments en double retirés :", len(drop))
bpolys = [(c[1], c[3]) for k, c in enumerate(cands) if k not in drop] + [(P(byid[i]), bbox(P(byid[i]))) for i in skip if i in byid]
bgrid = {}
for k, (bp, bb) in enumerate(bpolys):
    for cl in cells(bb): bgrid.setdefault(cl, []).append(k)
def osm_kind(e, A):
    t = e["tags"]
    n = (t.get("name") or "").lower(); b = t.get("building", "yes")
    if "rameau" in n: return "glass"
    if b in ("church", "chapel", "cathedral") or t.get("amenity") == "place_of_worship": return "church"
    if t.get("leisure") == "sports_centre" or "omnisports" in n: return "sport"
    if b == "dormitory" or "résidence" in n: return "dorm"
    if b in ("university", "college", "school") or any(k in n for k in KW_CAMPUS): return "campus"
    if b in ("garage", "garages", "shed", "roof", "carport", "hut") or A < 30: return "shed"
    return "house"
KIND = { "house":0, "campus":1, "dorm":2, "sport":3, "church":4, "glass":5, "shed":6 }

# --- BD TOPO (IGN) : emprises du cadastre, hauteurs mesurées, hauteur du toit, matériaux, date de construction ---
# OpenStreetMap garde les bâtiments du campus (noms, usages) ; partout ailleurs, la BD TOPO est plus complète et plus juste.
def simp(p):
    q = [p[0]]
    for v in p[1:]:
        if math.dist(v, q[-1]) > .8: q.append(v)
    if len(q) > 1 and math.dist(q[0], q[-1]) < .8: q = q[:-1]
    return q
def mat1(code):
    """matériau principal d'un code des fichiers fonciers (« 40 » : briques ; « 04 » : briques en second)"""
    for ch in (code or ""):
        if ch != "0": return ch
    return None
BDT = []
for b in json.load(open(OSM / "bdtopo.json", encoding="utf-8"))["buildings"]:
    q = simp([mp({ "lon":c[0], "lat":c[1] }) for c in b["g"]])
    if len(q) < 3: continue
    A = area(q)
    if A < 12: continue
    BDT.append((b, q, A, bbox(q), cen(q)))
print("BD TOPO :", len(BDT), "bâtiments")

# axes des rues : le faîtage d'un toit à deux pentes est parallèle à la rue la plus proche (maisons lilloises en bande)
SEG = {}
for e in core:
    if e["tags"].get("highway") not in ("primary","secondary","tertiary","residential","living_street","unclassified","pedestrian"): continue
    p = P(e)
    for a_, b_ in zip(p, p[1:]):
        for cl in cells(bbox([a_, b_])): SEG.setdefault(cl, []).append((a_, b_))
def seg_d(x, z, a_, b_):
    dx, dz = b_[0]-a_[0], b_[1]-a_[1]; l2 = dx*dx + dz*dz or 1
    k = max(0, min(1, ((x-a_[0])*dx + (z-a_[1])*dz)/l2))
    return math.hypot(x - a_[0] - k*dx, z - a_[1] - k*dz)
def street_dir(x, z):
    best, ang = 28.0, None
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            for a_, b_ in SEG.get((int(x//CELL) + i, int(z//CELL) + j), ()):
                d = seg_d(x, z, a_, b_)
                if d < best: best, ang = d, math.atan2(b_[1]-a_[1], b_[0]-a_[0])
    return ang

# Échelle verticale : celle de l'Hôtel Académique fait main (19,3 m à la gouttière d'après la BD TOPO, 3 × 3,4 = 10,2 unités),
# pour que deux bâtiments de même hauteur réelle aient la même hauteur dans le jeu.
VX = 10.2/(19.3*S)
FH_MAP = round(3.1*S*VX, 2)          # hauteur d'un étage (3,1 m) en unités du jeu
def bd_levels(b):
    h_, e_ = b["h"], b["e"]
    if h_ and h_ > 0:
        lh = max(1, round(h_/3.1))
        return min(14, e_ if e_ and abs(e_ - lh) <= 1 else lh)
    return min(14, e_ or 2)
def bd_style(b):
    """façade : 0 brique et pierre d'avant-guerre, 1 immeuble des années 1950-1980, 2 bâtiment récent"""
    y = int(b["y"]) if b["y"] else None; m = mat1(b["mw"])
    if y is None: return 1 if m == "3" else 0
    return 0 if y < 1945 else (1 if y < 1990 else 2)
def bd_col(b, r):
    """teinte du mur (index de HOUSE_WALLS) d'après le matériau réel"""
    m = mat1(b["mw"]); era = bd_style(b)
    if m == "4": return r % 5 if r % 100 < 85 else 5 + r % 7          # brique (quelques façades enduites)
    if m in ("1", "2"): return (5, 6, 9, 10, 7)[r % 5]                  # pierre
    if m in ("3", "5"): return (11, 7, 8, 6)[r % 4]                     # béton, aggloméré
    return r % 5 if era == 0 and r % 100 < 70 else 5 + r % 7
def bd_rmat(b):
    m = mat1(b["mr"]); return { "1":1, "2":2, "3":3 }.get(m, 0)        # tuiles, ardoises, zinc
def roof_of(q, A, rt, kind):
    """toit réel : plat (terrasse), à deux pentes (faîtage parallèle à la rue) ou à pans brisés sur les formes irrégulières.
       Renvoie (gable, rh) : gable = [cx, cz, ang, L, D] ou 0 ; rh = hauteur du toit en unités du jeu (0 : toit plat)."""
    if kind in ("shed", "glass", "sport") or rt is None or rt < 1.2 or (rt > 7 and A > 400): return 0, 0
    rh = round(min(rt, 6)*S*VX, 2)
    a, cx, cz, L, D = obb(q)
    sd = street_dir(cx, cz)
    if sd is not None and abs(math.sin(a - sd)) > math.sin(math.pi/4): a += math.pi/2
    if A/(L*D) > .8:
        cx, cz, L, D = extents(q, a)
        if D <= 18:
            g = G((cx, cz))
            return [g[0], g[1], round(Gdir(a), 3), round(L*S, 2), round(D*S, 2)], rh
    if kind == "house" and sd is not None:
        # maison lilloise : corps de bâtiment sur rue (deux pentes) et extension à l'arrière (toit plat, déjà couvert par la dalle)
        body = front_body(q, a)
        if body:
            bcx, bcz, bL, bD = body
            if bD <= 16 and bL*bD >= .4*A:
                g = G((bcx, bcz))
                return [g[0], g[1], round(Gdir(a), 3), round(bL*S, 2), round(bD*S, 2)], rh
    return 0, rh
def front_body(q, a):
    """plus grand rectangle d'un seul tenant, collé à la façade sur rue, dans l'emprise (axe a : le long de la rue)"""
    c, s = math.cos(a), math.sin(a)
    pts = [(x*c + z*s, -x*s + z*c) for x, z in q]
    cxz = cen(q); cu, cv = cxz[0]*c + cxz[1]*s, -cxz[0]*s + cxz[1]*c
    # côté de la rue : la rue la plus proche est-elle vers v croissant ou décroissant ?
    best, side = 1e9, 1
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            for a_, b_ in SEG.get((int(cxz[0]//CELL) + i, int(cxz[1]//CELL) + j), ()):
                d = seg_d(cxz[0], cxz[1], a_, b_)
                if d < best:
                    dx, dz = b_[0]-a_[0], b_[1]-a_[1]; l2 = dx*dx + dz*dz or 1
                    k = max(0, min(1, ((cxz[0]-a_[0])*dx + (cxz[1]-a_[1])*dz)/l2))
                    px, pz = a_[0] + k*dx, a_[1] + k*dz
                    best, side = d, (1 if -px*s + pz*c > cv else -1)
    vs = [v for _, v in pts]; v0 = max(vs) if side > 0 else min(vs)
    def row(v):
        xs = []
        for i in range(len(pts)):
            (u1, w1), (u2, w2) = pts[i], pts[(i+1) % len(pts)]
            if (w1 > v) != (w2 > v): xs.append(u1 + (v - w1)*(u2 - u1)/(w2 - w1))
        xs.sort(); seg = [(xs[k], xs[k+1]) for k in range(0, len(xs) - 1, 2)]
        return max(seg, key=lambda t: t[1] - t[0]) if seg else None
    lo, hi, depth, step = -1e9, 1e9, 0.0, .5
    while depth < max(vs) - min(vs):
        r_ = row(v0 - side*(depth + step/2))
        if not r_: break
        nlo, nhi = max(lo, r_[0]), min(hi, r_[1])
        if depth > 0 and (nhi - nlo) < .85*(hi - lo): break
        lo, hi = nlo, nhi; depth += step
    if depth < 4 or hi - lo < 3: return None
    vm = v0 - side*depth/2; um = (lo + hi)/2
    return (um*c - vm*s, um*s + vm*c, hi - lo, depth)

# --- photo aérienne de l'IGN (ortho_zone.jpg) : couleur réelle de chaque toit, et sol (jardins ou cours pavées) ---
# Décodée par sips (macOS) ; sans elle, les toits gardent la teinte de leur matériau et le sol reste en herbe.
# ortho_zone.jpg : la zone réelle (50 cm par pixel) ; ortho_large.jpg : les environs (2,5 m par pixel), pour les bois lointains
def load_ortho(name, box):
    import subprocess, tempfile, struct
    src = OSM / name
    if not src.exists(): return None
    out = Path(tempfile.gettempdir()) / (name + ".bmp")
    try: subprocess.run(["sips", "-s", "format", "bmp", str(src), "--out", str(out)], check=True, capture_output=True)
    except Exception: print("photo aérienne : sips indisponible, ignorée"); return None
    d = out.read_bytes()
    off, w, hh, bpp = struct.unpack_from("<I", d, 10)[0], *struct.unpack_from("<iiH", d, 18)[:2], struct.unpack_from("<H", d, 28)[0]
    if bpp != 24: return None
    return { "d":d, "off":off, "w":w, "h":abs(hh), "up":hh > 0, "row":(w*3 + 3) & ~3, "box":box }
ORT = load_ortho("ortho_zone.jpg", (50.6250, 3.0338, 50.6363, 3.0514))          # lat min, lon min, lat max, lon max
ORT_L = load_ortho("ortho_large.jpg", (50.6150, 3.0150, 50.6500, 3.0700))
def ortho_px(x, z, O=None):
    """couleur (r, g, b) de la photo au point (x, z) en mètres (repère OSM), ou None hors de la photo"""
    O = O or ORT; B = O["box"]
    lat, lon = LAT0 - z/110540, LON0 + x/K
    px = int((lon - B[1])/(B[3] - B[1])*O["w"]); py = int((B[2] - lat)/(B[2] - B[0])*O["h"])
    if not (0 <= px < O["w"] and 0 <= py < O["h"]): return None
    if O["up"]: py = O["h"] - 1 - py
    i = O["off"] + py*O["row"] + px*3; d = O["d"]
    return (d[i+2], d[i+1], d[i])
def canopy(x, z, O, r):
    """(verdure, luminosité) moyennes autour de (x, z) sur un rayon r (m)"""
    e_ = l_ = n_ = 0
    for a_ in (-r, 0, r):
        for b_ in (-r, 0, r):
            c = ortho_px(x + a_, z + b_, O)
            if c: e_ += (2*c[1] - c[0] - c[2])/max(1, sum(c)); l_ += sum(c)/765; n_ += 1
    return (e_/n_, l_/n_) if n_ else (0, 1)
def Ginv(gx, gz):
    """point réel (mètres, repère OSM) d'un point du jeu, en défaisant la compression du lointain"""
    dx, dz = (gx*ux + (gz - OZ)*vx)/S, (gx*uz + (gz - OZ)*vz)/S
    d = math.hypot(dx, dz)
    if d > 1e-6:
        R0d = zr(dx, dz) - (CORE - R0)
        if d > R0d: f = (R0d + (d - R0d)/FAR)/d; dx *= f; dz *= f
    return (HAC[0] + dx, HAC[1] + dz)
def roof_colour(q, pitched):
    """teinte du toit vue d'avion, ramenée à la palette du jeu : 0-7 toits en pente (ROOFS de city.js), 10-13 toits plats ; -1 inconnue"""
    if not ORT: return -1
    import colorsys
    x0, z0, x1, z1 = bbox(q); st = max(.8, math.sqrt((x1-x0)*(z1-z0)/90))
    px_ = []
    x = x0 + st/2
    while x < x1:
        z = z0 + st/2
        while z < z1:
            if inside(x, z, q):
                c = ortho_px(x, z)
                if c: px_.append(c)
            z += st
        x += st
    if len(px_) < 4: return -1
    px_.sort(key=lambda c: sum(c)); px_ = px_[int(len(px_)*.3):int(len(px_)*.95) + 1]          # sans les ombres ni les reflets
    r, g, b = (sum(c[k] for c in px_)/len(px_)/255 for k in range(3))
    hu, l, s = colorsys.rgb_to_hls(r, g, b)
    if not pitched:
        if g > r + .03 and g > b + .02: return 13             # toit végétalisé
        return 10 if l > .55 else (11 if l > .4 else 12)
    rb = (r - b)*255                                          # la photo est terne : une tuile se repère à son écart rouge-bleu
    if rb >= 9 and r >= g - .01:
        return 5 if rb >= 30 and l > .42 else (4 if rb >= 18 else 2)      # tuiles : orange clair, rouge orangé, brunes
    return 7 if l < .27 else (3 if l < .37 else (0 if l < .47 else (1 if l < .58 else 6)))      # ardoise, zinc

osm_keep = [k for k in range(len(cands)) if k not in drop]
ogrid = {}
for k in osm_keep:
    for cl in cells(cands[k][3]): ogrid.setdefault(cl, []).append(k)
def osm_at(x, z):
    for k in ogrid.get((int(x//CELL), int(z//CELL)), ()):
        bb = cands[k][3]
        if bb[0] <= x <= bb[2] and bb[1] <= z <= bb[3] and inside(x, z, cands[k][1]): return k
    return None
heroes = [(P(byid[i]), bbox(P(byid[i]))) for i in skip if i in byid]
pieces, free_bd, far_bd = {}, [], []
for bd in BDT:
    b, q, A, bb, c = bd
    if not in_zone(c, -4): far_bd.append(bd); continue
    if any(overlap(q, bb, hp, hb) > .3*A for hp, hb in heroes): continue          # modèles faits main
    k = osm_at(*c)
    if k is not None: pieces.setdefault(k, []).append(bd)
    else: free_bd.append(bd)

def add_bd(b, q, A):
    r = h(b["id"])
    if b["n"] in ("Eglise", "Chapelle") or b["u"] == "Religieux": kind = "church"
    elif b["u"] == "Sportif": kind = "sport"
    elif b["u"] == "Annexe" or b["l"] or A < 30 or (b["h"] or 9) < 3.5: kind = "shed"
    else: kind = "house"
    roof, rh = roof_of(q, A, b["rt"], kind)
    style = 1 if b["n"].startswith("Industriel") and kind == "house" else bd_style(b)
    rm = bd_rmat(b) or (0 if not rh else (1 if r % 10 < 7 else 2))      # toit en pente de matériau inconnu : surtout des tuiles à Lille
    buildings.append([KIND[kind], bd_levels(b), bd_col(b, r), roof, flat(G(v) for v in q), rh, style, rm, roof_colour(q, bool(rh)) if kind != "shed" else -1])

n_osm = n_bd = 0
for k in osm_keep:
    e, q, A, _ = cands[k]
    t = e["tags"]; kind = osm_kind(e, A); r = h(e["id"]); ps = pieces.get(k, [])
    special = kind not in ("house", "shed") or t.get("name")
    if ps and not special:
        for b, bq, bA, _, _ in ps: add_bd(b, bq, bA); n_bd += 1
        continue
    n_osm += 1
    gp = [G(v) for v in q]
    col = (r // 7) % (BRICK + PAINT) if kind in ("house", "dorm") else (r // 7) % 3
    if ps:
        # bâtiment du campus : emprise et nom d'OpenStreetMap, hauteurs et matériaux de la BD TOPO (morceau le plus grand)
        big = max(ps, key=lambda x: x[2])[0]
        lv = max(bd_levels(x[0]) for x in ps); rt = max((x[0]["rt"] or 0) for x in ps) or None
        roof, rh = roof_of(q, A, rt, kind)
        if kind in ("house", "dorm"): col = bd_col(big, r)
        buildings.append([KIND[kind], lv, col, roof, flat(gp), rh, bd_style(big), bd_rmat(big), roof_colour(q, bool(rh))])
    else:
        lv = t.get("building:levels")
        try: lv = max(1, min(14, int(float(lv))))
        except: lv = None
        if lv is None:
            lv = { "house":[2,3,3,3,4][r % 5], "campus":4, "dorm":5, "sport":2, "church":3, "glass":2, "shed":1 }[kind]
            if t.get("building") in ("apartments", "commercial", "office") and kind == "house": lv = 5
        a, cx, cz, L, D = obb(q)
        roof = 0
        if kind in ("house", "church") and A/(L*D) > .78 and D < 17:
            g = G((cx, cz)); roof = [g[0], g[1], round(Gdir(a), 3), round(L*S, 2), round(D*S, 2)]
        buildings.append([KIND[kind], lv, col, roof, flat(gp)])
    if t.get("name") and dist(cen(q)) < CORE: pois_src[t["name"]] = (len(buildings)-1, gp, buildings[-1][1])
for b, q, A, _, _ in free_bd: add_bd(b, q, A); n_bd += 1
print(f"bâtiments : {n_osm} d'OpenStreetMap, {n_bd} de la BD TOPO (dont {len(free_bd)} absents d'OpenStreetMap)")

# --- au-delà de la zone réelle : les vrais bâtiments, en miniature (le lointain est compressé) ---
# [x, z, angle, largeur, profondeur, étages, hauteur du toit (0 : plat), teinte du mur, matériau du toit]
far_out = []
for b, q, A, bb, c in far_bd:
    if A < 40 or b["u"] == "Annexe": continue
    g = G(c)
    if math.hypot(g[0], g[1] + 10) > 480: continue
    f = math.hypot(g[0], g[1] - OZ)/(S*dist(c)) if dist(c) > 1 else 1
    a, cx, cz, L, D = obb(q)
    rt = b["rt"]; rh = round(min(rt, 6)*S*VX*f**.5, 1) if rt and rt >= 1.2 and not (rt > 7 and A > 400) else 0
    far_out.append([g[0], g[1], round(Gdir(a), 2), round(L*S*f, 1), round(D*S*f, 1), bd_levels(b), rh, bd_col(b, h(b["id"])), bd_rmat(b)])
# au-delà (jusqu'au bord de l'horizon du jeu, centre de Lille compris) : rectangles englobants de bdtopo_far.json ;
# plus on s'éloigne, plus on ne garde que les grands bâtiments (le jeu reste léger)
if (OSM / "bdtopo_far.json").exists():
    for x, z, a, L, D, hh, ee, rt, mw, mr, A in json.load(open(OSM / "bdtopo_far.json", encoding="utf-8"))["buildings"]:
        d = dist((x, z))
        if A < (40 if d < 1500 else 120 if d < 2200 else 260): continue
        g = G((x, z))
        if math.hypot(g[0], g[1] + 10) > 480: continue
        f = math.hypot(g[0], g[1] - OZ)/(S*d) if d > 1 else 1
        b = { "h":hh, "e":ee, "mw":mw, "mr":mr, "y":None, "id":f"{x},{z}" }
        rh = round(min(rt, 6)*S*VX*f**.5, 1) if rt and rt >= 1.2 and not (rt > 7 and A > 400) else 0
        far_out.append([g[0], g[1], round(Gdir(a), 2), round(L*S*f, 1), round(D*S*f, 1), bd_levels(b), rh, bd_col(b, h(b["id"])), bd_rmat(b)])
# au-delà (jusqu'au bord de l'horizon du jeu, centre de Lille compris) : rectangles englobants de bdtopo_far.json ;
# plus on s'éloigne, plus on ne garde que les grands bâtiments (le jeu reste léger)
if (OSM / "bdtopo_far.json").exists():
    for x, z, a, L, D, hh, ee, rt, mw, mr, A in json.load(open(OSM / "bdtopo_far.json", encoding="utf-8"))["buildings"]:
        d = dist((x, z))
        if A < (40 if d < 1500 else 120 if d < 2200 else 260): continue
        g = G((x, z))
        if math.hypot(g[0], g[1] + 10) > 480: continue
        f = math.hypot(g[0], g[1] - OZ)/(S*d) if d > 1 else 1
        b = { "h":hh, "e":ee, "mw":mw, "mr":mr, "y":None, "id":f"{x},{z}" }
        rh = round(min(rt, 6)*S*VX*f**.5, 1) if rt and rt >= 1.2 and not (rt > 7 and A > 400) else 0
        far_out.append([g[0], g[1], round(Gdir(a), 2), round(L*S*f, 1), round(D*S*f, 1), bd_levels(b), rh, bd_col(b, h(b["id"])), bd_rmat(b)])
print("lointain :", len(far_out), "bâtiments réels")

# --- rues ---
STREETS = []
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
    keep = [q for q in p if in_zone(q, 30)]
    if len(keep) < 2: continue
    w = WID[hw]
    code = 2 if t.get("name") == "Boulevard Vauban" else (1 if hw in ("pedestrian", "living_street") else 0)
    # une rue ne passe jamais à travers un bâtiment (passages couverts, porches) : on la coupe
    dense = [keep[0]]
    for a_, b_ in zip(keep, keep[1:]):
        m = max(1, int(math.dist(a_, b_)))
        dense += [(a_[0] + (b_[0]-a_[0])*k/m, a_[1] + (b_[1]-a_[1])*k/m) for k in range(1, m + 1)]
    blocked = [any(bb[0] <= x <= bb[2] and bb[1] <= z <= bb[3] and inside(x, z, bp) for bp, bb in (bpolys[k] for k in bgrid.get((int(x//CELL), int(z//CELL)), ()))) for x, z in dense]
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
        nm = t.get("name")
        if nm and nm not in STREETS: STREETS.append(nm)
        roads.append([round(w*S, 2), code, flat(G(q) for q in pts), STREETS.index(nm) if nm else -1])
    if hw != "service":
        ks = [q for q in p if in_zone(q, -8)]
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
    if len(p) < 4 or not in_zone(cen(p)): continue
    code = 2 if e["id"] == 95069542 else (1 if kind == "pitch" else 0)
    greens.append([code, flat(G(q) for q in p[:-1] if True)])

# --- arbres ---
tpts = [mp(n) for n in trees_n if n["type"] == "node" and in_zone(mp(n), -2)]
# Boulevard Vauban : double alignement de platanes (absent d'OpenStreetMap), un arbre tous les 8 m de chaque côté
_tg = {}
for p_ in tpts: _tg.setdefault((int(p_[0]//8), int(p_[1]//8)), []).append(p_)
for e in core:
    t = e["tags"]
    if t.get("name") != "Boulevard Vauban" or t.get("highway") not in WID: continue
    p = P(e); off = WID[t["highway"]]/2 + 2.6; run = 0.0; nxt = 4.0
    for a_, b_ in zip(p, p[1:]):
        l = math.dist(a_, b_)
        if l < .01: continue
        ux_, uz_ = (b_[0]-a_[0])/l, (b_[1]-a_[1])/l
        while nxt <= run + l:
            k = nxt - run; x0, z0 = a_[0] + ux_*k, a_[1] + uz_*k
            for sg in (1, -1):
                q_ = (x0 - uz_*off*sg, z0 + ux_*off*sg)
                if not in_zone(q_, -2): continue
                if any(math.dist(q_, o) < 4 for i in (-1, 0, 1) for j in (-1, 0, 1) for o in _tg.get((int(q_[0]//8) + i, int(q_[1]//8) + j), ())): continue
                tpts.append(q_); _tg.setdefault((int(q_[0]//8), int(q_[1]//8)), []).append(q_)
            nxt += 8
        run += l
# arbres des jardins et des cœurs d'îlots, là où la photo aérienne montre des cimes (vertes et sombres), hors des bâtiments
_bg = {}
for k_, (b, q, A, bb, c) in enumerate(BDT):
    for cl in cells(bb): _bg.setdefault(cl, []).append(k_)
def in_bd(x, z, m=1.5):
    for k_ in _bg.get((int(x//CELL), int(z//CELL)), ()):
        q, bb = BDT[k_][1], BDT[k_][3]
        if bb[0] - m <= x <= bb[2] + m and bb[1] - m <= z <= bb[3] + m and (inside(x, z, q) or min(seg_d(x, z, q[i], q[i-1]) for i in range(len(q))) < m): return True
    return False
def near_tree(q_, r=5):
    return any(math.dist(q_, o) < r for i in (-1, 0, 1) for j in (-1, 0, 1) for o in _tg.get((int(q_[0]//8) + i, int(q_[1]//8) + j), ()))
n_garden = 0
if ORT:
    xs_ = [x for x, _ in ZONE]; zs_ = [z for _, z in ZONE]; st_ = 7.0
    x = min(xs_)
    while x < max(xs_):
        z = min(zs_)
        while z < max(zs_):
            j_ = ((h(f"{x:.0f},{z:.0f}") % 100)/100 - .5)*3, ((h(f"{z:.0f},{x:.0f}") % 100)/100 - .5)*3
            q_ = (x + j_[0], z + j_[1])
            if in_zone(q_, -4):
                e_, l_ = canopy(*q_, ORT, 1.5)
                if e_ > .045 and l_ < .36 and not in_bd(*q_) and not near_tree(q_):
                    tpts.append(q_); _tg.setdefault((int(q_[0]//8), int(q_[1]//8)), []).append(q_); n_garden += 1
            z += st_
        x += st_
print("arbres des jardins (photo) :", n_garden)
trees = flat(G(q_) for q_ in tpts)

# bois et parcs du lointain (Bois de Boulogne, Champ de Mars, berges de la Deûle) d'après la photo des environs
ftrees = []
if ORT_L:
    gx = -480.0
    while gx <= 330:
        gz = -380.0
        while gz <= 300:
            if math.hypot(gx, gz + 10) <= 470:
                j_ = ((h(f"{gx:.0f}|{gz:.0f}") % 100)/100 - .5)*2, ((h(f"{gz:.0f}|{gx:.0f}") % 100)/100 - .5)*2
                px_, pz_ = gx + j_[0], gz + j_[1]
                rq = Ginv(px_, pz_)
                if not in_zone(rq, 2):
                    e_, l_ = canopy(*rq, ORT_L, 4)
                    if e_ > .05 and l_ < .36 and not in_bd(*rq, 2): ftrees += [round(px_, 1), round(pz_, 1)]
            gz += 4.3
        gx += 4.3
print("arbres du lointain (photo) :", len(ftrees)//2)

# --- lointain : Deûle, parcs, Citadelle, Euratechnologies ---
canals, parks, blan = [], [], None
for e in far:
    t = e["tags"]; p = P(e)
    if t.get("waterway") == "canal": canals.append(flat(G(q) for q in p))
    elif t.get("name") in ("Jardin Vauban", "Bois de Boulogne"): parks.append([t["name"], flat(G(q) for q in p[:-1])])
    elif "Blan-Lafont" in (t.get("name") or ""): blan = { "pts":flat(G(q) for q in p[:-1]), "ang":round(Gdir(obb(p)[0]),3) }
cit = G((-135, -947))
# station Cormontaigne (ligne 2), la plus proche du campus : 50.62623 N, 3.04029 E (OpenStreetMap)
metro = G(mp({ "lat":50.62623, "lon":3.04029 }))

# --- les deux stations de la ligne 2 côté Vauban : leurs bouches (le quartier autour est dans la zone réelle) ---
# --- lieux réels du quartier (commerces, cafés, églises…) : petites étiquettes visibles de près ---
PLACE_CAT = { "bakery":"🥖", "pastry":"🥐", "cafe":"☕", "restaurant":"🍽️", "fast_food":"🍔", "bar":"🍺", "pub":"🍺", "pharmacy":"💊",
              "convenience":"🛒", "supermarket":"🛒", "library":"📚", "post_office":"✉️", "place_of_worship":"⛪", "theatre":"🎭",
              "park":"🌳", "garden":"🌳", "bicycle_rental":"🚲", "cinema":"🎬", "bank":"🏦", "books":"📚", "greengrocer":"🍎", "cheese":"🧀",
              "butcher":"🥩", "hotel":"🏨", "museum":"🏛️", "copyshop":"🖨️" }
places = []
_seen = set()
for e in json.load(open(OSM / "osm_poi.json", encoding="utf-8"))["elements"]:
    t = e.get("tags", {}); c = e.get("center") or (e if "lat" in e else None)
    if not c or not t.get("name"): continue
    cat = next((t[k] for k in ("shop", "amenity", "tourism", "historic", "leisure") if t.get(k) in PLACE_CAT), None)
    if not cat: continue
    q = mp(c)
    if not in_zone(q, -6) or (t["name"], cat) in _seen: continue
    _seen.add((t["name"], cat))
    name = t["name"]
    if cat == "bicycle_rental" and not name.lower().startswith("v'lille"): name = "V'Lille " + name
    places.append([*G(q), PLACE_CAT[cat], name])
print("lieux réels :", len(places))

metro_raw = load("osm_metro.json")
stations = []
for sid, sname, la, lo in STATIONS_SRC:
    sp = mp({ "lat":la, "lon":lo }); gs = G(sp)
    exits = [list(G(mp(n))) for n in metro_raw if n["type"] == "node" and n.get("tags", {}).get("railway") == "subway_entrance" and math.dist(mp(n), sp) < 60]
    stations.append({ "id":sid, "name":sname, "x":gs[0], "z":gs[1], "r":round(R_ST*S, 1), "exits":exits })
    print(f"station {sname} : centre {gs}, {len(exits)} bouches")
zone = flat(G(q) for q in ZONE)

# --- sol de la zone réelle d'après la photo : 255 = jardin, arbres, pelouse ; 0 = cour, parking, trottoir (img/sol.png) ---
sol = None
if ORT:
    import zlib, struct
    gz_ = [G(q) for q in ZONE]
    X0, X1 = math.floor(min(x for x, _ in gz_)) - 2, math.ceil(max(x for x, _ in gz_)) + 2
    Z0, Z1 = math.floor(min(z for _, z in gz_)) - 2, math.ceil(max(z for _, z in gz_)) + 2
    W, H = X1 - X0, Z1 - Z0          # un pixel par unité du jeu (2,5 m)
    veg = bytearray(W*H)
    for j in range(H):
        for i in range(W):
            gx, gzz = X0 + i + .5, Z0 + j + .5 - OZ
            dx, dz = (gx*ux + gzz*vx)/S, (gx*uz + gzz*vz)/S
            x, z = HAC[0] + dx, HAC[1] + dz
            if not in_zone((x, z), 6): veg[j*W + i] = 255; continue
            e_ = n_ = 0
            for a_ in (-.8, 0, .8):
                for b_ in (-.8, 0, .8):
                    c = ortho_px(x + a_, z + b_)
                    if c: e_ += (2*c[1] - c[0] - c[2])/max(1, sum(c)); n_ += 1
            v = (e_/n_ - .015)/.07 if n_ else 1
            veg[j*W + i] = int(255*max(0, min(1, v)))
    # léger flou : pas de pixels isolés
    bl = bytearray(W*H)
    for j in range(H):
        for i in range(W):
            s_ = n_ = 0
            for a_ in (-1, 0, 1):
                for b_ in (-1, 0, 1):
                    ii, jj = i + a_, j + b_
                    if 0 <= ii < W and 0 <= jj < H: s_ += veg[jj*W + ii]; n_ += 1
            bl[j*W + i] = s_ // n_
    raw = b"".join(b"\x00" + bytes(bl[j*W:(j+1)*W]) for j in range(H))
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 0, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    (ROOT / "img" / "sol.png").write_bytes(png)
    sol = [X0, Z0, W, H]
    print(f"sol : {W}×{H} px, {sum(1 for v in bl if v > 127)*100//(W*H)} % de verdure")


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

# Contours des bâtiments et tracés des rues : entiers au centième, en écarts d'un point au suivant (fichier deux fois plus léger),
# décodés au chargement par vauban.js lui-même.
def enc(f):
    out_, px, pz = [], 0, 0
    for i in range(0, len(f), 2):
        x, z = round(f[i]*100), round(f[i+1]*100)
        out_ += [x - px, z - pz]; px, pz = x, z
    return out_
for b in buildings: b[4] = enc(b[4])
for r in roads: r[2] = enc(r[2])
out = {
    "S":S, "ha":HA, "falise":FAL, "court":[round(c,2) for c in court], "buildings":buildings, "roads":roads, "greens":greens,
    "trees":trees, "walk":walk, "canals":canals, "parks":parks, "blan":blan, "citadelle":cit, "pois":POIS, "metro":metro, "stations":stations, "zone":zone, "sol":sol, "fh":FH_MAP, "streets":STREETS, "places":places
}
HEAD = ("/* Généré par tools/build_map.py — ne pas modifier à la main.\n"
        "   Données © les contributeurs d'OpenStreetMap (ODbL) ; © IGN BD TOPO et BD ORTHO (Licence Ouverte). */\n")
DEC = ("const dec = f => { let x = 0, z = 0; for(let i=0;i<f.length;i+=2){ x += f[i]; z += f[i+1]; f[i] = x/100; f[i+1] = z/100; } };\n"
       "for(const b of MAP.buildings) dec(b[4]);\nfor(const r of MAP.roads) dec(r[2]);\n")
js = HEAD + "export const MAP = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n" + DEC
(ROOT / "js" / "vauban.js").write_text(js, encoding="utf-8")
# le lointain (bâtiments en miniature, bois) : chargé après l'arrivée sur le campus (js/vauban_far.js), au dixième d'unité
far_i = [[round(v*10) if k in (0, 1, 3, 4, 6) else (round(v*100) if k == 2 else v) for k, v in enumerate(r)] for r in far_out]
jsf = HEAD + "/* [x, z, angle, largeur, profondeur] ×10 (angle ×100), étages, hauteur du toit ×10, teinte, toit ; arbres ×10 */\n" \
      + "export const FAR = " + json.dumps({ "far":far_i, "ftrees":[round(v*10) for v in ftrees] }, separators=(",", ":")) + ";\n"
(ROOT / "js" / "vauban_far.js").write_text(jsf, encoding="utf-8")
print("lointain :", round(len(jsf)/1024), "Ko")
print(f"bâtiments {len(buildings)}  rues {len(roads)}  verts {len(greens)}  arbres {len(trees)//2}  marche {len(walk['n'])//2} nœuds")
print("HA", HA, "cour", out["court"]); print("Falise", FAL)
print("POIs", {k:(v and (v['x'], v['z'])) for k, v in POIS.items()})
print("Citadelle", cit, "Blan", blan and blan["pts"][:2], "taille", round(len(js)/1024), "Ko")
