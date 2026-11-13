/* Le dossier de Camille (Master E-Business & Marketing Digital).
   Un téléphone oublié vibre sur un banc jaune du patio de Wenov : c'est celui de Camille, e-commerce manager de Courée,
   une jeune marque lilloise (fictive). À 18 h, comité Black Friday en visio : Marc, le fondateur, veut −50 % sur tout
   et 30 000 € de pub sur les réseaux. Camille pensait que c'était une erreur, mais elle est coincée à Euratech.
   On fouille son téléphone pour monter un dossier de preuves, puis on contredit le comité preuve à l'appui.
   Mécaniques : recherche par mots-clés (à la Her Story), captures d'écran à cadrer, graphique trompeur à démasquer,
   assistant IA qui invente parfois, batterie comme budget, notifications à saisir au vol, navigation privée sur le site,
   et comité en appel vidéo où l'on objecte en gardant le doigt sur la personne qui parle. */
import { jpoCard } from "./jpo.js?v=c983301653";
import { palier } from "./palier.js?v=c983301653";

const CODE = "2021", T0 = 16*60 + 30, T1 = 18*60, SEC_MIN = 3, BAT0 = 50;
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];

// informations repérables dans les documents (une capture montre celles qui sont entièrement dans le cadre)
const FACTS = {
	faux:"Graphique de Marc : « +400 % » (axe tronqué)", vraie:"Vraie hausse du Black Friday 2025 : +4 %",
	prix:"Prix de vente : 52 €", fab:"Coût de fabrication : 21,50 €", cout:"Coût de revient : 32,40 € par sweat", marge:"Marge : 19,60 € (38 %)", perte:"À −50 % (26 €) : perte de 6,40 € par sweat",
	cap:"LogiNord : 800 colis par jour au maximum", delai:"Au-delà : 8 à 10 jours de délai", ret23:"Taux de retour des sweats : 23 %",
	roas_social:"ROAS réseaux sociaux : 0,8", roas_search:"ROAS annonces de recherche : 4,1", roas_mail:"ROAS e-mail aux fidèles : 9,2",
	cnil:"Cases pré-cochées : consentement non valable (RGPD)", amende:"Sanction possible : jusqu'à 4 % du CA mondial", precoche:"Bannière de Courée : tout est pré-coché",
	fideles:"Fidèles : 18 % des clients, 60 % du CA", occas:"Occasionnels : 34 % des clients, 30 % du CA", unique:"Une seule commande : 48 % des clients, 10 % du CA",
	ia8:"Assistant IA : « taux de retour ≈ 8 % » (sans source)", geo:"Assistant IA : Courée n'est jamais citée",
	stock:"Stock taille L : 140 pièces", avis:"Avis 1★ : « Trop petit, renvoyé »", mkp:"Marketplace Galerie Nord : commission 15 %"
};

// le comité : ce que chacun affirme, et la preuve qui le contredit
const PEOPLE = {
	marc:{ n:"Marc", r:"fondateur", c:"linear-gradient(135deg,#2b2f36,#6b6f7a)" },
	helene:{ n:"Hélène", r:"contrôle de gestion", c:"linear-gradient(135deg,#0f9b6c,#4cc79a)" },
	bruno:{ n:"Bruno", r:"LogiNord, logistique", c:"linear-gradient(135deg,#f08c2e,#c2492f)" },
	ines:{ n:"Inès", r:"head of growth", c:"linear-gradient(135deg,#ff7a59,#5b4bff)" }
};
const CLAIMS = [
	{ who:"marc", txt:"L'an dernier, le Black Friday a fait +400 % ! Mon graphique parle de lui-même.", need:["vraie"], course:"Web analytics", good:"Bon… +4 %. L'axe ne partait pas de zéro, d'accord. 😶", plan:null },
	{ who:"helene", txt:"Je rappelle qu'un sweat nous coûte 32,40 € à produire, emballer et livrer.", truth:1, course:"Contrôle de gestion" },
	{ who:"marc", txt:"Donc −50 % sur tout le site ! On fera du volume, et le volume, c'est de la marge.", need:["perte"], course:"Contrôle de gestion", good:"Vendre à perte… Bon, pas −50 % sur tout.", plan:"promo" },
	{ who:"bruno", txt:"Côté entrepôt, aucun souci : on suit, quel que soit le volume.", need:["cap", "stock"], course:"E-logistics", good:"Euh… oui, au-delà de 800 colis par jour, ça coince. 😬", plan:"logi" },
	{ who:"helene", txt:"Et les retours restent marginaux : 8 % d'après l'assistant IA de Camille.", need:["ret23", "avis"], trap:"ia8", course:"IA appliquée au marketing", good:"23 %… L'IA s'est trompée. Il faut traiter les problèmes de taille.", plan:"retours" },
	{ who:"ines", txt:"Nos clients fidèles font 60 % du chiffre d'affaires.", truth:1, course:"CRM" },
	{ who:"marc", txt:"Pour la pub : 30 000 € sur les réseaux sociaux. C'est là que tout se passe.", need:["roas_social"], course:"Acquisition et stratégies de croissance", good:"0,8… on perd de l'argent sur chaque euro investi ? Ah.", plan:"pub" },
	{ who:"marc", txt:"Et la bannière cookies, on garde tout pré-coché : plus de données, plus de ventes.", need:["cnil", "precoche"], course:"Droit du numérique", good:"Une sanction de la CNIL ? Non merci. On corrige la bannière.", plan:"cookies" },
	{ who:"marc", txt:"Ces histoires d'assistants IA, ça ne concerne pas une petite marque comme nous.", need:["geo"], course:"Référencement (SEO et GEO)", good:"On n'est jamais cité ? Il faut s'en occuper, alors.", plan:"geo" }
];
const PLAN = {
	promo:{ bad:["−50 % sur tout le site", -38400], good:["−20 % réservé aux clients fidèles (CRM)", 23000] },
	pub:{ bad:["30 000 € de pub sur les réseaux sociaux", -6000], good:["Budget déplacé vers la recherche et l'e-mail aux fidèles", 18000] },
	logi:{ bad:["Ventes sans limite : colis en retard, avis négatifs", -9000], good:["Ventes plafonnées à la capacité de LogiNord", 0] },
	retours:{ bad:["Retours ignorés (23 %)", -7000], good:["Guide des tailles ajouté sur la fiche", -2000] },
	cookies:{ bad:["Bannière pré-cochée : risque de sanction CNIL", -4000], good:["Bannière conforme (Refuser aussi visible qu'Accepter)", 0] },
	geo:{ bad:["Courée reste invisible pour les assistants IA", 0], good:["Fiches produits et avis travaillés pour les assistants IA", 3000] }
};
const BASE_MARGE = 12000;

// les documents du téléphone, retrouvés par la recherche
const DOCS = {
	note:{ app:"Notes", ic:"🗒️", t:"BF : contrer Marc 😬", d:"hier", k:"note notes camille black friday bf marc dossier plan comite idees",
		body:() => `<div class="dc-note"><b>BF : contrer Marc 😬</b>Marc veut −50 % sur tout et 30 000 € de pub sur les réseaux. Mauvaise idée, mais il ne croit que les chiffres.<br><br>Monter un dossier avec :<br>• la marge (tableau d'Hélène)<br>• la capacité de LogiNord (Bruno)<br>• le bilan des campagnes (rapport d'Inès)<br>• les cookies (Nadia, la juriste, m'a écrit)<br>• nos clients fidèles (CRM)<br>• et SON graphique du BF 2025, il me paraît bizarre…</div>` },
	chart:{ app:"Messages · Marc", ic:"📊", t:"Mon graphique du BF 2025 🚀", d:"hier", k:"graphique tableau bord dashboard black friday bf 2025 2024 ventes marc hausse resultats",
		body:() => `<p class="dc-meta">Marc : « Regarde mon graphique, le BF 2025 a explosé 🚀 »</p><div class="dc-chart"><svg viewBox="0 0 340 230" data-axis="1"></svg><span class="dc-f dc-faux" data-f="faux">+400 % 🚀</span><span class="dc-f dc-vraie" data-f="vraie">En réalité : 10 400 ventes contre 10 000, soit +4 %</span></div><p class="dc-meta">Ventes du Black Friday, 2024 et 2025</p>` },
	marge:{ app:"Tableur · Hélène", ic:"📗", t:"Marge par produit : sweat", d:"lundi", k:"marge tableau tableur prix cout revient rentabilite helene controle gestion promo 50 sweat",
		body:() => `<table class="dc-tab"><tr data-f="prix"><td>Prix de vente</td><td>52,00 €</td></tr><tr data-f="fab"><td>Fabrication</td><td>21,50 €</td></tr><tr><td>Logistique et emballage</td><td>6,90 €</td></tr><tr><td>Paiement et service client</td><td>4,00 €</td></tr><tr data-f="cout"><td><b>Coût de revient</b></td><td><b>32,40 €</b></td></tr><tr data-f="marge"><td>Marge</td><td>19,60 € (38 %)</td></tr><tr class="ko" data-f="perte"><td>Prix à −50 % : 26,00 €</td><td>−6,40 € / sweat</td></tr></table><p class="dc-meta">Hélène : « Mise à jour avec les nouveaux coûts de LogiNord. »</p>` },
	logi:{ app:"Mail · Bruno (LogiNord)", ic:"📦", t:"BF : capacité et retours", d:"mardi", k:"bruno loginord logistique colis capacite expedition entrepot retours retour taille delai livraison mail",
		body:() => `<div class="dc-mail"><p>Bonjour Camille,</p><p>Pour le Black Friday, nous pourrons expédier <span class="dc-f" data-f="cap">800 colis par jour au maximum</span>. <span class="dc-f" data-f="delai">Au-delà, comptez 8 à 10 jours de délai.</span></p><p>Pour info, <span class="dc-f" data-f="ret23">votre taux de retour sur les sweats est de 23 %</span>, surtout pour des problèmes de taille.</p><p>Bien à vous,<br>Bruno · LogiNord</p></div>` },
	camp:{ app:"Rapport · Inès", ic:"📈", t:"Bilan des campagnes d'octobre", d:"2 nov.", k:"rapport campagnes pub publicite roas acquisition reseaux sociaux recherche email budget ines bilan octobre",
		body:() => `<table class="dc-tab"><tr><th>Canal</th><th>Dépense</th><th>Ventes</th><th>ROAS</th></tr><tr data-f="roas_social"><td>Réseaux sociaux</td><td>12 000 €</td><td>9 600 €</td><td class="ko">0,8</td></tr><tr data-f="roas_search"><td>Annonces de recherche</td><td>3 000 €</td><td>12 300 €</td><td>4,1</td></tr><tr data-f="roas_mail"><td>E-mail aux fidèles</td><td>400 €</td><td>3 680 €</td><td class="ok">9,2</td></tr></table><p class="dc-meta">ROAS = ventes ÷ dépense. En dessous de 1, chaque euro de pub en rapporte moins d'un.</p>` },
	cnil:{ app:"Mail · Nadia (juriste)", ic:"⚖️", t:"Bannière cookies ⚠️", d:"vendredi", k:"nadia juriste cookies cookie cnil rgpd consentement banniere droit mail donnees",
		body:() => `<div class="dc-mail"><p>Camille,</p><p>La bannière du site coche tout par défaut. <span class="dc-f" data-f="cnil">Les cases pré-cochées ne valent pas consentement : il doit être libre et actif (RGPD).</span></p><p>La CNIL contrôle ce point de près. <span class="dc-f" data-f="amende">La sanction peut aller jusqu'à 4 % du chiffre d'affaires mondial.</span></p><p>Il faut un bouton « Refuser » aussi visible que « Accepter ».<br>Nadia</p></div>` },
	crm:{ app:"CRM Courée", ic:"👥", t:"Segments clients", d:"aujourd'hui", k:"crm clients client segments fideles fidelite chiffre affaires ca base",
		body:() => `<table class="dc-tab"><tr><th>Segment</th><th>Clients</th><th>CA</th></tr><tr data-f="fideles"><td>Fidèles (3 commandes et +)</td><td>18 %</td><td class="ok">60 %</td></tr><tr data-f="occas"><td>Occasionnels</td><td>34 %</td><td>30 %</td></tr><tr data-f="unique"><td>Une seule commande</td><td>48 %</td><td>10 %</td></tr></table>` },
	geo:{ app:"Photos · capture d'Inès", ic:"🤖", t:"« Quel sweat lillois acheter ? »", d:"jeudi", k:"ia assistant assistants chatbot geo visibilite reponse capture ines marque referencement photo",
		body:() => `<div class="dc-ai"><p class="q">Quel sweat lillois acheter ?</p><p>Voici trois marques appréciées : <b>Atelier Tricolore</b> (made in France), <b>Le Comptoir du Nord</b> et <b>Coton Vert</b> (coton bio).</p></div><p class="dc-meta">Inès : « <span class="dc-f" data-f="geo">J'ai testé 10 questions : Courée n'est jamais citée.</span> »</p>` },
	stock:{ app:"Notification · LogiNord", ic:"⚠️", t:"Rupture proche : taille L", d:"aujourd'hui", k:"stock taille l loginord rupture alerte notification", notif:1,
		body:() => `<div class="dc-mail"><p><span class="dc-f" data-f="stock">⚠️ Stock taille L : 140 pièces.</span> Réassort dans 3 semaines.</p></div>` },
	avis:{ app:"Notification · Avis clients", ic:"⭐", t:"Nouvel avis 1★", d:"aujourd'hui", k:"avis client retour retours taille trop petit notification", notif:1,
		body:() => `<div class="dc-mail"><p><span class="dc-f" data-f="avis">★☆☆☆☆ « Trop petit, renvoyé. Mon 3ᵉ retour… »</span></p></div>` },
	mkp:{ app:"Notification · Galerie Nord", ic:"🏬", t:"Proposition pour le Black Friday", d:"aujourd'hui", k:"marketplace galerie nord commission referencement notification black friday", notif:1,
		body:() => `<div class="dc-mail"><p><span class="dc-f" data-f="mkp">On peut vous référencer sur notre marketplace pour le Black Friday : commission de 15 %.</span></p></div>` },
	// bruit : la recherche en remonte aussi
	n1:{ app:"Mail · Maillots & Co", ic:"✉️", t:"BLACK FRIDAY : jusqu'à −70 % !", d:"aujourd'hui", k:"black friday promo newsletter mail 70 soldes" },
	n2:{ app:"Mail · Marché.com", ic:"✉️", t:"Votre Black Friday commence maintenant", d:"hier", k:"black friday promo marche commande mail" },
	n3:{ app:"Mail · Réseau Fil (pub)", ic:"✉️", t:"Boostez votre Black Friday avec la pub !", d:"hier", k:"black friday pub publicite reseaux sociaux budget campagne mail" },
	n4:{ app:"Mail · Veille juridique", ic:"✉️", t:"Les 10 sanctions CNIL de l'année", d:"lundi", k:"cnil rgpd sanctions newsletter veille droit" },
	n5:{ app:"Mail · Courée", ic:"✉️", t:"Newsletter d'octobre (envoyée)", d:"1er oct.", k:"newsletter courée email clients fideles mail" },
	n6:{ app:"Messages · Maman", ic:"💬", t:"Tu manges à la maison dimanche ?", d:"9:03", k:"maman dimanche message" },
	n7:{ app:"Mail · TER", ic:"✉️", t:"Promo week-end : Lille-Paris à 19 €", d:"lundi", k:"promo ter train billet mail" },
	n8:{ app:"Agenda", ic:"📅", t:"18:00 · Comité Black Friday (visio)", d:"aujourd'hui", k:"agenda comite black friday visio reunion marc" },
	n9:{ app:"Tableur · Hélène", ic:"📗", t:"Budget 2026 (brouillon)", d:"octobre", k:"budget tableur helene 2026 brouillon" },
	n10:{ app:"Mail · LogiNord", ic:"✉️", t:"Facture d'octobre", d:"3 nov.", k:"loginord facture logistique mail" },
	n11:{ app:"Messages · Marc", ic:"💬", t:"J'ai mis ma vidéo 4K sur la fiche 🎬", d:"lundi", k:"marc video message fiche produit" },
	n12:{ app:"Mail · Blog e-commerce", ic:"✉️", t:"5 erreurs à éviter pour votre Black Friday", d:"mardi", k:"black friday blog conseils erreurs mail ecommerce" }
};
// indices : ce qu'il faut chercher pour chaque preuve, du plus discret au plus direct
const HINTS = [
	{ need:["vraie"], doc:"chart", h:["Marc t'a envoyé un graphique hier…", "Cherche « graphique »."] },
	{ need:["perte"], doc:"marge", h:["Hélène suit la marge de chaque produit.", "Cherche « marge »."] },
	{ need:["cap", "stock"], doc:"logi", h:["L'entrepôt tiendra-t-il la cadence ?", "Cherche « colis »."] },
	{ need:["ret23", "avis"], doc:"logi", h:["Combien de sweats reviennent ? Bruno en parle.", "Cherche « retours »."] },
	{ need:["roas_social"], doc:"camp", h:["Inès a fait le bilan des campagnes.", "Cherche « roas »."] },
	{ need:["cnil", "precoche"], doc:"cnil", h:["Nadia, la juriste, a écrit à Camille.", "Cherche « cookies »."] },
	{ need:["geo"], doc:"geo", h:["Inès a testé un assistant IA…", "Cherche « assistant »."] }
];
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const rnd = (a, b) => a + Math.random()*(b - a);
const hm = m => `${Math.floor(m/60)}:${String(Math.floor(m%60)).padStart(2, "0")}`;
const eur = n => (n < 0 ? "−" : "") + Math.abs(Math.round(n)).toLocaleString("fr-FR") + " €";

