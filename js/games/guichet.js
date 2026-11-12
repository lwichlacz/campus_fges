/* « Le guichet du samedi » — mini-jeu de la Licence Pro Assurance-Banque-Finance (FGES, chargé de clientèle).
   Samedi matin, ton agence de Lambersart. Tu es l'alternant au guichet, Nadia, ta tutrice, passe dans ton dos.
   Cinq clients font la queue ; entre deux, le téléphone vibre, la radio annonce une hausse de taux, et au
   guichet d'à côté quelqu'un dépose des espèces de trop. Environ 4 minutes, une action toutes les quelques secondes.
   Quatre gestes : toucher au bon moment ce que le client dit d'important, répondre sous chrono, régler le
   simulateur en voyant les chiffres bouger, maintenir « Stop » quand la conformité l'exige.
   Les contenus (répliques, chiffres, cours) sont dans guichet-data.js. */
import * as THREE from "three";
import { makePerson, std, box, cyl } from "../kit.js?v=fdd5d880ac";
import { jpoCard } from "./jpo.js?v=fdd5d880ac";
import { COURSES, CLIENTS, IMMO, immoCalc, immoBest, euro } from "./guichet-data.js?v=fdd5d880ac";

const SPEED = /[?&]vite/.test(location.search) ? 6 : 1;      // ?vite : tout va 6 fois plus vite (pour tester)
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = x => Math.round(x*100) + " %";

