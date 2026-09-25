# Sound

The record of the 1.3 sound pass (ROADMAP decisions on simplicity, 6, 12, 18, 23; decision 10 after 1.1.0). Everything here is decided by ear in the lab (`npm run lab`), then written back into the source. Empty cells are work not yet done.

## The bar

Every control on every species does something a listener can name, on one held note and on a generative minute, and the harness's audibility row sees it: the A/B spectral difference exceeds the A/A noise on at least one feature (`docs/PERFORMANCE.md`, control audibility). 1.3.0 ships when all four species pass the blind verdict and the bar.

## Blind verdict (decision 12)

Lab, Blind verdict section. Shuffled order; per species one held `E3` and one generative minute; name it; reveal. Then Blind controls on the same species: five sweeps A to E in a shuffled order, say what each did, reveal.

| Species | Named blind (note) | Named blind (minute) | Controls named (of 5) | Verdict | Date |
| --- | --- | --- | --- | --- | --- |
| Seed | | | | | |
| Flowers | | | | | |
| Mold | | | | | |
| Bacteria | | | | | |

Verdicts: **stays** (passes as is), **rebuild** (stays in 1.3 after its depths or graph change), **hold** (1.3 waits for it; decision 23).

What the controls were called blind, verbatim, for decision 21:

| Species | growth | bloom | roots | mold | bacteria |
| --- | --- | --- | --- | --- | --- |
| Seed | | | | | |
| Flowers | | | | | |
| Mold | | | | | |
| Bacteria | | | | | |

## Where 1.2 left the controls

From the harness audibility row at 1.2.0 (held `E3`, A/B over A/A, Chromium and WebKit). "none" means the control moved the population, not the voice.

| Species | growth | bloom | roots | mold | bacteria |
| --- | --- | --- | --- | --- | --- |
| Seed | clears | clears | none / high | clears | clears |
| Flowers | clears | clears | clears | clears | none / high |
| Mold | none | none | none | none | none |
| Bacteria | none | none | none | none | none |

Mold and Bacteria controls act on the generator, the swarm and the particle rate, none of which a single `noteOn` exercises. The pass has to decide, per species, what each control does to one voice, or accept that a species is population only and say so.

## Control depths

Every constant in each species' ecology mapping lives in `src/species/<id>/depths.ts`, named `<what>_<control>` with `<what>_base` as the value at every control 0. The lab's Control depths section edits them live through `engine.setControlDepths()` (root tier) and emits JSON; paste it back into the file. A tuned table replaces the defaults at 1.3.0.

| Species | Tuned | Notes |
| --- | --- | --- |
| Seed | no | |
| Flowers | no | |
| Mold | no | |
| Bacteria | no | |

## Target spans

`MODULATION_TARGET_SPANS` (`src/engine/modulation/types.ts`), tuned in the lab's Target spans section with Audition. Verified to move the spectrum at 1.1.0; not yet tuned by ear.

| Target | 1.1.0 | Tuned | Notes |
| --- | --- | --- | --- |
| filterCutoffMult | 0.5 | | |
| attackMult | 0.75 | | |
| releaseMult | 0.75 | | |
| brightnessAdd | 0.5 | | |
| chorusDepthMult | 0.5 | | |
| reverbWetAdd | 0.3 | | |
| saturationAdd | 0.4 | | |
| oscBlendAdd | 0.5 | | |
| stereoWidthMult | 0.5 | | |
| instabilityAdd | 0.5 | | |
| particleRateMult | 0.75 | | |
| generativeDensityAdd | 0.4 | | |
| noteVelocityScale | 0.5 | | |

## Signature port (decision 18)

Lab, Species A/B section: pick a v1 preset, Play v1, Play species, compare. A port passes when the species with the preset's ecology reads as the same instrument to the author's ear. A preset that cannot pass gets a species change in this pass, or is dropped with the user's ok. Nothing is removed until all eleven have a verdict; the v1 chain stays as the reference until 2.0 ships.

| Preset | Species | Verdict | What it needed | Date |
| --- | --- | --- | --- | --- |
| plantasonic | seed | | | |
| seed | seed | | | |
| root | seed | | | |
| coral | seed | | | |
| bloom | flowers | | | |
| fern | flowers | | | |
| juno-flowers | flowers | | | |
| vine | mold | | | |
| crystal | mold | | | |
| mutation | mold | | | |
| mycelium | bacteria | | | |

Species from `PRESET_SPECIES_MAP` (`src/engine/resolvePresetToSpecies.ts`). Four presets map to Seed, three to Flowers, three to Mold, one to Bacteria.

## Phone pass (decision 14)

See `docs/PERFORMANCE.md`, "On a phone". Recorded here per release once run.

| Release | Device | noteOn to audible | Dropouts, 10 s | Notes |
| --- | --- | --- | --- | --- |
| 1.3.0 | | | | |
