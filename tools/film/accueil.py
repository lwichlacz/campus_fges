#!/usr/bin/env python3
"""Vidéo d'accueil de fges.fr : le réel bascule dans le campus 3D. Tout le film en une commande.

    python tools/film/accueil.py                     # automne (la vidéo du site)
    python tools/film/accueil.py --saison hiver      # variante sous la neige (décembre)
    python tools/film/accueil.py --saison toutes     # les deux
    options : --montage-seul (réutilise le dernier tournage) · --extrait 3.5 6.5 (un morceau, pour régler)
              --sans-navigateur (ouvrir soi-même la page de tournage affichée)

Étapes : 1. lance le serveur du site (tools/serve.py) s'il ne tourne pas et un récepteur d'images (port 8768) ;
2. ouvre tools/film/accueil.html, qui charge le campus et tourne la partie 3D image par image (tools/film/accueil.js) ;
3. monte le film : réel 2,85 → 3,85 s avec un travelling avant continu (105 → 115 %) · transition 1,4 s : plongée qui
   accélère et onde lumineuse partie de l'entrée de la cour, qui remonte l'édifice, allume en turquoise les arêtes de la maquette puis la substitue au réel ·
   envol au-dessus du quartier, profondeur de champ douce, étiquettes en cascade (4 principales, 3 discrètes) ·
   carton de fin aux couleurs et polices de la charte (fond flouté et assombri, aplats « courbes » de la charte, logo officiel vectoriel sur cartouche blanc,
   titre en Tiempos Headline et sous-titre en Inter révélés par masque, signature tricolore),
   fondu au noir pour la boucle. Grain de pellicule sur tout le film.

Entrée : tools/film/_accueil-reel.mp4, la vidéo d'accueil actuelle de fges.fr (1080p 60 i/s), à récupérer une fois :
    python -m yt_dlp -f "bv*[height=1080]" -o tools/film/_accueil-reel.mp4 https://www.youtube.com/watch?v=ghUEiGJUa_Y
Sorties : tools/film/_accueil-<saison>.mp4 (haute qualité) et _accueil-<saison>-web.mp4 (pour le site).
Images de travail (≈ 450 Mo par saison) : dossier temporaire du système, hors OneDrive.
Après une évolution du campus (bâtiments, couleurs…), relancer simplement la commande.
"""
import argparse, http.server, json, re, socket, subprocess, sys, tempfile, threading, time, webbrowser
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

for _s in (sys.stdout, sys.stderr):
    try: _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

ROOT = Path(__file__).resolve().parents[2]
FILM = ROOT/"tools"/"film"
REEL = FILM/"_accueil-reel.mp4"
TRAVAIL = Path(tempfile.gettempdir())/"campus-fges-film"
PORT_SITE, PORT_RECEPTEUR = 8765, 8768
W, H, FPS = 1920, 1080, 60
DUREE = 25.6
DEBUT = 2.85                                          # le film entre dans le drone à 2,85 s : la plongée arrive à 1 s

# ---------------------------------------------------------------- tournage
def port_ouvert(port):
    with socket.socket() as s:
        s.settimeout(.5)
        return s.connect_ex(("127.0.0.1", port)) == 0

