/* Outils de rendu : regroupement des objets immobiles, instanciation des petits personnages,
   ciel et reflets d'environnement, post-traitement (qualité haute) et petits effets de shader
   (vent dans les arbres, eau qui ondule, ombre de contact au pied des murs, fenêtres qui s'allument). */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/* Horloge partagée par les shaders animés (vent, eau). */
export const TIME = { value:0 };

/* =====================================================================
   Regroupement des objets immobiles
   Chaque bâtiment fait main est construit avec des centaines de petites formes (boîtes, cylindres…) :
   autant d'appels de dessin. On les fusionne par matériau (et par lieu cliquable), une fois pour toutes.
   ===================================================================== */
// formes qu'on garde à facettes (style low-poly) même quand le matériau est lissé
const FACETED = new Set(["IcosahedronGeometry", "OctahedronGeometry", "DodecahedronGeometry", "TetrahedronGeometry", "ConeGeometry"]);
const facets = g => FACETED.has(g.type) || (g.type === "CylinderGeometry" && g.parameters.radialSegments <= 6);
const KEEP = ["position", "normal", "uv", "color"];
function flipWinding(g){
	for(const a of Object.values(g.attributes)){
		const n = a.itemSize, arr = a.array;
		for(let i=0; i<a.count; i+=3) for(let k=0; k<n; k++){ const t = arr[(i+1)*n + k]; arr[(i+1)*n + k] = arr[(i+2)*n + k]; arr[(i+2)*n + k] = t; }
	}
}
function prep(o, color){
	let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
	for(const k of Object.keys(g.attributes)) if(!KEEP.includes(k)) g.deleteAttribute(k);
	g.morphAttributes = {}; g.clearGroups();
	if(facets(o.geometry) || !g.attributes.normal) g.computeVertexNormals();      // non indexé : une normale par face
	const n = g.attributes.position.count;
	if(!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n*2), 2));
	if(color && !g.attributes.color) g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(n*3).fill(1), 3));
	if(!color && g.attributes.color) g.deleteAttribute("color");
	g.applyMatrix4(o.matrixWorld);
	if(o.matrixWorld.determinant() < 0) flipWinding(g);
	return g;
}
/* root : la scène. Ne touche ni aux objets cachés, ni aux objets marqués userData.dynamic (ni à leurs enfants),
   ni aux maillages instanciés, ni aux matériaux transparents (leur ordre de dessin compte). */
export function bakeStatic(root){
	root.updateMatrixWorld(true);
	const groups = new Map();
	const still = o => { for(let p = o; p && p !== root; p = p.parent) if(!p.visible || p.userData.dynamic) return false; return true; };
	root.traverse(o => {
		if(!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || !still(o)) return;
		const m = o.material;
		// les vitres d'un même matériau peuvent être fusionnées (elles n'écrivent pas la profondeur) ; pas celles qui ont un ordre imposé
		if(o.renderOrder || !o.geometry.attributes.position || o.layers.mask !== 1) return;
		const k = `${m.uuid}|${+o.castShadow}${+o.receiveShadow}|${o.userData.place || ""}|${o.userData.chime ? 1 : 0}|${o.userData.spot || ""}`;
		if(!groups.has(k)) groups.set(k, []);
		groups.get(k).push(o);
	});
	const out = [], mats = new Set();
	for(const list of groups.values()){
		const m = list[0].material;
		const geo = mergeGeometries(list.map(o => prep(o, !!m.vertexColors)), false);
		if(!geo){ console.warn("bakeStatic : fusion impossible", m.name || m.uuid); continue; }
		geo.computeBoundingSphere(); geo.computeBoundingBox();
		const me = new THREE.Mesh(geo, m);
		me.castShadow = list[0].castShadow; me.receiveShadow = list[0].receiveShadow;
		Object.assign(me.userData, list[0].userData);
		for(const o of list) o.parent.remove(o);
		root.add(me); out.push(me); mats.add(m);
	}
	// les facettes voulues sont maintenant dans la géométrie : le matériau peut lisser le reste (colonnes, tours, dômes)
	for(const m of mats) if(m.flatShading){ m.flatShading = false; m.needsUpdate = true; }
	return out;
}

