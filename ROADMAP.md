# Roadmap

Milestones for Plantasia Sound Engine development.

The engine is transitioning from a **preset-centric v1 runtime** (frozen at tag `v1-sound-engine-baseline`) to a **species-centric Sound World Engine** on branch `v2-sound-world-engine`. Architecture vision: [docs/SOUND_WORLD_ENGINE.md](./docs/SOUND_WORLD_ENGINE.md). **Migration:** [docs/MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md).

---

## Decisions (settled 2026-09-18)

A grill on "what is the next milestone" closed with these. They rank everything below; where an older section disagrees, this table wins.

| # | Decision | Consequence |
| --- | --- | --- |
| 1 | The milestone is judged against the one real host: the Plantasonic platform's `createSoundEngineAdapter()` and its audio reactive bridge. | Its measurable gaps (five controls, a placeholder analyzer, events without timing) set the work. No host drives the feature list beyond that |
| 2 | More powerful means depth reachable from the host surface, not more species or a sequencer. | Modulation routable from controls and events comes before new species. Breadth and sequencing are not milestones |
| 3 | The engine owns audio analysis. | `getAudioFeatures()` returns raw per frame `{ rms, peak, bass, mid, high, centroid, onset }` off the master bus (FFT 2048, fixed band edges: bass under 200 Hz, mid 200 Hz to 2 kHz, high above). One push event `onset { time, strength }`. `peak` holds with a short decay; all other smoothing is the host's |
| 4 | Every event carries `time` in AudioContext seconds. `noteReleased` is added. | Visual hosts can place notes on the audio clock. Scheduled lookahead can arrive later without changing payload shapes |
| 5 | Simpler means two tiers, nothing removed. `plantasia-sound-engine/public` is v2 only; the root export keeps the v1 surface as legacy. | Public tier: `createPlantasiaEngine`, `init`, `loadSpecies`, `loadDefaultSpecies`, `loadPreset`, `start`, `stop`, `dispose`, `noteOn`, `noteOff`, `allNotesOff`, `setControl`, `getControl`, `setTempo`, `on`, `off`, `getAudioFeatures`, `getWaveform`, `getLevel`, `getState`, `getCurrentSpecies`, `getAvailableSpecies`, `registerSpecies`, `enableMidi`, plus `presets` and the Plantasonic adapter. Legacy on root: `playPreset`, `updateParameter`, `applyBotanicalControls`, `setMold`, `getMold`, `triggerChord`, `getParameterMetadata`, `stopSpecies`, `initialize`, the `createXSoundWorld` factories |
| 6 | `setControl` stays typed to the five ecology controls. | Species depth arrives as modulation in 1.1 (`modulate(source, destination)`, destinations = five controls plus `PerformanceTargets`), never as a string parameter namespace |
| 7 | Target machines: laptop and iPad Safari. Responsive means, in order: noteOn to audible under 15 ms, zero dropouts over 60 s of Seed at default density with a mock visual loop burning 8 ms per frame, control ramps start under 50 ms and complete over 200 ms by design, engine main thread time per frame recorded. | Measured by a Playwright harness (Chromium and WebKit) as `npm run test:browser`, outside postbuild. Numbers recorded per release in `docs/PERFORMANCE.md`. Only the first two block a release. One manual iPad pass per release. Amended 2026-09-18: control response is recorded, not asserted; on a single held voice the ecology controls move the spectrum less than the voice moves itself (PERFORMANCE.md finding 4) |
| 8 | Milestone 5 (sequencing) is retired. | Scale quantizer and chord generator become host settable `GenerativePreferences` via `setGenerativePreferences()` in 1.1. Euclidean, arpeggiator, probability gates are dropped |
| 9 | The eight `coming_soon` species are cut. `getUpcomingSpecies()` and the `'coming_soon'` status are removed at 1.0. | A registered species is playable. The species template stays for when an instrument needs a fifth |
| 10 | MIDI: CC, aftertouch and pitch bend surface as events and modulation sources in 1.1. MIDI Learn is host UI. MPE is deferred until a controller use case exists. | Falls out of the 1.1 modulation work; no separate milestone |
| 11 | Hosts consume a git tag. The byte identical copy vendored in plantasonic-platform is folded back here and retired. | That fold is plantasonic-platform's change, not this repo's |
| 12 | Release sequence: `1.0.0-beta.2` now (master bus stage fix, demo RMS fix, dead per species analysers removed), then `1.0.0`, then `1.1.0`. | 1.0.0 = analysis and event timing, harness with first measured numbers, two tier facade with `docs/API.md` rewritten as the one page public surface (`API_V1.md` kept), coming_soon removal, merge `v2-sound-world-engine` into `main`, tag. In that order, so the frozen surface includes analysis and any latency problem is found first. 1.1.0 = modulation, generative preferences, MIDI sources; grilled when 1.0 ships |
| 13 | The demo keeps its v1 sections, grouped under a Legacy (v1) heading, still wired. | The demo is a harness for everything the engine does; the heading says which half to build on |
| 14 | The portfolio case study is updated at 1.0 only. | beta.2 changes no counts |
| 15 | Git: commit locally on the branch. Push, tag and deploy only after the user's ok. | |

## Decisions for 1.1.0 (settled 2026-09-19)

A grill on the modulation milestone closed with these. Branch `release/1.1.0` off `main`; commits local, tag on the user's ok.

