import json, math, re
import os
GM=json.load(open(os.environ.get('GL_GAMEMASTER','gamemaster.json'),encoding='utf-8'))
P={p['speciesId']:p for p in GM['pokemon']}
BYNAME={}
for p in GM['pokemon']: BYNAME.setdefault(p['speciesName'],p)
MV={m['moveId']:m for m in GM['moves']}
MVNAME={m['name']:m for m in GM['moves']}
W=[0.094,0.16639787,0.21573247,0.25572005,0.29024988,0.3210876,0.34921268,0.3752356,0.39956728,0.42250001,0.44310755,0.46279839,0.48168495,0.49985844,0.51739395,0.53435433,0.55079269,0.56675452,0.58227891,0.59740001,0.61215729,0.62656713,0.64065295,0.65443563,0.667934,0.68116492,0.69414365,0.70688421,0.71939909,0.7317,0.73776948,0.74378943,0.74976104,0.75568551,0.76156384,0.76739717,0.7731865,0.77893275,0.78463697,0.79030001,0.79530001,0.8003,0.8053,0.81029999,0.81529999,0.82029999,0.82529999,0.83029999,0.83529999,0.84029999,0.84529999]
def cpm(l):
    i=int(l)
    if l==i: return W[i-1]
    return math.sqrt((W[i-1]**2+W[i]**2)/2)
TYPES=['normal','fighting','flying','poison','ground','rock','bug','ghost','steel','fire','water','grass','electric','psychic','ice','dragon','dark','fairy']
SE={'normal':{'rock':.625,'ghost':.390625,'steel':.625},
'fighting':{'normal':1.6,'flying':.625,'poison':.625,'rock':1.6,'bug':.625,'ghost':.390625,'steel':1.6,'psychic':.625,'ice':1.6,'dark':1.6,'fairy':.625},
'flying':{'fighting':1.6,'rock':.625,'bug':1.6,'steel':.625,'grass':1.6,'electric':.625},
'poison':{'poison':.625,'ground':.625,'rock':.625,'ghost':.625,'steel':.390625,'grass':1.6,'fairy':1.6},
'ground':{'flying':.390625,'poison':1.6,'rock':1.6,'bug':.625,'steel':1.6,'fire':1.6,'grass':.625,'electric':1.6},
'rock':{'fighting':.625,'flying':1.6,'ground':.625,'bug':1.6,'steel':.625,'fire':1.6,'ice':1.6},
'bug':{'fighting':.625,'flying':.625,'poison':.625,'ghost':.625,'steel':.625,'fire':.625,'grass':1.6,'psychic':1.6,'dark':1.6,'fairy':.625},
'ghost':{'normal':.390625,'ghost':1.6,'psychic':1.6,'dark':.625},
'steel':{'rock':1.6,'steel':.625,'fire':.625,'water':.625,'electric':.625,'ice':1.6,'fairy':1.6},
'fire':{'rock':.625,'bug':1.6,'steel':1.6,'fire':.625,'water':.625,'grass':1.6,'ice':1.6,'dragon':.625},
'water':{'ground':1.6,'rock':1.6,'fire':1.6,'water':.625,'grass':.625,'dragon':.625},
'grass':{'flying':.625,'poison':.625,'ground':1.6,'rock':1.6,'bug':.625,'steel':.625,'fire':.625,'water':1.6,'grass':.625,'dragon':.625},
'electric':{'flying':1.6,'ground':.390625,'water':1.6,'grass':.625,'electric':.625,'dragon':.625},
'psychic':{'fighting':1.6,'poison':1.6,'steel':.625,'psychic':.625,'dark':.390625},
'ice':{'flying':1.6,'ground':1.6,'steel':.625,'fire':.625,'water':.625,'grass':1.6,'ice':.625,'dragon':1.6},
'dragon':{'steel':.625,'dragon':1.6,'fairy':.390625},
'dark':{'fighting':.625,'ghost':1.6,'psychic':1.6,'dark':.625,'fairy':.625},
'fairy':{'fighting':1.6,'poison':.625,'steel':.625,'fire':.625,'dragon':1.6,'dark':1.6}}
def eff(mt,types):
    e=1.0
    for t in types:
        if t and t!='none': e*=SE[mt].get(t,1.0)
    return e
