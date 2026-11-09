/* Ossature commune des mini-jeux « sur table » des licences (2026).
   La maquette 3D à gauche (en haut sur téléphone), la fiche à droite (en bas), la bulle du mentor qui écrit
   lettre à lettre, la frise des étapes et les compteurs qui défilent jusqu'à leur nouvelle valeur.
   Tirée du Dossier Deslaurier (patrimoine.js), qui garde pour l'instant sa propre copie : on ne touche pas
   à un jeu en ligne avant la JPO. Seule la boucle de jeu change d'un jeu à l'autre, jamais cette ossature visible. */
export const MOBILE = 760;

const CSS = `
.tb{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:var(--ink);background:var(--bg);animation:tbIn .35s ease both;overflow:hidden}
@keyframes tbIn{from{opacity:0}to{opacity:1}}
.tb canvas{position:absolute;left:0;top:0;display:block;touch-action:none}
.tb-top{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px;pointer-events:none}
.tb-top>*{pointer-events:auto}
.tb-chip{background:rgba(255,251,240,.95);border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 6px 18px rgba(5,10,20,.3)}
.tb-stage{background:var(--accent);color:#fff}
.tb-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,251,240,.95);font-size:22px;cursor:pointer}
.tb-tl{position:absolute;z-index:2;left:12px;bottom:12px;background:rgba(12,14,20,.72);border-radius:14px;padding:8px 12px 6px;pointer-events:none;box-sizing:border-box;backdrop-filter:blur(4px)}
.tb-tl-bar{position:relative;height:4px;border-radius:2px;background:rgba(243,227,184,.18);margin:5px 6px 0}
.tb-tl-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--gold);transition:width .9s cubic-bezier(.4,0,.2,1)}
.tb-tl ol{list-style:none;margin:-9px 0 0;padding:0;display:flex;justify-content:space-between}
.tb-tl li{flex:1;text-align:center;font-size:11.5px;font-weight:800;color:rgba(243,227,184,.45);transition:color .4s}
.tb-tl li:first-child{text-align:left}.tb-tl li:last-child{text-align:right}
.tb-tl li:before{content:"";display:block;width:10px;height:10px;border-radius:50%;background:#3a3f4a;border:2px solid rgba(243,227,184,.35);margin:0 auto 4px;transition:all .4s}
.tb-tl li:first-child:before{margin-left:0}.tb-tl li:last-child:before{margin-right:0}
.tb-tl li.past{color:rgba(243,227,184,.8)}.tb-tl li.past:before{background:var(--gold);border-color:var(--gold)}
.tb-tl li.now{color:#ffd77a}.tb-tl li.now:before{background:#ffd77a;border-color:#fff;box-shadow:0 0 0 4px rgba(255,215,122,.3);transform:scale(1.25)}
.tb-tl .s{display:none}.tb-tl.narrow .l{display:none}.tb-tl.narrow .s{display:inline}
.tb-hint{position:absolute;z-index:2;left:12px;background:rgba(12,18,28,.72);color:#f3e3b8;font-size:12.5px;font-weight:800;border-radius:999px;padding:6px 12px;pointer-events:none;transition:opacity .4s}
.tb-hint.off{opacity:0}
.tb-wrap{position:absolute;z-index:2;top:62px;right:12px;bottom:12px;width:420px;overflow:auto;border-radius:8px;scrollbar-width:thin}
.tb-card{background:var(--paper);border-radius:8px;box-shadow:0 18px 40px rgba(5,10,20,.45);padding:18px 18px 16px;position:relative;animation:tbUp .35s cubic-bezier(.2,.8,.2,1) both;border-top:5px solid var(--accent);min-height:calc(100% - 21px)}
@keyframes tbUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (max-width:${MOBILE - 1}px){
	.tb-wrap{left:0;right:0;bottom:0;width:auto;border-radius:16px 16px 0 0;box-shadow:0 -10px 30px rgba(5,10,20,.35)}
	.tb-card{border-radius:16px 16px 0 0;padding:14px 14px 22px}
	.tb-tl{bottom:auto}
}
.tb-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-ink)}
.tb-h{font:700 22px/1.15 Fraunces,Georgia,serif;margin:4px 0 6px;color:var(--dark)}
.tb-p{margin:0 0 10px;color:#4a4f58;font-size:14.5px}
.tb-year{display:inline-block;font:700 13px Fraunces,Georgia,serif;background:var(--dark);color:#f3e3b8;border-radius:6px;padding:3px 9px;margin-bottom:6px}
.tb-story{background:var(--paper2);border-left:4px solid var(--accent);border-radius:4px;padding:10px 12px;margin:8px 0 12px;font-size:14px;color:#3a3530}
.tb-go{display:block;width:100%;border:0;border-radius:12px;padding:14px;background:var(--dark);color:#fff;font:800 16px Nunito,sans-serif;cursor:pointer;margin-top:12px;text-align:center;text-decoration:none}
.tb-go:disabled{opacity:.35;cursor:default}
.tb-alt{display:block;width:100%;border:2px solid var(--line);border-radius:12px;padding:12px;background:#fff;color:var(--dark);font:800 14px Nunito,sans-serif;cursor:pointer;margin-top:8px;text-align:center;text-decoration:none;box-sizing:border-box}
.tb-course{background:#fff;border:2px solid var(--accent);border-radius:10px;padding:12px 14px;margin:10px 0 4px}
.tb-course .tag{display:inline-block;background:var(--paper2);color:var(--accent-ink);font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.tb-course b{display:block;font:700 16px Fraunces,Georgia,serif;margin-bottom:3px;color:var(--dark)}
.tb-course span{font-size:13.5px;color:#4a4f58}
.tb-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.tb-list li{background:#fff;border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-size:14px;font-weight:700}
.tb-list li span{color:var(--accent-ink);font-weight:800;margin-right:6px}
.tb-verdict{border-radius:10px;padding:10px 12px;margin:12px 0 8px;font-weight:800;font-size:15px;display:flex;align-items:center;gap:10px;animation:tbUp .35s both}
.tb-verdict .st{font-size:20px;letter-spacing:2px}
.tb-verdict.s3{background:#eaf6ee;color:#2c6a46}.tb-verdict.s2{background:#fbf3df;color:#8a6a24}.tb-verdict.s1{background:#fdeceb;color:#b3261e}
.tb-delta{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}
.tb-delta span{font-size:12.5px;font-weight:800;border-radius:999px;padding:3px 9px;background:#f0ede6}
.tb-sim{font-variant-numeric:tabular-nums;font-size:13.5px;margin:6px 0;padding:0;list-style:none}
.tb-sim li{display:flex;justify-content:space-between;gap:8px;border-top:1px dashed var(--line);padding:4px 0}
.tb-meters{position:absolute;z-index:2;left:12px;top:60px;max-width:calc(100% - 24px);display:flex;flex-wrap:wrap;gap:6px;pointer-events:none}
.tb-m{background:rgba(255,251,240,.94);border-radius:10px;padding:5px 10px;font-size:12.5px;font-weight:800;box-shadow:0 4px 12px rgba(5,10,20,.25);display:flex;flex-direction:column;line-height:1.15;min-width:64px;font-variant-numeric:tabular-nums}
.tb-m small{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#6a6660}
.tb-m.pop{animation:tbPop .5s ease}
@keyframes tbPop{40%{transform:scale(1.15)}}
.tb-bubble{position:absolute;z-index:3;display:flex;align-items:center;gap:10px;pointer-events:auto;cursor:pointer;transition:opacity .3s,transform .3s}
.tb-bubble.off{opacity:0;transform:translateY(8px);pointer-events:none}
.tb-bubble svg{flex:none;width:64px;height:64px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))}
.tb-bubble p{flex:1;position:relative;margin:0;background:var(--paper);border:2px solid var(--dark);border-radius:14px;padding:8px 14px;font-size:14.5px;font-weight:700;line-height:1.35;color:var(--dark);box-shadow:0 8px 20px rgba(0,0,0,.3);min-height:20px}
.tb-bubble p:before{content:"";position:absolute;left:-9px;top:50%;width:14px;height:14px;background:var(--paper);border:2px solid var(--dark);border-top:0;border-right:0;transform:translateY(-50%) rotate(45deg)}
.tb-bubble p b{display:block;font:800 10.5px Nunito,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-ink);margin-bottom:2px}
@media (max-width:520px){ .tb-bubble svg{width:46px;height:46px} .tb-bubble p{font-size:12.5px;padding:6px 10px} .tb-meters{gap:4px;left:8px;right:60px} .tb-m{min-width:0;padding:4px 7px;font-size:12px} .tb-m small{display:none}
	.tb-tl .l{display:none} .tb-tl .s{display:inline} .tb-tl li{font-size:10.5px} .tb-tl{padding:7px 9px 5px} }
@media (max-width:440px){ .tb-h{font-size:19px} .tb-story{font-size:13.5px} }
`;

