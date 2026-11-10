/* Le téléphone de Camille (prototype, Master E-Business & Marketing Digital).
   Un téléphone oublié vibre sur un banc jaune du patio de Wenov : c'est celui de Camille, l'e-commerce manager de Courée.
   Prologue : le déverrouiller (l'indice est au dos). Acte 1 : dans l'appli Courée Admin, on voit le site en direct,
   les visiteurs qui abandonnent, et on corrige les pages au doigt avant le point ventes de 14 h.
   Acte 2 : dans l'appli Recherche (Trouvo, moteur inventé), on regarde les recherches en direct et on glisse
   les bons mots dans le titre et la description de Courée pour remonter dans les résultats avant 18 h. */
import { jpoCard } from "./jpo.js?v=09eacf57e3";

const ACT = 120, EVERY = .8, LOAD0 = 1.0, PRICE = 52, CODE = "2021";
const STARS = [.35, .5, .62], MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];

const NEEDS = { taille:.25, frais:.23, confiance:.16, presse:.1, decide:.08, curieux:.18 };
const COL = { decide:"#0f9b6c", taille:"#7c6cff", frais:"#f08c2e", confiance:"#e5b800", presse:"#2f8fe8", curieux:"#b9b5c6" };
const REASONS = {
	lent:["🐢", "Page trop lente à charger", "Ça charge… tant pis"], popup:["🙅", "Un pop-up cache le produit", "Ce pop-up me cache tout"],
	taille:["📏", "Ne sait pas quelle taille prendre", "M ou L ? Je ne sais pas…"], compte:["🔐", "Refuse de créer un compte", "Créer un compte ? Non merci"],
	form:["📝", "Formulaire trop long", "14 champs… j'abandonne"], frais:["💶", "Frais de livraison découverts au dernier moment", "+4,90 € de livraison ?!"],
	confiance:["❓", "Pas confiance au moment de payer", "Ce site est-il fiable ?"], curieux:["👀", "Regardait juste (normal)", "Je regardais juste"]
};
const NAMES = ["Léa", "Hugo", "Inaya", "Tom", "Chloé", "Yanis", "Manon", "Noah", "Sarah", "Lucas", "Jade", "Adam", "Emma", "Rayan", "Lina", "Théo", "Zoé", "Nathan", "Camélia", "Malo"];

// éléments des pages du site (les « bad » se retirent, les blocs s'ajoutent)
const BASE = {
	hdr0:{ n:"En-tête", h:`<div class="s-hdr"><b>Courée</b><span>☰</span></div>` },
	video:{ n:"Vidéo 4K de Marc", bad:1, w:1.9, h:`<div class="s-vid"><div>▶</div><span><b>Vidéo 4K du sweat</b><small>48 Mo · lecture automatique</small></span></div>` },
	photo:{ n:"Photo produit", h:`<div class="s-photo"><div class="sw"><i></i><span>COURÉE</span></div></div>` },
	titre:{ n:"Titre et prix", h:`<div class="s-titre"><b>Sweat Courée · brique</b><span>52 €</span></div>` },
	tailles:{ n:"Choix de la taille", h:`<div class="s-tailles"><small>Taille</small><div><i>XS</i><i>S</i><i class="on">M</i><i>L</i><i>XL</i></div></div>` },
	cta0:{ n:"Bouton « Ajouter au panier »", cta:1, h:`<div class="s-cta">Ajouter au panier</div>` },
	hdr1:{ n:"En-tête du panier", h:`<div class="s-hdr"><b>Mon panier (1)</b><span>✕</span></div>` },
	ligne:{ n:"Article", h:`<div class="s-ligne"><i></i><span><b>Sweat Courée</b><small>Brique · M</small></span><em>52 €</em></div>` },
	sous:{ n:"Sous-total", h:`<div class="s-sous"><span>Sous-total <b>52 €</b></span><small>Livraison : calculée à l'étape suivante</small></div>` },
	compte:{ n:"Création de compte obligatoire", bad:1, h:`<div class="s-compte"><b>🔐 Créez un compte pour continuer</b><i>E-mail</i><i>Mot de passe</i><i>Confirmer le mot de passe</i></div>` },
	cta1:{ n:"Bouton « Commander »", cta:1, h:`<div class="s-cta">Commander</div>` },
	hdr2:{ n:"En-tête du paiement", h:`<div class="s-hdr"><b>Paiement</b><span>🔒</span></div>` },
	form:{ n:"Formulaire de paiement", h:`<div class="s-form"><small>Adresse et carte · 14 champs</small>${"<i></i>".repeat(7)}</div>` },
	recap:{ n:"Récapitulatif et frais", h:`<div class="s-recap"><span>Sweat <b>52 €</b></span><span>Livraison <b>4,90 €</b></span><span class="t">Total <b>56,90 €</b></span></div>` },
	cta2:{ n:"Bouton « Payer »", cta:1, h:`<div class="s-cta pay">Payer 56,90 €</div>` }
};
const BLOCKS = {
	guide:{ ic:"📏", n:"Guide des tailles", w:.1, h:`<div class="s-blk g">📏<span><b>Guide des tailles</b><small>Tu fais 1,75 m ? Prends M</small></span></div>`, tip:"Répond au doute sur la taille, s'il est vu au moment où l'on choisit." },
	frais:{ ic:"🚚", n:"Livraison affichée", w:.05, h:`<div class="s-blk f">🚚<span><b>Livraison 4,90 €</b><small>offerte dès 60 € · en 48 h</small></span></div>`, tip:"Annonce les frais avant le paiement : plus de mauvaise surprise." },
	avis:{ ic:"⭐", n:"Avis clients", w:.35, h:`<div class="s-blk a">⭐<span><b>4,7/5 · 312 avis</b><small>« Taille parfaite, très doux »</small></span></div>`, tip:"La preuve sociale rassure, si on la voit avant de payer." },
	secure:{ ic:"🔒", n:"Paiement sécurisé", w:.05, h:`<div class="s-blk s">🔒<span><b>Paiement 100 % sécurisé</b><small>CB · Visa · Mastercard · retours 30 j</small></span></div>`, tip:"Rassure au moment où l'on sort sa carte : sur la page Paiement." },
	express:{ ic:"⚡", n:"Paiement express", w:.2, h:`<div class="s-blk x">⚡<span><b>Payer en un geste</b><small>Carte enregistrée, adresse remplie</small></span></div>`, tip:"Évite le long formulaire, s'il est placé au-dessus." }
};
const START = [["hdr0", "video", "photo", "titre", "tailles", "cta0"], ["hdr1", "ligne", "sous", "compte", "cta1"], ["hdr2", "form", "recap", "cta2"]];
const PAGES = [["Fiche produit", "couree.fr/sweat"], ["Panier", "couree.fr/panier"], ["Paiement", "couree.fr/paiement"]];

