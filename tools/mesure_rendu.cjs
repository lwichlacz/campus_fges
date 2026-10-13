/* Mesure de la charge de rendu (triangles et appels de dessin par image), par qualité et par point de vue,
   dans Chrome sans écran, à la taille d'un téléphone. Vérifie aussi qu'aucun programme de shader n'est en erreur.

   Usage :  python3 tools/serve.py           (dans un autre terminal)
            npm i --no-save puppeteer-core
            node tools/mesure_rendu.cjs [largeur hauteur densité]      (par défaut 390 844 3, un iPhone)
   Variable CHROME : chemin de Chrome (par défaut /usr/local/bin/google-chrome).

   Le processeur graphique logiciel (SwiftShader) donne des durées sans rapport avec un téléphone : seuls les
   triangles et les appels comptent ici. Sur un vrai téléphone, ouvrir le site avec ?perf. */
const puppeteer = require("puppeteer-core");
const [,, w = 390, h = 844, dpr = 3] = process.argv;
(async () => {
	const b = await puppeteer.launch({ executablePath:process.env.CHROME || "/usr/local/bin/google-chrome", headless:"new",
		args:["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
	const p = await b.newPage();
	await p.setViewport({ width:+w, height:+h, deviceScaleFactor:+dpr, isMobile:true, hasTouch:true });
	p.on("pageerror", e => console.log("ERREUR page :", e.message));
	await p.evaluateOnNewDocument(() => { localStorage.setItem("campusfges:introSeen", "true"); localStorage.setItem("campusfges:onboarded", "true"); });
	await p.goto("http://localhost:8765/?debug", { waitUntil:"load", timeout:120000 });
	await p.waitForFunction(() => window.campus && window.campus.far.horizon, { timeout:180000 });
	const res = await p.evaluate(async () => {
		const C = window.campus, info = C.renderer.info, out = {};
		const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
		const home = [...C.camera.position.toArray(), ...C.controls.target.toArray()];
		const views = { accueil:home, dessus:[0, 260, 160, 0, 0, -14], pieton:[10, 1.7, 40, 0, 4, -14], rasant:[-120, 20, 120, 0, 0, -14] };
		for(const q of ["haute", "moyenne", "basse"]){
			C.setQuality(q); await frame();
			for(const [name, v] of Object.entries(views)){
				C.view(...v); await frame();
				info.autoReset = false; info.reset();
				await frame();          // deux images
				out[`${q.padEnd(7)} ${name.padEnd(7)}`] = `${String(Math.round(info.render.triangles/2000)).padStart(5)} k triangles  ${String(Math.round(info.render.calls/2)).padStart(4)} appels`;
				info.autoReset = true;
			}
			C.view(...home);
		}
		out["programmes en erreur"] = C.renderer.info.programs.filter(p => p.diagnostics && !p.diagnostics.runnable).length;
		return out;
	});
	for(const [k, v] of Object.entries(res)) console.log(k, " ", v);
	await b.close();
})();
