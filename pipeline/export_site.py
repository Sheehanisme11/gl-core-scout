"""Write site/data.js for the website."""
import json, base64, collections, numpy as np
from gm_subset import subset
def export(path, teams, main, variants, cands, cand_list, meta_list, R, st, net=None, gbl=None):
    mi={k:i for i,k in enumerate(meta_list)}
    use=st['use']
    # per-variant usage and day 2 counts
    vcount=collections.defaultdict(lambda:[0,0])
    for t in teams:
        for m in t['mons']:
            mv=m['mv']; key=(m['pn'],mv[0][0],tuple(sorted(x[0] for x in mv[1:] if x[0])))
            vcount[key][0]+=1; vcount[key][1]+=t['day']=='Day 2'
    from simcore import MV
    def vkey(name,spec): return (name,MV[spec[1]]['name'],tuple(sorted(MV[x]['name'] for x in spec[2])))
    d2=collections.Counter(); evs=collections.defaultdict(set)
    for t in teams:
        for n in {m['pn'] for m in t['mons']}: d2[n]+=t['day']=='Day 2'; evs[n].add(t['event'])
    M=[]
    for k in meta_list:
        vs=[]
        for spec,n in variants[k]:
            c=vcount.get(vkey(k,spec),[n,0]); vs.append([spec[1],spec[2],c[0],c[1]])
        M.append(dict(n=k,s=main[k][0],v=vs,u=use.get(k,0),d=d2[k],e=len(evs[k])))
    C=[]
    for ci,(src,k) in enumerate(cand_list):
        if src=='meta': C.append(mi[k])
        else: s=cands[k]; C.append(dict(n=k,s=s[0],f=s[1],c=s[2],u=use.get(k,0),net=round(float(net[ci]),4) if net is not None else 0))
    sids={main[k][0] for k in meta_list}|{cands[k][0] for k in cands}
    extra={m for k in meta_list for spec,_ in variants[k] for m in [spec[1]]+spec[2]}|{m for k in cands for m in [cands[k][1]]+cands[k][2]}
    sp,mv=subset(sids,extra)
    # pickable species: everything with a cand or meta entry, keyed by display name
    names={}
    for k in meta_list: names[k]=main[k][0]
    for k in cands: names.setdefault(k,cands[k][0])
    Q=np.where(R<=500,R//4,np.maximum(126,np.round(R/4))).astype(np.uint8)
    cores=[[[mi[m] for m in c['core']],c['n'],c['d'],c['events']] for c in st['cores'] if all(m in mi for m in c['core'])]
    evinfo=collections.OrderedDict()
    for t in teams:
        e=evinfo.setdefault(t['event'],[0,0]); e[0]+=1; e[1]+=t['day']=='Day 2'
    from builds import build, spec as bspec
    TT=[]; badt=0
    for t in teams:
        mons=[]
        for m in t['mons']:
            mvs=m['mv']
            try: s=bspec(build(m['pn'],mvs[0][0],[x[0] for x in mvs[1:] if x[0]])); mons.append([m['pn'],s[0],s[1],s[2]])
            except KeyError: mons.append([m['pn'],None,None,[]]); badt+=1
        TT.append([t['event'],t['place'],t['player'],1 if t['day']=='Day 2' else 0,mons])
    nets=[round(float(x),4) for x in net] if net is not None else []
    data=dict(NET=nets,T=TT,M=M,C=C,cores=cores,NT=st['NT'],ND=st['ND'],ev=[[k,*v] for k,v in evinfo.items()],nc=len(cand_list),nm=len(meta_list),
              SP=sp,MV=mv,names=names,mains={k:[main[k][1],main[k][2]] for k in meta_list})
    js=json.dumps(data,separators=(',',':'),ensure_ascii=False)
    from localize import build as lbuild
    names_l10n,_,_=lbuild(sp.keys(),mv.keys())
    gbljs=''
    if gbl:
        gnames,RG,order=gbl; ai={k:i for i,(s,k) in enumerate(cand_list) if s=='anti'}
        QG=np.where(RG<=500,RG//4,np.maximum(126,np.round(RG/4))).astype(np.uint8)
        G=dict(idx=[ai[n] for n in gnames],rank=[ai[n] for n in order if n in ai])
        gbljs='const GBL='+json.dumps(G,separators=(',',':'))+';\nconst RGB64="'+base64.b64encode(QG.tobytes()).decode()+'";\n'
    import pve_build
    from simcore import GM
    pvgm=pve_build.gm_subset(GM,list(sp.keys()))  # PvPoke-format data for the in-browser PvPoke engine
    gbljs+='const PVGM='+json.dumps(pvgm,separators=(',',':'),ensure_ascii=False)+';\n'
    open(path,'w',encoding='utf-8').write(gbljs+'const DATA='+js+';\nconst I18N_NAMES='+json.dumps(names_l10n,ensure_ascii=False,separators=(',',':'))+';\nconst RB64="'+base64.b64encode(Q.tobytes()).decode()+'";\n')
    return len(js)
