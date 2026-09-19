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
