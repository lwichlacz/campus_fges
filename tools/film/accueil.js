/* Vidéo d'accueil de fges.fr : la partie 3D (tournage image par image dans le vrai campus).
   Le film complet (réel → transition → campus 3D) est monté par tools/film/accueil.py, qui lance tout en une commande.

   La caméra suit le drone du premier plan de la vidéo réelle (survol de la cour, caméra quasi fixe vers 4 s),
   puis s'envole au-dessus du quartier Vauban et tourne lentement autour du campus.
   Chaque image est rendue en 2400×1350 puis réduite en 1920×1080 et envoyée au récepteur de accueil.py,
   avec la position à l'écran des lieux étiquetés (labels.json).

   À la main : ouvrir http://localhost:8765/?debug, puis dans la console
     const A = await import("/tools/film/accueil.js"); await A.tourner({ saison:"hiver" });   */
import * as P from "/tools/film/pilote.js";

export const T0 = 3.7, TE = 25.6, FPS = 60;                    // instants (s) du film couverts par le rendu 3D
const R = Math.PI/180;

/* trajectoire : t (s du film), distance, élévation (°), azimut (rad), point visé */
export const CLES = [
	[3.7, 42.4, 35.8, .354, [0, 6, -10]],                      // calée sur le drone réel (survol de la cour)
	[5.6, 41.2, 36.6, .335, [0, 6, -10]],
	[9.1, 64, 49, .12, [3, 4, -24]],                           // envol au-dessus de l'Hôtel Académique, vers Falise
	[12.1, 60, 55, -.3, [8, 6, -40]],                         // au plus près du bâtiment Michel Falise
	[15.85, 114, 45, -.52, [0, 0, -16]],                        // vue large du quartier
	[22.35, 130, 44, -.85, [0, 0, -12]],                        // lente rotation
	[25.6, 134, 44, -1.0, [0, 0, -12]] ];

/* points d'ancrage des étiquettes (coordonnées du campus) */
export const ANCRES = { ha:[0, 19, -5], chapelle:[-19, 20, 1], falise:[9.2, 19, -42.9], bu:[-47.6, 17, -9.8],
	jardin:[-28.1, 3, -36.7], resto:[30.3, 26, 30.5], residence:[-76.5, 24, 4.5] };

export function camera(t){
	const K = CLES; let i = 0; while(i < K.length - 2 && t > K[i + 1][0]) i++;
	const a = K[i], b = K[i + 1], dt = b[0] - a[0], s = Math.max(0, Math.min(1, (t - a[0])/dt));
	const v = x => Array.isArray(x) ? x : [x];
	const pente = (p, r, j) => v(p[j]).map((_, k) => (v(r[j])[k] - v(p[j])[k])/(r[0] - p[0]));     // Catmull-Rom non uniforme
	const h00 = 2*s**3 - 3*s**2 + 1, h10 = s**3 - 2*s**2 + s, h01 = -2*s**3 + 3*s**2, h11 = s**3 - s**2;
	const val = j => { const A = v(a[j]), B = v(b[j]);
		// départ à l'arrêt (calé sur le drone) ; à la fin la caméra garde sa vitesse : le carton de fin n'est jamais figé
		const m0 = i === 0 ? A.map(() => 0) : pente(K[i - 1], b, j), m1 = i + 1 === K.length - 1 ? pente(a, b, j) : pente(a, K[i + 2], j);
		return A.map((_, k) => h00*A[k] + h10*dt*m0[k] + h01*B[k] + h11*dt*m1[k]); };
	const d = val(1)[0], el = val(2)[0]*R, az = val(3)[0], T = val(4);
	return { pos:[T[0] + d*Math.cos(el)*Math.sin(az), T[1] + d*Math.sin(el), T[2] + d*Math.cos(el)*Math.cos(az)], cible:T, fov:50 };
}

let etat = { fait:0, total:0, err:null, fini:false };
export const avancement = () => ({ ...etat });