/* =====================================================================
   Petits personnages animés (étudiants, pigeons, canards, nuages) : on garde leurs groupes pour l'animation,
   mais on les dessine en quelques maillages instanciés (un par forme × couleur) au lieu d'un appel par pièce.
   ===================================================================== */
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const family = m => [m.type, m.flatShading, m.roughness, m.metalness, m.transparent, m.opacity, m.map ? m.map.uuid : "", m.emissive ? m.emissive.getHex() : "", m.emissiveIntensity, m.side].join("|");
export function proxyInstances(scene, roots, { receiveShadow = false } = {}){
	const buckets = new Map();
	for(const r of roots){
		r.userData.dynamic = true;
		r.traverse(o => {
			if(!o.isMesh || o.isInstancedMesh) return;
			const k = o.geometry.uuid + "|" + family(o.material);
			if(!buckets.has(k)) buckets.set(k, { geo:o.geometry, mats:new Set(), list:[] });
			const b = buckets.get(k); b.list.push({ o, r }); b.mats.add(o.material);
			o.layers.set(31);          // l'original ne se dessine plus (ni dans l'image, ni dans les ombres)
		});
	}
	const meshes = [];
	for(const b of buckets.values()){
		// un seul matériau : on le garde tel quel ; plusieurs couleurs : un matériau blanc, la couleur de chacun par instance
		b.tint = b.mats.size > 1;
		const first = [...b.mats][0];
		b.mat = b.tint ? first.clone() : first;
		if(b.tint) b.mat.color.set(1, 1, 1);
		const im = new THREE.InstancedMesh(b.geo, b.mat, b.list.length);
		im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		im.frustumCulled = false; im.castShadow = false; im.receiveShadow = receiveShadow;
		im.userData.dynamic = true;
		scene.add(im); meshes.push(im); b.im = im;
	}
	const shown = (o, r) => { for(let p = o; p; p = p.parent){ if(!p.visible) return false; if(p === r) return true; } return true; };
	return {
		meshes,
		update(){
			for(const r of roots) r.updateMatrixWorld(true);
			for(const b of buckets.values()){
				for(let i=0; i<b.list.length; i++){ const { o, r } = b.list[i]; b.im.setMatrixAt(i, shown(o, r) ? o.matrixWorld : ZERO); if(b.tint) b.im.setColorAt(i, o.material.color); }
				b.im.instanceMatrix.needsUpdate = true;
				if(b.tint) b.im.instanceColor.needsUpdate = true;
			}
		}
	};
}

/* Ombre ronde au pied d'un personnage (remplace son ombre portée : la carte d'ombres n'a plus à être recalculée
   à chaque image pour des passants qui bougent). */
let blobGeo = null, blobMat = null;
export function blobShadow(){
	if(!blobMat){
		const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
		const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
		g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(.55, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
		x.fillStyle = g; x.fillRect(0, 0, 64, 64);
		blobMat = new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c), color:"#1d1622", transparent:true, opacity:.34, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4, polygonOffsetUnits:-8 });
		blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI/2);
	}
	const m = new THREE.Mesh(blobGeo, blobMat);
	m.castShadow = m.receiveShadow = false;
	return m;
}
export const blobMaterial = () => blobMat;

/* =====================================================================
   Ciel : dégradé, brume à l'horizon, soleil (ou lune). Rendu dans un cube (fond de scène),
   puis filtré (PMREM) pour éclairer la scène : les vitres et l'eau reflètent le vrai ciel.
   ===================================================================== */