const CSS = `.tp{--ink:#16141f;--ink2:#4a4759;--mut:#8b879a;--line:#e8e5f0;--soft:#f5f4f9;--vio:#96711a;--ok:#0f9b6c;--okb:#e2f6ed;--ko:#e5484d;--brick:#b23a24;--cream:#fdf8ec;
	position:fixed;inset:0;z-index:40;overflow:hidden;font:300 14px/1.45 Inter,system-ui,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none;
	background:radial-gradient(900px 600px at 70% 20%,rgba(203,151,26,.16),transparent 60%),radial-gradient(800px 700px at 20% 90%,rgba(150,113,26,.18),transparent 60%),#121019}
.tp *{box-sizing:border-box}
.tp-x{position:absolute;right:16px;top:14px;z-index:30;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer}
.tp-side{position:absolute;left:5vw;top:50%;transform:translateY(-50%);width:min(300px,26vw);color:#fdf8ec;z-index:2}
.tp-side .k{font:700 11px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#cb971a;margin:0 0 8px}
.tp-side h1{font:300 30px/1.08 Tiempos Headline,Georgia,serif;letter-spacing:-.03em;margin:0 0 12px;color:#fff}
.tp-side p{margin:0 0 10px;color:#b9b4c9;font-size:14px}
.tp-hint{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:20;background:#fff;color:var(--ink);font:300 13px Inter,system-ui,sans-serif;border-radius:999px;padding:8px 16px;box-shadow:0 10px 30px rgba(0,0,0,.35);white-space:nowrap;opacity:0;transition:opacity .3s;pointer-events:none}
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
.tp-backf .logo{position:absolute;bottom:120px;font:300 22px Tiempos Headline,Georgia,serif;color:#5d5970}
.tp-postit{width:230px;padding:22px 20px;background:#cb971a;color:#0f3168;font:300 22px/1.3 Inter,system-ui,sans-serif;transform:rotate(-4deg);box-shadow:0 14px 30px rgba(0,0,0,.35);text-align:center}
.tp-postit small{display:block;font-size:17px;margin-top:8px;text-align:right}
.tp-scr{position:relative;width:390px;height:844px;border-radius:46px;overflow:hidden;background:#000;touch-action:none}
.tp-status{position:absolute;left:0;right:0;top:0;height:46px;z-index:15;display:flex;align-items:center;justify-content:space-between;padding:6px 30px 0 34px;font:300 15px Inter,system-ui,sans-serif;color:#fff;pointer-events:none;transition:color .3s}
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
.tp-lock{background:radial-gradient(circle at 30% 20%,#cb971a,transparent 55%),radial-gradient(circle at 80% 70%,#96711a,transparent 55%),linear-gradient(160deg,#b23a24,#3b1e2c 70%);color:#fff;overflow:hidden}
.tp-lock .wp{position:absolute;left:50%;top:548px;transform:translateX(-50%);width:220px;height:200px;opacity:.9}
.tp-lock .wp:before{content:"";position:absolute;left:36px;right:36px;top:16px;bottom:0;background:#fdf8ec;border-radius:30px 30px 14px 14px}
.tp-lock .wp i{position:absolute;left:0;right:0;top:22px;height:84px;background:#fdf8ec;border-radius:28px}
.tp-lock .wp span{position:absolute;left:0;right:0;top:80px;text-align:center;font:300 19px Inter,system-ui,sans-serif;letter-spacing:.28em;color:var(--brick)}
.tp-lock .wp em{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);font:700 9.5px Inter,system-ui,sans-serif;letter-spacing:.18em;font-style:normal;color:#8c3a2a;background:#fdf8ec;border:1px solid #fdf8ec;padding:3px 8px;white-space:nowrap}
.tp-lock .date{position:absolute;left:0;right:0;top:78px;text-align:center;font:300 18px Inter,system-ui,sans-serif;text-transform:capitalize}
.tp-lock .clock{position:absolute;left:0;right:0;top:100px;text-align:center;font:300 92px/1 Inter,system-ui,sans-serif;letter-spacing:-.04em}
.tp-notifs{position:absolute;left:12px;right:12px;top:232px;display:flex;flex-direction:column;gap:8px}
.tp-nt{display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-radius:20px;padding:10px 12px;font-size:13.5px;line-height:1.35;animation:tpDrop .45s cubic-bezier(.2,.9,.3,1.2) both}
.tp-nt .ic{width:34px;height:34px;flex:none;border-radius:9px;display:grid;place-items:center;font-size:18px;background:#fff}
.tp-nt b{display:flex;justify-content:space-between;font-size:13.5px}.tp-nt b small{font-weight:500;opacity:.75;font-size:12px}
.tp-lock .swipe{position:absolute;left:0;right:0;bottom:26px;text-align:center;font:300 14px Inter,system-ui,sans-serif;opacity:.9;animation:tpBob 1.8s ease-in-out infinite}
.tp-pad{position:absolute;inset:0;background:rgba(22,14,30,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);display:flex;flex-direction:column;align-items:center;padding-top:140px;transform:translateY(100%);transition:transform .45s cubic-bezier(.3,.8,.3,1)}
.tp-pad.on{transform:none}
.tp-pad h3{margin:0 0 18px;font:300 18px Inter,system-ui,sans-serif;color:#fff}
.tp-pad .dots{display:flex;gap:16px;margin-bottom:46px}.tp-pad .dots i{width:14px;height:14px;border-radius:50%;border:1.5px solid #fff}.tp-pad .dots i.f{background:#fff}
.tp-pad .dots.err{animation:tpShake .45s}
.tp-pad .keys{display:grid;grid-template-columns:repeat(3,80px);gap:16px 26px}
.tp-pad .keys button{width:80px;height:80px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font:700 32px Inter,system-ui,sans-serif;cursor:pointer}
.tp-pad .keys button:active{background:rgba(255,255,255,.45)}
.tp-pad .keys button.e{background:none;font-size:16px}
.tp-pad .hintc{margin-top:26px;color:#fdf8ec;font:300 13.5px Inter,system-ui,sans-serif;text-align:center;padding:0 40px;min-height:40px}
/* accueil */
.tp-home{background:radial-gradient(circle at 20% 10%,#cb971a,transparent 50%),radial-gradient(circle at 90% 60%,#96711a,transparent 55%),linear-gradient(170deg,#c2492f,#2b1f3d);color:#fff}
.tp-apps{position:absolute;left:22px;right:22px;top:82px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px 10px}
.tp-app{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;position:relative;font:300 11.5px Inter,system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.35)}
.tp-app i{width:62px;height:62px;border-radius:16px;display:grid;place-items:center;font-size:30px;font-style:normal;box-shadow:0 6px 14px rgba(0,0,0,.25)}
.tp-app.lock i{filter:saturate(.3) brightness(.8)}
.tp-app.lock:after{content:"🔒";position:absolute;right:4px;top:44px;font-size:13px}
.tp-app s{position:absolute;right:2px;top:-6px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#ff3b30;color:#fff;font:300 12px/22px Inter,system-ui,sans-serif;text-decoration:none;text-align:center;display:none}
.tp-app s.on{display:block}
.tp-app.pulse i{animation:tpPulse 1.1s ease-in-out infinite}
.tp-dock{position:absolute;left:14px;right:14px;bottom:24px;height:92px;border-radius:30px;background:rgba(255,255,255,.2);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:grid;grid-template-columns:repeat(4,1fr);align-items:center;padding:0 12px}
.tp-dock .tp-app span{display:none}
/* applis génériques */
.tp-appv{background:#fff;color:var(--ink);display:flex;flex-direction:column}
.tp-ah{padding:54px 18px 10px;border-bottom:1px solid var(--line);background:#fbfbfd}
.tp-ah .back{font:300 15px Inter,system-ui,sans-serif;color:var(--vio);cursor:pointer;display:inline-block;margin-bottom:4px}
.tp-ah h2{margin:0;font:300 26px Tiempos Headline,Georgia,serif;letter-spacing:-.02em}
.tp-ab{flex:1;overflow:auto;padding:10px 16px 40px}
.tp-conv{display:flex;gap:12px;align-items:center;padding:12px 4px;border-bottom:1px solid var(--soft);cursor:pointer}
.tp-conv .av{width:46px;height:46px;border-radius:50%;flex:none;display:grid;place-items:center;font:300 16px Inter,system-ui,sans-serif;color:#fff}
.tp-conv b{display:flex;justify-content:space-between;font-size:15px}.tp-conv b small{font-weight:400;color:var(--mut);font-size:12px}
.tp-conv p{margin:0;color:var(--mut);font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:270px}
.tp-conv.unread p{color:var(--ink);font-weight:600}
.tp-th{display:flex;flex-direction:column;gap:6px;padding-top:6px}
.tp-bub{max-width:80%;padding:8px 12px;border-radius:18px;font-size:14.5px;line-height:1.4;background:#ececf2;align-self:flex-start;animation:tpUp .3s ease both}
.tp-bub.me{background:var(--vio);color:#fff;align-self:flex-end}
.tp-bub.typing{color:var(--mut)}
.tp-th small.t{align-self:center;color:var(--mut);font-size:11.5px;margin:6px 0}
.tp-chips{display:flex;flex-direction:column;gap:6px;padding:10px 14px 30px;border-top:1px solid var(--line);background:#fbfbfd}
.tp-chips button{border:1.5px solid var(--vio);background:#fff;color:var(--vio);border-radius:18px;padding:9px 14px;font:700 14px Inter,system-ui,sans-serif;text-align:left;cursor:pointer}
.tp-note{background:#fdf8ec;border-radius:14px;padding:12px 14px;margin:8px 0;font-size:14.5px;line-height:1.5;border:1px solid #fdf8ec}
.tp-note h4{margin:0 0 6px;font:300 16px Inter,system-ui,sans-serif}
.tp-ag{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--soft)}.tp-ag b{width:52px;flex:none;font:300 14px Inter,system-ui,sans-serif}.tp-ag span{flex:1;border-left:4px solid var(--vio);padding-left:10px}.tp-ag span.w{border-color:var(--ko)}.tp-ag small{display:block;color:var(--mut)}
/* bannières */
.tp-banners{position:absolute;left:8px;right:8px;top:52px;z-index:14;pointer-events:none}
.tp-ban{display:flex;gap:10px;align-items:flex-start;background:rgba(250,250,252,.96);color:var(--ink);border-radius:20px;padding:10px 12px;box-shadow:0 12px 30px rgba(0,0,0,.25);font-size:13.5px;line-height:1.35;pointer-events:auto;cursor:pointer;animation:tpDrop .4s cubic-bezier(.2,.9,.3,1.2) both}
.tp-ban.out{animation:tpLift .3s ease forwards}
.tp-ban .ic{width:34px;height:34px;flex:none;border-radius:9px;display:grid;place-items:center;font-size:18px}
.tp-ban b{display:flex;justify-content:space-between;font-size:13.5px}.tp-ban b small{font-weight:500;color:var(--mut);font-size:11.5px}
.tp-coach{position:absolute;inset:0;z-index:12;background:rgba(18,16,26,.6);display:flex;align-items:flex-end}
.tp-coach div{width:100%;background:#fff;border-radius:26px 26px 0 0;padding:22px 20px 34px;animation:tpUp .35s ease both}
.tp-coach h3{margin:0 0 6px;font:300 22px Tiempos Headline,Georgia,serif;letter-spacing:-.02em}
.tp-coach p{margin:0 0 10px;color:var(--ink2);font-size:14.5px}
.tp-coach li{list-style:none;display:flex;gap:10px;padding:6px 0;font-size:14px;color:var(--ink2)}.tp-coach ul{padding:0;margin:0 0 6px}
.tp-btn{display:flex;align-items:center;justify-content:center;width:100%;border:0;border-radius:14px;padding:14px 16px;margin-top:10px;background:var(--vio);color:#fff;font:700 15.5px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}
.tp-alt{display:flex;align-items:center;justify-content:center;width:100%;border:1px solid var(--line);border-radius:14px;padding:12px 16px;margin-top:8px;background:#fff;color:var(--ink);font:300 14.5px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}
.tp-alt[disabled]{opacity:.45;cursor:default}
/* appel */
.tp-call{background:linear-gradient(170deg,#3a2b55,#120f1c);color:#fff;text-align:center}
.tp-call .who{margin-top:150px;font:300 34px Inter,system-ui,sans-serif}.tp-call .sub{opacity:.75;margin-top:4px}
.tp-call .av{width:120px;height:120px;border-radius:50%;margin:40px auto 0;display:grid;place-items:center;font:300 46px Tiempos Headline,Georgia,serif;background:linear-gradient(135deg,#ff7a59,#96711a);animation:tpRing 1.4s ease-in-out infinite}
.tp-slide{position:absolute;left:30px;right:30px;bottom:90px;height:76px;border-radius:40px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font:300 16px Inter,system-ui,sans-serif;color:rgba(255,255,255,.8)}
.tp-knob{position:absolute;left:6px;top:6px;width:64px;height:64px;border-radius:50%;background:#2fcf6a;display:grid;place-items:center;font-size:28px;cursor:grab;touch-action:none}
.tp-lines{position:absolute;left:24px;right:24px;top:300px;display:flex;flex-direction:column;gap:10px;text-align:left}
.tp-lines p{margin:0;background:rgba(255,255,255,.12);border-radius:16px;padding:10px 14px;font-size:15px;line-height:1.45;animation:tpUp .4s ease both}
.tp-lines p.next{background:none;text-align:center;color:#fdf8ec;font-weight:600;cursor:pointer;animation:tpBob 1.6s ease-in-out infinite}
/* fin */
.tp-end{background:#fff;color:var(--ink);overflow:auto}
.tp-end .in{padding:58px 20px 40px}
.tp-end .k{font:700 11px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--vio);margin:0 0 6px}
.tp-end h2{margin:0 0 8px;font:300 26px/1.1 Tiempos Headline,Georgia,serif;letter-spacing:-.03em}
.tp-end .stars{font-size:26px;color:#cb971a;letter-spacing:3px}
.tp-cmp{display:flex;gap:8px;margin:10px 0}.tp-cmp div{flex:1;border-radius:14px;padding:8px 10px;background:var(--soft)}.tp-cmp div.ok{background:var(--okb)}.tp-cmp small{display:block;font-size:11px;color:var(--mut)}.tp-cmp b{font:300 22px Tiempos Headline,Georgia,serif}
.tp-end ul{margin:4px 0 12px;padding:0}.tp-end li{list-style:none;display:flex;gap:10px;padding:6px 0;border-top:1px solid var(--soft);font-size:13.5px;color:var(--ink2)}.tp-end li i{font-style:normal;width:22px;flex:none;text-align:center}
.tp-end h4{margin:12px 0 2px;font:300 14px Inter,system-ui,sans-serif}
.tp-chart{width:100%;height:100px;display:block;margin:4px 0 6px}
.tp-big{display:flex;align-items:baseline;gap:12px;margin:14px 0 0;font-family:Inter,system-ui,sans-serif;font-weight:300}.tp-big span{font-size:28px;font-weight:700;color:var(--mut)}.tp-big i{font-style:normal;font-size:22px;color:var(--mut)}.tp-big b{font-size:54px;line-height:1;letter-spacing:-.04em;color:var(--ok)}
.tp-sub{margin:2px 0 6px;font-size:13px;color:var(--mut)}
.tp-more{border-top:1px solid var(--soft);padding:10px 0;font-size:13.5px;color:var(--ink2)}.tp-more summary{cursor:pointer;font:700 14px Inter,system-ui,sans-serif;color:var(--ink)}.tp-more p{margin:8px 0 0}
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
@media (max-width:900px){.tp-side{display:none}}
@media (min-width:901px){.tp-hint{display:none}}
.tp-side .cur{margin-top:18px;background:#fff;color:var(--ink);font:300 15px/1.4 Inter,system-ui,sans-serif;border-radius:16px;padding:12px 16px;box-shadow:0 12px 34px rgba(0,0,0,.35);opacity:0;transform:translateX(-8px);transition:opacity .3s,transform .3s}.tp-side .cur.on{opacity:1;transform:none}
@media (max-width:560px){.tp{background:#000}.tp-x{right:8px;top:46px;width:28px;height:28px;font-size:15px;background:rgba(0,0,0,.35)}.tp-admh .t:first-child{padding-right:34px}.tp-hint{bottom:100px;font-size:12px;max-width:88vw;white-space:normal;text-align:center}}
/* --- le dossier --- */
.dc-hb{position:absolute;left:22px;right:22px;top:64px;height:46px;border-radius:16px;background:rgba(255,255,255,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;gap:10px;padding:0 16px;font:300 15px Inter,system-ui,sans-serif;color:#fff;cursor:pointer}
.dc-hb.pulse{animation:tpPulse 1.1s ease-in-out infinite}
.tp-home .tp-apps{top:132px}
.dc-srch .tp-ah{padding-bottom:12px}
.dc-in{display:flex;align-items:center;gap:8px;height:44px;border-radius:14px;background:var(--soft);padding:0 12px;margin-top:6px}
.dc-in input{flex:1;border:0;background:none;font:300 16px Inter,system-ui,sans-serif;color:var(--ink);outline:none;min-width:0}
.dc-count{font:300 12px Inter,system-ui,sans-serif;color:var(--mut);margin:10px 4px 4px}
.dc-count.many{color:#96711a}
.dc-res{display:flex;gap:12px;align-items:center;padding:11px 6px;border-bottom:1px solid var(--soft);cursor:pointer;animation:tpUp .25s ease both}
.dc-res .ic{width:40px;height:40px;flex:none;border-radius:11px;background:var(--soft);display:grid;place-items:center;font-size:20px}
.dc-res b{display:block;font-size:14.5px}.dc-res small{color:var(--mut);font-size:12px}
.dc-res.seen b:after{content:" ✓";color:var(--ok)}
.dc-tip{margin:12px 2px;padding:10px 12px;border-radius:12px;background:#fdf8ec;color:#0f3168;font:300 13px Inter,system-ui,sans-serif;animation:tpUp .3s ease both}
.dc-doc .tp-ab{padding:14px 16px 120px}
.dc-meta{font-size:12.5px;color:var(--mut);margin:8px 0}
.dc-note{background:#fdf8ec;border:1px solid #fdf8ec;border-radius:14px;padding:14px;font-size:14.5px;line-height:1.55}.dc-note b{display:block;font-size:16px;margin-bottom:6px}
.dc-mail p{margin:0 0 12px;font-size:15px;line-height:1.55}
.dc-f{border-radius:5px;transition:background .2s,box-shadow .2s}
.dc-tab{width:100%;border-collapse:collapse;font-size:14px}.dc-tab td,.dc-tab th{padding:9px 6px;border-bottom:1px solid var(--line);text-align:left}.dc-tab th{font-size:12px;color:var(--mut);font-weight:600}.dc-tab td:last-child,.dc-tab th:last-child{text-align:right}
.dc-tab .ko{color:var(--ko);font-weight:700}.dc-tab tr.ko td{color:var(--ko);font-weight:600}.dc-tab .ok{color:var(--ok);font-weight:700}
.dc-chart{position:relative;margin:4px 0;touch-action:none}.dc-chart svg{width:100%;display:block;cursor:ns-resize}
.dc-faux{position:absolute;right:28px;top:14px;font:300 20px Tiempos Headline,Georgia,serif;color:var(--ko);transform:rotate(-6deg)}
.dc-vraie{display:block;margin-top:8px;padding:8px 10px;background:var(--okb);color:#0a6b4b;font:300 13.5px Inter,system-ui,sans-serif;opacity:0;transition:opacity .4s}
.dc-vraie.on{opacity:1}
.dc-ai{background:#f3f1ff;border-radius:16px;padding:12px 14px;font-size:14.5px;line-height:1.5}.dc-ai .q{margin:0 0 8px;font-weight:600;color:var(--vio)}
.dc-ai p{margin:0}
.dc-shot{position:absolute;right:16px;bottom:34px;z-index:5;height:54px;padding:0 20px;border-radius:27px;border:0;background:var(--ink);color:#fff;font:300 15px Inter,system-ui,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.3);cursor:pointer;display:flex;align-items:center;gap:8px}
.cropping .dc-shot{display:none}
.dc-shot.hot{animation:tpPulse 1.1s ease-in-out infinite;background:var(--vio)}
/* cadrage de la capture */
.dc-crop{position:absolute;inset:0;z-index:8;touch-action:none}
.dc-frame{position:absolute;border:2px solid #fff;border-radius:6px;box-shadow:0 0 0 2000px rgba(12,10,20,.62);cursor:move;touch-action:none}
.dc-frame i{position:absolute;width:26px;height:26px;border:4px solid #fff;touch-action:none}
.dc-frame i[data-c="tl"]{left:-6px;top:-6px;border-right:0;border-bottom:0;cursor:nwse-resize}.dc-frame i[data-c="tr"]{right:-6px;top:-6px;border-left:0;border-bottom:0;cursor:nesw-resize}
.dc-frame i[data-c="bl"]{left:-6px;bottom:-6px;border-right:0;border-top:0;cursor:nesw-resize}.dc-frame i[data-c="br"]{right:-6px;bottom:-6px;border-left:0;border-top:0;cursor:nwse-resize}
.dc-cbar{position:absolute;left:12px;right:12px;bottom:30px;z-index:9;display:flex;gap:8px;align-items:center}
.dc-cbar span{flex:1;color:#fff;font:300 13px Inter,system-ui,sans-serif;text-align:center}
.dc-cbar span.warn{color:#cb971a}.dc-cbar span.okk{color:#7ff0c2}
.dc-cbar button{height:48px;border-radius:24px;border:0;padding:0 18px;font:700 15px Inter,system-ui,sans-serif;cursor:pointer}
.dc-cbar .no{background:rgba(255,255,255,.2);color:#fff}.dc-cbar .yes{background:#fff;color:var(--ink)}
.dc-in-frame{box-shadow:0 0 0 2px #7ff0c2;background:rgba(127,240,194,.18)}
.dc-flash{position:absolute;inset:0;z-index:20;background:#fff;pointer-events:none;animation:dcFlash .45s ease forwards}
@keyframes dcFlash{to{opacity:0}}
/* dossier */
.dc-cap{display:flex;gap:10px;align-items:flex-start;padding:10px;border-radius:14px;background:var(--soft);margin-bottom:8px;animation:tpUp .3s ease both}
.dc-cap .ic{font-size:20px;line-height:1.2}.dc-cap b{display:block;font-size:12px;color:var(--mut);font-weight:600}.dc-cap ul{margin:2px 0 0;padding:0}.dc-cap li{list-style:none;font-size:13.5px;line-height:1.4}
.dc-cap .x{margin-left:auto;border:0;background:none;color:var(--mut);font-size:18px;cursor:pointer;padding:0 4px}
.dc-cap.blur li{color:var(--mut)}
.dc-empty{color:var(--mut);font-size:14px;text-align:center;padding:30px 10px}
/* assistant IA */
.dc-chat{display:flex;flex-direction:column;gap:8px}
.dc-chat .me{align-self:flex-end;background:var(--vio);color:#fff;border-radius:18px;padding:8px 12px;max-width:80%;font-size:14.5px}
.dc-chat .bot{align-self:flex-start;background:#f3f1ff;border-radius:18px;padding:10px 12px;max-width:88%;font-size:14.5px;line-height:1.5;animation:tpUp .3s ease both}
.dc-chat .bot small{display:block;margin-top:6px;color:var(--mut);font-size:11.5px}
.dc-ask{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px 30px;border-top:1px solid var(--line);background:#fbfbfd}
.dc-ask button{border:1.5px solid var(--vio);background:#fff;color:var(--vio);border-radius:18px;padding:8px 12px;font:700 13.5px Inter,system-ui,sans-serif;cursor:pointer}
/* navigation privée */
.dc-web{background:#2b2833}
.dc-web .bar{padding:54px 14px 10px;display:flex;align-items:center;gap:8px;color:#fdf8ec;font:300 13px Inter,system-ui,sans-serif}
.dc-web .bar span{flex:1;background:#3b3846;border-radius:10px;padding:8px 12px;color:#fff}
.dc-site{position:absolute;left:0;right:0;top:100px;bottom:0;background:#fff;overflow:hidden}
.dc-site .hero{height:300px;background:linear-gradient(160deg,#fdf8ec,#fdf8ec);display:grid;place-items:center;font:300 26px Tiempos Headline,Georgia,serif;letter-spacing:.2em;color:var(--brick)}
.dc-ck{position:absolute;left:12px;right:12px;bottom:110px;background:#fff;border-radius:18px;box-shadow:0 -10px 40px rgba(0,0,0,.25);padding:16px;font-size:13.5px}
.dc-ck h4{margin:0 0 6px;font:300 16px Inter,system-ui,sans-serif}
.dc-ck .tg{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid var(--soft)}
.dc-ck .tg i{width:38px;height:22px;border-radius:11px;background:var(--ok);position:relative;cursor:pointer}.dc-ck .tg i:after{content:"";position:absolute;right:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:right .2s}
.dc-ck .tg i.off{background:#c9c6d4}.dc-ck .tg i.off:after{right:19px}
.dc-ck .all{display:block;width:100%;margin-top:10px;border:0;border-radius:12px;padding:12px;background:var(--brick);color:#fff;font:300 15px Inter,system-ui,sans-serif;cursor:pointer}
.dc-ck .ref{display:block;margin-top:6px;text-align:center;font-size:9.5px;color:#bbb;cursor:pointer}
/* comité en visio */
.dc-vc{background:#0f0e15;color:#fff}
.dc-vc .top{position:absolute;left:0;right:0;top:48px;padding:0 14px;display:flex;align-items:center;gap:10px;font:300 13px Inter,system-ui,sans-serif}
.dc-cred{flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.15);overflow:hidden}.dc-cred i{display:block;height:100%;background:linear-gradient(90deg,#cb971a,#5ff0b4);transition:width .5s}
.dc-grid{position:absolute;left:10px;right:10px;top:76px;height:420px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dc-tile{position:relative;border-radius:18px;overflow:hidden;background:#1d1b26;display:grid;place-items:center;transition:box-shadow .3s,transform .2s;touch-action:none;cursor:pointer;user-select:none}
.dc-tile .av{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;font:300 34px Tiempos Headline,Georgia,serif}
.dc-tile .nm{position:absolute;left:10px;bottom:8px;font:300 12.5px Inter,system-ui,sans-serif}.dc-tile .nm small{display:block;font-weight:400;color:#bdb8d0;font-size:11px}
.dc-tile.talk{box-shadow:0 0 0 3px #5ff0b4}.dc-tile.talk .av{animation:tpPulse 1.2s ease-in-out infinite}
.dc-tile.hold{transform:scale(.96);box-shadow:0 0 0 4px #cb971a}
.dc-tile .ring{position:absolute;inset:0;border-radius:18px;border:4px solid #cb971a;clip-path:inset(0 100% 0 0);pointer-events:none}
.dc-tile.hold .ring{animation:dcRing .45s linear forwards}
@keyframes dcRing{to{clip-path:inset(0 0 0 0)}}
.dc-tile.me{cursor:default}
.dc-sub{position:absolute;left:14px;right:14px;top:510px;min-height:96px;font:300 17px/1.45 Inter,system-ui,sans-serif;text-align:center}
.dc-sub b{display:block;font-size:12px;color:#bdb8d0;font-weight:600;margin-bottom:4px;letter-spacing:.04em;text-transform:uppercase}
.dc-tbar{position:absolute;left:40px;right:40px;top:630px;height:4px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden}.dc-tbar i{display:block;height:100%;background:#fff;width:0}
.dc-react{position:absolute;left:20px;right:20px;top:660px;text-align:center;font:300 14px Inter,system-ui,sans-serif;min-height:40px}
.dc-react.ok{color:#5ff0b4}.dc-react.ko{color:#ff8a8d}
.dc-sheet{position:absolute;left:0;right:0;bottom:0;z-index:10;max-height:520px;overflow:auto;background:#fff;color:var(--ink);border-radius:24px 24px 0 0;padding:16px 14px 30px;animation:tpUp .3s ease both}
.dc-sheet h3{margin:0 0 4px;font:300 18px Inter,system-ui,sans-serif}.dc-sheet p{margin:0 0 10px;color:var(--mut);font-size:13px}
.dc-sheet .dc-cap{cursor:pointer}.dc-sheet .dc-cap:hover{background:#fdf8ec}
.dc-sheet .cancel{display:block;width:100%;margin-top:6px;border:0;background:none;color:var(--mut);font:300 14px Inter,system-ui,sans-serif;padding:10px;cursor:pointer}
.dc-dead{position:absolute;inset:0;z-index:25;background:#000;color:#fff;display:grid;place-items:center;text-align:center;padding:40px;font-size:15px}
.dc-bat-low .tp-status .bat i b{background:#ff5a5f}
.dc-plan li.ok i{color:var(--ok)}.dc-plan li.ko i{color:var(--ko)}
.dc-skills{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.dc-skills span{border-radius:999px;padding:4px 10px;font:300 12px Inter,system-ui,sans-serif;background:var(--soft);color:var(--mut)}.dc-skills span.on{background:var(--okb);color:#0a6b4b}
`;

