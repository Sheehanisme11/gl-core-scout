import re,html
def usage(path):
    s=open(path,encoding='utf-8').read()
    i=s.find('Usage Stats'); x=s[i:]
    cards=x.split('class="usage-stats-card"')[1:]
    out=[]
    for c in cards:
        alt=re.search(r'<img[^>]*alt="([^"]+)"',c)
        u=re.search(r'>Usage</div>\s*<div[^>]*>([\d.]+)%',c)
        g=re.search(r'>GWR</div>\s*<div[^>]*>([\d.]+)%',c)
        if not u: break
        out.append((alt.group(1) if alt else None, float(u.group(1))/100, float(g.group(1))/100 if g else None))
    return out
if __name__=='__main__':
    import sys
    o=usage(sys.argv[1]); print(len(o)); print(o[:8]); print(o[-3:])
