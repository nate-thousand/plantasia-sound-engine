import { PlantasiaEngine } from 'plantasia-sound-engine';

const engine = new PlantasiaEngine();
const status = document.getElementById('status');
let started = false;

function controls() {
  return {
    ...engine.initialBotanicalControls,
    space: Number(document.getElementById('space').value),
    texture: Number(document.getElementById('texture').value),
  };
}

function log(msg) {
  console.log('[example/effects]', msg);
  status.textContent = msg;
}

document.getElementById('btn-start').addEventListener('click', async () => {
  await engine.init();
  engine.applyBotanicalControls(controls());
  started = true;
  log('Audio started — adjust Space/Texture');
});

['space', 'texture'].forEach((id) => {
  document.getElementById(id).addEventListener('input', () => {
    if (started) engine.applyBotanicalControls(controls());
  });
});

document.getElementById('btn-play').addEventListener('click', () => {
  if (!started) return log('Start audio first');
  engine.triggerChord();
  log('Note playing');
});

document.getElementById('btn-stop').addEventListener('click', () => {
  engine.stop();
  log('Stopped');
});

log('Effects example ready');
