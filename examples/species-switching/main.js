import { createSpeciesManager } from 'plantasia-sound-engine';

const manager = createSpeciesManager({ includeFuture: true });
const status = document.getElementById('status');
const activeEl = document.getElementById('active-species');
const upcomingEl = document.getElementById('upcoming');

function log(msg) {
  status.textContent = msg;
}

function renderLists() {
  activeEl.innerHTML = '';
  for (const meta of manager.getActiveSpecies()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = meta.name;
    btn.addEventListener('click', () => void loadSpecies(meta.id));
    activeEl.appendChild(btn);
  }
  upcomingEl.textContent = `Coming soon: ${manager
    .getUpcomingSpecies()
    .map((m) => m.name)
    .join(', ')}`;
}

async function loadSpecies(id) {
  try {
    await manager.loadSpecies(id);
    manager.start();
    manager.noteOn('E3', 0.7);
    setTimeout(() => manager.noteOff('E3'), 1500);
    log(`Playing ${manager.getCurrentSpecies()?.name}`);
  } catch (error) {
    log(error.message ?? String(error));
  }
}

document.getElementById('btn-start')?.addEventListener('click', async () => {
  renderLists();
  await manager.loadSpecies('seed');
  manager.start();
  log('Audio started — pick a species');
});

renderLists();
log('Click Start Audio');
