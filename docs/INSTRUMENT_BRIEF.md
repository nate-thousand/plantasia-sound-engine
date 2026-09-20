# Instrument brief

For the session that builds the first played instrument on Plantasia Sound Engine. This is the one document that crosses the project boundary: the instrument repo starts from it, and nothing in that repo changes this one. ROADMAP decisions 1, 8 and 20 after 1.1.0.

## What you are building

A played instrument: a keyboard or pad surface, a mod wheel, a species switch, on a phone or a laptop. The engine makes the sound; the instrument owns every pixel. The instrument is the first real host, so what it needs and cannot get from the engine is the engine's next work.

## Where the engine is

Version `1.1.0`, tag `1.1.0` on `github.com/nate-thousand/plantasia-sound-engine`. Pin that tag:

```json
"plantasia-sound-engine": "github:nate-thousand/plantasia-sound-engine#1.1.0"
```

Installing from git runs the engine's `prepare` build, so TypeScript is installed alongside. Never pin `v2.0.0`; it is a retired architecture tag.

The `create-plantasonic-app` instrument template in plantasonic-platform declares the engine as `workspace:*` together with the platform SDK, design system and visual engine. A standalone repo replaces that one line with the pin above. Whether the SDK and design system come along, and how, is the instrument session's call; the engine has no dependency on either.

Four species ship: Seed, Flowers, Mold, Bacteria. Each has its own graph, its own generator and its own reading of the five ecology controls. All four take played notes.

## The public surface

Import from `plantasia-sound-engine/public`. Thirty methods, documented on one page in [API.md](./API.md). Six of them are the instrument:

| Method | What it does for a player |
| --- | --- |
| `init()` | Unlocks audio. Call it from the first touch |
| `loadSpecies(id)` | Picks the sound. `seed`, `flowers`, `mold`, `bacteria` |
| `start({ generative: false })` | Runs the graph with the generator off, so only played notes sound |
| `noteOn(note, velocity)` and `noteOff(note)` | The keys. Scientific pitch (`'E3'`), velocity 0..1. 12 ms to audible in Chromium, 14 ms in WebKit |
| `setControl(control, value)` | Five ecology sliders, 0..1: `growth`, `bloom`, `roots`, `mold`, `bacteria`. Ramps over about 200 ms |
| `modulate(source, destination, depth)` | The mod wheel, aftertouch and pitch bend, routed to a control or a performance target |

The rest of the thirty: `stop`, `dispose`, `getState`, `allNotesOff`, `getControl`, `setTempo`, `loadDefaultSpecies`, `loadPreset`, `getCurrentSpecies`, `getAvailableSpecies`, `registerSpecies`, `on`, `off`, `getAudioFeatures`, `getWaveform`, `getLevel`, `removeModulation`, `getModulationRoutes`, `getModulationState`, `setGenerativePreferences`, `getGenerativePreferences`, `enableMidi`.

## Two stories to build first

**The mod wheel.** One route, made once, survives everything:

```typescript
engine.modulate({ id: 'wheel', type: 'midi-cc', cc: 1 }, 'target:filterCutoffMult', 1);
await engine.enableMidi();
```

Without a MIDI controller the instrument feeds its own wheel through the root export's `feedMidi(bytes)`, or skips MIDI and drives a control directly from its slider with `setControl`. The route stays across `loadSpecies`. The wheel reaches the engine in one 33 ms tick and the sound within about 30 ms in Chromium (`docs/PERFORMANCE.md`).

**The species switch.** `loadSpecies` while running stops the current species, so voices end. Call `start({ generative: false })` again, then re-trigger whatever the player is holding. Controls, routes and generative preferences carry over on their own. A crossfade between species does not exist yet; if the instrument wants one, that is a request (see below).

## What the engine gives visuals

`getAudioFeatures()` per frame: `rms`, `peak`, `bass`, `mid`, `high`, `centroid`, `onset`. `getWaveform()` for a scope. Every event carries `time` in AudioContext seconds: `notePlayed`, `noteReleased`, `controlChanged`, `speciesChanged`, `onset`, `modulationChanged`, `midiControl`.

## What is coming in 1.2

Not there yet; do not wait for it, but do not build around its absence either:

- `getSnapshot()` and `applySnapshot(snapshot, { morphSec? })`: the whole engine state as one JSON object, with a timed morph between two. This is how the instrument will save and recall patches.
- `enableMidi(inputId)` to pick one MIDI input.
- `setPolyphony(n)` and `getPolyphony()`, the CPU knob for phones.
- A 1.3.0 sound pass will change how every control sounds on every species. Build the UI on the control names, not on what they do today.

## Rules

- Engine requests come back as issues on the engine repo, one per request, with the player's need in the first line. The engine session decides what becomes API. The instrument never patches the engine, vendors a copy, or reaches past the public tier for anything but `feedMidi`.
- The instrument does not modify plantasonic-platform, Plantasonic or Signal 9.
- Test on a real phone in Safari early. The engine's automated numbers are Chromium and WebKit on a laptop.
- No em or en dashes in prose.

## Reading order

1. [API.md](./API.md), the whole page.
2. [LIFECYCLE.md](./LIFECYCLE.md), for what throws in which state.
3. [PERFORMANCE.md](./PERFORMANCE.md), for what is measured and what the numbers are.
4. `demo/` in the engine repo, a control surface that exercises everything; not a design to copy.
