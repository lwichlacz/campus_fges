#!/usr/bin/env python3
"""
Construit js/euramap.js : le quartier d'Euratechnologies (Bois-Blancs, Lille) autour de Wenov,
à partir de l'extrait OpenStreetMap tools/osm/osm_eura.json (même format que js/vauban.js).

Projection : mètres autour du bloc Wenov (avenue de Bretagne, rue des Templiers, allée Clémentine
Deman, allée du Donjon), rotation pour mettre l'avenue de Bretagne à l'horizontale, échelle S
identique à Vauban. Pas de compression : tout est à l'échelle sur CORE mètres.

Comme pour Vauban (tools/build_map.py) : bâtiments de la BD TOPO (étages, toits orientés sur la rue, matériaux,
époque), couleur des toits, sol et arbres d'après la photo aérienne de l'IGN (tools/osm/ortho_eura.jpg, lue avec Pillow),
plaques de rue, lieux réels (tools/osm/osm_poi_eura.json) et station de métro pour le jalonnement « M ».
Échelle verticale commune aux deux quartiers : celle de l'Hôtel Académique (un étage = 1,64 unité).

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

# Wenov n'occupe pas tout l'îlot : côté avenue de Bretagne, une rangée de maisons de ville et un petit immeuble
# (OpenStreetMap et BD TOPO concordent) restent devant. On coupe l'îlot à leur arrière (ZCUT, en unités du jeu).
ZCUT = -13.4
def zg(q): return S*((q[0]-WC[0])*vx + (q[1]-WC[1])*vz)
def cut(a, b):                     # point de l'arête a→b où le jeu passe la ligne ZCUT
    t = (ZCUT - zg(a))/(zg(b) - zg(a)); return (a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t)
block = list(corners)
corners = [cut(corners[0], corners[3]), cut(corners[1], corners[2]), corners[2], corners[3]]
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
# même échelle verticale que Vauban (Hôtel Académique : 19,3 m à la gouttière = 10,2 unités) : un étage de 3,1 m = 1,64 unité
def mat1(code):
    for ch in (code or ""):
        if ch != "0": return ch
    return None
VX = 10.2/(19.3*S)
FH_MAP = round(3.1*S*VX, 2)
CELL = 25.0
def cells(bb): return [(i, j) for i in range(int(bb[0]//CELL), int(bb[2]//CELL) + 1) for j in range(int(bb[1]//CELL), int(bb[3]//CELL) + 1)]
# axes des rues : le faîtage d'un toit à deux pentes est parallèle à la rue la plus proche (maisons en bande des Bois-Blancs)
SEG = {}
for e in ways:
    if e.get("tags", {}).get("highway") not in ("primary","secondary","tertiary","residential","living_street","unclassified","pedestrian"): continue
    p_ = P(e)
    for a_, b_ in zip(p_, p_[1:]):
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
def front_body(q, a):
    """plus grand rectangle d'un seul tenant, collé à la façade sur rue (repris de build_map.py)"""
    c, s_ = math.cos(a), math.sin(a)
    pts = [(x*c + z*s_, -x*s_ + z*c) for x, z in q]
    cxz = cen(q); cv = -cxz[0]*s_ + cxz[1]*c
    best, side = 1e9, 1
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            for a_, b_ in SEG.get((int(cxz[0]//CELL) + i, int(cxz[1]//CELL) + j), ()):
                d = seg_d(cxz[0], cxz[1], a_, b_)
                if d < best:
                    dx, dz = b_[0]-a_[0], b_[1]-a_[1]; l2 = dx*dx + dz*dz or 1
                    k = max(0, min(1, ((cxz[0]-a_[0])*dx + (cxz[1]-a_[1])*dz)/l2))
                    px, pz = a_[0] + k*dx, a_[1] + k*dz
                    best, side = d, (1 if -px*s_ + pz*c > cv else -1)
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
    return (um*c - vm*s_, um*s_ + vm*c, hi - lo, depth)
def roof_of(q, A, rt, kind):
    """toit réel : plat, à deux pentes (faîtage parallèle à la rue) ou à pans brisés ; (gable, rh) comme build_map.py"""
    if kind in ("shed", "sport", "office") or rt is None or rt < 1.2 or (rt > 7 and A > 400): return 0, 0
    rh = round(min(rt, 6)*S*VX, 2)
    a, cx, cz, L, D = obb(q)
    sd = street_dir(cx, cz)
    if sd is not None and abs(math.sin(a - sd)) > math.sin(math.pi/4): a += math.pi/2
    if A/(L*D) > .8:
        cx, cz, L, D = extents(q, a)
        if D <= 18: return [*G((cx, cz)), round(Gdir(a), 3), round(L*S, 2), round(D*S, 2)], rh
    if kind == "house" and sd is not None:
        body = front_body(q, a)
        if body:
            bcx, bcz, bL, bD = body
            if bD <= 16 and bL*bD >= .4*A: return [*G((bcx, bcz)), round(Gdir(a), 3), round(bL*S, 2), round(bD*S, 2)], rh
    return 0, rh

# --- photo aérienne de l'IGN (BD ORTHO, 50 cm par pixel) : couleur des toits, sol, arbres des jardins ---
ORT = None
try:
    from PIL import Image
    _im = Image.open(ROOT / "tools" / "osm" / "ortho_eura.jpg").convert("RGB")
    ORT = { "px":_im.load(), "w":_im.width, "h":_im.height, "box":(50.6295, 3.0165, 50.6389, 3.0307) }          # lat min, lon min, lat max, lon max
except Exception as ex: print("photo aérienne indisponible :", ex)
def ortho_px(x, z):
    if not ORT: return None
    B = ORT["box"]; lat, lon = LAT0 - z/110540, LON0 + x/K
    px = int((lon - B[1])/(B[3] - B[1])*ORT["w"]); py = int((B[2] - lat)/(B[2] - B[0])*ORT["h"])
    return ORT["px"][px, py] if 0 <= px < ORT["w"] and 0 <= py < ORT["h"] else None
def canopy(x, z, r):
    e_ = l_ = n_ = 0
    for a_ in (-r, 0, r):
        for b_ in (-r, 0, r):
            c = ortho_px(x + a_, z + b_)
            if c: e_ += (2*c[1] - c[0] - c[2])/max(1, sum(c)); l_ += sum(c)/765; n_ += 1
    return (e_/n_, l_/n_) if n_ else (0, 1)
def roof_colour(q, pitched):
    """teinte vue d'avion ramenée à la palette du jeu : 0-7 toits en pente, 10-13 toits plats ; -1 inconnue (comme Vauban)"""
    if not ORT: return -1
    import colorsys
    x0, z0, x1, z1 = bbox(q); st = max(.8, math.sqrt((x1-x0)*(z1-z0)/90))
    px_ = []; x = x0 + st/2
    while x < x1:
        z = z0 + st/2
        while z < z1:
            if inside(x, z, q):
                c = ortho_px(x, z)
                if c: px_.append(c)
            z += st
        x += st
    if len(px_) < 4: return -1
    px_.sort(key=lambda c: sum(c)); px_ = px_[int(len(px_)*.3):int(len(px_)*.95) + 1]
    r, g, b = (sum(c[k] for c in px_)/len(px_)/255 for k in range(3))
    hu, l, s_ = colorsys.rgb_to_hls(r, g, b)
    if not pitched:
        if g > r + .03 and g > b + .02: return 13
        return 10 if l > .55 else (11 if l > .4 else 12)
    rb = (r - b)*255
    if rb >= 9 and r >= g - .01: return 5 if rb >= 30 and l > .42 else (4 if rb >= 18 else 2)
    return 7 if l < .27 else (3 if l < .37 else (0 if l < .47 else (1 if l < .58 else 6)))
def bd_style(b):
    """façade : 0 brique d'avant-guerre, 1 immeuble des années 1950-1980, 2 bâtiment récent (BD TOPO : année de construction)"""
    y = int(b["y"]) if b["y"] else None; m = mat1(b["mw"])
    if y is None: return 1 if m == "3" or (b["n"] or "").startswith("Industriel") else 0
    return 0 if y < 1945 else (1 if y < 1990 else 2)
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
    roof, rh = roof_of(q, A, b["rt"], kind)
    style = bd_style(b) if kind == "house" else 0
    rm = { "1":1, "2":2, "3":3 }.get(mat1(b["mr"]), 0) or (0 if not rh else (1 if r % 10 < 7 else 2))
    rec = { "house":0, "campus":1, "modern":1, "sport":3, "church":4, "shed":6, "office":7 }[kind]
    return [rec, lv or bd_levels(b), bd_col(b, r) if col is None else col, roof, flat(G(v) for v in q), rh, style, rm, roof_colour(q, bool(rh))]
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
    buildings.append([rec, lv, col, roof, flat(gp), 0, 0, 0, roof_colour(q, bool(roof))])
    if t.get("name"): pois_src[t["name"]] = (len(buildings) - 1, gp, lv)
for bb, bq, bA, _ in free: buildings.append(bd_rec(bb, bq, bA))
print("bâtiments :", len(buildings))

# --- rues ---
WID = { "primary":12, "secondary":10, "tertiary":9, "residential":7.5, "living_street":6, "unclassified":7, "pedestrian":6, "service":4.5, "cycleway":3 }
bpolys = [(c[1], c[3]) for k, c in enumerate(cands) if k not in drop] + [(wen_m, bbox(wen_m))]
roads, walk_nodes, walk_edges, idx, STREETS = [], [], {}, {}, []
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
        nm = t.get("name") if hw != "cycleway" else None
        if nm and nm not in STREETS: STREETS.append(nm)
        roads.append([round(w*S, 2), code, flat(G(q) for q in pts), STREETS.index(nm) if nm else -1])
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
tpts = [mp(n) for n in E if n["type"] == "node" and n.get("tags", {}).get("natural") == "tree" and dist(mp(n)) < CORE]
_tg = {}
for p_ in tpts: _tg.setdefault((int(p_[0]//8), int(p_[1]//8)), []).append(p_)
# emprises au sol (BD TOPO, OpenStreetMap, Wenov, Blan-Lafont) : pas d'arbre dans un bâtiment
_bp = [q for (_, q, _, _) in BD] + [c[1] for k, c in enumerate(cands) if k not in drop] + [wen_m, P(blan_e), tp]
_bg = {}
for k_, q in enumerate(_bp):
    for cl in cells(bbox(q)): _bg.setdefault(cl, []).append(k_)
def in_bd(x, z, m=1.5):
    for k_ in _bg.get((int(x//CELL), int(z//CELL)), ()):
        q = _bp[k_]; bb = bbox(q)
        if bb[0] - m <= x <= bb[2] + m and bb[1] - m <= z <= bb[3] + m and (inside(x, z, q) or min(seg_d(x, z, q[i], q[i-1]) for i in range(len(q))) < m): return True
    return False
n_garden = 0
if ORT:
    x = WC[0] - CORE
    while x < WC[0] + CORE:
        z = WC[1] - CORE
        while z < WC[1] + CORE:
            j_ = ((h(f"{x:.0f},{z:.0f}") % 100)/100 - .5)*3, ((h(f"{z:.0f},{x:.0f}") % 100)/100 - .5)*3
            q_ = (x + j_[0], z + j_[1])
            if dist(q_) < CORE - 4:
                e_, l_ = canopy(*q_, 1.5)
                if e_ > .045 and l_ < .36 and not in_bd(*q_) and not any(math.dist(q_, o) < 5 for i in (-1, 0, 1) for j in (-1, 0, 1) for o in _tg.get((int(q_[0]//8) + i, int(q_[1]//8) + j), ())):
                    tpts.append(q_); _tg.setdefault((int(q_[0]//8), int(q_[1]//8)), []).append(q_); n_garden += 1
            z += 7.0
        x += 7.0
print("arbres des jardins (photo) :", n_garden)
trees = flat(G(q_) for q_ in tpts)

# --- sol d'après la photo : 255 = jardin, pelouse, arbres ; 0 = cour, parking, trottoir (img/sol_eura.png, 1 pixel par unité) ---
sol = None
if ORT:
    import zlib, struct
    R_ = CORE*S
    X0, Z0 = math.floor(-R_) - 2, math.floor(-R_) - 2
    W_ = H_ = int(2*R_) + 4
    veg = bytearray(W_*H_)
    for j in range(H_):
        for i in range(W_):
            gx, gz_ = X0 + i + .5, Z0 + j + .5
            x, z = WC[0] + (gx*ux + gz_*vx)/S, WC[1] + (gx*uz + gz_*vz)/S
            if dist((x, z)) > CORE + 6: veg[j*W_ + i] = 255; continue
            e_ = n_ = 0
            for a_ in (-.8, 0, .8):
                for b_ in (-.8, 0, .8):
                    c = ortho_px(x + a_, z + b_)
                    if c: e_ += (2*c[1] - c[0] - c[2])/max(1, sum(c)); n_ += 1
            v = (e_/n_ - .015)/.07 if n_ else 1
            veg[j*W_ + i] = int(255*max(0, min(1, v)))
    bl = bytearray(W_*H_)
    for j in range(H_):
        for i in range(W_):
            s_ = n_ = 0
            for a_ in (-1, 0, 1):
                for b_ in (-1, 0, 1):
                    ii, jj = i + a_, j + b_
                    if 0 <= ii < W_ and 0 <= jj < H_: s_ += veg[jj*W_ + ii]; n_ += 1
            bl[j*W_ + i] = s_ // n_
    raw = b"".join(b"\x00" + bytes(bl[j*W_:(j+1)*W_]) for j in range(H_))
    chunk = lambda t_, d: struct.pack(">I", len(d)) + t_ + d + struct.pack(">I", zlib.crc32(t_ + d) & 0xffffffff)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", W_, H_, 8, 0, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    (ROOT / "img" / "sol_eura.png").write_bytes(png)
    sol = [X0, Z0, W_, H_]
    print(f"sol : {W_}×{H_} px, {sum(1 for v in bl if v > 127)*100//(W_*H_)} % de verdure")

# --- lieux réels du quartier (cafés, commerces, services…) : petites étiquettes visibles de près ---
PLACE_CAT = { "bakery":"🥖", "pastry":"🥐", "cafe":"☕", "restaurant":"🍽️", "fast_food":"🍔", "bar":"🍺", "pub":"🍺", "pharmacy":"💊",
              "convenience":"🛒", "supermarket":"🛒", "library":"📚", "post_office":"✉️", "place_of_worship":"⛪", "theatre":"🎭",
              "park":"🌳", "garden":"🌳", "bicycle_rental":"🚲", "cinema":"🎬", "bank":"🏦", "books":"📚", "greengrocer":"🍎", "cheese":"🧀",
              "butcher":"🥩", "hotel":"🏨", "museum":"🏛️", "copyshop":"🖨️", "coworking_space":"💻", "school":"🏫", "kindergarten":"🧸" }
places, _seen = [], set()
for e in json.load(open(ROOT / "tools" / "osm" / "osm_poi_eura.json", encoding="utf-8"))["elements"]:
    t = e.get("tags", {}); c = e.get("center") or (e if "lat" in e else None)
    if not c or not t.get("name"): continue
    cat = next((t[k] for k in ("shop", "amenity", "tourism", "leisure") if t.get(k) in PLACE_CAT), None)
    if not cat: continue
    q = mp(c)
    if dist(q) > CORE - 10 or (t["name"], cat) in _seen: continue
    _seen.add((t["name"], cat))
    name = t["name"]
    if cat == "bicycle_rental" and not name.lower().startswith("v'lille"): name = "V'Lille " + name
    places.append([*G(q), PLACE_CAT[cat], name])
print("lieux réels :", len(places))

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
# la station de la ligne 2, pour le jalonnement « M » depuis Wenov (js/landmarks.js)
stations = [{ "id":"canteleu", "name":"Canteleu – Euratechnologies", "x":metro["x"], "z":metro["z"], "r":4.0, "exits":[list(e) for e in exits] }] if metro else []
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
    "greens":greens, "trees":trees, "walk":walk, "canals":[], "water":water, "parks":[], "pois":POIS, "spots":SPOTS,
    "fh":FH_MAP, "streets":STREETS, "places":places, "stations":stations, "sol":sol
}
js = ("/* Généré par tools/build_eura.py — ne pas modifier à la main.\n"
      "   Quartier Euratechnologies (Bois-Blancs, Lille). Données © les contributeurs d'OpenStreetMap (ODbL) ; © IGN BD TOPO et BD ORTHO (Licence Ouverte). */\n"
      "export const EMAP = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
(ROOT / "js" / "euramap.js").write_text(js, encoding="utf-8")

# --- horizon : les vrais bâtiments des environs (BD TOPO, jusqu'à 1,3 km ; tools/fetch_eura_far.py), en volumes simples ---
# js/eura_far.js, chargé après le quartier : [x, z, angle, longueur, largeur, hauteur] ×10 (entiers) et une teinte (0 brique, 1 pierre, 2 béton)
far_src = ROOT / "tools" / "osm" / "bdtopo_eura_far.json"
if far_src.exists():
    FAR = []
    for cx, cz, a, L, D, hh, mw, A in json.load(open(far_src, encoding="utf-8"))["buildings"]:
        if dist((cx, cz)) <= CORE: continue                       # le cœur est détaillé dans euramap.js
        g = G((cx, cz)); H = (hh if hh and hh > 2 else 6)*S*VX
        m = mat1(mw); c = 0 if m == "4" else 1 if m in ("1", "2") else 2 if m in ("3", "5") else (h(f"{cx},{cz}") % 3)
        FAR += [round(g[0]*10), round(g[1]*10), round(Gdir(a)*100), round(L*S*10), round(D*S*10), round(H*10), c]
    fjs = ("/* Généré par tools/build_eura.py — ne pas modifier à la main.\n"
           "   Horizon d'Euratechnologies : bâtiments © IGN BD TOPO (Licence Ouverte), en rectangles orientés. */\n"
           "export const EFAR = " + json.dumps(FAR, separators=(",", ":")) + ";\n")
    (ROOT / "js" / "eura_far.js").write_text(fjs, encoding="utf-8")
    print(f"horizon : {len(FAR)//7} bâtiments, {round(len(fjs)/1024)} Ko")
print(f"bâtiments {len(buildings)}  rues {len(roads)}  verts {len(greens)}  eau {len(water)}  arbres {len(trees)//2}  marche {len(walk['n'])//2} nœuds  taille {round(len(js)/1024)} Ko")
print("Wenov", out["wenov"]["pts"]); print("Blan", blan["pts"][:4], blan["ang"])
print("POIS", {k:(v and (v['x'], v['z'])) for k, v in POIS.items()}); print("SPOTS", {k:(v and (v['x'], v['z'])) for k, v in SPOTS.items()})
