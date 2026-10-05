/* Audio 100 % généré : musique lofi en continu, carillon de l'horloge, petits effets.
   Rien ne joue tant que le visiteur n'a pas cliqué (règle des navigateurs). */

let ctx = null, master, music, sfx, delay, enabled = false, timer = null;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function init(){
	if(ctx) return;
	const AC = window.AudioContext || window.webkitAudioContext;
	if(!AC) return;
	ctx = new AC();
	const comp = ctx.createDynamicsCompressor();
	comp.threshold.value = -18; comp.ratio.value = 3;
	master = ctx.createGain(); master.gain.value = 0;
	master.connect(comp).connect(ctx.destination);
	// bus musique : filtre « cassette » + écho léger
	const tape = ctx.createBiquadFilter(); tape.type = "lowpass"; tape.frequency.value = 2600; tape.Q.value = .4;
	music = ctx.createGain(); music.gain.value = .55;
	music.connect(tape).connect(master);
	delay = ctx.createDelay(1); delay.delayTime.value = .38;
	const fb = ctx.createGain(); fb.gain.value = .3;
	const wet = ctx.createGain(); wet.gain.value = .25;
	delay.connect(fb).connect(delay); delay.connect(wet).connect(music);
	sfx = ctx.createGain(); sfx.gain.value = .7; sfx.connect(master);
	amb = ctx.createGain(); amb.gain.value = .9; amb.connect(master);
	vinyl();
	wind();
}

/* ---------- Ambiance : vent, oiseaux le jour, grillons la nuit ---------- */
let amb, windGain, ambState = { night:false, snowy:false, outside:true }, ambTimer = null;
function wind(){
	const src = ctx.createBufferSource(); src.buffer = noise(); src.loop = true;
	const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420;
	windGain = ctx.createGain(); windGain.gain.value = .012;
	const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .07; lfoG.gain.value = .008;
	lfo.connect(lfoG).connect(windGain.gain); lfo.start();
	src.connect(lp).connect(windGain).connect(amb); src.start();
}
function chirp(t, f, vol){
	const o = ctx.createOscillator(), g = ctx.createGain();
	o.type = "sine";
	o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f*1.45, t + .045); o.frequency.exponentialRampToValueAtTime(f*.85, t + .1);
	g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0004, t + .12);
	o.connect(g).connect(amb); o.start(t); o.stop(t + .14);
}
function cricket(t){
	for(let k=0;k<3;k++){
		const o = ctx.createOscillator(), g = ctx.createGain(), tt = t + k*.055;
		o.frequency.value = 4300; o.type = "triangle";
		g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(.006, tt + .006); g.gain.exponentialRampToValueAtTime(.0003, tt + .04);
		o.connect(g).connect(amb); o.start(tt); o.stop(tt + .05);
	}
}
function ambTick(){
	if(!ctx || !enabled) return;
	const t = ctx.currentTime + .05, S = ambState;
	windGain.gain.setTargetAtTime(S.outside ? (S.snowy ? .03 : .012) : .002, ctx.currentTime, 1.5);
	if(!S.outside || S.snowy) return;
	if(!S.night && Math.random() < .22){
		const f = 2300 + Math.random()*1900, n = 2 + Math.floor(Math.random()*5);
		for(let i=0;i<n;i++) chirp(t + i*(.11 + Math.random()*.06), f*(1 + (Math.random()-.5)*.15), .012 + Math.random()*.01);
	}
	if(S.night && Math.random() < .5) cricket(t + Math.random()*.3);
}

/* Bruit de vinyle : souffle + craquements épars */
function vinyl(){
	const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
	for(let i=0;i<len;i++){
		d[i] = (Math.random()*2-1) * .12;
		if(Math.random() < .00035) d[i] += (Math.random() < .5 ? -1 : 1) * (.5 + Math.random()*.5);
	}
	const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
	const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = .5;
	const g = ctx.createGain(); g.gain.value = .09;
	src.connect(bp).connect(g).connect(music); src.start();
}
let noiseBuf = null;
function noise(){
	if(noiseBuf) return noiseBuf;
	noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
	const d = noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
	return noiseBuf;
}

/* ---------- Instruments ---------- */
function ep(m, t, dur, vel){
	const f = mtof(m), g = ctx.createGain();
	const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
	o1.type = "sine"; o1.frequency.value = f; o1.detune.value = (Math.random()-.5)*8;
	o2.type = "triangle"; o2.frequency.value = f*2; const g2 = ctx.createGain(); g2.gain.value = .12;
	g.gain.setValueAtTime(0, t);
	g.gain.linearRampToValueAtTime(vel, t + .018);
	g.gain.exponentialRampToValueAtTime(vel*.35, t + .9);
	g.gain.exponentialRampToValueAtTime(.0005, t + dur);
	o1.connect(g); o2.connect(g2).connect(g); g.connect(music);
	o1.start(t); o2.start(t); o1.stop(t + dur + .05); o2.stop(t + dur + .05);
}
function bass(m, t, dur){
	const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
	o.type = "triangle"; o.frequency.value = mtof(m);
	lp.type = "lowpass"; lp.frequency.value = 420;
	g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + dur);
	o.connect(lp).connect(g).connect(music); o.start(t); o.stop(t + dur + .05);
}
function kick(t){
	const o = ctx.createOscillator(), g = ctx.createGain();
	o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
	g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .32);
	o.connect(g).connect(music); o.start(t); o.stop(t + .35);
}
function snare(t){
	const n = ctx.createBufferSource(); n.buffer = noise();
	const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1700; bp.Q.value = .8;
	const g = ctx.createGain(); g.gain.setValueAtTime(.16, t); g.gain.exponentialRampToValueAtTime(.001, t + .18);
	n.connect(bp).connect(g).connect(music); n.start(t); n.stop(t + .2);
}
function hat(t, v){
	const n = ctx.createBufferSource(); n.buffer = noise();
	const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
	const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .05);
	n.connect(hp).connect(g).connect(music); n.start(t); n.stop(t + .06);
}
function lead(m, t, dur){
	const o = ctx.createOscillator(), g = ctx.createGain();
	o.type = "sine"; o.frequency.value = mtof(m);
	g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .03); g.gain.exponentialRampToValueAtTime(.001, t + dur);
	o.connect(g); g.connect(music); g.connect(delay); o.start(t); o.stop(t + dur + .05);
}

