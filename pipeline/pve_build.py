"""Assemble site/pve.js: PvPoke's battle engine (vendor/pvpoke, MIT) inside the GL Core Scout wrapper."""
import os, re
FILES=['GameMaster.js','battle/DamageCalculator.js','battle/timeline/TimelineEvent.js','battle/timeline/TimelineAction.js','battle/actions/ActionLogic.js','pokemon/Pokemon.js','battle/Battle.js']
def build(here):
    v=os.path.join(here,'vendor','pvpoke');src='\n;\n'.join(open(os.path.join(v,f),encoding='utf-8').read() for f in FILES)
    src=src.replace('timeline.push(','__TL&&timeline.push(')  # timeline is display-only; skip it unless a log is wanted
    wrap=open(os.path.join(here,'site','pve_wrap.js'),encoding='utf-8').read()
    out=wrap.replace('/*__PVPOKE_SOURCE__*/',src)
    open(os.path.join(here,'site','pve.js'),'w',encoding='utf-8').write(out);return out
def gm_subset(gm,sids):
    """PvPoke-format gamemaster subset for the browser engine: the given Pokémon (plus their alternate forms), their moves, settings."""
    P={p['speciesId']:p for p in gm['pokemon']};keep=set(s for s in sids if s in P)
    # every Pokémon that changes form, and every form it can change into (Aegislash, Mimikyu, Cramorant, Morpeko...)
    for q in gm['pokemon']:
        fc=q.get('formChange')
        if fc:
            keep.add(q['speciesId'])
            for k in ('alternativeFormId','defaultFormId'):
                if fc.get(k) in P: keep.add(fc[k])
    pk=[P[s] for s in sorted(keep)];mv=set()
    for p in pk: mv.update(p.get('fastMoves',[]));mv.update(p.get('chargedMoves',[]));mv.update(p.get('eliteMoves',[]) or []);mv.update(['TRANSFORM','STRUGGLE'])
    moves=gm['moves']  # all moves: small, and form changes use moves outside the normal movepools (Gulp Missile)
    return {'pokemon':pk,'moves':moves,'settings':gm['settings'],'formats':[],'cups':[],'shadowPokemon':gm.get('shadowPokemon',[]),'pokemonTags':gm.get('pokemonTags',[]),'pokemonTraits':gm.get('pokemonTraits',{}),'pokemonRegions':gm.get('pokemonRegions',[])}
