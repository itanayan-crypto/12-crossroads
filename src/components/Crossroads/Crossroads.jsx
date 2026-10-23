/**
 * Crossroads City: 3D traffic control game (React + three.js)
 *
 * Setup:   npm i react react-dom three@0.128.0
 * Use:     import Crossroads from './Crossroads'; then render <Crossroads /> (it fills the screen)
 *
 * - 4-way signalised junction, 2 lanes per direction, 11 vehicle body types, people crossing automatically
 * - Traffic police officer deploys when an ambulance approaches, stops cross traffic and waves it through
 * - Roads run far into the world, with a flyover ring road, a city of buildings and ambient traffic
 * - Game HUD: score, missions, ambulance events, minimap
 * - Monitor tabs: Overview, Signals, Traffic, People, Safety, Charts, Control (time of day, rain, overlays)
 */
import React, {useState, useEffect, useRef, createElement as h} from 'react';
import * as THREE from 'three';

const CSS = `
.app{--bg:#eceae3;--ink:#1c2024;--mute:#5d6369;--card:#fbfaf6;--line:#d3d0c5;--g:#1f9d5c;--y:#d9961a;--r:#d83a3f;position:fixed;inset:0;overflow:hidden;background:#0b0f14;color:var(--ink);font:400 15px/1.45 Barlow,system-ui,sans-serif}
@media (prefers-color-scheme:dark){.app:not([data-theme="light"]){--bg:#12161a;--ink:#ecebe6;--mute:#9aa0a6;--card:#1b2025;--line:#31383f;--g:#2fbf71;--y:#f2b632;--r:#e5484d}}
.app[data-theme="dark"]{--bg:#12161a;--ink:#ecebe6;--mute:#9aa0a6;--card:#1b2025;--line:#31383f;--g:#2fbf71;--y:#f2b632;--r:#e5484d}
.app *,.app *::before,.app *::after{box-sizing:border-box}
.app h1,.app .big,.app .stats b{font-family:"Barlow Condensed",Impact,sans-serif;font-weight:700;margin:0}
.app .stage{position:fixed;inset:0}.app .stage canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
.app .title{position:fixed;left:12px;top:calc(12px + env(safe-area-inset-top,0px));color:#fff;background:rgba(8,10,14,.55);padding:8px 12px;border-radius:8px;backdrop-filter:blur(6px);max-width:min(300px,60vw)}
.app .title h1{font-size:26px;line-height:1.1}.app .title p{margin:2px 0 8px;font-size:13px;color:#cfd5db}
.app .views{display:flex;gap:6px;flex-wrap:wrap}
.app .monitor{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:min(390px,calc(100vw - 24px));max-height:calc(100% - 140px);overflow:auto;background:var(--card);background:color-mix(in srgb,var(--card) 93%,transparent);border:1px solid var(--line);border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.4);backdrop-filter:blur(8px)}
.app .mhead{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;position:sticky;top:0;background:inherit;z-index:1}
.app .mbody{padding:0 12px 12px}
.app .vms{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}
.app .sign{background:#08090a;border:2px solid #2a2e33;border-radius:6px;padding:5px 8px;color:#ffb21c;text-shadow:0 0 8px rgba(255,178,28,.55)}
.app .sign.R .big{color:#ff5a4f;text-shadow:0 0 8px rgba(255,90,79,.6)}
.app .sign.G .big{color:#4be28a;text-shadow:0 0 8px rgba(75,226,138,.6)}
.app .sign .dir{font-size:12px;color:#8d939a;text-shadow:none;display:flex;justify-content:space-between}
.app .sign .big{font-size:30px;line-height:1.05;letter-spacing:1px}.app .sign .msg{font-size:12px;line-height:1.25}
.app .strip{display:flex;justify-content:space-between;font-weight:500;gap:8px}
.app .bar{height:7px;background:var(--line);border-radius:4px;margin:5px 0 8px;overflow:hidden}.app .bar i{display:block;height:100%;background:var(--y)}
.app .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0}
.app .stats div{font-size:12px;color:var(--mute)}.app .stats b{display:block;font-size:22px;color:var(--ink)}
.app .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.app label{font-size:13px;color:var(--mute);display:flex;flex-direction:column;flex:1;min-width:110px}
.app input[type=range]{width:100%}
.app button{font:500 13px Barlow,sans-serif;padding:6px 11px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.app button:focus-visible,.app input:focus-visible{outline:3px solid var(--y);outline-offset:2px}
.app button.warn{border-color:var(--r);color:var(--r)}
.app .safe{font-weight:500;display:flex;gap:8px;align-items:center}.app .dot{width:11px;height:11px;border-radius:50%;background:var(--g)}.app .bad .dot{background:var(--r)}
.app .log{margin:6px 0 0;padding:0;list-style:none;font-size:12px;color:var(--mute)}.app .log li{padding:2px 0;border-top:1px solid var(--line)}

.app .hud{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);display:flex;background:rgba(8,10,14,.62);backdrop-filter:blur(8px);border-radius:12px;padding:6px 8px;color:#fff;z-index:2}
.app .hs{text-align:center;padding:0 10px}.app .hs small{display:block;font-size:10px;letter-spacing:.12em;color:#9fb0c0}.app .hs b{font-size:22px;font-family:"Barlow Condensed",sans-serif}
.app .alert{position:fixed;top:calc(74px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;background:rgba(200,40,40,.93);color:#fff;padding:6px 12px;border-radius:10px;font-weight:500;z-index:2;white-space:nowrap}
.app .alert button{background:#fff;color:#a01818;border-color:#fff}
.app .missions,.app .mini{position:fixed;left:12px;background:rgba(8,10,14,.62);backdrop-filter:blur(8px);color:#fff;border-radius:12px;padding:8px 10px;z-index:1}
.app .missions{top:calc(132px + env(safe-area-inset-top,0px));width:236px;font-size:13px}
.app .missions h3{margin:0 0 4px;font:700 16px "Barlow Condensed",sans-serif;letter-spacing:.06em}
.app .ms{padding:3px 0}.app .ms span{display:block}.app .ms small{float:right;color:#ffb21c}.app .ms.ok span{color:#4be28a}
.app .ms .bar{margin:3px 0 2px;height:5px;background:rgba(255,255,255,.18)}
.app .mini{bottom:calc(12px + env(safe-area-inset-bottom,0px))}.app .mini small{display:block;text-align:center;font-size:11px;color:#9fb0c0}
.app .mini canvas{display:block;width:170px;height:170px;border-radius:8px}
.app .tabs{display:flex;flex-wrap:wrap;gap:4px;padding:0 12px 8px}
.app .tabs button.on{background:var(--y);color:#111;border-color:var(--y)}
.app .tl{position:relative;height:14px;background:var(--r);border-radius:3px;margin:3px 0;overflow:hidden}.app .tl i{position:absolute;top:0;bottom:0}
.app .tl u{position:absolute;top:-2px;bottom:-2px;width:2px;background:#fff;text-decoration:none}
.app .kv{display:flex;justify-content:space-between;font-size:13px;padding:2px 0;border-top:1px solid var(--line)}
.app .h4{font:700 15px "Barlow Condensed",sans-serif;letter-spacing:.05em;margin:10px 0 4px;color:var(--mute)}
.app .cards4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.app .cards4 div{border:1px solid var(--line);border-radius:6px;padding:4px 6px;font-size:12px;text-align:center}.app .cards4 b{display:block;font-size:20px;font-family:"Barlow Condensed",sans-serif}
.app .tog.on{background:var(--g);color:#06150c;border-color:var(--g)}
.app .cab{position:fixed;inset:0;pointer-events:none;overflow:hidden}
.app .cab i{position:absolute;display:block}
.app .cab .rf{top:0;left:0;right:0;height:9%;background:linear-gradient(#08090b,rgba(8,9,11,0))}
.app .cab .pl,.app .cab .pr{top:0;bottom:16%;width:7%;background:#0a0b0d}
.app .cab .pl{left:0;clip-path:polygon(0 0,100% 0,35% 100%,0 100%)}
.app .cab .pr{right:0;clip-path:polygon(0 0,100% 0,100% 100%,65% 100%)}
.app .cab .mir{top:9%;left:50%;width:130px;height:34px;margin-left:-65px;border-radius:8px;background:#1b2026;border:3px solid #0a0b0d}
.app .cab .dash{position:absolute;left:-5%;right:-5%;bottom:0;height:17%;background:#0b0c0e;border-radius:50% 50% 0 0/40% 40% 0 0;text-align:center;color:#fff;padding-top:2.2%}
.app .cab .dash b{font:700 34px "Barlow Condensed",sans-serif;color:#4be28a;display:block;line-height:1}
.app .cab .dash small{color:#9aa0a6;font-size:12px}
.app .cab .whl{right:20%;bottom:-120px;width:240px;height:240px;border-radius:50%;border:18px solid #15171a;box-shadow:0 0 0 2px #2a2d31}
.app .exit{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));right:12px;z-index:3}
@media(max-width:760px){.app .missions,.app .mini{display:none}.app .hud{left:12px;transform:none;top:calc(128px + env(safe-area-inset-top,0px))}.app .alert{top:calc(184px + env(safe-area-inset-top,0px))}}
`;

const AX={N:'NS',S:'NS',E:'EW',W:'EW'},STOP=196,BOX0=240,O=['N','E','S','W'],NM={N:'North',E:'East',S:'South',W:'West'};
const MING=8,COL=['#c9463d','#3d6fc9','#e8e8e8','#2f2f35','#d9a21b','#4d9a6a','#8a8f98'];
const pos=(o,s)=>o=='N'?[330,s]:o=='E'?[600-s,330]:o=='S'?[270,600-s]:[s,270];
const OFF={S:2,L:1,R:3};let NL=2,LW=30;const lanesOf=()=>Array.from({length:NL},(_,i)=>i);const lenOf=t=>t=='S'?120:t=='L'?LW/2*Math.PI/2:(120-LW*(NL-.5))*Math.PI/2;function setLanes(S,n){NL=n;LW=60/n;S.NL=n;S.cars=[];S.emgGrant=false}
function P0(c,s){
  const k=O.indexOf(c.o),u=s-BOX0,xl=360-LW*(c.ln+.5),rl=LW/2,rR=120-LW*(NL-.5),LL=rl*Math.PI/2,LR=rR*Math.PI/2;let x,y;
  if(u<=0||c.t=='S'){x=xl;y=s}
  else if(c.t=='L'){if(u<LL){const th=u/rl;x=360-rl*Math.cos(th);y=240+rl*Math.sin(th)}else{x=360+u-LL;y=240+rl}}
  else{if(u<LR){const th=u/rR;x=240+rR*Math.cos(th);y=240+rR*Math.sin(th)}else{x=240-(u-LR);y=240+rR}}
  for(let i=0;i<k;i++){const n=600-y;y=x;x=n}
  return [x,y];
}
function pose(c){const f=P0(c,c.s),r=P0(c,c.s-c.len);return [f[0],f[1],Math.atan2(f[1]-r[1],f[0]-r[0])]}
const mk=()=>({NL:NL,cars:[],id:0,t:0,cur:0,mode:'G',pt:0,gap:0,next:1,empty:true,sig:{N:'G',E:'R',S:'R',W:'R'},fault:false,inject:false,pedReq:false,pre:null,passed:0,avgW:0,nW:0,blocked:0,conf:false,night:true,rate:10,maxG:GR,peds:[],pedRate:3,crossed:0,pedBusy:false,lastPed:-999,labels:true,gr:GR,pedOn:true,pol:{st:'off',t:0,arm:0},score:0,viol:0,hour:10,auto:false,rain:false,ov:{queues:true,zone:true},ambT:35,emgGrant:false,ambOk:0,done:[0,0,0,0,0],confN:0,hist:[],hacc:0,sp:1,box:{N:0,E:0,S:0,W:0},log:['Controller online. North approach green.']});
const lg=(S,m)=>{S.log.unshift(m);S.log=S.log.slice(0,8)};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const MODELS=[
 {n:'Maruti Swift',b:'hatch',l:38,w:17,c:['#c43b2f','#f4f4f4','#2f4f7f','#8a8d91'],p:.12},
 {n:'Maruti WagonR',b:'tall',l:36,w:16.5,c:['#e5e5e5','#4a6fa5','#7b3f2a'],p:.08},
 {n:'Tata Punch',b:'hatch',l:38,w:17.2,c:['#e46c2b','#f4f4f4','#2f7d5b'],p:.06},
 {n:'Hyundai Creta',b:'suv',l:43,w:18,c:['#f4f4f4','#1d1d21','#8c8f94','#5a1f2b'],p:.09},
 {n:'Tata Nexon',b:'suv',l:40,w:18,c:['#2f5fa8','#f4f4f4','#c8c8c8'],p:.09},
 {n:'Mahindra Thar',b:'jeep',l:39,w:18.5,c:['#c8372d','#2b2b2b','#c9b37a'],p:.05},
 {n:'Toyota Innova Crysta',b:'mpv',l:48,w:18.3,c:['#f2f2f2','#5b5f66','#2b2b2b'],p:.06},
 {n:'Honda City',b:'sedan',l:45,w:17.5,c:['#e8e8e8','#3a3d44','#8a1f1f'],p:.07},
 {n:'Maruti Dzire',b:'sedan',l:42,w:17,c:['#e8e8e8','#5f6368','#b8312f'],p:.06},
 {n:'Mahindra Scorpio',b:'suv',l:45,w:18.5,c:['#1a1a1a','#f4f4f4','#6b6f75'],p:.05},
 {n:'Bajaj RE Auto',b:'rick',l:27,w:13,c:['#f0c22d'],p:.12},
 {n:'Royal Enfield Classic 350',b:'bike',l:21,w:8,c:['#1f2a44','#8a1f1f','#3a3d44'],p:.05},
 {n:'Hero Splendor',b:'bike',l:19,w:7,c:['#222428','#c9463d','#2a6fb5'],p:.08},
 {n:'Tata 407',b:'truck',l:62,w:20,c:['#e8e8e8','#c9463d','#2a6fb5'],p:.04},
 {n:'Ashok Leyland Bus',b:'bus',l:100,w:25,c:['#c0392b','#2a6fb5','#2e8b57'],p:.02}];
