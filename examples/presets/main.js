import { PlantasiaEngine } from 'plantasia-sound-engine';

const engine = new PlantasiaEngine();
const status = document.getElementById('status');
const select = document.getElementById('preset-select');
let started = false;

for (const preset of engine.presets) {
  const option = document.createElement('option');
  option.value = preset.id;
  option.textContent = `${preset.name} (${preset.species})`;
  select.appendChild(option);
}

function log(msg) {
  console.log('[example/presets]', msg);
  status.textContent = msg;
}

document.getElementById('btn-start').addEventListener('click', async () => {
  await engine.init();
  engine.applyBotanicalControls(engine.initialBotanicalControls);
  started = true;
  log('Audio started');
});

document.getElementById('btn-play').addEventListener('click', () => {
  if (!started) return log('Start audio first');
  const preset = engine.presets.find((p) => p.id === select.value);
  if (preset) {
    engine.playPreset(preset);
    log(`Playing ${preset.name}`);
  }
});

document.getElementById('btn-stop').addEventListener('click', () => {
  engine.stop();
  log('Stopped');
});

log(`Loaded ${engine.presets.length} presets`);
