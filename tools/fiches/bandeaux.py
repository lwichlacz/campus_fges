"""
Bandeaux « Campus 3D » des fiches formation de fges.fr : un bloc HTML par formation qui a un mini-jeu,
à coller dans le widget HTML de la fiche (Elementor), juste sous les chiffres clés.

Lit js/data.js (via tools/wordpress/build.py) et écrit :
  docs/bandeaux/<formation>.html   le bloc à coller (CSS compris, isolé par son id)
  docs/bandeaux/index.html         aperçu de tous les bandeaux, avec un bouton « Copier le code » pour chacun

À chaque nouveau mini-jeu : cadrage dans tools/fiches/captures.js → vignette img/fiches/<jeu>.jpg,
puis  python tools/fiches/bandeaux.py   (le vérificateur refuse un jeu sans vignette ni bandeau).

Usage : python tools/fiches/bandeaux.py   (Node.js nécessaire)
"""
import html, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "wordpress"))
from build import formations_json  # noqa: E402

CAMPUS = "https://lwichlacz.github.io/campus_fges/"
OUT = ROOT / "docs" / "bandeaux"

# phrase courte quand l'accroche du jeu est trop longue pour un bandeau (une ligne et demie au plus)
ACCROCHE = {
    "info": "Un week-end de game jam avec ton équipe : dessine un niveau, programme le héros en Python, mets les scores en ligne, puis passe devant le jury.",
    "dgp": "Un jeu de cartes chez le notaire : conseille la famille Deslaurier de 1959 à aujourd'hui, du contrat de mariage à la SCI.",
    "mbif": "Dans ton agence, cinq clients qui sont d'abord des personnes : écoute, crédit, confiance… et une PME à accompagner pendant huit ans.",
    "dmb": "En anglais, comme le master : du dossier d'un patient à l'étude d'une cohorte, du séquençage au compte rendu clinique.",
    "ebmd": "Fais décoller le site d'une jeune marque lilloise : tunnel de commande, référencement, publicité… puis tiens le choc du Black Friday.",
}


# couleurs de chaque école, relevées sur ses fiches de fges.fr (le bleu marine #0f3168 est commun aux trois)
# acc : bordures, fond du bouton au survol · txt : petit texte et italique du titre (lisible sur fond clair)
# pale : fond du bandeau · ombre : halo au survol · survol : texte du bouton au survol
# entete : texte du bouton « Tester en 3D » du bandeau principal au survol (bleu marine sur turquoise, comme la fiche SV)
ECOLES = {
    "FGES": {"acc": "#21b7cb", "txt": "#21b7cb", "pale": "#f5fbfd", "ombre": "rgba(33, 183, 203, .14)", "survol": "#ffffff", "entete": "#0f3168"},
    "ISEA": {"acc": "#872850", "txt": "#872850", "pale": "#fbf5f8", "ombre": "rgba(135, 40, 80, .14)", "survol": "#ffffff", "entete": "#ffffff"},
    "EDN":  {"acc": "#cb971a", "txt": "#96711a", "pale": "#fdf8ec", "ombre": "rgba(203, 151, 26, .16)", "survol": "#0f3168", "entete": "#0f3168"},
}


def sujet(f):
    """« en Sciences de la Vie », « en Master Droit & Gestion du Patrimoine »"""
    n = f["name"]
    return n[len("Licence "):] if n.startswith("Licence ") else n