const AMB={n:'Force Traveller Ambulance',b:'amb',l:54,w:19,c:['#f4f4f4']};
function add(S,o,amb){
  const k=O.indexOf(o);let M=AMB;
  if(!amb){let q=Math.random()*MODELS.reduce((a,m)=>a+m.p,0);M=MODELS.find(m=>(q-=m.p)<0)||MODELS[0]}
  const r=Math.random(),ty=M.l<=40?(r<.5?'S':r<.75?'L':'R'):(r<.65?'S':'R');
  const gap=l=>S.cars.filter(c=>c.o==o&&c.ln==l).reduce((q,c)=>Math.min(q,c.s-c.len),999),gs=lanesOf().map(gap);
  const mx=Math.max(...gs),ln=ty=='L'?0:ty=='R'?NL-1:pick(lanesOf().filter(l=>gs[l]==mx)),m=gs[ln];
  if(!amb&&m<-1360)return;
  const arm=(k+OFF[ty])%4,lo=ty=='S'?ln:ty=='L'?0:NL-1,vm={bike:120,rick:80,bus:70,truck:78,amb:150}[M.b]||95;
  S.cars.push({id:++S.id,o,t:ty,k:M.b,model:M.n,ln,P:lenOf(ty),ex:arm*4+lo,x:-300,s:Math.min(-1400,m-12),v:50,len:M.l,w:M.w,col:pick(M.c),col2:pick(['#d9d7cf','#2a6fb5','#c26a2e']),wt:0,vmax:vm+Math.random()*25,amb:!!amb,br:false,go:false,cr:0})}
const MIS=[{n:'Clear 150 vehicles',pts:500,goal:150,val:S=>S.passed},{n:'Help 60 people cross',pts:400,goal:60,val:S=>S.crossed},
 {n:'Average wait under 20 s (80+ cars)',pts:600,goal:1,val:S=>S.nW>=80&&S.avgW<20?1:0},{n:'Give an ambulance priority',pts:500,goal:1,val:S=>S.ambOk},
 {n:'5 minutes without a conflict',pts:700,goal:300,val:S=>S.confN?0:S.t}];
function warm(S){for(let i=0;i<60*70;i++)tick(S,1/60);Object.assign(S,{passed:0,crossed:0,score:0,avgW:0,nW:0,hist:[],confN:0,viol:0,blocked:0,t:0,lastPed:-999,ambT:45,ambOk:0,pol:{st:'off',t:0,arm:0},done:[0,0,0,0,0],log:['Controller online. City traffic running.']})}
const GR=11,YL=3,AR=1.5,PW=12,PMIN=78,PCOL=['#ffe9a8','#9fd6ff','#ffb3a7','#c9f5c1'];
function ctl(S,dt){
  const am=S.emgGrant&&S.cars.find(c=>c.amb&&c.s<BOX0+60);S.pre=am?O.indexOf(am.o):-1;
  if(!S.cars.some(c=>c.amb))S.emgGrant=false;
  S.pt+=dt;
  if(S.mode=='G'){const ac=S.cars.find(c=>c.amb),ai=ac?O.indexOf(ac.o):-1,pol=S.pol.st=='walk'||S.pol.st=='dir',
      hold=S.pre==S.cur||(pol&&ai==S.cur),cut=((S.pre>=0&&S.pre!=S.cur)||(pol&&ai>=0&&ai!=S.cur))&&S.pt>=3;
    if(!hold&&(S.pt>=S.gr||cut)){S.mode='Y';S.pt=0;S.next=S.pre>=0&&S.pre!=S.cur?S.pre:pol&&ai>=0&&ai!=S.cur?ai:(S.cur+1)%4}}
  else if(S.mode=='Y'){if(S.pt>=YL){S.mode='R';S.pt=0}}
  else if(S.mode=='R'){
    if(S.pre>=0)S.next=S.pre;else if(S.pol.st=='walk'||S.pol.st=='dir'){const ac=S.cars.find(c=>c.amb);if(ac)S.next=O.indexOf(ac.o)}
    if(S.pt>=AR&&S.empty&&!S.pedBusy){
      if(S.cur==3&&S.pedOn&&S.pre<0){S.mode='P';S.pt=0;S.pedReq=false;S.lastPed=S.t;lg(S,'Walk signal on. All vehicles held.')}
      else{S.cur=S.next;S.mode='G';S.pt=0;S.gap=0}
    }
  }else if(S.pt>=PW&&!S.pedBusy){S.cur=S.next;S.mode='G';S.pt=0;S.gap=0}
}
function tick(S,dt){
  S.t+=dt;
  if(S.auto)S.hour=(S.hour+dt*.1)%24;S.night=S.hour<6.2||S.hour>=18.2;
  S.ambT-=dt;if(S.ambT<=0){S.ambT=70+Math.random()*60;if(!S.cars.some(c=>c.amb)){const o=pick(O);add(S,o,true);lg(S,'Ambulance approaching from '+NM[o]+'. Grant priority!')}}
  S.hacc+=dt;if(S.hacc>=2){S.hacc=0;S.hist.push({t:S.t,q:O.map(o=>S.cars.filter(c=>c.o==o&&c.v<8&&c.s<STOP&&c.s>STOP-400).length),p:S.passed,w:S.avgW,c:S.cars.length});if(S.hist.length>90)S.hist.shift()}
  {const am=S.cars.find(c=>c.amb),P=S.pol;
   if(P.st=='off'){if(am&&am.s>-1350&&am.s<BOX0){P.st='walk';P.t=0;P.arm=O.indexOf(am.o);lg(S,'Traffic police moving to the '+NM[am.o]+' corner.')}}
   else if(P.st=='walk'){P.t+=dt;if(!am){P.st='back';P.t=0}else if(P.t>=5){P.st='dir';P.t=0;S.emgGrant=true;lg(S,'Police in position: stopping cross traffic, ambulance waved through.')}}
   else if(P.st=='dir'){P.t+=dt;if(!am||am.s>BOX0+200){P.st='back';P.t=0;S.emgGrant=false;lg(S,'Emergency over. Police returning to the kerb.')}}
   else{P.t+=dt;if(P.t>=5){P.st='off';P.t=0}}}
  O.forEach(o=>{if(Math.random()<S.rate/60*dt)add(S,o)});
  S.cars.forEach(c=>{c.x=c.s-BOX0-c.P});const box={N:0,E:0,S:0,W:0};S.cars.forEach(c=>{if(c.s>STOP+4&&c.x-c.len<36)box[c.o]++});S.box=box;
  const bn=O.filter(o=>box[o]).length;S.empty=bn==0;
  if(bn>1){if(!S.conf){S.confN++;S.score-=500;lg(S,'ALERT: vehicles from two approaches in junction. -500')}S.conf=true}else S.conf=false;
  const walk=S.mode=='P'&&!S.fault;
  if(Math.random()<S.pedRate/60*dt&&S.peds.filter(p=>p.st=='w').length<14){
    S.peds.push({k:Math.floor(Math.random()*4),sd:Math.random()<.5?0:1,st:'w',u:0,spd:17+Math.random()*9,j:(Math.random()-.5)*12,dl:Math.random()*2,col:Math.floor(Math.random()*4)});
    if(!(S.mode=='P'&&S.pt<5)){S.pedReq=true}}
  S.peds.forEach(p=>{if(p.st=='w'&&walk&&S.pt<5&&S.pt>p.dl)p.st='c';if(p.st=='c'){p.u+=p.spd*dt/132;if(p.u>=1){p.st='d';S.crossed++;S.score+=15}}});
  S.peds=S.peds.filter(p=>p.st!='d');S.pedBusy=S.peds.some(p=>p.st=='c');
  if(!S.fault)ctl(S,dt);
  const d={};O.forEach((o,i)=>d[o]=i==S.cur&&S.mode!='R'&&S.mode!='P'?S.mode:'R');
  if(S.inject)O.forEach(o=>d[o]='G');
  if(O.filter(o=>d[o]!='R').length>1){S.fault=true;S.inject=false;S.blocked++;S.score-=100;lg(S,'Interlock blocked two greens at once. Flashing red, all-way stop.')}
  S.sig=S.fault?{N:'F',E:'F',S:'F',W:'F'}:d;
  if(S.fault&&S.empty&&!S.pedBusy&&!S.cars.some(c=>c.go&&c.s>STOP+4&&c.x-c.len<36)){
    const w=S.cars.filter(c=>!c.go&&c.s<STOP&&STOP-c.s<8&&c.v<3).sort((a,b)=>a.id-b.id)[0];if(w)w.go=true}
  O.forEach(o=>lanesOf().forEach(ln=>{
    const L=S.cars.filter(c=>c.o==o&&c.ln==ln).sort((a,b)=>b.s-a.s),sg=S.sig[o];
    L.forEach((c,i)=>{
      const ld=L[i-1];let dd=ld?ld.s-ld.len-c.s-7:1e9;const dl=STOP-c.s;
      S.cars.forEach(q=>{if(q!==c&&q.ex==c.ex&&q.s>BOX0&&q.x>c.x)dd=Math.min(dd,q.x-q.len-c.x-7)});
      if(dl>-2){
        let st=false;
        if(sg!='Y')c.dec=0;
        if(sg=='R')st=true;else if(sg=='Y'){if(!c.dec)c.dec=dl>c.v*c.v/110+c.v*.25?1:2;st=c.dec==1}else if(sg=='F')st=!c.go;
        if(st)dd=Math.min(dd,dl);
      }
      let vm=c.vmax*(S.rain?.8:1);if(c.t!='S'&&c.x<0){const vt=c.t=='L'?34:52,ds=Math.max(0,BOX0-50-c.s);vm=Math.min(vm,Math.sqrt(vt*vt+2*70*ds))}
      const b=90,tg=Math.min(vm,Math.sqrt(2*b*Math.max(dd,0))),pv=c.v;
      c.v=tg>c.v?Math.min(tg,c.v+55*dt):Math.max(tg,c.v-b*1.4*dt);
      c.br=c.v<pv-.2||c.v<3;c.s+=c.v*dt;if(dd<=0&&dl>-2&&dl<0.5&&c.v<3){c.s=Math.min(c.s,STOP);c.v=0}
      if(c.v<6&&dl>0&&dl<220)c.wt+=dt;
      if(!c.cr&&c.s>=STOP){c.cr=1;S.avgW=(S.avgW*S.nW+c.wt)/(S.nW+1);S.nW++}
      if(!c.vc&&c.s>=STOP+2){c.vc=1;if(sg=='R'&&!c.go){S.viol++;S.score-=100;lg(S,'Red-light violation!')}if(c.amb){const bn=c.wt<6?150:50;S.score+=bn;if(c.wt<6)S.ambOk=1;lg(S,'Ambulance cleared after '+c.wt.toFixed(0)+' s. +'+bn)}}
    });
  }));
  const n=S.cars.length;S.cars=S.cars.filter(c=>c.x-c.len<1400);S.passed+=n-S.cars.length;S.score+=10*(n-S.cars.length);
  MIS.forEach((m,i)=>{if(!S.done[i]&&m.val(S)>=m.goal){S.done[i]=1;S.score+=m.pts;lg(S,'Mission complete: '+m.n+'  +'+m.pts)}});
}
function est(S,o){
  const i=O.indexOf(o);
  if(S.fault)return {st:'F',s:0};
  if(S.cur==i&&S.mode=='G')return {st:'G',s:Math.max(0,Math.ceil(S.gr-S.pt))};
  if(S.cur==i&&S.mode=='Y')return {st:'Y',s:Math.max(0,Math.ceil(YL-S.pt))};
  const cyc=S.gr+YL+AR;
  if(S.mode=='P')return {st:'R',s:Math.max(1,Math.ceil(PW-S.pt+((i-S.next+4)%4)*cyc-1e-6))};
  const tR=S.mode=='G'?S.gr-S.pt+YL:S.mode=='Y'?YL-S.pt:0,d=(i-S.cur+4)%4||4,ped=S.pedOn&&S.cur+d>=4?PW:0;
  const s=(S.mode=='G'?S.gr-S.pt+YL+AR:S.mode=='Y'?YL-S.pt+AR:Math.max(AR-S.pt,0))+ped+(d-1)*cyc;
  return {st:'R',s:Math.max(1,Math.ceil(s-1e-6))};
}
const SC={};
function rnd(s){return()=>(s=(s*16807)%2147483647)/2147483647}
function scene(n,nl){const lw=60/nl;
  const SK=n+'_'+nl;if(SC[SK])return SC[SK];
  const c=document.createElement('canvas');c.width=c.height=1200;const x=c.getContext('2d');x.scale(2,2);const R=rnd(11);
  x.fillStyle=n?'#0c130f':'#bfcab0';x.fillRect(0,0,600,600);
  [[10,10],[372,10],[10,372],[372,372]].forEach(([a,b])=>{
    x.fillStyle=n?'#18231b':'#a9bd96';x.fillRect(a,b,218,218);
    x.fillStyle=n?'#2a3036':'#c9c4b6';x.fillRect(a+(a<300?150:8),b+(b<300?150:8),60,60);
    for(let i=0;i<14;i++){x.fillStyle=n?'#1d2d22':'#97ad84';x.beginPath();x.arc(a+R()*218,b+R()*218,6+R()*10,0,7);x.fill()}
  });
  x.fillStyle=n?'#363c43':'#b2afa6';x.fillRect(228,0,144,600);x.fillRect(0,228,600,144);
  x.strokeStyle='rgba(0,0,0,.14)';x.lineWidth=1;x.beginPath();
  for(let i=0;i<600;i+=11){[[228,240],[360,372]].forEach(([a,b])=>{x.moveTo(a,i);x.lineTo(b,i);x.moveTo(i,a);x.lineTo(i,b)})}x.stroke();
  x.fillStyle=n?'#14171a':'#4b4f54';x.fillRect(240,0,120,600);x.fillRect(0,240,600,120);
  for(let i=0;i<260;i++){x.fillStyle=R()<.5?'rgba(0,0,0,.09)':'rgba(255,255,255,.04)';const rx=R()*600,ry=R()*600,w=2+R()*10;if(R()<.5)x.fillRect(240+R()*120,ry,w,1.5);else x.fillRect(rx,240+R()*120,w,1.5)}
  x.fillStyle=n?'#6c737b':'#dcd9d2';[[238,0,2,600],[360,0,2,600],[0,238,600,2],[0,360,600,2]].forEach(r=>x.fillRect(...r));
  for(let k=0;k<4;k++){
    x.save();x.translate(300,300);x.rotate(k*Math.PI/2);x.translate(-300,-300);
    x.fillStyle=n?'rgba(0,0,0,.28)':'rgba(0,0,0,.1)';for(let i=0;i<nl;i++)[360-lw*(i+.5),240+lw*(i+.5)].forEach(cx=>x.fillRect(cx-lw*.27,0,lw*.53,190));
    x.fillStyle='#d9a82e';x.fillRect(297,0,2,190);x.fillRect(301,0,2,190);
    x.fillStyle='#e8e4d4';x.fillRect(244,0,2,190);x.fillRect(354,0,2,190);
    x.fillStyle='#e8e4d4';for(let yy=0;yy<184;yy+=22)for(let j=1;j<nl;j++){x.fillRect(360-lw*j-1,yy,2,12);x.fillRect(240+lw*j-1,yy,2,12)}
    const ar=(cx,d)=>{x.save();x.translate(cx,0);x.scale(lw/30,1);x.translate(-cx,0);x.beginPath();x.moveTo(cx,170);x.lineTo(cx-6,157);x.lineTo(cx-2,157);x.lineTo(cx-2,124);x.lineTo(cx+2,124);x.lineTo(cx+2,157);x.lineTo(cx+6,157);x.fill();
      if(d){x.beginPath();x.moveTo(cx+d*2,142);x.lineTo(cx+d*12,150);x.lineTo(cx+d*13,146);x.lineTo(cx+d*18,154);x.lineTo(cx+d*9,157);x.lineTo(cx+d*10,153);x.lineTo(cx+d*2,148);x.fill()}x.restore()};
    for(let i=0;i<nl;i++)ar(360-lw*(i+.5),i==0?1:i==nl-1?-1:0);
    x.fillRect(300,190,60,5);
    for(let i=0;i<8;i++)x.fillRect(244+i*14.5,206,8,26);
    x.restore();
  }
  [[231,231],[369,231],[231,369],[369,369]].forEach(([a,b])=>{
    if(n){const g=x.createRadialGradient(a,b,2,a,b,120);g.addColorStop(0,'rgba(255,214,140,.30)');g.addColorStop(1,'rgba(255,214,140,0)');x.fillStyle=g;x.fillRect(a-120,b-120,240,240)}
    x.fillStyle='#2a2d31';x.beginPath();x.arc(a,b,3.5,0,7);x.fill();x.fillStyle=n?'#ffe2a3':'#777';x.beginPath();x.arc(a,b,2,0,7);x.fill()});
  return SC[SK]=c;
}

