# Plantasia Sound Engine · Handoff

Written 2026-09-17 when engine development was given its own session, separate from the portfolio chat.

## Where things stand

- This clone was made 2026-09-17 from GitHub `nate-thousand/plantasia-sound-engine`, branch `v2-sound-world-engine` (HEAD `6fdf137`, "Ship validated demo control surface and point Vercel site at demo/"). `main` is the frozen v1 preset API.
- The copy vendored in `../plantasonic-platform/packages/sound-engine` is byte identical to this branch's `src/` and `demo/` (only a generated `src/presets/bundled` differs). One source of truth; treat this clone as it.
- Version `1.0.0-beta.2`. Verified 2026-09-18: `npm run typecheck` clean, `npm run build` passes all fifteen postbuild gates (presets, species API, ecology, generative, performance, registry, lifecycle, facade, events, analysis, scheduler, MIDI, species audio, performance budget, v2 engine).
- Live demo sound-engine.xyz returns 200 and is the `demo/` control surface (Vercel, `npm run build:site`).
- Demo locally: `npm run demo -- --port 5193 --strictPort` (the portfolio's `.claude/launch.json` has this as `sound-engine`).

## Bugs fixed 2026-09-18 (1.0.0-beta.2)

1. Dead stage: `src/engine/masterBus.ts` now feeds one analyser and meter from every output path. Verified in the browser for all four species, Plantasonic, Juno and silence.
2. Demo RMS math: the 0.5 offset in `demo/lib/visualizer.js` is gone.
3. Found during verification: loading Bacteria while generative ran threw `Maximum call stack size exceeded` (host `noteOn` spawned a swarm whose notes called `noteOn` again). Fixed in `src/species/bacteria/index.ts` (`playNote(note, velocity, spawnSwarm)`). Also guarded the per-note Freeverb `dampening` write.

Next per ROADMAP decision 12: the 1.0.0 milestone (analysis API, event timing, browser harness, two tier facade, coming_soon removal, merge to main).

## Open roadmap

See the decisions table at the top of ROADMAP.md (settled 2026-09-18). 1.0.0 next, 1.1.0 is modulation. Milestone 5 retired, coming_soon species cut.

## 1.0.0 progress (2026-09-18, local commits only)

1. Done: analysis API (`getAudioFeatures()`, `onset` event), `time` on every event, `noteReleased`. Fifteen gates.
2. Done: browser harness (`npm run test:browser`, `docs/PERFORMANCE.md`). Chromium: noteOn to audible 12 ms (was 102 ms; lookahead now 0.01 s), zero dropouts over 60 s. WebKit not yet run (`npx playwright install webkit` first). Control response measurement needs rework before its bar is asserted; see PERFORMANCE.md findings.
3. Done: two tier facade (`PlantasiaEngineApi`, `public.ts` rewritten, `docs/API.md` one page, demo grouped).
4. Next: coming_soon removal (`getUpcomingSpecies`, `'coming_soon'` status, placeholder species, demo Upcoming list), then merge to main and tag 1.0.0.

## Suggested order

1. On the user's ok: push and deploy (the user said not to deploy until asked; beta.2 is tagged locally only when they say so).
2. Continue the 1.0.0 work in the order decision 12 gives.
3. Update the portfolio case study (`../portfolio-2.0/work/sound-engine.html`) at 1.0.0 only (decision 14).

## Rules

- Commit locally on a branch; push, tag, and deploy only after the user's ok.
- Plantasonic and Signal 9 are separate projects. Do not modify them.
- No em or en dashes in new prose.
