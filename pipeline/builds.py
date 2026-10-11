"""Turn names + move names into simulator builds."""
import re, csv, collections
from simcore import *
SPECIAL={'Cherrim':'Cherrim (Sunshine)','Indeedee':'Indeedee (Female)','Pumpkaboo':'Pumpkaboo (Super)'}
MV_ALIAS={'Aura Wheel Electric':'AURA_WHEEL_ELECTRIC','Aura Wheel (Electric)':'AURA_WHEEL_ELECTRIC','Vice Grip':'VISE_GRIP'}
clean=lambda s: re.sub(r'[*†]|<sup>.*?</sup>','',s or '').strip()
def species(name):
    return BYNAME.get(name) or BYNAME.get(SPECIAL.get(name,''))
def mvid(n):
    n=clean(n)
    if n in MVNAME: return MVNAME[n]['moveId']
    if n in MV_ALIAS:
        a=MV_ALIAS[n]
        if a in MV: return a
        if a=='VISE_GRIP': return MVNAME['Vise Grip']['moveId']
    raise KeyError(n)
def build(name,fast,charged,label=None):
    p=species(name)
    if not p: raise KeyError(name)
    return Build(p['speciesId'],mvid(fast),[mvid(x) for x in charged if x],label=label or name)
def spec(b):  # serialisable
    return (b.sid,b.fast['moveId'],[m['moveId'] for m in b.ch])
def meta_builds(teams):
    """most-used moveset per Pokédex name, plus every moveset variant used (with counts)"""
    ms=collections.defaultdict(collections.Counter)
    for t in teams:
        for m in t['mons']:
            mv=m['mv']; ms[m['pn']][(mv[0][0],tuple(sorted(x[0] for x in mv[1:] if x[0])))]+=1
    main={}; variants={}; bad=[]
    for name,c in ms.items():
        vs=[]
        for (f,ch),n in c.most_common():
            try: vs.append((spec(build(name,f,ch)),n))
            except KeyError as e: bad.append((name,str(e)))
        if vs: main[name]=vs[0][0]; variants[name]=vs
    return main,variants,bad
def candidates(csv_path):
    out={}; bad=[]
    for r in csv.DictReader(open(csv_path,encoding='utf-8')):
        try: out[r['Pokemon']]=spec(build(r['Pokemon'],r['Fast Move'],[r['Charged Move 1'],r['Charged Move 2']]))
        except KeyError as e: bad.append((r['Pokemon'],str(e)))
    return out,bad
