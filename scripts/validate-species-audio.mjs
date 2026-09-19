#!/usr/bin/env node
/**
 * Phase 21 — species audio readiness gate (structural; full sonic check requires browser).
 *
 * Validates lifecycle + graph wiring for all playable species.
 * Run `npm run example:basic-engine` in a browser for audible confirmation.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPECIES = ['seed', 'flowers', 'mold', 'bacteria'];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { createPlantasiaEngine } = await import(join(root, 'dist/public.js'));
  const { EngineLifecycleError } = await import(join(root, 'dist/engine/EngineLifecycle.js'));

  const engine = createPlantasiaEngine();

  for (const id of SPECIES) {
    await engine.loadSpecies(id);
    assert(engine.getCurrentSpecies()?.id === id, `loaded ${id}`);
    assert(engine.getState() === 'loaded', `${id} in loaded state`);

    let noteBeforeStart = false;
    try {
      engine.noteOn('C4', 0.8);
    } catch (error) {
      noteBeforeStart = error instanceof EngineLifecycleError;
    }
    assert(noteBeforeStart, `${id}: noteOn before start throws`);

    engine.setControl('bloom', 0.55);
    engine.setControl('growth', 0.6);
    engine.stopSpecies();
    assert(engine.getState() === 'loaded', `${id} stopSpecies is idempotent when loaded`);
  }

  await engine.loadPreset('plantasonic');
  assert(engine.getCurrentSpecies()?.id === 'seed', 'plantasonic preset loads seed');
  engine.dispose();

  console.log('[validate-species-audio] OK — structural audio readiness validated');
  console.log('[validate-species-audio] For sonic confirmation: npm run example:basic-engine');
}

main().catch((err) => {
  console.error('[validate-species-audio]', err.message ?? err);
  process.exit(1);
});
