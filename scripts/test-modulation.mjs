#!/usr/bin/env node
/**
 * 1.1 — modulation engine gate (ROADMAP decisions for 1.1.0).
 *
 * Structural in Node: routes, source math, spans, additive semantics, the
 * species hook, the clearing frame, state, events, lifecycle.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const pkg = await import(join(root, 'dist/public.js'));
  const { ModulationEngine } = await import(join(root, 'dist/engine/modulation/ModulationEngine.js'));
  const { MODULATION_TARGET_SPANS, MODULATABLE_TARGETS } = pkg;

  assert(MODULATABLE_TARGETS.length === 13 && !MODULATABLE_TARGETS.includes('legato'), 'thirteen numeric targets, no legato');
  for (const target of MODULATABLE_TARGETS) {
    assert(MODULATION_TARGET_SPANS[target] > 0, `span for ${target}`);
  }

  // --- engine math, no audio ---
  const base = { growth: 0.5, bloom: 0.4, roots: 0.3, mold: 0.2, bacteria: 0.1 };
  const env = { bpm: () => 120, transportPlayCount: () => 0, features: () => ({ rms: 0.5, bass: 0.2, mid: 0.3, high: 0.1 }), midi: () => null };
  const engine = new ModulationEngine(env, () => ({ ...base }));

  let changes = 0;
  engine.onChange(() => (changes += 1));
  const route = engine.modulate({ id: 'wobble', type: 'lfo', hz: 1, shape: 'sine', phase: 0.25 }, 'bloom', 0.5);
  assert(changes === 1, 'modulationChanged on add');
  // phase 0.25 of a sine is the peak: 1 × depth 0.5 => bloom 0.4 + 0.5 = 0.9
  const f1 = engine.tick(0);
  assert(Math.abs(f1.controls.bloom - 0.9) < 1e-6, `additive on base: ${f1.controls.bloom}`);
  assert(f1.controls.growth === 0.5, 'other controls untouched');
  assert(f1.routes === 1, 'frame carries route count');
  // quarter period later (0.25 s at 1 Hz) the sine is back at 0
  const f2 = engine.tick(0.25);
  assert(Math.abs(f2.controls.bloom - 0.4) < 1e-6, `sine returns to base: ${f2.controls.bloom}`);
  // clamp: depth 1 at the peak on a base of 0.4 clamps to 1
  route.set({ depth: 1 });
  engine.resetSource('wobble', 0.25);
  const f3 = engine.tick(0);
  assert(f3.controls.bloom === 1, 'clamped at 1');

  // unipolar option: peak 1, trough 0 => never below base
  const uni = engine.modulate({ id: 'rise', type: 'lfo', hz: 1, unipolar: true, phase: 0.75 }, 'roots', 0.6);
  const f4 = engine.tick(0);
  assert(Math.abs(f4.controls.roots - 0.3) < 1e-6, `unipolar trough leaves base: ${f4.controls.roots}`);
  uni.remove();

  // same source id feeds two routes as one source
  engine.modulate({ id: 'wobble', type: 'lfo', hz: 1 }, 'target:filterCutoffMult', 1);
  assert(Object.keys(engine.getState().sources).length === 1, 'one source for two routes');
  engine.resetSource('wobble', 0.25);
  const f5 = engine.tick(0);
  assert(Math.abs(f5.targets.filterCutoffMult - MODULATION_TARGET_SPANS.filterCutoffMult) < 1e-6, 'target offset = depth × source × span');

  // type conflict on a reused id is refused
  let conflict = false;
  try {
    engine.modulate({ id: 'wobble', type: 'sample-hold', hz: 1 }, 'mold', 0.2);
  } catch (error) {
    conflict = error.name === 'ModulationRouteError';
  }
  assert(conflict, 'source id cannot change type');

  // bad destination
  let badDest = false;
  try {
    engine.modulate({ type: 'lfo', hz: 1 }, 'target:legato', 0.2);
  } catch (error) {
    badDest = error.name === 'ModulationRouteError';
  }
  assert(badDest, 'legato is not a destination');

  // follower reads features
  engine.modulate({ id: 'env', type: 'follower', band: 'rms', attack: 0.001, release: 0.001 }, 'growth', 0.5);
  engine.tick(1);
  const s1 = engine.getState();
  assert(s1.sources.env.value > 0.49, `follower tracks rms: ${s1.sources.env.value}`);
  assert(s1.controls.growth.base === 0.5 && s1.controls.growth.modulated > 0.7, 'state shows base and modulated');

  // MIDI source inactive without MIDI
  engine.modulate({ id: 'wheel', type: 'midi-cc', cc: 1 }, 'bacteria', 1);
  engine.tick(0.01);
  const s2 = engine.getState();
  assert(s2.sources.wheel.active === false && s2.controls.bacteria.modulated === 0.1, 'inactive MIDI source contributes nothing');

  // sample and hold steps once per period, holds between
  const shEngine = new ModulationEngine(env, () => ({ ...base }));
  shEngine.modulate({ id: 'sh', type: 'sample-hold', hz: 10 }, 'mold', 0.5);
  shEngine.tick(0.2);
  const a = shEngine.getState().sources.sh.value;
  shEngine.tick(0.01);
  const b = shEngine.getState().sources.sh.value;
  assert(a === b, 'sample and hold holds between samples');
  shEngine.dispose();

  // clearing frame after the last route, then nothing
  const clearEngine = new ModulationEngine(env, () => ({ ...base }));
  const r = clearEngine.modulate({ type: 'lfo', hz: 1, phase: 0.25 }, 'bloom', 0.5);
  clearEngine.tick(0);
  r.remove();
  const clearing = clearEngine.tick(0.01);
  assert(clearing && clearing.routes === 0 && clearing.controls.bloom === 0.4, 'one clearing frame with base values');
  assert(clearEngine.tick(0.01) === null, 'no frames after clearing');
  clearEngine.dispose();

  // --- facade + species hook ---
  const frames = [];
  const engineApi = pkg.createPlantasiaEngine();
  engineApi.registerSpecies(() => ({
    metadata: { id: 'custom.mod-test', name: 'Mod Test', concept: 'x', description: 'x', inspiration: ['x'], character: ['x'] },
    initialize: async () => {},
    start: async () => {},
    stop: () => {},
    noteOn: () => {},
    noteOff: () => {},
    allNotesOff: () => {},
    setControl: () => {},
    applyModulation: (frame) => frames.push(frame),
    dispose: () => {},
  }));
  for (const name of ['modulate', 'removeModulation', 'getModulationRoutes', 'getModulationState']) {
    assert(typeof engineApi[name] === 'function', `public method ${name}`);
  }
  const events = [];
  engineApi.on('modulationChanged', (payload) => events.push(payload));

  await engineApi.loadSpecies('custom.mod-test');
  engineApi.setControl('bloom', 0.3);
  const h = engineApi.modulate({ id: 'slow', type: 'lfo', hz: 0.5 }, 'bloom', 0.4);
  assert(events.length === 1 && events[0].routes.length === 1 && typeof events[0].time === 'number', 'facade emits modulationChanged with time');
  assert(engineApi.getModulationRoutes()[0].id === h.id, 'routes listed');
  assert(frames.length === 0, 'no frames before start');

  await engineApi.start();
  await wait(140);
  assert(frames.length >= 2, `species hook ticks while running: ${frames.length}`);
  const last = frames[frames.length - 1];
  assert(last.controls.bloom >= 0 && last.controls.bloom <= 100 && last.rampSec > 0.02 && last.rampSec < 0.05, 'frame on species scale with one tick ramp');
  assert(engineApi.getControl('bloom') === 0.3, 'getControl returns the base, not the modulated value');

  engineApi.stop();
  const countAtStop = frames.length;
  await wait(80);
  assert(frames.length === countAtStop, 'no ticks after stop');

  assert(engineApi.removeModulation(h.id) === true, 'removeModulation by id');
  assert(engineApi.removeModulation(h.id) === false, 'second remove is false');
  assert(engineApi.getModulationRoutes().length === 0, 'no routes left');
  engineApi.dispose();

  console.log('[test-modulation] OK — modulation engine, sources, spans, species hook validated');
}

main().catch((err) => {
  console.error('[test-modulation]', err.message ?? err);
  process.exit(1);
});
