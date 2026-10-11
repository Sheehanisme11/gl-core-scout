"""Optional: check the Python fallback simulator (simcore.py) against PvPoke matrix exports.
The kit normally uses PvPoke's own engine; check that one with: node tools/calibrate_pve.js
Original note: check the simulator against PvPoke matrix exports (top_75_vs_*.csv in inputs/).
Files without a suffix are 0-0 shields, _1_ = 1-1, _2_ = 2-2.  Run: python tools/calibrate.py"""
import sys, os, csv, re, glob, json
HERE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg=json.load(open(os.path.join(HERE,'config.json'),encoding='utf-8')); inp=os.path.join(HERE,cfg['inputs'])
os.environ['GL_GAMEMASTER']=os.path.join(inp,cfg['gamemaster']); sys.path.insert(0,os.path.join(HERE,'pipeline'))
from simcore import *
def abbr(m): return m.get('abbreviation') or ''.join(w[0].upper() for w in re.split(r'[ \-()]+',m['name']) if w)
CACHE={}
def resolve(label):
    if label in CACHE: return CACHE[label]
    m=re.match(r'(.+?) (\S+)\+(\S+?)(?:/(\S+))? (\d+)/(\d+)/(\d+)$',label)
    if not m: CACHE[label]=None; return None
    name,f,c1,c2,a,d,s=m.groups(); p=BYNAME.get(name)
    if not p: CACHE[label]=None; return None
    find=lambda ab,pool: next((x for x in pool if x in MV and abbr(MV[x])==ab),None) or next((x for x in MV if abbr(MV[x])==ab),None)
    fm=find(f,p['fastMoves']); cm=[find(x,p['chargedMoves']+p.get('eliteMoves',[])) for x in [c1,c2] if x]
    a,d,s=int(a),int(d),int(s); lv=max([l/2 for l in range(2,101) if cp_of(p,l/2,a,d,s)<=1500] or [1])
    b=Build(p['speciesId'],fm,[c for c in cm if c],(lv,a,d,s),label) if fm else None; CACHE[label]=b; return b
for f in sorted(glob.glob(os.path.join(inp,'top_*.csv'))):
    s=2 if f.endswith('_2_.csv') else 1 if f.endswith('_1_.csv') else 0
    r=list(csv.reader(open(f,encoding='utf-8'))); cols=r[0][1:]; ok=n=0
    for row in r[1:]:
        A=resolve(row[0])
        for lab,v in zip(cols,row[1:]):
            B=resolve(lab)
            if A and B and v and v.isdigit() and int(v)!=500: n+=1; ok+=(battle(A,B,(s,s))>500)==(int(v)>500)
    print(f'{os.path.basename(f)}  {s}-{s} shields: {ok/n:.1%} same winner ({n} matchups)')
