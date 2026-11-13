/* « Le guichet du samedi » — mini-jeu de la Licence Pro Assurance-Banque-Finance (FGES, chargé de clientèle).
   Samedi matin, ton agence de Lambersart. Tu es l'alternant au guichet, Nadia, ta tutrice, passe dans ton dos.
   Le dossier : « Qui blanchit ? ». À 9 h, la conformité prévient que des fonds suspects transitent par l'agence.
   Cinq clients font la queue : tu les sers bien (simulateur, budget, sinistre, acte de propriété…) et chacun
   apporte des indices, épinglés dans le carnet de Nadia posé sur le comptoir. À midi, tu relies chaque soupçon
   à sa preuve, puis tu désignes qui signaler à Tracfin. Accuser un innocent coûte cher. Environ 7 minutes.
   Gestes du métier, jamais de réponse à choisir : écouter et toucher ce qui compte, pointer une attestation,
   comparer des pièces, compter des jours ouvrés, régler le simulateur, couper un budget, maintenir « Stop ».
   Les contenus (répliques, chiffres, indices, cours) sont dans guichet-data.js. */
import * as THREE from "three";
import { makePerson, std, box, cyl } from "../kit.js?v=cca5b950a5";
import { jpoCard } from "./jpo.js?v=cca5b950a5";
import { palier } from "./palier.js?v=cca5b950a5";
import { COURSES, CLIENTS, NOTE, PINS, ALERTS, SUSPECTS, CULPRIT, IMMO, immoCalc, immoBest, euro } from "./guichet-data.js?v=cca5b950a5";

const SPEED = /[?&]vite/.test(location.search) ? 6 : 1;      // ?vite : tout va 6 fois plus vite (pour tester)
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = x => Math.round(x*100) + " %";
const PIN_COL = ["#e0533d", "#f4c430", "#21b6ce", "#1f9d63", "#8e5bd0", "#ff8a3d", "#0f3168", "#d6457a", "#5aa0e6", "#7a8f2e", "#b5651d"];

