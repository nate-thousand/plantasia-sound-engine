import { PlantasiaEngine } from 'plantasia-sound-engine';

const engine = new PlantasiaEngine();
const status = document.getElementById('status');
let started = false;
let looping = false;
let intervalId = null;

function log(msg) {
  console.log('[example/sequencing]', msg);
  status.textContent = msg;
}

document.getElementById('btn-start').addEventListener('click', async () => {
  await engine.init();
  engine.setTempo(90);
  engine.applyBotanicalControls(engine.initialBotanicalControls);
  started = true;
  log('Audio started at 90 BPM');
});

document.getElementById('btn-loop').addEventListener('click', () => {
  if (!started) return log('Start audio first');
  looping = !looping;
  if (looping) {
    intervalId = window.setInterval(() => engine.triggerChord(), 666);
    log('Loop running');
  } else {
    clearInterval(intervalId);
    intervalId = null;
    log('Loop stopped');
  }
});

document.getElementById('btn-stop').addEventListener('click', () => {
  looping = false;
  if (intervalId) clearInterval(intervalId);
  engine.stop();
  log('Stopped');
});

log('Sequencing example ready');
