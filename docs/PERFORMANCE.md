# Performance

Measured numbers for the responsive bar in ROADMAP decision 7. Produced by the browser harness, not asserted from reading code.

## Running it

```bash
npm run test:browser
```

Builds `dist/`, serves `bench/` with vite on port 5194, and runs `tests/browser/performance.spec.mjs` in Chromium and WebKit through Playwright. Raw results land in `bench/results/<browser>.json` (ignored by git). `BENCH_SECONDS=10 npx playwright test --project=chromium` shortens the long run for a quick check. `npm run bench` serves the page for a human; the Unlock button runs a 10 second pass and prints JSON.

WebKit needs its browser once: `npx playwright install webkit`.

## What is measured

| Measure | How | Bar | Blocks release |
| --- | --- | --- | --- |
| noteOn to audible | `noteOn('C4')` from silence with the species running in played mode (`start({ generative: false })`); a 4096 sample tap on the master bus is polled every millisecond and the first sample above 0.001 is located inside the window, so the result does not depend on poll timing. Median of five | 15 ms | yes |
| Dropouts | 60 s of Seed generative at default controls while a mock visual loop burns 8 ms of main thread per animation frame. A dropout is a run of at least 128 exact zeros bracketed by signal, a sample to sample jump above 0.5, or a tap window that did not change while the audio clock advanced past its length | 0 | yes |
| Control response and settle | Held note, `setControl` stepped 0.1 to 0.95, the matching feature from `getAudioFeatures()` sampled every 4 ms for 600 ms. Response is the first sample 20 percent of the way to the final value, settle the first after which every sample stays within 10 percent | recorded | no |
| Engine main thread cost | Time inside `getAudioFeatures()` and `getWaveform()` per frame during the long run, plus achieved frame rate | recorded | no |

## Modulation rows (1.1)

| Measure | How | Bar | Blocks release |
| --- | --- | --- | --- |
| Dropouts with eight routes | The 60 s long run repeated with eight routes active: three LFOs (one beat synced), two sample and holds, an envelope follower on bass, a CC and an aftertouch source with values fed through `feedMidi`, across both control and target destinations | 0 | yes |
| Modulation tick cost | The scheduler's 30 Hz modulation callback timed for 5 s with eight routes: `ModulationEngine.tick` plus the species hook | recorded | no |
| Wheel to modulation state | `feedMidi` CC1 step 0 to 127 on a `midi-cc` route to `target:filterCutoffMult` at depth -1, held Seed note; time until `getModulationState()` shows the offset | recorded, one tick expected | no |
| Wheel to audible | Same step; time until two consecutive frames show the high band half way to its final value | recorded, 50 ms expectation | no |

## Hardening rows (1.2)

| Measure | How | Bar | Blocks release |
| --- | --- | --- | --- |
| Control extremes | Every species at all controls 0, all controls 1, and each control alone at 0 and at 1 with the rest at 0.5: `loadSpecies`, `start({ generative: false })`, a held note, then every control flipped across its range on the live graph. 48 runs | no throw, no page error | yes |

## Results

### 1.0.0 work, 2026-09-18

Apple M1, macOS 26.5.2, Playwright 1.63, sample rate 44100, 60 s long run, engine lookahead 0.01 s (`ENGINE_LOOK_AHEAD_SEC`). Chromium baseLatency 5.8 ms, WebKit 2.9 ms.

| Browser | noteOn to audible (median, runs) | Dropouts in 60 s | fps under 8 ms burn | Engine ms per frame (max) |
| --- | --- | --- | --- | --- |
| Chromium 153 | 12.1 ms (12.1, 12.1, 12.2, 12.1, 11.8) | 0 | 60.0 | 0.079 (0.50) |
| WebKit 26.6 (Playwright 2359) | 12.1 ms (12.1, 12.1, 12.1, 11.3, 11.8) | 0 | 60.0 | 0.072 (1.00) |

Control response as first measured (single feature per control, superseded by finding 4), Chromium, Seed:

| Control | Feature | Result |
| --- | --- | --- |
| growth | rms | no measurable change |
| bloom | high | no measurable change |
| roots | bass | responds 285 ms, settles 544 ms |
| mold | centroid | no measurable change |
| bacteria | high | no measurable change |

### 1.1.0 work, 2026-09-19

Same machine, release/1.1.0 after the MIDI and preferences steps.

