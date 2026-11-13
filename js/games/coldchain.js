/* « Cold chain » — ouverture à chaud du mini-jeu Biodata (Master DMB, en anglais).
   Une biobanque à −80 °C : le tube de sang d'Alex arrive avec une étiquette papier couverte de données personnelles.
   Avant de le ranger pour la recherche, le joueur minimise ces données à la main :
   glisser une bande vers l'extérieur la décolle (supprimer), un appui la replie (généraliser), on laisse le reste (garder).
   La déléguée à la protection des données bloque le rangement tant qu'une bande est mal traitée ;
   quand tout est juste, le tube reçoit son code-barres pseudonyme et part au congélateur dans un nuage de givre. */
import * as THREE from "three";

// la valeur « repliée » (généralisée) de chaque champ
const FOLD = { name:"A. M.", ssn:"1 98 •• •• ••• …", mail:"a•••@…", dob:"1998 · aged 27", zip:"59 · Nord", sex:"M", sym:"Fatigue …", fer:"> 1,000 µg/L", ts:"> 45 %", code:"P-04••" };

const CSS = `
.cc{position:fixed;inset:0;z-index:45;background:#071426;font-family:Inter,system-ui,sans-serif;font-weight:300;color:#e9f7fa;overflow:hidden;animation:ccIn .45s ease both}
@keyframes ccIn{from{opacity:0}to{opacity:1}}
.cc.out{transition:opacity .6s ease;opacity:0}
.cc canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.cc-hud{position:absolute;right:14px;top:14px;bottom:14px;width:360px;display:flex;flex-direction:column;gap:10px;background:rgba(9,26,48,.88);border:1px solid rgba(203,151,26,.35);border-radius:16px;padding:16px;overflow:auto;box-shadow:0 18px 50px rgba(0,0,0,.45)}
.cc-k{font:700 11px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#cb971a}
.cc-h{font:300 25px/1.15 Tiempos Headline,Georgia,serif;margin:0;color:#fff}
.cc-p{margin:0;font-size:14.5px;line-height:1.5;color:#cfe1ee}
.cc-p b{color:#fff}
.cc-say{display:flex;gap:8px;align-items:flex-start}
.cc-say .av{flex:none;width:38px;height:38px;border-radius:50%;overflow:hidden;background:#13304f;display:grid;place-items:center;font-size:20px}
.cc-say .av img{width:100%;height:100%}
.cc-say .bub{background:#13304f;border-radius:4px 12px 12px 12px;padding:7px 10px;font-size:13.5px;line-height:1.4;color:#e9f7fa}
.cc-legend{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:center;font-size:13.5px;background:rgba(255,255,255,.05);border-radius:12px;padding:10px 12px}
.cc-legend i{font-style:normal;font:700 11px Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#071426;background:#cb971a;border-radius:6px;padding:4px 7px;text-align:center}
.cc-count{font:700 12px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#9fb6c9}
.cc-dpo{font-size:13.5px;line-height:1.45;border-left:3px solid #e05a4f;background:rgba(224,90,79,.12);border-radius:0 10px 10px 0;padding:8px 10px;color:#ffd9d4}
.cc-dpo[hidden]{display:none}
.cc-dpo.ok{border-color:#3fbf7f;background:rgba(63,191,127,.12);color:#d6f5e4}
.cc-go{margin-top:auto;border:0;border-radius:12px;padding:14px;background:#cb971a;color:#071426;font:700 16px Inter,system-ui,sans-serif;cursor:pointer}
.cc-go:disabled{opacity:.5;cursor:default}
.cc-go:focus-visible{outline:3px solid #fff;outline-offset:2px}
.cc-tip{position:absolute;left:16px;top:16px;max-width:min(360px,calc(100% - 420px));background:rgba(9,26,48,.85);border-radius:12px;padding:8px 12px;font-size:13px;color:#cfe1ee;pointer-events:none}
@media (max-width:759px){
	.cc-hud{left:0;right:0;top:auto;bottom:0;width:auto;max-height:44%;border-radius:16px 16px 0 0;padding:12px 14px;gap:8px}
	.cc-h{font-size:20px}
	.cc-p{font-size:13.5px}
	.cc-say,.cc-legend{display:none}
	.cc-tip{top:auto;bottom:calc(44% + 10px);left:10px;right:10px;max-width:none;text-align:center}
}`;

