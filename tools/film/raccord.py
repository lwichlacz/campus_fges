"""Recolle dans le film les plans retournés par F.retoucher() (tools/film/_plan-<i>.mp4, liste dans _plans.json) :
la vidéo est réencodée d'un bloc, le son du film d'origine est gardé tel quel.
Usage : python tools/film/raccord.py   (ffmpeg fourni par le paquet imageio-ffmpeg : pip install imageio-ffmpeg)
Résultat : docs/validation-web/media/campus-3d.mp4 (l'ancien film est gardé en campus-3d-avant.mp4), puis python docs/validation-web/build.py"""
import json, pathlib, shutil, subprocess, imageio_ffmpeg
ROOT = pathlib.Path(__file__).resolve().parents[2]
FILM = ROOT / "docs/validation-web/media/campus-3d.mp4"
AVANT = FILM.with_name("campus-3d-avant.mp4")
liste = json.loads((ROOT / "tools/film/_plans.json").read_text(encoding="utf-8"))
plans = sorted(liste["plans"], key=lambda p: p["debut"])
if not AVANT.exists(): shutil.copyfile(FILM, AVANT)
# morceaux dans l'ordre : film d'origine entre les plans, plans retournés à leur place
entrees, morceaux, t = ["-i", str(AVANT)], [], 0.0
for k, p in enumerate(plans, start=1):
	entrees += ["-i", str(ROOT / p["fichier"])]
	if p["debut"] > t: morceaux.append(f"[0:v]trim={t}:{p['debut']},setpts=PTS-STARTPTS[o{k}];"); morceaux.append(f"[o{k}]")
	morceaux.append(f"[{k}:v]setpts=PTS-STARTPTS[p{k}];"); morceaux.append(f"[p{k}]")
	t = p["fin"]
morceaux.append(f"[0:v]trim=start={t},setpts=PTS-STARTPTS[fin];"); morceaux.append("[fin]")
filtres = "".join(m for m in morceaux if m.endswith(";"))
etiquettes = "".join(m for m in morceaux if not m.endswith(";"))
n = etiquettes.count("[")
graphe = f"{filtres}{etiquettes}concat=n={n}:v=1:a=0,fps={liste['fps']}[v]"
cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", *entrees, "-filter_complex", graphe,
	"-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
	"-c:a", "copy", "-movflags", "+faststart", str(FILM)]
subprocess.run(cmd, check=True)
print("écrit", FILM.relative_to(ROOT), f"({FILM.stat().st_size // 1_000_000} Mo) ·", len(plans), "plan(s) remplacé(s)")