/* o : { id, label, theme:{ bg, paper, paper2, ink, dark, accent, accentInk, gold, line }, mentor:{ name, svg },
         timeline:[[libellé, libellé court, [étapes]]], meters:[{ k, label, icon, cls, fmt }], hint, extraCSS } */
export function mountTable(o){
	const cssId = "tb-css";
	if(!document.getElementById(cssId)){ const st = document.createElement("style"); st.id = cssId; st.textContent = CSS; document.head.appendChild(st); }
	if(o.extraCSS && !document.getElementById(o.id + "-css")){ const st = document.createElement("style"); st.id = o.id + "-css"; st.textContent = o.extraCSS; document.head.appendChild(st); }
	const t = o.theme;
	const root = document.createElement("div"); root.className = "tb " + o.id;
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu " + o.label);
	Object.entries({ bg:t.bg, paper:t.paper, paper2:t.paper2, ink:t.ink, dark:t.dark, accent:t.accent, "accent-ink":t.accentInk, gold:t.gold, line:t.line })
		.forEach(([k, v]) => root.style.setProperty("--" + k, v));
	root.innerHTML = `<canvas aria-hidden="true"></canvas><div class="tb-top"><span class="tb-chip tb-stage">${o.label}</span><button class="tb-x" aria-label="Quitter le jeu">×</button></div>
		<div class="tb-meters" aria-live="polite">${o.meters.map(m => `<span class="tb-m ${m.cls || ""}"><small>${m.icon} ${m.label}</small><b data-m="${m.k}">–</b></span>`).join("")}</div>
		<div class="tb-hint">${o.hint || ""}</div>
		<div class="tb-tl" aria-label="Frise"><div class="tb-tl-bar"><i></i></div><ol>${o.timeline.map(([l, s]) => `<li><span class="l">${l}</span><span class="s">${s}</span></li>`).join("")}</ol></div>
		<div class="tb-bubble off" title="Toucher pour masquer">${o.mentor.svg}<p><b>${o.mentor.name}</b><span></span></p></div>
		<div class="tb-wrap"><div class="tb-card"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const canvas = $("canvas"), wrap = $(".tb-wrap"), card = $(".tb-card"), hint = $(".tb-hint"), tl = $(".tb-tl"), bubble = $(".tb-bubble"), meters = $(".tb-meters");
	let closed = false, W = null, curStep = o.timeline[0][2][0];
	const later = (ms, f) => setTimeout(() => { if(!closed) f(); }, ms);

	function layout(){
		const w = innerWidth, h = innerHeight;
		tl.classList.toggle("narrow", (w >= MOBILE ? w - 444 : w) < 640);
		if(w >= MOBILE){
			wrap.style.top = ""; hint.style.top = "110px"; tl.style.top = ""; tl.style.width = (w - 444 - 24) + "px";
			Object.assign(bubble.style, { left:"12px", right:"456px", top:"auto", bottom:"86px" });
			W && (W.resize(w - 444, h - 76), W.reserve(104));
		} else {
			const top = Math.round(h*.5); wrap.style.top = top + "px"; tl.style.top = (top - 54) + "px"; tl.style.width = (w - 24) + "px"; hint.style.top = (top - 92) + "px";
			Object.assign(bubble.style, { left:"8px", right:"8px", top:"92px", bottom:"auto" });
			W && (W.resize(w, top - 58), W.reserve(0));
		}
		frise(curStep);
	}
	function frise(step){
		curStep = step;
		const n = Math.max(0, o.timeline.findIndex(x => x[2].includes(step))), li = tl.querySelectorAll("li");
		li.forEach((x, i) => { x.classList.toggle("past", i < n); x.classList.toggle("now", i === n); });
		const bar = $(".tb-tl-bar").getBoundingClientRect();
		const dot = el => { const r = el.getBoundingClientRect(); return el === li[0] ? r.left + 7 : el === li[li.length - 1] ? r.right - 7 : r.left + r.width/2; };
		$(".tb-tl-bar i").style.width = Math.max(0, dot(li[n]) - bar.left) + "px";
	}
	const onResize = () => layout();
	addEventListener("resize", onResize);

	// compteurs : ils défilent jusqu'à leur nouvelle valeur
	const val = {};
	function meter(k, v){
		const m = o.meters.find(x => x.k === k), el = meters.querySelector(`[data-m="${k}"]`), from = val[k] ?? v; val[k] = v;
		const t0 = performance.now();
		const step = now => { const q = Math.min(1, (now - t0)/900); el.textContent = m.fmt(from + (v - from)*(1 - Math.pow(1 - q, 3))); if(q < 1 && !closed) requestAnimationFrame(step); };
		requestAnimationFrame(step);
		if(v !== from){ el.parentNode.classList.remove("pop"); void el.offsetWidth; el.parentNode.classList.add("pop"); }
	}
	// le mentor parle : le texte s'écrit lettre à lettre ; sur téléphone, la bulle s'efface seule
	let sayT = 0, hideT = 0;
	function say(text){
		if(!text) return;
		const sp = bubble.querySelector("span"); clearInterval(sayT); clearTimeout(hideT);
		bubble.classList.remove("off"); sp.textContent = ""; let i = 0;
		W && W.talk && W.talk(1200 + text.length*40);
		sayT = setInterval(() => { if(closed) return clearInterval(sayT); sp.textContent = text.slice(0, ++i); if(i >= text.length) clearInterval(sayT); }, 18);
		if(innerWidth < MOBILE) hideT = setTimeout(() => bubble.classList.add("off"), 2600 + text.length*45);
	}
	bubble.addEventListener("click", () => bubble.classList.add("off"));
	function show(html){ card.innerHTML = html; card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; wrap.scrollTo({ top:0, behavior:"smooth" }); }
	function stage(text, step){ $(".tb-stage").textContent = text; frise(step); }
	function showHint(text){ hint.innerHTML = text; hint.classList.toggle("off", !text); }

	let onCloseCb = null;
	function close(){ if(closed) return; closed = true; clearInterval(sayT); clearTimeout(hideT); removeEventListener("resize", onResize); document.removeEventListener("keydown", onKey); W && W.dispose(); root.remove(); onCloseCb && onCloseCb(); }
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".tb-x").addEventListener("click", close);

	return {
		root, canvas, card, wrap, later, meter, say, show, stage, frise, showHint, close, layout,
		bind(world){ W = world; layout(); },
		onClose(f){ onCloseCb = f; },
		get closed(){ return closed; },
		scrollEnd(){ later(80, () => wrap.scrollTo({ top:wrap.scrollHeight, behavior:"smooth" })); }
	};
}
