import { createSpeciesManager } from 'plantasia-sound-engine';

const manager = createSpeciesManager();
const status = document.getElementById('status');
const speciesSelect = document.getElementById('species');
const growth = document.getElementById('growth');
const bacteria = document.getElementById('bacteria');

function log(msg) {
  status.textContent = msg;
}

function applyControls() {
  manager.setControl('growth', Number(growth.value) / 100);
  manager.setControl('bacteria', Number(bacteria.value) / 100);
}

document.getElementById('btn-start')?.addEventListener('click', async () => {
  const id = speciesSelect.value;
  await manager.loadSpecies(id);
  applyControls();
  await manager.start();
  log(`Generative ${id} running — adjust growth/bacteria`);
});

document.getElementById('btn-stop')?.addEventListener('click', () => {
  manager.stop();
  manager.allNotesOff();
  log('Stopped');
});

growth?.addEventListener('input', applyControls);
bacteria?.addEventListener('input', applyControls);
speciesSelect?.addEventListener('change', () => log('Switch species after stopping'));

log('Start to hear autonomous playback');