| # | Decision | Consequence |
| --- | --- | --- |
| 1 | Modulation is for host performance first: a player's mod wheel, aftertouch or pitch bend reaching a control or a target. Internal life (LFO, sample and hold) and visual coupling ship with it because they are the same source machinery. | Defaults and the harness bar follow the performed case |
| 2 | Modulation lives in the engine, global, beside the species manager. Species see only resulting values. | One implementation; routes survive a species switch; a species with built in motion keeps its own LFOs in its graph |
| 3 | Modulation adds to the host's base, clamped. `setControl` sets base, `getControl` returns base, the modulated value is in `getModulationState()`. Targets modulate around their neutral value. | The host's slider is never overwritten and never lies |
| 4 | Sources are plain serializable descriptors with an `id`; the engine instantiates them. The same `id` used in two routes is one source. | A host can save routes in a preset and send them over a wire |
| 5 | Source set for 1.1: `lfo` (sine, triangle, square, saw; bipolar by default, `unipolar: true` option), `sample-hold` (random, `slew` seconds), `follower` (own master bus, `band: rms \| bass \| mid \| high`, attack and release), `midi-cc` (`cc`, optional `channel`), `midi-aftertouch`, `midi-bend`. Rates as `{ hz }` free running or `{ beats }` synced to `Transport` BPM with phase reset on `play()`. | Random walk, step sources, sampling another source, and external audio input are later work |
| 6 | Depth is -1..1. Unipolar sources read 0..1, bipolar -1..1. Control result `clamp01(base + depth × source)`. Target offset `depth × source × span` from `MODULATION_TARGET_SPANS`, one span per numeric target (`filterCutoffMult` ±0.5, `attackMult` and `releaseMult` ±0.75, `brightnessAdd` ±0.5, `chorusDepthMult` ±0.5, `reverbWetAdd` ±0.3, `saturationAdd` ±0.4, `oscBlendAdd` ±0.5, `stereoWidthMult` ±0.5, `instabilityAdd` ±0.5, `particleRateMult` ±0.75, `generativeDensityAdd` ±0.4, `noteVelocityScale` ±0.5). `legato` is not a destination. | Spans are exported, documented, and tuned by ear in the demo before 1.1.0 |
| 7 | The modulation engine ticks on the scheduler at 30 Hz and calls a new optional `SoundWorld.applyModulation(frame)`: modulated control values on the species scale plus target offsets. Species ramp over one tick (33 ms). Species without the hook get nothing. | The four built in species implement it; the template documents it; 1.0 custom species keep working |
| 8 | API: `modulate(source, destination, depth)` returns `{ id, set(partial), remove() }`; `removeModulation(id)`; `getModulationRoutes()`; `getModulationState()` returns `{ sources, controls: { base, modulated }, targets }` for per frame polling. Destinations are `'bloom'` style control names or `'target:filterCutoffMult'`. One event `modulationChanged { routes }` on add, set or remove. Modulation never emits `controlChanged` per tick. | Polling for values, events for structure, as features and notes already work |
| 9 | MIDI: `WebMidiManager` decodes CC, channel pressure and pitch bend, normalised 0..1 and -1..1, all channels unless filtered, 7 bit only. One host event `midiControl { kind, controller?, value, channel, time }` so a host can build MIDI Learn. A MIDI source reads 0 and shows inactive until `enableMidi()`. | MIDI Learn stays host UI (decision 10 of 1.0); MPE stays deferred |
| 10 | `setGenerativePreferences(partial)` and `getGenerativePreferences()`. The engine stores host overrides and merges them over every species' defaults on load. Fields: `preferredScale`, `chordVoicings`, `phraseLength`, `probabilityBias`, `dronePreference`, `harmonyStyle`, `rhythmStyle`, `preferredTempo`. Scale, voicings, harmony style and rhythm style land at the next phrase boundary; tempo, density, probability and drone preference land immediately. | A scale is a host decision that follows the player across species. `Generator` accepts runtime updates |
| 11 | Route lifecycle: routes may be created in any state; sources run only while `running`; `stop` holds phase and value; `dispose` clears routes; a species switch keeps them; a route to a target the loaded species ignores is a silent no op, documented per target. | `route.set({ phase: 0 })` is the explicit reset |
| 12 | Harness rows: zero dropouts over 60 s with eight active routes at 30 Hz under the 8 ms mock load (blocks); engine main thread cost per frame with eight routes (recorded); synthetic `midi-cc` step to `target:filterCutoffMult`, time to first spectral movement, 50 ms expectation (recorded). | `docs/PERFORMANCE.md` gains a 1.1 section |
| 13 | Public tier grows to thirty methods: `modulate`, `removeModulation`, `getModulationRoutes`, `getModulationState`, `setGenerativePreferences`, `getGenerativePreferences`; events `modulationChanged` and `midiControl`. All additive. | `docs/API.md` stays one page |
| 14 | Demo Modulation section: a route builder (source fields, destination select, depth), the live state readout, and a preset of three routes (LFO on bloom, follower bass to roots, CC1 to filter cutoff). No more. | The demo shows every source and destination once; hosts own the real UI |
| 15 | One release. Order: modulation engine, species hook, LFO and sample and hold, spans; envelope follower; MIDI sources and event; generative preferences; harness rows; demo section and docs; tag 1.1.0. | The harness lands before the demo so the numbers exist when the surface is written up |

## Decisions after 1.1.0 (settled 2026-09-20)

A grill on "what comes after 1.1" closed with these. They set the order of work from here to 2.0; where an older section disagrees, this table wins.

