# GL Core Scout kit

Everything needed to rebuild the **GL Core Scout website** and the **Team Builder Assistant** workbook from raw data. It doesn't depend on any one computer or chat session.

## What it does

```
Dracoviz event pages  ─┐
gamemaster.json        ├─▶ run_all.py ─▶ output/index.html                       (the website)
PvPoke rankings CSV    │                 output/Team_Builder_Assistant_-_GL1500.xlsx (updated workbook)
your current workbook ─┘
```

1. **Parse events.** Reads every regional listed in `config.json`: teams, placements, Day 2 (placement 9 or better), shadows and moves.
2. **Builds.** Each meta Pokémon uses its most-used regional moveset, and every variant is recorded. Candidates are every Great League Pokémon with PvPoke's recommended moveset (from the rankings CSV).
3. **Simulate.** About 1.07 million battles (≈40 s): every candidate vs every meta build at 0, 1 and 2 shields. Results are cached in `output/`.
4. **Analyse.** Duo/trio cores, Day 2 conversion, answers to every core (W / CW / CL / L tiers), counter duos/trios, versatility ranking.
5. **Website.** `output/index.html` (single file, used for the Claude preview) and `output/website/`, ready to upload to GitHub Pages (index.html, manifest, offline support, icons; see `PUBLISH.md` inside). English / Español / 日本語 built in.
6. **Workbook.** Adds any event in `config.json` that isn't in the workbook yet (Regional_Meta, Dracoviz_Usage, a new usage + GWR column on Regional_Usage, new rows in Opp_Teams / Preview_Calc / Partner_Finder with every formula shifted), then rewrites Meta_Cores, Core_Finder and Core_Data. Your tabs, settings, library and Excel dropdowns are kept.

## Adding the next regional

1. Save the Dracoviz event page as before (team list set to **All**, Usage Stats expanded), using **Save page as → Web page, complete**. Put the `.htm` file in `inputs/`.
2. Add a line to `config.json` under `"events"`:
   `{"name": "Sacramento", "file": "your-saved-page.htm", "day2_cutoff": 9}`
3. Put your **latest** workbook in `inputs/` (same file name as in `config.json`).
4. Run `python run_all.py`.
5. Use the new `output/` files. Copy the output workbook back into `inputs/` so it's the starting point next time.

**Don't want to run it yourself?** Start a chat with Claude, attach this kit's zip plus the new Dracoviz page and your workbook, and ask it to "run the GL Core Scout kit with this new event". The steps above are all it needs.

## Requirements (only if you run it yourself)

Python 3.10+ with `pip install openpyxl numpy pillow`, and **Node.js 18+** for PvPoke's battle engine (without Node.js the kit falls back to its own Python simulator, which agrees with PvPoke about 90–94% of the time). The simulation uses all CPU cores; expect a few minutes in total.

## Refreshing PvPoke data

Last refreshed 11 October 2026 from PvPoke's GitHub (gamemaster dated 10 October). The rankings CSV was rebuilt from PvPoke's `rankings-1500.json` using gamemaster names, so it matches the site's own Rankings → Export format.