const CSS = `
.gq{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#14233d;background:#e9eef3;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:manipulation;animation:gqIn .3s ease both}
@keyframes gqIn{from{opacity:0}to{opacity:1}}
.gq canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.gq-top{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;align-items:center;padding:calc(env(safe-area-inset-top) + 10px) calc(env(safe-area-inset-right) + 12px) 6px calc(env(safe-area-inset-left) + 12px);z-index:7;pointer-events:none}
.gq-top>*{pointer-events:auto}
.gq-tag{background:#fff;border-radius:999px;padding:6px 12px;font-weight:900;font-size:13px;box-shadow:0 2px 8px rgba(20,35,61,.15);white-space:nowrap;border:0;font-family:inherit;color:#14233d}
.gq-tag.b{background:#0f3168;color:#fff}
.gq-tag.t{background:#21b6ce;color:#0b2447}
.gq-tag.nb{background:#fffdf6;cursor:pointer;min-height:36px;outline:2px solid #e0b64a}
.gq-tag.nb.bump{animation:gqBump .7s ease}
@keyframes gqBump{0%{transform:scale(1)}30%{transform:scale(1.25);background:#ffe9a8}100%{transform:scale(1)}}
.gq-x{margin-left:auto;width:48px;height:48px;border-radius:50%;border:0;background:#fff;font-size:24px;cursor:pointer;box-shadow:0 2px 8px rgba(20,35,61,.2);color:#14233d}
.gq-nadia{position:absolute;left:calc(env(safe-area-inset-left) + 12px);top:calc(env(safe-area-inset-top) + 66px);max-width:min(400px,calc(100% - 24px));display:flex;gap:8px;z-index:5;pointer-events:none;transition:opacity .3s}
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
.gq-line.ok.gq-pl:after{content:" 📌 au carnet";color:#9b2e1d}
.gq-line.no{background:#eee;color:#888}
@keyframes gqLine{from{opacity:0;transform:translateY(8px)}to{opacity:1}}
.gq-react{position:absolute;z-index:4;transform:translate(-50%,-100%);font-size:40px;pointer-events:none;animation:gqReact 1.6s ease both}
@keyframes gqReact{0%{opacity:0;transform:translate(-50%,-60%) scale(.5)}20%{opacity:1;transform:translate(-50%,-100%) scale(1.15)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-140%)}}
.gq-dock{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 12px);transform:translateX(-50%);width:min(760px,calc(100% - 20px));max-height:calc(100% - 128px);overflow:auto;z-index:6;display:flex;flex-direction:column;gap:8px;border-radius:14px}
.gq-q{background:#fff;border-radius:14px;padding:9px 13px;font-weight:800;font-size:14.5px;line-height:1.35;box-shadow:0 4px 14px rgba(20,35,61,.2);display:flex;gap:8px;align-items:center}
.gq-q .ph{font-size:20px}
.gq-timer{height:6px;flex:none;border-radius:3px;background:rgba(20,35,61,.15);overflow:hidden}
.gq-timer i{display:block;height:100%;background:#21b6ce;transform-origin:left;transition:background .3s}
.gq-timer.low i{background:#e0533d}
.gq-doc{background:#fffdf6;border-radius:6px;padding:12px 14px;box-shadow:0 6px 18px rgba(20,35,61,.25);font-family:Georgia,serif}
.gq-doc h4{margin:0 0 6px;font:900 12px Nunito,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#6b7a90}
.gq-row{display:flex;justify-content:space-between;gap:10px;width:100%;border:0;border-bottom:1px dashed #cdd5df;background:none;padding:9px 6px;font:15px Georgia,serif;color:#14233d;cursor:pointer;min-height:44px;text-align:left;transition:background .2s}
.gq-row b{font-family:Nunito,sans-serif;white-space:nowrap}
.gq-row span{color:#56657a}
.gq-row.ok{background:#d6f5e4}.gq-row.ko{background:#fde0da;animation:gqShake .3s}.gq-row.no{background:#eef1f5;color:#8a94a6}.gq-row.sel{background:#fff1cf;outline:2px solid #d39b18}
.gq-row em{font-style:normal;font:900 12px Nunito,sans-serif;background:#1f9d63;color:#fff;border-radius:6px;padding:1px 6px;margin-left:6px}
@keyframes gqShake{0%,100%{transform:none}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.gq-pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:10px}
.gq-pair .gq-row{font-size:14px}
.gq-ids{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.gq-ids .gq-doc{padding:9px 10px}
.gq-ids .gq-row{flex-direction:column;gap:0;padding:6px 4px;font-size:14px;min-height:40px}
.gq-ids .gq-row span{font:800 10.5px Nunito,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8a94a6}
.gq-plan{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;background:#14233d;padding:4px;border-radius:8px;margin:6px 0}
.gq-plan button{border:0;min-height:56px;background:#e8eef5;font:900 13px Nunito,sans-serif;color:#56657a;cursor:pointer;border-radius:4px;transition:background .15s}
.gq-plan button.on{background:#21b6ce;color:#0b2447}
.gq-share{display:flex;justify-content:space-between;font:900 15px Nunito,sans-serif;margin:4px 2px 8px}
.gq-share .j{color:#0b7a8e}.gq-share .s{color:#6b7a90}
.gq-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;font-family:Nunito,sans-serif}
.gq-cal .h{font:900 11px Nunito,sans-serif;color:#8a94a6;text-align:center;padding:2px 0}
.gq-cal button{position:relative;border:0;border-radius:8px;min-height:42px;background:#fff;font:800 15px Nunito,sans-serif;color:#14233d;cursor:pointer;box-shadow:inset 0 0 0 1px #dfe5ec}
.gq-cal button.src{background:#d9eefc}
.gq-cal button.src:after{content:"💧";position:absolute;right:2px;top:0;font-size:11px}
.gq-cal button.today{box-shadow:inset 0 0 0 2px #0f3168}
.gq-cal button.ok{background:#1f9d63;color:#fff}
.gq-cal button.ok i{position:absolute;left:3px;top:1px;font:900 10px Nunito,sans-serif;font-style:normal}
.gq-cal button.ko{background:#fde0da;animation:gqShake .3s}
.gq-bud .gq-row.cut b{text-decoration:line-through;color:#1f7a55}
.gq-meter{display:flex;justify-content:space-between;font:900 14px Nunito,sans-serif;margin:8px 0 4px}
.gq-bar2{height:12px;border-radius:6px;background:#e3e9f0;overflow:hidden}
.gq-bar2 i{display:block;height:100%;width:0;background:#1f9d63;transition:width .2s}
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
.gq-go:disabled{opacity:.5;cursor:default}
.gq-phone{position:absolute;z-index:6;transform:translate(-50%,-100%);border:0;border-radius:14px;background:#fff;padding:9px 14px;font:900 15px Nunito,sans-serif;color:#14233d;cursor:pointer;box-shadow:0 0 0 4px #21b6ce,0 8px 20px rgba(0,0,0,.25);animation:gqBuzz .25s linear infinite alternate;min-height:48px}
@keyframes gqBuzz{from{margin-left:-3px}to{margin-left:3px}}
.gq-alert{background:#fff;border-left:8px solid #e0533d;border-radius:12px;padding:10px 13px;font-size:14.5px;line-height:1.4;font-weight:700;box-shadow:0 6px 18px rgba(20,35,61,.25)}
.gq-alert b{color:#c4442c;display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
.gq-hold{position:relative;overflow:hidden;border:0;border-radius:14px;background:#e0533d;color:#fff;font:900 17px Nunito,sans-serif;padding:14px;cursor:pointer;min-height:56px;touch-action:none;box-shadow:0 4px 0 #9b2e1d;width:100%}
.gq-hold:disabled{opacity:.55;cursor:default}
.gq-hold i{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.3);width:0}
.gq-hold span{position:relative}
.gq-chips{position:absolute;right:calc(env(safe-area-inset-right) + 12px);top:calc(env(safe-area-inset-top) + 66px);z-index:5;display:flex;flex-direction:column;gap:6px;align-items:flex-end;pointer-events:none;max-width:min(320px,60%)}
.gq-chip{background:#fff;border-left:5px solid #21b6ce;border-radius:8px;padding:6px 10px;font-size:12.5px;font-weight:800;box-shadow:0 3px 10px rgba(20,35,61,.18);animation:gqChip 4s ease both}
.gq-chip span{display:block;font-size:10px;color:#0b7a8e;letter-spacing:.08em;text-transform:uppercase}
.gq-chip.gq-pc{border-left-color:#e0533d;background:#fffdf6}
.gq-chip.gq-pc span{color:#c4442c}
@keyframes gqChip{0%{opacity:0;transform:translateX(20px)}10%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
.gq-drawer{position:absolute;right:calc(env(safe-area-inset-right) + 12px);top:calc(env(safe-area-inset-top) + 62px);z-index:8;width:min(380px,calc(100% - 24px));max-height:calc(100% - 150px);overflow:auto;background:#fffdf6;border-radius:12px;padding:12px 14px;box-shadow:0 10px 30px rgba(20,35,61,.35);background-image:repeating-linear-gradient(#fffdf6 0 25px,#e6edf5 25px 26px)}
.gq-drawer[hidden]{display:none}
.gq-drawer h4{margin:2px 0 6px;font:900 11px Nunito,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#9b2e1d}
.gq-drawer p{margin:0 0 6px;font-size:13px;line-height:1.35}
.gq-ov{position:absolute;inset:0;z-index:9;display:grid;place-items:center;padding:14px;background:rgba(11,29,58,.45)}
.gq-ov[hidden]{display:none}
.gq-cardx{max-width:580px;width:100%;max-height:100%;overflow:auto;background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 20px 60px rgba(0,0,0,.35);user-select:text;-webkit-user-select:text}
.gq-cardx.wide{max-width:940px;background:#fffdf6}
.gq-cardx h2{font:800 26px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px;color:#0f3168}
.gq-cardx .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:900;margin:0 0 4px}
.gq-cardx p{font-size:14.5px;line-height:1.5;margin:0 0 10px}
.gq-memo{background:#fffdf6;border:1px solid #e5dcc8;border-left:6px solid #e0533d;border-radius:6px;padding:10px 12px;margin:6px 0 12px;font-family:Georgia,serif;font-size:14px;line-height:1.45;box-shadow:0 3px 10px rgba(20,35,61,.08)}
.gq-memo .hd{font:900 11px Nunito,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#9b2e1d;margin-bottom:4px}
.gq-memo ol{list-style:none;margin:6px 0;padding:0}
.gq-memo li{margin:4px 0;padding-left:28px;position:relative}
.gq-memo li b{position:absolute;left:0;top:0;width:21px;height:21px;border-radius:50%;background:#0f3168;color:#fff;font:900 12px/21px Nunito,sans-serif;text-align:center}
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
.gq-board{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:14px;margin:8px 0}
.gq-board h4{margin:0 0 6px;font:900 11px Nunito,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#9b2e1d}
.gq-al,.gq-pn{display:block;width:100%;text-align:left;border:0;border-radius:10px;padding:9px 10px;margin:0 0 7px;font:700 14px/1.35 Nunito,sans-serif;color:#14233d;background:#fff;cursor:pointer;box-shadow:0 2px 0 #d8dfe8,0 2px 8px rgba(20,35,61,.08);min-height:44px;transition:background .2s}
.gq-al b{display:inline-block;min-width:26px;margin-right:4px;background:#0f3168;color:#fff;border-radius:6px;padding:1px 5px;font-size:12px;text-align:center}
.gq-al.sel,.gq-pn.sel{outline:3px solid #f4c430;background:#fff8e1}
.gq-al.done{background:#eef7f1;cursor:default}
.gq-al.done.red{background:#fde9e4}
.gq-al small{display:block;font-weight:800;font-size:12.5px;margin-top:3px}
.gq-al.done small{color:#1f7a55}.gq-al.done.red small{color:#9b2e1d}
.gq-pn{border-left:6px solid var(--c);font-size:13.5px}
.gq-pn span{display:block;font:900 10.5px Nunito,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8a94a6}
.gq-pn.ko{background:#fde0da;animation:gqShake .3s}
.gq-pn em{float:right;font-style:normal;font:900 11px Nunito,sans-serif;background:#0f3168;color:#fff;border-radius:6px;padding:1px 5px;margin-left:4px}
.gq-sus{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0}
.gq-sus button{border:0;border-radius:12px;background:#fff;padding:8px 4px;cursor:pointer;font:800 13px/1.2 Nunito,sans-serif;color:#14233d;box-shadow:0 2px 0 #d8dfe8,0 2px 8px rgba(20,35,61,.08);min-height:72px}
.gq-sus button b{display:block;font-size:30px}
.gq-sus button small{display:block;color:#8a94a6;font-size:11px}
.gq-sus button.sel{outline:3px solid #e0533d;background:#fff4f1}
.gq-ds{background:#fff;border:1px solid #e5dcc8;border-radius:8px;padding:10px 12px;margin:6px 0 10px;font-size:13.5px;line-height:1.4}
.gq-ds .hd{font:900 11px Nunito,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#9b2e1d}
.gq-ds ul{margin:4px 0 0;padding-left:18px}
.gq-big2{font-size:46px;text-align:center;margin:0}
@media (max-width:640px){
	.gq-tag{font-size:12px;padding:5px 9px}
	.gq-tag.hide-s{display:none}
	.gq-line{font-size:13.5px}
	.gq-big{font-size:24px}
	.gq-chips{display:none}
	.gq-pair,.gq-board{grid-template-columns:1fr}
	.gq-ids{grid-template-columns:1fr}
	.gq-ids .gq-row{flex-direction:row}
	.gq-sus{grid-template-columns:repeat(2,minmax(0,1fr))}
	.gq-q{font-size:13.5px}
}
@media (max-height:700px){.gq-screen{padding:8px 12px 10px}.gq-big{font-size:22px}.gq-read{margin:4px 0}.gq-read b{font-size:15px}.gq-track{margin:8px 6px 4px}.gq-go{min-height:44px;padding:9px}.gq-row{min-height:40px;padding:7px 6px}.gq-cal button{min-height:36px}}
@media (prefers-reduced-motion:reduce){.gq,.gq-line,.gq-react,.gq-chip,.gq-phone,.gq-tag.nb.bump{animation:none}}
`;

