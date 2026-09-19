import { createSpeciesManager } from 'plantasia-sound-engine';

const manager = createSpeciesManager();
const status = document.getElementById('status');
const speciesSelect = document.getElementById('species');

const KEY_MAP = {
  a: { note: 'C4', velocity: 0.55 },
  s: { note: 'D4', velocity: 0.65 },
  d: { note: 'E4', velocity: 0.72 },
  f: { note: 'G4', velocity: 0.8 },
  g: { note: 'A4', velocity: 0.88 },
  h: { note: 'C5', velocity: 0.75 },
  j: { note: 'D5', velocity: 0.92 },
  k: { note: 'E5', velocity: 0.95 },
};

const held = new Set();

function log(msg) {
  status.textContent = msg;
}

async function ensureStarted() {
  const id = speciesSelect.value;
  if (manager.getCurrentSpecies()?.id !== id) {
    await manager.loadSpecies(id);
    await manager.start();
    log(`Loaded ${id}`);
  }
}

document.getElementById('btn-start')?.addEventListener('click', async () => {
  await ensureStarted();
  log('Play keys A–K');
});

speciesSelect?.addEventListener('change', () => {
  void ensureStarted();
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const mapping = KEY_MAP[event.key.toLowerCase()];
  if (!mapping) return;
  void ensureStarted().then(() => {
    if (!held.has(mapping.note)) {
      held.add(mapping.note);
      manager.noteOn(mapping.note, mapping.velocity);
      log(`${mapping.note} vel ${mapping.velocity.toFixed(2)}`);
    }
  });
});

window.addEventListener('keyup', (event) => {
  const mapping = KEY_MAP[event.key.toLowerCase()];
  if (!mapping) return;
  held.delete(mapping.note);
  manager.noteOff(mapping.note);
});

log('Start audio, then use keyboard');