Replace `inputs/gamemaster.json` (from PvPoke's GitHub: `src/data/gamemaster.json`) and `inputs/cp1500_all_overall_rankings.csv` (PvPoke Rankings → Great League → Export) when moves or stats change. Rerun.

Optional accuracy check: put PvPoke matrix exports (`top_75_vs_*.csv`) in `inputs/` and run `node tools/calibrate_pve.js` (currently 100% identical ratings across 54,000 matchups). `python tools/calibrate.py` checks the Python fallback simulator. Current agreement on the winner, excluding exact ties: ~94% at 0 shields and ~92% at 1 and 2 shields across PvPoke's top 242 (90–93% against the top 100 alone). Aegislash's form change is modelled.

## Weekly refresh (automatic)

A scheduled task runs every Monday at 5:50am Sydney time. It pulls PvPoke's latest gamemaster, rankings and engine code (`tools/refresh_pvpoke.py`), and if anything changed it rebuilds the site, checks it in a headless browser, and publishes it: kit source to the `kit` branch of github.com/sheehanisme11/gl-core-scout, website to `main`. You get a notification with what changed. The kit on the `kit` branch is the master copy; download it from there (Code → Download ZIP while viewing the `kit` branch) if you want to run it yourself.

## Battle engine

Battles use PvPoke's own engine (https://github.com/pvpoke/pvpoke, MIT License). Its source files are in `vendor/pvpoke/` (see the README there); `pipeline/pve_build.py` wraps them into `site/pve.js`, which the kit runs with Node.js (`pipeline/pve_matrix.js`) and the website runs in the browser. The site's original fast simulator (`site/sim.js`, mirrored by `pipeline/simcore.py`) is kept for screening thousands of IV spreads before everything shown is re-run with PvPoke's engine. To update the engine, copy the same files from PvPoke's `src/js/` into `vendor/pvpoke/` and run the kit.

## Keeping it safe on GitHub (recommended)

1. On github.com, create a **private** repository, e.g. `gl-core-scout`.
2. **Add file → Upload files**, then drag in the contents of this folder (not the zip itself). GitHub's web upload accepts files up to 25 MB.
3. Commit. Re-upload changed files after each update.
4. Optional: to host the website like IV Lab, make a separate **public** repository with `output/index.html` renamed to `index.html`, then turn on **Settings → Pages → main branch**.

## Folder layout

```
config.json          events and input file names
run_all.py           runs everything
pipeline/
  parse_draco.py     reads a Dracoviz team list
  usage.py           reads a Dracoviz Usage Stats table
  events.py          all events → teams (Pokédex names, shadows, moves, Day 2)
  aliases.json       Dracoviz → Pokédex name fixes (add to it if a new name fails)
  simcore.py         the battle simulator (Python)
  builds.py          names + moves → simulator builds; regional moveset variants; PvPoke candidates
  matrix.py          runs all battles (multi-core)
  tiers.py           W / CW / CL / L definitions (MARGIN = 75)
  analyse.py         cores, answers, counters, versatility
  gm_subset.py       compact gamemaster for the website
  export_site.py     writes the website data
  workbook.py        updates the workbook
  localize.py        official Spanish/Japanese Pokémon, move and type names (from pipeline/i18n, PokeAPI data)
site/
  app.html           the website layout and styles
  app.js             the website logic
  i18n_src.py        interface translations (English, Spanish, Japanese); add a row to translate new text
  i18n_ko.py         Korean interface translations (English text -> Korean); untranslated text shows in English
  sw.js, manifest.webmanifest, icons/, PUBLISH.md   files for the stand-alone website
  sim.js             the simulator in JavaScript, identical results to simcore.py; used by Core Lab
tools/calibrate.py   accuracy check against PvPoke exports
inputs/              your data files
output/              results (website, workbook, simulation cache)
```

## Website tabs

Meta cores · Trends · Team directory (all regional teams + analysis) · Core Lab (edit movesets) · Build around · Anti-meta · My team (suggestions, completions, swaps, threats to your team, counters to those threats, swaps that raise core coverage; coverage cards are green at 95%+, blue at 88–94%, red at 87% and below) · Preview (opponent team: bring, lead, swap, closer) · Battle matrix (Group A vs Group B, up to 300 each; shields per side; custom IVs and level cap; PvPoke-format import/export; CSV downloads in PvPoke's matrix layout; battles run in background workers that read the simulator from the page's `simsrc` script) · Battle sandbox (one matchup with every input adjustable: moves, IVs, shields, starting HP/energy/stat stages, shield baiting on or off; live result, timeline, turn-by-turn log, damage numbers, breakpoints and bulkpoints, IV spread comparison, all nine shield combinations; matrix cells open here) · Best IVs (top 200 Great League IV spreads ranked by results vs the regional meta, with flips vs PvPoke default, always-win/always-lose matchups, IV floors; Ultra League stat product ranks) · Sandbox IV analysis (all 4,096 spreads each side: flips, always win/lose checked over the stat frontiers, best vs best) · Matrix best-IV optimiser · GBL team builder (team generator, trio rater, partners, drills, practice battles vs the PvPoke top 300 ladder meta; set `gbl_top` in config.json) · How it works.

## Rules baked in

- **Day 2** = placement ≤ `day2_cutoff` (9 at all 2027 events so far).
- **Tiers** (rating 500 = tie): W ≥ 575, CW 501–574, CL 426–499, L ≤ 425. On the site the margin can be set to 50 / 75 / 100.
- **Answers** avoid clear losses first, then close losses. "Answers from the meta" = Pokémon on 3+ regional teams; "Anti-meta" = fewer than 3.
- **Charged move priority**: higher Attack goes first; with exactly equal Attack there is no priority (as in PvPoke), so both charged moves land and mirrors tie at 500. `simcore.py` and `site/sim.js` must stay identical. In `sim.js`, `run()` is the engine and `battle()` is a thin wrapper; the sandbox's extra options (starting HP/energy/stages, baiting off, event log) are browser-only and leave default results unchanged.
- **Shared weaknesses** (Core Lab): if 2+ members share a weakness, 2+ should resist it.
