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

## 1.1.0 shipped 2026-09-20

Decisions table "Decisions for 1.1.0" in ROADMAP.md. All seven steps done: modulation engine and species hook, envelope follower, MIDI CC / aftertouch / bend as event and sources, generative preferences, harness rows (both browsers pass), demo Modulation section, docs. Version bumped to 1.1.0 with the CHANGELOG section. Seventeen gates.

Not done: the spans table (decision 6) is verified to move the spectrum but not tuned by ear across all four species. WebKit noteOn latency sits at 14.2 ms median against the 15 ms bar (PERFORMANCE.md finding 7). No iPad pass.

Merged to `main`, tagged, pushed, deployed to sound-engine.xyz; portfolio case study updated and deployed.

## 1.2.0 prepared 2026-09-20 (branch `release/1.2.0`, local commits only)

Decisions table "Decisions after 1.1.0" in ROADMAP.md (21 rows). Done, in decision 16's order: lab page (`npm run lab`, 5195, not deployed); CI browser job and `npm run size` with the demo budget, Tone pinned `~15.1.22`; `enableMidi(inputId)` and the polyphony cap; `getSnapshot` / `applySnapshot` with morph; v1 deprecation line; `docs/INSTRUMENT_BRIEF.md`. Public tier thirty four methods. Eighteen gates. Harness rows added: control extremes (blocks), snapshot morph (blocks), switch and control audibility (recorded). Both browsers pass. The lab's first A/B found Flowers throwing Tone's [0, 1] RangeError at high bloom; fixed by clamping every NormalRange write (`setRampNormal`).

Not done, by design: the sound pass (1.3.0, needs the user's ears, PERFORMANCE.md finding 8 is its input: Mold and Bacteria controls are inaudible on one held note); the signature v1 sound port; the instrument (separate repo and session, starts from `docs/INSTRUMENT_BRIEF.md`). The demo shows no 1.2 feature beyond the Legacy heading; the lab is the 1.2 surface. No iPad pass.

1.2.0 merged, tagged, pushed 2026-09-20; CI browser job green on its first run; sound-engine.xyz and the portfolio case study updated.

## 1.2.1 prepared 2026-09-25 (branch `release/1.2.1`, local commits only)

Decisions table "Decisions on simplicity" in ROADMAP.md (27 rows). All five 1.2.1 items done: README and API.md fold (playing set of seven), demo Playing group with Wheel and Save and recall at the top and a Depth heading over the rest, lab v1 versus species A/B, first sound gate (Node, nineteen gates) and harness row (both browsers pass), instrument brief updated. No engine behaviour change. Verified in the browser: demo Playing group order, wheel route, save and recall with slider sync; lab Play v1 and Play species both audible.

## 1.2.2 cut 2026-09-25 (branch `release/1.2.2`, merged to `main`, tag `1.2.2`)

The instrument's player test found issue #1 on its first generative run: Bacteria's noise particle tripped Tone's "start time must be strictly greater" assertion when a swarm burst handed two particles to one tick, and the error escaped the scheduler tick as an uncaught error in the host. Fixed in `src/species/bacteria/synth.ts` (the noise synth and the pluck remember their last start and space a collision by 1 ms) and `src/engine/generative/Generator.ts` (species callbacks run through a guard that logs and carries on). New blocking harness row `generative mode runs clean on every species`. `release/1.3.0` carries the fix by merging `main`.

## 1.2.3 cut 2026-09-25 (branch `release/1.2.3`, merged to `main`, tag `1.2.3`)

The instrument's second finding: Mold on a held key is noise and feedback. That is the runaway comb and feedback loop fixed on `release/1.3.0` in `src/species/mold/effects.ts` and `src/species/bacteria/effects.ts`, ported here with the blocking harness row `held voice stays bounded`. The user's bar for the instrument is that every species is ambient by nature; Mold's level once stable (about twenty five times under Seed) and that bar are for the 1.3.0 sound pass. `release/1.3.0` carries the patch by merging `main`.

## Suggested order

1. Start the instrument session from `docs/INSTRUMENT_BRIEF.md`, pinned `#1.2.3`.
3. 1.3.0: the blind species verdict in the lab (decision 12), then the sound pass with the user, the signature port through the lab's v1 A/B, `docs/SOUND.md`, a phone pass by hand.
4. 2.0 after the port: v1 removal, the method fold, presets as snapshots, entry points (decisions 11, 17, 20, 27).

## Rules

- Commit locally on a branch; push, tag, and deploy only after the user's ok.
- Plantasonic and Signal 9 are separate projects. Do not modify them.
- No em or en dashes in new prose.
