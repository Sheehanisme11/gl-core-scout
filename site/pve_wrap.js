// PvPoke battle engine, wrapped for GL Core Scout.
// The code between the markers below is PvPoke's own source (https://github.com/pvpoke/pvpoke, see vendor/pvpoke/README.txt),
// used under the MIT License:
//   MIT License. Copyright (c) 2019 pvpoke.
//   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
//   files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
//   modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
//   is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be
//   included in all copies or substantial portions of the Software.
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
//   OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
//   LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
//   CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// The only change to PvPoke's code: timeline.push(...) runs only when a battle log is requested (the timeline is display-only).
var PVE=(function(){
var console={log:function(){},warn:function(){},error:function(){},info:function(){}};
var __pend=[],__TL=false;
function __jq(){var f=function(){return p;};var p=new Proxy(f,{get:function(t,k){if(k==='length')return 0;if(k===Symbol.iterator)return function*(){};if(k==='then')return undefined;return function(){return p;};},apply:function(){return p;}});return p;}
var $=function(){return __jq();};$.ajax=function(o){__pend.push(o);};$.each=function(a,f){for(var k in a)f(k,a[k]);};$.extend=Object.assign;var jQuery=$;
var host='https://pvpoke.com/',webRoot='',siteVersion='1',settings={gamemaster:'gamemaster'};
var InterfaceMaster={getInstance:function(){return {init:function(){}};},getInterface:function(){return null;}};
var window={location:{href:''},localStorage:{getItem:function(){return null;},setItem:function(){}}};
var document={};
/* ---------- PvPoke source begins ---------- */
/*__PVPOKE_SOURCE__*/
/* ---------- PvPoke source ends ---------- */
var __gm=null,__battle=null,__cache=new Map(),__names={},__moves={};
function init(data){__gm=GameMaster.getInstance();while(__pend.length)__pend.shift().success(data);
  __battle=new Battle();__battle.setCP(1500);__battle.setLevelCap(51);
  data.moves.forEach(function(m){__names[m.name]=m.moveId;__moves[m.moveId]=m;});}
// spec: [speciesId, fastMoveId, [chargedMoveIds], [level, atkIV, defIV, hpIV]]
function poke(s,i){var k=i+'|'+s[0]+'|'+s[1]+'|'+s[2].join(',')+'|'+s[3].join(',');var p=__cache.get(k);
  if(p){__cache.delete(k);__cache.set(k,p);return p;}
  p=new Pokemon(s[0],i,__battle);p.initialize(1500);p.setLevel(s[3][0]);p.setIV('atk',s[3][1]);p.setIV('def',s[3][2]);p.setIV('hp',s[3][3]);
  p.selectMove('fast',s[1]);p.selectMove('charged',s[2][0]||'none',0);p.selectMove('charged',s[2][1]||'none',1);
  __cache.set(k,p);if(__cache.size>3000)__cache.delete(__cache.keys().next().value);return p;}
// o: {sh:[s0,s1], hp:[startHp0,startHp1], en:[e0,e1], st:[[atk,def],[atk,def]], bait:[bool,bool], log:true}
function run(A,B,o){o=o||{};var P=[poke(A,0),poke(B,1)];__battle.setNewPokemon(P[0],0,false);__battle.setNewPokemon(P[1],1,false);
  for(var i=0;i<2;i++){var p=P[i];p.setShields(o.sh?o.sh[i]:1);p.startHp=o.hp?Math.max(1,Math.min(o.hp[i],p.stats.hp)):p.stats.hp;p.startEnergy=o.en?Math.min(100,o.en[i]||0):0;
    p.startCooldown=0;p.startStatBuffs=o.st?[o.st[i][0],o.st[i][1]]:[0,0];p.baitShields=o.bait?(o.bait[i]?1:0):1;}
  __TL=!!o.log;__battle.simulate();__TL=false;
  var h=[Math.max(0,P[0].hp),Math.max(0,P[1].hp)],r=[Math.floor(((h[0]/P[0].stats.hp)+((P[1].stats.hp-h[1])/P[1].stats.hp))*500),Math.floor(((h[1]/P[1].stats.hp)+((P[0].stats.hp-h[0])/P[0].stats.hp))*500)];
  var res={rating:r[0],ratings:r,hp:h,en:[P[0].energy,P[1].energy],sh:[P[0].shields,P[1].shields],turns:__battle.getTurns(),maxhp:[P[0].stats.hp,P[1].stats.hp]};
  if(o.log){var tl=__battle.getTimeline(),log=[],hp=[P[0].startHp,P[1].startHp],en=[P[0].startEnergy,P[1].startEnergy],shp=[false,false];
    for(var k=0;k<tl.length;k++){var e=tl[k],t=e.type||'';
      if(t==='shield'){shp[e.actor]=true;continue;}
      var m=/^(fast|charged) /.exec(t);if(!m)continue;var mid=__names[e.name]||e.name,d=+(e.values&&e.values[0])||0,j=1-e.actor;
      if(m[1]==='fast'){hp[j]-=d;en[e.actor]=Math.min(100,en[e.actor]+((__moves[mid]&&__moves[mid].energyGain)||0));log.push({t:e.turn,i:e.actor,k:'fast',m:mid,d:d,hp:[hp[0],hp[1]],en:[en[0],en[1]]});}
      else{var sd=shp[j];shp[j]=false;hp[j]-=d;en[e.actor]-=(__moves[mid]&&__moves[mid].energy)||0;log.push({t:e.turn,i:e.actor,k:'charged',m:mid,d:d,sd:sd,hp:[hp[0],hp[1]],en:[en[0],en[1]]});}}
    res.log=log;}
  return res;}
function battle(A,B,s0,s1){return run(A,B,{sh:[s0,s1]}).rating;}
function clear(){__cache.clear();}
// ---- detailed battle for the timeline, playback and PvPoke's Sandbox Mode (its own Battle instance, never cached)
// o: as run() plus actions: null (automatic battle) or [{type:'charged'|'wait', actor, turn, value, shielded, buffs, charge}]
// Returns run()'s fields plus ev (every timeline event), actions (the battle as editable actions, as PvPoke's Sandbox Mode
// creates them), and link (the same battle on pvpoke.com).
var CHARGE=[1,.95,.75,.5,.25];
function mk(s,i,b){var p=new Pokemon(s[0],i,b);p.initialize(1500);p.setLevel(s[3][0]);p.setIV('atk',s[3][1]);p.setIV('def',s[3][2]);p.setIV('hp',s[3][3]);
  p.selectMove('fast',s[1]);p.selectMove('charged',s[2][0]||'none',0);p.selectMove('charged',s[2][1]||'none',1);return p;}
function detail(A,B,o){o=o||{};var bt=new Battle(),sand=!!o.actions;bt.setCP(1500);bt.setLevelCap(51); // a fresh Battle each time: Sandbox Mode changes battle-wide settings
  var P=[mk(A,0,bt),mk(B,1,bt)];bt.setNewPokemon(P[0],0,false);bt.setNewPokemon(P[1],1,false);
  for(var i=0;i<2;i++){var p=P[i];p.setShields(o.sh?o.sh[i]:1);p.startHp=o.hp?Math.max(1,Math.min(o.hp[i],p.stats.hp)):p.stats.hp;p.startEnergy=o.en?Math.min(100,o.en[i]||0):0;
    p.startCooldown=0;p.startStatBuffs=o.st?[o.st[i][0],o.st[i][1]]:[0,0];p.baitShields=o.bait?(o.bait[i]?1:0):1;}
  __TL=true;
  if(sand){bt.setSandboxMode(true);bt.setActions(o.actions.map(function(a){return new TimelineAction(a.type,a.actor,a.turn,a.value,a.type==='charged'?{shielded:!!a.shielded,buffs:!!a.buffs,charge:a.charge||1,priority:P[a.actor].priority}:{});}));}
  bt.simulate();var tl=bt.getTimeline().slice();__TL=false;
  var h=[Math.max(0,P[0].hp),Math.max(0,P[1].hp)],r=[P[0].getBattleRating(),P[1].getBattleRating()];
  var res={rating:r[0],ratings:r,hp:h,en:[P[0].energy,P[1].energy],sh:[P[0].shields,P[1].shields],turns:bt.getTurns(),maxhp:[P[0].stats.hp,P[1].stats.hp],start:{hp:[P[0].startHp,P[1].startHp],en:[P[0].startEnergy,P[1].startEnergy],sh:[P[0].startingShields,P[1].startingShields]}};
  var ev=[],shp=[false,false];
  for(var k=0;k<tl.length;k++){var e=tl[k],t=e.type||'',v=e.values||[];
    if(t==='tap interaction'||t==='tap interaction wait'){ev.push({k:t==='tap interaction'?'tap':'wait',i:e.actor,t:e.turn});continue;}
    if(t==='shield'){shp[e.actor]=true;ev.push({k:'shield',i:e.actor,t:e.turn});continue;}
    if(t==='faint'){ev.push({k:'faint',i:e.actor,t:e.turn});continue;}
    var m=/^(fast|charged) /.exec(t);if(!m)continue;var mid=__names[e.name]||e.name,j=1-e.actor;
    var x={k:m[1],i:e.actor,t:e.turn,m:mid,d:+v[0]||0,e:+v[1]||0,p:+v[2]||0};
    for(var q=3;q<v.length;q++){if(v[q]==='Form Change')x.form=true;else if(typeof v[q]==='string'&&v[q])x.buff=v[q];}
    if(m[1]==='charged'){x.sd=shp[j];shp[j]=false;x.edit=e.editable!==false;}
    ev.push(x);}
  res.ev=ev;
  // the battle as editable actions (what PvPoke's Sandbox Mode starts from), with any invalid user actions dropped
  var acts=sand?bt.getActions():bt.convertTimelineToActions();
  res.actions=acts.filter(function(a){return a.type==='charged'||a.type==='wait';}).map(function(a){var s=a.settings||{};return a.type==='charged'?{type:'charged',actor:a.actor,turn:a.turn,value:a.value,shielded:!!s.shielded,buffs:!!s.buffs,charge:s.charge||1,valid:sand?!!a.valid:true}:{type:'wait',actor:a.actor,turn:a.turn,value:0,valid:sand?!!a.valid:true};});
  // pvpoke.com link for this exact battle (and Sandbox Mode actions)
  try{var ps=P.map(function(p){return p.generateURLPokeStr();}),ms=P.map(function(p){return p.generateURLMoveStr();});
    var cap=o.cap&&o.cap!==50?'1500-'+o.cap:'1500';var L='battle/'+(sand?'sandbox/':'')+cap+'/'+ps[0]+'/'+ps[1]+'/'+P[0].startingShields+P[1].startingShields+'/'+ms[0]+'/'+ms[1]+'/';
    if(P[0].startHp!==P[0].stats.hp||P[1].startHp!==P[1].stats.hp||P[0].startEnergy||P[1].startEnergy)L+=P[0].startHp+'-'+P[1].startHp+'/'+P[0].startEnergy+'-'+P[1].startEnergy+'/';
    if(sand){var as=res.actions.filter(function(a){return a.valid;}).map(function(a){return a.turn+'.'+(a.type==='charged'?1:2)+a.actor+a.value+(a.shielded?1:0)+(a.buffs?1:0)+Math.max(0,CHARGE.indexOf(a.charge||1));}).join('-');L+=(as||'0')+'/';}
    res.link='https://pvpoke.com/'+L;}catch(err){res.link=null;}
  return res;}
return {init:init,run:run,battle:battle,clear:clear,detail:detail};
})();
if(typeof module!=='undefined')module.exports=PVE;
