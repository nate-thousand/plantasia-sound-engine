import { PlantasiaEngine } from 'plantasia-sound-engine';

const engine = new PlantasiaEngine();
const status = document.getElementById('status');
let started = false;

function randomChord() {
  const pool = [...engine.defaultNotePool];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

function log(msg) {
  console.log('[example/generative]', msg);
  status.textContent = msg;
}

document.getElementById('btn-start').addEventListener('click', async () => {
  await engine.init();
  engine.applyBotanicalControls(engine.initialBotanicalControls);
  started = true;
  log('Audio started');
});

document.getElementById('btn-random').addEventListener('click', () => {
  if (!started) return log('Start audio first');
  const notes = randomChord();
  engine.triggerChord(notes);
  log(`Note playing: ${notes.join(', ')}`);
});

document.getElementById('btn-stop').addEventListener('click', () => {
  engine.stop();
  log('Note stopped');
});

log('Generative example ready');
