import { PlantasiaEngine } from 'plantasia-sound-engine';

const engine = new PlantasiaEngine();
const status = document.getElementById('status');
let started = false;

const KEY_MAP = {
  a: ['C3', 'E3', 'G3'],
  s: ['D3', 'F3', 'A3'],
  d: ['E3', 'G3', 'B3'],
};

function log(msg) {
  console.log('[example/midi]', msg);
  status.textContent = msg;
}

document.getElementById('btn-start').addEventListener('click', async () => {
  await engine.init();
  engine.applyBotanicalControls(engine.initialBotanicalControls);
  started = true;
  log('Audio started — press A/S/D for chords (MIDI scaffold pending)');
});

window.addEventListener('keydown', (event) => {
  if (!started || event.repeat) return;
  const notes = KEY_MAP[event.key.toLowerCase()];
  if (notes) {
    engine.triggerChord(notes);
    log(`Note playing: ${notes.join(', ')}`);
  }
});

window.addEventListener('keyup', (event) => {
  if (KEY_MAP[event.key.toLowerCase()]) {
    engine.stop();
    log('Note stopped');
  }
});

log('MIDI example ready');
