#!/usr/bin/env node
/**
 * 1.0 — audio analysis and event timing gate.
 *
 * Structural in Node (no real audio): feature shape and ranges, `time` on every
 * event, noteReleased for host and generative sources, onset wiring.
 * Sonic calibration happens in the browser harness.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const FEATURE_KEYS = ['time', 'rms', 'peak', 'bass', 'mid', 'high', 'centroid', 'onset'];

async function main() {
  const { createPlantasiaEngine, BAND_EDGES_HZ } = await import(join(root, 'dist/public.js'));
  const { AudioAnalyser } = await import(join(root, 'dist/engine/analysis/AudioAnalyser.js'));
  const { EngineEventBus } = await import(join(root, 'dist/engine/events/EngineEventBus.js'));

  assert(BAND_EDGES_HZ.bass === 200 && BAND_EDGES_HZ.mid === 2000, 'band edges fixed at 200 Hz and 2 kHz');

  // Bus stamps time when the emitter leaves it out, and keeps a supplied one.
  const bus = new EngineEventBus();
  const got = [];
  bus.on('controlChanged', (p) => got.push(p));
  bus.emit('controlChanged', { control: 'bloom', value: 0.5, speciesId: 'seed' });
  bus.emit('controlChanged', { control: 'bloom', value: 0.6, speciesId: 'seed', time: 12.5 });
  assert(typeof got[0].time === 'number' && Number.isFinite(got[0].time), 'bus stamps time');
  assert(got[1].time === 12.5, 'bus keeps a supplied time');
  assert(bus.hasListeners('controlChanged') && !bus.hasListeners('onset'), 'hasListeners reports subscriptions');

  // Analyser returns a full, in-range feature frame even with no audio graph.
  const analyser = new AudioAnalyser();
  const frame = analyser.read();
  for (const key of FEATURE_KEYS) {
    assert(typeof frame[key] === 'number' && Number.isFinite(frame[key]), `feature ${key} is a finite number`);
  }
  for (const key of FEATURE_KEYS.filter((k) => k !== 'time')) {
    assert(frame[key] >= 0 && frame[key] <= 1, `feature ${key} within 0..1`);
  }
  assert(analyser.read() === frame, 'reads within one frame return the same object');
  analyser.dispose();

  // Generative path: Generator -> buildGenerativeCallbacks -> sink emits noteReleased.
  const { Generator } = await import(join(root, 'dist/engine/generative/Generator.js'));
  const { buildGenerativeCallbacks } = await import(join(root, 'dist/shared/buildGenerativeCallbacks.js'));
  const { SEED_GENERATIVE_PREFERENCES } = await import(join(root, 'dist/species/seed/metadata.js'));
  const genBus = new EngineEventBus();
  const genEvents = [];
  genBus.on('notePlayed', (p) => genEvents.push(['notePlayed', p]));
  genBus.on('noteReleased', (p) => genEvents.push(['noteReleased', p]));
  const sink = genBus.createSink(() => 'seed');
  const generator = new Generator(
    SEED_GENERATIVE_PREFERENCES,
    buildGenerativeCallbacks({ noteOn: () => {}, noteOff: () => {} }, sink),
  );
  generator.start(120);
  generator.triggerAtNote('E4', 0.7);
  await new Promise((resolve) => setTimeout(resolve, 700));
  generator.stop();
  generator.dispose();
  assert(genEvents.some(([n, p]) => n === 'notePlayed' && p.source === 'generative'), 'generative notePlayed');
  assert(
    genEvents.some(([n, p]) => n === 'noteReleased' && p.source === 'generative' && p.speciesId === 'seed'),
    'generative noteReleased',
  );
  for (const [name, payload] of genEvents) {
    assert(Number.isFinite(payload.time), `${name} carries time`);
  }

  // Facade: getAudioFeatures, timed events, host noteReleased, onset subscription.
  const engine = createPlantasiaEngine();
  assert(typeof engine.getAudioFeatures === 'function', 'facade exposes getAudioFeatures');
  const events = [];
  for (const name of ['speciesChanged', 'notePlayed', 'noteReleased', 'controlChanged', 'onset']) {
    engine.on(name, (payload) => events.push([name, payload]));
  }
  engine.registerSpecies(() => ({
    metadata: { id: 'custom.analysis-test', name: 'Analysis Test', concept: 'x', description: 'x', inspiration: ['x'], character: ['x'] },
    initialize: async () => {},
    start: async () => {},
    stop: () => {},
    noteOn: () => {},
    noteOff: () => {},
    allNotesOff: () => {},
    setControl: () => {},
    dispose: () => {},
  }));
  await engine.loadSpecies('custom.analysis-test');
  await engine.start();
  const features = engine.getAudioFeatures();
  assert(FEATURE_KEYS.every((k) => k in features), 'getAudioFeatures returns every feature');
  engine.setControl('growth', 0.5);
  engine.noteOn('C4', 0.8);
  engine.noteOff('C4');
  for (const [name, payload] of events) {
    assert(Number.isFinite(payload.time), `${name} carries time`);
  }
  assert(events.some(([n, p]) => n === 'notePlayed' && p.source === 'host' && p.note === 'C4'), 'host notePlayed');
  assert(
    events.some(([n, p]) => n === 'noteReleased' && p.source === 'host' && p.note === 'C4' && p.speciesId === 'custom.analysis-test'),
    'host noteReleased',
  );
  engine.stopSpecies();
  engine.dispose();

  console.log('[test-analysis] OK — audio features, event timing, noteReleased validated');
}

main().catch((err) => {
  console.error('[test-analysis]', err.message ?? err);
  process.exit(1);
});
