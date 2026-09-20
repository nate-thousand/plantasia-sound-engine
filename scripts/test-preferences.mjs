#!/usr/bin/env node
/**
 * 1.1 — generative preferences gate (ROADMAP decision 10 for 1.1.0).
 *
 * Generator: immediate keys apply now, boundary keys wait for the next
 * compose tick and reset the phrase. Manager and facade: host overrides
 * merge over species defaults and follow across species loads.
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
  const { Generator } = await import(join(root, 'dist/engine/generative/Generator.js'));
  const { SEED_GENERATIVE_PREFERENCES } = await import(join(root, 'dist/species/seed/metadata.js'));
  const { MOLD_GENERATIVE_PREFERENCES } = await import(join(root, 'dist/species/mold/metadata.js'));
  const pkg = await import(join(root, 'dist/public.js'));

  // --- Generator split ---
  const notes = [];
  const generator = new Generator(SEED_GENERATIVE_PREFERENCES, { noteOn: (n) => notes.push(n), noteOff: () => {} });
  assert(generator.getPreferences().preferredScale === SEED_GENERATIVE_PREFERENCES.preferredScale, 'starts from species defaults');

  // Not running: everything applies now.
  generator.setPreferences({ preferredScale: ['C2', 'G2'], preferredDensity: 0.9 });
  assert(generator.getPreferences().preferredScale.join() === 'C2,G2' && generator.getPreferences().preferredDensity === 0.9, 'applies now when stopped');

  // Running: boundary keys wait, immediate keys do not.
  generator.start(120);
  generator.setPreferences({ preferredScale: ['D2', 'A2'], probabilityBias: 0.99, rhythmStyle: 'swarm' });
  assert(generator.getPreferences().preferredScale.join() === 'D2,A2', 'getPreferences shows pending boundary values');
  assert(generator.getPreferences().probabilityBias === 0.99, 'immediate key applied while running');
  // Internal check: the effective scale is still the old one until a compose tick.
  const before = generator['preferences'];
  assert(before.preferredScale.join() === 'C2,G2' && before.probabilityBias === 0.99, 'boundary value not yet effective, immediate value is');
  let after = generator['preferences'];
  for (let i = 0; i < 60 && after.preferredScale.join() !== 'D2,A2'; i += 1) {
    await wait(100);
    after = generator['preferences'];
  }
  assert(after.preferredScale.join() === 'D2,A2' && after.rhythmStyle === 'swarm', 'boundary values land at the next compose tick');
  generator.stop();
  generator.dispose();

  // --- Species defaults + host overrides across loads ---
  const engine = pkg.createPlantasiaEngine();
  for (const name of ['setGenerativePreferences', 'getGenerativePreferences']) {
    assert(typeof engine[name] === 'function', `public method ${name}`);
  }
  assert(Object.keys(engine.getGenerativePreferences()).length === 0, 'nothing loaded, no overrides: empty');

  engine.setGenerativePreferences({ preferredScale: ['E2', 'B2', 'E3'], phraseLength: 3 });
  assert(engine.getGenerativePreferences().phraseLength === 3, 'overrides readable before load');

  await engine.loadSpecies('seed');
  const seedPrefs = engine.getGenerativePreferences();
  assert(seedPrefs.preferredScale.join() === 'E2,B2,E3', 'override applied on load');
  assert(seedPrefs.harmonyStyle === SEED_GENERATIVE_PREFERENCES.harmonyStyle, 'species default kept where not overridden');

  await engine.loadSpecies('mold');
  const moldPrefs = engine.getGenerativePreferences();
  assert(moldPrefs.preferredScale.join() === 'E2,B2,E3', 'override follows the player to the next species');
  assert(moldPrefs.rhythmStyle === MOLD_GENERATIVE_PREFERENCES.rhythmStyle, 'mold keeps its own rhythm style');
  assert(moldPrefs.preferredTempo === MOLD_GENERATIVE_PREFERENCES.preferredTempo, 'mold keeps its own tempo');

  engine.setGenerativePreferences({ preferredTempo: 61 });
  assert(engine.getGenerativePreferences().preferredTempo === 61, 'tempo override applied to the loaded species');

  engine.dispose();
  console.log('[test-preferences] OK — generative preferences validated');
}

main().catch((err) => {
  console.error('[test-preferences]', err.message ?? err);
  process.exit(1);
});