export function openDossier(opts = {}){
	const { formation, audio, isFav, toggleFav, onClose, onEvent, openLead } = opts;
	if(!document.getElementById("dc-css")){ const st = document.createElement("style"); st.id = "dc-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play && audio.play(n);
	const buzz = p => { try { if(navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch(e){} };
	const today = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });

	const root = document.createElement("div"); root.className = "tp"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu : le dossier de Camille");
	root.innerHTML = `<button class="tp-x" aria-label="Quitter le jeu">×</button>
		<div class="tp-side"><p class="k">📍 Wenov · patio, banc jaune</p><h1>Un téléphone vibre sur le banc.</h1><p>Personne autour. L'écran s'allume sans arrêt…</p><p class="cur"></p></div>
		<div class="tp-hint"></div>
		<div class="tp-wrap"><div class="tp-flip">
			<div class="tp-front"><div class="tp-scr">
				<div class="tp-island"></div>
				<div class="tp-status"><span class="tm">16:30</span><span class="r">●●●● 5G <span class="bat"><span class="pc">50 %</span><i><b style="width:50%"></b></i></span></span></div>
				<section class="tp-view tp-lock" data-v="lock">
					<div class="date">${today}</div><div class="clock">16:30</div>
					<div class="wp"><i></i><span>COURÉE</span><em>LILLE · DEPUIS 2021</em></div>
					<div class="tp-notifs"></div>
					<div class="swipe">⌃<br>Glisse vers le haut pour déverrouiller</div>
					<div class="tp-pad"><h3>Saisis le code</h3><div class="dots"><i></i><i></i><i></i><i></i></div>
						<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join("")}<button class="e" data-k="x">Annuler</button><button data-k="0">0</button><button class="e" data-k="del">Effacer</button></div>
						<div class="hintc"></div></div>
				</section>
				<section class="tp-view tp-home off" data-v="home">
					<div class="dc-hb" data-go="search">🔎 <span>Rechercher dans le téléphone</span></div>
					<div class="tp-apps">
						<div class="tp-app" data-app="dossier"><i style="background:linear-gradient(140deg,#cb971a,#cb971a)">📁</i><span>Dossier</span><s></s></div>
						<div class="tp-app" data-app="assistant"><i style="background:linear-gradient(140deg,#fdf8ec,#96711a)">✨</i><span>Assistant</span></div>
						<div class="tp-app" data-app="web"><i style="background:linear-gradient(140deg,#cb971a,#96711a)">🌐</i><span>Navigateur</span></div>
						<div class="tp-app" data-app="photos"><i style="background:linear-gradient(140deg,#fff,#fdf8ec)">🖼️</i><span>Photos</span></div>
						<div class="tp-app" data-app="agenda"><i style="background:#fff">📅</i><span>Agenda</span></div>
						<div class="tp-app" data-app="musique"><i style="background:linear-gradient(140deg,#ff9a8b,#ff5e62)">🎵</i><span>Musique</span></div>
						<div class="tp-app" data-app="reglages"><i style="background:linear-gradient(140deg,#c9c6d4,#8f8ba0)">⚙️</i><span>Réglages</span></div>
					</div>
					<div class="tp-dock"><div class="tp-app" data-app="messages"><i style="background:linear-gradient(140deg,#6ee7a0,#22b35e)">💬</i><span>Messages</span><s></s></div>
						<div class="tp-app" data-app="tel"><i style="background:linear-gradient(140deg,#6ee7a0,#22b35e)">📞</i><span>Téléphone</span></div>
						<div class="tp-app" data-app="mail"><i style="background:linear-gradient(140deg,#cb971a,#96711a)">✉️</i><span>Mail</span></div>
						<div class="tp-app" data-app="photo2"><i style="background:linear-gradient(140deg,#d9d6e3,#a9a5b8)">📷</i><span>Appareil</span></div></div>
				</section>
				<section class="tp-view tp-appv off" data-v="messages"></section>
				<section class="tp-view tp-appv dc-srch off" data-v="search"><div class="tp-ah"><span class="back" data-go="home">‹ Accueil</span><h2>Recherche</h2><label class="dc-in">🔎<input type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="marge, colis, cookies…" aria-label="Rechercher dans le téléphone"></label></div><div class="tp-ab"></div></section>
				<section class="tp-view tp-appv dc-doc off" data-v="doc"></section>
				<section class="tp-view tp-appv off" data-v="dossier"></section>
				<section class="tp-view tp-appv off" data-v="assistant"></section>
				<section class="tp-view dc-web off" data-v="web"></section>
				<section class="tp-view tp-call off" data-v="call"></section>
				<section class="tp-view dc-vc off" data-v="comite"></section>
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
	root.addEventListener("scroll", e => { const n = e.target; if(n === scrEl || n.classList && n.classList.contains("tp-view") && !n.classList.contains("tp-end")){ n.scrollTop = 0; n.scrollLeft = 0; } }, true);
	let K = 1;
	function layout(){
		const W = innerWidth, H = innerHeight, small = W <= 560;
		K = small ? Math.min(W/390, H/844) : Math.min((H - 40)/864, (W - 40)/410, 1.1);
		wrap.style.transform = `scale(${K})`;
		const front = $(".tp-front");
		if(small){ front.style.padding = "0"; front.style.background = "none"; front.style.boxShadow = "none"; scrEl.style.borderRadius = "0"; wrap.style.width = "390px"; wrap.style.height = "844px"; wrap.style.margin = "-422px 0 0 -195px"; }
		else { front.style.padding = ""; front.style.background = ""; front.style.boxShadow = ""; scrEl.style.borderRadius = ""; wrap.style.width = ""; wrap.style.height = ""; wrap.style.margin = ""; }
	}
	const local = e => { const r = scrEl.getBoundingClientRect(); return [(e.clientX - r.left)/(r.width/390), (e.clientY - r.top)/(r.height/844)]; };
	const localRect = n => { const r = n.getBoundingClientRect(), s = scrEl.getBoundingClientRect(), k = s.width/390; return { x:(r.left - s.left)/k, y:(r.top - s.top)/k, w:r.width/k, h:r.height/k }; };
	let hintT = 0;
	function hint(t, ms = 3600){ clearTimeout(hintT); const off = () => { hintEl.classList.remove("on"); sideCur.classList.remove("on"); }; if(!t) return off(); hintEl.textContent = t; sideCur.textContent = "👉 " + t; hintEl.classList.add("on"); sideCur.classList.add("on"); if(ms) hintT = setTimeout(off, ms); }
	const timers = []; let closed = false;
	const later = (ms, f) => { const id = setTimeout(() => { if(!closed) f(); }, ms); timers.push(id); return id; };

	/* ---------- état ---------- */
	let view = "lock", clockMin = T0, battery = BAT0, investigating = false, dead = false, comiteOn = false;
	const seen = new Set(), captures = []; let capSeq = 0;
	function setClock(){ $(".tp-status .tm").textContent = hm(clockMin); $(".tp-lock .clock").textContent = hm(clockMin); const b = Math.max(0, Math.round(battery)); $(".tp-status .pc").textContent = b + " %"; $(".tp-status .bat b").style.width = Math.max(3, b) + "%"; $(".tp-status .bat").classList.toggle("low", b <= 10); }
	function spend(x){ if(!investigating || dead) return; battery = Math.max(0, battery - x); setClock(); if(battery <= 0) die(); else if(battery <= 8 && !said.has("bat")){ said.add("bat"); hint("🔋 Batterie presque vide : va à l'essentiel !", 4000); buzz(80); } }
	const said = new Set();
	function go(v){
		if(v === view) return;
		const from = V(view); from && from.classList.add("off");
		view = v; V(v).classList.remove("off");
		const light = v !== "lock" && v !== "home" && v !== "call" && v !== "comite" && v !== "web";
		status.classList.toggle("dark", light); homebar.classList.toggle("dark", light);
		if(v === "messages") renderMessages();
		if(v === "search") enterSearch();
		if(v === "dossier") renderDossier();
		if(v === "assistant") renderAssistant();
		if(v === "web") renderWeb();
		lastMove = performance.now();
	}

	/* ---------- prologue : verrouillage ---------- */
	const LOCKN = [["💬", "#22b35e", "Inès", "Camille ?? Le comité Black Friday est à 18 h 😱"], ["💬", "#22b35e", "Marc (le boss)", "−50 % sur tout et 30 000 € de pub. Décision à 18 h."], ["📅", "#e5484d", "Agenda", "18:00 · Comité Black Friday (visio)"]];
	LOCKN.forEach(([ic, c, who, txt], i) => later(600 + i*1000, () => {
		const n = document.createElement("div"); n.className = "tp-nt"; n.innerHTML = `<span class="ic" style="color:${c}">${ic}</span><span><b>${who}<small>maintenant</small></b>${txt}</span>`;
		$(".tp-notifs").prepend(n); vibrate();
	}));
	later(4200, () => { if(view === "lock") hint("Glisse l'écran vers le haut pour le déverrouiller", 0); });
	function vibrate(){ flip.classList.remove("buzz"); void flip.offsetWidth; flip.classList.add("buzz"); play("pop"); buzz([40, 60, 40]); }
	let code = "", flipped = false, padOn = false, tries = 0, unlocked = false;
	const pad = $(".tp-pad");
	function showPad(on){ padOn = on; pad.classList.toggle("on", on); if(on){ hint("Il faut le code de Camille…", 0); later(9000, () => { if(!unlocked && !flipped) padHint("Les gens notent souvent leur code… regarde au dos du téléphone : glisse-le sur le côté."); }); } }
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
	function setFlip(on){ flipped = on; flip.classList.toggle("back", on); play("pop"); if(on) hint("Un post-it ! Glisse encore pour retourner le téléphone", 0); else if(!unlocked) hint(padOn ? "Tape le code" : "Glisse vers le hautpour taper le code".replace("hautpour", "haut pour"), 0); }
	function unlock(){
		unlocked = true; play("good"); buzz(30); hint(""); go("home");
		badge("messages", 2); pulseApp("messages", true);
		later(800, () => banner({ ic:"💬", c:"#22b35e", who:"Inès", txt:"Camille ? Tu as débloqué ton tel ! Réponds-moi 🙏", go:"messages" }));
		later(1500, () => { if(view === "home") hint("Ouvre Messages pour lire ce qu'Inès écrit", 0); });
	}

	/* ---------- bannières et notifications ---------- */
	let banT = 0;
	function banner({ ic, c, who, txt, go:g, keep }){
		const box = $(".tp-banners"); box.innerHTML = "";
		const b = document.createElement("div"); b.className = "tp-ban"; b.innerHTML = `<span class="ic" style="background:${c}22;color:${c}">${ic}</span><span style="flex:1"><b>${who}<small>${keep ? "glisse ↓ pour garder" : "maintenant"}</small></b>${txt}</span>`;
		if(keep) b.dataset.keep = keep;
		b.addEventListener("click", () => { if(b.dataset.drag) return; b.remove(); if(keep) return openDoc(keep); if(g === "messages"){ go("messages"); } else if(g) go(g); });
		box.appendChild(b); clearTimeout(banT); banT = setTimeout(() => { b.classList.add("out"); setTimeout(() => b.remove(), 320); }, keep ? 5200 : 3800);
		vibrate();
	}
	function badge(app, n){ $$(`[data-app="${app}"] s`).forEach(s => { s.textContent = n; s.classList.toggle("on", !!n); }); }
	function pulseApp(app, on){ $$(`[data-app="${app}"]`).forEach(a => a.classList.toggle("pulse", on)); }
	const LIVE = [[50, "stock", "⚠️", "#e5484d", "LogiNord", "Rupture proche : taille L, 140 pièces"], [105, "avis", "⭐", "#f5b301", "Avis clients", "★☆☆☆☆ « Trop petit, renvoyé. Mon 3ᵉ retour… »"], [160, "mkp", "🏬", "#5b4bff", "Galerie Nord", "On peut vous référencer pour le BF : commission 15 %"]];
	function keepNotif(id){ const facts = [...new DOMParser().parseFromString(DOCS[id].body(), "text/html").querySelectorAll("[data-f]")].map(n => n.dataset.f); addCapture(id, facts, true); }

	/* ---------- Messages ---------- */
	const THREAD = [["t", "Aujourd'hui 16:12"], ["in", "Camille ?? Le comité Black Friday est à 18 h 😱"], ["in", "Marc veut −50 % sur tout + 30 000 € de pub. Tu avais dit que tu monterais un dossier…"]];
	let chips = null, typing = false;
	function renderMessages(){
		const v = V("messages"); badge("messages", 0); pulseApp("messages", false);
		v.innerHTML = `<div class="tp-ah"><span class="back" data-go="home">‹ Accueil</span><h2>Inès</h2><small style="color:var(--mut)">head of growth chez Courée</small></div>
			<div class="tp-ab"><div class="tp-th">${THREAD.map(([w, txt]) => w === "t" ? `<small class="t">${txt}</small>` : `<div class="tp-bub ${w === "me" ? "me" : ""}">${txt}</div>`).join("")}${typing ? `<div class="tp-bub typing">…</div>` : ""}</div></div>
			${chips ? `<div class="tp-chips">${chips.opts.map((o, i) => `<button data-chip="${i}">${o}</button>`).join("")}</div>` : ""}`;
		const ab = v.querySelector(".tp-ab"); ab.scrollTop = ab.scrollHeight;
		if(!said.has("met")){ said.add("met"); later(600, () => setChips(["Ce n'est pas Camille. J'ai trouvé son téléphone sur un banc, à Wenov."], meetInes)); }
	}
	function setChips(opts, cb){ chips = { opts, cb }; if(view === "messages") renderMessages(); }
	function say(txt, delay = 900){
		return new Promise(res => {
			later(delay*.35, () => { typing = true; if(view === "messages") renderMessages(); });
			later(delay, () => { typing = false; THREAD.push(["in", txt]); if(view === "messages"){ renderMessages(); play("pop"); } else { badge("messages", 1); banner({ ic:"💬", c:"#22b35e", who:"Inès", txt, go:"messages" }); } res(); });
		});
	}
	async function meetInes(){
		await say("Quoi ?! 😳 Camille est coincée à Euratech…", 900);
		await say("Elle voulait montrer à Marc que son plan est une erreur, chiffres à l'appui. Tout est dans son téléphone : mails, tableaux, rapports.", 1700);
		await say("Tu veux bien monter le dossier ? Cherche les preuves, fais des captures d'écran, et à 18 h tu me rejoins en visio. Je dirai que tu es son stagiaire 😅", 1900);
		setChips(["OK, je m'en occupe !"], async () => {
			await say("Merci !! 🙏 Commence par la recherche, en haut de l'accueil. Essaie « black friday ».", 1000);
			startInvestigation();
		});
	}
	V("messages").addEventListener("click", e => {
		const ch = e.target.closest("[data-chip]"); if(ch && chips){ const c = chips; chips = null; THREAD.push(["me", c.opts[+ch.dataset.chip]]); renderMessages(); play("pop"); c.cb && c.cb(); }
	});

	/* ---------- l'enquête : temps, batterie, indices ---------- */
	let invT = 0, lastProgress = 0, hintLevel = 0, docOpenedAt = 0;
	function startInvestigation(){
		if(investigating) return; investigating = true; invT = 0; lastProgress = 0;
		onEvent && onEvent("stage", "L'enquête dans le téléphone");
		$(".dc-hb").classList.add("pulse"); pulseApp("dossier", false);
		if(view === "home") hint("Touche la barre de recherche en haut", 5000);
		LIVE.forEach(([at, id, ic, c, who, txt]) => later(at*1000, () => { if(investigating && !comiteOn) banner({ ic, c, who, txt, keep:id }); }));
	}
	const covered = need => captures.some(cp => !cp.blur && need.some(f => cp.facts.includes(f)));
	function nextHint(){ return HINTS.find(h => !covered(h.need)); }
	function progress(){ lastProgress = invT; hintLevel = 0; }
	function tickHints(){
		if(!investigating || comiteOn) return;
		const idle = invT - lastProgress, h = nextHint();
		if(!h){ if(!said.has("allDone")){ said.add("allDone"); say("Ton dossier a l'air complet ! Tu peux rejoindre la visio depuis l'appli Dossier, sans attendre 18 h.", 600); pulseApp("dossier", true); } return; }
		// dans un document utile mais pas encore capturé
		if(view === "doc" && curDoc && !cropOn){
			const d = curDoc, inDoc = HINTS.filter(x => !covered(x.need) && x.doc === d);
			if(d === "chart" && !axisDone && invT - docOpenedAt > 7 && hintLevel < 9){ hintLevel = 9; return hint("💡 Ce graphique part de 9 900… Fais glisser l'axe vers le bas pour le remettre à zéro.", 6000); }
			if(inDoc.length && invT - docOpenedAt > 9 && hintLevel < 8 && (d !== "chart" || axisDone)){ hintLevel = 8; $(".dc-shot") && $(".dc-shot").classList.add("hot"); return hint("💡 Il y a une preuve ici : 📸 capture-la, en cadrant juste le bon passage.", 6000); }
		}
		if(idle > 11 && hintLevel < 1){ hintLevel = 1; showTip("💡 " + h.h[0]); }
		else if(idle > 21 && hintLevel < 2){ hintLevel = 2; showTip("💡 " + h.h[1]); }
	}
	function showTip(t){ if(view !== "search") hint(t, 6000); else { const ab = V("search").querySelector(".tp-ab"), old = ab.querySelector(".dc-tip"); old && old.remove(); ab.insertAdjacentHTML("afterbegin", `<div class="dc-tip">${t}</div>`); } }
	function die(){
		dead = true; investigating = false; hint("");
		const d = document.createElement("div"); d.className = "dc-dead"; d.innerHTML = `<div>🔋 0 %<br><br>Le téléphone s'éteint…<br><br><small style="color:#aaa">Inès te prête son chargeur juste à temps pour la visio.</small></div>`;
		scrEl.appendChild(d); later(3200, () => { d.remove(); battery = 6; setClock(); incomingCall(); });
	}

	/* ---------- recherche ---------- */
	const input = V("search").querySelector("input");
	let lastQuery = "", qT = 0;
	function enterSearch(){ $(".dc-hb").classList.remove("pulse"); later(320, () => { try { input.focus({ preventScroll:true }); } catch(e){} }); renderResults(); }
	input.addEventListener("input", () => { clearTimeout(qT); qT = setTimeout(renderResults, 260); });
	input.addEventListener("keydown", e => { if(e.key === "Enter"){ clearTimeout(qT); renderResults(); input.blur(); } });
	function search(q){
		const toks = norm(q).split(/[^a-z0-9]+/).filter(x => x.length >= 2 || /\d/.test(x));
		if(!toks.length) return null;
		const res = [];
		for(const [id, d] of Object.entries(DOCS)){
			if(id === "ai") continue;
			const words = norm(d.t + " " + d.k + " " + d.app).split(/[^a-z0-9]+/);
			if(toks.every(tk => words.some(w => w.startsWith(tk)))) res.push(id);
		}
		return res;
	}
	function renderResults(){
		const q = input.value.trim(), ab = V("search").querySelector(".tp-ab"), tip = ab.querySelector(".dc-tip");
		if(!q){ ab.innerHTML = (tip ? tip.outerHTML : "") + `<p class="dc-count">Tape un mot : la recherche fouille les mails, messages, notes, tableaux et photos de Camille.</p>`; return; }
		const r = search(q) || [];
		if(norm(q) !== lastQuery){ lastQuery = norm(q); spend(.5); }
		const shown = r.slice(0, 5);
		ab.innerHTML = (tip ? tip.outerHTML : "") + `<p class="dc-count ${r.length > 5 ? "many" : ""}">${r.length ? `${r.length} résultat${r.length > 1 ? "s" : ""}${r.length > 5 ? " : seuls les 5 premiers s'affichent, précise ta recherche" : ""}` : "Aucun résultat. Essaie un autre mot."}</p>` +
			shown.map(id => { const d = DOCS[id]; return `<div class="dc-res ${seen.has(id) ? "seen" : ""}" data-doc="${id}"><span class="ic">${d.ic}</span><span><b>${d.t}</b><small>${d.app} · ${d.d}</small></span></div>`; }).join("");
	}
	V("search").addEventListener("click", e => { const r = e.target.closest("[data-doc]"); if(r){ play("pop"); openDoc(r.dataset.doc); } });

	/* ---------- lecture d'un document ---------- */
	let curDoc = null, backTo = "search", axisDone = false, axisMin = 9900;
	function openDoc(id, from){
		const d = DOCS[id]; curDoc = id; backTo = from || (view === "doc" ? backTo : view === "home" ? "home" : "search");
		if(!seen.has(id)){ seen.add(id); if(HINTS.some(h => h.doc === id && !covered(h.need))) progress(); }
		spend(.3); docOpenedAt = invT; if(hintLevel >= 8) hintLevel = 0;
		const v = V("doc");
		v.innerHTML = `<div class="tp-ah"><span class="back" data-back="1">‹ ${{ dossier:"Dossier", home:"Accueil", assistant:"Assistant", web:"Navigateur" }[backTo] || "Recherche"}</span><h2 style="font-size:21px">${d.t}</h2><small style="color:var(--mut)">${d.ic} ${d.app} · ${d.d}</small></div>
			<div class="tp-ab dc-area">${d.body ? d.body() : `<p class="dc-meta">Rien d'utile pour le comité ici.</p>`}</div>${d.body && investigating ? `<button class="dc-shot">📸 Capturer</button>` : ""}`;
		go("doc");
		if(id === "chart") drawChart();
	}
	V("doc").addEventListener("click", e => {
		if(e.target.closest("[data-back]")){ play("pop"); go(backTo); return; }
		if(e.target.closest(".dc-shot")) startCrop();
	});
	function drawChart(){
		const svg = V("doc").querySelector("svg[data-axis]"); if(!svg) return;
		const max = 10600, min = axisMin, H = 170, y0 = 196, X0 = 54, bar = (v, x, c) => { const h = Math.max(2, (v - min)/(max - min)*H); return `<rect x="${x}" y="${y0 - h}" width="86" height="${h}" rx="6" fill="${c}"/><text x="${x + 43}" y="${y0 + 18}" font-size="13" text-anchor="middle" fill="#4a4759">${x < 150 ? "BF 2024" : "BF 2025"}</text>`; };
		const ticks = [min, (min + max)/2, max].map((v, i) => `<line x1="${X0 - 4}" x2="330" y1="${y0 - i*H/2}" y2="${y0 - i*H/2}" stroke="#eee"/><text x="${X0 - 8}" y="${y0 - i*H/2 + 4}" font-size="11" text-anchor="end" fill="#8b879a">${Math.round(v).toLocaleString("fr-FR")}</text>`).join("");
		svg.innerHTML = `${ticks}<rect x="0" y="16" width="${X0}" height="${H + 10}" fill="${axisDone ? "transparent" : "rgba(91,75,255,.08)"}" rx="8"/>${axisDone ? "" : `<text x="${X0/2}" y="${y0 + 22}" font-size="10" text-anchor="middle" fill="#5b4bff">↕ axe</text>`}${bar(10000, 90, "#b9b5c6")}${bar(10400, 210, "#5b4bff")}`;
		const f = V("doc").querySelector(".dc-faux"); if(f) f.style.opacity = axisDone ? .35 : 1;
	}

	/* ---------- capture d'écran à cadrer ---------- */
	let cropOn = false, crop = null;
	function startCrop(){
		const area = V("doc").querySelector(".dc-area"); if(!area) return;
		cropOn = true; play("pop"); V("doc").classList.add("cropping");
		const r = localRect(area), last = area.lastElementChild, lb = last ? localRect(last) : r, top = Math.max(r.y, 110), bot = Math.min(r.y + r.h, lb.y + lb.h + 18, 760);
		crop = { x:14, y:top + 4, w:362, h:Math.max(120, bot - top - 8) };
		const o = document.createElement("div"); o.className = "dc-crop";
		o.innerHTML = `<div class="dc-frame"><i data-c="tl"></i><i data-c="tr"></i><i data-c="bl"></i><i data-c="br"></i></div><div class="dc-cbar"><button class="no">Annuler</button><span></span><button class="yes">Capturer</button></div>`;
		V("doc").appendChild(o); drawCrop();
		o.querySelector(".no").addEventListener("click", endCrop);
		o.querySelector(".yes").addEventListener("click", takeShot);
		if(!said.has("cropTip")){ said.add("cropTip"); hint("Ajuste le cadre avec les coins : garde seulement le passage qui prouve quelque chose", 5000); }
	}
	function factsIn(){
		const out = [];
		V("doc").querySelectorAll(".dc-area [data-f]").forEach(n => {
			if(n.classList.contains("dc-vraie") && !axisDone) return n.classList.remove("dc-in-frame");
			const r = localRect(n), ox = Math.min(r.x + r.w, crop.x + crop.w) - Math.max(r.x, crop.x), oy = Math.min(r.y + r.h, crop.y + crop.h) - Math.max(r.y, crop.y);
			const inside = r.w > 0 && ox >= r.w*.8 && oy >= r.h*.6;
			n.classList.toggle("dc-in-frame", inside); if(inside) out.push(n.dataset.f);
		});
		return out;
	}
	function drawCrop(){
		const f = V("doc").querySelector(".dc-frame"); if(!f) return;
		Object.assign(f.style, { left:crop.x + "px", top:crop.y + "px", width:crop.w + "px", height:crop.h + "px" });
		const n = factsIn().length, s = V("doc").querySelector(".dc-cbar span");
		s.textContent = n === 0 ? "Aucune info chiffrée dans le cadre" : n <= 2 ? `${n} info${n > 1 ? "s" : ""} : capture nette` : `${n} infos : trop chargé, resserre le cadre`;
		s.className = n === 0 || n > 2 ? "warn" : "okk";
	}
	function endCrop(){ cropOn = false; V("doc").classList.remove("cropping"); const o = V("doc").querySelector(".dc-crop"); o && o.remove(); V("doc").querySelectorAll(".dc-in-frame").forEach(n => n.classList.remove("dc-in-frame")); }
	function takeShot(){
		const facts = factsIn(); endCrop();
		const fl = document.createElement("div"); fl.className = "dc-flash"; scrEl.appendChild(fl); setTimeout(() => fl.remove(), 500);
		play("stamp"); buzz(20); spend(1.5);
		addCapture(curDoc, facts, false);
		$(".dc-shot") && $(".dc-shot").classList.remove("hot");
	}
	function addCapture(doc, facts, fromNotif){
		const blur = facts.length > 2;
		captures.push({ id:++capSeq, doc, facts, blur });
		badge("dossier", captures.length);
		if(HINTS.some(h => h.need.some(f => facts.includes(f))) && !blur){
			progress();
			// fin de la scène d'ouverture : la première vraie preuve est au dossier ; l'horloge et la batterie s'arrêtent pendant le palier
			if(!teased){ teased = true; later(1600, () => { paused = true; palier({ id:"telephone", onEvent, openLead, quit:close,
				titre:"Première preuve au dossier. Marc a tort, et tu commences à le prouver.",
				texte:"À 18 h, le comité Black Friday commence en visio. D'ici là : les marges, la logistique, la pub, le RGPD… et un assistant IA qui invente parfois.",
				suite:"Monter tout le dossier (≈ 7 min)" }).then(() => { paused = false; lastTs = 0; }); }); }
		}
		hint(fromNotif ? "📌 Notification gardée dans le Dossier" : facts.length === 0 ? "Capture sans info chiffrée… elle ne prouvera pas grand-chose" : blur ? "Capture trop chargée : au comité, on ne verra pas ce que tu veux montrer" : "📁 Capture ajoutée au Dossier", 3200);
		if(fromNotif) play("stamp");
	}

	/* ---------- Dossier ---------- */
	const capHTML = (cp, x) => `<div class="dc-cap ${cp.blur ? "blur" : ""}" data-cap="${cp.id}"><span class="ic">${DOCS[cp.doc].ic}</span><span style="flex:1"><b>${DOCS[cp.doc].t}${cp.blur ? " · trop chargée" : ""}</b><ul>${cp.facts.length ? cp.facts.map(f => `<li>${FACTS[f]}</li>`).join("") : `<li style="color:var(--mut)">Aucune info chiffrée</li>`}</ul></span>${x ? `<button class="x" data-del="${cp.id}" aria-label="Supprimer">✕</button>` : ""}</div>`;
	function renderDossier(){
		pulseApp("dossier", false);
		V("dossier").innerHTML = `<div class="tp-ah"><span class="back" data-go="home">‹ Accueil</span><h2>Dossier</h2><small style="color:var(--mut)">${captures.length} capture${captures.length > 1 ? "s" : ""} pour le comité de 18 h</small></div>
			<div class="tp-ab">${captures.length ? captures.map(cp => capHTML(cp, 1)).join("") : `<p class="dc-empty">Aucune capture pour l'instant.<br>Cherche des documents, puis 📸 capture les passages qui prouvent quelque chose.</p>`}
			${investigating ? `<button class="tp-btn" data-a="join">Rejoindre la visio maintenant</button><p class="dc-meta" style="text-align:center">Sinon, le comité commence à 18:00.</p>` : ""}</div>`;
	}
	V("dossier").addEventListener("click", e => {
		const del = e.target.closest("[data-del]"); if(del){ const i = captures.findIndex(c => c.id === +del.dataset.del); if(i >= 0) captures.splice(i, 1); badge("dossier", captures.length); renderDossier(); play("pop"); return; }
		const c = e.target.closest("[data-cap]"); if(c){ const cp = captures.find(x => x.id === +c.dataset.cap); if(cp) openDoc(cp.doc, "dossier"); return; }
		if(e.target.closest("[data-a=join]")){ play("pop"); incomingCall(); }
	});

	/* ---------- assistant IA ---------- */
	const AIQ = [["Résume le dossier Black Friday", "Bien sûr ! En résumé : le Black Friday 2025 a été un grand succès (+400 %), la marge est confortable et <span class=\"dc-f\" data-f=\"ia8\">le taux de retour est d'environ 8 %</span>. Le plan de Marc semble cohérent.<small>Généré à partir des documents de Camille. L'IA peut se tromper.</small>"],
		["Quel est notre taux de retour ?", "<span class=\"dc-f\" data-f=\"ia8\">Votre taux de retour est d'environ 8 %</span>, dans la moyenne du textile.<small>Estimation. Aucune source précise trouvée.</small>"],
		["Aide-moi à chercher", null]];
	const chat = [];
	function renderAssistant(){
		V("assistant").innerHTML = `<div class="tp-ah"><span class="back" data-go="home">‹ Accueil</span><h2>Assistant ✨</h2><small style="color:var(--mut)">chaque question consomme 3 % de batterie</small></div>
			<div class="tp-ab dc-area"><div class="dc-chat">${chat.map(([w, t]) => `<div class="${w}">${t}</div>`).join("") || `<p class="dc-meta">Pose une question à l'assistant de Camille.</p>`}</div></div>
			${investigating && chat.some(c => c[0] === "bot" && c[1].includes("data-f")) ? `<button class="dc-shot" data-a="aishot" style="bottom:${chat.length ? 150 : 34}px">📸 Capturer la réponse</button>` : ""}
			<div class="dc-ask">${AIQ.map(([q], i) => `<button data-q="${i}">${q}</button>`).join("")}</div>`;
		const ab = V("assistant").querySelector(".tp-ab"); ab.scrollTop = ab.scrollHeight;
	}
	V("assistant").addEventListener("click", e => {
		if(e.target.closest("[data-a=aishot]")){ play("pop"); const last = chat.filter(c => c[0] === "bot").pop(); if(last && last[1].includes("data-f")){ openDoc("ai", "assistant"); later(350, startCrop); } return; }
		const b = e.target.closest("[data-q]"); if(!b) return;
		const [q, a] = AIQ[+b.dataset.q]; chat.push(["me", q]); spend(3); play("pop");
		const h = nextHint(), ans = a || (h ? `Piste : ${h.h[0]} Essaie de chercher « ${h.h[1].replace(/.*« (.*) ».*/, "$1")} ».<small>Suggestion de l'assistant.</small>` : "Ton dossier semble complet !");
		renderAssistant(); later(700, () => { chat.push(["bot", ans]); renderAssistant(); play("pop"); if(a && investigating) aiDocShot(); });
	});
	function aiDocShot(){ if(!said.has("aiShot")){ said.add("aiShot"); hint("Tu peux aussi capturer une réponse de l'assistant… si tu lui fais confiance", 4500); } }
	// la réponse de l'IA devient un document capturable
	DOCS.ai = { app:"Assistant", ic:"✨", t:"Réponse de l'assistant", d:"à l'instant", k:"zzzz", body:() => `<div class="dc-chat">${chat.filter(c => c[0] === "bot" && c[1].includes("data-f")).slice(-1).map(([, t]) => `<div class="bot">${t}</div>`).join("")}</div>` };

	/* ---------- navigation privée sur le site ---------- */
	DOCS.web = { app:"Navigateur · couree.fr", ic:"🌐", t:"couree.fr en navigation privée", d:"à l'instant", k:"site couree navigateur banniere web navigation privee",
		body:() => `<div class="dc-ck" style="position:static;box-shadow:0 2px 10px rgba(0,0,0,.12)"><h4>🍪 Nous respectons votre vie privée</h4><div class="dc-f" data-f="precoche"><div class="tg"><span>Mesure d'audience</span><i></i></div><div class="tg"><span>Publicité ciblée</span><i></i></div><div class="tg"><span>Nos 148 partenaires</span><i></i></div></div><button class="all">Tout accepter</button><span class="ref">continuer sans accepter</span></div><p class="dc-meta">Tout est coché par défaut, et le refus est caché en tout petit.</p>` };
	function renderWeb(){
		const v = V("web"); spend(1);
		v.innerHTML = `<div class="bar">🕶️<span>couree.fr · navigation privée</span><b data-go="home" style="cursor:pointer">Fermer</b></div><div class="dc-site"><div class="hero">COURÉE</div><div class="dc-ck"><h4>🍪 Nous respectons votre vie privée</h4><p style="margin:0 0 6px;color:var(--mut)">Paramétrez vos choix :</p><div class="tg"><span>Mesure d'audience</span><i></i></div><div class="tg"><span>Publicité ciblée</span><i></i></div><div class="tg"><span>Nos 148 partenaires</span><i></i></div><button class="all">Tout accepter</button><span class="ref">continuer sans accepter</span></div></div>`;
		if(!said.has("web")){ said.add("web"); hint("Tu visites le site comme un client. Essaie de refuser les cookies…", 5000); }
	}
	V("web").addEventListener("click", e => {
		const tg = e.target.closest(".tg i"); if(tg){ tg.classList.toggle("off"); play("pop"); if(!said.has("webTg")){ said.add("webTg"); hint("Tout était coché d'office… Une preuve pour Nadia ? Le 📸 est dans la version capture.", 5000); later(1200, () => openDoc("web", "home")); } return; }
		if(e.target.closest(".all")){ play("bad"); hint("Accepté… comme 9 visiteurs sur 10 : le refus est presque invisible.", 4000); later(1400, () => openDoc("web", "home")); return; }
		if(e.target.closest(".ref")){ play("pop"); hint("Bien vu : le refus était caché en tout petit. Capture la bannière !", 4000); later(900, () => openDoc("web", "home")); }
	});

	/* ---------- 18:00 : l'appel, puis le comité ---------- */
	function incomingCall(){
		if(comiteOn) return; comiteOn = true; investigating = false; endCrop(); hint("");
		const v = V("call"); go("call"); vibrate(); buzz([300, 200, 300]); play("chime");
		v.innerHTML = `<div class="who">Inès</div><div class="sub">appel vidéo · Comité Black Friday</div><div class="av">I</div><div class="tp-slide">Glisse pour rejoindre<div class="tp-knob">📹</div></div>`;
		hint("Glisse le bouton vert pour rejoindre la visio", 0);
	}
	let cm = null;
	function startComite(){
		hint(""); go("comite"); onEvent && onEvent("stage", "Le comité de 18 h");
		cm = { i:-1, t:0, dur:0, cred:50, res:[], hold:null, sheet:false, wait:0, typed:0 };
		const v = V("comite");
		v.innerHTML = `<div class="top">Crédibilité<span class="dc-cred"><i style="width:50%"></i></span></div>
			<div class="dc-grid">${Object.entries(PEOPLE).map(([k, p]) => `<div class="dc-tile ${k === "ines" ? "" : ""}" data-p="${k}"><span class="av" style="background:${p.c}">${p.n[0]}</span><span class="nm">${p.n}<small>${p.r}</small></span><span class="ring"></span></div>`).join("")}</div>
			<div class="dc-sub"></div><div class="dc-tbar"><i></i></div><div class="dc-react"></div>`;
		const c = document.createElement("div"); c.className = "tp-coach";
		c.innerHTML = `<div><h3>Le comité, en direct</h3><p>Marc, Hélène et Bruno vont défendre le plan. Inès est de ton côté. Tu as ${captures.length} capture${captures.length > 1 ? "s" : ""} dans ton dossier.</p>
			<ul><li>✋ <span>Quand quelqu'un dit quelque chose de <b>faux</b>, <b>garde le doigt appuyé sur son visage</b>, puis montre la bonne capture.</span></li><li>⚠️ <span>Contredire une chose vraie, ou montrer une preuve à côté, te fait perdre en crédibilité.</span></li></ul>
			<button class="tp-btn" data-a="cgo">C'est parti</button></div>`;
		v.appendChild(c); c.querySelector("[data-a=cgo]").addEventListener("click", () => { c.remove(); play("chime"); nextClaim(); });
	}
	function setCred(d){ cm.cred = Math.max(0, Math.min(100, cm.cred + d)); V("comite").querySelector(".dc-cred i").style.width = cm.cred + "%"; }
	function react(txt, cls){ const r = V("comite").querySelector(".dc-react"); r.textContent = txt; r.className = "dc-react " + (cls || ""); }
	function nextClaim(){
		cm.i++; const v = V("comite");
		v.querySelectorAll(".dc-tile").forEach(n => n.classList.remove("talk"));
		if(cm.i >= CLAIMS.length) return endComite();
		const c = CLAIMS[cm.i]; cm.t = 0; cm.dur = Math.max(7, c.txt.length*.075) + 2; cm.typed = 0; cm.done = false;
		v.querySelector(`[data-p="${c.who}"]`).classList.add("talk");
		v.querySelector(".dc-sub").innerHTML = `<b>${PEOPLE[c.who].n}</b><span></span>`;
		react("");
	}
	function tickComite(dt){
		if(!cm || cm.i < 0 || cm.i >= CLAIMS.length || cm.sheet || cm.pause) return;
		const c = CLAIMS[cm.i], v = V("comite");
		cm.t += dt;
		const n = Math.min(c.txt.length, Math.floor(cm.t*38)); if(n !== cm.typed){ cm.typed = n; v.querySelector(".dc-sub span").textContent = c.txt.slice(0, n); }
		v.querySelector(".dc-tbar i").style.width = Math.min(100, cm.t/cm.dur*100) + "%";
		if(cm.t >= cm.dur && !cm.done){ cm.done = true; resolve(null); }
	}
	function resolve(cap){
		const c = CLAIMS[cm.i]; cm.pause = true; let txt, cls, wait = 2400;
		if(cap === null){
			if(c.truth){ cm.res.push({ c, r:"ok" }); txt = "✓ C'était vrai : bien de ne pas l'avoir contredit."; cls = "ok"; wait = 1300; }
			else { cm.res.push({ c, r:"missed" }); setCred(-4); txt = `Personne ne contredit ${PEOPLE[c.who].n}… c'est noté dans le plan.`; cls = "ko";
				if(!said.has("noObj")){ said.add("noObj"); txt += " (Inès, en privé : « Appuie longuement sur la personne qui parle pour la contredire ! »)"; wait = 4200; } }
		} else if(c.truth){ cm.res.push({ c, r:"wrong" }); setCred(-12); txt = `${PEOPLE[c.who].n} : « Mais… c'est exact, ce que je dis. » 😐`; cls = "ko"; play("bad"); }
		else {
			const f = cap.facts, good = !cap.blur && c.need.some(x => f.includes(x));
			if(good){ cm.res.push({ c, r:"won" }); setCred(+8); txt = `✋ Objection retenue ! ${PEOPLE[c.who].n} : « ${c.good} »`; cls = "ok"; play("good"); buzz([20, 40, 20]); wait = 3400; }
			else if(c.trap && f.includes(c.trap)){ cm.res.push({ c, r:"trap" }); setCred(-15); txt = "Hélène : « C'est justement le chiffre de l'IA… sans source. » Tu as montré la même erreur. 😬"; cls = "ko"; play("bad"); wait = 3600; }
			else if(cap.blur){ cm.res.push({ c, r:"blur" }); setCred(-8); txt = "Marc : « On ne voit rien sur ta capture, il y a trop de chiffres. »"; cls = "ko"; play("bad"); }
			else { cm.res.push({ c, r:"off" }); setCred(-8); txt = "Marc : « Et alors ? Ça ne prouve pas ce que tu dis. »"; cls = "ko"; play("bad"); }
		}
		react(txt, cls);
		later(wait, () => { cm.pause = false; nextClaim(); });
	}
	function openSheet(){
		cm.sheet = true;
		const s = document.createElement("div"); s.className = "dc-sheet";
		s.innerHTML = `<h3>✋ Objection ! Quelle preuve montres-tu ?</h3><p>${PEOPLE[CLAIMS[cm.i].who].n} : « ${CLAIMS[cm.i].txt} »</p>${captures.length ? captures.map(cp => capHTML(cp, 0)).join("") : `<p class="dc-empty">Ton dossier est vide…</p>`}<button class="cancel">Finalement, je ne dis rien</button>`;
		V("comite").appendChild(s);
		s.addEventListener("click", e => {
			const c = e.target.closest("[data-cap]");
			if(c){ const cp = captures.find(x => x.id === +c.dataset.cap); s.remove(); cm.sheet = false; cm.done = true; resolve(cp); return; }
			if(e.target.closest(".cancel")){ s.remove(); cm.sheet = false; }
		});
	}
	function endComite(){
		const won = cm.res.filter(r => r.r === "won").length, errs = cm.res.filter(r => ["wrong", "trap"].includes(r.r)).length;
		const sub = V("comite").querySelector(".dc-sub");
		V("comite").querySelector(`[data-p="marc"]`).classList.add("talk");
		sub.innerHTML = `<b>Marc</b><span>${won >= 6 ? "Bon… Les chiffres sont têtus. On fait comme vous dites. Bravo au stagiaire 😤" : won >= 3 ? "D'accord sur certains points. Pour le reste, on garde mon plan." : "Je ne suis pas convaincu. On garde mon plan."}</span>`;
		later(3800, () => finish(won, errs));
	}

	/* ---------- bilan ---------- */
	function finish(won, errs){
		const stars = Math.max(0, Math.min(3, won >= 6 && errs === 0 ? 3 : won >= 4 ? 2 : won >= 2 ? 1 : 0) - (errs >= 2 ? 1 : 0));
		onEvent && onEvent("win", MENTIONS[stars]);
		play(stars >= 2 ? "good" : "chime");
		const wonPlan = new Set(cm.res.filter(r => r.r === "won" && r.c.plan).map(r => r.c.plan));
		const items = Object.entries(PLAN).map(([k, p]) => { const ok = wonPlan.has(k); return { ok, t:ok ? p.good[0] : p.bad[0], v:ok ? p.good[1] : p.bad[1] }; });
		const marge = BASE_MARGE + items.reduce((a, x) => a + x.v, 0);
		const skills = [...new Set(CLAIMS.filter(c => !c.truth).map(c => c.course))];
		const okSkills = new Set(cm.res.filter(r => r.r === "won").map(r => r.c.course));
		const v = V("end"); go("end");
		v.innerHTML = `<div class="in"><p class="k">Comité Black Friday · le dossier de Camille</p><div class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>
			<h2>${stars === 3 ? "Dossier imparable. Marc change de plan." : stars ? "Le plan de Marc est en partie corrigé." : "Marc garde son plan."}</h2>
			<div class="tp-big"><b style="color:${marge >= 0 ? "var(--ok)" : "var(--ko)"}">${eur(marge)}</b></div><p class="tp-sub">de marge prévue pour le Black Friday · ${won} objection${won > 1 ? "s" : ""} gagnée${won > 1 ? "s" : ""} sur 7 · crédibilité ${Math.round(cm.cred)} %</p>
			<h4>Le plan retenu</h4><ul class="dc-plan">${items.map(x => `<li class="${x.ok ? "ok" : "ko"}"><i>${x.ok ? "✓" : "✗"}</i><span style="flex:1">${x.t}</span><b>${x.v ? eur(x.v) : ""}</b></li>`).join("")}</ul>
			<h4>Les cours du master que tu as mobilisés</h4><div class="dc-skills">${skills.map(s => `<span class="${okSkills.has(s) ? "on" : ""}">${okSkills.has(s) ? "✓ " : ""}${s}</span>`).join("")}</div>
			<button class="tp-btn" data-a="replay">Rejouer le comité avec ton dossier</button>
			<button class="tp-alt" data-a="restart">Recommencer l'enquête</button>
			<details class="tp-more"><summary>Ce qu'il fallait trouver</summary><ul>${CLAIMS.map((c, i) => { const r = cm.res[i]; return `<li><i>${c.truth ? "✓" : r && r.r === "won" ? "✓" : "✗"}</i><span>${c.truth ? `<b>Vrai</b> : « ${c.txt} » (il ne fallait pas contredire)` : `« ${c.txt} » → ${c.need.map(f => FACTS[f]).join(" ou ")}`}</span></li>`; }).join("")}</ul></details>
			<details class="tp-more"><summary>Le métier de Camille, et les tiens peut-être</summary><p>E-commerce manager, responsable marketing digital, traffic manager, data analyst marketing, chef·fe de projet e-business, consultant·e SEO et GEO.</p><div class="tp-course"><b>📚 Un master en alternance, 2 ans</b>UX, référencement et GEO, web analytics, CRM, e-logistique, droit du numérique, IA appliquée, stratégie digitale, business game…</div></details>
			${jpoCard()}${openLead ? `<button class="tp-alt" data-a="lead">📄 Recevoir la plaquette du master</button>` : ""}
			${formation && formation.url ? `<a class="tp-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir le Master E-Business & Marketing Digital ↗</a>` : ""}
			${toggleFav ? `<button class="tp-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>` : ""}
			<button class="tp-alt" data-a="quit">Reposer le téléphone sur le banc</button></div>`;
	}
	V("end").addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return; const k = a.dataset.a;
		if(k === "replay"){ startComite(); return; }
		if(k === "restart"){ const o = opts; close(); openDossier(o); return; }
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); openLead && openLead(); return; }
		if(k === "quit") close();
	});

	/* ---------- gestes ---------- */
	let g = null, lastMove = 0;
	scrEl.addEventListener("pointerdown", e => {
		lastMove = performance.now();
		if(view === "lock" && !unlocked){ g = { kind:"lock", x:e.clientX, y:e.clientY }; return; }
		if(e.target.closest(".tp-homebar")){ g = { kind:"home", x:e.clientX, y:e.clientY }; return; }
		const ban = e.target.closest(".tp-ban[data-keep]"); if(ban){ g = { kind:"notif", x:e.clientX, y:e.clientY, n:ban }; return; }
		if(view === "call"){ const k = e.target.closest(".tp-knob"); if(k){ e.preventDefault(); g = { kind:"knob", x:e.clientX, n:k, d:0 }; } return; }
		if(view === "doc" && cropOn){ const c = e.target.closest(".dc-frame i"), f = e.target.closest(".dc-frame"); if(c || f){ e.preventDefault(); const [lx, ly] = local(e); g = { kind:"crop", c:c ? c.dataset.c : "move", lx, ly, o:{ ...crop } }; } return; }
		if(view === "doc" && curDoc === "chart" && e.target.closest(".dc-chart svg")){ e.preventDefault(); g = { kind:"axis", y:e.clientY, m:axisMin }; return; }
		if(view === "comite" && cm && !cm.sheet && !cm.pause){ const t = e.target.closest(".dc-tile"); if(t){ e.preventDefault(); const who = t.dataset.p; t.classList.add("hold"); g = { kind:"hold", who, n:t, id:later(450, () => holdDone(who, t)) }; } }
	});
	$(".tp-backf").addEventListener("pointerdown", e => { g = { kind:"back", x:e.clientX, y:e.clientY }; });
	function holdDone(who, t){
		t.classList.remove("hold"); if(!g || g.kind !== "hold") return; g = null;
		const c = CLAIMS[cm.i];
		if(!c || cm.pause){ return; }
		if(c.who !== who){ react(`Attends que ${PEOPLE[who].n} parle pour la contredire.`, ""); return; }
		play("pop"); buzz(30); openSheet();
	}
	addEventListener("pointermove", onMove); addEventListener("pointerup", onUp); addEventListener("pointercancel", onUp);
	function onMove(e){
		if(!g) return; const k = scrEl.getBoundingClientRect().width/390;
		if(g.kind === "crop"){
			const [lx, ly] = local(e), dx = lx - g.lx, dy = ly - g.ly, o = g.o, M = 40;
			let { x, y, w, h } = o;
			if(g.c === "move"){ x = o.x + dx; y = o.y + dy; }
			if(g.c.includes("l")){ x = Math.min(o.x + o.w - M, o.x + dx); w = o.w + (o.x - x); }
			if(g.c.includes("r")) w = Math.max(M, o.w + dx);
			if(g.c.includes("t")){ y = Math.min(o.y + o.h - M, o.y + dy); h = o.h + (o.y - y); }
			if(g.c.includes("b")) h = Math.max(M, o.h + dy);
			x = Math.max(4, Math.min(386 - w, x)); y = Math.max(96, Math.min(780 - h, y));
			crop = { x, y, w:Math.min(w, 382), h:Math.min(h, 680) }; drawCrop(); return;
		}
		if(g.kind === "axis"){
			const dy = (e.clientY - g.y)/k; axisMin = Math.max(0, Math.min(9900, g.m - dy*70)); drawChart();
			if(axisMin <= 400 && !axisDone){ axisDone = true; axisMin = 0; drawChart(); V("doc").querySelector(".dc-vraie").classList.add("on"); play("good"); buzz(30); hint("Les deux barres sont presque pareilles : la vraie hausse n'est que de +4 % !", 5000); progress(); }
			return;
		}
		if(g.kind === "knob"){ const sl = V("call").querySelector(".tp-slide"), max = sl.offsetWidth - 76; g.d = Math.max(0, Math.min(max, (e.clientX - g.x)/k)); g.n.style.left = 6 + g.d + "px"; g.p = g.d/max; return; }
		if(g.kind === "notif"){ const dy = (e.clientY - g.y)/k; if(dy > 6){ g.n.dataset.drag = 1; g.n.style.transform = `translateY(${Math.min(80, dy)}px)`; } return; }
		if(g.kind === "hold" && Math.hypot(e.clientX - (g.x || e.clientX), 0) > 30){ /* tolérance */ }
	}
	function onUp(e){
		if(!g) return; const s = g; g = null; const k = scrEl.getBoundingClientRect().width/390;
		if(s.kind === "hold"){ clearTimeout(s.id); s.n.classList.remove("hold"); return; }
		if(s.kind === "knob"){ if(s.p > .8) startComite(); else s.n.style.left = "6px"; return; }
		if(s.kind === "notif"){ const dy = (e.clientY - s.y)/k; if(dy > 40){ const id = s.n.dataset.keep; s.n.remove(); keepNotif(id); } else { s.n.style.transform = ""; setTimeout(() => { delete s.n.dataset.drag; }, 50); } return; }
		if(s.kind === "crop" || s.kind === "axis") return;
		const dx = e.clientX - s.x, dy = e.clientY - s.y;
		if(s.kind === "lock"){ if(Math.abs(dx) > 60*k && Math.abs(dx) > Math.abs(dy)) return setFlip(true); if(-dy > 60*k && !padOn) return showPad(true); }
		if(s.kind === "back" && (Math.abs(dx) > 40*k || Math.hypot(dx, dy) < 6)) return setFlip(false);
		if(s.kind === "home" && (-dy > 20*k || Math.hypot(dx, dy) < 8) && unlocked && !["call", "comite", "end"].includes(view)){ endCrop(); go("home"); play("pop"); }
	}
	scrEl.addEventListener("click", e => {
		const gg = e.target.closest("[data-go]"); if(gg && view !== "comite"){ go(gg.dataset.go); play("pop"); return; }
		const app = e.target.closest("[data-app]");
		if(app && view === "home"){
			const a = app.dataset.app; play("pop");
			if(a === "messages") return go("messages");
			if(!investigating && !comiteOn) return hint("Lis d'abord les messages d'Inès");
			if(a === "dossier" || a === "assistant" || a === "web") return go(a);
			if(a === "mail" || a === "agenda" || a === "photos") return hint("Tout est mélangé ici… utilise plutôt la recherche en haut 🔎");
			return hint("Pas le moment : le comité est à 18 h !");
		}
	});
	root.querySelector(".tp-x").addEventListener("click", () => close());
	function onKey(e){ if(e.key === "Escape"){ if(cropOn) endCrop(); else close(); } }
	document.addEventListener("keydown", onKey);
	addEventListener("resize", layout);

	/* ---------- boucle ---------- */
	let raf = 0, lastTs = 0, acc = 0, paused = false, teased = false;
	function loop(ts){
		if(closed) return;
		const dt = Math.min(.1, (ts - (lastTs || ts))/1000); lastTs = ts;
		if(investigating && !dead && !paused){
			invT += dt; clockMin = Math.min(T1, T0 + invT/SEC_MIN); battery -= dt*.03; if(battery <= 0) die();
			acc += dt; if(acc > .5){ acc = 0; setClock(); tickHints(); }
			if(clockMin >= T1) incomingCall();
		}
		if(view === "comite") tickComite(dt);
		raf = requestAnimationFrame(loop);
	}
	function close(){
		if(closed) return; closed = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); clearTimeout(banT); clearTimeout(hintT);
		removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp); removeEventListener("pointercancel", onUp); removeEventListener("resize", layout); document.removeEventListener("keydown", onKey);
		root.remove(); onClose && onClose();
	}
	// accroches de test
	root._dc = {
		unlock:() => { if(!unlocked) unlock(); }, go, investigate:() => { said.add("met"); startInvestigation(); }, search:q => search(q), open:id => openDoc(id),
		shot:facts => addCapture(curDoc || "note", facts, false), axis:() => { axisDone = true; axisMin = 0; drawChart(); }, call:() => incomingCall(), comite:() => startComite(),
		object:i => { const cp = captures.find(x => x.id === i); cm.sheet = false; cm.done = true; resolve(cp || null); },
		state:() => ({ view, clockMin, battery, invT, captures:captures.map(c => ({ doc:c.doc, facts:c.facts, blur:c.blur })), cm:cm && { i:cm.i, cred:cm.cred, res:cm.res.map(r => r.r) } }), skip:s => { invT += s; }
	};
	layout(); setClock(); raf = requestAnimationFrame(loop);
	onEvent && onEvent("start");      // le jeu s'ouvre déjà à chaud : un téléphone qui vibre sur un banc
	return root;
}