const TX={};const T=(n,l)=>{const k=n+'_'+l;return TX[k]||(TX[k]=Object.assign(new THREE.CanvasTexture(scene(n,l)),{anisotropy:8}))};
function wallTex(night,rx,ry){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),r=rnd(5);
  x.fillStyle=night?'#000':'#cfc8b8';x.fillRect(0,0,64,64);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const l=r()<.45;x.fillStyle=night?(l?'#ffd98a':'#000'):(l?'#9fb4c4':'#7d93a6');x.fillRect(4+i*16,5+j*16,10,9)}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);return t}
function init3d(el){
  const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(R.domElement);
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(48,1,1,6000);
  const amb=new THREE.AmbientLight(0xffffff,.75),sun=new THREE.DirectionalLight(0xffffff,.95);
  sun.position.set(-260,420,180);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  const sh=sun.shadow.camera;sh.left=-600;sh.right=600;sh.top=600;sh.bottom=-600;sh.near=10;sh.far=1800;sc.add(amb,sun);
  const GC={},MC={};
  const gm=(w,h,d)=>{const k=w+','+h+','+d;return GC[k]||(GC[k]=new THREE.BoxGeometry(w,h,d))};
  const lm=c=>MC[c]||(MC[c]=new THREE.MeshLambertMaterial({color:c}));
  const bas=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}));
  const B=(w,h,d,c)=>{const m=new THREE.Mesh(gm(w,h,d),typeof c=='number'?lm(c):c);m.castShadow=w*h*d>150;m.receiveShadow=true;return m};
  const gmat=new THREE.MeshLambertMaterial({map:T(true,2)});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600),gmat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;sc.add(ground);
  const grassT=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),r=rnd(21);x.fillStyle='#6f9a4c';x.fillRect(0,0,128,128);for(let i=0;i<900;i++){const g=(90+r()*90)|0;x.fillStyle='rgba('+((g*.55)|0)+','+g+','+((g*.35)|0)+','+(.1+r()*.15)+')';x.fillRect(r()*128,r()*128,1+r()*2,2+r()*4)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(110,110);t.anisotropy=8;return t})();
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000),new THREE.MeshLambertMaterial({map:grassT,color:0x1a2a1e}));outer.rotation.x=-Math.PI/2;outer.position.y=-.4;sc.add(outer);
  const rot=(x,y,k)=>{for(let i=0;i<k;i++){const n=600-y;y=x;x=n}return [x-300,y-300]};
  const glowT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
  const skyT={};[false,true].forEach(n=>{const c=document.createElement('canvas');c.width=16;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
    if(n){g.addColorStop(0,'#03060d');g.addColorStop(.55,'#0a1426');g.addColorStop(1,'#1d2a40')}else{g.addColorStop(0,'#4f86c6');g.addColorStop(.55,'#9cc4e8');g.addColorStop(1,'#e6eef2')}
    x.fillStyle=g;x.fillRect(0,0,16,256);if(n){x.fillStyle='#fff';const r=rnd(3);for(let i=0;i<30;i++)x.fillRect(r()*16,r()*130,1,1)}skyT[n]=new THREE.CanvasTexture(c)});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(3500,24,16),new THREE.MeshBasicMaterial({map:skyT[false],side:THREE.BackSide,fog:false}));sc.add(sky);
  sc.background=new THREE.Color(0xa9cbe8);sc.fog=new THREE.Fog(0xa9cbe8,900,3800);
  const medL=[];
  // ---- buildings: corner blocks + a whole city ----
  const bm=[],roofM=lm(0x6b6e72);
  const WM=[[2,3],[3,5],[4,7],[3,9]].map(([rx,ry])=>{const m=new THREE.MeshLambertMaterial({map:wallTex(false,rx,ry),emissiveMap:wallTex(true,rx,ry),emissive:0x000000});bm.push(m);return m});
  const bld=(x,z,w,d,hh,i,sh)=>{const m=WM[i%4],b=new THREE.Mesh(gm(w,hh,d),[m,m,roofM,roofM,m,m]);b.position.set(x,hh/2,z);b.castShadow=!!sh;b.receiveShadow=true;sc.add(b);return b};
  [[10,10],[372,10],[10,372],[372,372]].forEach(([a,b],q)=>{const cx=(a<300?a+78:a+140)-300,cz=(b<300?b+78:b+140)-300,hh=[46,38,58,42][q];bld(cx,cz,120,120,hh,q,true);
    for(let i=0;i<2;i++){const ac=B(18,6,12,0x8d8b84);ac.position.set(cx-25+i*50,hh+3,cz+(i?15:-15));sc.add(ac)}});
  {const R2=rnd(33);
   for(let gx=-1900;gx<=1900;gx+=130)for(let gz=-1900;gz<=1900;gz+=130){
     const x=gx+(R2()-.5)*40,z=gz+(R2()-.5)*40;
     if(Math.abs(x)<110||Math.abs(z)<110)continue;
     if(Math.abs(x)<330&&Math.abs(z)<330)continue;
     const r=Math.hypot(x,z);if(Math.abs(r-1000)<85||r>1900)continue;
     const w=Math.round(60+R2()*50),d=Math.round(60+R2()*50),hh=Math.round(24+R2()*(r<1000?60:110));
     bld(x,z,w,d,hh,Math.floor(R2()*4),false)}}
  // ---- long arms: roads go far into the world ----
  const armTex=nl=>{const lw=60/nl;const c=document.createElement('canvas');c.width=432;c.height=330;const x=c.getContext('2d');x.scale(3,3);const r=rnd(9);
    x.fillStyle='#4b4f54';x.fillRect(0,0,144,110);
    for(let i=0;i<90;i++){x.fillStyle=r()<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.04)';x.fillRect(12+r()*120,r()*110,2+r()*8,1.5)}
    x.fillStyle='rgba(0,0,0,.09)';for(let i=0;i<nl;i++)[72-lw*(i+.5),72+lw*(i+.5)].forEach(cx=>x.fillRect(cx-lw*.27,0,lw*.53,110));
    x.fillStyle='#b2afa6';x.fillRect(0,0,12,110);x.fillRect(132,0,12,110);x.fillStyle='#dcd9d2';x.fillRect(10,0,2,110);x.fillRect(132,0,2,110);
    x.fillStyle='#e8e4d4';x.fillRect(16,0,2,110);x.fillRect(126,0,2,110);for(let y=0;y<110;y+=22)for(let j=1;j<nl;j++){x.fillRect(72-lw*j-1,y,2,12);x.fillRect(72+lw*j-1,y,2,12)}
    x.fillStyle='#d9a82e';x.fillRect(69,0,2,110);x.fillRect(73,0,2,110);
    const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(1,1500/110);tx.anisotropy=8;return tx};const armTs={},armT=nl=>armTs[nl]||(armTs[nl]=armTex(nl));
  const armMat=new THREE.MeshLambertMaterial({map:armT(2)}),armGeo=new THREE.PlaneGeometry(144,1500);
  const trG=new THREE.CylinderGeometry(1.2,1.6,9,6),coG=new THREE.IcosahedronGeometry(9,1),shrG=new THREE.IcosahedronGeometry(3.4,0);
  const tree=(parent,x,z)=>{const g=new THREE.Group(),tr=new THREE.Mesh(trG,lm(0x5b4630)),cn=new THREE.Mesh(coG,lm([0x3f7d3f,0x4f8f45,0x2f6b3a][Math.floor(Math.abs(x*7+z)%3)]));tr.position.y=4.5;cn.position.y=14;g.add(tr,cn);g.scale.setScalar(.8+Math.abs(Math.sin(z))*.4);g.position.set(x,0,z);parent.add(g)};
  const lampAt=(parent,x,z)=>{const po=new THREE.Mesh(new THREE.CylinderGeometry(.7,.9,36,8),lm(0x2a2d31));po.position.set(x,18,z);
    const bu=new THREE.Mesh(new THREE.SphereGeometry(2.2,8,6),bas(0x777777));bu.position.set(x,37,z);
    const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:0xffd9a0,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));gl.scale.set(46,46,1);gl.position.copy(bu.position);gl.visible=false;parent.add(po,bu,gl);medL.push({bu,gl})};
  for(let k=0;k<4;k++){
    const ag=new THREE.Group();ag.rotation.y=-k*Math.PI/2;sc.add(ag);
    const rd=new THREE.Mesh(armGeo,armMat);rd.rotation.x=-Math.PI/2;rd.position.set(0,.03,-1048);rd.receiveShadow=true;ag.add(rd);
    const md=B(6,1.4,1500,0xa7a79e);md.position.set(0,.7,-1048);ag.add(md);const mg=B(4,1,1500,0x4c7a43);mg.position.set(0,1.6,-1048);ag.add(mg);
    for(let z=-340;z>-1790;z-=70){const sh=new THREE.Mesh(shrG,lm(0x2f6b3a));sh.position.set(0,4.2,z);ag.add(sh)}
    for(let z=-420;z>-1790;z-=140)lampAt(ag,0,z);
    
  }
  // ---- greenery: instanced neem / ashoka / gulmohar trees, hedges, flower beds ----
  {const R3=rnd(77),Q={t:[],b:[],c:[],f:[]},_o=new THREE.Object3D(),G3=[0x3f7d3f,0x4f8f45,0x2f6b3a,0x5a9a4a,0x3b7a52,0x6aa84f],FL=[0xe8588a,0xf2c94c,0xffffff,0xe5484d,0xb57bff],g6=()=>G3[Math.floor(R3()*6)];
   const pu=(a,x,y,z,sx,sy,sz,col,v)=>{_o.position.set(x,y,z);_o.scale.set(sx,sy,sz);_o.rotation.y=R3()*6;_o.updateMatrix();a.push([_o.matrix.clone(),new THREE.Color(col).offsetHSL(0,0,(R3()-.5)*(v==null?.08:v))])};
   const tr=(x,z)=>{const s=.8+R3()*.6,k=R3();
    if(k<.5){pu(Q.t,x,5.5*s,z,s,11*s,s,0x5b4630,.05);for(let i=0;i<5;i++){const a=i*1.26+R3(),d=i?5*s:0,r=(7+R3()*3)*s;pu(Q.b,x+Math.cos(a)*d,(15+(i?R3()*4:5))*s,z+Math.sin(a)*d,r,r*.85,r,g6())}}
    else if(k<.8){pu(Q.t,x,4*s,z,.8*s,8*s,.8*s,0x4a3a28,.05);[[7.5,15,10],[6,13,19],[4,11,27]].forEach(([r,hh,y])=>pu(Q.c,x,y*s,z,r*s,hh*s,r*s,[0x2f6b3a,0x3b7a52][Math.floor(R3()*2)]))}
    else{pu(Q.t,x,6*s,z,1.1*s,12*s,1.1*s,0x5b4630,.05);for(let i=0;i<6;i++){const a=i*1.05,d=(i?7:0)*s,r=(8+R3()*3)*s;pu(Q.b,x+Math.cos(a)*d,(18+R3()*3)*s,z+Math.sin(a)*d,r,r*.5,r,R3()<.55?0xd9531e:0x4f8f45)}}};
   const bu=(x,z)=>{const r=2.4+R3()*2;pu(Q.b,x,r*.7,z,r,r*.75,r,g6(),.1);if(R3()<.3)pu(Q.f,x+R3()*2-1,r*1.3,z+R3()*2-1,.9,.9,.9,FL[Math.floor(R3()*5)],.05)};
   const aw=(k,x,z)=>{const c=Math.cos(-k*Math.PI/2),s=Math.sin(-k*Math.PI/2);return [x*c+z*s,-x*s+z*c]};
   for(let k=0;k<4;k++){
    for(let z=-335;z>-1790;z-=30+R3()*14){if(Math.abs(-z-1000)<48)continue;[-1,1].forEach(sd=>{if(R3()<.9){const q=aw(k,sd*(86+R3()*6),z+R3()*8);tr(q[0],q[1])}if(R3()<.75){const q=aw(k,sd*(104+R3()*5),z+R3()*10);tr(q[0],q[1])}})}
    for(let z=-320;z>-1790;z-=12){if(Math.abs(-z-1000)<48)continue;[-1,1].forEach(sd=>{const q=aw(k,sd*(77.5+R3()*1.5),z);bu(q[0],q[1])})}
    for(let z=-320;z>-1790;z-=10){if(Math.abs(-z-1000)<48)continue;const q=aw(k,0,z);pu(Q.f,q[0],2.7,q[1],1.5,1.1,1.5,FL[Math.floor(R3()*5)],.05)}}
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{for(let u=88;u<=288;u+=26)for(let v=88;v<=288;v+=26){if(u>140&&v>140&&u<284&&v<284)continue;if(u<150&&v<150)continue;const x=u+R3()*8-4,z=v+R3()*8-4;if(R3()<.8)tr(sx*x,sz*z);else bu(sx*x,sz*z)}});
   const mkI=(ge,arr,sh)=>{if(!arr.length)return;const m=new THREE.InstancedMesh(ge,new THREE.MeshPhongMaterial({flatShading:sh,shininess:0,specular:0x000000}),arr.length);arr.forEach(([mx,c],i)=>{m.setMatrixAt(i,mx);m.setColorAt(i,c)});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.frustumCulled=false;m.castShadow=sh;m.receiveShadow=true;sc.add(m)};
   mkI(new THREE.CylinderGeometry(.9,1.4,1,6),Q.t,false);mkI(new THREE.IcosahedronGeometry(1,1),Q.b,true);mkI(new THREE.ConeGeometry(1,1,8),Q.c,true);mkI(new THREE.SphereGeometry(1,6,5),Q.f,false)}
  // ---- circular flyover ring road around the city ----
  const RR=1000,NSEG=72,segL=Math.round(2*Math.PI*RR/NSEG*1.02);
  const ringT=(()=>{const c=document.createElement('canvas');c.width=264;c.height=168;const x=c.getContext('2d');x.scale(3,3);
    x.fillStyle='#43474c';x.fillRect(0,0,88,56);x.fillStyle='#e8e4d4';x.fillRect(0,4,88,1.5);x.fillRect(0,50.5,88,1.5);
    for(let i=0;i<88;i+=22){x.fillRect(i,15,12,1.4);x.fillRect(i,39.6,12,1.4)}x.fillStyle='#d9a82e';x.fillRect(0,26.2,88,1.4);x.fillRect(0,28.4,88,1.4);
    const tx=new THREE.CanvasTexture(c);tx.anisotropy=8;return tx})();
  const ringTop=new THREE.MeshLambertMaterial({map:ringT}),ringSide=lm(0x8c8f93),parM=lm(0xb9b6ad),pilM=lm(0x9a9da1);
  for(let i=0;i<NSEG;i++){const ang=i/NSEG*Math.PI*2,g=new THREE.Group();g.position.set(RR*Math.sin(ang),24,-RR*Math.cos(ang));g.rotation.y=-ang;
    const rb=new THREE.Mesh(gm(segL,3,56),[ringSide,ringSide,ringTop,ringSide,ringSide,ringSide]);rb.receiveShadow=true;g.add(rb);
    [-1,1].forEach(s=>{const p=new THREE.Mesh(gm(segL,3,1.4),parM);p.position.set(0,2.2,s*27.3);g.add(p)});
    if(i%3==0){const pl=new THREE.Mesh(new THREE.CylinderGeometry(3.5,4,24,10),pilM);pl.position.y=-13.5;g.add(pl)}
    if(i%4==0)lampAt(g,0,0);
    sc.add(g)}
  // street lamps
  const lamps=[];[[231,231],[369,231],[231,369],[369,369]].forEach(([a,b])=>{
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.8,1,30,8),lm(0x2a2d31));pole.position.set(a-300,15,b-300);pole.castShadow=true;
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(2.4,10,8),bas(0x777777));bulb.position.set(a-300,31,b-300);
    const light=new THREE.PointLight(0xffd39a,0,170);light.position.set(a-300,30,b-300);sc.add(pole,bulb,light);lamps.push({bulb,light})});
  // signal heads
  const heads={};
  O.forEach((o,k)=>{
    let p=[366,186];for(let i=0;i<k;i++)p=[600-p[1],p[0]];
    const g=new THREE.Group();g.position.set(p[0]-300,0,p[1]-300);g.rotation.y=-k*Math.PI/2;g.scale.setScalar(1.7);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,28,8),lm(0x202327));pole.position.y=14;g.add(pole);
    const hd=B(9,24,8,0x0a0b0d);hd.position.y=31;g.add(hd);
    const ls=[0,1,2,3,4,5].map(i=>{const m=new THREE.Mesh(new THREE.SphereGeometry(3.2,12,10),bas(0x222222));m.position.set(0,38-(i%3)*8,i<3?-4.2:4.2);g.add(m);return m});
    const cv=document.createElement('canvas');cv.width=96;cv.height=48;const tx=new THREE.CanvasTexture(cv);
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(14,7),new THREE.MeshBasicMaterial({map:tx,transparent:true}));pl.position.set(0,15,-4.3);pl.rotation.y=Math.PI;g.add(pl);const pb=new THREE.Mesh(pl.geometry,pl.material);pb.position.set(0,15,4.3);g.add(pb);
    sc.add(g);heads[o]={ls,cv,tx,last:''}});
  // pedestrian lamps
  const pls=[];[0,1,2,3].forEach(k=>[[222,204],[378,204]].forEach(([a,b])=>{let p=[a,b];for(let i=0;i<k;i++)p=[600-p[1],p[0]];
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,8,6),lm(0x202327));pole.position.set(p[0]-300,4,p[1]-300);
    const m=new THREE.Mesh(gm(3,5,3),bas(0xff4a42));m.position.set(p[0]-300,9,p[1]-300);sc.add(pole,m);pls.push(m)}));
  // vehicles
  const glass=lm(0x16202c),hlM=bas(0xfff4b8),brOn=bas(0xff2a2a),brOff=bas(0x5a0e0e),inOn=bas(0xffb21c),inOff=bas(0x3a2a08),red=bas(0xff2b2b),blue=bas(0x2b7bff);
  const cone=new THREE.Mesh(new THREE.ConeGeometry(14,75,14,1,true),bas(0xfff0b0,{transparent:true,opacity:.13,depthWrite:false,blending:THREE.AdditiveBlending}));
  const wheelG=new THREE.CylinderGeometry(2.4,2.4,1.8,10);
  const dk=lm(0x15171a),chr=lm(0xb9bec4),plW=lm(0xf4f4f4),plY=lm(0xf1c40f),tire=lm(0x0f1012),rimM=lm(0xaab0b6),hlA=bas(0xffffff);
  const pmC={},pm=hex=>pmC[hex]||(pmC[hex]=new THREE.MeshPhongMaterial({color:hex,shininess:70,specular:0x555555}));
  const glassP=new THREE.MeshPhongMaterial({color:0x0e1822,shininess:120,specular:0x99aabb});
  const exC={};
  const ex=(key,pts,W,bv)=>exC[key]||(exC[key]=(()=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;pts.forEach(([x,y])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)});
    const sx=(x1-x0-2*bv)/(x1-x0),sy=(y1-y0-2*bv)/(y1-y0),sh=new THREE.Shape();
    pts.forEach(([x,y],i)=>{const X=x0+bv+(x-x0)*sx,Y=y0+bv+(y-y0)*sy;i?sh.lineTo(X,Y):sh.moveTo(X,Y)});
    const dp=Math.max(.2,W-2*bv),ge=new THREE.ExtrudeGeometry(sh,{depth:dp,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:2,steps:1});ge.translate(0,0,-dp/2);return ge})());
  const spokeG=r=>GC['sp'+r]||(GC['sp'+r]=new THREE.BoxGeometry(r*1.2,.55,.5));
  const mkWheel=r=>{const w=new THREE.Group();
    const tr=new THREE.Mesh(GC['wt'+r]||(GC['wt'+r]=new THREE.CylinderGeometry(r,r,2.4,16)),tire);tr.rotation.x=Math.PI/2;tr.castShadow=true;
    const rm=new THREE.Mesh(GC['wr'+r]||(GC['wr'+r]=new THREE.CylinderGeometry(r*.64,r*.64,2.6,14)),rimM);rm.rotation.x=Math.PI/2;w.add(tr,rm);
    [0,1,2].forEach(i=>[1.35,-1.35].forEach(z=>{const s=new THREE.Mesh(spokeG(r),dk);s.rotation.z=i*Math.PI/3;s.position.z=z;w.add(s)}));return w};
  const shG=new THREE.PlaneGeometry(1,1),shM=new THREE.MeshBasicMaterial({map:glowT,color:0x000000,transparent:true,opacity:.55,depthWrite:false});
  const lodH={bike:14,rick:17,bus:22,truck:22,amb:19,hatch:14,sedan:14,tall:17,suv:16,mpv:17,jeep:18};
  function mkLod(c){const hh=lodH[c.k]||14,m=new THREE.Mesh(gm(c.len,hh-2.6,c.w),pm(parseInt(c.col.slice(1),16)));m.position.set(-c.len/2,2.6+(hh-2.6)/2,0);m.castShadow=true;return m}
  function mkVeh(c){
    const g=new THREE.Group(),L=c.len,W=c.w,b=c.k,hw=W/2,br=[],ind={L:[],R:[]},fl=[],wh=[],y0=2.8;let yI=7;
    const col=pm(parseInt(c.col.slice(1),16)),col2=pm(parseInt(c.col2.slice(1),16));
    const put=(m,x,y,z,rz,ry)=>{m.position.set(x,y,z);if(rz)m.rotation.z=rz;if(ry)m.rotation.y=ry;g.add(m);return m};
    const mesh=(ge,ma,x,y,z)=>{const m=new THREE.Mesh(ge,ma);m.castShadow=true;return put(m,x,y,z)};
    const blob=(x,y,z,sx,sy,sz,ma)=>{const m=new THREE.Mesh(GC.bl||(GC.bl=new THREE.SphereGeometry(1,12,10)),ma);m.scale.set(sx,sy,sz);m.castShadow=true;return put(m,x,y,z)};
    const wheel=(x,z,r,noArch,nz)=>{const w=mkWheel(r);w.position.set(x,r,z);if(nz)w.scale.z=nz;g.add(w);wh.push({w,r});
      if(!noArch){const m=new THREE.Mesh(GC['ar'+r]||(GC['ar'+r]=new THREE.CylinderGeometry(r+1.1,r+1.1,.5,16)),dk);m.rotation.x=Math.PI/2;m.position.set(x,r,z>0?hw-.2:-hw+.2);g.add(m)}};
    const pil=(x1,y1,x2,y2,z,ma,th)=>{const d=Math.hypot(x2-x1,y2-y1),m=B(d,th||.9,th||.9,ma||col);m.position.set((x1+x2)/2,(y1+y2)/2,z);m.rotation.z=Math.atan2(y2-y1,x2-x1);g.add(m)};
    const lamp=(x,y,z,ma,arr,w)=>{const m=new THREE.Mesh(gm(.7,1.3,w||3.6),ma);put(m,x,y,z);if(arr)arr.push(m)};
    const lights=(yh,w,noHead)=>[-1,1].forEach(s=>{if(!noHead)lamp(.1,yh,s*(hw-3.2),hlM,null,w);lamp(-L-.1,yh,s*(hw-3.2),brOff,br,w)});
    const plates=yy=>{put(B(.4,1.7,5.6,plW),.05,yy,0);put(B(.4,1.7,5.6,plY),-L-.05,yy+.2,0)};
    const mirror=(x,y,s)=>{put(B(1.6,1.2,2.2,col),x,y,s*(hw+1.1));put(B(1,.5,1.2,dk),x+.4,y-.3,s*(hw+.3))};
    const PR={hatch:[7.6,14,.30,.50,.80,.955,7.8,0],sedan:[7.4,13.6,.31,.48,.64,.74,7.9,1],tall:[8.2,17,.22,.29,.90,.975,8.6,0],suv:[8.8,16.2,.26,.36,.90,.98,9.2,0],mpv:[8.2,16.8,.21,.33,.92,.985,8.8,0],jeep:[9.4,18.4,.30,.31,.94,.97,9.6,0]}[b];
    if(PR){
      const [hood,roof,ws,rf,rr,bb,tail,sed]=PR,wr=(b=='suv'||b=='jeep'||b=='mpv')?3.5:3.2,Wc=W-2.8,belt=(sed?hood:tail)-.2;
      const lb=[[0,y0],[0,hood-2.3],[-.035*L,hood-1.2],[-.10*L,hood-.25],[-ws*L,hood]];
      if(sed)lb.push([-bb*L,hood],[-(bb+.04)*L,tail],[-.985*L,tail-.3],[-L,tail-1.9]);else lb.push([-bb*L,tail],[-L,tail-1]);
      lb.push([-L,y0]);
      mesh(ex(c.model+'lb',lb,W,1),col,0,0,0);
      mesh(ex(c.model+'gl',[[-ws*L,hood-.2],[-rf*L,roof-.5],[-rr*L,roof-.5],[-bb*L,belt]],Wc,.3),glassP,0,0,0);
      put(B(L*(rr-rf),.9,Wc-.6,col),-L*(rf+rr)/2,roof-.15,0);
      [-1,1].forEach(s=>{const z=s*Wc/2;pil(-ws*L,hood-.2,-rf*L,roof-.4,z);pil(-rr*L,roof-.4,-bb*L,belt,z);const bx=-(rf+rr)*L*.56;pil(bx,hood-.2,bx,roof-.45,z)});
      put(B(.9,1.6,W-1.6,dk),-.3,y0+1.6,0);put(B(.9,1.5,W-1.6,dk),-L+.3,y0+1.5,0);put(B(L*.46,.8,W+.15,dk),-L*.5,y0+.2,0);
      [.40,.62].forEach(f=>put(B(.18,hood-y0-1.3,W+.12,dk),-f*L,y0+.6+(hood-y0-1.3)/2,0));
      [.34,.56].forEach(f=>[-1,1].forEach(s=>put(B(2,.5,.5,chr),-f*L,hood-1.7,s*(hw+.1))));
      [-1,1].forEach(s=>mirror(-ws*L-.6,hood+1.2,s));
      plates(y0+1.9);
      if(b=='jeep'){
        [-1,1].forEach(s=>{const hl=new THREE.Mesh(GC.jh||(GC.jh=new THREE.CylinderGeometry(2.2,2.2,1.2,14)),hlM);hl.rotation.z=Math.PI/2;put(hl,.1,hood-2.4,s*(hw-3.6));put(B(9,.9,2.2,dk),-L*.2,y0+wr*2+.4,s*(hw+.5))});
        for(let i=0;i<7;i++)put(B(.5,3.4,.5,chr),.15,hood-3.4,(i-3)*1.5);
        const sp=new THREE.Mesh(GC.spw||(GC.spw=new THREE.CylinderGeometry(3.4,3.4,2.4,14)),tire);sp.rotation.z=Math.PI/2;put(sp,-L-1.4,y0+hood*.5,0);
      }else{
        [-1,1].forEach(s=>put(B(1.1,1.8,4.8,chr),0,hood-1.8,s*(hw-3.2)));put(B(.7,2.6,W*.5,dk),.05,hood-2.9,0);put(B(.6,.5,W*.46,chr),.12,hood-2,0);
      }
      lights(hood-2.1,4.4,b=='jeep');
      if(b=='suv'||b=='mpv'||b=='jeep')put(new THREE.Mesh(gm(.4,.5,W-3),hlA),.2,hood-.9,0);
      if(b=='suv'||b=='mpv'||b=='jeep')[-1,1].forEach(s=>put(B(L*(rr-rf)*.9,.5,.6,chr),-L*(rf+rr)/2,roof+.7,s*(Wc/2-.4)));
      if(b=='hatch')put(B(2.6,.6,W-5,col),-rr*L-1.2,roof-.2,0);
      if(b=='suv')put(B(2.2,.8,.5,dk),-rf*L-3,roof+.8,0);
      [-L*(b=='jeep'?.17:.2),-L*.78].forEach(x=>[-1,1].forEach(s=>wheel(x,s*(hw-1),wr)));
      yI=hood-.4;
    }
    else if(b=='bike'){
      const rj=pm(parseInt(pick(['#2b3a55','#6b2d2d','#33363b','#3a6b3a']).slice(1),16)),hm=lm(parseInt(pick(['#ececec','#c9463d','#222222']).slice(1),16)),jn=lm(0x2b3a55);
      wheel(-3.4,0,3.6,true,.75);wheel(-L+3.6,0,3.6,true,.75);
      blob(-L*.38,9.4,0,3.8,2,2.2,col);put(B(5.5,4.2,3.4,dk),-L*.5,5.4,0);put(B(7.5,1.5,3.8,lm(0x1d1d1d)),-L*.66,8.2,0);put(B(6,.5,2.8,col),-L+4,8.8,0,.15);
      [-1,1].forEach(s=>pil(-3.4,3.6,-L*.22,11,s*1.4,chr,.6));
      put(B(.7,.7,W+3,dk),-L*.22,11,0);put(B(5,.5,2.2,col),-3.4,7.6,0);blob(-L*.1,9.8,0,1.7,1.7,1.7,hlM);
      const ex2=new THREE.Mesh(GC.exh||(GC.exh=new THREE.CylinderGeometry(.7,.9,8,8)),chr);ex2.rotation.z=Math.PI/2;put(ex2,-L*.66,3.9,1.9);
      put(B(3.4,6.6,5.2,rj),-L*.5,12.6,0,-.28);blob(-L*.4,17.6,0,2.9,2.9,2.9,hm);
      [-1,1].forEach(s=>{pil(-L*.46,14.6,-L*.22,11.4,s*2.5,rj,1);pil(-L*.55,9.4,-L*.35,7.2,s*1.7,jn,1.9);pil(-L*.35,7.2,-L*.4,4.2,s*1.7,jn,1.7)});
      lamp(-L-.1,8.6,0,brOff,br,2.2);
    }
    else if(b=='rick'){
      mesh(ex(c.model+'lb',[[0,y0],[0,6.2],[-3,7.8],[-L*.3,8.4],[-L*.5,8.4],[-L,8.6],[-L,y0]],W,1),col,0,0,0);
      mesh(ex(c.model+'cp',[[-L*.3,8.2],[-L*.36,15.2],[-L*.5,16.6],[-L*.9,16.2],[-L,13.5],[-L,8.2]],W-.4,1),pm(0x161616),0,0,0);
      put(B(.5,6.4,W-3.6,glassP),-L*.325,12,0,.3);blob(-.4,6.4,0,1.5,1.5,1.5,hlM);
      wheel(-3,0,2.9,true);[-1,1].forEach(s=>{wheel(-L+4,s*(hw-1),2.9,true);put(B(7,.6,3,col),-L+4,6.6,s*(hw-1))});
      [-1,1].forEach(s=>{put(B(.8,2,.5,dk),-L*.3,11.6,s*(hw+.4));lamp(-L-.1,7.4,s*(hw-2),brOff,br,2.4)});plates(y0+1.6);
    }
    else if(b=='truck'){
      mesh(ex(c.model+'cab',[[0,y0],[0,9],[-.8,12],[-4.5,17.5],[-16,17.5],[-16,y0]],W-1,1),col,0,0,0);
      put(B(.5,6,W-3.6,glassP),-2.7,14.6,0,.35);put(B(7,4.5,W-.3,glassP),-10,14.4,0);
      const cl=L-19;put(B(cl,17,W,col2),-19-cl/2,y0+9.7,0);
      for(let x=-19;x>-L;x-=9)put(B(.5,17,W+.4,dk),x,y0+9.7,0);put(B(cl,.8,W+.4,dk),-19-cl/2,y0+18.5,0);
      put(B(L-12,2,W-5,dk),-L/2-3,y0+.6,0);put(B(.6,5,W-4,dk),.05,y0+5,0);put(B(1.4,2,W,chr),-.2,y0+1.4,0);
      const st=new THREE.Mesh(GC.stk||(GC.stk=new THREE.CylinderGeometry(.7,.7,12,8)),chr);put(st,-15.5,14,hw-.4);
      [-7,-L+8,-L+17].forEach(x=>[-1,1].forEach(s=>{wheel(x,s*(hw-1),3.7,x==-7);put(B(8,.7,3,dk),x,y0+7.6,s*(hw-.4))}));
      [-1,1].forEach(s=>{put(B(.8,.8,2.4,dk),-4,y0+11,s*(hw+.6));put(B(1,5,.8,dk),-4,y0+11,s*(hw+1.8))});
      lights(y0+5,4);plates(y0+3);yI=y0+5;
    }
    else if(b=='bus'){
      mesh(ex(c.model+'bd',[[0,y0+.5],[0,15],[-1.2,19.2],[-3.5,21],[-L+3,21],[-L,19.5],[-L,y0+.5]],W,1.4),col,0,0,0);
      put(B(L-12,6,W+.5,glassP),-L/2-1,15.5,0);for(let x=-14;x>-L+6;x-=11)put(B(.9,6,W+.55,col),x,15.5,0);
      put(B(.6,10,W-3.5,glassP),-.4,15,0,.1);put(B(L-2,1.4,W+.2,lm(0xffffff)),-L/2,y0+7,0);put(B(.5,2.2,W-8,bas(0xffb21c)),-.2,19.4,0);
      [.14,.62].forEach(f=>put(B(8,13,.5,dk),-f*L,y0+8.5,-hw-.1));
      [.3,.64].forEach(f=>put(B(10,2.2,W-8,lm(0xeeeeee)),-L*f,22,0));
      [-1,1].forEach(s=>{put(B(1,5,.8,dk),-2,y0+13.5,s*(hw+2.6));put(B(.5,.5,2.6,dk),-2,y0+13.5,s*(hw+1.2))});
      put(B(1.6,2,W,dk),-.3,y0+1.2,0);put(B(1.6,2,W,dk),-L+.3,y0+1.2,0);
      [-15,-L+17].forEach(x=>[-1,1].forEach(s=>wheel(x,s*(hw-1),4)));
      plates(y0+3);lights(y0+4,5);yI=y0+9;
    }
    else{
      mesh(ex(c.model+'bd',[[0,y0],[0,8.6],[-4,10.8],[-11,12.6],[-17,17.4],[-L+3,17.6],[-L,16.4],[-L,y0]],W,1.2),pm(0xf4f4f4),0,0,0);
      put(B(.5,7.2,W-3,glassP),-14,15,0,.89);put(B(12,4.2,W+.15,glassP),-L*.42,14,0);
      put(B(L-3,2,W+.2,lm(0xd62b2b)),-L/2,y0+4.6,0);
      [-1,1].forEach(s=>{put(B(4.6,1.3,.2,lm(0xd62b2b)),-L*.72,10.4,s*(hw+.12));put(B(1.3,4.6,.2,lm(0xd62b2b)),-L*.72,10.4,s*(hw+.12))});
      put(B(8,.4,2.6,lm(0xd62b2b)),-L*.6,18.2,0);put(B(2.6,.4,8,lm(0xd62b2b)),-L*.6,18.2,0);
      put(B(2.4,.8,12,dk),-L*.28,18.4,0);[-5,-1.7,1.7,5].forEach(z=>{const m=new THREE.Mesh(gm(2,1.6,2.6),red);put(m,-L*.28,19.4,z);fl.push(m)});
      [-L*.2,-L*.8].forEach(x=>[-1,1].forEach(s=>wheel(x,s*(hw-1),3.7)));put(B(1.4,1.6,W-1,dk),-.3,y0+1.4,0);put(B(1.4,1.6,W-1,dk),-L+.3,y0+1.4,0);
      lights(y0+4.5,4);plates(y0+2.4);yI=y0+5;
    }
    if(b!='bike'&&b!='rick')[-1,1].forEach(s=>{lamp(.1,yI,s*(hw-.6),inOff,s<0?ind.L:ind.R,1.6);lamp(-L-.1,yI,s*(hw-.6),inOff,s<0?ind.L:ind.R,1.6)});
    const sd=new THREE.Mesh(shG,shM);sd.rotation.x=-Math.PI/2;sd.scale.set(L*1.12,W*1.45,1);sd.position.set(-L/2,.08,0);g.add(sd);
    const cn=cone.clone();cn.rotation.z=Math.PI/2;cn.position.set(37.5,b=='bike'?7:b=='bus'?y0+3:y0+5,0);g.add(cn);
    g.userData={br,ind,fl,cn,wh};return g}
  const cars=new Map(),peds=new Map(),pg=new THREE.CylinderGeometry(1.4,1.4,5.5,8),hg=new THREE.SphereGeometry(1.5,8,6);
  let curN=null,curL=0;

  // ---- ambient flyover traffic ----
  const rcars=[];
  const mkSimple=()=>{const g=new THREE.Group(),bc=pick([0xc43b2f,0xf4f4f4,0x2f4f7f,0x8a8d91,0xe5e5e5,0x1d1d21,0xf0c22d]);
    const bd=B(38,6,17,bc);bd.position.set(-19,4.5,0);const cb=B(20,5,14,0x16202c);cb.position.set(-19,9.5,0);g.add(bd,cb);
    [-5,5].forEach(z=>{const hl=new THREE.Mesh(gm(.7,1.3,3.6),hlM);hl.position.set(-.3,5,z);const tl=new THREE.Mesh(gm(.7,1.3,3.6),brOn);tl.position.set(-37.7,5,z);g.add(hl,tl)});
    const w=wheelG;[-9,-30].forEach(x=>[-8,8].forEach(z=>{const m=new THREE.Mesh(w,lm(0x111214));m.rotation.x=Math.PI/2;m.position.set(x,2.4,z);g.add(m)}));return g};
  for(let i=0;i<20;i++)[1,-1].forEach(dir=>{const g=mkSimple();sc.add(g);rcars.push({g,dir,th:(i/20)*Math.PI*2+(dir>0?0:.16),sp:(dir>0?58:64)/RR})});
  // ---- centre medians, lamps, signs, walkers, clouds ----
  for(let k=0;k<4;k++){
    const q=rot(300,92,k),ry=k%2?Math.PI/2:0;
    const mb=B(6,1.4,182,0xa7a79e);mb.position.set(q[0],.7,q[1]);mb.rotation.y=ry;sc.add(mb);
    const mg=B(4,1,180,0x4c7a43);mg.position.set(q[0],1.6,q[1]);mg.rotation.y=ry;sc.add(mg);
    for(let i=0;i<6;i++){const q2=rot(300,12+i*30,k),sh=new THREE.Mesh(shrG,lm(0x2f6b3a));sh.position.set(q2[0],4.2,q2[1]);sc.add(sh)}
    [45,125].forEach(yy=>{const q3=rot(300,yy,k);lampAt(sc,q3[0],q3[1])});
  }
  const spT=(()=>{const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');x.fillStyle='#fff';x.beginPath();x.arc(48,48,46,0,7);x.fill();x.strokeStyle='#d62b2b';x.lineWidth=9;x.beginPath();x.arc(48,48,40,0,7);x.stroke();x.fillStyle='#111';x.font='700 44px Barlow Condensed,sans-serif';x.textAlign='center';x.fillText('40',48,62);return new THREE.CanvasTexture(c)})();
  for(let k=0;k<4;k++){const q=rot(367,95,k),gp=new THREE.Group();gp.position.set(q[0],0,q[1]);gp.rotation.y=-k*Math.PI/2;
    const po=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,26,6),lm(0x777b80));po.position.y=13;gp.add(po);
    const sp=new THREE.Mesh(new THREE.CircleGeometry(5.5,24),new THREE.MeshBasicMaterial({map:spT,side:THREE.DoubleSide}));sp.position.set(0,24,-.8);sp.rotation.y=Math.PI;gp.add(sp);sc.add(gp)}
  const clouds=[];for(let i=0;i<10;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:0xffffff,transparent:true,opacity:.55,depthWrite:false,fog:false}));sp.scale.set(300+Math.random()*300,90,1);sp.position.set(-1500+Math.random()*3000,420+Math.random()*160,-1500+Math.random()*2400);sc.add(sp);clouds.push(sp)}
  const police=(()=>{const g=new THREE.Group(),sk=lm(0xe0b48a),kh=lm(0xcdbb8c),nav=lm(0x2a3550),hv=bas(0xff8a1c),wt=lm(0xf2f2f2),blk=lm(0x111111);
    const bx=(w,h,d,m,x,y,z,p)=>{const o=B(w,h,d,m);o.position.set(x,y,z);(p||g).add(o);return o};
    const legs=[-1,1].map(s=>{const l=new THREE.Group();l.position.set(s*1.6,8,0);bx(2.2,8,2.4,nav,0,-4,0,l);bx(2.4,1.2,3.8,blk,0,-8.4,.7,l);g.add(l);return l});
    bx(5.8,.6,3.2,blk,0,8.3,0);bx(5.6,6.4,3.2,kh,0,11.7,0);bx(5.9,4.6,3.5,hv,0,12.1,0);bx(6,.5,3.6,wt,0,11,0);bx(6,.5,3.6,wt,0,13.3,0);
    const hd=new THREE.Mesh(new THREE.SphereGeometry(2,12,10),sk);hd.position.y=16.6;hd.castShadow=true;g.add(hd);
    const cp=new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.3,1.5,14),wt);cp.position.y=18.1;g.add(cp);bx(3.2,.3,2,blk,0,17.6,1.9);
    const arm=s=>{const a=new THREE.Group();a.position.set(s*3.6,14.4,0);bx(1.7,6.6,1.9,kh,0,-3.3,0,a);const gl=new THREE.Mesh(new THREE.SphereGeometry(1.15,8,6),wt);gl.position.y=-7;a.add(gl);g.add(a);return a};
    const aR=arm(-1),aL=arm(1);const bt=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,7,8),wt);bt.rotation.x=Math.PI/2;bt.position.set(0,-7,2.6);aR.add(bt);
    const bnd=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,1.6,8),bas(0xd62b2b));bnd.rotation.x=Math.PI/2;bnd.position.set(0,-7,1);aR.add(bnd);
    g.scale.setScalar(1.15);g.visible=false;sc.add(g);return {g,legs,aR,aL}})();
  const wlk=[];for(let i=0;i<10;i++){const g=new THREE.Group(),b=new THREE.Mesh(pg,lm([0xffe9a8,0x9fd6ff,0xffb3a7,0xc9f5c1][i%4])),hd=new THREE.Mesh(hg,lm(0xe0b48a));b.position.y=2.8;hd.position.y=6.9;g.add(b,hd);g.scale.setScalar(1.7);sc.add(g);wlk.push({g,k:i%4,side:i%2?366:234,ph:Math.random()*6,sp:.15+Math.random()*.12,y0:25+(i*13)%60})}
  // ---- monitoring overlays: queue bars + junction zone ----
  const qb=[];O.forEach((o,k)=>{const gp=new THREE.Group();gp.rotation.y=-k*Math.PI/2;sc.add(gp);[0,1,2].forEach(ln=>{const m=new THREE.Mesh(gm(1,.8,1),new THREE.MeshBasicMaterial({color:0x2fe07d,transparent:true,opacity:.5,depthWrite:false}));m.position.set(345-30*ln-300,.6,-104);m.scale.set(24,1,1);gp.add(m);qb.push({m,o,ln})})});
  const zone=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshBasicMaterial({color:0x2fe07d,transparent:true,opacity:.18,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.position.y=.45;sc.add(zone);
  // ---- rain ----
  const NR=2500,rp=new Float32Array(NR*6);for(let i=0;i<NR;i++){const x=(Math.random()-.5)*900,y=Math.random()*400,z=(Math.random()-.5)*900;rp.set([x,y,z,x,y-9,z],i*6)}
  const rgm=new THREE.BufferGeometry();rgm.setAttribute('position',new THREE.BufferAttribute(rp,3));
  const rain=new THREE.LineSegments(rgm,new THREE.LineBasicMaterial({color:0xaec6e0,transparent:true,opacity:.45}));rain.visible=false;rain.frustumCulled=false;sc.add(rain);
  // ---- time of day ----
  const cD=new THREE.Color(0xa9cbe8),cNg=new THREE.Color(0x070b14),aD=new THREE.Color(0xffffff),aN=new THREE.Color(0x8ea3d6),sD=new THREE.Color(0xfff3dc),sN=new THREE.Color(0x9fb4ff),oD=new THREE.Color(0xffffff),oN=new THREE.Color(0x1a2a1e),tmpC=new THREE.Color();
  function applyF(S){
    const hh=S.hour,f=hh>=6&&hh<=18?Math.min(1,Math.sin((hh-6)/12*Math.PI)*1.7):0,n=f<.3;
    tmpC.copy(cNg).lerp(cD,f);sc.background.copy(tmpC);sc.fog.color.copy(tmpC);
    amb.intensity=.42+.33*f;amb.color.copy(aN).lerp(aD,f);sun.intensity=.3+.65*f;sun.color.copy(sN).lerp(sD,f);
    const a=Math.PI*(hh-6)/12;sun.position.set(-420*Math.cos(a),Math.max(90,420*Math.sin(a)+60),180);
    outer.material.color.copy(oN).lerp(oD,f);armMat.color.setScalar(.4+.6*f);
    if(n!==curN||S.NL!==curL){gmat.map=T(n,S.NL);armMat.map=armT(S.NL);armMat.needsUpdate=true;gmat.needsUpdate=true;bm.forEach(m=>m.emissive.setHex(n?0xffffff:0));lamps.forEach(l=>{l.light.intensity=n?1:0;l.bulb.material.color.setHex(n?0xffe2a3:0x777777)});
      medL.forEach(m=>{m.gl.visible=n;m.bu.material.color.setHex(n?0xffe2a3:0x777777)});sky.material.map=skyT[n];sky.material.needsUpdate=true;clouds.forEach(c=>c.visible=!n);curN=n;curL=S.NL}
  }
  // ---- camera ----
  let th=.9,ph=.95,rad=420,mode='free',followId=null,lk=0,lp=0,lastN=performance.now();
  const ps=new Map(),tgt=new THREE.Vector3(),cm=()=>{cam.position.set(rad*Math.sin(ph)*Math.sin(th),rad*Math.cos(ph),rad*Math.sin(ph)*Math.cos(th));cam.lookAt(0,0,0)};
  const dn=e=>{mode=mode=='orbit'||mode=='drive'?mode:'free';ps.set(e.pointerId,[e.clientX,e.clientY]);R.domElement.setPointerCapture(e.pointerId)};
  const mv=e=>{const p=ps.get(e.pointerId);if(!p)return;if(mode=='drive'){lk-=(e.clientX-p[0])*.005;lp=Math.max(-.7,Math.min(.7,lp-(e.clientY-p[1])*.004));ps.set(e.pointerId,[e.clientX,e.clientY]);return}
    if(ps.size==1){th-=(e.clientX-p[0])*.006;ph=Math.min(1.5,Math.max(.02,ph-(e.clientY-p[1])*.005))}
    else if(ps.size==2){const o=[...ps].find(([id])=>id!=e.pointerId)[1],d0=Math.hypot(p[0]-o[0],p[1]-o[1]),d1=Math.hypot(e.clientX-o[0],e.clientY-o[1]);if(d1>0)rad=Math.min(3600,Math.max(70,rad*d0/d1))}
    ps.set(e.pointerId,[e.clientX,e.clientY]);if(mode!='follow')cm()};
  const up=e=>ps.delete(e.pointerId),wh=e=>{e.preventDefault();if(mode=='drive')return;rad=Math.min(3600,Math.max(70,rad*Math.exp(e.deltaY*.001)));if(mode!='follow')cm()};
  const d=R.domElement;d.addEventListener('pointerdown',dn);d.addEventListener('pointermove',mv);d.addEventListener('pointerup',up);d.addEventListener('pointercancel',up);d.addEventListener('wheel',wh,{passive:false});
  const rs=()=>{const w=el.clientWidth||innerWidth,h=el.clientHeight||innerHeight;R.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();if(cam.aspect<.8)rad=Math.max(rad,560)};
  addEventListener('resize',rs);rs();cm();
  function update(S,E){
    const nowT=performance.now(),fdt=Math.min(.1,(nowT-lastN)/1000)*(S.sp||1);lastN=nowT;
    applyF(S);{const fv=mode=='drive'?72:48;if(cam.fov!=fv){cam.fov=fv;cam.updateProjectionMatrix()}}
    const blink=Math.floor(S.t*2)%2,n=S.night;
    O.forEach(o=>{const e=E[o],hd=heads[o],st=e.st,cols=[0xff4a42,0xffb21c,0x2fe07d],on=[st=='F'?!!blink:st=='R',st=='Y',st=='G'];
      hd.ls.forEach((m,i)=>m.material.color.setHex(on[i%3]?cols[i%3]:0x222222));
      const key=st+e.s;if(hd.last!=key){hd.last=key;const x=hd.cv.getContext('2d');x.fillStyle='#08090a';x.fillRect(0,0,96,48);
        if(st!='F'){x.fillStyle=st=='R'?'#ff6a60':st=='G'?'#4be28a':'#ffb21c';x.font='700 38px "Barlow Condensed",sans-serif';x.textAlign='center';x.fillText((st=='R'?'~':'')+e.s,48,38)}hd.tx.needsUpdate=true}});
    const wkp=S.mode=='P'&&!S.fault,pc=!wkp?0xff4a42:S.pt<5?0x2fe07d:(blink?0xff4a42:0x4a1512);pls.forEach(m=>m.material.color.setHex(pc));
    const seen=new Set();
    S.cars.forEach(c=>{let g=cars.get(c.id);if(!g){g=new THREE.Group();g.userData={lod:mkLod(c),full:null};g.add(g.userData.lod);cars.set(c.id,g);sc.add(g)}seen.add(c.id);
      const [px,py,an]=pose(c);g.position.set(px-300,0,py-300);g.rotation.y=-an;g.scale.z=S.NL>2?Math.min(1,18.5/c.w):1;const u=g.userData;
      const near=cam.position.distanceTo(g.position)<640;
      if(near&&!u.full){u.full=mkVeh(c);g.add(u.full)}
      if(u.full)u.full.visible=near;u.lod.visible=!near;
      if(near&&u.full){const f=u.full.userData,bo=c.br||c.v<3;f.br.forEach(m=>m.material=bo?brOn:brOff);
        const tn=c.t!='S'&&c.s<BOX0+30&&Math.floor(S.t*3)%2;f.ind.L.forEach(m=>m.material=tn&&c.t=='L'?inOn:inOff);f.ind.R.forEach(m=>m.material=tn&&c.t=='R'?inOn:inOff);
        f.fl.forEach((m,i)=>m.material=(Math.floor(S.t*6)+i)%2?red:blue);f.cn.visible=n;f.wh.forEach(o=>{o.w.rotation.z-=c.v*fdt/o.r})}});
    cars.forEach((g,id)=>{if(!seen.has(id)){sc.remove(g);cars.delete(id)}else g.visible=!(mode=='drive'&&id==followId)});
    const sp=new Set();
    S.peds.forEach(p=>{let g=peds.get(p);if(!g){g=new THREE.Group();const b=new THREE.Mesh(pg,lm(parseInt(PCOL[p.col].slice(1),16)));b.position.y=2.8;b.castShadow=true;const hd=new THREE.Mesh(hg,lm(0xe0b48a));hd.position.y=6.9;g.add(b,hd);g.scale.setScalar(1.7);peds.set(p,g);sc.add(g)}
      sp.add(p);const px=p.sd?366-p.u*132:234+p.u*132,q=rot(px,219+p.j,p.k);g.position.set(q[0],0,q[1])});
    peds.forEach((g,p)=>{if(!sp.has(p)){sc.remove(g);peds.delete(p)}});
    qb.forEach(({m,o,ln})=>{if(!S.ov.queues||ln>=NL){m.visible=false;return}m.position.x=360-LW*(ln+.5)-300;m.scale.x=LW*.8;let len=0;S.cars.forEach(c=>{if(c.o==o&&c.ln==ln&&c.v<5&&c.s<STOP&&c.s>STOP-500)len=Math.max(len,STOP-(c.s-c.len))});
      m.visible=len>0;m.scale.z=Math.max(1,len);m.position.z=-104-len/2;m.material.color.setHex(len<80?0x2fe07d:len<180?0xffb21c:0xff4a42)});
    zone.visible=!!S.ov.zone;zone.material.color.setHex(S.conf?0xff4a42:S.empty?0x2fe07d:0xffb21c);
    {const P=S.pol;
     if(P.st=='off')police.g.visible=false;else{
      police.g.visible=true;const k=P.arm,A=rot(366,150,k),Bp=rot(366,232,k),mv=P.st=='walk'||P.st=='back',u=P.st=='walk'?Math.min(1,P.t/5):P.st=='back'?1-Math.min(1,P.t/5):1;
      police.g.position.set(A[0]+(Bp[0]-A[0])*u,0,A[1]+(Bp[1]-A[1])*u);
      if(mv){const sg=P.st=='walk'?1:-1;police.g.rotation.y=Math.atan2((Bp[0]-A[0])*sg,(Bp[1]-A[1])*sg)}else police.g.rotation.y=Math.atan2(-Bp[0],-Bp[1]);
      const sw=mv?Math.sin(S.t*10)*.7:0;police.legs[0].rotation.x=sw;police.legs[1].rotation.x=-sw;
      if(mv){police.aR.rotation.set(-sw*.6,0,0);police.aL.rotation.set(sw*.6,0,0)}
      else{police.aR.rotation.set(-1.2+.5*Math.sin(S.t*6),0,-.45);police.aL.rotation.set(-1.55,0,.12)}}}
    rcars.forEach(rc=>{rc.th+=rc.dir*rc.sp*fdt;const r=RR+(rc.dir>0?14:-14),a=rc.th;rc.g.position.set(r*Math.sin(a),25.5,-r*Math.cos(a));rc.g.rotation.y=rc.dir>0?-a:-(a+Math.PI)});
    wlk.forEach(w=>{const yy=w.y0+(Math.sin(S.t*w.sp+w.ph)*.5+.5)*85,q=rot(w.side,yy,w.k);w.g.position.set(q[0],Math.abs(Math.sin(S.t*6+w.ph))*.5,q[1])});
    clouds.forEach(c=>{c.position.x+=.05;if(c.position.x>1600)c.position.x=-1600});
    if(S.rain){rain.visible=true;rain.position.set(cam.position.x,0,cam.position.z);for(let i=0;i<NR;i++){let y=rp[i*6+1]-fdt*420;if(y<0)y+=400;rp[i*6+1]=y;rp[i*6+4]=y-9}rgm.attributes.position.needsUpdate=true}else rain.visible=false;
    if(mode=='orbit'){th+=fdt*.12;cm()}
    else if(mode=='drive'){const g=cars.get(followId),c=S.cars.find(q=>q.id==followId);if(!g||!c){mode='free';[th,ph,rad]=V.aerial;cm()}else{const a0=-g.rotation.y,fx=Math.cos(a0),fz=Math.sin(a0),p=g.position,hh={bike:17,rick:13,bus:22,truck:20,amb:16,suv:12,jeep:12,mpv:12,tall:12}[c.k]||10,bk=c.len*.38,sd=c.w*.2;cam.position.set(p.x-fx*bk-fz*sd,hh,p.z-fz*bk+fx*sd);const a=a0+lk;cam.lookAt(cam.position.x+Math.cos(a)*100,hh-3+lp*100,cam.position.z+Math.sin(a)*100)}}
    else if(mode=='follow'){const g=cars.get(followId);if(!g)mode='free';else{const a=-g.rotation.y,fx=Math.cos(a),fz=Math.sin(a),p=g.position;tgt.set(p.x-fx*58,p.y+30,p.z-fz*58);cam.position.lerp(tgt,.1);cam.lookAt(p.x+fx*30,p.y+5,p.z+fz*30)}}
    R.render(sc,cam)}
  const V={aerial:[.9,.95,420],top:[0,.02,650],street:[Math.PI*.2,1.38,200],world:[.6,.85,2600],orbit:[.9,1.05,520]};
  return {update,view:k=>{mode=k=='orbit'?'orbit':'free';[th,ph,rad]=V[k];cm()},follow:id=>{mode='follow';followId=id},drive:id=>{mode='drive';followId=id;lk=0;lp=0},mode:()=>mode,fid:()=>followId,dispose:()=>{removeEventListener('resize',rs);d.remove();R.dispose()}};
}
function vms(e,S,o,q){
  if(S.pol&&S.pol.st=='dir')return O.indexOf(o)==S.pol.arm?['GO','Police waves ambulance through']:['STOP','Police directing traffic'];
  if(S.fault)return ['STOP','Signal fault: treat as all-way stop'];
  if(S.pre>=0&&S.pre!=O.indexOf(o)&&e.st!='G')return ['GIVE WAY','Ambulance approaching on cross road'];
  if(S.mode=='P')return ['WAIT '+e.s+' s','People crossing. Stay behind the line'];
  if(e.st=='G')return ['GO','Green ends in '+e.s+' s'];
  if(e.st=='Y')return ['SLOW','Red in '+e.s+' s'];
  return ['WAIT '+e.s+' s','Red for 60 s. Stay behind the line'];
}
const TABS=[['ov','Overview'],['sg','Signals'],['tr','Traffic'],['pp','People'],['sf','Safety'],['ch','Charts'],['ct','Control'],['cm','Camera']];
const ACOL=['#4fa3ff','#ffb21c','#2fe07d','#d77bff'];
const clk=hh=>{const m=Math.floor(hh*60);return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const POLTXT={off:'On standby',walk:'Moving to the junction',dir:'Directing traffic',back:'Returning to the kerb'};
const BODY={hatch:'Hatchback',tall:'Hatchback',sedan:'Sedan',suv:'SUV',jeep:'Jeep-style SUV',mpv:'MPV',rick:'Auto-rickshaw',bike:'Motorbike',truck:'Truck',bus:'Bus',amb:'Ambulance'};
function snapOf(s,g){const E={};O.forEach(o=>E[o]=est(s,o));
  const cs=s.cars,lq=O.map(o=>lanesOf().map(l=>cs.filter(c=>c.o==o&&c.ln==l&&c.v<8&&c.s<STOP&&c.s>STOP-400).length));
  const mc={};cs.forEach(c=>{if(c.s>-200){const nm=BODY[c.k]||'Car';mc[nm]=(mc[nm]||0)+1}});const am=cs.find(c=>c.amb);
  const fc=g&&g.mode()=='drive'?s.cars.find(c=>c.id==g.fid()):null;return {NL:s.NL,drv:fc?{v:Math.round(fc.v*.36),n:fc.model}:null,sig:s.sig,E,cur:s.cur,mode:s.mode,pt:s.pt,t:s.t,lq,q:Object.fromEntries(O.map((o,i)=>[o,lq[i].reduce((a,b)=>a+b,0)])),
    pw:s.peds.filter(p=>p.st=='w').length,pwk:[0,1,2,3].map(k=>s.peds.filter(p=>p.k==k&&p.st=='w').length),crossed:s.crossed,pedRate:s.pedRate,
    passed:s.passed,avgW:s.avgW,blocked:s.blocked,log:s.log,fault:s.fault,conf:s.conf,night:s.night,sp:s.sp,rate:s.rate,labels:s.labels,
    mix:Object.entries(mc).sort((a,b)=>b[1]-a[1]),nc:cs.length,spd:cs.length?cs.reduce((a,c)=>a+c.v,0)/cs.length*.36:0,
    score:Math.round(s.score),viol:s.viol,confN:s.confN,hour:s.hour,auto:s.auto,rain:s.rain,ov:Object.assign({},s.ov),gr:s.gr,pedOn:s.pedOn,
    amb:am?{o:am.o,grant:s.emgGrant}:null,pol:s.pol.st,done:s.done.slice(),hist:s.hist.slice(),mis:MIS.map(m=>[m.n,m.val(s),m.goal,m.pts])}}
function Chart(series,colors,mx,unit){const W=300,H=64,n=Math.max(2,...series.map(s=>s.length)),m=mx||Math.max(1,...series.map(s=>Math.max(0,...s)));
  return h('svg',{viewBox:'0 0 '+W+' '+H,style:{width:'100%',height:H,background:'rgba(0,0,0,.18)',borderRadius:6}},
    series.map((s,i)=>h('polyline',{key:i,fill:'none',stroke:colors[i],strokeWidth:1.6,points:s.map((v,j)=>(j/(n-1)*W).toFixed(1)+','+(H-3-v/m*(H-8)).toFixed(1)).join(' ')})),
    h('text',{x:4,y:11,fill:'#9aa0a6',fontSize:9},'max '+Math.round(m)+(unit||'')))}
const Bar=(p,c)=>h('div',{className:'bar'},h('i',{style:{width:Math.min(100,Math.max(0,p*100))+'%',background:c||'var(--y)'}}));
function drawMini(c,S){
  if(!c)return;const x=c.getContext('2d'),W=c.width,k=W/4000,m=W/2;
  x.fillStyle='#0d1216';x.fillRect(0,0,W,W);x.strokeStyle='#39424b';x.lineWidth=5;x.beginPath();x.arc(m,m,1000*k,0,7);x.stroke();
  x.lineWidth=4;x.beginPath();x.moveTo(m,m-1800*k);x.lineTo(m,m+1800*k);x.moveTo(m-1800*k,m);x.lineTo(m+1800*k,m);x.stroke();
  x.fillStyle='#2a3036';x.fillRect(m-6,m-6,12,12);
  S.cars.forEach(c=>{const p=pose(c);x.fillStyle=c.amb?'#ff4a42':ACOL[O.indexOf(c.o)];x.fillRect(m+(p[0]-300)*k-1,m+(p[1]-300)*k-1,2.5,2.5)});
  O.forEach((o,i)=>{const sg=S.sig[o],p=[[0,-12],[12,0],[0,12],[-12,0]][i];x.fillStyle=sg=='G'?'#2fe07d':sg=='Y'?'#ffb21c':'#ff4a42';x.beginPath();x.arc(m+p[0],m+p[1],3,0,7);x.fill()});
}
function CrossroadsApp(){
  const mt=useRef(),mm=useRef(),G=useRef(null),S=useRef(null);if(!S.current){S.current=mk();warm(S.current)}
  const [u,setU]=useState(()=>snapOf(S.current)),[open,setOpen]=useState(true),[tab,setTab]=useState('ov');
  useEffect(()=>{
    const g=init3d(mt.current);G.current=g;let last=performance.now(),raf,acc=0,fr=0;
    const loop=now=>{const dt=Math.min((now-last)/1000,.1);last=now;const s=S.current;for(let i=0;i<s.sp;i++)tick(s,dt);
      const E={};O.forEach(o=>E[o]=est(s,o));g.update(s,E);if(++fr%6==0)drawMini(mm.current,s);acc+=dt;if(acc>.25){acc=0;setU(snapOf(s,g))}raf=requestAnimationFrame(loop)};
    raf=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(raf);g.dispose()}},[]);
  const s=S.current,snapNow=()=>setU(snapOf(S.current,G.current)),setS=(k,v)=>{S.current[k]=v;snapNow()};
  const cyc=u.gr+YL+AR,tot=4*cyc+(u.pedOn?PW:0),base=u.cur*cyc;
  const tc=u.mode=='G'?base+u.pt:u.mode=='Y'?base+u.gr+u.pt:u.mode=='R'?base+u.gr+YL+u.pt:4*cyc+u.pt;
  const dur={G:u.gr,Y:YL,R:AR,P:PW}[u.mode],phName=u.mode=='G'?NM[O[u.cur]]+' approach green':u.mode=='Y'?NM[O[u.cur]]+' approach amber':u.mode=='R'?'All red: clearing junction':'Pedestrian walk';
  const pedTxt=u.mode=='P'?(u.pt<5?'WALK '+Math.ceil(5-u.pt)+' s':'Finish crossing. Do not start'):'Do not walk';
  const redLen=4*AR+3*(u.gr+YL)+(u.pedOn?PW:0);
  const vb=(k,l)=>h('button',{key:k,onClick:()=>{G.current&&G.current.view(k);snapNow()}},l);
  const tg=(on,l,f)=>h('button',{className:'tog'+(on?' on':''),onClick:f},l);
  const chLanes=n=>{const t=S.current;if(t.NL==n)return;setLanes(t,n);lg(t,n==3?'Road widened to 6 lanes (3 per direction).':'Road set to 4 lanes (2 per direction).');snapNow()};
  const drive=()=>{const c=s.cars.filter(c=>c.s>STOP-420&&c.s<STOP-40).sort(()=>Math.random()-.5)[0]||s.cars.find(c=>c.s>-600);if(c&&G.current){G.current.drive(c.id);snapNow()}};
  const follow=()=>{const c=s.cars.filter(c=>c.s>STOP-300&&c.s<BOX0+200).sort(()=>Math.random()-.5)[0]||s.cars.find(c=>c.s>0);if(c&&G.current){G.current.follow(c.id);snapNow()}};
  const kv=(a,b)=>h('div',{className:'kv',key:a},h('span',null,a),h('b',null,b));
  const boards=h('div',{className:'vms'},O.map(o=>{const m=vms(u.E[o],s,o),st=u.fault?'R':u.E[o].st;
    return h('div',{key:o,className:'sign '+st},h('div',{className:'dir'},h('span',null,'FROM '+NM[o].toUpperCase()),h('span',null,u.q[o]+' queued')),h('div',{className:'big'},m[0]),h('div',{className:'msg'},m[1]))}));
  const safeRow=h('div',{className:'safe'+(u.conf||u.fault?' bad':'')},h('span',{className:'dot'}),h('span',null,u.fault?'Interlock tripped':u.conf?'Conflict in junction':'Conflict monitor: safe'));
  const logUl=n=>h('ul',{className:'log'},u.log.slice(0,n).map((l,i)=>h('li',{key:i+l},l)));
  const panes={
    ov:()=>[boards,h('div',{key:'a',className:'strip'},h('span',null,u.fault?'Flashing red':phName),h('span',null,Math.floor(u.pt)+' s')),Bar(u.pt/dur),
      h('div',{key:'b',className:'strip',style:{marginBottom:4,fontSize:13}},h('span',null,'People: '+pedTxt),h('span',null,u.pw+' waiting')),
      h('div',{key:'p',className:'strip',style:{marginBottom:8,fontSize:13}},h('span',null,'Traffic police: '+POLTXT[u.pol])),safeRow,
      h('div',{key:'c',className:'stats'},h('div',null,h('b',null,u.passed),'cars cleared'),h('div',null,h('b',null,u.crossed),'people crossed'),h('div',null,h('b',null,u.avgW.toFixed(1)+' s'),'average wait'),h('div',null,h('b',null,u.blocked),'faults blocked')),logUl(3)],
    sg:()=>[h('div',{key:'a',className:'h4'},'SIGNAL CYCLE ('+tot.toFixed(1)+' s)'),
      O.map((o,i)=>h('div',{key:o,style:{display:'flex',gap:6,alignItems:'center'}},h('small',{style:{width:12,color:ACOL[i]}},o),h('div',{className:'tl',style:{flex:1}},
        h('i',{style:{left:(i*cyc/tot*100)+'%',width:(u.gr/tot*100)+'%',background:'var(--g)'}}),h('i',{style:{left:((i*cyc+u.gr)/tot*100)+'%',width:(YL/tot*100)+'%',background:'var(--y)'}}),
        u.pedOn&&h('i',{style:{left:(4*cyc/tot*100)+'%',width:(PW/tot*100)+'%',background:'#4fa3ff'}}),h('u',{style:{left:Math.min(99.5,tc/tot*100)+'%'}})))),
      h('small',{key:'l',style:{color:'var(--mute)'}},'green · amber · red · blue = people crossing'),
      h('div',{key:'b',className:'h4'},'TIMING PLAN'),
      h('label',{key:'c'},'Green per approach: '+u.gr+' s',h('input',{type:'range',min:5,max:25,value:u.gr,onChange:e=>setS('gr',+e.target.value)})),
      kv('Red time per approach',redLen.toFixed(1)+' s'),kv('Amber',YL+' s'),kv('All-red gap',AR+' s'),
      h('div',{key:'d',className:'row'},tg(u.pedOn,'People walk phase: '+(u.pedOn?'ON':'OFF'),()=>setS('pedOn',!u.pedOn))),
      h('div',{key:'e',className:'h4'},'APPROACHES'),
      h('div',{key:'f',className:'cards4'},O.map((o,i)=>{const e=u.E[o];return h('div',{key:o,style:{borderColor:ACOL[i]}},NM[o],h('b',{style:{color:e.st=='G'?'var(--g)':e.st=='Y'?'var(--y)':'var(--r)'}},e.st=='F'?'!':(e.st=='R'?'~':'')+e.s),e.st=='G'?'GO':e.st=='Y'?'SLOW':e.st=='F'?'FAULT':'WAIT')}))],
    tr:()=>[h('div',{key:'a',className:'h4'},'QUEUES BY LANE'),O.map((o,i)=>h('div',{key:o},h('div',{className:'kv'},h('span',{style:{color:ACOL[i]}},NM[o]),h('b',null,u.lq[i].map((n,j)=>'L'+(j+1)+': '+n).join('  ·  '))),Bar(u.lq[i].reduce((a,b)=>a+b,0)/(8*u.NL),ACOL[i]))),
      kv('Vehicles on road',u.nc),kv('Average speed',u.spd.toFixed(0)+' km/h'),kv('Road density',Math.round(u.nc/70*100)+' %'),
      h('div',{key:'b',className:'h4'},'VEHICLE MIX NOW'),u.mix.slice(0,10).map(([n,k])=>h('div',{key:n},h('div',{className:'kv'},h('span',null,n),h('b',null,k)),Bar(k/(u.mix[0]?u.mix[0][1]:1),'#4fa3ff')))],
    pp:()=>[h('div',{key:'a',className:'h4'},'CROSSINGS'),h('div',{key:'b',className:'cards4'},O.map((o,i)=>h('div',{key:o,style:{borderColor:ACOL[i]}},NM[o],h('b',null,u.pwk[i]),'waiting'))),
      kv('Walk status',pedTxt),kv('Next walk phase in',!u.pedOn?'off':u.mode=='P'?'now':Math.round((4*cyc-tc+tot)%tot)+' s'),kv('People crossed',u.crossed),kv('Arrival rate',u.pedRate+' / min'),
      h('label',{key:'c'},'People per minute: '+u.pedRate,h('input',{type:'range',min:0,max:30,value:u.pedRate,onChange:e=>setS('pedRate',+e.target.value)}))],
    sf:()=>[safeRow,kv('Conflicts detected',u.confN),kv('Red-light violations',u.viol),kv('Faults blocked',u.blocked),kv('Signal mode',u.fault?'Flashing red (all-way stop)':'Normal'),kv('Traffic police',POLTXT[u.pol]),
      h('div',{key:'a',className:'row'},u.fault?h('button',{onClick:()=>{s.fault=false;s.mode='R';s.pt=0;s.next=(s.cur+1)%4;s.cars.forEach(c=>c.go=false);lg(s,'Fault cleared. Restarting from all-red.');snapNow()}},'Clear fault'):h('button',{className:'warn',onClick:()=>{s.inject=true;setTimeout(snapNow,50)}},'Inject green-green command')),
      h('div',{key:'b',className:'h4'},'EVENT LOG'),logUl(8)],
    ch:()=>[h('div',{key:'a',className:'h4'},'QUEUE LENGTH (last 3 min)'),Chart([0,1,2,3].map(i=>u.hist.map(x=>x.q[i])),ACOL),
      h('div',{key:'l',style:{display:'flex',gap:8,fontSize:11}},O.map((o,i)=>h('span',{key:o,style:{color:ACOL[i]}},'■ '+NM[o]))),
      h('div',{key:'b',className:'h4'},'CARS CLEARED PER MINUTE'),Chart([u.hist.map((x,i)=>i<15?0:(x.p-u.hist[i-15].p)*2)],['#2fe07d']),
      h('div',{key:'c',className:'h4'},'AVERAGE WAIT (s)'),Chart([u.hist.map(x=>x.w)],['#ffb21c']),
      h('div',{key:'d',className:'h4'},'VEHICLES ON ROAD'),Chart([u.hist.map(x=>x.c)],['#d77bff'])],
    cm:()=>[h('div',{key:'a',className:'h4'},'VIEWS'),h('div',{key:'b',className:'row'},vb('aerial','Aerial'),vb('top','Top-down'),vb('street','Street'),vb('world','World'),vb('orbit','Orbit')),h('div',{key:'c',className:'h4'},'CAR CAMERA'),h('div',{key:'d',className:'row'},h('button',{onClick:follow},'Follow car'),h('button',{className:'tog'+(u.drv?' on':''),onClick:drive},'Drive in car')),h('div',{key:'e',style:{fontSize:12,color:'var(--mute)',marginTop:8}},'Drive in car: driver-seat view. Drag to look around. Any view button exits.')],
    ct:()=>[h('label',{key:'a'},'Traffic: '+u.rate+' cars/min per road',h('input',{type:'range',min:4,max:40,value:u.rate,onChange:e=>setS('rate',+e.target.value)})),
      h('label',{key:'b'},'Time of day: '+clk(u.hour),h('input',{type:'range',min:0,max:24,step:.25,value:u.hour,onChange:e=>setS('hour',Math.min(23.99,+e.target.value))})),
      h('div',{key:'c',className:'row'},tg(u.auto,'Auto day-night',()=>setS('auto',!u.auto)),tg(u.rain,'Rain',()=>setS('rain',!u.rain)),h('button',{onClick:()=>setS('sp',u.sp==1?2:u.sp==2?4:1)},'Speed '+u.sp+'x')),
      h('div',{key:'d',className:'h4'},'OVERLAYS'),
      h('div',{key:'e',className:'row'},tg(u.ov.queues,'Queue bars',()=>{s.ov.queues=!s.ov.queues;snapNow()}),tg(u.ov.zone,'Junction zone',()=>{s.ov.zone=!s.ov.zone;snapNow()})),
      h('div',{key:'r',className:'h4'},'ROAD LAYOUT'),h('div',{key:'r2',className:'row'},tg(u.NL==2,'4-lane road (2+2)',()=>chLanes(2)),tg(u.NL==3,'6-lane road (3+3)',()=>chLanes(3))),h('div',{key:'f',className:'h4'},'ACTIONS'),
      h('div',{key:'g',className:'row'},h('button',{onClick:()=>{if(!s.cars.some(c=>c.amb)){const o=pick(O);add(s,o,true);lg(s,'Ambulance approaching from '+NM[o]+'. Grant priority!');snapNow()}}},'Send ambulance (police respond)'),h('button',{className:'warn',onClick:()=>{S.current=mk();warm(S.current);snapNow()}},'Reset game'))]
  };
  return h('div',{className:'app'},
    h('div',{className:'stage',ref:mt}),
    u.drv&&h('div',{className:'cab',key:'cab'},h('i',{className:'rf'}),h('i',{className:'pl'}),h('i',{className:'pr'}),h('i',{className:'mir'}),h('div',{className:'dash'},h('b',null,u.drv.v),h('small',null,'km/h  ·  '+u.drv.n)),h('i',{className:'whl'})),
    u.drv&&h('button',{className:'exit',key:'exit',onClick:()=>{G.current.view('aerial');snapNow()}},'Exit drive view'),
    h('div',{className:'title'},h('h1',null,'Crossroads City'),h('p',null,'Camera: Traffic monitor > Camera tab')),
    h('div',{className:'hud'},[['SCORE',u.score.toLocaleString()],['TIME',clk(u.hour)],['ON ROAD',u.nc],['CLEARED',u.passed],['PEOPLE',u.crossed]].map(([a,b])=>h('div',{key:a,className:'hs'},h('small',null,a),h('b',null,b)))),
    u.amb&&h('div',{className:'alert'},h('span',null,'Ambulance from '+NM[u.amb.o]+(u.pol=='walk'?' · police arriving':u.pol=='dir'?' · police directing':'')),h('button',{disabled:u.amb.grant,onClick:()=>{s.emgGrant=true;lg(s,'Priority granted to ambulance.');snapNow()}},u.amb.grant?'Priority granted':'Signal priority now')),
    h('div',{className:'missions'},h('h3',null,'MISSIONS'),u.mis.map(([n,v,g,pts],i)=>h('div',{key:i,className:'ms'+(u.done[i]?' ok':'')},h('small',null,'+'+pts),h('span',null,(u.done[i]?'✓ ':'')+n),Bar(u.done[i]?1:v/g,u.done[i]?'#4be28a':'#ffb21c')))),
    h('div',{className:'mini'},h('canvas',{ref:mm,width:170,height:170}),h('small',null,'City map')),
    h('div',{className:'monitor'},
      h('div',{className:'mhead'},h('b',{className:'big',style:{fontSize:20}},'Traffic monitor'),h('button',{onClick:()=>setOpen(!open),'aria-expanded':open},open?'Hide':'Show')),
      open&&h('div',null,h('div',{className:'tabs'},TABS.map(([k,l])=>h('button',{key:k,className:tab==k?'on':'',onClick:()=>setTab(k)},l))),h('div',{className:'mbody'},panes[tab]()))));
}

export default function Crossroads() {
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=Barlow:wght@400;500&display=swap';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);
  return h(React.Fragment, null, h('style', null, CSS), h(CrossroadsApp));
}