const CSS = `
.tp{--ink:#16141f;--ink2:#4a4759;--mut:#8b879a;--line:#e8e5f0;--soft:#f5f4f9;--vio:#5b4bff;--ok:#0f9b6c;--okb:#e2f6ed;--ko:#e5484d;--brick:#b23a24;--cream:#f8efe4;
	position:fixed;inset:0;z-index:40;overflow:hidden;font:400 14px/1.45 Inter,system-ui,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none;
	background:radial-gradient(900px 600px at 70% 20%,rgba(242,198,60,.16),transparent 60%),radial-gradient(800px 700px at 20% 90%,rgba(91,75,255,.18),transparent 60%),#121019}
.tp *{box-sizing:border-box}
.tp-x{position:absolute;right:16px;top:14px;z-index:30;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer}
.tp-side{position:absolute;left:5vw;top:50%;transform:translateY(-50%);width:min(300px,26vw);color:#e9e6f2;z-index:2}
.tp-side .k{font:700 11px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#f2c63c;margin:0 0 8px}
.tp-side h1{font:700 30px/1.08 "Space Grotesk",Inter,sans-serif;letter-spacing:-.03em;margin:0 0 12px;color:#fff}
.tp-side p{margin:0 0 10px;color:#b9b4c9;font-size:14px}
.tp-hint{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:20;background:#fff;color:var(--ink);font:600 13px Inter,sans-serif;border-radius:999px;padding:8px 16px;box-shadow:0 10px 30px rgba(0,0,0,.35);white-space:nowrap;opacity:0;transition:opacity .3s;pointer-events:none}
.tp-hint.on{opacity:1}
.tp-wrap{position:absolute;left:50%;top:50%;width:410px;height:864px;margin:-432px 0 0 -205px;perspective:1600px}
.tp-flip{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.3,.8,.3,1)}
.tp-flip.back{transform:rotateY(180deg)}
.tp-flip.buzz{animation:tpBuzz .5s linear}
.tp-front,.tp-backf{position:absolute;inset:0;border-radius:56px;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.tp-front{background:#0d0c12;padding:10px;box-shadow:0 40px 90px rgba(0,0,0,.55),inset 0 0 0 2px #2c2a36}
.tp-backf{transform:rotateY(180deg);background:linear-gradient(150deg,#2d2a3a,#16141f);box-shadow:0 40px 90px rgba(0,0,0,.55),inset 0 0 0 2px #3b384a;display:grid;place-items:center}
.tp-backf .cam{position:absolute;left:28px;top:28px;width:96px;height:96px;border-radius:28px;background:#0f0e15;box-shadow:inset 0 0 0 2px #3b384a}
.tp-backf .cam:before,.tp-backf .cam:after{content:"";position:absolute;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle,#2b3a55 30%,#0a0a10 60%);left:10px;top:10px}.tp-backf .cam:after{left:auto;right:10px;top:auto;bottom:10px}
.tp-backf .logo{position:absolute;bottom:120px;font:700 22px "DM Serif Display",serif;color:#5d5970}
.tp-postit{width:230px;padding:22px 20px;background:#ffe46b;color:#3b3110;font:500 22px/1.3 "Caveat","Comic Sans MS","Segoe Print",cursive;transform:rotate(-4deg);box-shadow:0 14px 30px rgba(0,0,0,.35);text-align:center}
.tp-postit small{display:block;font-size:17px;margin-top:8px;text-align:right}
.tp-scr{position:relative;width:390px;height:844px;border-radius:46px;overflow:hidden;background:#000;touch-action:none}
.tp-status{position:absolute;left:0;right:0;top:0;height:46px;z-index:15;display:flex;align-items:center;justify-content:space-between;padding:6px 30px 0 34px;font:600 15px Inter,sans-serif;color:#fff;pointer-events:none;transition:color .3s}
.tp-status.dark{color:var(--ink)}
.tp-status .r{display:flex;gap:6px;align-items:center;font-size:12px}.tp-status .bat{display:inline-flex;align-items:center;gap:3px}.tp-status .bat i{display:inline-block;width:24px;height:12px;border:1.5px solid currentColor;border-radius:4px;padding:1px}.tp-status .bat i b{display:block;height:100%;background:currentColor;border-radius:2px}
.tp-status .bat.low i b{background:#ff5a5f}
.tp-island{position:absolute;left:50%;top:11px;width:118px;height:33px;margin-left:-59px;border-radius:20px;background:#000;z-index:16}
.tp-homebar{position:absolute;left:50%;bottom:8px;width:140px;height:5px;margin-left:-70px;border-radius:5px;background:rgba(255,255,255,.75);z-index:16;cursor:pointer}
.tp-homebar:before{content:"";position:absolute;left:-30px;right:-30px;top:-14px;bottom:-8px}
.tp-homebar.dark{background:rgba(20,18,30,.55)}
.tp-view{position:absolute;inset:0;overflow:hidden;transition:transform .35s cubic-bezier(.3,.8,.3,1),opacity .3s}
.tp-view.off{opacity:0;pointer-events:none;transform:scale(.94)}
/* écran verrouillé */
.tp-lock{background:radial-gradient(circle at 30% 20%,#e9805f,transparent 55%),radial-gradient(circle at 80% 70%,#5b4bff,transparent 55%),linear-gradient(160deg,#b23a24,#3b1e2c 70%);color:#fff;overflow:hidden}
.tp-lock .wp{position:absolute;left:50%;top:548px;transform:translateX(-50%);width:220px;height:200px;opacity:.9}
.tp-lock .wp:before{content:"";position:absolute;left:36px;right:36px;top:16px;bottom:0;background:#f3e6d7;border-radius:30px 30px 14px 14px}
.tp-lock .wp i{position:absolute;left:0;right:0;top:22px;height:84px;background:#f3e6d7;border-radius:28px}
.tp-lock .wp span{position:absolute;left:0;right:0;top:80px;text-align:center;font:700 19px "Space Grotesk",sans-serif;letter-spacing:.28em;color:var(--brick)}
.tp-lock .wp em{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);font:600 9.5px Inter,sans-serif;letter-spacing:.18em;font-style:normal;color:#8c3a2a;background:#fff8ef;border:1px solid #e7cdb6;padding:3px 8px;white-space:nowrap}
.tp-lock .date{position:absolute;left:0;right:0;top:78px;text-align:center;font:600 18px Inter,sans-serif;text-transform:capitalize}
.tp-lock .clock{position:absolute;left:0;right:0;top:100px;text-align:center;font:600 92px/1 "Space Grotesk",Inter,sans-serif;letter-spacing:-.04em}
.tp-notifs{position:absolute;left:12px;right:12px;top:232px;display:flex;flex-direction:column;gap:8px}
.tp-nt{display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-radius:20px;padding:10px 12px;font-size:13.5px;line-height:1.35;animation:tpDrop .45s cubic-bezier(.2,.9,.3,1.2) both}
.tp-nt .ic{width:34px;height:34px;flex:none;border-radius:9px;display:grid;place-items:center;font-size:18px;background:#fff}
.tp-nt b{display:flex;justify-content:space-between;font-size:13.5px}.tp-nt b small{font-weight:500;opacity:.75;font-size:12px}
.tp-lock .swipe{position:absolute;left:0;right:0;bottom:26px;text-align:center;font:500 14px Inter,sans-serif;opacity:.9;animation:tpBob 1.8s ease-in-out infinite}
.tp-pad{position:absolute;inset:0;background:rgba(22,14,30,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);display:flex;flex-direction:column;align-items:center;padding-top:140px;transform:translateY(100%);transition:transform .45s cubic-bezier(.3,.8,.3,1)}
.tp-pad.on{transform:none}
.tp-pad h3{margin:0 0 18px;font:600 18px Inter,sans-serif;color:#fff}
.tp-pad .dots{display:flex;gap:16px;margin-bottom:46px}.tp-pad .dots i{width:14px;height:14px;border-radius:50%;border:1.5px solid #fff}.tp-pad .dots i.f{background:#fff}
.tp-pad .dots.err{animation:tpShake .45s}
.tp-pad .keys{display:grid;grid-template-columns:repeat(3,80px);gap:16px 26px}
.tp-pad .keys button{width:80px;height:80px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font:400 32px Inter,sans-serif;cursor:pointer}
.tp-pad .keys button:active{background:rgba(255,255,255,.45)}
.tp-pad .keys button.e{background:none;font-size:16px}
.tp-pad .hintc{margin-top:26px;color:#ffd9a0;font:500 13.5px Inter,sans-serif;text-align:center;padding:0 40px;min-height:40px}
/* accueil */
.tp-home{background:radial-gradient(circle at 20% 10%,#ff9c6e,transparent 50%),radial-gradient(circle at 90% 60%,#7466ff,transparent 55%),linear-gradient(170deg,#c2492f,#2b1f3d);color:#fff}
.tp-apps{position:absolute;left:22px;right:22px;top:82px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px 10px}
.tp-app{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;position:relative;font:500 11.5px Inter,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.35)}
.tp-app i{width:62px;height:62px;border-radius:16px;display:grid;place-items:center;font-size:30px;font-style:normal;box-shadow:0 6px 14px rgba(0,0,0,.25)}
.tp-app.lock i{filter:saturate(.3) brightness(.8)}
.tp-app.lock:after{content:"🔒";position:absolute;right:4px;top:44px;font-size:13px}
.tp-app s{position:absolute;right:2px;top:-6px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#ff3b30;color:#fff;font:700 12px/22px Inter,sans-serif;text-decoration:none;text-align:center;display:none}
.tp-app s.on{display:block}
.tp-app.pulse i{animation:tpPulse 1.1s ease-in-out infinite}
.tp-dock{position:absolute;left:14px;right:14px;bottom:24px;height:92px;border-radius:30px;background:rgba(255,255,255,.2);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:grid;grid-template-columns:repeat(4,1fr);align-items:center;padding:0 12px}
.tp-dock .tp-app span{display:none}
/* applis génériques */
.tp-appv{background:#fff;color:var(--ink);display:flex;flex-direction:column}
.tp-ah{padding:54px 18px 10px;border-bottom:1px solid var(--line);background:#fbfbfd}
.tp-ah .back{font:500 15px Inter,sans-serif;color:var(--vio);cursor:pointer;display:inline-block;margin-bottom:4px}
.tp-ah h2{margin:0;font:700 26px "Space Grotesk",Inter,sans-serif;letter-spacing:-.02em}
.tp-ab{flex:1;overflow:auto;padding:10px 16px 40px}
.tp-conv{display:flex;gap:12px;align-items:center;padding:12px 4px;border-bottom:1px solid var(--soft);cursor:pointer}
.tp-conv .av{width:46px;height:46px;border-radius:50%;flex:none;display:grid;place-items:center;font:700 16px "Space Grotesk",sans-serif;color:#fff}
.tp-conv b{display:flex;justify-content:space-between;font-size:15px}.tp-conv b small{font-weight:400;color:var(--mut);font-size:12px}
.tp-conv p{margin:0;color:var(--mut);font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:270px}
.tp-conv.unread p{color:var(--ink);font-weight:600}
.tp-th{display:flex;flex-direction:column;gap:6px;padding-top:6px}
.tp-bub{max-width:80%;padding:8px 12px;border-radius:18px;font-size:14.5px;line-height:1.4;background:#ececf2;align-self:flex-start;animation:tpUp .3s ease both}
.tp-bub.me{background:var(--vio);color:#fff;align-self:flex-end}
.tp-bub.typing{color:var(--mut)}
.tp-th small.t{align-self:center;color:var(--mut);font-size:11.5px;margin:6px 0}
.tp-chips{display:flex;flex-direction:column;gap:6px;padding:10px 14px 30px;border-top:1px solid var(--line);background:#fbfbfd}
.tp-chips button{border:1.5px solid var(--vio);background:#fff;color:var(--vio);border-radius:18px;padding:9px 14px;font:600 14px Inter,sans-serif;text-align:left;cursor:pointer}
.tp-note{background:#fffbe8;border-radius:14px;padding:12px 14px;margin:8px 0;font-size:14.5px;line-height:1.5;border:1px solid #f1e6b6}
.tp-note h4{margin:0 0 6px;font:700 16px Inter,sans-serif}
.tp-ag{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--soft)}.tp-ag b{width:52px;flex:none;font:600 14px Inter,sans-serif}.tp-ag span{flex:1;border-left:4px solid var(--vio);padding-left:10px}.tp-ag span.w{border-color:var(--ko)}.tp-ag small{display:block;color:var(--mut)}
/* bannières */
.tp-banners{position:absolute;left:8px;right:8px;top:52px;z-index:14;pointer-events:none}
.tp-ban{display:flex;gap:10px;align-items:flex-start;background:rgba(250,250,252,.96);color:var(--ink);border-radius:20px;padding:10px 12px;box-shadow:0 12px 30px rgba(0,0,0,.25);font-size:13.5px;line-height:1.35;pointer-events:auto;cursor:pointer;animation:tpDrop .4s cubic-bezier(.2,.9,.3,1.2) both}
.tp-ban.out{animation:tpLift .3s ease forwards}
.tp-ban .ic{width:34px;height:34px;flex:none;border-radius:9px;display:grid;place-items:center;font-size:18px}
.tp-ban b{display:flex;justify-content:space-between;font-size:13.5px}.tp-ban b small{font-weight:500;color:var(--mut);font-size:11.5px}
/* Courée Admin */
.tp-adm{background:#f4f3f8;color:var(--ink)}
.tp-admh{position:absolute;left:0;right:0;top:0;height:172px;padding:48px 12px 0;background:#fff;border-bottom:1px solid var(--line);z-index:3}
.tp-admh .t{display:flex;align-items:center;gap:8px;height:30px}
.tp-admh .t b{flex:1;font:700 18px "Space Grotesk",sans-serif;letter-spacing:-.01em}.tp-admh .live{font:700 10.5px Inter,sans-serif;color:var(--ko);display:flex;align-items:center;gap:5px;background:#fdeced;border-radius:999px;padding:3px 9px}.tp-admh .live:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ko);animation:tpPulse2 1s infinite}
.tp-admh .back{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--soft);font:600 20px/1 Inter,sans-serif;color:var(--vio);cursor:pointer}
.tp-stat{display:flex;align-items:center;gap:10px;margin-top:6px;height:42px}
.tp-stat .cv b{font:700 30px/1 "Space Grotesk",sans-serif;letter-spacing:-.02em}.tp-stat .cv b.up{color:var(--ok)}
.tp-stat .cv small{display:block;font:600 11px Inter,sans-serif;color:var(--mut);margin-top:2px}.tp-stat .cv small.up{color:var(--ok)}
.tp-stat .tm{margin-left:auto;text-align:right;font:600 11px Inter,sans-serif;color:var(--mut)}.tp-stat .tm b{display:block;font:700 17px "Space Grotesk",sans-serif;color:var(--ink)}
.tp-stat .tm.urgent b{color:var(--ko)}
.tp-stat .tm{cursor:pointer;border-radius:10px;padding:2px 6px;margin-right:-6px}.tp-stat .tm:hover{background:var(--soft)}
.tp-stat .tm.ff b:after{content:" ⏩";color:var(--vio);animation:tpPulse2 .8s infinite}
.tp-tbar{height:3px;border-radius:3px;background:#ece9f4;margin-top:6px;overflow:hidden}.tp-tbar i{display:block;height:100%;width:0;background:var(--vio);transition:width .5s}.tp-tbar.urgent i{background:var(--ko)}
.tp-fun{display:flex;gap:4px;margin-top:8px;background:var(--soft);border-radius:12px;padding:3px}
.tp-fun button{flex:1;border:0;background:none;border-radius:9px;padding:6px 4px;font:600 12.5px Inter,sans-serif;color:var(--ink2);cursor:pointer;position:relative}
.tp-fun button.on{background:#fff;color:var(--ink);box-shadow:0 1px 4px rgba(40,30,90,.15)}
.tp-fun button.hot:after{content:"";position:absolute;right:8px;top:50%;margin-top:-4px;width:8px;height:8px;border-radius:50%;background:var(--ko);animation:tpPulse2 1s infinite}
.tp-dot{background:#8f84ff!important}
.tp-el .cnt,.tp-pop .cnt{display:none!important}
.tp-vp{position:absolute;left:0;right:0;top:172px;bottom:98px;overflow:hidden}
.tp-track{display:flex;height:100%;transition:transform .35s cubic-bezier(.3,.8,.3,1)}
.tp-pg{flex:none;width:390px;height:100%;padding:8px 12px 0;position:relative}
.tp-site{position:relative;height:100%;background:#fff;border-radius:16px 16px 0 0;box-shadow:0 -2px 14px rgba(40,30,90,.08);overflow:hidden}
.tp-url{position:absolute;right:0;top:0;z-index:5;font-size:0;height:0}
.tp-load{position:absolute;right:8px;top:8px;white-space:nowrap;font:700 10px Inter,sans-serif;color:var(--ok);background:var(--okb);border-radius:999px;padding:1px 7px}
.tp-load.slow{color:#fff;background:var(--ko);animation:tpPulse2 1s infinite}
.tp-inner{position:absolute;left:0;top:0;width:366px;transform-origin:0 0}
.tp-flow{display:flex;flex-direction:column;gap:8px;padding:8px 12px 12px}
.tp-el{position:relative;border-radius:11px}
.tp-el[data-mv]{cursor:grab}
.tp-el.wig,.tp-pop.wig{animation:tpWig 1.8s ease-in-out infinite}.tp-el.mine{outline:1.5px dashed rgba(91,75,255,.5);outline-offset:2px}
.tp-el .heat{position:absolute;inset:-5px;border-radius:13px;pointer-events:none;background:radial-gradient(closest-side,rgba(229,72,77,.6),rgba(229,72,77,.15) 70%,transparent);opacity:0;transition:opacity .4s}
.tp-el .cnt{position:absolute;right:-4px;top:-8px;background:var(--ko);color:#fff;font:700 10px Inter,sans-serif;border-radius:999px;padding:0 6px;line-height:16px;display:none;z-index:2}
.tp-el.dep{opacity:.55}.tp-el.dep:after{content:"Mise en ligne…";position:absolute;inset:0;display:grid;place-items:center;font:700 11px Inter,sans-serif;color:var(--vio);background:repeating-linear-gradient(45deg,rgba(91,75,255,.08) 0 8px,rgba(91,75,255,.16) 8px 16px);border-radius:11px}
.tp-el.new{animation:tpIn .45s cubic-bezier(.2,.9,.3,1.3)}
.tp-el.lift,.tp-pop.lift{opacity:.2}
.tp-el.flash{animation:tpFlash 1.2s ease 2}
.s-hdr{display:flex;justify-content:space-between;align-items:center;font-size:13px}.s-hdr b{font:700 16px "DM Serif Display",serif}.s-hdr span{color:var(--mut)}
.s-vid{border-radius:11px;overflow:hidden;background:#1b1925;color:#fff}.s-vid div{height:64px;display:grid;place-items:center;font-size:28px;background:linear-gradient(135deg,#3b2a55,#b23a24)}.s-vid span{display:block;padding:4px 10px;font-size:11.5px}.s-vid b{display:block;font-size:12px}.s-vid small{color:#bdb8d0}
.s-photo{height:116px;border-radius:12px;background:linear-gradient(160deg,#f6ede3,#ead9c8);display:grid;place-items:center}
.s-photo .sw{position:relative;width:118px;height:110px;transform:scale(.8)}
.s-photo .sw:before{content:"";position:absolute;left:20px;right:20px;top:8px;bottom:0;background:var(--brick);border-radius:18px 18px 8px 8px}
.s-photo .sw i{position:absolute;left:0;right:0;top:12px;height:48px;background:var(--brick);border-radius:16px}
.s-photo .sw span{position:absolute;left:0;right:0;top:50px;text-align:center;font:700 11px "Space Grotesk",sans-serif;letter-spacing:.2em;color:#f8e9dc}
.s-titre{display:flex;justify-content:space-between;align-items:baseline;font-size:14px}.s-titre span{font:700 18px "Space Grotesk",sans-serif}
.s-tailles small{font-size:11.5px;color:var(--mut)}.s-tailles div{display:flex;gap:6px;margin-top:3px}.s-tailles i{flex:1;text-align:center;font:600 12px Inter,sans-serif;font-style:normal;border:1px solid var(--line);border-radius:8px;padding:6px 0}.s-tailles i.on{border-color:var(--ink);background:var(--ink);color:#fff}
.s-cta{background:var(--ink);color:#fff;text-align:center;font:600 14px Inter,sans-serif;border-radius:12px;padding:12px}.s-cta.pay{background:var(--ok)}
.s-ligne{display:flex;gap:10px;align-items:center;font-size:13px}.s-ligne i{width:50px;height:50px;border-radius:10px;background:linear-gradient(160deg,#c9533b,#9a2f1d)}.s-ligne span{flex:1}.s-ligne b{display:block}.s-ligne small{color:var(--mut)}.s-ligne em{font-style:normal;font-weight:700}
.s-sous{font-size:13.5px;border-top:1px solid var(--line);padding-top:8px}.s-sous span{display:flex;justify-content:space-between}.s-sous small{display:block;color:var(--mut);font-size:11.5px}
.s-compte{border:1px solid #f3c9cb;background:#fff7f7;border-radius:11px;padding:8px 10px;font-size:12px}.s-compte b{display:block;margin-bottom:4px;font-size:13px}.s-compte i{display:block;font-style:normal;color:var(--mut);border:1px solid var(--line);background:#fff;border-radius:7px;padding:4px 8px;margin-top:4px;font-size:11.5px}
.s-form small{display:block;font-size:11.5px;color:var(--mut);margin-bottom:3px}.s-form i{display:block;height:20px;border:1px solid var(--line);border-radius:6px;margin-top:5px;background:repeating-linear-gradient(90deg,#fff 0 48%,#f1eff6 48% 52%,#fff 52%)}
.s-recap{font-size:13px;background:var(--soft);border-radius:11px;padding:8px 10px}.s-recap span{display:flex;justify-content:space-between}.s-recap .t{border-top:1px solid var(--line);margin-top:4px;padding-top:4px;font-weight:600}
.s-blk{display:flex;gap:10px;align-items:center;font-size:20px;border-radius:11px;padding:8px 11px;border:1px solid var(--line)}.s-blk span{font-size:12px;line-height:1.3}.s-blk b{display:block;font-size:13px}.s-blk small{color:var(--ink2)}
.s-blk.g{background:#f0eeff;border-color:#dcd7ff}.s-blk.f{background:#fff4e8;border-color:#fbdcb9}.s-blk.a{background:#fffbe6;border-color:#f6e7a3}.s-blk.s{background:#e9f8f1;border-color:#bfe9d4}.s-blk.x{background:#e8f3fd;border-color:#bcdcf7}
.tp-pop{position:absolute;left:24px;right:24px;top:150px;z-index:3;background:#fff;border-radius:16px;padding:14px;box-shadow:0 0 0 999px rgba(20,18,30,.38),0 14px 40px rgba(0,0,0,.35);text-align:center;font-size:13px;cursor:grab}
.tp-pop b{display:block;font:700 22px "Space Grotesk",sans-serif;color:var(--brick)}.tp-pop i{display:block;font-style:normal;border:1px solid var(--line);border-radius:8px;padding:6px;margin:8px 0;color:var(--mut)}.tp-pop em{display:block;font-style:normal;background:var(--brick);color:#fff;border-radius:9px;padding:7px;font-weight:600}.tp-pop u{position:absolute;right:4px;top:3px;width:28px;height:28px;display:grid;place-items:center;text-decoration:none;color:var(--mut);font-size:14px;cursor:pointer;border-radius:50%}.tp-pop u:hover{background:var(--soft)}
.tp-pop .cnt{position:absolute;right:-4px;top:-8px;background:var(--ko);color:#fff;font:700 10px Inter,sans-serif;border-radius:999px;padding:0 6px;line-height:16px;display:none}
.tp-dots{position:absolute;inset:0;pointer-events:none;z-index:4}
.tp-dot{position:absolute;left:0;top:0;width:19px;height:19px;margin:-9.5px 0 0 -9.5px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:background .2s,opacity .5s}
.tp-dot.ko{background:var(--ko)!important}.tp-dot.buy{background:var(--ok)!important}.tp-dot.gone{opacity:0}
.tp-say{position:absolute;left:0;top:0;transform:translate(-50%,-135%);white-space:nowrap;font:600 11px Inter,sans-serif;background:var(--ko);color:#fff;border-radius:9px;padding:3px 8px;pointer-events:none;z-index:5;animation:tpSay 1.8s ease forwards}
.tp-say.ok{background:var(--ok)}.tp-say.grey{background:#8b879a}
.tp-ins{position:absolute;left:10px;right:10px;height:5px;border-radius:5px;background:var(--vio);box-shadow:0 0 0 4px rgba(91,75,255,.2);z-index:5;display:none;pointer-events:none}
.tp-drawer{position:absolute;left:0;right:0;bottom:0;height:98px;z-index:6;transition:transform .45s cubic-bezier(.3,1.3,.5,1);background:#fff;border-top:1px solid var(--line);box-shadow:0 -10px 30px rgba(40,30,90,.08);padding:7px 8px 0}
.tp-drawer .cap{margin:0 0 5px;text-align:center;font:600 10.5px Inter,sans-serif;color:var(--mut);letter-spacing:.04em}
.tp-drawer .tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.tp-tile{background:var(--soft);border:1.5px solid var(--line);border-radius:14px;padding:5px 3px 4px;cursor:grab;touch-action:none;display:flex;flex-direction:column;align-items:center;gap:1px;text-align:center;transition:transform .15s,opacity .2s}
.tp-tile:hover{transform:translateY(-2px);border-color:#cfc9f5}
.tp-tile i{font-style:normal;font-size:20px;line-height:1.1}.tp-tile b{font:600 10px/1.15 Inter,sans-serif}
.tp-tile.used{opacity:.3;pointer-events:none}
.tp-drawer.trash .tiles,.tp-drawer.trash .cap{visibility:hidden}
.tp-drawer.trash{background:#fdeced;border-top:2px dashed var(--ko)}
.tp-drawer.trash:after{content:"🗑  Lâche ici pour retirer de la page";position:absolute;inset:0 0 18px;display:grid;place-items:center;font:700 14px Inter,sans-serif;color:var(--ko)}
.tp-drawer.trash.over{background:#f9c9cb}
.tp-pop.hot,.tp-el.hot{box-shadow:0 0 0 3px rgba(229,72,77,.85),0 0 34px rgba(229,72,77,.5);border-radius:12px}
.tp-win{position:absolute;left:0;right:0;top:250px;z-index:9;display:grid;place-items:center;pointer-events:none}
.tp-win div{background:var(--ink);color:#fff;border-radius:28px;padding:18px 30px 16px;text-align:center;box-shadow:0 24px 60px rgba(20,10,60,.45);animation:tpWin 2.4s cubic-bezier(.2,1.4,.4,1) both}
.tp-win b{display:block;font:700 64px/1 "Space Grotesk",sans-serif;letter-spacing:-.04em;color:#5ff0b4}
.tp-win i{display:block;font-style:normal;font-size:24px;color:#f5b301;letter-spacing:4px;margin:6px 0 2px}
.tp-win small{font:600 13px Inter,sans-serif;color:#d8d4ea}
@keyframes tpWin{0%{opacity:0;transform:scale(.4)}14%{opacity:1;transform:scale(1.06)}22%{transform:scale(1)}82%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.9) translateY(-20px)}}
.tp-stat .cv b.boom{animation:tpBoom .9s ease}
@keyframes tpBoom{30%{transform:scale(1.35);color:var(--ok)}}
.tp-adm:not(.blocks) .tp-drawer:not(.trash){transform:translateY(105%)}
.tp-adm:not(.blocks) .tp-vp{bottom:0}
.tp-drawer.trash{transition:none}
.tp-drawer.arrive .tp-tile{animation:tpDrop .5s ease both}.tp-drawer.arrive .tp-tile:nth-child(2){animation-delay:.08s}.tp-drawer.arrive .tp-tile:nth-child(3){animation-delay:.16s}.tp-drawer.arrive .tp-tile:nth-child(4){animation-delay:.24s}.tp-drawer.arrive .tp-tile:nth-child(5){animation-delay:.32s}
.tp-ghost{position:absolute;left:0;top:0;z-index:12;width:300px;pointer-events:none;transform:translate(-50%,-60%) rotate(-3deg);filter:drop-shadow(0 14px 22px rgba(40,30,90,.35));opacity:.95}
.tp-ghost .tp-pop{position:static;box-shadow:none}
.tp-card{position:absolute;left:20px;right:20px;z-index:13;background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px 14px;box-shadow:0 18px 40px rgba(40,30,90,.25);font-size:13.5px;animation:tpUp .25s ease both}
.tp-card b{display:block;font:700 15px "Space Grotesk",sans-serif;margin-bottom:4px}.tp-card p{margin:0 0 4px;color:var(--ink2)}.tp-card ul{margin:6px 0 0;padding:0}.tp-card li{list-style:none;display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-top:1px solid var(--soft)}.tp-card em{font-style:normal;font-weight:700;color:var(--ko)}
.tp-coach{position:absolute;inset:0;z-index:12;background:rgba(18,16,26,.6);display:flex;align-items:flex-end}
.tp-coach div{width:100%;background:#fff;border-radius:26px 26px 0 0;padding:22px 20px 34px;animation:tpUp .35s ease both}
.tp-coach h3{margin:0 0 6px;font:700 22px "Space Grotesk",sans-serif;letter-spacing:-.02em}
.tp-coach p{margin:0 0 10px;color:var(--ink2);font-size:14.5px}
.tp-coach li{list-style:none;display:flex;gap:10px;padding:6px 0;font-size:14px;color:var(--ink2)}.tp-coach ul{padding:0;margin:0 0 6px}
.tp-btn{display:flex;align-items:center;justify-content:center;width:100%;border:0;border-radius:14px;padding:14px 16px;margin-top:10px;background:var(--vio);color:#fff;font:600 15.5px Inter,sans-serif;cursor:pointer;text-decoration:none}
.tp-alt{display:flex;align-items:center;justify-content:center;width:100%;border:1px solid var(--line);border-radius:14px;padding:12px 16px;margin-top:8px;background:#fff;color:var(--ink);font:600 14.5px Inter,sans-serif;cursor:pointer;text-decoration:none}
.tp-alt[disabled]{opacity:.45;cursor:default}
/* appel */
.tp-call{background:linear-gradient(170deg,#3a2b55,#120f1c);color:#fff;text-align:center}
.tp-call .who{margin-top:150px;font:600 34px "Space Grotesk",sans-serif}.tp-call .sub{opacity:.75;margin-top:4px}
.tp-call .av{width:120px;height:120px;border-radius:50%;margin:40px auto 0;display:grid;place-items:center;font:700 46px "Space Grotesk",sans-serif;background:linear-gradient(135deg,#ff7a59,#5b4bff);animation:tpRing 1.4s ease-in-out infinite}
.tp-slide{position:absolute;left:30px;right:30px;bottom:90px;height:76px;border-radius:40px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font:500 16px Inter,sans-serif;color:rgba(255,255,255,.8)}
.tp-knob{position:absolute;left:6px;top:6px;width:64px;height:64px;border-radius:50%;background:#2fcf6a;display:grid;place-items:center;font-size:28px;cursor:grab;touch-action:none}
.tp-lines{position:absolute;left:24px;right:24px;top:300px;display:flex;flex-direction:column;gap:10px;text-align:left}
.tp-lines p{margin:0;background:rgba(255,255,255,.12);border-radius:16px;padding:10px 14px;font-size:15px;line-height:1.45;animation:tpUp .4s ease both}
.tp-lines p.next{background:none;text-align:center;color:#d9d4ff;font-weight:600;cursor:pointer;animation:tpBob 1.6s ease-in-out infinite}
/* fin */
.tp-end{background:#fff;color:var(--ink);overflow:auto}
.tp-end .in{padding:58px 20px 40px}
.tp-end .k{font:700 11px Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--vio);margin:0 0 6px}
.tp-end h2{margin:0 0 8px;font:700 26px/1.1 "Space Grotesk",sans-serif;letter-spacing:-.03em}
.tp-end .stars{font-size:26px;color:#f5b301;letter-spacing:3px}
.tp-cmp{display:flex;gap:8px;margin:10px 0}.tp-cmp div{flex:1;border-radius:14px;padding:8px 10px;background:var(--soft)}.tp-cmp div.ok{background:var(--okb)}.tp-cmp small{display:block;font-size:11px;color:var(--mut)}.tp-cmp b{font:700 22px "Space Grotesk",sans-serif}
.tp-end ul{margin:4px 0 12px;padding:0}.tp-end li{list-style:none;display:flex;gap:10px;padding:6px 0;border-top:1px solid var(--soft);font-size:13.5px;color:var(--ink2)}.tp-end li i{font-style:normal;width:22px;flex:none;text-align:center}
.tp-end h4{margin:12px 0 2px;font:700 14px Inter,sans-serif}
.tp-chart{width:100%;height:100px;display:block;margin:4px 0 6px}
.tp-big{display:flex;align-items:baseline;gap:12px;margin:14px 0 0;font-family:"Space Grotesk",sans-serif}.tp-big span{font-size:28px;font-weight:700;color:var(--mut)}.tp-big i{font-style:normal;font-size:22px;color:var(--mut)}.tp-big b{font-size:54px;line-height:1;letter-spacing:-.04em;color:var(--ok)}
.tp-sub{margin:2px 0 6px;font-size:13px;color:var(--mut)}
.tp-more{border-top:1px solid var(--soft);padding:10px 0;font-size:13.5px;color:var(--ink2)}.tp-more summary{cursor:pointer;font:600 14px Inter,sans-serif;color:var(--ink)}.tp-more p{margin:8px 0 0}
.tp-course{background:var(--soft);border-radius:12px;padding:9px 12px;margin-top:6px;font-size:13px;color:var(--ink2)}.tp-course b{display:block;color:var(--ink)}
@keyframes tpWig{0%,70%,100%{transform:none}76%{transform:rotate(-1deg)}84%{transform:rotate(1deg)}92%{transform:rotate(-.5deg)}}
@keyframes tpBuzz{0%,100%{transform:none}10%,50%,90%{transform:translateX(-4px) rotate(-.6deg)}30%,70%{transform:translateX(4px) rotate(.6deg)}}
@keyframes tpDrop{from{opacity:0;transform:translateY(-16px) scale(.96)}}
@keyframes tpLift{to{opacity:0;transform:translateY(-20px)}}
@keyframes tpUp{from{opacity:0;transform:translateY(12px)}}
@keyframes tpIn{from{opacity:0;transform:scale(.6)}}
@keyframes tpBob{50%{transform:translateY(-6px)}}
@keyframes tpShake{20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}
@keyframes tpPulse{50%{transform:scale(1.1)}}
@keyframes tpPulse2{50%{opacity:.4}}
@keyframes tpRing{50%{box-shadow:0 0 0 22px rgba(255,255,255,.08)}}
@keyframes tpFlash{50%{box-shadow:0 0 0 4px var(--ko)}}
@keyframes tpSay{0%{opacity:0;transform:translate(-50%,-95%)}12%{opacity:1;transform:translate(-50%,-135%)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-175%)}}
/* Acte 2 : Trouvo */
.tp-srch{background:#f4f3f8;color:var(--ink)}
.tp-srch .tp-admh{height:194px}
.tp-sbar{margin-top:9px;height:40px;border-radius:20px;background:#fff;border:1.5px solid var(--line);box-shadow:0 2px 8px rgba(40,30,90,.06);display:flex;align-items:center;gap:8px;padding:0 14px;font:500 15px Inter,sans-serif}
.tp-sbar .q span{transition:color .3s}.tp-sbar .q span.miss{color:var(--ko);text-decoration:underline wavy var(--ko);text-underline-offset:4px}
.tp-sbar .cur{width:2px;height:18px;background:var(--vio);animation:tpPulse2 1s infinite;margin-left:-6px}
.tp-res{position:absolute;left:0;right:0;top:194px;bottom:0;overflow:hidden}
.tp-srch.blocks .tp-res{bottom:118px}
.tp-r{position:absolute;left:10px;right:10px;top:0;background:#fff;border-radius:14px;padding:7px 12px 8px;box-shadow:0 1px 4px rgba(40,30,90,.07);transition:transform .55s cubic-bezier(.3,.9,.3,1),opacity .3s;opacity:0}
.tp-r .u{font:500 11px Inter,sans-serif;color:var(--mut)}.tp-r .h{font:600 14.5px/1.3 Inter,sans-serif;color:#2b44c9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tp-r .d{font-size:12px;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tp-r.me{border:2px solid var(--vio);box-shadow:0 8px 22px rgba(91,75,255,.18);z-index:2}.tp-r.me.top{border-color:var(--ok)}
.tp-r.me .lbl{display:flex;justify-content:space-between;font:500 11px Inter,sans-serif;color:var(--mut)}.tp-r.me .lbl b{color:var(--vio)}.tp-r.me.top .lbl b{color:var(--ok)}
.tp-r.me [data-s="cnt"].over{color:var(--ko);font-weight:700}
.tp-r.me .zt,.tp-r.me .zd{display:flex;flex-wrap:wrap;gap:4px;min-height:32px;padding:3px;margin:2px -3px 0;border-radius:9px;border:1.5px dashed #d9d5ee;align-items:center}
.tp-r.me .zt{font:600 14.5px Inter,sans-serif;color:#2b44c9}.tp-r.me .zd{font-size:12.5px;color:var(--ink2)}
.tp-r.me .zt.over,.tp-r.me .zd.over{border-color:var(--vio);background:#efedff}
.tp-r.me em{font-style:normal;color:var(--mut)}.tp-r.me em.ph{font-size:12px}
.tp-w{display:inline-flex;align-items:center;padding:4px 9px;border-radius:9px;background:#eef0fb;cursor:grab;touch-action:none;white-space:nowrap;font:600 12.5px Inter,sans-serif;color:var(--ink);transition:opacity .2s,background .3s}
.tp-r.me .zt .tp-w{font-size:14px;color:#2b44c9}
.tp-w.bad{background:#fdeced;color:var(--ko)!important}.tp-w.promo{background:#fff0d6}
.tp-w.cut{opacity:.35;text-decoration:line-through}
.tp-w.m{background:#fff1b8}
.tp-wbar .tp-w.used{opacity:.25;pointer-events:none}
.tp-wbar .tp-w.hot{box-shadow:0 0 0 2px var(--ko);animation:tpWig 1.4s ease-in-out infinite}
.tp-pg2{position:absolute;left:10px;right:10px;top:0;text-align:center;font:600 11px Inter,sans-serif;color:var(--mut);border-top:1.5px dashed #cfcbe0;padding-top:4px;transition:transform .55s cubic-bezier(.3,.9,.3,1)}
.tp-sdot{position:absolute;left:0;top:0;width:16px;height:16px;margin:-8px;border-radius:50%;background:#8f84ff;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);z-index:4;transition:transform .7s cubic-bezier(.4,0,.4,1),opacity .4s,background .3s;pointer-events:none}
.tp-sdot.ok{background:var(--ok)}
.tp-wbar{height:118px}
.tp-wbar .tiles{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.tp-srch:not(.blocks) .tp-wbar:not(.trash){transform:translateY(105%)}
.tp-wbar.arrive .tp-w{animation:tpDrop .5s ease both}
.tp-ghost2{position:absolute;left:0;top:0;z-index:12;pointer-events:none;transform:translate(-50%,-80%) rotate(-3deg);background:#fff;border:2px solid var(--vio);border-radius:10px;padding:5px 11px;font:600 14px Inter,sans-serif;color:#2b44c9;box-shadow:0 12px 26px rgba(40,30,90,.3)}
.tp-ghost2.bad{border-color:var(--ko);color:var(--ko)}
@media (max-width:900px){.tp-side{display:none}}
@media (min-width:901px){.tp-hint{display:none}}
.tp-side .cur{margin-top:18px;background:#fff;color:var(--ink);font:600 15px/1.4 Inter,sans-serif;border-radius:16px;padding:12px 16px;box-shadow:0 12px 34px rgba(0,0,0,.35);opacity:0;transform:translateX(-8px);transition:opacity .3s,transform .3s}.tp-side .cur.on{opacity:1;transform:none}
@media (max-width:560px){.tp{background:#000}.tp-x{right:8px;top:46px;width:28px;height:28px;font-size:15px;background:rgba(0,0,0,.35)}.tp-admh .t:first-child{padding-right:34px}.tp-hint{bottom:100px;font-size:12px;max-width:88vw;white-space:normal;text-align:center}}
`;

