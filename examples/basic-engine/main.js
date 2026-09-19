import { createPlantasiaEngine } from 'plantasia-sound-engine';

const engine = createPlantasiaEngine();
const status = document.getElementById('status');
const bloom = document.getElementById('bloom');

function log(msg) {
  console.log('[basic-engine]', msg);
  status.textContent = msg;
}

document.getElementById('btn-start')?.addEventListener('click', async () => {
  await engine.initialize();
  await engine.loadDefaultSpecies();
  await engine.start();
  log(`Loaded ${engine.getCurrentSpecies()?.name ?? 'species'}`);
});

document.getElementById('btn-note')?.addEventListener('click', () => {
  try {
    engine.noteOn('C4', 0.82);
    setTimeout(() => engine.noteOff('C4'), 1200);
    log('Note C4');
  } catch (error) {
    log(error.message ?? String(error));
  }
});

document.getElementById('btn-stop')?.addEventListener('click', () => {
  engine.allNotesOff();
  engine.stopSpecies();
  log('Stopped');
});

bloom?.addEventListener('input', () => {
  const value = Number(bloom.value) / 100;
  engine.setControl('bloom', value);
  log(`Bloom ${bloom.value}%`);
});

log('Click Start Audio (user gesture required)');
