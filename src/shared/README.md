# Shared

Reusable helpers shared across the engine and all species.

## Planned contents

- Scale utilities and quantizers
- Envelope helpers and ramp utilities (today: `src/utils/ramp.ts`)
- Modulation utilities (LFO routing, matrix helpers)
- Math helpers (clamp, map, interpolate)
- Effect helpers (waveshaper curves, delay feedback guards)
- Voice allocation utilities

## Current state

Shared helpers used across species and engine:

- `syncGeneratorEcology.ts` — push ecological controls to the generative engine
- `syncPerformanceEcology.ts` — push ecological controls to the performance engine

Additional utilities migrate here from `src/utils/` during refactoring. Species-specific DSP does **not** belong in this folder.
