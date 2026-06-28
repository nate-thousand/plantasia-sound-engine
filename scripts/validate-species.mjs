import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_IDS = ['seed', 'flowers', 'mold', 'bacteria'];

async function main() {
  const { createSpeciesManager } = await import(
    join(root, 'dist/engine/createSpeciesManager.js')
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

  if (available.length <= active.length) {
    throw new Error('Expected upcoming species in full registry list');
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
      manager.noteOn('C3', 0.7);
      manager.noteOff('C3');
    }
    if (id === 'bacteria') {
      manager.setControl('bacteria', 1.0);
      manager.setControl('growth', 0.7);
    }
    manager.noteOn('C4', 0.8);
    manager.noteOff('C4');
  }

  manager.dispose();
  console.info('[validate-species] OK — 4 active species registered and loadable');
}

main().catch((error) => {
  console.error('[validate-species]', error.message ?? error);
  process.exit(1);
});