export function openGuichet({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("gq-css")){ const st = document.createElement("style"); st.id = "gq-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	const root = document.createElement("div"); root.className = "gq";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le guichet du samedi");
	root.innerHTML = `<canvas></canvas>
		<div class="gq-top"><span class="gq-tag b hide-s">Le guichet du samedi</span><span class="gq-tag t" id="gqTicket">Ticket n° 041</span><span class="gq-tag hide-s" id="gqCount">Client 1 / 5</span><button class="gq-tag nb" id="gqNb" aria-expanded="false">📓 Carnet · 0</button><button class="gq-x" aria-label="Quitter le jeu">×</button></div>
		<div class="gq-nadia off" id="gqNadia" aria-live="polite"><div class="av" aria-hidden="true">👩🏽‍💼</div><div class="b"><span class="who">Nadia, ta tutrice</span><span id="gqNadiaT"></span></div></div>
		<div class="gq-chips" id="gqChips"></div>
		<div class="gq-drawer" id="gqDrawer" hidden></div>
		<div class="gq-dock" id="gqDock"></div>
		<div class="gq-ov" id="gqOv"><div class="gq-cardx" id="gqCard"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const dock = $("#gqDock");
	let closed = false;

	/* ---------- état ---------- */
	const S = { phase:"intro", conf:[], pnb:0, sig:0, sigMax:0, learned:[], per:[], pins:[], links:{}, linkPts:0, accused:null, timeouts:0 };
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
		glass:new THREE.MeshStandardMaterial({ color:"#cfeaf5", transparent:true, opacity:.25, roughness:.05 }), plant:std("#4f8f5a"), pot:std("#e7d7c3"), red:std("#e0533d"), screen:new THREE.MeshBasicMaterial({ color:"#0b1d3a" }),
		paper:std("#fbf6e9"), cover:std("#7a2a1d") };
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
	// le carnet de Nadia, posé sur le comptoir : il s'épaissit et se couvre d'onglets à chaque indice
	const book = new THREE.Group(); book.position.set(.35, 1.19, 1.42); book.rotation.y = -.18; scene.add(book);
	box(book, .62, .03, .46, MAT.cover, 0, 0, 0);
	const pages = box(book, .58, .03, .43, MAT.paper, .01, .03, 0);
	box(book, .03, .065, .46, MAT.cover, -.31, 0, 0, 0);
	const tabs = new THREE.Group(); book.add(tabs);
	const tabMats = [];
	// le guichet voisin (guichet 2), la file d'attente, les plantes
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
	const g2M = new THREE.MeshBasicMaterial({ map:texLabel("Guichet 2", { bg:"#2b3a52", size:60, w:256 }) });
	const g2 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .7), g2M); g2.position.set(-6, 3.2, -6.88); scene.add(g2);
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
	let vw = 0, vh = 0;
	function resize(){
		const w = innerWidth, h = innerHeight; if(!w || !h) return;      // le volet du navigateur peut annoncer 0 px à l'ouverture
		vw = w; vh = h; const port = h > w;
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
	function chip(html, cls = ""){
		const el = document.createElement("div"); el.className = "gq-chip " + cls; el.innerHTML = html;
		const bx = $("#gqChips"); bx.appendChild(el); while(bx.children.length > 3) bx.firstChild.remove(); setTimeout(() => el.remove(), 4100);
	}
	function learn(keys){
		for(const k of keys || []){
			if(S.learned.includes(k)) continue; S.learned.push(k);
			const c = COURSES[k]; chip(`<span>📘 ${c[0]}</span>${c[1]}`);
		}
	}
	let talk = null;
	function talkBox(ci){ if(talk) talk.remove(); talk = document.createElement("div"); talk.className = "gq-talk"; talk.dataset.ci = ci; root.appendChild(talk); return talk; }
	function speak(text, ms = 3000){
		const t = talkBox(S.ci); const b = document.createElement("div"); b.className = "gq-line say"; b.textContent = text; t.appendChild(b);
		setTimeout(() => { b.classList.add("fade"); }, ms/SPEED);
	}
	function react(res){
		if(S.ci == null) return;
		const el = document.createElement("div"); el.className = "gq-react"; el.textContent = res === "ok" ? "😊" : res === "mid" ? "😐" : "😠";
		const s = toScreen(headOf(S.ci)); el.style.left = s.x + "px"; el.style.top = (s.y - 10) + "px"; root.appendChild(el); setTimeout(() => el.remove(), 1700);
	}
	const score = (res, max = 2) => { cs.max += max; cs.pts += res === "ok" ? max : res === "mid" ? max/2 : 0; };
	const scorePts = (pts, max) => { cs.max += max; cs.pts += Math.max(0, Math.min(max, pts)); };
	const verdict = (res, msg, ms = 7000) => { play(res === "ok" ? "good" : res === "mid" ? "chime" : "bad"); if(res !== "ok") ev("err"); say((res === "ok" ? "✔ " : res === "mid" ? "≈ " : "✘ ") + msg, ms); };

	/* ---------- le carnet de Nadia ---------- */
	const nb = $("#gqNb"), drawer = $("#gqDrawer");
	function pinIt(id){
		if(!id || S.pins.includes(id)) return;
		S.pins.push(id); const p = PINS[id], n = S.pins.length;
		const m = new THREE.MeshStandardMaterial({ color:PIN_COL[(n - 1) % PIN_COL.length], roughness:.8 }); tabMats.push(m);
		pages.scale.y = .03*(1 + n*.2);
		box(tabs, .06, .012, .06, m, .3, .03 + pages.scale.y*.5, -.19 + ((n - 1) % 6)*.075, 0, false);
		nb.textContent = `📓 Carnet · ${n}`; nb.classList.remove("bump"); void nb.offsetWidth; nb.classList.add("bump");
		chip(`<span>📌 Épinglé au carnet · ${p.who}</span>${p.t}`, "gq-pc");
		play("stamp");
		if(!drawer.hidden) drawDrawer();
	}
	function drawDrawer(){
		drawer.innerHTML = `<h4>📓 Le carnet de Nadia</h4>
			${NOTE.items.map(([k, t]) => `<p><b>${k}.</b> ${t}</p>`).join("")}
			<h4>📌 Indices (${S.pins.length})</h4>
			${S.pins.length ? S.pins.map(id => `<p>${PINS[id].ico} <b>${PINS[id].who} :</b> ${PINS[id].t}</p>`).join("") : "<p>Rien pour l'instant. Écoute bien les clients.</p>"}`;
	}
	nb.addEventListener("click", () => { drawer.hidden = !drawer.hidden; nb.setAttribute("aria-expanded", String(!drawer.hidden)); if(!drawer.hidden) drawDrawer(); });

	/* ---------- étape : écouter ---------- */
	async function listen(st, c){
		const t = talkBox(S.ci), sigs = st.lines.filter(l => l[1]), got = new Set();
		S.sigMax += sigs.length; let caught = 0, noise = 0;
		if(S.ci === 0) say("Écoute-les : <b>touche les phrases qui comptent</b>, pour ton conseil comme pour l'enquête, avant qu'elles s'effacent.", 7000);
		for(const [txt, sig, why, pin] of st.lines){
			if(closed) return;
			const b = document.createElement("button"); b.className = "gq-line"; b.textContent = txt; b.type = "button";
			b.onclick = () => {
				if(b.dataset.done) return; b.dataset.done = 1;
				if(sig){ b.classList.add("ok"); if(pin){ b.classList.add("gq-pl"); pinIt(pin); } caught++; got.add(txt); play("pop"); if(why) say(why, 4000); }
				else { b.classList.add("no"); noise++; play("clic"); }
			};
			t.appendChild(b);
			while(t.children.length > 3) t.firstChild.remove();
			setTimeout(() => { b.classList.add("fade"); b.disabled = true; }, (c.english ? 4800 : 4200)/SPEED);
			await wait(c.english ? 1900 : 1700);
		}
		await wait(2400);
		S.sig += caught;
		scorePts(caught - noise*.5, sigs.length);
		const lost = sigs.filter(l => !got.has(l[0]));
		say(caught === sigs.length ? `Tout noté : ${caught} signaux sur ${sigs.length}. ${noise ? "Mais pas besoin de tout noter !" : "Belle écoute."}` :
			`${caught} signal${caught > 1 ? "s" : ""} sur ${sigs.length}. Tu as laissé passer : « ${lost[0][0]} »`, 6000);
		t.remove(); talk = null;
	}

	/* ---------- étape : le simulateur ---------- */
	const SLIDERS = {
		immo:{ title:"Simulateur de crédit immobilier · Jade et Sami · 195 000 €", min:10, max:25, step:1, v:15, q:"Règle la durée du prêt : sous les 35 % d'endettement, au coût le plus bas.",
			big:v => `${v} ans`,
			read:v => { const r = immoCalc(v); return { html:`<div>Taux<b>${String(IMMO.taux).replace(".", ",")} %</b><s>${String(IMMO.tauxAvant).replace(".", ",")} % avant l'annonce</s></div><div>Mensualité, assurance comprise<b>${euro(r.total)}</b></div><div>Intérêts sur toute la durée<b>${euro(r.interets)}</b></div>`,
				gauge:{ v:r.pct, lim:IMMO.max, label:`Endettement ${pct(r.pct)}`, limLabel:"35 % (HCSF)" } }; },
			judge:v => { const r = immoCalc(v), b = immoBest(), rb = immoCalc(b);
				if(r.pct > IMMO.max) return ["ko", `Refusé : ${pct(r.pct)} d'endettement, au-delà des 35 % du HCSF. Il fallait allonger la durée.`];
				if(v <= b + 1) return ["ok", `Parfait : ${pct(r.pct)} d'endettement et le moins d'intérêts possible (${euro(r.interets)}). L'offre leur laissera 10 jours de réflexion avant de signer.`];
				return ["mid", `Le dossier passe, mais en ${v} ans ils paieront ${euro(r.interets - rb.interets)} d'intérêts de plus qu'en ${b} ans.`]; } },
		uc:{ title:"Allocation de l'assurance-vie · M. Duhamel · 40 000 €", min:0, max:100, step:10, v:50, q:"Son argent est propre ; place-le. Combien en unités de compte (plus de rendement espéré, mais un risque de perte) ?",
			big:v => `${v} % en unités de compte`,
			read:v => { const uc = 400*v, fe = 40000 - uc, rend = 2.5 + v/100*3.5, perte = uc*.25;
				return { html:`<div>Fonds en euros (garanti)<b>${euro(fe)}</b></div><div>Rendement espéré / an<b>${rend.toFixed(1).replace(".", ",")} %</b></div><div>Si les marchés chutent de 25 %<b>−${euro(perte)}</b></div>`,
					gauge:{ v:v/100, lim:.2, label:`Risque : ${v} %`, limLabel:"Profil prudent" } }; },
			judge:v => v <= 20 ? ["ok", "Conforme à son profil MIF 2 : prudent, horizon de 2-3 ans, aucune expérience des marchés."]
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
			const setV = nv => { nv = Math.max(K.min, Math.min(K.max, nv)); if(nv !== v){ v = nv; draw(); play("clic"); } };
			function setX(x){ const b = track.getBoundingClientRect(); const f = Math.max(0, Math.min(1, (x - b.left)/b.width)); setV(K.min + Math.round(f*(K.max - K.min)/K.step)*K.step); }
			let dragId = null;
			track.addEventListener("pointerdown", e => { dragId = e.pointerId; track.setPointerCapture(e.pointerId); setX(e.clientX); });
			track.addEventListener("pointermove", e => { if(e.pointerId === dragId) setX(e.clientX); });
			track.addEventListener("pointerup", () => dragId = null);
			track.addEventListener("keydown", e => { if(e.key === "ArrowRight" || e.key === "ArrowUp"){ setV(v + K.step); e.preventDefault(); } if(e.key === "ArrowLeft" || e.key === "ArrowDown"){ setV(v - K.step); e.preventDefault(); } });
			draw(); track.focus({ preventScroll:true });
			const stop = countdown(22, dock.querySelector(".gq-timer i"), () => propose());
			const goBtn = dock.querySelector(".gq-go"); goBtn.onclick = propose;
			S.cur = { set:nv => setV(nv), go:propose };
			if(S.ci === 0) say("Le simulateur est sur ton écran : <b>fais glisser le curseur</b> et regarde la jauge, puis propose.", 7000);
			async function propose(){
				if(over) return; over = true; stop(); S.cur = null;
				const [res, msg, conf] = K.judge(v);
				score(res, 3); react(res); if(conf) S.conf.push(msg); if(res === "ok") S.pnb += st.kind === "immo" ? 1950 : st.kind === "uc" ? 400 : 120;
				verdict(res, msg);
				goBtn.disabled = true;
				await wait(2600);
				if(st.kind === "uc"){
					const loss = 400*v*.25;
					say(`📉 Un mois plus tard, krach : −25 % sur les marchés. ${v ? `Les ${v} % en unités de compte de M. Duhamel perdent ${euro(loss)}.` : "Son fonds en euros, lui, ne bouge pas."} ${v <= 20 ? "Il appelle, inquiet : son fonds en euros est garanti, on ne vend pas au plus bas." : ""}`, 6500);
					await wait(2600);
				}
				pinIt(st.pin);
				dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- étape : l'acte de propriété (indivision) ---------- */
	function parts(st){
		return new Promise(done => {
			let over = false;
			dock.innerHTML = `<div class="gq-q"><span class="ph">🏠</span><span>${st.q}</span></div><div class="gq-timer"><i></i></div>
				<div class="gq-doc"><h4>Projet d'acte · T3, 65 m² · indivision</h4>
				<div class="gq-plan">${Array.from({ length:st.total }, (_, i) => `<button type="button" data-i="${i}" aria-pressed="false">1/${st.total}</button>`).join("")}</div>
				<div class="gq-share"><span class="j"></span><span class="s"></span></div>
				<button class="gq-go">Envoyer l'acte au notaire</button></div>`;
			const tiles = [...dock.querySelectorAll(".gq-plan button")];
			const n = () => tiles.filter(b => b.classList.contains("on")).length;
			const draw = () => { const k = n(); dock.querySelector(".gq-share .j").textContent = `Jade : ${k}/${st.total}`; dock.querySelector(".gq-share .s").textContent = `Sami : ${st.total - k}/${st.total}`; };
			tiles.forEach(b => b.onclick = () => { if(over) return; b.classList.toggle("on"); b.setAttribute("aria-pressed", b.classList.contains("on")); play("clic"); draw(); });
			draw();
			const stop = countdown(st.time || 20, dock.querySelector(".gq-timer i"), () => send());
			dock.querySelector(".gq-go").onclick = send;
			S.cur = { tap:i => tiles[i].click(), go:send };
			async function send(){
				if(over) return; over = true; stop(); S.cur = null;
				const k = n(); dock.querySelector(".gq-go").disabled = true;
				const res = k === st.good ? "ok" : Math.abs(k - st.good) === 1 ? "mid" : "ko";
				score(res, 2); react(res);
				verdict(res, res === "ok" ? st.ok : k === st.total/2 ? "Moitié-moitié : Jade a apporté deux fois plus que Sami, sans posséder plus. Il fallait 4/6 pour elle." : `${k}/${st.total} pour Jade ne correspond pas à son apport : 20 000 € sur 30 000 €, soit 4/6.`, 8000);
				await wait(2800); dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- étape : pointer une attestation ---------- */
	function pair(st){
		return new Promise(done => {
			let over = false, sel = null, errs = 0, matched = 0;
			const right = shuffle(st.right);
			dock.innerHTML = `<div class="gq-q"><span class="ph">📜</span><span>${st.q}</span></div><div class="gq-timer"><i></i></div>
				<div class="gq-pair"><div class="gq-doc"><h4>${st.title}</h4>${st.left.map((l, i) => `<button type="button" class="gq-row" data-l="${i}"><span>${l[0]}</span></button>`).join("")}</div>
				<div class="gq-doc"><h4>Sur ton bureau</h4>${right.map(r => `<button type="button" class="gq-row" data-r="${r[0]}"><span>${r[1]}</span></button>`).join("")}</div></div>`;
			const L = [...dock.querySelectorAll("[data-l]")], Rb = [...dock.querySelectorAll("[data-r]")];
			L.forEach(b => b.onclick = () => { if(over || b.classList.contains("ok")) return; L.forEach(x => x.classList.remove("sel")); b.classList.add("sel"); sel = +b.dataset.l; play("clic"); });
			Rb.forEach(b => b.onclick = () => {
				if(over || b.classList.contains("ok")) return;
				if(sel == null){ say("Touche d'abord une ligne de l'attestation, à gauche.", 3500); return; }
				const want = st.left[sel][1], lb = L[sel];
				if(b.dataset.r === want){
					matched++; lb.classList.remove("sel"); lb.classList.add("ok"); b.classList.add("ok");
					lb.insertAdjacentHTML("beforeend", `<em>✓ ${matched}</em>`); b.insertAdjacentHTML("beforeend", `<em>✓ ${matched}</em>`);
					sel = null; play("pop");
					if(matched === st.left.length) end(true);
				} else {
					errs++; b.classList.remove("ko"); void b.offsetWidth; b.classList.add("ko"); play("bad");
					const r = st.right.find(x => x[0] === b.dataset.r);
					say("✘ " + (r && r[2] ? r[2] : "Ça ne confirme pas cette ligne-là."), 4500);
				}
			});
			const stop = countdown(st.time || 30, dock.querySelector(".gq-timer i"), () => end(false));
			S.cur = { left:i => L[i].click(), right:id => dock.querySelector(`[data-r="${id}"]`).click() };
			async function end(all){
				if(over) return; over = true; stop(); S.cur = null;
				const pts = 3*matched/st.left.length - errs*.75;
				scorePts(pts, 3); const res = pts >= 2.5 ? "ok" : pts >= 1.2 ? "mid" : "ko"; react(res);
				if(!all) S.timeouts++;
				verdict(res, all ? st.ok + (errs ? ` (${errs} erreur${errs > 1 ? "s" : ""} de pointage.)` : "") : "Pas fini à temps : je termine de pointer. Tout concorde, l'héritage est prouvé ; mais on n'accepte jamais une pièce sans la vérifier.", 8000);
				pinIt(st.pin);
				await wait(2800); dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- étape : comparer les pièces ---------- */
	function idcheck(st){
		return new Promise(done => {
			let over = false, errs = 0;
			dock.innerHTML = `<div class="gq-q"><span class="ph">🪪</span><span>${st.q}</span></div><div class="gq-timer"><i></i></div>
				<div class="gq-ids">${st.docs.map((d, i) => `<div class="gq-doc"><h4>${d.title}</h4>${d.rows.map((r, j) => `<button type="button" class="gq-row" data-k="${i}-${j}"><span>${r[0]}</span><b>${r[1]}</b></button>`).join("")}</div>`).join("")}</div>`;
			const rows = [...dock.querySelectorAll("[data-k]")];
			const isBad = k => { const [i, j] = k.split("-").map(Number); return !!st.docs[i].rows[j][2]; };
			rows.forEach(b => b.onclick = () => {
				if(over || b.classList.contains("no")) return;
				if(isBad(b.dataset.k)){ b.classList.add("ok"); end(true); }
				else { errs++; b.classList.add("no"); play("bad"); say("✘ " + st.wrong, 3500); if(errs >= 3) end(false); }
			});
			const stop = countdown(st.time || 24, dock.querySelector(".gq-timer i"), () => end(false));
			S.cur = { tap:k => dock.querySelector(`[data-k="${k}"]`).click() };
			async function end(ok){
				if(over) return; over = true; stop(); S.cur = null;
				if(!ok) rows.forEach(b => { if(isBad(b.dataset.k)) b.classList.add("ok"); });
				const res = ok && !errs ? "ok" : ok ? "mid" : "ko";
				score(res, 2); react(res);
				verdict(res, ok ? st.ok : "Regarde le justificatif de domicile : il n'est pas à son nom. " + st.ok.replace(/^Bien vu : /, ""), 9000);
				pinIt(st.pin);
				await wait(3200); dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- étape : compter les jours ouvrés ---------- */
	function calendar(st){
		return new Promise(done => {
			let over = false, errs = 0, count = 0, last = st.from;
			const first = new Date(2026, 10, 1).getDay(), lead = (first + 6) % 7;      // lundi en premier
			const dow = d => new Date(2026, 10, d).getDay();
			const nextOuvre = d => { do d++; while(dow(d) === 0 || dow(d) === 6); return d; };
			let cells = ["L", "M", "M", "J", "V", "S", "D"].map(h => `<div class="h">${h}</div>`).join("") + "<div></div>".repeat(lead);
			for(let d = 1; d <= 30; d++) cells += `<button type="button" data-d="${d}" class="${d === st.from ? "src" : ""} ${d === 14 ? "today" : ""}">${d}</button>`;
			dock.innerHTML = `<div class="gq-q"><span class="ph">📅</span><span>${st.q}</span></div><div class="gq-timer"><i></i></div>
				<div class="gq-doc"><h4>Novembre 2026 · 💧 le sinistre · encadré : aujourd'hui</h4><div class="gq-cal">${cells}</div></div>`;
			const B = d => dock.querySelector(`[data-d="${d}"]`);
			dock.querySelectorAll("[data-d]").forEach(b => b.onclick = () => {
				if(over) return; const d = +b.dataset.d;
				if(b.classList.contains("ok")) return;
				const want = nextOuvre(last);
				if(d === want){ count++; last = d; b.classList.add("ok"); b.insertAdjacentHTML("afterbegin", `<i>${count}</i>`); play("pop"); if(count === st.days) end(true); return; }
				errs++; b.classList.remove("ko"); void b.offsetWidth; b.classList.add("ko"); play("bad");
				say("✘ " + (dow(d) === 0 || dow(d) === 6 ? `Le ${dow(d) === 6 ? "samedi" : "dimanche"} n'est pas un jour ouvré : on ne le compte pas.` : d <= st.from ? "On compte à partir du lendemain du sinistre." : "Compte dans l'ordre, sans sauter de jour ouvré."), 4000);
			});
			const stop = countdown(st.time || 22, dock.querySelector(".gq-timer i"), () => end(false));
			S.cur = { tap:d => B(d).click() };
			async function end(ok){
				if(over) return; over = true; stop(); S.cur = null;
				if(!ok){ while(count < st.days){ last = nextOuvre(last); count++; const b = B(last); b.classList.add("ok"); b.insertAdjacentHTML("afterbegin", `<i>${count}</i>`); } }
				const pts = ok ? 2 - errs*.5 : .5; scorePts(pts, 2);
				const res = pts >= 1.5 ? "ok" : pts >= 1 ? "mid" : "ko"; react(res);
				verdict(res, ok ? st.ok : "Pas fini à temps : " + st.ok, 7500);
				await wait(2800); dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- étape : vérifier un document ---------- */
	function doc(st){
		return new Promise(done => {
			dock.innerHTML = `<div class="gq-q"><span class="ph">📄</span><span>${st.q}</span></div><div class="gq-timer"><i></i></div>
				<div class="gq-doc"><h4>${st.title}</h4>${st.lines.map((l, i) => `<button type="button" class="gq-row" data-i="${i}"><span>${l[0]}</span><b>${l[1]}</b></button>`).join("")}</div>`;
			let over = false;
			const stop = countdown(st.time || 14, dock.querySelector(".gq-timer i"), () => pick(-1));
			dock.querySelectorAll(".gq-doc [data-i]").forEach(b => b.onclick = () => pick(+b.dataset.i));
			S.cur = { tap:i => pick(i) };
			async function pick(i){
				if(over) return; over = true; stop(); S.cur = null;
				const good = st.lines.findIndex(l => l[2]), res = i === good ? "ok" : "ko";
				if(i < 0) S.timeouts++;
				dock.querySelectorAll(".gq-doc [data-i]").forEach((b, k) => { b.disabled = true; if(k === good) b.classList.add("ok"); else if(k === i) b.classList.add("ko"); });
				score(res); react(res);
				verdict(res, (res === "ok" ? "Bien vu. " : "Regarde mieux : ") + st.lines[good][3], 8000);
				await wait(2800); pinIt(st.pin); dock.innerHTML = ""; done();
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
			S.cur = { tap:() => tap(true) };
			async function tap(ok){
				if(over) return; over = true; stop(); S.cur = null; S.buzz = false; b.remove(); S.phoneBtn = null; dock.innerHTML = "";
				S.lucie = ok; score(ok ? "ok" : "ko", 1);
				if(!ok){ say("Le message est resté sans réponse pendant que tu parlais… Lucie a pris le crédit renouvelable proposé par l'appli. Sur la messagerie aussi, le client attend une réponse rapide.", 6500); ev("err"); }
				else play("pop");
				done();
			}
		});
	}

	/* ---------- étape : le budget de Lucie ---------- */
	function budget(st){
		if(!S.lucie){ score("ko", 2); return wait(2600); }
		return new Promise(done => {
			let over = false, saved = 0, errs = 0;
			dock.innerHTML = `<div class="gq-q"><span class="ph">📱</span><span>${st.q}</span></div><div class="gq-timer"><i></i></div>
				<div class="gq-doc gq-bud"><h4>Compte de Lucie · dépenses du mois · solde −400 €</h4>
				${st.lines.map((l, i) => `<button type="button" class="gq-row" data-i="${i}"><span>${l[0]}</span><b>${l[1]} €</b></button>`).join("")}
				<div class="gq-meter"><span>À couper chaque mois</span><span id="gqSaved">0 € / ${st.target} €</span></div><div class="gq-bar2"><i></i></div></div>`;
			const bar = dock.querySelector(".gq-bar2 i");
			dock.querySelectorAll(".gq-bud [data-i]").forEach(b => b.onclick = () => {
				if(over || b.classList.contains("cut")) return;
				const l = st.lines[+b.dataset.i];
				if(l[2]){ saved += l[1]; b.classList.add("cut", "ok"); play("coin");
					dock.querySelector("#gqSaved").textContent = `${saved} € / ${st.target} €`; bar.style.width = Math.min(100, saved/st.target*100) + "%";
					if(saved >= st.target) end(true); }
				else { errs++; b.classList.remove("ko"); void b.offsetWidth; b.classList.add("ko"); play("bad"); say("✘ " + l[3], 3500); }
			});
			const stop = countdown(st.time || 20, dock.querySelector(".gq-timer i"), () => end(false));
			S.cur = { tap:i => dock.querySelector(`.gq-bud [data-i="${i}"]`).click() };
			async function end(ok){
				if(over) return; over = true; stop(); S.cur = null;
				const pts = ok ? 2 - errs*.5 : saved/st.target; scorePts(pts, 2);
				const res = pts >= 1.5 ? "ok" : pts >= .8 ? "mid" : "ko";
				verdict(res, ok ? st.ok : `Seulement ${saved} € trouvés : Lucie hésite encore à prendre le renouvelable. Les livraisons de repas et la salle de sport jamais utilisée, c'était 100 € à eux deux.`, 8000);
				await wait(2800); dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- maintenir un bouton (Stop, transmission à Tracfin) ---------- */
	function holdable(btn, sec, onDone){
		const fill = btn.querySelector("i");
		let on = false;
		const start = e => { if(btn.disabled) return; e.preventDefault(); on = true; let t = 0; S.hold = h => { if(!on) return; t += h; fill.style.width = Math.min(100, t/sec*100) + "%"; if(t >= sec){ on = false; S.hold = null; onDone(); } }; };
		const stopH = () => { if(!on) return; on = false; S.hold = null; fill.style.width = "0"; };
		btn.addEventListener("pointerdown", start); btn.addEventListener("pointerup", stopH); btn.addEventListener("pointerleave", stopH); btn.addEventListener("pointercancel", stopH);
		btn.addEventListener("keydown", e => { if((e.key === " " || e.key === "Enter") && !e.repeat) start(e); });
		btn.addEventListener("keyup", e => { if(e.key === " " || e.key === "Enter") stopH(); });
		btn.addEventListener("click", e => e.preventDefault());
	}

	/* ---------- étape : l'alerte au guichet voisin ---------- */
	function stopStep(st){
		return new Promise(done => {
			stranger.g.visible = true; stranger.g.position.set(-6, 0, -4.5); goTo(stranger, new THREE.Vector3(-6, 0, -3.5), 0);
			play("alarm");
			dock.innerHTML = `<div class="gq-alert"><b>⚠ Guichet 2</b>${st.text}</div><div class="gq-timer"><i></i></div>
				<button class="gq-hold"><i></i><span>✋ Maintiens : demander l'origine des fonds</span></button>`;
			const btn = dock.querySelector(".gq-hold");
			let over = false;
			const stop = countdown(8, dock.querySelector(".gq-timer i"), () => end(false));
			holdable(btn, 1.2, () => end(true));
			btn.focus({ preventScroll:true });
			S.cur = { win:() => end(true) };
			async function end(ok){
				if(over) return; over = true; stop(); S.hold = null; S.cur = null; btn.disabled = true;
				score(ok ? "ok" : "ko");
				if(ok){ play("stamp"); say("✔ Ma collègue lui demande l'origine des fonds. Il bafouille « des chantiers » et repart sans justificatif. Elle me passe le bordereau : un compte n° …4471. Ça te rappelle l'alerte A ?", 9000); }
				else { play("bad"); const m = "Tu as laissé passer des espèces fractionnées sans demander leur origine : un signal classique de blanchiment."; S.conf.push(m); say("✘ " + m + " Ma collègue a quand même gardé le bordereau : compte n° …4471.", 9000); ev("err"); }
				await wait(3200);
				goTo(stranger, new THREE.Vector3(-9, 0, -5), Math.PI); pinIt(st.pin); dock.innerHTML = ""; done();
			}
		});
	}

	/* ---------- étape : le client tend une pièce ---------- */
	async function hand(st){
		speak(st.say, 4200);
		const p = PINS[st.pin];
		dock.innerHTML = `<div class="gq-doc"><h4>${p.ico} Pièce remise par ${p.who}</h4><div class="gq-row"><span>${p.t}</span></div></div>`;
		await wait(2400); pinIt(st.pin);
		say(st.nadia, 7000);
		await wait(3600); dock.innerHTML = "";
	}

	/* ---------- déroulé ---------- */
	const STEPS = { listen, slider, parts, pair, idcheck, calendar, doc, radio:radioStep, phone:phoneStep, budget, stop:stopStep, hand };
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
			S.step = st.t;
			await STEPS[st.t](st, c);
			if(closed) return;
			learn(st.courses);
			await wait(300);
		}
		S.step = null;
		const sat = cs.max ? cs.pts/cs.max : 1;
		S.per.push({ id:c.id, name:c.name, who:c.who, sat });
		react(sat >= .8 ? "ok" : sat >= .5 ? "mid" : "ko");
		speak(sat >= .8 ? (c.english ? "Thank you so much!" : "Merci beaucoup, on reviendra !") : sat >= .5 ? (c.english ? "OK… thanks." : "Bon… merci.") : (c.english ? "I'll try another bank." : "Je vais voir une autre banque."), 2200);
		await wait(2000);
		people[ci].forEach(p => goTo(p, EXIT, Math.PI/2));
		if(talk){ talk.remove(); talk = null; }
	}
	async function run(){
		say("Samedi, 9 h. La conformité est formelle : <b>quelqu'un blanchit de l'argent par notre agence</b>. Sers bien chaque client, et j'épingle dans le carnet tout ce qui cloche.", 7000);
		await wait(2600);
		for(let ci = 0; ci < CLIENTS.length; ci++){
			await serve(ci); if(closed) return;
			if(ci === 0){ await palier({ id:"guichet", onEvent:ev, openLead, quit:close,      // fin de la scène d'ouverture : le premier client
				titre:"Premier client servi, premier indice dans le carnet.",
				texte:"Quatre clients font encore la queue : un héritage, un étudiant Erasmus, un dégât des eaux, un plombier qui se lance. À midi, tu désignes qui blanchit, preuves à l'appui.",
				suite:"Ouvrir tout le guichet (≈ 6 min)" }); if(closed) return; }
		}
		await wait(1200); if(closed) return;
		S.ci = null; ev("stage", "Midi · le carnet de Nadia");
		await enquete(); if(closed) return;
		finish();
	}

	/* ---------- midi : le carnet de Nadia, relier puis désigner ---------- */
	function enquete(){
		return new Promise(done => {
			drawer.hidden = true; nb.setAttribute("aria-expanded", "false"); nadia.classList.add("off");
			S.phase = "carnet"; learn(["tracfin"]);
			const pinsShown = shuffle(S.pins);
			const tries = {}; let selA = null, selP = null;
			card.className = "gq-cardx wide";
			card.innerHTML = `<p class="k">12 h · l'agence ferme · le carnet de Nadia</p><h2>Qui blanchit ?</h2>
				<p id="gqFin">Relie chaque soupçon à <b>la pièce qui y répond</b> : touche un soupçon, puis un indice. Une parole n'est pas une preuve.</p>
				<div class="gq-board">
					<div><h4>Les soupçons de la note de 9 h</h4>${ALERTS.map(a => `<button type="button" class="gq-al" data-a="${a.id}"><b>${a.tag}</b>${a.q}<small></small></button>`).join("")}</div>
					<div><h4>📌 Les indices épinglés (${S.pins.length})</h4>${pinsShown.map(id => `<button type="button" class="gq-pn" data-p="${id}" style="--c:${PIN_COL[S.pins.indexOf(id) % PIN_COL.length]}"><span>${PINS[id].ico} ${PINS[id].who}</span>${PINS[id].t}</button>`).join("")}</div>
				</div>
				<div id="gqDsZone"></div>`;
			ov.hidden = false; card.scrollTop = 0;
			const fin = card.querySelector("#gqFin");
			const A = id => card.querySelector(`[data-a="${id}"]`), P = id => card.querySelector(`[data-p="${id}"]`);
			const msg = (h, cls) => { fin.innerHTML = h; };
			function tryLink(){
				if(!selA || !selP) return;
				const a = ALERTS.find(x => x.id === selA), ab = A(selA), pb = P(selP);
				if(selP === a.key){
					const t = tries[a.id] || 0; S.links[a.id] = t === 0 ? 1 : t === 1 ? .5 : 0;
					ab.classList.remove("sel"); pb.classList.remove("sel"); ab.classList.add("done"); if(!a.clear) ab.classList.add("red");
					ab.querySelector("small").textContent = (a.clear ? "✔ " : "⚠ ") + a.verdict; pb.insertAdjacentHTML("afterbegin", `<em>${a.id}</em>`);
					play(a.clear ? "good" : "stamp"); msg(`${a.clear ? "✔" : "⚠"} ${a.verdict}`);
				} else {
					tries[a.id] = (tries[a.id] || 0) + 1; S.linkErr = (S.linkErr || 0) + 1;
					pb.classList.remove("ko", "sel"); void pb.offsetWidth; pb.classList.add("ko"); play("bad"); ev("err");
					if(tries[a.id] >= 3){
						S.links[a.id] = 0; ab.classList.remove("sel"); ab.classList.add("done"); if(!a.clear) ab.classList.add("red");
						ab.querySelector("small").textContent = (a.clear ? "✔ " : "⚠ ") + a.verdict + " (Nadia t'a montré la pièce.)";
						const kb = P(a.key); if(kb) kb.insertAdjacentHTML("afterbegin", `<em>${a.id}</em>`);
						msg(`Nadia te montre : « ${PINS[a.key].t} » ${a.verdict}`);
					} else msg(`✘ ${(a.hints && a.hints[selP]) || "Cet indice ne répond pas à ce soupçon."} Essaie un autre indice.`);
				}
				selA = null; selP = null;
				if(ALERTS.every(x => S.links[x.id] != null)) designate();
			}
			card.querySelectorAll(".gq-al").forEach(b => b.onclick = () => {
				if(S.phase !== "carnet" || b.classList.contains("done")) return;
				card.querySelectorAll(".gq-al").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); selA = b.dataset.a; play("clic");
				if(!selP) msg(`Soupçon ${ALERTS.find(x => x.id === selA).tag} : touche maintenant l'indice qui y répond.`);
				tryLink();
			});
			card.querySelectorAll(".gq-pn").forEach(b => b.onclick = () => {
				if(S.phase !== "carnet") return;
				card.querySelectorAll(".gq-pn").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); selP = b.dataset.p; play("clic");
				if(!selA) msg("Touche maintenant le soupçon auquel cet indice répond.");
				tryLink();
			});
			S.cur = { link:(a, p) => { A(a).click(); P(p).click(); } };

			function designate(){
				S.phase = "designer";
				card.querySelectorAll(".gq-pn").forEach(b => b.disabled = true);
				const z = card.querySelector("#gqDsZone");
				z.innerHTML = `<p class="k">Déclaration de soupçon</p><p>Les soupçons sont reliés. <b>Qui signales-tu à Tracfin ?</b> Touche une personne : ta déclaration se remplit avec les pièces qui la concernent. Signaler un innocent coûte cher.</p>
					<div class="gq-sus">${SUSPECTS.map(s => `<button type="button" data-s="${s.id}"><b>${s.ico}</b>${s.name}<small>${s.tag}</small></button>`).join("")}</div>
					<div class="gq-ds" id="gqDs"><div class="hd">Déclaration à Tracfin · confidentielle</div>Personne signalée : <i>personne pour l'instant</i></div>
					<button class="gq-hold" id="gqSend" disabled><i></i><span>✋ Maintiens : transmettre à Tracfin</span></button>`;
				z.scrollIntoView({ block:"nearest", behavior:"smooth" });
				let who = null;
				const send = z.querySelector("#gqSend"), ds = z.querySelector("#gqDs");
				z.querySelectorAll("[data-s]").forEach(b => b.onclick = () => {
					if(S.phase !== "designer") return;
					z.querySelectorAll("[data-s]").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); who = b.dataset.s; play("clic");
					const s = SUSPECTS.find(x => x.id === who), facts = ALERTS.filter(a => a.who === who);
					ds.innerHTML = `<div class="hd">Déclaration à Tracfin · confidentielle</div>Personne signalée : <b>${s.name}</b>, ${s.tag}.<br>Pièces jointes :
						${facts.length ? `<ul>${facts.map(a => `<li>${a.clear ? "✔ " : "⚠ "}${a.verdict}</li>`).join("")}</ul>` : " <i>aucune. Une déclaration doit reposer sur des faits.</i>"}`;
					send.disabled = false;
				});
				holdable(send, 1.4, () => submit());
				S.cur = { pick:id => z.querySelector(`[data-s="${id}"]`).click(), send:() => submit() };
				async function submit(){
					if(S.phase !== "designer" || !who) return; S.phase = "verdict"; S.cur = null;
					S.accused = who; send.disabled = true; z.querySelectorAll("[data-s]").forEach(b => b.disabled = true);
					const ok = who === CULPRIT, s = SUSPECTS.find(x => x.id === who);
					play(ok ? "win" : "bad"); if(!ok) ev("err");
					z.insertAdjacentHTML("beforeend", `<div class="gq-memo" style="border-left-color:${ok ? "#1f9d63" : "#e0533d"}"><div class="hd" style="color:${ok ? "#1f7a55" : "#9b2e1d"}">${ok ? "Déclaration transmise" : "Signalement sans fondement"}</div>
						${ok ? "Karim est signalé : son compte …4471 reçoit chaque mois 9 500 € d'espèces apportés par un tiers, et son prévisionnel gonflé de 110 000 € servirait à les faire passer pour des recettes. Tracfin enquêtera ; la banque, elle, gèle le projet de prêt. Et personne ne prévient Karim."
						: `${s.name} ${s.id === "benali" ? "n'apparaissait dans aucune alerte" : "avait une explication honnête, et tu l'avais prouvée toi-même"}. Tracfin reçoit un dossier vide, un client de confiance est fiché à tort… et le compte …4471, celui de Karim, continue d'encaisser les espèces.`}</div>
						<button class="gq-go" id="gqEnd">Voir le bilan de la matinée</button>`);
					z.querySelector("#gqEnd").scrollIntoView({ block:"end", behavior:"smooth" });
					z.querySelector("#gqEnd").onclick = () => done();
					S.cur = { end:() => done() };
				}
			}
		});
	}

	/* ---------- boucle ---------- */
	let last = performance.now(), raf = 0;
	function frame(now){
		if(closed) return;
		raf = requestAnimationFrame(frame);
		const dt = Math.min(.05, (now - last)/1000); last = now; const t = now/1000;
		if(innerWidth !== vw || innerHeight !== vh) resize();
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
		if(talk && S.ci != null){ const s = toScreen(headOf(S.ci)); const half = Math.min(165, innerWidth/2 - 12); talk.style.left = Math.max(half + 12, Math.min(innerWidth - half - 12, s.x)) + "px"; talk.style.top = Math.max(talk.offsetHeight + 70, s.y) + "px"; }
		if(S.phoneBtn){ const s = toScreen(new THREE.Vector3(1.45, 1.4, 1.45)); S.phoneBtn.style.left = Math.min(innerWidth - 100, s.x) + "px"; S.phoneBtn.style.top = Math.min(innerHeight - 140, s.y) + "px"; }
	}

	/* ---------- début, fin, fermeture ---------- */
	const ov = $("#gqOv"), card = $("#gqCard");
	function finish(){
		S.phase = "done"; play("win"); S.cur = null;
		learn(["stats", "relation"]);
		const sat = S.per.reduce((a, p) => a + p.sat, 0)/S.per.length;
		const links = ALERTS.reduce((a, x) => a + (S.links[x.id] || 0), 0)/ALERTS.length;
		const right = S.accused === CULPRIT;
		let score100 = Math.round(sat*55 + links*25 + (right ? 20 : -25) - S.conf.length*6);
		if(!right) score100 = Math.min(score100, 44);      // signaler un innocent : jamais mieux que « De justesse »
		score100 = Math.max(0, Math.min(100, score100));
		const mention = MENTIONS[score100 >= 85 ? 3 : score100 >= 65 ? 2 : score100 >= 45 ? 1 : 0];
		ev("win", mention);
		const happy = S.per.filter(p => p.sat >= .8).length;
		const rank = !right ? "Enquête à reprendre" : mention === "Très bien" ? "Conseiller de confiance" : mention === "Bien" ? "Bon conseiller, bon enquêteur" : "Conseiller en devenir";
		const sus = SUSPECTS.find(s => s.id === S.accused);
		card.className = "gq-cardx";
		card.innerHTML = `<p class="k">12 h 30 · la matinée est finie</p><div class="gq-big2">${right ? (score100 >= 65 ? "🏆" : "📋") : "⚠️"}</div>
			<h2>${rank}</h2>
			<p>Mention <b>${mention}</b> (${score100} / 100). ${right ? "Tu as trouvé qui blanchissait, preuves à l'appui, sans accuser personne à tort." : `Tu as signalé ${sus ? sus.name : "un innocent"} : le vrai circuit (Karim, compte …4471) continue.`} ${S.conf.length ? "La conformité te coûte aussi des points : en banque, c'est non négociable." : ""}</p>
			<div class="gq-stats"><div>Signalement<b>${right ? "✔ Karim" : "✘ " + (sus ? sus.name : "—")}</b></div><div>Soupçons bien reliés<b>${ALERTS.filter(a => S.links[a.id] === 1).length} / ${ALERTS.length}</b></div><div>Indices épinglés<b>${S.pins.length} / ${Object.keys(PINS).length}</b></div><div>Clients ravis<b>${happy} / ${S.per.length}</b></div><div>Manquements<b>${S.conf.length}</b></div><div>PNB de la matinée<b>${euro(S.pnb)}</b></div></div>
			<p class="k">Tableau de bord · satisfaction</p>
			<table class="gq-tbl">${S.per.map(p => `<tr><td>${p.sat >= .8 ? "😊" : p.sat >= .5 ? "😐" : "😠"}</td><td><b>${p.name}</b> · ${p.who}</td><td>${pct(p.sat)}</td></tr>`).join("")}</table>
			${S.conf.length ? `<p class="k">Les remarques de la conformité</p><ul class="gq-list warn">${S.conf.map(m => `<li>${m}</li>`).join("")}</ul>` : ""}
			<p class="k">Les cours de la licence pro que tu as pratiqués (${S.learned.length})</p>
			<ul class="gq-list">${S.learned.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${jpoCard()}${openLead ? `<button class="gq-go" data-a="lead">📄 Recevoir la plaquette de la licence pro</button>` : ""}
			<a class="gq-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Pro Assurance-Banque-Finance ↗</a>
			<button class="gq-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="gq-alt" data-a="replay">Rejouer</button>`;
		ov.hidden = false; card.scrollTop = 0; nadia.classList.add("off"); S.score = score100; S.mention = mention;
	}
	ov.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ close(); openGuichet({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }); }
	});
	$(".gq-x").addEventListener("click", close);
	function onKey(e){ if(e.key === "Escape"){ if(!drawer.hidden){ drawer.hidden = true; return; } close(); } }
	document.addEventListener("keydown", onKey);
	let pump = 0;      // ?vite : l'horloge du jeu avance même quand l'affichage est en pause (tests automatiques)
	if(SPEED > 1){ window.__guichet = { S, snap:() => { resize(); renderer.render(scene, camera); placeOverlays(); } }; pump = setInterval(() => { if(!closed){ tickTimers(.03); walkPeople(.03, performance.now()/1000); } }, 30); }

	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); clearInterval(pump); timers.clear(); S.hold = null;
		removeEventListener("resize", resize); document.removeEventListener("keydown", onKey);
		clearTimeout(nadiaOff);
		[signM, tickM, g2M, phoneGlow.material, ...tabMats].forEach(m => { m.map && m.map.dispose(); m.dispose(); });      // les géométries du kit sont partagées avec le campus : on ne les libère pas
		scene.clear();
		renderer.dispose(); renderer.forceContextLoss();
		root.remove();
		onClose && onClose();
	}

	// ouverture à chaud : pas d'écran de règles, le premier client arrive tout de suite (la note de la conformité est dans le carnet)
	ov.hidden = true; S.phase = "play"; ev("start"); run();
	raf = requestAnimationFrame(frame);
}
