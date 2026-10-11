"""Refresh the kit's PvPoke data and battle engine from a local clone of https://github.com/pvpoke/pvpoke.

Usage:  python tools/refresh_pvpoke.py PATH_TO_PVPOKE_CLONE
        (a sparse clone is enough: src/data/gamemaster.json, src/data/rankings/all/overall/rankings-1500.json, src/js, LICENSE)

Updates inputs/gamemaster.json, inputs/<rankings_csv> (rebuilt from PvPoke's rankings in the same format as PvPoke's
Rankings > Export, using gamemaster names), and vendor/pvpoke/ (PvPoke's engine source). Prints what changed and writes
output/refresh_report.json. Exit code 0 = something changed, 3 = nothing changed.
"""
import csv, json, os, shutil, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = ['GameMaster.js', 'battle/DamageCalculator.js', 'battle/timeline/TimelineEvent.js', 'battle/timeline/TimelineAction.js',
          'battle/actions/ActionLogic.js', 'pokemon/Pokemon.js', 'battle/Battle.js']
COLS = ['Pokemon', 'Score', 'Dex', 'Type 1', 'Type 2', 'Attack', 'Defense', 'Stamina', 'Stat Product', 'Level', 'CP', 'Fast Move',
        'Charged Move 1', 'Charged Move 2', 'Charged Move 1 Count', 'Charged Move 2 Count', 'Buddy Distance', 'Charged Move Cost']


def rankings_rows(gm, ranks):
    mv = {m['moveId']: m['name'] for m in gm['moves']}
    pk = {p['speciesId']: p for p in gm['pokemon']}
    name = lambda i: mv[i.replace('AEGISLASH_CHARGE_', '')] if i.startswith('AEGISLASH_CHARGE_') else mv[i]
    rows = []
    for x in ranks:
        p = pk.get(x['speciesId'])
        if not p:
            continue
        ms = [m for m in x.get('moveset', []) if m and m != 'none']
        st = x.get('stats', {}); t = p['types'] + ['none']
        rows.append({'Pokemon': p['speciesName'], 'Score': x.get('score', ''), 'Dex': p.get('dex', ''), 'Type 1': t[0], 'Type 2': t[1],
                     'Attack': st.get('atk', ''), 'Defense': st.get('def', ''), 'Stamina': st.get('hp', ''), 'Stat Product': st.get('product', ''),
                     'Fast Move': name(ms[0]) if ms else '', 'Charged Move 1': name(ms[1]) if len(ms) > 1 else '',
                     'Charged Move 2': name(ms[2]) if len(ms) > 2 else ''})
    return rows


def main(pv):
    cfg = json.load(open(os.path.join(HERE, 'config.json'), encoding='utf-8'))
    inp = os.path.join(HERE, cfg['inputs'])
    gm_path = os.path.join(inp, cfg['gamemaster']); rk_path = os.path.join(inp, cfg['rankings_csv'])
    new_gm = json.load(open(os.path.join(pv, 'src', 'data', 'gamemaster.json'), encoding='utf-8'))
    old_gm = json.load(open(gm_path, encoding='utf-8')) if os.path.exists(gm_path) else {'pokemon': [], 'moves': []}
    ranks = json.load(open(os.path.join(pv, 'src', 'data', 'rankings', 'all', 'overall', 'rankings-1500.json'), encoding='utf-8'))
    old_rows = list(csv.DictReader(open(rk_path, encoding='utf-8'))) if os.path.exists(rk_path) else []
    new_rows = rankings_rows(new_gm, ranks)

    op = {p['speciesId']: p for p in old_gm['pokemon']}; np_ = {p['speciesId']: p for p in new_gm['pokemon']}
    om = {m['moveId']: m for m in old_gm['moves']}; nm = {m['moveId']: m for m in new_gm['moves']}
    keys = ('power', 'energy', 'energyGain', 'cooldown', 'turns', 'buffs', 'buffTarget', 'buffApplyChance')
    clean = lambda v: (v or '').replace('*', '').split('<')[0].strip()
    oldr = {r['Pokemon']: r for r in old_rows}
    report = {
        'gamemaster_timestamp': [old_gm.get('timestamp'), new_gm.get('timestamp')],
        'new_pokemon': sorted(np_[s]['speciesName'] for s in np_ if s not in op and np_[s].get('released')),
        'newly_released': sorted(np_[s]['speciesName'] for s in np_ if s in op and np_[s].get('released') and not op[s].get('released')),
        'movepool_changes': sorted(np_[s]['speciesName'] for s in np_ if s in op and (np_[s].get('fastMoves') != op[s].get('fastMoves') or np_[s].get('chargedMoves') != op[s].get('chargedMoves'))),
        'new_moves': sorted(nm[m]['name'] for m in nm if m not in om),
        'move_stat_changes': sorted(nm[m]['name'] for m in nm if m in om and any(nm[m].get(k) != om[m].get(k) for k in keys)),
        'recommended_moveset_changes': sorted(r['Pokemon'] for r in new_rows if r['Pokemon'] in oldr and
                                              [clean(oldr[r['Pokemon']].get(k)) for k in ('Fast Move', 'Charged Move 1', 'Charged Move 2')] != [r['Fast Move'], r['Charged Move 1'], r['Charged Move 2']]),
        'engine_files_changed': [],
    }
    vdir = os.path.join(HERE, 'vendor', 'pvpoke')
    for f in ENGINE:
        a = os.path.join(pv, 'src', 'js', f); b = os.path.join(vdir, f)
        if not os.path.exists(b) or open(a, 'rb').read() != open(b, 'rb').read():
            report['engine_files_changed'].append(f)
    changed = (old_gm.get('timestamp') != new_gm.get('timestamp')) or bool(report['engine_files_changed']) or \
              [r['Pokemon'] for r in old_rows] != [r['Pokemon'] for r in new_rows] or bool(report['recommended_moveset_changes'])
    report['changed'] = bool(changed)
    if changed:
        for p in (gm_path, rk_path):
            if os.path.exists(p): os.chmod(p, 0o644)
        shutil.copy(os.path.join(pv, 'src', 'data', 'gamemaster.json'), gm_path)
        w = csv.DictWriter(open(rk_path, 'w', encoding='utf-8', newline=''), fieldnames=COLS); w.writeheader(); w.writerows(new_rows)
        for f in report['engine_files_changed']:
            os.makedirs(os.path.dirname(os.path.join(vdir, f)), exist_ok=True); shutil.copy(os.path.join(pv, 'src', 'js', f), os.path.join(vdir, f))
        if os.path.exists(os.path.join(pv, 'LICENSE')): shutil.copy(os.path.join(pv, 'LICENSE'), os.path.join(vdir, 'LICENSE'))
    os.makedirs(os.path.join(HERE, 'output'), exist_ok=True)
    json.dump(report, open(os.path.join(HERE, 'output', 'refresh_report.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print(json.dumps(report, indent=1, ensure_ascii=False))
    return 0 if changed else 3


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    sys.exit(main(sys.argv[1]))
