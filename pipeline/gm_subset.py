"""Compact gamemaster subset for the website's in-browser simulator."""
from simcore import P, MV
KEEP=('moveId','name','abbreviation','type','power','energy','energyGain','turns','cooldown','buffs','buffTarget','buffApplyChance')
def subset(sids,extra_moves=()):
    sp={}; mv=set()
    sids=set(sids)
    for sid in list(sids):
        fc=P[sid].get('formChange')
        if fc and fc.get('trigger')=='activate_charged' and fc.get('alternativeFormId') in P: sids.add(fc['alternativeFormId'])
    for sid in sorted(sids):  # sorted so rebuilds are byte-for-byte reproducible
        p=P[sid]; iv=p['defaultIVs']['cp1500']
        sh='shadow' in (p.get('tags') or []) or sid.endswith('_shadow')
        f=[m for m in p['fastMoves'] if m in MV]; c=[m for m in p['chargedMoves']+[e for e in p.get('eliteMoves',[]) if e not in p['chargedMoves']] if m in MV]
        fc=p.get('formChange'); alt=fc['alternativeFormId'] if fc and fc.get('trigger')=='activate_charged' and fc.get('alternativeFormId') in P else None
        sp[sid]=dict(alt=alt,n=p['speciesName'],b=[p['baseStats']['atk'],p['baseStats']['def'],p['baseStats']['hp']],t=p['types'],iv=iv,sh=sh,f=f,c=c,e=[e for e in p.get('eliteMoves',[]) if e in MV])
        mv.update(f); mv.update(c)
    mv.update(m for m in extra_moves if m in MV)
    moves={m:{k:MV[m][k] for k in KEEP if k in MV[m]} for m in mv}
    return sp,moves
