"""Battle every candidate against every meta build at 0, 1 and 2 shields.
Uses PvPoke's own battle engine (site/pve.js, run with Node.js) so results match PvPoke; falls back to the Python simulator
(simcore.py, about 90-94% agreement with PvPoke) if Node.js is not installed."""
import numpy as np, os, json, shutil, subprocess, tempfile
from multiprocessing import Pool
from simcore import Build, battle
HERE=os.path.dirname(os.path.abspath(__file__))
_META=None
def _init(meta):
    global _META; _META=[Build(*s) for s in meta]
def _row(spec):
    A=Build(*spec); return [[battle(A,B,(s,s)) for s in (0,1,2)] for B in _META]
def engine():
    return 'pvpoke' if shutil.which('node') and os.path.exists(os.path.join(HERE,'..','site','pve.js')) else 'python'
def run(cand_specs, meta_specs, procs=None):
    if engine()=='pvpoke':
        with tempfile.TemporaryDirectory() as d:
            job=os.path.join(d,'job.json'); out=os.path.join(d,'out.bin')
            json.dump({'gamemaster':os.environ['GL_GAMEMASTER'],'A':[list(s) for s in cand_specs],'B':[list(s) for s in meta_specs]},open(job,'w'))
            subprocess.run(['node',os.path.join(HERE,'pve_matrix.js'),job,out,str(procs or os.cpu_count())],check=True)
            return np.fromfile(out,dtype=np.int16).reshape(len(cand_specs),len(meta_specs),3)
    print('   Node.js not found: using the Python simulator (install Node.js for results that match PvPoke)')
    with Pool(procs or os.cpu_count(), initializer=_init, initargs=(meta_specs,)) as p:
        R=p.map(_row,cand_specs,chunksize=20)
    return np.array(R,dtype=np.int16)
