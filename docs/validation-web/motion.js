/* Vidéo de présentation en motion design (52 s, musique : media/bande-son.mp4, refaite par voix/voix.sh ; sous-titrée), dessinée en direct dans un canvas 1280×720.
   createMotion(canvas, { games, current, accent, images:{ campus, logo } }) → { play, pause, seek, toggle, t, duration, playing }
   Six scènes : titre · « choisir sur un intitulé ? » · le campus en 3D · un mini-jeu par formation · où il sert · pourquoi vous. */
function createMotion(canvas, o){
	const W = 1280, H = 720, D = 52;
	const NAVY = "#13254a", NAVY2 = "#0b1730", CYAN = "#21b6ce", CREAM = "#f7f2e9", WHITE = "#ffffff", ACC = o.accent || CYAN, INK = o.accentInk || NAVY;
	const ctx = canvas.getContext("2d");
	const k = Math.min(2, window.devicePixelRatio || 1);
	canvas.width = W*k; canvas.height = H*k;
	const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
	const seg = (t, a, b) => clamp((t - a)/(b - a));
	const out = x => 1 - Math.pow(1 - x, 3);
	const inOut = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
	const back = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.4*Math.pow(x - 1, 3) + 1.4*Math.pow(x - 1, 2);
	const life = (t, a, b, fi = .5, fo = .5) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));
	const DISP = "Fraunces, Georgia, serif", BODY = "'Public Sans', system-ui, sans-serif";
	const font = (w, s, f = BODY) => ctx.font = `${w} ${s}px ${f}`;
	function rr(x, y, w, h, r){ ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
	function text(s, x, y, { size = 32, weight = 600, fam = BODY, color = WHITE, align = "center", a = 1, dy = 0 } = {}){
		if(a <= 0) return;
		ctx.save(); ctx.globalAlpha *= a; font(weight, size, fam); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle";
		ctx.fillText(s, x, y + dy); ctx.restore();
	}
	function wrap(s, maxW, size, weight = 600, fam = BODY){
		font(weight, size, fam); const words = s.split(" "), lines = []; let line = "";
		for(const w of words){ const tryL = line ? line + " " + w : w; if(ctx.measureText(tryL).width > maxW && line){ lines.push(line); line = w; } else line = tryL; }
		if(line) lines.push(line); return lines;
	}
	function caption(s, a){
		if(a <= 0 || !s || !started) return;          // pas de sous-titre sur l'image d'attente, sous le bouton de lecture
		const lines = wrap(s, 1000, 28, 500);
		const h = 24 + lines.length*38;
		ctx.save(); ctx.globalAlpha = a;
		rr(W/2 - 560, H - 34 - h, 1120, h, 16); ctx.fillStyle = "rgba(6,12,28,.72)"; ctx.fill();
		lines.forEach((l, i) => text(l, W/2, H - 34 - h + 12 + 19 + i*38, { size:28, weight:500 }));
		ctx.restore();
	}
	function background(t){
		const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, NAVY); g.addColorStop(1, NAVY2);
		ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
		ctx.fillStyle = "rgba(33,182,206,.10)";
		const off = (t*12) % 40;
		for(let x = -40; x < W + 40; x += 40) for(let y = -40; y < H + 40; y += 40){ ctx.beginPath(); ctx.arc(x + off, y + off*.5, 1.6, 0, 7); ctx.fill(); }
	}
	function pin(x, y, label, p, color = CYAN){
		if(p <= 0) return;
		const yy = y - (1 - out(p))*60;
		ctx.save(); ctx.globalAlpha = clamp(p*2);
		ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, yy - 34, 16, Math.PI*.85, Math.PI*2.15); ctx.lineTo(x, yy); ctx.closePath(); ctx.fill();
		ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(x, yy - 34, 6, 0, 7); ctx.fill();
		font(700, 22); const w = ctx.measureText(label).width + 28;
		rr(x + 22, yy - 52, w, 38, 10); ctx.fillStyle = WHITE; ctx.fill();
		text(label, x + 36, yy - 33, { size:22, weight:700, color:NAVY, align:"left" });
		ctx.restore();
	}
	const NAMES = ["Licence Gestion", "Licence Sciences de la Vie", "Master Data Management in Biosciences", "Licence Sciences pour l'Ingénieur", "Licence Comptabilité-Finance-Audit", "Master Data & IA"];
	const SPOTS = [[250, 260, -.06], [640, 230, .04], [1010, 280, -.03], [330, 420, .05], [720, 400, -.04], [1040, 450, .06]];

	function draw(t){
		ctx.setTransform(k, 0, 0, k, 0, 0);
		background(t);
		const camp = o.images?.campus;

		/* 1 · titre (0 → 5,5 s) */
		let a = life(t, 0, 5.6, .6, .6);
		if(a > 0){
			if(camp?.complete){ ctx.save(); ctx.globalAlpha = .28*a; ctx.drawImage(camp, 300, 0, 560, 315, 0, 0, W, H); ctx.restore();
				const v = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, 760); v.addColorStop(0, "rgba(19,37,74,.35)"); v.addColorStop(1, "rgba(11,23,48,.95)");
				ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); ctx.restore(); }
			const p1 = out(seg(t, .3, 1.3)), p2 = out(seg(t, .9, 1.9)), p3 = inOut(seg(t, 1.2, 2.2));
			text("FGES · UNIVERSITÉ CATHOLIQUE DE LILLE", W/2, 230, { size:20, weight:700, color:CYAN, a:a*p1 });
			text("Campus FGES en 3D", W/2, 320, { size:96, weight:700, fam:DISP, a:a*p1, dy:(1 - p1)*30 });
			ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = CYAN; rr(W/2 - 160*p3, 388, 320*p3, 6, 3); ctx.fill(); ctx.restore();
			text("Une visite du campus, et un mini-jeu par formation", W/2, 450, { size:34, weight:500, color:CREAM, a:a*p2, dy:(1 - p2)*20 });
			text(`Ce qu'on vous demande, en moins d'une minute`, W/2, 510, { size:24, weight:500, color:"rgba(247,242,233,.7)", a:a*out(seg(t, 1.6, 2.4)) });
			caption("Le campus de la FGES, en 3D. Et un mini-jeu pour chaque formation.", life(t, .5, 5.5, .3, .4));
		}

		/* 2 · choisir sur un intitulé ? (5,5 → 13,5 s) */
		a = life(t, 5.4, 13.6, .5, .6);
		if(a > 0){
			const ph = out(seg(t, 5.7, 6.5));
			text("Choisir sa formation… sur un intitulé ?", W/2, 110, { size:54, weight:700, fam:DISP, a:a*ph, dy:(1 - ph)*20 });
			const dim = 1 - .6*seg(t, 10.2, 10.9);
			NAMES.forEach((n, i) => {
				const p = back(seg(t, 6.3 + i*.38, 7.1 + i*.38));
				if(p <= 0) return;
				const [x, y, r] = SPOTS[i];
				ctx.save(); ctx.globalAlpha = a*dim*clamp(p*1.5); ctx.translate(x, y - (1 - p)*260); ctx.rotate(r*p);
				font(700, 24); const w = Math.min(420, ctx.measureText(n).width + 48);
				rr(-w/2, -32, w, 64, 14); ctx.fillStyle = WHITE; ctx.fill();
				const lines = wrap(n, w - 40, 24, 700);
				lines.forEach((l, j) => text(l, 0, (j - (lines.length - 1)/2)*28, { size: lines.length > 1 ? 20 : 24, weight:700, color:NAVY }));
				ctx.restore();
			});
			const q = back(seg(t, 10.3, 11.1));
			if(q > 0){
				ctx.save(); ctx.globalAlpha = a; ctx.translate(W/2, 360); ctx.scale(q, q);
				rr(-430, -70, 860, 140, 24); ctx.fillStyle = CYAN; ctx.fill();
				text("Un nom ne dit pas ce qu'on y fait vraiment.", 0, 0, { size:38, weight:700, color:NAVY2 });
				ctx.restore();
			}
			caption("Choisir sa formation sur un simple intitulé, c'est difficile. Un nom ne dit pas ce qu'on y fait vraiment.", a*seg(t, 5.9, 6.3));
		}

		/* 3 · le campus en 3D (13,5 → 23 s) */
		a = life(t, 13.4, 23.1, .6, .6);
		if(a > 0){
			const g = out(seg(t, 13.5, 14.5)), kb = inOut(seg(t, 13.5, 23));
			const fw = 1040, fh = 585, fx = (W - fw)/2, fy = 40;
			ctx.save(); ctx.globalAlpha = a*g; ctx.translate(W/2, fy + fh/2); ctx.scale(.9 + .1*g, .9 + .1*g); ctx.translate(-W/2, -(fy + fh/2));
			rr(fx, fy, fw, fh, 22); ctx.save(); ctx.clip();
			if(camp?.complete){
				const sw = 560 - 150*kb, sh = sw*9/16, cx = 580 + 40*kb, cy = 157 + 20*kb;
				ctx.drawImage(camp, cx - sw/2, Math.max(0, cy - sh/2), sw, sh, fx, fy, fw, fh);
			} else { ctx.fillStyle = "#c97b52"; ctx.fillRect(fx, fy, fw, fh); }
			ctx.restore();
			ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.6)"; rr(fx, fy, fw, fh, 22); ctx.stroke();
			ctx.restore();
			pin(640 - 40*kb, 330 + 10*kb, "Hôtel Académique", seg(t, 15, 15.7)*a);
			const chips = [["Bâtiments réels, à l'échelle", 15.9], ["Vauban et Euratechnologies", 16.5], ["Sur ordinateur et téléphone", 17.1]];
			chips.forEach(([s, s0], i) => {
				const p = out(seg(t, s0, s0 + .6)); if(p <= 0) return;
				ctx.save(); ctx.globalAlpha = a*p; font(700, 22); const w = ctx.measureText(s).width + 36;
				const x = fx + 30 + (1 - p)*-30, y = fy + 30 + i*54;
				rr(x, y, w, 42, 21); ctx.fillStyle = "rgba(11,23,48,.85)"; ctx.fill();
				text(s, x + 18, y + 21, { size:22, weight:700, align:"left" }); ctx.restore();
			});
			caption("Alors, nous avons reconstitué le campus, à l'échelle, visitable dans le navigateur, sur ordinateur comme sur téléphone.", a*seg(t, 14, 14.4));
		}

		/* 4 · un mini-jeu par formation (23 → 33 s) */
		a = life(t, 22.9, 33.1, .5, .6);
		if(a > 0){
			const ph = out(seg(t, 23.1, 23.9));
			text("Chaque formation a son mini-jeu", W/2, 92, { size:52, weight:700, fam:DISP, a:a*ph, dy:(1 - ph)*20 });
			const G = o.games || [], n = G.length, gap = 22, cw = Math.min(212, (W - 80 - (n - 1)*gap)/n), total = n*cw + (n - 1)*gap, x0 = (W - total)/2;
			const focus = o.current ? inOut(seg(t, 27.6, 28.6)) : 0;
			G.forEach((gm, i) => {
				const p = back(seg(t, 23.7 + i*.3, 24.5 + i*.3)); if(p <= 0) return;
				const me = gm.id === o.current;
				const s = me ? 1 + .14*focus : 1 - .08*focus;
				const x = x0 + i*(cw + gap) + cw/2, y = 330 + (1 - p)*200;
				ctx.save(); ctx.globalAlpha = a*clamp(p*1.4)*(me ? 1 : 1 - .45*focus); ctx.translate(x, y); ctx.scale(s, s);
				rr(-cw/2, -140, cw, 280, 18); ctx.fillStyle = WHITE; ctx.fill();
				if(me && focus > 0){ ctx.lineWidth = 5; ctx.strokeStyle = ACC; ctx.stroke(); }
				ctx.font = "56px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(gm.icon, 0, -84);
				const tl = wrap(gm.title, cw - 30, 23, 700, DISP).slice(0, 3);
				tl.forEach((l, j) => text(l, 0, -34 + j*27, { size:23, weight:700, fam:DISP, color:NAVY }));
				wrap(gm.formation, cw - 30, 14, 500).slice(0, 3).forEach((l, j) => text(l, 0, -34 + tl.length*27 + 10 + j*18, { size:14, weight:500, color:"#55607a" }));
				rr(-48, 108, 96, 26, 13); ctx.fillStyle = "#eef3f8"; ctx.fill();
				text(gm.dur, 0, 121, { size:14, weight:700, color:NAVY });
				ctx.restore();
			});
			// progression L1 → L3 sous le jeu mis en avant
			const pr = o.current ? seg(t, 28.8, 31.4) : 0;
			if(pr > 0){
				const st = o.steps || ["L1", "L2", "L3"], bw = st.length > 4 ? 980 : 560, bx = (W - bw)/2, by = 506;
				ctx.save(); ctx.globalAlpha = a*clamp(pr*4);
				rr(bx, by, bw, 14, 7); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fill();
				rr(bx, by, bw*inOut(pr), 14, 7); ctx.fillStyle = ACC; ctx.fill();
				st.forEach((s, i, arr) => { const sx = bx + bw*(i + .5)/arr.length; text(s, sx, by + 38, { size:19, weight:700, color: pr > (i + .3)/arr.length ? WHITE : "rgba(255,255,255,.45)" }); });
				ctx.restore();
			}
			caption("Chaque formation a son mini-jeu : quelques minutes pour faire ce que font vraiment les étudiants. Manipuler, calculer, se tromper, comprendre.", a*seg(t, 23.4, 23.8));
		}

		/* 5 · là où les candidats choisissent (33 → 40 s) */
		a = life(t, 32.9, 40.1, .5, .6);
		if(a > 0){
			const ph = out(seg(t, 33.1, 33.9));
			text("Montré là où l'on choisit sa formation", W/2, 110, { size:52, weight:700, fam:DISP, a:a*ph, dy:(1 - ph)*20 });
			const items = [["Sur le site de la FGES", 0], ["Sur une borne, en salon", 1], ["Aux journées portes ouvertes", 2]];
			items.forEach(([s, i]) => {
				const p = seg(t, 33.8 + i*.7, 35 + i*.7); if(p <= 0) return;
				const cx = 270 + i*370, cy = 330;
				ctx.save(); ctx.globalAlpha = a; ctx.lineWidth = 6; ctx.lineCap = ctx.lineJoin = "round"; ctx.strokeStyle = CYAN;
				ctx.setLineDash([900]); ctx.lineDashOffset = 900*(1 - inOut(p));
				ctx.beginPath();
				if(i === 0){ ctx.roundRect(cx - 110, cy - 90, 220, 140, 12); ctx.moveTo(cx, cy + 50); ctx.lineTo(cx, cy + 85); ctx.moveTo(cx - 55, cy + 88); ctx.lineTo(cx + 55, cy + 88); }
				else if(i === 1){ ctx.roundRect(cx - 60, cy - 120, 120, 210, 14); ctx.roundRect(cx - 42, cy - 100, 84, 110, 6); ctx.moveTo(cx - 75, cy + 90); ctx.lineTo(cx + 75, cy + 90); }
				else { ctx.moveTo(cx - 110, cy + 88); ctx.lineTo(cx + 110, cy + 88); ctx.moveTo(cx - 90, cy + 88); ctx.lineTo(cx - 90, cy - 30); ctx.lineTo(cx, cy - 95); ctx.lineTo(cx + 90, cy - 30); ctx.lineTo(cx + 90, cy + 88);
					ctx.moveTo(cx - 28, cy + 88); ctx.lineTo(cx - 28, cy + 20); ctx.lineTo(cx + 28, cy + 20); ctx.lineTo(cx + 28, cy + 88); ctx.moveTo(cx, cy - 95); ctx.lineTo(cx, cy - 150); ctx.lineTo(cx + 45, cy - 135); ctx.lineTo(cx, cy - 120); }
				ctx.stroke(); ctx.restore();
				text(s, cx, cy + 140, { size:26, weight:700, a:a*seg(t, 34.5 + i*.7, 35.1 + i*.7) });
			});
			caption("Il sera montré sur le site, en salon, et aux journées portes ouvertes.", a*seg(t, 33.6, 34));
		}

		/* 6 · pourquoi vous (40 → 50 s) */
		a = life(t, 39.9, 52.5, .5, .01);
		if(a > 0){
			const card = inOut(seg(t, 45.2, 46.2));
			const ph = out(seg(t, 40.1, 40.9));
			ctx.save(); ctx.globalAlpha = a*(1 - card);
			text("Pourquoi vous ?", W/2, 130, { size:64, weight:700, fam:DISP, a:ph, dy:(1 - ph)*20 });
			const checks = ["Juste sur le fond", "Fidèle à la maquette de la formation", "Au bon niveau pour le public visé"];
			checks.forEach((s, i) => {
				const p = seg(t, 41 + i*.8, 41.6 + i*.8); if(p <= 0) return;
				const y = 270 + i*96, x = 330;
				ctx.save(); ctx.globalAlpha = clamp(p*2);
				ctx.beginPath(); ctx.arc(x, y, 30, 0, 7); ctx.fillStyle = ACC; ctx.fill();
				ctx.lineWidth = 7; ctx.lineCap = ctx.lineJoin = "round"; ctx.strokeStyle = WHITE; ctx.setLineDash([60]); ctx.lineDashOffset = 60*(1 - out(p));
				ctx.beginPath(); ctx.moveTo(x - 13, y + 1); ctx.lineTo(x - 3, y + 11); ctx.lineTo(x + 14, y - 10); ctx.stroke();
				text(s, x + 56, y, { size:36, weight:700, align:"left", dy:(1 - out(p))*12 });
				ctx.restore();
			});
			ctx.restore();
			caption(t < 47.4 ? "Avant cela, il doit être juste, fidèle à la formation, et au bon niveau. C'est là que nous avons besoin de vous." : "Votre relecture prend environ quinze minutes. Merci !", a*seg(t, 40.3, 40.7));
			if(card > 0){
				ctx.save(); ctx.globalAlpha = a*card;
				const cw = 860, ch = 470, cx = (W - cw)/2, cy = (H - ch)/2 + (1 - card)*40;
				rr(cx, cy, cw, ch, 28); ctx.fillStyle = CREAM; ctx.fill();
				const logo = o.images?.logo;
				if(logo?.complete) ctx.drawImage(logo, W/2 - 163, cy + 36, 326, 97.5);
				text(o.gameTitle ? `« ${o.gameTitle} »` : "Votre relecture", W/2, cy + 178, { size:30, weight:700, fam:DISP, color:NAVY });
				text("Votre relecture : environ 15 minutes", W/2, cy + 232, { size:40, weight:700, fam:DISP, color:NAVY });
				["Jouer", "Noter", "Envoyer"].forEach((s, i) => {
					const p = back(seg(t, 46.4 + i*.4, 47 + i*.4)); if(p <= 0) return;
					const bx = W/2 - 300 + i*210, by = cy + 300;
					ctx.save(); ctx.translate(bx + 90, by + 32); ctx.scale(p, p);
					rr(-90, -32, 180, 64, 32); ctx.fillStyle = i === 2 ? INK : NAVY; ctx.fill();
					text(`${i + 1}  ${s}`, 0, 0, { size:26, weight:700 });
					ctx.restore();
					if(i < 2) text("→", bx + 195, by + 32, { size:30, weight:700, color:NAVY, a:p });
				});
				text("Merci !", W/2, cy + 420, { size:34, weight:700, fam:DISP, color:INK, a:seg(t, 50, 50.6) });
				ctx.restore();
			}
		}
	}

	let t = o.poster ?? 2.6, playing = false, last = 0, raf = 0, started = false;
	const api = { duration:D, get t(){ return t; }, get playing(){ return playing; }, onTime:null, onState:null };
	function loop(now){
		if(!playing) return;
		const src = api.clock?.(); t = src != null ? src : t + Math.min(.1, (now - last)/1000); last = now;
		if(t >= D){ t = D; playing = false; api.onState?.(false); }
		draw(t); api.onTime?.(t);
		if(playing) raf = requestAnimationFrame(loop);
	}
	api.play = () => { if(playing) return; started = true; if(t >= D - .05) t = 0; playing = true; last = performance.now(); api.onState?.(true); raf = requestAnimationFrame(loop); };
	api.pause = () => { playing = false; cancelAnimationFrame(raf); api.onState?.(false); };
	api.toggle = () => playing ? api.pause() : api.play();
	api.seek = s => { started = true; t = clamp(s, 0, D); draw(t); api.onTime?.(t); };
	api.draw = draw;
	draw(t);
	return api;
}
