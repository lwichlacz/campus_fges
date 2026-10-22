"""
Compare le nombre d'étages de chaque bâtiment de js/vauban.js à la hauteur mesurée par l'IGN (BD TOPO)
et écrit les corrections dans js/hauteurs.js (appliquées au chargement par js/city.js).

Les bâtiments repris d'OpenStreetMap sans morceau BD TOPO gardent l'étage d'OpenStreetMap (ou un nombre
deviné) : c'est là que se trouvent les écarts, par exemple une tour de 22 m dessinée sur 2 niveaux.
Le calcul refait la carte en mémoire avec tools/build_map.py (sans rien écrire) pour avoir exactement
les mêmes emprises et le même ordre que js/vauban.js.

    python tools/hauteurs_ign.py
"""
import json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = (ROOT / "tools" / "build_map.py").read_text(encoding="utf-8")
src = src[:src.index('(ROOT / "js" / "vauban.js").write_text')]          # tout sauf l'écriture des fichiers
M = { "__file__": str(ROOT / "tools" / "build_map.py"), "__name__": "build_map" }
exec(compile(src, "build_map.py", "exec"), M)

buildings, BDT, G, KIND = M["buildings"], M["BDT"], M["G"], M["KIND"]
FH = M["FH_MAP"]
def inside(x, z, p):
    c = False
    for i in range(len(p)):
        (xi, zi), (xj, zj) = p[i], p[i-1]
        if (zi > z) != (zj > z) and x < (xj - xi)*(z - zi)/(zj - zi) + xi: c = not c
    return c
def bbox(p): xs = [q[0] for q in p]; zs = [q[1] for q in p]; return (min(xs), min(zs), max(xs), max(zs))

# emprises BD TOPO dans le repère du jeu, rangées par cases de 8 unités
C = 8.0
ign, grid = [], {}
for b, q, A, _, _ in BDT:
    if not b["h"] or b["h"] <= 0: continue
    g = [G(v) for v in q]; bb = bbox(g)
    ign.append((g, bb, b["h"]))
    for a in range(int(bb[0]//C), int(bb[2]//C) + 1):
        for c in range(int(bb[1]//C), int(bb[3]//C) + 1): grid.setdefault((a, c), []).append(len(ign) - 1)

def ign_height(p):
    """hauteur IGN majoritaire sous l'emprise p (échantillons tous les 0,4 unité), et la part couverte"""
    bb = bbox(p); hs = []; n = 0
    st = max(.4, math.sqrt((bb[2]-bb[0])*(bb[3]-bb[1])/600))
    x = bb[0] + st/2
    while x < bb[2]:
        z = bb[1] + st/2
        while z < bb[3]:
            if inside(x, z, p):
                n += 1
                for k in grid.get((int(x//C), int(z//C)), ()):
                    g, gb, hh = ign[k]
                    if gb[0] <= x <= gb[2] and gb[1] <= z <= gb[3] and inside(x, z, g): hs.append(hh); break
            z += st
        x += st
    if not n or not hs: return None, 0
    hs.sort()
    return hs[len(hs)//2], len(hs)/n

checked, out = 0, []
last = len(buildings) - len(M.get("cb", []))          # les bâtiments de la Citadelle (ajoutés en dernier) ont leur propre gabarit
for i, r in enumerate(buildings[:last]):
    kind, lv, f = r[0], r[1], r[4]
    if kind not in (KIND["house"], KIND["campus"], KIND["dorm"], KIND["glass"]) : continue
    p, x, z = [], 0, 0          # contour déjà encodé par build_map.py : centièmes, en écarts d'un point au suivant
    for k in range(0, len(f), 2): x += f[k]; z += f[k+1]; p.append((x/100, z/100))
    if len(p) < 3: continue
    hh, cov = ign_height(p)
    checked += 1
    if hh is None or cov < .6: continue
    want = max(1, min(14, round(hh/3.1)))
    if abs(want - lv) >= 2:
        cx = round(sum(q[0] for q in p)/len(p), 2); cz = round(sum(q[1] for q in p)/len(p), 2)
        out.append([i, cx, cz, want])
        print(f"bâtiment {i:5d} ({cx:7.2f}, {cz:7.2f}) : {lv} niveaux -> {want} (IGN {hh:.1f} m, {cov:.0%} couvert)")

print(f"{checked} bâtiments comparés, {len(out)} corrigés")
js = ("/* Hauteurs corrigées d'après la BD TOPO de l'IGN (tools/hauteurs_ign.py) : [rang dans MAP.buildings, x, z du centre, niveaux].\n"
      "   Le centre sert de vérification : une correction ne s'applique qu'au bâtiment attendu. © IGN, Licence Ouverte Etalab 2.0 */\n"
      "export const HAUTEURS = " + json.dumps(out, separators=(",", ":")) + ";\n")
(ROOT / "js" / "hauteurs.js").write_text(js, encoding="utf-8")
