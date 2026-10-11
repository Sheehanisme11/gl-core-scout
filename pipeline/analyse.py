"""Cores (duos/trios), counters to each core, and the versatility ranking."""
import itertools, collections, numpy as np
from tiers import tier, MARGIN
from simcore import Build, eff
def core_stats(teams):
    NT=len(teams); ND=sum(t['day']=='Day 2' for t in teams); BASE=ND/NT
    duo=collections.defaultdict(lambda:[0,0,set()]); tri=collections.defaultdict(lambda:[0,0,set()])
    use=collections.Counter(); d2=collections.Counter(); evs=collections.defaultdict(set)
    for t in teams:
        ms=sorted({m['pn'] for m in t['mons']}); dd=t['day']=='Day 2'
        for n in ms: use[n]+=1; d2[n]+=dd; evs[n].add(t['event'])
        for k,st in ((2,duo),(3,tri)):
            for c in itertools.combinations(ms,k): s=st[c]; s[0]+=1; s[1]+=dd; s[2].add(t['event'])
    def mk(c,s): n,d,e=s; return dict(core=c,n=n,d=d,rate=d/n,conv=(d/n)/BASE,events=len(e))
    cores=[mk(c,s) for c,s in list(duo.items())+list(tri.items()) if s[0]>=3]
    singles=[dict(core=(m,),n=use[m],d=d2[m],rate=d2[m]/use[m],conv=(d2[m]/use[m])/BASE,events=len(evs[m])) for m in use]
    return dict(NT=NT,ND=ND,BASE=BASE,cores=cores,singles=singles,use=use)
class Answers:
    def __init__(self,R,cand,meta,use,cutoff=-0.2):
        self.A=R.mean(axis=2); self.R=R; self.cand=cand; self.meta=meta; self.mi={k:i for i,k in enumerate(meta)}
        w=np.array([use.get(m,0) for m in meta],float); w=w/w.sum()
        self.net=((R>500).mean(axis=2)*w).sum(1)-((R<500).mean(axis=2)*w).sum(1)
        self.names=[c[1] for c in cand]
        self.common=np.array([c[0]=='meta' and use.get(c[1],0)>=3 for c in cand])
        self.anti=np.array([c[0]=='anti' and use.get(c[1],0)<3 for c in cand])&(self.net>=cutoff)
        self.T=np.vectorize(lambda r: tier(int(round(r))))(self.A)
    def counters(self,members,specs,cspecs,k=5):
        idx=[self.mi[m] for m in members]; a=self.A[:,idx]; t=self.T[:,idx]
        nL=(t=='L').sum(1); nCL=(t=='CL').sum(1); nW=(t=='W').sum(1); tot=a.sum(1)
        score=tot+60*nW-100*nCL-400*nL
        excl=np.array([n in members for n in self.names])
        order=np.argsort(-score)
        def top(mask): return [(self.names[i],list(t[i]),int(round(tot[i]/len(idx))),i) for i in order if mask[i] and not excl[i]][:k]
        pool=[i for i in order if (self.common[i] or self.anti[i]) and not excl[i] and nL[i]<=1][:30]
        def combo(n):
            best=None
            for c in itertools.combinations(pool,n):
                if len({self.names[i] for i in c})<n: continue
                sub=a[list(c)]; mx=sub.max(0); cov=(mx>=500+MARGIN).sum(); allL=((sub<=500-MARGIN).sum(0)==n).sum()
                v=(int(cov),-int(allL),float(mx.sum()+(sub.mean(0).sum() if n>2 else 0)))
                if best is None or v>best[0]: best=(v,c)
            return ([self.names[i] for i in best[1]],[tier(int(round(x))) for x in a[list(best[1])].max(0)],best[0][0]) if best else None
        return dict(common=top(self.common),anti=top(self.anti),duo=combo(2),trio=combo(3) if len(idx)==3 else None)
def why(xspec,yspec,yname):
    x=Build(*xspec); y=Build(*yspec)
    res=[mv['name'] for mv in [y.fast]+y.ch if eff(mv['type'],x.types)<1]
    se=sorted({mv['name'] for mv in [x.fast]+x.ch if eff(mv['type'],y.types)>1})
    b=[]
    if res: b.append('resists '+', '.join(res))
    if se: b.append('SE '+', '.join(se))
    return f"vs {yname}: "+('; '.join(b) if b else 'wins on stats/energy')
def versatility(ans,cores):
    big=[c for c in cores if c['n']>=5 and all(m in ans.mi for m in c['core'])]
    tot=sum(c['n'] for c in big); out=[]
    for i,n in enumerate(ans.names):
        if not(ans.common[i] or ans.anti[i]): continue
        cov=win=0
        for c in big:
            if n in c['core']: continue
            ts=[ans.T[i,ans.mi[m]] for m in c['core']]
            if 'L' not in ts:
                cov+=c['n']
                if all(x=='W' for x in ts): win+=c['n']
        out.append((n,'Regional pick' if ans.common[i] else 'Anti-meta',cov/tot,win/tot))
    out.sort(key=lambda x:-x[2]); return out,len(big)
