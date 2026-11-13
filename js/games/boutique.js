/* « Courée, la boutique en 3D » — mini-jeu du Master E-Business & Marketing Digital (École du Numérique).
   Courée est une jeune marque lilloise fictive de sweats brodés. Le joueur, en alternance, fait décoller son site :
   tunnel de commande (UX/UI, accessibilité), référencement, bannière cookies (RGPD), budget d'acquisition,
   CRM, puis un Black Friday en direct (performance mobile, stock, logistique, avis clients).
   Le site est montré comme une boutique en 3D vue en coupe : chaque personnage est un groupe de visiteurs,
   ceux qui font demi-tour sont des ventes perdues. Chiffres simplifiés et illustratifs, à relire par l'équipe du master. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { jpoCard } from "./jpo.js?v=c983301653";
import { palier } from "./palier.js?v=c983301653";

const COURSES = {
	ux:    ["UX design, UI et accessibilité", "Observer les utilisateurs, simplifier les parcours, rendre un site lisible par tous (contrastes, formulaires, WCAG)."],
	seo:   ["Référencement naturel (SEO)", "Comment les moteurs classent les pages, et comment rédiger titres, descriptions et adresses qui donnent envie de cliquer."],
	rgpd:  ["Droit du numérique et RGPD", "Consentement, cookies, données personnelles : vendre en ligne en respectant la loi et la confiance des clients."],
	acq:   ["Acquisition et croissance", "Annonces, réseaux sociaux, influence, e-mail : choisir ses canaux et répartir un budget média."],
	data:  ["Web analytics", "Lire les chiffres d'un site (trafic, conversion, ROAS) pour décider où mettre l'argent."],
	crm:   ["CRM et relation client", "Segmenter sa base, envoyer le bon message à la bonne personne, au bon moment, et fidéliser."],
	perf:  ["Performance de site et marketing mobile", "Un site rapide sur téléphone, qui tient la charge les jours de forte affluence."],
	logi:  ["E-business et logistique", "Stock, promesse de livraison, retours, avis : ce qui se passe après le clic sur « Payer »."]
};
const MOBILE = 860;
const STEPS = [["ux", "Tunnel"], ["seo", "SEO"], ["rgpd", "Cookies"], ["acq", "Acquisition"], ["crm", "CRM"], ["bf", "Black Friday"]];
// les canaux d'arrivée sur le site : icône, nom, couleur des visiteurs
const CH = { seo:["🔎", "Recherche", "#12a26f"], ads:["📣", "Publicité", "#f59e0b"], social:["📱", "Réseaux sociaux", "#ec4899"], influ:["⭐", "Influence", "#8b5cf6"], mail:["✉️", "E-mail", "#3b82f6"], direct:["🔗", "Direct", "#64748b"] };
const PORTALS = ["seo", "ads", "social", "influ", "mail", "direct"];
const ROOMS = { vitrine:[-8.7, "#ffe4d6", "Accueil"], rayons:[-2.1, "#e1e9ff", "Catalogue"], fiche:[4.5, "#eee2ff", "Fiche produit"], caisse:[11.1, "#d9f2e5", "Tunnel de commande"] };
const ROOM_KEYS = ["vitrine", "rayons", "fiche", "caisse"];

const CSS = `
.eb{--ink:#16141f;--ink2:#4a4759;--mut:#8b879a;--line:#e8e5f0;--soft:#f6f5fa;--vio:#96711a;--vio2:#fdf8ec;--ok:#0f9b6c;--okb:#e2f6ed;--ko:#e5484d;--kob:#fdeced;--warn:#96711a;--wb:#fdf8ec;
	--brick:#b23a24;--cream:#fdf8ec;--bink:#2b1d18;
	position:fixed;inset:0;z-index:40;overflow:hidden;color:var(--ink);font:300 14px/1.5 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;animation:ebIn .4s ease both;
	background:radial-gradient(900px 600px at 12% 8%,#fdf8ec 0,rgba(253,248,236,0) 60%),radial-gradient(800px 600px at 55% 100%,#fdf8ec 0,rgba(253,248,236,0) 60%),radial-gradient(700px 500px at 35% 55%,#e2f5ec 0,rgba(226,245,236,0) 65%),#f7f6fb}
@keyframes ebIn{from{opacity:0}}
.eb *{box-sizing:border-box}
.eb canvas{position:absolute;left:0;top:0;display:block;touch-action:none}
.eb button{font-family:inherit}
.eb-labs{position:absolute;left:0;top:0;pointer-events:none;z-index:1}
.eb-lab{position:absolute;left:0;top:0;display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:10px;padding:5px 9px 5px 7px;white-space:nowrap;box-shadow:0 6px 16px rgba(15,49,104,.10);transition:opacity .3s}
.eb-lab i{width:8px;height:8px;border-radius:50%;flex:none}
.eb-lab b{display:block;font:300 12px/1.2 Inter,system-ui,sans-serif;letter-spacing:-.01em}
.eb-lab small{display:block;font:300 11px/1.2 Inter,system-ui,sans-serif;color:var(--ink2)}
.eb-lab.pt{padding:2px 8px 2px 6px;border-radius:999px;gap:5px}.eb-lab.pt b{font-size:11px;font-variant-numeric:tabular-nums}.eb-lab.pt small{display:none}
.eb-lab.dim{opacity:.45}
.eb-lab.hot{border-color:var(--vio);box-shadow:0 0 0 3px var(--vio2),0 6px 16px rgba(15,49,104,.12)}
.eb-top{position:absolute;left:0;right:0;top:0;height:58px;display:flex;align-items:center;gap:12px;padding:0 14px;z-index:4;pointer-events:none}
.eb-top>*{pointer-events:auto}
.eb-brand{display:flex;align-items:center;gap:9px;font:300 15px Inter,system-ui,sans-serif;letter-spacing:-.02em;white-space:nowrap}
.eb-brand i{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font:300 19px Tiempos Headline,Georgia,serif;color:var(--cream);background:var(--brick);box-shadow:0 4px 10px rgba(178,58,36,.35);font-style:normal}
.eb-brand small{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--mut)}
.eb-steps{list-style:none;margin:0 auto;padding:4px;display:flex;gap:2px;background:rgba(255,255,255,.75);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--line);border-radius:999px}
.eb-steps li{font:700 12.5px Inter,system-ui,sans-serif;padding:6px 12px;border-radius:999px;color:var(--mut);display:flex;align-items:center;gap:6px;transition:all .3s}
.eb-steps li span{font-size:10.5px;width:17px;height:17px;border-radius:50%;display:grid;place-items:center;background:var(--line);color:var(--ink2)}
.eb-steps li.done{color:var(--ink)}.eb-steps li.done span{background:var(--ok);color:#fff}
.eb-steps li.now{background:var(--ink);color:#fff}.eb-steps li.now span{background:var(--vio);color:#fff}
.eb-stepm{display:none;margin-left:auto;font:700 12.5px Inter,system-ui,sans-serif;background:rgba(255,255,255,.9);border:1px solid var(--line);border-radius:999px;padding:6px 11px}
.eb-x{width:38px;height:38px;flex:none;border-radius:50%;border:1px solid var(--line);background:#fff;font-size:20px;line-height:1;cursor:pointer;color:var(--ink);box-shadow:0 4px 12px rgba(15,49,104,.08)}
.eb-x:hover{background:var(--soft)}
.eb-kpis{position:absolute;left:14px;top:64px;z-index:3;display:flex;gap:8px;pointer-events:none}
.eb-k{background:rgba(255,255,255,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--line);border-radius:12px;padding:7px 12px 8px;min-width:92px;box-shadow:0 6px 18px rgba(15,49,104,.06);transition:transform .3s}
.eb-k small{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);white-space:nowrap}
.eb-k b{display:block;font:300 18px/1.2 Inter,system-ui,sans-serif;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}
.eb-k.up{animation:ebUp .7s ease}.eb-k.dn{animation:ebDn .7s ease}
@keyframes ebUp{30%{transform:translateY(-3px);box-shadow:0 0 0 3px var(--okb)}}
@keyframes ebDn{30%{transform:translateY(2px);box-shadow:0 0 0 3px var(--kob)}}
.eb-k b.ok{color:var(--ok)}.eb-k b.ko{color:var(--ko)}
.eb-chat{position:absolute;left:14px;bottom:14px;z-index:5;display:flex;flex-direction:column;gap:8px;width:min(370px,calc(100% - 28px))}
.eb-msg{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px 12px;box-shadow:0 12px 30px rgba(15,49,104,.13);animation:ebMsg .4s cubic-bezier(.2,.9,.3,1.1) both;cursor:pointer;transition:opacity .4s,transform .4s}
.eb-msg.old{opacity:.55;transform:scale(.97)}
.eb-msg.bye{opacity:0;transform:translateX(-20px)}
@keyframes ebMsg{from{opacity:0;transform:translateY(14px) scale(.96)}}
.eb-av{width:34px;height:34px;flex:none;border-radius:50%;display:grid;place-items:center;font:300 12.5px Inter,system-ui,sans-serif;color:#fff;background:linear-gradient(135deg,#ff7a59,#96711a)}
.eb-msg p{margin:0;font-size:13.5px;line-height:1.45;color:var(--ink2)}
.eb-msg p b{display:block;font:300 12.5px Inter,system-ui,sans-serif;color:var(--ink);margin-bottom:1px}
.eb-msg p b em{font-style:normal;font-weight:500;color:var(--mut);margin-left:4px}
.eb-dots{display:inline-flex;gap:3px;padding:4px 0}.eb-dots i{width:6px;height:6px;border-radius:50%;background:var(--mut);animation:ebDot 1s infinite}
.eb-dots i:nth-child(2){animation-delay:.15s}.eb-dots i:nth-child(3){animation-delay:.3s}
@keyframes ebDot{50%{opacity:.25;transform:translateY(-2px)}}
.eb-win{position:absolute;right:14px;top:64px;bottom:14px;width:480px;z-index:3;display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 30px 80px rgba(15,49,104,.16),0 2px 6px rgba(15,49,104,.06)}
.eb-wh{height:42px;flex:none;display:flex;align-items:center;gap:10px;padding:0 12px;border-bottom:1px solid var(--line);background:#fbfbfd}
.eb-wh .d{display:flex;gap:6px}.eb-wh .d i{width:10px;height:10px;border-radius:50%;background:#e2dfea}
.eb-wh .d i:nth-child(1){background:#ff6b5f}.eb-wh .d i:nth-child(2){background:#cb971a}.eb-wh .d i:nth-child(3){background:#2fcf6a}
.eb-url{flex:1;min-width:0;display:flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:4px 10px;font:300 12.5px Inter,system-ui,sans-serif;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.eb-url span{overflow:hidden;text-overflow:ellipsis}
.eb-tab{font:700 11.5px Inter,system-ui,sans-serif;color:var(--vio);background:var(--vio2);border-radius:999px;padding:3px 9px;white-space:nowrap}
.eb-wb{flex:1;overflow:auto;padding:20px 20px 24px;scrollbar-width:thin}
.eb-wb>*{animation:ebUpIn .4s cubic-bezier(.2,.8,.2,1) both}
@keyframes ebUpIn{from{opacity:0;transform:translateY(10px)}}
.eb-kick{font:700 11px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--vio);margin:0 0 6px}
.eb-h{font:300 25px/1.12 Tiempos Headline,Georgia,serif;letter-spacing:-.03em;margin:0 0 10px}
.eb-h2{font:300 17px/1.2 Inter,system-ui,sans-serif;letter-spacing:-.02em;margin:18px 0 8px}
.eb-p{margin:0 0 12px;color:var(--ink2);font-size:14.5px;line-height:1.55}
.eb-brief{position:relative;background:var(--soft);border-radius:12px;padding:12px 14px 12px 16px;margin:0 0 12px;font-size:14px;color:var(--ink2)}
.eb-brief:before{content:"";position:absolute;left:0;top:10px;bottom:10px;width:3px;border-radius:3px;background:var(--vio)}
.eb-brief b.t{display:block;font:700 11px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--ink);margin-bottom:3px}
.eb-goal{display:flex;gap:8px;align-items:flex-start;font-weight:600;font-size:13.5px;color:var(--ink);margin:0 0 14px}
.eb-goal:before{content:"🎯"}
.eb-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border:0;border-radius:12px;padding:14px 16px;margin-top:14px;background:var(--ink);color:#fff;font:700 15px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;transition:transform .15s,box-shadow .15s,opacity .2s}
.eb-btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(22,20,31,.22)}
.eb-btn.vio{background:var(--vio)}.eb-btn.vio:hover{box-shadow:0 10px 24px rgba(150,113,26,.35)}
.eb-btn[disabled]{opacity:.35;pointer-events:none}
.eb-alt{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-top:8px;background:#fff;color:var(--ink);font:300 14px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}
.eb-alt:hover{background:var(--soft)}
.eb-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.eb-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:6px 11px;background:#fff;font:700 12.5px Inter,system-ui,sans-serif;cursor:pointer;color:var(--ink)}
.eb-chip[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}
.eb-chip.st{cursor:default}
.eb-meta{font:300 12.5px Inter,system-ui,sans-serif;color:var(--mut)}
.eb-list{list-style:none;margin:10px 0;padding:0;display:grid;gap:6px}
.eb-list li{display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:9px 12px;font-weight:600;font-size:13.5px}
.eb-list li i{font-style:normal;width:30px;height:30px;flex:none;border-radius:9px;display:grid;place-items:center;background:var(--soft);font-size:15px}
.eb-list li small{display:block;font-weight:500;color:var(--mut);font-size:12px}
.eb-fine{font-size:12px;color:var(--mut);margin:12px 0 0}
/* le faux site de la marque */
.st{position:relative;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff;color:var(--bink);font:300 13px/1.4 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(15,49,104,.06)}
.st-nav{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--cream);border-bottom:1px solid #fdf8ec}
.st-logo{font:300 21px/1 Tiempos Headline,Georgia,serif;color:var(--brick)}
.st-nav small{font-size:11.5px;color:#8a7466}
.st-nav .c{margin-left:auto;font-size:12px;font-weight:600}
.st-body{padding:12px 14px 14px;display:grid;gap:10px}
.st-steps{font-size:11.5px;color:#8a7466}.st-steps b{color:var(--bink)}
.st-box{border:1px solid #fdf8ec;border-radius:10px;padding:10px 12px;background:#fffdfa}
.st-box>b{display:block;font-size:13.5px;margin-bottom:6px}
.st-fs{display:grid;grid-template-columns:1fr 1fr;gap:6px 8px}
.st-f label{display:block;font-size:10.5px;color:#8a7466;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.st-f i{display:block;height:20px;border:1px solid #fdf8ec;border-radius:6px;background:#fff}
.st-guest{display:flex;flex-direction:column;gap:2px}
.st-guest .g{display:block;text-align:center;border:1.5px solid var(--bink);border-radius:8px;padding:7px;font-weight:700}
.st-guest small{color:#8a7466;text-align:center}
.st-prod{display:flex;align-items:center;gap:10px}
.st-thumb{width:40px;height:40px;border-radius:8px;flex:none;background:radial-gradient(circle at 50% 38%,#d4553c 0 34%,transparent 35%),linear-gradient(#fdf8ec,#fdf8ec)}
.st-prod span{flex:1}.st-prod .st-thumb{flex:none}.st-prod small{display:block;color:#8a7466;font-size:11.5px}
.st-line{display:flex;justify-content:space-between;font-size:12.5px;padding-top:6px;margin-top:6px;border-top:1px dashed #fdf8ec}
.st-line.tot{font-weight:700;font-size:13.5px}
.st-mut{color:#a8968a;font-style:italic}
.st-surprise{background:#fdf8ec;border:1px solid #fdf8ec;border-radius:10px;padding:8px 12px;font-size:12.5px;color:#7a2e1f}
.st-okline{background:#eef8f2;border:1px solid #cfe9db;border-radius:10px;padding:8px 12px;font-size:12.5px;color:#1d6b49}
.st-trust{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:center;font-size:11.5px;color:#6b5a50}
.st-trust b{color:#cb971a}
.st-pay{display:block;width:100%;border:0;border-radius:10px;padding:12px;font:300 14px Inter,system-ui,sans-serif;background:#dcdcdc;color:#f4f4f4;cursor:pointer}
.st-pay.fixed{background:var(--brick);color:#fff}
.st-pop,.hs.st-pop{position:absolute;right:14px;top:150px;width:178px;background:var(--bink);color:var(--cream);border-radius:12px;padding:14px 12px 12px;text-align:center;box-shadow:0 14px 30px rgba(0,0,0,.35);z-index:2}
.st-pop b{display:block;font:300 22px/1.1 Tiempos Headline,Georgia,serif}
.st-pop small{display:block;font-size:11.5px;opacity:.8;margin:2px 0 8px}
.st-pop .e{display:block;height:24px;border-radius:6px;background:rgba(255,255,255,.15)}
.st-pop .x{position:absolute;right:8px;top:4px;font-size:15px;opacity:.6}
.hs{position:relative;border-radius:10px;cursor:pointer;outline:2px dashed transparent;outline-offset:3px;transition:outline-color .2s,background .2s}
.hs:hover{outline-color:rgba(150,113,26,.45)}
.hs.sel{outline:2px solid var(--vio);outline-offset:3px}
.hs .tag{position:absolute;right:-8px;top:-11px;z-index:3;background:var(--vio);color:#fff;font:700 10.5px Inter,system-ui,sans-serif;border-radius:999px;padding:2px 8px;box-shadow:0 4px 10px rgba(150,113,26,.4);white-space:nowrap}
.hs.keep .tag{background:var(--ok);box-shadow:none}.hs.miss .tag{background:var(--ko);box-shadow:none}
.st.locked .hs{cursor:default}.st.locked .hs:hover{outline-color:transparent}.st.locked .hs.sel{outline-color:transparent}
.st.heat .hs[data-heat]:after{content:"";position:absolute;inset:-14px;border-radius:50%;pointer-events:none;z-index:3;mix-blend-mode:multiply;
	background:radial-gradient(closest-side,rgba(230,20,10,var(--h)),rgba(255,150,0,calc(var(--h)*.55)) 55%,rgba(255,230,0,calc(var(--h)*.25)) 75%,transparent);animation:ebHeat 1.6s ease-in-out infinite}
@keyframes ebHeat{50%{opacity:.75}}
.eb-legend{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink2);margin:8px 0 0}
.eb-legend i{width:60px;height:8px;border-radius:4px;background:linear-gradient(90deg,#cb971a,#cb971a,#e6140a)}
.eb-sprint{display:flex;align-items:center;gap:10px;margin:12px 0 0;font:300 13px Inter,system-ui,sans-serif}
.eb-sprint .bar{flex:1;display:flex;gap:4px}.eb-sprint .bar i{flex:1;height:8px;border-radius:4px;background:var(--line);transition:background .3s}.eb-sprint .bar i.on{background:var(--vio)}
/* champs à choix */
.eb-field{margin:0 0 14px}
.eb-field>b{display:block;font:700 12px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--ink);margin:0 0 6px}
.eb-opts{display:grid;gap:6px}
.eb-opt{display:block;width:100%;text-align:left;border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;background:#fff;font:700 13.5px/1.4 Inter,system-ui,sans-serif;color:var(--ink);cursor:pointer;transition:border-color .15s,box-shadow .15s}
.eb-opt:hover{border-color:#c9c4dc}
.eb-opt[aria-pressed=true]{border-color:var(--vio);box-shadow:0 0 0 3px var(--vio2)}
.eb-opt code{font:700 12.5px Inter,system-ui,sans-serif;color:var(--ink2);word-break:break-all}
.eb-opt.ok{border-color:var(--ok);background:var(--okb)}.eb-opt.ko{border-color:var(--ko);background:var(--kob)}
/* page de résultats de recherche (moteur fictif) */
.sr{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:#fff}
.sr-q{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:999px;padding:7px 14px;font-size:13.5px;margin-bottom:10px;box-shadow:0 2px 8px rgba(15,49,104,.06)}
.sr-it{padding:7px 8px;margin:0 -8px;border-radius:10px;transition:background .4s}
.sr-it.me{background:#f3f1ff;box-shadow:inset 0 0 0 1.5px var(--vio)}
.sr-site{display:flex;align-items:center;gap:8px;font-size:12px;color:#3c3a48}
.sr-site i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:300 12px Inter,system-ui,sans-serif;background:#efedf5;font-style:normal;flex:none}
.sr-site.me i{background:var(--brick);color:var(--cream)}
.sr-site small{display:block;color:#6d6a7c;font-size:11.5px}
.sr-t{display:block;font:300 16px/1.3 Inter,system-ui,sans-serif;color:#96711a;margin:3px 0 2px}
.sr-d{font-size:12.5px;line-height:1.45;color:#4e4b5c}
.sr-pos{display:inline-block;font:300 11px Inter,system-ui,sans-serif;color:var(--vio);margin-right:6px}
.sr-p2{text-align:center;font-size:12.5px;color:var(--mut);padding:8px 0 2px;border-top:1px dashed var(--line);margin-top:6px}
/* la page d'accueil et la bannière cookies */
.st-hero{position:relative;height:215px;background:linear-gradient(120deg,var(--brick),#d4553c);color:var(--cream);padding:16px 16px;overflow:hidden}
.st-hero b{display:block;font:300 26px/1.05 Tiempos Headline,Georgia,serif;max-width:60%}
.st-hero small{display:block;margin-top:6px;opacity:.85;font-size:12px}
.st-hero .sw{position:absolute;right:18px;bottom:-14px;width:110px;height:120px;border-radius:30px 30px 10px 10px;background:var(--cream);box-shadow:-60px 22px 0 -16px #fdf8ec}
.st-ban{position:absolute;left:10px;right:10px;bottom:10px;background:#fff;border-radius:12px;box-shadow:0 14px 36px rgba(0,0,0,.28);padding:12px;font-size:12px;color:var(--bink)}
.st-ban>b{display:block;font-size:13px;margin-bottom:4px}
.st-ban .ck{display:flex;flex-wrap:wrap;gap:4px 12px;margin:6px 0 8px;font-size:11.5px}
.st-ban .bt{display:flex;gap:6px;align-items:center}
.st-ban .bt span{flex:1;text-align:center;border-radius:8px;padding:7px 4px;font-weight:700;font-size:12px}
.st-ban .a{background:var(--brick);color:#fff}.st-ban .r{background:var(--brick);color:#fff}.st-ban .p{border:1.5px solid #d9cbbb;flex:.8 !important}
.st-ban .lk{flex:none !important;font-size:9.5px !important;font-weight:500 !important;color:#c9c0b6;padding:0 2px !important}
.st-news{display:flex;gap:8px;align-items:flex-start;font-size:11.5px;color:#6b5a50;padding:10px 14px;border-top:1px solid #fdf8ec;background:var(--cream)}
.st-news i{width:15px;height:15px;flex:none;border-radius:4px;border:1.5px solid #b9a796;margin-top:1px;display:grid;place-items:center;font-style:normal;font-size:10px;font-weight:800;background:#fff}
.st-news i.on{background:var(--brick);border-color:var(--brick);color:#fff}
/* budget */
.eb-budget{display:flex;align-items:center;gap:12px;background:var(--soft);border-radius:12px;padding:10px 12px;margin:0 0 10px;position:sticky;top:-20px;z-index:2}
.eb-budget b{font:300 20px Tiempos Headline,Georgia,serif;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.eb-budget small{display:block;font:700 11px Inter,system-ui,sans-serif;color:var(--mut);text-transform:uppercase;letter-spacing:.06em}
.eb-budget .bar{flex:1;display:flex;gap:3px}.eb-budget .bar i{flex:1;height:10px;border-radius:3px;background:#dcd8ea;transition:background .25s}
.eb-ch{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px 10px 10px 12px;margin-bottom:6px}
.eb-ch .ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:17px}
.eb-ch b{display:block;font-size:13.5px}
.eb-ch small{display:block;font-size:12px;color:var(--mut);line-height:1.35}
.eb-ch small.w{color:var(--warn);font-weight:600}
.eb-step{display:flex;align-items:center;gap:4px}
.eb-step button{width:30px;height:30px;border-radius:9px;border:1px solid var(--line);background:#fff;font:700 17px/1 Inter,system-ui,sans-serif;cursor:pointer;color:var(--ink)}
.eb-step button:hover{background:var(--soft)}
.eb-step span{min-width:52px;text-align:center;font:700 13.5px Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums}
.eb-tbl{width:100%;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}
.eb-tbl th{font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);text-align:right;padding:6px 4px;border-bottom:1px solid var(--line)}
.eb-tbl th:first-child,.eb-tbl td:first-child{text-align:left}
.eb-tbl td{padding:8px 4px;border-bottom:1px solid var(--soft);text-align:right;white-space:nowrap}
.eb-tbl td.r{width:34%}
.eb-roas{display:flex;align-items:center;gap:6px;justify-content:flex-end}
.eb-roas i{display:block;height:8px;border-radius:4px;max-width:70px}
.eb-roas b{min-width:30px}
/* CRM */
.eb-crm{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.eb-crm h4{margin:0 0 6px;font:700 11px Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--mut)}
.eb-card{position:relative;display:block;width:100%;text-align:left;border:1.5px solid var(--line);border-radius:12px;padding:9px 30px 9px 10px;margin-bottom:6px;background:#fff;cursor:pointer;font:300 12.5px/1.35 Inter,system-ui,sans-serif;color:var(--ink);transition:border-color .15s,box-shadow .15s}
.eb-card b{display:block;font-size:13px;margin-bottom:1px}
.eb-card small{display:block;color:var(--mut);font-size:11.5px}
.eb-card small.w{color:var(--warn);font-weight:600}
.eb-card[aria-pressed=true]{border-color:var(--vio);box-shadow:0 0 0 3px var(--vio2)}
.eb-card .lk{position:absolute;right:7px;top:7px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font:300 11px Inter,system-ui,sans-serif;color:#fff}
.eb-card.ok{border-color:var(--ok);background:var(--okb)}.eb-card.ko{border-color:var(--ko);background:var(--kob)}
/* résultats */
.eb-verdict{display:flex;align-items:center;gap:12px;border-radius:14px;padding:12px 14px;margin:16px 0 10px;animation:ebUpIn .4s both}
.eb-verdict .s{font-size:19px;letter-spacing:2px}
.eb-verdict b{display:block;font:300 16px Inter,system-ui,sans-serif;letter-spacing:-.01em}
.eb-verdict small{display:block;font-size:12.5px;opacity:.85}
.eb-verdict.s3{background:var(--okb);color:#0b6e4d}.eb-verdict.s2{background:var(--wb);color:#96711a}.eb-verdict.s1{background:var(--kob);color:#a3282c}
.eb-deltas{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px;margin:0 0 10px}
.eb-delta{border:1px solid var(--line);border-radius:12px;padding:8px 10px}
.eb-delta small{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--mut)}
.eb-delta b{font:300 15px Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums}
.eb-delta span{font-size:12px;color:var(--mut);margin-right:4px}
.eb-delta b.ok{color:var(--ok)}.eb-delta b.ko{color:var(--ko)}
.eb-why{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.eb-why li{position:relative;padding:8px 10px 8px 34px;border-radius:10px;background:var(--soft);font-size:13px;line-height:1.45;color:var(--ink2)}
.eb-why li:before{position:absolute;left:10px;top:8px;font-size:13px}
.eb-why li.ok:before{content:"✅"}.eb-why li.ko:before{content:"❌"}.eb-why li.mid:before{content:"🟠"}.eb-why li.info:before{content:"💡"}
.eb-why li b{color:var(--ink)}
.eb-tip{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:10px 0;font-size:13.5px;color:var(--ink2)}
.eb-tip .eb-av{width:28px;height:28px;font-size:11px}
.eb-tip b{color:var(--ink)}
.eb-course{border-radius:14px;padding:12px 14px;margin:10px 0 0;background:linear-gradient(135deg,#fdf8ec,#fdf8ec)}
.eb-course span{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--vio)}
.eb-course b{display:block;font:300 16px Inter,system-ui,sans-serif;letter-spacing:-.01em;margin:2px 0}
.eb-course p{margin:0;font-size:13px;color:var(--ink2)}
.eb-real{font-size:12.5px;color:var(--mut);margin:10px 0 0;font-style:italic}
/* Black Friday en direct */
.eb-live{background:var(--ink);color:#fff;border-radius:16px;padding:14px;margin:0 0 12px}
.eb-live .hd{display:flex;align-items:center;gap:8px;font:300 12px Inter,system-ui,sans-serif;color:#b9b5cc}
.eb-live .hd .rec{width:9px;height:9px;border-radius:50%;background:#ff4d4f;animation:ebDot 1s infinite}
.eb-live .hd b{margin-left:auto;font:300 20px Tiempos Headline,Georgia,serif;color:#fff;font-variant-numeric:tabular-nums}
.eb-live .pg{height:4px;border-radius:2px;background:rgba(255,255,255,.12);margin:8px 0 12px;overflow:hidden}.eb-live .pg i{display:block;height:100%;background:linear-gradient(90deg,#96711a,#ff7a59);width:0}
.eb-live .g{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.eb-live .c{background:rgba(255,255,255,.07);border-radius:12px;padding:9px 11px}
.eb-live .c small{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#a9a5bd}
.eb-live .c b{font:300 21px Tiempos Headline,Georgia,serif;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.eb-live .c b.ko{color:#ff8a8c}.eb-live .c b.ok{color:#6ee7b7}
.eb-alert{border:1.5px solid var(--ko);border-radius:14px;padding:12px 14px;background:#fff;animation:ebAlert .5s cubic-bezier(.2,1.4,.4,1) both;box-shadow:0 0 0 4px var(--kob)}
@keyframes ebAlert{from{opacity:0;transform:scale(.94)}}
.eb-alert>b{display:flex;align-items:center;gap:8px;font:300 15px Inter,system-ui,sans-serif;margin-bottom:4px}
.eb-alert p{margin:0 0 8px;font-size:13.5px;color:var(--ink2)}
.eb-alert .tm{height:5px;border-radius:3px;background:var(--line);overflow:hidden;margin:0 0 10px}.eb-alert .tm i{display:block;height:100%;background:var(--ko);transform-origin:left}
.eb-wait{text-align:center;font-size:13px;color:var(--mut);padding:18px 0}
.eb-done{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--ink2);padding:6px 0;border-top:1px dashed var(--line)}
.eb-score{text-align:center;margin:6px 0 14px}
.eb-score b{display:block;font:300 44px/1 Tiempos Headline,Georgia,serif;letter-spacing:-.04em;background:linear-gradient(135deg,#96711a,#ff7a59);-webkit-background-clip:text;background-clip:text;color:transparent}
.eb-score small{font:700 12px Inter,system-ui,sans-serif;color:var(--mut);text-transform:uppercase;letter-spacing:.1em}
.eb-stages{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 12px}
.eb-stages div{border:1px solid var(--line);border-radius:10px;padding:7px 9px;font-size:12px;font-weight:600}
.eb-stages div span{display:block;color:#cb971a;letter-spacing:1px}
@media (max-width:1180px){ .eb-win{width:430px} .eb-steps li{padding:6px 9px} }
@media (max-width:1040px){ .eb-steps{display:none} .eb-stepm{display:block} }
@media (max-width:${MOBILE - 1}px){
	.eb-top{height:50px;padding:0 10px}.eb-brand small{display:none}
	.eb-kpis{left:0;right:0;top:50px;padding:0 10px;overflow-x:auto;scrollbar-width:none;gap:6px}
	.eb-kpis::-webkit-scrollbar{display:none}
	.eb-k{min-width:auto;padding:5px 9px 6px;flex:none}.eb-k small{font-size:9.5px}.eb-k b{font-size:15px}
	.eb-win{left:0;right:0;bottom:0;width:auto;border-radius:18px 18px 0 0;border-bottom:0}
	.eb-wh{height:38px}.eb-wb{padding:16px 14px 22px}
	.eb-h{font-size:22px}
	.eb-chat{left:8px;right:8px;width:auto}.eb-msg{padding:8px 10px}.eb-msg p{font-size:12.5px}
	.eb-lab small{display:none}.eb-lab{padding:3px 7px 3px 6px}.eb-lab b{font-size:11px}
	.eb-crm{grid-template-columns:1fr 1fr;gap:6px}.eb-card{padding:8px 26px 8px 8px}
	.st-pop{width:150px;top:50px}
}
`;

/* ================= la boutique en 3D, vue en coupe ================= */
function world(canvas){
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.setClearColor(0x000000, 0);
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const scene = new THREE.Scene();
	// vue isométrique (caméra orthographique) : la maquette se lit comme une illustration
	const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 400);
	const OFF = new THREE.Vector3(15, 25, 31).normalize().multiplyScalar(90);
	camera.position.copy(OFF); camera.zoom = 1;
	const controls = new OrbitControls(camera, canvas);
	const az0 = Math.atan2(OFF.x, OFF.z);
	Object.assign(controls, { enableDamping:true, enablePan:false, minZoom:.8, maxZoom:3.2, minAzimuthAngle:az0 - .75, maxAzimuthAngle:az0 + .75, minPolarAngle:.5, maxPolarAngle:1.2 });
	scene.add(new THREE.HemisphereLight("#ffffff", "#cdc4ff", 1.55));
	const sun = new THREE.DirectionalLight("#fff3e4", 2); sun.position.set(-16, 34, 20); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-30, right:30, top:22, bottom:-22, near:1, far:100 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
	scene.add(sun);

	const mats = {}, M = (c, o = {}) => mats[c + JSON.stringify(o)] || (mats[c + JSON.stringify(o)] = new THREE.MeshStandardMaterial({ color:c, roughness:.7, ...o }));
	const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
	const box = (w, h, d, c, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), typeof c === "string" ? M(c) : c, x, y + h/2, z, parent);
	const cyl = (rt, rb, h, c, x, y, z, parent, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof c === "string" ? M(c) : c, x, y + h/2, z, parent);
	const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.userData.redraw = () => { draw(c.getContext("2d"), w, h); t.needsUpdate = true; }; t.userData.redraw(); return t; };
	const texts = [];

	/* --- le socle : une dalle aux coins arrondis, flottant au-dessus de son ombre --- */
	{
		const s = new THREE.Shape(), X = 22.4, Z = 12.2, r = 3;
		s.moveTo(-X + r, -Z); s.lineTo(X - r, -Z); s.quadraticCurveTo(X, -Z, X, -Z + r); s.lineTo(X, Z - r); s.quadraticCurveTo(X, Z, X - r, Z);
		s.lineTo(-X + r, Z); s.quadraticCurveTo(-X, Z, -X, Z - r); s.lineTo(-X, -Z + r); s.quadraticCurveTo(-X, -Z, -X + r, -Z);
		const p = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth:1.6, bevelEnabled:true, bevelSize:.35, bevelThickness:.35, bevelSegments:4, curveSegments:12 }), [M("#fbfaf8"), M("#dcd5ec")]);
		p.rotation.x = -Math.PI/2; p.position.y = -1.95; p.receiveShadow = true; scene.add(p);
		const sh = new THREE.Mesh(new THREE.PlaneGeometry(64, 40), new THREE.MeshBasicMaterial({ transparent:true, depthWrite:false, map:tex(256, 160, (x, w, h) => { const g = x.createRadialGradient(w/2, h/2, 10, w/2, h/2, w/2); g.addColorStop(0, "rgba(70,50,140,.28)"); g.addColorStop(.6, "rgba(70,50,140,.1)"); g.addColorStop(1, "rgba(70,50,140,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
		sh.rotation.x = -Math.PI/2; sh.position.y = -5; scene.add(sh);
	}
	// la rue devant la boutique, et la zone « le web » d'où arrivent les visiteurs
	box(44.2, .05, 6.4, "#efecf6", 0, 0, 7.6);
	for(let x = -19; x < 21; x += 3) box(1.4, .02, .16, "#ffffff", x, .05, 7.6);
	box(7.4, .06, 18, "#f1effa", -18.6, 0, -1.6);
	for(const [x, z] of [[-14.3, 10.6], [-3, 10.8], [6.5, 10.8], [20.6, 10.4], [-21, -10.6]]){
		cyl(.12, .14, 1, "#b08c6c", x, 0, z, scene, 8);
		mesh(new THREE.SphereGeometry(.85, 18, 14), M("#9fd8b6"), x, 1.6, z);
	}

	/* --- les pièces de la boutique, en coupe --- */
	const floors = {};
	for(const k of ROOM_KEYS){
		const [x, c] = ROOMS[k];
		floors[k] = box(6.4, .14, 10.8, new THREE.MeshStandardMaterial({ color:c, roughness:.85, emissive:"#7b6cff", emissiveIntensity:0 }), x, 0, -1.8);
	}
	const WALL = M("#fdfcff"), CAP = M("#e9e5f5");
	box(28.2, 3.4, .35, WALL, 1.2, 0, -7.4); box(28.2, .12, .45, CAP, 1.2, 3.4, -7.4);
	box(.35, 3.4, 4.4, WALL, -12.1, 0, -5.4); box(.45, .12, 4.4, CAP, -12.1, 3.4, -5.4);
	box(.35, 1.1, .8, WALL, -12.1, 0, 3.2);
	for(const x of [-5.4, 1.2, 7.8]){ box(.3, 1.6, 3.2, WALL, x, 0, -5.8); box(.4, .1, 3.2, CAP, x, 1.6, -5.8); }
	// enseigne
	const signT = tex(512, 150, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = "#b23a24"; x.beginPath(); x.roundRect(0, 0, w, h, 26); x.fill(); x.fillStyle = "#f8f0e5"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "300 92px Tiempos Headline,Georgia,serif"; x.fillText("Courée", w/2, h/2 + 6); });
	texts.push(signT);
	const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.35), new THREE.MeshStandardMaterial({ map:signT, transparent:true, roughness:.5 })); sign.position.set(-8.7, 2.25, -7.2); scene.add(sign);
	// accueil : table de présentation, plantes, paillasson
	box(2.8, .8, 1.4, "#ead8c0", -8.7, 0, -3.2);
	const SW = ["#b23a24", "#f1e4d2", "#2f3e66", "#8fae8b", "#e0a43a", "#d4553c"];
	for(let i = 0; i < 3; i++) for(let k = 0; k < 3; k++) box(.7, .14, .55, SW[(i + k*2) % SW.length], -9.6 + i*.9, .8 + k*.15, -3.2);
	for(const [x, z] of [[-11.2, -6.4], [-6.2, -6.4]]){ cyl(.4, .32, .7, "#ffffff", x, 0, z, scene, 16); mesh(new THREE.SphereGeometry(.6, 14, 12), M("#7fc59b"), x, 1.15, z); }
	box(1.2, .03, 2.2, "#c9bfe6", -11.5, .14, -.4);
	// catalogue : étagères pleines de sweats pliés, table centrale
	for(const x of [-4, -2.1, -.2]){
		// un meuble ouvert (fond, côtés, dessus) : les sweats se voient au lieu d'être noyés dans un bloc plein
		box(1.7, 2.6, .06, "#ffffff", x, 0, -7.12); for(const dx of [-.82, .82]) box(.06, 2.6, .7, "#ffffff", x + dx, 0, -6.8); box(1.7, .06, .7, "#ffffff", x, 2.54, -6.8);
		for(let s = 0; s < 3; s++){ box(1.58, .06, .64, "#e9e5f5", x, .4 + s*.8, -6.78); for(let n = 0; n < 3; n++) box(.42, .3, .5, SW[(s*3 + n + Math.round(x)) % SW.length], x - .5 + n*.5, .46 + s*.8, -6.8); }
	}
	box(2.6, .8, 1.5, "#ead8c0", -2.1, 0, -1.6);
	for(let i = 0; i < 4; i++) box(.55, .3, .45, SW[i + 1], -3 + i*.6, .8, -1.6);
	// fiche produit : podium, mannequin et projecteur
	cyl(1.3, 1.4, .4, "#ffffff", 4.5, 0, -4.2, scene, 32);
	cyl(.1, .1, .9, "#d8d3e6", 4.5, .4, -4.2, scene, 8);
	const torso = mesh(new THREE.CapsuleGeometry(.48, .7, 6, 16), M("#b23a24"), 4.5, 1.9, -4.2); torso.scale.z = .72;
	mesh(new THREE.SphereGeometry(.3, 16, 12), M("#efe7dd"), 4.5, 2.85, -4.2);
	box(.08, 3.4, .08, "#2b2640", 6.6, 0, -6.6); box(1.6, .08, .08, "#2b2640", 5.8, 3.4, -6.6);
	const beam = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.2, 24, 1, true), new THREE.MeshBasicMaterial({ color:"#fff3b0", transparent:true, opacity:.18, depthWrite:false, side:THREE.DoubleSide }));
	beam.position.set(5.1, 1.75, -5); beam.rotation.x = .2; scene.add(beam);
	box(1.8, 1.2, .1, "#ffffff", 2.4, 1.1, -7.15); box(1.5, .14, .02, "#b23a24", 2.4, 1.95, -7.08); box(1.1, .1, .02, "#cfc8e6", 2.3, 1.7, -7.08); box(.6, .22, .02, "#16141f", 2.0, 1.3, -7.08);
	// caisse : comptoir, terminal, sacs
	box(3.4, 1, 1.1, "#ffffff", 11.1, 0, -4.4); box(3.5, .08, 1.2, "#2b2640", 11.1, 1, -4.4);
	box(.32, .14, .45, "#16141f", 10.4, 1.08, -4.3); box(.26, .02, .2, "#7ee0b0", 10.4, 1.23, -4.4);
	box(.55, .7, .3, "#b23a24", 12.2, 1.08, -4.6); box(.55, .7, .3, "#f1e4d2", 12.6, 1.08, -4.2);
	mesh(new THREE.TorusGeometry(.16, .03, 6, 16, Math.PI), M("#7a2416"), 12.2, 1.8, -4.6);
	for(const [x, z] of [[13.4, -6.6]]){ cyl(.4, .32, .7, "#ffffff", x, 0, z, scene, 16); mesh(new THREE.SphereGeometry(.6, 14, 12), M("#7fc59b"), x, 1.15, z); }

	/* --- l'entrepôt : rayonnages, tapis roulant, colis en attente, camionnette --- */
	box(6.6, .14, 10.8, "#efe7da", 17.6, 0, -1.8);
	box(.35, 3.4, 10.8, WALL, 14.1, 0, -1.8); box(.45, .12, 10.8, CAP, 14.1, 3.4, -1.8);
	box(6.8, 3.4, .35, WALL, 17.6, 0, -7.4); box(6.8, .12, .45, CAP, 17.6, 3.4, -7.4);
	box(.35, 3.4, 6.6, WALL, 21.1, 0, -4.4); box(.45, .12, 6.6, CAP, 21.1, 3.4, -4.4);
	const RACK = M("#5b4bff"), CARD = M("#d6a46b");
	for(const x of [15.6, 18.2]){
		for(const dx of [-1.1, 1.1]) for(const dz of [-.4, .4]) box(.1, 2.9, .1, RACK, x + dx, 0, -6.6 + dz);
		for(const y of [.05, 1, 1.95]){ box(2.3, .08, .9, "#ece8fb", x, y, -6.6); for(let n = 0; n < 3; n++) if((n + y*3 + x) % 4 > .5) box(.6, .5, .6, CARD, x - .7 + n*.7, y + .08, -6.6); }
	}
	const belt = box(1.1, .45, 7.4, "#3b3650", 19.9, 0, -.4);
	for(let z = -3.8; z < 3.2; z += .6) box(1.12, .03, .08, "#6a648a", 19.9, .45, z);
	const pileGeo = new THREE.BoxGeometry(.62, .46, .62), PILE = 40;
	const pile = new THREE.InstancedMesh(pileGeo, CARD, PILE); pile.castShadow = true; pile.count = 0; scene.add(pile);
	const pm = new THREE.Matrix4();
	for(let i = 0; i < PILE; i++){ const c = i % 12, l = Math.floor(i/12); pm.makeRotationY((i*1.7) % .3 - .15); pm.setPosition(15.4 + (c % 4)*.72, .14 + .23 + l*.47, -3.4 + Math.floor(c/4)*.72 + (l % 2)*.1); pile.setMatrixAt(i, pm); }
	// la camionnette de livraison, garée devant le quai
	const van = new THREE.Group(); scene.add(van);
	{
		const body = box(3.3, 1.9, 1.8, "#ffffff", -.5, .35, 0, van);
		box(1.2, 1.35, 1.78, "#ffffff", 1.75, .35, 0, van); box(.05, .7, 1.5, "#2b2640", 2.36, 1.0, 0, van);
		box(3.32, .22, 1.82, "#b23a24", -.5, .75, 0, van);
		for(const [x, z] of [[-1.5, .82], [-1.5, -.82], [1.6, .82], [1.6, -.82]]){ const w = mesh(new THREE.CylinderGeometry(.36, .36, .3, 18), M("#2b2640"), x, .36, z, van); w.rotation.x = Math.PI/2; }
		const lt = tex(256, 96, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = "#b23a24"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "300 64px Tiempos Headline,Georgia,serif"; x.fillText("Courée", w/2, h/2 + 4); }); texts.push(lt);
		const logo = new THREE.Mesh(new THREE.PlaneGeometry(2, .75), new THREE.MeshBasicMaterial({ map:lt, transparent:true })); logo.position.set(-.5, 1.65, .91); van.add(logo);
		body.userData.van = 1;
	}
	const VAN0 = new THREE.Vector3(17.6, 0, 7.4);
	van.position.copy(VAN0);

	/* --- les portails du web : un par canal d'acquisition --- */
	const PZ = { seo:-8.6, ads:-5.5, social:-2.4, influ:.7, mail:3.8, direct:6.9 }, PX = -18.6;
	const portals = {};
	for(const k of PORTALS){
		const c = CH[k][2], g = new THREE.Group(); g.position.set(PX, 0, PZ[k]); scene.add(g);
		const m = M(c, { roughness:.35, emissive:c, emissiveIntensity:.15 });
		const arc = mesh(new THREE.TorusGeometry(1.05, .17, 12, 30, Math.PI), m, 0, 1.25, 0, g); arc.rotation.y = Math.PI/2;
		for(const dz of [-1.05, 1.05]) cyl(.17, .17, 1.25, m, 0, 0, dz, g, 12);
		const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .05, 32), new THREE.MeshBasicMaterial({ color:c, transparent:true, opacity:.18 })); pad.position.y = .06; g.add(pad);
		portals[k] = { g, pad, m };
	}

	/* --- étiquettes HTML posées sur la maquette (nettes à toutes les tailles) --- */
	const labs = canvas.parentNode.querySelector(".eb-labs"), tags = [];
	function tag(pos, color, title, cls = ""){
		const el = document.createElement("div"); el.className = "eb-lab " + cls;
		el.innerHTML = `<i style="background:${color}"></i><span><b>${title}</b><small></small></span>`; labs.appendChild(el);
		const t = { el, pos:new THREE.Vector3(...pos), small:el.querySelector("small"), b:el.querySelector("b") }; tags.push(t); return t;
	}
	const roomTag = {};
	for(const k of ROOM_KEYS) roomTag[k] = tag([ROOMS[k][0], 4.2, -7.4], new THREE.Color(ROOMS[k][1]).offsetHSL(0, .2, -.25).getStyle(), ROOMS[k][2]);
	roomTag.entrepot = tag([17.6, 4.2, -7.4], "#d6a46b", "Entrepôt");
	const portalTag = {};
	for(const k of PORTALS) portalTag[k] = tag([PX, 2.75, PZ[k]], CH[k][2], CH[k][0], "pt");

	/* --- les visiteurs --- */
	const capGeo = new THREE.CapsuleGeometry(.24, .4, 4, 10), headGeo = new THREE.SphereGeometry(.21, 14, 10), bagGeo = new THREE.BoxGeometry(.26, .3, .12);
	const chMat = {}; for(const k in CH) chMat[k] = new THREE.MeshStandardMaterial({ color:CH[k][2], roughness:.5 });
	const SKIN = ["#f3d4b9", "#e3b690", "#c58c62", "#8d5a3c", "#f6e0cc"].map(c => M(c, { roughness:.6 }));
	const ghostMat = new THREE.MeshStandardMaterial({ color:"#b7adff", transparent:true, opacity:.45, depthWrite:false, roughness:.2, emissive:"#c9c2ff", emissiveIntensity:.25 });
	const bagMat = M("#b23a24");
	const vis = [], pool = [];
	function makeVisitor(){
		const g = new THREE.Group(), b = new THREE.Mesh(capGeo), h = new THREE.Mesh(headGeo), bag = new THREE.Mesh(bagGeo, bagMat);
		b.position.y = .48; h.position.y = 1.1; bag.position.set(.3, .45, .05);
		for(const m of [b, h, bag]){ m.castShadow = true; g.add(m); }
		return { g, b, h, bag };
	}
	let pv = [.8, .68, .46, .42], weights = PORTALS.map(k => [k, 1/PORTALS.length]), rate = 1.2, ghost = 0, rush = 1, acc = 0;
	const rnd = (a, b) => a + Math.random()*(b - a);
	function spawn(){
		if(vis.length > (rush > 1 ? 140 : 80)) return;
		let r = Math.random(), ch = weights[weights.length - 1][0];
		for(const [k, w] of weights){ if(r < w){ ch = k; break; } r -= w; }
		const v = pool.pop() || makeVisitor(), gh = Math.random() < ghost;
		v.b.material = gh ? ghostMat : chMat[ch]; v.h.material = gh ? ghostMat : pick(SKIN); v.bag.visible = false;
		let d = 0; while(d < 4 && Math.random() < pv[d]) d++;
		const pz = PZ[ch], rz = rnd(-2.6, 2.4), pts = [[PX - 2.2, pz], [PX, pz], [-14.6, (pz + rz)/2], [-12.4, rz]];
		for(let i = 0; i <= Math.min(d, 3); i++) pts.push([ROOMS[ROOM_KEYS[i]][0] + rnd(-1.4, 1.4), rnd(-3.2, 2.4), i === 3 && d === 4 ? "pay" : "stop"]);
		const last = pts[pts.length - 1];
		if(d === 4) pts.push([13.2, 5.6], [22.6, rnd(6.4, 8.6)]);
		else pts.push([last[0], 5.4], [-21.6, rnd(6.2, 9)]);
		v.pts = pts; v.i = 1; v.wait = 0; v.speed = rnd(2.8, 3.8) * (rush > 1 ? 1.25 : 1); v.ph = Math.random()*6; v.age = 0;
		v.g.position.set(pts[0][0], 0, pts[0][1]); v.g.scale.setScalar(.01); scene.add(v.g); vis.push(v);
	}
	let pending = 0, onSale = null;
	function tickVisitor(v, dt){
		v.age += dt;
		const tgt = v.pts[v.i], p = v.g.position, dx = tgt[0] - p.x, dz = tgt[1] - p.z, L = Math.hypot(dx, dz);
		const end = v.pts[v.pts.length - 1], toEnd = Math.hypot(end[0] - p.x, end[1] - p.z);
		v.g.scale.setScalar(Math.min(1, v.age*3, v.i === v.pts.length - 1 ? toEnd/1.5 : 1) || .001);
		if(v.wait > 0){ v.wait -= dt; v.h.rotation.y = Math.sin(v.age*3)*.5; v.b.position.y = .48; return true; }
		if(L < .08){
			if(tgt[2] === "stop") v.wait = rnd(.35, 1);
			if(tgt[2] === "pay"){ v.wait = .9; v.bag.visible = true; pending++; onSale && onSale(); pulse("caisse", .5); }
			v.i++;
			return v.i < v.pts.length;
		}
		const s = Math.min(L, v.speed*dt); p.x += dx/L*s; p.z += dz/L*s;
		v.g.rotation.y = Math.atan2(dx, dz);
		v.ph += dt*v.speed*3.2;
		v.b.position.y = .48 + Math.abs(Math.sin(v.ph))*.07; v.h.position.y = 1.1 + Math.abs(Math.sin(v.ph))*.07; v.h.rotation.y = 0;
		return true;
	}

	/* --- colis : du stock au tapis roulant, puis à la camionnette, qui part livrer quand elle est pleine --- */
	const parcels = [];
	let shipAcc = 0, shipRate = .9, vanLoad = 0, vanTrip = null;
	function tickParcels(dt, now){
		if(!vanTrip){
			shipAcc += dt*shipRate;
			if(shipAcc >= 1 && pending > 0){
				shipAcc = 0; pending--;
				const m = new THREE.Mesh(pileGeo, CARD); m.castShadow = true; m.scale.setScalar(.8); scene.add(m);
				parcels.push({ m, t:0, path:[[16.2, 1.2, -2.6], [19.9, .82, -3.6], [19.9, .82, 3.2], [VAN0.x - .5, 1.2, VAN0.z]] });
			}
			shipAcc = Math.min(shipAcc, 1);
		}
		for(let i = parcels.length - 1; i >= 0; i--){
			const P = parcels[i]; P.t += dt*.55;
			const seg = Math.min(2, Math.floor(P.t)), k = Math.min(1, P.t - seg), a = P.path[seg], b = P.path[seg + 1];
			P.m.position.set(a[0] + (b[0] - a[0])*k, a[1] + (b[1] - a[1])*k + (seg === 2 ? Math.sin(Math.PI*k)*1.2 : 0), a[2] + (b[2] - a[2])*k);
			if(P.t >= 3){ scene.remove(P.m); parcels.splice(i, 1); if(++vanLoad >= 6){ vanLoad = 0; vanTrip = { t0:now }; } }
		}
		pile.count = Math.min(PILE, pending); pile.instanceMatrix.needsUpdate = true;
		if(vanTrip){
			const k = (now - vanTrip.t0)/1000;
			if(k < 1.6){ van.position.x = VAN0.x + Math.pow(k/1.6, 2)*9; van.scale.setScalar(Math.max(.01, 1 - Math.max(0, k - 1)*1.6)); }
			else if(k < 2.6){ van.position.x = VAN0.x - 6 + (k - 1.6)*6; van.scale.setScalar(Math.min(1, (k - 1.6)*2)); }
			else { van.position.copy(VAN0); van.scale.setScalar(1); vanTrip = null; }
		}
	}

	/* --- animations de la scène --- */
	const easeIO = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	const glows = [];
	function pulse(room, a = 1){ const f = floors[room]; if(f) glows.push({ m:f.material, t:0, a }); }
	let camA = null;
	// sur téléphone, on cadre plus large
	function focus(x, z, zoom){ camA = { t0:controls.target.clone(), t1:new THREE.Vector3(x, 0, z), z0:camera.zoom, z1:VW < 600 ? 1 + (zoom - 1)*.45 : zoom, k:0 }; }
	function hot(room){ for(const k in roomTag) roomTag[k].el.classList.toggle("hot", k === room); }

	let VW = 1, VH = 1, raf = 0, last = performance.now();
	const pj = new THREE.Vector3();
	function loop(now){
		raf = requestAnimationFrame(loop);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		acc += dt*rate*rush;
		while(acc >= 1){ acc--; spawn(); }
		for(let i = vis.length - 1; i >= 0; i--) if(!tickVisitor(vis[i], dt)){ scene.remove(vis[i].g); pool.push(vis[i]); vis.splice(i, 1); }
		tickParcels(dt, now);
		for(let i = glows.length - 1; i >= 0; i--){ const g = glows[i]; g.t += dt/1.1; g.m.emissiveIntensity = Math.sin(Math.PI*Math.min(1, g.t))*.35*g.a; if(g.t >= 1){ g.m.emissiveIntensity = 0; glows.splice(i, 1); } }
		for(const k of PORTALS){ const p = portals[k]; p.pad.material.opacity = .14 + .08*Math.sin(now/400 + PZ[k]); }
		beam.material.opacity = .14 + .05*Math.sin(now/700);
		if(camA){
			camA.k = Math.min(1, camA.k + dt/1.3); const e = easeIO(camA.k);
			const off = camera.position.clone().sub(controls.target);
			controls.target.lerpVectors(camA.t0, camA.t1, e); camera.position.copy(controls.target).add(off);
			camera.zoom = camA.z0 + (camA.z1 - camA.z0)*e; camera.updateProjectionMatrix();
			if(camA.k >= 1) camA = null;
		}
		controls.update();
		renderer.render(scene, camera);
		if(safeW !== VW){ const kp = canvas.parentNode.querySelector(".eb-kpis"); if(kp && kp.offsetHeight){ safe = kp.offsetTop + kp.offsetHeight + 46; safeW = VW; } }      // jamais sous la barre des chiffres (mesurée une fois par largeur)
		for(const t of tags){ pj.copy(t.pos).project(camera); t.el.style.transform = `translate(${((pj.x + 1)/2*VW).toFixed(1)}px,${Math.max(safe, (1 - pj.y)/2*VH).toFixed(1)}px) translate(-50%,-100%)`; }
	}
	let safe = 0, safeW = -1;
	function resize(w, h){
		VW = w; VH = h;
		renderer.setSize(w, h, false); canvas.style.width = w + "px"; canvas.style.height = h + "px";
		labs.style.width = w + "px"; labs.style.height = h + "px";
		const a = w/h, hh = Math.max(13, 25.5/a);
		Object.assign(camera, { left:-hh*a, right:hh*a, top:hh, bottom:-hh }); camera.updateProjectionMatrix();
	}
	controls.target.set(0, 0, -.6); camera.position.copy(controls.target).add(OFF);
	raf = requestAnimationFrame(loop);
	// les polices de la marque arrivent parfois après le premier dessin
	document.fonts && Promise.all([document.fonts.load("300 64px 'Tiempos Headline'"), document.fonts.load("700 40px Inter")]).then(() => texts.forEach(t => t.userData.redraw())).catch(() => {});

	const pct0 = v => Math.round(v*100) + " %";
	return {
		resize, focus, pulse, hot,
		set onSale(f){ onSale = f; },
		setModel(m){
			pv = m.p.map(x => Math.sqrt(x));
			const ch = { seo:m.ch.seo, ads:m.ch.ads + (m.ch.display || 0), social:m.ch.social, influ:m.ch.influ, mail:m.ch.mail, direct:m.ch.direct };
			const tot = Object.values(ch).reduce((a, b) => a + b, 0) || 1;
			weights = PORTALS.map(k => [k, ch[k]/tot]);
			rate = Math.min(4.2, .55 + Math.sqrt(tot)/15);
			ghost = m.ghost;
			for(const k of PORTALS){ portalTag[k].b.textContent = `${CH[k][0]} ${ch[k] ? Math.round(ch[k]).toLocaleString("fr-FR") : 0}`; portalTag[k].el.classList.toggle("dim", !ch[k]); portals[k].m.emissiveIntensity = ch[k] ? .15 + Math.min(.5, ch[k]/1500) : 0; }
			roomTag.vitrine.small.textContent = pct0(m.p[0]) + " continuent";
			roomTag.rayons.small.textContent = pct0(m.p[1]) + " ouvrent une fiche";
			roomTag.fiche.small.textContent = pct0(m.p[2]) + " ajoutent au panier";
			roomTag.caisse.small.textContent = pct0(m.p[3]) + " paient";
		},
		setRush(r){ rush = r; },
		setShip(r){ shipRate = r; },
		get pending(){ return pending; },
		setEntrepot(t){ roomTag.entrepot.small.textContent = t; },
		dispose(){ cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); renderer.forceContextLoss(); scene.traverse(o => { if(o.geometry) o.geometry.dispose(); }); labs.innerHTML = ""; }
	};
}
const pick = a => a[Math.floor(Math.random()*a.length)];

/* ================= le jeu ================= */
const euro = v => Math.round(v).toLocaleString("fr-FR") + " €";
const pct = v => (v*100).toLocaleString("fr-FR", { minimumFractionDigits:1, maximumFractionDigits:1 }) + " %";
const int = v => Math.round(v).toLocaleString("fr-FR");
const STARS = n => "★".repeat(n) + "☆".repeat(3 - n);
const VERDICT = ["", "À retravailler", "Bien joué", "Excellent"];
const REACT = {
	3:["Parfait, c'est exactement ce que j'aurais fait 🔥", "Top ! Je le montre au reste de l'équipe.", "Rien à redire, bravo 👏"],
	2:["Pas mal ! On peut encore gratter quelques points.", "C'est un bon début, regarde mon conseil.", "Correct. La prochaine fois, on vise plus haut 😉"],
	1:["Aïe… on en reparle à la réunion de lundi 😬", "Hmm, ça ne va pas plaire aux clients.", "Oups. Lis bien mon conseil avant de continuer."]
};

// tunnel de commande : éléments de la page que le joueur peut faire corriger (imp : gain sur le taux de paiement)
const UX = {
	popup:{ bad:1, imp:.03, heat:.45, name:"Le pop-up « −10 % contre ton e-mail »", why:"Interrompre quelqu'un en train de payer, c'est lui offrir une occasion de partir. Une remise, oui, mais avant la caisse." },
	compte:{ bad:1, imp:.07, heat:.8, name:"La création de compte obligatoire", why:"Elle fait partie des premières causes d'abandon. On propose la commande en invité, et le compte après l'achat." },
	champs:{ bad:1, imp:.04, heat:.3, name:"Le formulaire de 14 champs", why:"Fax, date de naissance, « comment nous avez-vous connus ? » : chaque champ inutile est un effort de plus, et une donnée collectée sans raison (RGPD : minimisation des données)." },
	recap:{ bad:0, name:"Le récapitulatif du panier", why:"Il rassure le client sur ce qu'il achète : on le garde." },
	frais:{ bad:1, imp:.07, heat:.6, name:"Les frais découverts au dernier moment", why:"Des frais imprévus sont la première cause d'abandon de panier. On les annonce dès la fiche produit." },
	avis:{ bad:0, name:"Les avis vérifiés et le paiement sécurisé", why:"Ce sont des éléments de réassurance : on les garde, ils rassurent avant de payer." },
	bouton:{ bad:1, imp:.04, heat:.9, name:"Le bouton « Payer » gris clair", why:"Texte blanc sur gris : un contraste d'environ 1,3:1, illisible pour beaucoup. Les règles d'accessibilité (WCAG) demandent au moins 4,5:1. Et les visiteurs cliquent à côté, énervés (« rage clicks »)." }
};
const UX_BEST = .22;
const F14 = ["Civilité", "Prénom", "Nom", "Date de naissance", "E-mail", "Téléphone fixe", "Mobile", "Fax", "Société", "Adresse", "Complément", "Code postal", "Ville", "Comment nous avez-vous connus ?"];
const F7 = ["E-mail", "Prénom", "Nom", "Adresse", "Code postal", "Ville", "Mobile (pour le livreur)"];

const SEO = {
	title:[["a", "Produit 12 – Accueil", 0], ["b", "Sweat brodé Vauban, fabriqué à Lille | Courée", 2], ["c", "Sweat Lille sweat pas cher sweat brodé sweat homme sweat femme sweat", -1]],
	meta:[["a", "(vide : le moteur prend un bout de texte sur la page)", .9], ["b", "Sweat en coton bio brodé à Lille, coupe unisexe. Livraison offerte dès 60 €, retours gratuits sous 30 jours.", 1.3], ["c", "LE MEILLEUR SWEAT DU MONDE !!! Clique vite, promo incroyable !!!", .7]],
	url:[["a", "/index.php?id_product=12&cat=3", 0], ["b", "/sweat-brode-vauban", 1], ["c", "/sweat-lille-sweat-pas-cher-sweat-brode-sweat-vauban-2026", -1]]
};
const SERP = [
	["G", "Grand Bazar en ligne", "grandbazar.example › mode › sweat-lille", "Sweat Lille : 1 240 produits en stock, livraison en 24 h", "Des milliers de sweats au meilleur prix. Retrait en magasin possible…"],
	["L", "Lille Souvenirs", "lillesouvenirs.example › textile", "Sweats et t-shirts « Lille » – Lille Souvenirs", "Le beffroi, la Grand-Place et le P'tit Quinquin sur des sweats pour toute la famille."],
	["B", "Blog Mode du Nord", "modedunord.example › marques-lilloises", "10 marques lilloises à suivre en 2026", "Des créateurs du Vieux-Lille aux ateliers de Roubaix, notre sélection…"],
	["A", "Les Ateliers Flandres", "ateliersflandres.example › sweats", "Sweats bio fabriqués dans les Flandres", "Coton biologique, teinture locale, broderie à la main."],
	["F", "Forum Déco & Mode", "forum-mode.example › lille", "Où acheter un sweat original à Lille ? – Forum", "Bonjour, je cherche un cadeau pour mon frère, plutôt un sweat avec…"],
	["P", "Plan des boutiques", "plan-boutiques.example › lille › vieux-lille", "Boutiques de vêtements du Vieux-Lille – plan et horaires", "Rue de la Monnaie, rue de Gand, place Louise-de-Bettignies…"],
	["V", "Vidéos Couture", "videos-couture.example › broderie", "Comment broder un sweat soi-même (tutoriel)", "Tout le matériel pour personnaliser un sweat en 20 minutes."],
	["C", "Comparateur Malin", "comparateur.example › sweat-homme", "Sweat homme : comparer les prix de 85 marchands", "Prix, avis et frais de port de plus de 2 000 sweats."]
];
const CTR = { 2:.15, 4:.07, 7:.03, 14:.006 };

const RGPD = {
	refus:[["egal", "Bouton « Tout refuser » aussi visible qu'« Accepter »"], ["lien", "Petit lien gris « continuer sans accepter »"], ["absent", "Seulement « Paramétrer » (refuser demande 3 clics)"]],
	cases:[["vides", "Finalités décochées par défaut"], ["cochees", "Finalités déjà cochées"]],
	stats:[["exempt", "Outil de mesure d'audience exempté : statistiques anonymes, sans consentement"], ["pub", "Traceurs publicitaires chargés avant le choix du visiteur"], ["rien", "Aucune mesure pour ceux qui refusent"]],
	news:[["vide", "Newsletter du pied de page : case à cocher soi-même"], ["cochee", "Case précochée « J'accepte les offres de Courée et de ses partenaires »"]]
};

const ACQ = {
	ads:   { ic:"🔎", short:"Annonces", name:"Annonces sur les moteurs de recherche", d:"On paie au clic sur « sweat lille » : des gens qui cherchent déjà.", col:CH.ads[2], v:830, cv:.032, k:.8 },
	social:{ ic:"📱", short:"Réseaux sociaux", name:"Publicités sur les réseaux sociaux", d:"Beaucoup de vues et des clics pas chers… mais on fait défiler vite.", col:CH.social[2], v:2000, cv:.007, k:.85 },
	influ: { ic:"⭐", short:"Influence", name:"Une créatrice lilloise (12 000 abonnés)", d:"Une vidéo sponsorisée, avec la mention « collaboration commerciale » obligatoire.", col:CH.influ[2], v:1500, cv:.022, k:.15 },
	mail:  { ic:"✉️", short:"E-mail", name:"Campagne e-mail aux abonnés", d:"Création, tests et envoi à la liste de la newsletter.", col:CH.mail[2], v:1200, cv:.05, k:.25 },
	display:{ ic:"🖼️", short:"Bannières", name:"Bannières sur des sites partenaires", d:"Des milliers d'affichages sur des sites d'information.", col:"#94a3b8", v:1500, cv:.005, k:.9 }
};
const ACQ_KEYS = Object.keys(ACQ);

const SEG = {
	panier:["🛒", "Paniers abandonnés", "312 personnes cette semaine", "m1"],
	fideles:["💎", "Clients fidèles", "180 clients, 3 commandes ou plus", "m2"],
	unique:["🧢", "Clients d'un seul produit", "390 clients, une seule commande d'un sweat", "m3"],
	abonnes:["📬", "Abonnés sans commande", "420 inscrits à la newsletter", "m4"]
};
const MSG = {
	m1:["Tu as oublié quelque chose ?", "Le rappel du panier, avec les avis clients"],
	m2:["En avant-première", "La collection d'hiver, 48 h avant tout le monde"],
	m3:["Le bonnet assorti", "Le bonnet Beffroi, assorti à ton sweat"],
	m4:["Bienvenue chez Courée", "Notre histoire et nos ateliers lillois"],
	m5:["−30 % sur tout", "Pour tout le monde, tout le temps"]
};
const SEG_COL = { panier:"#f59e0b", fideles:"#5b4bff", unique:"#ec4899", abonnes:"#12a26f" };

// Black Friday : les alertes du direct (a : meilleur choix, c : choix par défaut si le temps est écoulé)
const BF = [
	{ at:7, k:"speed", ic:"🐢", t:"Le site rame sur mobile", d:L => `Les pages mettent <b>5,2 s</b> à s'afficher sur téléphone. Aujourd'hui, 70 % du trafic vient du mobile.`, opts:[
		["a", "Compresser les images et activer le cache (CDN)", 3, "Pages à 1,9 s : les visiteurs mobiles restent."],
		["b", "Retirer seulement la vidéo d'accueil", 2, "Pages à 3,4 s : mieux, mais encore lent."],
		["c", "Ne rien toucher, ça va passer", 1, "Selon Google, plus de la moitié des visites mobiles sont abandonnées quand la page met plus de 3 s à charger."]] },
	{ at:24, k:"stock", ic:"📦", t:"Rupture en vue", d:L => `Le Sweat Vauban, celui de toutes tes publicités, n'a plus que <b>45 pièces</b>. Il en part une trentaine par heure.`, opts:[
		["a", "Ouvrir la précommande du sweat (livré sous 3 semaines) et basculer la pub sur le tote", 3, "Les ventes continuent, et la pub ne paie plus pour un produit introuvable."],
		["b", "Couper la publicité du sweat", 2, "Plus de dépense inutile, mais des ventes en moins."],
		["c", "Afficher « Plus que 3 pièces ! » sur toute la boutique", 1, "Une fausse rareté est une pratique commerciale trompeuse. Et la pub continue d'envoyer des clients vers un produit épuisé."]] },
	{ at:41, k:"logi", ic:"🚚", t:"L'entrepôt déborde", d:L => `<b>${int(L.pending)} colis</b> attendent, et l'entrepôt en expédie environ 120 par jour. Ta page promet toujours « Livré en 48 h ».`, opts:[
		["a", "Annoncer honnêtement « Expédié sous 4 jours » et prévenir les clients", 3, "Les clients savent à quoi s'attendre : pas de mauvaise surprise."],
		["b", "Appeler des intérimaires (ils arrivent dans 3 jours)", 2, "Ça aidera… plus tard. En attendant, la promesse de 48 h n'est pas tenue."],
		["c", "Garder « 48 h », on verra bien", 1, "Promesse non tenue : appels au service client, annulations et avis négatifs."]] },
	{ at:57, k:"avis", ic:"💬", t:"Un avis 1★ fait le buzz", d:L => `« Colis écrasé, sweat taché, aucune réponse. » L'avis est partagé <b>2 000 fois</b> sur les réseaux.`, opts:[
		["a", "Répondre publiquement, renvoyer un sweat neuf et rembourser la livraison", 3, "Une réponse rapide et visible rassure tous ceux qui lisent l'avis."],
		["b", "Le supprimer de la page produit", 1, "Masquer les avis négatifs fausse l'information des clients : c'est interdit, et ça se voit."],
		["c", "Répondre seulement en message privé", 2, "Le client est content, mais les 2 000 lecteurs ne le savent pas."]] }
];
const BF_LEN = 80;

export function openBoutique({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("eb-css")){ const st = document.createElement("style"); st.id = "eb-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "eb"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Courée, la boutique en 3D");
	root.innerHTML = `<canvas aria-hidden="true"></canvas><div class="eb-labs" aria-hidden="true"></div>
		<header class="eb-top"><div class="eb-brand"><i>C</i><span>Courée<small>Back-office</small></span></div>
			<ol class="eb-steps">${STEPS.map(([k, n], i) => `<li data-s="${k}"><span>${i + 1}</span>${n}</li>`).join("")}</ol>
			<span class="eb-stepm"></span><button class="eb-x" aria-label="Quitter le jeu">×</button></header>
		<div class="eb-kpis" aria-live="polite">
			<div class="eb-k" data-k="vis"><small>Visiteurs / jour</small><b>0</b></div>
			<div class="eb-k" data-k="conv"><small>Conversion</small><b>0</b></div>
			<div class="eb-k" data-k="ca"><small>Ventes / jour</small><b>0</b></div>
			<div class="eb-k" data-k="rgpd"><small>Conformité RGPD</small><b>À vérifier</b></div>
			<div class="eb-k" data-k="note"><small>Avis clients</small><b>4,3 ★</b></div></div>
		<div class="eb-chat" aria-live="polite"></div>
		<section class="eb-win"><div class="eb-wh"><span class="d"><i></i><i></i><i></i></span><span class="eb-url">🔒 <span>couree.fr</span></span><span class="eb-tab">Accueil</span></div><div class="eb-wb"></div></section>`;
	document.body.appendChild(root);
	const canvas = root.querySelector("canvas"), win = root.querySelector(".eb-win"), body = root.querySelector(".eb-wb"), chat = root.querySelector(".eb-chat"), kpis = root.querySelector(".eb-kpis");
	const W = world(canvas);
	let closed = false;
	const later = (ms, f) => setTimeout(() => { if(!closed) f(); }, ms);

	function layout(){
		const w = innerWidth, h = innerHeight;
		if(w >= MOBILE){
			const ww = w < 1180 ? 430 : 480;
			win.style.top = ""; win.style.height = "";
			chat.style.bottom = "14px"; chat.style.top = "";
			W.resize(w - ww - 28, h);
		} else {
			const ch = Math.round(h*.43);
			win.style.top = ch + "px"; win.style.height = "auto";
			chat.style.bottom = (h - ch + 8) + "px"; chat.style.top = "";
			W.resize(w, ch);
		}
	}
	addEventListener("resize", layout); layout();

	/* ---------- le modèle : visiteurs par canal, taux de passage d'une pièce à l'autre ---------- */
	const M0 = () => ({ ch:{ seo:40, ads:0, display:0, social:100, influ:0, mail:0, direct:120 }, p:[.62, .46, .21, .18], basket:52, ghost:0, note:4.3, news:null, rgpd:null });
	let M = M0();
	const S = { done:{}, learned:new Set(), errors:0, log:{} };
	const visitors = () => Object.values(M.ch).reduce((a, b) => a + b, 0);
	const conv = () => M.p.reduce((a, b) => a*b, 1);
	const caDay = () => visitors()*conv()*M.basket;
	const shown = {};
	function kpi(k, v, txt, cls){
		const el = kpis.querySelector(`[data-k="${k}"]`), b = el.querySelector("b");
		if(txt != null){ b.textContent = txt; b.className = cls || ""; return; }
		const from = shown[k] ?? v; shown[k] = v;
		const fmt = k === "conv" ? pct : k === "ca" ? euro : int, t0 = performance.now();
		const step = now => { const q = Math.min(1, (now - t0)/900); b.textContent = fmt(from + (v - from)*(1 - Math.pow(1 - q, 3))); if(q < 1 && !closed) requestAnimationFrame(step); };
		requestAnimationFrame(step);
		if(Math.abs(v - from) > 1e-9){ el.classList.remove("up", "dn"); void el.offsetWidth; el.classList.add(v > from ? "up" : "dn"); }
	}
	function sync(){
		kpi("vis", visitors()); kpi("conv", conv()); kpi("ca", caDay());
		kpi("note", 0, M.note.toLocaleString("fr-FR", { minimumFractionDigits:1, maximumFractionDigits:1 }) + " ★", M.note >= 4.3 ? "" : M.note < 4 ? "ko" : "");
		if(M.rgpd) kpi("rgpd", 0, M.rgpd === "ok" ? "✓ Conforme" : "⚠ À risque", M.rgpd === "ok" ? "ok" : "ko");
		W.setModel(M);
	}

	/* ---------- Inès, la head of growth : ses messages arrivent comme dans une messagerie d'équipe ---------- */
	let chatQ = Promise.resolve();
	function ines(text, wait = 0){
		chatQ = chatQ.then(() => new Promise(res => later(wait, () => {
			const el = document.createElement("div"); el.className = "eb-msg"; el.title = "Toucher pour masquer";
			el.innerHTML = `<span class="eb-av">IN</span><p><b>Inès<em>Head of Growth · à l'instant</em></b><span class="eb-dots"><i></i><i></i><i></i></span></p>`;
			chat.appendChild(el);
			const all = chat.querySelectorAll(".eb-msg"), keep = innerWidth < MOBILE ? 1 : 2;
			all.forEach((m, i) => { if(i < all.length - keep) bye(m); else m.classList.toggle("old", i < all.length - 1); });
			later(650 + Math.min(900, text.length*8), () => { el.querySelector(".eb-dots").outerHTML = `<span>${text}</span>`; play("pop"); res(); });
			// sur téléphone, la maquette est petite : le message s'efface plus vite
			later((innerWidth < MOBILE ? 3500 : 9000) + text.length*(innerWidth < MOBILE ? 30 : 45), () => bye(el));
		})));
	}
	function bye(m){ if(m.classList.contains("bye")) return; m.classList.add("bye"); setTimeout(() => m.remove(), 400); }
	chat.addEventListener("click", e => { const m = e.target.closest(".eb-msg"); if(m) bye(m); });

	/* ---------- la fenêtre du back-office ---------- */
	function show(html, url, tabName){
		body.innerHTML = html; body.scrollTop = 0;
		if(url) root.querySelector(".eb-url span").textContent = url;
		if(tabName) root.querySelector(".eb-tab").textContent = tabName;
	}
	function stage(k){
		const i = STEPS.findIndex(s => s[0] === k);
		root.querySelectorAll(".eb-steps li").forEach((li, j) => { li.classList.toggle("now", j === i); li.classList.toggle("done", i < 0 ? !!S.done[STEPS[j][0]] : j < i || !!S.done[STEPS[j][0]] && j !== i); });
		root.querySelector(".eb-stepm").textContent = i >= 0 ? `Étape ${i + 1}/6 · ${STEPS[i][1]}` : "Bilan";
		if(i >= 0) onEvent && onEvent("stage", `${i + 1} · ${STEPS[i][1]}`);
	}
	const scrollTo = el => later(60, () => body.scrollTo({ top:Math.max(0, el.offsetTop - 14), behavior:"smooth" }));
	function course(k){ S.learned.add(k); const [n, t] = COURSES[k]; return `<div class="eb-course"><span>📚 Au programme du master</span><b>${n}</b><p>${t}</p></div>`; }
	function delta(label, a, b, fmt, good = 1){ const up = b > a + 1e-9, dn = b < a - 1e-9; return `<div class="eb-delta"><small>${label}</small><span>${fmt(a)} →</span><b class="${(up && good > 0) || (dn && good < 0) ? "ok" : (up || dn) ? "ko" : ""}">${fmt(b)}</b></div>`; }
	// verdict d'une étape : étoiles, chiffres avant/après, explications, conseil d'Inès, cours, bouton suivant
	function verdict(key, { stars, sub, deltas = "", why = "", tip, courses = [], real, next, nextLabel }){
		S.done[key] = stars;
		if(stars === 1){ S.errors++; onEvent && onEvent("err"); }
		play(stars === 3 ? "good" : stars === 2 ? "chime" : "bad");
		later(500, () => ines(pick(REACT[stars])));
		return `<div class="eb-verdict s${stars}"><span class="s">${STARS(stars)}</span><span><b>${VERDICT[stars]}</b>${sub ? `<small>${sub}</small>` : ""}</span></div>
			${deltas ? `<div class="eb-deltas">${deltas}</div>` : ""}${why ? `<ul class="eb-why">${why}</ul>` : ""}
			${tip && stars < 3 ? `<div class="eb-tip"><span class="eb-av">IN</span><span><b>Le conseil d'Inès :</b> ${tip}</span></div>` : ""}
			${real ? `<p class="eb-real">${real}</p>` : ""}${courses.map(course).join("")}
			<button class="eb-btn vio" data-a="${next}">${nextLabel}</button>`;
	}

	/* ---------- 1. le tunnel de commande ---------- */
	function ux(){
		stage("ux"); W.focus(9.5, -1.6, 1.75); W.hot("caisse"); W.pulse("caisse");
		const sel = new Set();
		let heat = false;
		const render = (fixed = null) => {
			const F = fixed || new Set(), locked = !!fixed;
			const hs = (id, cls = "") => {
				const tagTxt = locked ? (UX[id].bad ? (F.has(id) ? "✓ corrigé" : "laissé tel quel") : (F.has(id) ? "✗ retiré" : "✓ gardé")) : (sel.has(id) ? `#${[...sel].indexOf(id) + 1} à corriger` : "");
				const state = locked ? (UX[id].bad ? (F.has(id) ? "keep" : "miss") : (F.has(id) ? "miss" : "keep")) : "";
				return `class="hs ${cls} ${sel.has(id) && !locked ? "sel" : ""} ${state}" data-hs="${id}" ${!F.has(id) && UX[id].heat ? `data-heat style="--h:${UX[id].heat}"` : ""}>${tagTxt ? `<span class="tag">${tagTxt}</span>` : ""}`;
			};
			return `<div class="st ${locked ? "locked" : ""} ${heat && !locked ? "heat" : ""}">
				<div class="st-nav"><b class="st-logo">Courée</b><small>Sweats · Totes · Bonnets</small><span class="c">🛒 1</span></div>
				<div class="st-body"><div class="st-steps">Panier › <b>Coordonnées</b> › Livraison › Paiement</div>
					${F.has("compte") ? `<div ${hs("compte", "st-guest")}<span class="g">Commander en invité</span><small>Créer un compte après l'achat · J'ai déjà un compte</small></div>`
						: `<div ${hs("compte", "st-box")}<b>Créez votre compte pour continuer</b><div class="st-fs"><div class="st-f"><label>E-mail</label><i></i></div><div class="st-f"><label>Mot de passe (12 caract., 1 symbole)</label><i></i></div><div class="st-f"><label>Confirmer le mot de passe</label><i></i></div></div></div>`}
					<div ${hs("champs", "st-box")}<b>Vos coordonnées</b><div class="st-fs">${(F.has("champs") ? F7 : F14).map(f => `<div class="st-f"><label>${f}</label><i></i></div>`).join("")}</div></div>
					<div ${hs("recap", "st-box")}<div class="st-prod"><span class="st-thumb"></span><span><b>Sweat brodé Vauban</b><small>Brique · taille M</small></span><b>59,00 €</b></div>
						${F.has("frais") ? `<div class="st-line"><span>Livraison</span><span>4,90 €</span></div><div class="st-line tot"><span>Total</span><span>63,90 €</span></div>` : `<div class="st-line"><span>Livraison</span><span class="st-mut">calculée à l'étape suivante</span></div>`}</div>
					${F.has("frais") ? `<div ${hs("frais", "st-okline")}✓ Frais de livraison annoncés dès la fiche produit</div>` : `<div ${hs("frais", "st-surprise")}Étape suivante : <b>frais de port + 6,90 €</b> · frais de dossier + 1,50 €</div>`}
					<div ${hs("avis", "st-trust")}<span><b>★★★★★</b> 4,7 · 312 avis vérifiés</span><span>🔒 Paiement sécurisé</span><span>CB · PayPal</span></div>
					<div ${hs("bouton")}<span class="st-pay ${F.has("bouton") ? "fixed" : ""}">Payer 59,00 €</span></div>
				</div>
				${F.has("popup") ? "" : `<div ${hs("popup", "st-pop")}<span class="x">×</span><b>Attends ! −10 %</b><small>contre ton adresse e-mail</small><span class="e"></span></div>`}
			</div>`;
		};
		const sprint = () => `<div class="eb-sprint"><span>Sprint</span><span class="bar">${[0, 1, 2, 3].map(i => `<i class="${i < sel.size ? "on" : ""}"></i>`).join("")}</span><span>${sel.size}/4 corrections</span></div>`;
		const draw = () => {
			show(`<p class="eb-kick">Étape 1 · Tunnel de commande</p><h2 class="eb-h">82 paniers sur 100 abandonnés</h2>
				<div class="eb-brief"><b class="t">Le brief</b>${S.teased ? "" : "Tu arrives en alternance chez <b>Courée</b>, jeune marque lilloise de sweats (fictive), pour faire décoller son site jusqu'au Black Friday. "}Les visiteurs ajoutent au panier… puis s'en vont à la caisse. Les développeurs ont un sprint avant le lancement : <b>4 corrections au maximum</b>.</div>
				<p class="eb-goal">Touche directement sur la page les éléments à faire corriger.</p>
				<div class="eb-row"><button class="eb-chip" data-a="heat" aria-pressed="${heat}">🔥 Carte de chaleur</button><span class="eb-meta">Où les visiteurs cliquent… et s'énervent</span></div>
				${heat ? `<div class="eb-legend"><i></i>Clics répétés et hésitations</div>` : ""}
				<div style="margin-top:12px">${render()}</div>${sprint()}
				<button class="eb-btn" data-a="uxgo" ${sel.size ? "" : "disabled"}>Mettre en production (${sel.size})</button>`, "couree.fr/commande", "Tunnel de commande");
		};
		draw();
		ines("Le tunnel de commande, c'est là qu'on perd le plus de monde. Active la carte de chaleur, ça aide 😉", 400);
		H.hs = id => { if(sel.has(id)) sel.delete(id); else if(sel.size < 4) sel.add(id); else { ines("Le sprint est plein : 4 corrections maximum. Retire-en une d'abord."); return; } play("pop"); const y = body.scrollTop; draw(); body.scrollTop = y; };
		H.heat = () => { heat = !heat; const y = body.scrollTop; draw(); body.scrollTop = y; };
		H.uxgo = () => {
			const before = conv(), p3 = M.p[3];
			let gain = 0, removed = 0;
			for(const id of sel){ if(UX[id].bad) gain += UX[id].imp; else removed++; }
			M.p[3] = +(p3 + gain - removed*.02).toFixed(3);
			sync(); W.pulse("caisse"); play("stamp");
			const r = gain/UX_BEST, stars = removed ? Math.min(2, r >= .6 ? 2 : 1) : r >= .95 ? 3 : r >= .6 ? 2 : 1;
			S.log.ux = [...sel];
			const why = Object.keys(UX).filter(id => sel.has(id) || UX[id].bad).map(id => {
				const u = UX[id], cls = u.bad ? (sel.has(id) ? "ok" : "mid") : (sel.has(id) ? "ko" : "ok");
				return `<li class="${cls}"><b>${u.name}</b>${u.bad && !sel.has(id) ? " (laissé tel quel)" : !u.bad && sel.has(id) ? " (retiré à tort)" : ""} : ${u.why}</li>`;
			}).join("");
			show(`<p class="eb-kick">Étape 1 · Tunnel de commande</p><h2 class="eb-h">En production !</h2>
				<div class="eb-row"><button class="eb-chip" data-a="uxv" data-v="0" aria-pressed="false">Avant</button><button class="eb-chip" data-a="uxv" data-v="1" aria-pressed="true">Après</button></div>
				<div id="ebMock" style="margin-top:10px">${render(sel)}</div>
				<div id="ebRes">${verdict("ux", { stars, sub:`${Math.round(r*100)} % du gain possible`, deltas:delta("Paient à la caisse", p3, M.p[3], v => Math.round(v*100) + " %") + delta("Conversion", before, conv(), pct),
					why, tip:"on corrige d'abord ce qui bloque le plus : le compte obligatoire et les frais surprises. Et on ne touche pas à ce qui rassure (avis, récapitulatif).",
					courses:["ux"], next:"seo", nextLabel:"Étape 2 · Le référencement →" })}</div>`);
			H.uxv = b => { root.querySelector("#ebMock").innerHTML = render(b.dataset.v === "1" ? sel : new Set()); root.querySelectorAll('[data-a="uxv"]').forEach(x => x.setAttribute("aria-pressed", x === b)); if(b.dataset.v === "0") root.querySelector("#ebMock .st").classList.add("locked"); };
			scrollTo(root.querySelector("#ebRes"));
			// fin de la scène d'ouverture : le tunnel est corrigé
			if(!S.teased){ S.teased = true; later(2600, () => palier({ id:"boutique", onEvent, openLead, quit:close,
				titre:`Tunnel corrigé : ${Math.round(M.p[3]*100)} % des visiteurs paient à la caisse.`,
				texte:"Cinq étapes jusqu'au Black Friday : le référencement, la bannière cookies, le budget de pub, le CRM, puis la journée en direct.",
				suite:"Faire décoller Courée (≈ 10 min)" })); }
		};
	}

	/* ---------- 2. le référencement ---------- */
	function seo(){
		stage("seo"); W.focus(-15, -1.5, 1.6); W.hot(null);
		const ch = { title:"a", meta:"a", url:"a" };
		const opt = (f, o) => SEO[f].find(x => x[0] === o);
		const cut = (t, n) => t.length > n ? t.slice(0, n - 1).trimEnd() + " …" : t;
		const snippet = me => {
			const t = opt("title", ch.title)[1], u = opt("url", ch.url)[1], m = ch.meta === "a" ? "Accepter les cookies · Mon compte · Panier (0) · Sweats Totes Bonnets · Livraison · Nous contacter · Mentions légales · CGV…" : opt("meta", ch.meta)[1];
			return `<div class="sr-it ${me ? "me" : ""}"><div class="sr-site me"><i>C</i><span>Courée<small>couree.fr › ${cut(u.replace(/^\//, "").replace(/[?&=]/g, " › "), 46)}</small></span></div><span class="sr-t">${cut(t, 58)}</span><div class="sr-d">${cut(m, 150)}</div></div>`;
		};
		const field = (f, label, mono) => `<div class="eb-field"><b>${label}</b><div class="eb-opts">${SEO[f].map(([o, t]) => `<button class="eb-opt" data-a="seopt" data-f="${f}" data-o="${o}" aria-pressed="${ch[f] === o}">${mono ? `<code>couree.fr${t}</code>` : t}</button>`).join("")}</div></div>`;
		const draw = () => {
			show(`<p class="eb-kick">Étape 2 · Référencement naturel</p><h2 class="eb-h">Invisible en page 3</h2>
				<div class="eb-brief"><b class="t">Le brief</b>La fiche du Sweat Vauban n'apparaît qu'en page 3 sur « sweat lille ». Pourtant, environ <b>2 400 recherches par jour</b> tournent autour de ces mots-clés.</div>
				<p class="eb-goal">Rédige le titre, la description et l'adresse de la page.</p>
				${field("title", "Balise titre")}${field("meta", "Méta-description")}${field("url", "Adresse de la page", 1)}
				<div class="eb-field"><b>Aperçu dans les résultats</b><div class="sr">${snippet()}</div></div>
				<button class="eb-btn" data-a="seogo">Publier et attendre l'indexation</button>`, "couree.fr" + opt("url", ch.url)[1], "Console SEO");
		};
		draw();
		ines("Personne ne va en page 3 des résultats de recherche. Ou presque 😅 Soigne le titre, c'est lui que les moteurs lisent en premier.", 400);
		H.seopt = b => { ch[b.dataset.f] = b.dataset.o; play("pop"); const y = body.scrollTop; draw(); body.scrollTop = y; };
		H.seogo = () => {
			const s = opt("title", ch.title)[2] + opt("url", ch.url)[2], rank = s >= 3 ? 2 : s === 2 ? 4 : s === 1 ? 7 : 14, mm = opt("meta", ch.meta)[2];
			const before = M.ch.seo, v0 = visitors();
			M.ch.seo = Math.round(2400*CTR[rank]*mm);
			S.log.seo = { ...ch, rank };
			const list = SERP.slice(0, 7).map((x, i) => `<div class="sr-it"><div class="sr-site"><i>${x[0]}</i><span>${x[1]}<small>${x[2]}</small></span></div><span class="sr-t">${x[3]}</span><div class="sr-d">${x[4]}</div></div>`);
			if(rank < 14) list.splice(rank - 1, 0, snippet(1));
			const res = `<div class="sr"><div class="sr-q">🔎 sweat lille</div>${list.slice(0, 7).map((x, i) => x.replace('<div class="sr-site', `<span class="sr-pos">#${i + 1}</span><div class="sr-site`)).join("")}
				${rank >= 14 ? `<div class="sr-p2">… page 2 : Courée, en position ${rank}</div>` : ""}</div>`;
			const stars = ch.title === "b" && ch.url === "b" && ch.meta === "b" ? 3 : ch.title === "b" ? 2 : 1;
			const why = [
				ch.title === "b" ? `<li class="ok"><b>Le titre</b> contient les mots que les gens tapent (sweat, brodé, Lille) et le nom de la marque, en moins de 60 caractères.</li>`
					: ch.title === "c" ? `<li class="ko"><b>Le titre</b> répète « sweat » à l'excès : c'est de la suroptimisation, que les moteurs pénalisent. Et il est coupé dans les résultats.</li>`
					: `<li class="ko"><b>Le titre</b> « Produit 12 – Accueil » ne dit rien : ni aux moteurs, ni aux humains.</li>`,
				ch.url === "b" ? `<li class="ok"><b>L'adresse</b> est courte et lisible : elle décrit la page.</li>` : ch.url === "c" ? `<li class="ko"><b>L'adresse</b> bourrée de mots-clés fait « spam ».</li>` : `<li class="mid"><b>L'adresse</b> technique (id_product=12) n'aide ni le moteur ni le visiteur.</li>`,
				ch.meta === "b" ? `<li class="ok"><b>La méta-description</b> ne fait pas monter dans le classement, mais elle donne envie de cliquer : livraison, retours, matière.</li>`
					: `<li class="${ch.meta === "c" ? "ko" : "mid"}"><b>La méta-description</b> ne compte pas pour le classement… mais c'est elle qui donne envie de cliquer. ${ch.meta === "c" ? "Les majuscules et « !!! » font fuir." : "Vide, le moteur affiche un bout de menu."}</li>`
			].join("");
			sync(); W.pulse("vitrine"); play("stamp");
			show(`<p class="eb-kick">Étape 2 · Référencement naturel</p><h2 class="eb-h">${rank < 14 ? `Position ${rank} !` : "Toujours en page 2"}</h2>${res}
				${verdict("seo", { stars, sub:`Taux de clic estimé : ${pct(CTR[rank]*mm)}`, deltas:delta("Visiteurs « recherche »", before, M.ch.seo, int) + delta("Visiteurs / jour", v0, visitors(), int), why,
					tip:"un bon titre = les mots-clés que les gens tapent + le nom de la marque, sans répétition. La description, elle, sert à faire cliquer.",
					real:"En vrai, il faut des semaines, du contenu et des liens venus d'autres sites pour grimper : ici, on a accéléré le temps.",
					courses:["seo"], next:"rgpd", nextLabel:"Étape 3 · La bannière cookies →" })}`);
			scrollTo(root.querySelector(".eb-verdict"));
		};
	}

	/* ---------- 3. la bannière cookies ---------- */
	function rgpd(){
		stage("rgpd"); W.focus(-12, -1, 1.25); W.hot("vitrine");
		const c = { refus:"absent", cases:"cochees", stats:"pub", news:"cochee" };
		const preview = () => {
			const ck = c.cases === "cochees" ? "☑" : "☐";
			const bt = c.refus === "egal" ? `<span class="a">Tout accepter</span><span class="r">Tout refuser</span><span class="p">Paramétrer</span>`
				: c.refus === "lien" ? `<span class="a">Tout accepter</span><span class="p">Paramétrer</span><span class="lk">continuer sans accepter</span>` : `<span class="a">Tout accepter</span><span class="p">Paramétrer</span>`;
			return `<div class="st"><div class="st-nav"><b class="st-logo">Courée</b><small>Sweats brodés à Lille</small><span class="c">🛒 0</span></div>
				<div class="st-hero"><b>Brodés à Lille, portés partout</b><small>Nouvelle collection · coton bio</small><span class="sw"></span>
				<div class="st-ban"><b>🍪 On utilise des cookies</b>Pour mesurer l'audience, personnaliser la publicité et partager sur les réseaux.
					<div class="ck"><span>${ck} Mesure d'audience</span><span>${ck} Publicité ciblée</span><span>${ck} Réseaux sociaux</span></div><div class="bt">${bt}</div></div></div>
				<div class="st-news"><i class="${c.news === "cochee" ? "on" : ""}">${c.news === "cochee" ? "✓" : ""}</i><span>${c.news === "cochee" ? "J'accepte de recevoir les offres de Courée et de ses partenaires" : "Je souhaite recevoir la newsletter de Courée (une par mois)"}</span></div></div>`;
		};
		const field = (f, label) => `<div class="eb-field"><b>${label}</b><div class="eb-opts">${RGPD[f].map(([o, t]) => `<button class="eb-opt" data-a="rgopt" data-f="${f}" data-o="${o}" aria-pressed="${c[f] === o}">${t}</button>`).join("")}</div></div>`;
		const draw = () => {
			show(`<p class="eb-kick">Étape 3 · RGPD et cookies</p><h2 class="eb-h">La bannière « qui fait tout accepter »</h2>
				<div class="eb-brief"><b class="t">Le brief</b>L'ancien stagiaire a installé une bannière qui « fait accepter tout le monde ». La CNIL contrôle de plus en plus les sites marchands : à revoir avant le lancement.</div>
				<p class="eb-goal">Une bannière conforme… sans perdre de vue tes statistiques.</p>
				<div id="ebPrev">${preview()}</div>
				<div style="margin-top:14px">${field("refus", "Refuser")}${field("cases", "Cases des finalités")}${field("stats", "Mesure d'audience")}${field("news", "Newsletter")}</div>
				<button class="eb-btn" data-a="rggo">Publier la bannière</button>`, "couree.fr", "Bannière cookies");
		};
		draw();
		ines("Fais-moi une bannière propre. Je ne veux pas de courrier de la CNIL 😬", 400);
		H.rgopt = b => { c[b.dataset.f] = b.dataset.o; play("pop"); root.querySelector("#ebPrev").innerHTML = preview(); root.querySelectorAll(`[data-a="rgopt"][data-f="${b.dataset.f}"]`).forEach(x => x.setAttribute("aria-pressed", x === b)); };
		H.rggo = () => {
			const ok = c.refus === "egal" && c.cases === "vides" && c.stats !== "pub" && c.news === "vide";
			const accept = Math.min(.95, (c.refus === "egal" ? .55 : c.refus === "lien" ? .75 : .9) + (c.cases === "cochees" ? .05 : 0));
			const measured = c.stats === "exempt" ? 1 : accept;
			M.ghost = 1 - accept; M.rgpd = ok ? "ok" : "ko"; M.news = c.news;
			S.log.rgpd = { ...c };
			const stars = ok && c.stats === "exempt" ? 3 : ok ? 2 : 1;
			const why = [
				c.refus === "egal" ? `<li class="ok"><b>Refuser</b> est aussi simple qu'accepter : c'est ce qu'exige la CNIL.</li>` : `<li class="ko"><b>Refuser</b> doit être aussi simple qu'accepter. ${c.refus === "lien" ? "Un petit lien gris presque invisible ne suffit pas." : "Trois clics pour refuser contre un pour accepter : non conforme."}</li>`,
				c.cases === "vides" ? `<li class="ok"><b>Les cases</b> sont vides : le consentement doit être un geste actif.</li>` : `<li class="ko"><b>Les cases précochées</b> ne valent pas consentement.</li>`,
				c.stats === "exempt" ? `<li class="ok"><b>La mesure d'audience exemptée</b> (statistiques anonymes, sans pub ni recoupement) peut fonctionner sans consentement : tu continues de compter tout le monde.</li>`
					: c.stats === "pub" ? `<li class="ko"><b>Les traceurs publicitaires</b> ne doivent jamais se déclencher avant le choix du visiteur.</li>` : `<li class="mid"><b>Sans mesure</b> pour ceux qui refusent, c'est conforme… mais tu pilotes à l'aveugle : ${Math.round(M.ghost*100)} % des visiteurs disparaissent de tes chiffres.</li>`,
				c.news === "vide" ? `<li class="ok"><b>La newsletter</b> : une case à cocher soi-même. Ta liste d'abonnés sera fiable.</li>` : `<li class="ko"><b>La case précochée</b> pour recevoir des offres (en plus, de « partenaires ») ne vaut pas consentement : cette liste d'e-mails n'est pas utilisable.</li>`
			].join("");
			sync(); play("stamp"); W.pulse("vitrine");
			show(`<p class="eb-kick">Étape 3 · RGPD et cookies</p><h2 class="eb-h">${ok ? "Bannière conforme" : "Contrôle de la CNIL…"}</h2>
				${ok ? "" : `<div class="eb-alert"><b>⚖️ Mise en demeure</b><p>Un contrôle relève des manquements sur la bannière. En décembre 2021, la CNIL a infligé 150 M€ d'amende à Google et 60 M€ à Facebook, parce que refuser les cookies y était plus compliqué qu'accepter.</p></div>`}
				<div class="eb-deltas" style="margin-top:12px"><div class="eb-delta"><small>Acceptent les cookies</small><b>${Math.round(accept*100)} %</b></div><div class="eb-delta"><small>Visiteurs mesurés</small><b class="${measured > .9 ? "ok" : "ko"}">${Math.round(measured*100)} %</b></div></div>
				<div class="eb-tip"><span class="eb-av">👻</span><span>Regarde la maquette : les visiteurs qui refusent deviennent des <b>fantômes</b>. Ils achètent quand même ! ${c.stats === "exempt" ? "Grâce à l'outil exempté, tu les comptes toujours, de façon anonyme." : "Mais tes outils ne les voient plus."}</span></div>
				${verdict("rgpd", { stars, why, tip:"refuser aussi facile qu'accepter, des cases vides, aucun traceur publicitaire avant le choix, et un outil de mesure d'audience exempté pour garder des statistiques.",
					courses:["rgpd"], next:"acq", nextLabel:"Étape 4 · Le budget d'acquisition →" })}`, "couree.fr", "Bannière cookies");
		};
	}

	/* ---------- 4. le budget d'acquisition ---------- */
	function acqSales(k, n){
		const a = ACQ[k], bad = k === "mail" && M.news === "cochee";
		const v0 = bad ? 400 : a.v, cv = bad ? .02 : a.cv;
		let visits = 0; for(let i = 0; i < n; i++) visits += v0*Math.pow(a.k, i);
		return { visits, sales:visits*cv, ca:visits*cv*M.basket };
	}
	function acqBest(){
		let best = 0;
		const rec = (i, left, sum) => { if(i === ACQ_KEYS.length - 1){ best = Math.max(best, sum + acqSales(ACQ_KEYS[i], left).ca); return; } for(let n = 0; n <= left; n++) rec(i + 1, left - n, sum + acqSales(ACQ_KEYS[i], n).ca); };
		rec(0, 6, 0); return best;
	}
	function acq(){
		stage("acq"); W.focus(-15.5, -1, 1.45); W.hot(null);
		const n = Object.fromEntries(ACQ_KEYS.map(k => [k, 0]));
		const used = () => Object.values(n).reduce((a, b) => a + b, 0);
		const draw = () => {
			const u = used();
			show(`<p class="eb-kick">Étape 4 · Acquisition</p><h2 class="eb-h">3 000 € pour le lancement</h2>
				<div class="eb-brief"><b class="t">Le brief</b>C'est le lancement officiel ! Tu as <b>3 000 €</b> de budget média pour la première semaine, à répartir par tranches de 500 €.</div>
				<p class="eb-goal">Le plus de ventes possible pour 3 000 €.</p>
				<div class="eb-budget"><span><small>Reste à placer</small><b>${euro((6 - u)*500)}</b></span><span class="bar">${[0, 1, 2, 3, 4, 5].map(i => `<i style="${i < u ? `background:${ACQ[ACQ_KEYS.flatMap(k => Array(n[k]).fill(k))[i]].col}` : ""}"></i>`).join("")}</span></div>
				${ACQ_KEYS.map(k => { const a = ACQ[k]; return `<div class="eb-ch"><span class="ic" style="background:${a.col}22">${a.ic}</span><span><b>${a.name}</b><small>${a.d}</small>${k === "mail" && M.news === "cochee" ? `<small class="w">⚠ Liste construite avec une case précochée</small>` : ""}</span>
					<span class="eb-step"><button data-a="acqn" data-k="${k}" data-d="-1" aria-label="Retirer 500 €">−</button><span>${euro(n[k]*500)}</span><button data-a="acqn" data-k="${k}" data-d="1" aria-label="Ajouter 500 €">+</button></span></div>`; }).join("")}
				<button class="eb-btn" data-a="acqgo" ${u === 6 ? "" : "disabled"}>${u === 6 ? "Lancer les campagnes" : `Encore ${euro((6 - u)*500)} à placer`}</button>`, "couree.fr/admin/campagnes", "Campagnes");
		};
		draw();
		ines("Le budget, c'est 3 000 €, pas un centime de plus. Pense aux gens qui cherchent déjà un sweat… et à ceux qui nous connaissent déjà.", 400);
		H.acqn = b => { const k = b.dataset.k, d = +b.dataset.d; if(d > 0 && used() >= 6) return; n[k] = Math.max(0, n[k] + d); play("pop"); const y = body.scrollTop; draw(); body.scrollTop = y; };
		H.acqgo = () => {
			const rows = ACQ_KEYS.filter(k => n[k]).map(k => ({ k, spent:n[k]*500, ...acqSales(k, n[k]) })).map(r => ({ ...r, roas:r.ca/r.spent }));
			const tot = rows.reduce((a, r) => a + r.ca, 0), best = acqBest(), ratio = tot/best;
			const v0 = visitors(), c0 = caDay();
			for(const r of rows) M.ch[r.k] = Math.round(r.visits/7);
			if(M.news === "cochee" && n.mail) M.note = Math.max(3.6, M.note - .2);
			S.log.acq = { ...n };
			sync(); play("coin");
			const maxR = Math.max(...rows.map(r => r.roas), 2);
			const tbl = `<table class="eb-tbl"><tr><th>Canal</th><th>Dépensé</th><th>Ventes</th><th>CA</th><th>ROAS</th></tr>${rows.map(r => `<tr><td>${ACQ[r.k].ic} ${ACQ[r.k].short}</td><td>${euro(r.spent)}</td><td>${int(r.sales)}</td><td>${euro(r.ca)}</td>
				<td class="r"><span class="eb-roas"><i style="width:${Math.round(r.roas/maxR*70)}px;background:${r.roas >= 2 ? "var(--ok)" : "var(--ko)"}"></i><b>${r.roas.toLocaleString("fr-FR", { maximumFractionDigits:1 })}</b></span></td></tr>`).join("")}
				<tr><td><b>Total</b></td><td><b>3 000 €</b></td><td><b>${int(rows.reduce((a, r) => a + r.sales, 0))}</b></td><td><b>${euro(tot)}</b></td><td class="r"><span class="eb-roas"><b>${(tot/3000).toLocaleString("fr-FR", { maximumFractionDigits:1 })}</b></span></td></tr></table>`;
			const losers = rows.filter(r => r.roas < 2).sort((a, b) => a.roas - b.roas), answer = losers.length ? losers[0].k : "aucun";
			show(`<p class="eb-kick">Étape 4 · Acquisition</p><h2 class="eb-h">Bilan de la semaine</h2>
				<p class="eb-p">Le <b>ROAS</b> (retour sur dépense publicitaire), c'est le chiffre d'affaires rapporté par chaque euro de publicité.</p>${tbl}
				<div class="eb-brief" style="margin-top:14px"><b class="t">Une question d'analyse</b>Sur un sweat, Courée garde environ <b>50 % de marge</b>. Pour la semaine 2, quel canal faut-il couper en premier ?</div>
				<div class="eb-opts" id="ebQ">${[...rows.map(r => [r.k, `${ACQ[r.k].ic} ${ACQ[r.k].name}`]), ["aucun", "Aucun : ils sont tous rentables"]].map(([k, t]) => `<button class="eb-opt" data-a="acqq" data-k="${k}">${t}</button>`).join("")}</div>
				<div id="ebRes"></div>`);
			H.acqq = b => {
				if(root.querySelector("#ebQ").dataset.done) return; root.querySelector("#ebQ").dataset.done = 1;
				const good = b.dataset.k === answer;
				root.querySelectorAll('[data-a="acqq"]').forEach(x => { if(x.dataset.k === answer) x.classList.add("ok"); else if(x === b) x.classList.add("ko"); });
				let stars = ratio >= .92 ? 3 : ratio >= .75 ? 2 : 1;
				if(!good) stars = Math.max(1, stars - 1);
				const why = [`<li class="${ratio >= .92 ? "ok" : ratio >= .75 ? "mid" : "ko"}">Ta répartition rapporte <b>${euro(tot)}</b>, soit ${Math.round(ratio*100)} % de la meilleure répartition possible (${euro(best)}).</li>`,
					`<li class="${good ? "ok" : "ko"}">${answer === "aucun" ? "Tous tes canaux ont un ROAS d'au moins 2 : avec 50 % de marge, ils sont rentables." : `Avec 50 % de marge, un ROAS sous 2 fait perdre de l'argent : il faut couper d'abord <b>${ACQ[answer].name.toLowerCase()}</b> (ROAS ${losers[0].roas.toLocaleString("fr-FR", { maximumFractionDigits:1 })}).`}</li>`,
					M.news === "cochee" && n.mail ? `<li class="ko">L'e-mail à une liste précochée : peu de clics, des plaintes pour spam, et des messages qui finissent en indésirables.</li>` : n.mail ? `<li class="ok">L'e-mail à des abonnés qui ont vraiment dit oui : le canal le plus rentable.</li>` : `<li class="mid">Tu n'as pas utilisé l'e-mail : à des abonnés qui ont dit oui, c'est souvent le canal le plus rentable.</li>`].join("");
				root.querySelector("#ebRes").innerHTML = verdict("acq", { stars, deltas:delta("Visiteurs / jour", v0, visitors(), int) + delta("Ventes / jour", c0, caDay(), euro), why,
					tip:"chaque canal s'essouffle : la deuxième tranche rapporte moins que la première. Mieux vaut répartir entre les canaux les plus rentables (e-mail, influence, annonces) que tout miser sur un seul.",
					courses:["acq", "data"], next:"crm", nextLabel:"Étape 5 · Le CRM →" });
				scrollTo(root.querySelector("#ebRes"));
			};
		};
	}

	/* ---------- 5. le CRM ---------- */
	function crm(){
		stage("crm"); W.focus(5, -1.5, 1.35); W.hot("fiche");
		const link = {}; let cur = null, timing = null;
		const draw = () => {
			const used = Object.values(link);
			show(`<p class="eb-kick">Étape 5 · CRM</p><h2 class="eb-h">Le bon message, à la bonne personne</h2>
				<div class="eb-brief"><b class="t">Le brief</b>Trois semaines après le lancement, la base clients grossit. Inès veut une campagne par segment.</div>
				<p class="eb-goal">Touche un segment, puis le message à lui envoyer.</p>
				<div class="eb-crm"><div><h4>Segments</h4>${Object.entries(SEG).map(([k, s]) => `<button class="eb-card" data-a="seg" data-k="${k}" aria-pressed="${cur === k}">${link[k] ? `<span class="lk" style="background:${SEG_COL[k]}">✓</span>` : ""}<b>${s[0]} ${s[1]}</b><small>${s[2]}</small>${k === "abonnes" && M.news === "cochee" ? `<small class="w">⚠ Inscrits avec une case précochée</small>` : ""}</button>`).join("")}</div>
				<div><h4>Messages</h4>${Object.entries(MSG).map(([k, m]) => { const s = Object.keys(link).find(x => link[x] === k); return `<button class="eb-card" data-a="msg" data-k="${k}">${s ? `<span class="lk" style="background:${SEG_COL[s]}">${SEG[s][0]}</span>` : ""}<b>${m[0]}</b><small>${m[1]}</small></button>`; }).join("")}</div></div>
				<div class="eb-field" style="margin-top:12px"><b>Quand relancer un panier abandonné ?</b><div class="eb-opts">${[["1h", "1 heure après l'abandon"], ["24h", "Le lendemain"], ["7j", "Une semaine après"]].map(([k, t]) => `<button class="eb-opt" data-a="crmt" data-k="${k}" aria-pressed="${timing === k}">${t}</button>`).join("")}</div></div>
				<button class="eb-btn" data-a="crmgo" ${Object.keys(link).length === 4 && timing ? "" : "disabled"}>Programmer les envois</button>`, "couree.fr/admin/crm", "CRM · Segments");
		};
		draw();
		ines("Un message pour tout le monde, c'est un message pour personne. Segmente !", 400);
		H.seg = b => { cur = b.dataset.k; play("pop"); const y = body.scrollTop; draw(); body.scrollTop = y; };
		H.msg = b => { if(!cur){ ines("Choisis d'abord un segment, à gauche 👈"); return; } for(const s in link) if(link[s] === b.dataset.k) delete link[s]; link[cur] = b.dataset.k; cur = Object.keys(SEG).find(s => !link[s]) || null; play("pop"); const y = body.scrollTop; draw(); body.scrollTop = y; };
		H.crmt = b => { timing = b.dataset.k; play("pop"); const y = body.scrollTop; draw(); body.scrollTop = y; };
		H.crmgo = () => {
			const right = Object.keys(SEG).filter(k => link[k] === SEG[k][3]).length;
			const stars = right === 4 && timing === "1h" ? 3 : right >= 3 ? 2 : 1;
			const p3 = M.p[3], c0 = conv(), b0 = M.basket;
			M.p[3] = +(M.p[3] + (timing === "1h" ? .03 : timing === "24h" ? .015 : 0) + (link.panier === "m1" ? .01 : 0)).toFixed(3);
			if(link.unique === "m3") M.basket += 4;
			M.ch.mail += right*30 + (M.news === "cochee" ? 0 : 20);
			if(Object.values(link).includes("m5")) M.basket -= 6;
			S.log.crm = { link:{ ...link }, timing };
			sync(); play("stamp"); W.pulse("caisse");
			const why = Object.keys(SEG).map(k => { const ok = link[k] === SEG[k][3]; return `<li class="${ok ? "ok" : "ko"}"><b>${SEG[k][1]}</b> → ${MSG[link[k]][0]}${ok ? "" : ` (mieux : « ${MSG[SEG[k][3]][0]} »)`}. ${{
				panier:"Un rappel avec des avis rassure. Pas besoin de remise tout de suite : sinon, les clients apprennent à abandonner leur panier pour en obtenir une.",
				fideles:"Les meilleurs clients aiment être privilégiés : l'exclusivité vaut mieux qu'une remise.",
				unique:"Proposer un produit complémentaire (vente croisée) fait grimper le panier moyen.",
				abonnes:"Avant de vendre, on fait connaissance : une série de bienvenue raconte la marque."
			}[k]}</li>`; }).join("") + (Object.values(link).includes("m5") ? `<li class="ko">« −30 % sur tout, tout le temps » abîme la marge et l'image de la marque.</li>` : "")
				+ `<li class="${timing === "1h" ? "ok" : timing === "24h" ? "mid" : "ko"}"><b>La relance</b> : ${timing === "1h" ? "dans l'heure, le client a encore son achat en tête." : timing === "24h" ? "le lendemain, ça marche encore, mais moins bien que dans l'heure." : "une semaine après, il a déjà acheté ailleurs."}</li>`
				+ (M.news === "cochee" ? `<li class="info">Les abonnés inscrits avec une case précochée n'ont pas vraiment consenti : en vrai, il faudrait leur redemander leur accord avant tout envoi.</li>` : "");
			show(`<p class="eb-kick">Étape 5 · CRM</p><h2 class="eb-h">${right}/4 segments bien ciblés</h2>
				${verdict("crm", { stars, deltas:delta("Paient à la caisse", p3, M.p[3], v => Math.round(v*100) + " %") + delta("Panier moyen", b0, M.basket, euro) + delta("Conversion", c0, conv(), pct), why,
					tip:"un segment = un besoin. Paniers abandonnés : rappel rapide. Fidèles : exclusivité. Acheteurs d'un seul produit : produit complémentaire. Nouveaux abonnés : bienvenue.",
					courses:["crm"], next:"bf", nextLabel:"Étape 6 · Le Black Friday →" })}`);
			scrollTo(root.querySelector(".eb-verdict"));
		};
	}

	/* ---------- 6. le Black Friday en direct ---------- */
	let liveT = 0;
	function bf(){
		stage("bf"); W.focus(2, -.6, 1.05); W.hot(null);
		show(`<p class="eb-kick">Étape 6 · Black Friday</p><h2 class="eb-h">24 heures en 80 secondes</h2>
			<div class="eb-brief"><b class="t">Le brief</b>C'est le Black Friday : le trafic va être multiplié par 8. Tu pilotes en direct. Quatre alertes vont tomber : <b>décide vite</b>, chaque seconde compte. Sans décision, c'est le pire choix qui s'applique.</div>
			<ul class="eb-list"><li><i>📱</i><span>Le site doit tenir sur mobile</span></li><li><i>📦</i><span>Le stock doit suivre</span></li><li><i>🚚</i><span>Les colis doivent partir</span></li><li><i>⭐</i><span>Et les clients doivent rester contents</span></li></ul>
			<button class="eb-btn vio" data-a="bfgo">⚡ Lancer le direct</button>`, "couree.fr", "Live · Black Friday");
		ines("Grosse journée ! Garde un œil sur la boutique et l'entrepôt, je compte sur toi 💪", 400);
	}
	function bfLive(){
		const L = { t:0, orders:0, ca:0, load:5.2, pending:0, ship:120, stock:"normal", promise:"48h", choice:{}, ev:-1, evT:0, base:visitors(), conv:conv() };
		W.setRush(4.5); W.setShip(.35); play("alarm");
		show(`<div class="eb-live"><div class="hd"><span class="rec"></span>EN DIRECT · Black Friday<b id="bfClock">00:00</b></div><div class="pg"><i id="bfPg"></i></div>
			<div class="g"><div class="c"><small>Commandes</small><b id="bfO">0</b></div><div class="c"><small>Chiffre d'affaires</small><b id="bfCA">0 €</b></div>
			<div class="c"><small>Chargement mobile</small><b id="bfL" class="ko">5,2 s</b></div><div class="c"><small>Colis en attente</small><b id="bfP">0</b></div></div></div>
			<div id="bfEv"><div class="eb-wait">Tout roule… pour l'instant.</div></div><div id="bfLog"></div>`, "couree.fr", "Live · Black Friday");
		const $ = id => root.querySelector("#" + id);
		const ramp = t => { const x = t/BF_LEN; return .4 + 1.6*Math.sin(Math.PI*Math.min(1, x*1.15)); };
		let lastCoin = 0;
		clearInterval(liveT);
		liveT = setInterval(() => {
			if(closed) return clearInterval(liveT);
			L.t += .1;
			// trafic de la journée (8 fois la normale), réparti sur 80 secondes
			const vis = L.base*8*ramp(L.t)*.1/BF_LEN;
			let cv = L.conv*1.5*(L.load > 4.5 ? .45 : L.load > 3 ? .75 : 1);
			if(L.stock === "out") cv *= .7; else if(L.stock === "cut") cv *= .85;
			const o = vis*cv; L.orders += o; L.ca += o*(M.basket - 6); L.pending += o;
			L.pending = Math.max(0, L.pending - L.ship*.1/BF_LEN*(L.t > 60 && L.choice.logi === "b" ? 1.6 : 1));
			if(L.stock === "watch" && L.t > 30) L.stock = "out";
			if(Math.floor(L.orders/40) > lastCoin){ lastCoin = Math.floor(L.orders/40); play("coin"); }
			const h = Math.min(24, L.t/BF_LEN*24);
			$("bfClock").textContent = String(Math.floor(h)).padStart(2, "0") + ":" + String(Math.floor((h % 1)*60)).padStart(2, "0");
			$("bfPg").style.width = Math.min(100, L.t/BF_LEN*100) + "%";
			$("bfO").textContent = int(L.orders); $("bfCA").textContent = euro(L.ca);
			$("bfL").textContent = L.load.toLocaleString("fr-FR") + " s"; $("bfL").className = L.load > 3 ? "ko" : "ok";
			$("bfP").textContent = int(L.pending); $("bfP").className = L.pending > 150 ? "ko" : "";
			W.setEntrepot(int(L.pending) + " colis en attente");
			// les alertes
			const next = BF.findIndex((e, i) => i > L.ev && L.t >= e.at);
			if(next >= 0 && L.evT <= 0){ L.ev = next; L.evT = 14; bfAlert(BF[next], L); }
			if(L.evT > 0){ L.evT -= .1; const bar = root.querySelector(".eb-alert .tm i"); if(bar) bar.style.transform = `scaleX(${Math.max(0, L.evT/14)})`; if(L.evT <= 0) decide(BF[L.ev], "c", L, true); }
			if(L.t >= BF_LEN && L.ev === BF.length - 1 && L.evT <= 0){ clearInterval(liveT); bfEnd(L); }
		}, 100);
	}
	function bfAlert(E, L){
		play("alarm"); W.pulse(E.k === "logi" ? "caisse" : E.k === "stock" ? "fiche" : "vitrine");
		if(E.k === "logi") W.focus(15, -.5, 1.6); else if(E.k === "speed") W.focus(-4, -1, 1.2); else W.focus(4, -1, 1.35);
		root.querySelector("#bfEv").innerHTML = `<div class="eb-alert"><b>${E.ic} ${E.t}</b><p>${E.d(L)}</p><div class="tm"><i></i></div><div class="eb-opts">${E.opts.map(([k, t]) => `<button class="eb-opt" data-a="bfe" data-k="${k}">${t}</button>`).join("")}</div></div>`;
		H.bfe = b => decide(E, b.dataset.k, L, false);
	}
	function decide(E, k, L, late){
		if(L.choice[E.k]) return;
		L.choice[E.k] = k; L.evT = 0;
		const o = E.opts.find(x => x[0] === k);
		if(E.k === "speed") L.load = k === "a" ? 1.9 : k === "b" ? 3.4 : 5.2;
		if(E.k === "stock") L.stock = k === "a" ? "pre" : k === "b" ? "cut" : "watch";
		if(E.k === "logi"){ L.promise = k; W.setShip(k === "b" ? .55 : .35); }
		play(o[2] === 3 ? "good" : o[2] === 2 ? "chime" : "bad");
		if(o[2] === 1){ S.errors++; onEvent && onEvent("err"); }
		root.querySelector("#bfEv").innerHTML = `<div class="eb-wait">${L.ev < BF.length - 1 ? "Décision appliquée. Reste attentif…" : "Plus que quelques heures…"}</div>`;
		root.querySelector("#bfLog").insertAdjacentHTML("afterbegin", `<div class="eb-done"><span>${STARS(o[2])}</span><span><b>${E.t}</b> · ${late ? "temps écoulé : " : ""}${o[1]}</span></div>`);
		if(o[2] === 3) ines(pick(["Bien vu 👌", "Parfait, on continue !", "Exactement ce qu'il fallait."]));
		else if(late) ines("Trop tard… on a laissé faire 😬");
		W.focus(2, -.6, 1.05);
	}
	function bfEnd(L){
		W.setRush(1); W.setShip(.9); W.setEntrepot("Expéditions en cours"); play("win");
		const st = BF.map(E => E.opts.find(x => x[0] === L.choice[E.k])[2]);
		const avg = st.reduce((a, b) => a + b, 0)/st.length, stars = avg >= 2.75 ? 3 : avg >= 2 ? 2 : 1;
		const n0 = M.note;
		M.note = Math.max(3.2, Math.min(4.8, M.note + (L.choice.logi === "a" ? .1 : L.choice.logi === "b" ? -.1 : -.4) + (L.choice.avis === "a" ? .1 : L.choice.avis === "c" ? -.1 : -.3) + (L.choice.stock === "c" ? -.2 : 0)));
		S.log.bf = { ...L.choice, orders:Math.round(L.orders), ca:Math.round(L.ca) }; S.bf = L;
		sync();
		const why = BF.map(E => { const o = E.opts.find(x => x[0] === L.choice[E.k]), best = E.opts.find(x => x[2] === 3); return `<li class="${o[2] === 3 ? "ok" : o[2] === 2 ? "mid" : "ko"}"><b>${E.t}</b> : ${o[3]}${o[2] < 3 ? ` Le mieux : ${best[1].charAt(0).toLowerCase() + best[1].slice(1)}.` : ""}</li>`; }).join("");
		show(`<p class="eb-kick">Étape 6 · Black Friday</p><h2 class="eb-h">Journée terminée !</h2>
			<div class="eb-deltas"><div class="eb-delta"><small>Commandes</small><b>${int(L.orders)}</b></div><div class="eb-delta"><small>Chiffre d'affaires</small><b>${euro(L.ca)}</b></div></div>
			${verdict("bf", { stars, deltas:delta("Avis clients", n0, M.note, v => v.toLocaleString("fr-FR", { minimumFractionDigits:1, maximumFractionDigits:1 }) + " ★"), why,
				tip:"un pic de trafic se prépare : site rapide sur mobile, stock suivi en direct, promesse de livraison tenable, et des réponses visibles aux avis.",
				courses:["perf", "logi"], next:"end", nextLabel:"Voir le rapport final →" })}`, "couree.fr/admin/rapport", "Rapport");
	}

	/* ---------- bilan ---------- */
	function finale(){
		stage("end"); W.focus(0, -.6, 1); W.hot(null);
		const total = Object.values(S.done).reduce((a, b) => a + b, 0), max = STEPS.length*3;
		const [rank, mention] = total >= 16 ? ["Head of Growth en puissance", "Très bien"] : total >= 13 ? ["Chef·fe de projet e-commerce", "Bien"] : total >= 10 ? ["Alternant·e prometteur·se", "Assez bien"] : ["Stagiaire à suivre de près", "De justesse"];
		onEvent && onEvent("win", mention);
		const M1 = M0();
		const conv1 = M1.p.reduce((a, b) => a*b, 1), vis1 = Object.values(M1.ch).reduce((a, b) => a + b, 0);
		ines(total >= 16 ? "Franchement, bravo. Tu veux signer ton alternance chez nous ? 🎉" : total >= 13 ? "Belle progression ! Encore un peu d'expérience et tu me piques mon poste 😄" : "On a appris plein de choses. Tu rejoues ? Les chiffres ne mentent pas 😉", 600);
		show(`<p class="eb-kick">${formation.name} · rapport final</p><h2 class="eb-h">Courée a décollé 🚀</h2>
			<div class="eb-score"><b>${total}/${max} ★</b><small>${rank}</small></div>
			<div class="eb-stages">${STEPS.map(([k, n]) => `<div>${n}<span>${STARS(S.done[k] || 0)}</span></div>`).join("")}</div>
			<div class="eb-deltas">${delta("Visiteurs / jour", vis1, visitors(), int)}${delta("Conversion", conv1, conv(), pct)}${delta("Ventes / jour", vis1*conv1*M1.basket, caDay(), euro)}${S.bf ? `<div class="eb-delta"><small>Black Friday</small><b>${euro(S.bf.ca)}</b></div>` : ""}</div>
			<p class="eb-p">UX, référencement, RGPD, acquisition, CRM, logistique : le e-commerce, c'est tout cela à la fois. C'est le métier de chef de projet e-commerce, de consultant SEO, de trafic manager ou de responsable CRM, que prépare le master, en alternance sur 2 ans. Tu as touché à :</p>
			<ul class="eb-list">${Object.keys(COURSES).filter(k => S.learned.has(k)).map(k => `<li><i>📚</i><span>${COURSES[k][0]}</span></li>`).join("")}</ul>
			${jpoCard()}${openLead ? `<button class="eb-btn vio" data-a="lead">📄 Recevoir la plaquette du master</button>` : ""}
			<a class="eb-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir le Master E-Business & Marketing Digital ↗</a>
			<button class="eb-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="eb-alt" data-a="replay">Rejouer</button>`, "couree.fr/admin/rapport", "Rapport final");
	}

	/* ---------- actions ---------- */
	const H = {};
	const GO = { ux, seo, rgpd, acq, crm, bf, end:finale };
	root.addEventListener("click", e => {
		const hs = e.target.closest("[data-hs]");
		if(hs && !hs.closest(".locked") && H.hs) return H.hs(hs.dataset.hs);
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a;
		if(GO[k]){ play("pop"); clearInterval(liveT); W.setRush(1); return GO[k](); }
		if(k === "bfgo") return bfLive();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ W.setEntrepot(""); M = M0(); Object.assign(S, { done:{}, learned:new Set(), errors:0, log:{} }); delete S.bf; kpi("rgpd", 0, "À vérifier", ""); sync(); return ux(); }
		if(H[k]) H[k](a);
	});
	function close(){ if(closed) return; closed = true; clearInterval(liveT); removeEventListener("resize", layout); document.removeEventListener("keydown", onKey); W.dispose(); root.remove(); onClose && onClose(); }
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	root.querySelector(".eb-x").addEventListener("click", close);
	sync(); ux();      // ouverture à chaud : le tunnel de commande tout de suite, Inès plante le décor
	ines("Salut ! Moi c'est Inès, head of growth chez Courée. Du monde entre… et presque personne ne paie. On s'y met ?", 500);
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	onEvent && onEvent("missions", [["1 · Tunnel de commande", ux], ["2 · Référencement", seo], ["3 · Bannière cookies", rgpd], ["4 · Budget d'acquisition", acq], ["5 · CRM", crm], ["6 · Black Friday", bf], ["Rapport final", finale]]);
	if(window.campus) window.campus.game = { S, get M(){ return M; }, W, GO };
}
