// Check the kit's battle engine (PvPoke's own, site/pve.js) against PvPoke matrix exports in inputs/ (top_75_vs_*.csv).
// Files without a suffix are 0-0 shields, _1_ = 1-1, _2_ = 2-2.  Run: node tools/calibrate_pve.js
const fs=require('fs'),path=require('path');const HERE=path.join(__dirname,'..');const cfg=JSON.parse(fs.readFileSync(path.join(HERE,'config.json')));
const inp=path.join(HERE,cfg.inputs),gm=JSON.parse(fs.readFileSync(path.join(inp,cfg.gamemaster)));const PVE=require(path.join(HERE,'site','pve.js'));PVE.init(gm);
const MV={};gm.moves.forEach(m=>MV[m.moveId]=m);const BYNAME={};gm.pokemon.forEach(p=>{if(!BYNAME[p.speciesName])BYNAME[p.speciesName]=p;});
const abI=id=>MV[id].abbreviation||id.split('_').filter(Boolean).map(w=>w[0]).join(''),abN=id=>MV[id].abbreviation||MV[id].name.split(/[ \-()]+/).filter(Boolean).map(w=>w[0].toUpperCase()).join('');
const W=[0.094,0.16639787,0.21573247,0.25572005,0.29024988,0.3210876,0.34921268,0.3752356,0.39956728,0.42250001,0.44310755,0.46279839,0.48168495,0.49985844,0.51739395,0.53435433,0.55079269,0.56675452,0.58227891,0.59740001,0.61215729,0.62656713,0.64065295,0.65443563,0.667934,0.68116492,0.69414365,0.70688421,0.71939909,0.7317,0.73776948,0.74378943,0.74976104,0.75568551,0.76156384,0.76739717,0.7731865,0.77893275,0.78463697,0.79030001,0.79530001,0.8003,0.8053,0.81029999,0.81529999,0.82029999,0.82529999,0.83029999,0.83529999,0.84029999,0.84529999];
const cpm=l=>{const i=Math.floor(l);return l===i?W[i-1]:Math.sqrt((W[i-1]**2+W[i]**2)/2);};
const cp=(p,l,a,d,s)=>Math.max(10,Math.floor((p.baseStats.atk+a)*Math.sqrt(p.baseStats.def+d)*Math.sqrt(p.baseStats.hp+s)*cpm(l)**2/10));
const cache={};function parse(label){if(label in cache)return cache[label];const m=label.match(/^(.+?) (\S+)\+(\S+?)(?:\/(\S+))? (\d+)\/(\d+)\/(\d+)$/);if(!m)return cache[label]=null;const p=BYNAME[m[1]];if(!p)return cache[label]=null;
  const find=(ab,pool)=>pool.find(x=>MV[x]&&abI(x)===ab)||pool.find(x=>MV[x]&&abN(x)===ab);const ch=p.chargedMoves.concat(p.eliteMoves||[]);
  const f=find(m[2],p.fastMoves),c=[m[3],m[4]].filter(Boolean).map(a=>find(a,ch));const a=+m[5],d=+m[6],s=+m[7];let lv=1;for(let l=1;l<=50;l+=0.5)if(cp(p,l,a,d,s)<=1500)lv=l;
  if(!f||c.some(x=>!x))return cache[label]=null;return cache[label]=[p.speciesId,f,c,[lv,a,d,s]];}
for(const f of fs.readdirSync(inp).filter(f=>/^top_.*\.csv$/.test(f)).sort()){const s=f.endsWith('_2_.csv')?2:f.endsWith('_1_.csv')?1:0;
  const rows=fs.readFileSync(path.join(inp,f),'utf8').split(/\r?\n/).filter(Boolean).map(l=>l.split(','));const cols=rows[0].slice(1);let n=0,exact=0,win=0;
  for(const r of rows.slice(1)){const A=parse(r[0]);if(!A)continue;cols.forEach((c,j)=>{const B=parse(c),v=+r[1+j];if(!B||isNaN(v))return;const o=PVE.battle(A,B,s,s);n++;if(o===v)exact++;if((o>500)===(v>500)&&(o<500)===(v<500))win++;});}
  console.log(`${f}  ${s}-${s} shields: ${(100*exact/n).toFixed(1)}% identical ratings, ${(100*win/n).toFixed(1)}% same result (${n} matchups)`);}