export function createSky(renderer){
	const U = {
		top:{ value:new THREE.Color() }, bot:{ value:new THREE.Color() }, fogC:{ value:new THREE.Color() }, ground:{ value:new THREE.Color() },
		sunDir:{ value:new THREE.Vector3(0, 1, 0) }, sunC:{ value:new THREE.Color() }, sunK:{ value:1 }, disc:{ value:1 }
	};
	const mat = new THREE.ShaderMaterial({
		uniforms:U, side:THREE.BackSide, depthWrite:false, depthTest:false, fog:false,
		vertexShader:`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
		fragmentShader:`uniform vec3 top, bot, fogC, ground, sunC, sunDir; uniform float sunK, disc; varying vec3 vDir;
			void main(){
				vec3 d = normalize( vDir ); float h = d.y;
				vec3 c = mix( bot, top, smoothstep( 0.0, 0.62, h ) );
				c = mix( c, fogC, smoothstep( 0.16, -0.02, h ) );                  // brume à l'horizon (= couleur du brouillard)
				c = mix( c, ground, smoothstep( -0.02, -0.35, h ) );               // sous l'horizon : le sol (pour les reflets)
				float s = max( dot( d, normalize( sunDir ) ), 0.0 );
				c += sunC * sunK * ( pow( s, 1800.0 ) * 6.0 * disc + pow( s, 220.0 ) * 0.35 * disc + pow( s, 10.0 ) * 0.16 );
				gl_FragColor = vec4( c, 1.0 );
			}`
	});
	const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), mat);
	const skyScene = new THREE.Scene(); skyScene.add(dome);
	const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type:THREE.HalfFloatType, generateMipmaps:false });
	const cubeCam = new THREE.CubeCamera(.1, 100, cubeRT);
	const pmrem = new THREE.PMREMGenerator(renderer);
	let envRT = null;
	return {
		background:cubeRT.texture,
		get environment(){ return envRT ? envRT.texture : null; },
		set(st){
			U.top.value.copy(st.skyTop); U.bot.value.copy(st.skyBot); U.fogC.value.copy(st.fog); U.ground.value.copy(st.hemiGround).lerp(st.fog, .35);
			U.sunDir.value.copy(st.sunPos).normalize(); U.sunC.value.copy(st.sun);
			U.sunK.value = 1 - st.nightK*.55; U.disc.value = 1 - st.nightK*.45;
		},
		renderBackground(){ cubeCam.update(renderer, skyScene); },
		renderEnvironment(){
			// le soleil n'est qu'un halo dans l'environnement : pas de reflet « point » trop dur sur les toits
			const d = U.disc.value; U.disc.value = 0;
			const rt = pmrem.fromScene(skyScene, 0, .1, 100);
			U.disc.value = d;
			if(envRT) envRT.dispose();
			envRT = rt;
			return rt.texture;
		}
	};
}

/* =====================================================================
   Petits effets de shader, ajoutés aux matériaux existants (onBeforeCompile chaîné)
   ===================================================================== */
function chain(mat, key, fn){
	const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
	const hasPrev = prev && prev !== THREE.Material.prototype.onBeforeCompile;
	mat.onBeforeCompile = (sh, r) => { if(hasPrev) prev.call(mat, sh, r); fn(sh); };
	const base = prevKey && prevKey !== THREE.Material.prototype.customProgramCacheKey ? prevKey.call(mat) : "";
	mat.customProgramCacheKey = () => base + "|" + key;
	mat.needsUpdate = true;
}
const WORLD_VS = `
	vec4 fxW = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		fxW = instanceMatrix * fxW;
	#endif
	fxW = modelMatrix * fxW;`;

/* Ombre de contact : le pied des murs (et des troncs, des bancs…) s'assombrit doucement, comme une maquette
   éclairée par le ciel. Les sols (normale vers le haut) ne sont pas touchés. */
export function contactShade(mat, { depth = .66, height = 1.5 } = {}){
	if(mat.userData.contact) return; mat.userData.contact = true;
	chain(mat, "contact", sh => {
		sh.vertexShader = sh.vertexShader
			.replace("#include <common>", "#include <common>\nvarying float vCY; varying float vCN;")
			.replace("#include <project_vertex>", `#include <project_vertex>
	{ ${WORLD_VS}
	vCY = fxW.y;
	vec3 fxN = objectNormal;
	#ifdef USE_INSTANCING
		fxN = mat3( instanceMatrix ) * fxN;
	#endif
	vCN = normalize( mat3( modelMatrix ) * fxN ).y; }`);
		sh.fragmentShader = sh.fragmentShader
			.replace("#include <common>", "#include <common>\nvarying float vCY; varying float vCN;")
			.replace("#include <aomap_fragment>", `#include <aomap_fragment>
	{ float cAO = mix( 1.0, mix( ${depth.toFixed(2)}, 1.0, smoothstep( 0.0, ${height.toFixed(2)}, vCY ) ), 1.0 - abs( vCN ) );
	reflectedLight.indirectDiffuse *= cAO; reflectedLight.directDiffuse *= mix( 1.0, cAO, 0.55 ); }`);
	});
}

/* Vent : la couronne des arbres (maillages instanciés) se balance doucement, chaque arbre à son rythme. */
export function windSway(mat, amp = .06){
	chain(mat, "wind" + amp, sh => {
		sh.uniforms.uTime = TIME;
		sh.vertexShader = sh.vertexShader
			.replace("#include <common>", "#include <common>\nuniform float uTime;")
			.replace("#include <begin_vertex>", `#include <begin_vertex>
	#ifdef USE_INSTANCING
	{ vec3 ip = instanceMatrix[3].xyz; float ph = ip.x*.31 + ip.z*.17; float hk = clamp( position.y + 1.0, 0.0, 2.2 );
	  transformed.x += sin( uTime*1.25 + ph )*${amp.toFixed(3)}*hk + sin( uTime*3.1 + ph*2.0 )*${(amp*.25).toFixed(3)}*hk;
	  transformed.z += cos( uTime*1.05 + ph*1.3 )*${(amp*.8).toFixed(3)}*hk; }
	#endif`);
	});
}

