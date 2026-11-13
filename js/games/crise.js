/* « La cellule de crise » — mini-jeu de la Licence Management & Humanités (FGES), refonte du 12/11/2026.
   Un dossier unique, du début à la fin : la Chocolaterie Verbrugge (fictive, Roubaix) a laissé partir un lot de
   boîtes mal scellées, une vidéo tourne. En quelques heures, il faut comprendre, décider, tenir l'équipe, parler au public.
   Toute la crise se vit dans le groupe « Cellule de crise » du smartphone ; la salle du conseil, en plein jour, réagit :
   l'écran TV, les collègues assis à la table, les bustes des philosophes.
   Quatre moments, chacun avec le geste du métier (aucun glisser-déposer, aucune réponse à choisir dans une liste) :
     1. trier l'info : ouvrir chaque message, vérifier auteur, source, date, photo, recouper un chiffre avec un fait,
        puis l'épingler comme fait, ou le signaler comme rumeur en touchant la ligne qui le prouve ;
     2. décider : composer le plan de rappel zone par zone, voir en direct le coût, le risque et l'avis des philosophes ;
     3. tenir l'équipe : corriger le brouillon de la directrice (rayer, réécrire) en voyant chacun réagir ;
     4. parler au public : doser l'émotion, citer ses faits, s'engager et signer, pendant que les commentaires réagissent.
   Entreprise, personnes et chiffres fictifs. Contenu à relire par l'équipe pédagogique (docs/validation-licence-mh.md). */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { jpoCard } from "./jpo.js?v=50ccfe85e2";
import { palier } from "./palier.js?v=50ccfe85e2";

const SPEED = /[?&]vite/.test(location.search) ? 6 : 1;      // ?vite : tout va 6 fois plus vite (tests automatiques)
const MOBILE = 760;
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];
const SKIN = "#e8c3a0";

const COURSES = {
	erreur:   ["Erreur humaine : épistémologie de l'erreur et de l'illusion", "L2 · Séparer le fait vérifié de la croyance : la première compétence d'un manager en crise."],
	stats:    ["Statistiques descriptives", "L1 · 63 boîtes sur 420, c'est 15 % : lire un chiffre, et le recouper, avant de le répéter."],
	couts:    ["Gestion des coûts / Gestion budgétaire", "L2 · Le coût sûr d'un rappel, face au coût probable d'une crise qui dure."],
	incert:   ["Le principe d'incertitude", "L2 · Décider sans tout savoir : un risque se chiffre, il ne s'ignore pas."],
	ethique:  ["Éthique de la conviction versus éthique de la responsabilité", "L3 · Kant, Mill, Weber, Aristote : quatre façons de juger la même décision."],
	humain:   ["Management humain : entre bienveillance et exigence", "L3 · Dire la vérité sans blesser, cadrer sans accuser."],
	rh:       ["Management de la fonction RH", "L2 · Une consigne claire pour chacun : c'est ce qui garde une équipe debout."],
	persuader:["Augmenter, persuader, convaincre", "L3 · Ethos, pathos, logos : la rhétorique d'Aristote au service d'un communiqué."],
	comm:     ["Communication d'entreprise", "L2 · Parler vite, juste et vrai, sans déni ni promesse intenable."],
	affaires: ["Éthique des affaires", "L3 · Reconnaître, rembourser, corriger : la confiance est un capital."]
};

/* ================= le dossier ================= */
// Moment 1 : les messages qui arrivent. Chaque ligne se vérifie d'un toucher ; une rumeur a au moins une ligne qui la trahit.
const CHECKS = [["auteur", "👤", "Auteur"], ["source", "🔗", "Source"], ["date", "🕑", "Date"], ["photo", "🖼", "Photo"], ["chiffre", "🔢", "Chiffre"]];
const FACTS = [
	{ id:"qualite", who:"Karim · Qualité", col:"#2c5f9e", chip:"15 % mal scellées",
		t:"Contrôle du lot B ce matin : 63 boîtes mal scellées sur 420 tirées au hasard. Le chocolat a pu blanchir.",
		c:{ auteur:"Karim Haddad, responsable qualité depuis 2019, dans l'annuaire de l'entreprise.", source:"Rapport de contrôle QB-1147, signé, joint en PDF.", date:"Aujourd'hui, 7 h 40.", photo:"La fiche de contrôle, photographiée à l'atelier ce matin à 7 h 32.", chiffre:"63 ÷ 420 = 0,15 : 15 % des boîtes contrôlées. Le calcul tombe juste." } },
	{ id:"sav", who:"Léa · Service client", col:"#2f8a5b", chip:"230 réclamations, 0 malade",
		t:"230 réclamations depuis samedi, toutes sur le lot B. Aucun client malade signalé.",
		c:{ auteur:"Léa Martin, responsable du service client.", source:"Export du logiciel du service client, tableau joint.", date:"Aujourd'hui, 7 h 55.", photo:"Capture du tableau de bord, horodatée ce matin.", chiffre:"230 lignes dans l'export, une par réclamation." } },
	{ id:"stock", who:"Sami · Logistique", col:"#c9822e", chip:"6 000 boîtes : 4 200 / 1 300 / 500",
		t:"Le lot B, c'est 6 000 boîtes : 4 200 bloquées en entrepôt, 1 300 en rayon dans les magasins, 500 déjà vendues.",
		c:{ auteur:"Sami Benali, chef de la logistique.", source:"Logiciel de stock : mouvements du lot B.", date:"Aujourd'hui, 8 h 02.", photo:"Pas de photo : l'état du stock est joint.", chiffre:"4 200 + 1 300 + 500 = 6 000. Le compte est bon." } },
	{ id:"couts", who:"Nadia · Comptabilité", col:"#7a3e8f", chip:"Retrait 5 € · rappel 20 €",
		t:"Pour info : retirer une boîte d'un rayon nous coûte 5 €. Rappeler une boîte chez un client, 20 € (remboursement et envoi).",
		c:{ auteur:"Nadia Lefebvre, contrôleuse de gestion.", source:"Coûts du dernier rappel, en 2023, factures à l'appui.", date:"Aujourd'hui, 8 h 10.", photo:"Pas de photo : le tableau de coûts est joint." } }
];
const RUMOURS = [
	{ id:"vente", who:"Message transféré", col:"#6a6660", fwd:true, flaws:["auteur", "source"],
		t:"Paraît que le patron a déjà vendu l'usine en douce à un fonds étranger 😱 Faites tourner.",
		c:{ auteur:"Inconnu : le message a été transféré plusieurs fois.", source:"Aucune. « Un ami d'un ami qui bosse là-bas ».", date:"Impossible à dater.", photo:"Pas de photo." },
		debunk:["Mme Lambert · DRH", "Je viens d'appeler la direction : l'usine n'est pas à vendre. Ce message n'avait ni auteur ni source."] },
	{ id:"vers", who:"@choco_verite", col:"#c2547a", flaws:["auteur", "photo"],
		t:"Des VERS dans un chocolat Verbrugge 🤮🤮 partagez avant qu'ils suppriment !!",
		c:{ auteur:"Compte créé hier soir, 14 abonnés, aucune autre publication.", source:"Vidéo publiée sur un réseau social, 120 000 vues.", date:"Hier, 22 h 10.", photo:"Recherche d'image inversée : la photo circule depuis 2019, sur un forum, avec l'emballage d'une autre marque." },
		debunk:["Chloé · Communication", "Attention : cette photo date de 2019 et ce n'est même pas notre emballage. Le compte a été créé hier."] },
	{ id:"article", who:"Lien partagé par Marc", col:"#c4532f", link:"Intoxications au chocolat : rappel massif chez Verbrugge", flaws:["date"],
		t:"Regardez, c'est dans la presse !",
		c:{ auteur:"Un quotidien régional, journaliste identifié.", source:"Article en ligne, le lien fonctionne.", date:"Publié le 14 mars 2021 : un autre lot, une autre usine. L'affaire a été classée.", photo:"Photo d'illustration de l'article." },
		debunk:["Karim · Qualité", "Cet article date de 2021 ! Autre lot, autre usine, affaire classée. Rien à voir avec aujourd'hui."] }
];
const RECOUP = { id:"journaliste", who:"Chloé · Communication", col:"#4a78c8", flaws:["chiffre"], recoup:"qualite",
	t:"Un journaliste vient de m'appeler : d'après lui, 40 % des boîtes du lot B sont abîmées. Je lui dis quoi ?",
	c:{ auteur:"Chloé, notre chargée de communication. Elle rapporte ce qu'on lui a dit.", source:"Un journaliste, au téléphone, sans document.", date:"Aujourd'hui, 8 h 15.", photo:"Pas de photo.", chiffre:"40 % des boîtes. D'où vient ce chiffre ? À recouper avec un fait." },
	debunk:["Karim · Qualité", "40 % ? Non : j'ai contrôlé 420 boîtes, 63 sont mal scellées. C'est 15 %, pas 40."] };

// Moment 2 : où sont les boîtes, et ce que coûte chaque rappel
const ZONES = {
	rayon:  { label:"En rayon", sub:"dans les magasins", n:1300, unit:5, cut:20 },
	clients:{ label:"Chez les clients", sub:"déjà vendues", n:500, unit:20, cut:35 },
	ac:     { label:"Lots A et C", sub:"boîtes saines", n:12000, unit:5, cut:0 }
};
const BASE_RISK = 60, CRISIS_COST = 150000;
const PHILO = {
	kant:    { name:"Kant", col:"#3e6fb0", idea:"le devoir de vérité" },
	mill:    { name:"Mill", col:"#2f8a5b", idea:"le plus grand bien pour le plus grand nombre" },
	weber:   { name:"Weber", col:"#7a6a3a", idea:"l'éthique de responsabilité" },
	aristote:{ name:"Aristote", col:"#c0612b", idea:"la prudence, le juste milieu" }
};

// Moment 3 : le brouillon de la directrice, phrase par phrase
const DRAFT = plan => [
	{ id:"s1", k:"ok", t:"Bonjour à tous," },
	{ id:"s2", k:"blesse", who:"marc", t:"encore une fois, l'atelier a tout raté :", re:"un défaut de scellage s'est produit :" },
	{ id:"s3", k:"fait", who:"ines", t:"15 % des boîtes du lot B sont mal scellées." },
	{ id:"s4", k:"ment", who:"chloe", t:"Mais il n'y a aucun problème de qualité chez nous." },
	{ id:"s5", k:"blesse", who:"marc", t:"Les coupables seront sanctionnés.", re:"On cherchera la cause ensemble, sans chercher de coupable." },
	{ id:"s6", k:"fait", who:"ines", t:planLine(plan) },
	{ id:"s7", k:"blesse", who:"ines", need:true, t:"Inès, débrouille-toi avec les clients.", re:"Inès : chaque boîte est remboursée, sans discuter ; ton script arrive à 13 h." },
	{ id:"s8", k:"ment", who:"chloe", need:true, t:"Chloé, dis aux journalistes que tout va bien.", re:"Chloé : rien à la presse avant notre communiqué de 15 h." },
	{ id:"s9", k:"merci", t:"Merci de tenir bon : je compte sur chacun de vous." }
];
function planLine(p){
	if(p.rayon && p.clients) return "On retire les 1 300 boîtes des rayons et on rappelle les 500 boîtes vendues.";
	if(p.rayon) return "On retire les 1 300 boîtes des rayons.";
	if(p.clients) return "On rappelle les 500 boîtes déjà vendues.";
	return "Pour l'instant, on attend les analyses avant de rappeler quoi que ce soit.";
}
const TEAM = {
	chloe:{ name:"Chloé", role:"Communication", col:"#4a78c8" },
	marc: { name:"Marc", role:"Chef d'atelier", col:"#c4532f" },
	ines: { name:"Inès", role:"Service client", col:"#2f8a5b" }
};

// Moment 4 : le communiqué
const PATHOS = [
	["Rien", ""],
	["Froid", "Nous regrettons ce désagrément."],
	["Juste", "Nous comprenons votre déception, et nous la prenons très au sérieux."],
	["Trop", "Nous sommes effondrés 😭 C'est le pire jour de notre histoire, pardon, pardon, pardon."]
];
const LOGOS = {
	qualite:"Un contrôle de 420 boîtes montre que 15 % des boîtes du lot B étaient mal scellées.",
	sav:"Nous avons reçu 230 réclamations ; aucun client malade n'est signalé.",
	stock:"Les 4 200 boîtes du lot B encore en entrepôt sont bloquées.",
	couts:"Ce rappel nous coûte 20 € par boîte."
};
const ETHOS = {
	rembourse:{ chip:"Rembourser chaque boîte", t:"Chaque boîte du lot B est remboursée, même sans ticket de caisse." },
	labo:{ chip:"Publier les analyses", t:"Les résultats du laboratoire seront publiés ici sous 48 h." },
	garantie:{ chip:"Garantir « zéro défaut »", t:"Plus jamais un seul défaut : c'est garanti." }
};

const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[c]);
const eur = n => Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ") + " €";
const STARS = n => "★".repeat(n) + "☆".repeat(3 - n);