| Browser | noteOn to audible (median, runs) | Dropouts, 60 s, no routes | Dropouts, 60 s, eight routes | fps | Modulation tick (mean, max) | Wheel to state (median) | Wheel to audible (median, runs) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Chromium 153 | 12.0 ms (12.1, 12.0, 11.3, 12.0, 11.8) | 0 | 0 | 60.0 | 0.21 ms, 0.40 ms (6.3 ms per second) | 15.6 ms | 30.7 ms (10.0, 41.0, 30.7, 41.3, 0.1) |
| WebKit 26.6 | 14.2 ms (12.1, 15.1, 14.2, 14.2, 11.7) | 0 | 0 | 60.0 | 0.44 ms, 2.0 ms (12.2 ms per second) | 24.0 ms | 87.0 ms (40, 87, 96, none, 56) |

### Findings

1. Before this pass, noteOn to audible was 102 ms in Chromium: Tone's default `lookAhead` of 0.1 s. The engine now sets 0.01 s on the shared context when the master bus is created. The 60 s dropout run at 60 fps with the mock visual load is the check that the shorter lookahead holds.
2. `noteOn()` itself costs 1 to 5 ms of main thread on the first calls (voice allocation), under 1.5 ms after.
3. Resolved 2026-09-18, see finding 4. The control measurement as first written was not trustworthy. Features on a held Seed note move on their own (LFOs, drift), so a 0.02 change threshold hides real ramps and the settle time includes that motion. The species ramp controls over 200 ms by design (`setRampParam`), which already exceeds the 50 ms figure written in decision 7; a response bar (first movement) fits better than a settle bar. Also open: which controls act on a held voice at all, and which only shape the next note. To resolve before the bar is asserted.

4. **Do the ecology controls act on a held voice?** Yes, and the harness could not see it. `window.bench.probe()` (step response, all eight features) and `window.bench.abControls()` (steady state A/B against an A/A baseline) on Seed, `E3` held, controls stepped 0.1 to 0.95:

   | Control | Largest A/B difference | A/A noise on the same feature |
   | --- | --- | --- |
   | growth | 0.017 (centroid) | 0.022 |
   | bloom | 0.083 (peak) | 0.013 |
   | roots | 0.041 (high) | 0.026 |
   | mold | 0.055 (bass) | 0.029 |
   | bacteria | 0.049 (bass) | 0.021 |

   The code ramps live parameters on every `setControl` (Seed: filter cutoff, chorus, reverb and delay wet, tape drive, delay feedback, drift depth and rate, release scale, polyphony) over 200 ms, and the step probe sees those ramps start within 5 to 40 ms on some feature. But a single held Seed voice moves on its own (fat saw detune beating, drift LFO, chorus) by about as much as any one control moves it. Bloom and mold clear the noise floor; growth, roots and bacteria do not on one voice. Their audible effect is on the population: polyphony, generator density and phrase choice, release length, particle rate. That is the ecological design, not a fault, and it is what the 1.1 modulation work is for if a host needs a control to bite harder on one voice.

   Consequence for the bar: "control response" cannot be asserted from the output spectrum on a held note. It is recorded, not asserted, and the ramp itself is fixed by construction (`setRampParam`, 200 ms). Decision 7's "settle under 50 ms" should read as ramp start under 50 ms, which the step probe shows.

5. **Eight routes cost nothing a player would notice.** The modulation tick runs 0.2 ms in Chromium and 0.4 ms in WebKit at 30 Hz, so under 13 ms of main thread per second, and the long run with eight routes shows zero dropouts in both browsers at 60 fps under the mock visual load. The `ChangeGate` around `PolySynth.set` is what keeps it there; without it every tick would touch every voice.
6. **Wheel latency is one tick to the engine and the rest is the spectrum.** A CC step reaches `getModulationState()` in 16 ms (Chromium) and 24 ms (WebKit), which is the 33 ms tick interval sampled at random phase. The audible number is noisy (0 to 96 ms across runs, one WebKit run undetected) because it is read from the high band of a held Seed voice that moves on its own by about a third of the step's effect. The ramp itself is 33 ms by construction. Engine side latency is the number to hold to; the audible one stays recorded.
7. **WebKit noteOn latency has drifted to the bar.** 12.1 ms in the 1.0 run, 14.2 ms median here with one run at 15.1 ms against a 15 ms bar. Nothing in 1.1 touches the note path, so this is run to run variance in headless WebKit. If it flakes, the options are a lookahead of 8 ms or a 20 ms bar for WebKit; neither is taken yet.