function taille(C){                                             // rendu fixe, quelle que soit la taille de la fenêtre
	const Rd = C.renderer;
	if(Rd.domElement.width !== 2400 || Rd.domElement.height !== 1350){ Rd.setPixelRatio(1.25); Rd.setSize(1920, 1080, false); }
	if(C.post && (C.post.composer._width !== 1920 || C.post.composer._height !== 1080)) C.post.setSize(1920, 1080, 1.25);
	if(Math.abs(C.camera.aspect - 16/9) > 1e-6){ C.camera.aspect = 16/9; C.camera.updateProjectionMatrix(); }
}

function projette(C){
	const v = new C.THREE.Vector3(), out = {};
	for(const [k, p] of Object.entries(ANCRES)){ v.set(...p).project(C.camera); out[k] = [+((v.x + 1)/2*1920).toFixed(1), +((1 - v.y)/2*1080).toFixed(1), v.z < 1 ? 1 : 0]; }
	return out;
}

async function preparer(saison){
	localStorage.setItem("campusfges:weather", JSON.stringify("soleil"));
	await P.preparer({ qualite:"haute", heure:"jour" });
	const C = window.campus;
	C.set("season", saison);
	for(let i = 0; i < 30; i++) P.pas();
	C.scene.traverse(o => { const u = o.material?.uniforms; if(u && (u.uSplit || u.uLum)) o.visible = false; });   // pas d'étiquettes du campus
	return C;
}

function image(C, t){
	taille(C);
	const v = camera(t);
	C.camera.fov = v.fov; C.camera.updateProjectionMatrix(); C.view(...v.pos, ...v.cible);
	return P.pas(1000/FPS, true);
}

const envoyer = (url, nom, corps) => fetch(`${url}/${nom}`, { method:"POST", body:corps }).then(r => { if(r.status !== 200) throw new Error(`envoi ${nom} : ${r.status}`); });

/* tout le tournage : une image par 1/60 s de T0 à TE, envoyée au récepteur */
export async function tourner({ saison = "automne", recepteur = "http://127.0.0.1:8768" } = {}){
	etat = { fait:0, total:0, err:null, fini:false };
	try{
		const C = await preparer(saison);
		const N = Math.round((TE - T0)*FPS) + 1; etat.total = N;
		const tc = document.createElement("canvas"), cv = document.createElement("canvas"); cv.width = 1920; cv.height = 1080;
		const labels = [];
		for(let i = 0; i < N; i++){
			const im = image(C, T0 + i/FPS);
			if(im.width !== 2400) throw new Error(`taille de rendu ${im.width} à l'image ${i}`);
			if(tc.width !== im.width){ tc.width = im.width; tc.height = im.height; }
			tc.getContext("2d").putImageData(im, 0, 0); cv.getContext("2d").drawImage(tc, 0, 0, 1920, 1080);
			labels.push(projette(C));
			await envoyer(recepteur, `c${String(i).padStart(4, "0")}.jpg`, await new Promise(r => cv.toBlob(r, "image/jpeg", .93)));
			etat.fait = i + 1;
		}
		await envoyer(recepteur, "labels.json", new Blob([JSON.stringify({ T0, FPS, saison, labels })]));
		etat.fini = true;
	}catch(e){ etat.err = String(e); try{ await envoyer(recepteur, "erreur.json", new Blob([JSON.stringify({ err:etat.err })])); }catch(_){} }
	return avancement();
}

/* images de contrôle aux instants donnés (s du film) → envoyées au récepteur sous les noms apercu-<t>.jpg */
export async function apercu(ts, { saison = "automne", recepteur = "http://127.0.0.1:8768" } = {}){
	const C = await preparer(saison); P.pas();
	for(const t of [].concat(ts)){
		const im = image(C, t);
		const tc = document.createElement("canvas"); tc.width = 960; tc.height = 540;
		const src = document.createElement("canvas"); src.width = im.width; src.height = im.height; src.getContext("2d").putImageData(im, 0, 0);
		tc.getContext("2d").drawImage(src, 0, 0, 960, 540);
		await envoyer(recepteur, `apercu-${String(t).replace(".", "_")}.jpg`, await new Promise(r => tc.toBlob(r, "image/jpeg", .88)));
	}
}
