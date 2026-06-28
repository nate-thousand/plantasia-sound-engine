import { createPlantasiaEngine } from 'plantasia-sound-engine';

const engine = createPlantasiaEngine({ includeFuture: true });
const status = document.getElementById('status');
const activeEl = document.getElementById('active-species');
const upcomingEl = document.getElementById('upcoming');

function log(msg) {
  status.textContent = msg;
}

function renderLists() {
  activeEl.innerHTML = '';
  for (const meta of engine.getAvailableSpecies()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = meta.name;
    btn.addEventListener('click', () => void loadSpecies(meta.id));
    activeEl.appendChild(btn);
  }
  upcomingEl.textContent = `Coming soon: ${engine
    .getUpcomingSpecies()
    .map((m) => m.name)
    .join(', ')}`;
}

async function loadSpecies(id) {
  try {
    await engine.loadSpecies(id);
    await engine.start();
    engine.noteOn('E3', 0.7);
    setTimeout(() => engine.noteOff('E3'), 1500);
    log(`Playing ${engine.getCurrentSpecies()?.name}`);
  } catch (error) {
    log(error.message ?? String(error));
  }
}

document.getElementById('btn-start')?.addEventListener('click', async () => {
  renderLists();
  await engine.initialize();
  await engine.loadSpecies('seed');
  await engine.start();
  log('Audio started — pick a species');
});

renderLists();
log('Click Start Audio');
