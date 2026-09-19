import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_IDS = ['seed', 'flowers', 'mold', 'bacteria'];

async function main() {
  const { createSpeciesManager } = await import(
    join(root, 'dist/engine/createSpeciesManager.js')
  );
  const { EngineLifecycleError } = await import(
    join(root, 'dist/engine/EngineLifecycle.js')
  );

  const manager = createSpeciesManager();
  const available = manager.getAvailableSpecies();
  const active = manager.getActiveSpecies();

  if (active.length !== EXPECTED_IDS.length) {
    throw new Error(
      `Expected ${EXPECTED_IDS.length} active species, got ${active.length}`,
    );
  }

  const activeIds = active.map((species) => species.id).sort();
  const expected = [...EXPECTED_IDS].sort();
  if (JSON.stringify(activeIds) !== JSON.stringify(expected)) {
    throw new Error(`Active species ids mismatch: got [${activeIds}], expected [${expected}]`);
  }

  if (available.length !== active.length) {
    throw new Error('Default manager should expose playable species only');
  }

  for (const id of EXPECTED_IDS) {
    await manager.loadSpecies(id);
    const current = manager.getCurrentSpecies();
    if (current?.id !== id) {
      throw new Error(`loadSpecies("${id}") — current is "${current?.id ?? 'null'}"`);
    }
    manager.setControl('growth', 0.5);
    if (id === 'flowers') {
      manager.setControl('bloom', 0.75);
    }
    if (id === 'mold') {
      manager.setControl('mold', 0.9);
      manager.setControl('bacteria', 0.5);
    }
    if (id === 'bacteria') {
      manager.setControl('bacteria', 1.0);
      manager.setControl('growth', 0.7);
    }

    // Structural lifecycle check — noteOn before start must throw (no Tone graph in Node CI).
    let lifecycleEnforced = false;
    try {
      manager.noteOn('C4', 0.8);
    } catch (error) {
      lifecycleEnforced = error instanceof EngineLifecycleError;
    }
    if (!lifecycleEnforced) {
      throw new Error(`noteOn before start should throw EngineLifecycleError for "${id}"`);
    }
  }

  manager.dispose();
  console.info('[validate-species-api] OK — 4 active species registered and loadable');
}

main().catch((error) => {
  console.error('[validate-species-api]', error.message ?? error);
  process.exit(1);
});
