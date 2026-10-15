"""Official Spanish / Japanese / Korean names (PokeAPI data in pipeline/i18n) for species, moves and types used by the site."""
import csv, os, re
from simcore import P, MV
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'i18n')
LANG={'es':'7','ja':'1','ko':'3','en':'9'}
norm=lambda s: re.sub(r'[^a-z0-9]','',s.lower())
FORM={'Shadow':{'es':'Oscuro','ja':'シャドウ','ko':'섀도'},'Alolan':{'es':'de Alola','ja':'アローラ','ko':'알로라'},'Galarian':{'es':'de Galar','ja':'ガラル','ko':'가라르'},
      'Hisuian':{'es':'de Hisui','ja':'ヒスイ','ko':'히스이'},'Paldean':{'es':'de Paldea','ja':'パルデア','ko':'팔데아'},'Female':{'es':'Hembra','ja':'メス','ko':'암컷'},'Male':{'es':'Macho','ja':'オス','ko':'수컷'}}
# Korean names for special forms (official in-game wording where it exists); other languages keep English for these
KO_FORM={'Blade':'블레이드폼','Shield':'실드폼','Rainy':'빗방울의 모습','Snowy':'설운의 모습','Sunny':'태양의 모습','Overcast':'네거폼','Sunshine':'포지폼',
 'Standard':'노말모드','Defense':'디펜스폼','Speed':'스피드폼','Altered':'어나더폼','Origin':'오리진폼','Average':'보통 사이즈','Large':'큰 사이즈',
 'Small':'작은 사이즈','Super':'특대 사이즈','Incarnate':'화신폼','Dusk':'황혼의 모습','Midday':'한낮의 모습','Midnight':'한밤중의 모습',
 'Full Belly':'배부른 모양','Baile':'이글이글스타일','Pa\'u':'훌라훌라스타일','Pom-Pom':'파칙파칙스타일','Sensu':'하늘하늘스타일',
 'Fan':'스핀','Frost':'프로스트','Heat':'히트','Mow':'커트','Wash':'워시','Land':'랜드폼','Sky':'스카이폼','Curly':'젖힌 모습',
 'Droopy':'늘어진 모습','Stretchy':'뻗은 모습','Aqua':'워터종','Blaze':'블레이즈종','Combat':'컴뱃종','Rapid Strike':'연격의 태세',
 'Single Strike':'일격의 태세','50% Forme':'50%폼','10% Forme':'10%폼','Plant':'초목도롱','Sandy':'모래땅도롱','Trash':'슈레도롱'}
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
    out={lg:{'sp':{},'mv':{},'ty':{}} for lg in ('es','ja','ko')}
    miss_sp=[]; miss_mv=[]
    for sid in sids:
        p=P[sid]; d=p.get('dex'); names=sp.get(d)
        if not names: miss_sp.append(sid); continue
        forms=re.findall(r'\(([^)]+)\)',p['speciesName'])
        for lg in ('es','ja','ko'):
            base=names.get(LANG[lg]) or names.get('9')
            extra=[]; sh=False
            for f in forms:
                if f=='Shadow': sh=True; continue
                extra.append(FORM.get(f,{}).get(lg) or (KO_FORM.get(f,f) if lg=='ko' else f))
            if lg=='es': nm=base+''.join((' '+e if e.startswith('de ') else f' ({e})') for e in extra)+(' (Oscuro)' if sh else '')
            elif lg=='ko': nm=base+''.join(f' ({e})' for e in extra)+(' (섀도)' if sh else '')
            else: nm=base+''.join(f'（{e}）' for e in extra)+('（シャドウ）' if sh else '')
            out[lg]['sp'][sid]=nm
    for m in move_ids:
        if m not in MV: continue
        en=MV[m]['name']; base=re.sub(r'\s*\(.*\)$','',en).replace('Aegislash Charge ','')
        k=MOVE_ALIAS.get(base.lower(),norm(base)); mid=en2id.get(k)
        suf=re.search(r'\(([^)]+)\)$',en)
        if not mid: miss_mv.append(en); continue
        for lg in ('es','ja','ko'):
            nm=mv[mid].get(LANG[lg]) or en
            if suf:
                t=suf.group(1).lower(); tid=[i for i,v in ty.items() if v.get('9','').lower()==t]
                tn=ty[tid[0]].get(LANG[lg]) if tid else suf.group(1)
                nm=f'{nm}（{tn}）' if lg=='ja' else f'{nm} ({tn})'
            out[lg]['mv'][m]=nm
    for i,v in ty.items():
        en=v.get('9','').lower()
        if en:
            for lg in ('es','ja','ko'): out[lg]['ty'][en]=v.get(LANG[lg],en)
    return out,miss_sp,miss_mv