def cp_of(p,l,a,d,s):
    c=cpm(l); b=p['baseStats']
    return max(10,int((b['atk']+a)*math.sqrt(b['def']+d)*math.sqrt(b['hp']+s)*c*c/10))
class Build:
    __slots__=('sid','name','types','atk','df','hp','fast','ch','shadow','label','alt')
    def __init__(self,sid,fast,charged,ivs=None,label=None):
        p=P[sid]; self.sid=sid; self.name=p['speciesName']; self.types=[t for t in p['types'] if t!='none']
        l,a,d,s=ivs or p['defaultIVs']['cp1500']
        c=cpm(l); b=p['baseStats']
        self.shadow='shadow' in (p.get('tags') or []) or sid.endswith('_shadow')
        self.atk=(b['atk']+a)*c*(1.2 if self.shadow else 1)
        self.df=(b['def']+d)*c*(5/6 if self.shadow else 1)
        self.hp=max(10,int((b['hp']+s)*c))
        self.fast=MV[fast]; self.ch=[MV[x] for x in charged if x]
        self.label=label or self.name
        self.alt=None
        fc=p.get('formChange')
        if fc and fc.get('trigger')=='activate_charged' and fc.get('alternativeFormId') in P:
            q=P[fc['alternativeFormId']]; qb=q['baseStats']
            altfast=fast.replace('AEGISLASH_CHARGE_','') if fast.replace('AEGISLASH_CHARGE_','') in MV else fast
            o=Build.__new__(Build); o.sid=q['speciesId']; o.name=self.name; o.types=[t for t in q['types'] if t!='none']
            o.atk=(qb['atk']+a)*c*(1.2 if self.shadow else 1); o.df=(qb['def']+d)*c*(5/6 if self.shadow else 1); o.hp=self.hp
            o.fast=MV[altfast]; o.ch=self.ch; o.shadow=self.shadow; o.label=self.label; o.alt=self
            self.alt=o
def dmg(att,dfn,mv,ab=0,db=0):
    stab=1.2 if mv['type'] in att.types else 1.0
    am=(4+ab)/4 if ab>=0 else 4/(4-ab); dm=(4+db)/4 if db>=0 else 4/(4-db)
    return int(0.5*1.3*mv['power']*(att.atk*am)/(dfn.df*dm)*stab*eff(mv['type'],dfn.types))+1

def selfdebuff(mv):
    b=mv.get('buffs'); return bool(b) and mv.get('buffTarget','self')=='self' and float(mv.get('buffApplyChance',1))>=1 and (b[0]<0 or b[1]<0)
def _buff(mv,me,op,st,o=None):
    if o is not None and not o.get('buffs',True): return
    b=mv.get('buffs')
    if not b: return
    ch=float(mv.get('buffApplyChance',1))
    if ch<1: return
    tgt=st[me] if mv.get('buffTarget','self')=='self' else st[op]
    tgt[0]=max(-4,min(4,tgt[0]+b[0])); tgt[1]=max(-4,min(4,tgt[1]+b[1]))