| # | Decision | Consequence |
| --- | --- | --- |
| 1 | The first real instrument pulls engine work. Until it exists the engine posture is quality and hardening, not features. | Feature requests come from a player, not from the roadmap |
| 2 | A listening pass on the sound itself is a milestone before new features. It needs the user's ears and cannot be automated. | The tool for it (decision 9) is built first so the pass can start when the user has time |
| 3 | Hardening for 1.2: the Playwright harness runs in GitHub Actions, the demo bundle gets a 500 KB budget, Tone.js is pinned to a minor. | CI is the second gate after the seventeen Node postbuild checks |
| 4 | `getSnapshot()` and `applySnapshot()` are the core of 1.2. | A host can save, restore and send a whole engine state as one JSON object |
| 5 | Triage of the old roadmap: cut the effect rack, preset browser UI, keyboard API and procedural variation; defer voice stealing, MPE and external audio input; keep soon `enableMidi(inputId)` and a polyphony cap; offline render is a candidate only if the instrument asks. | The retired sections below are history, not plans |
| 6 | The v1 path is deprecated now and removed at 2.0. The signature v1 sounds are ported into species before removal. | Nothing a player can hear today is lost at 2.0 |
| 7 | Releases are milestone driven, not calendar driven. | A version ships when its table rows are done and measured |
| 8 | The played instrument is a new repo from the `create-plantasonic-app` template, pinned to `#1.1.0`, built in a separate session. | This repo never contains instrument UI; engine requests come back as issues here |
| 9 | A separate `lab/` page: species select, held note or chord, one control sweep with ramp on and off, species A/B, a span editor that emits JSON, analyser bands. Same pattern as `bench/` (`npm run lab`, own Vite config), not deployed. | The demo stays the control surface for showing; the lab is for tuning by ear |
| 10 | The sound pass produces per species control depth constants, tuned spans, and `docs/SOUND.md`. Bar: for every control on every species the A/B spectral difference exceeds A/A noise on at least one feature. | PERFORMANCE.md finding 4 becomes a fixed number per control, not a caveat |
| 11 | CI blocks on dropouts and page errors, records noteOn latency and warns above 25 ms. The 15 ms bar stays the local release check on the reference machine. | WebKit's 14.2 ms drift (finding 7) is watched, not blocking, in CI |
| 12 | A size gate bundles `dist/public.js` with esbuild and records the number. Budgets for the engine are set next release from that number; the demo budget is 500 KB now. | First measurement before the first bar, as with latency |
| 13 | Snapshot shape: `{ version: 1, speciesId, controls, tempo, routes, preferences, presetId? }`. `applySnapshot` is async, replaces all routes, and throws `SnapshotError` on an unknown species or version. | Routes and preferences are already serializable descriptors (1.1 decision 4); nothing new is invented |
| 14 | Morph: `applySnapshot(target, { morphSec })` interpolates controls and tempo over `morphSec`; routes and preferences land at the start; a species switch happens at the start without crossfade. | A crossfade needs two live species graphs and is deferred until an instrument needs it |
| 15 | v1 deprecation line: JSDoc `@deprecated` on every legacy method, one `console.info` on the first legacy call per session, a banner on `docs/API_V1.md`, demo Legacy heading reads "removed at 2.0". | No behaviour changes in 1.x |
| 16 | 1.2 order: lab page; CI harness and size measurement; `enableMidi(inputId)` and polyphony cap; snapshot and morph; v1 deprecation line; then the sound pass with the user; signature port after. The instrument proceeds in parallel. | The lab page is first because the sound pass is the slowest item and depends on the user's time |
| 17 | Public tier after 1.2: `getSnapshot`, `applySnapshot`, `setPolyphony`, `getPolyphony`, and an optional `inputId` on `enableMidi`. Thirty four methods, all additive, still one page. | A polyphony cap is a host's CPU knob on a phone; it belongs on the surface |
| 18 | Harness rows for 1.2: a 5 s morph between two snapshots across a species switch with dropouts counted (blocks); `applySnapshot` with a species switch, time until the new species is audible (recorded); control audibility per decision 10 for every control on every species (recorded in 1.2, blocks once the sound pass has set the depths). | `docs/PERFORMANCE.md` gains a 1.2 section |
| 19 | The lab page is not deployed to sound-engine.xyz. | It reads and writes span JSON pasted into the source; that is a local workflow |
| 20 | `docs/INSTRUMENT_BRIEF.md` is written here: what the engine offers at 1.1.0, the thirty methods with the six an instrument starts from, the mod wheel and species switch stories, the pin, and the rule that engine requests come back as issues to this repo. | The one document that crosses the project boundary without either session touching the other's code |
| 21 | Versions: 1.2.0 = hardening, MIDI input select, polyphony, snapshot and morph, lab page, v1 deprecation line. 1.3.0 = the sound pass, because it changes what a player hears. Then the signature sound port. 2.0 = v1 removal. | A sound change is never a patch |

## Decisions on simplicity (settled 2026-09-25)

A grill on "what this is and how to make it simpler and better" closed with these. They set 1.2.1, 1.3.0 and 2.0; where an older section disagrees, this table wins.