/* Eau : de petites vagues font bouger les reflets du ciel et du soleil ; un chemin de paillettes
   (soleil, ou lune la nuit) scintille sur les vaguelettes. GLINT.dir : direction de l'astre (monde), GLINT.color : sa force. */
export const GLINT = { dir:{ value:new THREE.Vector3(0, 1, 0) }, color:{ value:new THREE.Color(0, 0, 0) } };
export function waterRipples(mat){
	chain(mat, "water", sh => {
		sh.uniforms.uTime = TIME; sh.uniforms.uGlintDir = GLINT.dir; sh.uniforms.uGlintC = GLINT.color;
		sh.vertexShader = sh.vertexShader
			.replace("#include <common>", "#include <common>\nvarying vec2 vWXZ;")
			.replace("#include <project_vertex>", `#include <project_vertex>\n	{ ${WORLD_VS}\n	vWXZ = fxW.xz; }`);
		sh.fragmentShader = sh.fragmentShader
			.replace("#include <common>", "#include <common>\nuniform float uTime; uniform vec3 uGlintDir; uniform vec3 uGlintC; varying vec2 vWXZ;")
			.replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
	{ vec2 p = vWXZ; float t = uTime;
	  vec2 g = vec2( cos( p.x*.9 + t*1.1 )*.5 + cos( ( p.x + p.y )*.55 - t*.8 )*.45 + cos( p.x*2.3 - p.y*1.7 + t*1.9 )*.2,
	                 sin( p.y*1.05 - t*1.3 )*.5 + cos( ( p.x - p.y )*.7 + t*.9 )*.45 + sin( p.y*2.1 + p.x*1.3 - t*1.7 )*.2 )*.11;
	  normal = normalize( ( viewMatrix * vec4( normalize( vec3( -g.x, 1.0, -g.y ) ), 0.0 ) ).xyz ); }`)
			.replace("#include <opaque_fragment>", `{ vec3 L = normalize( ( viewMatrix*vec4( uGlintDir, 0.0 ) ).xyz );
	  vec3 R = reflect( -normalize( vViewPosition ), normal );
	  float sp = pow( max( dot( R, L ), 0.0 ), 180.0 );
	  float tw = 0.55 + 0.45*sin( uTime*6.0 + vWXZ.x*3.1 + vWXZ.y*2.3 );          // ça scintille
	  outgoingLight += uGlintC*sp*tw; }
#include <opaque_fragment>`);
	});
}

