// Battle every A spec against every B spec at 0, 1 and 2 shields with PvPoke's engine (site/pve.js), using all CPU cores.
// Usage: node pve_matrix.js job.json out.bin   job = {gamemaster, A:[[sid,fast,[charged]]...], B:[...]}   out = Int16 [nA][nB][3]
const {Worker,isMainThread,parentPort,workerData}=require('worker_threads');const fs=require('fs'),path=require('path'),os=require('os');
const PVE_PATH=path.join(__dirname,'..','site','pve.js');
function withIVs(gm,specs){const P={};gm.pokemon.forEach(p=>P[p.speciesId]=p);return specs.map(s=>[s[0],s[1],s[2],(s[3]||P[s[0]].defaultIVs.cp1500).slice()]);}
if(isMainThread){
  const job=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),gm=JSON.parse(fs.readFileSync(job.gamemaster,'utf8'));
  const A=withIVs(gm,job.A),B=withIVs(gm,job.B),n=Math.max(1,Math.min(os.cpus().length,+(process.argv[4]||99)));
  const out=new Int16Array(A.length*B.length*3);let next=0,done=0,live=n;const chunk=Math.max(1,Math.ceil(2000/(B.length*3)));const t0=Date.now();let lastLog=0;
  for(let w=0;w<n;w++){const wk=new Worker(__filename,{workerData:{gamemaster:job.gamemaster,B}});
    const give=()=>{if(next>=A.length){wk.postMessage(null);return;}const r0=next,r1=Math.min(A.length,r0+chunk);next=r1;wk.postMessage({r0,A:A.slice(r0,r1)});};
    wk.on('message',m=>{out.set(m.out,m.r0*B.length*3);done+=m.n;const now=Date.now();if(now-lastLog>15000){lastLog=now;console.log(`   ${done}/${A.length} rows (${((now-t0)/1000).toFixed(0)}s)`);}give();});
    wk.on('exit',()=>{if(--live===0){fs.writeFileSync(process.argv[3],Buffer.from(out.buffer));}});give();}
}else{
  const PVE=require(PVE_PATH),gm=JSON.parse(fs.readFileSync(workerData.gamemaster,'utf8'));PVE.init(gm);const B=workerData.B;
  parentPort.on('message',m=>{if(!m){process.exit(0);}const o=new Int16Array(m.A.length*B.length*3);let k=0;
    for(const a of m.A)for(const b of B)for(let s=0;s<3;s++)o[k++]=PVE.battle(a,b,s,s);parentPort.postMessage({r0:m.r0,n:m.A.length,out:o},[o.buffer]);});}