const rnd = (a, b) => a + Math.random()*(b - a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const pct = x => Math.round(x*100) + " %";
const fmtS = s => s.toFixed(1).replace(".", ",") + " s";
const hm = m => `${Math.floor(m/60)}:${String(Math.floor(m%60)).padStart(2, "0")}`;

export function openTelephone({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead } = {}){
	if(!document.getElementById("eb-font")){ const l = document.createElement("link"); l.id = "eb-font"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap"; document.head.appendChild(l); }
	if(!document.getElementById("tp-css")){ const st = document.createElement("style"); st.id = "tp-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play && audio.play(n);
	const buzz = p => { try { if(navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch(e){} };
	const today = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });

	const root = document.createElement("div"); root.className = "tp"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu : le téléphone de Camille");
	root.innerHTML = `<button class="tp-x" aria-label="Quitter le jeu">×</button>
		<div class="tp-side"><p class="k">📍 Wenov · patio, banc jaune</p><h1>Un téléphone vibre sur le banc.</h1><p>Personne autour. L'écran s'allume sans arrêt…</p><p class="cur"></p></div>
		<div class="tp-hint"></div>
		<div class="tp-wrap"><div class="tp-flip">
			<div class="tp-front"><div class="tp-scr">
				<div class="tp-island"></div>
				<div class="tp-status"><span class="tm">11:02</span><span class="r">●●●● 5G <span class="bat"><span class="pc">34 %</span><i><b style="width:34%"></b></i></span></span></div>
				<section class="tp-view tp-lock" data-v="lock">
					<div class="date">${today}</div><div class="clock">11:02</div>
					<div class="wp"><i></i><span>COURÉE</span><em>LILLE · DEPUIS 2021</em></div>
					<div class="tp-notifs"></div>
					<div class="swipe">⌃<br>Glisse vers le haut pour déverrouiller</div>
					<div class="tp-pad"><h3>Saisis le code</h3><div class="dots"><i></i><i></i><i></i><i></i></div>
						<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join("")}<button class="e" data-k="x">Annuler</button><button data-k="0">0</button><button class="e" data-k="del">Effacer</button></div>
						<div class="hintc"></div></div>
				</section>
				<section class="tp-view tp-home off" data-v="home">
					<div class="tp-apps">
						<div class="tp-app" data-app="admin"><i style="background:linear-gradient(140deg,#d0583d,#8e2a1a)">🛍️</i><span>Courée Admin</span><s></s></div>
						<div class="tp-app" data-app="notes"><i style="background:linear-gradient(140deg,#ffe58a,#f5c542)">🗒️</i><span>Notes</span><s></s></div>
						<div class="tp-app" data-app="agenda"><i style="background:#fff">📅</i><span>Agenda</span><s></s></div>
						<div class="tp-app" data-app="photos"><i style="background:linear-gradient(140deg,#fff,#e9e3ff)">🖼️</i><span>Photos</span><s></s></div>
						<div class="tp-app lock" data-app="acte2"><i style="background:linear-gradient(140deg,#5fa8ff,#2f63d8)">🔎</i><span>Recherche</span></div>
						<div class="tp-app lock" data-app="acte3"><i style="background:linear-gradient(140deg,#ff8db3,#d23b74)">📣</i><span>Pub</span></div>
						<div class="tp-app lock" data-app="acte4"><i style="background:linear-gradient(140deg,#7ee0c3,#139a7a)">✉️</i><span>Mail</span></div>
						<div class="tp-app" data-app="reglages"><i style="background:linear-gradient(140deg,#c9c6d4,#8f8ba0)">⚙️</i><span>Réglages</span></div>
					</div>
					<div class="tp-dock"><div class="tp-app" data-app="messages"><i style="background:linear-gradient(140deg,#6ee7a0,#22b35e)">💬</i><span>Messages</span><s></s></div>
						<div class="tp-app" data-app="tel"><i style="background:linear-gradient(140deg,#6ee7a0,#22b35e)">📞</i><span>Téléphone</span></div>
						<div class="tp-app" data-app="photo2"><i style="background:linear-gradient(140deg,#d9d6e3,#a9a5b8)">📷</i><span>Appareil</span></div>
						<div class="tp-app" data-app="musique"><i style="background:linear-gradient(140deg,#ff9a8b,#ff5e62)">🎵</i><span>Musique</span></div></div>
				</section>
				<section class="tp-view tp-appv off" data-v="messages"></section>
				<section class="tp-view tp-appv off" data-v="notes"></section>
				<section class="tp-view tp-appv off" data-v="agenda"></section>
				<section class="tp-view tp-adm off" data-v="admin">
					<div class="tp-admh"><div class="t"><span class="back" data-go="home" aria-label="Accueil">‹</span><b>Courée Admin</b><span class="live">EN DIRECT</span></div>
						<div class="tp-stat"><div class="cv"><b data-k="conv">–</b><small data-k="delta">de conversion</small></div><div class="tm" data-k="tbox">avant le point de 14 h<b data-k="left">3 h</b></div></div><div class="tp-tbar"><i></i></div>
						<div class="tp-fun">${PAGES.map(([n], i) => `<button data-pg="${i}">${n}</button>`).join("")}</div></div>
					<div class="tp-vp"><div class="tp-track">${PAGES.map(([n, url], i) => `<div class="tp-pg"><div class="tp-site" data-site="${i}"><div class="tp-url">🔒 ${url}${i ? "" : `<span class="tp-load">⚡ 1,0 s</span>`}</div><div class="tp-inner"><div class="tp-flow"></div><div class="tp-ins"></div><div class="tp-dots"></div></div></div></div>`).join("")}</div></div>
					<div class="tp-drawer"><p class="cap">GLISSE UN BLOC SUR LA PAGE ↑</p><div class="tiles">${Object.entries(BLOCKS).map(([k, b]) => `<div class="tp-tile" data-b="${k}"><i>${b.ic}</i><b>${b.n}</b></div>`).join("")}</div></div>
				</section>
				<section class="tp-view tp-srch off" data-v="search"></section>
				<section class="tp-view tp-call off" data-v="call"></section>
				<section class="tp-view tp-end off" data-v="end"></section>
				<div class="tp-banners"></div>
				<div class="tp-homebar"></div>
			</div></div>
			<div class="tp-backf"><div class="cam"></div><div class="tp-postit">Code = l'année où j'ai lancé Courée 😉<small>— C.</small></div><div class="logo">Camille</div></div>
		</div></div>`;
	document.body.appendChild(root);

	const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
	const wrap = $(".tp-wrap"), flip = $(".tp-flip"), scrEl = $(".tp-scr"), status = $(".tp-status"), homebar = $(".tp-homebar"), hintEl = $(".tp-hint"), sideCur = $(".tp-side .cur");
	const V = k => root.querySelector(`[data-v="${k}"]`);
	root.addEventListener("scroll", e => { const n = e.target; if(n === scrEl || n.classList && (n.classList.contains("tp-adm") || n.classList.contains("tp-srch") || n.classList.contains("tp-res") || n.classList.contains("tp-vp"))){ n.scrollTop = 0; n.scrollLeft = 0; } }, true);
	const track = $(".tp-track"), sites = $$(".tp-site"), inner = $$(".tp-inner"), flowEl = $$(".tp-flow"), dotsEl = $$(".tp-dots"), insEl = $$(".tp-ins"), loadEl = $(".tp-load"), drawer = $(".tp-drawer");
	let K = 1;

	/* ---------- mise à l'échelle du téléphone ---------- */
	function layout(){
		const W = innerWidth, H = innerHeight, small = W <= 560;
		K = small ? Math.min(W/390, H/844) : Math.min((H - 40)/864, (W - 40)/410, 1.1);
		wrap.style.transform = `scale(${K})`;
		const front = $(".tp-front");
		if(small){ front.style.padding = "0"; front.style.background = "none"; front.style.boxShadow = "none"; scrEl.style.borderRadius = "0"; wrap.style.width = "390px"; wrap.style.height = "844px"; wrap.style.margin = "-422px 0 0 -195px"; }
		else { front.style.padding = ""; front.style.background = ""; front.style.boxShadow = ""; scrEl.style.borderRadius = ""; wrap.style.width = ""; wrap.style.height = ""; wrap.style.margin = ""; }
		fitPages();
	}
	const local = e => { const r = scrEl.getBoundingClientRect(); return [(e.clientX - r.left)/(r.width/390), (e.clientY - r.top)/(r.height/844)]; };
	let hintT = 0;
	function hint(t, ms = 3200){ clearTimeout(hintT); const off = () => { hintEl.classList.remove("on"); sideCur.classList.remove("on"); }; if(!t) return off(); hintEl.textContent = t; sideCur.textContent = "👉 " + t; hintEl.classList.add("on"); sideCur.classList.add("on"); if(ms) hintT = setTimeout(off, ms); }

	/* ---------- état général ---------- */
	let view = "lock", clockMin = 11*60 + 2, battery = 34, closed = false, raf = 0, lastTs = 0;
	function setClock(){ $(".tp-status .tm").textContent = hm(clockMin); $(".tp-lock .clock").textContent = hm(clockMin); const b = Math.max(5, Math.round(battery)); $(".tp-status .pc").textContent = b + " %"; $(".tp-status .bat b").style.width = b + "%"; $(".tp-status .bat").classList.toggle("low", b <= 20); }
	function go(v){
		if(v === view) return;
		const from = V(view); from && from.classList.add("off");
		view = v; V(v).classList.remove("off");
		hint("");
		const light = v !== "lock" && v !== "home" && v !== "call";
		status.classList.toggle("dark", light); homebar.classList.toggle("dark", light);
		if(v === "messages") renderMessages();
		if(v === "notes") renderNotes();
		if(v === "agenda") renderAgenda();
		if(v === "admin") enterAdmin();
		if(v === "search") enterSearch();
		closeCard();
	}

	/* ---------- prologue : notifications, écran verrouillé, code ---------- */
	const LOCKN = [
		["💬", "#22b35e", "Inès", "Camille ?? Le site s'effondre 😱 Tu es où ?"],
		["🛍️", "#b23a24", "Courée Admin", "12 paniers abandonnés depuis 9 h"],
		["⭐", "#f5b301", "Avis clients", "★☆☆☆☆ « Je n'ai jamais réussi à commander »"],
		["💬", "#22b35e", "Marc (le boss)", "Point ventes à 14 h. J'espère de bonnes nouvelles."]
	];
	const timers = []; const later = (ms, f) => { const id = setTimeout(() => { if(!closed) f(); }, ms); timers.push(id); return id; };
	LOCKN.forEach(([ic, c, who, txt], i) => later(700 + i*1100, () => {
		const n = document.createElement("div"); n.className = "tp-nt"; n.innerHTML = `<span class="ic" style="color:${c}">${ic}</span><span><b>${who}<small>maintenant</small></b>${txt}</span>`;
		$(".tp-notifs").prepend(n); vibrate();
	}));
	later(5200, () => hint("Glisse l'écran vers le haut pour le déverrouiller", 0));
	function vibrate(){ flip.classList.remove("buzz"); void flip.offsetWidth; flip.classList.add("buzz"); play("pop"); buzz([40, 60, 40]); }

	let code = "", flipped = false, padOn = false, tries = 0, unlocked = false;
	const pad = $(".tp-pad");
	function showPad(on){ padOn = on; pad.classList.toggle("on", on); if(on){ hint("Il faut le code de Camille…", 0); later(12000, () => { if(!unlocked && !flipped) padHint("Les gens notent souvent leur code… regarde au dos du téléphone : glisse-le vers la gauche ou la droite."); }); } }
	function padHint(t){ pad.querySelector(".hintc").textContent = t; }
	function dotsCode(){ pad.querySelectorAll(".dots i").forEach((d, i) => d.classList.toggle("f", i < code.length)); }
	pad.addEventListener("click", e => {
		const b = e.target.closest("[data-k]"); if(!b) return; const k = b.dataset.k; play("pop");
		if(k === "x"){ code = ""; dotsCode(); showPad(false); return; }
		if(k === "del"){ code = code.slice(0, -1); dotsCode(); return; }
		if(code.length >= 4) return;
		code += k; dotsCode();
		if(code.length === 4) later(180, () => {
			if(code === CODE) return unlock();
			tries++; code = ""; dotsCode(); const d = pad.querySelector(".dots"); d.classList.remove("err"); void d.offsetWidth; d.classList.add("err"); buzz(120); play("bad");
			padHint(tries === 1 ? "Code incorrect. Camille a peut-être laissé un indice… au dos du téléphone ?" : tries === 2 ? "Retourne le téléphone : glisse-le vers la gauche ou la droite." : "Le post-it parle de l'année où Camille a lancé Courée. Regarde bien le fond d'écran 😉");
		});
	});
	function setFlip(on){ flipped = on; flip.classList.toggle("back", on); play("pop"); if(on) hint("Un post-it ! Glisse encore pour retourner le téléphone", 0); else if(!unlocked) hint(padOn ? "Tape le code" : "Glisse vers le haut, puis tape le code", 0); }
	function unlock(){
		unlocked = true; play("good"); buzz(30); hint(""); go("home");
		badge("messages", 4); badge("admin", 12);
		later(900, () => banner({ ic:"💬", c:"#22b35e", who:"Inès", txt:"Camille ? Tu as débloqué ton tel ! Réponds-moi 🙏", go:"messages" }));
		later(1600, () => hint("Ouvre Messages pour lire ce qu'Inès écrit", 0));
		pulseApp("messages", true);
	}

	/* ---------- bannières ---------- */
	let banT = 0;
	function banner({ ic, c, who, txt, go:g, page, el }){
		const box = $(".tp-banners"); box.innerHTML = "";
		const b = document.createElement("div"); b.className = "tp-ban"; b.innerHTML = `<span class="ic" style="background:${c}22;color:${c}">${ic}</span><span><b>${who}<small>maintenant</small></b>${txt}</span>`;
		b.addEventListener("click", () => { b.remove(); if(g === "admin"){ go("admin"); if(page !== undefined){ setPage(page); if(el) flashEl(el); } } else if(g){ if(g.startsWith("thread:")){ thread = g.slice(7); go("messages"); renderMessages(); } else go(g); } });
		box.appendChild(b); clearTimeout(banT); banT = setTimeout(() => { b.classList.add("out"); setTimeout(() => b.remove(), 320); }, 3600);
		if(view !== "admin" || !g || g !== "admin") vibrate();
	}
	function badge(app, n){ $$(`[data-app="${app}"] s`).forEach(s => { s.textContent = n; s.classList.toggle("on", !!n); }); }
	function pulseApp(app, on){ $$(`[data-app="${app}"]`).forEach(a => a.classList.toggle("pulse", on)); }

	/* ---------- Messages ---------- */
	const THREADS = {
		ines:{ name:"Inès", sub:"head of growth", c:"linear-gradient(135deg,#ff7a59,#5b4bff)", msgs:[["t", "Aujourd'hui 10:41"], ["in", "Camille, tu as vu les chiffres de ce matin ? 😬"], ["in", "12 paniers abandonnés… on ne vend presque rien"], ["in", "Camille ?? Le site s'effondre 😱 Tu es où ?"]], unread:3 },
		marc:{ name:"Marc (le boss)", sub:"fondateur de Courée", c:"linear-gradient(135deg,#2b2f36,#6b6f7a)", msgs:[["t", "Hier 19:12"], ["in", "J'ai mis MA vidéo 4K en haut de la fiche produit 🎬 Elle claque, non ?"], ["in", "Et le pop-up −10 %, on le garde, ça marche partout."], ["t", "Aujourd'hui 10:55"], ["in", "Point ventes à 14 h. J'espère de bonnes nouvelles."]], unread:1 },
		maman:{ name:"Maman", sub:"", c:"linear-gradient(135deg,#f6a9c4,#d2577f)", msgs:[["t", "Aujourd'hui 09:03"], ["in", "Tu manges à la maison dimanche ? 🥘"]], unread:0 }
	};
	let thread = null, chips = null, typing = null;
	function renderMessages(){
		const v = V("messages");
		if(!thread){
			v.innerHTML = `<div class="tp-ah"><span class="back" data-go="home">‹ Accueil</span><h2>Messages</h2></div><div class="tp-ab">${Object.entries(THREADS).map(([k, T]) => { const last = T.msgs.filter(m => m[0] !== "t").slice(-1)[0]; return `<div class="tp-conv ${T.unread ? "unread" : ""}" data-th="${k}"><span class="av" style="background:${T.c}">${T.name[0]}</span><span style="flex:1;min-width:0"><b>${T.name}<small>${T.unread ? "● " + T.unread : ""}</small></b><p>${last ? (last[0] === "me" ? "Toi : " : "") + last[1] : ""}</p></span></div>`; }).join("")}</div>`;
			return;
		}
		const T = THREADS[thread]; T.unread = 0; badge("messages", Object.values(THREADS).reduce((a, x) => a + x.unread, 0));
		v.innerHTML = `<div class="tp-ah"><span class="back" data-th="">‹ Messages</span><h2>${T.name}</h2><small style="color:var(--mut)">${T.sub}</small></div>
			<div class="tp-ab"><div class="tp-th">${T.msgs.map(([w, txt]) => w === "t" ? `<small class="t">${txt}</small>` : `<div class="tp-bub ${w === "me" ? "me" : ""}">${txt}</div>`).join("")}${typing === thread ? `<div class="tp-bub typing">…</div>` : ""}</div></div>
			${chips && chips.th === thread ? `<div class="tp-chips">${chips.opts.map((o, i) => `<button data-chip="${i}">${o}</button>`).join("")}</div>` : ""}`;
		const ab = v.querySelector(".tp-ab"); ab.scrollTop = ab.scrollHeight;
		if(thread === "ines" && !story.met){ story.met = 1; later(700, () => setChips("ines", ["Ce n'est pas Camille. J'ai trouvé son téléphone sur un banc, à Wenov."], () => meetInes())); }
	}
	function setChips(th, opts, cb){ chips = { th, opts, cb }; if(view === "messages" && thread === th) renderMessages(); }
	function say(th, txt, delay = 900){
		return new Promise(res => {
			later(delay*.35, () => { typing = th; if(view === "messages" && thread === th) renderMessages(); });
			later(delay, () => { typing = null; THREADS[th].msgs.push(["in", txt]); if(!(view === "messages" && thread === th)){ THREADS[th].unread++; badge("messages", Object.values(THREADS).reduce((a, x) => a + x.unread, 0)); banner({ ic:"💬", c:"#22b35e", who:THREADS[th].name, txt, go:"thread:" + th }); } else { renderMessages(); play("pop"); } res(); });
		});
	}
	const story = { met:0, help:0, act:0, popMarc:0, convMsg:0, tip:-99, blocks:0, best:0 };
	const BLOCKR = new Set(["taille", "form", "frais", "confiance"]);
	async function meetInes(){
		await say("ines", "Quoi ?! 😳", 900);
		await say("ines", "Camille est en rendez-vous à Euratech jusqu'à 14 h… et à 14 h, Marc veut un point sur les ventes.", 1600);
		await say("ines", "Tu veux bien m'aider ? Il faut comprendre pourquoi les gens n'achètent pas.", 1500);
		setChips("ines", ["OK, je t'aide !"], async () => {
			story.help = 1;
			await say("ines", "Merci !! 🙏 Ouvre l'appli Courée Admin : on y voit le site en direct, avec les visiteurs.", 1100);
			pulseApp("messages", false); pulseApp("admin", true); hint("Reviens à l'accueil (barre du bas) et ouvre Courée Admin", 0);
			await say("ines", "Petit conseil : Camille note tout dans ses Notes. Ça peut servir 😉", 2200);
			badge("notes", 1);
		});
	}
	V("messages").addEventListener("click", e => {
		const th = e.target.closest("[data-th]"); if(th){ thread = th.dataset.th || null; renderMessages(); play("pop"); return; }
		const ch = e.target.closest("[data-chip]"); if(ch && chips){ const c = chips; chips = null; THREADS[c.th].msgs.push(["me", c.opts[+ch.dataset.chip]]); renderMessages(); play("pop"); c.cb && c.cb(); }
	});

	/* ---------- Notes et Agenda ---------- */
	function renderNotes(){
		badge("notes", 0);
		V("notes").innerHTML = `<div class="tp-ah"><span class="back" data-go="home">‹ Accueil</span><h2>Notes</h2></div><div class="tp-ab">
			<div class="tp-note"><h4>Site : à faire quand j'aurai 5 min 😩</h4>• Les clients demandent tout le temps quelle taille prendre → un guide des tailles, mais <b>juste à côté des tailles</b> !<br>• Les frais de livraison ne se voient qu'au paiement… pas top.<br>• Le compte obligatoire, c'est l'idée de Marc. À virer ?<br>• La vidéo 4K de Marc : jolie, mais la fiche rame sur mobile ?</div>
			<div class="tp-note"><h4>Black Friday 🖤</h4>Préparer les visuels, la newsletter, le budget pub… et prier.</div>
			<div class="tp-note"><h4>Courses</h4>Lait d'avoine, café, piles pour la souris.</div></div>`;
	}
	function renderAgenda(){
		V("agenda").innerHTML = `<div class="tp-ah"><span class="back" data-go="home">‹ Accueil</span><h2>Aujourd'hui</h2><small style="color:var(--mut);text-transform:capitalize">${today}</small></div><div class="tp-ab">
			<div class="tp-ag"><b>10:00</b><span>Rendez-vous à Euratech<small>Partenaire logistique · jusqu'à 14 h</small></span></div>
			<div class="tp-ag"><b>12:30</b><span>Déj' au patio de Wenov<small>(c'est sans doute là que j'ai oublié mon tel…)</small></span></div>
			<div class="tp-ag"><b>14:00</b><span class="w">Point ventes avec Marc ⚠️<small>Préparer les chiffres du site</small></span></div>
			<div class="tp-ag"><b>18:00</b><span>Préparer le Black Friday<small>Recherche, pub, newsletter</small></span></div></div>`;
	}

	/* ---------- Acte 1 : le site en direct ---------- */
	let pages, popup, live, heat, people, t, spawnT, running, ended, stats, page, endT, events, said;
	let lastEdit = 0, fast = false;
	people = [];
	function resetAct(){
		pages = START.map(a => a.slice()); popup = true; live = {}; heat = {}; people.forEach(p => p.el.remove()); people = [];
		t = 0; spawnT = 1.2; running = false; ended = false; page = 0; endT = 0; events = []; said = new Set();
		stats = { vis:0, ord:0, done:[], reasons:{}, reach:[0, 0, 0], at:{}, samples:[] }; lastEdit = 0; fast = false; story.best = 0; story.tip = -99;
		flowEl.forEach(f => { f.innerHTML = ""; }); dotsEl.forEach(f => { f.innerHTML = ""; }); $$(".tp-pop").forEach(p => p.remove());
		$$(".tp-tile").forEach(x => x.classList.remove("used"));
		[0, 1, 2].forEach(renderPage); setPage(0); kpis();
	}
	const isBlock = id => !!BLOCKS[id];
	const elHTML = id => isBlock(id) ? BLOCKS[id].h : BASE[id].h;
	const elNode = id => root.querySelector(`.tp-flow [data-el="${id}"]`) || (id === "popup" ? root.querySelector(".tp-pop") : null);
	const screenOf = id => pages.findIndex(p => p.includes(id));
	function renderPage(s){
		const f = flowEl[s], keep = new Map([...f.children].map(c => [c.dataset.el, c]));
		f.innerHTML = "";
		for(const id of pages[s]){
			let el = keep.get(id);
			if(!el){ el = document.createElement("div"); el.className = "tp-el"; el.dataset.el = id; el.innerHTML = elHTML(id) + `<span class="heat"></span><span class="cnt"></span>`; if(isBlock(id) || BASE[id].bad) el.dataset.mv = 1; if(isBlock(id)) el.classList.add("mine"); }
			f.appendChild(el);
		}
		if(s === 0){
			let p = sites[0].querySelector(".tp-pop");
			if(popup && !p){ p = document.createElement("div"); p.className = "tp-pop"; p.dataset.el = "popup"; p.dataset.mv = 1; p.innerHTML = `<u>✕</u><b>−10 % !</b>Inscris-toi à la newsletter pour ta première commande<i>ton@email.fr</i><em>Je m'inscris</em><span class="cnt"></span>`; inner[0].insertBefore(p, dotsEl[0]); }
			if(!popup && p) p.remove();
		}
		fitPages(); paintHeat();
	}
	function fitPages(){
		inner.forEach((n, s) => { const avail = (sites[s].clientHeight || 600) - 4, h = flowEl[s].offsetHeight || 1, k = Math.min(1, avail/h); n.style.transform = `scale(${k})`; n.style.width = (366/k) + "px"; });
	}
	function loadTime(){ let l = LOAD0; pages[0].forEach(id => { const d = BASE[id] || BLOCKS[id]; if(d.w) l += d.w; }); if(loadEl){ loadEl.textContent = `⚡ ${fmtS(l)}`; loadEl.classList.toggle("slow", l > 2.2); } return l; }
	const bounce = () => Math.max(0, Math.min(.6, (loadTime() - 2.2)*.32));
	function midY(s, id){ const n = flowEl[s].querySelector(`[data-el="${id}"]`); if(!n) return 60; return n.offsetTop + n.offsetHeight/2; }
	function paintHeat(){
		const nodes = $$(".tp-flow [data-el], .tp-pop"); let top = null, best = .8;
		for(const n of nodes){ const h = heat[n.dataset.el]; if(h && h.v > best){ best = h.v; top = n; } }
		for(const n of nodes){
			const hv = n.querySelector(".heat"), on = n === top;
			if(hv) hv.style.opacity = on ? Math.min(1, .35 + best*.15).toFixed(2) : 0;
			n.classList.toggle("wig", on && !!n.dataset.mv && !isBlock(n.dataset.el));
			n.classList.toggle("hot", on);
		}
	}
	const isLive = id => !isBlock(id) || (live[id] !== undefined && t >= live[id]);
	function setPage(i){ page = i; track.style.transform = `translateX(${-390*i}px)`; $$("[data-pg]").forEach(b => b.classList.toggle("on", +b.dataset.pg === i)); }
	function flashEl(id){ const n = elNode(id); if(!n) return; n.classList.remove("flash"); void n.offsetWidth; n.classList.add("flash"); }

	function pickNeed(){ let r = Math.random(); for(const [k, w] of Object.entries(NEEDS)){ if((r -= w) < 0) return k; } return "curieux"; }
	function spawn(){
		const need = pickNeed(), el = document.createElement("div"); el.className = "tp-dot"; el.style.background = COL[need];
		const p = { need, name:pick(NAMES), s:0, idx:-1, x:rnd(40, 320), y:10, seen:{}, el, out:false, gone:0, leaveAt:need === "curieux" ? Math.floor(rnd(1, 8)) : -1, steps:0, popWait:popup };
		dotsEl[0].appendChild(el); people.push(p); stats.vis++; stats.reach[0]++;
		if(Math.random() < bounce()){ p.y = 20; return quit(p, "lent", pages[0].includes("video") ? "video" : "hdr0"); }
		next(p);
	}
	function next(p){
		const list = pages[p.s]; p.idx = Math.min(p.idx + 1, list.length - 1);
		const id = list[p.idx]; p.target = id; p.tx = Math.max(20, Math.min(346, p.x + rnd(-60, 60))); p.ty = midY(p.s, id) + rnd(-6, 6); p.moving = true;
		if(p.s === 0 && p.popWait && popup){ p.target = "popup"; p.ty = 220 + rnd(-30, 30); p.idx--; }
	}
	function arrive(p){
		const id = p.target; p.steps++;
		if(id === "popup"){ p.popWait = false; if(!popup){ p.wait = .1; return; } if(Math.random() < .3) return quit(p, "popup", "popup"); p.wait = 1.1; return; }
		if(p.leaveAt >= 0 && (p.steps >= p.leaveAt || id === "cta2")) return quit(p, "curieux", id, true);
		if(isLive(id)) p.seen[id] = p.s;
		let w = rnd(.25, .5);
		if(id === "video") w += 1;
		if(id === "tailles" && p.need === "taille"){
			const L = pages[0], i = L.indexOf("tailles"), near = [L[i - 1], L[i + 1]].some(n => n === "guide" && isLive(n));
			if(!near && !(p.seen.guide !== undefined && Math.random() < .5)) return quit(p, "taille", id);
			p.need = null; w += .3;
		}
		if(id === "compte"){ if(p.need === "presse" || Math.random() < .25) return quit(p, "compte", id); w += .9; }
		if(id === "form"){ if(p.seen.express !== 2){ if(p.need === "presse") return quit(p, "form", id); w += 1.2; } else if(p.need === "presse") p.need = null; }
		if(id === "recap" && p.need === "frais"){ if(p.seen.frais === undefined) return quit(p, "frais", id); p.need = null; }
		if(id === "cta2" && p.need === "confiance"){ if(p.seen.avis === undefined && p.seen.secure !== 2) return quit(p, "confiance", id); p.need = null; }
		if(BASE[id] && BASE[id].cta){ if(p.s === 2) return buy(p); p.pass = true; }
		p.wait = w;
	}
	function moveTo(p, s){ p.el.remove(); dotsEl[s].appendChild(p.el); p.s = s; p.idx = -1; p.y = 10; p.x = rnd(40, 320); stats.reach[s]++; next(p); }
	function sayDot(p, txt, cls){ if(dotsEl[p.s].querySelector(".tp-say")) return; const b = document.createElement("div"); b.className = "tp-say " + (cls || ""); b.textContent = txt; b.style.left = Math.max(80, Math.min(286, p.x)) + "px"; b.style.top = p.y + "px"; dotsEl[p.s].appendChild(b); setTimeout(() => b.remove(), 1800); }
	let lastBan = -9;
	function quit(p, r, at, soft){
		p.out = true; p.gone = 1.6; p.moving = false;
		if(soft) p.el.style.background = "#d6d3df"; else p.el.classList.add("ko");
		sayDot(p, REASONS[r][2], soft ? "grey" : ""); stats.reasons[r] = (stats.reasons[r] || 0) + 1; stats.done.push(0);
		const a = stats.at[at] || (stats.at[at] = {}); a[r] = (a[r] || 0) + 1;
		if(soft) return;
		const h = heat[at] || (heat[at] = { v:0, n:0 }); h.v += 1; h.n++; paintHeat();
		if(view !== "admin" && t - lastBan > 7){ lastBan = t; const s = at === "popup" ? 0 : screenOf(at); banner({ ic:REASONS[r][0], c:"#e5484d", who:`${p.name} a quitté le site`, txt:`« ${REASONS[r][2]} » · ${PAGES[Math.max(0, s)][0]}`, go:"admin", page:Math.max(0, s), el:at }); }
		guide(r);
	}
	function buy(p){ p.out = true; p.gone = 1.2; p.el.classList.add("buy"); sayDot(p, `+${PRICE} € · commande !`, "ok"); stats.ord++; stats.done.push(1); play("stamp"); }
	function conv(n = 40){ const d = stats.done.slice(-n); return d.length >= 8 ? d.reduce((a, b) => a + b, 0)/d.length : null; }
	function guide(r){
		const M = {
			lent:"Des visiteurs partent avant même que la fiche s'affiche 🐢 Regarde le temps de chargement en haut de la page… la vidéo 4K de Marc pèse 48 Mo.",
			popup:"Ce pop-up −10 % cache le produit et fait fuir du monde. Tu peux l'<b>attraper et le jeter</b> (vers le bas).",
			taille:"Plein de gens hésitent sur la taille. Il y a un <b>guide des tailles</b> dans les blocs en bas, à mettre à côté du choix de taille.",
			compte:"Obliger à créer un compte, ça fait fuir. <b>Attrape ce bloc et jette-le</b> : on peut commander en invité.",
			form:"Les pressés fuient devant les 14 champs. Un <b>paiement express</b> au-dessus du formulaire ?",
			frais:"Les frais découverts au dernier moment, c'est LA 1re cause d'abandon de panier. Il faut les <b>annoncer plus tôt</b>.",
			confiance:"Au moment de payer, certains doutent. <b>Des avis clients</b> avant, ou un <b>paiement sécurisé</b> sur la page Paiement, aideraient."
		};
		if(M[r] && stats.reasons[r] >= 2 && !said.has(r) && t - story.tip > 22){ said.add(r); story.tip = t; if(BLOCKR.has(r)) revealBlocks(); say("ines", M[r], 600); }
	}
	function step(dt){
		t += dt; clockMin = 11*60 + 5 + Math.min(1, t/ACT)*175; battery = 34 - Math.min(1, t/ACT)*12;
		if(t < ACT){ spawnT -= dt; if(spawnT <= 0){ spawnT += EVERY*rnd(.6, 1.4); spawn(); } }
		for(const p of people){
			if(p.out){ p.gone -= dt; if(p.gone < .5) p.el.classList.add("gone"); continue; }
			if(p.moving){ const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), v = 190*dt; if(d <= v){ p.x = p.tx; p.y = p.ty; p.moving = false; arrive(p); } else { p.x += dx/d*v; p.y += dy/d*v; } }
			else { p.wait -= dt; if(p.wait <= 0){ if(p.pass){ p.pass = false; moveTo(p, p.s + 1); } else next(p); } }
		}
		for(let i = people.length - 1; i >= 0; i--){ const p = people[i]; if(p.out && p.gone <= 0){ p.el.remove(); people.splice(i, 1); } }
		for(const k in heat) heat[k].v *= Math.pow(.9, dt);
		if(Math.floor(t/5) !== Math.floor((t - dt)/5)){ stats.samples.push([t, conv(30)]); paintHeat(); storyBeats(); }
		if(t >= ACT && !ended){ endT += dt; if(!people.some(p => !p.out) || endT > 8){ ended = true; running = false; later(600, incomingCall); } }
	}
	function storyBeats(){
		const c = conv(30);
		if(t > 40 && !story.popMarc && !popup){ story.popMarc = 1; say("marc", "Qui a retiré MON pop-up −10 % ?! 😤", 400); }
	}
	function kpis(){
		const c = conv(), e = root.querySelector('[data-k="conv"]'); e.textContent = c === null ? "–" : pct(c); e.classList.toggle("up", c !== null && c >= STARS[0]);
		const f = stats.done.slice(0, 30), c0 = f.length >= 8 ? f.reduce((a, b) => a + b, 0)/f.length : null, de = root.querySelector('[data-k="delta"]'); let d = 0;
		if(c !== null && c0 !== null && stats.done.length >= 70){ d = Math.round((c - c0)*100); de.textContent = `de conversion · ${d >= 0 ? "+" : ""}${d} pts`; } else de.textContent = "de conversion";
		de.classList.toggle("up", d > 0);
		const st = c === null || stats.done.length < 50 ? 0 : STARS.filter(x => c >= x).length;
		if(st > story.best){ story.best = st; celebrate(c, st); }
		const left = Math.max(0, 14*60 - clockMin), tb = root.querySelector('[data-k="tbox"]'); root.querySelector('[data-k="left"]').textContent = left >= 60 ? `${Math.floor(left/60)} h ${String(Math.floor(left%60)).padStart(2, "0")}` : `${Math.ceil(left)} min`;
		root.querySelector(".tp-tbar i").style.width = Math.min(100, t/ACT*100) + "%"; tb.classList.toggle("urgent", left < 40); root.querySelector(".tp-tbar").classList.toggle("urgent", left < 40);
		for(let i = 0; i < 3; i++){
			const hot = pages[i].concat(i === 0 && popup ? ["popup"] : []).some(id => heat[id] && heat[id].v > 1.2);
			root.querySelector(`[data-pg="${i}"]`).classList.toggle("hot", hot && i !== page);
		}
	}
	function celebrate(c, st){
		const w = document.createElement("div"); w.className = "tp-win";
		w.innerHTML = `<div><b>${pct(c)}</b><i>${"★".repeat(st)}${"☆".repeat(3 - st)}</i><small>${["", "La conversion décolle !", "Inès montre la courbe à Marc 📈", "Record de Courée !"][st]}</small></div>`;
		V("admin").appendChild(w); setTimeout(() => w.remove(), 2500);
		const e = root.querySelector('[data-k="conv"]'); e.classList.remove("boom"); void e.offsetWidth; e.classList.add("boom");
		play("good"); buzz([30, 50, 30]);
	}
	function enterAdmin(){
		pulseApp("admin", false); badge("admin", 0); hint("");
		requestAnimationFrame(fitPages);
		if(!story.act){ story.act = 1; coach(); }
		later(45000, () => { if(running) revealBlocks(); });
	}
	function coach(){
		const c = document.createElement("div"); c.className = "tp-coach";
		c.innerHTML = `<div><h3>Le site, en direct</h3><p>Chaque pastille est un visiteur qui parcourt le site de Courée : fiche produit → panier → paiement. Il est 11 h, et Marc attend les chiffres à 14 h.</p>
			<ul><li>🔴 <span>Quand un visiteur abandonne, il dit pourquoi et la page <b>rougit</b> à cet endroit.</span></li><li>👆 <span><b>Touche</b> un élément pour voir qui a abandonné là. <b>Glisse</b> sur le côté pour changer de page.</span></li><li>🗑 <span><b>Attrape</b> ce qui gêne et jette-le vers le bas.</span></li><li>⏩ <span>Le temps file tout seul quand tu ne touches à rien. <b>Touche le chrono</b> pour avancer jusqu'à 14 h.</span></li></ul>
			<button class="tp-btn" data-a="go">Ouvrir le site aux visiteurs</button></div>`;
		V("admin").appendChild(c);
		c.querySelector("[data-a=go]").addEventListener("click", () => { c.remove(); running = true; play("chime"); hint("Observe d'abord : où les visiteurs abandonnent-ils ?", 4000); });
	}

	/* ---------- gestes dans l'appli ---------- */
	let drag = null, press = null, swipe = null, tilePress = null, card = null, edgeT = 0;
	const ghost = document.createElement("div"); ghost.className = "tp-ghost"; ghost.style.display = "none"; scrEl.appendChild(ghost);
	const inside = (e, r) => e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
	function startDrag(e, id, from){
		closeCard(); play("pop");
		drag = { id, from, s:-1, i:-1 };
		ghost.innerHTML = id === "popup" ? elNode("popup").outerHTML.replace("tp-pop", "tp-pop g") : `<div class="tp-el">${elHTML(id)}</div>`;
		ghost.style.display = "block";
		if(from !== null){ const n = elNode(id); n && n.classList.add("lift"); drawer.classList.add("trash"); }
		moveDrag(e);
	}
	function moveDrag(e){
		const [lx, ly] = local(e); ghost.style.left = lx + "px"; ghost.style.top = ly + "px";
		insEl.forEach(n => { n.style.display = "none"; });
		const vp = $(".tp-vp").getBoundingClientRect();
		// au bord de l'écran, on passe à la page voisine
		const edge = lx < 26 ? -1 : lx > 364 ? 1 : 0;
		if(edge && inside(e, vp)){ if(!edgeT) edgeT = performance.now(); else if(performance.now() - edgeT > 450){ edgeT = 0; const np = Math.max(0, Math.min(2, page + edge)); if(np !== page){ setPage(np); play("pop"); } } } else edgeT = 0;
		drag.s = -1;
		const overTrash = drag.from !== null && inside(e, drawer.getBoundingClientRect()); drawer.classList.toggle("over", overTrash);
		if(overTrash){ hint("Lâche : retiré de la page"); return; }
		if(!isBlock(drag.id)){ hint("Jette-le vers le bas pour le retirer"); drag.s = drag.from; return; }
		if(!inside(e, vp)){ hint(drag.from !== null ? "Jette-le vers le bas pour le retirer" : "Glisse le bloc sur la page"); return; }
		const s = page, kids = [...flowEl[s].children].filter(n => n.dataset.el !== drag.id); let i = kids.length;
		for(let j = 0; j < kids.length; j++){ const b = kids[j].getBoundingClientRect(); if(e.clientY < b.top + b.height/2){ i = j; break; } }
		i = Math.max(1, i); drag.s = s; drag.i = i;
		const r = inner[s].getBoundingClientRect(), sc = r.height/inner[s].offsetHeight || 1;
		const y = i < kids.length ? (kids[i].getBoundingClientRect().top - r.top)/sc - 6 : (kids[kids.length - 1].getBoundingClientRect().bottom - r.top)/sc + 1;
		insEl[s].style.top = y + "px"; insEl[s].style.display = "block";
		const after = kids[i - 1] && kids[i - 1].dataset.el;
		hint(after && BASE[after] && BASE[after].cta ? "Sous le bouton : les visiteurs auront déjà cliqué…" : `Lâche : ajouter à la page « ${PAGES[s][0]} »`);
	}
	function endDrag(e){
		const d = drag; drag = null; ghost.style.display = "none"; insEl.forEach(n => { n.style.display = "none"; }); hint("");
		drawer.classList.remove("trash", "over");
		$$(".lift").forEach(n => n.classList.remove("lift"));
		const trash = d.from !== null && inside(e, drawer.getBoundingClientRect());
		if(!isBlock(d.id)){
			if(!trash) return;
			if(d.id === "popup") return removePopup();
			else { pages[d.from] = pages[d.from].filter(x => x !== d.id); renderPage(d.from); loadTime(); log(`${BASE[d.id].n} retiré`); }
			play("pop"); revealBlocks();
			return;
		}
		if(d.from !== null) pages[d.from] = pages[d.from].filter(x => x !== d.id);
		if(trash || d.s < 0){ if(d.from !== null){ renderPage(d.from); $(`.tp-tile[data-b="${d.id}"]`).classList.remove("used"); delete live[d.id]; loadTime(); log(`${BLOCKS[d.id].n} retiré`); play("pop"); } return; }
		pages[d.s].splice(d.i, 0, d.id);
		const fresh = d.from === null;
		if(fresh){ live[d.id] = t + 1.2; $(`.tp-tile[data-b="${d.id}"]`).classList.add("used"); }
		[...new Set([d.s, d.from].filter(x => x !== null))].forEach(renderPage); loadTime();
		const n = elNode(d.id); if(fresh){ n.classList.add("new", "dep"); setTimeout(() => n.classList.remove("dep", "new"), 1200); }
		play("stamp"); buzz(15); log(`${BLOCKS[d.id].n} → ${PAGES[d.s][0]}`); feedback(d.id, d.s);
	}
	function log(txt){ events.push([t, txt]); lastEdit = t; fast = false; }
	// le temps file tout seul quand on ne touche plus à rien (ou d'un toucher sur le chrono)
	function speed(){
		const auto = !drag && t > 25 && (t - lastEdit > 10 || story.best >= 3), sp = fast || auto ? (story.best >= 3 ? 5 : 3.5) : 1;
		const tb = root.querySelector('[data-k="tbox"]'); if(tb) tb.classList.toggle("ff", sp > 1);
		return sp;
	}
	function revealBlocks(){
		if(story.blocks) return; story.blocks = 1;
		const a = V("admin"); later(700, () => { a.classList.add("blocks"); drawer.classList.add("arrive"); fitPages(); play("chime"); hint("De nouveaux blocs : glisse-les sur la page", 4000); later(1200, () => drawer.classList.remove("arrive")); });
	}
	function removePopup(){ if(!popup) return; popup = false; closeCard(); renderPage(0); log("Pop-up retiré"); play("pop"); revealBlocks(); }
	function feedback(id, s){
		const L = pages[s], i = L.indexOf(id), cta = L.findIndex(x => BASE[x] && BASE[x].cta);
		const k = "fb" + id + s + i; if(said.has(k)) return; said.add(k);
		if(i > cta) return say("ines", "Hmm, sous le bouton, personne ne le verra : les visiteurs cliquent avant 😅", 700);
		if(id === "guide"){ const ti = pages[0].indexOf("tailles"); if(s !== 0 || Math.abs(i - ti) !== 1) return say("ines", "Le guide des tailles marcherait mieux <b>juste au-dessus ou au-dessous du choix de taille</b>.", 700); }
		if(id === "secure" && s !== 2) return say("ines", "Le cadenas rassure surtout <b>au moment de payer</b> : sur la page Paiement.", 700);
		if(id === "express" && (s !== 2 || i > pages[2].indexOf("form"))) return say("ines", "Le paiement express doit être <b>sur la page Paiement, au-dessus du formulaire</b>.", 700);
		if(id === "frais" && s === 2) return say("ines", "Sur la page Paiement, c'est déjà trop tard : les frais doivent se voir <b>avant</b>.", 700);
	}
	function cardFor(id, anchor){
		closeCard();
		const a = stats.at[id] || {}, tot = Object.values(a).reduce((x, y) => x + y, 0);
		const name = isBlock(id) ? BLOCKS[id].n : id === "popup" ? "Pop-up newsletter −10 %" : BASE[id].n;
		card = document.createElement("div"); card.className = "tp-card";
		card.innerHTML = `<b>${name}</b>${isBlock(id) ? `<p>${BLOCKS[id].tip}</p>` : ""}${tot ? `<p><em>${tot} abandon${tot > 1 ? "s" : ""}</em> ici :</p><ul>${Object.entries(a).sort((x, y) => y[1] - x[1]).map(([r, n]) => `<li><span>${REASONS[r][0]} ${REASONS[r][1]}</span><b>${n}</b></li>`).join("")}</ul>` : `<p>Aucun abandon ici pour l'instant.</p>`}${isBlock(id) || id === "popup" || (BASE[id] && BASE[id].bad) ? `<p style="margin-top:6px;color:var(--mut)">Attrape-le et jette-le vers le bas pour le retirer.</p>` : ""}`;
		V("admin").appendChild(card);
		const r = anchor.getBoundingClientRect(), sr = scrEl.getBoundingClientRect(), k = sr.height/844;
		let y = (r.top - sr.top)/k - card.offsetHeight - 10; if(y < 170) y = (r.bottom - sr.top)/k + 10;
		card.style.top = Math.min(844 - card.offsetHeight - 90, y) + "px";
	}
	function closeCard(){ if(card){ card.remove(); card = null; } }

	scrEl.addEventListener("pointerdown", e => {
		if(drag) return;
		// écran verrouillé : glisser vers le haut, ou sur le côté pour retourner le téléphone
		if(view === "lock" && !unlocked){ swipe = { x:e.clientX, y:e.clientY, kind:"lock" }; return; }
		if(e.target.closest(".tp-homebar")){ swipe = { x:e.clientX, y:e.clientY, kind:"home" }; return; }
		if(view !== "admin" || !running) return;
		const tile = e.target.closest(".tp-tile"); if(tile){ e.preventDefault(); tilePress = { x:e.clientX, y:e.clientY, id:tile.dataset.b }; if(e.pointerType === "mouse"){ const id = tilePress.id; tilePress = null; startDrag(e, id, null); } return; }
		if(e.target.closest(".tp-pop u")){ e.preventDefault(); removePopup(); return; }
		const n = e.target.closest(".tp-vp [data-el]");
		if(n){ e.preventDefault(); press = { x:e.clientX, y:e.clientY, id:n.dataset.el, n }; return; }
		if(e.target.closest(".tp-vp")) swipe = { x:e.clientX, y:e.clientY, kind:"page" };
		if(!e.target.closest(".tp-card")) closeCard();
	});
	$(".tp-backf").addEventListener("pointerdown", e => { swipe = { x:e.clientX, y:e.clientY, kind:"back" }; });
	function onMove(e){
		if(drag) return moveDrag(e);
		if(tilePress && Math.hypot(e.clientX - tilePress.x, e.clientY - tilePress.y) > 6){ const id = tilePress.id; tilePress = null; startDrag(e, id, null); return; }
		if(press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 7){
			const p = press; press = null;
			if(p.n.dataset.mv) startDrag(e, p.id, p.id === "popup" ? 0 : screenOf(p.id));
			else swipe = { x:p.x, y:p.y, kind:"page" };
		}
	}
	function onUp(e){
		if(drag) return endDrag(e);
		tilePress = null;
		if(press){ const p = press; press = null; cardFor(p.id, p.n); return; }
		if(!swipe) return;
		const s = swipe; swipe = null; const dx = e.clientX - s.x, dy = e.clientY - s.y, k = scrEl.getBoundingClientRect().width/390;
		if(s.kind === "lock"){
			if(Math.abs(dx) > 60*k && Math.abs(dx) > Math.abs(dy)) return setFlip(true);
			if(-dy > 60*k && !padOn) return showPad(true);
		}
		if(s.kind === "back" && (Math.abs(dx) > 40*k || Math.hypot(dx, dy) < 6)) return setFlip(false);
		if(s.kind === "home" && (-dy > 20*k || Math.hypot(dx, dy) < 8) && unlocked && view !== "call" && view !== "end"){ thread = null; go("home"); play("pop"); return; }
		if(s.kind === "page" && Math.abs(dx) > 50*k && Math.abs(dx) > Math.abs(dy)){ setPage(Math.max(0, Math.min(2, page + (dx < 0 ? 1 : -1)))); play("pop"); }
	}
	addEventListener("pointermove", onMove); addEventListener("pointerup", onUp); addEventListener("pointercancel", onUp);

	scrEl.addEventListener("click", e => {
		if(e.target.closest("[data-go]")){ thread = null; go(e.target.closest("[data-go]").dataset.go); play("pop"); return; }
		if(e.target.closest('[data-k="tbox"]') && running){ fast = !fast; play("pop"); hint(fast ? "Avance rapide jusqu'à 14 h ⏩" : "Retour au temps normal", 2000); return; }
		const pg = e.target.closest("[data-pg]"); if(pg){ setPage(+pg.dataset.pg); play("pop"); return; }
		const app = e.target.closest("[data-app]");
		if(app && view === "home"){
			const a = app.dataset.app; play("pop");
			if(a === "messages"){ thread = null; go("messages"); return; }
			if(a === "notes" || a === "agenda" || a === "admin"){ go(a); return; }
			if(a === "acte2" && unlocked2){ go("search"); return; }
			if(a.startsWith("acte")) return hint({ acte2:"Termine d'abord le point de 14 h avec Marc", acte3:"Acte 3 · Le budget pub brûle (bientôt)", acte4:"Acte 4 · Mail, newsletter et cookies (bientôt)" }[a]);
			if(a === "photos") return hint("Les photos de Camille… on va rester discret 🙈");
			return hint("Pas le moment : Courée a besoin de toi !");
		}
	});
	root.querySelector(".tp-x").addEventListener("click", () => close());
	function onKey(e){ if(e.key === "Escape"){ if(drag){ drag = null; ghost.style.display = "none"; $$(".lift").forEach(n => n.classList.remove("lift")); drawer.classList.remove("trash"); insEl.forEach(n => { n.style.display = "none"; }); } else close(); } }
	document.addEventListener("keydown", onKey);
	addEventListener("resize", layout);

	/* ---------- fin de l'acte : Camille appelle ---------- */
	function incomingCall(){
		const v = V("call"); go("call"); vibrate(); buzz([300, 200, 300, 200, 300]); play("chime");
		v.innerHTML = `<div class="who">Camille</div><div class="sub">appel… depuis le téléphone d'Inès</div><div class="av">C</div>
			<div class="tp-slide">Glisse pour répondre<div class="tp-knob">📞</div></div>`;
		hint("Glisse le bouton vert pour répondre", 0);
		const knob = v.querySelector(".tp-knob"), sl = v.querySelector(".tp-slide"); let st = null;
		knob.addEventListener("pointerdown", e => { st = { x:e.clientX }; knob.setPointerCapture(e.pointerId); });
		knob.addEventListener("pointermove", e => { if(!st) return; const k = scrEl.getBoundingClientRect().width/390, max = sl.offsetWidth - 76; const dx = Math.max(0, Math.min(max, (e.clientX - st.x)/k)); knob.style.left = 6 + dx + "px"; st.d = dx/max; });
		knob.addEventListener("pointerup", () => { if(st && st.d > .8) answer(); else knob.style.left = "6px"; st = null; });
	}
	function results(){
		const first = stats.done.slice(0, 30), c0 = first.length ? first.reduce((a, b) => a + b, 0)/first.length : 0, c1 = conv(40) || 0;
		return { c0, c1, stars:STARS.filter(s => c1 >= s).length };
	}
	function answer(){
		hint(""); play("good");
		const { c0, c1, stars } = results(), v = V("call");
		const L = [
			"Allô ? C'est Camille ! Inès m'a tout raconté… tu as trouvé mon téléphone sur le banc du patio 😅",
			stars >= 2 ? `Et la conversion est passée de ${pct(c0)} à ${pct(c1)} ?! J'essayais depuis des semaines. Marc est bluffé.` : stars ? `La conversion est passée de ${pct(c0)} à ${pct(c1)}. C'est déjà mieux que ce matin, merci !` : `On est passés de ${pct(c0)} à ${pct(c1)}… Le tunnel fuit encore, mais tu as vu où ça coince : c'est le plus dur.`,
			"Mauvaise nouvelle : je suis coincée à Euratech jusqu'à ce soir. Et Marc me dit que Courée a disparu de Trouvo, le moteur de recherche…",
			"Tu peux garder mon téléphone encore un peu ? 🙏"
		];
		v.innerHTML = `<div class="who" style="margin-top:90px">Camille</div><div class="sub">00:0${L.length}</div><div class="tp-lines"></div>`;
		const box = v.querySelector(".tp-lines");
		L.forEach((l, i) => later(400 + i*2300, () => { const p = document.createElement("p"); p.textContent = l; box.appendChild(p); play("pop"); }));
		later(400 + L.length*2300, () => { const p = document.createElement("p"); p.className = "next"; p.textContent = "Raccrocher et voir le bilan →"; p.addEventListener("click", finish); box.appendChild(p); });
	}
	function chart(){
		const S = stats.samples.filter(s => s[1] !== null); if(S.length < 2) return "";
		const W = 350, H = 100, X = x => 26 + Math.min(x, ACT)/ACT*(W - 34), Y = y => H - 16 - y*(H - 26);
		return `<svg class="tp-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Taux de conversion de 11 h à 14 h">
			${[0, .25, .5, .75].map(v => `<line x1="26" x2="${W - 6}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eee"/><text x="0" y="${Y(v) + 4}" font-size="9" fill="#8b879a">${Math.round(v*100)}%</text>`).join("")}
			${events.filter(e => e[0] <= ACT).map(([x, txt]) => `<line x1="${X(x)}" x2="${X(x)}" y1="6" y2="${H - 16}" stroke="#5b4bff" stroke-dasharray="3 3" stroke-opacity=".55"><title>${txt}</title></line>`).join("")}
			<polyline points="${S.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ")}" fill="none" stroke="#0f9b6c" stroke-width="2.5" stroke-linejoin="round"/>
			<text x="26" y="${H - 3}" font-size="9" fill="#8b879a">11 h</text><text x="${W - 24}" y="${H - 3}" font-size="9" fill="#8b879a">14 h</text></svg>`;
	}
	function finish(){
		const { c0, c1, stars } = results();
		onEvent && onEvent("win", MENTIONS[stars]);
		play(stars >= 2 ? "good" : "chime");
		const lost = Object.entries(stats.reasons).filter(([r]) => r !== "curieux").sort((a, b) => b[1] - a[1]);
		const tips = [];
		if(pages[0].includes("video")) tips.push(["🐢", `La vidéo 4K est restée : la fiche met ${fmtS(loadTime())} à charger. Sur mobile, chaque seconde fait fuir des visiteurs.`]);
		if(popup) tips.push(["🙅", "Le pop-up est resté : il cache le produit. La newsletter se propose après l'achat, pas avant."]);
		if(pages[1].includes("compte")) tips.push(["🔐", "Le compte obligatoire est resté. Commander en invité est l'un des leviers de conversion les plus simples."]);
		tips.push(["📍", "On rassure là où le doute apparaît : la taille au choix de la taille, les frais avant le paiement, la sécurité au paiement."]);
		tips.push(["📈", "Un chiffre bat une opinion : c'est la courbe qui a convaincu Marc."]);
		tips.splice(3);
		const v = V("end"); go("end");
		v.innerHTML = `<div class="in"><p class="k">Acte 1 terminé · le tunnel de commande</p><div class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>
			<h2>${stars === 3 ? "Tunnel réparé. Marc est bluffé." : stars ? "Le site va mieux." : "Le tunnel fuit encore."}</h2>
			<div class="tp-big"><span>${pct(c0)}</span><i>→</i><b>${pct(c1)}</b></div><p class="tp-sub">de conversion entre 11 h et 14 h · ${stats.ord} commandes</p>
			${chart()}
			<h4>À retenir</h4><ul>${tips.map(([i, s]) => `<li><i>${i}</i><span>${s}</span></li>`).join("")}</ul>
			<button class="tp-btn" data-a="act2">Acte 2 · Courée a disparu de la recherche →</button>
			<button class="tp-alt" data-a="replay">Rejouer l'acte 1</button>
			<details class="tp-more"><summary>Pourquoi les visiteurs sont partis</summary>${lost.length ? `<ul>${lost.map(([r, n]) => `<li><i>${REASONS[r][0]}</i><span style="flex:1">${REASONS[r][1]}</span><b>${n}</b></li>`).join("")}</ul>` : ""}<p>Dans la vraie vie, un site e-commerce convertit souvent 1 à 3 % de ses visiteurs, et environ 7 paniers sur 10 sont abandonnés.</p></details>
			<details class="tp-more"><summary>Le métier de Camille et les cours du master</summary><p>E-commerce manager, UX designer, chargé·e d'optimisation de la conversion (CRO), web analyst.</p><div class="tp-course"><b>📚 UX design et ergonomie</b>Observer les visiteurs, comprendre où ils bloquent, simplifier le parcours.</div><div class="tp-course"><b>📚 Web analytics</b>Lire un tunnel de conversion pour décider quoi corriger.</div></details>
			${jpoCard()}${openLead ? `<button class="tp-alt" data-a="lead">📄 Recevoir la plaquette du master</button>` : ""}
			${formation && formation.url ? `<a class="tp-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir le Master E-Business & Marketing Digital ↗</a>` : ""}
			${toggleFav ? `<button class="tp-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>` : ""}
			<button class="tp-alt" data-a="quit">Reposer le téléphone sur le banc</button></div>`;
	}
	V("end").addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return; const k = a.dataset.a;
		if(k === "act2"){ startAct2(); return; }
		if(k === "replay2"){ resetAct2(); s2.coached = 1; go("search"); s2.running = true; return; }
		if(k === "replay"){ resetAct(); story.act = 0; story.popMarc = story.convMsg = story.late = 0; go("admin"); return; }
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); openLead && openLead(); return; }
		if(k === "quit") close();
	});

	/* ---------- Acte 2 : Courée a disparu de la recherche (appli Trouvo) ---------- */
	const W2 = {
		sweat:{ t:"Sweat", k:"sweat" }, lille:{ t:"Lille", k:"lille" }, brode:{ t:"brodé", k:"brode" }, mif:{ t:"made in France", k:"mif" },
		cadeau:{ t:"cadeau", k:"cadeau" }, bio:{ t:"coton bio", k:"bio" },
		liv:{ t:"Livraison 48 h", boost:.3 }, ret:{ t:"Retours gratuits", boost:.2 }, avis:{ t:"★ 4,7 · 312 avis", boost:.45 },
		promo:{ t:"PROMO −50 % !!!", promo:1 },
		accueil:{ t:"Accueil", bad:1 }, bienv:{ t:"Bienvenue sur notre site !", bad:1 }
	};
	const STRIP2 = ["sweat", "lille", "brode", "mif", "cadeau", "bio", "liv", "ret", "avis", "promo"];
	const QUERIES = [
		{ p:[["sweat", "sweat"], ["lille", "lille"]], w:3 }, { p:[["sweat", "sweat"], ["brodé", "brode"]], w:2 }, { p:[["sweat", "sweat"], ["made in france", "mif"]], w:2 },
		{ p:[["idée", null], ["cadeau", "cadeau"], ["lille", "lille"]], w:1.5 }, { p:[["sweat", "sweat"], ["coton bio", "bio"]], w:1.5 }
	];
	QUERIES.forEach(x => { x.q = x.p.map(a => a[0]).join(" "); x.k = x.p.filter(a => a[1]).map(a => a[1]); });
	const COMPS = [
		{ u:"marche.com › mode", h:"Marché.com – Sweats homme et femme pas chers", d:"Des milliers de sweats livrés demain.", k:{ sweat:1 }, q:.9 },
		{ u:"comptoirdunord.fr", h:"Le Comptoir du Nord · Souvenirs et cadeaux de Lille", d:"Boutique de souvenirs du Vieux-Lille.", k:{ lille:1, cadeau:1 }, q:.7 },
		{ u:"ateliertricolore.fr", h:"Atelier Tricolore · Sweats made in France", d:"Fabriqués dans les Vosges depuis 1987.", k:{ sweat:1, mif:1 }, q:.7 },
		{ u:"brodeuse-et-fils.fr", h:"Brodeuse & Fils · Broderie personnalisée", d:"Brodez vos initiales sur vos vêtements.", k:{ brode:1 }, q:.6 },
		{ u:"cotonvert.fr", h:"Coton Vert · Vêtements en coton bio", d:"Mode responsable et certifiée.", k:{ bio:1 }, q:.65 },
		{ u:"lille-tourisme.fr", h:"Que faire à Lille ? · Office de tourisme", d:"Visites, musées et bonnes adresses.", k:{ lille:1 }, q:.8 },
		{ u:"forum-mode.fr › sweats", h:"Quel sweat choisir ? · Forum Mode", d:"312 réponses · discussion de 2019", k:{ sweat:.5 }, q:.5 },
		{ u:"sweatexpress.fr", h:"Sweat Express · Sweats unis à 9,90 €", d:"Basiques en promotion toute l'année.", k:{ sweat:1 }, q:.4 }
	];
	const ACT2 = 100, TITLE_MAX = 32, DESC_MAX = 80, STARS2 = [.15, .3, .45], CTR = [.3, .17, .11, .07, .05];
	let s2 = null, unlocked2 = false, stars1 = 0;
	const textOf = L => L.map(id => W2[id].t).join(" ");
	function fitList(L, max){ let n = 0, out = []; for(const id of L){ n += (out.length ? 1 : 0) + W2[id].t.length; out.push(n <= max); } return out; }
	function resetAct2(){
		const keep = s2 && s2.revealed;
		s2 = { t:0, phase:0, running:false, ended:false, title:["accueil"], desc:["bienv"], q:null, clicks:[], first:null, lastEdit:0, fast:false, best:0, tip:-99, revealed:!!keep, pos0:{}, pos1:{}, events:[], samples:[], said:new Set(), queue:[] };
	}
	function myScore(q){
		const tf = fitList(s2.title, TITLE_MAX), df = fitList(s2.desc, DESC_MAX);
		const has = k => s2.title.some((id, i) => tf[i] && W2[id].k === k) ? 1 : s2.desc.some((id, i) => df[i] && W2[id].k === k) ? .5 : 0;
		const rel = q.k.reduce((a, k) => a + has(k), 0)/q.k.length;
		let qual = .45 + (pages && !pages[0].includes("video") ? .15 : 0) + (s2.desc.includes("avis") ? .05 : 0);
		const promo = s2.title.includes("promo") || s2.desc.includes("promo");
		return rel*(promo ? .45 : 1)*.75 + qual*.25;
	}
	function ranking(q){
		const R = COMPS.map((c, i) => ({ i, s:q.k.reduce((a, k) => a + (c.k[k] || 0), 0)/q.k.length*.75 + c.q*.25 }));
		R.push({ i:"me", s:myScore(q) + .001 });
		return R.sort((a, b) => b.s - a.s).map(r => r.i);
	}
	const myPos = q => ranking(q).indexOf("me") + 1;
	function attract(){ let a = 1; for(const id of s2.desc.concat(s2.title)) if(W2[id].boost) a += W2[id].boost; return a; }
	function buildSearch(){
		const v = V("search");
		v.innerHTML = `<div class="tp-admh"><div class="t"><span class="back" data-go="home" aria-label="Accueil">‹</span><b>Trouvo</b><span class="live">EN DIRECT</span></div>
			<div class="tp-stat"><div class="cv"><b data-s="share">–</b><small data-s="delta">des clics vont chez Courée</small></div><div class="tm" data-s="tbox">avant le Black Friday<b data-s="left">4 h</b></div></div><div class="tp-tbar"><i></i></div>
			<div class="tp-sbar">🔎 <span class="q"></span><i class="cur"></i></div></div>
			<div class="tp-res">${COMPS.map((c, i) => `<div class="tp-r" data-r="${i}"><div class="u">${c.u}</div><div class="h">${c.h}</div><div class="d">${c.d}</div></div>`).join("")}
				<div class="tp-pg2">Page 2 · presque personne ne clique ici</div>
				<div class="tp-r me" data-r="me"><div class="lbl"><span>🧶 couree.fr › sweat · <b data-s="pos"></b></span><span data-s="cnt"></span></div><div class="zt"></div><div class="zd"></div></div></div>
			<div class="tp-drawer tp-wbar"><p class="cap">GLISSE DES MOTS DANS LE TITRE OU LA DESCRIPTION ↑</p><div class="tiles">${STRIP2.map(id => `<span class="tp-w${W2[id].promo ? " promo" : ""}" data-w="${id}">${W2[id].t}</span>`).join("")}</div></div>`;
		v.dataset.built = 1;
	}
	function renderMe(){
		const v = V("search"), q = s2.q, tf = fitList(s2.title, TITLE_MAX), df = fitList(s2.desc, DESC_MAX);
		const chip = (id, ok) => `<span class="tp-w${W2[id].bad ? " bad" : ""}${ok ? "" : " cut"}${q && W2[id].k && q.k.includes(W2[id].k) ? " m" : ""}" data-w="${id}" data-in="1">${W2[id].t}</span>`;
		v.querySelector(".zt").innerHTML = s2.title.map((id, i) => chip(id, tf[i])).join("") + (tf.includes(false) ? `<em>…</em>` : "") || `<em class="ph">titre vide</em>`;
		v.querySelector(".zd").innerHTML = s2.desc.map((id, i) => chip(id, df[i])).join("") || `<em class="ph">description vide</em>`;
		const n = textOf(s2.title).length, c = v.querySelector('[data-s="cnt"]'); c.textContent = `titre ${n}/${TITLE_MAX}`; c.classList.toggle("over", n > TITLE_MAX);
		v.querySelectorAll(".tp-wbar .tp-w").forEach(x => x.classList.toggle("used", s2.title.includes(x.dataset.w) || s2.desc.includes(x.dataset.w)));
	}
	function layoutRes(){
		const v = V("search"); if(!s2.q) return;
		const R = ranking(s2.q), cards = {}; v.querySelectorAll(".tp-r").forEach(n => { cards[n.dataset.r] = n; });
		const area = v.querySelector(".tp-res").clientHeight || 520; let y = 8;
		const mi = R.indexOf("me");
		R.forEach((id, i) => { if(i >= 5) return; const n = cards[id]; n.style.transform = `translateY(${y}px)`; n.style.opacity = 1; y += n.offsetHeight + 6; });
		const pg = v.querySelector(".tp-pg2"); pg.style.transform = `translateY(${y + 2}px)`; y += 26;
		if(mi >= 5){ cards.me.style.transform = `translateY(${y}px)`; cards.me.style.opacity = 1; }
		R.forEach((id, i) => { if(i >= 5 && id !== "me"){ cards[id].style.transform = `translateY(${area + 40}px)`; cards[id].style.opacity = 0; } });
		v.querySelector('[data-s="pos"]').textContent = `position ${mi + 1}`; cards.me.classList.toggle("top", mi < 3);
		// un seul signal : le premier mot recherché qui manque à Courée
		const tf = fitList(s2.title, TITLE_MAX), miss = s2.q.k.find(k => !s2.title.some((id, i) => tf[i] && W2[id].k === k));
		v.querySelector(".tp-sbar .q").innerHTML = s2.q.p.map(([w, k]) => `<span class="${k && k === miss && mi > 2 ? "miss" : ""}">${w}</span>`).join(" ");
		v.querySelectorAll(".tp-wbar .tp-w").forEach(x => x.classList.toggle("hot", mi > 2 && !!miss && W2[x.dataset.w].k === miss && !x.classList.contains("used")));
	}
	function newPhase(){
		let r = Math.random()*QUERIES.reduce((a, q) => a + q.w, 0), q = QUERIES[0]; for(const x of QUERIES){ r -= x.w; if(r <= 0){ q = x; break; } }
		s2.q = q; s2.phase = 3.4; s2.queue = [.8, 1.2, 1.6, 2.0].map(d => d + rnd(-.1, .1));
		if(!(q.q in s2.pos0)) s2.pos0[q.q] = myPos(q);
		renderMe(); layoutRes(); play("pop");
	}
	function searcher(){
		const v = V("search"), R = ranking(s2.q), a = attract();
		const w = R.map((id, i) => (i < 5 ? CTR[i] : .008)*(id === "me" ? a : 1)); let r = Math.random(), pick = -1;
		for(let i = 0; i < w.length; i++){ r -= w[i]; if(r <= 0){ pick = i; break; } }
		const d = document.createElement("div"); d.className = "tp-sdot"; const x0 = rnd(60, 330); d.style.transform = `translate(${x0}px,-10px)`; v.querySelector(".tp-res").appendChild(d);
		if(pick < 0){ requestAnimationFrame(() => { d.style.opacity = 0; }); setTimeout(() => d.remove(), 500); return; }
		const id = R[pick], me = id === "me"; s2.clicks.push(me ? 1 : 0);
		const card = v.querySelector(`.tp-r[data-r="${id}"]`), m = /translateY\(([-\d.]+)px\)/.exec(card.style.transform), y = (m ? +m[1] : 0) + 22;
		requestAnimationFrame(() => requestAnimationFrame(() => { d.style.transform = `translate(${rnd(80, 310)}px,${y}px)`; if(me) d.classList.add("ok"); }));
		setTimeout(() => { d.style.opacity = 0; if(me){ const b = document.createElement("div"); b.className = "tp-say ok"; b.textContent = "+1 visite"; b.style.left = "300px"; b.style.top = y + "px"; v.querySelector(".tp-res").appendChild(b); setTimeout(() => b.remove(), 1600); play("stamp"); } }, 750);
		setTimeout(() => d.remove(), 1300);
	}
	const share = () => { const c = s2.clicks.slice(-50); return c.length >= 8 ? c.reduce((a, b) => a + b, 0)/c.length : null; };
	function step2(dt){
		s2.t += dt; clockMin = 14*60 + 10 + Math.min(1, s2.t/ACT2)*230; battery = 22 - Math.min(1, s2.t/ACT2)*9;
		if(s2.t < ACT2){ s2.phase -= dt; s2.queue = s2.queue.filter(x => { if(3.4 - s2.phase >= x){ searcher(); return false; } return true; }); if(s2.phase <= 0) newPhase(); }
		else if(!s2.ended){ s2.ended = true; s2.running = false; later(900, endAct2); }
		if(Math.floor(s2.t) !== Math.floor(s2.t - dt)) s2.samples.push([s2.t, share()]);
		if(s2.first === null && s2.clicks.length >= 12) s2.first = s2.clicks.slice(0, 12).reduce((a, b) => a + b, 0)/12;
		tips2();
	}
	function tip2(k, txt, who = "ines"){ if(s2.said.has(k) || s2.t - s2.tip < 18) return; s2.said.add(k); s2.tip = s2.t; say(who, txt, 500); }
	function tips2(){
		const n = textOf(s2.title).length;
		if(s2.t > 4) tip2("promoMarc", "Mettez PROMO −50 % dans le titre ! Ça marche partout 😎", "marc");
		if(n > TITLE_MAX) tip2("long", "Sur mobile, Trouvo coupe les titres trop longs : les mots après le « … » ne comptent plus. Mets les plus importants au début.");
		if(s2.title.includes("promo") || s2.desc.includes("promo")) tip2("promo", "Aïe : Trouvo pénalise les titres racoleurs. On recule… On ne fait pas −50 % de toute façon 😅");
		if(myPos(QUERIES[0]) <= 3 && attract() < 1.3 && s2.t > 30) tip2("ctr", "On est bien placés ! Mais est-ce qu'on donne envie de cliquer ? Les avis ou la livraison dans la description, ça aide.");
		if(s2.t > 45 && !s2.title.includes("lille") && !s2.desc.includes("lille")) tip2("lille", "Les gens cherchent surtout « sweat lille »… et on ne dit nulle part qu'on est lillois !");
	}
	function kpis2(){
		const v = V("search"), c = share(), e = v.querySelector('[data-s="share"]'); e.textContent = c === null ? "–" : pct(c);
		const left = Math.max(0, 18*60 - clockMin), tb = v.querySelector('[data-s="tbox"]');
		v.querySelector('[data-s="left"]').textContent = left >= 60 ? `${Math.floor(left/60)} h ${String(Math.floor(left%60)).padStart(2, "0")}` : `${Math.ceil(left)} min`;
		v.querySelector(".tp-tbar i").style.width = Math.min(100, s2.t/ACT2*100) + "%"; tb.classList.toggle("urgent", left < 40); v.querySelector(".tp-tbar").classList.toggle("urgent", left < 40);
		const st = c === null || s2.clicks.length < 16 ? 0 : STARS2.filter(x => c >= x).length;
		if(st > s2.best){ s2.best = st; const w = document.createElement("div"); w.className = "tp-win";
			w.innerHTML = `<div><b>${pct(c)}</b><i>${"★".repeat(st)}${"☆".repeat(3 - st)}</i><small>${["", "Courée revient dans la recherche !", "Les visites repartent 📈", "Courée en tête des recherches !"][st]}</small></div>`;
			v.appendChild(w); setTimeout(() => w.remove(), 2500); e.classList.remove("boom"); void e.offsetWidth; e.classList.add("boom"); play("good"); buzz([30, 50, 30]); }
		tb.classList.toggle("ff", speed2() > 1);
	}
	function speed2(){ return s2.fast || (!drag2 && s2.t > 20 && (s2.t - s2.lastEdit > 10 || s2.best >= 3)) ? (s2.best >= 3 ? 5 : 3.5) : 1; }
	function edit2(txt){ s2.events.push([s2.t, txt]); s2.lastEdit = s2.t; s2.fast = false; renderMe(); layoutRes(); }
	function reveal2(){ if(s2.revealed) return; s2.revealed = true; later(600, () => { V("search").classList.add("blocks"); const b = V("search").querySelector(".tp-wbar"); b.classList.add("arrive"); later(1200, () => b.classList.remove("arrive")); play("chime"); hint("Des mots à glisser dans ton résultat", 3500); }); }
	function enterSearch(){
		if(!V("search").dataset.built){ buildSearch(); }
		if(s2.revealed) V("search").classList.add("blocks");
		pulseApp("acte2", false); badge("acte2", 0);
		requestAnimationFrame(() => { renderMe(); if(!s2.q) newPhase(); else layoutRes(); });
		if(!s2.coached){ s2.coached = 1; const c = document.createElement("div"); c.className = "tp-coach";
			c.innerHTML = `<div><h3>Trouvo, en direct</h3><p>Chaque recherche tapée sur Trouvo s'affiche en haut, et les résultats se classent selon les mots qu'ils contiennent. Presque tout le monde clique dans les 3 premiers.</p>
				<ul><li>🧶 <span>Notre résultat est tout en bas. Son titre ? « Accueil »… 🤦</span></li><li>✋ <span><b>Jette</b> les mots inutiles vers le bas, puis <b>glisse</b> les bons mots dans le titre ou la description.</span></li><li>⏩ <span>Le temps file tout seul quand tu ne touches à rien. <b>Touche le chrono</b> pour avancer.</span></li></ul>
				<button class="tp-btn" data-a="go2">Regarder les recherches</button></div>`;
			V("search").appendChild(c); c.querySelector("[data-a=go2]").addEventListener("click", () => { c.remove(); s2.running = true; play("chime"); hint("Regarde où tombe Courée… et ce que les gens tapent", 4000); }); }
		later(30000, () => { if(s2.running) reveal2(); });
	}
	// glisser-déposer des mots
	let drag2 = null, press2 = null;
	const ghost2 = document.createElement("div"); ghost2.className = "tp-ghost2"; ghost2.style.display = "none"; scrEl.appendChild(ghost2);
	V("search").addEventListener("pointerdown", e => {
		if(!s2.running) return;
		const w = e.target.closest(".tp-w"); if(!w || w.classList.contains("used") && !w.dataset.in) return;
		e.preventDefault(); press2 = { x:e.clientX, y:e.clientY, id:w.dataset.w, from:w.dataset.in ? (w.closest(".zt") ? "title" : "desc") : null };
	});
	function zoneAt(e){ const v = V("search"); for(const [z, sel] of [["title", ".zt"], ["desc", ".zd"]]){ const n = v.querySelector(sel); if(inside(e, n.getBoundingClientRect())) return z; } return null; }
	addEventListener("pointermove", e => {
		if(press2 && !drag2 && Math.hypot(e.clientX - press2.x, e.clientY - press2.y) > 6){ drag2 = press2; press2 = null; ghost2.textContent = W2[drag2.id].t; ghost2.className = "tp-ghost2" + (W2[drag2.id].bad ? " bad" : ""); ghost2.style.display = "block"; if(drag2.from) V("search").querySelector(".tp-wbar").classList.add("trash"); play("pop"); }
		if(!drag2) return;
		const [lx, ly] = local(e); ghost2.style.left = lx + "px"; ghost2.style.top = ly + "px";
		const z = zoneAt(e), v = V("search"), bar = v.querySelector(".tp-wbar");
		v.querySelector(".zt").classList.toggle("over", z === "title"); v.querySelector(".zd").classList.toggle("over", z === "desc");
		bar.classList.toggle("over", !!drag2.from && inside(e, bar.getBoundingClientRect()));
		hint(z === "title" ? "Lâche : dans le titre (c'est lui qui compte le plus)" : z === "desc" ? "Lâche : dans la description (compte moins, mais donne envie de cliquer)" : drag2.from ? "Jette-le vers le bas pour le retirer" : "Glisse-le dans le titre ou la description", 0);
	});
	addEventListener("pointerup", e => {
		press2 = null; if(!drag2) return;
		const d = drag2; drag2 = null; ghost2.style.display = "none"; hint("");
		const v = V("search"), bar = v.querySelector(".tp-wbar"); bar.classList.remove("trash", "over"); v.querySelectorAll(".over").forEach(n => n.classList.remove("over"));
		const z = zoneAt(e);
		if(d.from) s2[d.from] = s2[d.from].filter(x => x !== d.id);
		if(!z){ if(d.from){ play("pop"); edit2("−" + W2[d.id].t); if(W2[d.id].bad) reveal2(); } return; }
		const L = s2[z]; let i = L.length;
		const chips = [...v.querySelectorAll(z === "title" ? ".zt .tp-w" : ".zd .tp-w")].filter(n => n.dataset.w !== d.id);
		for(let j = 0; j < chips.length; j++){ const r = chips[j].getBoundingClientRect(); if(e.clientY < r.bottom && e.clientX < r.left + r.width/2){ i = L.indexOf(chips[j].dataset.w); break; } }
		L.splice(i < 0 ? L.length : i, 0, d.id); play("stamp"); buzz(15); edit2(`${W2[d.id].t} → ${z === "title" ? "titre" : "description"}`);
		if(W2[d.id].boost && z === "title") tip2("boostTitle", "Ça, c'est plutôt pour la description : sous le titre, ça donne envie de cliquer.");
	});
	V("search").addEventListener("click", e => { if(e.target.closest('[data-s="tbox"]') && s2.running){ s2.fast = !s2.fast; play("pop"); hint(s2.fast ? "Avance rapide jusqu'à 18 h ⏩" : "Retour au temps normal", 2000); } });
	function startAct2(){
		unlocked2 = true; stars1 = Math.max(stars1, results().stars); clockMin = 14*60 + 10; battery = 22;
		const a = $('[data-app="acte2"]'); a.classList.remove("lock"); a.insertAdjacentHTML("beforeend", "<s></s>");
		go("home"); pulseApp("admin", false); pulseApp("acte2", true); badge("acte2", 1);
		later(700, () => say("ines", "Camille avait raison : on a disparu de Trouvo 😱 Ouvre l'appli Recherche, je t'explique là-bas.", 600));
		later(1800, () => { if(view === "home") hint("Ouvre l'appli Recherche 🔎", 0); });
	}
	function endAct2(){
		const c0 = s2.first || 0, c1 = share() || 0, stars = STARS2.filter(s => c1 >= s).length;
		onEvent && onEvent("win", MENTIONS[Math.max(stars, stars1)]);
		play(stars >= 2 ? "good" : "chime");
		QUERIES.forEach(q => { s2.pos1[q.q] = myPos(q); });
		const tips = [];
		if(textOf(s2.title).length > TITLE_MAX) tips.push(["✂️", "Ton titre était trop long : sur mobile, la fin est coupée. Les mots importants se mettent au début."]);
		if(s2.title.includes("promo") || s2.desc.includes("promo")) tips.push(["🚫", "« PROMO −50 % !!! » a fait reculer Courée : les moteurs pénalisent les titres racoleurs et trompeurs."]);
		if(pages && pages[0].includes("video")) tips.push(["🐢", "La fiche produit est restée lente (la vidéo 4K) : la vitesse compte aussi pour le classement."]);
		tips.push(["🔑", "On écrit avec les mots que les gens tapent vraiment (« sweat lille »), pas avec ceux de la marque."]);
		tips.push(["👆", "Être bien placé ne suffit pas : les avis et la livraison dans la description donnent envie de cliquer."]);
		tips.splice(3);
		const v = V("end"); go("end");
		v.innerHTML = `<div class="in"><p class="k">Acte 2 terminé · le référencement</p><div class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>
			<h2>${stars === 3 ? "Courée en tête des recherches." : stars ? "Courée est de retour." : "Courée reste invisible."}</h2>
			<div class="tp-big"><span>${pct(c0)}</span><i>→</i><b>${pct(c1)}</b></div><p class="tp-sub">des clics de recherche vont chez Courée</p>
			<h4>Tes positions sur Trouvo</h4><ul>${QUERIES.map(q => `<li><i>🔎</i><span style="flex:1">${q.q}</span><span style="color:var(--mut)">${s2.pos0[q.q] || "–"}</span>&nbsp;→&nbsp;<b style="color:${s2.pos1[q.q] <= 3 ? "var(--ok)" : "var(--ink)"}">${s2.pos1[q.q]}</b></li>`).join("")}</ul>
			<h4>À retenir</h4><ul>${tips.map(([i, s]) => `<li><i>${i}</i><span>${s}</span></li>`).join("")}</ul>
			<button class="tp-btn" data-a="replay2">Rejouer l'acte 2</button>
			<details class="tp-more"><summary>Comment marche un moteur de recherche ?</summary><p>Il compare les mots tapés avec ceux des pages, surtout le titre. Il tient aussi compte de la qualité du site (vitesse, fiabilité). La description n'aide pas beaucoup le classement, mais c'est elle qui donne envie de cliquer. Dans la vraie vie, le premier résultat reçoit environ un quart à un tiers des clics.</p></details>
			<details class="tp-more"><summary>Les métiers et les cours du master</summary><p>Consultant·e SEO, content manager, traffic manager, chef·fe de projet e-commerce.</p><div class="tp-course"><b>📚 Référencement naturel (SEO)</b>Choisir ses mots-clés, optimiser titres et descriptions, suivre ses positions.</div><div class="tp-course"><b>📚 Rédaction web</b>Écrire pour les internautes et pour les moteurs.</div></details>
			<button class="tp-alt" disabled>Acte 3 · Le budget pub brûle (bientôt)</button>
			${jpoCard()}${openLead ? `<button class="tp-alt" data-a="lead">📄 Recevoir la plaquette du master</button>` : ""}
			${formation && formation.url ? `<a class="tp-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir le Master E-Business & Marketing Digital ↗</a>` : ""}
			${toggleFav ? `<button class="tp-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>` : ""}
			<button class="tp-alt" data-a="quit">Reposer le téléphone sur le banc</button></div>`;
	}
	resetAct2();

	/* ---------- boucle ---------- */
	function loop(ts){
		if(closed) return;
		const dt = Math.min(.1, (ts - (lastTs || ts))/1000); lastTs = ts;
		if(running && !ended){ const sp = speed(); let r = dt*sp; while(r > 0){ const s = Math.min(.05, r); step(s); r -= s; } kpis(); }
		if(s2.running && !s2.ended && view === "search"){ let r = dt*speed2(); while(r > 0 && !s2.ended){ const s = Math.min(.05, r); step2(s); r -= s; } kpis2(); }
		for(const p of people) p.el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
		setClock();
		raf = requestAnimationFrame(loop);
	}
	function close(){
		if(closed) return; closed = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); clearTimeout(banT); clearTimeout(hintT);
		removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp); removeEventListener("pointercancel", onUp); removeEventListener("resize", layout); document.removeEventListener("keydown", onKey);
		root.remove(); onClose && onClose();
	}

	// accroches de test (parties automatiques)
	root._tp = {
		unlock:() => { if(!unlocked) unlock(); }, go, start:() => { go("admin"); $$(".tp-coach").forEach(c => c.remove()); running = true; },
		sim:s => { running = true; for(let k = 0; k < s/.05 && !ended; k++) step(.05); kpis(); },
		place:(id, s, i) => { pages[s].splice(i, 0, id); live[id] = t; $(`.tp-tile[data-b="${id}"]`).classList.add("used"); renderPage(s); loadTime(); log(id); },
		remove:id => { if(id === "popup"){ popup = false; renderPage(0); } else { const s = screenOf(id); pages[s] = pages[s].filter(x => x !== id); renderPage(s); loadTime(); } log("-" + id); },
		state:() => ({ t, ended, view, vis:stats.vis, ord:stats.ord, conv:conv(40), first:stats.done.slice(0, 30).reduce((a, b) => a + b, 0)/30, reasons:{ ...stats.reasons }, pages:pages.map(p => p.slice()), load:loadTime() }),
		act2:() => startAct2(), reset2:() => { resetAct2(); s2.coached = 1; }, s2:() => s2, sim2:sec => { s2.running = true; for(let k = 0; k < sec/.05 && !s2.ended; k++) step2(.05); kpis2(); },
		set2:(title, desc) => { s2.title = title; s2.desc = desc; edit2("test"); }, pos2:() => QUERIES.map(q => [q.q, myPos(q)]),
		reset:() => { resetAct(); story.popMarc = story.convMsg = story.late = 0; }
	};

	resetAct(); layout(); setClock(); raf = requestAnimationFrame(loop);
	return root;
}
