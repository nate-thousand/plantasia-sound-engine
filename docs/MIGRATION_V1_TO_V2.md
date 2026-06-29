# Migration: v1 Presets → v2 Sound Worlds

> **Status:** Complete (Phases 17–21). Ready for Plantasonic beta integration.  
> v1 reference: [API_V1.md](./API_V1.md) · v2 target: [API.md](./API.md) · Integration: [PLANTASONIC_INTEGRATION.md](./PLANTASONIC_INTEGRATION.md)

This is a **staged replacement**, not a hard cutover. Plantasonic keeps working on v1 while the Sound World layer matures behind a compatibility adapter.

---

## Who should read this

- **Plantasonic developers** moving from `playPreset()` + JSON presets to `loadSpecies()` + ecology controls
- **Anyone pinning a dependency** — do **not** use tag `v2.0.0` for integration; see [Pinning](#pinning-a-version) below

---

## Executive summary

| v1 (today) | v2 (target) |
|------------|-------------|
| `PlantasiaEngine` + `playPreset(preset)` | `createPlantasiaEngine()` + `engine.loadSpecies(id)` *(Phase 18)* |
| 11 JSON presets in `presets/` | 4 live species + preset→species adapter |
| Botanical controls (`growth`, `energy`, …) | Ecological controls (`growth`, `bloom`, `roots`, `mold`, `bacteria`) — **0–1 only** |
| WAAPI visual graph per preset | Semantic engine events → visuals *(Phase 19 — shipped)* |
| `Tone.start()` via `engine.init()` | Strict lifecycle: gesture → load → start → note *(Phase 17)* |

---

## Pinning a version

| Tag / branch | Use for |
|--------------|---------|
| `main` | v1 production — `playPreset`, presets, Mold |
| `v1-sound-engine-baseline` | Frozen v1 reference |
| `v2-sound-world-engine` | Active Sound World development |
| `v2.0.0` | **Deprecated** — architecture milestone only; not integration-ready |
| `v1.0.0-beta.1` | **Current** — first honest Sound World beta (Phases 17–21) |

**Plantasonic should pin:** a corrected prerelease tag or explicit commit SHA after Phase 17 ships — never `v2.0.0`.

---

## Preset → species mapping

During migration, **`playPreset()` stays at the app layer**. It resolves each legacy preset into:

1. **Species ID** — which Sound World audio engine to load  
2. **Ecology state** — normalized 0–1 control values  
3. **Visual profile** — ASCII theme, palette, motion (unchanged from preset JSON)

### Bundled mapping (engine-owned contract — Phase 18)

| Preset ID | Display name | v1 routing | v2 species |
|-----------|--------------|------------|------------|
| `plantasonic` | Plantasonic | plantasonic | `seed` |
| `seed` | Moss | standard | `seed` |
| `root` | Roots | standard | `seed` |
| `coral` | Desert | standard | `seed` |
| `bloom` | Bloom | standard | `flowers` |
| `fern` | Canopy | standard | `flowers` |
| `juno-flowers` | Night Bloom | botanical | `flowers` |
| `vine` | Rainforest | standard | `mold` |
| `crystal` | Winter | standard | `mold` |
| `mutation` | Mutation | standard | `mold` or `bacteria` |
| `mycelium` | Mycelium | standard | `bacteria` |

**Ownership (recommended):**

- **Engine** — `resolvePresetToSpecies(presetId)` + default ecology from preset `controls`
- **Plantasonic** — visual profile from preset `visual` / `asciiState` until visuals subscribe to engine events

---

## Control migration

### Scale: 0–1 everywhere at the host boundary

```typescript
// ✅ Correct (v2)
engine.setControl('bloom', 0.65);

// ❌ Wrong — will clamp or throw after Phase 17
engine.setControl('bloom', 65);
```

v1 preset controls are typically 0–100 in JSON. The adapter converts once:

```typescript
const ecology = {
  growth: preset.controls.growth / 100,
  bloom: preset.controls.bloom / 100,
  roots: preset.controls.roots / 100,
  mold: (preset.controls.mold ?? getPresetMold(preset)) / 100,
  bacteria: (preset.controls.bacteria ?? 18) / 100,
};
```

### Botanical → ecological (conceptual)

| v1 botanical | v2 ecological | Notes |
|--------------|---------------|-------|
| `growth` | `growth` | Direct |
| `energy` / `bloom`-like openness | `bloom` | Spatial/harmonic opening |
| `roots` / low body | `roots` | Foundation |
| `mold` | `mold` | Degradation — already shared in v1 |
| `bacteria` / motion | `bacteria` | Particles, micro-events |

Each control has a **primary lane** per species (see [SPECIES.md](./SPECIES.md)). Secondary influence is capped — e.g. `bacteria` owns density; `mold` owns instability.

---

## Lifecycle (required sequence)

> **Blocker:** Phase 17 enforces this with explicit states and errors. Until then, silent no-ops are possible.

```
User gesture
  → engine.initialize()     // audio context unlock
  → engine.loadSpecies(id)    // fresh Sound World instance
  → engine.setControl(...)    // 0–1 ecology
  → engine.start()            // arm generative + audio graph
  → engine.noteOn(note, vel)  // performance
  → engine.noteOff(note)
  → engine.stop()
  → engine.loadSpecies(other) // disposes previous
  → engine.dispose()
```

**Rules after Phase 17:**

- `noteOn()`, `start()`, `loadSpecies()` **throw** if called out of order  
- `stop()`, `allNotesOff()` remain idempotent  
- Dev mode logs state transitions

See `docs/LIFECYCLE.md` *(Phase 17)*.

---

## Code migration paths

### Path A — Keep v1 (no change)

```typescript
import { createPlantasiaEngine } from 'plantasia-sound-engine';

const engine = createPlantasiaEngine();
await engine.init(); // user gesture
engine.playPreset(engine.presets.find(p => p.id === 'plantasonic'));
```

Use while Plantasonic WAAPI graph and preset browser remain primary.

### Path B — Adapter (recommended during migration)

```typescript
async function playPresetViaSpecies(engine, preset) {
  await engine.initialize(); // gesture
  const { speciesId, ecology } = resolvePresetToSpecies(preset);
  await engine.loadSpecies(speciesId);
  for (const [key, value] of Object.entries(ecology)) {
    engine.setControl(key, value);
  }
  applyVisualProfile(preset.visual); // app-owned for now
  engine.start();
}
```

`resolvePresetToSpecies()` ships with the engine in Phase 18.

### Path C — Direct species (post-migration)

```typescript
await engine.initialize();
await engine.loadSpecies('flowers');
engine.setControl('bloom', 0.7);
engine.start();
engine.noteOn('E4', 0.8);
```

---

## Visual layer migration

**Today:** visuals driven by preset JSON + WAAPI graph state.

**Target (Phase 19 — shipped):** subscribe to semantic events — no Tone node coupling.

| Event | Visual use |
|-------|------------|
| `speciesChanged` | Swap organism grammar / palette |
| `notePlayed` | Glyph bursts, keyboard feedback |
| `controlChanged` | Morph ASCII organism |
| `generatorEvent` | Particle / ornament layers |
| `densityChanged` | Scale motion intensity |

Preset `visual` metadata remains the easy path; engine events are available via `engine.on()`.

---

## What stays on v1 during migration

- Eleven JSON presets and preset browser UX  
- Plantasonic / Juno WAAPI signature graphs for flagship presets  
- `playPreset()` demo chord behavior  
- Mold macro on standard preset path  
- `demo/` and legacy examples  

v2 species audio runs **in parallel** via adapter — not a day-one replacement for every preset route.

---

## Validation before integration

Do **not** integrate Plantasonic on v2 audio until:

| Gate | Script / doc |
|------|----------------|
| API smoke (structural) | `validate-species-api.mjs` *(rename from validate-species.mjs)* |
| Browser audio (sonic) | `validate-species-audio.mjs` *(Phase 17+)* |
| Lifecycle errors | Phase 17 |
| 10-min CPU + visuals budget | Performance test *(pre-Phase 21)* |
| This migration doc complete | ✅ |

### Audio test sequence (planned)

```
loadSpecies() → start() [gesture] → noteOn() → audible check
→ setControl() → hear change → dispose() → reload() → noteOn() again
```

---

## External species (future)

Third-party species are **not supported** yet. Current status: plugin-ready **shape**, monorepo registration.

**Phase 18 target:**

```typescript
engine.registerSpecies({
  factory: createMySoundWorld,
  // IDs must be namespaced: plantasonic.customX, community.ocean
});
```

Built-in IDs (`seed`, `flowers`, `mold`, `bacteria`) are **reserved** — collisions throw.

---

## Roadmap cross-reference

| Phase | Delivers for migration |
|-------|------------------------|
| **17** | Lifecycle contract, playable-only default registry, `LIFECYCLE.md` |
| **18** | Unified facade, `loadSpecies()`, `resolvePresetToSpecies()`, tiny exports |
| **19** | Event bus for visuals |
| **20** | Unified scheduler + MIDI |
| **21** | Plantasonic integration |

---

## Checklist for Plantasonic developers

- [ ] Pin corrected beta tag or SHA — not `v2.0.0`
- [ ] Read lifecycle doc before calling `noteOn`
- [ ] Use 0–1 for all `setControl()` values
- [ ] Implement preset→species adapter before removing `playPreset`
- [ ] Keep visual profile on preset JSON until event bus ships
- [ ] Run browser audio validation locally before filing engine bugs
- [ ] Do not import species singletons for live audio — use factories / facade

---

## Related docs

- [ROADMAP.md](../ROADMAP.md) — phases 17–21  
- [ENGINE_AUDIT.md](./ENGINE_AUDIT.md) §8 — v2.0 release audit  
- [PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md) — registry (internal bootstrap today)  
- [SPECIES.md](./SPECIES.md) — species reference and ecology mappings
