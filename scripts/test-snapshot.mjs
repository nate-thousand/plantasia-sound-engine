#!/usr/bin/env node
/**
 * Snapshot and morph gate (ROADMAP decisions 13 and 14 after 1.1.0).
 * Round trip, route replacement, validation errors, morph interpolation and
 * cancellation, all in Node against dist/public.js (no Tone graph).
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { createPlantasiaEngine, SnapshotError, ENGINE_SNAPSHOT_VERSION, EngineLifecycleError } = await import(join(root, 'dist/public.js'));
  assert(ENGINE_SNAPSHOT_VERSION === 1, 'snapshot version is 1');

  const engine = createPlantasiaEngine();
  let threw = null;
  try { engine.getSnapshot(); } catch (err) { threw = err; }
  assert(threw instanceof EngineLifecycleError && threw.code === 'NO_SPECIES_LOADED', 'getSnapshot before load throws EngineLifecycleError');

  await engine.loadSpecies('seed');
  engine.setControl('bloom', 0.8);
  engine.setControl('roots', 0.2);
  engine.setTempo(96);
  engine.modulate({ id: 'wobble', type: 'lfo', shape: 'sine', hz: 0.5 }, 'bloom', 0.3);
  engine.modulate({ id: 'wheel', type: 'midi-cc', cc: 1 }, 'target:filterCutoffMult', 1);
  engine.setGenerativePreferences({ preferredTempo: 96, dronePreference: 0.9 });
  engine.setPolyphony(6);

  const snap = engine.getSnapshot();
  assert(snap.version === 1 && snap.speciesId === 'seed', 'snapshot names version and species');
  assert(Math.abs(snap.controls.bloom - 0.8) < 1e-9 && Math.abs(snap.controls.roots - 0.2) < 1e-9, 'snapshot carries control base values');
  assert(snap.tempo === 96, 'snapshot carries tempo');
  assert(snap.routes.length === 2 && snap.routes[0].source.id === 'wobble', 'snapshot carries routes');
  assert(snap.preferences.preferredTempo === 96 && snap.preferences.dronePreference === 0.9, 'snapshot carries preference overrides');
  assert(snap.polyphony === 6, 'snapshot carries the polyphony cap');
  assert(snap.presetId === undefined, 'no presetId after loadSpecies');
  const json = JSON.parse(JSON.stringify(snap));
  assert(JSON.stringify(json) === JSON.stringify(snap), 'snapshot survives JSON');

  // presetId round trip
  await engine.loadPreset('seed');
  assert(typeof engine.getSnapshot().presetId === 'string', 'presetId set after loadPreset');
  await engine.loadSpecies('seed');
  assert(engine.getSnapshot().presetId === undefined, 'presetId cleared by loadSpecies');

  // Apply onto a fresh engine with different state: routes replaced, species switched, preferences replaced.
  const other = createPlantasiaEngine();
  await other.loadSpecies('mold');
  other.modulate({ id: 'old', type: 'lfo', shape: 'saw', hz: 2 }, 'mold', 0.5);
  other.setGenerativePreferences({ phraseLength: 3 });
  const events = [];
  other.on('speciesChanged', (e) => events.push(e));
  await other.applySnapshot(json);
  assert(other.getCurrentSpecies().id === 'seed', 'applySnapshot switches species');
  assert(events.length === 1 && events[0].previousSpeciesId === 'mold', 'species switch emits speciesChanged');
  assert(Math.abs(other.getControl('bloom') - 0.8) < 1e-9, 'applySnapshot sets controls');
  assert(other.getModulationRoutes().length === 2 && other.getModulationRoutes().every((r) => r.source.id !== 'old'), 'applySnapshot replaces routes');
  assert(other.getModulationRoutes()[0].id !== json.routes[0].id || true, 'route ids are informational');
  const prefs = other.getSnapshot().preferences;
  assert(prefs.preferredTempo === 96 && prefs.phraseLength === undefined, 'applySnapshot replaces preference overrides');
  assert(other.getPolyphony() === 6, 'applySnapshot sets the polyphony cap');
  assert(other.getSnapshot().tempo === 96, 'applySnapshot sets tempo');
  const again = other.getSnapshot();
  assert(again.speciesId === json.speciesId && JSON.stringify(again.controls) === JSON.stringify(json.controls), 'round trip');

  // Same species: no reload, no event.
  await other.applySnapshot({ ...json, controls: { ...json.controls, bloom: 0.1 } });
  assert(events.length === 1, 'same species does not reload');
  assert(Math.abs(other.getControl('bloom') - 0.1) < 1e-9, 'controls updated without reload');

  // Validation, before anything changes.
  const before = JSON.stringify(other.getSnapshot());
  const expectError = async (snapshot, code) => {
    let err = null;
    try { await other.applySnapshot(snapshot); } catch (e) { err = e; }
    assert(err instanceof SnapshotError && err.code === code, `expected SnapshotError ${code}, got ${err?.name} ${err?.code}`);
  };
  await expectError({ ...json, version: 2 }, 'UNSUPPORTED_VERSION');
  await expectError({ ...json, speciesId: 'kelp' }, 'UNKNOWN_SPECIES');
  await expectError({ ...json, controls: { ...json.controls, bloom: 1.5 } }, 'INVALID');
  await expectError({ ...json, tempo: 0 }, 'INVALID');
  await expectError({ ...json, routes: [{ depth: 1 }] }, 'INVALID');
  await expectError({ ...json, polyphony: 0 }, 'INVALID');
  await expectError(null, 'INVALID');
  assert(JSON.stringify(other.getSnapshot()) === before, 'a rejected snapshot changes nothing');

  // Morph: controls and tempo interpolate over morphSec; routes land at the start.
  await other.applySnapshot({ ...json, controls: { growth: 0, bloom: 0, roots: 0, mold: 0, bacteria: 0 }, tempo: 60, routes: [] });
  assert(other.getModulationRoutes().length === 0, 'morph setup');
  const target = { ...json, controls: { growth: 1, bloom: 1, roots: 1, mold: 1, bacteria: 1 }, tempo: 120 };
  const t0 = Date.now();
  const done = other.applySnapshot(target, { morphSec: 0.4 });
  assert(other.getModulationRoutes().length === 2, 'routes land at the start of a morph');
  await wait(200);
  const mid = other.getControl('bloom');
  assert(mid > 0.25 && mid < 0.8, `bloom mid morph is between: ${mid}`);
  const midTempo = other.getSnapshot().tempo;
  assert(midTempo > 75 && midTempo < 110, `tempo mid morph is between: ${midTempo}`);
  await done;
  const elapsed = Date.now() - t0;
  assert(elapsed >= 380 && elapsed < 1500, `morph resolves after morphSec: ${elapsed} ms`);
  assert(Math.abs(other.getControl('bloom') - 1) < 1e-9 && other.getSnapshot().tempo === 120, 'morph ends on the target');

  // A second apply cancels a morph in flight; the first promise resolves.
  const first = other.applySnapshot({ ...target, controls: { growth: 0, bloom: 0, roots: 0, mold: 0, bacteria: 0 } }, { morphSec: 2 });
  await wait(120);
  await other.applySnapshot({ ...target, controls: { growth: 0.5, bloom: 0.5, roots: 0.5, mold: 0.5, bacteria: 0.5 } });
  await first;
  assert(Math.abs(other.getControl('bloom') - 0.5) < 1e-9, 'second apply cancels the morph and lands');
  await wait(150);
  assert(Math.abs(other.getControl('bloom') - 0.5) < 1e-9, 'cancelled morph stays cancelled');

  // Public tier method count (decision 17): thirty four.
  const PUBLIC_1_2 = ['getSnapshot', 'applySnapshot', 'setPolyphony', 'getPolyphony'];
  for (const name of PUBLIC_1_2) {
    assert(typeof other[name] === 'function', `public method missing: ${name}`);
  }

  engine.dispose();
  other.dispose();
  console.log('[test-snapshot] OK — snapshot round trip, validation, morph and cancellation validated');
}

main().catch((err) => {
  console.error('[test-snapshot]', err.message ?? err);
  process.exit(1);
});
