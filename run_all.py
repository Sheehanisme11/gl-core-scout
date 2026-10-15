"""GL Core Scout pipeline: Dracoviz pages -> teams -> simulations -> cores -> website (+ workbook).
Usage:  python run_all.py            (uses config.json)
        python run_all.py --no-workbook"""
import json, os, sys, pickle, hashlib, time
HERE=os.path.dirname(os.path.abspath(__file__))
cfg=json.load(open(os.path.join(HERE,'config.json'),encoding='utf-8'))
inp=os.path.join(HERE,cfg.get('inputs','inputs')) if not os.path.isabs(cfg.get('inputs','inputs')) else cfg['inputs']
cfg['inputs']=inp
os.environ['GL_GAMEMASTER']=os.path.join(inp,cfg['gamemaster'])
sys.path.insert(0,os.path.join(HERE,'pipeline'))
from events import load_all
from builds import meta_builds, candidates
import matrix, analyse, export_site
OUT=os.path.join(HERE,'output'); os.makedirs(OUT,exist_ok=True)
def log(*a): print(time.strftime('%H:%M:%S'),*a,flush=True)
if __name__=='__main__':
    log('1/5 parsing events'); teams,usage=load_all(cfg)
    log(f'   {len(teams)} teams, {sum(t["day"]=="Day 2" for t in teams)} Day 2')
    log('2/5 builds'); main,variants,bad=meta_builds(teams)
    if bad: log('   unresolved movesets:',bad[:10])
    cands,badc=candidates(os.path.join(inp,cfg['rankings_csv']))
    if badc: log('   unresolved candidates:',badc[:10])
    meta_list=sorted(main); cand_list=[('meta',k) for k in meta_list]+[('anti',k) for k in sorted(cands)]
    specs=[main[k] if s=='meta' else cands[k] for s,k in cand_list]
    import pve_build; pve_build.build(HERE)  # PvPoke's battle engine (vendor/pvpoke) for the kit and the website
    simsrc=open(os.path.join(HERE,'pipeline','simcore.py'),'rb').read()+matrix.engine().encode()+open(os.path.join(HERE,'site','pve.js'),'rb').read()
    log('   battle engine:',matrix.engine())
    key=hashlib.md5(json.dumps([specs,[main[k] for k in meta_list]]).encode()+simsrc).hexdigest()
    cache=os.path.join(OUT,'matrix_'+key[:10]+'.pkl')
    if os.path.exists(cache): R=pickle.load(open(cache,'rb')); log('3/5 matrix (cached)')
    else:
        log(f'3/5 simulating {len(specs)} x {len(meta_list)} x 3 battles'); R=matrix.run(specs,[main[k] for k in meta_list]); pickle.dump(R,open(cache,'wb'))
    # GBL ladder meta: PvPoke top N (rank order of the rankings CSV)
    import csv as _csv
    order=[row['Pokemon'] for row in _csv.DictReader(open(os.path.join(inp,cfg['rankings_csv']),encoding='utf-8'))]
    gN=cfg.get('gbl_top',100); gbl=[n for n in order if n in cands][:gN]
    gkey=hashlib.md5(json.dumps([specs,[cands[n] for n in gbl]]).encode()+simsrc).hexdigest()
    gcache=os.path.join(OUT,'gbl_'+gkey[:10]+'.pkl')
    if os.path.exists(gcache): RG=pickle.load(open(gcache,'rb')); log('   GBL matrix (cached)')
    else:
        log(f'   simulating {len(specs)} x {len(gbl)} GBL builds x 3'); RG=matrix.run(specs,[cands[n] for n in gbl]); pickle.dump(RG,open(gcache,'wb'))
    log('4/5 cores and answers'); st=analyse.core_stats(teams)
    ans=analyse.Answers(R.astype(float),cand_list,meta_list,st['use'],cfg.get('anti_meta_net_cutoff',-0.2))
    pickle.dump(dict(teams=teams,usage=usage,main=main,variants=variants,cands=cands,meta_list=meta_list,cand_list=cand_list,st=st),open(os.path.join(OUT,'state.pkl'),'wb'))
    log('5/5 website'); n=export_site.export(os.path.join(HERE,'site','data.js'),teams,main,variants,cands,cand_list,meta_list,R,st,ans.net,gbl=(gbl,RG,order))
    import importlib.util
    spec=importlib.util.spec_from_file_location('i18n_src',os.path.join(HERE,'site','i18n_src.py')); mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    I={'es':{},'ja':{}}
    for en,es,ja in mod.D: I['es'][en]=es; I['ja'][en]=ja
    ksp=importlib.util.spec_from_file_location('i18n_ko',os.path.join(HERE,'site','i18n_ko.py')); kmod=importlib.util.module_from_spec(ksp); ksp.loader.exec_module(kmod)
    I['ko']={en:kmod.KO[en] for en,_,_ in mod.D if en in kmod.KO}
    miss=[en for en,_,_ in mod.D if en not in kmod.KO]
    if miss: log(f'   Korean: {len(miss)} strings untranslated (shown in English), e.g. {miss[:3]}')
    open(os.path.join(HERE,'site','i18n.js'),'w',encoding='utf-8').write('const I18N='+json.dumps(I,ensure_ascii=False)+';\n')
    import base64,io,glob
    from PIL import Image
    TI={}
    for f in sorted(glob.glob(os.path.join(HERE,'site','types','*.png'))):
        im=Image.open(f).convert('RGBA').resize((48,48),Image.LANCZOS); b=io.BytesIO(); im.save(b,'PNG',optimize=True)
        TI[os.path.basename(f)[:-4]]='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
    open(os.path.join(HERE,'site','types.js'),'w').write('const TYPEIMG='+json.dumps(TI)+';\n')
    app=open(os.path.join(HERE,'site','app.html'),encoding='utf-8').read()
    for f in ('sim.js','pve.js','data.js','i18n.js','types.js','app.js'):
        tag={'sim.js':'<script id="simsrc">','pve.js':'<script id="pvesrc">'}.get(f,'<script>')  # background workers read the simulator sources
        app=app.replace(f'<script src="{f}"></script>',tag+'\n'+open(os.path.join(HERE,'site',f),encoding='utf-8').read()+'\n</script>')
    open(os.path.join(OUT,'index.html'),'w',encoding='utf-8').write(app); log('   output/index.html written')
    # stand-alone website folder for GitHub Pages / any static host
    import shutil
    W=os.path.join(OUT,'website'); os.makedirs(os.path.join(W,'icons'),exist_ok=True)
    build=time.strftime('%Y%m%d%H%M%S')
    head=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
          '<meta name="theme-color" content="#131A29">\n<meta name="description" content="Great League meta cores, answers, Core Lab, team builder and preview for the 2027 regionals.">\n'
          '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
          '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>\n')
    page=app
    page=page.replace('<meta charset="utf-8">\n','',1); t0=page.index('<title>'); t1=page.index('</style>')+len('</style>')
    page=head+page[t0:t1]+'\n</head>\n<body>\n'+page[t1:]+'\n<script>if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}</script>\n</body>\n</html>\n'
    open(os.path.join(W,'index.html'),'w',encoding='utf-8').write(page)
    open(os.path.join(W,'sw.js'),'w',encoding='utf-8').write(open(os.path.join(HERE,'site','sw.js'),encoding='utf-8').read().replace('__BUILD__',build))
    shutil.copy(os.path.join(HERE,'site','manifest.webmanifest'),W); shutil.copy(os.path.join(HERE,'site','PUBLISH.md'),W)
    for f in os.listdir(os.path.join(HERE,'site','icons')): shutil.copy(os.path.join(HERE,'site','icons',f),os.path.join(W,'icons'))
    log('   output/website/ ready for GitHub Pages')
    if '--no-workbook' not in sys.argv and cfg.get('workbook'):
        import workbook
        log('6/6 workbook'); workbook.update(cfg,teams,usage,ans,st,main,cands,OUT,log)
    log('done')