const CSS = `
.gq{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#14233d;background:#e9eef3;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:manipulation;animation:gqIn .3s ease both}
@keyframes gqIn{from{opacity:0}to{opacity:1}}
.gq canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.gq-top{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;align-items:center;padding:calc(env(safe-area-inset-top) + 10px) calc(env(safe-area-inset-right) + 12px) 6px calc(env(safe-area-inset-left) + 12px);z-index:5;pointer-events:none}
.gq-top>*{pointer-events:auto}
.gq-tag{background:#fff;border-radius:999px;padding:6px 12px;font-weight:900;font-size:13px;box-shadow:0 2px 8px rgba(20,35,61,.15);white-space:nowrap}
.gq-tag.b{background:#0f3168;color:#fff}
.gq-tag.t{background:#21b6ce;color:#0b2447}
.gq-x{margin-left:auto;width:48px;height:48px;border-radius:50%;border:0;background:#fff;font-size:24px;cursor:pointer;box-shadow:0 2px 8px rgba(20,35,61,.2);color:#14233d}
.gq-nadia{position:absolute;left:calc(env(safe-area-inset-left) + 12px);top:calc(env(safe-area-inset-top) + 66px);max-width:min(380px,calc(100% - 24px));display:flex;gap:8px;z-index:5;pointer-events:none;transition:opacity .3s}
.gq-nadia.off{opacity:0}
.gq-nadia .av{flex:none;width:40px;height:40px;border-radius:50%;background:#21b6ce;display:grid;place-items:center;font-size:21px;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.gq-nadia .b{background:#0f3168;color:#fff;border-radius:4px 14px 14px 14px;padding:8px 12px;font-size:14px;line-height:1.4;box-shadow:0 4px 14px rgba(15,49,104,.3)}
.gq-nadia .who{display:block;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#7fe3f0;font-weight:900}
.gq-talk{position:absolute;z-index:4;width:min(330px,calc(100% - 24px));transform:translate(-50%,-100%);display:flex;flex-direction:column;gap:6px;align-items:stretch}
.gq-line{border:0;text-align:left;background:#fff;border-radius:16px 16px 16px 4px;padding:9px 12px;font:700 14.5px/1.35 Nunito,sans-serif;color:#14233d;box-shadow:0 3px 10px rgba(20,35,61,.18);cursor:pointer;animation:gqLine .3s ease both;transition:opacity .4s,transform .2s,background .2s;min-height:44px}
.gq-line.say{cursor:default;background:#fffdf6}
.gq-line.fade{opacity:0}
.gq-line.ok{background:#d6f5e4;outline:2px solid #1f9d63}
.gq-line.ok:after{content:" ✓ noté";color:#1f7a55;font-weight:900}
.gq-line.no{background:#eee;color:#888}
.gq-line .en{display:block;font-size:11px;font-weight:800;color:#8a94a6;margin-top:2px}
@keyframes gqLine{from{opacity:0;transform:translateY(8px)}to{opacity:1}}
.gq-react{position:absolute;z-index:4;transform:translate(-50%,-100%);font-size:40px;pointer-events:none;animation:gqReact 1.6s ease both}
@keyframes gqReact{0%{opacity:0;transform:translate(-50%,-60%) scale(.5)}20%{opacity:1;transform:translate(-50%,-100%) scale(1.15)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-140%)}}
.gq-dock{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 12px);transform:translateX(-50%);width:min(760px,calc(100% - 20px));z-index:6;display:flex;flex-direction:column;gap:8px}
.gq-q{background:#fff;border-radius:14px;padding:9px 13px;font-weight:900;font-size:15px;box-shadow:0 4px 14px rgba(20,35,61,.2);display:flex;gap:8px;align-items:center}
.gq-q .ph{font-size:20px}
.gq-timer{height:6px;border-radius:3px;background:rgba(20,35,61,.15);overflow:hidden}
.gq-timer i{display:block;height:100%;background:#21b6ce;transform-origin:left;transition:background .3s}
.gq-timer.low i{background:#e0533d}
.gq-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.gq-card{border:0;border-radius:14px;padding:11px 12px;background:#fff;font:700 14px/1.35 Nunito,sans-serif;color:#14233d;text-align:left;cursor:pointer;box-shadow:0 4px 0 #b9c6d6,0 6px 16px rgba(20,35,61,.15);min-height:64px;transition:transform .12s}
.gq-card:hover{transform:translateY(-2px)}
.gq-card:focus-visible{outline:3px solid #21b6ce}
.gq-card.ok{background:#d6f5e4;box-shadow:0 4px 0 #1f9d63}
.gq-card.mid{background:#fff1cf;box-shadow:0 4px 0 #d39b18}
.gq-card.ko{background:#fde0da;box-shadow:0 4px 0 #c4442c}
.gq-card.dim{opacity:.45}
.gq-doc{background:#fffdf6;border-radius:6px;padding:12px 14px;box-shadow:0 6px 18px rgba(20,35,61,.25);font-family:Georgia,serif}
.gq-doc h4{margin:0 0 6px;font:900 12px Nunito,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#6b7a90}
.gq-doc button{display:flex;justify-content:space-between;gap:10px;width:100%;border:0;border-bottom:1px dashed #cdd5df;background:none;padding:10px 4px;font:15px Georgia,serif;color:#14233d;cursor:pointer;min-height:44px;text-align:left}
.gq-doc button b{font-family:Nunito,sans-serif;white-space:nowrap}
.gq-doc button.ok{background:#d6f5e4}.gq-doc button.ko{background:#fde0da}
.gq-screen{background:#0b1d3a;color:#e8f6fb;border-radius:14px;padding:12px 14px 14px;box-shadow:0 0 0 4px #2b3a52,0 10px 30px rgba(0,0,0,.35)}
.gq-screen h4{margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7fe3f0}
.gq-big{font-size:30px;font-weight:900;line-height:1.1}
.gq-read{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px;margin:8px 0}
.gq-read div{background:rgba(255,255,255,.07);border-radius:8px;padding:6px 8px;font-size:12px;color:#a9c3d6}
.gq-read b{display:block;font-size:17px;color:#fff}
.gq-read s{color:#7d8ea3;font-size:12px}
.gq-gauge{position:relative;height:14px;border-radius:7px;background:rgba(255,255,255,.12);margin:4px 0 10px;overflow:visible}
.gq-gauge i{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:#3ccf8e;transition:width .15s,background .2s}
.gq-gauge.over i{background:#ff6b52}
.gq-gauge em{position:absolute;top:-4px;bottom:-4px;width:3px;background:#fff;border-radius:2px}
.gq-gauge span{position:absolute;top:16px;font-size:11px;color:#a9c3d6;transform:translateX(-50%);white-space:nowrap}
.gq-track{position:relative;height:44px;margin:14px 6px 8px;cursor:pointer;touch-action:none}
.gq-track:before{content:"";position:absolute;left:0;right:0;top:19px;height:6px;border-radius:3px;background:rgba(255,255,255,.2)}
.gq-knob{position:absolute;top:2px;width:40px;height:40px;margin-left:-20px;border-radius:50%;background:#21b6ce;box-shadow:0 0 0 4px rgba(33,182,206,.35);display:grid;place-items:center;font-size:18px;color:#0b2447;font-weight:900}
.gq-track:focus-visible .gq-knob{box-shadow:0 0 0 4px #fff}
.gq-go{display:block;width:100%;border:0;border-radius:12px;padding:12px;font:900 16px Nunito,sans-serif;background:#f4c430;color:#14233d;cursor:pointer;min-height:48px;box-shadow:0 4px 0 #b88d10}
.gq-phone{position:absolute;z-index:6;transform:translate(-50%,-100%);border:0;border-radius:14px;background:#fff;padding:9px 14px;font:900 15px Nunito,sans-serif;color:#14233d;cursor:pointer;box-shadow:0 0 0 4px #21b6ce,0 8px 20px rgba(0,0,0,.25);animation:gqBuzz .25s linear infinite alternate;min-height:48px}
@keyframes gqBuzz{from{margin-left:-3px}to{margin-left:3px}}
.gq-alert{background:#fff;border-left:8px solid #e0533d;border-radius:12px;padding:10px 13px;font-size:14.5px;line-height:1.4;font-weight:700;box-shadow:0 6px 18px rgba(20,35,61,.25)}
.gq-alert b{color:#c4442c;display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
.gq-hold{position:relative;overflow:hidden;border:0;border-radius:14px;background:#e0533d;color:#fff;font:900 17px Nunito,sans-serif;padding:14px;cursor:pointer;min-height:56px;touch-action:none;box-shadow:0 4px 0 #9b2e1d}
.gq-hold i{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.3);width:0}
.gq-hold span{position:relative}
.gq-chips{position:absolute;right:calc(env(safe-area-inset-right) + 12px);top:calc(env(safe-area-inset-top) + 66px);z-index:5;display:flex;flex-direction:column;gap:6px;align-items:flex-end;pointer-events:none;max-width:min(320px,60%)}
.gq-chip{background:#fff;border-left:5px solid #21b6ce;border-radius:8px;padding:6px 10px;font-size:12.5px;font-weight:800;box-shadow:0 3px 10px rgba(20,35,61,.18);animation:gqChip 4s ease both}
.gq-chip span{display:block;font-size:10px;color:#0b7a8e;letter-spacing:.08em;text-transform:uppercase}
@keyframes gqChip{0%{opacity:0;transform:translateX(20px)}10%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
.gq-ov{position:absolute;inset:0;z-index:9;display:grid;place-items:center;padding:14px;background:rgba(11,29,58,.45)}
.gq-ov[hidden]{display:none}
.gq-cardx{max-width:560px;width:100%;max-height:100%;overflow:auto;background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 20px 60px rgba(0,0,0,.35);user-select:text;-webkit-user-select:text}
.gq-cardx h2{font:800 26px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px;color:#0f3168}
.gq-cardx .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:900;margin:0 0 4px}
.gq-cardx p{font-size:14.5px;line-height:1.5;margin:0 0 10px}
.gq-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:8px 0 12px}
.gq-legend div{background:#f1f5f9;border-radius:10px;padding:7px 9px;font-size:13px;line-height:1.3}
.gq-legend b{font-size:18px;display:block}
.gq-alt{display:block;text-align:center;margin-top:8px;font-weight:800;color:#0f3168;background:none;border:0;cursor:pointer;width:100%;font-size:14px;text-decoration:underline;min-height:44px}
.gq-stats{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}
.gq-stats div{flex:1 1 110px;background:#f1f5f9;border-radius:10px;padding:6px 9px;font-size:12px;font-weight:800;color:#56657a}
.gq-stats b{display:block;font-size:18px;color:#14233d}
.gq-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:4px 0 12px}
.gq-tbl td{padding:6px 4px;border-bottom:1px solid #e3e9f0}
.gq-list{list-style:none;margin:0 0 10px;padding:0}
.gq-list li{background:#f6f8fb;border-radius:10px;padding:7px 9px;margin:5px 0;font-size:13px;line-height:1.35}
.gq-list li span{display:inline-block;background:#0f3168;color:#fff;border-radius:6px;padding:1px 6px;font-size:11px;font-weight:900;margin-right:5px}
.gq-list.warn li{background:#fde9e4}
.gq-bars{display:flex;gap:10px;align-items:flex-end;height:170px;margin:10px 0 6px;padding:0 4px;border-bottom:2px solid #c9d3df}
.gq-bars button{flex:1;border:0;background:none;cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;gap:4px;font:800 11px Nunito,sans-serif;color:#56657a;padding:0}
.gq-bars button i{display:block;width:100%;border-radius:6px 6px 0 0;background:#21b6ce;min-height:6px}
.gq-bars button.ok i{background:#1f9d63}.gq-bars button.ko i{background:#e0533d}
.gq-big2{font-size:46px;text-align:center;margin:0}
@media (max-width:640px){
	.gq-cards{grid-template-columns:1fr}
	.gq-card{min-height:48px;padding:9px 11px;font-size:13.5px}
	.gq-tag{font-size:12px;padding:5px 9px}
	.gq-tag.hide-s{display:none}
	.gq-line{font-size:13.5px}
	.gq-big{font-size:24px}
	.gq-chips{display:none}
}
@media (max-height:700px){.gq-screen{padding:8px 12px 10px}.gq-big{font-size:22px}.gq-read{margin:4px 0}.gq-read b{font-size:15px}.gq-track{margin:8px 6px 4px}.gq-go{min-height:44px;padding:9px}.gq-card{min-height:52px;padding:8px 11px}}
@media (prefers-reduced-motion:reduce){.gq,.gq-line,.gq-react,.gq-chip,.gq-phone{animation:none}}
`;