/* Fenêtres instanciées : la nuit tombe, elles s'allument une à une (seuil aléatoire par fenêtre). */
export function windowsGate(mat, U){
	chain(mat, "wgate", sh => {
		sh.uniforms.uNight = U;
		sh.vertexShader = sh.vertexShader
			.replace("#include <common>", "#include <common>\nvarying float vWH;")
			.replace("#include <begin_vertex>", `#include <begin_vertex>
	#ifdef USE_INSTANCING
		vWH = fract( sin( dot( instanceMatrix[3].xyz, vec3( 12.9898, 78.233, 37.719 ) ) ) * 43758.5453 );
	#else
		vWH = 0.5;
	#endif`);
		sh.fragmentShader = sh.fragmentShader
			.replace("#include <common>", "#include <common>\nuniform float uNight; varying float vWH;")
			.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n	totalEmissiveRadiance *= step( vWH*0.92 + 0.04, uNight );");
	});
}

/* =====================================================================
   Post-traitement (qualité haute) : occlusion ambiante, halo des lumières, vignette, rendu des couleurs
   ===================================================================== */
export async function createPost(renderer, scene, camera){
	const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { OutputPass }, { GTAOPass }] = await Promise.all([
		import("three/addons/postprocessing/EffectComposer.js"), import("three/addons/postprocessing/RenderPass.js"),
		import("three/addons/postprocessing/UnrealBloomPass.js"), import("three/addons/postprocessing/ShaderPass.js"),
		import("three/addons/postprocessing/OutputPass.js"), import("three/addons/postprocessing/GTAOPass.js")
	]);
	const size = renderer.getDrawingBufferSize(new THREE.Vector2());
	const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type:THREE.HalfFloatType, samples:4 });
	const composer = new EffectComposer(renderer, rt);
	const render = new RenderPass(scene, camera);
	const gtao = new GTAOPass(scene, camera, size.x, size.y);
	gtao.output = GTAOPass.OUTPUT.Default;
	gtao.blendIntensity = .85;
	gtao.updateGtaoMaterial({ radius:1.6, distanceExponent:1.4, thickness:1.2, scale:1, samples:12, distanceFallOff:1, screenSpaceRadius:false });
	gtao.updatePdMaterial({ lumaPhi:10, depthPhi:2, normalPhi:3, radius:6, rings:2, samples:12 });
	const bloom = new UnrealBloomPass(new THREE.Vector2(size.x/2, size.y/2), .2, .55, .95);
	const vignette = new ShaderPass({
		uniforms:{ tDiffuse:{ value:null }, amount:{ value:.22 } },
		vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }",
		fragmentShader:`uniform sampler2D tDiffuse; uniform float amount; varying vec2 vUv;
			void main(){ vec4 c = texture2D( tDiffuse, vUv ); vec2 q = vUv - 0.5; float v = smoothstep( 0.85, 0.2, length( q*vec2( 1.0, 0.85 ) )*1.15 );
			c.rgb *= mix( 1.0 - amount, 1.0, v ); gl_FragColor = c; }`
	});
	const output = new OutputPass();
	composer.addPass(render); composer.addPass(gtao); composer.addPass(bloom); composer.addPass(vignette); composer.addPass(output);
	return {
		composer, bloom, gtao,
		setSize(w, h, pr){ composer.setPixelRatio(pr); composer.setSize(w, h); },
		render(sc, cam, ao){
			render.scene = sc; render.camera = cam;
			gtao.enabled = !!ao; gtao.scene = sc; gtao.camera = cam;
			composer.render();
		},
		setNight(k){ bloom.strength = .12 + .5*k; bloom.threshold = .95 - .25*k; bloom.radius = .45 + .2*k; },
		dispose(){ composer.dispose(); rt.dispose(); }
	};
}

/* =====================================================================
   Météo : ombres de nuages qui glissent sur la ville, rideau de pluie autour de la caméra
   ===================================================================== */
