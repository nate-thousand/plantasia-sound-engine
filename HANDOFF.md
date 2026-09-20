# Plantasia Sound Engine · Handoff

Written 2026-09-17 when engine development was given its own session, separate from the portfolio chat.

## Where things stand

- This clone was made 2026-09-17 from GitHub `nate-thousand/plantasia-sound-engine`, branch `v2-sound-world-engine` (HEAD `6fdf137`, "Ship validated demo control surface and point Vercel site at demo/"). `main` is the frozen v1 preset API.
- The copy vendored in `../plantasonic-platform/packages/sound-engine` is byte identical to this branch's `src/` and `demo/` (only a generated `src/presets/bundled` differs). One source of truth; treat this clone as it.
- Version `1.1.0` (prepared locally on `release/1.1.0`, not tagged or pushed). Verified 2026-09-20: `npm run typecheck` clean, `npm run build` passes all seventeen postbuild gates (presets, species API, ecology, generative, performance, registry, lifecycle, facade, events, analysis, modulation, preferences, scheduler, MIDI, species audio, performance budget, v2 engine).
- Live demo sound-engine.xyz returns 200 and is the `demo/` control surface (Vercel, `npm run build:site`).
- Demo locally: `npm run demo -- --port 5193 --strictPort` (the portfolio's `.claude/launch.json` has this as `sound-engine`).

## Bugs fixed 2026-09-18 (1.0.0-beta.2)

1. Dead stage: `src/engine/masterBus.ts` now feeds one analyser and meter from every output path. Verified in the browser for all four species, Plantasonic, Juno and silence.
2. Demo RMS math: the 0.5 offset in `demo/lib/visualizer.js` is gone.
3. Found during verification: loading Bacteria while generative ran threw `Maximum call stack size exceeded` (host `noteOn` spawned a swarm whose notes called `noteOn` again). Fixed in `src/species/bacteria/index.ts` (`playNote(note, velocity, spawnSwarm)`). Also guarded the per-note Freeverb `dampening` write.

Next per ROADMAP decision 12: the 1.0.0 milestone (analysis API, event timing, browser harness, two tier facade, coming_soon removal, merge to main).

## Open roadmap

See the decisions table at the top of ROADMAP.md (settled 2026-09-18). 1.0.0 next, 1.1.0 is modulation. Milestone 5 retired, coming_soon species cut.

## 1.0.0 shipped 2026-09-19

Tag `1.0.0` on `main`, live at sound-engine.xyz. Portfolio case study updated on portfolio `main` and deployed.

## 1.1.0 prepared 2026-09-20 (branch `release/1.1.0`, local commits only)

Decisions table "Decisions for 1.1.0" in ROADMAP.md. All seven steps done: modulation engine and species hook, envelope follower, MIDI CC / aftertouch / bend as event and sources, generative preferences, harness rows (both browsers pass), demo Modulation section, docs. Version bumped to 1.1.0 with the CHANGELOG section. Seventeen gates.

Not done: the spans table (decision 6) is verified to move the spectrum but not tuned by ear across all four species. WebKit noteOn latency sits at 14.2 ms median against the 15 ms bar (PERFORMANCE.md finding 7). No iPad pass.

## Suggested order

1. On the user's ok: merge `release/1.1.0` into `main`, tag `1.1.0`, push, deploy; then the portfolio case study (cherry-pick to portfolio `main`, deploy from a clean worktree, as for 1.0.0).
2. Tune `MODULATION_TARGET_SPANS` by ear in the demo's Modulation section.
3. Grill the roadmap after 1.1.0; nothing beyond it is settled.

## Rules

- Commit locally on a branch; push, tag, and deploy only after the user's ok.
- Plantasonic and Signal 9 are separate projects. Do not modify them.
- No em or en dashes in new prose.
