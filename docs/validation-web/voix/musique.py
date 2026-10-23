# Musique du film de présentation (132 s, 80 bpm : une mesure = 3 s), synthétisée, calée sur le montage de tools/film/film.js.
#   0-9    ouverture : nappe qui s'ouvre
#   9-21   la promesse : accords de piano
#   21-45  le campus : rythme léger (grosse caisse, charleston), basse
#   45-99  les formations : arpège en croches, plus d'énergie
#   99-114 les mini-jeux : montée, toute l'orchestration
#   114-123 la relecture : retour au calme
#   123-132 signature : grand accord final, fondu
# Montées de bruit blanc avant 21, 45 et 99 s. Usage : python3 musique.py  →  musique-film.wav
import wave, array, math, random
SR = 24000; D = 132.0; N = int(SR*D); BAR = 3.0; BEAT = .75
random.seed(7)
nf = lambda m: 440*2**((m - 69)/12)
# do majeur : do · sol · la mineur · fa (une mesure chacun)
CH = [[48, 52, 55, 60, 64], [43, 50, 55, 59, 62], [45, 52, 57, 60, 64], [41, 48, 53, 57, 60]]
def sec(t):
    for a, b, name in [(0, 9, "ouv"), (9, 21, "pro"), (21, 45, "cam"), (45, 99, "for"), (99, 114, "jeu"), (114, 123, "rel"), (123, 132, "fin")]:
        if a <= t < b: return name
    return "fin"
def smooth(x): x = max(0., min(1., x)); return x*x*(3 - 2*x)
out = array.array("f", [0.])*N
noise = [random.uniform(-1, 1) for _ in range(4096)]
for j in range(N):
    t = j/SR; s = sec(t); b = int(t/BAR); tb = t - b*BAR; ch = CH[b % 4]
    k = int(tb/BEAT); tk = tb - k*BEAT
    v = 0.
    # nappe : notes de l'accord, deux sinus légèrement désaccordés, attaque lente
    pad = (.5 if s in ("ouv", "rel") else .38 if s != "fin" else .6)*smooth(tb/1.2)*(1 - .35*smooth((tb - 2.4)/.6))
    for m in ch[:4]:
        f = nf(m + 12); v += .022*pad*(math.sin(6.2832*f*t) + math.sin(6.2832*f*1.003*t))
    # piano : l'accord frappé en début de mesure (à partir de la promesse)
    if s in ("pro", "cam", "for", "jeu", "rel"):
        env = math.exp(-tb*1.6)
        for m in ch[1:]:
            f = nf(m + 12); v += .03*env*(math.sin(6.2832*f*t) + .35*math.sin(12.566*f*t)*math.exp(-tb*4) + .12*math.sin(18.85*f*t)*math.exp(-tb*6))
    # basse
    if s in ("cam", "for", "jeu"):
        f = nf(ch[0] - 12); v += .085*min(1, tk/.02)*math.exp(-tk*2.2)*math.tanh(1.6*math.sin(6.2832*f*t))
    # grosse caisse (temps 1 et 3) et charleston (contretemps)
    if s in ("cam", "for", "jeu"):
        if k in (0, 2):
            ph = 6.2832*(48*tk + 60*(1 - math.exp(-tk*30))/30); v += .16*math.exp(-tk*9)*math.sin(ph)
        th = (tb + BEAT/2) % BEAT
        if s != "cam" or k in (1, 3):
            v += .025*math.exp(-th*45)*noise[j % 4096]
    # arpège en croches (formations, mini-jeux)
    if s in ("for", "jeu"):
        q = int(tb/(BEAT/2)); tq = tb - q*BEAT/2
        m = ch[[0, 2, 4, 2, 1, 3, 4, 3][q % 8]] + 24
        g = .042 if s == "for" else .05
        v += g*math.exp(-tq*8)*(math.sin(6.2832*nf(m)*t) + .25*math.sin(12.566*nf(m)*t))
    # montées avant les grandes sections
    for at in (21, 45, 99):
        if at - 1.6 < t < at:
            u = (t - (at - 1.6))/1.6; v += .07*u*u*noise[(j*7) % 4096]
        if at <= t < at + .08: v += .12*math.exp(-(t - at)*40)*noise[(j*3) % 4096]
    # final : accord tenu
    if s == "fin":
        u = t - 123
        for m in CH[0]:
            f = nf(m + 12); v += .03*smooth(u/.8)*(math.sin(6.2832*f*t) + .3*math.sin(12.566*f*t))*math.exp(-u*.25)
    fade = min(1., t/1.5, (D - t)/3.)
    out[j] = v*fade
peak = max(abs(x) for x in out) or 1
w = wave.open("musique-film.wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(array.array("h", (int(x/peak*.89*32767) for x in out)).tobytes()); w.close()
print("musique-film.wav", D, "s · crête normalisée")
