import re,html,sys
def parse(path):
    s=open(path,encoding='utf-8',errors='replace').read()
    rows=s.split('<div class="player-item-placement"')[1:]
    out=[]
    for r in rows:
        place=int(re.match(r'\s*value="(\d+)"',r).group(1))
        pm=re.search(r'href="https://www.dracoviz.com/profile/[^"]*"[^>]*>([^<]*)<',r)
        player=html.unescape(pm.group(1)).strip()
        mons=[]
        for tt in re.findall(r'data-tooltip-id="pokemon-item" data-tooltip-html="([^"]*)"',r):
            t=html.unescape(tt)
            name=re.search(r'<span[^>]*>\s*(.*?)\s*</span>',t,re.S).group(1).strip()
            cp=re.search(r'(\d+) CP',t); cp=int(cp.group(1)) if cp else None
            moves=re.findall(r'POKEMON_TYPE_([A-Z]+)\.png/public">\s*([^<\n]+)',t)
            mons.append(dict(name=name,cp=cp,moves=[(m[1].strip(),m[0].title()) for m in moves],raw=t))
        out.append(dict(place=place,player=player,mons=mons))
    return out,s
if __name__=='__main__':
    o,s=parse(sys.argv[1]); print(len(o))
    for t in o[:2]:
        print(t['place'],t['player'])
        for m in t['mons']: print('  ',m['name'],m['cp'],m['moves'])
    print(re.sub(r'\s+',' ',o[0]['mons'][0]['raw'])[:600])