export function openGuichet({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("gq-css")){ const st = document.createElement("style"); st.id = "gq-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	const root = document.createElement("div"); root.className = "gq";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le guichet du samedi");
	root.innerHTML = `<canvas></canvas>
		<div class="gq-top"><span class="gq-tag b">Le guichet du samedi</span><span class="gq-tag t" id="gqTicket">Ticket n° 041</span><span class="gq-tag hide-s" id="gqCount">Client 1 / 5</span><button class="gq-x" aria-label="Quitter le jeu">×</button></div>
		<div class="gq-nadia off" id="gqNadia" aria-live="polite"><div class="av" aria-hidden="true">👩🏽‍💼</div><div class="b"><span class="who">Nadia, ta tutrice</span><span id="gqNadiaT"></span></div></div>
		<div class="gq-chips" id="gqChips"></div>
		<div class="gq-dock" id="gqDock"></div>
		<div class="gq-ov" id="gqOv"><div class="gq-cardx" id="gqCard"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const dock = $("#gqDock");
	let closed = false;

	/* ---------- état ---------- */
	const S = { phase:"intro", conf:[], pnb:0, sell:0, sig:0, sigMax:0, learned:[], per:[], bilan:0, timeouts:0 };
	let cs = null;       // le client en cours : { pts, max }

	/* ---------- scène : l'agence ---------- */
	const canvas = $("canvas");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#e9eef3");
	const camera = new THREE.PerspectiveCamera(46, 1, .1, 80);
	scene.add(new THREE.HemisphereLight("#ffffff", "#9aa6b5", 1.35));
	const key = new THREE.DirectionalLight("#fff4e6", 1.6); key.position.set(4, 9, 6); key.castShadow = true;
	key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left:-9, right:9, top:8, bottom:-6, near:1, far:30 }); scene.add(key);

	const MAT = { floor:std("#d9dee5"), wall:std("#f4f6f8"), navy:std("#0f3168"), teal:std("#21b6ce"), wood:std("#c99a6b"), desk:std("#ffffff"), dark:std("#2b3a52"),
		glass:new THREE.MeshStandardMaterial({ color:"#cfeaf5", transparent:true, opacity:.25, roughness:.05 }), plant:std("#4f8f5a"), pot:std("#e7d7c3"), red:std("#e0533d"), screen:new THREE.MeshBasicMaterial({ color:"#0b1d3a" }) };
	box(scene, 22, .1, 16, MAT.floor, 0, -.1, -2).receiveShadow = true;
	box(scene, 22, 6, .2, MAT.wall, 0, 0, -7);
	box(scene, 22, .5, .22, MAT.teal, 0, 3.6, -6.95);
	box(scene, .2, 6, 14, MAT.wall, -9, 0, -2); box(scene, .2, 6, 14, MAT.wall, 9, 0, -2);
	// ton guichet : comptoir, vitre, écran, téléphone, radio
	box(scene, 5.2, 1.15, 1.3, MAT.desk, 0, 0, 1.0); box(scene, 5.3, .08, 1.45, MAT.wood, 0, 1.15, 1.0);
	box(scene, 5.2, .9, .05, MAT.glass, 0, 1.23, .32, 0, false);
	const mon = new THREE.Group(); mon.position.set(-1.55, 1.23, 1.35); mon.rotation.y = .35; scene.add(mon);
	box(mon, .12, .35, .12, MAT.dark, 0, 0, 0); box(mon, 1.2, .75, .06, MAT.dark, 0, .35, 0);
	const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .65), MAT.screen); scr.position.set(0, .725, .035); mon.add(scr);
	const phone = box(scene, .3, .04, .55, MAT.dark, 1.45, 1.2, 1.45, -.3);
	const phoneGlow = new THREE.Mesh(new THREE.PlaneGeometry(.26, .5).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({ color:"#21b6ce", transparent:true, opacity:0 }));
	phoneGlow.position.set(1.45, 1.245, 1.45); phoneGlow.rotation.y = -.3; scene.add(phoneGlow);
	const radio = new THREE.Group(); radio.position.set(2.15, 1.19, .75); scene.add(radio);
	box(radio, .6, .35, .25, MAT.red, 0, 0, 0); cyl(radio, .1, .1, .03, MAT.dark, -.12, .17, .13);
	// le guichet voisin, la file d'attente, les plantes
	box(scene, 3, 1.15, 1, MAT.desk, -6, 0, -2.6); box(scene, 3.1, .08, 1.1, MAT.wood, -6, 1.15, -2.6);
	for(let i = 0; i < 5; i++){ cyl(scene, .06, .08, 1, MAT.dark, 2.3 + i*1.25, 0, -3.0); }
	const rope = new THREE.Mesh(new THREE.BoxGeometry(5.1, .05, .05), MAT.red); rope.position.set(4.8, .85, -3.0); scene.add(rope);
	for(const [x, z] of [[-8, -6], [8, -6], [-8, 1.5]]){ cyl(scene, .35, .28, .6, MAT.pot, x, 0, z); const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.6, 0), MAT.plant); p.position.set(x, 1.1, z); p.castShadow = true; scene.add(p); }

	function texLabel(text, { bg = "#0f3168", fg = "#fff", size = 54, w = 512, h = 128 } = {}){
		const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
		x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = `900 ${size}px Nunito, system-ui, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 2);
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
	}
	const signM = new THREE.MeshBasicMaterial({ map:texLabel("Ton agence · Lambersart", { bg:"#0f3168", size:46 }) });
	const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), signM); sign.position.set(0, 4.6, -6.88); scene.add(sign);
	const tickM = new THREE.MeshBasicMaterial({ map:texLabel("N° 041", { bg:"#111a2b", fg:"#ff7a3d", size:80, w:256 }) });
	const tick = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .8), tickM); tick.position.set(-3.6, 4.4, -6.88); scene.add(tick);
	function setTicket(n){ tickM.map.dispose(); tickM.map = texLabel("N° 0" + n, { bg:"#111a2b", fg:"#ff7a3d", size:80, w:256 }); $("#gqTicket").textContent = "Ticket n° 0" + n; }

	/* ---------- les clients ---------- */
	const AT = new THREE.Vector3(0, 0, -.35), EXIT = new THREE.Vector3(-8, 0, -1.2);
	const qPos = i => new THREE.Vector3(3 + i*1.25, 0, -3.6);
	const people = CLIENTS.map((c, i) => c.kinds.map((k, j) => {
		const p = makePerson(scene, false, k); const pos = qPos(i).add(new THREE.Vector3(j*.55, 0, j*.4));
		p.g.position.copy(pos); p.g.rotation.y = -Math.PI/2; p.target = pos.clone(); p.walk = 0; return p;
	}));
	const stranger = makePerson(scene, false, "pro"); stranger.g.position.set(-6, 0, -4.2); stranger.g.visible = false; stranger.target = stranger.g.position.clone();
	function goTo(p, v, face){ p.target = v.clone(); p.face = face; }
	function advanceQueue(from){
		people.forEach((grp, i) => { if(i < from) return; grp.forEach((p, j) => goTo(p, qPos(i - from).add(new THREE.Vector3(j*.55, 0, j*.4)), -Math.PI/2)); });
	}
	function headOf(ci){ const g = people[ci]; const v = new THREE.Vector3(); g.forEach(p => v.add(p.g.position)); v.divideScalar(g.length); v.y = 2.75; return v; }

	/* ---------- caméra ---------- */
	function resize(){
		const w = innerWidth, h = innerHeight, port = h > w;
		renderer.setSize(w, h, false); camera.aspect = w/h; camera.fov = port ? 66 : 42; camera.updateProjectionMatrix();
		camera.position.set(port ? 1 : .9, port ? 4.2 : 3.9, port ? 7.8 : 6.9); camera.lookAt(port ? .8 : .6, 1.5, -2.2);
	}
	resize(); addEventListener("resize", resize);
	const toScreen = v => { const p = v.clone().project(camera); return { x:(p.x + 1)/2*innerWidth, y:(1 - p.y)/2*innerHeight }; };

	/* ---------- horloge du jeu : attentes et chronos ---------- */
	const timers = new Set();
	function wait(ms){ return new Promise(r => { timers.add({ t:ms/1000, r }); }); }
	function countdown(sec, el, onEnd){       // barre de temps ; renvoie une fonction pour l'arrêter
		const o = { t:sec, max:sec, el, onEnd, tick:true }; timers.add(o); return () => timers.delete(o);
	}

	/* ---------- Nadia, les puces de cours, les réactions ---------- */
	const nadia = $("#gqNadia"), nadiaT = $("#gqNadiaT"); let nadiaOff = 0;
	function say(t, ms = 6000){ nadiaT.innerHTML = t; nadia.classList.remove("off"); clearTimeout(nadiaOff); if(ms) nadiaOff = setTimeout(() => nadia.classList.add("off"), ms/Math.min(SPEED, 2)); }
	function learn(keys){
		for(const k of keys || []){
			if(S.learned.includes(k)) continue; S.learned.push(k);
			const c = COURSES[k], el = document.createElement("div"); el.className = "gq-chip"; el.innerHTML = `<span>📘 ${c[0]}</span>${c[1]}`;
			const box = $("#gqChips"); box.appendChild(el); while(box.children.length > 3) box.firstChild.remove(); setTimeout(() => el.remove(), 4100);
		}
	}
	let talk = null;
	function talkBox(ci){ if(talk) talk.remove(); talk = document.createElement("div"); talk.className = "gq-talk"; talk.dataset.ci = ci; root.appendChild(talk); return talk; }
	function speak(text, ms = 3000){
		const t = talkBox(S.ci); const b = document.createElement("div"); b.className = "gq-line say"; b.textContent = text; t.appendChild(b);
		setTimeout(() => { b.classList.add("fade"); }, ms/SPEED);
	}
	function react(res){
		const el = document.createElement("div"); el.className = "gq-react"; el.textContent = res === "ok" ? "😊" : res === "mid" ? "😐" : "😠";
		const s = toScreen(headOf(S.ci)); el.style.left = s.x + "px"; el.style.top = (s.y - 10) + "px"; root.appendChild(el); setTimeout(() => el.remove(), 1700);
	}
	const score = (res, max = 2) => { cs.max += max; cs.pts += res === "ok" ? max : res === "mid" ? max/2 : 0; };

	/* ---------- étape : écouter ---------- */
	async function listen(st, c){
		const t = talkBox(S.ci), sigs = st.lines.filter(l => l[1]), got = new Set();
		S.sigMax += sigs.length; let caught = 0, noise = 0;
		if(S.ci === 0) say("Écoute-les : <b>touche les phrases qui comptent</b> pour ton conseil, avant qu'elles s'effacent.", 7000);
		for(const [txt, sig, why] of st.lines){
			if(closed) return;
			const b = document.createElement("button"); b.className = "gq-line"; b.textContent = txt; b.type = "button";
			b.onclick = () => {
				if(b.dataset.done) return; b.dataset.done = 1;
				if(sig){ b.classList.add("ok"); caught++; got.add(txt); play("pop"); if(why) say(why, 4000); }
				else { b.classList.add("no"); noise++; play("clic"); }
			};
			t.appendChild(b);
			while(t.children.length > 3) t.firstChild.remove();
			setTimeout(() => { b.classList.add("fade"); b.disabled = true; }, (c.english ? 4600 : 4000)/SPEED);
			await wait(c.english ? 1900 : 1650);
		}
		await wait(2400);
		S.sig += caught;
		const score1 = Math.max(0, caught - noise*.5);
		cs.max += sigs.length; cs.pts += Math.min(sigs.length, score1);
		const lost = sigs.filter(l => !got.has(l[0]));
		say(caught === sigs.length ? `Tout noté : ${caught} signaux sur ${sigs.length}. ${noise ? "Mais pas besoin de tout noter !" : "Belle écoute."}` :
			`${caught} signal${caught > 1 ? "s" : ""} sur ${sigs.length}. Tu as laissé passer : « ${lost[0][0]} »`, 6000);
		t.remove(); talk = null;
	}

	/* ---------- étape : répondre sous chrono ---------- */
	function choice(st, c){
		return new Promise(done => {
			const lucie = st.who === "lucie";
			const opts = shuffle(st.opts);
			dock.innerHTML = `<div class="gq-q">${lucie ? `<span class="ph">📱</span>` : `<span class="ph">💬</span>`}<span>${lucie ? "Lucie, 19 ans, sur la messagerie : " : ""}${st.q}</span></div>
				<div class="gq-timer"><i></i></div>
				<div class="gq-cards">${opts.map((o, i) => `<button class="gq-card" data-i="${i}">${o[0]}</button>`).join("")}</div>`;
			const bar = dock.querySelector(".gq-timer i");
			let over = false;
			const stop = countdown((st.time || (S.ci === 0 && !S.firstChoice ? 14 : 11)), bar, () => pick(-1));
			S.firstChoice = true;
			dock.querySelectorAll(".gq-card").forEach(b => b.onclick = () => pick(+b.dataset.i));
			dock.querySelector(".gq-card").focus({ preventScroll:true });
			async function pick(i){
				if(over) return; over = true; stop();
				let res = "ko", msg = "Trop long : le client s'impatiente, et la file aussi.", fl = {};
				if(i >= 0){ const o = opts[i]; res = o[1]; msg = o[2]; fl = o[3] || {}; }
				else S.timeouts++;
				dock.querySelectorAll(".gq-card").forEach((b, k) => { b.disabled = true; if(k === i) b.classList.add(res); else if(opts[k][1] === "ok") b.classList.add("ok"); else b.classList.add("dim"); });
				score(res); if(!lucie) react(res);
				if(fl.conf){ S.conf.push(msg); }
				if(fl.sell){ S.sell++; }
				if(fl.pnb) S.pnb += fl.pnb;
				if(res === "ok" && !fl.pnb) S.pnb += 150;
				play(res === "ok" ? "good" : res === "mid" ? "chime" : "bad");
				if(res !== "ok") ev("err");
				say((res === "ok" ? "✔ " : res === "mid" ? "≈ " : "✘ ") + msg, 6500);
				await wait(2300);
				dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- étape : lire un document ---------- */
	function doc(st){
		return new Promise(done => {
			dock.innerHTML = `<div class="gq-q"><span class="ph">📄</span><span>${st.q}</span></div><div class="gq-timer"><i></i></div>
				<div class="gq-doc"><h4>Prévisionnel · année 1</h4>${st.lines.map((l, i) => `<button data-i="${i}"><span>${l[0]}</span><b>${l[1]}</b></button>`).join("")}</div>`;
			let over = false;
			const stop = countdown(14, dock.querySelector(".gq-timer i"), () => pick(-1));
			dock.querySelectorAll(".gq-doc button").forEach(b => b.onclick = () => pick(+b.dataset.i));
			async function pick(i){
				if(over) return; over = true; stop();
				const good = st.lines.findIndex(l => l[2]), res = i === good ? "ok" : "ko";
				dock.querySelectorAll(".gq-doc button").forEach((b, k) => { b.disabled = true; if(k === good) b.classList.add("ok"); else if(k === i) b.classList.add("ko"); });
				score(res); react(res); play(res === "ok" ? "good" : "bad"); if(res !== "ok") ev("err");
				say((res === "ok" ? "✔ Bien vu. " : "✘ Regarde mieux : ") + st.lines[good][3], 7000);
				await wait(2800); dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- étape : le simulateur ---------- */
	const SLIDERS = {
		immo:{ title:"Simulateur de crédit immobilier · Jade et Sami", min:10, max:25, step:1, v:15, q:"Règle la durée du prêt : sous les 35 % d'endettement, au coût le plus bas.",
			big:v => `${v} ans`,
			read:v => { const r = immoCalc(v); return { html:`<div>Taux<b>${String(IMMO.taux).replace(".", ",")} %</b><s>${String(IMMO.tauxAvant).replace(".", ",")} % avant l'annonce</s></div><div>Mensualité, assurance comprise<b>${euro(r.total)}</b></div><div>Intérêts sur toute la durée<b>${euro(r.interets)}</b></div>`,
				gauge:{ v:r.pct, lim:IMMO.max, label:`Endettement ${pct(r.pct)}`, limLabel:"35 % (HCSF)" } }; },
			judge:v => { const r = immoCalc(v), b = immoBest(), rb = immoCalc(b);
				if(r.pct > IMMO.max) return ["ko", `Refusé : ${pct(r.pct)} d'endettement, au-delà des 35 % du HCSF. Il fallait allonger la durée.`];
				if(v <= b + 1) return ["ok", `Parfait : ${pct(r.pct)} d'endettement et le moins d'intérêts possible (${euro(r.interets)}).`];
				return ["mid", `Le dossier passe, mais en ${v} ans ils paieront ${euro(r.interets - rb.interets)} d'intérêts de plus qu'en ${b} ans.`]; } },
		uc:{ title:"Allocation de l'assurance-vie · M. Duhamel · 40 000 €", min:0, max:100, step:10, v:50, q:"Combien mettre en unités de compte (plus de rendement espéré, mais un risque de perte) ?",
			big:v => `${v} % en unités de compte`,
			read:v => { const uc = 400*v, fe = 40000 - uc, rend = 2.5 + v/100*3.5, perte = uc*.25;
				return { html:`<div>Fonds en euros (garanti)<b>${euro(fe)}</b></div><div>Rendement espéré / an<b>${rend.toFixed(1).replace(".", ",")} %</b></div><div>Si les marchés chutent de 25 %<b>−${euro(perte)}</b></div>`,
					gauge:{ v:v/100, lim:.2, label:`Risque : ${v} %`, limLabel:"Profil prudent" } }; },
			judge:v => v <= 20 ? ["ok", "Conforme à son profil : prudent, horizon de 2-3 ans, aucune expérience des marchés."]
				: v <= 40 ? ["mid", "Un peu trop risqué pour un horizon de 2-3 ans."]
				: ["ko", "Non conforme à son profil MIF 2 : il pourrait perdre une grosse part de l'argent destiné à ses petits-enfants.", 1] },
		franchise:{ title:"Nouveau contrat habitation · Mme Benali", min:0, max:1000, step:50, v:0, q:"Choisis sa franchise : moins de prime chaque année, mais plus à payer à chaque sinistre.",
			big:v => `Franchise ${euro(v)}`,
			read:v => { const prime = Math.round((520 - .42*v)/5)*5;
				return { html:`<div>Prime annuelle<b>${euro(prime)}</b></div><div>Reste à payer par sinistre<b>${euro(v)}</b></div><div>Son épargne<b>1 500 €</b></div>`,
					gauge:{ v:v/1500, lim:400/1500, label:`Franchise / épargne : ${pct(v/1500)}`, limLabel:"Supportable" } }; },
			judge:v => v >= 150 && v <= 400 ? ["ok", "Bon équilibre : la prime baisse, et elle peut payer la franchise même avec deux sinistres dans l'année."]
				: v < 150 ? ["mid", "Elle paie une prime chère pour éviter un reste à payer qu'elle pouvait assumer."]
				: v <= 700 ? ["mid", "Risqué : son immeuble a des fuites à répétition et elle n'a que 1 500 € de côté."]
				: ["ko", "Trop haut : un seul sinistre viderait la moitié de son épargne."] }
	};
	function slider(st){
		return new Promise(done => {
			const K = SLIDERS[st.kind]; let v = K.v, over = false;
			dock.innerHTML = `<div class="gq-q"><span class="ph">🖥️</span><span>${K.q}</span></div><div class="gq-timer"><i></i></div>
				<div class="gq-screen"><h4>${K.title}</h4><div class="gq-big"></div><div class="gq-read"></div><div class="gq-gauge"><i></i><em></em><span class="l1"></span></div>
				<div class="gq-track" tabindex="0" role="slider" aria-valuemin="${K.min}" aria-valuemax="${K.max}"><div class="gq-knob">⇔</div></div>
				<button class="gq-go">Proposer au client</button></div>`;
			const track = dock.querySelector(".gq-track"), knob = dock.querySelector(".gq-knob"), g = dock.querySelector(".gq-gauge");
			function draw(){
				const f = (v - K.min)/(K.max - K.min); knob.style.left = (f*100) + "%";
				track.setAttribute("aria-valuenow", v); track.setAttribute("aria-valuetext", K.big(v));
				dock.querySelector(".gq-big").textContent = K.big(v);
				const r = K.read(v); dock.querySelector(".gq-read").innerHTML = r.html;
				const gv = Math.min(1, r.gauge.v/(r.gauge.lim*1.6)), gl = r.gauge.lim/(r.gauge.lim*1.6);
				g.querySelector("i").style.width = (gv*100) + "%"; g.querySelector("em").style.left = (gl*100) + "%";
				g.classList.toggle("over", r.gauge.v > r.gauge.lim + 1e-9);
				g.querySelector(".l1").style.left = (gl*100) + "%"; g.querySelector(".l1").textContent = `${r.gauge.label} · limite ${r.gauge.limLabel}`;
			}
			function setX(x){ const b = track.getBoundingClientRect(); const f = Math.max(0, Math.min(1, (x - b.left)/b.width)); const nv = K.min + Math.round(f*(K.max - K.min)/K.step)*K.step; if(nv !== v){ v = nv; draw(); play("clic"); } }
			let dragId = null;
			track.addEventListener("pointerdown", e => { dragId = e.pointerId; track.setPointerCapture(e.pointerId); setX(e.clientX); });
			track.addEventListener("pointermove", e => { if(e.pointerId === dragId) setX(e.clientX); });
			track.addEventListener("pointerup", () => dragId = null);
			track.addEventListener("keydown", e => { if(e.key === "ArrowRight" || e.key === "ArrowUp"){ v = Math.min(K.max, v + K.step); draw(); e.preventDefault(); } if(e.key === "ArrowLeft" || e.key === "ArrowDown"){ v = Math.max(K.min, v - K.step); draw(); e.preventDefault(); } });
			draw(); track.focus({ preventScroll:true });
			const stop = countdown(22, dock.querySelector(".gq-timer i"), () => propose());
			const goBtn = dock.querySelector(".gq-go"); goBtn.onclick = propose;
			if(S.ci === 0) say("Le simulateur est sur ton écran : <b>fais glisser le curseur</b> et regarde la jauge, puis propose.", 7000);
			async function propose(){
				if(over) return; over = true; stop();
				const [res, msg, conf] = K.judge(v);
				score(res, 3); react(res); if(conf) S.conf.push(msg); if(res === "ok") S.pnb += st.kind === "immo" ? 1950 : st.kind === "uc" ? 400 : 120;
				play(res === "ok" ? "good" : res === "mid" ? "chime" : "bad"); if(res !== "ok") ev("err");
				say((res === "ok" ? "✔ " : res === "mid" ? "≈ " : "✘ ") + msg, 7000);
				goBtn.disabled = true;
				await wait(2600);
				if(st.kind === "uc"){
					const loss = 400*v*.25;
					say(`📉 Un mois plus tard, krach : −25 % sur les marchés. ${v ? `Les ${v} % en unités de compte de M. Duhamel perdent ${euro(loss)}.` : "Son fonds en euros, lui, ne bouge pas."}`, 6000);
					await wait(2600);
				}
				dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- étape : la radio ---------- */
	async function radioStep(st){
		S.radio = 3; play("chime"); say(st.text, 6500); await wait(3400); S.radio = 0;
	}

	/* ---------- étape : le téléphone vibre ---------- */
	function phoneStep(){
		return new Promise(done => {
			S.buzz = true; play("clic");
			const b = document.createElement("button"); b.className = "gq-phone"; b.textContent = "📱 Nouveau message"; root.appendChild(b); S.phoneBtn = b;
			dock.innerHTML = `<div class="gq-q"><span class="ph">📳</span><span>Ton téléphone pro vibre sur le comptoir : une cliente t'écrit. Réponds vite !</span></div><div class="gq-timer"><i></i></div>`;
			let over = false;
			const stop = countdown(6, dock.querySelector(".gq-timer i"), () => tap(false));
			b.onclick = () => tap(true);
			async function tap(ok){
				if(over) return; over = true; stop(); S.buzz = false; b.remove(); S.phoneBtn = null; dock.innerHTML = "";
				score(ok ? "ok" : "ko", 1);
				if(!ok){ say("Le message est resté sans réponse pendant que tu parlais… Lucie attend. Sur la messagerie aussi, le client attend une réponse rapide.", 5500); ev("err"); }
				else play("pop");
				done();
			}
		});
	}

	/* ---------- étape : l'alerte au guichet voisin ---------- */
	function stopStep(st){
		return new Promise(done => {
			stranger.g.visible = true; stranger.g.position.set(-6, 0, -4.5); goTo(stranger, new THREE.Vector3(-6, 0, -3.5), 0);
			play("alarm");
			dock.innerHTML = `<div class="gq-alert"><b>⚠ Guichet voisin</b>${st.text}</div><div class="gq-timer"><i></i></div>
				<button class="gq-hold"><i></i><span>✋ Maintiens : demander l'origine des fonds</span></button>`;
			const btn = dock.querySelector(".gq-hold"), fill = btn.querySelector("i");
			let over = false, hold = null;
			const stop = countdown(8, dock.querySelector(".gq-timer i"), () => end(false));
			const startH = e => { if(over) return; e.preventDefault(); hold = { t:0 }; S.hold = h => { hold.t += h; fill.style.width = Math.min(100, hold.t/1.2*100) + "%"; if(hold.t >= 1.2) end(true); }; };
			const endH = () => { if(over) return; hold = null; S.hold = null; fill.style.width = "0"; };
			btn.addEventListener("pointerdown", startH); btn.addEventListener("pointerup", endH); btn.addEventListener("pointerleave", endH); btn.addEventListener("pointercancel", endH);
			btn.addEventListener("keydown", e => { if((e.key === " " || e.key === "Enter") && !e.repeat) startH(e); });
			btn.addEventListener("keyup", e => { if(e.key === " " || e.key === "Enter") endH(); });
			btn.focus({ preventScroll:true });
			async function end(ok){
				if(over) return; over = true; stop(); S.hold = null; btn.disabled = true;
				score(ok ? "ok" : "ko");
				if(ok){ play("stamp"); say("✔ Bien : des espèces fractionnées pour rester sous 10 000 €, c'est un signal d'alerte. On demande l'origine des fonds ; sans justificatif, déclaration de soupçon à Tracfin, sans prévenir le client.", 8000); S.pnb += 0; }
				else { play("bad"); const m = "Tu as laissé passer des espèces fractionnées : un signal classique de blanchiment."; S.conf.push(m); say("✘ " + m + " Il fallait demander l'origine des fonds.", 8000); ev("err"); }
				await wait(3000);
				goTo(stranger, new THREE.Vector3(-9, 0, -5), Math.PI); dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- déroulé ---------- */
	async function serve(ci){
		const c = CLIENTS[ci]; S.ci = ci; cs = { pts:0, max:0 };
		setTicket(c.ticket); $("#gqCount").textContent = `Client ${ci + 1} / ${CLIENTS.length}`;
		play("chime");
		people[ci].forEach((p, j) => goTo(p, AT.clone().add(new THREE.Vector3((j - (people[ci].length - 1)/2)*1.1, 0, 0)), 0));
		advanceQueue(ci + 1);
		await wait(1700); if(closed) return;
		ev("stage", `${c.name} · ${c.who}`);
		speak(c.hello, 2600); await wait(2300);
		for(const st of c.steps){
			if(closed) return;
			if(st.t === "listen") await listen(st, c);
			else if(st.t === "choice") await choice(st, c);
			else if(st.t === "doc") await doc(st);
			else if(st.t === "slider") await slider(st);
			else if(st.t === "radio") await radioStep(st);
			else if(st.t === "phone") await phoneStep(st);
			else if(st.t === "stop") await stopStep(st);
			if(closed) return;
			learn(st.courses);
			await wait(300);
		}
		const sat = cs.max ? cs.pts/cs.max : 1;
		S.per.push({ name:c.name, who:c.who, sat });
		react(sat >= .8 ? "ok" : sat >= .5 ? "mid" : "ko");
		speak(sat >= .8 ? (c.english ? "Thank you so much!" : "Merci beaucoup, on reviendra !") : sat >= .5 ? (c.english ? "OK… thanks." : "Bon… merci.") : (c.english ? "I'll try another bank." : "Je vais voir une autre banque."), 2200);
		await wait(2000);
		people[ci].forEach(p => goTo(p, EXIT, Math.PI/2));
		if(talk){ talk.remove(); talk = null; }
	}
	async function run(){
		for(let ci = 0; ci < CLIENTS.length; ci++){ await serve(ci); if(closed) return; }
		await wait(1200); if(closed) return;
		await bilan(); if(closed) return;
		finish();
	}

	/* ---------- bilan : le tableau de bord de la matinée ---------- */
	function bilan(){
		return new Promise(done => {
			const low = Math.min(...S.per.map(p => p.sat));
			card.innerHTML = `<p class="k">12 h · tableau de bord de l'agence</p><h2>Satisfaction de la matinée</h2>
				<p>Nadia ouvre le tableau de bord. <b>Touche le client que tu as le moins bien servi</b> : c'est par là qu'on progresse.</p>
				<div class="gq-bars">${S.per.map((p, i) => `<button data-i="${i}" aria-label="${p.name} : ${pct(p.sat)}"><span>${pct(p.sat)}</span><i style="height:${Math.max(4, p.sat*130)}px"></i>${p.name}</button>`).join("")}</div>`;
			ov.hidden = false; S.phase = "bilan";
			card.querySelectorAll(".gq-bars button").forEach(b => b.onclick = async () => {
				if(S.phase !== "bilan") return; S.phase = "end";
				const i = +b.dataset.i, ok = S.per[i].sat <= low + 1e-9;
				S.bilan = ok ? 1 : 0;
				card.querySelectorAll(".gq-bars button").forEach((x, k) => { if(S.per[k].sat <= low + 1e-9) x.classList.add("ok"); else if(k === i) x.classList.add("ko"); });
				play(ok ? "good" : "bad"); learn(["stats", "relation"]);
				const p = card.querySelector("p:last-of-type"); p.innerHTML = ok ? "✔ Bien lu : c'est le client à revoir en priorité." : "✘ Regarde la barre la plus basse : c'est elle, le client à revoir.";
				await wait(2200); done();
			});
		});
	}

	/* ---------- boucle ---------- */
	let last = performance.now(), raf = 0;
	function frame(now){
		if(closed) return;
		raf = requestAnimationFrame(frame);
		const dt = Math.min(.05, (now - last)/1000); last = now; const t = now/1000;
		if(SPEED === 1) tickTimers(dt);
		walkPeople(dt, t);
		phone.position.x = 1.45 + (S.buzz ? Math.sin(t*60)*.015 : 0); phoneGlow.material.opacity = S.buzz ? .5 + .4*Math.sin(t*12) : 0;
		radio.scale.setScalar(S.radio ? 1 + .06*Math.sin(t*14) : 1);
		renderer.render(scene, camera);
		placeOverlays();
	}
	function tickTimers(dt){
		for(const o of [...timers]){
			o.t -= dt*SPEED;
			if(o.tick){ if(o.el){ o.el.style.transform = `scaleX(${Math.max(0, o.t/o.max)})`; o.el.parentNode.classList.toggle("low", o.t < o.max*.3); } if(o.t <= 0){ timers.delete(o); o.onEnd(); } }
			else if(o.t <= 0){ timers.delete(o); o.r(); }
		}
		if(S.hold) S.hold(dt*Math.min(SPEED, 2));
	}
	function walkPeople(dt, t){
		for(const p of [...people.flat(), stranger]){
			const d = p.target.clone().sub(p.g.position); d.y = 0; const L = d.length();
			if(L > .02){ const s = Math.min(L, dt*2.6*Math.min(SPEED, 3)); p.g.position.addScaledVector(d.normalize(), s); p.g.rotation.y = Math.atan2(d.x, d.z); p.g.position.y = Math.abs(Math.sin(t*10))*.06; }
			else { p.g.position.y = 0; if(p.face !== undefined) p.g.rotation.y += (p.face - p.g.rotation.y)*Math.min(1, dt*6); }
		}
	}
	function placeOverlays(){
		if(talk){ const s = toScreen(headOf(S.ci)); const half = Math.min(165, innerWidth/2 - 12); talk.style.left = Math.max(half + 12, Math.min(innerWidth - half - 12, s.x)) + "px"; talk.style.top = Math.max(talk.offsetHeight + 70, s.y) + "px"; }
		if(S.phoneBtn){ const s = toScreen(new THREE.Vector3(1.45, 1.4, 1.45)); S.phoneBtn.style.left = Math.min(innerWidth - 100, s.x) + "px"; S.phoneBtn.style.top = Math.min(innerHeight - 140, s.y) + "px"; }
	}

	/* ---------- début, fin, fermeture ---------- */
	const ov = $("#gqOv"), card = $("#gqCard");
	function intro(){
		card.innerHTML = `<p class="k">Licence Pro Assurance-Banque-Finance · chargé de clientèle</p>
			<h2>Le guichet du samedi</h2>
			<p>Samedi, 9 h, ton agence de Lambersart. Tu es en alternance, et cinq clients font déjà la queue. Nadia, ta tutrice, passe dans ton dos.</p>
			<div class="gq-legend">
				<div><b>👂</b>Écoute : touche ce que le client dit d'important, avant que ça s'efface.</div>
				<div><b>💬</b>Réponds avant la fin du chrono.</div>
				<div><b>🖥️</b>Règle le simulateur : les chiffres bougent en direct.</div>
				<div><b>✋</b>Maintiens « Stop » quand la conformité l'exige.</div>
			</div>
			<p>Vendre plus ne suffit pas : un client mal conseillé ne revient pas. Environ 4 minutes.</p>
			<button class="gq-go" data-a="start">Ouvrir le guichet</button>`;
	}
	function finish(){
		S.phase = "done"; play("win");
		const tot = S.per.reduce((a, p) => a + p.sat, 0)/S.per.length;
		const score100 = Math.max(0, Math.round((tot*.9 + S.bilan*.1 - S.conf.length*.08)*100));
		const mention = MENTIONS[score100 >= 85 ? 3 : score100 >= 65 ? 2 : score100 >= 45 ? 1 : 0];
		ev("win", mention);
		const happy = S.per.filter(p => p.sat >= .8).length;
		const rank = mention === "Très bien" ? "Conseiller de confiance" : mention === "Bien" ? "Bon conseiller" : mention === "Assez bien" ? "Conseiller en devenir" : "À revoir avec Nadia";
		card.innerHTML = `<p class="k">12 h 30 · la matinée est finie</p><div class="gq-big2">${score100 >= 65 ? "🏆" : "📋"}</div>
			<h2>${rank}</h2>
			<p>Mention <b>${mention}</b> (${score100} / 100). ${S.conf.length ? "La conformité te coûte des points : en banque, c'est non négociable." : S.sell ? "Aucun manquement, mais des produits en trop : vendre n'est pas conseiller." : "Écoute, justesse, conformité : c'est exactement le métier."}</p>
			<div class="gq-stats"><div>Clients ravis<b>${happy} / ${S.per.length}</b></div><div>Signaux repérés<b>${S.sig} / ${S.sigMax}</b></div><div>Manquements<b>${S.conf.length}</b></div><div>Produits en trop<b>${S.sell}</b></div></div>
			<table class="gq-tbl">${S.per.map(p => `<tr><td>${p.sat >= .8 ? "😊" : p.sat >= .5 ? "😐" : "😠"}</td><td><b>${p.name}</b> · ${p.who}</td><td>${pct(p.sat)}</td></tr>`).join("")}</table>
			${S.conf.length ? `<p class="k">Les remarques de la conformité</p><ul class="gq-list warn">${S.conf.map(m => `<li>${m}</li>`).join("")}</ul>` : ""}
			<p class="k">Les cours de la licence pro que tu as pratiqués (${S.learned.length})</p>
			<ul class="gq-list">${S.learned.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${jpoCard()}${openLead ? `<button class="gq-go" data-a="lead">📄 Recevoir la plaquette de la licence pro</button>` : ""}
			<a class="gq-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Pro Assurance-Banque-Finance ↗</a>
			<button class="gq-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="gq-alt" data-a="replay">Rejouer</button>`;
		ov.hidden = false; card.scrollTop = 0; nadia.classList.add("off");
	}
	ov.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		if(a === "start" && S.phase === "intro"){ ov.hidden = true; S.phase = "play"; ev("start"); run(); }
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ close(); openGuichet({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }); }
	});
	$(".gq-x").addEventListener("click", close);
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	let pump = 0;      // ?vite : l'horloge du jeu avance même quand l'affichage est en pause (tests automatiques)
	if(SPEED > 1){ window.__guichet = { S }; pump = setInterval(() => { if(!closed){ tickTimers(.03); walkPeople(.03, performance.now()/1000); } }, 30); }

	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); clearInterval(pump); timers.clear();
		removeEventListener("resize", resize); document.removeEventListener("keydown", onKey);
		clearTimeout(nadiaOff);
		[signM, tickM, phoneGlow.material].forEach(m => { m.map && m.map.dispose(); m.dispose(); });      // les géométries du kit sont partagées avec le campus : on ne les libère pas
		scene.clear();
		renderer.dispose(); renderer.forceContextLoss();
		root.remove();
		onClose && onClose();
	}

	intro();
	raf = requestAnimationFrame(frame);
}
