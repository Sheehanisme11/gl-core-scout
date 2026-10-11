"""Parse every Dracoviz event page listed in config.json into one list of teams."""
import json, re, os, collections
from parse_draco import parse
from usage import usage
HERE=os.path.dirname(os.path.abspath(__file__))
AL=json.load(open(os.path.join(HERE,'aliases.json'),encoding='utf-8'))
FORMS=('Alolan','Galarian','Hisuian','Paldean')
def pdx_name(n,sh,valid=None):
    k=f'{n}|{sh}'
    if k in AL['names']: return AL['names'][k]
    base=n; form=None
    for f in FORMS:
        if n.startswith(f+' '): base=n[len(f)+1:]; form=f
    return base+(f' ({form})' if form else '')+(' (Shadow)' if sh=='Yes' else '')
def species_key(n):
    if n in AL['species']: return AL['species'][n]
    for f in FORMS:
        if n.startswith(f+' '): return n[len(f)+1:]+' '+f
    return n
fixmv=lambda s: re.sub(r'\[(\w+)\]',r'(\1)',s)
def load_event(name,path,day2_cut=9):
    o,html=parse(path)
    segs=html.split('<div class="player-item-placement"')[1:]
    teams=[]
    for t,seg in zip(o,segs):
        sh=['alt="Shadow"' in w for w in re.split(r'class="pokemon-image-wrapper"',seg)[1:]]
        mons=[]
        for m,x in zip(t['mons'],sh):
            s='Yes' if x else 'No'
            mv=[(fixmv(a),b) for a,b in m['moves']]
            while len(mv)<3: mv.append(('',''))
            mons.append(dict(dn=m['name'],sh=s,pn=pdx_name(m['name'],s),cp=m['cp'],mv=mv,key=species_key(m['name'])))
        teams.append(dict(event=name,place=t['place'],player=t['player'],day='Day 2' if t['place']<=day2_cut else 'Day 1',mons=mons))
    teams.sort(key=lambda t:t['place'])
    return teams, usage(path)
def load_all(cfg):
    T=[];U={}
    for ev in cfg['events']:
        t,u=load_event(ev['name'],os.path.join(cfg['inputs'],ev['file']),ev.get('day2_cutoff',9)); T+=t; U[ev['name']]=u
    return T,U