export function coldChain({ host, fields, av, play, onWrong, onDone }){
	if(!document.getElementById("cc-css")){ const st = document.createElement("style"); st.id = "cc-css"; st.textContent = CSS; document.head.appendChild(st); }
	const ov = document.createElement("div"); ov.className = "cc"; ov.lang = "en";
	ov.innerHTML = `<canvas aria-hidden="true"></canvas>
		<div class="cc-tip" aria-hidden="true">Swipe a strip sideways to peel it off · tap it to fold it</div>
		<div class="cc-hud" role="region" aria-label="Cold chain">
			<div class="cc-k">Mission 1 · Data protection · −80 °C biobank</div>
			<h2 class="cc-h">Cold chain</h2>
			<div class="cc-say"><div class="av">${av("alex", "🧑")}</div><div class="bub">I've been unusually tired for months, and nothing helps.</div></div>
			<div class="cc-say"><div class="av">${av("doctor", "👩‍⚕️")}</div><div class="bub">Your iron levels are very high. I'd like a genetic analysis.</div></div>
			<p class="cc-p">🇬🇧 In English, like the Master. Alex's blood sample reaches the research biobank, and its paper label says <b>far too much</b>. Before it goes into the freezer, <b>minimise the data</b> (GDPR): only what the research needs may stay readable.</p>
			<div class="cc-legend"><i>Peel</i><span>swipe a strip off: the data is removed</span><i>Fold</i><span>tap a strip: the value becomes coarser</span><i>Keep</i><span>leave it as it is</span></div>
			<div class="cc-count" id="ccCount"></div>
			<div class="cc-dpo" id="ccDpo" hidden></div>
			<button class="cc-go" id="ccGo">🧊 Store in the biobank</button>
		</div>`;
	host.appendChild(ov);
	const $ = s => ov.querySelector(s);
	const canvas = $("canvas"), hud = $(".cc-hud");
	let closed = false, raf = 0, last = 0, busy = false;

	/* ---------- la biobanque ---------- */
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.outputColorSpace = THREE.SRGBColorSpace;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#071426"); scene.fog = new THREE.Fog("#071426", 9, 22);
	const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
	scene.add(new THREE.HemisphereLight("#cfe8ff", "#0b1a2e", 1.15));
	const key = new THREE.DirectionalLight("#ffffff", 2.0); key.position.set(-3, 6, 7); scene.add(key);
	const cold = new THREE.PointLight("#5fb8ff", 18, 9, 1.6); cold.position.set(3.4, 3.2, -1); scene.add(cold);
	const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color:c, roughness:.6 }, o));
	const box = (w, h, d, m, x, y, z, p = scene) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y + h/2, z); p.add(me); return me; };
	box(30, .1, 20, M("#0d2238", { roughness:.9 }), 0, -.1, -3);                                       // sol
	box(30, 8, .2, M("#0f2a44", { roughness:.95 }), 0, 0, -4.2);                                         // mur du fond
	// paillasse en inox et portoir
	box(4.6, .12, 1.8, M("#b9c4cf", { metalness:.7, roughness:.35 }), .6, .82, .2);
	box(.12, .82, 1.6, M("#8592a0", { metalness:.6 }), -1.5, 0, .2); box(.12, .82, 1.6, M("#8592a0", { metalness:.6 }), 2.7, 0, .2);
	box(3.4, .4, 1.9, M("#e9edf2"), -.9, .94, .1);      // portoir : le tube y est planté
	for(let i = 0; i < 5; i++){ const t = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .9, 12), M(["#9b7fd1", "#e05a4f", "#6fb8e8"][i % 3], { roughness:.4 })); t.position.set(-2.35 + i*.3, 1.75, .45); scene.add(t); }
	// les congélateurs à −80 °C, au fond à droite
	const freezers = [];
	for(let i = 0; i < 3; i++){
		const x = 3.2 + i*1.45, g = new THREE.Group(); g.position.set(x, 0, -3.2); scene.add(g);
		box(1.3, 2.7, 1.1, M("#dfe6ee", { roughness:.45 }), 0, 0, 0, g);
		const hinge = new THREE.Group(); hinge.position.set(-.62, 0, .56); g.add(hinge);
		const door = box(1.24, 2.5, .08, M("#eef4fa", { roughness:.3, emissive:"#9fd3ff", emissiveIntensity:.08 }), .62, .1, 0, hinge);
		box(.06, .9, .08, M("#9aa6b2", { metalness:.7 }), 1.1, .9, .07, hinge);
		const cv = document.createElement("canvas"); cv.width = 128; cv.height = 48; const x2 = cv.getContext("2d");
		x2.fillStyle = "#06121f"; x2.fillRect(0, 0, 128, 48); x2.fillStyle = "#7fe3f0"; x2.font = "700 28px Inter, system-ui, sans-serif"; x2.textAlign = "center"; x2.fillText("−80 °C", 64, 34);
		const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
		const disp = new THREE.Mesh(new THREE.PlaneGeometry(.5, .19), new THREE.MeshBasicMaterial({ map:tex })); disp.position.set(.62, 2.35, .05); hinge.add(disp);
		const led = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshBasicMaterial({ color:"#3fbf7f" })); led.position.set(.18, 2.35, .06); hinge.add(led);
		freezers.push({ g, hinge, door });
	}
	const target = freezers[1];

	/* ---------- le tube d'Alex (agrandi : c'est lui qu'on manipule) ---------- */
	const R = .8, H = 3.3, STRIP = .27;
	const tube = new THREE.Group(); tube.position.set(0, .95 + R, .1); scene.add(tube);      // le fond arrondi repose sur la paillasse
	const glass = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 40, 1, true), M("#dff1ff", { transparent:true, opacity:.28, roughness:.05, side:THREE.DoubleSide })); glass.position.y = H/2; tube.add(glass);
	const blood = new THREE.Mesh(new THREE.CylinderGeometry(R*.93, R*.93, H*.62, 40), M("#7d0f1c", { roughness:.35, emissive:"#3a0008", emissiveIntensity:.25 })); blood.position.y = H*.31 + .02; tube.add(blood);
	const bottom = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 12, 0, Math.PI*2, Math.PI/2, Math.PI/2), M("#dff1ff", { transparent:true, opacity:.3 })); tube.add(bottom);
	const cap = new THREE.Mesh(new THREE.CylinderGeometry(R*1.08, R*1.08, .55, 40), M("#9b7fd1", { roughness:.5 })); cap.position.y = H + .27; tube.add(cap);      // bouchon violet : tube EDTA

	// une bande d'étiquette par champ du dossier, enroulée sur le devant du tube
	const ARC = Math.PI*.62, W = 768, HH = 104;
	const strips = fields.map((f, i) => {
		const cv = document.createElement("canvas"); cv.width = W; cv.height = HH;
		const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
		const y = H - .25 - i*(STRIP + .012) - STRIP/2;
		const geo = new THREE.CylinderGeometry(R + .012, R + .012, STRIP, 40, 1, true, -ARC/2, ARC);
		const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map:tex, roughness:.85, emissive:"#ffffff", emissiveIntensity:0, emissiveMap:tex }));
		const pivot = new THREE.Group(); pivot.position.y = y; pivot.add(mesh); tube.add(pivot);
		const ghost = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color:"#cb971a", transparent:true, opacity:0, depthWrite:false })); ghost.scale.setScalar(1.002); pivot.add(ghost);
		const s = { f, i, cv, tex, mesh, ghost, pivot, state:"keep", flash:0, off:0, peel:0 };
		mesh.userData.s = ghost.userData.s = s;
		return s;
	});
	function paint(s, barcode = false){
		const x = s.cv.getContext("2d"), fold = s.state === "tr";
		x.fillStyle = fold ? "#f3ead2" : "#fbf8f1"; x.fillRect(0, 0, W, HH);
		x.strokeStyle = "rgba(15,49,104,.18)"; x.lineWidth = 2; x.strokeRect(1, 1, W - 2, HH - 2);
		if(fold){ x.fillStyle = "rgba(150,113,26,.22)"; for(let k = 0; k < W; k += 22) x.fillRect(k, 0, 2, HH); }      // pli
		x.textBaseline = "middle";
		x.fillStyle = "#5b6b7a"; x.font = "700 27px Inter, system-ui, sans-serif"; x.textAlign = "left";
		const lab = s.f.f.toUpperCase(); x.fillText(lab, 34, HH/2);
		const room = W - 70 - (34 + x.measureText(lab).width + 26), val = fold ? FOLD[s.f.id] || s.f.v : s.f.v;
		let fs = 44; x.font = `700 ${fs}px Inter, system-ui, sans-serif`; while(fs > 24 && x.measureText(val).width > room){ fs -= 2; x.font = `700 ${fs}px Inter, system-ui, sans-serif`; }      // la valeur ne mord jamais sur l'intitulé
		x.fillStyle = "#14233d"; x.textAlign = "right";
		if(barcode){
			let bx = W - 300; for(let k = 0; k < 46; k++){ const w = (k*7 % 5) < 2 ? 3 : 6; x.fillRect(bx, 18, w, HH - 50); bx += w + 3; }
			x.font = "700 22px Inter, system-ui, sans-serif"; x.textAlign = "center"; x.fillText("P-0412", W - 160, HH - 16);
		} else x.fillText(val, W - 70, HH/2);
		s.tex.needsUpdate = true;
	}
	strips.forEach(s => paint(s));
	function counts(){
		const n = { keep:0, tr:0, rm:0 }; strips.forEach(s => n[s.state]++);
		$("#ccCount").textContent = `${n.rm} peeled · ${n.tr} folded · ${n.keep} kept`;
	}
	counts();

	/* ---------- cadrage : le tube à gauche du panneau (ordinateur) ou au-dessus (téléphone) ---------- */
	let look = new THREE.Vector3(innerWidth < 760 ? 0 : 1.1, 3.3, 0), anim = null;
	function frame(){
		const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
		const mobile = w < 760, t = Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
		// setViewOffset recalcule lui-même camera.aspect : on ne le touche pas, on cadre sur la zone libre
		let dist;
		if(mobile){ const d = Math.min(h*.44, hud.offsetHeight); camera.setViewOffset(w, h + d, 0, d, w, h);
			dist = Math.max(5.9*(h + d)/(2*t*(h - d)), 2.3*(h + d)/(2*t*w)); }
		else { const pw = 390; camera.setViewOffset(w + pw, h, pw, 0, w, h);
			dist = Math.max(5.9/(2*t), (anim ? 4 : 5.6)*h/(2*t*(w - pw))); }
		camera.position.set(look.x + .35, look.y + .7, look.z + dist);
		scene.fog.near = dist*1.1; scene.fog.far = dist*3;      // le brouillard suit le recul de la caméra (téléphone)
		camera.lookAt(look); camera.updateProjectionMatrix();
	}
	addEventListener("resize", frame); frame();

	/* ---------- gestes : glisser pour décoller, toucher pour replier ---------- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	let drag = null;
	const hit = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera);
		const h = ray.intersectObjects(strips.flatMap(s => s.state === "rm" ? [s.ghost] : [s.mesh]))[0]; return h ? h.object.userData.s : null; };
	canvas.addEventListener("pointerdown", e => {
		if(busy) return;
		const s = hit(e); if(!s) return;
		e.preventDefault(); canvas.setPointerCapture(e.pointerId);
		drag = { s, x:e.clientX, y:e.clientY, moved:false };
	});
	canvas.addEventListener("pointermove", e => {
		if(!drag){ canvas.style.cursor = !busy && hit(e) ? "grab" : ""; return; }
		const dx = e.clientX - drag.x;
		if(Math.abs(dx) > 10) drag.moved = true;
		if(drag.moved && drag.s.state !== "rm") drag.s.off = Math.max(-1.2, Math.min(1.2, dx/140));
	});
	const up = e => {
		if(!drag) return;
		const s = drag.s, dx = e.clientX - drag.x; drag = null;
		if(!s) return;
		if(s.state === "rm"){ s.state = "keep"; s.peel = 0; s.off = 0; s.mesh.visible = true; play("pop"); paint(s); counts(); hideDpo(); return; }
		if(Math.abs(dx) > 70){ s.state = "rm"; s.peel = Math.sign(dx); play("pop"); counts(); hideDpo(); return; }
		s.off = 0;
		if(!drag && Math.abs(dx) < 10){ s.state = s.state === "tr" ? "keep" : "tr"; play("pop"); paint(s); counts(); hideDpo(); }
	};
	canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", () => { if(drag){ drag.s.off = 0; drag = null; } });

	/* ---------- la déléguée à la protection des données ---------- */
	const dpo = $("#ccDpo");
	function hideDpo(){ if(!dpo.classList.contains("ok")) dpo.hidden = true; }
	$("#ccGo").addEventListener("click", () => {
		if(busy) return;
		const wrong = strips.filter(s => s.state !== s.f.a);
		if(wrong.length){
			play("bad");
			wrong.forEach(s => s.flash = 1.8);
			const verb = { rm:"peel it off", tr:"fold it", keep:"keep it readable" };
			dpo.classList.remove("ok"); dpo.hidden = false;
			dpo.innerHTML = `<b>Storage blocked by the data protection officer:</b> ${wrong.length} strip${wrong.length > 1 ? "s" : ""} to reconsider (they flash).<br>${wrong.slice(0, 2).map(s => `• ${s.f.f}: ${s.f.why} → <b>${verb[s.f.a]}</b>`).join("<br>")}`;
			onWrong && onWrong(wrong.map(s => s.f));
			return;
		}
		busy = true; $("#ccGo").disabled = true; play("good");
		dpo.classList.add("ok"); dpo.hidden = false; dpo.innerHTML = "<b>Approved.</b> Pseudonymised as P-0412: the lab can work without knowing who Alex is.";
		const code = strips.find(s => s.f.id === "code"); if(code){ code.flash = 1.2; paint(code, true); }
		store();
	});

	/* ---------- rangement : le tube monte, le congélateur s'ouvre, le givre ---------- */
	const mist = [];
	const mistTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
		const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.5, "rgba(233,247,255,.45)"); g.addColorStop(1, "rgba(233,247,255,0)");
		x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();      // volutes rondes et douces
	function puff(n){
		for(let i = 0; i < n; i++){
			const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:mistTex, color:"#e9f7ff", transparent:true, opacity:.55, depthWrite:false }));
			const p = target.g.position; sp.position.set(p.x + (Math.random() - .5)*1.1, .4 + Math.random()*2.2, p.z + .8 + Math.random()*.4);
			sp.scale.setScalar(.6 + Math.random()*.7); sp.userData = { v:new THREE.Vector3((Math.random() - .5)*.6, .15 + Math.random()*.3, .4 + Math.random()*.5), life:1.6 + Math.random()*.8 };
			scene.add(sp); mist.push(sp);
		}
	}
	function store(){
		const p0 = tube.position.clone(), s0 = tube.scale.x, dest = target.g.position.clone().add(new THREE.Vector3(0, .9, .2));
		const look0 = look.clone(), look1 = new THREE.Vector3(dest.x - .6, 2.0, dest.z);
		anim = { t:0, p0, s0, dest, look0, look1 };
		setTimeout(() => play("chime"), 900);
	}
	function stepAnim(dt){
		if(!anim) return;
		anim.t += dt;
		const t = anim.t, e = k => k < .5 ? 2*k*k : 1 - (-2*k + 2)**2/2, cl = (a, b) => Math.max(0, Math.min(1, (t - a)/(b - a)));
		// 0,8 s : lecture du code-barres ; puis la caméra glisse vers le congélateur
		const kc = e(cl(.8, 2.2)); look.lerpVectors(anim.look0, anim.look1, kc); frame();
		target.hinge.rotation.y = -1.7*e(cl(1.2, 1.9)) + 1.7*e(cl(3.0, 3.5));
		const lift = e(cl(1.1, 1.7)), move = e(cl(1.7, 2.9));
		tube.position.set(anim.p0.x + (anim.dest.x - anim.p0.x)*move, anim.p0.y + 1.2*lift + (anim.dest.y - anim.p0.y - 1.2)*move, anim.p0.z + (anim.dest.z - anim.p0.z)*move);
		tube.scale.setScalar(anim.s0*(1 - .82*move));
		tube.rotation.y = move*1.2;
		if(t > 3.45 && !anim.puffed){ anim.puffed = true; puff(26); play("pop"); }
		if(t > 4.6 && !anim.done){ anim.done = true; ov.classList.add("out"); setTimeout(finish, 650); }
	}
	function finish(){ if(closed) return; dispose(); onDone && onDone(); }

	/* ---------- boucle ---------- */
	function loop(now){
		if(closed) return;
		const dt = Math.min(.05, (now - (last || now))/1000); last = now;
		if(!anim) tube.rotation.y = Math.atan2(camera.position.x - tube.position.x, camera.position.z - tube.position.z) + Math.sin(now/2600)*.05;      // l'étiquette fait face au joueur
		for(const s of strips){
			if(s.state === "rm"){ s.off += (s.peel*3.2 - s.off)*Math.min(1, dt*6); s.mesh.rotation.z = -s.off*.25; s.mesh.position.x = s.off; s.mesh.position.z = Math.abs(s.off)*.6;
				if(Math.abs(s.off) > 3) s.mesh.visible = false; s.ghost.material.opacity = .22 + .12*Math.sin(now/300); }
			else { s.ghost.material.opacity = 0; if(!drag || drag.s !== s) s.off *= Math.max(0, 1 - dt*10); s.mesh.position.x = s.off*.5; s.mesh.rotation.z = -s.off*.12; s.mesh.position.z = Math.abs(s.off)*.25; }
			if(s.flash > 0){ s.flash -= dt; s.mesh.material.emissive.set(s.state === s.f.a ? "#3fbf7f" : "#e05a4f"); s.mesh.material.emissiveIntensity = Math.max(0, Math.sin(s.flash*9))*.55; if(s.state === "rm" && s.state !== s.f.a) s.ghost.material.color.set("#e05a4f"); }
			else { s.mesh.material.emissiveIntensity = 0; s.ghost.material.color.set("#cb971a"); }
		}
		for(let i = mist.length - 1; i >= 0; i--){ const sp = mist[i], u = sp.userData; u.life -= dt; sp.position.addScaledVector(u.v, dt); sp.scale.multiplyScalar(1 + dt*.8); sp.material.opacity = Math.max(0, .55*u.life/2);
			if(u.life <= 0){ scene.remove(sp); sp.material.dispose(); mist.splice(i, 1); } }
		stepAnim(dt);
		renderer.render(scene, camera);
		raf = requestAnimationFrame(loop);
	}
	raf = requestAnimationFrame(loop);

	function dispose(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); removeEventListener("resize", frame);
		scene.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } });
		renderer.dispose(); renderer.forceContextLoss(); ov.remove();
	}
	return { close:dispose, strips, solve(){ strips.forEach(s => { s.state = s.f.a; if(s.state === "rm"){ s.peel = 1; } paint(s); }); counts(); } };
}