OPT={'shield':'always','bait':True,'thr':0.0,'aegis':True,'buffs':True,'nodebuffbait':True,'dmul':1}
def battle(A,B,shields=(1,1),turns=480,opt=None):
    o=opt or OPT
    M=[A,B]; hp=[A.hp,B.hp]; en=[0,0]; sh=list(shields); cd=[0,0]; pend=[None,None]
    st=[[0,0],[0,0]]
    best=[]
    for i,X in enumerate(M):
        Y=M[1-i]
        dpe=sorted(X.ch,key=(lambda m:-dmg(X,Y,m)) if o.get('bestdmg') else (lambda m:-(dmg(X,Y,m)/m['energy'])))
        best.append(dpe[0] if dpe else None)
    cheap=[min(X.ch,key=lambda m:m['energy']) if X.ch else None for X in M]
    if o.get('nodebuffbait'):
        for i,X in enumerate(M):
            if cheap[i] is not None and selfdebuff(cheap[i]):
                alt=[m for m in X.ch if not selfdebuff(m)]
                if alt: cheap[i]=min(alt,key=lambda m:m['energy'])
    for t in range(turns):
        acts=[None,None]
        for i in (0,1):
            if cd[i]>0: continue
            X,Y=M[i],M[1-i]; j=1-i
            aff=[m for m in X.ch if m['energy']<=en[i]]
            act=None
            if aff:
                kos=[m for m in aff if sh[j]==0 and dmg(X,Y,m,st[i][0],st[j][1])>=hp[j]]
                if kos: act=min(kos,key=lambda m:m['energy'])
                elif sh[j]>0 and o['bait']: act=cheap[i] if cheap[i] in aff else None
                elif sh[j]>0: act=best[i] if best[i] in aff else None
                elif best[i] in aff: act=best[i]
                else:
                    # danger: opponent can KO us soon
                    Yf=dmg(Y,X,Y.fast,st[j][0],st[i][1])
                    yaff=[m for m in Y.ch if m['energy']<=en[j]+Y.fast['energyGain']]
                    threat=max([dmg(Y,X,m,st[j][0],st[i][1]) for m in yaff],default=0) if sh[i]==0 else 0
                    if hp[i]<=Yf*o.get('dmul',2) or threat>=hp[i]: act=max(aff,key=lambda m:dmg(X,Y,m,st[i][0],st[j][1]))
            acts[i]=act
        if o.get('ff'):
            for i in (0,1):
                if cd[i]==1 and pend[i]:
                    j=1-i; hp[j]-=dmg(M[i],M[j],M[i].fast,st[i][0],st[j][1]); en[i]=min(100,en[i]+M[i].fast['energyGain']); pend[i]=None; cd[i]=0
            if hp[0]<=0 or hp[1]<=0: break
        # charged moves, CMP order
        # As in PvPoke: with equal Attack there is no charged move priority, so a Pokémon knocked out by
        # the other's charged move on the same turn still gets its own charged move off (mirrors tie at 500).
        order=[0,1] if A.atk>=B.atk else [1,0]; prio=A.atk!=B.atk
        for i in order:
            m=acts[i]
            if m is None or not isinstance(m,dict) or m.get('energy',0)==0: continue
            if hp[i]<=0 and prio: continue
            j=1-i
            en[i]-=m['energy']
            if o.get('aegis') and M[i].alt is not None and M[i].sid.endswith('_shield'): M[i]=M[i].alt
            if o.get('interrupt') and cd[j]>0 and pend[j]:
                hp[i]-=dmg(M[j],M[i],M[j].fast,st[j][0],st[i][1]); en[j]=min(100,en[j]+M[j].fast['energyGain']); pend[j]=None; cd[j]=0
                if hp[i]<=0: break
            d=dmg(M[i],M[j],m,st[i][0],st[j][1])
            use=sh[j]>0
            if use and o['shield']=='thr' and d<hp[j] and d<o['thr']*M[j].hp: use=False
            if use and o['shield']=='bait' and d<hp[j] and m is cheap[i] and best[i] is not cheap[i] and d<o['thr']*M[j].hp: use=False
            if use:
                sh[j]-=1; d=1
                if o.get('aegis') and M[j].alt is not None and M[j].sid.endswith('_blade'): M[j]=M[j].alt
            hp[j]-=d; _buff(m,i,j,st,o)
        if hp[0]<=0 or hp[1]<=0: break
        for i in (0,1):
            if cd[i]==0 and acts[i] is None:
                cd[i]=M[i].fast['turns'] if 'turns' in M[i].fast else max(1,M[i].fast['cooldown']//500)
                pend[i]=True
        for i in (0,1):
            if cd[i]>0:
                cd[i]-=1
                if cd[i]==0 and pend[i]:
                    j=1-i; hp[j]-=dmg(M[i],M[j],M[i].fast,st[i][0],st[j][1]); en[i]=min(100,en[i]+M[i].fast['energyGain']); pend[i]=None
        if hp[0]<=0 or hp[1]<=0: break
    h0=max(0,hp[0]); h1=max(0,hp[1])
    return int(500*(A.hp-h1 if False else (B.hp-h1))/B.hp+500*h0/A.hp)
