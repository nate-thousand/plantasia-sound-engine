# Plantasia Sound Engine · Handoff

Written 2026-09-17 when engine development was given its own session, separate from the portfolio chat.

## Where things stand

- This clone was made 2026-09-17 from GitHub `nate-thousand/plantasia-sound-engine`, branch `v2-sound-world-engine` (HEAD `6fdf137`, "Ship validated demo control surface and point Vercel site at demo/"). `main` is the frozen v1 preset API.
- The copy vendored in `../plantasonic-platform/packages/sound-engine` is byte identical to this branch's `src/` and `demo/` (only a generated `src/presets/bundled` differs). One source of truth; treat this clone as it.
- Version `1.0.0-beta.1`. Verified 2026-09-17: `npm run typecheck` clean, `npm run build` passes all fourteen postbuild gates (presets, species API, ecology, generative, performance, registry, lifecycle, facade, events, scheduler, MIDI, species audio, performance budget, v2 engine).
- Live demo sound-engine.xyz returns 200 and is the `demo/` control surface (Vercel, `npm run build:site`).
- Demo locally: `npm run demo -- --port 5193 --strictPort` (the portfolio's `.claude/launch.json` has this as `sound-engine`).

## Bugs found while capturing the case study (not fixed here)

1. **The stage is dead for most of the engine.** `getWaveform()` and `getLevel()` in `src/engine/audioEngine.ts` read the v1 Tone `Analyser` and `Meter` that hang off the basic Tone synth chain (`reverb -> analyser`). Two output paths never touch them:
   - The Plantasonic signature preset (`src/synths/plantasonicAudio.ts`) is a raw Web Audio graph ending in `masterGain.connect(audioCtx.destination)`.
   - Every v2 species has its own analyser (`src/species/seed/effects.ts`: `master -> analyser -> destination`) that the facade does not expose.
   So with the flagship preset or any generative species playing, the demo waveform is flat and Master and Peak read 0. Only the basic presets (Bloom, Canopy, Moss, Mycelium, Roots, Winter, Desert, Rainforest, Mutation) through Play Preset Chord show a signal. Fix: one master analyser and meter that every path feeds, exposed through the facade.
2. **Demo RMS math is wrong.** `demo/lib/visualizer.js` computes `sum((wf[i] - 0.5)^2)`; Tone's waveform analyser is centered on 0 in the range -1 to 1, so silence reads as RMS 100 and the bass, mid, treble meters (derived from waveform thirds) pin at 100 too. Fix: drop the 0.5 offset.
3. Once 1 is fixed, re-run the `docs/DEMO_CONTROL_AUDIT.md` pass for the Audio Analysis section, which currently carries the hint "v1 analyser path. May not reflect v2 species output".

## Open roadmap (from ROADMAP.md)

Milestone 3: modulation matrix, sample and hold, envelope followers. Milestone 4: MIDI Learn, aftertouch, MPE. Milestone 5 (types only today): Euclidean sequencer, arpeggiator, probability gates, chord generator, scale quantizer. Eight `coming_soon` species (canopy, moss, spores, mycelium, desert, ocean, rainforest, tundra).

## Suggested order

1. Fix the two demo bugs above and deploy, so the live control surface shows what the engine is doing.
2. Decide the next real milestone with the user before building anything else. The ASCII Visual Engine went through a grill on "simpler, more powerful, more responsive" that produced a decisions table at the top of its ROADMAP.md (`../ascii-visual-engine/ROADMAP.md`); the same exercise fits here.
3. Keep the portfolio case study (`../portfolio-2.0/work/sound-engine.html`) in step with releases: version, species count, preset count, gate count.

## Rules

- Commit locally on a branch; push, tag, and deploy only after the user's ok.
- Plantasonic and Signal 9 are separate projects. Do not modify them.
- No em or en dashes in new prose.