/* ---------- Séquenceur ---------- */
const BPM = 74, S16 = 60 / BPM / 4;
const PROGS = [
	[ { c:[53,57,60,64,67], b:41 }, { c:[52,55,59,62], b:40 }, { c:[50,53,57,60,64], b:38 }, { c:[48,52,55,59,62], b:36 } ],
	[ { c:[50,53,57,60,64], b:38 }, { c:[53,57,59,64], b:43 }, { c:[52,55,59,62], b:36 }, { c:[48,52,57,60], b:45 } ]
];
const PENTA = [72,74,76,79,81,84];
let step = 0, bar = 0, nextT = 0;
function scheduleStep(s, t){
	const prog = PROGS[Math.floor(bar/8) % 2], ch = prog[bar % 4];
	const swing = (s % 2) ? S16*.16 : 0;
	const tt = t + swing;
	// accords
	if(s === 0) ch.c.forEach((m,i) => ep(m, tt + i*.016, S16*14, .055 + Math.random()*.02));
	if(s === 10 && Math.random() < .45) ch.c.slice(1).forEach((m,i) => ep(m, tt + i*.012, S16*5, .035));
	// basse
	if(s === 0) bass(ch.b, tt, S16*7);
	if(s === 11 && Math.random() < .6) bass(ch.b + (Math.random() < .5 ? 7 : 12), tt, S16*3);
	// batterie feutrée
	if(s === 0 || (s === 10 && Math.random() < .5) || s === 8 && Math.random() < .25) kick(tt);
	if(s === 4 || s === 12) snare(tt);
	if(s % 2 === 0) hat(tt, .025 + Math.random()*.03);
	// petite mélodie de temps en temps
	if(bar % 2 === 1 && s % 2 === 0 && Math.random() < .2) lead(PENTA[Math.floor(Math.random()*PENTA.length)], tt, S16*3);
}
function tick(){
	if(!ctx) return;
	while(nextT < ctx.currentTime + .15){
		scheduleStep(step, nextT);
		nextT += S16; step = (step + 1) % 16;
		if(step === 0) bar++;
	}
}

/* ---------- Carillon & effets ---------- */
function bell(m, t, dur=3.2, vol=.35){
	const f = mtof(m);
	[[.5,.35],[1,1],[1.183,.55],[1.506,.35],[2,.45],[2.514,.22],[3.011,.12]].forEach(([r,a], i) => {
		const o = ctx.createOscillator(), g = ctx.createGain();
		o.frequency.value = f*r;
		g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol*a*.25, t + .005);
		g.gain.exponentialRampToValueAtTime(.0005, t + dur/(1 + i*.35));
		o.connect(g).connect(sfx); o.start(t); o.stop(t + dur);
	});
}
const SFX = {
	chime(){ const t = ctx.currentTime + .05; [68,66,64,59].forEach((m,i) => bell(m, t + i*.62)); [52,52].forEach((m,i) => bell(m, t + 3 + i*1.4, 4, .45)); },
	pop(){ const t = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(880, t + .08); g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .15); o.connect(g).connect(sfx); o.start(t); o.stop(t + .16); },
	stamp(){ const t = ctx.currentTime; bell(76, t, 1.2, .25); bell(83, t + .12, 1.4, .2); },
	swipe(){ const t = ctx.currentTime, n = ctx.createBufferSource(); n.buffer = noise(); const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(2400, t + .18); const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.12, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + .22); n.connect(bp).connect(g).connect(sfx); n.start(t); n.stop(t + .25); },
	good(){ const t = ctx.currentTime; [72,76,79].forEach((m,i) => bell(m, t + i*.08, 1.2, .18)); },
	bad(){ const t = ctx.currentTime; [64,61].forEach((m,i) => bell(m, t + i*.14, 1, .16)); },
	win(){ const t = ctx.currentTime; [72,76,79,84,88].forEach((m,i) => bell(m, t + i*.11, 2, .2)); }
};

export const Audio = {
	get on(){ return enabled; },
	/* À appeler dans un clic. */
	enable(){
		init(); if(!ctx) return;
		ctx.resume();
		enabled = true;
		master.gain.cancelScheduledValues(ctx.currentTime);
		master.gain.setTargetAtTime(.8, ctx.currentTime, .8);
		if(!timer){ nextT = ctx.currentTime + .1; timer = setInterval(tick, 25); }
		if(!ambTimer) ambTimer = setInterval(ambTick, 450);
	},
	disable(){
		enabled = false;
		if(!ctx) return;
		master.gain.setTargetAtTime(0, ctx.currentTime, .25);
		setTimeout(() => { if(!enabled && timer){ clearInterval(timer); timer = null; } }, 1200);
	},
	play(name){ if(enabled && ctx && SFX[name]) SFX[name](); },
	setAmbience(st){ Object.assign(ambState, st); }
};
document.addEventListener("visibilitychange", () => {
	if(!ctx || !enabled) return;
	if(document.hidden) ctx.suspend(); else ctx.resume();
});
