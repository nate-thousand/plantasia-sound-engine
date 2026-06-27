import { PlantasiaEngine } from '../dist/index.js';

const LOG_PREFIX = '[plantasia-demo]';

const statusEl = document.getElementById('status');
const statusTextEl = document.getElementById('status-text');
const presetSelect = document.getElementById('preset-select');
const btnStart = document.getElementById('btn-start');
const btnPlay = document.getElementById('btn-play');
const btnStop = document.getElementById('btn-stop');

/** @type {PlantasiaEngine | null} */
let engine = null;
let audioStarted = false;

function log(step, detail) {
  if (detail !== undefined) {
    console.log(`${LOG_PREFIX} ${step}`, detail);
    return;
  }
  console.log(`${LOG_PREFIX} ${step}`);
}

function setStatus(message, kind = 'ok') {
  statusTextEl.textContent = message;
  statusEl.dataset.kind = kind;
  log(`status: ${message}`);
}

function showError(message, error) {
  const detail = error instanceof Error ? error.message : String(error ?? '');
  const full = detail ? `${message}: ${detail}` : message;
  console.error(`${LOG_PREFIX} error`, error ?? full);
  setStatus(full, 'error');
}

function selectedPreset() {
  if (!engine) {
    return undefined;
  }
  return engine.presets.find((preset) => preset.id === presetSelect.value);
}

function populatePresets() {
  log('populating preset selector', { count: engine.presets.length });
  presetSelect.replaceChildren();

  for (const preset of engine.presets) {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  }

  if (engine.presets.length > 0) {
    log('default preset selected', engine.presets[0].name);
    setStatus('Preset selected');
  }
}

function setPlayStopEnabled(enabled) {
  btnPlay.disabled = !enabled;
  btnStop.disabled = !enabled;
}

async function boot() {
  try {
    log('importing engine from ../dist/index.js');
    engine = new PlantasiaEngine();
    log('engine instance created', { presetCount: engine.presets.length });
    populatePresets();
    setStatus('Engine loaded');
    log('boot complete');
  } catch (error) {
    showError('Engine failed to load', error);
    btnStart.disabled = true;
  }
}

btnStart.addEventListener('click', async () => {
  if (!engine) {
    showError('Engine not loaded');
    return;
  }

  try {
    log('Start Audio clicked');
    btnStart.disabled = true;
    log('calling engine.init()');
    await engine.init();
    log('engine.init() resolved');
    log('applying initial botanical controls');
    engine.applyBotanicalControls(engine.initialBotanicalControls);
    audioStarted = true;
    setPlayStopEnabled(true);
    setStatus('Audio context started');
  } catch (error) {
    btnStart.disabled = false;
    showError('Audio context failed to start', error);
  }
});

presetSelect.addEventListener('change', () => {
  const preset = selectedPreset();
  log('preset selector changed', preset?.name ?? presetSelect.value);
  if (preset) {
    setStatus('Preset selected');
  } else {
    showError('Preset not found');
  }
});

btnPlay.addEventListener('click', () => {
  if (!engine) {
    showError('Engine not loaded');
    return;
  }

  if (!audioStarted) {
    showError('Start Audio before playing a note');
    return;
  }

  const preset = selectedPreset();
  if (!preset) {
    showError('No preset selected');
    return;
  }

  try {
    log('Play Note clicked', { preset: preset.name });
    log('calling engine.playPreset()');
    engine.playPreset(preset);
    log('engine.playPreset() returned');
    setStatus('Note playing');
  } catch (error) {
    showError('Failed to play note', error);
  }
});

btnStop.addEventListener('click', () => {
  if (!engine) {
    showError('Engine not loaded');
    return;
  }

  try {
    log('Stop Note clicked');
    log('calling engine.stop()');
    engine.stop();
    log('engine.stop() returned');
    setStatus('Note stopped');
  } catch (error) {
    showError('Failed to stop note', error);
  }
});

void boot();