// CLOUDS.value : force des ombres de nuages (0 : ciel dégagé ou couvert, 1 : beaux cumulus)
export const CLOUDS = { value:0 };
export function cloudShade(mat){
	chain(mat, "clouds", sh => {
		sh.uniforms.uTime = TIME; sh.uniforms.uClouds = CLOUDS;
		sh.vertexShader = sh.vertexShader
			.replace("#include <common>", "#include <common>\nvarying vec2 vCloudXZ;")
			.replace("#include <project_vertex>", `#include <project_vertex>\n	{ ${WORLD_VS}\n	vCloudXZ = fxW.xz; }`);
		sh.fragmentShader = sh.fragmentShader
			.replace("#include <common>", `#include <common>
uniform float uTime; uniform float uClouds; varying vec2 vCloudXZ;
float cnoise( vec2 p ){ vec2 i = floor( p ), f = fract( p ); f = f*f*( 3.0 - 2.0*f );
	float a = fract( sin( dot( i, vec2( 127.1, 311.7 ) ) )*43758.5453 ), b = fract( sin( dot( i + vec2( 1.0, 0.0 ), vec2( 127.1, 311.7 ) ) )*43758.5453 );
	float c = fract( sin( dot( i + vec2( 0.0, 1.0 ), vec2( 127.1, 311.7 ) ) )*43758.5453 ), d = fract( sin( dot( i + vec2( 1.0, 1.0 ), vec2( 127.1, 311.7 ) ) )*43758.5453 );
	return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y ); }`)
			.replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
	if( uClouds > 0.0 ){
		vec2 q = vCloudXZ*0.011 + vec2( uTime*0.012, uTime*0.005 );          // le vent pousse les nuages
		float n = cnoise( q )*0.65 + cnoise( q*2.3 + 7.1 )*0.35;
		float shade = 1.0 - uClouds*0.62*smoothstep( 0.48, 0.66, n );
		reflectedLight.directDiffuse *= shade; reflectedLight.directSpecular *= shade; }`);
	});
}

/* Pluie : des traits qui tombent dans une boîte qui suit la caméra (tout est calculé par la carte graphique). */
export function createRain(scene, n = 2600){
	const W = 90, H = 46;
	const pos = new Float32Array(n*2*3), seed = new Float32Array(n*2*3);
	for(let i=0;i<n;i++){
		const s = [Math.random()*W, Math.random()*H, Math.random()*W];
		for(let k=0;k<2;k++){ seed.set(s, (i*2 + k)*3); pos.set([0, k, 0], (i*2 + k)*3); }
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
	const U = { uTime:TIME, uCam:{ value:new THREE.Vector3() }, uK:{ value:0 }, uColor:{ value:new THREE.Color("#c9d6e6") } };
	const m = new THREE.ShaderMaterial({
		uniforms:U, transparent:true, depthWrite:false,
		vertexShader:`
			attribute vec3 aSeed; uniform float uTime; uniform vec3 uCam; varying float vA;
			void main(){
				float W = ${W.toFixed(1)}, H = ${H.toFixed(1)};
				vec3 p;
				p.x = mod( aSeed.x - uCam.x - uTime*2.0, W ) + uCam.x - W*0.5;
				p.z = mod( aSeed.z - uCam.z, W ) + uCam.z - W*0.5;
				p.y = mod( aSeed.y - uTime*26.0, H ) + max( uCam.y - H*0.7, 0.0 );
				p += vec3( 0.08, 1.0, 0.0 )*position.y*0.9;            // un trait légèrement penché par le vent
				vA = position.y;
				gl_Position = projectionMatrix*viewMatrix*vec4( p, 1.0 );
			}`,
		fragmentShader:`
			uniform vec3 uColor; uniform float uK; varying float vA;
			void main(){ gl_FragColor = vec4( uColor, uK*( 0.12 + 0.3*vA ) ); }`
	});
	const lines = new THREE.LineSegments(g, m);
	lines.frustumCulled = false; lines.visible = false; lines.renderOrder = 6;
	scene.add(lines);
	return {
		set(k){ U.uK.value = k; lines.visible = k > .01; },
		follow(camPos){ U.uCam.value.copy(camPos); }
	};
}
