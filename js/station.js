/* Une station souterraine de la ligne 2 (métro VAL de Lille) : quai, portes palières, rame à deux voitures.
   Utilisée à Canteleu – Euratechnologies (quartier Wenov) et à Cormontaigne / Port de Lille (Vauban).
   Elle n'est affichée que pendant les cinématiques :
   - « arrive » : la rame entre en station, les portes s'ouvrent, on descend, fondu, on ressort dans la rue ;
   - « depart » : on descend depuis la rue (fondu), on monte à bord, les portes se ferment, la rame part. */
import * as THREE from "three";
import { std, box, beam, makePerson } from "./kit.js?v=5edcdae804";

function stationWall(name){
	const c = document.createElement("canvas"); c.width = 512; c.height = 128; const x = c.getContext("2d");
	x.fillStyle = "#eef0ee"; x.fillRect(0, 0, 512, 128);
	x.fillStyle = "rgba(0,0,0,.06)"; for(let i=0;i<512;i+=16) x.fillRect(i, 0, 1, 128); for(let j=0;j<128;j+=16) x.fillRect(0, j, 512, 1);
	x.fillStyle = "#d6213a"; x.fillRect(0, 84, 512, 10);
	x.fillStyle = "#2b3442"; x.fillRect(118, 26, 290, 40);
	x.fillStyle = "#ffffff"; x.font = `bold ${name.length > 20 ? 17 : 22}px Arial`; x.textAlign = "center"; x.fillText(name, 263, 53);
	x.fillStyle = "#d6213a"; x.fillRect(84, 30, 28, 32); x.fillStyle = "#fff"; x.font = "bold 20px Arial"; x.fillText("M", 98, 54);
	const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* exit : bouche de métro [x, z] (l'escalier y débouche) ; face : point vers lequel le quai regarde */
export function buildStation(scene, { exit, face, name }){
	const g = new THREE.Group(); scene.add(g); g.visible = false;
	const ry = Math.atan2(face[0] - exit[0], face[1] - exit[1]);
	g.rotation.y = ry;
	const SH = [22, 5.2], Y0 = -11;
	const off = new THREE.Vector3(SH[0], 0, SH[1]).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
	g.position.set(exit[0] - off.x, Y0, exit[1] - off.z);
	const mat = (c, o = {}) => std(c, { flatShading:false, ...o });
	const wallTex = stationWall(name); wallTex.repeat.set(4, 1);
	const wallM = new THREE.MeshStandardMaterial({ map:wallTex, roughness:.6 });
	box(g, 60, .4, 8.4, mat("#b9b4ac"), 0, -.4, 4.2, 0, false);                          // quai
	box(g, 60, .3, 8.2, mat("#3a3a3f"), 0, -1.5, -4.1, 0, false);                         // fond de voie
	for(const z of [-5.4, -2.8]) box(g, 60, .3, .6, mat("#8e8b86"), 0, -1.2, z, 0, false); // pistes de roulement (pneus)
	box(g, 60, .25, .3, mat("#6b6f76"), 0, -.9, -4.1, 0, false);                          // rail de guidage
	box(g, 60, .06, .35, mat("#f2c63c"), 0, 0, .3, 0, false);                             // bande d'éveil
	const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 7.4), wallM); back.position.set(0, 2.3, 8.4); back.rotation.y = Math.PI; g.add(back);
	const far = new THREE.Mesh(new THREE.PlaneGeometry(60, 8.6), wallM); far.position.set(0, 2.1, -8.2); g.add(far);
	const ceil = mat("#e6e2da", { emissive:"#a39d92", emissiveIntensity:.45 });
	box(g, 48, .3, 16.6, ceil, -6, 6, 0, 0, false); box(g, 12, .3, 10.2, ceil, 24, 6, -3.2, 0, false);      // trémie ouverte au-dessus de l'escalier
	for(let x=-26; x<=26; x+=6.5) box(g, 4, .1, .5, std("#fff6e2", { emissive:"#fff1d0", emissiveIntensity:1.4, flatShading:false }), x, 5.8, 3.2, 0, false);
	for(const sx of [-1, 1]){
		box(g, .3, 7.6, 8.4, mat("#cfcac2"), sx*30, -1.6, 4.2, 0, false);
		box(g, .3, 2.6, 8.2, mat("#cfcac2"), sx*30, 3.6, -4.1, 0, false);
		const tube = new THREE.Mesh(new THREE.BoxGeometry(60, 5.2, 8.2), std("#15171c", { side:THREE.BackSide }));
		tube.position.set(sx*60, 1, -4.1); g.add(tube);
	}
	// portes palières vitrées, alignées sur les portes de la rame
	const glassM = new THREE.MeshStandardMaterial({ color:"#cfe2ea", transparent:true, opacity:.35, roughness:.1, metalness:.2, depthWrite:false });
	const DOORS = [-9.4, -3.4, 3.4, 9.4];
	for(let x=-28; x<28; x+=2){ if(DOORS.some(d => Math.abs(x + 1 - d) < 1.3)) continue; box(g, 1.9, 2.4, .08, glassM, x + 1, 0, .1, 0, false); }
	box(g, 60, .25, .2, mat("#5d636b"), 0, 2.4, .1, 0, false);
	for(const x of [-18, 18]) box(g, 2.4, .5, .7, mat("#c79a6a"), x, 0, 6.2, 0, false);
	// escalier mécanique vers la rue
	beam(g, new THREE.Vector3(17, 0, 5.2), new THREE.Vector3(27, 11.2, 5.2), 2.6, .5, mat("#8d9097"));
	for(const sz of [3.8, 6.6]) beam(g, new THREE.Vector3(17, 1, sz), new THREE.Vector3(27, 12.2, sz), .25, 1, mat("#2f3a4a"));
	box(g, 8.4, 11.4, .3, wallM, 22, 0, 2, 0, false); box(g, 8.4, 11.4, .3, wallM, 22, 0, 8.4, 0, false);

	// la rame VAL : deux voitures, portes coulissantes côté quai
	const train = new THREE.Group(); g.add(train);
	const white = mat("#eef0f2"), band = mat("#26303d"), red = mat("#d6213a"), skirt = mat("#c3c8ce");
	const leaves = [];
	for(const cx of [-6.4, 6.4]){
		box(train, 12.4, 3.1, 3.2, white, cx, -.7, -4.1); box(train, 12.4, .5, 3.25, skirt, cx, -.9, -4.1);
		box(train, 12.2, 1.1, 3.26, band, cx, .9, -4.1); box(train, 12.42, .22, 3.27, red, cx, .3, -4.1);
		for(const d of [-3, 3]) for(const sd of [-1, 1]){
			const leaf = new THREE.Mesh(new THREE.BoxGeometry(.9, 2.3, .08), mat("#dfe3e7")); leaf.position.set(cx + d + sd*.45, .45, -2.46); train.add(leaf);
			leaves.push({ m:leaf, x0:cx + d + sd*.45, s:sd });
		}
	}
	for(const sx of [-1, 1]){ const nose = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.9, 3), white); nose.position.set(sx*13, .55, -4.1); nose.rotation.z = sx*.18; train.add(nose); box(train, .1, 1, 2.2, band, sx*13.5, .9, -4.1); }
	const riders = [];
	for(const [k, d] of [[0, -9.4], [1, -3.4], [2, 3.4], [3, 9.4], [4, 3.4]]){
		const st = makePerson(g); st.g.visible = false;
		riders.push({ s:st, d:d + (k === 4 ? .7 : 0), ph:k*.25 });
	}
	g.traverse(o => { if(o.isMesh){ o.castShadow = false; o.receiveShadow = false; } });

	const L = p => g.localToWorld(new THREE.Vector3(...p));
	const ease = k => 1 - Math.pow(1 - k, 3), easeIn = k => k*k*k, smooth = k => k*k*(3 - 2*k), clamp = k => Math.max(0, Math.min(1, k));
	const st = { on:false, t:0, mode:"arrive", dur:9.5 };
	let rise = null, street = null;
	const setDoors = open => leaves.forEach(l => l.m.position.x = l.x0 + l.s*open*.85);
	// un passager entre le quai (w = 1) et l'intérieur de la rame (w = 0)
	const place = (r, w, t, walking) => {
		r.s.g.position.set(r.d + Math.sin(r.ph*9)*.6*w, -.9 + Math.min(.9, w*3), -4.1 + w*8.5);
		r.s.body.position.y = .65 + (walking ? Math.abs(Math.sin(t*7 + r.ph*4))*.07 : 0);
	};

	function start(mode, a, b){
		g.updateMatrixWorld(true);
		st.on = true; st.t = 0; st.mode = mode; g.visible = true;
		if(mode === "arrive"){
			st.dur = 9.5;
			// après un court fondu, on repart de la bouche de métro, dans la rue, et la caméra s'élève vers le lieu visé
			const s0 = L([27.5, 12.6, 5.2]);
			rise = { pos:new THREE.CatmullRomCurve3([s0, s0.clone().lerp(a, .35).setY(s0.y + 6), a.clone()]), tgt:new THREE.CatmullRomCurve3([b.clone().setY(s0.y + 1.5), b.clone()]) };
			train.position.x = -75; setDoors(0);
			riders.forEach(r => { r.s.g.visible = false; place(r, 0, 0, false); });
		} else {
			st.dur = 7.6;
			// on part de la vue actuelle, dans la rue, au-dessus de la bouche de métro
			street = { pos:a.clone(), tgt:b.clone(), down:L([28, 13.5, 5.2]) };
			train.position.x = 0; setDoors(1);
			riders.forEach(r => { r.s.g.visible = true; place(r, 1, 0, false); });
		}
	}
	function stop(){ st.on = false; g.visible = false; }
	function tick(dt){
		if(!st.on) return;
		st.t += dt;
		const t = st.t;
		if(st.mode === "arrive"){
			train.position.x = -75*(1 - ease(clamp(t/4.2)));
			setDoors(smooth(clamp((t - 4.5)/.7)));
			riders.forEach(r => { const w = clamp((t - 5.1 - r.ph)/1.4); r.s.g.visible = t > 4.9; place(r, w, t, w > 0 && w < 1); });
		} else {
			riders.forEach(r => { const w = 1 - clamp((t - 1.2 - r.ph)/1.4); r.s.g.visible = w > .02; place(r, w, t, w > 0 && w < 1); });
			setDoors(1 - smooth(clamp((t - 3.4)/.7)));
			train.position.x = 75*easeIn(clamp((t - 4.3)/3.1));
			train.visible = true;
		}
	}
	const P = new THREE.Vector3(), T = new THREE.Vector3();
	function cam(){
		const t = st.t;
		if(st.mode === "arrive"){
			if(t < 6.5){
				const k = smooth(clamp(t/6.5));
				P.copy(L([14 - 4*k, 2.7, 6.6 - .6*k]));
				const fx = Math.min(4, train.position.x + 12);
				T.copy(L([t < 4.6 ? fx : fx*(1 - smooth((t - 4.6)/1.6)), 1.6, t < 4.6 ? -4.1 : -4.1 + 1.7*smooth((t - 4.6)/1.6)]));
			} else {
				const k = smooth(clamp((t - 6.5)/(st.dur - 6.5)));
				P.copy(rise.pos.getPoint(k)); T.copy(rise.tgt.getPoint(k));
			}
			return { pos:P, target:T, done:t >= st.dur, fade:t > 6.05 && t < 6.75, under:t < 6.4 };
		}
		// départ : la caméra plonge vers la bouche de métro, fondu, puis le quai et la rame qui s'en va
		if(t < .8){
			const k = smooth(clamp(t/.8));
			P.copy(street.pos).lerp(street.down, k); T.copy(street.tgt).lerp(L([28, 0, 5.2]), k);
			return { pos:P, target:T, done:false, fade:t > .45, under:false };
		}
		const k = smooth(clamp((t - 1)/6));
		P.copy(L([9 + 3*k, 2.7, 6.4]));
		T.copy(L([t < 4.3 ? 0 : Math.min(30, train.position.x*.6), 1.6, -3.4]));
		return { pos:P, target:T, done:t >= st.dur, fade:t < 1.05 || t > st.dur - .35, under:true };
	}
	return { start, stop, tick, cam, name, get on(){ return st.on; } };
}
