import { EngineBridge } from './lib/engineBridge.js';
import { buildUI } from './lib/ui.js';
import { createVisualizer } from './lib/visualizer.js';

const LOG_PREFIX = '[plantasia-demo]';

const statusBar = document.getElementById('status-bar');
const stageSubtitle = document.getElementById('stage-subtitle');
const btnStart = document.getElementById('btn-start');
const btnGenerative = document.getElementById('btn-generative');
const btnPlayPreset = document.getElementById('btn-play-preset');
const btnStop = document.getElementById('btn-stop');
const btnPanelClose = document.getElementById('btn-panel-close');
const btnPanelToggle = document.getElementById('panel-toggle');
const app = document.getElementById('app');

const bridge = new EngineBridge();
let ui = null;
let visualizer = null;

function log(msg, detail) {
  if (detail !== undefined) console.log(LOG_PREFIX, msg, detail);
  else console.log(LOG_PREFIX, msg);
}

function setStatus(message, kind = 'ok') {
  statusBar.textContent = message;
  statusBar.dataset.kind = kind;
  log(`status: ${message}`);
}

function setAudioLockState(unlocked) {
  if (stageSubtitle) {
    stageSubtitle.textContent = unlocked
      ? 'Audio unlocked — v2 generative + v1 preset paths available'
      : 'Audio locked — click Start Audio to unlock (user gesture required)';
  }
}

function setControlsEnabled(started) {
  btnGenerative.disabled = !started;
  btnPlayPreset.disabled = !started;
  btnStop.disabled = !started;
}

function initMeters() {
  const meters = {};
  for (const el of document.querySelectorAll('[data-meter]')) {
    const name = el.dataset.meter;
    meters[name] = {
      fill: el.querySelector('.meter-fill'),
      value: el.querySelector('.meter-value'),
    };
  }
  return meters;
}

async function boot() {
  try {
    bridge.subscribeEvents((name, payload) => {
      ui?.updateDebug();
      if (name === 'notePlayed' && ui?.refs?.midiMonitor) {
        ui.refs.midiMonitor.textContent = `${payload.source}: ${payload.note} @ ${payload.velocity.toFixed(2)}`;
      }
      if (name === 'speciesChanged') {
        ui?.rebuildLayers();
        ui?.rebuildMacros();
        ui?.updateSpeciesMeta?.();
      }
    });

    ui = buildUI(bridge, { onStatus: setStatus });
    bridge.validate();

    visualizer = createVisualizer(bridge, {
      waveformCanvas: document.getElementById('waveform-canvas'),
      liveFeed: document.getElementById('live-feed'),
      meters: initMeters(),
    });
    visualizer.start();

    setInterval(() => ui?.updateDebug(), 1000);

    setStatus(`Engine loaded — ${bridge.presets.length} presets`);
    setAudioLockState(false);
    log('boot complete');
  } catch (error) {
    console.error(LOG_PREFIX, error);
    setStatus(`Engine failed: ${error.message}`, 'error');
    btnStart.disabled = true;
  }
}

btnStart.addEventListener('click', async () => {
  try {
    btnStart.disabled = true;
    await bridge.startAudio();
    await bridge.loadCurrentPreset(false);
    setControlsEnabled(true);
    setAudioLockState(true);
    ui?.syncSlidersFromBridge();
    ui?.refreshPresetMeta();
    ui?.updateSpeciesMeta?.();
    setStatus('Audio started — load preset or start generative');
  } catch (error) {
    btnStart.disabled = false;
    setStatus(`Audio failed: ${error.message}`, 'error');
  }
});

btnGenerative.addEventListener('click', async () => {
  try {
    if (bridge.generativeRunning) {
      bridge.stopGenerative();
      btnGenerative.textContent = 'Start Generative';
      setStatus('Generative stopped');
    } else {
      await bridge.startGenerative();
      btnGenerative.textContent = 'Stop Generative';
      setStatus('Generative playback running');
    }
    ui?.updateDebug();
  } catch (error) {
    setStatus(`Generative failed: ${error.message}`, 'error');
  }
});

btnPlayPreset.addEventListener('click', () => {
  try {
    bridge.playPresetChord();
    setStatus('Preset chord playing (v1 path)');
  } catch (error) {
    setStatus(`Play failed: ${error.message}`, 'error');
  }
});

btnStop.addEventListener('click', () => {
  bridge.stopAll();
  btnGenerative.textContent = 'Start Generative';
  setStatus('Stopped');
  ui?.updateDebug();
});

btnPanelClose.addEventListener('click', () => {
  app.classList.add('panel-collapsed');
});

btnPanelToggle.addEventListener('click', () => {
  app.classList.toggle('panel-collapsed');
});

void boot();
