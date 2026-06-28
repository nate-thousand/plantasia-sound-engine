import { createSpeciesManager, loadDefaultSpecies } from 'plantasia-sound-engine';

const manager = createSpeciesManager();
const status = document.getElementById('status');
const bloom = document.getElementById('bloom');

function log(msg) {
  console.log('[basic-engine]', msg);
  status.textContent = msg;
}

document.getElementById('btn-start')?.addEventListener('click', async () => {
  await loadDefaultSpecies(manager);
  manager.start();
  log(`Loaded ${manager.getCurrentSpecies()?.name ?? 'species'}`);
});

document.getElementById('btn-note')?.addEventListener('click', () => {
  manager.noteOn('C4', 0.82);
  setTimeout(() => manager.noteOff('C4'), 1200);
  log('Note C4');
});

document.getElementById('btn-stop')?.addEventListener('click', () => {
  manager.allNotesOff();
  manager.stop();
  log('Stopped');
});

bloom?.addEventListener('input', () => {
  const value = Number(bloom.value) / 100;
  manager.setControl('bloom', value);
  log(`Bloom ${bloom.value}%`);
});

log('Click Start Audio (user gesture required)');