def recepteur(dossier):
    """reçoit les images (POST /cNNNN.jpg) et labels.json de tools/film/accueil.js"""
    class R(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a): pass
        def cors(self):
            self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "*"); self.send_header("Access-Control-Allow-Private-Network", "true")
        def do_OPTIONS(self): self.send_response(204); self.cors(); self.end_headers()
        def do_POST(self):
            nom = self.path.strip("/")
            n = int(self.headers.get("Content-Length", 0)); corps = self.rfile.read(n)
            if not re.fullmatch(r"[\w-]+\.(jpg|json)", nom):
                self.send_response(400); self.cors(); self.end_headers(); return
            (dossier/nom).write_bytes(corps)
            self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b"ok")
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT_RECEPTEUR), R)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def tourner(saison, navigateur=True):
    dossier = TRAVAIL/saison; dossier.mkdir(parents=True, exist_ok=True)
    for f in list(dossier.glob("c*.jpg")) + [dossier/"labels.json", dossier/"erreur.json"]: f.unlink(missing_ok=True)
    if not port_ouvert(PORT_SITE):
        print("· lancement du serveur du site (tools/serve.py)")
        subprocess.Popen([sys.executable, str(ROOT/"tools"/"serve.py")], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(40):
            if port_ouvert(PORT_SITE): break
            time.sleep(.25)
    srv = recepteur(dossier)
    url = f"http://localhost:{PORT_SITE}/tools/film/accueil.html?saison={saison}"
    print(f"· tournage {saison} : {url}" + ("" if navigateur else "  (à ouvrir dans un navigateur)"))
    if navigateur: webbrowser.open(url)
    t0, vu = time.time(), -1
    while not (dossier/"labels.json").exists():
        if (dossier/"erreur.json").exists():
            srv.shutdown(); sys.exit("tournage interrompu : " + json.loads((dossier/"erreur.json").read_text())["err"])
        n = sum(1 for _ in dossier.glob("c*.jpg"))
        if n != vu and (n - vu >= 100 or n == 0): print(f"  {n} images"); vu = n
        time.sleep(1)
    srv.shutdown()
    print(f"  tournage terminé en {time.time() - t0:.0f} s")

# ---------------------------------------------------------------- montage
sm = lambda x: x*x*(3 - 2*x)
ssm = lambda x: x*x*x*(x*(6*x - 15) + 10)
cl = lambda x: max(0.0, min(1.0, x))
eo = lambda x: 1 - (1 - x)**3
eiq = lambda x: 8*x**4 if x < .5 else 1 - (2 - 2*x)**4/2          # accélère puis freine (quartique)

TS, TW = 3.85, 1.4                                    # transition : départ, durée
COUL = (4.3, 6.2)                                     # le 3D retrouve ses couleurs
POSE = 8.85                                            # fin du retour au cadre d'origine après la plongée
O = np.array([905.0, 300.0], np.float32)              # l'horloge de l'Hôtel Académique (cadre d'origine)
ENTREE = np.array([760.0, 1130.0], np.float32)        # l'entrée de la cour, juste sous le cadre : l'onde part d'ici et remonte l'édifice
TURQUOISE = np.array([33, 183, 203], np.float32)      # cyan FGES de la charte (#21b7cb) pour les arêtes lumineuses
C = np.array([W/2, H/2], np.float32)
# charte de l'Université (docs/charte-graphique.md)
CYAN, BLEU_CLAIR, BLEU_INST = (33, 183, 203), (128, 181, 227), (12, 35, 64)   # #21b7cb · #80b5e3 · #0c2340
ECOLES = [np.array(c, np.float32) for c in (CYAN, (202, 150, 28), (135, 40, 80))]   # FGES #21b7cb, EDN #ca961c, ISEA #872850
NAVY = BLEU_INST
# étiquettes : clé, nom, entrée, sortie, hauteur du trait, principale (pastille) ou discrète (texte seul)
LIEUX = [("ha", "Hôtel Académique", 5.98, 10.35, 70, True), ("chapelle", "Chapelle universitaire", 6.85, 9.85, 46, False),
         ("falise", "Bâtiment Michel Falise · FGES", 9.73, 15.23, 95, True), ("jardin", "Jardin botanique", 11.35, 16.6, 60, True),
         ("bu", "BU Vauban", 14.6, 20.6, 64, True), ("resto", "Restaurant universitaire", 15.97, 20.23, 46, False),
         ("residence", "Résidences étudiantes", 17.1, 20.73, 46, False)]
FIN_T = 21.2                                          # carton de fin

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
LUMA = np.array([.299, .587, .114], np.float32)
_r = np.random.default_rng(3)                         # relief doux qui rend l'onde organique (pas un cercle parfait)
RELIEF = np.asarray(Image.fromarray((_r.random((H//24, W//24))*255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
                    .filter(ImageFilter.GaussianBlur(30)), np.float32)/255
RELIEF = (RELIEF - RELIEF.mean())/(RELIEF.std() + 1e-6)

def zoom(t):
    """travelling avant continu (cadrage centré) : 105 % → 115 % sur le drone, la plongée s'accélère pendant la transition,
    puis le cadre revient en douceur à 100 % pendant que la caméra 3D s'élève"""
    if t < TS: s = cl((t - DEBUT)/(TS - DEBUT)); return 1.05 + .10*(.7*s + .3*sm(s))
    z1 = 1.15 + .021*TW + .05
    if t < TS + TW: s = (t - TS)/TW; return 1.15 + .021*(t - TS) + .05*eiq(s)
    return 1 + (z1 - 1)*(1 - ssm(cl((t - TS - TW)/(POSE - TS - TW))))

def vitesse_zoom(t): return (zoom(t + .5/FPS) - zoom(t - .5/FPS))*FPS
def cadre(p, t):                                      # position à l'écran d'un point du cadre d'origine
    return C + zoom(t)*(np.asarray(p, np.float32) - C)

def aretes(img):
    """arêtes de l'image (contours de luminance), entre 0 et 1"""
    Lb = np.asarray(Image.fromarray((img @ LUMA).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1)), np.float32)
    gx = np.zeros_like(Lb); gy = np.zeros_like(Lb); gx[:, 1:-1] = Lb[:, 2:] - Lb[:, :-2]; gy[1:-1] = Lb[2:] - Lb[:-2]
    return np.clip((np.hypot(gx, gy) - 7)/34, 0, 1)


def horloge(t):
    """zone de la tour de l'horloge où les arêtes restent allumées, avec leur extinction retardée (0,4 s après la transition)"""
    o = cadre(O, t)
    return .85*np.exp(-(((xx - o[0])/150)**2 + ((yy - o[1] - 60)/260)**2))*(1 - sm(cl((t - (TS + TW - .25))/.65)))


def logo_vectoriel():
    """logo officiel img/logo-fges.svg rendu en 4x par Edge (headless, fond transparent) ; repli : le PNG"""
    out = TRAVAIL/"logo-fges-4x.png"; svg = ROOT/"img"/"logo-fges.svg"
    if not out.exists() or out.stat().st_mtime < svg.stat().st_mtime:
        edge = next((e for e in (Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
                                 Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe")) if e.exists()), None)
        if edge:
            TRAVAIL.mkdir(parents=True, exist_ok=True); page = TRAVAIL/"logo.html"
            page.write_text(f'<!doctype html><body style="margin:0;background:transparent"><img src="{svg.as_uri()}" '
                            'style="display:block;width:4592px;height:1404px"></body>', encoding="utf-8")
            subprocess.run([str(edge), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
                            "--window-size=4592,1404", f"--screenshot={out}", page.as_uri()], capture_output=True, timeout=60)
    im = Image.open(out if out.exists() else ROOT/"img"/"logo-fges.png").convert("RGBA")
    return im.crop(im.getbbox())

def inter(taille, gras=False):
    """Inter, texte de la charte en 300 ou 700 (OFL, fonts/inter/) ; repli : Bahnschrift"""
    f = ROOT/"fonts"/"inter"/f"inter-latin-{700 if gras else 300}-normal.woff2"
    return ImageFont.truetype(str(f), taille) if f.exists() else police(taille, gras)

def tiempos(taille):
    """Tiempos Headline, titres de la charte (fonts/tiempos/, local seulement, jamais publiée) ; repli : Times New Roman"""
    f = ROOT/"fonts"/"tiempos"/"tiempos-headline-regular.woff2"
    if f.exists(): return ImageFont.truetype(str(f), taille)
    return ImageFont.truetype("C:/Windows/Fonts/times.ttf", taille) if Path("C:/Windows/Fonts/times.ttf").exists() else police(taille)

def police(taille, gras=True):
    f = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf" if Path("C:/Windows/Fonts/bahnschrift.ttf").exists() else "DejaVuSans.ttf", taille)
    try: f.set_variation_by_name(gras if isinstance(gras, str) else "Bold" if gras else ("Light" if taille < 30 else "Regular"))
    except Exception: pass
    return f

def zoomer(arr, z, flou=0.0):
    """agrandit autour du centre ; flou > 0 : flou de mouvement radial (moyenne de copies légèrement plus agrandies)"""
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    n = 1 if flou < .002 else 4; acc = None
    for k in range(n):
        zk = z*(1 + flou*k/max(1, n - 1)); q = 1/zk
        a = np.asarray(im.transform((W, H), Image.AFFINE, (q, 0, C[0]*(1 - q), 0, q, C[1]*(1 - q)), Image.BICUBIC) if abs(zk - 1) > 2e-4 else im, np.float32)
        acc = a if acc is None else acc + a
    return acc/n

class Montage:
    def __init__(self, saison):
        self.d = TRAVAIL/saison
        meta = json.loads((self.d/"labels.json").read_text())
        self.T3D, self.labels = meta["T0"], meta["labels"]
        rng = np.random.default_rng(7)
        self.grain = [np.asarray(Image.fromarray(np.clip(128 + rng.normal(0, 40, (H, W)), 0, 255).astype(np.uint8))
                                 .filter(ImageFilter.GaussianBlur(.65)), np.float32)/40 - 3.2 for _ in range(6)]
        self.rng = rng
        self.f_lab, self.f_sec = inter(28, True), inter(26)
        self.f_t1 = tiempos(96); self.f_t2 = inter(34)
        # logo officiel (charte) : couleurs d'origine, sans ombre portée, au large dans un cartouche blanc
        lg = logo_vectoriel(); lg = lg.resize((round(lg.width*118/lg.height), 118), Image.LANCZOS)
        mx, my = 46, 30; self.logo = Image.new("RGBA", (lg.width + 2*mx, lg.height + 2*my), (0, 0, 0, 0))
        ImageDraw.Draw(self.logo).rounded_rectangle([0, 0, self.logo.width - 1, self.logo.height - 1], 22, fill=(255, 255, 255, 255))
        self.logo.alpha_composite(lg, (mx, my))
        # système graphique « courbe » de la charte : aplat bleu institutionnel arrondi en bas à gauche comme le blason,
        # doublé d'un aplat cyan décalé ; dessiné en double résolution pour une courbe nette
        pw, ph, R, dx = 1180, 545, 280, 22
        a2 = Image.new("RGBA", ((pw + dx)*2, (ph + dx)*2), (0, 0, 0, 0)); d2 = ImageDraw.Draw(a2)
        d2.rounded_rectangle([0, dx*2, pw*2, (ph + dx)*2], R*2, fill=(*CYAN, 255), corners=(False, False, False, True))
        d2.rounded_rectangle([dx*2, 0, (pw + dx)*2, ph*2], R*2, fill=(*BLEU_INST, 236), corners=(False, False, False, True))
        self.aplat = a2.resize((pw + dx, ph + dx), Image.LANCZOS)

    def idx(self, t): return max(0, min(len(self.labels) - 1, int(round((t - self.T3D)*FPS))))
    def lire(self, i): return np.asarray(Image.open(self.d/f"c{i:04d}.jpg").convert("RGB"), np.float32)

    def trois_d(self, t):
        """image 3D dans le cadre d'origine : léger flou de mouvement, étalonnage maquette, couleurs atténuées pendant le passage"""
        i, n = self.idx(t), len(self.labels) - 1
        img = self.lire(max(0, i - 1))*.25 + self.lire(i)*.5 + self.lire(min(n, i + 1))*.25
        img = self.maquette(img)
        k = sm(cl((t - COUL[0])/(COUL[1] - COUL[0])))
        if k < 1:                                      # au départ, proche du réel : moins saturé, contraste doux
            g = img.mean(axis=2, keepdims=True)
            img = g + (img - g)*(.55 + .45*k)
            img = (img - 128)*(.9 + .1*k) + 128 - 4*(1 - k)
        return np.clip(img, 0, 255)

    @staticmethod
    def maquette(img):
        """rendu maquette d'architecte : ombres légèrement bleutées, lumières chaudes, contraste un peu rehaussé, couleurs justes"""
        L = (img @ LUMA)[..., None]/255
        img = img + (1 - L)**2*np.array([-5, 0, 9], np.float32) + L**2*np.array([9, 4, -7], np.float32)
        x = np.clip(img/255, 0, 1); x = .7*x + .3*x*x*(3 - 2*x)
        img = x*255; g = (img @ LUMA)[..., None]
        return np.clip(g + (img - g)*.97, 0, 255)

    def profondeur(self, img, t):
        """profondeur de champ naturelle : nette sur une large bande autour du campus, flou qui croît doucement vers
        le premier plan et l'horizon, installé progressivement pendant l'envol"""
        k = ssm(cl((t - 5.6)/2.6))
        if k <= 0: return img
        yc = float(np.clip(cadre(self.labels[self.idx(t)]["ha"][:2], t)[1] + 60, 280, 820))
        w = (np.clip((np.abs(yy[:, :1] - yc) - 230)/560, 0, 1)**1.5*k)[..., None]
        im = Image.fromarray(img.astype(np.uint8))
        b1 = np.asarray(im.filter(ImageFilter.GaussianBlur(1.6)), np.float32); b2 = np.asarray(im.filter(ImageFilter.GaussianBlur(4.0)), np.float32)
        w1, w2 = np.clip(w*2, 0, 1), np.clip(w*2 - 1, 0, 1)
        return (img*(1 - w1) + b1*w1)*(1 - w2) + b2*w2

    def transition(self, reel, t):
        """morphing réel → maquette : une onde lumineuse part de l'entrée de la cour et remonte l'édifice. Sur son passage,
        les arêtes de la maquette s'allument (lignes turquoise FGES) par-dessus le réel, puis la maquette se substitue
        aux textures réelles en fondu. Le tout pendant une plongée qui accélère, avec un flou de mouvement radial."""
        z, fl = zoom(t), min(.018, vitesse_zoom(t)*.06)
        A = zoomer(reel, z, fl); B = zoomer(self.trois_d(t), z, fl)
        o = cadre(ENTREE, t)
        d = np.hypot((xx - o[0])*.55, yy - o[1]) + RELIEF*45     # front presque horizontal, qui monte
        s = cl((t - TS)/(TW - .05)); R = -120 + 2000*(.45*s + .55*sm(s))   # rayon du front d'onde (px), allure régulière
        phi = (R - d)/620                                             # < 0 : réel · 0 → 1 : métamorphose · > 1 : maquette
        m = np.clip(phi, 0, 1); m = (m*m*m*(m*(6*m - 15) + 10))[..., None]
        img = A*(1 - m) + B*m
        # arêtes de la maquette (contours de luminance), allumées juste derrière le front
        ar = aretes(B)
        bell = np.exp(-((phi - .3)/.26)**2)
        lum = np.maximum(ar*bell*.85 + np.exp(-((phi - .04)/.16)**2)*.10, ar*horloge(t)*np.clip((phi - .3)/.15, 0, 1))
        img = img + (TURQUOISE - img)*np.clip(lum, 0, 1)[..., None]
        # lueur de scanner : un filet clair et fin qui court sur le front de l'onde
        ps = (R - np.hypot((xx - o[0])*.55, yy - o[1]) - RELIEF*8)/620          # front lissé : un filet net, sans boucles
        scan = np.exp(-((ps + .02)/.022)**2)*.45*(1 - sm(cl((s - .8)/.2)))
        img = img + (np.array([210, 228, 244], np.float32) - img)*scan[..., None]
        eclat = ar*np.exp(-((ps + .03)/.06)**2)*.8*(1 - sm(cl((s - .8)/.2)))     # les arêtes vives (pignons, tourelles) s'illuminent au passage
        img = img + (np.array([255, 255, 255], np.float32) - img)*eclat[..., None]
        return np.clip(img, 0, 255)

    def apres_transition(self, img, t):
        """les arêtes turquoise s'éteignent en dernier sur la tour de l'horloge, qui clôt la transition"""
        h = horloge(t)
        if h.max() < .01: return img
        return img + (TURQUOISE - img)*(aretes(img)*h)[..., None]

    # ------------------------------------------------------------ habillage
    def point(self, dr, x, y, a, t, princ=True):
        """point lumineux : halo qui respire, cœur blanc cerclé de turquoise (étiquettes discrètes : plus petit, cœur turquoise)"""
        pul = 1 + .18*np.sin(t*4.2); k = 1 if princ else .7
        for r, al in ((22*pul*k, 26), (15*pul*k, 48), (10*k, 80)):
            dr.ellipse([x - r, y - r, x + r, y + r], fill=(*BLEU_CLAIR, int(al*a)))
        if princ: dr.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(255, 255, 255, int(255*a)), outline=(*CYAN, int(255*a)), width=2)
        else: dr.ellipse([x - 4.5, y - 4.5, x + 4.5, y + 4.5], fill=(*CYAN, int(255*a)), outline=(255, 255, 255, int(200*a)), width=1)

    def etiquette(self, lay, dr, x, y, nom, a_in, a_out, cle, haut, princ, t):
        a = a_in*a_out
        if a <= 0: return
        self.point(dr, x, y, cl(a_in*2.2)*a_out, t, princ)
        up = haut*eo(cl((a_in - .12)/.5))*(.6 + .4*a_out)                 # le trait pousse depuis le point, se rétracte à la sortie
        if up > 1: dr.line([x, y - 8, x, y - up], fill=(255, 255, 255, int(210*a)) if princ else (*BLEU_CLAIR, int(200*a)), width=2)
        b = eo(cl((a_in - .4)/.6))*a_out
        if b <= 0: return
        f = self.f_lab if princ else self.f_sec
        tw = dr.textlength(nom, font=f); pad = 18 if princ else 0; h = 46 if princ else 30
        x0 = min(max(x - tw/2 - pad, 24), W - 24 - tw - 2*pad); y1 = y - up - 6; y0 = y1 - h
        # révélation par masque : le contenu monte dans sa boîte
        M = 14                                                                # marge pour l'ombre portée
        box = Image.new("RGBA", (int(tw + 2*pad + 2*M), h + 2*M), (0, 0, 0, 0)); bd = ImageDraw.Draw(box)
        if princ:
            fond = CYAN if cle == "falise" else NAVY
            om = Image.new("RGBA", box.size, (0, 0, 0, 0))                     # ombre douce, décalée vers le bas
            ImageDraw.Draw(om).rounded_rectangle([M, M + 4, M + tw + 2*pad, M + h + 4], 23, fill=(4, 12, 30, int(120*b)))
            box.alpha_composite(om.filter(ImageFilter.GaussianBlur(6)))
            bd.rounded_rectangle([M, M, M + tw + 2*pad, M + h], 23, fill=(*fond, int(232*b)))
            bd.text((M + pad, M + h/2), nom, font=f, anchor="lm", fill=(255, 255, 255, int(255*b)))
        else:
            bd.text((M + 1, M + h/2 + 1), nom, font=f, anchor="lm", fill=(0, 10, 30, int(150*b)))
            bd.text((M, M + h/2), nom, font=f, anchor="lm", fill=(255, 255, 255, int(235*b)))
        off = (1 - b)*h*.8
        box = box.transform(box.size, Image.AFFINE, (1, 0, 0, 0, 1, -off), Image.BICUBIC)
        lay.alpha_composite(box, (int(round(x0)) - M, int(round(y0)) - M))

    def revele(self, lay, elem, x, y, t0, t, dur=.6):
        """masque de révélation vertical : l'élément monte dans sa boîte (600 ms, ease-out)"""
        e = eo(cl((t - t0)/dur))
        if e <= 0: return
        el = elem.copy(); el.putalpha(el.getchannel("A").point(lambda v: int(v*min(1, e*1.4))))
        el = el.transform(el.size, Image.AFFINE, (1, 0, 0, 0, 1, -(1 - e)*el.height), Image.BICUBIC)
        lay.alpha_composite(el, (int(round(x)), int(round(y))))

    def texte(self, *parts):
        """texte sur une ligne, en un ou plusieurs morceaux (texte, police) : permet de mêler les graisses"""
        d0 = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
        parts = [(q + ((255, 255, 255),))[:3] for q in parts]
        tw = int(sum(d0.textlength(t, font=f) for t, f, _ in parts)) + 8; h = int(max(f.size for _, f, _ in parts)*1.32)
        el = Image.new("RGBA", (tw, h), (0, 0, 0, 0)); dr = ImageDraw.Draw(el); x = 4
        for t, f, c in parts: dr.text((x, h/2), t, font=f, anchor="lm", fill=(*c, 255)); x += d0.textlength(t, font=f)
        return el

    def habiller(self, img, t):
        c = ssm(cl((t - FIN_T)/1.0))
        im = Image.fromarray(img.astype(np.uint8))
        if c > 0:                                       # assombrissement progressif + flou d'arrière-plan pour la lisibilité
            im = Image.blend(im, im.filter(ImageFilter.GaussianBlur(14)), min(1, c*1.2))
        im = im.convert("RGBA")
        lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(lay)
        L = self.labels[self.idx(t)]
        for cle, nom, t0, t1, haut, princ in LIEUX:
            x, y, ok = L[cle]; x, y = cadre((x, y), t)
            a_in, a_out = cl((t - t0)/.75), 1 - ssm(cl((t - t1)/.45))
            if ok and a_in > 0 and a_out > 0 and -200 < x < W + 200 and -100 < y < H + 100:
                self.etiquette(lay, dr, x, y, nom, a_in, a_out, cle, haut, princ, t)
        im = Image.alpha_composite(im, lay)
        if c > 0:
            voile = Image.new("RGBA", im.size, (*BLEU_INST, 0)); va = (np.clip(1 - np.abs(yy[:, :1] - 520)/900, .55, 1)*110*c).astype(np.uint8)
            voile.putalpha(Image.fromarray(np.repeat(va, W, axis=1))); im = Image.alpha_composite(im, voile)
            lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(lay)
            self.revele(lay, self.aplat, (W - self.aplat.width)/2, 186, FIN_T + .25, t, .8)
            self.revele(lay, self.logo, (W - self.logo.width)/2, 236, FIN_T + .5, t)
            ti = self.texte(("Visite ", self.f_t1, BLEU_CLAIR), ("le campus en 3D", self.f_t1)); self.revele(lay, ti, (W - ti.width)/2, 450, FIN_T + .75, t)
            st = self.texte(("et teste ta future formation en jouant", self.f_t2)); self.revele(lay, st, (W - st.width)/2, 578, FIN_T + 1.0, t)
            for k, col in enumerate(ECOLES):              # signature tricolore : trois segments tracés l'un après l'autre
                b = eo(cl((t - FIN_T - 1.25 - k*.12)/.5)); x0 = W/2 - 108 + k*72
                if b > 0: dr.rectangle([x0, 660, x0 + 72*b, 665], fill=(*[int(v) for v in col], 255))
            z = 1 + .025*cl((t - FIN_T)/(DUREE - FIN_T)); k = 1/z           # le carton avance très lentement : jamais figé
            lay = lay.transform(lay.size, Image.AFFINE, (k, 0, W/2*(1 - k), 0, k, H/2*(1 - k)), Image.BICUBIC)
            im = Image.alpha_composite(im, lay)
        return np.asarray(im.convert("RGB"), np.float32)

    def finir(self, img, t, k):
        """grain de pellicule (le même sur le réel et le 3D), puis fondu d'ouverture et fondu au noir de la boucle"""
        g = np.roll(self.grain[k % 6], (int(self.rng.integers(0, H)), int(self.rng.integers(0, W))), (0, 1))
        L = (img @ LUMA)/255
        img = img + (g*(5.0 - 2.6*np.abs(L - .45)))[..., None]
        img = img*sm(cl((t - DEBUT)/.3))*(1 - sm(cl((t - DUREE + .45)/.45)))
        return np.clip(img, 0, 255)

    def image(self, reel, t):
        if t < TS: img = zoomer(reel, zoom(t))
        elif t < TS + TW: img = self.transition(reel, t)
        else: img = self.apres_transition(zoomer(self.trois_d(t), zoom(t)), t)
        if t >= TS: img = self.profondeur(img, t)
        return self.habiller(img, t) if t >= TS else img

    def ecrire(self, sortie, deb=DEBUT, fin=DUREE):
        FF = ffmpeg()
        lec = subprocess.Popen([FF, "-v", "error", "-ss", f"{deb:.3f}", "-i", str(REEL), "-t", f"{max(.1, min(fin, TS + TW + .1) - deb):.3f}",
                                "-vf", f"scale={W}:{H},fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        enc = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                                "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(sortie)],
                               stdin=subprocess.PIPE)
        nb = int(round((fin - deb)*FPS)); t_dep = time.time(); reel = None
        for k in range(nb):
            t = deb + k/FPS
            if t < TS + TW:
                b = lec.stdout.read(W*H*3)
                if len(b) == W*H*3: reel = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32)
            img = self.finir(self.image(reel, t), t, k)
            enc.stdin.write(np.ascontiguousarray(img.astype(np.uint8)).tobytes())
            if k % 120 == 119: print(f"  montage {t:.1f} s / {fin:.1f} s ({time.time() - t_dep:.0f} s)", flush=True)
        lec.kill(); enc.stdin.close(); enc.wait()

def ffmpeg():
    try:
        import imageio_ffmpeg; return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError: return "ffmpeg"

def monter(saison, extrait=None):
    m = Montage(saison)
    if extrait:
        sortie = FILM/f"_accueil-{saison}-extrait.mp4"; m.ecrire(sortie, *extrait); print(f"· extrait : {sortie.relative_to(ROOT)}"); return
    hq, web = FILM/f"_accueil-{saison}.mp4", FILM/f"_accueil-{saison}-web.mp4"
    m.ecrire(hq)
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", str(hq), "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart", "-an", str(web)], check=True)
    print(f"· film : {hq.relative_to(ROOT)} ({hq.stat().st_size/1e6:.0f} Mo) · pour le site : {web.relative_to(ROOT)} ({web.stat().st_size/1e6:.0f} Mo)")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--saison", default="automne", choices=["automne", "hiver", "toutes"])
    ap.add_argument("--montage-seul", action="store_true")
    ap.add_argument("--extrait", nargs=2, type=float, metavar=("DEBUT", "FIN"))
    ap.add_argument("--sans-navigateur", action="store_true")
    a = ap.parse_args()
    if not REEL.exists(): sys.exit(f"vidéo réelle absente : {REEL.relative_to(ROOT)} (voir l'aide : python tools/film/accueil.py -h)")
    for s in (["automne", "hiver"] if a.saison == "toutes" else [a.saison]):
        if not a.montage_seul: tourner(s, not a.sans_navigateur)
        elif not (TRAVAIL/s/"labels.json").exists(): sys.exit(f"pas de tournage {s} à remonter : relancer sans --montage-seul")
        monter(s, a.extrait)
