(function(){
const $=id=>document.getElementById(id);
const M=DATA.M,NM=DATA.nm,NC=DATA.nc,NT=DATA.NT,ND=DATA.ND,BASE=ND/NT,SP=DATA.SP,MV=DATA.MV;
SIM.init(SP,MV);
// Battle engine: PvPoke's own engine (pve.js, MIT) gives every result shown. The original fast engine stays as
// SIM.fastBattle / SIM.fastRun for screening thousands of IV spreads or candidates before an exact re-check.
const HAS_PVE=typeof PVE!=='undefined'&&typeof PVGM!=='undefined';
if(HAS_PVE){PVE.init(PVGM);const fb=SIM.build,fr=SIM.run,fbat=SIM.battle;SIM.fastBattle=fbat;SIM.fastRun=fr;
  SIM.build=(sid,f,c,iv)=>{const b=fb(sid,f,c,iv);b.spec=[sid,f,c.filter(Boolean),(iv||SP[sid].iv).slice()];return b;};
  SIM.battle=(A,B,s0,s1)=>PVE.battle(A.spec,B.spec,s0,s1);
  SIM.run=(A,B,o)=>PVE.run(A.spec,B.spec,o);}
else{SIM.fastBattle=SIM.battle;SIM.fastRun=SIM.run;}
const raw=Uint8Array.from(atob(RB64),c=>c.charCodeAt(0));
const TC={normal:'#9FA19F',fire:'#E62829',water:'#2980EF',grass:'#3FA129',electric:'#FAC000',ice:'#3DCEF3',fighting:'#FF8000',poison:'#9141CB',ground:'#915121',flying:'#81B9EF',psychic:'#EF4179',bug:'#91A119',rock:'#AFA981',ghost:'#704170',dragon:'#5060E1',dark:'#624D4E',steel:'#60A1B8',fairy:'#EF70EF'};
const TYPES=Object.keys(TC);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pct=x=>Math.round(x*100)+'%';
const plural=(n,w)=>n+' '+w+(n===1?'':'s');
// ---------- entities
const Mx=M.map(m=>({n:m.n,sid:m.s,f:m.v[0][0],c:m.v[0][1],u:m.u,d:m.d,e:m.e,v:m.v}));
const Cx=DATA.C.map(c=>typeof c==='number'?Object.assign({},Mx[c],{src:0}):{n:c.n,sid:c.s,f:c.f,c:c.c,u:c.u,src:1});
const typesOf=sid=>SP[sid].t.filter(t=>t!=='none');
let LANG='en';try{const l=localStorage.getItem('gl_lang');if(l)LANG=l;}catch(e){}
const L10N=typeof I18N_NAMES!=='undefined'?I18N_NAMES:{};
const mvName=id=>(LANG!=='en'&&L10N[LANG]&&L10N[LANG].mv[id])||(MV[id]?MV[id].name:id);
const dn=n=>{if(LANG==='en'||!L10N[LANG])return n;const sid=DATA.names[n];return (sid&&L10N[LANG].sp[sid])||n;};
const tn=t=>(LANG!=='en'&&L10N[LANG]&&L10N[LANG].ty[t])||t;
const REV={};function buildRev(){for(const n of Object.keys(DATA.names)){REV[n.toLowerCase()]=n;for(const lg of Object.keys(L10N)){const s=L10N[lg].sp[DATA.names[n]];if(s)REV[s.toLowerCase()]=n;}}}
const fromDisp=v=>{v=(v||'').trim();return REV[v.toLowerCase()]||v;};
function T(s,vars){let o=(LANG!=='en'&&typeof I18N!=='undefined'&&I18N[LANG]&&I18N[LANG][s])||s;if(vars)o=o.replace(/\{(\w+)\}/g,(m,k)=>vars[k]!=null?vars[k]:m);return o;}
const metaIdx={};Mx.forEach((m,i)=>metaIdx[m.n]=i);
const candIdx={};Cx.forEach((c,i)=>{if(!(c.n in candIdx)||c.src===0)candIdx[c.n]=i;});
let ANTICUT=-0.2;try{const s=JSON.parse(localStorage.getItem('gl_set')||'{}');if(s.ac!=null)ANTICUT=s.ac;}catch(e){}
const NETS=DATA.NET||[];
const okCommon=c=>Cx[c].src===0&&Cx[c].u>=3, okAnti=c=>Cx[c].src===1&&Cx[c].u<3&&NETS[c]>=ANTICUT, inAntiFloor=c=>Cx[c].src===1&&Cx[c].u<3&&NETS[c]>=-0.2;
const BUILD_CACHE=new Map();
function bld(sid,f,c){const k=sid+'|'+f+'|'+c.join(',');let b=BUILD_CACHE.get(k);if(!b){b=SIM.build(sid,f,c);BUILD_CACHE.set(k,b);}return b;}
const metaB=i=>bld(Mx[i].sid,Mx[i].f,Mx[i].c), candB=c=>bld(Cx[c].sid,Cx[c].f,Cx[c].c);
// ---------- settings + tiers
let SH='avg',MARGIN=75;
try{const s=JSON.parse(localStorage.getItem('gl_set')||'{}');if(s.sh!=null)SH=s.sh;if(s.m)MARGIN=s.m;}catch(e){}
const R3=(c,m)=>{const o=(c*NM+m)*3;return [raw[o]*4,raw[o+1]*4,raw[o+2]*4];};
const pick=r=>SH==='avg'?Math.round((r[0]+r[1]+r[2])/3):r[SH];
function tier(r){if(r>=500+MARGIN)return 'W';if(r>500)return 'CW';if(r===500)return 'T';if(r>500-MARGIN)return 'CL';return 'L';}
const TV={W:4,CW:3,T:2,CL:1,L:0};
const chip=t=>`<span class="chip ${t}">${t}</span>`;
const chips=ts=>'<span class="chips">'+ts.map(chip).join('')+'</span>';
const typeIcon=t=>TYPEIMG[t]?`<img class="ticon" src="${TYPEIMG[t]}" alt="" title="${tn(t)}">`:'';
const typeTag=t=>`<span class="ttag">${typeIcon(t)}${tn(t)}</span>`;
const typeBars=sid=>`<span class="tbars">${typesOf(sid).map(t=>typeChip(t)).join('')}</span>`;
const mvTag=m=>`<span class="mvtag">${MV[m]?typeIcon(MV[m].type):''}${esc(mvName(m))}</span>`;
const typeChip=t=>`<span class="typechip" style="background:${TC[t]}">${typeIcon(t)}${tn(t)}</span>`;
function initials(name){const d=dn(name);if(LANG==='ja'||LANG==='ko'){return d.replace(/[（(].*$/,'').slice(0,2);}const base=d.replace(/\s*\(.*$/,'').replace(/^(de |of )/i,'');const w=base.split(/[\s-]+/).filter(Boolean);return (w.length>1&&w[1].length>2&&!/^de$/i.test(w[1])?w[0][0]+w[1][0]:base.slice(0,2)).replace(/^./,c=>c.toUpperCase());}
function badge(name,sid,big){const ts=typesOf(sid),c1=TC[ts[0]]||'#888',c2=TC[ts[1]||ts[0]]||c1;const sh=/\(Shadow\)/.test(name);
  const bg=ts.length>1?`linear-gradient(135deg,${c1} 0 50%,${c2} 50% 100%)`:`radial-gradient(circle at 30% 30%,${c1},${c1} 60%,rgba(0,0,0,.25))`;
  return `<span class="badge${sh?' sh':''}${big?' big':''}" style="background:${bg}" title="${esc(ts.map(tn).join(' / '))}${sh?' · '+T('Shadow'):''}">${esc(initials(name))}<span class="tics">${ts.map(typeIcon).join('')}</span></span>`;}
const monTag=(name,sid)=>`<span class="mon">${badge(name,sid)}${esc(dn(name))}</span>`;
// ---------- heatmaps + charts
function heatCol(r){const d=Math.max(-1,Math.min(1,(r-500)/500)),a=0.16+0.84*Math.pow(Math.abs(d),0.6);return {bg:d>=0?`rgba(28,150,90,${a.toFixed(2)})`:`rgba(206,60,60,${a.toFixed(2)})`,fg:a>0.55?'#fff':'var(--ink)',a};}
const shortName=n=>{const d=dn(n);return d.length>11?d.slice(0,10)+'…':d;};
function heatTd(r,key,o){o=o||{};const t=tier(r),c=heatCol(r);
  return `<td class="hc${o.chg?' chg':''}" style="background:${c.bg};color:${c.fg}" data-hk="${esc(key)}" data-t="${t}"${o.r3?` data-r3="${o.r3.join(',')}"`:''}${o.pair?` data-pair="${esc(o.pair)}"`:''} title="${o.pair?esc(o.pair)+': ':''}${r}${o.chg?' · '+esc(T('changed by your moves')):''}">${t}</td>`;}
// o: {id, rows:[{name,sid,extra?}], cols:[{name,sid}], val(i,j), r3(i,j)?, chg(i,j)?, best, extraHead, pair(i,j)}
function heatmap(o){const cols=o.cols;
  let h=`<div class="hmwrap"><table class="hm" data-hm="${o.id}"><thead><tr><th class="hl">${o.corner||''}</th>${o.extraHead?`<th class="hx">${o.extraHead}</th>`:''}${cols.map(c=>o.typed?`<th class="hh ht" title="${esc(dn(c.name))}"><span class="hn2">${esc(dn(c.name))}</span>${typeBars(c.sid)}</th>`:`<th class="hh" title="${esc(dn(c.name))}">${badge(c.name,c.sid)}<span class="hn">${esc(shortName(c.name))}</span></th>`).join('')}${o.best?`<th class="hh hb">${T('Best')}</th>`:''}</tr></thead><tbody>`;
  o.rows.forEach((row,i)=>{let best=-1;h+=`<tr><th class="hl">${o.typed?`<span class="hrow2"><b>${esc(dn(row.name))}</b>${typeBars(row.sid)}</span>`:monTag(row.name,row.sid)}</th>${o.extraHead?`<td class="hx num">${row.extra}</td>`:''}`;
    cols.forEach((c,j)=>{const r=o.val(i,j);if(r>best)best=r;h+=heatTd(r,o.id+'|'+row.name+'|'+c.name,{r3:o.r3&&o.r3(i,j),chg:o.chg&&o.chg(i,j),pair:o.pair?o.pair(i,j):`${dn(row.name)} vs ${dn(c.name)}`});});
    if(o.best)h+=heatTd(best,o.id+'|'+row.name+'|best',{});h+='</tr>';});
  h+=`</tbody></table></div><div class="hmfoot"><span class="hmleg" aria-hidden="true"><span>${T('Clear loss')}</span><i></i><span>${T('Clear win')}</span></span>${o.r3?`<span class="hminfo" data-hmi="${o.id}">${T('Tap a cell to see it at each shield count.')}</span>`:''}</div>`;
  return h;}
document.addEventListener('click',e=>{const c=e.target.closest('td.hc[data-r3]');if(!c)return;const tb=c.closest('table.hm');const info=document.querySelector(`[data-hmi="${tb.dataset.hm}"]`);if(!info)return;
  tb.querySelectorAll('td.sel').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');
  const rs=c.dataset.r3.split(',').map(Number),a=Math.round((rs[0]+rs[1]+rs[2])/3);
  info.innerHTML=`<b style="color:var(--ink)">${esc(c.dataset.pair||'')}</b> ${rs.map((r,s)=>`${s}–${s}: <span class="num">${r}</span> ${chip(tier(r))}`).join(' ')} · ${T('average')} <span class="num">${a}</span> ${chip(tier(a))}`;});
// type chart: defensive multipliers per member + move coverage
const fmtX=x=>x>=2.5?'×2.56':x>1?'×1.6':x<0.3?'×0.24':x<0.5?'×0.39':'×0.63';
function typeHeat(members,id){// members [{name,sid,f,c}]
  let h=`<div class="hmwrap"><table class="hm th" data-hm="${id}"><thead><tr><th class="hl">${T('Attacking type')}</th>${TYPES.map(t=>`<th class="tt" title="${tn(t)}">${typeIcon(t)}</th>`).join('')}</tr></thead><tbody>`;
  const wk=TYPES.map(()=>0),rs=TYPES.map(()=>0);
  for(const m of members){const ts=typesOf(m.sid);h+=`<tr><th class="hl">${monTag(m.name,m.sid)}</th>`;
    TYPES.forEach((t,k)=>{const x=SIM.eff(t,ts);if(x>1)wk[k]++;if(x<1)rs[k]++;
      if(x===1){h+='<td class="tc"></td>';return;}const s=x>1?Math.min(1,0.45+(x-1.6)*0.6):Math.min(1,0.45+(0.625-x)*1.4);
      h+=`<td class="tc" style="background:${x>1?`rgba(206,60,60,${s.toFixed(2)})`:`rgba(28,150,90,${s.toFixed(2)})`};color:${s>0.55?'#fff':'var(--ink)'}" title="${esc(dn(m.name))} · ${tn(t)} ${fmtX(x)}">${fmtX(x).replace('×','')}</td>`;});h+='</tr>';}
  h+=`<tr class="sumr"><th class="hl">${T('Weak / resist')}</th>${TYPES.map((t,k)=>{const flag=wk[k]>=2&&rs[k]<2;return `<td class="tc${flag?' flag':''}" title="${tn(t)}: ${wk[k]} ${T('weak')}, ${rs[k]} ${T('resist')}${flag?' · '+T('needs another resist'):''}">${wk[k]||rs[k]?`${wk[k]}/${rs[k]}`:''}</td>`;}).join('')}</tr>`;
  const se=TYPES.map(t=>members.filter(m=>[m.f,...m.c].filter(Boolean).some(mv=>MV[mv]&&SIM.eff(MV[mv].type,[t])>1)).map(m=>dn(m.name)));
  h+=`<tr class="sumr"><th class="hl">${T('Your moves hit super effectively')}</th>${TYPES.map((t,k)=>`<td class="tc${se[k].length?' cov':''}" title="${tn(t)}: ${esc(se[k].join(', ')||T('nobody'))}">${se[k].length?se[k].length:'–'}</td>`).join('')}</tr>`;
  h+=`</tbody></table></div><p class="lede" style="font-size:13px">${T('Red = takes extra damage, green = resists. Bottom rows: members weak / resisting each type (outlined red when 2+ are weak and fewer than 2 resist, which breaks your rule), then how many members have a move that hits that type super effectively.')}</p>`;
  const flagged=TYPES.filter((t,k)=>wk[k]>=2&&rs[k]<2),gaps=TYPES.filter((t,k)=>!se[k].length);
  return {html:h,flagged,gaps};}
function tierBar(w){return `<span class="tbar" role="img" aria-label="${['W','CW','CL','L'].map(t=>t+' '+pct(w[t]||0)).join(', ')}">${['W','CW','T','CL','L'].map(t=>(w[t]||0)>0?`<i class="${t}" style="width:${(w[t]*100).toFixed(1)}%"></i>`:'').join('')}</span>`;}
// line chart for trends
const LCOL=['#2153D0','#D9480F','#1C8754','#9C36B5','#C2255C','#0B7285','#E67700','#5C940D'];
function lineChart(rows){const n=EVN.length,W=640,H=230,pl=40,pr=16,pt=14,pb=28;const mx=Math.max(...rows.flatMap(r=>r.shares),0.01);const top=Math.ceil(mx*10)/10||0.1;
  const X=i=>pl+(n===1?0:i*(W-pl-pr)/(n-1)),Y=v=>pt+(1-v/top)*(H-pt-pb);
  let s=`<svg class="lchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T('Share of teams by event'))}">`;
  for(let k=0;k<=4;k++){const v=top*k/4;s+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end" class="ax">${Math.round(v*100)}%</text>`;}
  EVN.forEach((e,i)=>{s+=`<text x="${X(i)}" y="${H-8}" text-anchor="middle" class="ax">${esc(e)}</text>`;});
  rows.forEach((r,k)=>{const pts=r.shares.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    s+=`<g class="ln" data-ln="${k}" style="--c:${LCOL[k%LCOL.length]}"><polyline points="${pts}" pathLength="1"/>${r.shares.map((v,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="4"><title>${esc(r.mi.map(i=>dn(Mx[i].n)).join(' + '))} · ${esc(EVN[i])}: ${pct(v)}</title></circle>`).join('')}</g>`;});
  s+='</svg>';
  const leg=`<div class="lleg">${rows.map((r,k)=>`<button class="lk" data-lk="${k}" style="--c:${LCOL[k%LCOL.length]}"><i></i>${r.mi.map(i=>esc(dn(Mx[i].n))).join(' + ')}</button>`).join('')}</div>`;
  return s+leg;}
function lnFocus(box,k){box.querySelectorAll('g.ln').forEach(g=>g.classList.toggle('dim',k!==null&&g.dataset.ln!==String(k)));box.querySelectorAll('.lk').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lk===String(k))));}
document.addEventListener('click',e=>{const b=e.target.closest('.lk');if(!b)return;const box=b.closest('.chartbox');const on=b.getAttribute('aria-pressed')==='true';lnFocus(box,on?null:b.dataset.lk);});
document.addEventListener('mouseover',e=>{const b=e.target.closest('.lk');if(b){const box=b.closest('.chartbox');if(!box.querySelector('.lk[aria-pressed="true"]'))box.querySelectorAll('g.ln').forEach(g=>g.classList.toggle('dim',g.dataset.ln!==b.dataset.lk));}});
document.addEventListener('mouseout',e=>{const b=e.target.closest('.lk');if(b){const box=b.closest('.chartbox');if(!box.querySelector('.lk[aria-pressed="true"]'))box.querySelectorAll('g.ln').forEach(g=>g.classList.remove('dim'));}});
// usage vs conversion scatter (Pokémon on 8+ teams)
function scatter(){const pts=Mx.map((m,i)=>{const idx=teamsWith([m.n]);const n=idx.length,d=idx.reduce((s,j)=>s+DATA.T[j][3],0);return {i,n,d,cv:adjRate(d,n)/BASE};}).filter(p=>p.n>=8);
  const lx=v=>Math.log(v),x0=lx(8),x1=lx(Math.max(...pts.map(p=>p.n))*1.08);const cmin=Math.min(0.6,...pts.map(p=>p.cv))-0.06,cmax=Math.max(1.5,...pts.map(p=>p.cv))+0.12;
  const X=n=>((lx(n)-x0)/(x1-x0))*100,Y=c=>(1-(c-cmin)/(cmax-cmin))*100;
  const ticks=[8,15,30,60,120].filter(t=>t<=Math.exp(x1));
  let h=`<div class="scat" role="img" aria-label="${esc(T('Usage against Day 2 conversion'))}"><div class="plot"><span class="q q1">${T('Popular and converting')}</span><span class="q q2">${T('Hidden gems')}</span><span class="q q3">${T('Popular, under-converting')}</span><span class="pr" style="top:${Y(1)}%"><em>×1.0</em></span>`;
  ticks.forEach(t=>{h+=`<span class="pt-x" style="left:${X(t)}%"><em>${t}</em></span>`;});
  pts.sort((a,b)=>a.n-b.n).forEach((p,k)=>{h+=`<button class="sp" style="left:${X(p.n)}%;top:${Y(p.cv)}%;--k:${k}" data-sp="${p.i}|${p.n}|${p.d}|${p.cv.toFixed(2)}" aria-label="${esc(dn(Mx[p.i].n))}">${badge(Mx[p.i].n,Mx[p.i].sid)}</button>`;});
  h+=`</div><div class="axl">${T('Regional teams (log scale)')} →</div><div class="ayl">↑ ${T('Day 2 conversion')}</div></div><p class="sumline" id="spInfo" style="min-height:24px;color:var(--muted)">${T('Tap a Pokémon to see its numbers.')}</p>`;
  return h;}
document.addEventListener('click',e=>{const b=e.target.closest('.sp');if(!b)return;const [i,n,d,cv]=b.dataset.sp.split('|');document.querySelectorAll('.sp.sel').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');
  $('spInfo').innerHTML=`${monTag(Mx[+i].n,Mx[+i].sid)} ${typeBars(Mx[+i].sid)} · ${T('{k} teams',{k:n})} · ${T('{k} Day 2',{k:d})} · <span class="conv ${convClass(+cv)}">×${cv}</span> <button class="link" data-build="${esc(Mx[+i].n)}">${T('Find Your Pokémon')}</button>`;});
const scenLabel=()=>SH==='avg'?T('average of 0, 1 and 2 shields'):T('{s}–{s} shields',{s:SH});
// ---------- events, samples, trends helpers
const EVN=DATA.ev.map(e=>e[0]),EVT=DATA.ev.map(e=>e[1]);
const TSETS=DATA.T.map(t=>new Set(t[4].map(m=>m[0])));
function teamsWith(names){const out=[];for(let i=0;i<TSETS.length;i++){if(names.every(n=>TSETS[i].has(n)))out.push(i);}return out;}
function byEvent(idx){const r=EVN.map(()=>[0,0]);for(const i of idx){const t=DATA.T[i];const e=EVN.indexOf(t[0]);r[e][0]++;r[e][1]+=t[3];}return r;}
function wilson(k,n,z){z=z||1.2816;if(!n)return [0,1];const p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,c-h),Math.min(1,c+h)];}
const KADJ=10;const adjRate=(d,n)=>(d+KADJ*BASE)/(n+KADJ);
function spark(vals,max,labels){const w=14,g=3,H=26,W=vals.length*(w+g)-g;max=max||Math.max(...vals,1e-9);
  return `<svg class="spark" width="${W}" height="${H+12}" viewBox="0 0 ${W} ${H+12}" role="img" aria-label="${esc(labels.map((l,i)=>l+' '+pct(vals[i])).join(', '))}">${vals.map((v,i)=>{const h=Math.max(v>0?2:0,Math.round(v/max*H));return `<g><title>${esc(labels[i])}: ${pct(vals[i])}</title><rect x="${i*(w+g)}" y="${H-h}" width="${w}" height="${h}" rx="2" fill="var(--accent)"></rect><rect x="${i*(w+g)}" y="0" width="${w}" height="${H}" fill="transparent"></rect><text x="${i*(w+g)+w/2}" y="${H+10}" text-anchor="middle" font-size="8" fill="var(--muted)">${esc(labels[i].slice(0,2))}</text></g>`;}).join('')}<line x1="0" x2="${W}" y1="${H+.5}" y2="${H+.5}" stroke="var(--line)"></line></svg>`;}
function sampleBlock(names){const idx=teamsWith(names),be=byEvent(idx),n=idx.length,d=idx.reduce((s,i)=>s+DATA.T[i][3],0);const [lo,hi]=wilson(d,n);
  const players=new Map();for(const i of idx){const p=DATA.T[i][2];players.set(p,(players.get(p)||0)+1);}
  const rep=[...players.values()].filter(v=>v>1).length;
  const shares=be.map((x,e)=>x[0]/EVT[e]);
  let h=`<div class="cols"><div class="panel"><h3>By event</h3><div class="sumline">${spark(shares,null,EVN)}<span>${be.map((x,e)=>`${esc(EVN[e])} <b class="num">${x[0]}</b>${x[0]?` (${x[1]} Day 2)`:''}`).join(' · ')}</span></div>
   <p class="why">${T('Day 2 rate <b>{r}</b> ({d} of {n}). Likely true range <b>{lo}–{hi}</b> (80%); field average {avg}.',{r:pct(d/n),d,n,lo:pct(lo),hi:pct(hi),avg:pct(BASE)})}${n<8?' <span class="tag">'+T('small sample')+'</span> '+T('Treat the conversion as a hint, not a fact.'):''}${rep?' '+T('{k} player(s) ran it at more than one event.',{k:rep}):''}</p></div>
   <div class="panel"><h3>${T('Who ran it ({k} players)',{k:players.size})}</h3><div class="who">${idx.sort((a,b)=>DATA.T[b][3]-DATA.T[a][3]||DATA.T[a][1]-DATA.T[b][1]).slice(0,40).map(i=>{const t=DATA.T[i];return `<span class="whoi">${t[3]?'<span class="status ok">Day 2</span>':''} ${esc(t[0])} #${t[1]} <b>${esc(t[2])}</b></span>`;}).join('')}${idx.length>40?`<span class="whoi">${T('+{k} more',{k:idx.length-40})}</span>`:''}</div></div></div>`;
  return h;}
// ---------- counters (generic): getR(c,j) -> [r0,r1,r2] for candidate c vs member j
function counters(k,memberNames,getR,lite){
  const names=new Set(memberNames),res=[];
  for(let c=0;c<NC;c++){if(!(okCommon(c)||okAnti(c))||names.has(Cx[c].n))continue;
    let tot=0,nW=0,nCL=0,nL=0;const ts=[],rs=[];
    for(let j=0;j<k;j++){const r3=getR(c,j),r=pick(r3),t=tier(r);tot+=r;ts.push(t);rs.push(r3);nW+=t==='W';nCL+=t==='CL';nL+=t==='L';}
    res.push({c,tot,ts,rs,nW,nCL,nL,score:tot+60*nW-100*nCL-400*nL});}
  res.sort((a,b)=>b.score-a.score);
  const common=res.filter(r=>okCommon(r.c)).slice(0,5),anti=res.filter(r=>okAnti(r.c)).slice(0,5);
  if(lite)return {common,anti};
  const pool=res.filter(r=>r.nL<=1).slice(0,30);
  function combo(n){let best=null;
    const rec=(st,pk)=>{if(pk.length===n){const rs=pk.map(i=>pool[i]);if(new Set(rs.map(r=>Cx[r.c].n)).size<n)return;
        let cov=0,allL=0,sm=0,mean=0;const bt=[];
        for(let j=0;j<k;j++){let mx=-1,lc=0,su=0;for(const r of rs){const v=pick(r.rs[j]);if(v>mx)mx=v;if(v<=500-MARGIN)lc++;su+=v;}cov+=mx>=500+MARGIN;allL+=lc===n;sm+=mx;mean+=su/n;bt.push(tier(mx));}
        const v=[cov,-allL,sm+(n>2?mean:0)];
        if(!best||v[0]>best.v[0]||(v[0]===best.v[0]&&(v[1]>best.v[1]||(v[1]===best.v[1]&&v[2]>best.v[2]))))best={v,cs:rs.map(r=>r.c),bt};return;}
      for(let i=st;i<pool.length;i++){pk.push(i);rec(i+1,pk);pk.pop();}};
    rec(0,[]);return best;}
  return {common,anti,duo:k>=2?combo(2):null,trio:k===3?combo(3):null};
}
function whyHTML(c,members){// members: [{name,sid,f,c}]
  const x=Cx[c],xt=typesOf(x.sid),xm=[x.f,...x.c];
  return members.map(y=>{const yt=typesOf(y.sid),ym=[y.f,...y.c];
    const res=[...new Set(ym.filter(m=>SIM.eff(MV[m].type,xt)<1))].map(mvTag);const se=[...new Set(xm.filter(m=>SIM.eff(MV[m].type,yt)>1))].map(mvTag);
    const b=[];if(res.length)b.push(T('resists {list}',{list:res.join(', ')}));if(se.length)b.push(T('hits super effectively with {list}',{list:se.join(', ')}));
    return `<b>${T('vs {name}:',{name:esc(dn(y.name))})}</b> `+(b.length?b.join('; '):T('wins on stats, energy and shields'));}).join('<br>');}
function shieldTable(rs,members){return `<div class="ansx" hidden><table><tr><th></th>${members.map(m=>`<th>${esc(m.name)}</th>`).join('')}</tr>${[0,1,2].map(s=>`<tr><th>${s}–${s}</th>${rs.map(r=>`<td><span class="num">${r[s]}</span> ${chip(tier(r[s]))}</td>`).join('')}</tr>`).join('')}<tr><th>Avg</th>${rs.map(r=>{const a=Math.round((r[0]+r[1]+r[2])/3);return `<td><span class="num">${a}</span> ${chip(tier(a))}</td>`;}).join('')}</tr></table></div>`;}
function ansList(list,members,prev){if(!list.length)return '<p class="empty">No answer avoids every clear loss.</p>';
  return list.map(r=>{const x=Cx[r.c];let extra='';
    if(prev){const p=prev.get(r.c);extra=p?(p.join('')!==r.ts.join('')?`<small>${T('default moves:')} ${p.join(' ')}</small>`:''):'<small><b style="color:var(--accent)">'+T('new answer')+'</b> '+T('with your moves')+'</small>';}
    return `<div class="ans" tabindex="0" role="button" aria-label="Show ratings by shield count"><span class="nm">${monTag(x.n,x.sid)}<small>${[x.f,...x.c].map(mvTag).join(' · ')}${x.u?' · '+T(x.u===1?'{k} regional team':'{k} regional teams',{k:x.u}):''}</small>${extra}</span>${chips(r.ts)}<span class="num" title="Average rating vs the core">${Math.round(r.tot/members.length)}</span>${shieldTable(r.rs,members)}</div>`;}).join('');}
function detailHTML(members,ct,prevMaps){
  const sc=scenLabel();
  let h=`<div class="cols"><div class="panel"><h3>${T('Answers from the meta')} · ${sc}</h3>${ansList(ct.common,members,prevMaps&&prevMaps.common)}</div><div class="panel"><h3>${T('Anti-meta answers')} · ${sc}</h3>${ansList(ct.anti,members,prevMaps&&prevMaps.anti)}</div></div>`;
  const cb=(x,lab)=>x?`<div class="combo"><span class="tag">${lab}</span>${x.cs.map(c=>monTag(Cx[c].n,Cx[c].sid)).join('<span class="plus">+</span>')}${chips(x.bt)}<span style="color:var(--muted)">${T('{a}/{b} clearly beaten',{a:x.v[0],b:members.length})}</span></div>`:'';
  h+=cb(ct.duo,'Counter duo')+cb(ct.trio,'Counter trio');
  if(ct.common[0])h+=`<p class="why"><span class="tag">${T('Why {name}',{name:esc(dn(Cx[ct.common[0].c].n))})}</span><br>${whyHTML(ct.common[0].c,members)}</p>`;
  if(ct.anti[0])h+=`<p class="why"><span class="tag anti">${T('Why {name}',{name:esc(dn(Cx[ct.anti[0].c].n))})}</span><br>${whyHTML(ct.anti[0].c,members)}</p>`;
  return h;}
const memOf=i=>({name:Mx[i].n,sid:Mx[i].sid,f:Mx[i].f,c:Mx[i].c});
function coreDetail(mem){const ct=counters(mem.length,mem.map(i=>Mx[i].n),(c,j)=>R3(c,mem[j]));
  return sampleBlock(mem.map(i=>Mx[i].n))+detailHTML(mem.map(memOf),ct)+`<div class="combo"><button class="btn ghost" data-lab="${mem.join(',')}">Open in Pokémon Analysis</button><span style="color:var(--muted)">Find Your Pokémon:</span>${mem.map(i=>`<button class="link" data-build="${esc(Mx[i].n)}">${esc(dn(Mx[i].n))}</button>`).join('')}</div>`;}
function convClass(x){return x>=1.25?'hi':(x<=0.8?'lo':'mid');}
function statsHTML(n,d){const r=d/n,cv=r/BASE;return `<div class="stats">${n<8?'<span class="tag" title="Fewer than 8 teams: Day 2 rate is unreliable">small sample</span>':''}<div class="stat"><small>Teams</small><span class="num">${n}</span></div>
 <div class="stat"><small>Day 2</small><span class="num">${d} · ${pct(r)}</span><span class="bar" aria-hidden="true"><i style="width:${Math.min(100,r*100)}%"></i><u style="left:${BASE*100}%"></u></span></div>
 <div class="stat"><small>Conv.</small><span class="conv ${convClass(cv)}">×${cv.toFixed(2)}</span></div></div>`;}
function bestLine(mem){const ct=counters(mem.length,mem.map(i=>Mx[i].n),(c,j)=>R3(c,mem[j]),true);const f=r=>r?`${esc(dn(Cx[r.c].n))} ${chips(r.ts)}`:'—';
  return `<span class="bestline"><span class="bl">${T('Best answers at {s}:',{s:SH==='avg'?T('avg'):SH+'–'+SH})}</span> ${f(ct.common[0])} <span class="bl">${T('anti-meta')}</span> ${f(ct.anti[0])}</span>`;}
function coreRow(core,rank){const [mem,n,d]=core;
  return `<div class="row"><button class="head" aria-expanded="false" data-core="${mem.join(',')}"><span class="rank">${rank}</span><span class="core">${mem.map(i=>monTag(Mx[i].n,Mx[i].sid)).join('<span class="plus">+</span>')}${bestLine(mem)}</span>${statsHTML(n,d)}</button><div class="detail" hidden></div></div>`;}
document.addEventListener('click',e=>{
  const h=e.target.closest('button.head[data-core]');if(h){const det=h.nextElementSibling,open=h.getAttribute('aria-expanded')==='true';
    if(!open){det.innerHTML=coreDetail(h.dataset.core.split(',').map(Number));}
    det.hidden=open;h.setAttribute('aria-expanded',String(!open));return;}
  const a=e.target.closest('.ans');if(a&&!e.target.closest('.ansx')){const x=a.querySelector('.ansx');if(x)x.hidden=!x.hidden;return;}
  const b=e.target.closest('[data-build]');if(b){$('bQ').value=b.dataset.build;go('build');renderBuild();window.scrollTo({top:0});return;}
  const l=e.target.closest('[data-lab]');if(l){setLab(l.dataset.lab.split(',').map(Number).map(i=>({name:Mx[i].n})));go('lab');window.scrollTo({top:0});}
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('ans')){e.preventDefault();e.target.click();}});
function seg(ids,onSel){ids.forEach(id=>$(id).addEventListener('click',()=>{ids.forEach(j=>$(j).setAttribute('aria-pressed',String(j===id)));onSel(id);}));}
function setSeg(ids,id){ids.forEach(j=>$(j).setAttribute('aria-pressed',String(j===id)));}
// ---------- cores
let cs=2,co='common';
function renderCores(){const q=$('coreQ').value.trim().toLowerCase(),mn=+$('minN').value;$('minVal').textContent=mn;$('minwrap').style.opacity=co==='conv'?1:.45;$('adjwrap').style.opacity=co==='conv'?1:.45;
  let L=DATA.cores.filter(c=>c[0].length===cs);
  if(q)L=L.filter(c=>c[0].some(i=>Mx[i].n.toLowerCase().includes(q)||dn(Mx[i].n).toLowerCase().includes(q)));
  if(co==='common')L.sort((a,b)=>b[1]-a[1]||b[2]-a[2]);else L=L.filter(c=>c[1]>=mn).sort($('adjS').checked?(a,b)=>adjRate(b[2],b[1])-adjRate(a[2],a[1])||b[1]-a[1]:(a,b)=>b[2]/b[1]-a[2]/a[1]||b[1]-a[1]);
  L=L.slice(0,50);$('coreList').innerHTML=L.length?L.map((c,i)=>coreRow(c,i+1)).join(''):'<p class="empty">No cores match. Lower the minimum or clear the search.</p>';}
seg(['cs-2','cs-3'],id=>{cs=+id.slice(3);if(cs===3&&+$('minN').value>5)$('minN').value=5;if(cs===2&&+$('minN').value<8)$('minN').value=8;renderCores();});
seg(['co-common','co-conv'],id=>{co=id.slice(3);renderCores();});
$('minN').addEventListener('input',renderCores);$('adjS').addEventListener('change',renderCores);$('coreQ').addEventListener('input',renderCores);
// ---------- build around
let bs=0,bo='n';
function variantList(m){return m.v.map(v=>`<li>${[v[0],...v[1]].map(mvTag).join(' · ')} — <span class="num">${T(v[2]===1?'{k} team':'{k} teams',{k:v[2]})}</span>${v[2]?`, ${pct(v[3]/v[2])} Day 2`:''}</li>`).join('');}
function renderBuild(){const nm=fromDisp($('bQ').value);const i=metaIdx[nm];const out=$('bOut');
  if(i===undefined){out.innerHTML='<p class="empty">'+T('Pick a Pokémon that was used at the regionals (start typing to see the list).')+'</p>';return;}
  const m=Mx[i],r=m.d/(m.u||1);
  let h=`<div class="card"><div class="hero-mon"><h2>${esc(dn(m.n))}</h2>${typesOf(m.sid).map(t=>typeChip(t)).join(' ')}<button class="btn ghost" data-lab="${i}">Open in Pokémon Analysis</button></div>
   <div class="kpis" style="margin-top:12px"><div class="kpi"><small>Regional teams</small><span class="num">${m.u}</span></div><div class="kpi"><small>Usage</small><span class="num">${pct(m.u/NT)}</span></div><div class="kpi"><small>Day 2 rate</small><span class="num">${pct(r)}</span></div><div class="kpi"><small>Conversion</small><span class="num">×${(r/BASE).toFixed(2)}</span></div><div class="kpi"><small>${T('Events')}</small><span class="num">${T('{a} of {b}',{a:m.e,b:DATA.ev.length})}</span></div></div>
   ${(()=>{const be=byEvent(teamsWith([m.n]));return `<div class="sumline" style="margin-top:12px"><span style="color:var(--muted)">${T('Usage by event')}</span>${spark(be.map((x,e)=>x[0]/EVT[e]),null,EVN)}<span>${be.map((x,e)=>`${esc(EVN[e])} <b class="num">${pct(x[0]/EVT[e])}</b>`).join(' · ')}</span></div>`;})()}
   <h3 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:14px">Movesets used at the regionals</h3><ul class="moves" style="margin:6px 0 0;padding-left:18px">${variantList(m)}</ul></div>`;
  const ct=counters(1,[m.n],(c)=>R3(c,i));
  h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:6px">${T('What beats {name} on its own',{name:esc(dn(m.n))})}</h3>${detailHTML([memOf(i)],ct)}</div>`;
  let L=DATA.cores.filter(c=>c[0].includes(i)&&(bs===0||c[0].length===bs));
  L.sort(bo==='n'?(a,b)=>b[1]-a[1]||b[2]-a[2]:(a,b)=>(b[2]+BASE*10)/(b[1]+10)-(a[2]+BASE*10)/(a[1]+10));
  h+=`<h3 style="font-size:18px">${T('Cores with {name}',{name:esc(dn(m.n))})} <span style="color:var(--muted);font-weight:500">(${T('{k} on 3+ teams',{k:L.length})})</span></h3><div class="list">${L.slice(0,60).map((c,k)=>coreRow(c,k+1)).join('')||'<p class="empty">No duo or trio with this Pokémon appeared on 3+ teams.</p>'}</div>`;
  out.innerHTML=h;}
seg(['bs-0','bs-2','bs-3'],id=>{bs=+id.slice(3);renderBuild();});seg(['bo-n','bo-r'],id=>{bo=id.slice(3);renderBuild();});
$('bQ').addEventListener('change',renderBuild);$('bQ').addEventListener('input',()=>{if(metaIdx[fromDisp($('bQ').value)]!==undefined)renderBuild();});
// ---------- anti-meta versatility
let ap='all';
function renderAnswers(){const big=DATA.cores.filter(c=>c[1]>=5),tot=big.reduce((s,c)=>s+c[1],0),out=[];
  for(let c=0;c<NC;c++){if(!(okCommon(c)||okAnti(c)))continue;let cov=0,win=0;
    for(const [mem,n] of big){if(mem.some(i=>Mx[i].n===Cx[c].n))continue;let anyL=false,allW=true;
      for(const m of mem){const t=tier(pick(R3(c,m)));if(t==='L'){anyL=true;allW=false;break;}if(t!=='W')allW=false;}
      if(!anyL){cov+=n;if(allW)win+=n;}}
    out.push({c,cov:cov/tot,win:win/tot});}
  out.sort((a,b)=>b.cov-a.cov||b.win-a.win);
  const q=$('aQ').value.trim().toLowerCase();
  let L=out.map((r,i)=>Object.assign({rk:i+1},r));
  if(ap==='meta')L=L.filter(r=>okCommon(r.c));if(ap==='anti')L=L.filter(r=>okAnti(r.c));if(q)L=L.filter(r=>Cx[r.c].n.toLowerCase().includes(q)||dn(Cx[r.c].n).toLowerCase().includes(q));
  $('aBody').innerHTML=L.slice(0,80).map((r,i)=>{const x=Cx[r.c];return `<tr><td class="num">${q?r.rk:i+1}</td><td>${monTag(x.n,x.sid)} ${typeBars(x.sid)}<div style="color:var(--muted);font-size:12px">${[x.f,...x.c].map(mvTag).join(' · ')}</div></td><td><span class="tag ${okAnti(r.c)?'anti':''}">${okAnti(r.c)?T('Anti-meta'):T('Meta')}</span></td><td class="r num">${x.u}</td><td class="r num">${NETS[r.c]>=0?'+':''}${Math.round(NETS[r.c]*100)}%</td><td class="r"><span class="num">${pct(r.cov)}</span><span class="meter"><i style="width:${r.cov*100}%"></i></span></td><td class="r num">${pct(r.win)}</td><td><button class="link" data-labname="${esc(x.n)}">Lab</button></td></tr>`;}).join('')||'<tr><td colspan="8" class="empty">No match.</td></tr>';}
seg(['ap-all','ap-meta','ap-anti'],id=>{ap=id.slice(3);renderAnswers();});$('aQ').addEventListener('input',renderAnswers);
$('aBody').addEventListener('click',e=>{const b=e.target.closest('[data-labname]');if(b){addLab(b.dataset.labname);go('lab');window.scrollTo({top:0});}});
// ---------- fast rating tables for the current shield setting
let PR=null,PR_KEY='';
function prTable(){const k=String(SH);if(PR&&PR_KEY===k)return PR;PR=new Uint16Array(NC*NM);
  for(let c=0;c<NC;c++)for(let m=0;m<NM;m++){const o=(c*NM+m)*3;PR[c*NM+m]=SH==='avg'?Math.round((raw[o]+raw[o+1]+raw[o+2])*4/3):raw[o+SH]*4;}PR_KEY=k;return PR;}
const pickArr=(a,m)=>SH==='avg'?Math.round((a[m*3]+a[m*3+1]+a[m*3+2])/3):a[m*3+SH];
// ---------- shared slot editor (My team + Core Lab)
const metaBuilds=()=>Mx.map((m,i)=>metaB(i));
let MB=null;
function vsMeta(b){if(!MB)MB=metaBuilds();const out=new Int16Array(NM*3);for(let m=0;m<NM;m++)for(let s=0;s<3;s++)out[m*3+s]=SIM.battle(b,MB[m],s,s);return out;}
// Bulk scans: screen every candidate with the fast engine, then re-run the ones that can appear in results with PvPoke's engine
const REFINE=80;
function refine(out,list,score,run){const pick=list.slice().sort((a,b)=>score(b)-score(a)).slice(0,REFINE);for(const c of pick)for(let s=0;s<3;s++)out[c*3+s]=run(c,s);}
function candVs(b){const out=new Int16Array(NC*3),L=[];for(let c=0;c<NC;c++){if(!(okCommon(c)||inAntiFloor(c)))continue;L.push(c);const cb=candB(c);for(let s=0;s<3;s++)out[c*3+s]=SIM.fastBattle(cb,b,s,s);}
  if(HAS_PVE)refine(out,L,c=>out[c*3]+out[c*3+1]+out[c*3+2],(c,s)=>SIM.battle(candB(c),b,s,s));return out;}
const VSCACHE=new Map(),CVCACHE=new Map();
const keyOf=(sid,f,c)=>sid+'|'+f+'|'+c.join(',');
// A Pokémon on a moveset the kit already battled (with PvPoke's engine) reads the precomputed table; anything else is simulated live
const PRE=new Map();Cx.forEach((x,i)=>{const k=x.sid+'|'+x.f+'|'+x.c.slice().sort().join(',');if(!PRE.has(k)||x.src===0)PRE.set(k,i);});
function getVs(sid,f,c){const k=keyOf(sid,f,c);if(!VSCACHE.has(k)){const ci=PRE.get(sid+'|'+f+'|'+c.filter(Boolean).slice().sort().join(','));
    if(ci!==undefined){const out=new Int16Array(NM*3);for(let m=0;m<NM;m++){const r=R3(ci,m);out[m*3]=r[0];out[m*3+1]=r[1];out[m*3+2]=r[2];}VSCACHE.set(k,out);}
    else VSCACHE.set(k,vsMeta(bld(sid,f,c)));}return VSCACHE.get(k);}
function getCv(sid,f,c){const k=keyOf(sid,f,c);if(!CVCACHE.has(k))CVCACHE.set(k,candVs(bld(sid,f,c)));return CVCACHE.get(k);}
function defaultMoves(name){const i=metaIdx[name];if(i!==undefined)return {f:Mx[i].f,c:Mx[i].c.slice()};const c=candIdx[name];if(c!==undefined)return {f:Cx[c].f,c:Cx[c].c.slice()};return null;}
const sidOf=name=>DATA.names[name];
function mkSlot(o){if(!o||!o.name)return null;const d=defaultMoves(o.name);if(!d)return null;return {name:o.name,sid:sidOf(o.name),f:o.f||d.f,c:(o.c||d.c).slice(),df:d.f,dc:d.c.slice()};}
const isChanged=s=>s.f!==s.df||s.c.slice().sort().join()!==s.dc.slice().sort().join();
function moveOptions(sid,kind,sel){const p=SP[sid];const pool=kind==='f'?p.f:p.c;const all=[...new Set([...pool,sel].filter(Boolean))];
  return (kind==='c'?'<option value="">— none —</option>':'')+all.filter(m=>MV[m]&&(kind==='f'?MV[m].energyGain>0||MV[m].energy===0:MV[m].energy>0)).sort((a,b)=>mvName(a).localeCompare(mvName(b))).map(m=>`<option value="${m}"${m===sel?' selected':''}>${esc(mvName(m))} (${tn(MV[m].type)}${kind==='f'?`, ${MV[m].turns}t`:`, ${MV[m].energy}e`})${p.e.includes(m)?' *':''}</option>`).join('');}
function Slots(cfg){// cfg:{el,prefix,max,list(),save(),onChange(),compact}
  const P=cfg.prefix;
  function html(s,k){if(!s)return `<div class="lab empty-slot"><div class="top"><input type="text" id="${P}n${k}" list="allNames" value="" placeholder="${T('Add Pokémon')} ${k+1}" aria-label="Pokémon slot ${k+1}" autocomplete="off"></div></div>`;
    const i=metaIdx[s.name];
    const vars=i!==undefined?Mx[i].v.slice(0,5).map((v,j)=>{const on=v[0]===s.f&&v[1].slice().sort().join()===s.c.filter(Boolean).slice().sort().join();return `<button data-var="${k}:${j}" aria-pressed="${on}">${[v[0],...v[1]].map(mvTag).join(' / ')} · ${v[2]}</button>`;}).join(''):'';
    const open=!cfg.compact||isChanged(s)||cfg.openSet.has(k);
    return `<div class="lab"><div class="top"><input type="text" id="${P}n${k}" list="allNames" value="${esc(dn(s.name))}" aria-label="Pokémon ${k+1}" autocomplete="off"><button data-rm="${k}" aria-label="Remove ${esc(dn(s.name))}">×</button></div>
    <div class="sumline">${typesOf(s.sid).map(t=>typeChip(t)).join(' ')}<span style="color:var(--muted)">${[s.f,...s.c].map(mvTag).join(' · ')}</span>${cfg.compact?`<button class="link" data-tog="${k}" style="font-size:12px">${open?'Hide moves':'Change moves'}</button>`:''}${isChanged(s)?'<span class="tag anti">custom</span>':''}</div>
    <div ${open?'':'hidden'}><div class="mvs"><label for="${P}f${k}">Fast<select id="${P}f${k}" data-k="${k}" data-slot="f" class="${s.f!==s.df?'changed':''}">${moveOptions(s.sid,'f',s.f)}</select></label>
    <label for="${P}a${k}">Charged<select id="${P}a${k}" data-k="${k}" data-slot="0" class="${!s.dc.includes(s.c[0])?'changed':''}">${moveOptions(s.sid,'c',s.c[0])}</select></label>
    <label for="${P}b${k}">Charged<select id="${P}b${k}" data-k="${k}" data-slot="1" class="${s.c[1]&&!s.dc.includes(s.c[1])?'changed':''}">${moveOptions(s.sid,'c',s.c[1]||'')}</select></label></div>
    ${vars?`<div style="margin-top:6px"><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Regional movesets (teams)</div><div class="variants">${vars}</div></div>`:'<div style="font-size:11px;color:var(--muted);margin-top:6px">Not used at the regionals; starts on PvPoke\'s recommended moveset.</div>'}</div>
    <div id="${P}sum${k}" class="sumline"></div></div>`;}
  cfg.openSet=new Set();
  function render(){const L=cfg.list();const rows=[];for(let k=0;k<(cfg.fixed?cfg.max:L.length);k++)rows.push(html(L[k],k));cfg.el.innerHTML=rows.join('');
    for(let k=0;k<rows.length;k++){const inp=$(P+'n'+k);if(inp)inp.addEventListener('change',e=>{const n=fromDisp(e.target.value);const L=cfg.list();if(n&&L.some((x,j)=>j!==k&&x&&x.name===n)){toast(T('{name} is already in this team.',{name:dn(n)}));e.target.value=L[k]?dn(L[k].name):'';return;}if(!n){L[k]=null;}else{const ns=mkSlot({name:n});if(!ns)return;L[k]=ns;}cfg.save();cfg.onChange();});}}
  cfg.el.addEventListener('change',e=>{const sel=e.target.closest('select[data-k]');if(!sel)return;const s=cfg.list()[+sel.dataset.k];
    if(sel.dataset.slot==='f')s.f=sel.value;else{s.c[+sel.dataset.slot]=sel.value;s.c=s.c.slice(0,2);}
    s.c=s.c.filter((x,i,a)=>x&&a.indexOf(x)===i);if(!s.c.length)s.c=s.dc.slice(0,1);cfg.save();cfg.onChange();});
  cfg.el.addEventListener('click',e=>{const r=e.target.closest('[data-rm]');if(r){const L=cfg.list();if(cfg.fixed)L[+r.dataset.rm]=null;else L.splice(+r.dataset.rm,1);cfg.save();cfg.onChange();return;}
    const t=e.target.closest('[data-tog]');if(t){const k=+t.dataset.tog;cfg.openSet.has(k)?cfg.openSet.delete(k):cfg.openSet.add(k);render();return;}
    const v=e.target.closest('[data-var]');if(v){const [k,j]=v.dataset.var.split(':').map(Number);const s=cfg.list()[k],vv=Mx[metaIdx[s.name]].v[j];s.f=vv[0];s.c=vv[1].slice();cfg.save();cfg.onChange();}});
  return {render};}
// ---------- MY TEAM + suggestions
const EX=['Clodsire','Sableye (Shadow)','Corviknight','Jellicent','Hydreigon (Shadow)','Ninetales (Alolan) (Shadow)'];
let team=[];
function loadTeam(){try{const t=JSON.parse(localStorage.getItem('gl_team2')||'null');if(Array.isArray(t)&&t.length===6)return t.map(x=>x?mkSlot(x):null);}catch(e){}
  try{const o=JSON.parse(localStorage.getItem('gl_team')||'null');if(Array.isArray(o)&&o.length===6)return o.map(n=>n?mkSlot({name:n}):null);}catch(e){}return EX.map(n=>mkSlot({name:n}));}
function saveTeam(){try{localStorage.setItem('gl_team2',JSON.stringify(team.map(s=>s?{name:s.name,f:s.f,c:s.c}:null)));}catch(e){}}
const pvSlots=Slots({el:$('pvSlots'),prefix:'pv',max:6,fixed:true,compact:true,list:()=>team,save:saveTeam,onChange:()=>{pvSlots.render();pvSummary();renderPreview();}});
function pvSummary(){const el=$('pvSum');if(el)el.innerHTML=team.filter(Boolean).map(s=>`<span class="pvm">${badge(s.name,s.sid)}${esc(dn(s.name))}</span>`).join('');}
const teamSlots=Slots({el:$('teamSlots'),prefix:'tm',max:6,fixed:true,compact:true,list:()=>team,save:saveTeam,onChange:()=>{teamSlots.render();renderTeam();}});
$('teamReset').addEventListener('click',()=>{team=EX.map(n=>mkSlot({name:n}));saveTeam();teamSlots.render();renderTeam();});
$('teamClear').addEventListener('click',()=>{team=[null,null,null,null,null,null];saveTeam();teamSlots.render();renderTeam();});
$('teamToLab').addEventListener('click',()=>{lab=team.filter(Boolean).map(s=>Object.assign({},s,{c:s.c.slice(),dc:s.dc.slice()}));saveLab();go('lab');window.scrollTo({top:0});});
const BIG=()=>DATA.cores.filter(c=>c[1]>=5);
const THREATS=()=>Mx.map((m,i)=>({i,u:m.u})).filter(x=>x.u>=8).sort((a,b)=>b.u-a.u);
const TW={W:1,CW:.75,T:.5,CL:.35,L:0};
// a "unit" = rating getter vs meta index: (m)=>rating under current setting
function unitOfSlot(s){const a=getVs(s.sid,s.f,s.c);return {name:s.name,sid:s.sid,mv:[s.f,...s.c],types:typesOf(s.sid),r:m=>pickArr(a,m),r3:m=>[a[m*3],a[m*3+1],a[m*3+2]]};}
function unitOfCand(c){const P=prTable();return {name:Cx[c].n,types:typesOf(Cx[c].sid),r:m=>P[c*NM+m],c};}
function weakRule(units){let v=0;const bad=[];for(const t of TYPES){let w=0,r=0;for(const u of units){const e=SIM.eff(t,u.types);if(e>1)w++;if(e<1)r++;}if(w>=2&&r<2){v++;bad.push(t);}}return {v,bad};}
function teamEval(units){const big=BIG(),tot=big.reduce((s,c)=>s+c[1],0);let w1=0,w2=0,allb=0;const gaps=[];
  for(const core of big){const [mem,n]=core;let clean=0;const best=mem.map(()=>0);
    for(const u of units){let ok=true;for(let j=0;j<mem.length;j++){const v=TV[tier(u.r(mem[j]))];if(v===0)ok=false;if(v>best[j])best[j]=v;}if(ok)clean++;}
    if(clean>=1)w1+=n;else gaps.push(core);if(clean>=2)w2+=n;if(best.every(v=>v===4))allb+=n;}
  const th=THREATS();let ts=0,tt=0;const beaten=new Set();for(const x of th){let b=0;for(const u of units){const v=TW[tier(u.r(x.i))];if(v>b)b=v;}ts+=b*x.u;tt+=x.u;if(b>=.75)beaten.add(x.i);}
  const wr=weakRule(units);
  return {c1:w1/tot,c2:w2/tot,all:allb/tot,th:ts/tt,beaten,wr,gaps,score:100*w1/tot+50*w2/tot+60*ts/tt-8*wr.v};}
function teamUnits(){return team.filter(Boolean).map(unitOfSlot);}
function suggest(units,k){const base=teamEval(units),have=new Set(units.map(u=>u.name)),out=[];
  for(let c=0;c<NC;c++){if(!(okCommon(c)||okAnti(c))||have.has(Cx[c].n))continue;const e=teamEval([...units,unitOfCand(c)]);out.push({c,e,d:e.score-base.score});}
  out.sort((a,b)=>b.d-a.d);const seen=new Set(),res=[];for(const o of out){if(seen.has(Cx[o.c].n))continue;seen.add(Cx[o.c].n);res.push(o);if(res.length>=k)break;}return {base,res};}
function complete(units,first){let cur=[...units,unitOfCand(first)];while(cur.length<6){const s=suggest(cur,1);if(!s.res.length)break;cur.push(unitOfCand(s.res[0].c));}return {units:cur,e:teamEval(cur)};}
// Coverage bands: 95%+ good (green), 88-94% okay (blue), 87% and below bad (red)
function covBand(v){const p=Math.round(v*100);return p>=95?'good':p>=88?'ok':'bad';}
function metricRow(e,k){k=k||'m';const cu=(v,f,s)=>`data-cu="${v}" data-cuf="${f}" data-cuk="${k}${s}"`;return `<div class="kpis"><div class="card kpi band-${covBand(e.c1)}"><small>Core teams with 1+ answer</small><span class="big num" ${cu(e.c1,'p',1)}>${pct(e.c1)}</span></div><div class="card kpi band-${covBand(e.c2)}"><small>With 2+ answers</small><span class="big num" ${cu(e.c2,'p',2)}>${pct(e.c2)}</span></div><div class="card kpi"><small>Wins vs top meta (usage-weighted)</small><span class="big num" ${cu(e.th,'p',3)}>${pct(e.th)}</span></div><div class="card kpi"><small>Shared weaknesses without 2 resists</small><span class="big num" ${cu(e.wr.v,'i',4)}>${e.wr.v}</span></div></div>`;}
function sugLine(o,base,units){const x=Cx[o.c],e=o.e;const newly=[...e.beaten].filter(i=>!base.beaten.has(i)).sort((a,b)=>Mx[b].u-Mx[a].u).slice(0,5).map(i=>esc(dn(Mx[i].n)));
  const fixed=base.wr.bad.filter(t=>!e.wr.bad.includes(t)),added=e.wr.bad.filter(t=>!base.wr.bad.includes(t));
  return `<div class="ans" style="cursor:default"><span class="nm">${monTag(x.n,x.sid)} <span class="tag ${okAnti(o.c)?'anti':''}">${okAnti(o.c)?T('Anti-meta'):T('Meta')}</span><small>${[x.f,...x.c].map(mvTag).join(' · ')}</small>
   <small>${T('Cores answered')} ${pct(base.c1)} → <b>${pct(e.c1)}</b> · ${T('2+ answers')} ${pct(base.c2)} → <b>${pct(e.c2)}</b>${newly.length?' · '+T('now beats')+' '+newly.join(', '):''}</small>
   ${fixed.length?`<small style="color:var(--win)">${T('Fixes shared {t} weakness',{t:fixed.map(typeTag).join(' ')})}</small>`:''}${added.length?`<small style="color:var(--loss)">${T('Adds a shared {t} weakness',{t:added.map(typeTag).join(' ')})}</small>`:''}</span>
   <span class="num" title="Score gain">+${o.d.toFixed(1)}</span><button class="btn ghost" data-addteam="${o.c}">Add</button></div>`;}
// ---------- teammate engine: every member counts equally
const TIX=Object.fromEntries(TYPES.map((t,k)=>[t,k]));
const PRESS=(()=>{const p=TYPES.map(()=>0);Mx.forEach(m=>{[m.f,...m.c].forEach(mv=>{if(MV[mv])p[TIX[MV[mv].type]]+=m.u/3;});});const mx=Math.max(...p,1e-9);return p.map(x=>x/mx);})();
const baseSp=n=>n.replace(/\s*\(.*$/,'');
const isShadow=n=>/\(Shadow\)$/.test(n);
function mprof(u){if(u._p)return u._p;const ts=u.types,mv=(u.mv||[]).filter(x=>x&&MV[x]);
  const wk=TYPES.filter(t=>SIM.eff(t,ts)>1),rs=TYPES.map(t=>{const e=SIM.eff(t,ts);return e<0.5?1.5:e<1?1:0;}),se=TYPES.map(t=>mv.some(m=>SIM.eff(MV[m].type,[t])>1)?1:0);
  const W=new Uint8Array(NM),L=new Uint8Array(NM);let net=0,tu=0;
  for(let m=0;m<NM;m++){const r=u.r(m),w=Mx[m].u;if(r>500)W[m]=1;else if(r<500)L[m]=1;net+=w*(W[m]-L[m]);tu+=w;}
  return (u._p={wk,rs,se,W,L,str:net/tu});}
function coverOf(pa,pb){const n=pa.wk.length;if(!n)return {v:0.5,sh:[],mv:[]};const sh=[],mv=[];let s=0,m=0;
  for(const t of pa.wk){const k=TIX[t];if(pb.rs[k]){s+=pb.rs[k];sh.push(t);}if(pb.se[k]){m++;mv.push(t);}}
  s/=n;m/=n;return {v:Math.max(s,m)+0.5*Math.min(s,m),sh,mv};}
function muDir(pa,pb){let l=0,c=0;for(let m=0;m<NM;m++)if(pa.L[m]){const w=Mx[m].u;l+=w;if(pb.W[m])c+=w;}return l?c/l:1;}
const pairRel=(pa,pb)=>{const a=coverOf(pa,pb).v,b=coverOf(pb,pa).v;return a+b+Math.min(a,b);};
const pairMu=(pa,pb)=>(muDir(pa,pb)+muDir(pb,pa))/2;
const zs=a=>{const n=a.length;if(!n)return a;const m=a.reduce((s,x)=>s+x,0)/n;const sd=Math.sqrt(a.reduce((s,x)=>s+(x-m)*(m-x)*-1,0)/n)||1;return a.map(x=>(x-m)/sd);};
const strGate=s=>Math.max(0,Math.min(1,(s+0.30)/0.30));
const strLabel=s=>s>=0.2?T('strong'):s>=-0.05?T('neutral'):s>=-0.25?T('below average'):T('struggles');
function mPool(){const out=[];for(let c=0;c<NC;c++){if(okCommon(c)||okAnti(c)||(Cx[c].src===0&&(NETS[c]??0)>=ANTICUT))out.push(c);}return out;}
function candUnitM(c){const P=prTable();return {name:Cx[c].n,sid:Cx[c].sid,types:typesOf(Cx[c].sid),mv:[Cx[c].f,...Cx[c].c],r:m=>P[c*NM+m],r3:m=>R3(c,m),c};}
function mateSuggest(units,k){const ps=units.map(mprof),n=units.length,early=n<=2;
  const have=new Set(units.map(u=>baseSp(u.name)));
  // team-level context
  const cnt=new Uint8Array(NM);for(const p of ps)for(let m=0;m<NM;m++)cnt[m]+=p.W[m];
  let thinTot=0;for(let m=0;m<NM;m++)if(cnt[m]<=1)thinTot+=Mx[m].u;
  const load=TYPES.map((t,k2)=>{let w=0,r=0;for(const u of units){const e=SIM.eff(t,u.types);if(e>1)w++;if(e<1)r++;}return Math.max(0,w-r)*PRESS[k2];});
  let weakest=-1;if(n>=2){let lo=9;ps.forEach((p,i)=>{let b=0;ps.forEach((q,j)=>{if(i!==j)b=Math.max(b,pairMu(p,q));});if(b<lo){lo=b;weakest=i;}});}
  const vio0=weakRule(units).v;
  const C=[];for(const c of mPool()){if(have.has(baseSp(Cx[c].n)))continue;const u=candUnitM(c),p=mprof(u);
    let rel=0,mu=0;for(const q of ps){rel+=pairRel(q,p);mu+=pairMu(q,p);}rel/=n;mu/=n;
    let patch=0;for(let m=0;m<NM;m++)if(cnt[m]<=1&&p.W[m])patch+=Mx[m].u;patch=thinTot?patch/thinTot:0;
    let relief=0;TYPES.forEach((t,k2)=>{relief+=load[k2]*p.rs[k2];if(SIM.eff(t,u.types)>1)relief-=load[k2]+0.15*PRESS[k2];});
    const help=weakest>=0?pairMu(ps[weakest],p):0;
    const dv=weakRule([...units,u]).v-vio0;
    C.push({c,u,p,rel,mu,patch,relief,help,dv,str:p.str});}
  const Z=f=>zs(C.map(f));const zr=Z(x=>x.rel),zm=Z(x=>x.mu),zp=Z(x=>x.patch),zl=Z(x=>x.relief),zh=Z(x=>x.help),zt=Z(x=>x.str);
  C.forEach((x,i)=>{x.score=(zr[i]*(early?1:0.7)+zm[i]*0.35+zp[i]*(early?0.15:0.45)+zl[i]*(early?0.25:0.6)+(n>=2?0.25*zh[i]:0)+(early?0:0.35)*zt[i])*(0.4+0.6*strGate(x.str))-0.5*x.dv;});
  C.sort((a,b)=>b.score-a.score);
  // one card per species; remember the other Shadow/regular form if it is also viable
  const byName=new Map(C.map(x=>[Cx[x.c].n,x]));const seen=new Set(),res=[];
  for(const x of C){const b=baseSp(Cx[x.c].n);if(seen.has(b))continue;seen.add(b);const nm=Cx[x.c].n,twin=isShadow(nm)?nm.replace(/ \(Shadow\)$/,''):nm+' (Shadow)';x.twin=byName.get(twin)||null;res.push(x);if(res.length>=k)break;}
  return {res,ctx:{units,ps,cnt,load,weakest}};}
// role numbers (usage-weighted average rating vs the regional meta at 2, 1 and 0 shields)
function roleNums(u){let a=[0,0,0],t=0;for(let m=0;m<NM;m++){const r=u.r3(m),w=Mx[m].u;a[0]+=w*r[2];a[1]+=w*r[1];a[2]+=w*r[0];t+=w;}return a.map(x=>Math.round(x/t));}
function formNote(x){if(!x.twin)return '';const sh=isShadow(Cx[x.c].n)?x:x.twin,rg=isShadow(Cx[x.c].n)?x.twin:x;
  const a=roleNums(sh.u),b=roleNums(rg.u),lab=[T('Lead (2 shields)'),T('Safe swap (1 shield)'),T('Closer (0 shields)')];
  const cells=lab.map((l,k)=>{const d=a[k]-b[k];return `<span>${l}: ${T('Regular')} <b class="num">${b[k]}</b> · ${T('Shadow')} <b class="num">${a[k]}</b>${Math.abs(d)>=10?` <i class="${d>0?'up':'dn'}">${d>0?T('Shadow +{d}',{d}):T('Regular +{d}',{d:-d})}</i>`:''}</span>`;}).join('');
  return `<details class="formcmp"><summary>${T('Shadow or regular?')} <span>${T('Showing {f}',{f:isShadow(Cx[x.c].n)?T('Shadow'):T('Regular')})}</span></summary><p>${T('Regular is bulkier (takes about 17% less damage), so it is usually the safer switch. Shadow hits about 20% harder but is frailer, so it fits the lead or closer role. A Shadow can still be a safe switch into a matchup where it resists the incoming charged moves.')}</p><div class="fcells">${cells}</div><p class="fsim">${T('Average rating against the regional meta, weighted by use.')}</p></details>`;}
const tlist=ts=>`<span class="tbars">${ts.map(t=>typeChip(t)).join('')}</span>`;
function mateCard(x,ctx){const {units,ps,cnt,load}=ctx,X=Cx[x.c],p=x.p;const why=[];
  // who it covers, who covers it
  const cov=ps.map((q,i)=>({i,c:coverOf(q,p)})).filter(o=>o.c.sh.length||o.c.mv.length).sort((a,b)=>b.c.v-a.c.v).slice(0,2);
  for(const o of cov){const nm=esc(dn(units[o.i].name));if(o.c.sh.length)why.push(`<li class="g">${T('Resists {name}\'s weaknesses:',{name:nm})} ${tlist(o.c.sh)}</li>`);const mvOnly=o.c.mv.filter(t=>!o.c.sh.includes(t));if(mvOnly.length)why.push(`<li class="g">${T('Hits {name}\'s threats super effectively:',{name:nm})} ${tlist(mvOnly)}</li>`);}
  const back=ps.map((q,i)=>({i,c:coverOf(p,q)})).filter(o=>o.c.sh.length).sort((a,b)=>b.c.v-a.c.v).slice(0,2);
  for(const o of back)why.push(`<li class="b">${T('{name} covers its weaknesses:',{name:esc(dn(units[o.i].name))})} ${tlist(o.c.sh)}</li>`);
  // matchup cover for the member it helps most
  let bi=-1,bv=-1;ps.forEach((q,i)=>{const v=muDir(q,p);if(v>bv){bv=v;bi=i;}});
  if(bi>=0){const q=ps[bi];const lost=[];for(let m=0;m<NM;m++)if(q.L[m]&&Mx[m].u>=5)lost.push(m);const beat=lost.filter(m=>p.W[m]).sort((a,b)=>Mx[b].u-Mx[a].u);
    if(beat.length)why.push(`<li class="m">${T('Beats {k} of {t} common Pokémon that beat {name}:',{k:beat.length,t:lost.length,name:esc(dn(units[bi].name))})} ${beat.slice(0,4).map(m=>esc(dn(Mx[m].n))).join(', ')}</li>`);}
  const patch=[];for(let m=0;m<NM;m++)if(cnt[m]<=1&&p.W[m]&&Mx[m].u>=8)patch.push(m);patch.sort((a,b)=>Mx[b].u-Mx[a].u);
  if(units.length>=3&&patch.length)why.push(`<li class="m">${T('Answers threats your team barely handles:')} ${patch.slice(0,4).map(m=>esc(dn(Mx[m].n))).join(', ')}</li>`);
  const heavy=TYPES.map((t,k)=>({t,v:load[k]*p.rs[k]})).filter(o=>o.v>0.15).sort((a,b)=>b.v-a.v).slice(0,3).map(o=>o.t);
  if(units.length>=3&&heavy.length)why.push(`<li class="g">${T('Takes pressure off your team\'s weak spots:')} ${tlist(heavy)}</li>`);
  if(x.dv<0)why.push(`<li class="g">${T('Fixes a shared weakness')}</li>`);if(x.dv>0)why.push(`<li class="bad">${T('Adds a shared weakness')}</li>`);
  const used=X.u;const tag=used>=8?`<span class="tag">${T('Proven · {k} teams',{k:used})}</span>`:`<span class="tag anti">${used?T('Rarely used · {k} teams',{k:used}):T('Not used at the regionals')}</span>`;
  return `<div class="mate"><div class="mhead">${badge(X.n,X.sid,true)}<div class="mt"><b>${esc(dn(X.n))}</b>${typeBars(X.sid)}<small>${[X.f,...X.c].map(mvTag).join(' · ')}</small></div><div class="mr"><span class="mstr ${p.str>=0.2?'hi':p.str>=-0.05?'mid':'lo'}">${T('Meta: {s}',{s:strLabel(p.str)})}</span>${tag}<button class="btn" data-addteam="${x.c}">${T('Add')}</button></div></div><ul class="mwhy">${why.join('')}</ul>${formNote(x)}</div>`;}
// team-level quality for swaps and finished teams
function teamQ(units){const ps=units.map(mprof),n=units.length;let rel=0,mu=0,np=0;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){rel+=pairRel(ps[i],ps[j]);mu+=pairMu(ps[i],ps[j]);np++;}rel/=np||1;mu/=np||1;
  const tu=Mx.reduce((s,m)=>s+m.u,0);const tri=[];if(n>=3)combos(n,3).forEach(ix=>{let s=0;for(let m=0;m<NM;m++)if(ix.some(k=>ps[k].W[m]))s+=Mx[m].u;tri.push(s/tu);});
  const best=ps.map((p,i)=>Math.max(0,...ps.map((q,j)=>i===j?0:pairMu(p,q))));
  const str=ps.reduce((s,p)=>s+p.str,0)/n;
  const tm=tri.length?tri.reduce((a,b)=>a+b,0)/tri.length:0,tw=tri.length?Math.min(...tri):0,wl=Math.min(...best);
  return {q:100*(0.15*rel/3.5+0.6*mu+tm+0.5*tw+0.4*wl+0.4*str)-5*weakRule(units).v,rel,mu,tri,tm,tw,wl,str,best};}
function mateComplete(units,firstC){let cur=[...units,candUnitM(firstC)];while(cur.length<6){const s=mateSuggest(cur,1);if(!s.res.length)break;cur.push(s.res[0].u);}return {units:cur,q:teamQ(cur)};}
function fitPanel(units){if(units.length<3)return '';const Q=teamQ(units),ps=units.map(mprof),n=units.length;
  const trios=combos(n,3).map((ix,k)=>({ix,v:Q.tri[k]})).sort((a,b)=>b.v-a.v);const good=trios.filter(t=>t.v>=0.8).length;
  const rows=units.map((u,i)=>{let bj=-1,bv=-1;ps.forEach((q,j)=>{if(j!==i){const v=pairMu(ps[i],q);if(v>bv){bv=v;bj=j;}}});const r=roleNums(u);
    const cell=v=>{const c=heatCol(v);return `<td class="hc" style="background:${c.bg};color:${c.fg}">${v}</td>`;};
    return `<tr><th class="hl">${monTag(u.name,u.sid)}</th><td class="fbp">${bj>=0?esc(dn(units[bj].name)):''}<small class="num">${pct(bv)}</small></td>${cell(r[0])}${cell(r[1])}${cell(r[2])}</tr>`;}).join('');
  return `<div class="card grid fitp"><h3 style="font-size:18px;margin-bottom:4px">${T('How your team fits together')}</h3><p class="lede" style="font-size:13px">${T('A strong six is flexible: any three can come out (AAA, AAB, ABB or ABC) and every member has a partner that covers its losses.')}</p>
   <div class="kpis"><div class="card kpi"><small>${T('Trios that beat 80%+ of the meta')}</small><span class="big num" data-cu="${good}" data-cuf="i" data-cuk="fitgood">${good}</span><small>${T('of {n}',{n:trios.length})}</small></div><div class="card kpi"><small>${T('Weakest trio')}</small><span class="big num">${pct(Q.tw)}</span></div><div class="card kpi"><small>${T('Least-supported member')}</small><span class="big num">${pct(Q.wl)}</span><small>${esc(dn(units[Q.best.indexOf(Q.wl)].name))}</small></div></div>
   <div class="hmwrap"><table class="hm fitt"><thead><tr><th class="hl"></th><th>${T('Best partner (losses covered)')}</th><th class="hh">${T('Lead')}<br><small>2</small></th><th class="hh">${T('Safe swap')}<br><small>1</small></th><th class="hh">${T('Closer')}<br><small>0</small></th></tr></thead><tbody>${rows}</tbody></table></div>
   <p class="lede" style="font-size:12px">${T('Lead, safe swap and closer are each member\'s average rating against the regional meta at 2, 1 and 0 shields.')}</p>
   <h4 class="trh">${T('All {n} trios, strongest first',{n:trios.length})}</h4><div class="trios">${trios.map(t=>{const c=heatCol(Math.max(0,Math.min(1000,500+(t.v-0.75)*2000)));return `<span class="trio" style="background:${c.bg};color:${c.fg}" title="${pct(t.v)}">${t.ix.map(k=>esc(dn(units[k].name))).join(' · ')}<b class="num">${pct(t.v)}</b></span>`;}).join('')}</div></div>`;}
// ---------- threats to your team, counters to those threats, coverage swaps
// Member-side ratings against the anti-meta pool (live sims, cached per build)
const MPCACHE=new Map();
function memberVsPool(s){const k=keyOf(s.sid,s.f,s.c);if(MPCACHE.has(k))return MPCACHE.get(k);const b=bld(s.sid,s.f,s.c),out=new Int16Array(NC*3);
  const L=[];for(let c=0;c<NC;c++){if(!inAntiFloor(c))continue;L.push(c);const cb=candB(c);for(let sh=0;sh<3;sh++)out[c*3+sh]=SIM.fastBattle(b,cb,sh,sh);}
  if(HAS_PVE)refine(out,L,c=>-(out[c*3]+out[c*3+1]+out[c*3+2]),(c,sh)=>SIM.battle(b,candB(c),sh,sh));MPCACHE.set(k,out);return out;}
const CTCACHE=new Map();
function candVsCand(a,b,exact){const k=a+'|'+b+(exact?'|x':'');let r=CTCACHE.get(k);if(!r){const A=candB(a),B=candB(b),f=exact?SIM.battle:SIM.fastBattle;r=[0,1,2].map(sh=>f(A,B,sh,sh));CTCACHE.set(k,r);}return SH==='avg'?Math.round((r[0]+r[1]+r[2])/3):r[SH];}
const isAns=t=>t==='W'||t==='CW';
function threatRow(ts,n){const ans=ts.filter(isAns).length,lose=ts.filter(t=>t==='L').length,close=ts.filter(t=>t==='CL'||t==='T').length;return {ans,lose,close,sev:(lose+0.5*close)/n};}
// Regional meta Pokémon (3+ teams) that beat much of your six, weighted by use
function metaThreats(units){const n=units.length,out=[];
  for(let m=0;m<NM;m++){const u=Mx[m].u;if(u<3)continue;const rs=units.map(x=>x.r(m)),ts=rs.map(tier),o=threatRow(ts,n);
    if(o.ans>=2&&o.sev<0.5)continue;if(o.ans>=3)continue;
    out.push(Object.assign(o,{m,u,name:Mx[m].n,sid:Mx[m].sid,rs,r3:j=>units[j].r3(m),score:u*(o.sev+(o.ans===0?0.6:o.ans===1?0.25:0))}));}
  out.sort((a,b)=>b.score-a.score);return out.slice(0,10);}
// Rarely used picks (anti-meta pool) that beat most of your six
function antiThreats(slots,units){const n=slots.length,arrs=slots.map(memberVsPool),out=[],best=new Map();
  for(let c=0;c<NC;c++){if(!okAnti(c))continue;const rs=arrs.map(a=>pickArr(a,c)),ts=rs.map(tier),o=threatRow(ts,n);
    if(o.sev<0.5||o.ans>=2)continue;const avg=rs.reduce((x,y)=>x+y,0)/n;
    const row=Object.assign(o,{c,u:Cx[c].u,name:Cx[c].n,sid:Cx[c].sid,rs,r3:j=>[arrs[j][c*3],arrs[j][c*3+1],arrs[j][c*3+2]],avg});
    const b=baseSp(Cx[c].n),prev=best.get(b);if(!prev||row.sev>prev.sev||(row.sev===prev.sev&&row.avg<prev.avg))best.set(b,row);}
  for(const v of best.values())out.push(v);out.sort((a,b)=>b.sev-a.sev||a.ans-b.ans||a.avg-b.avg);return out.slice(0,8);}
function bestSlot(units,c){const cu=unitOfCand(c);let best=null;
  if(units.length<6){const e=teamEval([...units,cu]);return {k:-1,e};}
  units.forEach((u,k)=>{const e=teamEval(units.map((x,j)=>j===k?cu:x));if(!best||e.score>best.e.score)best={k,e};});return best;}
// Pokémon that beat the threats above
function threatCounters(units,mt,at){const P=prTable(),have=new Set(units.map(u=>baseSp(u.name)));
  const wm=mt.map(x=>x.score),avgW=wm.length?wm.reduce((a,b)=>a+b,0)/wm.length:1,wa=at.map(x=>0.5*avgW*x.sev);
  const tot=wm.reduce((a,b)=>a+b,0)+wa.reduce((a,b)=>a+b,0)||1;const C=[];
  for(let c=0;c<NC;c++){if(!(okCommon(c)||okAnti(c))||have.has(baseSp(Cx[c].n)))continue;let v=0;const bm=[],ba=[];
    mt.forEach((x,j)=>{const t=tier(P[c*NM+x.m]);v+=wm[j]*TW[t];if(isAns(t))bm.push(j);});
    if(bm.length<Math.min(2,mt.length))continue;
    at.forEach((x,j)=>{if(x.c===c)return;const t=tier(candVsCand(c,x.c));v+=wa[j]*TW[t];if(isAns(t))ba.push(j);});
    C.push({c,v:v/tot,bm,ba});}
  // shortlist on threats beaten, then judge each on what its best swap does to the whole team,
  // and keep the list varied (at most two sharing a primary type)
  C.sort((a,b)=>b.v-a.v);const e0=teamEval(units),seen=new Set(),short=[];
  for(const x of C){const b=baseSp(Cx[x.c].n);if(seen.has(b))continue;seen.add(b);x.sw=bestSlot(units,x.c);x.rank=x.v+(x.sw.e.score-e0.score)/25;short.push(x);if(short.length>=30)break;}
  short.sort((a,b)=>b.rank-a.rank);const per={},res=[];
  for(const x of short){const t=typesOf(Cx[x.c].sid)[0];if((per[t]||0)>=2)continue;per[t]=(per[t]||0)+1;res.push(x);if(res.length>=6)break;}
  if(HAS_PVE)res.forEach(x=>{x.ba=[];at.forEach((y,j)=>{if(y.c!==x.c&&isAns(tier(candVsCand(x.c,y.c,true))))x.ba.push(j);});});
  return res;}
// Single swaps that raise core coverage (1+ first, then 2+). A core is covered by a member with no clear
// loss to any core member, so coverage after a swap = coverage now - outgoing member + incoming one.
function coverageSwaps(units,e0){const big=BIG(),tot=big.reduce((s,c)=>s+c[1],0),n=units.length,P=prTable();
  const have=new Set(units.map(u=>baseSp(u.name)));
  const okU=units.map(u=>big.map(([mem])=>mem.every(m=>tier(u.r(m))!=='L')));
  const clean0=big.map((_,ci)=>okU.reduce((a,o)=>a+(o[ci]?1:0),0));
  const out=[];
  for(let c=0;c<NC;c++){if(!(okCommon(c)||okAnti(c))||have.has(baseSp(Cx[c].n)))continue;
    const okC=big.map(([mem])=>mem.every(m=>tier(P[c*NM+m])!=='L'));
    for(let k=0;k<n;k++){let w1=0,w2=0;for(let ci=0;ci<big.length;ci++){const cl=clean0[ci]-(okU[k][ci]?1:0)+(okC[ci]?1:0);if(cl>=1)w1+=big[ci][1];if(cl>=2)w2+=big[ci][1];}
      const d1=w1/tot-e0.c1,d2=w2/tot-e0.c2;if(d1<-0.0001||(d1<0.005&&d2<0.005))continue;out.push({c,k,d1,d2});}}
  out.sort((a,b)=>b.d1-a.d1||b.d2-a.d2);const seen=new Set(),res=[];
  for(const x of out.slice(0,120)){const b=baseSp(Cx[x.c].n);if(seen.has(b))continue;const cu=unitOfCand(x.c);x.e=teamEval(units.map((u,j)=>j===x.k?cu:u));
    if(x.e.score<=e0.score)continue;seen.add(b);res.push(x);if(res.length>=6)break;}return res;}
const sgn=d=>{const v=Math.round(d*100);return (v>0?'+':v<0?'−':'±')+Math.abs(v);};
const bandNum=v=>`<b class="bv ${covBand(v)}">${pct(v)}</b>`;
function covChange(e0,e1){return `${T('1+ answer')} ${bandNum(e0.c1)} → ${bandNum(e1.c1)} · ${T('2+ answers')} ${bandNum(e0.c2)} → ${bandNum(e1.c2)}`;}
function weakDelta(e0,e1){const fixed=e0.wr.bad.filter(t=>!e1.wr.bad.includes(t)),added=e1.wr.bad.filter(t=>!e0.wr.bad.includes(t));
  return (fixed.length?`<small style="color:var(--win)">${T('Fixes shared {t} weakness',{t:fixed.map(typeTag).join(' ')})}</small>`:'')+(added.length?`<small style="color:var(--loss)">${T('Adds a shared {t} weakness',{t:added.map(typeTag).join(' ')})}</small>`:'');}
function threatTable(id,rows,units,extraHead,extra){
  let h=`<div class="hmwrap"><table class="hm thr" data-hm="${id}"><thead><tr><th class="hl"></th><th class="hx">${extraHead}</th>${units.map(u=>`<th class="hh" title="${esc(dn(u.name))}">${badge(u.name,u.sid)}<span class="hn">${esc(shortName(u.name))}</span></th>`).join('')}<th class="hh hb">${T('Answers')}</th></tr></thead><tbody>`;
  rows.forEach(row=>{h+=`<tr><th class="hl">${monTag(row.name,row.sid)}</th><td class="hx num">${extra(row)}</td>${units.map((u,j)=>heatTd(row.rs[j],id+'|'+row.name+'|'+u.name,{r3:row.r3(j),pair:`${dn(u.name)} vs ${dn(row.name)}`})).join('')}<td class="ansn a${Math.min(row.ans,2)}" title="${esc(T('Members with a win or close win'))}">${row.ans}</td></tr>`;});
  return h+`</tbody></table></div><div class="hmfoot"><span class="hminfo" data-hmi="${id}">${T('Tap a cell to see it at each shield count.')}</span></div>`;}
function threatPanel(units,e){if(units.length<3)return '';const slots=team.filter(Boolean),n=units.length;
  const mt=metaThreats(units),at=antiThreats(slots,units),ct=threatCounters(units,mt,at),full=n>=6;
  const nm=x=>`<b>${esc(dn(x.name))}</b>`;
  // plain-language read-out
  const say=[];const none=mt.filter(x=>x.ans===0);
  if(none.length)say.push(T('Nobody on your team answers {list}, together used on {k} regional teams.',{list:none.slice(0,3).map(nm).join(', '),k:none.slice(0,3).reduce((a,x)=>a+x.u,0)}));
  else if(mt.length)say.push(T('Every common threat has at least one answer, but {list} rely on a single member.',{list:mt.filter(x=>x.ans===1).slice(0,3).map(nm).join(', ')||nm(mt[0])}));
  if(mt.length){const w=mt.slice().sort((a,b)=>b.sev-a.sev||b.u-a.u)[0];say.push(T('{name} beats {k} of your {n}.',{name:nm(w),k:w.lose+w.close,n}));}
  if(at.length)say.push(T('Off-meta, {list} would trouble most of your team.',{list:at.slice(0,3).map(nm).join(', ')}));
  if(ct.length){const cn=x=>`<b>${esc(dn(Cx[x.c].n))}</b>`;
    if(!full){const c=ct[0];say.push(T('Best fix: {c} beats {a} of your {b} top meta threats.',{c:cn(c),a:c.bm.length,b:mt.length}));}
    else{const c=ct.find(x=>x.sw.k>=0&&x.sw.e.c1>=e.c1-0.0001&&x.sw.e.score>e.score);
      if(c)say.push(T('Best fix: {c} beats {a} of your {b} top meta threats; swapping it in for {m} moves core coverage from {p} to {q}.',{c:cn(c),a:c.bm.length,b:mt.length,m:`<b>${esc(dn(units[c.sw.k].name))}</b>`,p:pct(e.c1),q:pct(c.sw.e.c1)}));
      else say.push(T('{c} beats the most threats ({a} of {b}), but every swap for it lowers core coverage elsewhere, so check the trade-off below.',{c:cn(ct[0]),a:ct[0].bm.length,b:mt.length}));}}
  let h=`<div class="card grid thrp"><h3 style="font-size:18px;margin-bottom:4px">${T('Threats to your team')}</h3><p class="lede" style="font-size:13px">${T('Pokémon that beat most of your team or that only one member answers, at {sc}. Cells are your Pokémon\'s results; Answers counts members with a win or close win.',{sc:scenLabel()})}</p>`;
  if(say.length)h+=`<div class="readout">${say.map(x=>`<p>${x}</p>`).join('')}</div>`;
  h+=`<h4 class="trh">${T('From the regional meta')}</h4>`+(mt.length?threatTable('thm',mt,units,T('Teams'),x=>x.u):`<p class="empty">${T('No regional meta Pokémon beats most of your team.')}</p>`);
  h+=`<h4 class="trh">${T('Anti-meta picks that would trouble you')}</h4><p class="lede" style="font-size:12px">${T('Rarely used Pokémon from the anti-meta pool (your setting at the top) that beat at least half of your team and are answered by one member or none. Simulated live with PvPoke\'s recommended moves.')}</p>`+(at.length?threatTable('tha',at,units,T('Teams'),x=>x.u):`<p class="empty">${T('None found: your team handles the anti-meta pool.')}</p>`);
  h+=`</div>`;
  if(ct.length){h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Counters to your threats')}</h3><p class="lede" style="font-size:13px">${T('Ranked by how much of the threat list above they beat, with the most-used threats counting most. Each shows the best member to swap out and what that does to core coverage.')}</p>${ct.map(x=>{const X=Cx[x.c],sw=x.sw;
    const beat=[...x.bm.map(j=>mt[j]),...x.ba.map(j=>at[j])];
    return `<div class="ans" style="cursor:default"><span class="nm">${monTag(X.n,X.sid)} <span class="tag ${okAnti(x.c)?'anti':''}">${okAnti(x.c)?T('Anti-meta'):T('Meta')}</span><small>${[X.f,...X.c].map(mvTag).join(' · ')}</small>
     <small>${T('Beats')} ${beat.map(b=>esc(dn(b.name))).join(', ')}</small>
     <small>${sw.k>=0?`${T('Swap out')} <b>${esc(dn(units[sw.k].name))}</b>: `:''}${covChange(e,sw.e)}</small>${weakDelta(e,sw.e)}</span>
     <span class="num" title="${esc(T('Share of threat weight beaten'))}">${pct(x.v)}</span>${sw.k>=0?`<button class="btn ghost" data-swap="${sw.k}:${x.c}">${T('Swap')}</button>`:`<button class="btn ghost" data-addteam="${x.c}">${T('Add')}</button>`}</div>`;}).join('')}</div>`;}
  if(full){const cs=coverageSwaps(units,e);
    h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Meta swaps that raise core coverage')}</h3><p class="lede" style="font-size:13px">${T('Every one-for-one swap from the meta and anti-meta pools, ranked by the gain in cores with 1+ answer, then 2+ answers.')} ${cs.length?'':T('No single swap raises your core coverage.')}</p>${cs.map(x=>{const X=Cx[x.c];
      const newly=[...x.e.beaten].filter(i=>!e.beaten.has(i)).sort((a,b)=>Mx[b].u-Mx[a].u).slice(0,4).map(i=>esc(dn(Mx[i].n)));
      return `<div class="ans" style="cursor:default"><span class="nm">${T('Swap')} <b>${esc(dn(units[x.k].name))}</b> → ${monTag(X.n,X.sid)} <span class="tag ${okAnti(x.c)?'anti':''}">${okAnti(x.c)?T('Anti-meta'):T('Meta')}</span><small>${[X.f,...X.c].map(mvTag).join(' · ')}</small><small>${covChange(e,x.e)}${newly.length?' · '+T('now beats')+' '+newly.join(', '):''}</small>${weakDelta(e,x.e)}</span><span class="num" title="${esc(T('Gain in 1+ / 2+ answer coverage, in points'))}">${sgn(x.d1)}<small class="g2"> / ${sgn(x.d2)}</small></span><button class="btn ghost" data-swap="${x.k}:${x.c}">${T('Swap')}</button></div>`;}).join('')}</div>`;}
  return h;}
let teamToken=0;
function renderTeam(){const out=$('teamOut');const units=teamUnits();
  if(!units.length){out.innerHTML='<p class="empty">Add Pokémon above to check your team and get suggestions.</p>';return;}
  const tok=++teamToken;out.innerHTML='<p class="busy">Checking your team…</p>';
  setTimeout(()=>{if(tok!==teamToken)return;
  const e=teamEval(units);
  let h=(units.length>=3?`<div class="sharebar"><button class="btn" data-share="team">${T('Share team card')}</button><span>${T('A picture of your team, its matchups and a link that loads it.')}</span></div>`:'')+metricRow(e,'team')+`<p class="lede">${T('An answer is a team member with no clear loss to anyone in the core (close losses count). Measured over {k} duo and trio cores used on 5+ teams, weighted by use, at {sc}. Custom movesets are simulated live.',{k:BIG().length,sc:scenLabel()})}${e.wr.bad.length?` <b style="color:var(--loss)">${T('Shared weaknesses needing another resist:')} ${e.wr.bad.map(typeTag).join(' ')}.</b>`:''}</p>`;
  // suggestions (teammate engine)
  if(units.length<6){const s=mateSuggest(units,8);
    h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Best teammates for the next slot')}</h3><p class="lede" style="font-size:13px">${units.length<=2?T('Looking for partners that cover your Pokémon\'s weaknesses by typing and/or moves, and that your Pokémon covers in return. Having both is ideal. Every member counts equally.'):T('Now also looking at the whole team: threats only one member handles, the weak spots several members share, and giving every member a partner.')} ${T('Each pick has to be at least decent in the meta. Rarely used Pokémon stay in the pool.')}</p><div class="mates">${s.res.map(x=>mateCard(x,s.ctx)).join('')}</div></div>`;
    if(units.length<=4){const comps=[],seenSets=new Set();for(const o of s.res.slice(0,6)){const cp=mateComplete(units,o.c);const key=cp.units.map(u=>u.name).sort().join('|');if(seenSets.has(key))continue;seenSets.add(key);comps.push(cp);if(comps.length>=3)break;}
      h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:8px">${T('Three ways to finish the team')}</h3><div class="cols">${comps.map((cp,k)=>{const good=cp.q.tri.filter(v=>v>=0.8).length;return `<div class="panel"><h3>${T('Option {k}',{k:k+1})}</h3><div class="core" style="flex-direction:column;align-items:flex-start">${cp.units.map((u,j)=>j<units.length?`<span style="color:var(--muted)">${esc(dn(u.name))}</span>`:monTag(u.name,u.sid)).join('')}</div>
        <p class="sumline" style="margin-top:8px">${T('{a} of {b} trios beat 80%+ of the meta',{a:good,b:cp.q.tri.length})} · ${T('weakest trio')} <b class="num">${pct(cp.q.tw)}</b>${weakRule(cp.units).v?` · <span style="color:var(--loss)">${T('{t} shared',{t:weakRule(cp.units).bad.map(typeTag).join(' ')})}</span>`:''}</p>
        <button class="btn ghost" data-useteam="${cp.units.slice(units.length).map(u=>u.c).join(',')}">Use this team</button></div>`;}).join('')}</div></div>`;}}
  else{// swaps judged on team fit
    const q0=teamQ(units);const sw=[];units.forEach((u,k)=>{const rest=units.filter((_,j)=>j!==k);const s=mateSuggest(rest,3);for(const o of s.res){const q=teamQ([...rest,o.u]);sw.push({k,o,q,d:q.q-q0.q});}});
    sw.sort((a,b)=>b.d-a.d);const top=sw.filter(x=>x.d>1).slice(0,6);
    h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">Swaps that would help</h3><p class="lede" style="font-size:13px">${T('Replacing one member at a time, judged on how well the six fit together.')} ${top.length?'':T('No single swap improves this team meaningfully.')}</p>${top.map(x=>`<div class="ans" style="cursor:default"><span class="nm">${T('Swap')} <b>${esc(dn(units[x.k].name))}</b> → ${monTag(Cx[x.o.c].n,Cx[x.o.c].sid)}<small>${T('Trios beating 80%+')} ${q0.tri.filter(v=>v>=0.8).length} → <b>${x.q.tri.filter(v=>v>=0.8).length}</b> · ${T('weakest trio')} ${pct(q0.tw)} → <b>${pct(x.q.tw)}</b> · ${T('least-supported member')} ${pct(q0.wl)} → <b>${pct(x.q.wl)}</b></small></span><span class="num">+${x.d.toFixed(1)}</span><button class="btn ghost" data-swap="${x.k}:${x.o.c}">Swap</button></div>`).join('')}</div>`;}
  h+=threatPanel(units,e);
  h+=fitPanel(units);
  // threat heatmap
  const th=THREATS();
  h+=`<div class="card grid chartbox"><h3 style="font-size:18px;margin-bottom:4px">${T('Most-used meta Pokémon vs your team')}</h3><p class="lede" style="font-size:13px">${T('Each cell is your Pokémon\'s result at {sc}. Darker green is a clearer win, darker red a clearer loss.',{sc:scenLabel()})}</p>${heatmap({id:'tmh',rows:th.map(x=>({name:Mx[x.i].n,sid:Mx[x.i].sid,extra:x.u})),extraHead:T('Teams'),cols:units.map(u=>({name:u.name,sid:u.sid})),val:(i,j)=>units[j].r(th[i].i),r3:(i,j)=>units[j].r3(th[i].i),best:true,pair:(i,j)=>`${dn(units[j].name)} vs ${dn(Mx[th[i].i].n)}`})}</div>`;
  {const tc=typeHeat(team.filter(Boolean),'tmt');h+=`<div class="card grid"><h3 style="font-size:18px;margin-bottom:4px">${T('Type chart')}</h3>${tc.html}${tc.gaps.length?`<p class="lede" style="font-size:13px">${T('No super-effective move against:')} ${tc.gaps.map(typeTag).join(' ')}</p>`:''}</div>`;}
  const gaps=e.gaps.sort((a,b)=>b[1]-a[1]).slice(0,12);
  h+=`<h3 style="font-size:18px">Biggest gaps: cores with no answer on your team</h3><div class="list">${gaps.map((g,k)=>coreRow(g,k+1)).join('')||'<p class="empty">No gaps among cores used on 5+ teams.</p>'}</div>`;
  out.innerHTML=h;},20);}
$('teamOut').addEventListener('click',e=>{
  const a=e.target.closest('[data-addteam]');if(a){const k=team.findIndex(s=>!s);if(k>=0){team[k]=mkSlot({name:Cx[+a.dataset.addteam].n});saveTeam();teamSlots.render();renderTeam();}return;}
  const u=e.target.closest('[data-useteam]');if(u){const add=u.dataset.useteam.split(',').map(Number);for(const c of add){const k=team.findIndex(s=>!s);if(k>=0)team[k]=mkSlot({name:Cx[c].n});}saveTeam();teamSlots.render();renderTeam();window.scrollTo({top:0});return;}
  const s=e.target.closest('[data-swap]');if(s){const [k,c]=s.dataset.swap.split(':').map(Number);const filled=team.map((x,i)=>x?i:-1).filter(i=>i>=0);team[filled[k]]=mkSlot({name:Cx[c].n});saveTeam();teamSlots.render();renderTeam();window.scrollTo({top:0});}});
// ---------- CORE LAB
const LAB_EX=[{name:'Corviknight'},{name:'Quagsire'}];
let lab=[];
function saveLab(){try{localStorage.setItem('gl_lab',JSON.stringify(lab.map(s=>({name:s.name,f:s.f,c:s.c}))));}catch(e){}}
function loadLab(){try{const l=JSON.parse(localStorage.getItem('gl_lab')||'null');if(Array.isArray(l)&&l.length)return l;}catch(e){}return LAB_EX;}
function setLab(list){lab=list.map(mkSlot).filter(Boolean).slice(0,6);saveLab();renderLab();}
function addLab(name){if(lab.length>=6||lab.some(s=>s.name===name))return;const s=mkSlot({name});if(s){lab.push(s);saveLab();renderLab();}}
const labSlots=Slots({el:$('labSlots'),prefix:'lb',max:6,fixed:false,compact:false,list:()=>lab,save:()=>{lab=lab.filter(Boolean);saveLab();},onChange:()=>renderLab()});
$('labAdd').addEventListener('click',()=>{const pickName=['Melmetal','Florges','Clodsire','Altaria','Corsola (Galarian)','Thievul'].find(n=>!lab.some(s=>s.name===n));if(pickName)addLab(pickName);});
$('labReset').addEventListener('click',()=>{lab.forEach(s=>{s.f=s.df;s.c=s.dc.slice();});saveLab();renderLab();});
$('labToTeam').addEventListener('click',()=>{team=[0,1,2,3,4,5].map(k=>lab[k]?Object.assign({},lab[k],{c:lab[k].c.slice(),dc:lab[k].dc.slice()}):null);saveTeam();go('team');window.scrollTo({top:0});});
function hint(){const h=[];if(lab.some(s=>s.name==='Corviknight'))h.push(`<button data-hint="Corviknight|PAYBACK|IRON_HEAD">${esc(dn('Corviknight'))}: ${esc(mvName('IRON_HEAD'))} ↔ ${esc(mvName('PAYBACK'))}</button>`);
  if(lab.some(s=>s.name==='Quagsire'))h.push(`<button data-hint="Quagsire|MUD_BOMB|STONE_EDGE">${esc(dn('Quagsire'))}: ${esc(mvName('STONE_EDGE'))} ↔ ${esc(mvName('MUD_BOMB'))}</button>`);
  $('labHint').innerHTML=h.length?'<span>Try:</span>'+h.join(''):'';}
$('labHint').addEventListener('click',e=>{const b=e.target.closest('[data-hint]');if(!b)return;const [n,to,from]=b.dataset.hint.split('|');const s=lab.find(x=>x.name===n);if(!s)return;
  if(s.c.includes(from))s.c=s.c.map(x=>x===from?to:x);else if(s.c.includes(to))s.c=s.c.map(x=>x===to?from:x);saveLab();renderLab();});
let labToken=0;
function renderLab(){labSlots.render();hint();$('labAdd').hidden=lab.length>=6;const out=$('labOut');if(!lab.length){out.innerHTML='<p class="empty">Add a Pokémon to start.</p>';return;}
  const tok=++labToken;out.innerHTML='<p class="busy">Running battles…</p>';
  setTimeout(()=>{if(tok!==labToken)return;labCompute(tok);},20);}
function weightedSummary(arr){const w={W:0,CW:0,T:0,CL:0,L:0};let tot=0;for(let m=0;m<NM;m++){const u=Mx[m].u;tot+=u;w[tier(pickArr(arr,m))]+=u;}for(const k in w)w[k]/=tot;return w;}
function labCompute(tok){
  const V=lab.map(s=>getVs(s.sid,s.f,s.c)),VD=lab.map(s=>getVs(s.sid,s.df,s.dc));
  const r3=(a,m)=>[a[m*3],a[m*3+1],a[m*3+2]];
  lab.forEach((s,k)=>{const w=weightedSummary(V[k]);let h=`<span>vs meta usage:</span>${tierBar(w)}${['W','CW','CL','L'].map(t=>`${chip(t)}<span class="num">${pct(w[t])}</span>`).join(' ')}`;
    if(isChanged(s)){const up=[],down=[];for(let m=0;m<NM;m++){const a=tier(pickArr(V[k],m)),b=tier(pickArr(VD[k],m));if(a!==b){const win=t=>TV[t]>=3;if(win(a)&&!win(b))up.push(m);else if(!win(a)&&win(b))down.push(m);}}
      const fmt=l=>l.sort((x,y)=>Mx[y].u-Mx[x].u).slice(0,8).map(m=>esc(dn(Mx[m].n))).join(', ')+(l.length>8?' '+T('+{k} more',{k:l.length-8}):'');
      h+=`<div class="delta" style="flex-basis:100%">${up.length?`<span class="up">▲ ${T('Now wins vs:')} ${fmt(up)}</span>`:''}${down.length?`<span class="down">▼ ${T('Now loses to:')} ${fmt(down)}</span>`:''}${!up.length&&!down.length?'<span>'+T('Same wins and losses as the default moveset (ratings may still shift).')+'</span>':''}</div>`;}
    const el=$('lbsum'+k);if(el)el.innerHTML=h;});
  const top=Mx.map((m,i)=>({i,u:m.u})).sort((a,b)=>b.u-a.u).slice(0,40);
  let covered=0,totU=0;for(const {i,u} of top){let b=0;lab.forEach((s,k)=>{b=Math.max(b,TV[tier(pickArr(V[k],i))]);});totU+=u;if(b>=3)covered+=u;}
  let g=`<div class="card grid chartbox"><h3 style="font-size:18px;margin-bottom:4px">Coverage vs the 40 most-used meta Pokémon</h3><p class="lede" style="font-size:13px">${T('At {sc}. Outlined cells changed because of your moves; cells that flash changed since your last edit.',{sc:scenLabel()})}</p>${heatmap({id:'lbh',rows:top.map(x=>({name:Mx[x.i].n,sid:Mx[x.i].sid,extra:x.u})),extraHead:T('Teams'),cols:lab.map(s=>({name:s.name,sid:s.sid})),val:(i,k)=>pickArr(V[k],top[i].i),r3:(i,k)=>r3(V[k],top[i].i),chg:(i,k)=>tier(pickArr(V[k],top[i].i))!==tier(pickArr(VD[k],top[i].i)),best:true,pair:(i,k)=>`${dn(lab[k].name)} vs ${dn(Mx[top[i].i].n)}`})}<p class="lede" style="font-size:13px;margin-top:8px">${T('Someone in this group wins (W or CW) against Pokémon making up <b>{p}</b> of these 40 Pokémon\'s usage.',{p:pct(covered/totU)})}</p></div>`;
  const tc=typeHeat(lab,'lbt');
  let wk=`<div class="card grid wk"><h3 style="font-size:18px;margin-bottom:4px">${T('Shared weaknesses and move coverage')}</h3><p class="lede" style="font-size:13px">Your rule: if two or more members share a weakness, two or more should resist it. Flagged rows break it.</p>${tc.html}${tc.flagged.length?`<p class="why" style="color:var(--loss)"><b>${T('Shared weaknesses needing another resist:')} ${tc.flagged.map(typeTag).join(' ')}</b></p>`:''}</div>`;
  $('labOut').innerHTML=g+wk+'<div class="card" id="labCounters"><p class="busy">Finding what beats this group…</p></div>';
  setTimeout(()=>{if(tok!==labToken)return;
    const CV=lab.map(s=>getCv(s.sid,s.f,s.c)),CD=lab.map(s=>getCv(s.sid,s.df,s.dc));
    const members=lab.map(s=>({name:s.name,sid:s.sid,f:s.f,c:s.c}));
    const ct=counters(lab.length,lab.map(s=>s.name),(c,j)=>r3(CV[j],c));
    let prev=null;if(lab.some(isChanged)){const cd=counters(lab.length,lab.map(s=>s.name),(c,j)=>r3(CD[j],c));prev={common:new Map(),anti:new Map()};
      const inTop=new Set([...cd.common,...cd.anti].map(r=>r.c));
      for(const key of ['common','anti'])for(const r of ct[key])if(inTop.has(r.c))prev[key].set(r.c,lab.map((s,j)=>tier(pick(r3(CD[j],r.c)))));}
    $('labCounters').innerHTML=`<h3 style="font-size:18px;margin-bottom:6px">${T('What beats this group')}${lab.length>3?' '+T('(all members)'):''}</h3><p class="lede" style="font-size:13px">${T('With your moves, at {sc}.',{sc:scenLabel()})} ${prev?T('"New answer" means it only becomes an answer because of your moveset changes; otherwise the default-moves result is shown when it differs.'):''}</p>`+detailHTML(members,ct,prev);
  },20);}
// ---------- OPPONENT PREVIEW
const TEAMS=DATA.T;
const teamLabel=(t)=>`${t[0]} #${t[1]} ${t[2]}${t[3]?' (Day 2)':''}`;
let oppMode='real',oppIdx=0,oppCustom=['','','','','',''];
try{const o=JSON.parse(localStorage.getItem('gl_opp')||'null');if(o){oppMode=o.m||'real';oppIdx=o.i||0;oppCustom=o.c||oppCustom;}}catch(e){}
if(!localStorage.getItem||oppIdx===0){const lastEv=DATA.ev[DATA.ev.length-1][0];const k=TEAMS.findIndex(t=>t[0]===lastEv&&t[1]===1);if(k>=0&&!oppIdx)oppIdx=k;}
function saveOpp(){try{localStorage.setItem('gl_opp',JSON.stringify({m:oppMode,i:oppIdx,c:oppCustom}));}catch(e){}}
function oppUnits(){if(oppMode==='real')return TEAMS[oppIdx][4].filter(m=>m[1]).map(m=>({name:m[0],sid:m[1],f:m[2],c:m[3]}));
  return oppCustom.map(fromDisp).filter(n=>n&&defaultMoves(n)).map(n=>{const d=defaultMoves(n);return {name:n,sid:sidOf(n),f:d.f,c:d.c};});}
function combos(n,k){const out=[];const rec=(s,p)=>{if(p.length===k){out.push(p.slice());return;}for(let i=s;i<n;i++){p.push(i);rec(i+1,p);p.pop();}};rec(0,[]);return out;}
function renderPreviewInputs(){
  $('opReal').hidden=oppMode!=='real';$('opCustom').hidden=oppMode==='real';setSeg(['om-real','om-custom'],'om-'+oppMode);
  {const t=TEAMS[oppIdx];$('opCur').innerHTML=t?`<span class="rtp"><b>${esc(t[2])}</b><small>${esc(t[0])} · #${t[1]}${t[3]?' · '+T('Day 2'):''}</small></span><span class="rtm">${t[4].filter(m=>m[1]).map(m=>monTag(m[0],m[1])).join('')}</span>`:'';}
  if(!$('opb').hidden&&$('opb').open)OPP.render();
  $('opCustom').innerHTML=oppCustom.map((n,k)=>`<input type="text" id="oc${k}" list="allNames" value="${esc(dn(fromDisp(n)))}" placeholder="${T('Opponent')} ${k+1}" aria-label="${T('Opponent')} ${k+1}" autocomplete="off">`).join('');
  oppCustom.forEach((n,k)=>$('oc'+k).addEventListener('change',e=>{oppCustom[k]=e.target.value.trim();saveOpp();renderPreview();}));}
let pvToken=0;
function renderPreview(){const out=$('pvOut');const mine=team.filter(Boolean),opp=oppUnits();
  if(mine.length<3){out.innerHTML='<p class="empty">'+T('Add at least three Pokémon to your team above.')+'</p>';return;}
  if(opp.length<3){out.innerHTML='<p class="empty">The opponent needs at least three Pokémon.</p>';return;}
  const tok=++pvToken;out.innerHTML='<p class="busy">Simulating your six against theirs…</p>';
  setTimeout(()=>{if(tok!==pvToken)return;
  const A=mine.map(s=>bld(s.sid,s.f,s.c)),B=opp.map(o=>bld(o.sid,o.f,o.c));
  const R=A.map(a=>B.map(b=>[0,1,2].map(s=>SIM.battle(a,b,s,s))));
  const avg=(r)=>Math.round((r[0]+r[1]+r[2])/3), rv=(i,j)=>pick(R[i][j]);
  // trio quality: how well we answer their three minus how well they answer ours
  function Q(Y,T){let a=0,b=0;for(const t of T){let mx=0;for(const y of Y)mx=Math.max(mx,avg(R[y][t]));a+=mx;}for(const y of Y){let mx=0;for(const t of T)mx=Math.max(mx,1000-avg(R[y][t]));b+=mx;}return (a/T.length)-(b/Y.length)+500;}
  const YT=combos(mine.length,3),TT=combos(opp.length,3);
  const trios=YT.map(Y=>{let worst=1e9,wT=null,sum=0;for(const T of TT){const q=Q(Y,T);sum+=q;if(q<worst){worst=q;wT=T;}}return {Y,worst,wT,avgq:sum/TT.length};}).sort((x,y)=>y.worst-x.worst||y.avgq-x.avgq);
  const best=trios[0];
  // roles
  const perms=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];let role=null;
  for(const p of perms){const L=best.Y[p[0]],S=best.Y[p[1]],C=best.Y[p[2]];
    const lead=opp.reduce((s,_,j)=>s+R[L][j][2],0)/opp.length;
    const bad=opp.map((_,j)=>j).filter(j=>R[L][j][2]<500);
    const swap=bad.length?1000*bad.filter(j=>R[S][j][1]>500).length/bad.length:opp.reduce((s,_,j)=>s+R[S][j][1],0)/opp.length;
    const closer=best.wT.reduce((s,j)=>s+R[C][j][0],0)/3;
    const sc=lead+0.8*swap+0.8*closer;if(!role||sc>role.sc)role={L,S,C,sc,bad,lead,closer};}
  const nm=i=>esc(dn(mine[i].name)),on=j=>esc(dn(opp[j].name));
  const leadW=opp.map((_,j)=>j).filter(j=>R[role.L][j][2]>500),leadL=role.bad;
  const swapFix=leadL.filter(j=>R[role.S][j][1]>500),swapNo=leadL.filter(j=>R[role.S][j][1]<=500);
  const closerW=best.wT.filter(j=>R[role.C][j][0]>500);
  let h=`<div class="card"><h3 style="font-size:18px;margin-bottom:10px">${T('Bring:')}</h3><div class="bring">${[role.L,role.S,role.C].map((i,k)=>`<div class="bmon">${badge(mine[i].name,mine[i].sid,true)}<div><small>${[T('Lead'),T('Safe swap'),T('Closer')][k]}</small><b>${esc(dn(mine[i].name))}</b>${typeBars(mine[i].sid)}</div></div>`).join('')}</div>
   <div class="cols"><div class="panel"><h3>${T('Lead')} · ${nm(role.L)}</h3><p class="why">${T('At 2 shields it beats <b>{a} of their {b}</b> possible leads',{a:leadW.length,b:opp.length})}${leadW.length?': '+leadW.map(on).join(', '):''}.${leadL.length?' '+T('Loses to {list}.',{list:leadL.map(on).join(', ')}):''}</p></div>
   <div class="panel"><h3>${T('Safe swap')} · ${nm(role.S)}</h3><p class="why">${leadL.length?T('Comes in when they lead with {list}.',{list:leadL.map(on).join(' / ')})+' '+(swapFix.length?T('At 1 shield it beats {list}.',{list:swapFix.map(on).join(', ')}):T('At 1 shield it does not clearly beat them.'))+(swapNo.length?' '+T('Still struggles with {list}.',{list:swapNo.map(on).join(', ')}):''):T('Your lead has no losing lead matchup here, so this slot is free to cover their back line.')}</p></div>
   <div class="panel"><h3>${T('Closer')} · ${nm(role.C)}</h3><p class="why">${T('Against their most dangerous three for this trio ({list}), it wins {k} of 3 with no shields',{list:best.wT.map(on).join(', '),k:closerW.length})}${closerW.length?': '+closerW.map(on).join(', '):''}.</p></div></div>
   <p style="margin-top:10px"><button class="btn" id="pvT3">${T('Play it out in 3v3')}</button> <span class="mxsub2">${T('Your three against their most dangerous three.')}</span></p>
   <p class="lede" style="font-size:13px;margin-top:8px">${T('Picked by worst case: the trio that holds up best even when they bring their best counter-trio. Lead is judged at 2 shields, safe swap at 1, closer at 0.')}</p></div>`;
  const mkKey=(lab,arr)=>`<div class="mkey"><h4>${lab}</h4>${arr.map(s=>`<div class="mkr"><span class="mkn"><b>${esc(dn(s.name))}</b>${typeBars(s.sid)}</span><span class="mkm">${[s.f,...s.c].filter(Boolean).map(mvTag).join('<span class="sep">·</span>')}</span></div>`).join('')}</div>`;
  h+=`<div class="card grid chartbox"><h3 style="font-size:18px;margin-bottom:4px">Your six vs their six</h3><p class="lede" style="font-size:13px">${T('Their actual registered moves. At {sc}.',{sc:scenLabel()})}</p>${heatmap({id:'pvh',typed:true,corner:T('You \\ Them'),rows:mine.map(s=>({name:s.name,sid:s.sid})),cols:opp.map(o=>({name:o.name,sid:o.sid})),val:(i,j)=>rv(i,j),r3:(i,j)=>R[i][j],pair:(i,j)=>`${dn(mine[i].name)} vs ${dn(opp[j].name)}`})}<div class="keys">${mkKey(T('Your six'),mine)}${mkKey(T('Their six'),opp)}</div></div>`;
  h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:6px">Every trio you could bring</h3><div class="tblwrap" style="border:0"><table class="vt"><thead><tr><th>#</th><th>Trio</th><th class="r">Worst case</th><th class="r">Average</th><th>Their best answer</th></tr></thead><tbody>${trios.map((t,k)=>`<tr><td class="num">${k+1}</td><td>${t.Y.map(nm).join(' · ')}</td><td class="r num">${Math.round(t.worst)}</td><td class="r num">${Math.round(t.avgq)}</td><td style="font-size:13px">${t.wT.map(on).join(' · ')}</td></tr>`).join('')}</tbody></table></div><p class="lede" style="font-size:13px">${T('Score 500 = even trade. Above 500 your three answer theirs better than they answer yours.')}</p></div>`;
  out.innerHTML=h;PV3=[[role.L,role.S,role.C].map(i=>mine[i]),best.wT.map(j=>opp[j])];},20);}
let PV3=null;$('pvOut').addEventListener('click',e=>{if(e.target.closest('#pvT3')&&PV3)openT3(PV3[0],PV3[1]);});
seg(['om-real','om-custom'],id=>{oppMode=id.slice(3);saveOpp();renderPreviewInputs();renderPreview();});

$('opRandom').addEventListener('click',()=>{const d2=TEAMS.map((t,i)=>t[3]?i:-1).filter(i=>i>=0);oppIdx=d2[Math.floor(Math.random()*d2.length)];saveOpp();renderPreviewInputs();renderPreview();});
// ---------- TRENDS
let trK='mon',trS='rise';
function trendRows(){const last=EVN.length-1,rows=[];
  const mk=(names,label,sids)=>{const idx=teamsWith(names);if(idx.length<5)return null;const be=byEvent(idx);const shares=be.map((x,e)=>x[0]/EVT[e]);
    const early=be.slice(0,last).reduce((s,x)=>s+x[0],0)/EVT.slice(0,last).reduce((s,x)=>s+x,0);const delta=shares[last]-early;
    return {label,sids,names,be,shares,delta,n:idx.length,d:idx.reduce((s,i)=>s+DATA.T[i][3],0)};};
  if(trK==='mon'){Mx.forEach((m,i)=>{const r=mk([m.n],m.n,[m.sid]);if(r){r.mi=[i];rows.push(r);}});}
  else{const k=trK==='duo'?2:3;for(const c of DATA.cores){if(c[0].length!==k||c[1]<5)continue;const ns=c[0].map(i=>Mx[i].n);const r=mk(ns,ns.join(' + '),c[0].map(i=>Mx[i].sid));if(r){r.mi=c[0];rows.push(r);}}}
  rows.sort(trS==='rise'?(a,b)=>b.delta-a.delta:trS==='fall'?(a,b)=>a.delta-b.delta:(a,b)=>b.n-a.n);return rows;}
function renderTrends(){const last=EVN.length-1;const rows=trendRows().slice(0,60);
  $('trChart').innerHTML=`<h3 style="font-size:18px;margin-bottom:4px">${T('Share of teams by event')}</h3><p class="lede" style="font-size:13px">${T('The first eight rows of the list below. Tap a name to highlight its line.')}</p>`+lineChart(rows.slice(0,8));
  if(!$('trScat').dataset.done){$('trScat').innerHTML=`<h3 style="font-size:18px;margin-bottom:4px">${T('Usage against Day 2 conversion')}</h3><p class="lede" style="font-size:13px">${T('Every Pokémon on 8+ regional teams. Further right = more teams; higher = reached Day 2 more often than average (adjusted for sample size).')}</p>`+scatter();$('trScat').dataset.done='1';}
  $('trNote').textContent=T('Change compares {a} ({na} teams) with {b} pooled ({nb} teams). Smaller events swing more, so check the counts.',{a:EVN[last],na:EVT[last],b:EVN.slice(0,last).join(', '),nb:EVT.slice(0,last).reduce((s,x)=>s+x,0)});
  $('trBody').innerHTML=rows.map((r,k)=>`<tr><td class="num">${k+1}</td><td>${r.mi.map(i=>monTag(Mx[i].n,Mx[i].sid)).join('<span class="plus">+</span>')}</td><td class="r num">${r.n}</td><td>${spark(r.shares,null,EVN)}</td><td style="font-size:12px;color:var(--muted);white-space:nowrap">${r.be.map((x,e)=>`${EVN[e].slice(0,3)} ${x[0]}${x[0]?'/'+x[1]:''}`).join(' · ')}</td><td class="r"><span class="conv ${r.delta>0.02?'hi':r.delta<-0.02?'lo':'mid'}">${r.delta>=0?'▲ +':'▼ '}${(r.delta*100).toFixed(1)} ${T('pts')}</span></td><td>${r.mi.length>1?`<button class="link" data-lab="${r.mi.join(',')}">Lab</button>`:`<button class="link" data-build="${esc(r.names[0])}">Open</button>`}</td></tr>`).join('');}
seg(['tk-mon','tk-duo','tk-tri'],id=>{trK=id.slice(3);renderTrends();});seg(['ts-rise','ts-fall','ts-n'],id=>{trS=id.slice(3);renderTrends();});
// ---------- GBL 3v3
const rawG=typeof RGB64!=='undefined'?Uint8Array.from(atob(RGB64),c=>c.charCodeAt(0)):new Uint8Array(0);
const NG=(typeof GBL!=='undefined')?GBL.idx.length:0;
const GW=Array.from({length:NG},(_,i)=>1-0.7*i/Math.max(1,NG-1));
let G3M='gbl',G3S='sug';
try{const s=JSON.parse(localStorage.getItem('gl_g3')||'{}');if(s.m)G3M=s.m;if(s.s==='rate'||s.s==='sug')G3S=s.s;}catch(e){}
function g3save(){try{localStorage.setItem('gl_g3',JSON.stringify({m:G3M,s:G3S}));localStorage.setItem('gl_trio',JSON.stringify(trio.map(s=>s?{name:s.name,f:s.f,c:s.c}:null)));}catch(e){}}
function g3meta(){if(G3M==='gbl')return {n:NG,key:'g',name:i=>Cx[GBL.idx[i]].n,sid:i=>Cx[GBL.idx[i]].sid,mv:i=>[Cx[GBL.idx[i]].f,...Cx[GBL.idx[i]].c],b:i=>candB(GBL.idx[i]),w:GW,R:(c,i)=>{const o=(c*NG+i)*3;return [rawG[o]*4,rawG[o+1]*4,rawG[o+2]*4];}};
  return {n:NM,key:'r',name:i=>Mx[i].n,sid:i=>Mx[i].sid,mv:i=>[Mx[i].f,...Mx[i].c],b:i=>metaB(i),w:Mx.map(m=>m.u),R:(c,i)=>R3(c,i)};}
const G3CACHE=new Map();
function g3Vs(s,M){const k=M.key+'|'+keyOf(s.sid,s.f,s.c);if(G3CACHE.has(k))return G3CACHE.get(k);const b=bld(s.sid,s.f,s.c),out=new Int16Array(M.n*3);
  for(let i=0;i<M.n;i++){const o=M.b(i);for(let sh=0;sh<3;sh++)out[i*3+sh]=SIM.battle(b,o,sh,sh);}G3CACHE.set(k,out);return out;}
let trio=[null,null,null];
function loadTrio(){try{const t=JSON.parse(localStorage.getItem('gl_trio')||'null');if(Array.isArray(t)&&t.length===3)return t.map(x=>x?mkSlot(x):null);}catch(e){}return EX.slice(0,3).map(n=>mkSlot({name:n}));}
const trioSlots=Slots({el:$('g3Slots'),prefix:'g3',max:3,fixed:true,compact:true,list:()=>trio,save:g3save,onChange:()=>{trioSlots.render();renderG3();}});
$('g3FromTeam').addEventListener('click',()=>{const f=team.filter(Boolean).slice(0,3);trio=[0,1,2].map(k=>f[k]?Object.assign({},f[k],{c:f[k].c.slice(),dc:f[k].dc.slice()}):null);g3save();trioSlots.render();renderG3();});
$('g3Clear').addEventListener('click',()=>{trio=[null,null,null];g3save();trioSlots.render();renderG3();});
function g3units(M){return trio.filter(Boolean).map(s=>{const a=g3Vs(s,M);return {name:s.name,sid:s.sid,types:typesOf(s.sid),a,r3:i=>[a[i*3],a[i*3+1],a[i*3+2]],r:i=>pickArr(a,i)};});}
function candUnit(c,M){return {name:Cx[c].n,sid:Cx[c].sid,types:typesOf(Cx[c].sid),c,r3:i=>M.R(c,i),r:i=>pick(M.R(c,i))};}
function wShare(u,M){const o={W:0,CW:0,T:0,CL:0,L:0};let t=0;for(let i=0;i<M.n;i++){o[tier(u.r(i))]+=M.w[i];t+=M.w[i];}for(const k in o)o[k]/=t;return o;}
function trioValue(units,M){let v=0,t=0;for(let i=0;i<M.n;i++){let b=0;for(const u of units){const x=TW[tier(u.r(i))];if(x>b)b=x;}v+=b*M.w[i];t+=M.w[i];}return v/t-0.06*weakRule(units).v;}
function coverage(units,M){let v=0,t=0;for(let i=0;i<M.n;i++){let b=0;for(const u of units)b=Math.max(b,TV[tier(u.r(i))]);if(b>=3)v+=M.w[i];t+=M.w[i];}return v/t;}
function g3roles(units,M){const P=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];let best=null;const W=M.w.reduce((a,b)=>a+b,0);
  for(const p of P){const [L,S,C]=p.map(k=>units[k]);let lead=0,lossW=0,fix=0,clo=0;
    for(let i=0;i<M.n;i++){const w=M.w[i];const rl=L.r3(i)[2];lead+=w*rl;if(rl<500){lossW+=w;if(S.r3(i)[1]>500)fix+=w;}clo+=w*C.r3(i)[0];}
    const sc=lead/W+0.8*(lossW?1000*fix/lossW:500)+0.8*clo/W;if(!best||sc>best.sc)best={L,S,C,sc,lead:lead/W,cover:lossW?fix/lossW:1,clo:clo/W};}
  return best;}
const metaLabel=()=>G3M==='gbl'?T('PvPoke Great League top {n} (rank-weighted)',{n:NG}):T('the regional meta (usage-weighted)');
function renderG3(){if(G3S!=='rate')G3S='sug';setSeg(['g3-sug','g3-rate'],'g3-'+G3S);setSeg(['gm-gbl','gm-reg'],'gm-'+G3M);const full=trio.filter(Boolean).length===3;$('g3RateBtn').hidden=G3S==='rate';$('g3RateBtn').disabled=!full;
  if(G3S==='rate')g3Rate();else g3Sug();}
function g3Rate(){const out=$('g3Out'),M=g3meta(),units=g3units(M);
  if(!units.length){out.innerHTML='<p class="empty">'+T('Add up to three Pokémon above.')+'</p>';return;}
  const cov=coverage(units,M);
  let h=(units.length===3?`<div class="sharebar"><button class="btn" data-share="trio">${T('Share trio card')}</button><span>${T('A picture of your trio, its matchups and a link that loads it.')}</span></div>`:'')+`<p class="lede">${T('Tested against {m}, at {sc}.',{m:metaLabel(),sc:scenLabel()})}</p>`;
  h+=`<div class="kpis"><div class="card kpi"><small>${T('Meta beaten by at least one member')}</small><span class="big num" data-cu="${cov}" data-cuf="p" data-cuk="g3cov">${pct(cov)}</span></div>${units.map(u=>{const s=wShare(u,M);return `<div class="card kpi"><small>${esc(dn(u.name))}</small>${tierBar(s)}<span class="sumline g3sum">${['W','CW','CL','L'].map(t=>`${chip(t)}<span class="num">${pct(s[t])}</span>`).join(' ')}</span></div>`;}).join('')}</div>`;
  if(units.length===3){const r=g3roles(units,M);
    const leadLoss=[];for(let i=0;i<M.n;i++)if(r.L.r3(i)[2]<500)leadLoss.push(i);leadLoss.sort((a,b)=>M.w[b]-M.w[a]);
    const top=leadLoss.slice(0,6);
    h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:10px">${T('Suggested order')}</h3><div class="cols">
      <div class="panel"><h3>${T('Lead')} · ${esc(dn(r.L.name))}</h3><p class="why">${T('Wins {p} of possible leads at 2 shields (weighted by how common each is).',{p:'<b>'+pct(1-leadLoss.reduce((s,i)=>s+M.w[i],0)/M.w.reduce((a,b)=>a+b,0))+'</b>'})}</p></div>
      <div class="panel"><h3>${T('Safe swap')} · ${esc(dn(r.S.name))}</h3><p class="why">${T('Covers {p} of your lead\'s bad leads at 1 shield.',{p:'<b>'+pct(r.cover)+'</b>'})}${top.length?' '+T('Most common bad leads: {list}.',{list:top.map(i=>esc(dn(M.name(i)))+' '+chip(tier(r.S.r3(i)[1]))).join(', ')}):''}</p></div>
      <div class="panel"><h3>${T('Closer')} · ${esc(dn(r.C.name))}</h3><p class="why">${T('Average rating {r} with no shields left.',{r:'<b>'+Math.round(r.clo)+'</b>'})}</p></div></div></div>`;}
  const thr=[];for(let i=0;i<M.n;i++){const ts=units.map(u=>tier(u.r(i)));if(!ts.some(t=>TV[t]>=3))thr.push({i,ts});}
  thr.sort((a,b)=>M.w[b.i]-M.w[a.i]);
  h+=`<div class="card grid"><h3 style="font-size:18px;margin-bottom:4px">${T('Threats: nobody on your trio beats these')}</h3><p class="lede" style="font-size:13px">${T('Most common first. Close losses (CL) are still playable with shields or baits.')}</p><div style="overflow-x:auto"><table><thead><tr><th>${T('Pokémon')}</th>${units.map(u=>`<th>${esc(dn(u.name))}</th>`).join('')}</tr></thead><tbody>${thr.slice(0,15).map(x=>`<tr><td>${monTag(M.name(x.i),M.sid(x.i))}</td>${x.ts.map(t=>`<td>${chip(t)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="4">${T('No clear threats. Every common opponent has a winning answer.')}</td></tr>`}</tbody></table></div></div>`;
  const wr=weakRule(units);if(wr.v)h+=`<p class="lede" style="color:var(--loss)"><b>${T('Shared weaknesses needing another resist:')} ${wr.bad.map(typeTag).join(' ')}</b></p>`;
  const lead=[...Array(M.n).keys()].sort((a,b)=>M.w[b]-M.w[a]).slice(0,20);
  h+=`<div class="card grid"><h3 style="font-size:18px;margin-bottom:4px">${T('Your trio vs the 20 most common opponents')}</h3>${heatmap({id:'g3h',rows:lead.map(i=>({name:M.name(i),sid:M.sid(i)})),cols:units.map(u=>({name:u.name,sid:u.sid})),val:(i,j)=>units[j].r(lead[i]),r3:(i,j)=>units[j].r3(lead[i]),best:true,pair:(i,j)=>`${dn(units[j].name)} vs ${dn(M.name(lead[i]))}`})}</div>`;
  $('g3Out').innerHTML=h;}
function g3Pool(){return G3M==='gbl'?GBL.rank.slice(0,Math.max(300,NG)):[...Array(NC).keys()].filter(c=>okCommon(c)||okAnti(c));}
function g3Sug(){const out=$('g3Out'),M=g3meta(),units=g3units(M);
  if(!units.length){out.innerHTML='<p class="empty">'+T('Type the Pokémon you want to play into a slot above. You get the partners that cover it best.')+'</p>';return;}
  if(units.length===3){out.innerHTML=`<div class="card ratecta"><h3 style="font-size:18px">${T('Your trio is ready')}</h3><div class="core">${units.map(u=>monTag(u.name,u.sid)).join('<span class="plus">+</span>')}</div><p class="lede" style="font-size:13px">${T('See how it does against {m}, the best order to play it and its threats. Remove one to get suggestions for that slot again.',{m:metaLabel()})}</p><button class="btn" data-g3rate="1">${T('Rate this trio')}</button></div>`;return;}
  out.innerHTML='<p class="busy">'+T('Finding partners…')+'</p>';
  setTimeout(()=>{const have=new Set(units.map(u=>u.name)),base=trioValue(units,M),seen=new Set(),res=[];
    for(const c of g3Pool()){const n=Cx[c].n;if(have.has(n)||seen.has(n))continue;seen.add(n);const u=candUnit(c,M);res.push({c,u,v:trioValue([...units,u],M),cov:coverage([...units,u],M)});}
    res.sort((a,b)=>b.v-a.v);
    let h=`<p class="lede">${T('Ranked by how much of {m} the trio then beats, with your shared-weakness rule.',{m:metaLabel()})}</p><div class="card"><h3 style="font-size:18px;margin-bottom:6px">${units.length===2?T('Best third Pokémon'):T('Best partners')}</h3>`+res.slice(0,10).map(o=>{const x=Cx[o.c];return `<div class="ans" style="cursor:default"><span class="nm"><span>${monTag(x.n,x.sid)} ${typeBars(x.sid)}</span><small>${[x.f,...x.c].map(mvTag).join(' · ')}</small><small>${T('Meta beaten')} ${pct(coverage(units,M))} → <b>${pct(o.cov)}</b></small></span><span class="num">+${((o.v-base)*100).toFixed(1)}</span>${units.length===2?`<button class="btn" data-g3use="${o.c}">${T('Rate this trio')}</button>`:''}<button class="btn ghost" data-g3add="${o.c}">${T('Add')}</button></div>`;}).join('')+'</div>';
    if(units.length===1){const tops=res.slice(0,12),trios=[];
      for(let a=0;a<tops.length;a++)for(let b=a+1;b<tops.length;b++){const us=[...units,tops[a].u,tops[b].u];trios.push({cs:[tops[a].c,tops[b].c],v:trioValue(us,M),cov:coverage(us,M),wr:weakRule(us)});}
      trios.sort((x,y)=>y.v-x.v);
      h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:6px">${T('Complete trios')}</h3>${trios.slice(0,5).map(t=>`<div class="ans" style="cursor:default"><span class="nm">${monTag(units[0].name,units[0].sid)}<span class="plus">+</span>${t.cs.map(c=>monTag(Cx[c].n,Cx[c].sid)).join('<span class="plus">+</span>')}<small>${T('Meta beaten')} <b>${pct(t.cov)}</b>${t.wr.v?' · <span style="color:var(--loss)">'+T('{t} shared',{t:t.wr.bad.map(typeTag).join(' ')})+'</span>':''}</small></span><span></span><button class="btn" data-g3use="${t.cs.join(',')}">${T('Rate this trio')}</button></div>`).join('')}</div>`;}
    out.innerHTML=h;},20);}
$('g3Out').addEventListener('click',e=>{if(e.target.closest('[data-g3rate]')){G3S='rate';g3save();renderG3();window.scrollTo({top:0});return;}const a=e.target.closest('[data-g3add]');if(a){const k=trio.findIndex(s=>!s);if(k>=0){trio[k]=mkSlot({name:Cx[+a.dataset.g3add].n});g3save();trioSlots.render();renderG3();}return;}
  const u=e.target.closest('[data-g3use]');if(u){for(const c of u.dataset.g3use.split(',').map(Number)){const k=trio.findIndex(s=>!s);if(k>=0)trio[k]=mkSlot({name:Cx[c].n});}G3S='rate';g3save();trioSlots.render();renderG3();window.scrollTo({top:0});}});
// drills
const rnd=n=>Math.floor(Math.random()*n);
function wpick(M,excl){let t=0;for(let i=0;i<M.n;i++)if(!excl||!excl.has(M.name(i)))t+=M.w[i];let x=Math.random()*t;for(let i=0;i<M.n;i++){if(excl&&excl.has(M.name(i)))continue;x-=M.w[i];if(x<=0)return i;}return 0;}
function countPattern(g,e,n){let en=0;const seq=[];for(let k=0;k<n;k++){let c=0;while(en<e){en=Math.min(100,en+g);c++;}en-=e;seq.push(c);}return seq;}
function buildInfo(name,sid,f,c){const b=bld(sid,f,c);return {name,sid,b,f,c};}
function reasonHTML(x,y){const xt=typesOf(x.sid),yt=typesOf(y.sid);const res=[...new Set([y.f,...y.c].filter(m=>SIM.eff(MV[m].type,xt)<1))].map(mvTag);const se=[...new Set([x.f,...x.c].filter(m=>SIM.eff(MV[m].type,yt)>1))].map(mvTag);
  const b=[];if(res.length)b.push(T('resists {list}',{list:res.join(', ')}));if(se.length)b.push(T('hits super effectively with {list}',{list:se.join(', ')}));return b.length?b.join('; '):T('no type edge either way; stats and energy decide');}
function countsHTML(x){const g=MV[x.f].energyGain,t=MV[x.f].turns;return x.c.map(m=>{const e=MV[m].energy;return `${esc(mvName(x.f))} → ${esc(mvName(m))}: <b class="num">${countPattern(g,e,4).join('-')}</b> <span style="color:var(--muted)">(${T('{g} energy per fast move, {e} needed, {s}s per fast move',{g,e,s:(t*0.5).toFixed(1)})})</span>`;}).join('<br>');}
let DQ=null,DS={ok:0,n:0,streak:0};try{const d=JSON.parse(localStorage.getItem('gl_drill')||'null');if(d)DS=d;}catch(e){}
function newDrill(){const M=g3meta();const mine=trio.filter(Boolean);
  const pickMine=()=>{if(mine.length){const s=mine[rnd(mine.length)];return buildInfo(s.name,s.sid,s.f,s.c);}const i=wpick(M);return buildInfo(M.name(i),M.sid(i),M.mv(i)[0],M.mv(i).slice(1));};
  if(Math.random()<0.7){const x=pickMine();const j=wpick(M,new Set([x.name]));const y=buildInfo(M.name(j),M.sid(j),M.mv(j)[0],M.mv(j).slice(1));
    const s0=rnd(3),s1=rnd(3);const r=SIM.battle(x.b,y.b,s0,s1);DQ={type:'match',x,y,s0,s1,r,ans:r>500?0:(r<500?1:2)};}
  else{const x=pickMine();const m=x.c[rnd(x.c.length)];const g=MV[x.f].energyGain,e=MV[m].energy;const correct=Math.ceil(e/g);
    const opts=[...new Set([correct,correct-1,correct+1,correct+2].filter(v=>v>=1))].slice(0,4).sort((a,b)=>a-b);DQ={type:'count',x,m,correct,opts,ans:opts.indexOf(correct)};}
  DQ.done=false;}
function g3Drill(){if(!DQ)newDrill();const q=DQ,out=$('g3Out');
  let h=`<div class="card"><div class="sumline" style="justify-content:space-between"><span>${T('Score')}: <b class="num">${DS.ok}/${DS.n}</b> · ${T('Streak')}: <b class="num">${DS.streak}</b></span><button class="link" id="drReset">${T('Reset score')}</button></div>`;
  if(q.type==='match'){h+=`<h3 style="font-size:20px;margin:12px 0">${T('Who wins?')}</h3><div class="cols"><div class="panel"><h3>${T('You')} · ${T('{k} shield(s)',{k:q.s0})}</h3>${monTag(q.x.name,q.x.sid)}<p class="moves">${[q.x.f,...q.x.c].map(mvTag).join(' · ')}</p></div><div class="panel"><h3>${T('Opponent')} · ${T('{k} shield(s)',{k:q.s1})}</h3>${monTag(q.y.name,q.y.sid)}<p class="moves">${[q.y.f,...q.y.c].map(mvTag).join(' · ')}</p></div></div>
    <div class="controls" style="margin-top:10px">${[T('{name} wins',{name:esc(dn(q.x.name))}),T('{name} wins',{name:esc(dn(q.y.name))})].map((l,k)=>`<button class="btn ${q.done?(k===q.ans?'':'ghost'):'ghost'}" data-dr="${k}" ${q.done?'disabled':''}>${l}</button>`).join('')}</div>`;
    if(q.done){const t=tier(q.r);h+=`<p class="why" style="margin-top:10px"><b>${q.pick===q.ans?T('Correct!'):T('Not quite.')}</b> ${T('Rating {r} for you',{r:'<span class="num">'+q.r+'</span>'})} ${chip(t)}${Math.abs(q.r-500)<MARGIN?' · '+T('a close one: a bait or one fast move can flip it.'):''}</p>
      <p class="why"><b>${esc(dn(q.x.name))}:</b> ${reasonHTML(q.x,q.y)}<br><b>${esc(dn(q.y.name))}:</b> ${reasonHTML(q.y,q.x)}</p><p class="why">${countsHTML(q.x)}<br>${countsHTML(q.y)}</p>`;}}
  else{h+=`<h3 style="font-size:20px;margin:12px 0">${T('How many {fast} to reach {charged}?',{fast:esc(mvName(q.x.f)),charged:esc(mvName(q.m))})}</h3>${monTag(q.x.name,q.x.sid)}
    <div class="controls" style="margin-top:10px">${q.opts.map((v,k)=>`<button class="btn ${q.done&&k===q.ans?'':'ghost'}" data-dr="${k}" ${q.done?'disabled':''}>${v}</button>`).join('')}</div>`;
    if(q.done)h+=`<p class="why" style="margin-top:10px"><b>${q.pick===q.ans?T('Correct!'):T('Not quite.')}</b> ${T('From zero energy: {n} fast moves for the first one. Pattern for the next throws (leftover energy carries over):',{n:q.correct})}<br>${countsHTML(q.x)}</p>`;}
  if(q.done)h+=`<div class="controls" style="margin-top:8px"><button class="btn" id="drNext">${T('Next question')}</button></div>`;
  h+='</div>';out.innerHTML=h;}
$('g3Out').addEventListener('click',e=>{const b=e.target.closest('[data-dr]');if(b&&DQ&&!DQ.done){DQ.pick=+b.dataset.dr;DQ.done=true;DS.n++;if(DQ.pick===DQ.ans){DS.ok++;DS.streak++;}else DS.streak=0;try{localStorage.setItem('gl_drill',JSON.stringify(DS));}catch(err){}g3Drill();return;}
  if(e.target.id==='drNext'){newDrill();g3Drill();return;}if(e.target.id==='drReset'){DS={ok:0,n:0,streak:0};try{localStorage.setItem('gl_drill',JSON.stringify(DS));}catch(err){}g3Drill();}});
// practice battle (decisions graded by the simulator)
let PB=null;
function newBattle(){const M=g3meta();const ex=new Set(),opp=[];while(opp.length<3){const i=wpick(M,ex);ex.add(M.name(i));opp.push(i);}PB={opp,step:0,log:[],score:0};}
function pbR(s,i,sh){const M=g3meta();const o=M.b(i);return SIM.battle(bld(s.sid,s.f,s.c),o,sh,sh);}
function grade(chosen,best,vals){const d=vals[best]-vals[chosen];return d<=25?{ok:true,txt:T('Best choice.')}:{ok:false,txt:T('Better: {name} (rating {a} vs {b}).',{name:esc(dn(trio[best].name)),a:vals[best],b:vals[chosen]})};}
function g3Battle(){const out=$('g3Out'),mine=trio.filter(Boolean);
  if(mine.length<3){out.innerHTML='<p class="empty">'+T('Fill all three slots to practise.')+'</p>';return;}
  if(!PB)newBattle();const M=g3meta(),p=PB;const on=i=>monTag(M.name(i),M.sid(i));
  let h=`<div class="card"><p class="lede" style="font-size:13px">${T('A random opponent trio from {m}. Make the calls you would make on the ladder; each decision is graded by the simulator. Real games also depend on HP and energy carried between Pokémon, so treat it as decision practice.',{m:metaLabel()})}</p>`;
  h+=p.log.map(l=>`<p class="why">${l}</p>`).join('');
  const btns=(opts)=>`<div class="controls">${opts.map(o=>`<button class="btn ghost" data-pb="${o.v}">${o.l}</button>`).join('')}</div>`;
  if(p.step===0){h+=`<h3 style="font-size:18px;margin:8px 0">${T('Step 1: choose your lead (you can\'t see their team yet).')}</h3>`+btns(trio.map((s,k)=>({v:k,l:esc(dn(s.name))})));}
  else if(p.step===1){h+=`<h3 style="font-size:18px;margin:8px 0">${T('Step 2: they lead with {name}. Stay in, or switch?',{name:on(p.opp[0])})}</h3>`+btns([{v:'stay',l:T('Stay in')},...trio.map((s,k)=>({s,k})).filter(o=>o.k!==p.cur).map(o=>({v:'sw'+o.k,l:T('Switch to {name}',{name:esc(dn(o.s.name))})}))]);}
  else if(p.step===2){h+=`<h3 style="font-size:18px;margin:8px 0">${T('Step 3: they bring in {name} (1 shield each). Stay, or switch?',{name:on(p.opp[1])})}</h3>`+btns([{v:'stay',l:T('Stay in')},...trio.map((s,k)=>({s,k})).filter(o=>o.k!==p.cur).map(o=>({v:'sw'+o.k,l:T('Switch to {name}',{name:esc(dn(o.s.name))})}))]);}
  else if(p.step===3){h+=`<h3 style="font-size:18px;margin:8px 0">${T('Step 4: their last Pokémon is {name}, no shields left. Who closes?',{name:on(p.opp[2])})}</h3>`+btns(trio.map((s,k)=>({v:k,l:esc(dn(s.name))})));}
  else{h+=`<h3 style="font-size:18px;margin:8px 0">${T('Done: {k} of 4 decisions were the best call.',{k:p.score})}</h3><p class="why">${T('Their trio')}: ${p.opp.map(on).join('<span class="plus">·</span>')}</p><div class="controls"><button class="btn" id="pbNew">${T('New opponent')}</button><button class="btn ghost" id="pbSame">${T('Same opponent again')}</button></div>`;}
  h+='</div>';out.innerHTML=h;}
$('g3Out').addEventListener('click',e=>{if(!PB)return;const b=e.target.closest('[data-pb]');
  if(e.target.id==='pbNew'){newBattle();g3Battle();return;}if(e.target.id==='pbSame'){PB={opp:PB.opp,step:0,log:[],score:0};g3Battle();return;}
  if(!b)return;const p=PB,M=g3meta(),v=b.dataset.pb;const nm=k=>esc(dn(trio[k].name)),on=i=>esc(dn(M.name(i)));
  const add=(t,g)=>{p.log.push(`${g.ok?'✅':'⚠️'} ${t} ${g.txt}`);if(g.ok)p.score++;};
  if(p.step===0){const k=+v;p.cur=k;const vals=trio.map(s=>Math.round(p.opp.reduce((a,i)=>a+pbR(s,i,2),0)/3));const best=vals.indexOf(Math.max(...vals));
    add(T('You led with {name}.',{name:nm(k)})+' '+T('Average 2-shield rating against their whole trio: {r}.',{r:vals[k]}),grade(k,best,vals));p.step=1;}
  else if(p.step===1||p.step===2){const sh=p.step===1?2:1,i=p.opp[p.step-1];const vals=trio.map(s=>pbR(s,i,sh));const k=v==='stay'?p.cur:+v.slice(2);
    const adj=vals.map((x,j)=>j===p.cur?x:x-30);const best=adj.indexOf(Math.max(...adj));
    const r=vals[k];add((v==='stay'?T('You stayed in with {name}',{name:nm(k)}):T('You switched to {name}',{name:nm(k)}))+' '+T('vs {opp}: rating {r}',{opp:on(i),r})+' '+chip(tier(r))+'.',best===k?{ok:true,txt:T('Best choice.')}:{ok:false,txt:T('Better: {name} (rating {a} vs {b}).',{name:nm(best),a:vals[best],b:r})+(best!==p.cur?' '+T('(switching costs a little: the switch timer and a free fast move.)'):'')});
    p.cur=k;p.step++;}
  else if(p.step===3){const k=+v,i=p.opp[2];const vals=trio.map(s=>pbR(s,i,0));const best=vals.indexOf(Math.max(...vals));
    add(T('{name} closes vs {opp} with no shields: rating {r}',{name:nm(k),opp:on(i),r:vals[k]})+' '+chip(tier(vals[k]))+'.',grade(k,best,vals));p.step=4;}
  g3Battle();});
seg(['g3-sug','g3-rate'],id=>{G3S=id.slice(3);g3save();renderG3();});
$('g3RateBtn').addEventListener('click',()=>{G3S='rate';g3save();renderG3();window.scrollTo({top:0});});
seg(['gm-gbl','gm-reg'],id=>{G3M=id.slice(3);DQ=null;PB=null;g3save();renderG3();});
// ---------- GBL team generator
function g3GenControls(){return `<div class="card"><div class="controls">
  <label class="fld" for="ggMust">${T('Must include')} <input type="text" id="ggMust" list="allNames" placeholder="${T('Any Pokémon')}" value="${esc(GG.must?dn(GG.must):'')}" autocomplete="off"></label>
  <label class="fld" for="ggPool">${T('Pick from')} <select id="ggPool">${(G3M==='gbl'?[50,100,200,300]:[0]).map(v=>`<option value="${v}"${GG.pool===v?' selected':''}>${v?T('PvPoke top {n}',{n:v}):T('regional picks + anti-meta pool')}</option>`).join('')}</select></label>
  <label class="fld" for="ggShadow"><input type="checkbox" id="ggShadow" ${GG.shadow?'checked':''}> ${T('Allow shadows')}</label></div></div>`;}
let GG={must:'',pool:300,shadow:true};try{const g=JSON.parse(localStorage.getItem('gl_gg')||'null');if(g)GG=Object.assign(GG,g);}catch(e){}
function g3Gen(){const out=$('g3Out');if(G3M!=='gbl')GG.pool=0;else if(!GG.pool)GG.pool=300;
  out.innerHTML=g3GenControls()+'<div id="ggRes"><p class="busy">'+T('Building teams…')+'</p></div>';
  $('ggMust').addEventListener('change',e=>{GG.must=fromDisp(e.target.value);ggSave();g3Gen();});
  $('ggPool').addEventListener('change',e=>{GG.pool=+e.target.value;ggSave();g3Gen();});
  $('ggShadow').addEventListener('change',e=>{GG.shadow=e.target.checked;ggSave();g3Gen();});
  setTimeout(()=>{if(G3S!=='gen')return;const r=$('ggRes');if(!r)return;r.innerHTML=ggRun();},30);}
function ggSave(){try{localStorage.setItem('gl_gg',JSON.stringify(GG));}catch(e){}}
function ggRun(){const M=g3meta(),n=M.n,W=M.w.reduce((a,b)=>a+b,0);
  let pool=G3M==='gbl'?GBL.rank.slice(0,GG.pool||300):[...Array(NC).keys()].filter(c=>okCommon(c)||okAnti(c));
  const seen=new Set();pool=pool.filter(c=>{const nm=Cx[c].n;if(seen.has(nm))return false;seen.add(nm);return GG.shadow||!/\(Shadow\)/.test(nm);});
  let must=null;if(GG.must){const c=(pool.find(x=>Cx[x].n===GG.must))??candIdx[GG.must];if(c!==undefined)must=c;pool=pool.filter(c=>Cx[c].n!==GG.must);}
  const vec=c=>{const v=new Float32Array(n);for(let i=0;i<n;i++)v[i]=TW[tier(pick(M.R(c,i)))];return v;};
  const V=new Map();const gv=c=>{if(!V.has(c))V.set(c,vec(c));return V.get(c);};
  const types=c=>typesOf(Cx[c].sid);
  const val=(cs)=>{let s=0;const vs=cs.map(gv);for(let i=0;i<n;i++){let b=0;for(const v of vs)if(v[i]>b)b=v[i];s+=b*M.w[i];}return s/W-0.06*weakRule(cs.map(c=>({types:types(c)}))).v;};
  const singles=pool.map(c=>({c,v:val([c])})).sort((a,b)=>b.v-a.v);
  const top=singles.slice(0,45).map(s=>s.c),wide=singles.slice(0,120).map(s=>s.c);
  let trios=[];
  if(must!==null){for(let a=0;a<wide.length;a++)for(let b=a+1;b<Math.min(wide.length,70);b++){const cs=[must,wide[a],wide[b]];trios.push({cs,v:val(cs)});}}
  else{const pairs=[];for(let a=0;a<top.length;a++)for(let b=a+1;b<top.length;b++)pairs.push({cs:[top[a],top[b]],v:val([top[a],top[b]])});
    pairs.sort((x,y)=>y.v-x.v);const key=new Set();
    for(const p of pairs.slice(0,70))for(const c of wide){if(p.cs.includes(c))continue;const cs=[...p.cs,c].sort((x,y)=>x-y),k=cs.join(',');if(key.has(k))continue;key.add(k);trios.push({cs,v:val(cs)});}}
  trios.sort((x,y)=>y.v-x.v);
  const cnt=new Map(),pick20=[];for(const t of trios){if(t.cs.some(c=>c!==must&&(cnt.get(c)||0)>=3))continue;t.cs.forEach(c=>cnt.set(c,(cnt.get(c)||0)+1));pick20.push(t);if(pick20.length>=20)break;}
  const W2=W;
  return `<p class="lede">${T('The {k} trios that beat the most of {m}, at {sc}. No Pokémon appears more than three times, so the list stays varied.',{k:pick20.length,m:metaLabel(),sc:scenLabel()})}</p><div class="list">`+pick20.map((t,k)=>{
    const units=t.cs.map(c=>candUnit(c,M));const r=g3roles(units,M);const cov=coverage(units,M);const wr=weakRule(units);
    return `<div class="row"><div class="head genhead" style="display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 14px"><span class="rank">${k+1}</span><span class="core">${[r.L,r.S,r.C].map((u,j)=>`<span class="mon">${badge(u.name,u.sid)}${esc(dn(u.name))} <span class="tag">${[T('Lead'),T('Safe swap'),T('Closer')][j]}</span></span>`).join('<span class="plus">·</span>')}<span class="bestline"><span class="bl">${T('Meta beaten')}</span> <b class="num">${pct(cov)}</b>${wr.v?` · <span style="color:var(--loss)">${T('{t} shared',{t:wr.bad.map(typeTag).join(' ')})}</span>`:''}</span></span><span class="stats"><button class="btn ghost" data-ggrate="${t.cs.join(',')}">${T('Rate this trio')}</button></span></div></div>`;}).join('')+'</div>';}
$('g3Out').addEventListener('click',e=>{const b=e.target.closest('[data-ggrate]');if(!b)return;const cs=b.dataset.ggrate.split(',').map(Number);trio=cs.map(c=>mkSlot({name:Cx[c].n}));G3S='rate';g3save();trioSlots.render();renderG3();window.scrollTo({top:0});});
// ---------- REGIONAL TEAMS DIRECTORY
let TD={ev:'all',d2:false,q:'',sort:'place',shown:60};
function tdMatch(t){if(TD.ev!=='all'&&t[0]!==TD.ev)return false;if(TD.d2&&!t[3])return false;const q=TD.q.trim().toLowerCase();if(!q)return true;
  if(t[2].toLowerCase().includes(q))return true;return t[4].some(m=>m[0].toLowerCase().includes(q)||dn(m[0]).toLowerCase().includes(q));}
function tdRows(){const idx=[];DATA.T.forEach((t,i)=>{if(tdMatch(t))idx.push(i);});
  if(TD.sort==='place')idx.sort((a,b)=>DATA.T[a][1]-DATA.T[b][1]||EVN.indexOf(DATA.T[a][0])-EVN.indexOf(DATA.T[b][0]));
  else idx.sort((a,b)=>EVN.indexOf(DATA.T[a][0])-EVN.indexOf(DATA.T[b][0])||DATA.T[a][1]-DATA.T[b][1]);return idx;}
function tdRow(i){const t=DATA.T[i];return `<div class="row"><button class="head tdhead" aria-expanded="false" data-td="${i}"><span class="rank" style="font-size:14px">#${t[1]}</span><span class="core" style="flex-direction:column;align-items:flex-start;gap:4px"><span class="sumline"><b>${esc(t[2])}</b> <span style="color:var(--muted)">${esc(t[0])}</span>${t[3]?' <span class="status ok">'+T('Day 2')+'</span>':''}</span><span class="core">${t[4].map(m=>m[1]?monTag(m[0],m[1]):`<span class="mon">${esc(m[0])}</span>`).join('')}</span></span><span></span></button><div class="detail" hidden></div></div>`;}
function renderTD(){const idx=tdRows();$('tdCount').textContent=T('{k} teams',{k:idx.length});
  $('tdList').innerHTML=idx.slice(0,TD.shown).map(tdRow).join('')+(idx.length>TD.shown?`<div class="controls" style="justify-content:center"><button class="btn ghost" id="tdMore">${T('Show more')}</button></div>`:'')||'<p class="empty">'+T('No teams match.')+'</p>';}
function unitFromMon(m){const a=getVs(m[1],m[2],m[3]);return {name:m[0],sid:m[1],types:typesOf(m[1]),a,r:i=>pickArr(a,i),r3:i=>[a[i*3],a[i*3+1],a[i*3+2]]};}
function tdAnalyse(i){const t=DATA.T[i],mons=t[4].filter(m=>m[1]);const units=mons.map(unitFromMon);const e=teamEval(units);
  const Mr={n:NM,key:'r',name:j=>Mx[j].n,sid:j=>Mx[j].sid,w:Mx.map(m=>m.u)};
  const tr=combos(units.length,3).map(ix=>{const us=ix.map(k=>units[k]);return {us,v:trioValue(us,Mr),cov:coverage(us,Mr)};}).sort((a,b)=>b.v-a.v).slice(0,3);
  const probs=THREATS().filter(x=>{let b=0;for(const u of units)b=Math.max(b,TV[tier(u.r(x.i))]);return b<=1;}).slice(0,10);
  let h=`<div class="sumline">${mons.map(m=>`<span class="whoi">${monTag(m[0],m[1])} <span style="color:var(--muted)">${[m[2],...m[3]].map(mvTag).join(' · ')}</span></span>`).join('')}</div>`;
  h+=metricRow(e,'td'+i);
  {const th=THREATS().slice(0,12);h+=`<div class="chartbox"><h3 style="font-size:15px;margin:4px 0 6px">${T('Vs the 12 most-used meta Pokémon')}</h3>${heatmap({id:'tdh'+i,rows:th.map(x=>({name:Mx[x.i].n,sid:Mx[x.i].sid})),cols:units.map(u=>({name:u.name,sid:u.sid})),val:(r,j)=>units[j].r(th[r].i),r3:(r,j)=>units[j].r3(th[r].i),best:true,pair:(r,j)=>`${dn(units[j].name)} vs ${dn(Mx[th[r].i].n)}`})}</div>`;}
  h+=`<div class="cols"><div class="panel"><h3>${T('Best three to bring vs the regional meta')}</h3>${tr.map((x,k)=>{const r=g3roles(x.us,Mr);return `<p class="why"><b>${k+1}.</b> ${[r.L,r.S,r.C].map((u,j)=>`${esc(dn(u.name))} <span class="tag">${[T('Lead'),T('Safe swap'),T('Closer')][j]}</span>`).join(' · ')} · ${T('Meta beaten')} <b>${pct(x.cov)}</b></p>`;}).join('')}</div>
   <div class="panel"><h3>${T('Problem matchups')}</h3><p class="why">${probs.length?probs.map(x=>`${monTag(Mx[x.i].n,Mx[x.i].sid)} <span style="color:var(--muted)">(${T('{k} teams',{k:x.u})})</span>`).join(' · '):T('No common Pokémon beats the whole team.')}</p>${e.wr.v?`<p class="why" style="color:var(--loss)"><b>${T('Shared weaknesses needing another resist:')} ${e.wr.bad.map(typeTag).join(' ')}</b></p>`:''}</div></div>`;
  h+=`<div class="combo"><button class="btn ghost" data-tdteam="${i}">${T('Load into Team Building')}</button><button class="btn ghost" data-tdprev="${i}">${T('Test against this team')}</button><button class="btn ghost" data-tdlab="${i}">${T('Open in Pokémon Analysis')}</button><button class="btn" data-share="td:${i}">${T('Share card')}</button></div>`;
  return h;}
document.addEventListener('click',e=>{const h=e.target.closest('button.tdhead');if(h){const det=h.nextElementSibling,open=h.getAttribute('aria-expanded')==='true';
    if(!open){det.innerHTML='<p class="busy">'+T('Analysing this team…')+'</p>';det.hidden=false;h.setAttribute('aria-expanded','true');setTimeout(()=>{det.innerHTML=tdAnalyse(+h.dataset.td);},20);}
    else{det.hidden=true;h.setAttribute('aria-expanded','false');}return;}
  if(e.target.id==='tdMore'){TD.shown+=60;renderTD();return;}
  const a=e.target.closest('[data-tdteam]');if(a){const t=DATA.T[+a.dataset.tdteam];team=[0,1,2,3,4,5].map(k=>{const m=t[4][k];return m&&m[1]?mkSlot({name:m[0],f:m[2],c:m[3]}):null;});saveTeam();go('team');window.scrollTo({top:0});return;}
  const p=e.target.closest('[data-tdprev]');if(p){oppMode='real';oppIdx=+p.dataset.tdprev;saveOpp();go('preview');window.scrollTo({top:0});return;}
  const l=e.target.closest('[data-tdlab]');if(l){const t=DATA.T[+l.dataset.tdlab];lab=t[4].filter(m=>m[1]).map(m=>mkSlot({name:m[0],f:m[2],c:m[3]})).filter(Boolean);saveLab();go('lab');window.scrollTo({top:0});}});
// ---------- HOME
function renderHome(){const last=EVN.length-1;
  const used=Mx.filter(m=>m.u>0).length;
  $('homeKpis').innerHTML=[[T('Teams'),NT],[T('Day 2'),ND],[T('Events'),EVN.length],[T('Pokémon used'),used]].map(([l,v])=>`<div class="card kpi"><small>${l}</small><span class="big num" data-cu="${v}" data-cuf="i" data-cuk="home${l}">${v}</span></div>`).join('');
  const top=Mx.map((m,i)=>({i,u:m.u})).sort((a,b)=>b.u-a.u).slice(0,5),mx=top[0].u/NT;
  $('homeTop').innerHTML=top.map(x=>`<div class="hrow"><button class="link" data-build="${esc(Mx[x.i].n)}" style="text-decoration:none;color:inherit">${monTag(Mx[x.i].n,Mx[x.i].sid)}</button><span class="hbar" aria-hidden="true"><i style="width:${(x.u/NT)/mx*100}%"></i></span><span class="num">${pct(x.u/NT)}</span></div>`).join('');
  const early=EVT.slice(0,last).reduce((s,x)=>s+x,0);const rise=[];
  Mx.forEach((m,i)=>{if(m.u<5)return;const be=byEvent(teamsWith([m.n]));const lastS=be[last][0]/EVT[last],earlyS=be.slice(0,last).reduce((s,x)=>s+x[0],0)/early;rise.push({i,d:lastS-earlyS,s:lastS});});
  rise.sort((a,b)=>b.d-a.d);const rmx=Math.max(...rise.slice(0,5).map(r=>r.s),1e-9);
  $('homeRiseH').textContent=T('Rising at {e}',{e:EVN[last]});
  $('homeRise').innerHTML=rise.slice(0,5).map(x=>`<div class="hrow"><button class="link" data-build="${esc(Mx[x.i].n)}" style="text-decoration:none;color:inherit">${monTag(Mx[x.i].n,Mx[x.i].sid)}</button><span class="hbar" aria-hidden="true"><i style="width:${x.s/rmx*100}%"></i></span><span class="conv hi">▲ +${(x.d*100).toFixed(0)} ${T('pts')}</span></div>`).join('');
  const conv=DATA.cores.filter(c=>c[0].length===2&&c[1]>=8).sort((a,b)=>adjRate(b[2],b[1])-adjRate(a[2],a[1])).slice(0,5);
  $('homeConv').innerHTML=conv.map(c=>{const cv=(c[2]/c[1])/BASE;return `<div class="hrow" style="grid-template-columns:minmax(0,1fr) auto auto"><span class="core">${c[0].map(i=>monTag(Mx[i].n,Mx[i].sid)).join('<span class="plus">+</span>')}</span><span class="num" style="color:var(--muted);font-size:12px">${c[2]}/${c[1]}</span><span class="conv ${convClass(cv)}">×${cv.toFixed(2)}</span></div>`;}).join('');
  const wi=DATA.T.findIndex(t=>t[0]===EVN[last]&&t[1]===1);
  if(wi>=0){const t=DATA.T[wi];$('homeWinH').textContent=T('Latest winner: {e}',{e:EVN[last]});
    $('homeWin').innerHTML=`<p style="margin:0 0 8px"><b>${esc(t[2])}</b> <span class="status ok">${T('Day 2')}</span></p><div class="core">${t[4].filter(m=>m[1]).map(m=>monTag(m[0],m[1])).join('')}</div><div class="controls" style="margin-top:10px"><button class="btn ghost" id="homeWinBtn" data-wi="${wi}">${T('Analyse this team')}</button></div>`;}}
document.addEventListener('click',e=>{const b=e.target.closest('#homeWinBtn');if(!b)return;const t=DATA.T[+b.dataset.wi];TD.ev=t[0];TD.q=t[2];TD.d2=false;$('tdEv').value=t[0];$('tdQ').value=t[2];$('tdD2').checked=false;go('teams');window.scrollTo({top:0});
  setTimeout(()=>{const h=document.querySelector('#v-teams button.tdhead');if(h)h.click();},50);});
// ---------- translation of static and rendered text
const RULES=[];
function trText(n){if(n.__en===undefined)n.__en=n.nodeValue;const src=n.__en,k=src.trim();if(!k)return;let out=src;
  if(LANG!=='en'&&typeof I18N!=='undefined'&&I18N[LANG]){const d=I18N[LANG];if(d[k]!=null)out=src.replace(k,d[k]);}
  if(n.nodeValue!==out)n.nodeValue=out;}
function trAttr(el,a){const key='en_'+a;if(el.dataset[key]===undefined)el.dataset[key]=el.getAttribute(a)||'';const src=el.dataset[key];let out=src;
  if(LANG!=='en'&&typeof I18N!=='undefined'&&I18N[LANG]&&I18N[LANG][src]!=null)out=I18N[LANG][src];if(el.getAttribute(a)!==out)el.setAttribute(a,out);}
function trTree(root){if(!root)return;if(root.nodeType===3){if(!(root.parentElement&&root.parentElement.closest('[data-noi18n],script,style')))trText(root);return;}
  if(root.nodeType!==1||root.closest('[data-noi18n]')||/^(SCRIPT|STYLE)$/.test(root.tagName))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest('[data-noi18n],script,style')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let n;while((n=w.nextNode()))trText(n);
  root.querySelectorAll('input[placeholder]').forEach(el=>{if(!/\d$/.test(el.getAttribute('placeholder')||'')||el.dataset.en_placeholder!==undefined)trAttr(el,'placeholder');});}
const OBS=new MutationObserver(ms=>{if(LANG==='en')return;for(const m of ms)for(const n of m.addedNodes)trTree(n);});
function fillLists(){$('metaNames').innerHTML=Mx.map(m=>`<option value="${esc(dn(m.n))}">`).join('');
  $('allNames').innerHTML=Object.keys(DATA.names).map(dn).sort((a,b)=>a.localeCompare(b)).map(n=>`<option value="${esc(n)}">`).join('');}
function setLang(l){LANG=l;try{localStorage.setItem('gl_lang',l);}catch(e){}document.documentElement.lang=l;$('langSel').value=l;
  document.querySelectorAll('[data-lang]').forEach(b=>b.hidden=b.dataset.lang!==l);
  const cur=fromDisp($('bQ').value);fillLists();$('bQ').value=dn(cur);subLine();trTree(document.body);if(typeof refresh==='function')refresh();}
// ---------- tabs + settings
// ---------- BATTLE MATRIX (Group A vs Group B, PvPoke-style)
// Entry: {sid, f, c:[c1,c2], iv:[a,d,s]|null, lv:number|null}. iv null = PvPoke default IVs for Great League.
const MXMAX=300;
let MX={A:[],B:[],sa:1,sb:1,cap:50,show:'r',sortR:'g',sortC:'g',open:{A:-1,B:-1},imp:{A:false,B:false}};
try{const o=JSON.parse(localStorage.getItem('gl_mx')||'null');if(o&&Array.isArray(o.A)){Object.assign(MX,{A:o.A,B:o.B||[],sa:o.sa??1,sb:o.sb??1,cap:o.cap||50,show:o.show||'r'});}}catch(e){}
function mxSave(){try{localStorage.setItem('gl_mx',JSON.stringify({A:MX.A,B:MX.B,sa:MX.sa,sb:MX.sb,cap:MX.cap,show:MX.show}));}catch(e){}}
// --- stats: CP, level under a cap, rank-1 stat product
const mxCPM=l=>SIM.cpm(l);
function cpOf(sid,l,a,d,s){const b=SP[sid].b,c=mxCPM(l);return Math.max(10,Math.floor((b[0]+a)*Math.sqrt(b[1]+d)*Math.sqrt(b[2]+s)*c*c/10));}
function bestLevel(sid,a,d,s,cap,cpcap){// highest level (0.5 steps) at or under the CP cap; CP rises with level, so binary search
  cpcap=cpcap||1500;let lo=2,hi=cap*2;if(cpOf(sid,1,a,d,s)>cpcap)return 1;while(lo<hi){const m=Math.ceil((lo+hi)/2);if(cpOf(sid,m/2,a,d,s)<=cpcap)lo=m;else hi=m-1;}return lo/2;}
const R1CACHE=new Map();
function rank1(sid,cap){const k=sid+'|'+cap;if(R1CACHE.has(k))return R1CACHE.get(k);const b=SP[sid].b;let best=null,bv=-1;
  for(let a=0;a<16;a++)for(let d=0;d<16;d++)for(let s=0;s<16;s++){const l=bestLevel(sid,a,d,s,cap),c=mxCPM(l);const v=(b[0]+a)*c*(b[1]+d)*c*Math.max(10,Math.floor((b[2]+s)*c));if(v>bv+1e-9){bv=v;best=[a,d,s];}}
  R1CACHE.set(k,best);return best;}
function effIV(e,cap){cap=cap||MX.cap;if(e.iv){const lv=e.lv!=null?e.lv:bestLevel(e.sid,e.iv[0],e.iv[1],e.iv[2],cap);return [lv,e.iv[0],e.iv[1],e.iv[2]];}
  const d=SP[e.sid].iv;return cap===50?d.slice():[bestLevel(e.sid,d[1],d[2],d[3],cap),d[1],d[2],d[3]];}
const eName=e=>SP[e.sid].n;
// --- moves and defaults
const MVBYNAME={};Object.keys(MV).forEach(id=>{MVBYNAME[MV[id].name.toLowerCase()]=id;});
const isFast=id=>MV[id]&&(MV[id].energyGain||0)>0;
// PvPoke labels abbreviate moves from their ids (SUPER_POWER -> SP) unless the gamemaster gives an abbreviation
const mvAbbr=id=>{const m=MV[id];if(!m)return id;return m.abbreviation||id.split('_').filter(Boolean).map(w=>w[0]).join('');};
const mvAbbrName=id=>{const m=MV[id];if(!m)return id;return m.abbreviation||m.name.split(/[ \-()]+/).filter(Boolean).map(w=>w[0].toUpperCase()).join('');};
const PVREC={},REGREC={};Cx.forEach(c=>{if(c.src===1&&!(c.sid in PVREC))PVREC[c.sid]={f:c.f,c:c.c.slice()};});Mx.forEach(m=>{REGREC[m.sid]={f:m.f,c:m.c.slice()};});
function defMoves(sid,pref){const a=pref==='reg'?(REGREC[sid]||PVREC[sid]):(PVREC[sid]||REGREC[sid]);if(a)return {f:a.f,c:a.c.slice()};const p=SP[sid];return {f:p.f[0],c:p.c.slice(0,2)};}
function mkEntry(sid,o){o=o||{};const d=defMoves(sid,o.pref);return {sid,f:o.f||d.f,c:(o.c||d.c).filter(Boolean).slice(0,2),iv:o.iv||null,lv:o.lv!=null?o.lv:null};}
// --- name / id resolution (PvPoke ids, English names, Spanish/Japanese names)
function resolveSid(tok){if(!tok)return null;let t=tok.trim(),shadow=false;
  const m=t.match(/^(.*?)-(shadow|normal|purified)$/i);if(m){t=m[1];shadow=m[2].toLowerCase()==='shadow';}
  let sid=SP[t.toLowerCase()]?t.toLowerCase():null;
  if(!sid){const n=DATA.names[t]||DATA.names[fromDisp(t)];if(n)sid=n;}
  if(!sid){const k=Object.keys(DATA.names).find(n=>n.toLowerCase()===t.toLowerCase());if(k)sid=DATA.names[k];}
  if(sid&&shadow&&!sid.endsWith('_shadow')&&SP[sid+'_shadow'])sid=sid+'_shadow';
  return sid&&SP[sid]?sid:null;}
function resolveMove(tok,fast){if(!tok)return null;const t=tok.trim();if(!t||t.toLowerCase()==='none')return '';const id=MV[t.toUpperCase()]?t.toUpperCase():MVBYNAME[t.toLowerCase()];if(!id)return null;return isFast(id)===fast?id:null;}
// PvPoke matrix label: "Name F+C1/C2 a/d/s"
function parseLabel(line){const m=line.match(/^(.+?) (\S+)\+(\S+?)(?:\/(\S+))? (\d+)\/(\d+)\/(\d+)$/);if(!m)return null;const sid=resolveSid(m[1]);if(!sid)return null;const p=SP[sid];
  const find=(ab,pool)=>pool.find(x=>MV[x]&&mvAbbr(x)===ab)||pool.find(x=>MV[x]&&mvAbbrName(x)===ab);const f=find(m[2],p.f),c=[m[3],m[4]].filter(Boolean).map(ab=>find(ab,p.c)).filter(Boolean);if(!f)return null;
  return mkEntry(sid,{f,c,iv:[+m[5],+m[6],+m[7]]});}
// Import text: PvPoke group CSV lines (id[-shadow],FAST,C1,C2[,C3][,level,atk,def,hp]), plain names or ids (one per line or comma-separated), or PvPoke matrix labels.
function parseList(text){const out=[],bad=[];let lines=String(text||'').replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
  const ex=[];for(const ln of lines){const tk=ln.split(',').map(s=>s.trim()).filter(Boolean);if(tk.length>1&&tk.every(x=>!/^[A-Z0-9_]+$/.test(x)&&!/^\d+(\.\d+)?$/.test(x)&&resolveSid(x)))ex.push(...tk);else ex.push(ln);}
  for(const ln of ex){let e=null;
    if(/ \S+\+\S+ \d+\/\d+\/\d+$/.test(ln))e=parseLabel(ln);
    else{const tk=ln.split(',').map(s=>s.trim());const sid=resolveSid(tk[0]);
      if(sid){let f=null,c=[],iv=null,lv=null,ok=true;
        if(tk.length>1){f=resolveMove(tk[1],true);const c1=resolveMove(tk[2],false),c2=resolveMove(tk[3],false);if(!f||c1===null||c2===null)ok=false;c=[c1,c2].filter(Boolean);
          let i=4;if(tk.length>4&&/^[A-Za-z_]+$/.test(tk[4]))i=5;
          const nums=tk.slice(i,i+4).map(Number);if(nums.length===4&&nums.every(n=>!isNaN(n))){lv=nums[0];iv=nums.slice(1);}else if(nums.length===3&&nums.every(n=>!isNaN(n)))iv=nums;}
        if(ok)e=mkEntry(sid,{f:f||undefined,c:c.length?c:undefined,iv,lv:iv?lv:null});}}
    if(e)out.push(e);else bad.push(ln);}
  return {out,bad};}
function exportList(G){return G.map(e=>{let s=`${e.sid},${e.f},${e.c[0]||'none'},${e.c[1]||'none'}`;if(e.iv){const v=effIV(e);s+=`,${v[0]},${v[1]},${v[2]},${v[3]}`;}return s;}).join('\n');}
// --- downloads (CSV with a BOM so Excel keeps accented names)
function download(name,text,type){const blob=new Blob(['﻿'+text],{type:type||'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);}
const csvCell=v=>{const s=String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
function listCSV(G){const rows=[['Pokemon','PvPoke id','Fast move','Charged move 1','Charged move 2','Level','Attack IV','Defense IV','HP IV','CP','PvPoke import line']];
  G.forEach(e=>{const v=effIV(e);rows.push([eName(e),e.sid,MV[e.f]?MV[e.f].name:e.f,e.c[0]?MV[e.c[0]].name:'',e.c[1]?MV[e.c[1]].name:'',v[0],v[1],v[2],v[3],cpOf(e.sid,v[0],v[1],v[2],v[3]),exportList([e])]);});
  return rows.map(r=>r.map(csvCell).join(',')).join('\r\n');}
const pvLabel=e=>{const v=effIV(e);return `${eName(e)} ${mvAbbr(e.f)}+${e.c.map(mvAbbr).join('/')} ${v[1]}/${v[2]}/${v[3]}`;};
// --- presets
// --- ready-made lists. Event lists use the moveset most used at that event (or on those Day 2 teams).
// presetData(k) -> [{sid,f,c,w}] where w is how many teams used it in that list (1 when not applicable).
function teamList(keep){const cnt=new Map();DATA.T.forEach(t=>{if(!keep(t))return;const seen=new Set();for(const m of t[4]){const sid=m[1];if(!SP[sid]||seen.has(sid))continue;seen.add(sid);
    let e=cnt.get(sid);if(!e){e={sid,w:0,mv:new Map()};cnt.set(sid,e);}e.w++;const k=m[2]+'|'+m[3].filter(Boolean).slice().sort().join(',');e.mv.set(k,(e.mv.get(k)||0)+1);}});
  return [...cnt.values()].sort((a,b)=>b.w-a.w).map(e=>{const k=[...e.mv.entries()].sort((a,b)=>b[1]-a[1])[0][0].split('|');const f=k[0],c=k[1]?k[1].split(','):[];
    const ok=SP[e.sid].f.includes(f)||MV[f];return ok?{sid:e.sid,f,c,w:e.w}:Object.assign(defMoves(e.sid,'reg'),{sid:e.sid,w:e.w});});}
function trendList(dir){const last=EVN.length-1,earlyN=EVT.slice(0,last).reduce((s,x)=>s+x,0),out=[];
  Mx.forEach(m=>{const idx=teamsWith([m.n]);if(idx.length<5)return;const be=byEvent(idx);const delta=be[last][0]/EVT[last]-be.slice(0,last).reduce((s,x)=>s+x[0],0)/earlyN;
    if(dir>0?delta>=0:delta<=0)out.push({sid:m.sid,f:m.f,c:m.c,w:idx.length,delta});});
  return out.sort((a,b)=>dir>0?b.delta-a.delta:a.delta-b.delta);}
const PRESET_CACHE=new Map();
function presetData(k){if(PRESET_CACHE.has(k)&&!['anti','team'].includes(k))return PRESET_CACHE.get(k);let L=[];
  if(k==='meta10')L=Mx.filter(m=>m.u/NT>0.10).sort((a,b)=>b.u-a.u).map(m=>({sid:m.sid,f:m.f,c:m.c,w:m.u}));
  else if(k==='d2all')L=teamList(t=>t[3]);
  else if(k.startsWith('ev:')){const e=k.slice(3);L=teamList(t=>t[0]===e);}
  else if(k.startsWith('evd2:')){const e=k.slice(5);L=teamList(t=>t[0]===e&&t[3]);}
  else if(k==='rise')L=trendList(1);else if(k==='fall')L=trendList(-1);
  else if(k.startsWith('reg')){const n=k==='regall'?NM:+k.slice(3);L=Mx.map((m,i)=>i).sort((a,b)=>Mx[b].u-Mx[a].u).slice(0,n).map(i=>({sid:Mx[i].sid,f:Mx[i].f,c:Mx[i].c,w:Mx[i].u}));}
  else if(k.startsWith('pv')){const n=+k.slice(2);L=(typeof GBL!=='undefined'?GBL.rank:[]).slice(0,n).map(c=>({sid:Cx[c].sid,f:Cx[c].f,c:Cx[c].c,w:1}));}
  else if(k==='anti')L=[...Array(NC).keys()].filter(okAnti).sort((a,b)=>NETS[b]-NETS[a]).map(c=>({sid:Cx[c].sid,f:Cx[c].f,c:Cx[c].c,w:1}));
  else if(k==='team')L=team.filter(Boolean).map(s=>({sid:s.sid,f:s.f,c:s.c,w:1}));
  L=L.slice(0,MXMAX);PRESET_CACHE.set(k,L);return L;}
function presetList(k){return presetData(k).map(x=>mkEntry(x.sid,{f:x.f,c:x.c}));}
// groups of lists for the menus, with live counts
function presetGroups(){const n=k=>presetData(k).length;
  return [[T('Regional meta'),[['meta10',T('Regional meta: on 10%+ of teams (Day 1)')],['reg25',T('Regional meta: top 25')],['reg50',T('Regional meta: top 50')],['reg100',T('Regional meta: top 100')],['regall',T('Regional meta: all')]]],
    [T('Day 2'),[['d2all',T('Day 2: every Pokémon on a Day 2 team')]]],
    [T('Each regional'),EVN.map(e=>['ev:'+e,T('{e}: every Pokémon',{e})])],
    [T('Each regional, Day 2'),EVN.map(e=>['evd2:'+e,T('{e} Day 2',{e})])],
    [T('Trends'),[['rise',T('Trending up (includes 0%)')],['fall',T('Trending down (includes 0%)')]]],
    [T('Anti-meta and ladder'),[['anti',T('Anti-meta pool (your setting)')],['pv50',T('PvPoke Great League rankings: top 50')],['pv100',T('PvPoke Great League rankings: top 100')],['pv200',T('PvPoke Great League rankings: top 200')],['pv300',T('PvPoke Great League rankings: top 300')]]],
    [T('Yours'),[['team',T('My team (Team Building)')]]]].map(([g,opts])=>[g,opts.map(([k,l])=>[k,l,n(k)])]);}
function presetOptions(sel,skip){skip=skip||[];return presetGroups().map(([g,opts])=>{const o=opts.filter(x=>!skip.includes(x[0]));return o.length?`<optgroup label="${esc(g)}">${o.map(([k,l,c])=>`<option value="${esc(k)}"${k===sel?' selected':''}>${esc(l)} (${c})</option>`).join('')}</optgroup>`:'';}).join('');}
// --- group editor
function moveSel(sid,kind,sel,attr){const p=SP[sid];const pool=kind==='f'?p.f:p.c;const all=[...new Set([...pool,sel].filter(Boolean))];
  return `<select ${attr}>${kind==='c'?`<option value=""${!sel?' selected':''}>${T('None')}</option>`:''}${all.map(m=>`<option value="${m}"${m===sel?' selected':''}>${esc(mvName(m))}${p.e&&p.e.includes(m)?' *':''}</option>`).join('')}</select>`;}
function entryLine(e){const v=effIV(e),cp=cpOf(e.sid,v[0],v[1],v[2],v[3]);return `<span class="mxmv">${[e.f,...e.c].map(m=>esc(mvName(m))).join(' · ')}</span><span class="mxiv num${e.iv?' cust':''}${cp>1500?' over':''}"${cp>1500?` title="${esc(T('Over 1,500 CP: not Great League legal'))}"`:''}>${T('Lvl')} ${v[0]} · ${v[1]}/${v[2]}/${v[3]} · CP ${cp}${cp>1500?' ⚠':''}</span>`;}
function entryEditor(g,i,e){const v=effIV(e);
  return `<div class="mxed" data-g="${g}" data-i="${i}"><div class="mvs"><label>${T('Fast')}${moveSel(e.sid,'f',e.f,'data-mf="f"')}</label><label>${T('Charged')}${moveSel(e.sid,'c',e.c[0]||'','data-mf="0"')}</label><label>${T('Charged')}${moveSel(e.sid,'c',e.c[1]||'','data-mf="1"')}</label></div>
   <div class="mxivs"><label>${T('Attack')}<input type="number" min="0" max="15" step="1" inputmode="numeric" data-iv="0" value="${v[1]}"></label><label>${T('Defense')}<input type="number" min="0" max="15" step="1" inputmode="numeric" data-iv="1" value="${v[2]}"></label><label>${T('HP')}<input type="number" min="0" max="15" step="1" inputmode="numeric" data-iv="2" value="${v[3]}"></label>
   <span class="mxlv">${T('Level')} <b class="num">${v[0]}</b> · CP <b class="num">${cpOf(e.sid,v[0],v[1],v[2],v[3])}</b>${e.lv!=null?` <small>(${T('imported')})</small>`:''}${cpOf(e.sid,v[0],v[1],v[2],v[3])>1500?` <b class="overw">${T('Over 1,500 CP: not Great League legal')}</b>`:''}</span></div>
   <div class="controls"><button class="link" data-ivset="def">${T('PvPoke default IVs')}</button><button class="link" data-ivset="r1">${T('Rank 1 stat product')}</button><button class="link" data-ivset="max">15/15/15</button></div></div>`;}
function renderGroup(g){const el=$('mxg'+g);if(!el)return;const G=MX[g],other=g==='A'?'B':'A';
  el.innerHTML=`<div class="mxgh"><h3>${T('Group {g}',{g})} <small>${g==='A'?T('rows'):T('columns')}</small></h3><span class="num mxcnt${G.length>=MXMAX?' full':''}">${G.length} / ${MXMAX}</span></div>
   <div class="controls"><label class="fld">${T('Fill with')} <select data-preset="${g}"><option value="">${T('Choose a list…')}</option>${presetOptions()}</select></label></div>
   <div class="controls"><input type="text" list="allNames" placeholder="${esc(T('Add a Pokémon'))}" data-addname="${g}" autocomplete="off" style="flex:1;min-width:min(180px,100%)"><button class="btn ghost" data-addbtn="${g}">${T('Add')}</button></div>
   <div class="controls"><label class="fld">${T('IVs for the whole group')} <select data-ivall="${g}"><option value="">${T('Keep as they are')}</option><option value="def">${T('PvPoke default IVs')}</option><option value="r1">${T('Rank 1 stat product')}</option><option value="max">15/15/15</option></select></label></div>
   <details class="mximp"${MX.imp[g]?' open':''} data-impd="${g}"><summary>${T('Import / export (PvPoke format)')}</summary>
    <p class="lede" style="font-size:12px">${T('Paste a PvPoke custom group export, PvPoke ids or names (one per line or separated by commas), or the row labels from a PvPoke matrix download. Moves and level/IVs are optional, exactly as in PvPoke: id,FAST,CHARGED1,CHARGED2,level,atk,def,hp.')} ${T('PvPoke\'s third charged move only exists for Mega Pokémon, which aren\'t Great League eligible, so it is skipped.')}</p>
    <textarea rows="6" data-imptxt="${g}" spellcheck="false" placeholder="melmetal,THUNDER_SHOCK,DOUBLE_IRON_BASH,DYNAMIC_PUNCH&#10;sableye_shadow&#10;Azumarill">${esc(exportList(G))}</textarea>
    <div class="controls"><button class="btn" data-imp="${g}" data-mode="replace">${T('Replace group')}</button><button class="btn ghost" data-imp="${g}" data-mode="add">${T('Add to group')}</button><button class="link" data-copy="${g}">${T('Copy to clipboard')}</button><button class="link" data-dlist="${g}">${T('Download list for Excel')}</button></div></details>
   <div class="mxlist">${G.length?G.map((e,i)=>`<div class="mxrow${MX.open[g]===i?' open':''}"><div class="mxr1">${badge(eName(e),e.sid)}<span class="mxnm">${esc(dn(eName(e)))}</span><span class="mxsub">${entryLine(e)}</span><button class="link" data-edit="${g}:${i}">${MX.open[g]===i?T('Done'):T('Edit')}</button><button class="mxx" data-del="${g}:${i}" aria-label="${esc(T('Remove'))} ${esc(dn(eName(e)))}">×</button></div>${MX.open[g]===i?entryEditor(g,i,e):''}</div>`).join(''):`<p class="empty">${T('Empty. Choose a list above, add Pokémon, or import.')}</p>`}</div>
   <div class="controls">${G.length?`<button class="link" data-clear="${g}">${T('Clear')}</button>`:''}<button class="link" data-copyto="${g}">${T('Copy to Group {o}',{o:other})}</button></div>`;}
function renderRun(){const el=$('mxRun');if(!el)return;const n=MX.A.length*MX.B.length;
  const sh=(k,v)=>`<div class="seg" role="group" aria-label="${esc(T('Shields'))} ${k}">${[0,1,2].map(s=>`<button data-sh="${k}:${s}" aria-pressed="${v===s}">${s}</button>`).join('')}</div>`;
  el.innerHTML=`<div class="mxctl"><label class="fld">${T('Group A shields')} ${sh('A',MX.sa)}</label><label class="fld">${T('Group B shields')} ${sh('B',MX.sb)}</label>
   <label class="fld">${T('Level cap')} <select id="mxCap">${[40,41,50,51].map(c=>`<option value="${c}"${c===MX.cap?' selected':''}>${c}${c===51?' ('+T('best buddy')+')':''}</option>`).join('')}</select></label>
   <button class="link" id="mxSwap">${T('Swap groups')}</button></div>
   <div class="mxopt"><span class="sbl">${T('Best IVs for these shields')}</span><button class="btn ghost" data-mxopt="A"${MX.A.length&&MX.B.length&&!MXJOB?'':' disabled'}>${T('Group A vs Group B')}</button><button class="btn ghost" data-mxopt="B"${MX.A.length&&MX.B.length&&!MXJOB?'':' disabled'}>${T('Group B vs Group A')}</button>
    <span class="mxoptn">${T('Gives each Pokémon the IV spread with the most wins against the other group at the shields above, then runs the matrix.')}</span></div>
   <div class="mxgo"><button class="btn" id="mxGo"${n?'':' disabled'}>${MXJOB?T('Stop'):T('Run {n} battles',{n:n.toLocaleString()})}</button><div class="mxprog" id="mxProg" ${MXJOB?'':'hidden'}><i style="width:0%"></i></div><span class="num" id="mxStat" style="color:var(--muted)"></span></div>`;}
// first visit: start with something worth running
let MXFIRST=(()=>{try{return !localStorage.getItem('gl_mx');}catch(e){return false;}})();
function renderMatrix(){if(MXFIRST&&!MX.A.length&&!MX.B.length){MXFIRST=false;MX.A=presetList('meta10');MX.B=presetList('d2all');mxSave();}
  renderGroup('A');renderGroup('B');renderRun();if(MXRES)renderResults();}
function setIV(e,mode){if(mode==='def'){e.iv=null;e.lv=null;}else if(mode==='r1'){e.iv=rank1(e.sid,MX.cap).slice();e.lv=null;}else if(mode==='max'){e.iv=[15,15,15];e.lv=null;}}
function mxChanged(g){MX.opt=null;mxSave();renderGroup(g);renderRun();}
function addTo(g,list,replace){let G=replace?[]:MX[g].slice();const room=MXMAX-G.length;if(list.length>room)toast(T('Groups hold up to {n}; {k} were left out.',{n:MXMAX,k:list.length-room}));G=G.concat(list.slice(0,Math.max(0,room)));MX[g]=G;MX.open[g]=-1;mxChanged(g);}
const MXEL=$('v-matrix');
MXEL.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.preset){const g=t.dataset.preset,k=t.value;if(!k)return;const L=presetList(k);if(!L.length){toast(T('That list is empty.'));t.value='';return;}addTo(g,L,true);toast(T('Group {g}: {n} Pokémon',{g,n:MX[g].length}));return;}
  if(t.dataset.ivall){const g=t.dataset.ivall,m=t.value;if(!m)return;MX[g].forEach(x=>setIV(x,m));mxChanged(g);return;}
  if(t.id==='mxCap'){MX.cap=+t.value;MX.opt=null;mxSave();renderMatrix();return;}
  const ed=t.closest('.mxed');if(ed){const g=ed.dataset.g,i=+ed.dataset.i,x=MX[g][i];
    if(t.dataset.mf){if(t.dataset.mf==='f')x.f=t.value;else{const c=[x.c[0]||'',x.c[1]||''];c[+t.dataset.mf]=t.value;x.c=c.filter((m,j,a)=>m&&a.indexOf(m)===j);if(!x.c.length)x.c=defMoves(x.sid).c.slice(0,1);}}
    if(t.dataset.iv){const cur=effIV(x).slice(1);cur[+t.dataset.iv]=Math.max(0,Math.min(15,Math.round(+t.value||0)));x.iv=cur;x.lv=null;}
    mxChanged(g);}});
MXEL.addEventListener('toggle',e=>{const d=e.target.closest&&e.target.closest('[data-impd]');if(d)MX.imp[d.dataset.impd]=d.open;},true);
MXEL.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.addname){e.preventDefault();MXEL.querySelector(`[data-addbtn="${e.target.dataset.addname}"]`).click();}});
MXEL.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.addbtn){const g=d.addbtn,inp=MXEL.querySelector(`[data-addname="${g}"]`),sid=resolveSid(inp.value);if(!sid){toast(T('Pokémon not found: {n}',{n:inp.value}));return;}addTo(g,[mkEntry(sid)],false);return;}
  if(d.del){const [g,i]=d.del.split(':');MX[g].splice(+i,1);MX.open[g]=-1;mxChanged(g);return;}
  if(d.edit){const [g,i]=d.edit.split(':');MX.open[g]=MX.open[g]===+i?-1:+i;renderGroup(g);return;}
  if(d.ivset){const ed=b.closest('.mxed'),g=ed.dataset.g;setIV(MX[g][+ed.dataset.i],d.ivset);mxChanged(g);return;}
  if(d.clear){MX[d.clear]=[];MX.open[d.clear]=-1;mxChanged(d.clear);return;}
  if(d.copyto){const g=d.copyto,o=g==='A'?'B':'A';MX[o]=MX[g].map(x=>Object.assign({},x,{c:x.c.slice(),iv:x.iv&&x.iv.slice()}));mxChanged(o);toast(T('Copied to Group {o}',{o}));return;}
  if(d.imp){const g=d.imp,r=parseList(MXEL.querySelector(`[data-imptxt="${g}"]`).value);if(!r.out.length){toast(T('Nothing recognised to import.'));return;}addTo(g,r.out,d.mode==='replace');
    toast(r.bad.length?T('Imported {n}; skipped {k}: {list}',{n:r.out.length,k:r.bad.length,list:r.bad.slice(0,3).join(' | ')}):T('Imported {n}',{n:r.out.length}));return;}
  if(d.copy){const txt=exportList(MX[d.copy]);(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast(T('Copied')),()=>{const ta=MXEL.querySelector(`[data-imptxt="${d.copy}"]`);ta.select();toast(T('Selected: press Ctrl+C or Copy'));});return;}
  if(d.dlist){download(`group-${d.dlist}.csv`,listCSV(MX[d.dlist]));return;}
  if(d.sh){const [k,s]=d.sh.split(':');if(k==='A')MX.sa=+s;else MX.sb=+s;MX.opt=null;mxSave();renderRun();return;}
  if(b.id==='mxSwap'){MX.opt=null;[MX.A,MX.B]=[MX.B,MX.A];[MX.sa,MX.sb]=[MX.sb,MX.sa];MX.open={A:-1,B:-1};mxSave();MXRES=null;$('mxOut').innerHTML='';renderMatrix();return;}
  if(b.id==='mxGo'){if(MXJOB)stopRun();else startRun();return;}
  if(d.mxopt){optimiseGroup(d.mxopt);return;}});
// --- run engine: battles in background workers (falls back to the page if workers are unavailable)
let MXJOB=null,MXRES=null,WORKERS=null;
function workerURL(){const src=document.getElementById('simsrc'),pv=document.getElementById('pvesrc');if(!src)return null;
  const code=src.textContent+'\n'+(pv?pv.textContent:'')+`
function mk(x){return SIM.build(x[0],x[1],x[2],x[3]);}
var HASPV=typeof PVE!=='undefined';
self.onmessage=function(e){var m=e.data;if(m.t==='init'){SIM.init(m.SP,m.MV);if(HASPV&&m.PVGM)PVE.init(m.PVGM);return;}
 if(m.t==='job'){var exact=HASPV&&m.engine!=='fast',A=m.A.map(mk),B=m.B.map(mk),shs=m.shs,ns=shs.length,o=m.o,p=m.persp||0;
  var out=new Int16Array(A.length*B.length*ns),k=0;
  for(var i=0;i<A.length;i++)for(var j=0;j<B.length;j++)for(var q=0;q<ns;q++){
    var hp=o?[Math.max(1,Math.round(o.hp[0]*A[i].hp)),Math.max(1,Math.round(o.hp[1]*B[j].hp))]:null;
    if(exact){var sa=m.A[i],sb=m.B[j];out[k++]=o?PVE.run(sa,sb,{sh:shs[q],hp:hp,en:o.en,st:o.st,bait:o.bait}).ratings[p]:PVE.battle(sa,sb,shs[q][0],shs[q][1]);}
    else if(!o){out[k++]=SIM.battle(A[i],B[j],shs[q][0],shs[q][1]);}
    else{out[k++]=SIM.run(A[i],B[j],{sh:shs[q],hp:hp,en:o.en,st:o.st,bait:o.bait}).ratings[p];}}
  self.postMessage({t:'done',id:m.id,r0:m.r0,r1:m.r1,out:out},[out.buffer]);}};`;
  return URL.createObjectURL(new Blob([code],{type:'text/javascript'}));}
function getWorkers(){if(WORKERS)return WORKERS;try{const url=workerURL();if(!url||typeof Worker==='undefined')return null;const n=Math.max(1,Math.min(8,(navigator.hardwareConcurrency||4)-1));
  WORKERS=Array.from({length:n},()=>{const w=new Worker(url);w.postMessage({t:'init',SP,MV,PVGM:HAS_PVE?PVGM:null});return w;});}catch(e){WORKERS=null;}return WORKERS;}
const specOf=e=>[e.sid,e.f,e.c.filter(Boolean),effIV(e)];
// poolRun: every A spec against every B spec at each shield pair. Result index ((i*nB)+j)*nsh+q.
// o (optional): starting conditions {hp:[frac,frac],en,st,bait}; persp 1 returns B's rating. One job at a time: a new job cancels the old one.
let POOL=null;
function poolRun(A,B,shs,opt){opt=opt||{};if(POOL)POOL.cancel(true);
  const ns=shs.length,nB=B.length,out=new Int16Array(A.length*nB*ns);let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});
  const exact=HAS_PVE&&opt.engine!=='fast';const job={id:Math.random(),done:0,next:0,dead:false,chunk:Math.max(1,Math.floor((exact?600:5000)/Math.max(1,nB*ns)))};
  job.cancel=quiet=>{if(job.dead)return;job.dead=true;if(WORKERS){WORKERS.forEach(w=>w.terminate());WORKERS=null;}if(POOL===job)POOL=null;reject(new Error('cancelled'));};
  POOL=job;const prog=()=>{if(opt.onProg)opt.onProg(job.done/Math.max(1,A.length));};
  const fin=()=>{if(job.dead)return;job.dead=true;if(POOL===job)POOL=null;resolve(out);};
  if(!A.length||!nB){setTimeout(fin,0);return {promise,cancel:job.cancel};}
  const ws=getWorkers();
  if(ws){const give=w=>{if(job.dead||job.next>=A.length)return;const r0=job.next,r1=Math.min(A.length,r0+job.chunk);job.next=r1;w.postMessage({t:'job',id:job.id,A:A.slice(r0,r1),B,r0,r1,shs,o:opt.o||null,persp:opt.persp||0,engine:exact?'exact':'fast'});};
    ws.forEach(w=>{w.onmessage=ev=>{const m=ev.data;if(m.t!=='done'||m.id!==job.id||job.dead)return;out.set(m.out,m.r0*nB*ns);job.done+=m.r1-m.r0;prog();if(job.done>=A.length)fin();else give(w);};w.onerror=()=>{};give(w);});}
  else{const mk=x=>SIM.build(x[0],x[1],x[2],x[3]),Bb=B.map(mk),o=opt.o,bat=exact?SIM.battle:SIM.fastBattle,rn=exact?SIM.run:SIM.fastRun;let i=0;
    const step=()=>{if(job.dead)return;const t=performance.now();while(i<A.length&&performance.now()-t<40){const a=mk(A[i]);for(let j=0;j<nB;j++)for(let q=0;q<ns;q++){let r;
          if(!o)r=bat(a,Bb[j],shs[q][0],shs[q][1]);else r=rn(a,Bb[j],{sh:shs[q],hp:[Math.max(1,Math.round(o.hp[0]*a.hp)),Math.max(1,Math.round(o.hp[1]*Bb[j].hp))],en:o.en,st:o.st,bait:o.bait}).ratings[opt.persp||0];
          out[(i*nB+j)*ns+q]=r;}i++;job.done=i;}prog();if(i>=A.length)fin();else setTimeout(step,0);};step();}
  return {promise,cancel:job.cancel};}
function startRun(){const A=MX.A.map(specOf),B=MX.B.map(specOf);if(!A.length||!B.length)return;
  const snap={A:MX.A.map(x=>Object.assign({},x,{c:x.c.slice(),iv:x.iv&&x.iv.slice(),v:effIV(x)})),B:MX.B.map(x=>Object.assign({},x,{c:x.c.slice(),iv:x.iv&&x.iv.slice(),v:effIV(x)})),sa:MX.sa,sb:MX.sb,cap:MX.cap,opt:MX.opt||null};
  const t0=performance.now();const prog=p=>{const bar=document.querySelector('#mxProg i');if(bar)bar.style.width=(p*100).toFixed(1)+'%';const st=$('mxStat');if(st)st.textContent=Math.round(p*100)+'%';};
  const h=poolRun(A,B,[[MX.sa,MX.sb]],{onProg:prog});MXJOB=h;renderRun();{const o=document.querySelector('.mxres');if(o)o.classList.add('stale');}
  h.promise.then(out=>{if(MXJOB!==h)return;MXRES={A:snap.A,B:snap.B,sa:snap.sa,sb:snap.sb,cap:snap.cap,R:out,ms:performance.now()-t0,opt:snap.opt};MXJOB=null;MXSEL=null;renderRun();renderResults();
    $('mxOut').scrollIntoView({behavior:'smooth',block:'start'});},()=>{});}
function stopRun(){if(MXJOB&&MXJOB.cancel)MXJOB.cancel();MXJOB=null;renderRun();toast(T('Stopped'));}
// ---------- IV engine: every IV spread for a Pokémon under a level cap and CP cap
// Stats shown are without the Shadow multiplier (as on pvpivs.com); the simulator applies it in battle.
const IVT=new Map();
function ivTable(sid,cap,cpcap){const k=sid+'|'+cap+'|'+cpcap;if(IVT.has(k))return IVT.get(k);const b=SP[sid].b,out=[];
  for(let a=0;a<16;a++)for(let d=0;d<16;d++)for(let s=0;s<16;s++){const lv=bestLevel(sid,a,d,s,cap,cpcap),c=mxCPM(lv);const A=(b[0]+a)*c,D=(b[1]+d)*c,H=Math.max(10,Math.floor((b[2]+s)*c));
    out.push({a,d,s,lv,cp:cpOf(sid,lv,a,d,s),A,D,H,sp:A*D*H,bp:D*H});}
  const by=out.slice().sort((x,y)=>y.sp-x.sp||y.A-x.A);by.forEach((x,i)=>{x.rank=i+1;x.pct=x.sp/by[0].sp;});IVT.set(k,out);return out;}
const ivKey=x=>x.a*256+x.d*16+x.s;
const ivSpec=(sid,f,c,x)=>[sid,f,c.filter(Boolean),[x.lv,x.a,x.d,x.s]];
// Pareto frontiers: spreads that no other spread beats (max) or undercuts (min) in all of Attack, Defense and HP.
// More stats never did worse in testing, so the strongest/weakest possible results lie on these frontiers.
function frontier(list,max){const s=list.slice().sort(max?(x,y)=>y.A-x.A||y.D-x.D||y.H-x.H:(x,y)=>x.A-y.A||x.D-y.D||x.H-y.H);const F=[];
  for(const p of s){let dom=false;for(const q of F){if(max?(q.A>=p.A&&q.D>=p.D&&q.H>=p.H):(q.A<=p.A&&q.D<=p.D&&q.H<=p.H)){dom=true;break;}}if(!dom)F.push(p);}return F;}
// thin a frontier to n points that keep the extremes and spread out across the rest (farthest-point sampling)
function thin(F,n){if(F.length<=n)return F.slice();const ext=k=>F.reduce((b,x)=>x[k]>b[k]?x:b,F[0]),exl=k=>F.reduce((b,x)=>x[k]<b[k]?x:b,F[0]);
  const pick=[...new Set([ext('A'),ext('D'),ext('H'),ext('sp'),exl('A'),exl('D'),exl('H'),exl('sp')])];
  const rng=['A','D','H'].map(k=>{let lo=Infinity,hi=-Infinity;for(const x of F){lo=Math.min(lo,x[k]);hi=Math.max(hi,x[k]);}return [lo,Math.max(1e-9,hi-lo)];});
  const dist=(x,y)=>['A','D','H'].reduce((s,k,i)=>{const v=(x[k]-y[k])/rng[i][1];return s+v*v;},0);
  const dmin=F.map(x=>Math.min(...pick.map(p=>dist(x,p))));
  while(pick.length<n){let bi=-1,bv=-1;for(let i=0;i<F.length;i++)if(dmin[i]>bv){bv=dmin[i];bi=i;}const p=F[bi];pick.push(p);for(let i=0;i<F.length;i++)dmin[i]=Math.min(dmin[i],dist(F[i],p));}
  return pick;}
const tierOf=r=>tier(r);
// --- best IVs for one group against the other (at the chosen shields)
async function optimiseGroup(g){const G=MX[g],O=MX[g==='A'?'B':'A'];if(!G.length||!O.length)return;const sh=g==='A'?[MX.sa,MX.sb]:[MX.sb,MX.sa];
  // candidates: each Pokémon's stat frontier (thinned to fit a battle budget) plus its current spread
  const k=Math.max(6,Math.min(120,Math.floor(1e6/(G.length*O.length))));const cands=[],own=[];
  G.forEach((e,gi)=>{const TT=ivTable(e.sid,MX.cap,1500);const F=thin(frontier(TT,true),k);const seen=new Set();
    cands.push(specOf(e));own.push([gi,null]);
    for(const t of F){const key=ivKey(t);if(seen.has(key))continue;seen.add(key);cands.push(ivSpec(e.sid,e.f,e.c,t));own.push([gi,t]);}});
  const prog=p=>{const bar=document.querySelector('#mxProg i');if(bar)bar.style.width=(p*100).toFixed(1)+'%';const st=$('mxStat');if(st)st.textContent=T('Finding best IVs')+' · '+Math.round(p*100)+'%';};
  const Ospec=O.map(specOf);
  const h=poolRun(cands,Ospec,[sh],{onProg:p=>prog(p*0.7),engine:'fast'});MXJOB=h;renderRun();const pb=$('mxProg');if(pb)pb.hidden=false;
  let out;try{out=await h.promise;}catch(e){return;}if(MXJOB!==h)return;
  // confirm with PvPoke's engine: current spread plus the three best screened spreads for each Pokémon
  if(HAS_PVE){const nO0=O.length,sc=own.map(([gi,t],ci)=>{let w=0,sum=0;for(let j=0;j<nO0;j++){const r=out[ci*nO0+j];if(r>500)w++;sum+=r;}return {gi,t,ci,w,avg:sum/nO0};});
    const keepC=[];G.forEach((e,gi)=>{const mine=sc.filter(x=>x.gi===gi);const cur=mine.find(x=>!x.t);const top=mine.filter(x=>x.t).sort((a,b)=>b.w-a.w||b.avg-a.avg).slice(0,3);keepC.push(cur,...top);});
    const h2=poolRun(keepC.map(x=>cands[x.ci]),Ospec,[sh],{onProg:p=>prog(0.7+0.3*p)});MXJOB=h2;let out2;try{out2=await h2.promise;}catch(e){return;}if(MXJOB!==h2)return;
    const nOut=new Int16Array(out.length).fill(-1);keepC.forEach((x,k)=>{for(let j=0;j<nO0;j++)nOut[x.ci*nO0+j]=out2[k*nO0+j];});
    const keepSet=new Set(keepC.map(x=>x.ci));own.forEach((o,ci)=>{if(!keepSet.has(ci))o.skip=true;});out=nOut;}
  MXJOB=null;
  const nO=O.length,best=G.map(()=>null),cur=G.map(()=>null);
  own.forEach((o,ci)=>{if(o.skip)return;const [gi,t]=o;let w=0,sum=0;for(let j=0;j<nO;j++){const r=out[ci*nO+j];if(r>500)w++;sum+=r;}const v={t,w,avg:sum/nO};if(!t)cur[gi]=v;else if(!best[gi]||w>best[gi].w||(w===best[gi].w&&v.avg>best[gi].avg))best[gi]=v;});
  const info=G.map((e,gi)=>{const c=cur[gi],b=best[gi],from=effIV(e);let to=from,gain=0;
    if(b&&(b.w>c.w||(b.w===c.w&&b.avg>c.avg+0.5))){e.iv=[b.t.a,b.t.d,b.t.s];e.lv=null;to=effIV(e);gain=b.w-c.w;}return {from,to,gain,w0:c.w,w1:Math.max(c.w,b?b.w:0)};});
  MX.opt={g,sh,info};mxSave();renderGroup(g);
  const changed=info.filter(x=>x.from.join()!==x.to.join()).length,tot=info.reduce((s,x)=>s+x.gain,0);
  toast(T('Group {g}: {n} IV spreads changed, {w} more wins in total',{g,n:changed,w:tot}));startRun();}
// --- results
let MXSEL=null,MXV=null;
const mxVal=(i,j)=>MXRES.R[i*MXRES.B.length+j];
function orderFor(n,m,rows,how){const idx=[...Array(n).keys()];if(how==='g')return idx;
  const score=k=>{let w=0,s=0;for(let t=0;t<m;t++){const r=rows?mxVal(k,t):1000-mxVal(t,k);s+=r;if(rows?r>500:mxVal(t,k)<500)w++;}return how==='w'?w*1e4+s/m:s/m;};
  const sc=idx.map(score);return idx.sort((a,b)=>sc[b]-sc[a]);}
function groupStats(rows){const R=MXRES,n=rows?R.A.length:R.B.length,m=rows?R.B.length:R.A.length;const out=[];
  for(let k=0;k<n;k++){const c={W:0,CW:0,T:0,CL:0,L:0};let s=0;for(let t=0;t<m;t++){const r=rows?mxVal(k,t):mxVal(t,k);const mine=rows?r:(r>500?'loss':r<500?'win':'tie');
      if(rows){c[tier(r)]++;s+=r;}else{c[{W:'L',CW:'CL',T:'T',CL:'CW',L:'W'}[tier(r)]]++;s+=1000-r;}}
    out.push({k,e:(rows?R.A:R.B)[k],c,wins:c.W+c.CW,losses:c.L+c.CL,avg:Math.round(s/m),m});}
  return out;}
// results tables: sort by any column (tap again to reverse), search and filter; ranks stay those of the full sorted list
let MXSORT={A:'wins',B:'wins'},MXDIR={A:-1,B:-1};
const MXF={A:{q:'',type:'',form:'all',min:0},B:{q:'',type:'',form:'all',min:0}};
const mxSortVal={name:x=>dn(eName(x.e)),wins:x=>x.wins,W:x=>x.c.W,CW:x=>x.c.CW,CL:x=>x.c.CL,L:x=>x.c.L,losses:x=>x.losses,winpct:x=>x.wins/x.m,avg:x=>x.avg,gain:x=>x.gain||0};
function statRows(g){const rows=g==='A',S=groupStats(rows),key=MXSORT[g],dir=MXDIR[g],f=mxSortVal[key]||mxSortVal.wins,optG=mxOptG(g);
  if(optG)S.forEach(x=>{const o=MXRES.opt.info[x.k];x.gain=o&&o.from.join()!==o.to.join()?o.gain:0;});
  S.sort((a,b)=>{const va=f(a),vb=f(b);const c=typeof va==='string'?va.localeCompare(vb):va-vb;return (key==='name'?-dir:dir)*c||b.avg-a.avg;});
  S.forEach((x,i)=>x.rank=i+1);
  const F=MXF[g],q=F.q.trim().toLowerCase();
  const L=S.filter(x=>{const n=eName(x.e);if(q&&!n.toLowerCase().includes(q)&&!dn(n).toLowerCase().includes(q))return false;
    if(F.type&&!typesOf(x.e.sid).includes(F.type))return false;const sh=/\(Shadow\)/.test(n);if(F.form==='shadow'&&!sh)return false;if(F.form==='regular'&&sh)return false;
    if(F.min&&100*x.wins/x.m<F.min)return false;return true;});
  return {S,L,optG};}
function mxOptG(g){return !!(MXRES.opt&&MXRES.opt.g===g&&MXRES.opt.info.length===(g==='A'?MXRES.A.length:MXRES.B.length));}
function statBody(g){const {S,L,optG}=statRows(g);
  const body=L.map(x=>`<tr${MXF[g].q&&L.length<=3?' class="hit"':''}><td class="num">${x.rank}</td><td>${monTag(eName(x.e),x.e.sid)}<div class="mxsub2">${[x.e.f,...x.e.c].map(m=>esc(mvName(m))).join(' · ')} · ${x.e.v[1]}/${x.e.v[2]}/${x.e.v[3]}</div></td><td class="r num"><b>${x.wins}</b></td><td class="r num">${x.c.W}</td><td class="r num">${x.c.CW}</td><td class="r num">${x.c.CL}</td><td class="r num">${x.c.L}</td><td class="r num">${x.losses}</td><td class="r num">${pct(x.wins/x.m)}</td><td class="r num">${x.avg}</td>${optG?(()=>{const o=MXRES.opt.info[x.k];return o&&o.from.join()!==o.to.join()?`<td class="r num"><b class="bv good">+${o.gain}</b><div class="mxsub2">${o.from[1]}/${o.from[2]}/${o.from[3]} → ${o.to[1]}/${o.to[2]}/${o.to[3]}</div></td>`:`<td class="r num mxsub2">${T('kept')}</td>`;})():''}</tr>`).join('')||`<tr><td colspan="11" class="empty">${T('No Pokémon match these filters.')}</td></tr>`;
  return {body,shown:L.length,total:S.length};}
function statTable(g){const rows=g==='A',key=MXSORT[g],dir=MXDIR[g],optG=mxOptG(g),F=MXF[g];
  const arrow=k=>key===k?(dir<0?' ▼':' ▲'):'';
  const th=(k,l,cls)=>`<th class="${cls==null?'r':cls}"><button class="link" data-mxsort="${g}:${k}" aria-pressed="${key===k}">${l}${arrow(k)}</button></th>`;
  const names=(rows?MXRES.A:MXRES.B).map(e=>dn(eName(e)));const types=[...new Set((rows?MXRES.A:MXRES.B).flatMap(e=>typesOf(e.sid)))].sort((a,b)=>tn(a).localeCompare(tn(b)));
  const b=statBody(g);
  return `<div class="card" id="mxst-${g}"><h3 style="font-size:18px;margin-bottom:4px">${rows?T('Group A results'):T('Group B results')}</h3><p class="lede" style="font-size:13px">${rows?T('How each Group A Pokémon did against all of Group B.'):T('How each Group B Pokémon did against all of Group A.')} ${T('A win is a rating above 500; close results are within your margin.')} ${T('Tap a column heading to sort; tap again to reverse.')}</p>
   <div class="controls mxfl"><label class="fld">${T('Find')} <input type="search" list="mxnames-${g}" data-mxq="${g}" value="${esc(F.q)}" placeholder="${esc(T('Pokémon name'))}"></label><datalist id="mxnames-${g}">${[...new Set(names)].map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
    <label class="fld">${T('Type')} <select data-mxtype="${g}"><option value="">${T('All types')}</option>${types.map(t=>`<option value="${t}"${F.type===t?' selected':''}>${esc(tn(t))}</option>`).join('')}</select></label>
    <label class="fld">${T('Form')} <select data-mxform="${g}"><option value="all"${F.form==='all'?' selected':''}>${T('All')}</option><option value="shadow"${F.form==='shadow'?' selected':''}>${T('Shadow only')}</option><option value="regular"${F.form==='regular'?' selected':''}>${T('Not Shadow')}</option></select></label>
    <label class="fld">${T('Win % at least')} <select data-mxmin="${g}">${[0,25,40,50,60,75].map(v=>`<option value="${v}"${F.min===v?' selected':''}>${v}%</option>`).join('')}</select></label>
    <span class="num mxshown" data-mxshown="${g}">${T('Showing {a} of {b}',{a:b.shown,b:b.total})}</span>${F.q||F.type||F.form!=='all'||F.min?`<button class="link" data-mxclr="${g}">${T('Clear filters')}</button>`:''}</div>
   <div class="tblwrap"><table class="vt mxst"><thead><tr><th>#</th>${th('name',T('Pokémon'),'')}${th('wins',T('Wins'))}${th('W',chip('W'))}${th('CW',chip('CW'))}${th('CL',chip('CL'))}${th('L',chip('L'))}${th('losses',T('Losses'))}${th('winpct',T('Win %'))}${th('avg',T('Avg rating'))}${optG?th('gain',T('IV gain')):''}</tr></thead>
   <tbody data-mxbody="${g}">${b.body}</tbody></table></div></div>`;}
function refreshStat(g){const tb=document.querySelector(`[data-mxbody="${g}"]`);if(!tb)return;const b=statBody(g);tb.innerHTML=b.body;const s=document.querySelector(`[data-mxshown="${g}"]`);if(s)s.textContent=T('Showing {a} of {b}',{a:b.shown,b:b.total});}
function rerenderStat(g){const el=$('mxst-'+g);if(!el)return;const tmp=document.createElement('div');tmp.innerHTML=statTable(g);el.replaceWith(tmp.firstElementChild);}
// Same layout as PvPoke's matrix download: labels, ratings, then Wins / Losses / Draws / Average per row
function matrixCSV(){const R=MXRES;const head=['',...R.B.map(pvLabel),'Wins','Losses','Draws','Average'];const lines=[head.map(csvCell).join(',')];
  R.A.forEach((a,i)=>{const vals=R.B.map((b,j)=>mxVal(i,j));const w=vals.filter(x=>x>500).length,l=vals.filter(x=>x<500).length;
    lines.push([pvLabel(a),...vals,w,l,vals.length-w-l,(vals.reduce((x,y)=>x+y,0)/vals.length).toFixed(2)].map(csvCell).join(','));});return lines.join('\r\n');}
function statsCSV(){const out=[['Group','Pokemon','Moves','IVs','Wins','W','CW','CL','L','Losses','Win %','Avg rating']];
  for(const g of ['A','B'])groupStats(g==='A').forEach(x=>out.push([g,eName(x.e),[x.e.f,...x.e.c].map(m=>MV[m].name).join(' / '),`${x.e.v[1]}/${x.e.v[2]}/${x.e.v[3]} L${x.e.v[0]}`,x.wins,x.c.W,x.c.CW,x.c.CL,x.c.L,x.losses,Math.round(100*x.wins/x.m),x.avg]));
  return out.map(r=>r.map(csvCell).join(',')).join('\r\n');}
function renderResults(){const R=MXRES,out=$('mxOut');if(!R){out.innerHTML='';return;}
  const nA=R.A.length,nB=R.B.length;const rowsO=orderFor(nA,nB,true,MX.sortR),colsO=orderFor(nB,nA,false,MX.sortC);
  const seg3=(id,v,opts)=>`<div class="seg" role="group">${opts.map(([k,l])=>`<button data-${id}="${k}" aria-pressed="${v===k}">${l}</button>`).join('')}</div>`;
  out.innerHTML=`<div class="card mxres"><div class="mxresh"><h3 style="font-size:18px">${T('Results')}</h3><span class="lede" style="font-size:13px">${T('{a} × {b} · Group A {sa} shields, Group B {sb} · level cap {cap} · {n} battles in {s}s',{a:nA,b:nB,sa:R.sa,sb:R.sb,cap:R.cap,n:(nA*nB).toLocaleString(),s:(R.ms/1000).toFixed(1)})}</span></div>
   ${R.opt?(()=>{const o=R.opt,ch=o.info.filter(x=>x.from.join()!==x.to.join()).length,w=o.info.reduce((s,x)=>s+x.gain,0);return `<p class="mxoptb">${T('Group {g} is on its best IVs against Group {o} at {a}v{b} shields: {n} spreads changed, {w} more wins in total. See the IV gain column below.',{g:o.g,o:o.g==='A'?'B':'A',a:o.sh[0],b:o.sh[1],n:ch,w})}</p>`;})():''}
   <div class="controls"><button class="btn" id="mxDl">${T('Download matrix for Excel')}</button><button class="btn ghost" id="mxDl2">${T('Download summary')}</button>
    <label class="fld">${T('Show')} ${seg3('mxshow',MX.show,[['r',T('Ratings')],['t','W / L']])}</label>
    <label class="fld">${T('Rows')} <select id="mxSortR"><option value="g"${MX.sortR==='g'?' selected':''}>${T('Group order')}</option><option value="w"${MX.sortR==='w'?' selected':''}>${T('Most wins')}</option><option value="a"${MX.sortR==='a'?' selected':''}>${T('Highest average')}</option></select></label>
    <label class="fld">${T('Columns')} <select id="mxSortC"><option value="g"${MX.sortC==='g'?' selected':''}>${T('Group order')}</option><option value="w"${MX.sortC==='w'?' selected':''}>${T('Most wins')}</option><option value="a"${MX.sortC==='a'?' selected':''}>${T('Highest average')}</option></select></label></div>
   <div class="controls mxfind"><label class="fld">${T('Find in matrix')} <input type="search" id="mxFind" list="mxnames-all" placeholder="${esc(T('Pokémon name'))}"></label><datalist id="mxnames-all">${[...new Set([...R.A,...R.B].map(e=>dn(eName(e))))].map(n=>`<option value="${esc(n)}">`).join('')}</datalist><button class="btn ghost" id="mxFindGo">${T('Find')}</button><span class="num" id="mxFindStat" style="color:var(--muted)"></span></div>
   <div class="mx" id="mxBox" role="img" aria-label="${esc(T('Battle matrix heatmap: Group A down the side, Group B across the top. Ratings are from Group A\'s side.'))}"><canvas class="mxc"></canvas><div class="mxs"><div class="mxsp"></div></div><div class="mxtip" hidden></div></div>
   <div class="hmfoot"><span class="hmleg" aria-hidden="true"><span>${T('Clear loss')}</span><i></i><span>${T('Clear win')}</span></span><span>${T('Ratings are from Group A\'s side (rows). Tap a cell for every shield combination.')}</span></div>
   <div id="mxDetail"></div></div>${statTable('A')}${statTable('B')}`;
  setupCanvas(rowsO,colsO);}
$('mxOut').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='mxDl'){download(`battle-matrix-${MXRES.sa}v${MXRES.sb}.csv`,matrixCSV());return;}
  if(b.id==='mxDl2'){download(`battle-matrix-summary-${MXRES.sa}v${MXRES.sb}.csv`,statsCSV());return;}
  if(b.dataset.mxshow){MX.show=b.dataset.mxshow;mxSave();b.parentElement.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));mxDraw();return;}
  if(b.dataset.mxsort){const [g,k]=b.dataset.mxsort.split(':');if(MXSORT[g]===k)MXDIR[g]=-MXDIR[g];else{MXSORT[g]=k;MXDIR[g]=k==='losses'||k==='L'||k==='CL'?1:-1;}rerenderStat(g);return;}
  if(b.dataset.mxclr){const g=b.dataset.mxclr;MXF[g]={q:'',type:'',form:'all',min:0};rerenderStat(g);return;}
  if(b.id==='mxFindGo'){mxFind();return;}});
$('mxOut').addEventListener('input',e=>{const t=e.target;if(t.dataset.mxq){MXF[t.dataset.mxq].q=t.value;refreshStat(t.dataset.mxq);}});
$('mxOut').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='mxFind'){e.preventDefault();mxFind();}});
$('mxOut').addEventListener('change',e=>{const t=e.target,d=t.dataset;if(t.id==='mxSortR'){MX.sortR=t.value;renderResults();}if(t.id==='mxSortC'){MX.sortC=t.value;renderResults();}
  if(d.mxtype){MXF[d.mxtype].type=t.value;rerenderStat(d.mxtype);}if(d.mxform){MXF[d.mxform].form=t.value;rerenderStat(d.mxform);}if(d.mxmin){MXF[d.mxmin].min=+t.value;rerenderStat(d.mxmin);}
  if(t.id==='mxFind')mxFind();});
// find a Pokémon in the heatmap: scroll to its row (Group A) and/or column (Group B) and highlight them
function mxFind(){const V=MXV,inp=$('mxFind');if(!V||!inp)return;const q=inp.value.trim().toLowerCase();if(!q){V.find=null;mxDraw();return;}
  const m=e=>{const n=eName(e);return n.toLowerCase()===q||dn(n).toLowerCase()===q;},p=e=>{const n=eName(e);return n.toLowerCase().includes(q)||dn(n).toLowerCase().includes(q);};
  const pick=(order,list)=>{let k=order.findIndex(i=>m(list[i]));if(k<0)k=order.findIndex(i=>p(list[i]));return k;};
  const i=pick(V.rowsO,MXRES.A),j=pick(V.colsO,MXRES.B);V.find={i,j};
  const st=$('mxFindStat');
  if(i<0&&j<0){if(st)st.textContent=T('Not in this matrix.');mxDraw();return;}
  if(st)st.textContent=[i>=0?T('Row {n} of {t}',{n:i+1,t:V.rowsO.length}):'',j>=0?T('Column {n} of {t}',{n:j+1,t:V.colsO.length}):''].filter(Boolean).join(' · ');
  const sc=V.sc;sc.scrollTo({left:j>=0?Math.max(0,j*V.CW-(sc.clientWidth-V.LW)/2):sc.scrollLeft,top:i>=0?Math.max(0,i*V.CH-(sc.clientHeight-V.HH)/2):sc.scrollTop,behavior:'smooth'});
  V.box.scrollIntoView({behavior:'smooth',block:'nearest'});mxDraw();}
function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
function setupCanvas(rowsO,colsO){const box=$('mxBox');if(!box)return;const sc=box.querySelector('.mxs'),cv=box.querySelector('.mxc'),sp=box.querySelector('.mxsp'),tip=box.querySelector('.mxtip');
  const narrow=window.innerWidth<640;const LW=narrow?112:168,HH=narrow?96:118,CW=narrow?36:42,CH=24;
  const nR=rowsO.length,nC=colsO.length;sp.style.width=(LW+nC*CW)+'px';sp.style.height=(HH+nR*CH)+'px';
  box.style.height=Math.min(HH+nR*CH+18,Math.max(320,Math.round(window.innerHeight*0.72)))+'px';
  MXV={box,sc,cv,ctx:cv.getContext('2d'),tip,LW,HH,CW,CH,rowsO,colsO,hover:null};
  let raf=0;const req=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;mxDraw();});};
  sc.addEventListener('scroll',req,{passive:true});
  if(window.ResizeObserver)new ResizeObserver(req).observe(box);
  const cellAt=ev=>{const r=sc.getBoundingClientRect();const x=ev.clientX-r.left,y=ev.clientY-r.top;if(x<LW||y<HH||x>sc.clientWidth||y>sc.clientHeight)return null;
    const j=Math.floor((x-LW+sc.scrollLeft)/CW),i=Math.floor((y-HH+sc.scrollTop)/CH);if(i<0||j<0||i>=nR||j>=nC)return null;return {i,j,x,y};};
  sc.addEventListener('mousemove',ev=>{const c=cellAt(ev);MXV.hover=c;showTip(c);req();});
  sc.addEventListener('mouseleave',()=>{MXV.hover=null;tip.hidden=true;req();});
  sc.addEventListener('click',ev=>{const c=cellAt(ev);if(!c)return;MXSEL={a:rowsO[c.i],b:colsO[c.j]};MXV.hover=c;showTip(c);req();cellDetail();});
  mxDraw();}
function showTip(c){const V=MXV;if(!c){V.tip.hidden=true;return;}const a=MXRES.A[V.rowsO[c.i]],b=MXRES.B[V.colsO[c.j]],r=mxVal(V.rowsO[c.i],V.colsO[c.j]);
  V.tip.innerHTML=`<b>${esc(dn(eName(a)))}</b> vs <b>${esc(dn(eName(b)))}</b><br><span class="num">${r}</span> ${chip(tier(r))}`;V.tip.hidden=false;
  const W=V.sc.clientWidth;V.tip.style.left=Math.min(W-170,c.x+12)+'px';V.tip.style.top=(c.y+14)+'px';}
function mxDraw(){const V=MXV;if(!V||!document.body.contains(V.cv))return;const {sc,cv,ctx,LW,HH,CW,CH,rowsO,colsO}=V;const W=sc.clientWidth,H=sc.clientHeight,dpr=window.devicePixelRatio||1;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.width=W+'px';cv.style.height=H+'px';}
  ctx.setTransform(dpr,0,0,dpr,0,0);const surf=cssv('--surface'),ink=cssv('--ink'),muted=cssv('--muted'),line=cssv('--line'),acc=cssv('--accent');
  ctx.fillStyle=surf;ctx.fillRect(0,0,W,H);const sx=sc.scrollLeft,sy=sc.scrollTop;
  const j0=Math.max(0,Math.floor(sx/CW)),j1=Math.min(colsO.length,Math.ceil((sx+W-LW)/CW)+1),i0=Math.max(0,Math.floor(sy/CH)),i1=Math.min(rowsO.length,Math.ceil((sy+H-HH)/CH)+1);
  ctx.font='500 11px "IBM Plex Mono",ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';const showR=MX.show==='r';
  for(let i=i0;i<i1;i++){const y=HH+i*CH-sy;for(let j=j0;j<j1;j++){const x=LW+j*CW-sx;const r=mxVal(rowsO[i],colsO[j]),c=heatCol(r);ctx.fillStyle=c.bg;ctx.fillRect(x+1,y+1,CW-2,CH-2);ctx.fillStyle=c.fg==='#fff'?'#fff':ink;ctx.fillText(showR?String(r):tier(r),x+CW/2,y+CH/2+0.5);}}
  if(V.find){ctx.strokeStyle=acc;ctx.lineWidth=2;const f=V.find;if(f.i>=0){const y=HH+f.i*CH-sy;ctx.strokeRect(LW+1,y+1,W-LW-2,CH-2);}if(f.j>=0){const x=LW+f.j*CW-sx;ctx.strokeRect(x+1,HH+1,CW-2,H-HH-2);}}
  const hv=V.hover,sel=MXSEL;
  if(hv){ctx.strokeStyle=acc;ctx.lineWidth=2;ctx.strokeRect(LW+hv.j*CW-sx+1,HH+hv.i*CH-sy+1,CW-2,CH-2);}
  // frozen row labels
  ctx.fillStyle=surf;ctx.fillRect(0,HH,LW,H-HH);ctx.textAlign='left';ctx.font='600 12px "Atkinson Hyperlegible",system-ui,sans-serif';
  const fit=(s,w)=>{if(ctx.measureText(s).width<=w)return s;while(s.length>1&&ctx.measureText(s+'…').width>w)s=s.slice(0,-1);return s+'…';};
  for(let i=i0;i<i1;i++){const y=HH+i*CH-sy;if(y+CH<HH)continue;const on=(hv&&hv.i===i)||(V.find&&V.find.i===i);ctx.fillStyle=on?acc:ink;ctx.fillText(fit(dn(eName(MXRES.A[rowsO[i]])),LW-10),6,y+CH/2+0.5);}
  // frozen column header (names rotated)
  ctx.fillStyle=surf;ctx.fillRect(LW,0,W-LW,HH);ctx.save();ctx.beginPath();ctx.rect(LW,0,W-LW,HH);ctx.clip();
  for(let j=j0;j<j1;j++){const x=LW+j*CW-sx;const on=(hv&&hv.j===j)||(V.find&&V.find.j===j);ctx.save();ctx.translate(x+CW/2+4,HH-6);ctx.rotate(-Math.PI/2);ctx.fillStyle=on?acc:ink;ctx.fillText(fit(dn(eName(MXRES.B[colsO[j]])),HH-12),0,0);ctx.restore();}
  ctx.restore();ctx.fillStyle=surf;ctx.fillRect(0,0,LW,HH);ctx.strokeStyle=line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,HH-0.5);ctx.lineTo(W,HH-0.5);ctx.moveTo(LW-0.5,0);ctx.lineTo(LW-0.5,H);ctx.stroke();
  ctx.fillStyle=muted;ctx.font='700 11px "Chakra Petch",system-ui,sans-serif';ctx.fillText('A ↓',8,HH-24);ctx.fillText('B →',8,HH-10);}
function cellDetail(){const el=$('mxDetail');if(!el||!MXSEL)return;const a=MXRES.A[MXSEL.a],b=MXRES.B[MXSEL.b];
  const A=SIM.build(a.sid,a.f,a.c,a.v),B=SIM.build(b.sid,b.f,b.c,b.v);
  const g=[0,1,2].map(sa=>[0,1,2].map(sb=>SIM.battle(A,B,sa,sb)));
  el.innerHTML=`<div class="mxdet"><div class="mxdh">${monTag(eName(a),a.sid)} <span class="vs">vs</span> ${monTag(eName(b),b.sid)}<button class="btn ghost" id="mxToSb">${T('Open in battle sandbox')}</button><button class="mxx" id="mxDetX" aria-label="${esc(T('Close'))}">×</button></div>
   <div class="mxdm"><span>${[a.f,...a.c].map(mvTag).join(' · ')} · ${T('Lvl')} ${a.v[0]} ${a.v[1]}/${a.v[2]}/${a.v[3]}</span><span>${[b.f,...b.c].map(mvTag).join(' · ')} · ${T('Lvl')} ${b.v[0]} ${b.v[1]}/${b.v[2]}/${b.v[3]}</span></div>
   <p class="lede" style="font-size:12px">${T('Every shield combination, from {name}\'s side. Rows are its shields, columns are the opponent\'s.',{name:esc(dn(eName(a)))})}</p>
   <div class="hmwrap"><table class="hm mxsh"><thead><tr><th class="hl" title="${esc(T('Shields'))}"><small>A ↓ · B →</small></th>${[0,1,2].map(s=>`<th class="hh"><b>${s}</b></th>`).join('')}</tr></thead><tbody>${g.map((row,sa)=>`<tr><th class="hl"><b>${sa}</b></th>${row.map((r,sb)=>{const c=heatCol(r);return `<td class="hc${sa===MXRES.sa&&sb===MXRES.sb?' sel':''}" style="background:${c.bg};color:${c.fg}">${r}<small> ${tier(r)}</small></td>`;}).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  const sc=MXSEL.sh||[MXRES.sa,MXRES.sb];
  el.querySelector('.mxdet').insertAdjacentHTML('beforeend',`<h4 class="ivh">${T('Battle at {a}v{b} shields',{a:sc[0],b:sc[1]})} <small class="mxsub2">${T('Tap a cell above to see another shield scenario.')}</small></h4><div id="mxBVw"></div>`);
  el.querySelectorAll('.mxsh td.hc').forEach((td,n)=>{const sa=Math.floor(n/3),sb=n%3;td.dataset.mxsc=sa+':'+sb;td.classList.toggle('sel',sa===sc[0]&&sb===sc[1]);td.style.cursor='pointer';});
  bvMount($('mxBVw'),{id:'bvMX',A,B,names:[eName(a),eName(b)],sids:[a.sid,b.sid],o:{sh:sc},cap:MXRES.cap,compact:true});
  el.scrollIntoView({behavior:'smooth',block:'nearest'});}
document.addEventListener('click',e=>{const td=e.target.closest('#mxDetail td[data-mxsc]');if(td&&MXSEL){MXSEL.sh=td.dataset.mxsc.split(':').map(Number);cellDetail();}});
document.addEventListener('click',e=>{if(e.target.closest('#mxDetX')){MXSEL=null;$('mxDetail').innerHTML='';mxDraw();}});
window.addEventListener('resize',()=>{if(MXRES&&cur==='matrix'&&MXV){const r=MXV.rowsO,c=MXV.colsO;setupCanvas(r,c);}});

// ---------- BATTLE VIEW: PvPoke-style timeline, turn-by-turn playback and Sandbox Mode editing (PvPoke's own engine)
// mount(el, cfg): cfg = {id, A, B (SIM.build objects), names:[n0,n1], sids:[s0,s1], o (run options), cap,
//   sandbox:bool, actions:array|null, onEdit(actions) (sandbox edits), compact:bool}
const BVS={};const CHARGES=[[1,'100%'],[.95,'95%'],[.75,'75%'],[.5,'50%'],[.25,'25%']];
function bvModel(R){const U=16,C=100,PAD=12,ch={};for(const e of R.ev)if(e.k==='charged')ch[e.t]=(ch[e.t]||0)+1;
  const N=R.turns+1,base=[];let x=PAD;for(let t=0;t<=N+1;t++){base[t]=x;x+=U+(ch[t]||0)*C;}
  const items=[],frames=[],lastTap=[null,null],slot={},st={hp:R.start.hp.slice(),en:R.start.en.slice(),sh:R.start.sh.slice(),out:[false,false]};
  const snap=()=>({hp:st.hp.map(v=>Math.max(0,v)),en:st.en.slice(),sh:st.sh.slice(),out:st.out.slice()});
  frames.push(Object.assign({t:0,x:base[1],k:'start',ev:[]},snap()));
  const byT={};let maxT=0;for(const e of R.ev){(byT[e.t]=byT[e.t]||[]).push(e);maxT=Math.max(maxT,e.t);}
  for(let t=1;t<=Math.max(maxT,R.turns);t++){const evs=byT[t]||[];let pend=[],pushed=false,shieldFor=[false,false];
    const flush=force=>{if(pend.length||force){frames.push(Object.assign({t,x:base[t]+U,k:'turn',ev:pend},snap()));pushed=true;}pend=[];};
    for(const e of evs){
      if(e.k==='tap'){lastTap[e.i]=e.t;items.push({k:'tap',i:e.i,t,x:base[t]});continue;}
      if(e.k==='wait'){items.push({k:'wait',i:e.i,t,x0:base[t],x1:base[t]+U});continue;}
      if(e.k==='shield'){shieldFor[e.i]=true;continue;}
      if(e.k==='fast'){const s0=lastTap[e.i]!=null&&lastTap[e.i]<=t?lastTap[e.i]:t;lastTap[e.i]=null;
        st.hp[1-e.i]-=e.d;st.en[e.i]=Math.min(100,st.en[e.i]+e.e);
        const it={k:'fast',i:e.i,t,s:s0,m:e.m,d:e.d,e:e.e,p:e.p,x0:base[s0],x1:base[t]+U,after:snap()};items.push(it);pend.push(it);continue;}
      if(e.k==='charged'){flush(false);const k=slot[t]=(slot[t]||0)+1,sx0=base[t]+U+C*(k-1),cx=sx0+C-26,j=1-e.i;
        if(e.sd&&shieldFor[j]){st.sh[j]=Math.max(0,st.sh[j]-1);shieldFor[j]=false;}
        st.hp[j]-=e.d;st.en[e.i]=Math.max(0,Math.min(100,st.en[e.i]+e.e));
        const it={k:'charged',i:e.i,t,m:e.m,d:e.d,e:e.e,p:e.p,sd:e.sd,buff:e.buff,form:e.form,edit:e.edit,x:cx,sx0,after:snap()};items.push(it);
        frames.push(Object.assign({t,x:cx,k:'charged',ev:[it]},snap()));pushed=true;continue;}
      if(e.k==='faint'){st.out[e.i]=true;const it={k:'faint',i:e.i,t,x:base[t]+U};items.push(it);pend.push(it);continue;}}
    flush(!pushed);}
  return {items,frames,W:x+PAD,base,U,C};}
function bvState(id){return BVS[id];}
function bvEnergyBar(k,S,f){const X=k?S.cfg.B:S.cfg.A;const en=f.en[k];
  const marks=X.ch.map(m=>`<i class="bvmk${en>=m.energy?' on':''}" style="left:${m.energy}%;--c:${typeCol(m.moveId)}" title="${esc(mvName(m.moveId))} · ${m.energy}"></i>`).join('');
  return `<span class="bven"><i class="fill" style="width:${en}%"></i>${marks}</span>`;}
function bvCard(k,S,f){const c=S.cfg,X=k?c.B:c.A,nm=c.names[k],mx=X.hp,hp=f.hp[k],pc=100*hp/mx;
  return `<div class="bvc${f.out[k]?' out':''}" data-bvc="${k}">${badge(nm,c.sids[k])}<div class="bvcb"><div class="bvcn"><b>${esc(dn(nm))}</b><span class="bvsh" title="${esc(T('Shields'))}">${[0,1].map(n=>`<i class="${n<f.sh[k]?'on':''}"></i>`).join('')}</span></div>
    <div class="bvrow"><span class="bvl">${T('HP')}</span><span class="bvhp"><i style="width:${pc.toFixed(1)}%" class="${pc<25?'lo':pc<50?'mid':''}"></i></span><b class="num">${hp}</b></div>
    <div class="bvrow"><span class="bvl">${T('energy')}</span>${bvEnergyBar(k,S,f)}<b class="num">${f.en[k]}</b></div></div></div>`;}
function bvNarrate(S,f){const c=S.cfg,nm=k=>esc(dn(c.names[k]));if(!f)return '';
  if(f.k==='start')return T('Ready: press Battle to play it out turn by turn.');
  const parts=[];for(const it of f.ev){if(it.k==='fast')parts.push(T('{p} {move}: {d} damage, +{e} energy',{p:nm(it.i),move:mvTag(it.m),d:it.d,e:it.e}));
    else if(it.k==='charged')parts.push(it.sd?T('{p} uses {move}. {q} shields it.',{p:nm(it.i),move:mvTag(it.m),q:nm(1-it.i)}):T('{p} uses {move}: {d} damage ({pc}%)',{p:nm(it.i),move:mvTag(it.m),d:it.d,pc:it.p})+(it.buff?` · <small>${esc(it.buff)}</small>`:''));
    else if(it.k==='faint')parts.push(`<b>${T('{p} faints.',{p:nm(it.i)})}</b>`);}
  return parts.join(' · ')||T('Turn {t}',{t:f.t});}
function bvSvg(S){const M=S.M,c=S.cfg,z=S.zoom,H=c.compact?124:136,Y=[42,96],RY=H-10,sx=v=>(v*z).toFixed(1);
  let g='';const W=sx(M.W);
  // PvPoke-style: dotted lane per Pokémon, small time labels underneath
  for(let t=10;t<=S.R.turns+1;t+=10)g+=`<text x="${sx(M.base[t])}" y="${RY}" class="bvtx">${t/2}s</text>`;
  for(const k of [0,1])g+=`<line x1="4" x2="${W}" y1="${Y[k]}" y2="${Y[k]}" class="bvlane"/>`;
  const hex=(cx,cy,r)=>[0,1,2,3,4,5].map(a=>`${(cx+r*Math.cos(Math.PI/3*a+Math.PI/6)).toFixed(1)},${(cy+r*Math.sin(Math.PI/3*a+Math.PI/6)).toFixed(1)}`).join(' ');
  const order=n=>({tap:0,wait:1,fast:1,charged:2,faint:3})[M.items[n].k]||0;
  M.items.map((it,n)=>n).sort((p,q)=>order(p)-order(q)||p-q).forEach(n=>{const it=M.items[n],y=Y[it.i],on=S.sel===n?' sel':'';
    if(it.k==='tap'){g+=`<circle data-bvi="${n}" cx="${sx(it.x+8)}" cy="${y-17}" r="4.5" class="bvtap${c.sandbox?' ed':''}${on}"/>`;}
    else if(it.k==='fast'){const cx=+sx(it.x1-8);g+=`<rect data-bvi="${n}" x="${(cx-6).toFixed(1)}" y="${y-6}" width="12" height="12" fill="${typeCol(it.m)}" class="bvf${on}"/>`;}
    else if(it.k==='wait'){const cx=+sx(it.x0+8);g+=`<rect data-bvi="${n}" x="${(cx-5).toFixed(1)}" y="${y-5}" width="10" height="10" class="bvw${on}"/>`;}
    else if(it.k==='charged'){const cl=typeCol(it.m),cx=+sx(it.x),r=Math.min(19,10+it.p/5);
      // charge-up: a chain of growing rings leading into the move
      let chain='';const x0=+sx(it.sx0+6),x1=cx-r-5;for(let q=0;q<7;q++){const f=q/6,rr=2.5+f*(r*0.55);chain+=`<circle cx="${(x0+(x1-x0)*Math.pow(f,1.15)).toFixed(1)}" cy="${y}" r="${rr.toFixed(1)}" fill="none" stroke="${cl}" stroke-width="1.6" opacity="${(0.5+0.5*f).toFixed(2)}"/>`;}
      g+=`<g data-bvi="${n}" class="bvch${on}${it.edit===false?' ro':''}"><rect x="${x0-4}" y="${y-r-3}" width="${(cx+r+3-x0+4).toFixed(1)}" height="${(2*r+6).toFixed(1)}" fill="transparent"/>${chain}<circle cx="${cx}" cy="${y}" r="${r.toFixed(1)}" fill="${cl}" class="bvbig"/></g>`;
      if(it.sd)g+=`<polygon points="${hex(cx,Y[1-it.i],10)}" class="bvsd" data-bvi="${n}"/>`;
      if(it.buff){const up=/^\+|Attack \+|\+\d/.test(it.buff)&&!/-/.test(it.buff);g+=`<text x="${cx}" y="${y-r-5}" class="bvbf">${esc(it.buff.replace(/ Attack/g,' Atk').replace(/ Defense/g,' Def'))}</text>`;}}
    else if(it.k==='faint'){const cx=+sx(it.x)+8;g+=`<path d="M${cx-7},${y-7}L${cx+7},${y+7}M${cx+7},${y-7}L${cx-7},${y+7}" class="bvx"/>`;}});
  const f=S.frames[S.pos];g+=`<line id="${c.id}Ph" x1="${sx(f.x)}" x2="${sx(f.x)}" y1="10" y2="${Y[1]+22}" class="bvph"/>`;
  return `<svg class="bvsvg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T('Battle timeline'))}">${g}</svg>`;}
function bvPop(S,n){const c=S.cfg,it=S.M.items[n],nm=k=>esc(dn(c.names[k]));if(!it)return '';
  const X=it.i?c.B:c.A,sec=t=>(t*0.5).toFixed(1)+'s';let h='';
  if(it.k==='fast')h=`<div class="bvp1"><b>${nm(it.i)}</b>${mvTag(it.m)}</div><div class="num">${T('Turns {a}–{b}',{a:it.s,b:it.t})} (${sec(it.s-1)}–${sec(it.t)}) · ${it.d} ${T('damage')} (${it.p}%) · +${it.e} ${T('energy')}</div><div class="num bvaft">${T('After')}: ${nm(0)} ${it.after.hp[0]} ${T('HP')}, ${it.after.en[0]} ${T('energy')} · ${nm(1)} ${it.after.hp[1]} ${T('HP')}, ${it.after.en[1]} ${T('energy')}</div>`;
  else if(it.k==='charged')h=`<div class="bvp1"><b>${nm(it.i)}</b>${mvTag(it.m)}</div><div class="num">${T('Turn {t}',{t:it.t})} (${sec(it.t)}) · ${it.sd?T('Shielded by {name}',{name:nm(1-it.i)}):`${it.d} ${T('damage')} (${it.p}%)`} · ${it.e} ${T('energy')}${it.buff?' · '+esc(it.buff):''}</div><div class="num bvaft">${T('After')}: ${nm(0)} ${it.after.hp[0]} ${T('HP')}, ${it.after.en[0]} ${T('energy')} · ${nm(1)} ${it.after.hp[1]} ${T('HP')}, ${it.after.en[1]} ${T('energy')}</div>`;
  else if(it.k==='tap')h=`<b>${nm(it.i)}</b><div class="num">${T('Turn {t}',{t:it.t})} (${sec(it.t-1)})</div>`;
  else if(it.k==='wait')h=`<div class="bvp1"><b>${nm(it.i)}</b>${T('Wait')}</div><div class="num">${T('Turn {t}',{t:it.t})}</div>`;
  // sandbox editor: choose what this Pokémon does on this turn
  if(c.sandbox&&(it.k==='charged'&&it.edit!==false||it.k==='fast'||it.k==='tap'||it.k==='wait')){const turn=it.k==='fast'?it.s:it.t;
    const cur=it.k==='charged'?'c'+X.ch.findIndex(m=>m.moveId===it.m):it.k==='wait'?'wait':'fast';
    const act=it.k==='charged'?(S.actions||[]).find(a=>a.type==='charged'&&a.actor===it.i&&a.turn===it.t):null;
    const shOn=act?act.shielded:false,bfOn=act?act.buffs:false,chg=act?act.charge||1:1;
    const hasBuff=X.ch.some(m=>m.buffs&&(m.buffApplyChance||1)<1);
    h+=`<div class="bved" data-bvturn="${turn}" data-bvactor="${it.i}" data-bvorig="${it.k==='charged'?it.t:''}"><div class="bvedh">${T('Sandbox: what does {p} do on turn {t}?',{p:nm(it.i),t:turn})}</div>
      <label class="fld">${T('Action')}<select data-bved="act"><option value="fast"${cur==='fast'?' selected':''}>${T('Fast move')} (${esc(mvName(X.fast.moveId))})</option>${X.ch.map((m,j)=>`<option value="c${j}"${cur==='c'+j?' selected':''}>${esc(mvName(m.moveId))} (${m.energy})</option>`).join('')}<option value="wait"${cur==='wait'?' selected':''}>${T('Wait')}</option></select></label>
      <label class="fld"><input type="checkbox" data-bved="sh"${shOn?' checked':''}> ${T('{p} shields it',{p:nm(1-it.i)})}</label>
      ${hasBuff?`<label class="fld"><input type="checkbox" data-bved="bf"${bfOn?' checked':''}> ${T('Stat change triggers')}</label>`:''}
      <label class="fld">${T('Charge')}<select data-bved="chg">${CHARGES.map(([v,l])=>`<option value="${v}"${v===chg?' selected':''}>${l}</option>`).join('')}</select></label>
      <div class="controls"><button class="btn" data-bvapply="1">${T('Apply')}</button></div></div>`;}
  return `<div class="bvpop" role="dialog">${h}<button class="mxx bvpx" data-bvclose="1" aria-label="${esc(T('Close'))}">×</button></div>`;}
function bvPaint(S,scroll){const c=S.cfg,f=S.frames[S.pos],root=$(c.id);if(!root)return;
  root.querySelector('.bvcards').innerHTML=bvCard(0,S,f)+bvCard(1,S,f);
  root.querySelector('.bvnar').innerHTML=bvNarrate(S,f);
  root.querySelector('.bvclock').textContent=T('Turn {t}',{t:f.t})+' · '+(f.t*0.5).toFixed(1)+'s';
  const sl=root.querySelector('.bvscrub');if(sl){sl.max=S.frames.length-1;sl.value=S.pos;}
  const ph=$(c.id+'Ph');if(ph){const x=(f.x*S.zoom).toFixed(1);ph.setAttribute('x1',x);ph.setAttribute('x2',x);}
  const pb=root.querySelector('[data-bvplay]');if(pb){pb.textContent=S.playing?'⏸ '+T('Pause'):(S.pos>=S.frames.length-1?'▶ '+T('Battle!'):'▶ '+T('Play'));pb.setAttribute('aria-pressed',String(S.playing));}
  if(scroll){const w=root.querySelector('.bvscroll');if(w){const x=f.x*S.zoom;if(x<w.scrollLeft+40||x>w.scrollLeft+w.clientWidth-60)w.scrollLeft=Math.max(0,x-w.clientWidth/2);}}}
function bvDrawTl(S){const root=$(S.cfg.id);if(!root)return;root.querySelector('.bvscroll').innerHTML=bvSvg(S);const p=root.querySelector('.bvpopw');p.innerHTML=S.sel!=null?bvPop(S,S.sel):'';}
function bvStop(S){S.playing=false;clearTimeout(S.timer);}
function bvTick(S){if(!S.playing)return;if(S.pos>=S.frames.length-1){bvStop(S);bvPaint(S);return;}
  S.pos++;bvPaint(S,true);const f=S.frames[S.pos];S.timer=setTimeout(()=>bvTick(S),(f.k==='charged'?1400:500)/S.speed);}
function bvMount(el,cfg){const old=BVS[cfg.id];if(old)bvStop(old);
  const R=cfg.R||PVE.detail(cfg.A.spec,cfg.B.spec,Object.assign({},cfg.o,{cap:cfg.cap,actions:cfg.sandbox?(cfg.actions||null):null}));
  const S={cfg,R,M:bvModel(R),pos:0,playing:false,timer:null,speed:old?old.speed:1,zoom:old?old.zoom:(cfg.compact?0.8:1),sel:null,actions:R.actions};
  S.frames=S.M.frames;S.pos=S.frames.length-1;BVS[cfg.id]=S;
  const dropped=cfg.sandbox&&cfg.actions?cfg.actions.length-R.actions.filter(a=>a.valid).length:0;
  el.innerHTML=`<div class="bv" id="${cfg.id}">
    <div class="bvcards"></div>
    <div class="bvctl"><button class="btn" data-bvplay="1"></button><button class="btn ghost" data-bvstep="-1" aria-label="${esc(T('Step back'))}">◀</button><button class="btn ghost" data-bvstep="1" aria-label="${esc(T('Step forward'))}">▶</button><button class="btn ghost" data-bvend="1" aria-label="${esc(T('Jump to the end'))}">⏭</button>
      <label class="fld">${T('Speed')}<select data-bvspeed="1">${[0.5,1,2,4].map(v=>`<option value="${v}"${v===S.speed?' selected':''}>${v}×</option>`).join('')}</select></label>
      <label class="fld">${T('Zoom')}<select data-bvzoom="1">${[0.5,0.8,1,1.5,2].map(v=>`<option value="${v}"${v===S.zoom?' selected':''}>${v}×</option>`).join('')}</select></label>
      <span class="num bvclock"></span></div>
    <input type="range" class="bvscrub" min="0" value="0" aria-label="${esc(T('Battle position'))}">
    <p class="bvnar"></p>
    <div class="bvtl"><div class="bvnames"><span>${esc(shortName(cfg.names[0]))}</span><span>${esc(shortName(cfg.names[1]))}</span></div><div class="bvscroll"></div></div>
    <div class="bvpopw"></div>
    <p class="bvkey"><span><i class="kf"></i>${T('fast move')}</span><span><i class="kc"></i>${T('charged move (size = damage)')}</span><span><i class="ks"></i>${T('shield')}</span><span><b class="kx">✕</b> ${T('faint')}</span><span><i class="kt"></i>${T('a turn where a move can start')}</span></p>
    ${cfg.sandbox?`<p class="bvsbn">${T('Sandbox mode: tap any move on the timeline to change what happens on that turn: throw a different charged move, wait, change the charge, or choose whether it is shielded. Each side can shield up to 2 charged moves.')}${dropped>0?` <b>${T('{n} action(s) could not happen (not enough energy) and were skipped.',{n:dropped})}</b>`:''}</p>`:''}
  </div>`;
  bvDrawTl(S);bvPaint(S);return S;}
// events (one delegated handler for every battle view on the page)
document.addEventListener('click',e=>{const root=e.target.closest('.bv');if(!root)return;const S=BVS[root.id];if(!S)return;const t=e.target;
  const b=t.closest('button');
  if(b&&b.dataset.bvplay){if(S.playing){bvStop(S);bvPaint(S);return;}if(S.pos>=S.frames.length-1)S.pos=0;S.playing=true;S.sel=null;root.querySelector('.bvpopw').innerHTML='';bvPaint(S,true);S.timer=setTimeout(()=>bvTick(S),400/S.speed);return;}
  if(b&&b.dataset.bvstep){bvStop(S);S.pos=Math.max(0,Math.min(S.frames.length-1,S.pos+(+b.dataset.bvstep)));bvPaint(S,true);return;}
  if(b&&b.dataset.bvend){bvStop(S);S.pos=S.frames.length-1;bvPaint(S,true);return;}
  if(b&&b.dataset.bvclose){S.sel=null;bvDrawTl(S);return;}
  if(b&&b.dataset.bvapply){const ed=b.closest('.bved'),turn=+ed.dataset.bvturn,actor=+ed.dataset.bvactor,orig=ed.dataset.bvorig,act=ed.querySelector('[data-bved="act"]').value;
    const sh=ed.querySelector('[data-bved="sh"]'),bf=ed.querySelector('[data-bved="bf"]'),chg=+ed.querySelector('[data-bved="chg"]').value;
    let A=(S.actions||[]).filter(a=>a.valid!==false).map(a=>Object.assign({},a));
    A=A.filter(a=>!(a.actor===actor&&(a.turn===turn||(orig!==''&&a.turn===+orig))));
    if(act==='wait')A.push({type:'wait',actor,turn,value:0});
    else if(act!=='fast')A.push({type:'charged',actor,turn,value:+act.slice(1),shielded:!!(sh&&sh.checked),buffs:!!(bf&&bf.checked),charge:chg});
    A.sort((x,y)=>x.turn-y.turn||x.actor-y.actor);S.sel=null;if(S.cfg.onEdit)S.cfg.onEdit(A);return;}
  const hit=t.closest('[data-bvi]');
  if(hit&&root.contains(hit)){const n=+hit.dataset.bvi;S.sel=S.sel===n?null:n;bvStop(S);
    const it=S.M.items[n];if(it&&it.after){const fi=S.frames.findIndex(f=>f.ev.includes(it));if(fi>=0)S.pos=fi;}
    bvDrawTl(S);bvPaint(S);return;}
  if(t.closest('.bvsvg')){const svg=t.closest('.bvsvg'),r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/S.zoom;let best=0;S.frames.forEach((f,i)=>{if(Math.abs(f.x-x)<Math.abs(S.frames[best].x-x))best=i;});bvStop(S);S.pos=best;S.sel=null;root.querySelector('.bvpopw').innerHTML='';bvPaint(S);}});
document.addEventListener('input',e=>{const root=e.target.closest('.bv');if(!root)return;const S=BVS[root.id];if(!S)return;
  if(e.target.classList.contains('bvscrub')){bvStop(S);S.pos=+e.target.value;bvPaint(S,true);}});
document.addEventListener('change',e=>{const root=e.target.closest('.bv');if(!root)return;const S=BVS[root.id];if(!S)return;const d=e.target.dataset;
  if(d.bvspeed){S.speed=+e.target.value;return;}
  if(d.bvzoom){S.zoom=+e.target.value;bvDrawTl(S);bvPaint(S,true);return;}});
// ---------- BATTLE SANDBOX (one matchup, every input adjustable)
// Side: {sid,f,c,iv,lv, sh, hp (starting HP or null = full), en, st:[atk,def], bait}
function sbSide(sid,o){o=o||{};const e=mkEntry(sid,o);return Object.assign(e,{sh:o.sh!=null?o.sh:1,hp:null,en:0,st:[0,0],bait:true});}
let SB={cap:50,s:[null,null]};
try{const o=JSON.parse(localStorage.getItem('gl_sb')||'null');if(o&&Array.isArray(o.s)&&o.s[0]&&o.s[1]&&SP[o.s[0].sid]&&SP[o.s[1].sid])SB=o;}catch(e){}
if(!SB.s[0]){const t=team.find(Boolean);SB.s[0]=sbSide(t?t.sid:Mx[0].sid,t?{f:t.f,c:t.c,pref:'reg'}:{pref:'reg'});const top=Mx.map((m,i)=>i).sort((a,b)=>Mx[b].u-Mx[a].u).find(i=>Mx[i].sid!==SB.s[0].sid);SB.s[1]=sbSide(Mx[top].sid,{f:Mx[top].f,c:Mx[top].c});}
function sbSave(){try{localStorage.setItem('gl_sb',JSON.stringify(SB));}catch(e){}}
const sbIV=x=>effIV(x,SB.cap);
const sbBuild=x=>SIM.build(x.sid,x.f,x.c.filter(Boolean),sbIV(x));
function sbOpts(A,B,sh){const s=SB.s;return {sh:sh||[s[0].sh,s[1].sh],hp:[s[0].hp!=null?Math.min(s[0].hp,A.hp):A.hp,s[1].hp!=null?Math.min(s[1].hp,B.hp):B.hp],en:[s[0].en,s[1].en],st:[s[0].st,s[1].st],bait:[s[0].bait,s[1].bait]};}
function sbPanel(k){const x=SB.s[k],v=sbIV(x),B=sbBuild(x),cp=cpOf(x.sid,v[0],v[1],v[2],v[3]),hp0=x.hp!=null?Math.min(x.hp,B.hp):B.hp;
  const stg=(i,lab)=>`<label>${lab}<select data-sbst="${k}:${i}">${[-4,-3,-2,-1,0,1,2,3,4].map(n=>`<option value="${n}"${n===x.st[i]?' selected':''}>${n>0?'+'+n:n}</option>`).join('')}</select></label>`;
  return `<div class="sbh">${badge(eName(x),x.sid,true)}<div class="sbt"><input type="text" list="allNames" value="${esc(dn(eName(x)))}" data-sbname="${k}" aria-label="${esc(T('Pokémon'))} ${k+1}" autocomplete="off">${typeBars(x.sid)}</div></div>
   <div class="mvs sbmv"><label>${T('Fast')}${moveSel(x.sid,'f',x.f,`data-sbmv="${k}:f"`)}</label><label>${T('Charged')}${moveSel(x.sid,'c',x.c[0]||'',`data-sbmv="${k}:0"`)}</label><label>${T('Charged')}${moveSel(x.sid,'c',x.c[1]||'',`data-sbmv="${k}:1"`)}</label></div>
   <div class="mxivs"><label>${T('Attack')}<input type="number" min="0" max="15" inputmode="numeric" data-sbiv="${k}:0" value="${v[1]}"></label><label>${T('Defense')}<input type="number" min="0" max="15" inputmode="numeric" data-sbiv="${k}:1" value="${v[2]}"></label><label>${T('HP')}<input type="number" min="0" max="15" inputmode="numeric" data-sbiv="${k}:2" value="${v[3]}"></label>
    <span class="mxlv">${T('Level')} <b class="num">${v[0]}</b> · CP <b class="num${cp>1500?' overw':''}">${cp}</b></span></div>
   <div class="controls sbivb"><button class="link" data-sbivset="${k}:def">${T('PvPoke default IVs')}</button><button class="link" data-sbivset="${k}:r1">${T('Rank 1 stat product')}</button><button class="link" data-sbivset="${k}:max">15/15/15</button></div>
   <div class="sbstats num">${T('Attack')} ${B.atk.toFixed(1)} · ${T('Defense')} ${B.df.toFixed(1)} · ${T('HP')} ${B.hp}</div>
   <div class="sbrow"><span class="sbl">${T('Shields')}</span><div class="seg" role="group">${[0,1,2].map(s=>`<button data-sbsh="${k}:${s}" aria-pressed="${x.sh===s}">${s}</button>`).join('')}</div>
    <label class="fld sbbait"><input type="checkbox" data-sbbait="${k}"${x.bait?' checked':''}> ${T('Bait shields')}</label></div>
   <label class="sbrange"><span class="sbl">${T('Starting HP')}</span><input type="range" min="1" max="${B.hp}" value="${hp0}" data-sbhp="${k}"><b class="num" data-sbhpv="${k}">${hp0} / ${B.hp}</b></label>
   <label class="sbrange"><span class="sbl">${T('Starting energy')}</span><input type="range" min="0" max="100" value="${x.en}" data-sben="${k}"><b class="num" data-sbenv="${k}">${x.en}</b></label>
   <div class="sbrow sbst"><span class="sbl">${T('Starting stat stages')}</span>${stg(0,T('Attack'))}${stg(1,T('Defense'))}</div>
   <div class="controls"><button class="link" data-sbreset="${k}">${T('Reset conditions')}</button></div>`;}
function renderSandbox(){const el=$('sbIn');if(!el)return;
  el.innerHTML=`<div class="card sbside sb0">${sbPanel(0)}</div><div class="sbmid"><button class="btn ghost" id="sbSwap" aria-label="${esc(T('Swap sides'))}">⇄</button></div><div class="card sbside sb1">${sbPanel(1)}</div>`;
  $('sbCap').value=String(SB.cap);sbResult();if(SB_AUTO){SB_AUTO=false;setTimeout(()=>{sbAnalyse();const c=$('sbIV');if(c)c.scrollIntoView({behavior:'smooth',block:'start'});},50);}}
// --- result
const typeCol=mv=>TC[MV[mv]?MV[mv].type:'normal']||'#888';
function sbDetail(){const s=SB.s,A=sbBuild(s[0]),B=sbBuild(s[1]),o=sbOpts(A,B),sand=SB.mode==='sandbox';
  // Sandbox Mode starts from the automatic battle at your shield settings, turned into editable actions; then each side may shield up to 2 charged moves
  if(sand&&!SB.actions){const R0=PVE.detail(A.spec,B.spec,Object.assign({},o,{cap:SB.cap,actions:null}));SB.actions=R0.actions.map(a=>Object.assign({},a));sbSave();}
  const oo=sand?Object.assign({},o,{sh:[2,2]}):o;const R=PVE.detail(A.spec,B.spec,Object.assign({},oo,{cap:SB.cap,actions:sand?SB.actions:null}));
  return {A,B,o,oo,R,sand};}
function bvLog(M){return M.items.filter(it=>it.k==='fast'||it.k==='charged').map(it=>({t:it.t,i:it.i,k:it.k,m:it.m,d:it.d,sd:it.sd,hp:it.after.hp}));}
function sbEnc(){try{return btoa(unescape(encodeURIComponent(JSON.stringify({s:SB.s,c:SB.cap,m:SB.mode||'auto',a:SB.mode==='sandbox'?SB.actions:null})))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}catch(e){return '';}}
function sbDec(str){try{const o=JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g,'+').replace(/_/g,'/')))));if(!o||!Array.isArray(o.s)||!o.s[0]||!o.s[1]||!SP[o.s[0].sid]||!SP[o.s[1].sid])return null;return o;}catch(e){return null;}}
function sbResult(){const out=$('sbOut');if(!out)return;const s=SB.s,D=sbDetail(),{A,B,o,R,sand}=D;
  const nm=k=>esc(dn(eName(s[k]))),r=R.ratings,win=r[0]>500?0:r[0]<500?1:-1;
  let h=`<div class="card sbres"><div class="sbverdict ${win===0?'w0':win===1?'w1':'tie'}"><b>${win<0?T('Tie'):T('{name} wins',{name:nm(win)})}</b><span class="num">${nm(0)} <span class="bigr">${r[0]}</span> · ${nm(1)} <span class="bigr">${r[1]}</span></span>${chip(tier(r[0]))}${sand?`<span class="tag sbmtag">${T('Sandbox mode')}</span>`:''}</div>
   <p class="lede" style="font-size:13px">${T('Battle length {s}s · shields left {a} / {b} · energy left {c} / {d}',{s:(R.turns*0.5).toFixed(1),a:R.sh[0],b:R.sh[1],c:R.en[0],d:R.en[1]})}</p>
   <div class="controls sbmodes"><div class="seg" role="group" aria-label="${esc(T('Battle mode'))}"><button data-sbmode="auto" aria-pressed="${!sand}">${T('Automatic')}</button><button data-sbmode="sandbox" aria-pressed="${sand}">${T('Sandbox mode')}</button></div>
    ${sand?`<button class="link" id="sbReset">${T('Reset timeline')}</button>`:''}<button class="link" id="sbLink">${T('Copy link to this battle')}</button>${R.link?`<a class="link" href="${esc(R.link)}" target="_blank" rel="noopener">${T('Open in PvPoke')} ↗</a>`:''}</div>
   <div id="sbBV"></div></div>`;
  const M=bvModel(R);
  h+=sbLogCard(bvLog(M),A,B);
  h+=sbDamageCard(A,B,o);
  h+=sbIVCard(A,B);
  h+=sbShieldGrid(A,B);
  h+='<div id="sbIV"></div>';
  out.innerHTML=h;
  bvMount($('sbBV'),{id:'bvSB',A,B,R,names:[eName(s[0]),eName(s[1])],sids:[s[0].sid,s[1].sid],o:D.oo,cap:SB.cap,sandbox:sand,actions:SB.actions,onEdit:a=>{SB.actions=a;sbSave();sbResult();}});
  renderSbIV();}
function sbLogCard(log,A,B){const nm=k=>esc(dn(eName(SB.s[k])));const rows=[];let seg=[{n:0,d:0,m:null,t0:null},{n:0,d:0,m:null,t0:null}],segStart=0;
  const flush=tEnd=>{if(!seg[0].n&&!seg[1].n)return;rows.push(`<tr class="sbfast"><td class="num">${(segStart*0.5).toFixed(1)}–${(tEnd*0.5).toFixed(1)}s</td><td colspan="3">${[0,1].filter(k=>seg[k].n).map(k=>`${nm(k)}: ${seg[k].n} × ${esc(mvName(seg[k].m))} <span class="num">(${seg[k].d} ${T('damage')})</span>`).join(' · ')}</td></tr>`);seg=[{n:0,d:0,m:null},{n:0,d:0,m:null}];};
  for(const e of log){if(e.k==='fast'){const s=seg[e.i];if(!s.n&&!seg[1-e.i].n)segStart=e.t;s.n++;s.d+=e.d;s.m=e.m;continue;}
    if(e.k==='charged'){flush(e.t);segStart=e.t+1;const j=1-e.i;rows.push(`<tr class="sbch"><td class="num">${(e.t*0.5).toFixed(1)}s</td><td>${nm(e.i)}</td><td>${mvTag(e.m)}</td><td>${e.sd?`<span class="tag">${T('Shielded by {name}',{name:nm(j)})}</span>`:`<b class="num">${e.d}</b> ${T('damage')}`} · <span class="num">${nm(j)} ${Math.max(0,e.hp[j])} ${T('HP')}</span>${e.st&&(e.st[0][0]||e.st[0][1]||e.st[1][0]||e.st[1][1])?` · <small>${T('stages')} ${nm(0)} ${fmtSt(e.st[0])}, ${nm(1)} ${fmtSt(e.st[1])}</small>`:''}</td></tr>`);}
    if(e.k==='form')rows.push(`<tr class="sbfast"><td class="num">${(e.t*0.5).toFixed(1)}s</td><td colspan="3">${nm(e.i)}: ${T('changes form')}</td></tr>`);}
  const last=log.length?log[log.length-1].t:0;flush(last);
  return `<div class="card"><h3 style="font-size:18px;margin-bottom:6px">${T('Turn by turn')}</h3><div class="tblwrap"><table class="vt sblog"><thead><tr><th>${T('Time')}</th><th>${T('Pokémon')}</th><th>${T('Move')}</th><th>${T('Result')}</th></tr></thead><tbody>${rows.join('')||`<tr><td colspan="4" class="empty">${T('No moves were used.')}</td></tr>`}</tbody></table></div></div>`;}
const fmtSt=st=>`${st[0]>0?'+':''}${st[0]}/${st[1]>0?'+':''}${st[1]}`;
function sbDamageCard(A,B,o){const s=SB.s;const row=(k,X,Y)=>{const x=s[k],j=1-k;const fd=SIM.dmg(X,Y,X.fast,o.st[k][0],o.st[j][1]);const yhp=o.hp[j];
    const fc=m=>Math.max(0,Math.ceil((m.energy-o.en[k])/X.fast.energyGain));
    return `<tr><th class="hl">${monTag(eName(x),x.sid)}</th><td>${mvTag(X.fast.moveId)} <b class="num">${fd}</b> <small class="num">(${(100*fd/Y.hp).toFixed(1)}% · +${X.fast.energyGain} ${T('energy')})</small></td><td>${X.ch.map(m=>{const d=SIM.dmg(X,Y,m,o.st[k][0],o.st[j][1]);return `<div>${mvTag(m.moveId)} <b class="num">${d}</b> <small class="num">(${(100*d/Y.hp).toFixed(0)}% · ${m.energy} ${T('energy')} · ${T('{n} fast moves',{n:fc(m)})})</small>${d>=yhp?` <span class="tag">${T('KO')}</span>`:''}</div>`;}).join('')}</td></tr>`;};
  return `<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Damage numbers')}</h3><p class="lede" style="font-size:13px">${T('Damage each move does to the other Pokémon with the current IVs and starting stat stages. Fast move counts start from the starting energy.')}</p>
   <div class="tblwrap"><table class="vt sbdmg"><thead><tr><th></th><th>${T('Fast move')}</th><th>${T('Charged moves')}</th></tr></thead><tbody>${row(0,A,B)}${row(1,B,A)}</tbody></table></div></div>`;}
// breakpoints: how this Pokémon's fast damage changes with its Attack IV; bulkpoints: how the opponent's fast damage changes with its Defense IV
function sbPoints(k){const s=SB.s,x=s[k],y=s[1-k],v=sbIV(x),Y=sbBuild(y);const bp=[],bk=[];
  for(let a=0;a<16;a++){const X=SIM.build(x.sid,x.f,x.c,[bestLevel(x.sid,a,v[2],v[3],SB.cap),a,v[2],v[3]]);bp.push(SIM.dmg(X,Y,X.fast));}
  for(let d=0;d<16;d++){const X=SIM.build(x.sid,x.f,x.c,[bestLevel(x.sid,v[1],d,v[3],SB.cap),v[1],d,v[3]]);bk.push(SIM.dmg(Y,X,Y.fast));}
  const ranges=arr=>{const out=[];let s0=0;for(let i=1;i<=16;i++){if(i===16||arr[i]!==arr[s0]){out.push([s0,i-1,arr[s0]]);s0=i;}}return out;};
  return {bp:ranges(bp),bk:ranges(bk),cur:v};}
function sbIVCard(A,B){const s=SB.s;
  const pts=k=>{const P=sbPoints(k),x=s[k],y=s[1-k],me=dn(eName(x)),op=dn(eName(y));
    const fmt=(rs,cur)=>rs.length===1?`<span class="sbpt">${T('Same damage at every IV: {d}',{d:rs[0][2]})}</span>`:rs.map(([a,b,d])=>`<span class="sbpt${cur>=a&&cur<=b?' on':''}">${a===b?a:a+'–'+b}: <b class="num">${d}</b></span>`).join('');
    return `<div class="sbpts"><h4>${esc(me)}</h4><p>${T('{move} damage to {op}, by {me}\'s Attack IV:',{move:esc(mvName(x.f)),op:esc(op),me:esc(me)})}</p><div class="sbptl">${fmt(P.bp,P.cur[1])}</div>
     <p>${T('{op}\'s {move} damage to {me}, by {me}\'s Defense IV:',{op:esc(op),move:esc(mvName(y.f)),me:esc(me)})}</p><div class="sbptl">${fmt(P.bk,P.cur[2])}</div></div>`;};
  // the same battle with each side on common IV spreads
  const spreads=[['cur',T('Current')],['def',T('PvPoke default IVs')],['r1',T('Rank 1 stat product')],['max','15/15/15']];
  const ivOf=(x,m)=>{if(m==='cur')return sbIV(x);const y=Object.assign({},x,{iv:x.iv&&x.iv.slice(),lv:x.lv});setIV(y,m);if(m==='r1')y.iv=rank1(x.sid,SB.cap).slice();return effIV(y,SB.cap);};
  const tbl=k=>{const x=s[k];const rows=spreads.map(([m,l])=>{const iv=ivOf(x,m);const X=SIM.build(x.sid,x.f,x.c.filter(Boolean),iv),O=k?A:B;const pair=k?[O,X]:[X,O];const R=SIM.run(pair[0],pair[1],sbOpts(pair[0],pair[1]));const r=R.ratings[k];
      return `<tr${m==='cur'?' class="cur"':''}><td>${l}</td><td class="num">${iv[1]}/${iv[2]}/${iv[3]} · ${T('Lvl')} ${iv[0]}</td><td class="num">${cpOf(x.sid,iv[0],iv[1],iv[2],iv[3])}</td><td class="r"><span class="num">${r}</span> ${chip(tier(r))}</td></tr>`;}).join('');
    return `<div><h4>${esc(dn(eName(x)))}</h4><div class="tblwrap"><table class="vt sbivt"><thead><tr><th>${T('IVs')}</th><th></th><th>CP</th><th class="r">${T('Rating')}</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;};
  return `<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('What the IVs change')}</h3><p class="lede" style="font-size:13px">${T('Breakpoints and bulkpoints: the IVs where a fast move does one more or one less damage (level is recalculated for each IV under the level cap). Your current IV is highlighted. Below, the same battle with each Pokémon on common IV spreads while the other keeps its IVs.')}</p>
   <div class="cols">${pts(0)}${pts(1)}</div><div class="cols" style="margin-top:12px">${tbl(0)}${tbl(1)}</div></div>`;}
function sbShieldGrid(A,B){const s=SB.s;const g=[0,1,2].map(a=>[0,1,2].map(b=>SIM.run(A,B,sbOpts(A,B,[a,b])).rating));
  return `<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Every shield combination')}</h3><p class="lede" style="font-size:13px">${T('Same starting conditions, from {name}\'s side. Rows are its shields, columns are the opponent\'s.',{name:esc(dn(eName(s[0])))})}</p>
   <div class="hmwrap"><table class="hm mxsh"><thead><tr><th class="hl"><small>${esc(shortName(eName(s[0])))} ↓ · ${esc(shortName(eName(s[1])))} →</small></th>${[0,1,2].map(x=>`<th class="hh"><b>${x}</b></th>`).join('')}</tr></thead><tbody>${g.map((row,a)=>`<tr><th class="hl"><b>${a}</b></th>${row.map((r,b)=>{const c=heatCol(r);return `<td class="hc${a===s[0].sh&&b===s[1].sh?' sel':''}" style="background:${c.bg};color:${c.fg}">${r}<small> ${tier(r)}</small></td>`;}).join('')}</tr>`).join('')}</tbody></table></div></div>`;}
// --- events
const SBEL=$('v-sandbox');
function sbChanged(full){sbSave();if(full)renderSandbox();else sbResult();}
SBEL.addEventListener('change',e=>{const t=e.target,d=t.dataset;
  if(d.sbname!=null){const k=+d.sbname,sid=resolveSid(t.value);if(!sid){toast(T('Pokémon not found: {n}',{n:t.value}));t.value=dn(eName(SB.s[k]));return;}const o=SB.s[k];SB.s[k]=Object.assign(sbSide(sid),{sh:o.sh,en:0,st:[0,0],bait:o.bait});SB.actions=null;sbChanged(true);return;}
  if(d.sbmv){const [k,slot]=d.sbmv.split(':'),x=SB.s[+k];if(slot==='f')x.f=t.value;else{const c=[x.c[0]||'',x.c[1]||''];c[+slot]=t.value;x.c=c.filter((m,j,a)=>m&&a.indexOf(m)===j);if(!x.c.length)x.c=defMoves(x.sid).c.slice(0,1);}SB.actions=null;sbChanged(true);return;}
  if(d.sbiv){const [k,i]=d.sbiv.split(':').map(Number),x=SB.s[k];const cur=sbIV(x).slice(1);cur[i]=Math.max(0,Math.min(15,Math.round(+t.value||0)));x.iv=cur;x.lv=null;sbChanged(true);return;}
  if(d.sbst){const [k,i]=d.sbst.split(':').map(Number);SB.s[k].st[i]=+t.value;sbChanged(false);return;}
  if(d.sbbait!=null){SB.s[+d.sbbait].bait=t.checked;sbChanged(false);return;}
  if(t.id==='sbCap'){SB.cap=+t.value;sbChanged(true);return;}});
SBEL.addEventListener('input',e=>{const t=e.target,d=t.dataset;
  if(d.sbhp!=null){const k=+d.sbhp,x=SB.s[k],mx=+t.max;x.hp=+t.value>=mx?null:+t.value;SBEL.querySelector(`[data-sbhpv="${k}"]`).textContent=`${t.value} / ${mx}`;sbChanged(false);return;}
  if(d.sben!=null){const k=+d.sben;SB.s[k].en=+t.value;SBEL.querySelector(`[data-sbenv="${k}"]`).textContent=t.value;sbChanged(false);return;}});
SBEL.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.sbsh){const [k,s]=d.sbsh.split(':').map(Number);SB.s[k].sh=s;b.parentElement.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));sbChanged(false);return;}
  if(d.sbivset){const [k,m]=d.sbivset.split(':');setIV(SB.s[+k],m);if(m==='r1')SB.s[+k].iv=rank1(SB.s[+k].sid,SB.cap).slice();sbChanged(true);return;}
  if(d.sbreset){const x=SB.s[+d.sbreset];Object.assign(x,{hp:null,en:0,st:[0,0],bait:true,sh:1});sbChanged(true);return;}
  if(d.sbmode){SB.mode=d.sbmode;if(SB.mode==='sandbox')SB.actions=null;sbChanged(false);return;}
  if(b.id==='sbReset'){SB.actions=null;sbChanged(false);return;}
  if(b.id==='sbLink'){const url=location.href.split('#')[0]+'#sb='+sbEnc();(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast(T('Link copied')),()=>{prompt(T('Copy this link'),url);});return;}
  if(b.id==='sbSwap'){SB.s=[SB.s[1],SB.s[0]];SB.actions=null;sbChanged(true);return;}
  if(b.id==='sbFromTeam'){const t=team.filter(Boolean);if(t[0])SB.s[0]=Object.assign(sbSide(t[0].sid,{f:t[0].f,c:t[0].c}),{sh:SB.s[0].sh});sbChanged(true);return;}});
// open a matrix cell in the sandbox
function openSandbox(a,b,sa,sb){const cp=(x,sh)=>Object.assign({sid:x.sid,f:x.f,c:x.c.slice(),iv:x.iv?x.iv.slice():null,lv:x.lv!=null?x.lv:null},{sh,hp:null,en:0,st:[0,0],bait:true});
  SB.s=[cp(a,sa),cp(b,sb)];SB.cap=MXRES?MXRES.cap:SB.cap;SB.mode='auto';SB.actions=null;sbSave();go('sandbox');window.scrollTo({top:0});}
document.addEventListener('click',e=>{const b=e.target.closest('#mxToSb');if(b&&MXSEL&&MXRES)openSandbox(MXRES.A[MXSEL.a],MXRES.B[MXSEL.b],MXRES.sa,MXRES.sb);});

// ---------- SANDBOX: which IVs flip this matchup
let SBIV=null,SBIVJOB=null;
const sbSig=()=>JSON.stringify([SB.s,SB.cap]);
function sbCond(){const s=SB.s,A=sbBuild(s[0]),B=sbBuild(s[1]);return {hp:[(s[0].hp!=null?Math.min(s[0].hp,A.hp):A.hp)/A.hp,(s[1].hp!=null?Math.min(s[1].hp,B.hp):B.hp)/B.hp],en:[s[0].en,s[1].en],st:[s[0].st,s[1].st],bait:[s[0].bait,s[1].bait]};}
const swapO=o=>({hp:[o.hp[1],o.hp[0]],en:[o.en[1],o.en[0]],st:[o.st[1],o.st[0]],bait:[o.bait[1],o.bait[0]]});
function sbProg(p,label){const b=document.querySelector('#sbivProg i');if(b)b.style.width=(100*p).toFixed(1)+'%';const l=$('sbivStat');if(l)l.textContent=label+' · '+Math.round(100*p)+'%';}
async function sbAnalyse(){const s=SB.s,x=s[0],y=s[1],cap=SB.cap,shL=[x.sh,y.sh],shR=[y.sh,x.sh],o=sbCond(),oR=swapO(o),sig=sbSig();
  const LT=ivTable(x.sid,cap,1500),RT=ivTable(y.sid,cap,1500);
  const cL=[x.sid,x.f,x.c.filter(Boolean),effIV(x,cap)],cR=[y.sid,y.f,y.c.filter(Boolean),effIV(y,cap)];
  const sL=t=>ivSpec(x.sid,x.f,x.c,t),sR=t=>ivSpec(y.sid,y.f,y.c,t);
  const Lmax=frontier(LT,true),Lmin=frontier(LT,false),Rmax=frontier(RT,true),Rmin=frontier(RT,false);
  const RmT=thin(Rmax,48),LmT=thin(Lmax,48);
  SBIV={busy:true,sig};renderSbIV();
  const step=async(A,B,sh,opt,w0,w1,label)=>{const h=poolRun(A,B,[sh],Object.assign({},opt,{onProg:p=>sbProg(w0+(w1-w0)*p,label)}));SBIVJOB=h;return h.promise;};
  try{
    // 1) PvPoke's engine: every spread of yours vs their current IVs. Fast engine: screen against their 48 strongest spreads.
    const r1=await step(LT.map(sL),[cR],shL,{o},0,.25,T('Your 4,096 IVs'));
    const f1=await step(LT.map(sL),RmT.map(sR),shL,{o,engine:'fast'},.25,.4,T('Screening'));
    const n1=RmT.length,rL=new Int16Array(4096),wL=new Int16Array(4096);
    for(let i=0;i<4096;i++){rL[i]=r1[i];let w=9999;for(let j=0;j<n1;j++)w=Math.min(w,f1[i*n1+j]);wL[i]=w;}
    // 2) the same for their spreads (their side's rating)
    const r2=await step(RT.map(sR),[cL],shR,{o:oR},.4,.65,T('Their 4,096 IVs'));
    const f2=await step(RT.map(sR),LmT.map(sL),shR,{o:oR,engine:'fast'},.65,.8,T('Screening'));
    const n2=LmT.length,rR=new Int16Array(4096),wR=new Int16Array(4096);
    for(let i=0;i<4096;i++){rR[i]=r2[i];let w=9999;for(let j=0;j<n2;j++)w=Math.min(w,f2[i*n2+j]);wR[i]=w;}
    // 3) "whatever the IVs": the weakest spreads on one side against the strongest on the other. Fast engine over the full
    //    frontiers, then PvPoke's engine over 24 spread-out spreads from each frontier; both must agree.
    let always=0;
    const allWinScreen=[...wL].every(v=>v>500)&&[...rL].every(v=>v>500);
    const allLoseScreen=[...wR].every(v=>v>500)&&[...rR].every(v=>v>500);
    if(allWinScreen){const a=await step(Lmin.map(sL),Rmax.map(sR),shL,{o,engine:'fast'},.8,.88,T('Checking every IV pairing'));
      if([...a].every(v=>v>500)){const b=await step(thin(Lmin,24).map(sL),thin(Rmax,24).map(sR),shL,{o},.88,.92,T('Checking every IV pairing'));if([...b].every(v=>v>500))always=1;}}
    else if(allLoseScreen){const a=await step(Rmin.map(sR),Lmax.map(sL),shR,{o:oR,engine:'fast'},.8,.88,T('Checking every IV pairing'));
      if([...a].every(v=>v>500)){const b=await step(thin(Rmin,24).map(sR),thin(Lmax,24).map(sL),shR,{o:oR},.88,.92,T('Checking every IV pairing'));if([...b].every(v=>v>500))always=-1;}}
    // 4) the spreads listed as beating every opponent IV: PvPoke's engine against the opponent's 48 strongest spreads
    const gL=[...LT.keys()].filter(i=>wL[i]>500).sort((a,b)=>LT[b].sp-LT[a].sp).slice(0,20);
    const gR=[...RT.keys()].filter(i=>wR[i]>500).sort((a,b)=>RT[b].sp-RT[a].sp).slice(0,20);
    const bestL=[...LT.keys()].sort((a,b)=>wL[b]-wL[a]||LT[b].sp-LT[a].sp)[0],bestR=[...RT.keys()].sort((a,b)=>wR[b]-wR[a]||RT[b].sp-RT[a].sp)[0];
    const vL=[...new Set([...gL,bestL])],vR=[...new Set([...gR,bestR])];
    const o5=await step(vL.map(i=>sL(LT[i])),RmT.map(sR),shL,{o},.92,.96,T('Verifying'));const exL=new Map();vL.forEach((i,k)=>{let w=9999;for(let j=0;j<RmT.length;j++)w=Math.min(w,o5[k*RmT.length+j]);exL.set(i,w);});
    const o6=await step(vR.map(i=>sR(RT[i])),LmT.map(sL),shR,{o:oR},.96,1,T('Verifying'));const exR=new Map();vR.forEach((i,k)=>{let w=9999;for(let j=0;j<LmT.length;j++)w=Math.min(w,o6[k*LmT.length+j]);exR.set(i,w);});
    // best vs best: each side on its strongest spread for this matchup
    const A=SIM.build(x.sid,x.f,x.c.filter(Boolean),[LT[bestL].lv,LT[bestL].a,LT[bestL].d,LT[bestL].s]),B=SIM.build(y.sid,y.f,y.c.filter(Boolean),[RT[bestR].lv,RT[bestR].a,RT[bestR].d,RT[bestR].s]);
    const bvb=SIM.run(A,B,{sh:shL,hp:[Math.max(1,Math.round(o.hp[0]*A.hp)),Math.max(1,Math.round(o.hp[1]*B.hp))],en:o.en,st:o.st,bait:o.bait}).ratings;
    SBIV={sig,x:JSON.parse(JSON.stringify(x)),y:JSON.parse(JSON.stringify(y)),cap,LT,RT,rL,wL,rR,wR,always,exL,exR,bestL,bestR,bvb,cL:cL[3],cR:cR[3],nRf:Rmax.length,nLf:Lmax.length};
  }catch(e){if(SBIV&&SBIV.busy)SBIV=null;}
  renderSbIV();}
// single-stat rule: winners are exactly the spreads with stat >= threshold
function statRule(T4,win){for(const [k,lab] of [['A',T('Attack')],['D',T('Defense')],['H',T('HP')]]){let lo=Infinity,hiL=-Infinity;for(let i=0;i<T4.length;i++){if(win[i])lo=Math.min(lo,T4[i][k]);else hiL=Math.max(hiL,T4[i][k]);}
    if(lo>hiL&&isFinite(lo)&&isFinite(hiL))return {k,lab,t:lo};}return null;}
function ivRow(t,r,gw,useAttr){return `<tr><td class="num"><b>${t.a}/${t.d}/${t.s}</b></td><td class="num">${t.lv}</td><td class="num">${t.cp}</td><td class="num">${t.A.toFixed(1)}</td><td class="num">${t.D.toFixed(1)}</td><td class="num">${t.H}</td><td class="num">#${t.rank}</td><td class="r"><span class="num">${r}</span> ${chip(tier(r))}</td><td>${gw===true?`<span class="tag ok" title="${esc(T('Wins against every IV spread the opponent could have'))}">✓ ${T('any IVs')}</span>`:''}</td><td><button class="link" ${useAttr}>${T('Use')}</button></td></tr>`;}
function sbSideIV(k){const R=SBIV,me=k?R.y:R.x,op=k?R.x:R.y,TT=k?R.RT:R.LT,r=k?R.rR:R.rL,w=k?R.wR:R.wL,ex=k?R.exR:R.exL,cur=k?R.cR:R.cL,opc=k?R.cL:R.cR;
  const nm=dn(eName(me)),on=dn(eName(op));const cnt={W:0,CW:0,T:0,CL:0,L:0};for(let i=0;i<4096;i++)cnt[tier(r[i])]++;
  const curI=TT.findIndex(t=>t.a===cur[1]&&t.d===cur[2]&&t.s===cur[3]);const curR=curI>=0?r[curI]:null,curWin=curR!=null&&curR>500;
  const win=[...r].map(v=>v>500),nWin=win.filter(Boolean).length,rule=nWin&&nWin<4096?statRule(TT,win):null;
  const flips=[...TT.keys()].filter(i=>(r[i]>500)!==curWin).sort((a,b)=>TT[b].sp-TT[a].sp);
  const guar=[...ex.entries()].filter(([i,v])=>v>500).map(([i])=>i).sort((a,b)=>TT[b].sp-TT[a].sp);
  const bar=['W','CW','T','CL','L'].map(t=>cnt[t]?`<i class="${t}" style="width:${(100*cnt[t]/4096).toFixed(2)}%" title="${t} ${cnt[t]}"></i>`:'').join('');
  const head=`<tr><th>${T('IVs')}</th><th>${T('Lvl')}</th><th>CP</th><th>${T('Attack')}</th><th>${T('Defense')}</th><th>${T('HP')}</th><th>${T('SP rank')}</th><th class="r">${T('Rating')}</th><th></th><th></th></tr>`;
  const rows=list=>list.map(i=>ivRow(TT[i],r[i],ex.has(i)?ex.get(i)>500:null,`data-sbuse="${k}:${TT[i].a},${TT[i].d},${TT[i].s}"`)).join('');
  return `<div class="sbivside"><h4>${T('{me}\'s IVs against {op} at {iv}',{me:esc(nm),op:esc(on),iv:`${opc[1]}/${opc[2]}/${opc[3]}`})}</h4>
   <span class="tbar sbivbar">${bar}</span><p class="sbivcnt">${['W','CW','T','CL','L'].map(t=>`${chip(t)} <span class="num">${cnt[t]}</span>`).join(' ')}</p>
   <p>${T('{n} of 4,096 spreads win.',{n:`<b class="num">${nWin}</b>`})} ${curR!=null?T('Current IVs ({iv}): {r}.',{iv:`${cur[1]}/${cur[2]}/${cur[3]}`,r:`<b class="num">${curR}</b> ${chip(tier(curR))}`}):''}</p>
   ${rule?`<p class="sbrule">${T('Rule: wins whenever {stat} is at least {t}.',{stat:rule.lab,t:`<b class="num">${rule.k==='H'?rule.t:rule.t.toFixed(2)}</b>`})}</p>`:nWin&&nWin<4096?`<p class="sbrule">${T('No single-stat rule: it takes a mix of stats, see the list.')}</p>`:''}
   ${flips.length?`<details class="sbflip"${flips.length<=400?' open':''}><summary>${curWin?T('{n} spreads would lose instead',{n:flips.length}):T('{n} spreads would win instead',{n:flips.length})}</summary><div class="tblwrap"><table class="vt sbivtbl"><thead>${head}</thead><tbody>${rows(flips.slice(0,25))}</tbody></table></div>${flips.length>25?`<p class="lede" style="font-size:12px">${T('Showing the 25 with the highest stat product. The download has all of them.')}</p>`:''}</details>`:`<p class="lede" style="font-size:13px">${T('No IV spread changes this result.')}</p>`}
   ${guar.length?`<details class="sbflip"><summary>${T('Spreads that win against every IV the opponent could have')} (${guar.length}${guar.length>=20?'+':''})</summary><div class="tblwrap"><table class="vt sbivtbl"><thead>${head}</thead><tbody>${rows(guar)}</tbody></table></div></details>`:''}</div>`;}
function renderSbIV(){const el=$('sbIV');if(!el)return;const R=SBIV;const stale=R&&!R.busy&&R.sig!==sbSig();
  let h=`<div class="card sbivc"><h3 style="font-size:18px;margin-bottom:4px">${T('Which IVs flip this matchup?')}</h3><p class="lede" style="font-size:13px">${T('Tests all 4,096 IV spreads for each side with the shields and starting conditions above: which spreads flip the result, whether it is a win or loss whatever the IVs, and the best case for each side.')}</p>
   <div class="mxgo"><button class="btn" id="sbivGo"${R&&R.busy?' disabled':''}>${R&&!R.busy&&!stale?T('Run again'):T('Analyse every IV')}</button>${R&&R.busy?`<div class="mxprog" id="sbivProg"><i style="width:0%"></i></div><span class="num" id="sbivStat" style="color:var(--muted)"></span><button class="link" id="sbivStop">${T('Stop')}</button>`:''}${stale?`<span class="tag">${T('Inputs changed since this analysis')}</span>`:''}</div>`;
  if(R&&!R.busy){const nl=dn(eName(R.x)),nr=dn(eName(R.y)),bl=R.LT[R.bestL],br=R.RT[R.bestR],wl=R.exL.get(R.bestL),wr=R.exR.get(R.bestR);
    const v=R.always===1?['good',T('Always wins: {l} beats {r} at these shields with any IVs on either side.',{l:esc(nl),r:esc(nr)})]:R.always===-1?['bad',T('Always loses: {l} loses to {r} at these shields whatever the IVs on either side.',{l:esc(nl),r:esc(nr)})]:['ok',T('Depends on IVs: the right spreads can change this result.')];
    h+=`<div class="sbivv ${v[0]}${stale?' stale':''}"><b>${v[1]}</b></div><div class="${stale?'stale':''}">
     <ul class="sbbest"><li>${T('Best case for {me}: {iv} (level {lv}, CP {cp}) gets at least {r} against any {op} IVs.',{me:`<b>${esc(nl)}</b>`,iv:`<b class="num">${bl.a}/${bl.d}/${bl.s}</b>`,lv:bl.lv,cp:bl.cp,r:`<b class="num">${wl}</b> ${chip(tier(wl))}`,op:esc(nr)})}</li>
     <li>${T('Best case for {me}: {iv} (level {lv}, CP {cp}) gets at least {r} against any {op} IVs.',{me:`<b>${esc(nr)}</b>`,iv:`<b class="num">${br.a}/${br.d}/${br.s}</b>`,lv:br.lv,cp:br.cp,r:`<b class="num">${wr}</b> ${chip(tier(wr))}`,op:esc(nl)})}</li>
     <li>${T('Best vs best ({a} against {b}): {l} {r1} · {r} {r2}.',{a:`${bl.a}/${bl.d}/${bl.s}`,b:`${br.a}/${br.d}/${br.s}`,l:esc(nl),r:esc(nr),r1:`<b class="num">${R.bvb[0]}</b> ${chip(tier(R.bvb[0]))}`,r2:`<b class="num">${R.bvb[1]}</b>`})}</li></ul>
     <div class="cols">${sbSideIV(0)}${sbSideIV(1)}</div>
     <div class="controls"><button class="btn ghost" id="sbivDl">${T('Download all IV results for Excel')}</button></div>
     <p class="lede" style="font-size:12px">${T('Results use PvPoke\'s battle engine. "Any IVs" looks at the opponent\'s stat frontier: the {n} spreads no other spread beats in Attack, Defense and HP together (a spread with better or equal stats never did worse in testing). The fast engine screens the whole frontier; PvPoke\'s engine then checks each spread shown against 48 spread-out frontier spreads, and "always" claims against 24 from each side.',{n:R.nRf})}</p></div>`;}
  el.innerHTML=h+'</div>';}
function sbivCSV(){const R=SBIV,out=[['Side','Pokemon','Attack IV','Defense IV','HP IV','Level','CP','Attack','Defense','HP','Stat product','SP rank','Rating vs opponent current IVs','Result','Worst vs opponent strongest spreads (screen)']];
  for(const k of [0,1]){const me=k?R.y:R.x,TT=k?R.RT:R.LT,r=k?R.rR:R.rL,w=k?R.wR:R.wL;TT.forEach((t,i)=>out.push([k?'B':'A',eName(me),t.a,t.d,t.s,t.lv,t.cp,t.A.toFixed(2),t.D.toFixed(2),t.H,Math.round(t.sp),t.rank,r[i],tier(r[i]),w[i]]));}
  return out.map(r=>r.map(csvCell).join(',')).join('\r\n');}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='sbivGo'){sbAnalyse();return;}
  if(b.id==='sbivStop'){if(SBIVJOB)SBIVJOB.cancel();SBIV=null;renderSbIV();return;}
  if(b.id==='sbivDl'&&SBIV){download(`iv-analysis-${SBIV.x.sid}-vs-${SBIV.y.sid}.csv`,sbivCSV());return;}
  if(b.dataset.sbuse){const [k,iv]=b.dataset.sbuse.split(':');const x=SB.s[+k];x.iv=iv.split(',').map(Number);x.lv=null;sbSave();renderSandbox();toast(T('IVs set to {iv}',{iv:iv.replace(/,/g,'/')}));return;}});

// ---------- BEST IVs: top 200 IV spreads for a Pokémon, ranked by results against the regional meta
const IVFLOORS=[[0,'0: Wild caught'],[1,'1: Trade, good friend'],[2,'2: Trade, great friend / purified'],[3,'3: Trade, ultra friend'],[4,'4: Weather boost'],[5,'5: Trade, best friend'],[6,'6: Shadow legendary'],[10,'10: Raid / hatch'],[12,'12: Lucky trade']];
let IVP={sid:null,f:null,c:null,lg:'gl',cap:50,fl:0,sh:'avg',opp:'reg3',sort:'wins',open:-1};
try{const o=JSON.parse(localStorage.getItem('gl_ivp')||'null');if(o&&o.sid&&SP[o.sid])IVP=Object.assign(IVP,o,{open:-1,sort:o.sort||'wins'});}catch(e){}
if(!IVP.sid){const t=team.find(Boolean);const e=mkEntry(t?t.sid:Mx[0].sid,t?{f:t.f,c:t.c}:{pref:'reg'});IVP.sid=e.sid;IVP.f=e.f;IVP.c=e.c;}
let IVRES=null,IVJOB=null;
function ivpSave(){try{localStorage.setItem('gl_ivp',JSON.stringify(Object.assign({},IVP,{open:-1})));}catch(e){}}
const ivpSig=()=>JSON.stringify([IVP.sid,IVP.f,IVP.c,IVP.lg,IVP.cap,IVP.fl,IVP.sh,IVP.opp]);
function ivpOpponents(){if(IVP.opp==='pv100'){const src=typeof GBL!=='undefined'?GBL.rank.slice(0,100):[];return src.map(c=>({n:Cx[c].n,sid:Cx[c].sid,f:Cx[c].f,c:Cx[c].c,w:1}));}
  if(IVP.opp!=='reg3'&&IVP.opp!=='regall')return presetData(IVP.opp).map(x=>({n:SP[x.sid].n,sid:x.sid,f:x.f,c:x.c,w:Math.max(1,x.w)}));
  return Mx.map((m,i)=>i).filter(i=>IVP.opp==='regall'||Mx[i].u>=3).sort((a,b)=>Mx[b].u-Mx[a].u).map(i=>({n:Mx[i].n,sid:Mx[i].sid,f:Mx[i].f,c:Mx[i].c,w:Mx[i].u}));}
function renderIVs(){const el=$('ivIn');if(!el)return;const sid=IVP.sid,gl=IVP.lg==='gl';
  const seg=(k,v,opts)=>`<div class="seg" role="group">${opts.map(([x,l])=>`<button data-ivp="${k}:${x}" aria-pressed="${String(v)===String(x)}">${l}</button>`).join('')}</div>`;
  el.innerHTML=`<div class="card ivin"><div class="sbh">${badge(eName({sid}),sid,true)}<div class="sbt"><input type="text" list="allNames" value="${esc(dn(SP[sid].n))}" id="ivName" aria-label="${esc(T('Pokémon'))}" autocomplete="off">${typeBars(sid)}</div></div>
   <div class="mvs sbmv"><label>${T('Fast')}${moveSel(sid,'f',IVP.f,'data-ivmv="f"')}</label><label>${T('Charged')}${moveSel(sid,'c',IVP.c[0]||'','data-ivmv="0"')}</label><label>${T('Charged')}${moveSel(sid,'c',IVP.c[1]||'','data-ivmv="1"')}</label></div>
   <div class="mxctl"><label class="fld">${T('League')} ${seg('lg',IVP.lg,[['gl',T('Great League')],['ul',T('Ultra League')]])}</label>
    <label class="fld">${T('Level cap')} <select id="ivCap">${[40,41,50,51].map(c=>`<option value="${c}"${c===IVP.cap?' selected':''}>${c}${c===51?' ('+T('best buddy')+')':''}</option>`).join('')}</select></label>
    <label class="fld">${T('IV floor')} <select id="ivFl">${IVFLOORS.map(([v,l])=>`<option value="${v}"${v===IVP.fl?' selected':''}>${esc(T(l))}</option>`).join('')}</select></label></div>
   ${gl?`<div class="mxctl"><label class="fld">${T('Shields')} ${seg('sh',IVP.sh,[['avg',T('Average')],[0,'0v0'],[1,'1v1'],[2,'2v2']])}</label>
    <label class="fld">${T('Against')} <select id="ivOpp"><option value="reg3"${IVP.opp==='reg3'?' selected':''}>${T('Regional meta: on 3+ teams')} (${Mx.filter(m=>m.u>=3).length})</option>${presetOptions(IVP.opp,['team','reg25','reg50','reg100','pv50','pv200','pv300'])}</select></label></div>`:''}
   <div class="mxgo"><button class="btn" id="ivGo">${gl?T('Find the best IVs'):T('Show stat product ranks')}</button>${IVJOB?`<div class="mxprog" id="ivProg"><i style="width:0%"></i></div><span class="num" id="ivStat" style="color:var(--muted)"></span>`:''}</div></div>`;
  if(IVRES&&IVRES.sig===ivpSig())renderIVRes();else{$('ivOut').innerHTML=IVRES?`<p class="empty">${T('Settings changed: press the button to update.')}</p>`:'';}}
async function ivpRun(){const sid=IVP.sid,gl=IVP.lg==='gl',cpcap=gl?1500:2500,sig=ivpSig();
  const ALL=ivTable(sid,IVP.cap,cpcap),TT=ALL.filter(t=>t.a>=IVP.fl&&t.d>=IVP.fl&&t.s>=IVP.fl);
  const bySp=TT.slice().sort((a,b)=>b.sp-a.sp||b.A-a.A),maxAll=ALL.reduce((m,t)=>Math.max(m,t.sp),0);
  if(!gl){IVRES={sig,ul:true,sid,list:bySp.slice(0,200),max:maxAll};renderIVRes();return;}
  const O=ivpOpponents(),shs=IVP.sh==='avg'?[[0,0],[1,1],[2,2]]:[[+IVP.sh,+IVP.sh]];
  // candidates: the stat frontiers (strongest and weakest spreads) plus the 600 highest stat products, plus PvPoke's default spread
  const d=SP[sid].iv,defT=TT.find(t=>t.a===d[1]&&t.d===d[2]&&t.s===d[3]);
  const set=new Map();for(const t of [...frontier(TT,true),...frontier(TT,false),...bySp.slice(0,600),...(defT?[defT]:[])])set.set(ivKey(t),t);
  const C=[...set.values()];
  IVJOB=true;renderIVs();
  const Ospec=O.map(o=>[o.sid,o.f,o.c,SP[o.sid].iv]),nO=O.length,ns=shs.length,wsum=O.reduce((s,o)=>s+o.w,0);
  const prog=(p,lab)=>{const b=document.querySelector('#ivProg i');if(b)b.style.width=(100*p).toFixed(1)+'%';const st=$('ivStat');if(st)st.textContent=lab+' · '+Math.round(100*p)+'%';};
  const rowsOf=(list,out)=>list.map((t,ci)=>{const r=new Int16Array(nO);let av=0;const cnt={W:0,CW:0,T:0,CL:0,L:0};
    for(let j=0;j<nO;j++){let s=0;for(let q=0;q<ns;q++)s+=out[(ci*nO+j)*ns+q];const v=Math.round(s/ns);r[j]=v;av+=v*O[j].w;cnt[tier(v)]++;}return {t,r,avg:av/wsum,cnt,wins:cnt.W+cnt.CW};});
  // 1) screen every candidate with the fast engine
  const h=poolRun(C.map(t=>ivSpec(sid,IVP.f,IVP.c,t)),Ospec,shs,{engine:'fast',onProg:p=>prog(p*(HAS_PVE?0.35:1),T('Screening {n} spreads',{n:C.length}))});IVJOB=h;
  let out;try{out=await h.promise;}catch(e){IVJOB=null;return;}
  const RF=rowsOf(C,out);
  const minF=frontier(TT,false),maxF=frontier(TT,true),minK=new Set(minF.map(ivKey)),maxK=new Set(maxF.map(ivKey));
  // fast check over the full frontiers: which matchups could not depend on IVs
  const fastAll=O.map((o,j)=>{let allW=true,allL=true;for(const x of RF){const k=ivKey(x.t),v=x.r[j];if(minK.has(k)&&!(v>500))allW=false;if(maxK.has(k)&&!(v<500))allL=false;}return {allW,allL};});
  let R=RF,thinMin=minF,thinMax=maxF;
  if(HAS_PVE){// 2) confirm with PvPoke's engine: the leading screened spreads, PvPoke's default, the top stat products and 24 spreads from each frontier
    thinMin=thin(minF,16);thinMax=thin(maxF,16);
    const byW=RF.slice().sort((a,b)=>b.wins-a.wins||b.avg-a.avg).slice(0,200),byA=RF.slice().sort((a,b)=>b.avg-a.avg).slice(0,60);
    const E=new Map();for(const t of [...byW.map(x=>x.t),...byA.map(x=>x.t),...bySp.slice(0,20),...thinMin,...thinMax,...(defT?[defT]:[])])E.set(ivKey(t),t);const EL=[...E.values()];
    const h2=poolRun(EL.map(t=>ivSpec(sid,IVP.f,IVP.c,t)),Ospec,shs,{onProg:p=>prog(0.35+0.65*p,T('Confirming {n} spreads with PvPoke\'s engine',{n:EL.length}))});IVJOB=h2;
    let out2;try{out2=await h2.promise;}catch(e){IVJOB=null;return;}R=rowsOf(EL,out2);}
  IVJOB=null;
  const def=defT?R.find(x=>x.t===defT):null;
  if(def)R.forEach(x=>{let g=0,l=0;for(let j=0;j<nO;j++){const a=x.r[j]>500,b=def.r[j]>500;if(a&&!b)g++;if(!a&&b)l++;}x.gain=g;x.lost=l;});
  // matchups that do not depend on your IVs (against their usual IVs): weakest spreads all win, or strongest all lose (fast over the full frontiers, PvPoke's engine over 24 of each)
  const tMin=new Set(thinMin.map(ivKey)),tMax=new Set(thinMax.map(ivKey));
  const opp=O.map((o,j)=>{let allW=fastAll[j].allW,allL=fastAll[j].allL,best=null;for(const x of R){const k=ivKey(x.t),v=x.r[j];if(tMin.has(k)&&!(v>500))allW=false;if(tMax.has(k)&&!(v<500))allL=false;if(!best||v>best.v||(v===best.v&&x.t.sp>best.t.sp))best={v,t:x.t};}
    return {o,j,allW,allL,best,def:def?def.r[j]:null};});
  IVRES={sig,sid,f:IVP.f,c:IVP.c.slice(),cap:IVP.cap,fl:IVP.fl,sh:IVP.sh,O,R,def,opp,max:maxAll,n:TT.length,screened:C.length};renderIVs();}
function ivSorted(){const R=IVRES.R.slice();const k=IVP.sort;R.sort((a,b)=>k==='sp'?b.t.sp-a.t.sp:k==='wins'?b.wins-a.wins||b.avg-a.avg:b.avg-a.avg||b.wins-a.wins||b.t.sp-a.t.sp);return R.slice(0,200);}
function renderIVRes(){const out=$('ivOut'),Rz=IVRES,sid=Rz.sid,nm=esc(dn(SP[sid].n));
  if(Rz.ul){out.innerHTML=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Top 200 Ultra League IVs for {name}',{name:nm})}</h3><p class="lede" style="font-size:13px">${T('Ranked by stat product (Attack × Defense × HP at the highest level under 2,500 CP), as on pvpivs.com. Battle results need a meta to battle, and the regional meta is Great League, so they are shown for Great League only.')}</p>
    <div class="controls"><button class="btn ghost" id="ivDl">${T('Download for Excel')}</button></div>
    <div class="tblwrap"><table class="vt ivt"><thead><tr><th>#</th><th>${T('IVs')}</th><th>${T('Lvl')}</th><th>CP</th><th>${T('Attack')}</th><th>${T('Defense')}</th><th>${T('HP')}</th><th class="r">${T('Stat product')}</th><th class="r" title="${esc(T('Stat product as a share of the best spread with no IV floor'))}">${T('% of #1')}</th><th class="r">${T('Bulk product')}</th></tr></thead><tbody>${Rz.list.map((t,i)=>`<tr><td class="num">${i+1}</td><td class="num"><b>${t.a}/${t.d}/${t.s}</b></td><td class="num">${t.lv}</td><td class="num">${t.cp}</td><td class="num">${t.A.toFixed(2)}</td><td class="num">${t.D.toFixed(2)}</td><td class="num">${t.H}</td><td class="r num">${Math.round(t.sp).toLocaleString()}</td><td class="r num">${(100*t.sp/Rz.max).toFixed(2)}%</td><td class="r num">${Math.round(t.bp).toLocaleString()}</td></tr>`).join('')}</tbody></table></div></div>`;return;}
  const L=ivSorted(),shl=Rz.sh==='avg'?T('average of 0, 1 and 2 shields'):T('{s}–{s} shields',{s:Rz.sh});
  const top=L[0],def=Rz.def;
  const th=(k,l)=>`<th class="r"><button class="link" data-ivsort="${k}" aria-pressed="${IVP.sort===k}">${l}</button></th>`;
  let h=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Top 200 Great League IVs for {name}',{name:nm})}</h3>
   <p class="lede" style="font-size:13px">${T('Every spread battled against {n} meta Pokémon on their usual moves and IVs at {sc}. Average rating is weighted by how many regional teams used each opponent. Flips compare each spread with PvPoke\'s default IVs: matchups it turns into wins, and wins it gives up.',{n:Rz.O.length,sc:shl})}</p>
   <ul class="sbbest"><li>${T('Top spread: {iv} (level {lv}, CP {cp}) averages {avg} with {w} wins out of {n}.',{iv:`<b class="num">${top.t.a}/${top.t.d}/${top.t.s}</b>`,lv:top.t.lv,cp:top.t.cp,avg:`<b class="num">${Math.round(top.avg)}</b>`,w:`<b class="num">${top.wins}</b>`,n:Rz.O.length})}</li>
   ${def?`<li>${T('PvPoke default IVs {iv}: average {avg}, {w} wins.',{iv:`${def.t.a}/${def.t.d}/${def.t.s}`,avg:Math.round(def.avg),w:def.wins})}</li>`:''}
   <li>${T('Stat product #1: {iv}.',{iv:(()=>{const r1=Rz.R.slice().sort((a,b)=>b.t.sp-a.t.sp)[0];return `${r1.t.a}/${r1.t.d}/${r1.t.s} (${T('average')} ${Math.round(r1.avg)}, ${r1.wins} ${T('wins')})`;})()})}</li></ul>
   <div class="controls"><button class="btn ghost" id="ivDl">${T('Download for Excel')}</button><button class="btn ghost" data-ivmx="${ivKey(top.t)}">${T('Open the best spread in the battle matrix')}</button></div>
   <div class="tblwrap"><table class="vt ivt"><thead><tr><th>#</th><th>${T('IVs')}</th><th>${T('Lvl')}</th><th>CP</th><th>${T('Attack')}</th><th>${T('Defense')}</th><th>${T('HP')}</th>${th('sp',T('Stat product'))}<th class="r">${T('SP rank')}</th>${th('avg',T('Avg rating'))}${th('wins',T('Wins'))}<th class="r">${chip('W')}</th><th class="r">${chip('CW')}</th><th class="r">${chip('T')}</th><th class="r">${chip('CL')}</th><th class="r">${chip('L')}</th><th class="r" title="${esc(T('Matchups won that PvPoke default IVs lose / lost that they win'))}">${T('Flips vs default')}</th></tr></thead><tbody>`;
  L.forEach((x,i)=>{const t=x.t,k=ivKey(t),open=IVP.open===k;
    h+=`<tr class="ivr${open?' open':''}" data-ivrow="${k}"><td class="num">${i+1}</td><td class="num"><b>${t.a}/${t.d}/${t.s}</b>${def&&t===def.t?' <span class="tag">'+T('default')+'</span>':''}</td><td class="num">${t.lv}</td><td class="num">${t.cp}</td><td class="num">${t.A.toFixed(1)}</td><td class="num">${t.D.toFixed(1)}</td><td class="num">${t.H}</td><td class="r num">${Math.round(t.sp).toLocaleString()}</td><td class="r num">#${t.rank}</td><td class="r num"><b>${Math.round(x.avg)}</b></td><td class="r num"><b>${x.wins}</b></td><td class="r num">${x.cnt.W}</td><td class="r num">${x.cnt.CW}</td><td class="r num">${x.cnt.T}</td><td class="r num">${x.cnt.CL}</td><td class="r num">${x.cnt.L}</td><td class="r num">${x.gain!=null?`${x.gain?`<b class="bv good">+${x.gain}</b>`:''}${x.lost?` <b class="bv bad">−${x.lost}</b>`:''}${!x.gain&&!x.lost?'<span class="mxsub2">0</span>':''}`:''}</td></tr>`;
    if(open)h+=`<tr class="ivdet"><td colspan="17">${ivDetail(x)}</td></tr>`;});
  h+=`</tbody></table></div><p class="lede" style="font-size:12px">${T('Tap a row for the matchups it flips and links to the sandbox and matrix. Spreads that are worse in Attack, Defense and HP together than another spread are skipped (they can only do worse). {s} spreads were screened with the fast engine and the {n} best confirmed with PvPoke\'s engine, which gives every number shown.',{s:Rz.screened||Rz.R.length,n:Rz.R.length})}</p></div>`;
  // matchups that don't depend on IVs
  const aw=Rz.opp.filter(o=>o.allW),al=Rz.opp.filter(o=>o.allL),dp=Rz.opp.filter(o=>!o.allW&&!o.allL);
  const chipO=o=>`<button class="ivo" data-ivsb="${o.j}" title="${esc(T('Open in the sandbox'))}">${badge(o.o.n,o.o.sid)}${esc(dn(o.o.n))}</button>`;
  h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Matchups that do not depend on your IVs')}</h3><p class="lede" style="font-size:13px">${T('Against each opponent on its usual IVs: wins whatever IVs {name} has, losses whatever IVs it has, and the ones your IVs decide (with the spread that does best). Tap one to open it in the sandbox, where "Analyse every IV" also varies the opponent\'s IVs.',{name:nm})}</p>
   <h4 class="ivh good">${T('Always wins ({n})',{n:aw.length})}</h4><div class="ivos">${aw.map(chipO).join('')||'<span class="mxsub2">–</span>'}</div>
   <h4 class="ivh bad">${T('Always loses ({n})',{n:al.length})}</h4><div class="ivos">${al.map(chipO).join('')||'<span class="mxsub2">–</span>'}</div>
   <h4 class="ivh ok">${T('Depends on IVs ({n})',{n:dp.length})}</h4><div class="tblwrap"><table class="vt ivdp"><thead><tr><th>${T('Opponent')}</th><th class="r">${T('Default IVs')}</th><th>${T('Best spread for it')}</th><th></th></tr></thead><tbody>${dp.map(o=>`<tr><td>${monTag(o.o.n,o.o.sid)}</td><td class="r">${o.def!=null?`<span class="num">${o.def}</span> ${chip(tier(o.def))}`:''}</td><td><b class="num">${o.best.t.a}/${o.best.t.d}/${o.best.t.s}</b> <span class="num">${o.best.v}</span> ${chip(tier(o.best.v))}</td><td><button class="link" data-ivsb="${o.j}">${T('Sandbox')}</button></td></tr>`).join('')}</tbody></table></div></div>`;
  h+=`<div id="ivCmp"></div><div id="ivBp"></div>`;
  out.innerHTML=h;renderIVCmp();renderIVBp();}
function ivDetail(x){const Rz=IVRES,O=Rz.O,def=Rz.def;const g=[],l=[];if(def)for(let j=0;j<O.length;j++){const a=x.r[j]>500,b=def.r[j]>500;if(a&&!b)g.push(j);if(!a&&b)l.push(j);}
  const nm=j=>`${esc(dn(O[j].n))} <span class="num">${def.r[j]}→${x.r[j]}</span>`;
  return `<div class="ivdx">${def?`<p><b class="bv good">${T('Wins that default IVs lose:')}</b> ${g.map(nm).join(', ')||'–'}</p><p><b class="bv bad">${T('Losses that default IVs win:')}</b> ${l.map(nm).join(', ')||'–'}</p>`:''}
   <div class="controls"><label class="fld">${T('Sandbox against')} <select data-ivsbsel="${ivKey(x.t)}">${O.map((o,j)=>`<option value="${j}">${esc(dn(o.n))} (${x.r[j]})</option>`).join('')}</select></label><button class="btn ghost" data-ivsbgo="${ivKey(x.t)}">${T('Open in sandbox')}</button><button class="btn ghost" data-ivmx="${ivKey(x.t)}">${T('Open in battle matrix vs these opponents')}</button></div></div>`;}
function ivCSV(){const Rz=IVRES;if(Rz.ul){return [['Rank','Attack IV','Defense IV','HP IV','Level','CP','Attack','Defense','HP','Stat product','% of #1','Bulk product'],...Rz.list.map((t,i)=>[i+1,t.a,t.d,t.s,t.lv,t.cp,t.A.toFixed(2),t.D.toFixed(2),t.H,Math.round(t.sp),(100*t.sp/Rz.max).toFixed(2),Math.round(t.bp)])].map(r=>r.map(csvCell).join(',')).join('\r\n');}
  const head=['Rank','Attack IV','Defense IV','HP IV','Level','CP','Attack','Defense','HP','Stat product','SP rank','Avg rating','Wins','W','CW','T','CL','L','Wins gained vs default','Wins lost vs default',...Rz.O.map(o=>o.n)];
  return [head,...ivSorted().map((x,i)=>[i+1,x.t.a,x.t.d,x.t.s,x.t.lv,x.t.cp,x.t.A.toFixed(2),x.t.D.toFixed(2),x.t.H,Math.round(x.t.sp),x.t.rank,Math.round(x.avg),x.wins,x.cnt.W,x.cnt.CW,x.cnt.T,x.cnt.CL,x.cnt.L,x.gain??'',x.lost??'',...x.r])].map(r=>r.map(csvCell).join(',')).join('\r\n');}
const IVEL=$('v-ivs');
let SB_AUTO=false;
function ivToSandbox(t,j){const Rz=IVRES,o=Rz.O[j],sh=Rz.sh==='avg'?1:+Rz.sh;const me={sid:Rz.sid,f:Rz.f,c:Rz.c.slice(),iv:[t.a,t.d,t.s],lv:null},op={sid:o.sid,f:o.f,c:o.c.slice(),iv:null,lv:null};
  SB.s=[Object.assign(me,{sh,hp:null,en:0,st:[0,0],bait:true}),Object.assign(op,{sh,hp:null,en:0,st:[0,0],bait:true})];SB.cap=Rz.cap;sbSave();SB_AUTO=true;go('sandbox');window.scrollTo({top:0});}
IVEL.addEventListener('change',e=>{const t=e.target,d=t.dataset;
  if(t.id==='ivName'){const sid=resolveSid(t.value);if(!sid){toast(T('Pokémon not found: {n}',{n:t.value}));t.value=dn(SP[IVP.sid].n);return;}const m=mkEntry(sid);IVP.sid=sid;IVP.f=m.f;IVP.c=m.c;IVP.open=-1;ivpSave();renderIVs();return;}
  if(d.ivmv){if(d.ivmv==='f')IVP.f=t.value;else{const c=[IVP.c[0]||'',IVP.c[1]||''];c[+d.ivmv]=t.value;IVP.c=c.filter((m,j,a)=>m&&a.indexOf(m)===j);if(!IVP.c.length)IVP.c=defMoves(IVP.sid).c.slice(0,1);}ivpSave();renderIVs();return;}
  if(t.id==='ivCap'){IVP.cap=+t.value;ivpSave();renderIVs();return;}
  if(t.id==='ivFl'){IVP.fl=+t.value;ivpSave();renderIVs();return;}
  if(t.id==='ivOpp'){IVP.opp=t.value;ivpSave();renderIVs();return;}});
IVEL.addEventListener('click',e=>{const b=e.target.closest('button,tr[data-ivrow]');if(!b)return;const d=b.dataset;
  if(d.ivp){const [k,v]=d.ivp.split(':');IVP[k]=k==='sh'&&v!=='avg'?+v:v;ivpSave();renderIVs();return;}
  if(b.id==='ivGo'){ivpRun();return;}
  if(b.id==='ivDl'&&IVRES){download(`best-ivs-${IVRES.sid}-${IVRES.ul?'ultra':'great'}.csv`,ivCSV());return;}
  if(d.ivsort){IVP.sort=d.ivsort;renderIVRes();return;}
  if(d.ivrow!=null&&!e.target.closest('button,select')){const k=+d.ivrow;IVP.open=IVP.open===k?-1:k;renderIVRes();return;}
  if(d.ivsbgo){const k=+d.ivsbgo,x=IVRES.R.find(r=>ivKey(r.t)===k),j=+IVEL.querySelector(`[data-ivsbsel="${k}"]`).value;ivToSandbox(x.t,j);return;}
  if(d.ivsb!=null){const best=ivSorted()[0];ivToSandbox(best.t,+d.ivsb);return;}
  if(d.ivmx){const k=+d.ivmx,x=IVRES.R.find(r=>ivKey(r.t)===k),Rz=IVRES,sh=Rz.sh==='avg'?1:+Rz.sh;
    MX.A=[{sid:Rz.sid,f:Rz.f,c:Rz.c.slice(),iv:[x.t.a,x.t.d,x.t.s],lv:null}];MX.B=Rz.O.slice(0,MXMAX).map(o=>({sid:o.sid,f:o.f,c:o.c.slice(),iv:null,lv:null}));MX.sa=sh;MX.sb=sh;MX.cap=Rz.cap;MX.opt=null;mxSave();go('matrix');window.scrollTo({top:0});startRun();return;}});

// ---------- POKÉMON LIST: every Pokémon with PvPoke ids, typing and movesets, for Excel, PvPoke and the matrix
const PVDEX={};if(typeof PVGM!=='undefined')PVGM.pokemon.forEach(p=>{PVDEX[p.speciesId]=p.dex;});
const PVRANK={};if(typeof GBL!=='undefined')GBL.rank.forEach((c,i)=>{const sid=Cx[c].sid;if(!(sid in PVRANK))PVRANK[sid]=i+1;});
const USAGE={};Mx.forEach(m=>{USAGE[m.sid]=(USAGE[m.sid]||0)+m.u;});
let PL={q:'',type:'',form:'all',src:'all',mv:'pv',sort:'rank',show:200,sel:new Set()};
function plRows(){const seen=new Set(),rows=[];for(const n of Object.keys(DATA.names)){const sid=DATA.names[n];if(!SP[sid]||seen.has(sid))continue;seen.add(sid);
    const m=defMoves(sid,PL.mv==='reg'?'reg':'pv');rows.push({sid,n:SP[sid].n,dex:PVDEX[sid]||'',types:typesOf(sid),f:m.f,c:m.c.slice(0,2),u:USAGE[sid]||0,rank:PVRANK[sid]||null,iv:SP[sid].iv});}
  return rows;}
function plFiltered(){const q=PL.q.trim().toLowerCase();let R=plRows().filter(r=>{if(q&&!r.n.toLowerCase().includes(q)&&!dn(r.n).toLowerCase().includes(q)&&!r.sid.includes(q))return false;
    if(PL.type&&!r.types.includes(PL.type))return false;const sh=/\(Shadow\)/.test(r.n);if(PL.form==='shadow'&&!sh)return false;if(PL.form==='regular'&&sh)return false;
    if(PL.src==='reg'&&!r.u)return false;if(PL.src==='pv100'&&!(r.rank&&r.rank<=100))return false;if(PL.src==='pv300'&&!(r.rank&&r.rank<=300))return false;if(PL.src==='sel'&&!PL.sel.has(r.sid))return false;return true;});
  const k=PL.sort;R.sort((a,b)=>k==='name'?dn(a.n).localeCompare(dn(b.n)):k==='dex'?(a.dex||9999)-(b.dex||9999)||a.n.localeCompare(b.n):k==='use'?b.u-a.u||(a.rank||9999)-(b.rank||9999):(a.rank||9999)-(b.rank||9999)||b.u-a.u);
  return R;}
const plLine=r=>`${r.sid},${r.f},${r.c[0]||'none'},${r.c[1]||'none'}`;
function plCSV(R){const out=[['Pokemon','PvPoke id','Dex','Type 1','Type 2','Fast move','Charged move 1','Charged move 2','Regional teams','PvPoke GL rank','Default IVs','Level','CP','PvPoke import line']];
  R.forEach(r=>{const v=r.iv;out.push([r.n,r.sid,r.dex,r.types[0],r.types[1]||'',MV[r.f]?MV[r.f].name:r.f,r.c[0]&&MV[r.c[0]]?MV[r.c[0]].name:'',r.c[1]&&MV[r.c[1]]?MV[r.c[1]].name:'',r.u,r.rank||'',`${v[1]}/${v[2]}/${v[3]}`,v[0],cpOf(r.sid,v[0],v[1],v[2],v[3]),plLine(r)]);});
  return out.map(r=>r.map(csvCell).join(',')).join('\r\n');}
function renderPL(){const el=$('plIn');if(!el)return;const R=plFiltered(),shown=R.slice(0,PL.show),nsel=PL.sel.size;
  const types=TYPES.slice().sort((a,b)=>tn(a).localeCompare(tn(b)));
  el.innerHTML=`<div class="controls mxfl"><label class="fld">${T('Find')} <input type="search" id="plQ" value="${esc(PL.q)}" placeholder="${esc(T('Name or PvPoke id'))}"></label>
    <label class="fld">${T('Type')} <select id="plType"><option value="">${T('All types')}</option>${types.map(t=>`<option value="${t}"${PL.type===t?' selected':''}>${esc(tn(t))}</option>`).join('')}</select></label>
    <label class="fld">${T('Form')} <select id="plForm"><option value="all"${PL.form==='all'?' selected':''}>${T('All')}</option><option value="shadow"${PL.form==='shadow'?' selected':''}>${T('Shadow only')}</option><option value="regular"${PL.form==='regular'?' selected':''}>${T('Not Shadow')}</option></select></label>
    <label class="fld">${T('Show')} <select id="plSrc"><option value="all"${PL.src==='all'?' selected':''}>${T('Every Pokémon')}</option><option value="reg"${PL.src==='reg'?' selected':''}>${T('Used at the regionals')}</option><option value="pv100"${PL.src==='pv100'?' selected':''}>${T('PvPoke top 100')}</option><option value="pv300"${PL.src==='pv300'?' selected':''}>${T('PvPoke top 300')}</option><option value="sel"${PL.src==='sel'?' selected':''}>${T('Ticked only ({n})',{n:nsel})}</option></select></label>
    <label class="fld">${T('Moveset')} <select id="plMv"><option value="pv"${PL.mv==='pv'?' selected':''}>${T('PvPoke recommended')}</option><option value="reg"${PL.mv==='reg'?' selected':''}>${T('Most used at the regionals')}</option></select></label>
    <label class="fld">${T('Sort')} <select id="plSort"><option value="rank"${PL.sort==='rank'?' selected':''}>${T('PvPoke rank')}</option><option value="use"${PL.sort==='use'?' selected':''}>${T('Regional teams')}</option><option value="name"${PL.sort==='name'?' selected':''}>${T('Name')}</option><option value="dex"${PL.sort==='dex'?' selected':''}>${T('Pokédex number')}</option></select></label></div>
   <div class="controls"><span class="num mxshown">${T('{a} Pokémon · {b} ticked',{a:R.length,b:nsel})}</span>
    <button class="btn" id="plDl">${T('Download for Excel')}</button><button class="btn ghost" id="plCopy">${T('Copy PvPoke import list')}</button><button class="btn ghost" id="plNames">${T('Copy names')}</button>
    <button class="btn ghost" data-plto="A">${T('Send to matrix Group A')}</button><button class="btn ghost" data-plto="B">${T('Send to matrix Group B')}</button>
    <button class="link" id="plTickAll">${T('Tick all shown')}</button>${nsel?`<button class="link" id="plUntick">${T('Untick all')}</button>`:''}</div>
   <p class="lede" style="font-size:12px">${T('Buttons use the ticked Pokémon if any are ticked, otherwise everything in the list. The PvPoke import list pastes into PvPoke\'s custom group Import, or into this site\'s matrix groups.')}</p>
   <div class="tblwrap"><table class="vt pltbl"><thead><tr><th></th><th>${T('Pokémon')}</th><th>${T('PvPoke id')}</th><th class="r">${T('Dex')}</th><th>${T('Moveset')}</th><th class="r">${T('Regional teams')}</th><th class="r">${T('PvPoke rank')}</th><th>${T('Default IVs')}</th></tr></thead><tbody>
   ${shown.map(r=>`<tr><td><input type="checkbox" data-pltick="${r.sid}"${PL.sel.has(r.sid)?' checked':''} aria-label="${esc(dn(r.n))}"></td><td>${monTag(r.n,r.sid)} ${typeBars(r.sid)}</td><td class="num"><code>${esc(r.sid)}</code></td><td class="r num">${r.dex}</td><td><small>${[r.f,...r.c].map(mvTag).join(' · ')}</small></td><td class="r num">${r.u||''}</td><td class="r num">${r.rank?'#'+r.rank:''}</td><td class="num"><small>${r.iv[1]}/${r.iv[2]}/${r.iv[3]} · ${T('Lvl')} ${r.iv[0]}</small></td></tr>`).join('')}</tbody></table></div>
   ${R.length>PL.show?`<div class="controls"><button class="btn ghost" id="plMore">${T('Show {n} more',{n:Math.min(200,R.length-PL.show)})}</button></div>`:''}`;}
function plChosen(){const R=plFiltered();return PL.sel.size?R.filter(r=>PL.sel.has(r.sid)).concat(plRows().filter(r=>PL.sel.has(r.sid)&&!R.some(x=>x.sid===r.sid))):R;}
function plCopy(txt){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast(T('Copied')),()=>{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast(T('Copied'));}catch(e){}ta.remove();});}
const PLEL=$('v-plist');
PLEL.addEventListener('input',e=>{if(e.target.id==='plQ'){PL.q=e.target.value;PL.show=200;const pos=e.target.selectionStart;renderPL();const q=$('plQ');q.focus();q.setSelectionRange(pos,pos);}});
PLEL.addEventListener('change',e=>{const t=e.target,map={plType:'type',plForm:'form',plSrc:'src',plMv:'mv',plSort:'sort'};
  if(map[t.id]){PL[map[t.id]]=t.value;PL.show=200;renderPL();return;}
  if(t.dataset.pltick){if(t.checked)PL.sel.add(t.dataset.pltick);else PL.sel.delete(t.dataset.pltick);const s=PLEL.querySelector('.mxshown');if(s)s.textContent=T('{a} Pokémon · {b} ticked',{a:plFiltered().length,b:PL.sel.size});}});
PLEL.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='plMore'){PL.show+=200;renderPL();return;}
  if(b.id==='plTickAll'){plFiltered().slice(0,PL.show).forEach(r=>PL.sel.add(r.sid));renderPL();return;}
  if(b.id==='plUntick'){PL.sel.clear();renderPL();return;}
  if(b.id==='plDl'){download('pokemon-list.csv',plCSV(plChosen()));return;}
  if(b.id==='plCopy'){plCopy(plChosen().map(plLine).join('\n'));return;}
  if(b.id==='plNames'){plCopy(plChosen().map(r=>dn(r.n)).join('\n'));return;}
  if(b.dataset.plto){const g=b.dataset.plto,L=plChosen();if(!L.length){toast(T('That list is empty.'));return;}if(L.length>MXMAX)toast(T('Groups hold up to {n}; {k} were left out.',{n:MXMAX,k:L.length-MXMAX}));
    MX[g]=L.slice(0,MXMAX).map(r=>mkEntry(r.sid,{f:r.f,c:r.c}));MX.opt=null;mxSave();go('matrix');window.scrollTo({top:0});toast(T('Group {g}: {n} Pokémon',{g,n:MX[g].length}));return;}});

// ---------- Best IVs: compare two spreads, and breakpoints against the whole opponent list
let IVCMP={a:null,b:null,res:null};
function ivFind(t){return IVRES.R.find(x=>x.t.a===t[0]&&x.t.d===t[1]&&x.t.s===t[2]);}
function ivTableFor(){return ivTable(IVRES.sid,IVRES.cap,1500);}
function ivT(iv){return ivTableFor().find(t=>t.a===iv[0]&&t.d===iv[1]&&t.s===iv[2]);}
function ivInputs(k,iv){return ['Attack','Defense','HP'].map((l,i)=>`<label>${T(l)}<input type="number" min="0" max="15" inputmode="numeric" data-ivc="${k}:${i}" value="${iv[i]}"></label>`).join('');}
function renderIVCmp(){const el=$('ivCmp');if(!el||!IVRES||IVRES.ul)return;const Rz=IVRES;
  if(!IVCMP.a||IVCMP.sid!==Rz.sid){const top=ivSorted()[0].t;IVCMP={sid:Rz.sid,a:[top.a,top.d,top.s],b:Rz.def?[Rz.def.t.a,Rz.def.t.d,Rz.def.t.s]:[15,15,15],res:null};}
  const A=ivT(IVCMP.a),B=ivT(IVCMP.b);const ra=ivFind(IVCMP.a),rb=ivFind(IVCMP.b);const ready=(IVCMP.res&&IVCMP.res.sig===JSON.stringify([IVCMP.a,IVCMP.b,Rz.sig]))?IVCMP.res:(ra&&rb?{ra,rb}:null);
  const col=(t,r,lab)=>`<div class="ivcc"><h4>${lab} <b class="num">${t.a}/${t.d}/${t.s}</b></h4><div class="ivcs num">${T('Lvl')} ${t.lv} · CP ${t.cp}<br>${T('Attack')} ${t.A.toFixed(2)} · ${T('Defense')} ${t.D.toFixed(2)} · ${T('HP')} ${t.H}<br>${T('Stat product')} ${Math.round(t.sp).toLocaleString()} (#${t.rank})</div>
    ${r?`<div class="ivcr"><b class="num">${r.wins}</b> ${T('wins')} · ${T('average')} <b class="num">${Math.round(r.avg)}</b><br>${['W','CW','T','CL','L'].map(k=>`${chip(k)} <span class="num">${r.cnt[k]}</span>`).join(' ')}</div>`:''}</div>`;
  let h=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Compare two IV spreads')}</h3><p class="lede" style="font-size:13px">${T('Against the same opponents and shields as the table above, with PvPoke\'s engine. Starts with the top spread and PvPoke\'s default IVs; type any two.')}</p>
   <div class="ivcin"><div class="mxivs"><span class="sbl">A</span>${ivInputs('a',IVCMP.a)}</div><div class="mxivs"><span class="sbl">B</span>${ivInputs('b',IVCMP.b)}</div><button class="btn" id="ivCmpGo"${ready?' hidden':''}>${T('Compare')}</button><span class="num" id="ivCmpStat" style="color:var(--muted)"></span></div>`;
  if(A&&B){h+=`<div class="cols">${col(A,ready&&ready.ra,'A')}${col(B,ready&&ready.rb,'B')}</div>`;
    if(ready){const O=Rz.O,diff=[];for(let j=0;j<O.length;j++){const x=ready.ra.r[j],y=ready.rb.r[j];if((x>500)!==(y>500)||(x<500)!==(y<500))diff.push(j);}
      h+=diff.length?`<h4 class="ivh">${T('Matchups where they differ ({n})',{n:diff.length})}</h4><div class="tblwrap"><table class="vt ivdp"><thead><tr><th>${T('Opponent')}</th><th class="r">A ${IVCMP.a.join('/')}</th><th class="r">B ${IVCMP.b.join('/')}</th></tr></thead><tbody>${diff.map(j=>{const x=ready.ra.r[j],y=ready.rb.r[j];return `<tr><td>${monTag(O[j].n,O[j].sid)}</td><td class="r"><span class="num">${x}</span> ${chip(tier(x))}</td><td class="r"><span class="num">${y}</span> ${chip(tier(y))}</td></tr>`;}).join('')}</tbody></table></div>`:`<p class="lede" style="font-size:13px">${T('Both spreads get the same result in every matchup.')}</p>`;}}
  el.innerHTML=h+'</div>';}
async function ivCompare(){const Rz=IVRES,A=ivT(IVCMP.a),B=ivT(IVCMP.b);if(!A||!B)return;const O=Rz.O,shs=Rz.sh==='avg'?[[0,0],[1,1],[2,2]]:[[+Rz.sh,+Rz.sh]],ns=shs.length,wsum=O.reduce((s,o)=>s+o.w,0);
  const st=$('ivCmpStat');if(st)st.textContent=T('Running…');
  const h=poolRun([A,B].map(t=>ivSpec(Rz.sid,Rz.f,Rz.c,t)),O.map(o=>[o.sid,o.f,o.c,SP[o.sid].iv]),shs);let out;try{out=await h.promise;}catch(e){return;}
  const row=(t,ci)=>{const r=new Int16Array(O.length);let av=0;const cnt={W:0,CW:0,T:0,CL:0,L:0};for(let j=0;j<O.length;j++){let s=0;for(let q=0;q<ns;q++)s+=out[(ci*O.length+j)*ns+q];const v=Math.round(s/ns);r[j]=v;av+=v*O[j].w;cnt[tier(v)]++;}return {t,r,avg:av/wsum,cnt,wins:cnt.W+cnt.CW};};
  IVCMP.res={sig:JSON.stringify([IVCMP.a,IVCMP.b,Rz.sig]),ra:row(A,0),rb:row(B,1)};renderIVCmp();}
// fast-move breakpoints and bulkpoints for the chosen spread against every opponent (damage maths only: instant)
let IVBP={k:'a'};
function renderIVBp(){const el=$('ivBp');if(!el||!IVRES||IVRES.ul)return;const Rz=IVRES,base=IVBP.k==='b'?IVCMP.b:IVCMP.a;if(!base)return;const T4=ivTableFor();
  const at=(a,d,s)=>T4[a*256+d*16+s];const mine=i=>{const t=i;return SIM.build(Rz.sid,Rz.f,Rz.c,[t.lv,t.a,t.d,t.s]);};
  const ranges=arr=>{const out=[];let s0=0;for(let i=1;i<=16;i++){if(i===16||arr[i]!==arr[s0]){out.push([s0,i-1,arr[s0]]);s0=i;}}return out;};
  const fmt=(rs,cur)=>rs.map(([a,b,d])=>`<span class="sbpt${cur>=a&&cur<=b?' on':''}">${a===b?a:a+'–'+b}: <b class="num">${d}</b></span>`).join('');
  const rows=[];const myAtk=[...Array(16).keys()].map(a=>mine(at(a,base[1],base[2]))),myDef=[...Array(16).keys()].map(d=>mine(at(base[0],d,base[2])));
  for(const o of Rz.O){const Y=SIM.build(o.sid,o.f,o.c,SP[o.sid].iv);const bp=myAtk.map(X=>SIM.dmg(X,Y,X.fast)),bk=myDef.map(X=>SIM.dmg(Y,X,Y.fast));
    const rb=ranges(bp),rk=ranges(bk);if(rb.length>1||rk.length>1)rows.push({o,rb,rk});}
  el.innerHTML=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Breakpoints against these opponents')}</h3><p class="lede" style="font-size:13px">${T('For spread {iv}: where your fast move does one more damage as your Attack IV changes, and where theirs does one less as your Defense IV changes (level recalculated for each IV). Only opponents where an IV makes a difference are listed; your current IVs are highlighted.',{iv:`<b class="num">${base.join('/')}</b>`})}</p>
   <div class="controls"><div class="seg" role="group"><button data-ivbp="a" aria-pressed="${IVBP.k==='a'}">A ${IVCMP.a.join('/')}</button><button data-ivbp="b" aria-pressed="${IVBP.k==='b'}">B ${IVCMP.b.join('/')}</button></div></div>
   ${rows.length?`<div class="tblwrap"><table class="vt ivbp"><thead><tr><th>${T('Opponent')}</th><th>${T('Your {m} damage by Attack IV',{m:esc(mvName(Rz.f))})}</th><th>${T('Their fast move damage by your Defense IV')}</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${monTag(x.o.n,x.o.sid)}<div class="mxsub2">${esc(mvName(x.o.f))}</div></td><td><div class="sbptl">${fmt(x.rb,base[0])}</div></td><td><div class="sbptl">${fmt(x.rk,base[1])}</div></td></tr>`).join('')}</tbody></table></div>`:`<p class="lede" style="font-size:13px">${T('No breakpoints or bulkpoints: fast move damage is the same at every IV against all of these opponents.')}</p>`}</div>`;}
IVEL.addEventListener('change',e=>{const d=e.target.dataset;if(d.ivc){const [k,i]=d.ivc.split(':');IVCMP[k][+i]=Math.max(0,Math.min(15,Math.round(+e.target.value||0)));IVCMP.res=null;renderIVCmp();renderIVBp();}});
IVEL.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='ivCmpGo'){ivCompare();return;}if(b.dataset.ivbp){IVBP.k=b.dataset.ivbp;renderIVBp();}});
// ---------- first-visit guide on the Battle pages
const GUIDES={matrix:['Pick a ready-made list for each group (or paste a PvPoke list), then press Run.','Tap any cell for every shield combination, or open it in the sandbox.','Use "Best IVs for these shields" to give each Pokémon its strongest spread against the other group.','Search, filter and sort the results tables, and download everything for Excel.'],
  sandbox:['Pick two Pokémon, their moves and IVs; change shields, starting HP, energy and stat stages.','The result, timeline and turn-by-turn log update as you change anything.','"Analyse every IV" tests all 4,096 spreads for both sides: what flips the result, and whether it is a win or loss whatever the IVs.'],
  ivs:['Search a Pokémon and press "Find the best IVs".','The table ranks its top 200 spreads by results against the opponents you pick; tap a row for the matchups it flips.','Compare any two spreads below the table, and see the breakpoints that matter.'],
  t3:['Fill both trios (or use your team, or a random Day 2 team for them) and pick each side\'s plan.','The result plays the whole 3v3 out with PvPoke\'s battle engine, one exchange at a time.','The lead grid shows how every lead pairing goes, so you can see which lead is safest.'],
  plist:['Filter the list and tick the Pokémon you want (or use the whole list).','Download it for Excel, copy it as a PvPoke import list, or send it to the battle matrix.']};
function guide(v){const el=$('guide-'+v);if(!el)return;let seen=false;try{seen=!!localStorage.getItem('gl_guide_'+v);}catch(e){}
  el.innerHTML=seen?'':`<div class="guide"><b>${T('How to use this page')}</b><ol>${GUIDES[v].map(x=>`<li>${esc(T(x))}</li>`).join('')}</ol><button class="link" data-guidex="${v}">${T('Got it')}</button></div>`;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-guidex]');if(!b)return;try{localStorage.setItem('gl_guide_'+b.dataset.guidex,'1');}catch(err){}guide(b.dataset.guidex);});

// ---------- 3v3 BATTLE: two trios, played exchange by exchange with PvPoke's engine.
// Each exchange is a PvPoke 1v1 battle from the current HP, energy and remaining shields until one side faints;
// the survivor keeps its HP and energy, the team's remaining shields carry over, and the next Pokémon comes in.
const T3DEF={lead:'swap',next:'best',sh:'need',shields:2};
let T3={A:[null,null,null],B:[null,null,null],S:{A:Object.assign({},T3DEF),B:Object.assign({},T3DEF)},res:null};
try{const o=JSON.parse(localStorage.getItem('gl_t3')||'null');if(o){T3.A=(o.A||[]).map(x=>x?mkSlot(x):null).concat([null,null,null]).slice(0,3);T3.B=(o.B||[]).map(x=>x?mkSlot(x):null).concat([null,null,null]).slice(0,3);if(o.S)T3.S={A:Object.assign({},T3DEF,o.S.A),B:Object.assign({},T3DEF,o.S.B)};}}catch(e){}
if(!T3.A.some(Boolean)){const t=team.filter(Boolean).slice(0,3);T3.A=[0,1,2].map(k=>t[k]?mkSlot({name:t[k].name,f:t[k].f,c:t[k].c}):null);}
if(!T3.B.some(Boolean)||!T3.A.some(Boolean)){const top=Mx.map((m,i)=>i).sort((a,b)=>Mx[b].u-Mx[a].u);if(!T3.B.some(Boolean))T3.B=top.slice(0,3).map(i=>mkSlot({name:Mx[i].n}));if(!T3.A.some(Boolean))T3.A=top.slice(3,6).map(i=>mkSlot({name:Mx[i].n}));}
function t3save(){try{localStorage.setItem('gl_t3',JSON.stringify({A:T3.A.map(s=>s?{name:s.name,f:s.f,c:s.c}:null),B:T3.B.map(s=>s?{name:s.name,f:s.f,c:s.c}:null),S:T3.S}));}catch(e){}}
const t3A=Slots({el:$('t3A'),prefix:'t3a',max:3,fixed:true,compact:true,list:()=>T3.A,save:t3save,onChange:()=>{t3A.render();T3.res=null;renderT3();}});
const t3B=Slots({el:$('t3B'),prefix:'t3b',max:3,fixed:true,compact:true,list:()=>T3.B,save:t3save,onChange:()=>{t3B.render();T3.res=null;renderT3();}});
const t3spec=s=>[s.sid,s.f,s.c.filter(Boolean),SP[s.sid].iv.slice()];
// play one 3v3. lead = [indexA,indexB] or null (use slot 1). strat per side: {lead:'swap'|'stay', next:'best'|'order', sh:'need'|'keep1'|'keep2', shields}
function t3play(TA,TB,SA,SB,lead){const mk=T=>T.map((s,k)=>{const b=bld(s.sid,s.f,s.c);return {k,s,spec:t3spec(s),hp:b.hp,max:b.hp,en:0,out:false};});
  const P=[mk(TA),mk(TB)],S=[SA,SB],sh=[SA.shields,SB.shields],cur=lead?lead.slice():[0,0],ev=[];let t=0;
  const keep=side=>{const left=P[side].filter(x=>!x.out).length;const k=S[side].sh==='keep2'?2:S[side].sh==='keep1'?1:0;return left>1?Math.min(k,sh[side]):0;};
  const quick=(side,me,op)=>{const a=side?[op,me]:[me,op],av=[sh[0]-keep(0),sh[1]-keep(1)];const r=PVE.run(a[0].spec,a[1].spec,{sh:av,hp:[a[0].hp,a[1].hp],en:[a[0].en,a[1].en]});return r.ratings[side];};
  const pickNext=(side,opp)=>{const left=P[side].filter(x=>!x.out);if(!left.length)return -1;if(S[side].next==='order'||left.length===1||!opp)return left[0].k;
    let best=null;for(const x of left){const r=quick(side,x,opp);if(!best||r>best.r)best={k:x.k,r};}return best.k;};
  // opening: a side set to swap leaves a losing lead for its best answer to the other lead
  const sw=[null,null];for(const side of [0,1]){if(S[side].lead!=='swap')continue;const me=P[side][cur[side]],op=P[1-side][cur[1-side]];const r0=quick(side,me,op);
    if(r0>=500)continue;let best=null;for(const x of P[side]){if(x.k===cur[side])continue;const r=quick(side,x,op);if(!best||r>best.r)best={k:x.k,r};}
    if(best&&best.r>500&&best.r>r0+50)sw[side]={from:cur[side],to:best.k,r0,r1:best.r};}
  for(const side of [0,1])if(sw[side]){cur[side]=sw[side].to;ev.push({type:'swap',side,from:sw[side].from,to:sw[side].to,r0:sw[side].r0,r1:sw[side].r1,t:0});}
  let guard=0;
  while(guard++<12){const a=P[0][cur[0]],b=P[1][cur[1]];const av=[sh[0]-keep(0),sh[1]-keep(1)];
    const st={hp:[a.hp,b.hp],en:[a.en,b.en],sh:[sh[0],sh[1]]};
    const R=PVE.run(a.spec,b.spec,{sh:av,hp:[a.hp,b.hp],en:[a.en,b.en],log:true});
    const used=[av[0]-R.sh[0],av[1]-R.sh[1]];sh[0]-=used[0];sh[1]-=used[1];a.hp=R.hp[0];b.hp=R.hp[1];a.en=R.en[0];b.en=R.en[1];t+=R.turns;
    ev.push({type:'ex',a:a.k,b:b.k,st,end:{hp:[a.hp,b.hp],en:[a.en,b.en],sh:[sh[0],sh[1]]},used,turns:R.turns,t,log:R.log});
    if(a.hp<=0)a.out=true;if(b.hp<=0)b.out=true;
    if(!a.out&&!b.out)break; // time ran out in this exchange
    const na=a.out?pickNext(0,b.out?null:b):cur[0],nb=b.out?pickNext(1,a.out?null:a):cur[1];
    if(a.out){if(na<0)break;cur[0]=na;ev.push({type:'in',side:0,k:na,t});}
    if(b.out){if(nb<0)break;cur[1]=nb;ev.push({type:'in',side:1,k:nb,t});}
    if(t>=480)break;}
  const left=P.map(T=>T.filter(x=>!x.out)),frac=P.map(T=>T.reduce((s,x)=>s+(x.out?0:x.hp/x.max),0));
  const winner=left[0].length&&!left[1].length?0:left[1].length&&!left[0].length?1:frac[0]>frac[1]?0:frac[1]>frac[0]?1:-1;
  return {P,ev,winner,left,frac,sh,t,score:Math.round(500+500*(frac[0]-frac[1])/3)};}
function t3stratHTML(g){const S=T3.S[g];const sel=(k,opts)=>`<select data-t3s="${g}:${k}">${opts.map(([v,l])=>`<option value="${v}"${String(S[k])===String(v)?' selected':''}>${esc(l)}</option>`).join('')}</select>`;
  return `<div class="t3strat"><label class="fld">${T('Shields')} ${sel('shields',[[0,'0'],[1,'1'],[2,'2']])}</label>
   <label class="fld">${T('Lead')} ${sel('lead',[['swap',T('Swap out a losing lead')],['stay',T('Lead stays in')]])}</label>
   <label class="fld">${T('After a faint')} ${sel('next',[['best',T('Best answer comes in')],['order',T('Team order')]])}</label>
   <label class="fld">${T('Shield plan')} ${sel('sh',[['need',T('Use as needed')],['keep1',T('Save 1 for the last Pokémon')],['keep2',T('Save 2 for the last Pokémon')]])}</label></div>`;}
function renderT3(){const el=$('t3Out');if(!el)return;$('t3SA').innerHTML=t3stratHTML('A');$('t3SB').innerHTML=t3stratHTML('B');
  const A=T3.A.filter(Boolean),B=T3.B.filter(Boolean);if(A.length<3||B.length<3){el.innerHTML=`<p class="empty">${T('Fill all three slots on both sides.')}</p>`;return;}
  if(!HAS_PVE){el.innerHTML='';return;}
  const R=t3play(A,B,T3.S.A,T3.S.B,null);T3.res=R;const nm=(side,k)=>esc(dn((side?B:A)[k].name)),tag=(side,k)=>monTag((side?B:A)[k].name,(side?B:A)[k].sid);
  const won=R.winner===0?T('Your team wins'):R.winner===1?T('Their team wins'):T('Draw');
  const teamLeft=side=>R.P[side].map(x=>`<div class="t3m${x.out?' out':''}">${badge(x.s.name,x.s.sid)}<span>${esc(dn(x.s.name))}</span><span class="sbbar"><i class="left" style="width:${(100*Math.max(0,x.hp)/x.max).toFixed(1)}%"></i></span><span class="num">${x.out?T('fainted'):Math.max(0,x.hp)+' '+T('HP')}</span></div>`).join('');
  let h=`<div class="card"><div class="sbverdict ${R.winner===0?'w0':R.winner===1?'w1':'tie'}"><b>${won}</b><span class="num">${T('{a} left vs {b} left',{a:R.left[0].length,b:R.left[1].length})} · ${T('shields left {a} / {b}',{a:R.sh[0],b:R.sh[1]})} · ${(R.t*0.5).toFixed(1)}s</span></div>
   <div class="cols"><div><h4>${T('Your team')}</h4>${teamLeft(0)}</div><div><h4>${T('Their team')}</h4>${teamLeft(1)}</div></div>
   <h4 class="ivh">${T('Play by play')}</h4><ol class="t3pbp">`;
  for(const e of R.ev){if(e.type==='swap'){h+=`<li class="t3sw">${e.side?T('They swap {a} out for {b} ({r0} → {r1} in this matchup).',{a:nm(1,e.from),b:nm(1,e.to),r0:e.r0,r1:e.r1}):T('You swap {a} out for {b} ({r0} → {r1} in this matchup).',{a:nm(0,e.from),b:nm(0,e.to),r0:e.r0,r1:e.r1})}</li>`;continue;}
    if(e.type==='in'){h+=`<li class="t3in">${e.side?T('{p} comes in for them.',{p:nm(1,e.k)}):T('{p} comes in for you.',{p:nm(0,e.k)})}</li>`;continue;}
    const ch=e.log.filter(x=>x.k==='charged').map(x=>`${esc(dn((x.i?B[e.b]:A[e.a]).name))} ${mvTag(x.m)}${x.sd?` <span class="tag">${T('shielded')}</span>`:` <span class="num">${x.d}</span>`}`).join(' · ');
    const fa=e.end.hp[0]<=0,fb=e.end.hp[1]<=0;
    h+=`<li class="t3ex"><div><b>${tag(0,e.a)}</b> <span class="vs">vs</span> <b>${tag(1,e.b)}</b> <span class="mxsub2">${(e.t*0.5).toFixed(1)}s</span></div>
     <div class="mxsub2">${T('Start')}: ${e.st.hp[0]} / ${e.st.hp[1]} ${T('HP')} · ${T('energy')} ${e.st.en[0]} / ${e.st.en[1]} · ${T('shields')} ${e.st.sh[0]} / ${e.st.sh[1]}</div>
     ${ch?`<div class="t3ch">${ch}</div>`:''}
     <div>${fa&&fb?T('Both faint.'):fa?T('{p} faints; {q} has {h} HP and {e} energy left.',{p:nm(0,e.a),q:nm(1,e.b),h:e.end.hp[1],e:e.end.en[1]}):fb?T('{p} faints; {q} has {h} HP and {e} energy left.',{p:nm(1,e.b),q:nm(0,e.a),h:e.end.hp[0],e:e.end.en[0]}):T('Time runs out.')}${e.used[0]||e.used[1]?` <span class="mxsub2">${T('Shields used: {a} / {b}',{a:e.used[0],b:e.used[1]})}</span>`:''}</div></li>`;}
  h+=`</ol></div>`;
  // every lead pairing (both leads stay in)
  const SA=Object.assign({},T3.S.A,{lead:'stay'}),SB=Object.assign({},T3.S.B,{lead:'stay'});
  const G=[0,1,2].map(i=>[0,1,2].map(j=>t3play(A,B,SA,SB,[i,j])));
  const wins=[0,1,2].map(i=>G[i].filter(r=>r.winner===0).length),worst=[0,1,2].map(i=>Math.min(...G[i].map(r=>r.score)));
  const bestLead=[0,1,2].sort((x,y)=>wins[y]-wins[x]||worst[y]-worst[x])[0];
  h+=`<div class="card"><h3 style="font-size:18px;margin-bottom:4px">${T('Every lead matchup')}</h3><p class="lede" style="font-size:13px">${T('Each cell is the whole 3v3 with those two leads staying in, using the rest of each side\'s plan. Greener is better for you; the number is the share of your team\'s HP left against theirs.')}</p>
   <div class="hmwrap"><table class="hm mxsh"><thead><tr><th class="hl"><small>${T('You ↓ · Them →')}</small></th>${B.map(b=>`<th class="hh">${badge(b.name,b.sid)}<span class="hn">${esc(shortName(b.name))}</span></th>`).join('')}<th class="hh hb">${T('Wins')}</th></tr></thead><tbody>
   ${A.map((a,i)=>`<tr><th class="hl">${monTag(a.name,a.sid)}${i===bestLead?` <span class="tag ok">${T('best lead')}</span>`:''}</th>${G[i].map((r,j)=>{const c=heatCol(r.score);return `<td class="hc" style="background:${c.bg};color:${c.fg}" title="${esc(r.winner===0?T('Your team wins'):r.winner===1?T('Their team wins'):T('Draw'))}">${r.winner===0?'W':r.winner===1?'L':'T'}<small> ${r.score}</small></td>`;}).join('')}<td class="r num"><b>${wins[i]}</b>/3</td></tr>`).join('')}</tbody></table></div>
   <p class="lede" style="font-size:12px">${T('How it works: each exchange is a PvPoke battle from the current HP, energy and remaining shields until one Pokémon faints. Survivors keep their HP and energy, shields carry over, and the next Pokémon comes in. Switching mid-exchange and fast-move alignment between exchanges are not modelled.')}</p></div>`;
  el.innerHTML=h;}
const T3EL=$('v-t3');
T3EL.addEventListener('change',e=>{const d=e.target.dataset;if(d.t3s){const [g,k]=d.t3s.split(':');T3.S[g][k]=k==='shields'?+e.target.value:e.target.value;t3save();renderT3();}});
T3EL.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='t3Swap'){[T3.A,T3.B]=[T3.B,T3.A];[T3.S.A,T3.S.B]=[T3.S.B,T3.S.A];t3save();t3A.render();t3B.render();renderT3();return;}
  if(b.id==='t3Mine'){const t=team.filter(Boolean).slice(0,3);T3.A=[0,1,2].map(k=>t[k]?mkSlot({name:t[k].name,f:t[k].f,c:t[k].c}):null);t3save();t3A.render();renderT3();return;}
  if(b.id==='t3Rand'){const D=DATA.T.filter(t=>t[3]);const tm=D[Math.floor(Math.random()*D.length)];const mons=tm[4].filter(m=>m[1]&&SP[m[1]]).slice();for(let i=mons.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[mons[i],mons[j]]=[mons[j],mons[i]];}
    T3.B=mons.slice(0,3).map(m=>mkSlot({name:m[0],f:m[2],c:m[3]}));t3save();t3B.render();renderT3();toast(T('Three from {p} ({e} #{n})',{p:tm[2],e:tm[0],n:tm[1]}));return;}});
function openT3(A,B){T3.A=A.map(s=>mkSlot({name:s.name,f:s.f,c:s.c}));T3.B=B.map(s=>mkSlot({name:s.name,f:s.f,c:s.c}));t3save();go('t3');window.scrollTo({top:0});}
const VIEWS=['home','cores','trends','teams','answers','build','lab','team','preview','gbl','matrix','sandbox','ivs','plist','t3','types','whowins','counts','about'];
const GROUPS={home:['home'],meta:['cores','trends','teams','answers'],build:['build','lab','team','preview'],battle:['gbl'],sim:['matrix','sandbox','ivs','plist','t3'],learn:['types','whowins','counts','about']};
const groupOf=v=>Object.keys(GROUPS).find(g=>GROUPS[g].includes(v));
const lastView={};
let cur='cores';
function go(v){if(!VIEWS.includes(v))v='home';cur=v;const g=groupOf(v);lastView[g]=v;
  const sec=v;document.querySelectorAll('main section.view').forEach(s=>{s.hidden=s.id!=='v-'+sec;});
  VIEWS.forEach(x=>{const b=$('t-'+x);if(!b)return;b.hidden=groupOf(x)!==g||g==='home'||GROUPS[g].length===1;b.setAttribute('aria-selected',String(x===v));});
  document.querySelectorAll('.gbtn').forEach(b=>b.setAttribute('aria-current',String(b.dataset.g===g)));
  $('setDet').hidden=g==='home'||g==='learn';
  try{localStorage.setItem('gl_tab',v);history.replaceState(null,'','#'+v);}catch(e){}
  refresh();enterView(document.getElementById('v-'+sec));}
function keepOpen(fn){const open=[...document.querySelectorAll('section.view:not([hidden]) button.head[aria-expanded="true"]')].map(b=>b.dataset.core);fn();
  for(const k of open){const b=document.querySelector(`section.view:not([hidden]) button.head[data-core="${k}"]`);if(b)b.click();}}
function refresh(){const sb=document.querySelector('.setbar');const na=cur==='trends'||cur==='about';sb.classList.toggle('na',na);$('setNote').textContent=na?T("Shields and close margin don't affect this tab."):cur==='matrix'?T('The matrix sets its own shields below; the close margin here still colours the results.'):cur==='sandbox'||cur==='ivs'?T('This page sets its own shields below; the close margin here still colours the results.'):'';
  if(cur==='cores'||cur==='build'){keepOpen(()=>{if(cur==='cores')renderCores();else renderBuild();});return;}if(cur==='cores')renderCores();if(cur==='build')renderBuild();if(cur==='answers')renderAnswers();if(cur==='team'){teamSlots.render();renderTeam();}if(cur==='lab')renderLab();if(cur==='trends')renderTrends();if(cur==='teams')renderTD();if(cur==='gbl'){trioSlots.render();renderG3();}if(cur==='home')renderHome();if(cur==='types')renderTQ();if(cur==='whowins')renderWW();if(cur==='counts')renderMC();if(cur==='matrix')renderMatrix();if(cur==='sandbox')renderSandbox();if(cur==='ivs')renderIVs();if(cur==='plist')renderPL();if(cur==='t3'){t3A.render();t3B.render();renderT3();}if(GUIDES[cur])guide(cur);setSummary();if(cur==='preview'){pvSlots.render();pvSummary();renderPreviewInputs();renderPreview();}}
document.querySelectorAll('nav.tabs button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.v)));
document.querySelectorAll('.gbtn').forEach(b=>b.addEventListener('click',()=>{const g=b.dataset.g;go(lastView[g]||GROUPS[g][0]);window.scrollTo({top:0});}));
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){const v=b.dataset.go;if(v==='gbl')G3S='sug';go(v);window.scrollTo({top:0});}});
function setSummary(){const s=$('setSum');if(s)s.textContent=`${SH==='avg'?T('Average'):SH+'–'+SH} · ±${MARGIN} · ${T('Anti-meta pool')} ${Math.round(ANTICUT*100)}%`;}
function saveSet(){try{localStorage.setItem('gl_set',JSON.stringify({sh:SH,m:MARGIN,ac:ANTICUT}));}catch(e){}}
seg(['sh-avg','sh-0','sh-1','sh-2'],id=>{const v=id.slice(3);SH=v==='avg'?'avg':+v;saveSet();refresh();});
setSeg(['sh-avg','sh-0','sh-1','sh-2'],'sh-'+SH);$('marginSel').value=String(MARGIN);
$('marginSel').addEventListener('change',e=>{MARGIN=+e.target.value;saveSet();refresh();});
$('antiSel').value=String(ANTICUT);$('antiSel').addEventListener('change',e=>{ANTICUT=+e.target.value;saveSet();refresh();});
// ---------- motion
const RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}})();
const HK=new Map(),CU=new Map();
const fmtCU=(v,f)=>f==='p'?Math.round(v*100)+'%':String(Math.round(v));
function countUp(el){const to=+el.dataset.cu,k=el.dataset.cuk||'',f=el.dataset.cuf||'i';const from=CU.has(k)?CU.get(k):0;CU.set(k,to);
  if(RM||from===to){el.textContent=fmtCU(to,f);return;}const t0=performance.now(),D=700;
  const step=now=>{const p=Math.min(1,(now-t0)/D),q=1-Math.pow(1-p,3);el.textContent=fmtCU(from+(to-from)*q,f);if(p<1)requestAnimationFrame(step);};el.textContent=fmtCU(from,f);requestAnimationFrame(step);}
function animIn(root){if(root.nodeType!==1)return;
  const q=s=>[...(root.matches(s)?[root]:[]),...root.querySelectorAll(s)];
  for(const c of q('[data-hk]')){const k=c.dataset.hk,t=c.dataset.t,p=HK.get(k);if(p!==undefined&&p!==t&&!RM){c.classList.add('flip',TV[t]>TV[p]?'up':'down');c.title=(c.title||'')+' · '+T('was {t}',{t:p});}HK.set(k,t);}
  for(const n of q('[data-cu]'))countUp(n);}
const MOB=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)animIn(n);});
function enterView(sec){if(RM||!sec)return;sec.classList.remove('enter');void sec.offsetWidth;sec.classList.add('enter');clearTimeout(sec.__et);sec.__et=setTimeout(()=>sec.classList.remove('enter'),900);}
function toast(msg){let t=$('toast');if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');document.body.appendChild(t);}t.textContent=msg;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(t.__h);t.__h=setTimeout(()=>t.classList.remove('show'),2600);}
// ---------- share cards + team links
const IMGC={};function typeImg(t){if(!IMGC[t]){const i=new Image();i.src=TYPEIMG[t];IMGC[t]=i;}return IMGC[t];}
async function cardReady(){await Promise.all(Object.keys(TYPEIMG).map(t=>{const i=typeImg(t);return i.complete?0:new Promise(r=>{i.onload=i.onerror=r;});}));
  try{await Promise.all(['700 40px "Chakra Petch"','600 40px "Chakra Petch"','400 24px "Atkinson Hyperlegible"','700 24px "Atkinson Hyperlegible"','500 24px "IBM Plex Mono"'].map(f=>document.fonts.load(f)));}catch(e){}}
function encodeTeam(list){const j=JSON.stringify(list.map(s=>[s.name,s.f,...s.c.filter(Boolean)]));return btoa(unescape(encodeURIComponent(j))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decodeTeam(code){try{code=String(code).trim();const m=code.match(/(?:team|trio)=([\w-]+)/);if(m)code=m[1];code=code.replace(/-/g,'+').replace(/_/g,'/');while(code.length%4)code+='=';
  const a=JSON.parse(decodeURIComponent(escape(atob(code))));if(!Array.isArray(a))return null;const out=a.map(x=>Array.isArray(x)&&DATA.names[x[0]]!==undefined?mkSlot({name:x[0],f:x[1],c:x.slice(2)}):null).filter(Boolean);return out.length?out:null;}catch(e){return null;}}
const shareBase=()=>{try{if(/^https?:$/.test(location.protocol)&&!/claude|anthropic|usercontent/.test(location.hostname))return location.origin+location.pathname;}catch(e){}return '';};
const D_FONT='"Chakra Petch","Arial Narrow",system-ui,sans-serif',B_FONT='"Atkinson Hyperlegible",system-ui,sans-serif',M_FONT='"IBM Plex Mono",ui-monospace,monospace';
function fitText(x,s,maxW,size,weight,fam){let z=size;x.font=`${weight} ${z}px ${fam}`;while(z>12&&x.measureText(s).width>maxW){z-=1;x.font=`${weight} ${z}px ${fam}`;}return z;}
function drawBadge(x,cx,cy,r,name,sid){const ts=typesOf(sid),c1=TC[ts[0]]||'#888',c2=TC[ts[1]||ts[0]]||c1;x.save();x.beginPath();x.arc(cx,cy,r,0,7);x.closePath();
  if(ts.length>1){x.clip();x.fillStyle=c1;x.fillRect(cx-r,cy-r,2*r,2*r);x.fillStyle=c2;x.beginPath();x.moveTo(cx+r,cy-r);x.lineTo(cx+r,cy+r);x.lineTo(cx-r,cy+r);x.closePath();x.fill();}else{x.fillStyle=c1;x.fill();}
  x.restore();x.save();x.lineWidth=Math.max(2,r/14);x.strokeStyle=/\(Shadow\)/.test(name)?'#9B6BE8':'rgba(255,255,255,.4)';x.beginPath();x.arc(cx,cy,r-x.lineWidth/2,0,7);x.stroke();
  x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font=`700 ${Math.round(r*0.8)}px ${D_FONT}`;x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=3;x.fillText(initials(name),cx,cy+1);x.restore();}
function rrect(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
// d: {kind,title,sub,mons:[{name,sid,f,c,ts:[tier...]}],thr:[{name,sid}],thrLabel,stats:[[label,value]],weak:[types],roles:[names]|null,rolesLabel}
function drawCard(d){const W=1080,P=56,rowH=118,gap=12,ncol=d.thr.length,cw=54,gx=W-P-24-ncol*cw;
  const H=P+176+40+d.mons.length*(rowH+gap)+40+150+(d.roles?96:0)+110;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#131A29');g.addColorStop(1,'#1D2A4A');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='rgba(255,255,255,.05)';for(let yy=12;yy<240;yy+=22)for(let xx=12;xx<W;xx+=22){x.beginPath();x.arc(xx,yy,1.4,0,7);x.fill();}
  // logo
  rrect(x,P,P,92,92,18);x.fillStyle='#2153D0';x.fill();x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=3;x.stroke();
  x.fillStyle='#fff';x.textAlign='center';x.textBaseline='alphabetic';x.font=`700 38px ${D_FONT}`;x.fillText('GL',P+46,P+52);x.font=`600 14px ${D_FONT}`;x.fillText('CORE',P+46,P+74);
  x.textAlign='left';x.font=`600 22px ${D_FONT}`;x.fillStyle='#8FA8E8';x.fillText('GL CORE SCOUT · '+T('Great League'),P+116,P+26);
  fitText(x,d.title,W-2*P-116,54,700,D_FONT);x.fillStyle='#fff';x.fillText(d.title,P+116,P+80);
  x.font=`400 24px ${B_FONT}`;x.fillStyle='#A9B6D3';x.fillText(d.sub,P+116,P+116);
  let y=P+176;
  // threat header
  x.font=`700 17px ${D_FONT}`;x.fillStyle='#8FA8E8';x.textAlign='right';x.fillText(d.thrLabel.toUpperCase(),W-P-20,y-6);x.textAlign='left';
  d.thr.forEach((t,j)=>drawBadge(x,gx+j*cw+cw/2,y+22,20,t.name,t.sid));y+=56;
  // members
  for(const m of d.mons){rrect(x,P,y,W-2*P,rowH,18);x.fillStyle='rgba(255,255,255,.06)';x.fill();
    drawBadge(x,P+62,y+rowH/2,42,m.name,m.sid);
    typesOf(m.sid).forEach((t,k)=>{const im=typeImg(t);if(im.complete&&im.naturalWidth)x.drawImage(im,P+80+k*22-(typesOf(m.sid).length-1)*11,y+rowH/2+18,30,30);});
    const tx=P+128,maxW=gx-tx-18;fitText(x,dn(m.name),maxW,36,700,D_FONT);x.fillStyle='#fff';x.fillText(dn(m.name),tx,y+46);
    // moves
    const mv=[m.f,...m.c].filter(Boolean);const fz=21,s=24;x.font=`400 ${fz}px ${B_FONT}`;const wOf=id=>s+6+x.measureText(mvName(id)).width+14;
    const one=mv.reduce((t,id)=>t+wOf(id),0)<=maxW;let mx2=tx,my=one?y+90:y+80;
    mv.forEach(id=>{if(!one&&mx2>tx&&mx2+wOf(id)>tx+maxW){mx2=tx;my+=27;}const im=MV[id]&&typeImg(MV[id].type);if(im&&im.complete&&im.naturalWidth)x.drawImage(im,mx2,my-s+5,s,s);mx2+=s+6;x.fillStyle='#C8D2E6';x.font=`400 ${fz}px ${B_FONT}`;let nm=mvName(id);while(x.measureText(nm).width>maxW-s-6&&nm.length>3)nm=nm.slice(0,-2)+'…';x.fillText(nm,mx2,my);mx2+=x.measureText(nm).width+14;});
    // tiers vs threats
    m.ts.forEach((t,j)=>{const r=t.r,c=heatCol(r),cx=gx+j*cw+4;rrect(x,cx,y+rowH/2-23,cw-8,46,9);x.fillStyle=c.bg.replace(/[\d.]+\)$/,Math.max(0.28,c.a)+')');x.fill();
      x.fillStyle='#fff';x.textAlign='center';x.font=`500 ${t.t.length>1?17:20}px ${M_FONT}`;x.fillText(t.t,cx+(cw-8)/2,y+rowH/2+7);x.textAlign='left';});
    y+=rowH+gap;}
  y+=28;
  // stats
  const sw=(W-2*P)/Math.max(1,d.stats.length+1);
  d.stats.forEach(([l,v],k)=>{const sx=P+k*sw;x.fillStyle='#fff';x.font=`500 60px ${M_FONT}`;x.fillText(v,sx,y+58);x.fillStyle='#A9B6D3';fitText(x,l.toUpperCase(),sw-20,17,700,D_FONT);x.fillText(l.toUpperCase(),sx,y+92);});
  const wx=P+d.stats.length*sw;x.fillStyle='#A9B6D3';fitText(x,T('Shared weaknesses').toUpperCase(),sw-10,17,700,D_FONT);x.fillText(T('Shared weaknesses').toUpperCase(),wx,y+92);
  if(d.weak.length){d.weak.slice(0,4).forEach((t,k)=>{const im=typeImg(t);if(im.complete)x.drawImage(im,wx+k*52,y+12,46,46);});}else{x.fillStyle='#43C98D';x.font=`700 40px ${D_FONT}`;x.fillText('✓ '+T('None'),wx,y+56);}
  y+=140;
  if(d.roles){x.fillStyle='rgba(255,255,255,.06)';rrect(x,P,y,W-2*P,76,16);x.fill();x.fillStyle='#8FA8E8';x.font=`700 17px ${D_FONT}`;x.fillText(d.rolesLabel.toUpperCase(),P+22,y+30);
    const lab=[T('Lead'),T('Safe swap'),T('Closer')];let rx=P+22;x.font=`700 24px ${B_FONT}`;
    d.roles.forEach((n,k)=>{x.fillStyle='#8FA8E8';x.font=`600 18px ${D_FONT}`;x.fillText(lab[k].toUpperCase(),rx,y+60);rx+=x.measureText(lab[k].toUpperCase()).width+8;x.fillStyle='#fff';x.font=`700 24px ${B_FONT}`;x.fillText(dn(n),rx,y+60);rx+=x.measureText(dn(n)).width+28;});
    y+=96;}
  // footer
  x.strokeStyle='rgba(255,255,255,.15)';x.lineWidth=2;x.beginPath();x.moveTo(P,y+14);x.lineTo(W-P,y+14);x.stroke();
  x.fillStyle='#A9B6D3';x.font=`400 22px ${B_FONT}`;const base=shareBase();x.fillText(T('Made with GL Core Scout')+(base?' · '+base.replace(/^https?:\/\//,'').replace(/\/(index\.html)?$/,''):''),P,y+56);
  x.textAlign='right';x.fillText(T('Ratings at {sc}',{sc:scenLabel()}),W-P,y+56);x.textAlign='left';
  return cv;}
let SHARE=null,DLNS=null;try{if(window.claude&&typeof window.claude.use==='function')window.claude.use('downloads').then(n=>{DLNS=n;}).catch(()=>{});}catch(e){}
async function openShare(d,link){await cardReady();const cv=drawCard(d);const url=cv.toDataURL('image/png');SHARE={cv,url,name:d.file,link,title:d.title};
  $('shImg').src=url;$('shLink').value=link;$('shLinkRow').hidden=!link;$('shShare').hidden=!(navigator.canShare);
  const dlg=$('shareDlg');if(dlg.showModal){try{dlg.showModal();}catch(e){dlg.setAttribute('open','');}}else dlg.setAttribute('open','');}
function closeShare(){const dlg=$('shareDlg');if(dlg.close)dlg.close();else dlg.removeAttribute('open');}
function teamLink(list,kind){const code=encodeTeam(list),base=shareBase();return base?`${base}#${kind}=${code}`:`${kind}=${code}`;}
function teamCardData(slots,title,sub,file){const units=slots.map(unitOfSlot),e=teamEval(units);const thr=THREATS().slice(0,8);
  const Mr={n:NM,key:'r',name:j=>Mx[j].n,sid:j=>Mx[j].sid,w:Mx.map(m=>m.u)};let roles=null;
  if(units.length>=3){const best=combos(units.length,3).map(ix=>ix.map(k=>units[k])).map(us=>({us,v:trioValue(us,Mr)})).sort((a,b)=>b.v-a.v)[0];const r=g3roles(best.us,Mr);roles=[r.L.name,r.S.name,r.C.name];}
  return {file,title,sub,mons:slots.map((s,k)=>({name:s.name,sid:s.sid,f:s.f,c:s.c,ts:thr.map(x=>{const r=units[k].r(x.i);return {r,t:tier(r)};})})),
    thr:thr.map(x=>({name:Mx[x.i].n,sid:Mx[x.i].sid})),thrLabel:T('vs the most-used'),
    stats:[[T('Cores answered'),pct(e.c1)],[T('Answered twice'),pct(e.c2)],[T('Wins vs top meta'),pct(e.th)]],weak:e.wr.bad,roles,rolesLabel:T('Best three to bring vs the regional meta')};}
function trioCardData(){const M=g3meta(),units=g3units(M),slots=trio.filter(Boolean);const top=[...Array(M.n).keys()].sort((a,b)=>M.w[b]-M.w[a]).slice(0,8);
  const r=units.length===3?g3roles(units,M):null;
  return {file:'gl-trio.png',title:T('My GBL trio'),sub:G3M==='gbl'?T('Go Battle League · vs PvPoke top {n}',{n:NG}):T('Go Battle League · vs the regional meta'),
    mons:slots.map((s,k)=>({name:s.name,sid:s.sid,f:s.f,c:s.c,ts:top.map(i=>{const v=units[k].r(i);return {r:v,t:tier(v)};})})),
    thr:top.map(i=>({name:M.name(i),sid:M.sid(i)})),thrLabel:T('vs the most common'),
    stats:[[T('Meta beaten'),pct(coverage(units,M))]].concat(r?[[T('Lead wins at 2 shields'),pct(r.lead>0?[...Array(M.n).keys()].reduce((s,i)=>s+(r.L.r3(i)[2]>500?M.w[i]:0),0)/M.w.reduce((a,b)=>a+b,0):0)]]:[]),
    weak:weakRule(units).bad,roles:r?[r.L.name,r.S.name,r.C.name]:null,rolesLabel:T('Suggested order')};}
document.addEventListener('click',async e=>{
  const st=e.target.closest('[data-share]');if(st){const k=st.dataset.share;st.disabled=true;try{
    if(k==='team'){const sl=team.filter(Boolean);await openShare(teamCardData(sl,T('My team'),T('Great League · regional meta {ev}',{ev:EVN.join(', ')}),'gl-team.png'),teamLink(sl,'team'));}
    else if(k==='trio'){await openShare(trioCardData(),teamLink(trio.filter(Boolean),'trio'));}
    else if(k.startsWith('td:')){const t=DATA.T[+k.slice(3)];const sl=t[4].filter(m=>m[1]).map(m=>mkSlot({name:m[0],f:m[2],c:m[3]})).filter(Boolean);await openShare(teamCardData(sl,t[2],`${t[0]} · #${t[1]}${t[3]?' · '+T('Day 2'):''}`,'gl-'+t[0].toLowerCase()+'-'+t[1]+'.png'),teamLink(sl,'team'));}
  }finally{st.disabled=false;}return;}
  if(e.target.closest('#shClose')){closeShare();return;}
  if(e.target.id==='shareDlg'){closeShare();return;}
  if(e.target.closest('#shDl')&&SHARE){if(DLNS){try{const blob=await new Promise(r=>SHARE.cv.toBlob(r,'image/png'));await DLNS.save({filename:SHARE.name,data:blob});}catch(err){if(err&&err.code!=='declined')toast(T('Download is not available here. Long-press or right-click the image to save it.'));}return;}const a=document.createElement('a');a.href=SHARE.url;a.download=SHARE.name;document.body.appendChild(a);a.click();a.remove();return;}
  if(e.target.closest('#shShare')&&SHARE){try{const blob=await new Promise(r=>SHARE.cv.toBlob(r,'image/png'));const f=new File([blob],SHARE.name,{type:'image/png'});const data={files:[f],title:SHARE.title};if(SHARE.link&&/^https?:/.test(SHARE.link))data.text=SHARE.link;if(navigator.canShare&&navigator.canShare(data))await navigator.share(data);else toast(T('Sharing images is not supported here. Use Download instead.'));}catch(err){}return;}
  if(e.target.closest('#shCopy')&&SHARE){const inp=$('shLink');try{await navigator.clipboard.writeText(inp.value);toast(T('Team link copied'));}catch(err){inp.select();try{document.execCommand('copy');toast(T('Team link copied'));}catch(e2){}}return;}
  if(e.target.closest('#impGo')){const v=$('impQ').value;const sl=decodeTeam(v);if(!sl){toast(T('That link or code was not recognised.'));return;}
    if(/trio=/.test(v)){trio=[0,1,2].map(k=>sl[k]||null);g3save();G3S='rate';go('gbl');}else{team=[0,1,2,3,4,5].map(k=>sl[k]||null);saveTeam();go('team');}$('impQ').value='';toast(T('Loaded a shared team'));}});
function loadFromHash(){const h=(location.hash||'').slice(1);{const m=h.match(/^sb=([\w-]+)/);if(m){const o=sbDec(m[1]);if(o){SB={cap:o.c||50,s:o.s,mode:o.m==='sandbox'?'sandbox':'auto',actions:Array.isArray(o.a)?o.a:null};sbSave();return 'sandbox';}}}const m=h.match(/^(team|trio)=([\w-]+)/);if(!m)return null;const sl=decodeTeam(m[2]);if(!sl)return null;
  if(m[1]==='trio'){trio=[0,1,2].map(k=>sl[k]||null);g3save();G3S='rate';return 'gbl';}team=[0,1,2,3,4,5].map(k=>sl[k]||null);saveTeam();return 'team';}

// ---------- LEARN: quizzes
const pickOne=a=>a[rnd(a.length)],shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const QS={};try{Object.assign(QS,JSON.parse(localStorage.getItem('gl_q')||'{}'));}catch(e){}
const qst=k=>QS[k]||(QS[k]={ok:0,n:0,streak:0,best:0});
function qScore(k){const s=qst(k);return `<div class="qscore"><span><b class="num">${s.ok}</b>/<span class="num">${s.n}</span> ${T('correct')}</span><span>${T('Streak')} <b class="num">${s.streak}</b></span><span>${T('Best')} <b class="num">${s.best}</b></span><button class="link" data-qreset="${k}">${T('Reset')}</button></div>`;}
function qMark(k,ok){const s=qst(k);s.n++;if(ok){s.ok++;s.streak++;if(s.streak>s.best)s.best=s.streak;}else s.streak=0;try{localStorage.setItem('gl_q',JSON.stringify(QS));}catch(e){}}
function qOpts(q){return `<div class="qopts">${q.opts.map((o,i)=>{let c='';if(q.done){if(i===q.ans)c=' right';else if(i===q.pick)c=' wrong';}return `<button class="qopt${c}" data-qa="${i}" ${q.done?'disabled':''}>${o}</button>`;}).join('')}</div>`;}
function qCard(k,q,prompt){return `<div class="card qcard">${qScore(k)}<div class="qprompt">${prompt}</div>${qOpts(q)}${q.done?`<div class="qfb ${q.pick===q.ans?'ok':'no'}"><b>${q.pick===q.ans?pickOne([T('Correct!'),T('Nice one!'),T('Spot on!')]):T('Not quite.')}</b> ${q.why}</div><button class="btn" data-qnext="${k}">${T('Next question')} →</button>`:''}</div>`;}
const effLabel=x=>x>=2.5?T('Double super effective')+' ×2.56':x>1?T('Super effective')+' ×1.6':x===1?T('Neutral')+' ×1':x>0.5?T('Not very effective')+' ×0.625':x>0.3?T('Double resisted')+' ×0.39':T('Triple resisted')+' ×0.24';
const xTag=x=>x>=2.5?'×2.56':x>1?'×1.6':x===1?'×1':x>0.5?'×0.625':x>0.3?'×0.39':'×0.24';
// ---- type quiz
let TQ={mode:'atk',showT:true,q:null};try{const s=JSON.parse(localStorage.getItem('gl_tqm')||'{}');Object.assign(TQ,s,{q:null});}catch(e){}
const topMeta=n=>Mx.map((m,i)=>({i,u:m.u})).sort((a,b)=>b.u-a.u).slice(0,n).map(x=>x.i);
function tqNew(){const m=TQ.mode;
  if(m==='atk'){let a,d,x;for(let k=0;k<30;k++){a=pickOne(TYPES);d=pickOne(TYPES);x=SIM.eff(a,[d]);if(x!==1||Math.random()<0.25)break;}
    const cats=[1.6,1,0.625,0.390625];const ans=cats.findIndex(c=>Math.abs(c-x)<1e-6);
    return {a,d,x,opts:cats.map(effLabel),ans};}
  if(m==='res'){const a=pickOne(TYPES);const good=TYPES.filter(t=>SIM.eff(a,[t])<1),bad=shuffle(TYPES.filter(t=>SIM.eff(a,[t])>=1));if(!good.length)return tqNew();
    const c=pickOne(good),opts=shuffle([c,...bad.slice(0,3)]);return {a,c,types:opts,opts:opts.map(typeChip),ans:opts.indexOf(c)};}
  const i=pickOne(topMeta(60)),ts=typesOf(Mx[i].sid);const se=TYPES.filter(t=>SIM.eff(t,ts)>1),no=shuffle(TYPES.filter(t=>SIM.eff(t,ts)<=1));
  const c=pickOne(se),opts=shuffle([c,...no.slice(0,3)]);return {i,ts,c,types:opts,opts:opts.map(typeChip),ans:opts.indexOf(c)};}
function tqWhy(q){if(TQ.mode==='atk')return `${typeChip(q.a)} → ${typeChip(q.d)}: <b>${effLabel(q.x)}</b>.`;
  if(TQ.mode==='res'){const r=TYPES.filter(t=>SIM.eff(q.a,[t])<1);return `${T('{t} attacks are resisted by:',{t:tn(q.a)})} ${r.map(t=>`<span class="xt">${typeChip(t)}<small>${xTag(SIM.eff(q.a,[t]))}</small></span>`).join(' ')}`;}
  const w=TYPES.filter(t=>SIM.eff(t,q.ts)>1),r=TYPES.filter(t=>SIM.eff(t,q.ts)<1);
  return `${monTag(Mx[q.i].n,Mx[q.i].sid)} ${typeBars(Mx[q.i].sid)}<br>${T('Weak to:')} ${w.map(t=>`<span class="xt">${typeChip(t)}<small>${xTag(SIM.eff(t,q.ts))}</small></span>`).join(' ')}<br>${T('Resists:')} ${r.map(t=>`<span class="xt">${typeChip(t)}<small>${xTag(SIM.eff(t,q.ts))}</small></span>`).join(' ')||T('nothing')}`;}
function renderTQ(){setSeg(['tq-atk','tq-res','tq-mon'],'tq-'+TQ.mode);$('tqShowWrap').hidden=TQ.mode!=='mon';$('tqShow').checked=TQ.showT;
  if(!TQ.q)TQ.q=tqNew();const q=TQ.q;q.why=q.done?tqWhy(q):'';let p;
  if(TQ.mode==='atk')p=`<span class="qk">${T('How effective is this attack?')}</span><div class="qvs">${typeChip(q.a)}<span class="qarrow">→</span>${typeChip(q.d)}</div><small>${T('{a} attack against a {d}-type Pokémon',{a:tn(q.a),d:tn(q.d)})}</small>`;
  else if(TQ.mode==='res')p=`<span class="qk">${T('Which type resists this attack?')}</span><div class="qvs">${typeChip(q.a)}</div>`;
  else p=`<span class="qk">${T('Which attack type is super effective against it?')}</span><div class="qvs qmon">${badge(Mx[q.i].n,Mx[q.i].sid,true)}<b>${esc(dn(Mx[q.i].n))}</b>${TQ.showT||q.done?typeBars(Mx[q.i].sid):`<span class="qhid">${T('Types hidden')}</span>`}</div>`;
  $('tqOut').innerHTML=qCard('tq-'+TQ.mode,q,p)+typeRef();}
function typeRef(){return `<details class="card tref"><summary>${T('Type chart reference')}</summary><p class="lede" style="font-size:13px">${T('Rows attack, columns defend. In Pokémon GO super effective is ×1.6, not very effective ×0.625 and double resisted ×0.39.')}</p><div class="hmwrap"><table class="hm th"><thead><tr><th class="hl"></th>${TYPES.map(t=>`<th class="tt" title="${tn(t)}">${typeIcon(t)}</th>`).join('')}</tr></thead><tbody>${TYPES.map(a=>`<tr><th class="hl">${typeChip(a)}</th>${TYPES.map(d=>{const x=SIM.eff(a,[d]);return x===1?'<td class="tc"></td>':`<td class="tc" style="background:${x>1?'rgba(28,150,90,.75)':x>0.5?'rgba(206,60,60,.45)':'rgba(206,60,60,.85)'};color:#fff" title="${tn(a)} → ${tn(d)} ${xTag(x)}">${x>1?'1.6':x>0.5?'.63':'.39'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div></details>`;}
// ---- who wins
let WW={pool:'reg',sh:'0',q:null};try{const s=JSON.parse(localStorage.getItem('gl_wwm')||'{}');Object.assign(WW,s,{q:null});}catch(e){}
function wwPool(){if(WW.pool==='gbl'&&typeof GBL!=='undefined')return GBL.idx.slice(0,100).map(c=>({n:Cx[c].n,sid:Cx[c].sid,f:Cx[c].f,c:Cx[c].c}));return topMeta(40).map(i=>({n:Mx[i].n,sid:Mx[i].sid,f:Mx[i].f,c:Mx[i].c}));}
function wwNew(){const P=wwPool();for(let k=0;k<40;k++){const a=pickOne(P),b=pickOne(P);if(a.n===b.n)continue;const s=WW.sh==='mix'?rnd(3):+WW.sh;
    const A=bld(a.sid,a.f,a.c),B=bld(b.sid,b.f,b.c);const r=SIM.battle(A,B,s,s);if(Math.abs(r-500)<15&&k<39)continue;
    const all=[0,1,2].map(x=>x===s?r:SIM.battle(A,B,x,x));return {a,b,s,r,all,opts:[a,b].map(m=>`${badge(m.n,m.sid)} ${esc(dn(m.n))}`),ans:r>500?0:1};}}
function wwSide(m){return `<div class="wwside">${badge(m.n,m.sid,true)}<div><b>${esc(dn(m.n))}</b>${typeBars(m.sid)}<div class="wwmv">${[m.f,...m.c].filter(Boolean).map(mvTag).join(' · ')}</div></div></div>`;}
function renderWW(){setSeg(['wp-reg','wp-gbl'],'wp-'+WW.pool);setSeg(['ws-0','ws-1','ws-2','ws-mix'],'ws-'+WW.sh);
  if(!WW.q)WW.q=wwNew();const q=WW.q;
  const x={name:q.a.n,sid:q.a.sid,f:q.a.f,c:q.a.c},y={name:q.b.n,sid:q.b.sid,f:q.b.f,c:q.b.c};
  q.why=q.done?`<b>${esc(dn((q.r>500?q.a:q.b).n))}</b> ${T('wins at {s}–{s}',{s:q.s})}: ${esc(dn(q.a.n))} ${T('rating')} <span class="num">${q.r}</span> ${chip(tier(q.r))}.<div class="wwall">${q.all.map((r,s)=>`<span>${s}–${s}: <span class="num">${r}</span> ${chip(tier(r))}</span>`).join('')}</div><div class="wwwhy"><p><b>${esc(dn(q.a.n))}:</b> ${reasonHTML(x,y)}</p><p><b>${esc(dn(q.b.n))}:</b> ${reasonHTML(y,x)}</p><p class="wwc">${countsHTML(x)}</p><p class="wwc">${countsHTML(y)}</p></div>`:'';
  const p=`<span class="qk">${T('Who wins with {s} shield(s) each?',{s:q.s})}</span><div class="wwvs">${wwSide(q.a)}<span class="qarrow">vs</span>${wwSide(q.b)}</div>`;
  $('wwOut').innerHTML=qCard('ww-'+WW.pool+WW.sh,q,p);}
// ---- move counts
let MC={pool:'top',q:null,ref:'',shown:25,focus:''};try{const s=JSON.parse(localStorage.getItem('gl_mcm')||'{}');if(s.pool)MC.pool=s.pool;}catch(e){}
let MCD={};try{MCD=JSON.parse(localStorage.getItem('gl_mcd')||'{}')||{};}catch(e){}
const mcKey=o=>Mx[o.i].n+'|'+o.f+'|'+o.c,mcDeck=()=>MC.focus?'f:'+MC.focus:MC.pool;
function mcPairs(){const fi=MC.focus?metaIdx[MC.focus]:undefined;const idx=fi!==undefined?[fi]:MC.pool==='all'?topMeta(NM).filter(i=>Mx[i].u>0):topMeta(30);const out=[],seen=new Set();
  for(const i of idx)for(const v of Mx[i].v)for(const c of v[1]){const k=Mx[i].n+'|'+v[0]+'|'+c;if(seen.has(k)||!MV[v[0]]||!MV[c])continue;seen.add(k);out.push({i,f:v[0],c});}return out;}
const patStr=p=>p.join('-');
function mcNew(){const P=mcPairs(),done=new Set(MCD[mcDeck()]||[]);let rest=P.filter(x=>!done.has(mcKey(x)));MC.lap=false;if(!rest.length){MCD[mcDeck()]=[];rest=P;MC.lap=P.length>0;try{localStorage.setItem('gl_mcd',JSON.stringify(MCD));}catch(e){}}const o=pickOne(rest);const g=MV[o.f].energyGain,e=MV[o.c].energy;const right=patStr(countPattern(g,e,4));const cand=new Set();
  for(const de of [-10,-5,5,10,-15,15])if(e+de>0)cand.add(patStr(countPattern(g,e+de,4)));for(const dg of [-1,1,-2,2])if(g+dg>0)cand.add(patStr(countPattern(g+dg,e,4)));
  const p=countPattern(g,e,4);cand.add(p.map((x,k)=>k%2?x:x+1).join('-'));cand.add(p.map(x=>x+1).join('-'));cand.add(p.map(x=>Math.max(1,x-1)).join('-'));cand.delete(right);
  const opts=shuffle([right,...shuffle([...cand]).slice(0,3)]);return Object.assign(o,{g,e,opts,ans:opts.indexOf(right)});}
function mcSteps(g,e){let en=0;const rows=[];for(let k=0;k<4;k++){let c=0;const st=en;while(en<e){en=Math.min(100,en+g);c++;}rows.push(`<li>${T('Start with {a} energy, {c} × {g} = {b}; throw ({e}) → {l} left over',{a:st,c,g,b:en,e,l:en-e})}</li>`);en-=e;}return `<ol class="mcsteps">${rows.join('')}</ol>`;}
function renderMC(){setSeg(['mp-top','mp-all'],'mp-'+MC.pool);if(!MC.q)MC.q=mcNew();const q=MC.q,m=Mx[q.i];
  q.why=q.done?`${T('{f} gives {g} energy per use ({t} turn(s), {s}s); {c} costs {e}.',{f:mvName(q.f),g:q.g,t:MV[q.f].turns,s:(MV[q.f].turns*0.5).toFixed(1),c:mvName(q.c),e:q.e})}${mcSteps(q.g,q.e)}`:'';
  const p=`<span class="qk">${T('What are the first four fast-move counts?')}</span><div class="qvs qmon">${badge(m.n,m.sid,true)}<b>${esc(dn(m.n))}</b>${typeBars(m.sid)}</div><div class="mcq">${T('Using {f}, how many to each {c}?',{f:mvTag(q.f),c:mvTag(q.c)})}</div>`;
  const P=mcPairs(),done=new Set(MCD[mcDeck()]||[]),nd=P.filter(x=>done.has(mcKey(x))).length;
  const prog=`<div class="qprog"><span>${MC.focus?esc(dn(MC.focus))+' · ':''}${T('Movesets learned: {a} of {b}',{a:nd,b:P.length})}</span><span class="pbar"><i style="width:${P.length?(nd/P.length*100).toFixed(1):0}%"></i></span>${nd?`<button class="link" id="mcDeckReset">${T('Start over')}</button>`:''}</div>${MC.lap?`<p class="qlap">🎉 ${T('You have been through every moveset here. Starting a new round.')}</p>`:''}`;
  $('mcOut').innerHTML=prog+qCard('mc-'+MC.pool,q,p);renderMCRef();}
function renderMCRef(){const q=MC.ref.trim().toLowerCase();const idx=topMeta(NM).filter(i=>Mx[i].u>0&&(!q||Mx[i].n.toLowerCase().includes(q)||dn(Mx[i].n).toLowerCase().includes(q)));
  $('mcRef').innerHTML=idx.slice(0,MC.shown).map(i=>{const m=Mx[i];const fs=[...new Set(m.v.map(v=>v[0]))].filter(f=>MV[f]),cs=[...new Set(m.v.flatMap(v=>v[1]))].filter(c=>MV[c]);
    return `<div class="mcr"><div class="mcn">${badge(m.n,m.sid)}<b>${esc(dn(m.n))}</b>${typeBars(m.sid)}<small class="num">${T('{k} teams',{k:m.u})}</small></div><table class="mct"><thead><tr><th>${T('Fast move')}</th>${cs.map(c=>`<th>${mvTag(c)}<small class="num">${MV[c].energy}e</small></th>`).join('')}</tr></thead><tbody>${fs.map(f=>`<tr><th>${mvTag(f)}<small class="num">${MV[f].energyGain}e · ${MV[f].turns}t</small></th>${cs.map(c=>`<td class="num">${patStr(countPattern(MV[f].energyGain,MV[c].energy,4))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}).join('')+(idx.length>MC.shown?`<button class="btn ghost" id="mcMore">${T('Show more')}</button>`:'')+(idx.length?'':`<p class="empty">${T('No Pokémon match.')}</p>`);}
// ---- shared handlers
function qAnswer(k,i){const map={tq:TQ,ww:WW,mc:MC};const S=map[k.slice(0,2)];const q=S.q;if(!q||q.done)return;q.done=true;q.pick=i;qMark(k,i===q.ans);
  if(S===MC&&i===q.ans){const d=mcDeck(),L=MCD[d]||(MCD[d]=[]);const key=mcKey(q);if(!L.includes(key))L.push(key);try{localStorage.setItem('gl_mcd',JSON.stringify(MCD));}catch(e){}}}
const qRender=k=>({tq:renderTQ,ww:renderWW,mc:renderMC})[k.slice(0,2)]();
document.addEventListener('click',e=>{const o=e.target.closest('[data-qa]');if(o){const card=o.closest('.qcard');const k=card.querySelector('[data-qreset]').dataset.qreset;qAnswer(k,+o.dataset.qa);qRender(k);return;}
  const n=e.target.closest('[data-qnext]');if(n){const k=n.dataset.qnext;({tq:TQ,ww:WW,mc:MC})[k.slice(0,2)].q=null;qRender(k);return;}
  const r=e.target.closest('[data-qreset]');if(r){QS[r.dataset.qreset]={ok:0,n:0,streak:0,best:0};try{localStorage.setItem('gl_q',JSON.stringify(QS));}catch(err){}qRender(r.dataset.qreset);return;}
  if(e.target.id==='mcMore'){MC.shown+=25;renderMCRef();return;}
  if(e.target.id==='mcDeckReset'){MCD[mcDeck()]=[];try{localStorage.setItem('gl_mcd',JSON.stringify(MCD));}catch(err){}MC.q=null;renderMC();return;}
  if(e.target.id==='mcFocusClear'){MC.focus='';$('mcFocus').value='';MC.q=null;renderMC();}});
$('mcFocus').addEventListener('change',e=>{const n=fromDisp(e.target.value);MC.focus=n&&metaIdx[n]!==undefined?n:'';if(!MC.focus)e.target.value='';MC.q=null;renderMC();});
seg(['tq-atk','tq-res','tq-mon'],id=>{TQ.mode=id.slice(3);TQ.q=null;try{localStorage.setItem('gl_tqm',JSON.stringify({mode:TQ.mode,showT:TQ.showT}));}catch(e){}renderTQ();});
$('tqShow').addEventListener('change',e=>{TQ.showT=e.target.checked;try{localStorage.setItem('gl_tqm',JSON.stringify({mode:TQ.mode,showT:TQ.showT}));}catch(err){}renderTQ();});
seg(['wp-reg','wp-gbl'],id=>{WW.pool=id.slice(3);WW.q=null;try{localStorage.setItem('gl_wwm',JSON.stringify({pool:WW.pool,sh:WW.sh}));}catch(e){}renderWW();});
seg(['ws-0','ws-1','ws-2','ws-mix'],id=>{WW.sh=id.slice(3);WW.q=null;try{localStorage.setItem('gl_wwm',JSON.stringify({pool:WW.pool,sh:WW.sh}));}catch(e){}renderWW();});
seg(['mp-top','mp-all'],id=>{MC.pool=id.slice(3);MC.focus='';$('mcFocus').value='';MC.q=null;try{localStorage.setItem('gl_mcm',JSON.stringify({pool:MC.pool}));}catch(e){}renderMC();});
$('mcQ').addEventListener('input',e=>{MC.ref=e.target.value;MC.shown=25;renderMCRef();});
// ---------- build a regional team (Team Building)
// Regional team picker (event filter, Day 2 toggle, player/Pokémon search, clickable list). Used by Team Building and the Regional Team Tester.
function TeamPicker(p,onPick,isSel){const S={ev:'all',d2:false,q:'',shown:40};
  const match=t=>{if(S.ev!=='all'&&t[0]!==S.ev)return false;if(S.d2&&!t[3])return false;const q=S.q.trim().toLowerCase();if(!q)return true;
    if(t[2].toLowerCase().includes(q))return true;return t[4].some(m=>m[0].toLowerCase().includes(q)||dn(m[0]).toLowerCase().includes(q));};
  function render(){const L=$(p+'List');if(!L)return;const idx=[];DATA.T.forEach((t,i)=>{if(match(t))idx.push(i);});
    idx.sort((a,b)=>DATA.T[a][1]-DATA.T[b][1]||EVN.indexOf(DATA.T[a][0])-EVN.indexOf(DATA.T[b][0]));
    $(p+'Count').textContent=T('{k} teams',{k:idx.length});
    L.innerHTML=idx.slice(0,S.shown).map(i=>{const t=DATA.T[i];return `<button class="rtrow${isSel&&isSel(i)?' sel':''}" data-rt="${i}" aria-label="${esc(T('Load {p}\'s team',{p:t[2]}))}"><span class="rtp"><b>${esc(t[2])}</b><small>${esc(t[0])} · #${t[1]}${t[3]?' · '+T('Day 2'):''}</small></span><span class="rtm">${t[4].filter(m=>m[1]).map(m=>monTag(m[0],m[1])).join('')}</span></button>`;}).join('')
      +(idx.length>S.shown?`<button class="btn ghost rtmore" data-rtmore="1">${T('Show more')}</button>`:'')+(idx.length?'':`<p class="empty">${T('No teams match.')}</p>`);}
  $(p+'Ev').innerHTML='<option value="all">'+T('All events')+'</option>'+EVN.map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join('');
  $(p+'Ev').addEventListener('change',e=>{S.ev=e.target.value;S.shown=40;render();});
  $(p+'D2').addEventListener('change',e=>{S.d2=e.target.checked;S.shown=40;render();});
  $(p+'Q').addEventListener('input',e=>{S.q=e.target.value;S.shown=40;render();});
  $(p+'List').addEventListener('click',e=>{if(e.target.closest('[data-rtmore]')){S.shown+=40;render();return;}const b=e.target.closest('[data-rt]');if(b)onPick(+b.dataset.rt);});
  return {render,S};}
const RTP=TeamPicker('rt',i=>{const t=DATA.T[i];
  team=[0,1,2,3,4,5].map(k=>{const m=t[4][k];return m&&m[1]?mkSlot({name:m[0],f:m[2],c:m[3]}):null;});saveTeam();
  $('rtb').open=false;teamSlots.render();renderTeam();window.scrollTo({top:$('teamSlots').getBoundingClientRect().top+window.scrollY-120,behavior:RM?'auto':'smooth'});
  toast(T('Loaded {p}\'s team ({e} #{n})',{p:t[2],e:t[0],n:t[1]}));});
$('rtb').addEventListener('toggle',()=>{if($('rtb').open)RTP.render();});
const OPP=TeamPicker('op',i=>{oppIdx=TEAMS.indexOf(DATA.T[i]);if(oppIdx<0)oppIdx=i;oppMode='real';saveOpp();$('opb').open=false;renderPreviewInputs();renderPreview();
  const t=DATA.T[i];toast(T('Testing against {p} ({e} #{n})',{p:t[2],e:t[0],n:t[1]}));},i=>TEAMS[oppIdx]===DATA.T[i]);
$('opb').addEventListener('toggle',()=>{if($('opb').open){OPP.render();setTimeout(()=>{const q=$('opQ');if(q&&matchMedia('(hover:hover)').matches)q.focus();},0);}});
// init

$('teamNames').innerHTML=TEAMS.map(t=>`<option value="${esc(teamLabel(t))}">`).join('');

const subLine=()=>{$('sub').textContent=T('Great League · 2027 regionals · {n} teams · {d} Day 2 · {ev}',{n:NT,d:ND,ev:DATA.ev.map(e=>e[0]).join(', ')});};subLine();
$('aboutN').textContent=`${NT} teams in all, ${ND} of them reaching Day 2 (${pct(BASE)})`;document.querySelectorAll('#v-about [data-lang]').forEach(b=>{b.innerHTML=b.innerHTML.replace(/\{NT\}/g,NT).replace(/\{ND\}/g,ND).replace(/\{BASE\}/g,pct(BASE));});
lab=loadLab().map(mkSlot).filter(Boolean);team=loadTeam();trio=loadTrio();buildRev();fillLists();$('tdEv').innerHTML='<option value="all">'+T('All events')+'</option>'+EVN.map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join('');$('tdEv').addEventListener('change',e=>{TD.ev=e.target.value;TD.shown=60;renderTD();});$('tdD2').addEventListener('change',e=>{TD.d2=e.target.checked;TD.shown=60;renderTD();});$('tdQ').addEventListener('input',e=>{TD.q=e.target.value;TD.shown=60;renderTD();});$('tdSort').addEventListener('change',e=>{TD.sort=e.target.value;renderTD();});document.querySelectorAll('[data-lang="es"],[data-lang="ja"]').forEach(b=>{b.innerHTML=b.innerHTML.replace('{NT}',NT).replace('{ND}',ND).replace('{BASE}',pct(BASE));});OBS.observe(document.body,{childList:true,subtree:true});$('langSel').addEventListener('change',e=>setLang(e.target.value));
MOB.observe(document.body,{childList:true,subtree:true});
let start=(location.hash||'').slice(1);const fromLink=loadFromHash();if(fromLink){start=fromLink;setTimeout(()=>toast(T('Loaded a shared team')),400);}if(!VIEWS.includes(start))start='home';try{if(window.innerWidth>640)$('setDet').open=true;}catch(e){}
go(start);
setLang(LANG);
})();
