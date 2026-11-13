/* Ossature 3D invisible des mini-jeux des prépas (nov. 2026) : le rendu, la caméra, le toucher. Rien de visible :
   chaque jeu construit son propre décor, son interface et ses gestes (voir la note « chaque jeu, son univers »).
   Elle règle une fois pour toutes ce qui a piégé les jeux précédents :
   - le canevas prend la taille de l'écran (sinon, sur écran haute densité, on ne voit que son quart) ;
   - l'image est décalée pour que la scène ne se cache pas sous le panneau (à droite, ou en bas sur téléphone),
     et la caméra recule sur un écran en hauteur ; le cadrage se refait quand le format change ;
   - les étiquettes gardent une taille constante à l'écran, réduite sur téléphone. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export { THREE };

export function stage3d(canvas, o = {}){
	const panel = o.panel, side = o.side || "right", PW = o.panelW || 400, MOBILE = 760;
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	if(o.shadows !== false){ renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
	canvas.style.width = "100%"; canvas.style.height = "100%";
	const scene = new THREE.Scene(); scene.background = new THREE.Color(o.bg || "#dfe6ee");
	if(o.fog) scene.fog = new THREE.Fog(o.bg || "#dfe6ee", o.fog[0], o.fog[1]);
	const camera = new THREE.PerspectiveCamera(o.fov || 38, 1, o.near || .3, o.far || 800);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false;
	controls.minDistance = o.minD ?? 4; controls.maxDistance = o.maxD ?? 200; controls.maxPolarAngle = o.maxPolar ?? 1.3; controls.minPolarAngle = o.minPolar ?? .15;
	if(o.rotate === false) controls.enableRotate = false;

	const own = [];
	const M = (c, op = {}) => { const m = new THREE.MeshStandardMaterial({ color:c, roughness:.8, ...op }); own.push(m); return m; };
	const G = g => (own.push(g), g);
	function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene){ const m = new THREE.Mesh(geo, typeof mat === "string" ? M(mat) : mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
	const box = (w, h, d, c, x, y, z, parent) => mesh(G(new THREE.BoxGeometry(w, h, d)), c, x, y + h/2, z, parent);
	const cyl = (rt, rb, h, c, x, y, z, parent, seg = 20) => mesh(G(new THREE.CylinderGeometry(rt, rb, h, seg)), c, x, y + h/2, z, parent);
	function canvasTex(w, h, draw){ const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); draw && draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; own.push(t); t.ctx = x; t.redraw = f => { f(x, w, h); t.needsUpdate = true; }; return t; }
	function label(text, op = {}){
		const c = document.createElement("canvas"), x = c.getContext("2d"), f = `${op.weight || 900} 40px ${op.font || "Nunito, system-ui, sans-serif"}`;
		x.font = f; const w = Math.ceil(x.measureText(text).width) + 36, h = 62; c.width = w; c.height = h; x.font = f;
		x.fillStyle = op.bg || "#fffdf7"; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, 12); x.fill();
		if(op.line){ x.strokeStyle = op.line; x.lineWidth = 3; x.stroke(); }
		x.fillStyle = op.fg || "#1d2a22"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 2);
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
		const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, depthTest:false, transparent:true, sizeAttenuation:false }));
		// sur téléphone, l'image décalée sous le panneau grossit les étiquettes : on les réduit
		const s = (op.size || .03)*(innerWidth < MOBILE ? .55 : 1);
		sp.scale.set(s*w/h, s, 1); sp.renderOrder = 20; own.push(t, sp.material);
		return sp;
	}

	/* --- caméra --- */
	const ease = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	let cam = null, lastFly = null, lastAspect = 0;
	function fly(target, dist, polar = .9, az = 0, dur = 1.4){
		lastFly = [target.clone(), dist, polar, az];
		const k = camera.aspect < 1 ? Math.min(3.6, 1.1/camera.aspect) : 1;
		const d = Math.min(controls.maxDistance, Math.max(controls.minDistance, dist*k));
		const t1 = target.clone(), p1 = new THREE.Vector3(Math.sin(polar)*Math.sin(az), Math.cos(polar), Math.sin(polar)*Math.cos(az)).multiplyScalar(d).add(t1);
		cam = { k:0, dur, p0:camera.position.clone(), t0:controls.target.clone(), p1, t1 };
	}
	function place(target, dist, polar, az){ fly(target, dist, polar, az, .01); }
	let VO = "";
	function resize(){
		const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h;
		if(panel && side !== "none"){
			if(w < MOBILE){ const d = Math.min(h*.55, panel.offsetHeight + 8); if(d > 20) camera.setViewOffset(w, h + d, 0, d, w, h); else camera.clearViewOffset(); VO = "b" + Math.round(d); }
			else if(side === "right"){ camera.setViewOffset(w + PW, h, PW, 0, w, h); VO = "r"; }
			else if(side === "bottom"){ const d = Math.min(h*.5, panel.offsetHeight + 12); camera.setViewOffset(w, h + d, 0, d, w, h); VO = "b" + Math.round(d); }
		}
		camera.updateProjectionMatrix();
		if(lastFly && Math.abs(camera.aspect - lastAspect) > .05) fly(lastFly[0], lastFly[1], lastFly[2], lastFly[3], .4);
		lastAspect = camera.aspect;
	}
	addEventListener("resize", resize);

	/* --- toucher et glisser --- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	let taps = [], onTap = null, drags = [], onDrag = null, onDrop = null, dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), drag = null, down = null;
	const setRay = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera); };
	const vis = obj => { for(let n = obj; n; n = n.parent) if(!n.visible) return false; return true; };
	const hitOf = (list, e) => { setRay(e); const live = list.filter(t => vis(t.hit)); const h = ray.intersectObjects(live.map(t => t.hit), true)[0]; if(!h) return null; return live.find(t => { for(let n = h.object; n; n = n.parent) if(n === t.hit) return true; return false; }) || null; };
	canvas.addEventListener("pointerdown", e => {
		down = { x:e.clientX, y:e.clientY };
		if(drags.length){ const d = hitOf(drags, e); if(d){ drag = d; controls.enabled = false; canvas.setPointerCapture(e.pointerId); } }
	});
	canvas.addEventListener("pointermove", e => {
		if(!drag) return; setRay(e);
		const p = ray.ray.intersectPlane(dragPlane, new THREE.Vector3()); if(p && onDrag) onDrag(drag, p, e);
	});
	canvas.addEventListener("pointerup", e => {
		if(drag){ const d = drag; drag = null; controls.enabled = true; setRay(e); const p = ray.ray.intersectPlane(dragPlane, new THREE.Vector3()); onDrop && onDrop(d, p, e); down = null; return; }
		if(!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10){ down = null; return; }
		down = null; if(!onTap) return;
		const t = hitOf(taps, e); onTap(t ? t.id : null, e);
	});

	/* --- boucle --- */
	const hooks = new Set();
	let raf = 0, last = performance.now();
	function frame(now){
		raf = requestAnimationFrame(frame);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		if(cam){ cam.k = Math.min(1, cam.k + dt/cam.dur); const e = ease(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		for(const f of hooks) f(now, dt);
		if(panel && innerWidth < MOBILE && VO !== "b" + Math.round(Math.min(innerHeight*.55, panel.offsetHeight + 8))) resize();
		controls.update();
		renderer.render(scene, camera);
	}
	resize();
	raf = requestAnimationFrame(frame);

	return {
		THREE, renderer, scene, camera, controls, M, G, mesh, box, cyl, canvasTex, label, fly, place, resize, ease,
		onFrame(f){ hooks.add(f); return () => hooks.delete(f); },
		setTaps(list, cb){ taps = list; onTap = cb; },
		setDrags(list, plane, move, drop){ drags = list; if(plane) dragPlane = plane; onDrag = move; onDrop = drop; },
		clearInput(){ taps = []; onTap = null; drags = []; onDrag = onDrop = null; drag = null; controls.enabled = true; },
		tap(id){ onTap && onTap(id); },
		dispose(){ cancelAnimationFrame(raf); hooks.clear(); removeEventListener("resize", resize); controls.dispose(); own.forEach(q => q.dispose && q.dispose()); renderer.dispose(); renderer.forceContextLoss(); }
	};
}
