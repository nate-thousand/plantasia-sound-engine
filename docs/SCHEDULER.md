# Scheduler & Transport (Phase 20)

Central timer ownership and shared transport clock for generative systems.

## EngineScheduler

All generative timers flow through `EngineScheduler` instead of raw `setTimeout` / `setInterval`:

```typescript
const engine = createPlantasiaEngine();
const scheduler = engine.scheduler; // root scope

// Per-species scope (auto-created on loadSpecies, disposed on switch)
const speciesScope = engine.scheduler.createScope('species');
```

- `setTimeout` / `setInterval` with automatic cleanup on fire
- `clearAll()` and `dispose()` cancel all owned timers
- Species receive a scoped scheduler via `SoundWorldContext`

The shared `Generator` accepts `{ scheduler }` in its constructor options.

## Transport

Shared BPM clock for host + generative layers:

```typescript
engine.transport.setBpm(96);
engine.transport.play();
engine.transport.onTick((timeMs) => { /* quarter-note ticks */ });
engine.setTempo(120); // syncs v1 Tone transport + engine.transport
```

States: `stopped` | `playing` | `paused`

## Web MIDI

```typescript
await engine.initialize(); // user gesture
await engine.loadSpecies('seed');
await engine.start();
const connected = await engine.enableMidi();
// engine.midi.devices lists available inputs
```

Web MIDI routes note on/off to the active Sound World. Emits `notePlayed` with `source: 'midi'`.

No-ops gracefully in Node CI and browsers without Web MIDI.

## Validation

- `npm run test:scheduler`
- `npm run test:midi`