def bloc(f):
    g, fid = f["game"], f["id"]
    sid = f"c3d-{fid}"
    lien = f"{CAMPUS}?jeu={fid}&amp;utm_source=fges.fr&amp;utm_medium=fiche&amp;utm_campaign={fid}"
    texte = ACCROCHE.get(fid, g["pitch"])
    e = html.escape
    c = ECOLES.get(f["school"], ECOLES["FGES"])
    return f"""<!-- ══════ CAMPUS 3D · {e(f['name'])} ({f['school']}) — bandeau à coller sous les chiffres clés de la fiche ══════
     Généré par tools/fiches/bandeaux.py : ne pas modifier à la main, relancer le script. -->
<section id="{sid}" style="all:initial;display:block;background-color:#ffffff;">
  <style>
    #{sid} *, #{sid} *::before, #{sid} *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    #{sid} .c3-inner {{ --c3-acc: {c['acc']}; --c3-txt: {c['txt']}; --c3-pale: {c['pale']}; --c3-ombre: {c['ombre']}; --c3-survol: {c['survol']}; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a2a3a; -webkit-font-smoothing: antialiased; max-width: 1260px; margin: 0 auto; padding: 22px 24px 8px; width: 100%; }}
    #{sid} .c3-strip {{ display: flex; align-items: center; gap: 22px; padding: 12px 22px 12px 12px; border: 1px solid #dde7f0; border-radius: 12px; background: var(--c3-pale); text-decoration: none; color: inherit; transition: border-color .2s, box-shadow .2s; }}
    #{sid} .c3-strip:hover {{ border-color: var(--c3-acc); box-shadow: 0 8px 24px var(--c3-ombre); }}
    #{sid} .c3-strip:focus-visible {{ outline: 3px solid var(--c3-acc); outline-offset: 3px; }}
    #{sid} .c3-thumb {{ flex: none; width: 150px; aspect-ratio: 1200 / 783; border-radius: 8px; overflow: hidden; background: #cfeaf0; }}
    #{sid} .c3-thumb img {{ width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s; }}
    #{sid} .c3-strip:hover .c3-thumb img {{ transform: scale(1.06); }}
    #{sid} .c3-txt {{ flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }}
    #{sid} .c3-kicker {{ font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--c3-txt); }}
    #{sid} .c3-title {{ font-family: 'Tiempos Headline', 'Georgia', 'Times New Roman', serif; font-size: 21px; font-weight: 400; line-height: 1.2; color: #0f3168; letter-spacing: -.01em; }}
    #{sid} .c3-title em {{ font-style: italic; color: var(--c3-txt); }}
    #{sid} .c3-text {{ font-size: 13px; line-height: 1.5; font-weight: 300; color: #2d3a4a; }}
    #{sid} .c3-btn {{ flex: none; display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; font-size: 12.5px; font-weight: 700; letter-spacing: .03em; border-radius: 6px; border: 1px solid var(--c3-acc); color: #0f3168; background: #ffffff; transition: background .2s, color .2s; }}
    #{sid} .c3-btn svg {{ width: 14px; height: 14px; fill: currentColor; }}
    #{sid} .c3-strip:hover .c3-btn {{ background: var(--c3-acc); color: var(--c3-survol); }}
    @media (max-width: 760px) {{
      #{sid} .c3-strip {{ flex-wrap: wrap; gap: 14px; padding: 12px; }}
      #{sid} .c3-thumb {{ width: 110px; }}
      #{sid} .c3-txt {{ flex-basis: calc(100% - 124px); }}
      #{sid} .c3-title {{ font-size: 18px; }}
      #{sid} .c3-text {{ display: none; }}
      #{sid} .c3-btn {{ flex: 1 1 100%; justify-content: center; }}
    }}
    @media (max-width: 560px) {{ #{sid} .c3-inner {{ padding: 18px 16px 8px; }} }}
    @media (prefers-reduced-motion: reduce) {{ #{sid} * {{ transition: none !important; }} }}
  </style>

  <div class="c3-inner">
    <a class="c3-strip" href="{lien}" target="_blank" rel="noopener">
      <span class="c3-thumb">
        <img src="{CAMPUS}img/fiches/{g['id']}.jpg" width="1200" height="783"
             alt="{e(g['title'])}, dans le campus FGES en 3D" loading="lazy">
      </span>
      <span class="c3-txt">
        <span class="c3-kicker">Campus 3D · {e(g['title'])} · {e(g['dur'])}</span>
        <span class="c3-title">Avant de candidater, <em>vis une journée</em> en {e(sujet(f))}</span>
        <span class="c3-text">{e(texte)} Gratuit, sans inscription.</span>
      </span>
      <span class="c3-btn"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z"/></svg>Lancer la mission</span>
    </a>
  </div>
</section>
"""


def bouton(f):
    """Bouton « Tester la licence en 3D » à ajouter dans la rangée de boutons du bandeau principal de la fiche
    (div .lh-btns). Il porte son propre style, aux couleurs de l'école, pour marcher quel que soit l'id du bandeau."""
    g, fid = f["game"], f["id"]
    k = f"c3d-btn-{fid}"
    c = ECOLES.get(f["school"], ECOLES["FGES"])
    quoi = "le master" if f.get("level") == "M" else "la licence"
    lien = f"{CAMPUS}?jeu={fid}&amp;utm_source=fges.fr&amp;utm_medium=fiche-entete&amp;utm_campaign={fid}"
    return f"""<!-- CAMPUS 3D · bouton à coller dans le bandeau principal, à la fin de <div class="lh-btns"> (après « Contactez-nous ») -->
<style>
  .lh-btns a.{k} {{ display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 12.5px; font-weight: 700; letter-spacing: .03em; text-decoration: none; border-radius: 6px; border: 1px solid #0f3168; background: #0f3168 !important; color: #ffffff !important; transition: background .2s, transform .15s, color .2s, border-color .2s; }}
  .lh-btns a.{k} svg {{ width: 12px; height: 12px; fill: currentColor; }}
  .lh-btns a.{k}:hover {{ background: {c['acc']} !important; border-color: {c['acc']}; color: {c['entete']} !important; transform: translateY(-2px); }}
  .lh-btns a.{k}:focus-visible {{ outline: 3px solid {c['acc']}; outline-offset: 2px; }}
  @media (max-width: 760px) {{ .lh-btns a.{k} {{ justify-content: center; padding: 13px 18px; }} }}
</style>
<a href="{lien}" target="_blank" rel="noopener" class="lh-btn {k}">
  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z"/></svg>Tester {quoi} en 3D · {html.escape(g['dur'])}
</a>
"""