| # | Decision | Consequence |
| --- | --- | --- |
| 1 | The thing being simplified is the engine library. The demo is its mirror: when the engine gets simpler the demo shrinks. The case study follows what ships. | No separate demo or docs redesign |
| 2 | Simple is judged for the player, through the developer. Every concept the developer must expose becomes a control the player must understand. | The developer path is optimised for what a player can feel: notes, five sliders, one wheel, a species switch, save and recall. Everything else is depth |
| 3 | The one sentence: an instrument that plays itself and answers you. The nouns (four species, five controls, hosts own the UI) come second. | README, API.md and the case study lead with it; every feature is tested against it |
| 4 | Thirty four methods stay until 2.0; the additive promise from 1.0 holds. The docs lead with a playing set and fold the rest. | Simpler is what is read first, not what exists |
| 5 | Removing the v1 audio path is the largest simplification available and it waits for the signature port, because it changes what a player hears. | Port in 1.3 as part of the sound pass; remove at 2.0 right after. Never remove before the port |
| 6 | Whether Mold and Bacteria earn their place is decided by ear before the sound pass, not assumed. Until then the docs and demo lead with Seed and Flowers. | Decision 12 is the test |
| 7 | Better is defined by the first stranger who plays it. Bars: every control audible on every species, and a real phone. Doc check: lines to first sound. | Decisions 13, 14, 15 |
| 8 | The playing set is seven: `init`, `loadSpecies`, `start`, `noteOn` with `noteOff`, `setControl`, `modulate`, `applySnapshot`. | `modulate` stays because a wheel to a filter is the one thing `setControl` cannot do |
| 9 | API.md stays one page with two headings: Playing (the seven and a runnable snippet) and Everything else (the same tables as now). The README leads with the sentence and the snippet, nothing else. | The fold is a heading, not a file |
| 10 | The demo opens on the playing set: species, five sliders, keys, one wheel route, save and recall. Everything else collapses under a Depth heading. Nothing is removed until 2.0. | Snapshots get their first demo presence |
| 11 | At 2.0: `loadDefaultSpecies` folds into `loadSpecies()` with no argument; `getWaveform` and `getLevel` fold into `getAudioFeatures`; `off` goes (`on` returns unsubscribe); `stopSpecies` and `initialize` go with v1; `loadPreset` becomes `applySnapshot(preset)` and the presets ship as snapshots. About twenty seven methods. | Presets and snapshots become one concept; the preset id adapter goes with them |
| 12 | The species verdict: in the lab, one held note and one generative minute per species, eyes closed. A species stays when it is distinguishable from the other three and every control does something you can name. This is the first hour of the sound pass, before any tuning. | A species you cannot name blind is not a species yet |
| 13 | The player test: the first person who is not the author, on the instrument's first build, five minutes with nothing explained, then three questions: what did the sliders do, which sound was which, would you keep going. Two passes, sliders unlabelled then labelled. Written into the instrument brief as the instrument's acceptance; answers come back as engine issues. | What they cannot work out unprompted is the engine's next simplification |
| 14 | Phone bar: the bench page run on a phone over the LAN, latency and dropouts recorded by hand beside the WebKit column, once per release from 1.3. The instrument on the phone as well once it exists. No emulation. | Recorded, not blocking, until an instrument exists |
| 15 | Lines to first sound is a bar: six today (import, create, `init`, `loadSpecies`, `start`, `noteOn`). The README's first code block is that snippet, a gate runs it against the built dist, and 2.0 may not raise the count. | `loadSpecies()` with no argument makes the Seed case five at 2.0 |
| 16 | Sequence: 1.2.1 = docs fold, demo reorder with save and recall, the six line gate, the lab's v1 versus species A/B, the brief update. 1.3.0 = species verdict, sound pass, signature port, phone pass. 2.0 = v1 removal, the method fold, presets as snapshots, entry points, any renames. | 1.3 is the sound release and nothing else |
| 17 | A preset at 2.0 is a snapshot with an optional `meta` block (`name`, `visual`) that the engine validates and carries but never applies. The visual contract lives there. | Hosts read `meta`; the engine renders nothing, as before |
| 18 | The signature port: one snapshot per v1 preset that, on its species, passes the author's ear A/B against the v1 chain in the lab. A preset that cannot pass gets a species change in the sound pass, or is dropped with the user's ok. Nothing is removed until all eleven have a verdict, recorded in `docs/SOUND.md`. | The v1 chain stays in the lab as the reference until 2.0 ships |
| 19 | Save and recall in the demo: Save (named, local storage and JSON), a Recall list, a morph seconds field, and Copy JSON. Nothing leaves the browser. | The player's save and the developer's take away in one bar |
| 20 | Entry points at 2.0: the package root is the public tier; `plantasia-sound-engine/internals` carries the master bus, scheduler, species factories, `feedMidi` and the lab overrides; `/public` stays one release as an alias. | A host imports the package name and gets nothing it should not see |
| 21 | The player test hides the control names on the first pass. If a stranger names a slider better than growth, bloom, roots, mold or bacteria, that is the name. | The five names have never been tested on anyone |
| 22 | The instrument brief is updated in 1.2.1: pin `1.2.0`, the playing set of seven, the player test with both passes as the instrument's acceptance, "coming" reduced to the sound pass and 2.0. | The other session starts from the tag that exists |
| 23 | 1.3 ships only when all four species pass decision 12. No status field, no removal from the registry. | A registered species is playable, still |
| 24 | 1.3 does not wait for the player test. The sound pass is judged by the author's ears; the stranger's answers feed the release after. | The sound release is not held to another project's calendar |
| 25 | The lab's v1 versus species A/B is built in 1.2.1, before the work it measures. | A Play v1 button beside the species A/B, on the lab's root access |
| 26 | Control renames land at 2.0 only, with the old name kept as an alias for one release. Until then the instrument labels its sliders as the test says. | A control name is on the public tier; a rename is breaking |
| 27 | Presets at 2.0 ship as a map by id: `applySnapshot(presets.bloom)`. The JSON is the same object for anyone who wants a file. | A preset browser needs a map; the sentence reads as it is |

