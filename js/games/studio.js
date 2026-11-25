/* Qualité de rendu commune aux mini-jeux (nov. 2026) : rien qui change l'univers d'un jeu, seulement la façon
   dont il est photographié.
   - Reflets : une pièce de studio (murs neutres, grandes boîtes à lumière) est générée en code et sert de reflet
     à toutes les matières. Le métal, le verre, le vernis du bois et les écrans reflètent enfin quelque chose.
     La lumière hémisphérique du jeu baisse d'autant, pour garder la même exposition.
   - Fond : l'aplat de couleur du jeu devient un fond de pièce (plus clair au centre, plus sombre aux bords et au sol).
   - Ombres douces.
   - Sur ordinateur : légère profondeur de champ façon maquette (le haut et le bas de l'image s'adoucissent).
   Usage, une fois le rendu et la scène créés :  studio(renderer, scene, { dof:true, warm:.5, env:.6 })
   Tout est libéré avec renderer.dispose(). */
import * as THREE from "three";

function roomScene(warm){
	const s = new THREE.Scene();
	const room = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 14), new THREE.MeshBasicMaterial({ color:new THREE.Color(.42, .41, .4), side:THREE.BackSide }));
	room.position.y = 3; s.add(room);
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({ color:new THREE.Color(.2, .19, .18) }));
	floor.position.y = -.99; s.add(floor);
	const k = new THREE.Color(1, .93 - .06*warm, .84 - .14*warm), f = new THREE.Color(.82, .9, 1);
	const panel = (w, h, c, I, x, y, z, ry = 0, rx = 0) => {
		const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color:c.clone().multiplyScalar(I), side:THREE.DoubleSide }));
		m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
	};
	panel(5, 3, k, 9, -3.5, 6.9, 1.5, 0, Math.PI/2);          // boîte à lumière principale, au plafond
	panel(3, 4, k, 5, -6.9, 3, -1, Math.PI/2);                // fenêtre à gauche
	panel(2.4, 4, f, 3.2, 6.9, 2.8, 2, -Math.PI/2);           // débouchage froid à droite
	panel(6, 1.2, f, 2.2, 0, 4.5, -6.9);                       // bandeau du fond (liseré sur les bords des objets)
	return s;
}

function backdrop(color){
	const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d");
	const base = new THREE.Color(color), hi = base.clone().lerp(new THREE.Color("#ffffff"), .07), lo = base.clone().multiplyScalar(.8);
	const g = x.createRadialGradient(256, 210, 30, 256, 256, 380);
	g.addColorStop(0, "#" + hi.getHexString()); g.addColorStop(.55, "#" + base.getHexString()); g.addColorStop(1, "#" + lo.getHexString());
	x.fillStyle = g; x.fillRect(0, 0, 512, 512);
	const v = x.createLinearGradient(0, 300, 0, 512); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.1)");
	x.fillStyle = v; x.fillRect(0, 300, 512, 212);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

const TILT = {
	uniforms:{ tDiffuse:{ value:null }, dir:{ value:new THREE.Vector2() }, amount:{ value:5 }, focus:{ value:.5 }, band:{ value:.22 } },
	vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4( position, 1.0 ); }",
	fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 dir; uniform float amount, focus, band; varying vec2 vUv;
		void main(){
			float d = max( abs( vUv.y - focus ) - band, 0.0 )/( 1.0 - band );
			float r = amount*d*d*2.2;
			if( r < 0.05 ){ gl_FragColor = texture2D( tDiffuse, vUv ); return; }
			vec4 s = vec4( 0.0 ); float w = 0.0;
			for( int i = -4; i <= 4; i++ ){ float fi = float( i ), k = exp( -fi*fi/8.0 ); s += texture2D( tDiffuse, vUv + dir*fi*r*0.25 )*k; w += k; }
			gl_FragColor = s/w; }`
};

export function studio(renderer, scene, o = {}){
	const own = [];
	// reflets du studio
	const pmrem = new THREE.PMREMGenerator(renderer);
	const room = roomScene(o.warm ?? .4);
	const envRT = pmrem.fromScene(room, .035);
	room.traverse(m => { if(m.isMesh){ m.geometry.dispose(); m.material.dispose(); } });
	pmrem.dispose(); own.push(envRT);
	if(!scene.environment) scene.environment = envRT.texture;
	scene.environmentIntensity = o.env ?? .55;
	if(renderer.shadowMap.enabled) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	let lit = false, bgColor = null, bgTex = null;
	function prep(){
		if(!lit){ lit = true; scene.traverse(l => { if(l.isHemisphereLight || l.isAmbientLight) l.intensity *= o.hemiK ?? .72; }); }
		const b = scene.background;
		if(o.backdrop !== false && b && b.isColor){
			if(!bgColor || !bgColor.equals(b)){ bgColor = b.clone(); if(bgTex) bgTex.dispose(); bgTex = backdrop(b); }
			scene.background = bgTex; scene.userData.studioBg = bgColor;
		}
	}
	// les jeux qui remettent une couleur de fond (changement d'heure, d'étape) : on la reprend à la prochaine image
	const orig = renderer.render.bind(renderer);
	const wide = innerWidth >= 900 && !renderer.getContextAttributes().alpha;
	const dofOn = o.dof !== false && wide;
	let composer = null, tiltH = null, tiltV = null, inside = false, rp = null;
	const size = new THREE.Vector2();
	async function makeComposer(){
		const [{ EffectComposer }, { RenderPass }, { ShaderPass }, { OutputPass }] = await Promise.all([
			import("three/addons/postprocessing/EffectComposer.js"), import("three/addons/postprocessing/RenderPass.js"),
			import("three/addons/postprocessing/ShaderPass.js"), import("three/addons/postprocessing/OutputPass.js")]);
		renderer.getDrawingBufferSize(size);
		const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type:THREE.HalfFloatType, samples:4 });
		const c = new EffectComposer(renderer, rt);
		rp = new RenderPass(scene, null);
		tiltH = new ShaderPass(TILT); tiltV = new ShaderPass(TILT);
		for(const p of [tiltH, tiltV]){ p.uniforms.amount.value = o.dofAmount ?? 5; p.uniforms.focus.value = o.focus ?? .5; }
		c.addPass(rp); c.addPass(tiltH); c.addPass(tiltV); c.addPass(new OutputPass());
		own.push(c, rt);
		composer = c;
	}
	if(dofOn) makeComposer().catch(() => {});
	renderer.render = (s, cam) => {
		if(s === scene && !inside) prep();
		if(s !== scene || inside || !composer) return orig(s, cam);
		inside = true;
		renderer.getDrawingBufferSize(size);
		if(composer.renderTarget1.width !== size.x || composer.renderTarget1.height !== size.y){ composer.setPixelRatio(1); composer.setSize(size.x, size.y); }
		tiltH.uniforms.dir.value.set(1/size.x, 0); tiltV.uniforms.dir.value.set(0, 1/size.y);
		rp.camera = cam;
		try { composer.render(); } finally { inside = false; }
	};
	const dispose = renderer.dispose.bind(renderer);
	renderer.dispose = () => { own.forEach(q => q.dispose && q.dispose()); if(bgTex) bgTex.dispose(); renderer.render = orig; renderer.dispose = dispose; dispose(); };
	return { envMap:envRT.texture };
}
