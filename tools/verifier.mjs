/* Vérification complète du site avant chaque mise en ligne, sans rien installer (Node 22+ et Chrome ou Edge).

   1. Fichiers : chaque module JavaScript se lit sans erreur de syntaxe, chaque import pointe vers un fichier
      qui existe, et tous portent le même numéro de version (tools/version.py).
   2. Site : Chrome sans écran ouvre le campus, puis entre dans chaque intérieur (atrium, chapelle, BU, quartier
      Euratechnologies, Wenov) et ouvre puis referme chaque mini-jeu. Toute erreur JavaScript, tout fichier
      introuvable et tout shader en erreur est relevé. La page de relecture et la liste des formations aussi.
   3. Captures : une image par étape dans tools/verif/ (planche à regarder : tools/verif/index.html).

   Usage :  node tools/verifier.mjs            (tout, environ 2 minutes)
            node tools/verifier.mjs --rapide   (fichiers seulement, quelques secondes)
   Variable CHROME : chemin du navigateur (par défaut Chrome, puis Edge).
   Code de sortie 1 s'il y a un problème : le crochet git pre-push (tools/installer-verification.sh) bloque alors l'envoi. */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync, mkdtempSync } from "node:fs";
import { join, dirname, extname, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RAPIDE = process.argv.includes("--rapide");
const problems = [];
const ok = msg => console.log("  ✓ " + msg);
const bad = msg => { problems.push(msg); console.log("  ✗ " + msg); };

/* ---------------- 1. les fichiers ---------------- */
console.log("Fichiers");
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const modules = walk(join(ROOT, "js")).filter(f => f.endsWith(".js"));
const tmp = mkdtempSync(join(tmpdir(), "verif-"));
const IMPORT = /(?:import\s[^"'`]*?from\s*|import\s*\(\s*|^\s*import\s*)(["'])(\.{1,2}\/[^"']+)\1/gm;
const versions = new Set();
let syntaxOk = 0;
for(const f of modules){
	// copié en .mjs : Node le lit alors comme un module, exactement comme le navigateur
	const copy = join(tmp, relative(ROOT, f).replace(/[\\/]/g, "_") + ".mjs");
	copyFileSync(f, copy);
	const r = spawnSync(process.execPath, ["--check", copy], { encoding:"utf8" });
	if(r.status !== 0) bad(`syntaxe : ${relative(ROOT, f)}\n      ${(r.stderr || "").split("\n").filter(l => l.trim()).slice(0, 4).join("\n      ")}`);
	else syntaxOk++;
	const src = readFileSync(f, "utf8");
	for(const m of src.matchAll(IMPORT)){
		const [path, v] = m[2].split("?v=");
		if(v) versions.add(v);
		if(!existsSync(join(dirname(f), path))) bad(`import introuvable dans ${relative(ROOT, f)} : ${m[2]}`);
	}
}
rmSync(tmp, { recursive:true, force:true });
if(syntaxOk === modules.length) ok(`${modules.length} modules sans erreur de syntaxe`);
for(const page of ["index.html", "liste.html"]){
	for(const m of readFileSync(join(ROOT, page), "utf8").matchAll(/(["'])((?:\.\/)?js\/[^"'?]+\.js)(?:\?v=([0-9a-f]+))?\1/g)){
		if(m[3]) versions.add(m[3]);
		if(!existsSync(join(ROOT, m[2]))) bad(`${page} charge un fichier introuvable : ${m[2]}`);
	}
}
if(versions.size > 1) bad(`numéros de version mélangés (${[...versions].join(", ")}) : lancer python tools/version.py`);
else ok(`un seul numéro de version (${[...versions][0] || "aucun"})`);

if(RAPIDE){ finish(); }
else await browserChecks().catch(e => bad("vérification dans le navigateur interrompue : " + (e.stack || e))).then(finish);

function finish(){
	console.log(problems.length ? `\n${problems.length} problème(s) : ne pas mettre en ligne.` : "\nTout est bon.");
	process.exit(problems.length ? 1 : 0);
}

/* ---------------- 2. le site dans Chrome sans écran ---------------- */
async function browserChecks(){
	console.log("\nSite (Chrome sans écran)");
	const OUT = join(ROOT, "tools", "verif"); mkdirSync(OUT, { recursive:true });
	for(const f of readdirSync(OUT)) rmSync(join(OUT, f));

	// serveur de fichiers local, sans cache
	const TYPES = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".webp":"image/webp", ".svg":"image/svg+xml", ".mp4":"video/mp4", ".woff2":"font/woff2", ".mp3":"audio/mpeg", ".wav":"audio/wav", ".ico":"image/x-icon" };
	const server = createServer((req, res) => {
		let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
		if(p.endsWith("/")) p += "index.html";
		const f = join(ROOT, p);
		if(!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
		res.writeHead(200, { "content-type":TYPES[extname(f)] || "application/octet-stream", "cache-control":"no-store" });
		res.end(readFileSync(f));
	});
	await new Promise(r => server.listen(0, "127.0.0.1", r));
	const BASE = `http://127.0.0.1:${server.address().port}/`;

	const exe = process.env.CHROME || ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome"].find(existsSync);
	if(!exe) throw new Error("Chrome introuvable (variable CHROME)");
	const profile = mkdtempSync(join(tmpdir(), "verif-chrome-"));
	const chrome = spawn(exe, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--window-size=1280,800",
		"--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-first-run", "--no-default-browser-check", "--mute-audio", "about:blank"], { stdio:"ignore" });
	try {
		let port = null;
		for(let i = 0; i < 100 && !port; i++){ await sleep(100); const f = join(profile, "DevToolsActivePort"); if(existsSync(f)) port = readFileSync(f, "utf8").split("\n")[0].trim(); }
		if(!port) throw new Error("Chrome ne répond pas");
		const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === "page");
		const cdp = await connect(page.webSocketDebuggerUrl);

		const errors = [];
		let where = "chargement";
		cdp.on("Runtime.exceptionThrown", p => errors.push(`[${where}] ${p.exceptionDetails.exception?.description?.split("\n")[0] || p.exceptionDetails.text}`));
		cdp.on("Runtime.consoleAPICalled", p => { if(p.type === "error") errors.push(`[${where}] console : ${p.args.map(a => a.value ?? a.description ?? "").join(" ").slice(0, 200)}`); });
		cdp.on("Network.responseReceived", p => { const u = p.response.url; if(p.response.status >= 400 && u.startsWith(BASE)) errors.push(`[${where}] ${p.response.status} ${u.slice(BASE.length)}`); });
		cdp.on("Network.loadingFailed", p => { if(!p.canceled && p.type !== "Media") errors.push(`[${where}] échec de chargement (${p.errorText}) ${p.requestId}`); });
		await cdp.send("Runtime.enable"); await cdp.send("Network.enable"); await cdp.send("Page.enable");
		await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source:`try{ localStorage.setItem("campusfges:introSeen","true"); localStorage.setItem("campusfges:onboarded","true"); }catch(e){}` });

		const evaluate = async (expr, timeout = 60000) => {
			const r = await cdp.send("Runtime.evaluate", { expression:`(async () => { ${expr} })()`, awaitPromise:true, returnByValue:true, timeout });
			if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description?.split("\n")[0] || r.exceptionDetails.text);
			return r.result.value;
		};
		const shots = [];
		const shot = async (name, label) => {
			const r = await cdp.send("Page.captureScreenshot", { format:"jpeg", quality:72 });
			writeFileSync(join(OUT, name + ".jpg"), Buffer.from(r.data, "base64")); shots.push([name, label]);
		};
		const step = async (label, fn) => {
			where = label; const n = errors.length;
			try { const msg = await fn(); if(errors.length > n) bad(`${label} : ${errors.slice(n).join(" | ")}`); else ok(label + (msg ? ` (${msg})` : "")); }
			catch(e){ bad(`${label} : ${e.message}`); }
		};
		const frames = n => `for(let i = 0; i < ${n}; i++) await new Promise(r => requestAnimationFrame(r));`;
		// captures comparables d'une fois à l'autre : beau temps, ni fiche ni visite guidée ouverte
		const calm = `document.querySelector('[data-weather=soleil]')?.click(); document.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape" }));`;
		const goto = async url => { await cdp.send("Page.navigate", { url }); await sleep(500); };

		await step("le campus se charge", async () => {
			await goto(BASE + "?debug");
			await evaluate(`for(let i = 0; i < 1200 && !(window.campus && window.campus.far && window.campus.far.horizon); i++) await new Promise(r => setTimeout(r, 100));
				if(!window.campus) throw new Error("window.campus absent après 2 minutes"); ${frames(10)}`, 150000);
			const bad = await evaluate(`return window.campus.renderer.info.programs.filter(p => p.diagnostics && !p.diagnostics.runnable).length;`);
			if(bad) throw new Error(`${bad} shader(s) en erreur`);
			await shot("01-accueil", "Écran d'accueil");
		});
		// le vrai parcours d'un lycéen : profil, puis « Entrer sur le campus »
		await step("entrée sur le campus (profil lycée)", async () => {
			await evaluate(`document.querySelector('#welcome [data-p="lycee"]').click();
				for(let i = 0; i < 50 && document.getElementById("go").disabled; i++) await new Promise(r => setTimeout(r, 100));
				if(document.getElementById("go").disabled) throw new Error("le bouton Entrer reste grisé");
				document.getElementById("go").click();
				await new Promise(r => setTimeout(r, 3500));
				${calm} ${frames(6)}`);
			const shown = await evaluate(`const w = document.getElementById("welcome"); return !!w && !w.hidden && getComputedStyle(w).display !== "none" && getComputedStyle(w).visibility !== "hidden" && +getComputedStyle(w).opacity > .1;`);
			if(shown) throw new Error("l'écran d'accueil ne se ferme pas");
			await shot("01b-campus", "Campus après l'entrée");
		});
		const views = [["02-cour", "Cour d'honneur", [28, 42, 48, 0, 4, 0]], ["03-bu", "BU Vauban", [-17, 30, -35, -47.6, 6, -9.8]], ["04-rizomm", "Rizomm et Michel Falise", [10, 45, -10, -8, 8, -37]], ["05-dessus", "Vue d'ensemble", [0, 260, 160, 0, 0, -14]]];
		for(const [name, label, v] of views) await step(`vue : ${label}`, async () => { await evaluate(`${calm} window.campus.view(${v}); ${frames(6)}`); await shot(name, label); });
		await step("nuit et hiver", async () => {
			await evaluate(`window.campus.set("time", "nuit"); document.querySelector('[data-season=hiver]')?.click(); window.campus.view(10, 45, -10, -8, 8, -37); ${frames(8)}`);
			await shot("06-nuit-hiver", "Nuit d'hiver");
			await evaluate(`window.campus.set("time", "jour"); document.querySelector('[data-season=automne]')?.click(); ${frames(4)}`);
		});
		for(const [id, label] of [["atrium", "Atrium de Michel Falise"], ["chapelle", "Chapelle"], ["bibli", "BU Vauban (intérieur)"], ["eura", "Quartier Euratechnologies"], ["wenovin", "Wenov (intérieur)"]]){
			await step(`intérieur : ${label}`, async () => {
				const n = await evaluate(`${calm} const C = window.campus; await C.loadInterior("${id}"); C.placeIn("${id}"); ${frames(8)} return C.interiors["${id}"].scene.children.length;`, 120000);
				if(!n) throw new Error("scène vide");
				await shot("10-" + id, label);
				return `${n} objets`;
			});
		}
		await evaluate(`window.campus.placeExt("ha"); ${frames(4)}`);
		const games = await evaluate(`return Object.keys((await import("./js/data.js")).GAMES);`);
		for(const fid of games){
			await step(`mini-jeu : ${fid}`, async () => {
				await evaluate(`window.__avant = new Set(document.body.children); window.campus.openGame("${fid}");
					for(let i = 0; i < 100 && ![...document.body.children].some(e => !window.__avant.has(e) && e.getAttribute("role") === "dialog"); i++) await new Promise(r => setTimeout(r, 100));`);
				const opened = await evaluate(`return [...document.body.children].some(e => !window.__avant.has(e) && e.getAttribute("role") === "dialog");`);
				if(!opened) throw new Error("la fenêtre du jeu ne s'ouvre pas");
				await sleep(1200); await shot("20-" + fid, `Mini-jeu ${fid}`);
				const closed = await evaluate(`const g = [...document.body.children].find(e => !window.__avant.has(e) && e.getAttribute("role") === "dialog");
					const b = g.querySelector('[aria-label="Quitter le jeu"], [aria-label="Close the game"]');
					if(b) b.click(); else document.dispatchEvent(new KeyboardEvent("keydown", { key:"Escape" }));
					await new Promise(r => setTimeout(r, 400)); return !document.body.contains(g);`);
				if(!closed) throw new Error("le jeu ne se referme pas");
			});
		}
		for(const [path, label] of [["liste.html", "liste des formations"], ["relecture/", "page de relecture"]]){
			await step(`page : ${label}`, async () => { await goto(BASE + path); await evaluate(`for(let i = 0; i < 100 && document.readyState !== "complete"; i++) await new Promise(r => setTimeout(r, 100));`); await sleep(1500); await shot("30-" + path.replace(/\W+/g, ""), label); });
		}
		writeFileSync(join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><title>Vérification</title><style>body{font:14px system-ui;margin:16px;background:#f4f1ea}div{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}figure{margin:0;background:#fff;padding:8px;border-radius:8px}img{width:100%;border-radius:4px}</style>
<h1>Vérification du ${new Date().toLocaleString("fr-FR")}</h1><p>${problems.length ? problems.length + " problème(s) : voir le terminal." : "Aucun problème relevé."}</p><div>${shots.map(([n, l]) => `<figure><img src="${n}.jpg"><figcaption>${l}</figcaption></figure>`).join("")}</div>`);
		console.log(`  → captures : ${relative(ROOT, join(OUT, "index.html"))}`);
		cdp.close();
	} finally {
		chrome.kill(); server.close();
		await sleep(400); try { rmSync(profile, { recursive:true, force:true }); } catch(e){}
	}
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
// protocole de débogage de Chrome, par le WebSocket intégré à Node
function connect(url){
	return new Promise((res, rej) => {
		const ws = new WebSocket(url); let id = 0; const wait = new Map(), handlers = {};
		ws.onmessage = e => { const m = JSON.parse(e.data); if(m.id && wait.has(m.id)){ const [ok, ko] = wait.get(m.id); wait.delete(m.id); m.error ? ko(new Error(m.error.message)) : ok(m.result); } else if(m.method) (handlers[m.method] || []).forEach(h => h(m.params)); };
		ws.onerror = rej;
		ws.onopen = () => res({
			send:(method, params = {}) => new Promise((ok, ko) => { wait.set(++id, [ok, ko]); ws.send(JSON.stringify({ id, method, params })); }),
			on:(method, h) => (handlers[method] ||= []).push(h),
			close:() => ws.close()
		});
	});
}
