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
return {init:init,run:run,battle:battle,clear:clear};
})();
if(typeof module!=='undefined')module.exports=PVE;