## Current status

| Item | Value |
|------|-------|
| **Package version (package.json)** | `1.2.0` |
| **Honest integration target** | `1.2.0`: snapshots and morph, polyphony cap, MIDI input select, CI harness, size gate, v1 deprecated |
| **Production branch** | `main` (from 1.0.0; `v2-sound-world-engine` merges in at that tag) |
| **Development branch until 1.0.0** | `v2-sound-world-engine` |
| **v1 freeze tag** | `v1-sound-engine-baseline` |
| **Deprecated tag** | `v2.0.0` — architecture milestone only; **do not pin** |
| **Live species** | Seed, Flowers, Mold, Bacteria |
| **Public API** | `plantasia-sound-engine/public`, [docs/API.md](./docs/API.md) (decision 5) |
| **Architecture phases** | ✅ Phases 8–21 complete |
| **Integration** | [PLANTASONIC_INTEGRATION.md](./docs/PLANTASONIC_INTEGRATION.md) |
| **Performance** | [docs/PERFORMANCE.md](./docs/PERFORMANCE.md): 12 ms noteOn to audible, zero dropouts including through a 5 s morph, Chromium and WebKit, in CI |
| **Live demo** | https://sound-engine.xyz — demo control surface (validated) |

### What shipped in 1.0.0-beta.1

Phases 17–21 deliver a host-safe unified facade, lifecycle enforcement, semantic events, central scheduler, Web MIDI scaffold, Plantasonic adapter, validation gates, and Vercel demo deploy.

### Release tags

| Tag | Description |
|-----|-------------|
| `v0.1.0` | First stable browser engine |
| `v0.2.0` | Sound Worlds API, mold profile exports, preset validation |
| `v1-sound-engine-baseline` | Frozen engine before v2 refactor |
| `v2.0.0` | **Deprecated** — Sound World architecture landed; premature major tag |
| `1.0.0-beta.1` | Honest Sound World integration beta (Phases 17 to 21) |
| `1.0.0-beta.2` | Master bus analysis, Bacteria recursion fix, demo control surface |
| `1.0.0` | Analysis API, event timing, performance harness, two tier facade, placeholder species removed |
| `1.1.0` | Modulation engine, MIDI CC, aftertouch and bend, generative preferences, thirty method public tier |
| `1.2.0` | **Current**: snapshots and morph, polyphony cap, `enableMidi(inputId)`, CI harness, size gate, lab page, v1 deprecated, thirty four method public tier |

**Plantasonic should pin:** `1.1.0`, not `v2.0.0`.

---

## Integration blockers (complete)

All blockers shipped in **`1.0.0-beta.1`**:

| Blocker | Phase | Status |
|---------|-------|--------|
| Lifecycle contract — states, throws, `LIFECYCLE.md` | 17 | ✅ |
| Playable-only default registry; remove `coming_soon` from host API | 17 | ✅ |
| Unified `PlantasiaEngine` facade + tiny exports | 18 | ✅ |
| `resolvePresetToSpecies()` adapter | 18 | ✅ |
| `registerSpecies()` for external packages | 18 | ✅ |
| Event bus for visuals | 19 | ✅ |
| Unified scheduler (replace ad-hoc timers) | 20 | ✅ |
| MIDI / transport | 20 | ✅ |
| `MIGRATION_V1_TO_V2.md` | 21 | ✅ |
| Browser sonic test (`validate-species-audio.mjs`) | 21 | ✅ |
| CPU + performance budget test | 21 | ✅ |
| Plantasonic adapter + integration doc | 21 | ✅ |

---

## v2 Sound World Engine

### Organism archetypes

| Species | Folder | Character |
|---------|--------|-----------|
| **Seed** | `src/species/seed/` | Birth — Plantasonic / Plantasia inspiration |
| **Flowers** | `src/species/flowers/` | Bloom — Juno inspired |
| **Mold** | `src/species/mold/` | Decay — tape, haunted ambient |
| **Bacteria** | `src/species/bacteria/` | Microscopic motion — particles, random life |

### Documentation (complete)

- [x] **Task 2.1** — README Sound World positioning
- [x] **Task 2.2** — [docs/SOUND_WORLD_ENGINE.md](./docs/SOUND_WORLD_ENGINE.md) — architecture, layers, organism archetypes
- [x] **Task 2.3** — [docs/API.md](./docs/API.md) — v2 target public API contract
- [x] **Task 2.3** — [docs/API_V1.md](./docs/API_V1.md) — v1 implementation reference preserved
- [x] **Task 2.4** — [docs/ENGINE_AUDIT.md](./docs/ENGINE_AUDIT.md) — full v1 audit and migration plan

### Implementation

- [x] **Phase 3** — Folder structure and READMEs
  - `src/engine/` — core runtime (existing code + README)
  - `src/species/` — seed, flowers, mold, bacteria (all live)
  - `src/shared/` — cross-species helpers (`syncGeneratorEcology`, `syncPerformanceEcology`)
  - `src/templates/` — species template for new plugins
- [x] **Phase 4** — Sound World interface contract
  - `src/engine/SoundWorld.ts` — `SoundWorld`, `SpeciesId`, `EcologicalControl`, `SoundWorldMetadata`
  - `src/engine/index.ts` — barrel exports