/* ================= le style : un vrai smartphone, posé devant la salle ================= */
const CSS = `
.cc{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#1b2533;background:#e9e4da;overflow:hidden;animation:ccIn .35s ease both}
@keyframes ccIn{from{opacity:0}to{opacity:1}}
.cc canvas{position:absolute;left:0;top:0;display:block;touch-action:none}
.cc-hud{position:absolute;z-index:3;left:12px;top:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:stretch;pointer-events:none;max-width:calc(100% - 470px)}
.cc-hud>span{background:rgba(255,255,255,.92);border-radius:12px;padding:6px 11px;font-weight:800;font-size:13px;box-shadow:0 3px 10px rgba(40,30,15,.18);display:flex;align-items:center;gap:7px;white-space:nowrap}
.cc-hud .ti{background:#1b2533;color:#fff}
@media (max-width:1180px){.cc-hud .ti{display:none}}
.cc-hud .st{background:#ff3048;color:#fff}
.cc-hud .st:before{content:"";width:8px;height:8px;border-radius:50%;background:#fff;animation:ccBlink 1.2s infinite}
@keyframes ccBlink{50%{opacity:.25}}
.cc-g small{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#6b7686}
.cc-g i{display:block;width:64px;height:7px;border-radius:4px;background:#e3e7ee;overflow:hidden}
.cc-g i b{display:block;height:100%;border-radius:4px;transition:width .8s cubic-bezier(.4,0,.2,1),background .8s}
.cc-g em{font-style:normal;font-variant-numeric:tabular-nums;min-width:34px}
.cc-g.pop{animation:ccPop .5s ease}
@keyframes ccPop{40%{transform:scale(1.08)}}
.cc-x{position:absolute;z-index:4;top:12px;right:442px;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.94);font-size:24px;cursor:pointer;color:#1b2533;box-shadow:0 3px 10px rgba(40,30,15,.2)}
.cc-phone{position:absolute;z-index:2;right:34px;top:50%;transform:translateY(-50%);width:366px;height:min(860px,calc(100% - 28px));border:11px solid #0b0d12;border-radius:48px;background:#e9edf4;box-shadow:0 0 0 2px #2a3446,0 30px 60px rgba(0,0,0,.45);display:flex;flex-direction:column;overflow:hidden}
.cc-top{flex:none;background:#f8f9fc;box-shadow:0 1px 0 #dde3ec;z-index:2}
.cc-status{display:flex;align-items:center;justify-content:space-between;padding:7px 20px 2px;font-size:12.5px;font-weight:800;color:#141a24;font-variant-numeric:tabular-nums}
.cc-notch{width:92px;height:22px;border-radius:12px;background:#0b0d12;margin-top:-4px}
.cc-head{display:flex;align-items:center;gap:10px;padding:5px 14px 8px}
.cc-head .bk{color:#2f7cf6;font-size:22px;font-weight:800;line-height:1}
.cc-av{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ff3048,#ff8a3d);font-size:18px}
.cc-head b{display:block;font-size:15px;color:#141a24}
.cc-head small{display:block;font-size:12px;color:#6b7686;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc-head>span:last-child{min-width:0}
.cc-pins{flex:none;background:#fffbea;border-bottom:1px solid #efe2b5;padding:6px 10px;display:flex;gap:6px;align-items:center;overflow-x:auto;scrollbar-width:none}
.cc-pins::-webkit-scrollbar{display:none}
.cc-pins[hidden]{display:none}
.cc-pins>b{flex:none;font-size:11.5px;color:#8a6414}
.cc-chip{flex:none;border:1.5px solid #e6d28f;background:#fff;border-radius:999px;padding:4px 10px;font:800 12px Nunito,sans-serif;color:#5c4710;cursor:default;white-space:nowrap}
.cc-chip.can{cursor:pointer;border-color:#2f7cf6;color:#1f5fc8;box-shadow:0 0 0 3px rgba(47,124,246,.18);animation:ccGlow 1.4s infinite}
@keyframes ccGlow{50%{box-shadow:0 0 0 5px rgba(47,124,246,.08)}}
.cc-chip.on{background:#2f7cf6;border-color:#2f7cf6;color:#fff}
.cc-feed{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:10px 10px 14px;display:flex;flex-direction:column;gap:6px;scrollbar-width:none}
.cc-feed::-webkit-scrollbar{display:none}
.cc-day{align-self:center;background:#dbe2ec;color:#4d5868;font-size:11.5px;font-weight:800;border-radius:999px;padding:3px 10px;margin:4px 0}
.cc-sys{align-self:center;text-align:center;max-width:92%;color:#6b7686;font-size:12px;font-weight:700;line-height:1.35}
.cc-b{align-self:flex-start;max-width:86%;background:#fff;border-radius:18px 18px 18px 6px;padding:8px 12px;font-size:14px;line-height:1.38;color:#1b2533;box-shadow:0 1px 1px rgba(20,30,50,.08);animation:ccUp .28s cubic-bezier(.2,.8,.2,1) both;overflow-wrap:anywhere;text-align:left;font-family:inherit;border:0;position:relative}
@keyframes ccUp{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
.cc-b .who{display:block;font-size:12px;font-weight:800;margin-bottom:1px}
.cc-b.me{align-self:flex-end;background:#2f7cf6;color:#fff;border-radius:18px 18px 6px 18px}
.cc-b .fw{display:block;font-size:11.5px;font-style:italic;color:#8a93a3;font-weight:700}
.cc-b .lk{display:block;margin:4px 0 2px;border-left:3px solid #c4532f;background:#f4f1ec;border-radius:6px;padding:5px 8px;font:700 13.5px/1.3 Fraunces,Georgia,serif}
button.cc-b{cursor:pointer}
.cc-b.msg:after,.cc-b.pin:after,.cc-b.rum:after{display:block;margin-top:5px;font-size:11.5px;font-weight:900}
.cc-b.msg:after{content:"Toucher pour vérifier";color:#2f7cf6}
.cc-b.msg.open{box-shadow:0 0 0 3px #2f7cf6}
.cc-b.pin{background:#fffbea}
.cc-b.pin:after{content:"📌 Épinglé comme fait";color:#8a6414}
.cc-b.rum{opacity:.62;background:#f3f4f6}
.cc-b.rum:after{content:attr(data-why);color:#c42b3b}
.cc-typing{align-self:flex-start;background:#fff;border-radius:18px 18px 18px 6px;padding:11px 14px;display:flex;gap:4px}
.cc-typing i{width:7px;height:7px;border-radius:50%;background:#9aa5b5;animation:ccDot 1s infinite}
.cc-typing i:nth-child(2){animation-delay:.15s}.cc-typing i:nth-child(3){animation-delay:.3s}
@keyframes ccDot{30%{transform:translateY(-4px);opacity:.5}}
.cc-link{padding:0;overflow:hidden;border-left:4px solid #2f7cf6}
.cc-link>*{display:block;padding:0 12px}
.cc-link .tag{padding-top:8px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#2f7cf6}
.cc-link b{font:700 15px/1.25 Fraunces,Georgia,serif;margin:3px 0 2px;color:#141a24}
.cc-link span:last-child{padding-bottom:9px;font-size:13px;color:#4d5868}
.cc-verdict{align-self:center;border-radius:999px;padding:5px 14px;font-weight:900;font-size:13.5px;animation:ccUp .3s both}
.cc-verdict .s{letter-spacing:2px;margin-right:6px}
.cc-verdict.s3{background:#e3f6ea;color:#1f7a45}.cc-verdict.s2{background:#fff3d9;color:#8a6414}.cc-verdict.s1{background:#fde8ea;color:#c42b3b}
.cc-go{display:block;width:100%;box-sizing:border-box;align-self:stretch;border:0;border-radius:999px;background:#2f7cf6;color:#fff;font:800 15px Nunito,sans-serif;padding:12px;margin-top:6px;cursor:pointer;box-shadow:0 6px 16px rgba(47,124,246,.3);text-align:center;text-decoration:none;min-height:46px}
.cc-go:disabled{opacity:.35;cursor:default;box-shadow:none}
.cc-alt{display:block;align-self:stretch;border:1.5px solid #c9d3e0;border-radius:999px;background:#fff;color:#1b2533;font:800 14px Nunito,sans-serif;padding:10px;margin-top:4px;cursor:pointer;text-align:center;text-decoration:none;min-height:44px;box-sizing:border-box}
.cc-sheet{flex:none;max-height:66%;overflow-y:auto;overscroll-behavior:contain;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -8px 24px rgba(20,30,50,.16);padding:6px 12px 14px;animation:ccSheet .32s cubic-bezier(.2,.8,.2,1) both;scrollbar-width:thin}
.cc-sheet[hidden]{display:none}
.cc-phone.compose .cc-feed,.cc-phone.compose .cc-pins{display:none}
.cc-phone.compose .cc-sheet{flex:1;max-height:none;border-radius:0;box-shadow:none;padding-top:8px}
.cc-phone.compose .cc-sheet:before{display:none}
.cc-phone.compose .cc-post{position:sticky;top:-8px;z-index:2;max-height:min(46%,400px);overflow-y:auto;box-shadow:0 8px 14px -8px rgba(20,30,50,.25)}
@keyframes ccSheet{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.cc-sheet:before{content:"";display:block;width:38px;height:5px;border-radius:3px;background:#d4dae3;margin:0 auto 8px}
.cc-sh{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.cc-sh b{font-size:14.5px}
.cc-sh small{display:block;font-size:12px;color:#6b7686;font-weight:700}
.cc-sh button{border:0;background:#eef2f8;border-radius:50%;width:32px;height:32px;font-size:15px;cursor:pointer;flex:none}
.cc-quote{background:#f3f5f9;border-radius:12px;padding:7px 10px;font-size:13px;line-height:1.35;margin-bottom:8px}
.cc-quote b{display:block;font-size:11.5px}
.cc-row{display:flex;gap:8px;width:100%;align-items:flex-start;text-align:left;border:1.5px solid #e3e8ef;background:#fff;border-radius:12px;padding:8px 10px;margin:5px 0;font:700 13px/1.35 Nunito,sans-serif;color:#1b2533;cursor:pointer;min-height:44px}
.cc-row .k{flex:none;width:76px;font-weight:900;color:#4d5868}
.cc-row .v{flex:1;color:#2f7cf6;font-weight:900}
.cc-row.rev .v{color:#1b2533;font-weight:700}
.cc-row.wait .v:after{content:" …";animation:ccBlink .6s infinite}
.cc-row.pick{border-color:#ff8a3d;box-shadow:0 0 0 3px rgba(255,138,61,.18)}
.cc-row.proof{border-color:#c42b3b;background:#fde8ea}
.cc-row.ok{border-color:#9fd3b2}
.cc-rc{display:inline-block;margin-top:5px;border:0;border-radius:999px;background:#e7f0ff;color:#1f5fc8;font:900 12px Nunito,sans-serif;padding:5px 10px;cursor:pointer}
.cc-acts{display:flex;gap:6px;margin-top:8px}
.cc-acts button{flex:1;border:0;border-radius:14px;padding:11px 6px;font:900 13.5px Nunito,sans-serif;cursor:pointer;min-height:46px}
.cc-acts .pn{background:#ffe9a8;color:#5c4710}
.cc-acts .fl{background:#fde0e3;color:#a3212f}
.cc-acts .cx{background:#eef2f8;color:#4d5868}
.cc-tip{font-size:12.5px;font-weight:800;color:#a85a18;background:#fff4e6;border-radius:10px;padding:6px 9px;margin:4px 0}
.cc-lot{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cc-zone{border:2px solid #e3e8ef;background:#fff;border-radius:14px;padding:8px 9px;text-align:left;font:700 12px/1.3 Nunito,sans-serif;color:#4d5868;cursor:pointer;min-height:76px;position:relative}
.cc-zone b{display:block;font-size:13.5px;color:#1b2533}
.cc-zone big{display:block;font:900 18px Nunito,sans-serif;color:#1b2533;font-variant-numeric:tabular-nums}
.cc-zone em{display:block;font-style:normal;font-weight:900;margin-top:2px}
.cc-zone.on{border-color:#ff3048;background:#fff1f2}
.cc-zone.on em{color:#c42b3b}
.cc-zone.lock{cursor:default;background:#f3f5f9;border-style:dashed}
.cc-zone .bx{display:flex;flex-wrap:wrap;gap:2px;margin-top:4px}
.cc-zone .bx i{width:7px;height:7px;border-radius:2px;background:#c79a62}
.cc-zone.on .bx i{background:#ff3048}
.cc-zone.lock .bx i{background:#9aa5b5}
.cc-sum{margin:8px 0 4px;border-radius:14px;background:#141a24;color:#fff;padding:9px 12px;font-size:13px;font-variant-numeric:tabular-nums}
.cc-sum div{display:flex;justify-content:space-between;gap:8px;padding:2px 0;color:#c9d2df;font-weight:700}
.cc-sum div b{color:#fff}
.cc-sum .tot{border-top:1px solid #2c3646;margin-top:4px;padding-top:6px;font-size:15px;color:#fff}
.cc-sum .tot b{font-size:18px;color:#ffd77a;transition:color .3s}
.cc-risk{height:7px;border-radius:4px;background:#2c3646;overflow:hidden;margin:3px 0 4px}
.cc-risk i{display:block;height:100%;background:linear-gradient(90deg,#ffb03a,#ff3048);transition:width .6s}
.cc-ph{display:grid;gap:5px;margin-top:6px}
.cc-ph div{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.3;background:#f6f7fa;border-radius:12px;padding:6px 8px;transition:background .4s}
.cc-ph div i{flex:none;font-style:normal;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:900;font-size:13px}
.cc-ph div span b{display:block;font-size:12px}
.cc-ph div.up{background:#e6f6ec}.cc-ph div.dn{background:#fdecee}
.cc-paper{background:#fffdf7;border:1px solid #ece4d2;border-radius:12px;padding:10px 11px;font:15px/1.65 Georgia,serif;color:#2b2622}
.cc-seg{display:inline;border:0;background:none;padding:1px 2px;margin:0;font:inherit;color:inherit;cursor:pointer;border-radius:4px;text-align:left;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.cc-seg:hover{background:#f3ead2}
.cc-seg.cut{color:#b8b2a6;text-decoration:line-through 2px #c42b3b}
.cc-seg.re{color:#1f5fc8;background:#e7f0ff}
.cc-feel{display:flex;gap:6px;margin:8px 0 2px}
.cc-feel span{flex:1;text-align:center;background:#f3f5f9;border-radius:12px;padding:5px 4px;font-size:11.5px;font-weight:800;color:#4d5868}
.cc-feel span i{display:block;font-style:normal;font-size:22px;line-height:1.2}
.cc-post{background:#fff;border:1px solid #e3e8ef;border-radius:16px;padding:10px 12px;font-size:13.5px;line-height:1.42}
.cc-post header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.cc-post header i{width:30px;height:30px;border-radius:50%;background:#5a3520;color:#f3d9a6;display:grid;place-items:center;font-style:normal;font-weight:900}
.cc-post header b{display:block;font-size:13px}
.cc-post header small{display:block;font-size:11.5px;color:#6b7686;font-weight:700}
.cc-post p{margin:0 0 4px}
.cc-post .ph{color:#c2547a}.cc-post .lg{color:#2c5f9e}.cc-post .et{color:#2f8a5b}
.cc-post .sig{font-weight:900;font-style:italic}
.cc-post .empty{color:#9aa5b5;font-style:italic}
.cc-lbl{display:flex;align-items:baseline;justify-content:space-between;margin:10px 0 4px;font-size:12px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}
.cc-lbl small{text-transform:none;letter-spacing:0;font-weight:700;color:#6b7686}
.cc-dose{position:relative;height:44px;border-radius:22px;background:linear-gradient(90deg,#eef2f8,#ffd3e1 70%,#ff8fb0);cursor:pointer;touch-action:none;user-select:none}
.cc-dose span{position:absolute;top:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:900;color:#6b7686;pointer-events:none}
.cc-dose b{position:absolute;top:4px;width:36px;height:36px;margin-left:-18px;border-radius:50%;background:#c2547a;box-shadow:0 3px 8px rgba(194,84,122,.45);transition:left .15s;pointer-events:none;display:grid;place-items:center;color:#fff;font-size:16px}
.cc-chips{display:flex;flex-wrap:wrap;gap:5px}
.cc-chips .cc-chip{cursor:pointer;min-height:34px}
.cc-chips .cc-chip.et{border-color:#a8d8b9;color:#1f6a40}
.cc-chips .cc-chip.et.on{background:#2f8a5b;border-color:#2f8a5b;color:#fff}
.cc-chips .cc-chip.lg{border-color:#bcd0ec;color:#2c5f9e}
.cc-chips .cc-chip.lg.on{background:#2c5f9e;border-color:#2c5f9e;color:#fff}
.cc-coms{margin-top:6px;border-top:1px solid #eef2f8;padding-top:6px;display:grid;gap:4px}
.cc-com{display:flex;gap:6px;font-size:12.5px;line-height:1.3;animation:ccUp .3s both}
.cc-com i{flex:none;font-style:normal;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;background:#eef2f8}
.cc-com b{font-size:11.5px;margin-right:4px}
.cc-com.neg span{color:#a3212f}.cc-com.pos span{color:#1f6a40}
.cc-mood{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:900;color:#4d5868;margin-top:6px}
.cc-mood i{flex:1;height:8px;border-radius:4px;background:#fde0e3;overflow:hidden}
.cc-mood i b{display:block;height:100%;background:#3fbf7f;transition:width .5s}
.cc-recap{align-self:stretch;background:#fff;border-radius:16px;padding:8px 12px;font-size:13.5px;box-shadow:0 1px 1px rgba(20,30,50,.08)}
.cc-recap ul{list-style:none;margin:0;padding:0}
.cc-recap li{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid #eef2f8;font-variant-numeric:tabular-nums}
.cc-recap li:first-child{border-top:0}
.cc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:${MOBILE - 1}px){
	.cc-hud{left:8px;top:8px;gap:4px;max-width:calc(100% - 64px)}
	.cc-hud>span{padding:4px 8px;font-size:11.5px}
	.cc-hud .ti{display:none}
	.cc-g small span{display:none}.cc-g small{font-size:13px}.cc-g i{width:36px}
	.cc-x{right:8px;top:8px;width:40px;height:40px}
	.cc-phone{left:0;right:0;bottom:0;top:var(--ph-top,36%);width:auto;height:auto;transform:none;border:7px solid #0b0d12;border-bottom:0;border-radius:26px 26px 0 0;box-shadow:0 -8px 24px rgba(0,0,0,.3)}
	.cc-notch{display:none}
	.cc-status{padding:5px 16px 0}
	.cc-head{padding:3px 12px 6px}.cc-av{width:30px;height:30px;font-size:15px}
	.cc-sheet{max-height:72%}
}
@media (prefers-reduced-motion:reduce){.cc,.cc-b,.cc-sheet,.cc-com{animation:none}}
`;