def apercu(blocs):
    e = html.escape
    cartes = "".join(
        f"""<article><header><h2>{e(f['name'])}</h2><span>{e(f['game']['title'])} · {f['school']}</span></header>
<h3>1. Bouton du bandeau principal <button type="button" data-c="btn-{f['id']}">Copier le code du bouton</button></h3>
<div class="lh-btns demo"><span class="faux">Brochure</span><span class="faux">Contactez-nous</span>{bt}</div>
<textarea id="btn-{f['id']}" readonly hidden>{e(bt)}</textarea>
<h3>2. Bandeau sous les chiffres clés <button type="button" data-c="code-{f['id']}">Copier le code du bandeau</button></h3>
{b}<textarea id="code-{f['id']}" readonly hidden>{e(b)}</textarea></article>"""
        for f, b, bt in blocs)
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bandeaux Campus 3D</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
body{{margin:0;background:#eef3f7;font:14px/1.5 Inter,system-ui,sans-serif;color:#1a2a3a}}
main{{max-width:1300px;margin:0 auto;padding:28px 16px 60px}}
h1{{font:400 30px Georgia,serif;color:#0f3168;margin:0 0 4px}} p.m{{margin:0 0 24px;color:#5d6779}}
article{{background:#fff;border-radius:12px;padding:14px 0 18px;margin-bottom:18px}}
article header{{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;padding:0 24px}}
article h2{{margin:0;font-size:15px;color:#0f3168}} article header span{{color:#5d6779;flex:1}}
article button{{border:0;border-radius:6px;background:#0f3168;color:#fff;font:600 12px Inter,sans-serif;padding:8px 14px;cursor:pointer}}
article button:focus-visible{{outline:3px solid #21b7cb;outline-offset:2px}}
article h3{{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:16px 24px 0;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#5d6779}}
.demo{{display:flex;flex-wrap:wrap;gap:10px;margin:12px 24px 0}}
.faux{{display:inline-flex;align-items:center;padding:12px 22px;font:700 12.5px Inter,sans-serif;border-radius:6px;border:1px solid #c9d4df;color:#8a95a5}}
</style></head><body><main>
<h1>Bandeaux Campus 3D</h1>
<p class="m">Pour chaque fiche formation, deux codes : <b>1.</b> le bouton « Tester en 3D », à ajouter à la fin de la rangée de boutons du bandeau principal (<code>&lt;div class="lh-btns"&gt;</code>) ;
<b>2.</b> le bandeau, à coller dans le même widget HTML, juste sous les chiffres clés. Ne pas toucher au widget des onglets. Généré par tools/fiches/bandeaux.py.</p>
{cartes}
</main>
<script>
document.querySelectorAll("button[data-c]").forEach(b => b.addEventListener("click", () => {{
  const t = document.getElementById(b.dataset.c), txt = b.textContent;
  const ok = () => {{ b.textContent = "Copié ✓"; setTimeout(() => b.textContent = txt, 1600); }};
  (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(ok, () => {{ t.hidden = false; t.select(); document.execCommand("copy"); t.hidden = true; ok(); }});
}}));
</script></body></html>
"""


if __name__ == "__main__":
    data = json.loads(formations_json())["formations"]
    avec = [f for f in data if f["game"]]
    manque = [f["game"]["id"] for f in avec if not (ROOT / "img" / "fiches" / f"{f['game']['id']}.jpg").exists()]
    if manque:
        sys.exit("Vignette manquante : " + ", ".join(f"img/fiches/{m}.jpg" for m in manque) + " (voir tools/fiches/captures.js)")
    OUT.mkdir(parents=True, exist_ok=True)
    blocs = []
    for f in avec:
        b, bt = bloc(f), bouton(f)
        (OUT / f"{f['id']}.html").write_text(b, encoding="utf-8", newline="\n")
        (OUT / f"{f['id']}-bouton.html").write_text(bt, encoding="utf-8", newline="\n")
        blocs.append((f, b, bt))
    (OUT / "index.html").write_text(apercu(blocs), encoding="utf-8", newline="\n")
    print(f"{len(blocs)} bandeaux et boutons dans docs/bandeaux/ (aperçu : docs/bandeaux/index.html)")