- [x] **Phase 5** — `SpeciesManager`
  - `src/engine/SpeciesManager.ts` — register, load, switch, delegate notes and controls
  - Not yet wired into `PlantasiaEngine` or v1 preset system
- [x] **Phase 6** — Species module scaffolding *(superseded by Phases 8–11)*
  - `src/species/seed|flowers|mold|bacteria/index.ts` — initial `SoundWorld` stubs and metadata
  - `src/species/index.ts` — barrel export (`seedSpecies`, `flowersSpecies`, …)
  - [docs/SPECIES.md](./docs/SPECIES.md) — species reference
- [x] **Phase 7** — Species registration and smoke tests *(superseded by Phases 8–11)*
  - `src/engine/createSpeciesManager.ts` — factory with all four species pre-registered
  - `scripts/validate-species-api.mjs` — registration and load smoke test (`npm run test:species`)
  - All four species now live with full audio graphs; still not wired to `PlantasiaEngine` or browser demo
- [x] **Phase 8** — Seed Sound World (reference implementation)
  - `src/species/seed/` — `synth.ts`, `effects.ts`, `generator.ts`, `metadata.ts`, live `SoundWorld`
  - Plantasonic-inspired Tone.js PolySynth + effects + pentatonic generator
  - `DEFAULT_SPECIES_ID = 'seed'`, `loadDefaultSpecies()` on `SpeciesManager`
  - v1 `playPreset` / browser demo unchanged
- [x] **Phase 9** — Flowers Sound World (Juno-inspired bloom)
  - `src/species/flowers/` — saw + pulse + sub stack, dual chorus, hall reverb, chord bloom generator
  - `createFlowersSoundWorld()` registered in `createSpeciesManager()`
  - Ecological controls: growth, bloom, roots, mold, bacteria mapped to Flowers DSP
  - Clearly distinct from Seed; chorus central to identity
  - v1 `playPreset` / browser demo unchanged
- [x] **Phase 10** — Mold Sound World (decay / decomposition)
  - `src/species/mold/` — drone + FM + noise layers, degradation effects chain, texture generator
  - `createMoldSoundWorld()` registered in `createSpeciesManager()`
  - `mold` control drives tape wear, flutter, feedback, distortion — species identity
  - `bacteria` control adds microscopic glitches and granular artifacts
  - Clearly distinct from Seed and Flowers; v1 `playPreset` / browser demo unchanged
- [x] **Phase 11** — Bacteria Sound World (microscopic particles)
  - `src/species/bacteria/` — NoiseSynth + FM + sine + pluck micro-voices, probability swarm generator
  - `createBacteriaSoundWorld()` registered in `createSpeciesManager()`
  - `bacteria` control drives particle density, trigger probability, swarm complexity
  - Dedicated procedural Bacteria species (beyond `mycelium` JSON preset)
  - All four species distinct; v1 `playPreset` / browser demo unchanged
- [x] **Phase 12** — Shared ecological controls system
  - `src/engine/EcologyControls.ts` — normalized 0–1 state, clamp, reset, applyTo
  - `SpeciesManager` holds ecology state; applies on `setControl` and `loadSpecies`
  - `scripts/test-ecology-controls.mjs` — defaults, clamping, reset, mock apply, species switch persistence
  - Species mappings unchanged inside each `setControl()`
- [x] **Phase 13** — Generative Ecosystem Engine
  - `src/engine/generative/` — Generator, PhraseEngine, HarmonyEngine, RhythmEngine, ProbabilityEngine, MemoryEngine
  - Species provide `GenerativePreferences` in metadata; thin adapters in `generator.ts`
  - Ecological controls shape composition; `scripts/test-generative-engine.mjs`
  - [docs/GENERATIVE_ENGINE.md](./docs/GENERATIVE_ENGINE.md)
- [x] **Phase 14** — Expressive Performance Engine
  - `src/engine/performance/` — PerformanceEngine, ExpressionRouter, VelocityEngine, DensityEngine, MacroEngine
  - Species expression profiles + `performanceApply.ts` per species
  - Velocity beyond volume; density reactions; ecological macros as expressive behaviors
  - `scripts/test-performance-engine.mjs` — `npm run test:performance`
  - [docs/PERFORMANCE_ENGINE.md](./docs/PERFORMANCE_ENGINE.md)
- [x] **Phase 15** — Plugin Architecture & Species SDK
  - `src/engine/registry/` — SpeciesRegistry, SpeciesLoader, Validation
  - `src/species/registerBuiltinSpecies.ts` — single bootstrap; engine no longer hard-codes species
  - `src/templates/species-template/` — copy-paste starter for new Sound Worlds
  - Eight `coming_soon` future species (canopy, moss, spores, mycelium, desert, ocean, rainforest, tundra)
  - `scripts/test-species-registry.mjs` — `npm run test:registry`
  - [docs/PLUGIN_ARCHITECTURE.md](./docs/PLUGIN_ARCHITECTURE.md), [docs/CREATING_A_SPECIES.md](./docs/CREATING_A_SPECIES.md)
- [x] **Phase 16** — Architecture milestone (documentation + test suite)
  - v2 exports from root; examples; documentation pass
  - **Note:** tagged `v2.0.0` prematurely — treat as architecture beta, not integration release
  - See [docs/MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md)
