// Browser port of pipeline/simcore.py — must stay in lock-step with the Python version.
const SIM=(function(){
const W=[0.094,0.16639787,0.21573247,0.25572005,0.29024988,0.3210876,0.34921268,0.3752356,0.39956728,0.42250001,0.44310755,0.46279839,0.48168495,0.49985844,0.51739395,0.53435433,0.55079269,0.56675452,0.58227891,0.59740001,0.61215729,0.62656713,0.64065295,0.65443563,0.667934,0.68116492,0.69414365,0.70688421,0.71939909,0.7317,0.73776948,0.74378943,0.74976104,0.75568551,0.76156384,0.76739717,0.7731865,0.77893275,0.78463697,0.79030001,0.79530001,0.8003,0.8053,0.81029999,0.81529999,0.82029999,0.82529999,0.83029999,0.83529999,0.84029999,0.84529999];
function cpm(l){const i=Math.floor(l);if(l===i)return W[i-1];return Math.sqrt((W[i-1]**2+W[i]**2)/2);}
const SE={normal:{rock:.625,ghost:.390625,steel:.625},fighting:{normal:1.6,flying:.625,poison:.625,rock:1.6,bug:.625,ghost:.390625,steel:1.6,psychic:.625,ice:1.6,dark:1.6,fairy:.625},flying:{fighting:1.6,rock:.625,bug:1.6,steel:.625,grass:1.6,electric:.625},poison:{poison:.625,ground:.625,rock:.625,ghost:.625,steel:.390625,grass:1.6,fairy:1.6},ground:{flying:.390625,poison:1.6,rock:1.6,bug:.625,steel:1.6,fire:1.6,grass:.625,electric:1.6},rock:{fighting:.625,flying:1.6,ground:.625,bug:1.6,steel:.625,fire:1.6,ice:1.6},bug:{fighting:.625,flying:.625,poison:.625,ghost:.625,steel:.625,fire:.625,grass:1.6,psychic:1.6,dark:1.6,fairy:.625},ghost:{normal:.390625,ghost:1.6,psychic:1.6,dark:.625},steel:{rock:1.6,steel:.625,fire:.625,water:.625,electric:.625,ice:1.6,fairy:1.6},fire:{rock:.625,bug:1.6,steel:1.6,fire:.625,water:.625,grass:1.6,ice:1.6,dragon:.625},water:{ground:1.6,rock:1.6,fire:1.6,water:.625,grass:.625,dragon:.625},grass:{flying:.625,poison:.625,ground:1.6,rock:1.6,bug:.625,steel:.625,fire:.625,water:1.6,grass:.625,dragon:.625},electric:{flying:1.6,ground:.390625,water:1.6,grass:.625,electric:.625,dragon:.625},psychic:{fighting:1.6,poison:1.6,steel:.625,psychic:.625,dark:.390625},ice:{flying:1.6,ground:1.6,steel:.625,fire:.625,water:.625,grass:1.6,ice:.625,dragon:1.6},dragon:{steel:.625,dragon:1.6,fairy:.390625},dark:{fighting:.625,ghost:1.6,psychic:1.6,dark:.625,fairy:.625},fairy:{fighting:1.6,poison:.625,steel:.625,fire:.625,dragon:1.6,dark:1.6}};
function eff(mt,types){let e=1.0;for(const t of types){if(t&&t!=='none')e*=(SE[mt][t]||1.0);}return e;}
let SP=null,MV=null;
function init(species,moves){SP=species;MV=moves;}
// species entry: {id,n,b:[atk,def,hp],t:[...],iv:[l,a,d,s],sh:bool,f:[...],c:[...]}
function build(sid,fast,charged,ivs){const p=SP[sid];const [l,a,d,s]=ivs||p.iv;const c=cpm(l);
  const b={sid,name:p.n,types:p.t.filter(x=>x!=='none'),atk:(p.b[0]+a)*c*(p.sh?1.2:1),df:(p.b[1]+d)*c*(p.sh?5/6:1),hp:Math.max(10,Math.floor((p.b[2]+s)*c)),fast:MV[fast],ch:charged.filter(Boolean).map(x=>MV[x]),alt:null};
  if(p.alt&&SP[p.alt]){const q=SP[p.alt];const af=fast.replace('AEGISLASH_CHARGE_','');const altfast=MV[af]?af:fast;
    b.alt={sid:p.alt,name:p.n,types:q.t.filter(x=>x!=='none'),atk:(q.b[0]+a)*c*(p.sh?1.2:1),df:(q.b[1]+d)*c*(p.sh?5/6:1),hp:b.hp,fast:MV[altfast],ch:b.ch,alt:b};}
  return b;}
function selfdebuff(mv){const b=mv.buffs;return !!b&&(mv.buffTarget||'self')==='self'&&parseFloat(mv.buffApplyChance==null?1:mv.buffApplyChance)>=1&&(b[0]<0||b[1]<0);}
function dmg(att,dfn,mv,ab,db){ab=ab||0;db=db||0;const stab=att.types.includes(mv.type)?1.2:1.0;
  const am=ab>=0?(4+ab)/4:4/(4-ab),dm=db>=0?(4+db)/4:4/(4-db);
  return Math.floor(0.5*1.3*mv.power*(att.atk*am)/(dfn.df*dm)*stab*eff(mv.type,dfn.types))+1;}
function buff(mv,me,op,st){const b=mv.buffs;if(!b)return;const ch=parseFloat(mv.buffApplyChance==null?1:mv.buffApplyChance);if(ch<1)return;
  const tg=(mv.buffTarget||'self')==='self'?st[me]:st[op];tg[0]=Math.max(-4,Math.min(4,tg[0]+b[0]));tg[1]=Math.max(-4,Math.min(4,tg[1]+b[1]));}
function minBy(arr,f){let b=null,bv=Infinity;for(const x of arr){const v=f(x);if(v<bv){bv=v;b=x;}}return b;}
function maxBy(arr,f){let b=null,bv=-Infinity;for(const x of arr){const v=f(x);if(v>bv){bv=v;b=x;}}return b;}
// run(): the battle engine. o = {sh:[s0,s1], turns, hp:[h0,h1] (starting HP), en:[e0,e1] (starting energy),
// st:[[atk,def],[atk,def]] (starting stat stages), bait:[bool,bool] (bait shields with the cheaper move), log:[] (events)}.
// With only sh/turns set it is exactly the engine the rest of the site uses.
function run(A,B,o){const turns=o.turns||480;const M=[A,B],hp=o.hp?o.hp.slice():[A.hp,B.hp],en=o.en?o.en.slice():[0,0],sh=o.sh.slice(),cd=[0,0],pend=[false,false],
  st=o.st?[o.st[0].slice(),o.st[1].slice()]:[[0,0],[0,0]],bait=o.bait||[true,true],L=o.log||null;
  const best=M.map((X,i)=>{const Y=M[1-i];if(!X.ch.length)return null;return X.ch.map((m,k)=>[m,-(dmg(X,Y,m)/m.energy),k]).sort((a,b)=>a[1]-b[1]||a[2]-b[2])[0][0];});
  const cheap=M.map(X=>X.ch.length?minBy(X.ch,m=>m.energy):null);
  for(let i=0;i<2;i++){if(cheap[i]&&selfdebuff(cheap[i])){const alt=M[i].ch.filter(m=>!selfdebuff(m));if(alt.length)cheap[i]=minBy(alt,m=>m.energy);}}
  let t=0;
  for(t=0;t<turns;t++){const acts=[null,null];
    for(let i=0;i<2;i++){if(cd[i]>0)continue;const X=M[i],Y=M[1-i],j=1-i;const aff=X.ch.filter(m=>m.energy<=en[i]);let act=null;
      if(aff.length){const kos=aff.filter(m=>sh[j]===0&&dmg(X,Y,m,st[i][0],st[j][1])>=hp[j]);
        if(kos.length)act=minBy(kos,m=>m.energy);
        else if(sh[j]>0&&bait[i])act=aff.includes(cheap[i])?cheap[i]:null;
        else if(aff.includes(best[i]))act=best[i];
        else{const Yf=dmg(Y,X,Y.fast,st[j][0],st[i][1]);const yaff=Y.ch.filter(m=>m.energy<=en[j]+Y.fast.energyGain);
          const threat=sh[i]===0?Math.max(0,...yaff.map(m=>dmg(Y,X,m,st[j][0],st[i][1]))):0;
          if(hp[i]<=Yf*1||threat>=hp[i])act=maxBy(aff,m=>dmg(X,Y,m,st[i][0],st[j][1]));}}
      acts[i]=act;}
    // As in PvPoke: equal Attack means no charged move priority, so both charged moves land (mirrors tie at 500)
    const order=A.atk>=B.atk?[0,1]:[1,0],prio=A.atk!==B.atk;
    for(const i of order){const m=acts[i];if(!m||!m.energy)continue;if(hp[i]<=0&&prio)continue;const j=1-i;en[i]-=m.energy;
      if(M[i].alt&&M[i].sid.endsWith('_shield')){M[i]=M[i].alt;if(L)L.push({t,i,k:'form',form:M[i].sid});}
      let d=dmg(M[i],M[j],m,st[i][0],st[j][1]),sd=false;if(sh[j]>0){sh[j]-=1;d=1;sd=true;if(M[j].alt&&M[j].sid.endsWith('_blade')){M[j]=M[j].alt;if(L)L.push({t,i:j,k:'form',form:M[j].sid});}}hp[j]-=d;buff(m,i,j,st);
      if(L)L.push({t,i,k:'charged',m:m.moveId,d,sd,hp:[hp[0],hp[1]],en:[en[0],en[1]],sh:[sh[0],sh[1]],st:[st[0].slice(),st[1].slice()]});}
    if(hp[0]<=0||hp[1]<=0)break;
    for(let i=0;i<2;i++){if(cd[i]===0&&acts[i]===null){cd[i]=M[i].fast.turns!=null?M[i].fast.turns:Math.max(1,Math.floor(M[i].fast.cooldown/500));pend[i]=true;}}
    for(let i=0;i<2;i++){if(cd[i]>0){cd[i]-=1;if(cd[i]===0&&pend[i]){const j=1-i;const d=dmg(M[i],M[j],M[i].fast,st[i][0],st[j][1]);hp[j]-=d;en[i]=Math.min(100,en[i]+M[i].fast.energyGain);pend[i]=false;
          if(L)L.push({t,i,k:'fast',m:M[i].fast.moveId,d,hp:[hp[0],hp[1]],en:[en[0],en[1]]});}}}
    if(hp[0]<=0||hp[1]<=0)break;}
  const h0=Math.max(0,hp[0]),h1=Math.max(0,hp[1]);
  const r=[Math.floor(500*(B.hp-h1)/B.hp+500*h0/A.hp),Math.floor(500*(A.hp-h0)/A.hp+500*h1/B.hp)];
  return {rating:r[0],ratings:r,hp:[h0,h1],en:[en[0],en[1]],sh:[sh[0],sh[1]],turns:t};}
function battle(A,B,s0,s1,turns){return run(A,B,{sh:[s0,s1],turns}).rating;}
return {init,build,battle,run,eff,dmg,cpm};
})();
if(typeof module!=='undefined')module.exports=SIM;
