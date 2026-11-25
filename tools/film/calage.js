/* Calage sur la photo aérienne de l'IGN : la vue de dessus du campus 3D, la photo recalée dans les mêmes coordonnées,
   et les deux superposées, côte à côte dans une seule image. On voit d'un coup d'œil ce qui manque ou ce qui est mal placé.

   Préparer :  python3 tools/calage.py         (coins de chaque photo dans les coordonnées du jeu → tools/film/calage.json)
               python3 tools/film/recepteur.py (écrit les images reçues dans le dépôt)
   Dans la console du site ouvert avec ?debug :
     const K = await import("/tools/film/calage.js");
     await K.calage("vauban");          // → tools/film/_calage-vauban.jpg
     await K.calage("eura");            // → tools/film/_calage-eura.jpg (charge Euratechnologies)
     await K.calage("vauban", { zoom:[60, 260, -230, -30] });    // un cadre [xmin, xmax, zmin, zmax] (unités du jeu) */
export async function calage(zone = "vauban", { taille = 1400, zoom = null, recepteur = "http://127.0.0.1:8767/film?sortie=" } = {}){
	const C = window.campus; if(!C) throw new Error("Ouvrir le site avec ?debug");
	const T = C.THREE, R = C.renderer;
	const cfg = (await (await fetch("/tools/film/calage.json", { cache:"no-store" })).json())[zone];
	if(zone === "eura"){ await C.loadInterior("eura"); C.placeIn("eura"); }
	else if(C.mode !== "ext") C.exitInterior(true);
	const scene = C.mode === "ext" ? C.scene : C.interiors[C.mode].scene;
	const [A, B, Cc] = cfg.corners, D = [B[0] + Cc[0] - A[0], B[1] + Cc[1] - A[1]];
	let [x0, x1, z0, z1] = zoom || [Math.min(A[0], B[0], Cc[0], D[0]), Math.max(A[0], B[0], Cc[0], D[0]), Math.min(A[1], B[1], Cc[1], D[1]), Math.max(A[1], B[1], Cc[1], D[1])];
	const s = taille/Math.max(x1 - x0, z1 - z0), W = Math.round((x1 - x0)*s), H = Math.round((z1 - z0)*s);
	// vue de dessus orthographique : x vers la droite, z vers le bas de l'image
	const cam = new T.OrthographicCamera(x0, x1, -z0, -z1, 1, 900);
	cam.position.set(0, 600, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(true);
	const rt = new T.WebGLRenderTarget(W, H, { samples:4 });
	const fog = scene.fog; scene.fog = null;
	R.setRenderTarget(rt); R.render(scene, cam); R.setRenderTarget(null);
	scene.fog = fog;
	const px = new Uint8Array(W*H*4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); rt.dispose();
	const rendu = document.createElement("canvas"); rendu.width = W; rendu.height = H;
	const img = rendu.getContext("2d").createImageData(W, H);
	for(let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y)*W*4, (H - y)*W*4), y*W*4);          // lignes du bas vers le haut
	rendu.getContext("2d").putImageData(img, 0, 0);
	// la photo, recalée par une transformation affine (coins haut-gauche, haut-droit, bas-gauche)
	const photo = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = "/tools/film/" + cfg.photo; });
	const pw = photo.naturalWidth, ph = photo.naturalHeight;
	const tr = [(B[0] - A[0])/pw*s, (B[1] - A[1])/pw*s, (Cc[0] - A[0])/ph*s, (Cc[1] - A[1])/ph*s, (A[0] - x0)*s, (A[1] - z0)*s];
	const out = document.createElement("canvas"); out.width = W*3 + 40; out.height = H + 40; const x = out.getContext("2d");
	x.fillStyle = "#f4f1ea"; x.fillRect(0, 0, out.width, out.height);
	x.font = "600 18px Inter, Arial"; x.fillStyle = "#222";
	x.fillText("Campus 3D", 12, 26); x.fillText("Photo IGN recalée", W + 32, 26); x.fillText("Superposition", 2*W + 52, 26);
	x.drawImage(rendu, 10, 36);
	for(const [ox, a] of [[W + 30, 1], [2*W + 50, .5]]){
		x.save(); x.beginPath(); x.rect(ox, 36, W, H); x.clip();
		if(a < 1) x.drawImage(rendu, ox, 36);
		x.globalAlpha = a; x.setTransform(tr[0], tr[1], tr[2], tr[3], tr[4] + ox, tr[5] + 36); x.drawImage(photo, 0, 0); x.restore();
	}
	const blob = await new Promise(r => out.toBlob(r, "image/jpeg", .88));
	const sortie = `tools/film/_calage-${zone}${zoom ? "-zoom" : ""}.jpg`;
	return fetch(recepteur + encodeURIComponent(sortie), { method:"POST", body:blob }).then(r => r.text());
}