- [x] **Phase 17** — Lifecycle contract **(blocker)**
  - Explicit engine states; throw on `noteOn` / `start` / `loadSpecies` when invalid
  - [docs/LIFECYCLE.md](./docs/LIFECYCLE.md)
  - Playable-only default registry; remove `coming_soon` from host-facing list
  - Rename `validate-species.mjs` → `validate-species-api.mjs`
  - 0–1 control scale enforced at boundary
  - Reserved built-in species IDs
- [x] **Phase 18** — Unified `PlantasiaEngine` facade **(blocker)**
  - `engine.loadSpecies()`, `setControl()`, `noteOn`/`noteOff`, `start`/`stop`
  - `engine.registerSpecies()` — external packages without editing bootstrap
  - `resolvePresetToSpecies()` + `loadPreset()` legacy adapter
  - `plantasia-sound-engine/public` slim export surface; full root export preserved
  - Async `start()` awaits species audio readiness
- [x] **Phase 19** — Event bus
  - `speciesChanged`, `notePlayed`, `controlChanged`, `generatorEvent`, `densityChanged`
  - Semantic events for visualization — no Tone node coupling
  - [docs/EVENTS.md](./docs/EVENTS.md), `scripts/test-events.mjs`
- [x] **Phase 20** — Unified scheduler + MIDI / transport **(blocker before Plantasonic)**
  - `EngineScheduler` + `Transport` on facade; generative timers migrated
  - Web MIDI input via `enableMidi()`; transport lifecycle
  - [docs/SCHEDULER.md](./docs/SCHEDULER.md), `scripts/test-scheduler.mjs`, `scripts/test-midi.mjs`
- [x] **Phase 21** — Plantasonic integration
  - `createPlantasonicAdapter()`, validation gates, CPU budget test
  - [docs/PLANTASONIC_INTEGRATION.md](./docs/PLANTASONIC_INTEGRATION.md)
  - Semver `1.0.0-beta.1` — first honest integration beta

Full checklist: [docs/ENGINE_AUDIT.md](./docs/ENGINE_AUDIT.md) §8.

### Documentation index

| Document | Purpose |
|----------|---------|
| [SOUND_WORLD_ENGINE.md](./docs/SOUND_WORLD_ENGINE.md) | Sound World architecture and v2 vision |
| [API.md](./docs/API.md) | v2 target public API + `SoundWorld` contract |
| [API_V1.md](./docs/API_V1.md) | Current shipped API |
| [ENGINE_AUDIT.md](./docs/ENGINE_AUDIT.md) | v1 audit, technical debt, migration phases |
| [SPECIES.md](./docs/SPECIES.md) | Four species archetypes and synthesis direction |
| [GENERATIVE_ENGINE.md](./docs/GENERATIVE_ENGINE.md) | Shared generative composition system |
| [PERFORMANCE_ENGINE.md](./docs/PERFORMANCE_ENGINE.md) | Expressive performance routing and macros |
| [PLUGIN_ARCHITECTURE.md](./docs/PLUGIN_ARCHITECTURE.md) | Species registry, loader, plugin lifecycle |
| [CREATING_A_SPECIES.md](./docs/CREATING_A_SPECIES.md) | Contributor guide for new Sound Worlds |
| [LIFECYCLE.md](./docs/LIFECYCLE.md) | Engine state machine and host integration contract |
| [MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md) | v1 presets → v2 species migration |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | v1 subsystem layout |
| [PRESETS.md](./docs/PRESETS.md) | Sound World JSON schema |
| [SOUND_DESIGN.md](./docs/SOUND_DESIGN.md) | Signal flow and Mold design |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Contributor guide |

---

## Milestone 1 — Preset / Sound World system

- [x] JSON Sound Worlds organized by category (`presets/flora`, `ambient`, `textures`, `signature`)
- [x] Preset loader, serialization, aliases, and category manifest
- [x] `getPresetById`, `getPresetsByCategory`, `getPresetControls`, `getPresetMold`
- [x] Visual metadata (ASCII theme, palette, motion) on all bundled worlds
- [x] MIDI performance defaults per world
- [x] Preset validation at build (`validate-presets.mjs`, `themeRegistry.ts`)
- [x] Live voice routing types (`standard` | `botanical` | `plantasonic`)
- [ ] Preset browser UI component (consumer apps)
- [ ] User preset save/load to localStorage or file
- [ ] Preset morphing between two states

---

## Milestone 2 — Effect rack

Scaffold: `src/effects/` · Signature graphs use hand-built WAAPI effects today.

- [ ] Serial effect rack with insert order
- [x] Reverb (basic — standard Tone.js path + signature hall chains)
- [x] Delay (basic — standard Tone.js path + signature FX chains)
- [x] Distortion / saturation (Mold chain + waveshapers in Juno / Plantasonic)
- [x] Compression (Juno master limiter, Plantasonic compressor)
- [ ] Chorus (partial — v2 Flowers/Seed species + custom WAAPI in signature synths)
- [ ] Phaser
- [ ] EQ (parametric)

---

## Milestone 3 — Modulation

Scaffold: `src/modulation/`