/* ================= la salle du conseil, en plein jour ================= */
function world(canvas){
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#e9e4da"); scene.fog = new THREE.Fog("#e9e4da", 70, 140);
	const camera = new THREE.PerspectiveCamera(38, 1, .1, 200);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 6; controls.maxDistance = 40; controls.maxPolarAngle = 1.3;
	scene.add(new THREE.HemisphereLight("#fffaf0", "#b8b2a6", 1.25));
	const sun = new THREE.DirectionalLight("#fff3e0", 2); sun.position.set(-10, 18, 8); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-18, right:18, top:18, bottom:-18, near:1, far:60 }); sun.shadow.bias = -.0005;
	scene.add(sun);

	const mats = {}, M = (c, o = {}) => mats[c + JSON.stringify(o)] || (mats[c + JSON.stringify(o)] = new THREE.MeshStandardMaterial({ color:c, roughness:.75, ...o }));
	const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
	const box = (w, h, d, c, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), M(c), x, y + h/2, z);
	const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

	/* --- la salle du conseil de l'Hôtel Académique : table de chêne, boiseries, hautes fenêtres sur la cour --- */
	const RX = 11, RZ = 6.5, FY = -3.2;
	const top = mesh(new THREE.CylinderGeometry(1, 1, .45, 72), M("#b4834f", { roughness:.42 }), 0, -.22, 0); top.scale.set(RX + .4, 1, RZ + .4); scene.add(top);
	const edge = mesh(new THREE.CylinderGeometry(1, 1, .12, 72), M("#8a6440", { roughness:.5 }), 0, -.5, 0); edge.scale.set(RX + .45, 1, RZ + .45); scene.add(edge);
	const inlay = mesh(new THREE.CylinderGeometry(1, 1, .02, 72), M("#9c6d3e", { roughness:.4 }), 0, .01, 0); inlay.scale.set(RX - .9, 1, RZ - .9); inlay.castShadow = false; scene.add(inlay);
	for(const [x, z] of [[-6, 0], [6, 0]]) scene.add(mesh(new THREE.CylinderGeometry(.55, 1.1, 2.7, 24), M("#5b4632"), x, FY + 1.35, z));
	const still = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; };
	const sbox = (w, h, d, c, x, y, z) => still(new THREE.BoxGeometry(w, h, d), M(c), x, y + h/2, z);
	const parquet = tex(256, 256, (x, w, h) => { x.fillStyle = "#a77b52"; x.fillRect(0, 0, w, h); for(let r = 0; r < 8; r++) for(let c = 0; c < 8; c++){ x.fillStyle = ["#a77b52", "#b5885d", "#9c7149", "#ad8257"][(r + c*3) % 4]; if((r + c) % 2) x.fillRect(c*32, r*32, 32, 14), x.fillRect(c*32, r*32 + 16, 32, 14); else x.fillRect(c*32, r*32, 14, 32), x.fillRect(c*32 + 16, r*32, 14, 32); } });
	parquet.wrapS = parquet.wrapT = THREE.RepeatWrapping; parquet.repeat.set(14, 14);
	still(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map:parquet, roughness:.6 }), 0, FY, 0).rotation.x = -Math.PI/2;
	still(new THREE.BoxGeometry(34, .06, 22), M("#5d6b7a", { roughness:.95 }), 0, FY + .03, -1);
	sbox(90, 34, 1, "#f2eee6", 0, FY, -22); sbox(90, 6, 1.2, "#b08960", 0, FY, -21.7); sbox(90, .5, 1.4, "#8a6440", 0, FY + 6, -21.6);
	for(const sx of [-1, 1]){ sbox(1, 34, 70, "#f2eee6", sx*30, FY, 0); sbox(1.2, 6, 70, "#b08960", sx*29.7, FY, 0); sbox(1.4, .5, 70, "#8a6440", sx*29.6, FY + 6, 0); }
	const sky = tex(128, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#a9cbe6"); g.addColorStop(1, "#eef0e6"); x.fillStyle = g; x.fillRect(0, 0, w, h);
		x.fillStyle = "#b5583c"; x.fillRect(0, h*.62, w, h); x.fillStyle = "#3b4b5e"; x.beginPath(); x.moveTo(0, h*.62); x.lineTo(w*.5, h*.48); x.lineTo(w, h*.62); x.fill(); x.fillStyle = "#f2ede0"; for(let i = 0; i < 4; i++) x.fillRect(10 + i*30, h*.7, 14, 26); });
	for(const wx of [-17, 17]){
		sbox(7.6, 17.6, .5, "#fbf8f2", wx, FY + 6.6, -21.3);
		still(new THREE.PlaneGeometry(6.4, 16.2), new THREE.MeshBasicMaterial({ map:sky }), wx, FY + 15.1, -21).receiveShadow = false;
		sbox(.22, 16.2, .2, "#fbf8f2", wx, FY + 7, -20.9); for(const y of [11, 16]) sbox(6.4, .22, .2, "#fbf8f2", wx, FY + y, -20.9);
		for(const s of [-1, 1]) sbox(1.2, 18, .4, "#e2d6c2", wx + s*4.3, FY + 6.2, -20.8);
	}
	// l'écran de la salle : il suit la crise (chaîne d'info, plan de rappel, communiqué)
	const TVW = 1024, TVH = 576, tvC = document.createElement("canvas"); tvC.width = TVW; tvC.height = TVH;
	const tvX = tvC.getContext("2d"), tvT = new THREE.CanvasTexture(tvC); tvT.colorSpace = THREE.SRGBColorSpace; tvT.anisotropy = 4;
	const tickC = document.createElement("canvas"); tickC.width = 2048; tickC.height = 64;
	const tickT = new THREE.CanvasTexture(tickC); tickT.colorSpace = THREE.SRGBColorSpace; tickT.wrapS = THREE.RepeatWrapping; tickT.repeat.set(.42, 1);
	sbox(11, 6.4, .35, "#16181c", 0, FY + 6.4, -21.1);
	const tvMat = new THREE.MeshBasicMaterial({ map:tvT, toneMapped:false }), tickMat = new THREE.MeshBasicMaterial({ map:tickT, toneMapped:false });
	still(new THREE.PlaneGeometry(10.6, 5.96), tvMat, 0, FY + 6.6 + 2.98, -20.9).receiveShadow = false;
	const tickMesh = still(new THREE.PlaneGeometry(10.6, .5), tickMat, 0, FY + 6.6 + .32, -20.88); tickMesh.receiveShadow = false;
	function tv(draw){ tvX.setTransform(1, 0, 0, 1, 0, 0); draw(tvX, TVW, TVH); tvT.needsUpdate = true; }
	function ticker(text){ const x = tickC.getContext("2d"); x.fillStyle = "#f2f5fa"; x.fillRect(0, 0, 2048, 64); x.fillStyle = "#0f2140"; x.font = "800 36px Nunito, sans-serif"; x.fillText(text, 10, 45); tickT.needsUpdate = true; }
	// deux tableaux et des plantes
	const art = (c1, c2) => tex(160, 200, (x, w, h) => { x.fillStyle = "#f4efe6"; x.fillRect(0, 0, w, h); x.fillStyle = c1; x.beginPath(); x.arc(w*.42, h*.45, 46, 0, 7); x.fill(); x.fillStyle = c2; x.fillRect(w*.3, h*.55, w*.5, h*.25); });
	for(const [sx, a] of [[-1, art("#c8794a", "#3f5f7a")], [1, art("#7a9a6a", "#d9b25a")]]){ const p = still(new THREE.PlaneGeometry(4, 5), new THREE.MeshStandardMaterial({ map:a }), sx*29.3, FY + 10, -8); p.rotation.y = -sx*Math.PI/2; sbox(.2, 5.4, 4.4, "#2b2622", sx*29.4, FY + 7.3, -8); }
	for(const [px, pz] of [[-25, -18], [25, -18], [-26, 6], [26, 6]]){
		still(new THREE.CylinderGeometry(1.1, .8, 2.2, 18), M("#e8e2d6"), px, FY + 1.1, pz);
		for(let i = 0; i < 6; i++) still(new THREE.SphereGeometry(1.2 + (i % 3)*.25, 10, 8), M(["#4f7a45", "#5d8a4f", "#44683c"][i % 3]), px + Math.cos(i*1.1)*.8, FY + 3.4 + (i % 3)*.9, pz + Math.sin(i*1.1)*.8);
	}
	for(const lx of [-6, 0, 6]){
		still(new THREE.CylinderGeometry(.03, .03, 9, 6), M("#2b2622"), lx, FY + 21, -1);
		still(new THREE.CylinderGeometry(1.4, 1.4, .25, 32), M("#2b2622", { roughness:.4 }), lx, FY + 16.4, -1);
		still(new THREE.CylinderGeometry(1.3, 1.3, .05, 32), new THREE.MeshBasicMaterial({ color:"#fff4dc" }), lx, FY + 16.25, -1);
	}
	const fabric = M("#56677c", { roughness:.9 }), steel = M("#9aa3ad", { metalness:.7, roughness:.35 });
	function chair(cx, cz, ry){
		const c = new THREE.Group(); c.position.set(cx, FY, cz); c.rotation.y = ry; scene.add(c);
		c.add(mesh(new THREE.BoxGeometry(1.8, .35, 1.8), fabric, 0, 2.3, 0), mesh(new THREE.BoxGeometry(1.8, 2.1, .3), fabric, 0, 3.55, -.85), mesh(new THREE.CylinderGeometry(.1, .1, 2.1, 8), steel, 0, 1.1, 0), mesh(new THREE.CylinderGeometry(.9, .9, .08, 16), steel, 0, .05, 0));
		return c;
	}
	for(const [cx, cz, ry] of [[-13, 0, Math.PI/2], [13, 0, -Math.PI/2], [-6, 8.6, Math.PI], [0, 9, Math.PI], [6, 8.6, Math.PI]]) chair(cx, cz, ry);
	// sur la table : des dossiers, des tasses, des boîtes du lot B
	const boxMat = M("#5a3520", { roughness:.5 }), ribbon = M("#c9a548", { metalness:.5, roughness:.35 });
	for(const [x, z, r] of [[-1.4, 1.2, .3], [-.2, 1.6, -.2], [1, 1.1, .6]]){
		const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = r; scene.add(b);
		b.add(mesh(new THREE.BoxGeometry(1.4, .38, 1), boxMat, 0, .19, 0), mesh(new THREE.BoxGeometry(1.42, .06, .16), ribbon, 0, .39, 0));
	}
	for(const [x, z, r] of [[-7.5, 2.8, .2], [7.2, 2.6, -.3], [-3.6, -4.2, .1], [3.8, -4, -.15]]){ const p = mesh(new THREE.BoxGeometry(1.7, .05, 2.2), M("#fbf8f2"), x, .03, z); p.rotation.y = r; scene.add(p); }
	for(const [x, z] of [[-5.2, 3.2], [4.8, 3.4], [-1.8, -4.4], [2.2, -4.2]]){ scene.add(mesh(new THREE.CylinderGeometry(.28, .24, .6, 14), M("#fbf8f2"), x, .3, z)); }

	/* --- étiquettes dessinées au canvas --- */
	function drawLabel(sp, text, o){
		const c = sp.userData.c || (sp.userData.c = document.createElement("canvas")), x = c.getContext("2d");
		const f = `800 ${o.big ? 64 : 42}px Nunito, system-ui, sans-serif`; x.font = f;
		const w = Math.ceil(x.measureText(text).width) + (o.bare ? 12 : 44), h = o.big ? 88 : 66;
		c.width = w; c.height = h; x.font = f;
		if(!o.bare){ x.fillStyle = o.bg || "#0f1a2b"; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, h/2 - 2); x.fill(); }
		x.fillStyle = o.fg || "#ffffff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 3);
		if(sp.material.map) sp.material.map.dispose();
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; sp.material.map = t; sp.material.needsUpdate = true;
		const s = o.size || .55; sp.scale.set(s*w/h, s, 1);
	}
	function label(text, o = {}){ const sp = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest:false, transparent:true })); sp.renderOrder = 10; drawLabel(sp, text, o); return sp; }

	/* --- petites animations --- */
	const anims = [];
	const anim = (dur, fn, done) => anims.push({ t0:performance.now(), dur:dur/SPEED, fn, done });
	const ease = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	const popIn = (g, s = 1) => { g.visible = true; g.scale.setScalar(.001); anim(420, k => g.scale.setScalar(Math.max(.001, s*(1 + .25*Math.sin(k*Math.PI))*k))); };
	const shake = g => { const r0 = g.rotation.y; anim(600, k => g.rotation.y = r0 + Math.sin(k*Math.PI*6)*.35*(1 - k), () => g.rotation.y = r0); };
	const nod = g => { anim(600, k => g.rotation.x = Math.sin(k*Math.PI*2)*.25, () => g.rotation.x = 0); };

	/* --- les collègues, assis de l'autre côté de la table --- */
	const PEOPLE = {};
	function person(id, name, col, hair, x){
		const g = new THREE.Group(); g.position.set(x, 0, -7.6); scene.add(g);
		chair(0, 0, 0).position.set(x, FY, -8);
		const body = mesh(new THREE.CylinderGeometry(.62, .78, 2.6, 18), M(col), 0, FY + 3.6 - 1.3, 0); g.add(body);
		const head = new THREE.Group(); head.position.y = FY + 5.1; g.add(head);
		head.add(mesh(new THREE.SphereGeometry(.52, 20, 16), M(SKIN, { roughness:.6 })));
		head.add(mesh(new THREE.SphereGeometry(.55, 18, 12, 0, Math.PI*2, 0, 1.35), M(hair), 0, .06, -.04));
		for(const sx of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(.07, 8, 6), M("#1e1e1e"), sx*.19, .05, .48));
		const l = label(name, { size:.5, bg:col }); l.position.y = FY + 6.3; g.add(l);
		const face = label("🙂", { size:1.1, bare:true }); face.position.set(0, FY + 7.3, 0); face.visible = false; g.add(face);
		PEOPLE[id] = { g, head, face, x, gone:false, mood:null };
	}
	person("chloe", "Chloé", "#4a78c8", "#5a3520", -5.6);
	person("marc", "Marc", "#c4532f", "#2a2a2a", 0);
	person("ines", "Inès", "#2f8a5b", "#1a1410", 5.6);
	function face(id, emoji){
		const p = PEOPLE[id]; if(p.gone) return;
		if(!emoji){ p.face.visible = false; p.mood = null; return; }
		if(p.mood === emoji) return;
		const was = p.mood; p.mood = emoji; drawLabel(p.face, emoji, { size:1.1, bare:true });
		if(!p.face.visible) popIn(p.face);
		if(was && "😠😟😕".includes(emoji)) shake(p.head); else if(was) nod(p.head);
	}
	function leave(id){
		const p = PEOPLE[id]; if(p.gone) return; p.gone = true; p.face.visible = false;
		const x0 = p.g.position.x, dir = x0 >= 0 ? 1 : -1;
		anim(400, k => p.g.rotation.y = k*dir*1.4, () => anim(1400, k => { p.g.position.x = x0 + dir*k*18; p.g.position.y = Math.abs(Math.sin(k*Math.PI*8))*.25; }, () => p.g.visible = false));
	}
	function seatAll(){ for(const id in PEOPLE){ const p = PEOPLE[id]; p.gone = false; p.g.visible = true; p.g.position.set(p.x, 0, -7.6); p.g.rotation.set(0, 0, 0); p.face.visible = false; p.mood = null; } }

	/* --- les bustes des philosophes, le long du mur du fond --- */
	const BUSTS = {};
	function bust(id, name, col, x, style){
		const g = new THREE.Group(); g.position.set(x, FY + 1.6, -16); g.visible = false; scene.add(g);
		const marble = M("#ece7dc", { roughness:.5 });
		g.add(box(1.5, 4.4, 1.5, "#e2dccf", 0, -1.6, 0), box(1.5, 1.6, 1.5, "#e2dccf", 0, 2.8, 0), box(1.8, .3, 1.8, col, 0, 4.4, 0));
		const head = new THREE.Group(); head.position.y = 6.15; g.add(head);
		const chest = mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI*2, 0, Math.PI/2), marble, 0, 4.7, 0); chest.scale.set(1.05, .75, .6); g.add(chest);
		g.add(mesh(new THREE.CylinderGeometry(.26, .3, .6, 12), marble, 0, 5.4, 0));
		head.add(mesh(new THREE.SphereGeometry(.55, 20, 16), marble));
		if(style === "beard"){ const b = mesh(new THREE.ConeGeometry(.42, .8, 14), marble, 0, -.5, .18); b.rotation.x = Math.PI; head.add(b); head.add(mesh(new THREE.SphereGeometry(.57, 16, 10, 0, Math.PI*2, 0, 1.2), marble, 0, .05, 0)); }
		if(style === "wig"){ for(const sx of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(.22, 12, 10), marble, sx*.52, -.05, -.05)); head.add(mesh(new THREE.SphereGeometry(.2, 12, 10), marble, 0, -.1, -.55)); }
		if(style === "side"){ for(const sx of [-1, 1]) head.add(mesh(new THREE.BoxGeometry(.12, .45, .25), marble, sx*.5, -.12, .1)); }
		if(style === "full"){ const b = mesh(new THREE.SphereGeometry(.45, 14, 10), marble, 0, -.42, .2); b.scale.set(1, .9, .8); head.add(b); }
		const l = label(name, { size:.55, bg:col }); l.position.y = 7.3; g.add(l);
		const v = label("🤔", { size:1.2, bare:true }); v.position.y = 8.5; g.add(v);
		BUSTS[id] = { g, head, v, verdict:null };
	}
	bust("aristote", "Aristote", "#c0612b", -11, "beard");
	bust("kant", "Kant", "#3e6fb0", -7, "wig");
	bust("mill", "Mill", "#2f8a5b", 7, "side");
	bust("weber", "Weber", "#7a6a3a", 11, "full");
	function showBusts(on){ for(const id in BUSTS){ const b = BUSTS[id]; if(on && !b.g.visible) popIn(b.g); if(!on) b.g.visible = false; } }
	function bustSay(id, ok){
		const b = BUSTS[id], e = ok === true ? "👍" : ok === false ? "👎" : "🤔"; if(b.verdict === e) return;
		const was = b.verdict; b.verdict = e; drawLabel(b.v, e, { size:1.2, bare:true });
		if(was){ if(ok) nod(b.head); else if(ok === false) shake(b.head); }
	}

	/* --- caméra : une vue posée pour chaque moment --- */
	const VIEWS = {
		intro:[0, 12, 23, 0, 3.6, -8], tri:[0, 9.5, 17, 0, 4.4, -12], plan:[0, 9, 15, 0, 5, -14],
		equipe:[0, 8.5, 14.5, 0, 2.8, -8], communique:[0, 6.5, 2.5, 0, 6.2, -21], end:[0, 11, 22, 0, 4, -8]
	};
	let cam = null;
	function look(k){ const v = VIEWS[k]; cam = { k:0, p0:camera.position.clone(), t0:controls.target.clone(), p1:new THREE.Vector3(v[0], v[1], v[2]), t1:new THREE.Vector3(v[3], v[4], v[5]) }; }

	/* --- boucle --- */
	let raf = 0, last = performance.now(), dead = false;
	function step(now){
		const dt = Math.min(.05, Math.max(0, (now - last)/1000)); last = now;
		for(let i = anims.length - 1; i >= 0; i--){
			const a = anims[i], k = Math.min(1, (now - a.t0)/a.dur); if(k < 0) continue;
			a.fn(k); if(k >= 1){ anims.splice(i, 1); a.done && a.done(); }
		}
		tickT.offset.x = (now/24000) % 1;
		if(cam){ cam.k = Math.min(1, cam.k + dt*SPEED/1.2); const e = ease(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		controls.update();
		renderer.render(scene, camera);
	}
	function loop(now){ if(dead) return; raf = requestAnimationFrame(loop); step(now); }
	function resize(w, h, offX){
		if(!w || !h) return;
		renderer.setSize(w, h, false); canvas.style.width = w + "px"; canvas.style.height = h + "px";
		// le téléphone couvre la droite : le champ de la caméra tient dans la partie libre, et l'image se prolonge dessous
		const fw = w - (offX || 0), a = fw/h;
		camera.aspect = a; camera.fov = a < .9 ? 52 : w < 760 ? 50 : 38;
		if(offX) camera.setViewOffset(fw, h, 0, 0, w, h); else camera.clearViewOffset();
		camera.updateProjectionMatrix();
	}
	camera.position.set(0, 14, 26); controls.target.set(0, 3, -8);
	raf = requestAnimationFrame(loop);
	return {
		resize, look, tv, ticker, face, leave, seatAll, showBusts, bustSay, PEOPLE, BUSTS, nod, shake,
		snap(){ step(performance.now()); },
		dispose(){
			dead = true; cancelAnimationFrame(raf); controls.dispose();
			scene.traverse(o => { if(o.geometry) o.geometry.dispose(); const m = o.material; if(m){ if(m.map) m.map.dispose(); m.dispose(); } });
			renderer.dispose(); renderer.forceContextLoss();
		}
	};
}

/* ================= le jeu ================= */
const LAMBERT = ["Mme Lambert · DRH", "#c42b3b"];
export function openCrise({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("cc-css")){ const st = document.createElement("style"); st.id = "cc-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	const root = document.createElement("div"); root.className = "cc";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu La cellule de crise");
	root.innerHTML = `<canvas aria-hidden="true"></canvas>
		<div class="cc-hud" aria-live="polite"><span class="ti">🔥 La cellule de crise</span><span class="st" data-stage>Lundi 8 h</span>
			<span class="cc-g" data-g="crise" title="Niveau de crise"><small>🚨<span> Crise</span></small><i><b></b></i><em></em></span>
			<span class="cc-g" data-g="clim" title="Climat d'équipe"><small>🤝<span> Équipe</span></small><i><b></b></i><em></em></span>
			<span data-stars>★ 0 / 12</span></div>
		<button class="cc-x" aria-label="Quitter le jeu">×</button>
		<div class="cc-phone">
			<div class="cc-top"><div class="cc-status"><b data-clock>8:00</b><i class="cc-notch"></i><span data-bat>▮▮▮ 92 %</span></div>
				<div class="cc-head"><span class="bk">‹</span><span class="cc-av">🚨</span><span><b>Cellule de crise</b><small data-sub>Mme Lambert, Chloé, Karim, Léa, Sami, Nadia, toi</small></span></div></div>
			<div class="cc-pins" hidden></div>
			<div class="cc-feed" aria-live="polite"></div>
			<div class="cc-sheet" hidden></div>
		</div>
		<div class="cc-sr" aria-live="assertive"></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const canvas = $("canvas"), feed = $(".cc-feed"), sheet = $(".cc-sheet"), pins = $(".cc-pins"), phone = $(".cc-phone");
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms/SPEED); timers.add(t); return t; };
	const W = world(canvas);

	function layout(){
		const w = innerWidth, h = innerHeight; if(!w || !h) return;
		if(w >= MOBILE) W.resize(w, h, Math.min(w*.45, 430));
		else { const t = Math.round(h*.36); phone.style.setProperty("--ph-top", (t - 10) + "px"); W.resize(w, t); }
	}
	let sized = "";
	const sizeCheck = () => { const s = innerWidth + "x" + innerHeight; if(s !== sized && innerWidth && innerHeight){ sized = s; layout(); } };
	addEventListener("resize", sizeCheck); sizeCheck();
	const sizeT = setInterval(sizeCheck, 500);      // le volet peut annoncer une fenêtre de 0 px à l'ouverture

	/* --- état --- */
	const S = { step:"intro", crise:75, clim:60, stars:{}, learned:new Set(), pinned:[], plan:{ rayon:false, clients:false, ac:false }, planDone:null, draft:{}, comm:null, minute:0 };
	function gauge(k, v){
		S[k] = Math.max(0, Math.min(100, v));
		const el = $(`[data-g="${k}"]`), b = el.querySelector("b"), good = k === "clim" ? S[k] : 100 - S[k];
		b.style.width = S[k] + "%"; b.style.background = good >= 60 ? "#3fbf7f" : good >= 35 ? "#ffb03a" : "#ff3048";
		el.querySelector("em").textContent = k === "crise" ? Math.round(S[k]) + " %" : Math.round(S[k]) + "";
		el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
	}
	const bump = (k, d) => gauge(k, S[k] + d);
	gauge("crise", S.crise); gauge("clim", S.clim);
	const total = () => Object.values(S.stars).reduce((a, b) => a + b, 0);
	const clockStr = m => { const t = 8*60 + m; return Math.floor(t/60) + ":" + String(t % 60).padStart(2, "0"); };
	function clock(min, abs){
		S.minute = abs ? min : S.minute + min;
		$("[data-clock]").textContent = clockStr(S.minute);
		$("[data-bat]").textContent = "▮▮▮ " + Math.max(8, Math.round(92 - S.minute/6)) + " %";
	}
	function stage(text, step, at){
		S.step = step; $("[data-stage]").textContent = text; W.look(step); if(at !== undefined) clock(at, true);
		ev("stage", text);
	}
	const sr = t => { $(".cc-sr").textContent = t.replace(/<[^>]+>/g, ""); };

	/* --- la messagerie --- */
	const bubble = (who, col, html, cls = "") => `<div class="cc-b ${cls}">${who ? `<span class="who" style="color:${col}">${who}</span>` : ""}${html}</div>`;
	const sys = t => `<div class="cc-sys">${t}</div>`;
	const day = t => `<div class="cc-day">${t}</div>`;
	const scrollEnd = () => requestAnimationFrame(() => feed.scrollTo({ top:feed.scrollHeight, behavior:SPEED > 1 ? "auto" : "smooth" }));
	function add(html){ feed.insertAdjacentHTML("beforeend", html); scrollEnd(); return feed.lastElementChild; }
	// quelqu'un écrit dans le groupe : « … » puis le message ; les messages font la queue
	let q = Promise.resolve(), qGen = 0;
	function say(who, col, html, o = {}){
		const gen = qGen;
		q = q.then(() => new Promise(done => {
			if(closed || gen !== qGen) return done();
			const dots = document.createElement("div"); dots.className = "cc-typing"; dots.innerHTML = "<i></i><i></i><i></i>";
			feed.appendChild(dots); scrollEnd();
			later(o.fast ? 350 : 550 + Math.min(900, html.length*7), () => { dots.remove(); if(gen === qGen){ add(bubble(who, col, html, o.cls)); play("pop"); sr(who + " : " + html); o.then && o.then(); } done(); });
			if(closed) done();
		}));
		return q;
	}
	const lam = (html, o) => say(LAMBERT[0], LAMBERT[1], html, o);
	const after = f => { const gen = qGen; q = q.then(() => { if(!closed && gen === qGen) f(); }); };
	function reset(sub){ qGen++; q = Promise.resolve(); feed.innerHTML = ""; closeSheet(); if(sub) $("[data-sub]").textContent = sub; }
	function openSheet(html, keep){ const top = sheet.scrollTop, was = !sheet.hidden; sheet.innerHTML = html; sheet.hidden = false; if(keep && was) sheet.scrollTop = top; }
	function closeSheet(){ sheet.hidden = true; sheet.innerHTML = ""; phone.classList.remove("compose"); }
	const course = k => { S.learned.add(k); const [n, t] = COURSES[k]; return `<div class="cc-b cc-link"><span class="tag">📚 Au programme de la licence</span><b>${n}</b><span>${t}</span></div>`; };
	function verdict(key, stars, txt){
		S.stars[key] = stars;
		after(() => {
			$("[data-stars]").textContent = `★ ${total()} / 12`;
			play(stars === 3 ? "good" : stars === 2 ? "chime" : "bad");
			add(`<div class="cc-verdict s${stars}"><span class="s">${STARS(stars)}</span>${["", "À retravailler", "Bien vu", "Excellent"][stars]}</div>`);
		});
		return lam(txt);
	}
	function renderPins(cite){
		pins.hidden = !S.pinned.length;
		pins.innerHTML = `<b>📌 Faits</b>` + S.pinned.map(id => { const f = FACTS.find(x => x.id === id); return `<button class="cc-chip ${cite ? "can" : ""}" data-a="pinchip" data-id="${id}" ${cite ? "" : "tabindex=-1"}>${esc(f.chip)}</button>`; }).join("");
	}

	/* --- l'écran TV de la salle --- */
	function tvNews(views, line2){
		W.tv((x, w, h) => {
			const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#1f3b63"); g.addColorStop(1, "#0f2140"); x.fillStyle = g; x.fillRect(0, 0, w, h);
			x.fillStyle = "#d62839"; x.fillRect(52, 40, 190, 64); x.fillStyle = "#fff"; x.font = "900 42px Nunito, sans-serif"; x.fillText("DIRECT", 70, 87);
			x.fillStyle = "#b8c7de"; x.font = "800 38px Nunito, sans-serif"; x.fillText(clockStr(S.minute).replace(":", " h "), 262, 86);
			x.fillStyle = "#e8edf5"; x.font = "800 64px Nunito, sans-serif"; x.fillText("Chocolaterie Verbrugge", 52, 196);
			x.font = "700 40px Nunito, sans-serif"; x.fillStyle = "#b8c7de"; x.fillText(line2 || "Boîtes abîmées : la marque roubaisienne", 52, 258); if(!line2) x.fillText("sous le feu des réseaux", 52, 306);
			x.fillStyle = "#fff"; x.font = "900 56px Nunito, sans-serif"; x.fillText("👁 " + Math.round(views).toLocaleString("fr-FR").replace(/[  ]/g, " ") + " vues", 52, 410);
		});
	}
	const views = () => Math.max(80000, 80000 + (S.crise - 60)*3000 + S.minute*450);

	/* ---------- moment 1 : trier l'info ---------- */
	let M1 = null;
	function tri(){
		reset("Karim, Léa, Sami, Nadia, Chloé, Marc, Mme Lambert, toi"); S.pinned = []; renderPins();
		stage("1 · Trier l'info", "tri", 5); W.ticker("Les messages se multiplient sur les réseaux · le lot B en question · une rumeur de vente de l'usine circule ·");
		tvNews(views());
		// les quatre faits, Chloé et son journaliste après Karim, et deux rumeurs tirées au hasard
		const rum = shuffle(RUMOURS.slice()).slice(0, 2);
		const order = shuffle([FACTS[1], FACTS[2], FACTS[3], ...rum]);
		order.splice(Math.floor(Math.random()*2), 0, FACTS[0]);
		order.splice(order.indexOf(FACTS[0]) + 2 + Math.floor(Math.random()*2), 0, RECOUP);
		M1 = { list:order.map(m => ({ ...m, fact:FACTS.includes(m), rev:{}, state:"new", recouped:false })), next:0, open:null, flag:false, recoupMode:false, errors:0, blind:0, done:0 };
		if(!S.hot){      // ouverture à chaud : la vidéo, puis le tri tout de suite
			S.hot = true;
			W.seatAll(); W.showBusts(false);
			add(sys(`Mini-jeu · ${esc(formation.name)} · entreprise et personnes fictives`) + day("Lundi 16 novembre, 8 h 05") + sys("Mme Lambert t'a ajouté au groupe « Cellule de crise »"));
			say("Chloé · Communication", "#4a78c8", "📱 Vous avez vu ? Une cliente a filmé une boîte de la <b>Chocolaterie Verbrugge</b> ouverte, le chocolat tout blanchi. <b>80 000 vues</b> en une heure…", { fast:true });
			lam("Vous dirigez la cellule de crise avec moi. Les messages vont pleuvoir : on ne répète rien qu'on n'a pas vérifié.", { fast:true });
		} else add(day("8 h 05"));
		lam("Avant d'agir, on trie. <b>Touchez chaque message</b> et vérifiez-le : qui l'écrit, d'où il sort, de quand il date, ce que montre la photo.", { fast:true });
		lam("Un fait vérifié, on l'<b>épingle</b> : il servira toute la journée. Une rumeur, on la <b>signale</b>, preuve à l'appui.");
		after(() => deliver());
	}
	function deliver(){
		if(!M1 || closed) return;
		const pending = M1.list.filter(m => m.el && m.state === "new").length;
		if(M1.next >= M1.list.length || pending >= 3) return;
		const m = M1.list[M1.next++];
		const inner = `${m.fwd ? `<span class="fw">↪ Transféré plusieurs fois</span>` : ""}${m.link ? `<span class="lk">📰 ${esc(m.link)}</span>` : ""}${esc(m.t)}`;
		m.el = add(`<button class="cc-b msg" data-a="msg" data-id="${m.id}"><span class="who" style="color:${m.col}">${esc(m.who)}</span>${inner}</button>`);
		play("pop"); W.ticker(`Nouveau message de ${m.who} · ${M1.done} / ${M1.list.length} messages vérifiés ·`);
		later(1300, deliver);
	}
	function m1Sheet(){
		const m = M1.open; if(!m) return closeSheet();
		const keys = CHECKS.filter(([k]) => m.c[k]);
		openSheet(`<div class="cc-sh"><span><b>Vérifier le message</b><small>${M1.flag ? "Touche la ligne qui prouve que c'est une rumeur" : "Touche chaque ligne pour la vérifier"}</small></span><button data-a="shclose" aria-label="Fermer">✕</button></div>
			<div class="cc-quote"><b style="color:${m.col}">${esc(m.who)}</b>${m.link ? esc(m.link) + " · " : ""}${esc(m.t)}</div>
			${keys.map(([k, ic, lab]) => { const r = m.rev[k];
				const proof = M1.flag && r === "done";
				const recoupBtn = k === "chiffre" && m.recoup && r === "done" && !m.recouped ? `<br><span class="cc-rc" data-a="recoup" role="button" tabindex="0">🔗 Recouper avec un fait épinglé</span>` : "";
				const v = r === "done" ? (k === "chiffre" && m.recouped ? `40 % annoncés ≠ 15 % mesurés par Karim sur 420 boîtes. Le chiffre ne tient pas.` : esc(m.c[k])) : r === "wait" ? "Vérification" : "Vérifier ›";
				return `<button class="cc-row ${r ? "rev" : ""} ${r === "wait" ? "wait" : ""} ${proof ? "pick" : ""} ${m.proof === k ? "proof" : ""}" data-a="row" data-k="${k}"><span class="k">${ic} ${lab}</span><span class="v">${v}${recoupBtn}</span></button>`; }).join("")}
			${M1.recoupMode ? `<div class="cc-tip">🔗 Touche, en haut, le fait épinglé qui parle du même chiffre.</div>` : ""}
			${M1.flag ? `<div class="cc-acts"><button class="cx" data-a="flagx">Annuler</button></div>` : `<div class="cc-acts"><button class="pn" data-a="pin">📌 Épingler comme fait</button><button class="fl" data-a="flag">🚩 Signaler une rumeur</button></div>`}`, true);
	}
	function m1Open(id){
		const m = M1.list.find(x => x.id === id); if(!m || m.state !== "new") return;
		if(M1.open && M1.open.el) M1.open.el.classList.remove("open");
		M1.open = m; M1.flag = false; M1.recoupMode = false; renderPins(false); m.el.classList.add("open"); m1Sheet();
	}
	function m1Row(k){
		const m = M1.open; if(!m) return;
		if(!m.rev[k]){
			m.rev[k] = "wait"; m1Sheet(); play("clic"); clock(1);
			later(450, () => { if(M1.open !== m) { m.rev[k] = "done"; return; } m.rev[k] = "done"; m1Sheet(); });
			return;
		}
		if(m.rev[k] !== "done" || !M1.flag) return;
		// signaler : la ligne touchée doit prouver la rumeur
		if(!m.fact && m.flaws.includes(k) && (k !== "chiffre" || m.recouped)){
			m.proof = k; m.state = "rum"; M1.done++; clock(2);
			m.el.classList.remove("msg", "open"); m.el.classList.add("rum"); m.el.dataset.why = "🚩 Rumeur · " + CHECKS.find(c => c[0] === k)[2].toLowerCase() + " douteux" + (k === "date" || k === "source" || k === "photo" ? "e" : "");
			if(k === "chiffre") m.el.dataset.why = "🚩 Rumeur · chiffre démenti par le contrôle";
			play("stamp"); bump("crise", -3); W.face(m.id === "journaliste" ? "chloe" : "marc", "🙂");
			M1.open = null; M1.flag = false; closeSheet(); m1After();
			return;
		}
		if(k === "chiffre" && !m.recouped && m.recoup){ lam("Un chiffre seul ne prouve rien : <b>recoupez-le</b> d'abord avec un fait épinglé.", { fast:true }); return; }
		if(m.id === "journaliste" && k === "source"){ lam("Une source sans document, c'est fragile… mais ça ne prouve pas que c'est faux. Le chiffre, lui, se vérifie.", { fast:true }); return; }
		M1.errors++; bump("crise", 3); play("bad"); ev("err");
		lam(m.fact ? "Ce détail est normal : ce message tient la route. Où serait le problème ?" : "Ce détail-là est normal. Cherchez la ligne qui cloche vraiment.", { fast:true });
	}
	function m1Pin(){
		const m = M1.open; if(!m) return;
		const all = CHECKS.filter(([k]) => m.c[k]).every(([k]) => m.rev[k] === "done");
		M1.open = null; closeSheet(); m.el.classList.remove("open"); clock(2);
		if(m.fact){
			m.state = "pin"; M1.done++; S.pinned.push(m.id); renderPins(false);
			m.el.classList.remove("msg"); m.el.classList.add("pin"); play("good"); bump("crise", -3);
			if(!all){ M1.blind++; lam("Épinglé… sans tout vérifier. C'était juste, cette fois. En crise, on vérifie <b>avant</b> de s'appuyer sur un message.", { fast:true }); }
			m1After();
			return;
		}
		// une rumeur épinglée : quelqu'un la dément aussitôt, et elle descend
		M1.errors++; bump("crise", 8); play("bad"); ev("err");
		m.el.classList.remove("msg"); m.el.classList.add("pin");
		const [who, txt] = m.debunk, col = who.startsWith("Karim") ? "#2c5f9e" : who.startsWith("Chloé") ? "#4a78c8" : LAMBERT[1];
		say(who, col, "⚠️ " + txt, { fast:true, then:() => { m.state = "rum"; M1.done++; m.el.classList.remove("pin"); m.el.classList.add("rum"); m.el.dataset.why = "🚩 Rumeur · épinglée par erreur"; m1After(); } });
		W.face("marc", "😟");
	}
	function m1Recoup(id){
		const m = M1.open; if(!m || !M1.recoupMode) return;
		const f = FACTS.find(x => x.id === id);
		M1.recoupMode = false; renderPins(false); clock(1);
		if(id === m.recoup){ m.recouped = true; play("chime"); W.ticker("Recoupement : 40 % annoncés, 15 % mesurés sur 420 boîtes ·"); m1Sheet(); return; }
		lam(`Le message de ${esc(f.who.split(" · ")[0])} ne parle pas du taux de défaut : rien à comparer. Cherchez le fait qui mesure les boîtes abîmées.`, { fast:true });
		m1Sheet();
	}
	function m1After(){
		tvNews(views());
		W.ticker(`${M1.done} / ${M1.list.length} messages vérifiés · ${S.pinned.length} fait${S.pinned.length > 1 ? "s" : ""} épinglé${S.pinned.length > 1 ? "s" : ""} ·`);
		if(M1.done >= M1.list.length) return later(600, m1End);
		later(500, deliver);
	}
	function m1End(){
		if(S.step !== "tri") return;
		const err = M1.errors + M1.blind*.5, stars = err === 0 ? 3 : err <= 2 ? 2 : 1;
		const missing = FACTS.filter(f => !S.pinned.includes(f.id));
		// un fait mal classé ne doit pas bloquer la suite : Mme Lambert le remet au dossier
		for(const f of missing){ S.pinned.push(f.id); }
		renderPins(false); clock(115, true);
		add(day("10 h"));
		verdict("tri", stars, `${stars === 3 ? "Impeccable." : "C'est trié."} Au dossier : <b>15 % du lot B</b> mal scellé (63 sur 420), <b>230 réclamations</b> sans aucun malade, <b>6 000 boîtes</b> dont 4 200 déjà bloquées, et les coûts d'un rappel. Le reste n'était que bruit.`);
		after(() => add(course("erreur") + course("stats") + `<button class="cc-go" data-a="plan">2 · Décider →</button>`));
		W.face("chloe", null); W.face("marc", null);
		// fin de la scène d'ouverture : les faits sont triés
		after(() => timers.add(setTimeout(() => !closed && palier({ id:"crise", onEvent:ev, openLead, quit:close,
			titre:"Faits épinglés, rumeurs démasquées : la cellule sait enfin de quoi elle parle.",
			texte:"D'ici 15 h, il te reste à décider quoi rappeler, à tenir une équipe à bout de nerfs, puis à publier le communiqué que 80 000 personnes attendent.",
			suite:"Diriger toute la crise (≈ 6 min)" }), 1800)));
	}

	/* ---------- moment 2 : décider ---------- */
	const planCalc = p => {
		const sure = ["rayon", "clients", "ac"].reduce((a, z) => a + (p[z] ? ZONES[z].n*ZONES[z].unit : 0), 0);
		const risk = p.rayon && p.clients ? 5 : BASE_RISK - (p.rayon ? ZONES.rayon.cut : 0) - (p.clients ? ZONES.clients.cut : 0);
		const prob = risk/100*CRISIS_COST;
		return { sure, risk, prob, tot:sure + prob };
	};
	const BEST = planCalc({ rayon:true, clients:true, ac:false }).tot;
	function philo(p){
		const c = planCalc(p), none = !p.rayon && !p.clients && !p.ac;
		return {
			kant: p.clients ? [true, "On prévient ceux qui ont la boîte chez eux. Dire la vérité est un devoir, quel qu'en soit le coût."]
				: [false, "500 clients ont la boîte chez eux et ne savent rien. Se taire, c'est leur mentir par omission."],
			mill: c.tot <= BEST ? [true, "Le moins de tort possible, pour le plus grand nombre : le calcul est bon."]
				: [false, `Compte bien : ce plan coûte ${eur(c.tot - BEST)} de plus que le meilleur possible, pour un résultat moins bon ou égal.`],
			weber: c.risk <= 10 ? [true, `${c.risk} % de risque : c'est une conséquence que l'on peut assumer devant tous.`]
				: [false, `${c.risk} % de risque d'une deuxième vidéo. Le responsable répond des conséquences prévisibles.`],
			aristote: none ? [false, "Ne rien faire n'est pas de la prudence : c'est de la lâcheté."]
				: p.ac ? [false, "Rappeler des boîtes saines, c'est l'excès inverse : de la témérité."]
				: p.rayon && p.clients ? [true, "Tout le lot B, rien que le lot B : voilà le juste milieu."]
				: [null, "Tu t'arrêtes à mi-chemin. Le juste milieu n'est pas la moitié du chemin."]
		};
	}
	function plan(){
		reset("Mme Lambert, Nadia, Sami, le conseil, toi"); renderPins(false);
		stage("2 · Décider", "plan", 120); W.showBusts(true);
		S.plan = { rayon:false, clients:false, ac:false }; S.planTouched = 0;
		W.ticker("Faut-il rappeler le lot B ? La direction hésite · le conseil se réunit à 10 h ·");
		add(day("10 h"));
		lam("Faut-il rappeler le lot B, et jusqu'où ? Composez le plan de rappel <b>zone par zone</b> : le tableau calcule le coût, le risque, et le conseil réagit en direct.", { fast:true });
		say("Chloé · Communication", "#4a78c8", "Mon estimation : si on ne fait rien, <b>60 % de risque</b> qu'une deuxième vidéo sorte. Une crise jusqu'à Noël, c'est <b>150 000 €</b> de ventes perdues.");
		lam("Aristote, Kant, Mill et Weber siègent au conseil ce matin (ou presque…). Chacun juge le plan à sa façon : regardez les bustes.");
		after(() => { planSheet(); planTV(); });
	}
	function planSheet(){
		const p = S.plan, c = planCalc(p), ph = philo(p);
		const boxes = (n, per) => `<span class="bx">${"<i></i>".repeat(Math.max(1, Math.round(n/per)))}</span>`;
		const zone = z => { const Z = ZONES[z], on = p[z];
			return `<button class="cc-zone ${on ? "on" : ""}" data-a="zone" data-z="${z}" aria-pressed="${on}"><b>${Z.label}</b>${Z.sub}<big>${Z.n.toLocaleString("fr-FR").replace(/[  ]/g, " ")} boîtes</big>${boxes(Z.n, z === "ac" ? 1000 : 100)}<em>${on ? `↩ Rappel : ${Z.n.toLocaleString("fr-FR").replace(/[  ]/g, " ")} × ${Z.unit} € = ${eur(Z.n*Z.unit)}` : "En vente · toucher pour rappeler"}</em></button>`; };
		openSheet(`<div class="cc-sh"><span><b>📊 Plan de rappel</b><small>Touche une zone pour la rappeler, retouche pour l'annuler</small></span></div>
			<div class="cc-lot">
				<div class="cc-zone lock"><b>En entrepôt</b>lot B<big>4 200 boîtes</big>${boxes(4200, 100)}<em>🔒 Déjà bloquées · 0 €</em></div>
				${zone("rayon")}${zone("clients")}${zone("ac")}
			</div>
			<div class="cc-sum">
				<div><span>Coût sûr du rappel</span><b>${eur(c.sure)}</b></div>
				<div><span>Risque d'une 2ᵉ vidéo</span><b>${c.risk} %</b></div>
				<div class="cc-risk"><i style="width:${c.risk}%"></i></div>
				<div><span>Coût probable : ${c.risk} % × 150 000 €</span><b>${eur(c.prob)}</b></div>
				<div class="tot"><span>Total à prévoir</span><b>${eur(c.tot)}</b></div>
			</div>
			<div class="cc-ph">${Object.keys(PHILO).map(k => { const [ok, t] = ph[k], P = PHILO[k];
				return `<div class="${ok === true ? "up" : ok === false ? "dn" : ""}"><i style="background:${P.col}">${P.name[0]}</i><span><b>${P.name} ${ok === true ? "👍" : ok === false ? "👎" : "🤔"} · ${P.idea}</b>${t}</span></div>`; }).join("")}</div>
			<button class="cc-go" data-a="decide" ${S.planTouched ? "" : "disabled"}>Proposer ce plan au conseil</button>`, true);
		for(const k in ph) W.bustSay(k, ph[k][0]);
	}
	function planTV(){
		const c = planCalc(S.plan), ph = philo(S.plan);
		W.tv((x, w, h) => {
			x.fillStyle = "#f6f1e7"; x.fillRect(0, 0, w, h);
			x.fillStyle = "#1b2533"; x.font = "900 50px Nunito, sans-serif"; x.fillText("Plan de rappel · lot B", 46, 84);
			x.font = "700 34px Nunito, sans-serif"; x.fillStyle = "#4d5868";
			x.fillText("Coût sûr : " + eur(c.sure), 46, 156); x.fillText("Risque d'une 2e vidéo : " + c.risk + " %", 46, 206);
			x.fillStyle = "#e3dccd"; x.fillRect(46, 228, 600, 26); x.fillStyle = c.risk > 30 ? "#e0402f" : c.risk > 10 ? "#e8a33a" : "#3fbf7f"; x.fillRect(46, 228, 6*c.risk, 26);
			x.fillStyle = "#1b2533"; x.font = "900 64px Nunito, sans-serif"; x.fillText("Total : " + eur(c.tot), 46, 350);
			Object.keys(PHILO).forEach((k, i) => { const P = PHILO[k], ok = ph[k][0];
				x.fillStyle = P.col; x.beginPath(); x.arc(130 + i*250, 410, 42, 0, 7); x.fill();
				x.fillStyle = "#fff"; x.font = "900 40px Nunito, sans-serif"; x.textAlign = "center"; x.fillText(P.name[0], 130 + i*250, 424);
				x.fillStyle = "#1b2533"; x.font = "800 30px Nunito, sans-serif"; x.fillText(P.name + " " + (ok === true ? "oui" : ok === false ? "non" : "?"), 130 + i*250, 488); x.textAlign = "left"; });
		});
	}
	function planToggle(z){
		S.plan[z] = !S.plan[z]; S.planTouched++; play(S.plan[z] ? "stamp" : "clic"); clock(2);
		planSheet(); planTV();
		const c = planCalc(S.plan); W.ticker(`Plan en cours : ${eur(c.tot)} à prévoir · risque ${c.risk} % ·`);
	}
	function decide(){
		const p = { ...S.plan }, c = planCalc(p), ph = philo(p), ups = Object.values(ph).filter(x => x[0] === true).length;
		S.planDone = { ...p, ...c, ups }; closeSheet(); clock(150, true);
		add(`<div class="cc-b me">Je propose : ${esc(planLine(p).replace(/^On /, "on ").replace(/^Pour l'instant, on/, "on"))}</div>`);
		add(sys(`Le conseil vote : <b>${ups} philosophe${ups > 1 ? "s" : ""} sur 4</b> approuve${ups > 1 ? "nt" : ""} le plan`));
		const optimal = p.rayon && p.clients && !p.ac;
		const stars = optimal ? 3 : (c.tot <= 70000 && ups >= 1) ? 2 : 1;
		let txt;
		if(optimal){ bump("crise", -18); bump("clim", 5); txt = `Plan adopté : tout le lot B, rien que le lot B. <b>${eur(c.sure)}</b> de dépenses sûres, et le risque tombe à <b>5 %</b>. On reprend la main avant que la presse ne le découvre.`; }
		else if(c.risk >= 40){ bump("crise", 15); bump("clim", -8); txt = `Le soir même, une deuxième vidéo sort. Avec <b>${c.risk} %</b> de risque, il fallait s'y attendre : le rappel arrivera sous la contrainte, et plus cher.`; ev("err"); }
		else if(p.ac){ bump("crise", -10); txt = `Le risque est maîtrisé, mais rappeler 12 000 boîtes saines coûte <b>${eur(ZONES.ac.n*ZONES.ac.unit)}</b> pour rien. Prudence n'est pas panique.`; }
		else { bump("crise", -6); txt = `Un plan à mi-chemin : <b>${c.risk} %</b> de risque restant pour ${eur(c.tot)} à prévoir. Le meilleur plan coûtait ${eur(BEST)} en tout.`; }
		tvNews(views(), optimal ? "Lot B : la chocolaterie rappelle ses boîtes" : "Lot B : la chocolaterie hésite encore");
		W.ticker(optimal ? "Verbrugge rappelle le lot B · « une décision rapide », salue un expert ·" : "Lot B : la décision de Verbrugge fait débat ·");
		lam(txt);
		verdict("plan", stars, stars === 3 ? "Les chiffres et les philosophes disaient la même chose : c'est rare, et c'est ce qui rend une décision solide." : "Relisez ce que disait chaque buste : le meilleur plan les mettait tous d'accord, et c'était aussi le moins cher au total.");
		after(() => add(course("couts") + course("incert") + course("ethique") + `<button class="cc-go" data-a="equipe">3 · Tenir l'équipe →</button>`));
	}

	/* ---------- moment 3 : tenir l'équipe ---------- */
	let draft = null;
	function equipe(){
		reset("Mme Lambert, Jeanne Verbrugge, toi"); W.showBusts(false);
		stage("3 · Tenir l'équipe", "equipe", 210); W.seatAll();
		const p = S.planDone || S.plan;
		draft = DRAFT(p).map(s => ({ ...s, st:"orig" }));
		W.ticker("11 h 30 · réunion d'équipe à la chocolaterie · l'atelier est à l'arrêt ·");
		W.tv((x, w, h) => { x.fillStyle = "#f6f1e7"; x.fillRect(0, 0, w, h); x.fillStyle = "#1b2533"; x.font = "900 54px Nunito, sans-serif"; x.fillText("Réunion d'équipe · 11 h 30", 46, 100); x.font = "700 36px Nunito, sans-serif"; x.fillStyle = "#4d5868"; x.fillText("Message de la direction : en relecture", 46, 170); x.fillText("Chloé, Marc et Inès attendent.", 46, 220); });
		add(day("11 h 30"));
		say("Jeanne Verbrugge · Directrice", "#5a3520", "Voilà mon message pour l'équipe. Je suis à bout, je l'ai écrit d'un trait. Vous le relisez avant que je l'envoie ?", { fast:true });
		lam("Elle est en colère, et ça se lit. Corrigez son brouillon : <b>rayez ou réécrivez ce qui blesse ou ce qui ment</b>, gardez ce qui informe. Chloé, Marc et Inès sont autour de la table : regardez-les.");
		after(() => { draftSheet(); });
	}
	function feelings(){
		const st = id => draft.find(s => s.id === id).st;
		const f = { chloe:"🙂", marc:"🙂", ines:"🙂" };
		if(st("s2") === "orig" || st("s5") === "orig") f.marc = "😠";
		if(st("s7") === "orig") f.ines = "😠"; else if(st("s7") === "cut" || st("s3") === "cut" || st("s6") === "cut") f.ines = "😕";
		if(st("s8") === "orig" || st("s4") === "orig") f.chloe = "😟"; else if(st("s8") === "cut") f.chloe = "😕";
		if(st("s9") === "cut") for(const k in f) if(f[k] === "🙂") f[k] = "😐";
		if(st("s9") !== "cut") for(const k in f) if(f[k] === "🙂" && draft.every(s => s.st === "orig" ? !["blesse", "ment"].includes(s.k) : true)) f[k] = "😊";
		return f;
	}
	function draftSheet(){
		const f = feelings();
		openSheet(`<div class="cc-sh"><span><b>✏️ Brouillon · à toute l'équipe</b><small>Touche une phrase : 1× la rayer, 2× la réécrire, 3× la rétablir</small></span></div>
			<div class="cc-paper">${draft.map(s => `<button class="cc-seg ${s.st}" data-a="seg" data-id="${s.id}">${esc(s.st === "re" ? s.re : s.t)}</button>`).join(" ")}<br><i style="font-size:13px;color:#6b7686">Jeanne Verbrugge</i></div>
			<div class="cc-feel">${Object.keys(TEAM).map(id => `<span><i>${f[id]}</i>${TEAM[id].name} · ${TEAM[id].role}</span>`).join("")}</div>
			<button class="cc-go" data-a="send">Renvoyer le message corrigé</button>`, true);
		for(const id in f) W.face(id, f[id]);
	}
	function segTap(id){
		const s = draft.find(x => x.id === id); if(!s) return;
		s.st = s.st === "orig" ? "cut" : s.st === "cut" ? (s.re ? "re" : "orig") : "orig";
		play(s.st === "cut" ? "swipe" : "clic"); draftSheet();
	}
	function send(){
		const st = id => draft.find(s => s.id === id).st;
		const issues = [];
		for(const s of draft){
			if((s.k === "blesse" || s.k === "ment") && s.st === "orig") issues.push(s);
			else if((s.k === "fait" || s.k === "merci" || s.k === "ok") && s.st === "cut") issues.push(s);
			else if(s.need && s.st === "cut") issues.push(s);
		}
		const f = feelings(); closeSheet(); clock(240, true);
		const text = draft.filter(s => s.st !== "cut").map(s => s.st === "re" ? s.re : s.t).join(" ");
		add(`<div class="cc-b me"><span class="who" style="color:#d6e6ff">Envoyé à l'équipe, signé Jeanne Verbrugge</span>${esc(text)}</div>`);
		const lines = {
			marc:{ "😠":"« Encore l'atelier », « les coupables »… Je ne vais pas porter le chapeau pour tout le monde. Je sors.", "🙂":"Ok. On cherche la cause ensemble, l'atelier sera là.", "😊":"Merci de ne pas avoir cherché de coupable. L'atelier est avec vous." },
			ines:{ "😠":"« Débrouille-toi » ? Je ne suis pas payée pour me faire insulter par les clients sans consigne.", "😕":"Et je dis quoi aux clients, concrètement ? Je n'ai aucune consigne…", "🙂":"C'est clair : remboursement sans discuter, script à 13 h. J'y vais.", "😊":"Parfait, c'est limpide. Je briefe l'équipe du service client." },
			chloe:{ "😟":"On me demande de dire aux journalistes que tout va bien ? Je ne mentirai pas pour la boîte.", "😕":"Et moi, je réponds quoi à la presse en attendant ?", "🙂":"Ok : rien à la presse avant 15 h. Je canalise les appels.", "😊":"Merci. Je me sens soutenue, je canalise les appels." }
		};
		let quit = 0, ok = 0;
		for(const id of Object.keys(TEAM)){
			const e = f[id] === "😐" ? "🙂" : f[id], T = TEAM[id];
			say(`${T.name} · ${T.role}`, T.col, esc(lines[id][e] || lines[id]["🙂"]), { then:() => {
				if(e === "😠" || e === "😟"){ quit++; bump("clim", -15); bump("crise", 4); play("bad"); later(700, () => W.leave(id)); add(sys(`${T.name} a quitté le groupe`)); }
				else if(e === "😕"){ bump("clim", -4); }
				else { ok++; bump("clim", 8); }
			} });
		}
		const stars = issues.length === 0 ? 3 : issues.length <= 2 ? 2 : 1;
		if(stars < 3) ev("err");
		after(() => {
			const why1 = s => s.st === "cut" ? (s.need ? `rayer « ${s.t} » laisse sans consigne : il fallait la réécrire` : `« ${s.t} » informait, il fallait le garder`) : s.k === "blesse" ? `« ${s.t} » blesse` : `« ${s.t} » ment`;
			const why = issues.length ? "À revoir : " + issues.slice(0, 3).map(why1).join(" ; ") + (issues.length > 3 ? ` ; et ${issues.length - 3} autre${issues.length > 4 ? "s" : ""}` : "") + "." : "Rien qui blesse, rien qui ment, une consigne claire pour chacun : c'est exactement ça.";
			verdict("equipe", stars, why);
			after(() => add(course("humain") + course("rh") + `<button class="cc-go" data-a="communique">4 · Le communiqué →</button>`));
		});
	}

	/* ---------- moment 4 : parler au public ---------- */
	function communique(){
		reset("Mme Lambert, Chloé, Jeanne Verbrugge, toi"); renderPins(false);
		stage("4 · Le communiqué", "communique", 360);
		for(const id in W.PEOPLE) W.face(id, null);
		S.comm = { pathos:0, logos:new Set(), ethos:new Set(), sign:false };
		W.ticker("15 h : la chocolaterie Verbrugge doit s'exprimer · la presse attend ·");
		add(day("14 h"));
		say("Chloé · Communication", "#4a78c8", "La presse attend notre communiqué pour 15 h. Cette fois, c'est vous qui l'écrivez.", { fast:true });
		lam("Aristote l'enseignait déjà : on convainc par l'émotion (<b>pathos</b>), par les faits (<b>logos</b>) et par la confiance qu'on inspire (<b>ethos</b>). <b>Dosez</b> chacun : en dessous, les premiers lecteurs réagissent en direct.");
		after(() => { commSheet(); });
	}
	function commText(c){
		const p = S.planDone || S.plan, parts = [];
		if(c.pathos) parts.push(`<p class="ph">${esc(PATHOS[c.pathos][1])}</p>`);
		const lg = ["qualite", "sav", "stock", "couts"].filter(k => c.logos.has(k)).map(k => LOGOS[k]);
		const act = p.rayon || p.clients ? planLine(p).replace("On retire", "Nous retirons").replace("on rappelle", "nous rappelons").replace("On rappelle", "Nous rappelons") : "";
		if(lg.length || act) parts.push(`<p class="lg">${esc([...lg, act].filter(Boolean).join(" "))}</p>`);
		const et = ["rembourse", "labo", "garantie"].filter(k => c.ethos.has(k)).map(k => ETHOS[k].t);
		if(et.length) parts.push(`<p class="et">${esc(et.join(" "))}</p>`);
		parts.push(c.sign ? `<p class="sig">Jeanne Verbrugge, directrice</p>` : `<p class="empty">(non signé)</p>`);
		return parts.join("");
	}
	function comments(c){
		const p = S.planDone || S.plan, out = [];
		const C = (who, ic, t, pos, likes) => out.push({ who, ic, t, pos, likes });
		[["@julie59", "🙄", "Pas un mot pour les clients ? Sympa.", false, 214], ["@mamie_roubaix", "😤", "« Désagrément » ? Ma petite-fille a ouvert une boîte toute blanche…", false, 188],
			["@julie59", "🙏", "Merci de le reconnaître, c'est déjà ça.", true, 156], ["@nordinfo", "🐊", "Larmes de crocodile. On veut des actes, pas un mélo.", false, 241]].forEach((x, i) => { if(i === c.pathos) C(...x); });
		const real = ["qualite", "sav", "stock"].filter(k => c.logos.has(k));
		if(!real.length) C("@lucas_rbx", "🤨", "Des chiffres, svp. Combien de boîtes ? C'est grave ou pas ?", false, 173);
		if(c.logos.has("qualite")) C("@lucas_rbx", "👍", "15 % d'un lot, contrôlé : au moins c'est clair.", true, 97);
		if(c.logos.has("sav")) C("@mamie_roubaix", "😮‍💨", "Aucun malade, ouf.", true, 64);
		if(c.logos.has("couts")) C("@nordinfo", "🤷", "Vos coûts à vous, franchement, on s'en fiche.", false, 132);
		if(!p.rayon && !p.clients) C("@julie59", "😡", "Et vous ne retirez même pas les boîtes des rayons ?!", false, 260);
		if(c.ethos.has("rembourse")) p.clients ? C("@mamie_roubaix", "💶", "Remboursé même sans ticket, ça c'est réglo.", true, 120) : C("@lucas_rbx", "🤔", "Vous remboursez, mais vous ne rappelez pas les boîtes vendues ? Incohérent.", false, 140);
		else if(p.clients) C("@julie59", "🧾", "Et les gens qui ont déjà acheté la boîte, on fait comment ?", false, 150);
		if(c.ethos.has("labo")) C("@chimiste_lille", "🔬", "Publier les analyses : transparent. J'attends ça.", true, 88);
		if(c.ethos.has("garantie")) C("@nordinfo", "😂", "« Zéro défaut garanti », comme ce lot ? Personne n'y croit.", false, 199);
		C(c.sign ? "@lucas_rbx" : "@chimiste_lille", c.sign ? "✍️" : "🤖", c.sign ? "Une directrice qui signe de son nom, respect." : "Qui parle ? Un robot du service com ?", c.sign, c.sign ? 76 : 121);
		return out.sort((a, b) => b.likes - a.likes);
	}
	// le communiqué se monte une fois ; chaque réglage ne met à jour que l'aperçu (le doigt garde le curseur)
	function commSheet(){
		openSheet(`<div class="cc-sh"><span><b>📣 Communiqué · @verbrugge</b><small>Aperçu en direct · publication à 15 h</small></span></div>
			<div class="cc-post"><header><i>V</i><span><b>Chocolaterie Verbrugge ✓</b><small>@verbrugge · brouillon</small></span></header><div data-text></div>
				<div class="cc-coms" data-coms></div>
				<div class="cc-mood">Opinion <i><b data-mood></b></i><span data-pct></span></div></div>
			<div class="cc-lbl" style="color:#c2547a"><span>Pathos · l'émotion</span><small>glisse pour doser</small></div>
			<div class="cc-dose" data-dose role="slider" aria-label="Dose d'émotion" aria-valuemin="0" aria-valuemax="3" tabindex="0">${PATHOS.map(([l], i) => `<span style="left:${12 + i*25.3}%">${l}</span>`).join("")}<b>♥</b></div>
			<div class="cc-lbl" style="color:#2c5f9e"><span>Logos · les faits</span><small>touche un fait épinglé pour le citer</small></div>
			<div class="cc-chips">${S.pinned.map(id => `<button class="cc-chip lg" data-a="logos" data-id="${id}">📌 ${esc(FACTS.find(f => f.id === id).chip)}</button>`).join("")}</div>
			<div class="cc-lbl" style="color:#2f8a5b"><span>Ethos · la confiance</span><small>s'engager, et signer</small></div>
			<div class="cc-chips">${Object.keys(ETHOS).map(k => `<button class="cc-chip et" data-a="ethos" data-id="${k}">${ETHOS[k].chip}</button>`).join("")}<button class="cc-chip et" data-a="sign">✍️ Signer : Jeanne Verbrugge</button></div>
			<button class="cc-go" data-a="publish">Publier le communiqué</button>`);
		bindDose(); commUpdate(); phone.classList.add("compose"); sheet.scrollTop = 0;
	}
	let lastComs = "";
	function commUpdate(){
		const c = S.comm, coms = comments(c), pos = coms.filter(x => x.pos).length, ratio = coms.length ? pos/coms.length : 0;
		sheet.querySelector("[data-text]").innerHTML = commText(c);
		const html = coms.slice(0, 4).map(x => `<div class="cc-com ${x.pos ? "pos" : "neg"}"><i>${x.ic}</i><span><b>${x.who}</b>${esc(x.t)}</span></div>`).join("");
		if(html !== lastComs){ sheet.querySelector("[data-coms]").innerHTML = html; lastComs = html; }
		sheet.querySelector("[data-mood]").style.width = Math.round(ratio*100) + "%"; sheet.querySelector("[data-pct]").textContent = Math.round(ratio*100) + " %";
		const d = sheet.querySelector("[data-dose]"); d.querySelector("b").style.left = (12 + c.pathos*25.3) + "%"; d.setAttribute("aria-valuenow", c.pathos); d.setAttribute("aria-valuetext", PATHOS[c.pathos][0]);
		sheet.querySelectorAll('[data-a="logos"]').forEach(b => { const on = c.logos.has(b.dataset.id); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
		sheet.querySelectorAll('[data-a="ethos"]').forEach(b => { const on = c.ethos.has(b.dataset.id); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
		const sg = sheet.querySelector('[data-a="sign"]'); sg.classList.toggle("on", c.sign); sg.setAttribute("aria-pressed", c.sign);
		const neg = coms.length - pos;
		W.tv((x, w, h) => { x.fillStyle = "#f6f1e7"; x.fillRect(0, 0, w, h); x.fillStyle = "#1b2533"; x.font = "900 50px Nunito, sans-serif"; x.fillText("Communiqué en préparation", 46, 92);
			x.font = "800 36px Nunito, sans-serif"; x.fillStyle = "#2f8a5b"; x.fillText("👍 " + pos + " réaction" + (pos > 1 ? "s" : "") + " positive" + (pos > 1 ? "s" : ""), 46, 180); x.fillStyle = "#c42b3b"; x.fillText("👎 " + neg + " négative" + (neg > 1 ? "s" : ""), 46, 236);
			x.fillStyle = "#e3dccd"; x.fillRect(46, 280, 900, 34); x.fillStyle = "#3fbf7f"; x.fillRect(46, 280, 900*ratio, 34); });
	}
	function bindDose(){
		const el = sheet.querySelector("[data-dose]"); if(!el) return;
		const set = e => { const r = el.getBoundingClientRect(); if(!r.width) return; const k = Math.max(0, Math.min(3, Math.round((e.clientX - r.left)/r.width*4 - .5))); if(k !== S.comm.pathos){ S.comm.pathos = k; play("clic"); commUpdate(); } };
		let drag = false;
		el.addEventListener("pointerdown", e => { drag = true; try { el.setPointerCapture(e.pointerId); } catch(_){} set(e); });
		el.addEventListener("pointermove", e => { if(drag) set(e); });
		el.addEventListener("pointerup", () => { drag = false; });
		el.addEventListener("pointercancel", () => { drag = false; });
		el.addEventListener("keydown", e => { if(e.key === "ArrowRight" || e.key === "ArrowLeft"){ e.preventDefault(); S.comm.pathos = Math.max(0, Math.min(3, S.comm.pathos + (e.key === "ArrowRight" ? 1 : -1))); play("clic"); commUpdate(); } });
	}
	function commToggle(set, id){ set.has(id) ? set.delete(id) : set.add(id); play("clic"); commUpdate(); }
	function publish(){
		const c = S.comm, coms = comments(c), neg = coms.filter(x => !x.pos), pos = coms.length - neg.length;
		closeSheet(); clock(415, true); play("win");
		add(sys("Publié à 14 h 55"));
		add(`<div class="cc-post"><header><i>V</i><span><b>Chocolaterie Verbrugge ✓</b><small>@verbrugge · à l'instant</small></span></header>${commText(c)}</div>`);
		coms.slice(0, 5).forEach((x, i) => later(500 + i*450, () => { add(`<div class="cc-b"><span class="who" style="color:${x.pos ? "#1f6a40" : "#a3212f"}">${x.ic} ${x.who} · ♥ ${x.likes}</span>${esc(x.t)}</div>`); play(x.pos ? "coin" : "pop"); }));
		const stars = neg.length === 0 ? 3 : neg.length === 1 ? 2 : 1;
		bump("crise", stars === 3 ? -20 : stars === 2 ? -10 : 6);
		if(stars < 3) ev("err");
		const ratio = coms.length ? pos/coms.length : 0;
		W.tv((x, w, h) => { x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.fillStyle = "#5a3520"; x.beginPath(); x.arc(90, 90, 46, 0, 7); x.fill(); x.fillStyle = "#f3d9a6"; x.font = "900 48px Nunito, sans-serif"; x.textAlign = "center"; x.fillText("V", 90, 106); x.textAlign = "left";
			x.fillStyle = "#1b2533"; x.font = "900 40px Nunito, sans-serif"; x.fillText("Chocolaterie Verbrugge ✓", 156, 82); x.font = "700 30px Nunito, sans-serif"; x.fillStyle = "#6b7686"; x.fillText("Communiqué officiel · 14 h 55", 156, 124);
			x.fillStyle = "#1b2533"; x.font = "700 32px Nunito, sans-serif"; let y = 200;
			const words = commText(c).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" "); let line = "";
			for(const wd of words){ if(x.measureText(line + wd).width > w - 100){ x.fillText(line, 50, y); y += 42; line = ""; if(y > 430) break; } line += wd + " "; }
			if(y <= 430) x.fillText(line, 50, y);
			x.fillStyle = "#e3dccd"; x.fillRect(50, 480, 924, 30); x.fillStyle = ratio >= .6 ? "#3fbf7f" : ratio >= .35 ? "#e8a33a" : "#e0402f"; x.fillRect(50, 480, 924*ratio, 30);
			x.fillStyle = "#4d5868"; x.font = "800 26px Nunito, sans-serif"; x.fillText("Opinion favorable : " + Math.round(ratio*100) + " %", 50, 548); });
		W.ticker(stars === 3 ? "Verbrugge reconnaît, explique et rembourse · « un communiqué exemplaire » ·" : "Le communiqué de Verbrugge divise les internautes ·");
		later(500 + 5*450, () => {
			verdict("communique", stars, stars === 3 ? "Il reconnaît, il explique, il répare, et quelqu'un signe. Un communiqué qui tient sur ses trois appuis." : `Les commentaires vous ont montré ce qui coinçait : ${neg.slice(0, 2).map(x => `« ${esc(x.t)} »`).join(" et ")}.`);
			after(() => add(course("persuader") + course("comm") + course("affaires") + `<button class="cc-go" data-a="end">Voir le bilan →</button>`));
		});
	}

	/* ---------- bilan ---------- */
	function finale(){
		reset("Mme Lambert, toi"); renderPins(false);
		stage("Bilan de la crise", "end", 570);
		const st = total();
		const mention = MENTIONS[st >= 11 ? 3 : st >= 8 ? 2 : st >= 5 ? 1 : 0];
		const rank = { "Très bien":"déjà du métier", "Bien":"de très bons réflexes", "Assez bien":"de bons réflexes, à affiner", "De justesse":"tout à apprendre, et c'est normal" }[mention];
		ev("win", mention); play("win");
		const p = S.planDone || S.plan;
		tvNews(views(), S.crise < 40 ? "La crise retombe : Verbrugge a tenu bon" : "Verbrugge : une journée difficile");
		W.ticker(`17 h 30 · niveau de crise ${Math.round(S.crise)} % · la cellule de crise se dissout ·`);
		add(day("17 h 30") + sys(`${esc(formation.name)} · bilan`));
		lam(`Mention <b>${mention}</b> : <b>${st} / 12 ★</b>. Pour moi, vous avez <b>${rank}</b>. ${st >= 11 ? "Je n'aurais pas mieux fait." : st >= 8 ? "Encore une crise ou deux, et ce sera parfait." : "Une crise, ça s'apprend : rejouez, les rumeurs changent."}`, { fast:true });
		after(() => {
			add(`<div class="cc-recap"><ul>
				<li><span>📌 1 · Trier l'info</span><b>${STARS(S.stars.tri || 0)}</b></li><li><span>📊 2 · Décider</span><b>${STARS(S.stars.plan || 0)}</b></li>
				<li><span>✏️ 3 · Tenir l'équipe</span><b>${STARS(S.stars.equipe || 0)}</b></li><li><span>📣 4 · Le communiqué</span><b>${STARS(S.stars.communique || 0)}</b></li>
				<li><span>🚨 Niveau de crise</span><b>${Math.round(S.crise)} %</b></li><li><span>🤝 Climat d'équipe</span><b>${Math.round(S.clim)} / 100</b></li>
				<li><span>↩ Décision</span><b>${p.rayon || p.clients ? (p.rayon && p.clients ? "Rappel du lot B" : "Rappel partiel") : "Attente des analyses"}${p.ac ? " + lots A et C" : ""}</b></li></ul></div>`);
			lam("Vérifier avant de croire, chiffrer avant de décider, parler juste à chacun, convaincre sans mentir : c'est le management éclairé de la licence, avec la gestion et la philosophie dans le même cursus. Vous avez touché à :", { fast:true });
			after(() => {
				add(Object.keys(COURSES).filter(k => S.learned.has(k)).map(k => `<div class="cc-b cc-link"><span class="tag">📚 ${COURSES[k][1].split(" · ")[0]}</span><b>${COURSES[k][0]}</b><span></span></div>`).join(""));
				add(`<div style="align-self:stretch">${jpoCard()}</div>${openLead ? `<button class="cc-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
					<a class="cc-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Management & Humanités ↗</a>
					<button class="cc-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
					<button class="cc-alt" data-a="replay">Rejouer : d'autres rumeurs, d'autres choix</button>`);
			});
		});
	}

	/* ---------- actions ---------- */
	const STEPS = { tri, plan, equipe, communique, end:finale };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a || a.disabled) return;
		const k = a.dataset.a;
		if(STEPS[k]){ play("pop"); a.remove(); return STEPS[k](); }
		if(k === "msg") return m1Open(a.dataset.id);
		if(k === "shclose"){ if(M1 && M1.open){ M1.open.el.classList.remove("open"); M1.open = null; M1.flag = false; M1.recoupMode = false; renderPins(false); } return closeSheet(); }
		if(k === "recoup"){ e.stopPropagation(); M1.recoupMode = true; renderPins(true); play("clic"); return m1Sheet(); }
		if(k === "row") return m1Row(a.dataset.k);
		if(k === "pin") return m1Pin();
		if(k === "flag"){ M1.flag = true; M1.recoupMode = false; renderPins(false); play("clic"); return m1Sheet(); }
		if(k === "flagx"){ M1.flag = false; return m1Sheet(); }
		if(k === "pinchip"){ if(S.step === "tri" && M1 && M1.recoupMode) m1Recoup(a.dataset.id); return; }
		if(k === "zone") return planToggle(a.dataset.z);
		if(k === "decide") return decide();
		if(k === "seg") return segTap(a.dataset.id);
		if(k === "send") return send();
		if(k === "logos") return commToggle(S.comm.logos, a.dataset.id);
		if(k === "ethos") return commToggle(S.comm.ethos, a.dataset.id);
		if(k === "sign"){ S.comm.sign = !S.comm.sign; play("clic"); return commUpdate(); }
		if(k === "publish") return publish();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){
			Object.assign(S, { stars:{}, learned:new Set(), pinned:[], planDone:null, comm:null });
			gauge("crise", 75); gauge("clim", 60); $("[data-stars]").textContent = "★ 0 / 12";
			return tri();
		}
	});
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".cc-x").addEventListener("click", () => close());

	let pump = 0;      // ?vite : l'image se rafraîchit même quand le navigateur bride l'affichage
	if(SPEED > 1) pump = setInterval(() => { if(!closed) W.snap(); }, 60);
	function close(){
		if(closed) return; closed = true; qGen++;
		for(const t of timers) clearTimeout(t); timers.clear(); clearInterval(pump); clearInterval(sizeT);
		removeEventListener("resize", sizeCheck); document.removeEventListener("keydown", onKey);
		W.dispose(); root.remove();
		if(window.__crise) delete window.__crise;
		onClose && onClose();
	}

	tri();      // ouverture à chaud : la vidéo, puis les messages à trier, sans écran d'accueil
	ev("start");
	ev("missions", [["1 · Trier l'info", tri], ["2 · Décider", plan], ["3 · Tenir l'équipe", equipe], ["4 · Le communiqué", communique], ["Bilan", finale]]);
	const hook = { S, W, get M1(){ return M1; }, get draft(){ return draft; }, snap:() => W.snap(), ...STEPS, close };
	if(window.campus) window.campus.game = hook;
	if(SPEED > 1) window.__crise = hook;
}
