"""Official Spanish / Japanese names (PokeAPI data in pipeline/i18n) for species, moves and types used by the site."""
import csv, os, re
from simcore import P, MV
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'i18n')
LANG={'es':'7','ja':'1','en':'9'}
norm=lambda s: re.sub(r'[^a-z0-9]','',s.lower())
FORM={'Shadow':{'es':'Oscuro','ja':'シャドウ'},'Alolan':{'es':'de Alola','ja':'アローラ'},'Galarian':{'es':'de Galar','ja':'ガラル'},
      'Hisuian':{'es':'de Hisui','ja':'ヒスイ'},'Paldean':{'es':'de Paldea','ja':'パルデア'},'Female':{'es':'Hembra','ja':'メス'},'Male':{'es':'Macho','ja':'オス'}}
MOVE_ALIAS={'superpower':'superpower','super power':'superpower','futuresight':'futuresight','vicegrip':'visegrip','visegrip':'visegrip','lockon':'lockon','powerup punch':'poweruppunch'}
def load():
    sp={}; 
    for r in csv.reader(open(os.path.join(D,'pokemon_species_names.csv'),encoding='utf-8')):
        if r[0].isdigit() and r[1] in LANG.values(): sp.setdefault(int(r[0]),{})[r[1]]=r[2]
    mv={}; en2id={}
    for r in csv.reader(open(os.path.join(D,'move_names.csv'),encoding='utf-8')):
        if r[0].isdigit() and r[1] in LANG.values():
            mv.setdefault(r[0],{})[r[1]]=r[2]
            if r[1]=='9': en2id[norm(r[2])]=r[0]
    ty={}
    for r in csv.reader(open(os.path.join(D,'type_names.csv'),encoding='utf-8')):
        if r[0].isdigit() and r[1] in LANG.values(): ty.setdefault(r[0],{})[r[1]]=r[2]
    return sp,mv,en2id,ty
def build(sids,move_ids):
    sp,mv,en2id,ty=load()
    out={'es':{'sp':{},'mv':{},'ty':{}},'ja':{'sp':{},'mv':{},'ty':{}}}
    miss_sp=[]; miss_mv=[]
    for sid in sids:
        p=P[sid]; d=p.get('dex'); names=sp.get(d)
        if not names: miss_sp.append(sid); continue
        forms=re.findall(r'\(([^)]+)\)',p['speciesName'])
        for lg in ('es','ja'):
            base=names.get(LANG[lg]) or names.get('9')
            extra=[]; sh=False
            for f in forms:
                if f=='Shadow': sh=True; continue
                extra.append(FORM.get(f,{}).get(lg,f))
            if lg=='es': nm=base+''.join((' '+e if e.startswith('de ') else f' ({e})') for e in extra)+(' (Oscuro)' if sh else '')
            else: nm=base+''.join(f'（{e}）' for e in extra)+('（シャドウ）' if sh else '')
            out[lg]['sp'][sid]=nm
    for m in move_ids:
        if m not in MV: continue
        en=MV[m]['name']; base=re.sub(r'\s*\(.*\)$','',en).replace('Aegislash Charge ','')
        k=MOVE_ALIAS.get(base.lower(),norm(base)); mid=en2id.get(k)
        suf=re.search(r'\(([^)]+)\)$',en)
        if not mid: miss_mv.append(en); continue
        for lg in ('es','ja'):
            nm=mv[mid].get(LANG[lg]) or en
            if suf:
                t=suf.group(1).lower(); tid=[i for i,v in ty.items() if v.get('9','').lower()==t]
                tn=ty[tid[0]].get(LANG[lg]) if tid else suf.group(1)
                nm=f'{nm} ({tn})' if lg=='es' else f'{nm}（{tn}）'
            out[lg]['mv'][m]=nm
    for i,v in ty.items():
        en=v.get('9','').lower()
        if en:
            for lg in ('es','ja'): out[lg]['ty'][en]=v.get(LANG[lg],en)
    return out,miss_sp,miss_mv
