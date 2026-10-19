# Bande son de la vidéo : musique douce synthétisée (sans voix off : les sous-titres portent le texte)
import wave, array, math, sys
SR = 24000; D = 52.0; N = int(SR*D)
STARTS = [0.5, 5.9, 14.0, 23.4, 33.6, 40.3, 47.6]
voice = array.array("f", [0.0])*N
for i, t0 in enumerate(STARTS if "--voix" in sys.argv else [], 1):
    w = wave.open(f"s{i}.wav"); assert w.getframerate() == SR and w.getsampwidth() == 2
    a = array.array("h", w.readframes(w.getnframes())); w.close()
    o = int(t0*SR)
    for j, v in enumerate(a):
        if o + j < N: voice[o + j] += v/32768
# présence de la voix, lissée, pour baisser la musique dessous
env = array.array("f", [0.0])*N; e = 0.0
for j in range(N):
    target = 1.0 if abs(voice[j]) > .02 else 0.0
    e += (target - e)*(0.002 if target > e else 0.00006); env[j] = e
nf = lambda m: 440*2**((m - 69)/12)
CH = [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 52]]   # Cmaj7, Am7, Fmaj7, G6
BAR = 2.5
music = array.array("f", [0.0])*N
for j in range(N):
    t = j/SR; b = int(t/BAR); ch = CH[b % 4]; tb = t - b*BAR
    s = 0.0
    att = min(1, tb/.7) * (1 - max(0, tb - (BAR - .4))/.4*.5)
    for m in ch: f = nf(m + 12); s += .045*att*(math.sin(2*math.pi*f*t) + .25*math.sin(4*math.pi*f*t))
    s += .07*min(1, tb/.05)*math.exp(-tb*1.2)*math.sin(2*math.pi*nf(ch[0] - 12)*t)          # basse
    k = int(tb/.3125); ta = tb - k*.3125
    if k < 8:
        m = ch[[0, 2, 1, 3, 2, 1, 3, 2][k]] + 24
        s += .05*math.exp(-ta*7)*(math.sin(2*math.pi*nf(m)*t) + .2*math.sin(6*math.pi*nf(m)*t))   # arpège
    fade = min(1, t/1.5, (D - t)/2.5)
    music[j] = s*fade*(1 - .62*env[j])
out = array.array("h", [0])*N
for j in range(N):
    v = .92*voice[j] + 1.6*music[j]
    out[j] = int(max(-1, min(1, v))*32767)
w = wave.open("bande-son.wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print("ok")