- [x] LFO (filter modulation on standard path; multiple LFOs in Mold + signature synths)
- [x] ADSR envelope (PolySynth + per-voice WAAPI envelopes)
- [x] Random drift (Juno / Plantasonic living voice ticks, preset `drift` param)
- [x] Expression routing (partial — v2 `ExpressionRouter` maps velocity, density, and macros to synth targets; see Phase 14)
- [x] Modulation matrix with multiple sources/destinations *(1.1.0)*
- [x] Sample & hold *(1.1.0)*
- [x] Envelope followers *(1.1.0, on the engine's own output)*

---

## Milestone 4 — MIDI

Shipped in Phase 20 (scaffold + note input). Remaining items are future milestones.

- [x] Web MIDI input — `engine.enableMidi()`, `engine.midi.devices` *(Phase 20)*
- [ ] ~~MIDI Learn~~ host UI concern (decision 10)
- [x] Velocity sensitivity — signature live voices + v2 `VelocityEngine`; Web MIDI note path via `enableMidi()`
- [x] Aftertouch / channel pressure as modulation sources *(1.1.0)*; pitch bend too
- [ ] MPE deferred until a controller use case exists (decision 10)

---

## Milestone 5 — Sequencing (retired, decision 8)

Scaffold `src/sequencing/` (types only) is removed with 1.0. Scale quantizer and chord generator return in 1.1 as host settable `GenerativePreferences`. Euclidean sequencer, arpeggiator and probability gates are dropped; `Generator` already covers phrase, rhythm and probability for an ambient instrument.

---

## Milestone 6 — Performance

v2 **Phase 14** shipped the Expressive Performance Engine — see [docs/PERFORMANCE_ENGINE.md](./docs/PERFORMANCE_ENGINE.md).

### Shipped (v2 Phase 14)

- [x] Velocity beyond volume — filter, envelope, brightness, chorus, reverb, saturation, osc blend (per-species profiles)
- [x] Density engine — active notes, phrase/harmonic/drone activity; species-specific reactions
- [x] Ecological macros — five controls expand into many simultaneous expressive targets
- [x] Legato / staccato / chord-held detection
- [x] Growth-scaled polyphony per species (not yet a host-configurable API)

### Remaining

- [ ] Configurable polyphony limits (host-facing API)
- [ ] Voice stealing strategy
- [x] Browser performance harness (`npm run test:browser`, [docs/PERFORMANCE.md](./docs/PERFORMANCE.md)); CPU metering in engine and adaptive quality still open
- [ ] Preset morphing at runtime
- [ ] Offline rendering / export
- [x] Central scheduler — `EngineScheduler` + `Transport` on facade *(Phase 20)*

---

## Milestone 7 — Mold macro & Sound World registry (2026)

**Status:** Complete on `main` / `v0.2.0`

### Shipped

- [x] Flagship **Plantasonic** preset and WAAPI graph
- [x] **Juno Flowers** botanical preset and WAAPI graph
- [x] Eleven bundled Sound Worlds with `controls`, `visual`, `midi` metadata
- [x] Dynamic preset registry and category manifest
- [x] **Mold** living degradation macro — eight modules, five stages
- [x] Preset-specific mold profiles (`MOLD_PROFILES`, `resolveMoldProfile`)
- [x] Mold on all presets via `controls.mold`; `setMold()` public API
- [x] Fixed internal master gain (volume removed from creative surface)
- [x] `ENGINE_PARAMETER_METADATA` for hosts and future MIDI Learn
- [x] LFO min-span guard for zero-depth Mold modulation (`applyMold.ts`)

### Bundled Sound Worlds

| ID | Display name | Routing | v2 species |
|----|--------------|---------|------------|
| `plantasonic` | Plantasonic | plantasonic | Seed |
| `seed` | Moss | standard | Seed |
| `root` | Roots | standard | Seed |
| `bloom` | Bloom | standard | Flowers |
| `fern` | Canopy | standard | Flowers |
| `juno-flowers` | Night Bloom | botanical | Flowers |
| `vine` | Rainforest | standard | Mold |
| `crystal` | Winter | standard | Mold |
| `mutation` | Mutation | standard | Mold / Bacteria |
| `coral` | Desert | standard | Seed |
| `mycelium` | Mycelium | standard | Bacteria |

### Remaining worlds

None planned (decision 9). The eight `coming_soon` species and Aurora are cut; a species is added when an instrument needs it.

### Future engine work

- [ ] Unified audio + visual consumption in host apps
- [ ] Procedural Sound World variation at runtime
- [x] Ecological control surface — v2 `EcologyControls` (Phase 12); wire into unified facade (Phase 18)
- [ ] Honor extended `SynthSettings` on standard path (`chorus`, `subAmount`, `stereoWidth`)

### Demo control surface (complete)

- [x] Full engine audit — presets, species, ecology, botanical, mold, generative, MIDI, events
- [x] Collapsible panel sections with persisted open/closed state
- [x] Preset browser — categories, favorites, prev/next/random, JSON export
- [x] Species-specific performance macro routing (12 macros × 4 species)
- [x] Layer overview cards per species with ecology proxy routing
- [x] Waveform + multi-band meters, live event feed, debug validation panel
- [x] Keyboard (A–K) + Web MIDI enable + v1 `playPreset` chord preserved
- [x] Debug panel shows real engine state only (no guessed values)
- [x] Validation pass — [docs/DEMO_CONTROL_AUDIT.md](./docs/DEMO_CONTROL_AUDIT.md)
- [x] Audio reactive mapping: `follower` modulation source and `onset` event (1.1.0)
- [x] v2 public analyser getters: `getAudioFeatures()` and `getWaveform()` off the master bus (1.0.0)

---

## Integration targets

- **Plantasia 2.0** — primary consumer via `file:` or npm dependency
- **Plantasonic** — flagship Seed species host
- **Standalone demo** — `demo/` complete control surface; `examples/` focused snippets
- **Future platforms** — VST, installation, mobile (v2 API designed browser-first, platform-portable)
- **Future npm publish** — semantic versioning with preset JSON shipped in package
