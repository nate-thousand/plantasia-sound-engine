/**
 * Builds all collapsible control sections for the demo panel.
 */

import {
  createSection,
  rangeField,
  selectField,
  checkboxField,
  buttonRow,
  hint,
  groupHeading,
} from './sections.js';
import { buildModulationSection } from './modulationSection.js';
import {
  LAYER_DEFS,
  PERFORMANCE_MACROS,
  applyMacro,
} from './engineBridge.js';

const KEY_MAP = {
  a: { note: 'C4', velocity: 0.55 },
  s: { note: 'D4', velocity: 0.65 },
  d: { note: 'E4', velocity: 0.72 },
  f: { note: 'G4', velocity: 0.8 },
  g: { note: 'A4', velocity: 0.88 },
  h: { note: 'C5', velocity: 0.75 },
  j: { note: 'D5', velocity: 0.92 },
  k: { note: 'E5', velocity: 0.95 },
  w: { note: 'A3', velocity: 0.5 },
  e: { note: 'B3', velocity: 0.6 },
  r: { note: 'F4', velocity: 0.7 },
};

export function buildUI(bridge, callbacks) {
  const root = document.getElementById('sections-root');
  const refs = {};
  const heldKeys = new Set();

  function refreshPresetMeta() {
    const preset = bridge.getPreset(bridge.currentPresetId);
    if (!preset || !refs.presetMeta) return;
    refs.presetMeta.textContent = [
      preset.description,
      preset.mood ? `Mood: ${preset.mood}` : '',
      preset.category ? `Category: ${preset.category}` : '',
      preset.tags?.length ? `Tags: ${preset.tags.join(', ')}` : '',
    ].filter(Boolean).join(' · ');
  }

  function syncSlidersFromBridge() {
    for (const [id, ref] of Object.entries(refs.sliders ?? {})) {
      if (ref?.input && ref.getValue) {
        ref.input.value = ref.getValue();
        if (ref.out) ref.out.textContent = ref.input.value;
      }
    }
  }

  root.appendChild(groupHeading('Depth', 'The rest of the thirty four method surface of plantasia-sound-engine/public: presets, generative preferences, analysis, modulation, MIDI, utilities. Available and additive; not needed for a first instrument.'));

  // --- Presets ---
  root.appendChild(createSection('presets', 'Presets', (body) => {
    const categorySelect = selectField('Category', 'preset-category', [], 'all', (val) => {
      populatePresetList(val);
    });
    body.appendChild(categorySelect.field);

    const presetSelect = selectField('Preset', 'preset-select', [], bridge.currentPresetId, async (val) => {
      await bridge.selectPreset(val);
      refreshPresetMeta();
      rebuildLayers();
      rebuildMacros();
      syncSlidersFromBridge();
      callbacks.onStatus(`Preset: ${bridge.getPreset(val)?.name}`);
    });
    body.appendChild(presetSelect.field);
    refs.presetSelect = presetSelect.select;
    refs.categorySelect = categorySelect.select;

    refs.presetMeta = document.createElement('p');
    refs.presetMeta.className = 'preset-meta';
    body.appendChild(refs.presetMeta);

    refs.favoritesEl = document.createElement('div');
    refs.favoritesEl.className = 'favorites';
    body.appendChild(refs.favoritesEl);

    body.appendChild(buttonRow([
      { label: '◀ Prev', id: 'btn-prev-preset', onClick: async () => { const p = await bridge.prevPreset(); presetSelect.select.value = p.id; refreshPresetMeta(); rebuildLayers(); rebuildMacros(); callbacks.onStatus(`Preset: ${p.name}`); } },
      { label: 'Next ▶', id: 'btn-next-preset', onClick: async () => { const p = await bridge.nextPreset(); presetSelect.select.value = p.id; refreshPresetMeta(); rebuildLayers(); rebuildMacros(); callbacks.onStatus(`Preset: ${p.name}`); } },
      { label: '🎲 Random', id: 'btn-random-preset', onClick: async () => { const p = await bridge.randomPreset(); presetSelect.select.value = p.id; refreshPresetMeta(); rebuildLayers(); rebuildMacros(); callbacks.onStatus(`Random: ${p.name}`); } },
    ]));

    body.appendChild(buttonRow([
      { label: '★ Favorite', id: 'btn-fav', onClick: () => { bridge.toggleFavorite(bridge.currentPresetId); renderFavorites(); } },
      { label: 'Save Temp', id: 'btn-save-temp', onClick: () => { bridge.saveTempPreset(); callbacks.onStatus('Temp preset saved'); } },
      { label: 'Copy JSON', id: 'btn-copy-preset', onClick: () => { navigator.clipboard.writeText(bridge.exportPresetJson()); callbacks.onStatus('Preset JSON copied'); } },
    ]));

    function populatePresetList(category) {
      const list = category === 'all'
        ? bridge.presets
        : bridge.getPresetsInCategory(category).length
          ? bridge.getPresetsInCategory(category)
          : bridge.presets.filter((p) => p.category === category);
      presetSelect.select.replaceChildren();
      for (const p of list) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        presetSelect.select.appendChild(opt);
      }
      presetSelect.select.value = bridge.currentPresetId;
    }

    function renderFavorites() {
      refs.favoritesEl.replaceChildren();
      for (const id of bridge.getFavorites()) {
        const p = bridge.getPreset(id);
        if (!p) continue;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'small fav-btn' + (id === bridge.currentPresetId ? ' active' : '');
        btn.textContent = p.name;
        btn.addEventListener('click', async () => {
          await bridge.selectPreset(id);
          presetSelect.select.value = id;
          refreshPresetMeta();
          rebuildLayers();
          rebuildMacros();
        });
        refs.favoritesEl.appendChild(btn);
      }
    }

    categorySelect.select.replaceChildren();
    categorySelect.select.appendChild(new Option('All presets', 'all'));
    for (const cat of bridge.categories) {
      const presets = bridge.getPresetsInCategory(cat);
      if (presets.length) {
        categorySelect.select.appendChild(new Option(cat, cat));
      }
    }
    populatePresetList('all');
    renderFavorites();
    refreshPresetMeta();
  }));

  // --- Sound Worlds ---
  root.appendChild(createSection('sound-worlds', 'Sound Worlds', (body) => {
    refs.speciesMeta = document.createElement('p');
    refs.speciesMeta.className = 'preset-meta';
    body.appendChild(refs.speciesMeta);

    body.appendChild(hint('Load a preset to map its v2 species. Switch species directly below.'));

    const speciesSelect = selectField('Active species', 'species-select', [], 'seed', async (val) => {
      if (!bridge.audioStarted) {
        callbacks.onStatus('Start Audio before switching species', 'error');
        speciesSelect.select.value = bridge.engine.getCurrentSpecies()?.id ?? 'seed';
        return;
      }
      try {
        await bridge.engine.loadSpecies(val);
        await bridge.engine.start();
        bridge.generativeRunning = true;
        bridge.applyEcologyToEngine();
        updateSpeciesMeta();
        rebuildLayers();
        rebuildMacros();
        callbacks.onStatus(`Species: ${val}`);
      } catch (error) {
        callbacks.onStatus(`Species load failed: ${error.message}`, 'error');
      }
    });
    body.appendChild(speciesSelect.field);
    refs.speciesSelect = speciesSelect.select;

    for (const s of bridge.engine.getAvailableSpecies()) {
      speciesSelect.select.appendChild(new Option(s.name, s.id));
    }

    function updateSpeciesMeta() {
      const s = bridge.engine.getCurrentSpecies();
      if (s) {
        refs.speciesMeta.textContent = `${s.concept} — ${s.description}`;
      }
    }
    updateSpeciesMeta();
    refs.updateSpeciesMeta = updateSpeciesMeta;
  }));

  // --- Musical Controls ---
  root.appendChild(createSection('musical', 'Musical Controls', (body) => {
    refs.sliders = refs.sliders ?? {};
    body.appendChild(hint('Tempo uses engine.setTempo(). Density/random/complexity route via botanical (v1 graph + mold).'));

    const musicalFields = [
      ['tempo', 'Tempo (BPM)', 40, 200, 1, () => bridge.musical.tempo, (v) => { bridge.musical.tempo = v; bridge.applyMusicalControls(); }, {}],
      ['phraseDensity', 'Phrase density → botanical.density', 0, 100, 1, () => bridge.musical.phraseDensity, (v) => { bridge.musical.phraseDensity = v; bridge.applyMusicalControls(); }, {}],
      ['melodicComplexity', 'Melodic complexity → botanical.harmony', 0, 100, 1, () => bridge.musical.melodicComplexity, (v) => { bridge.musical.melodicComplexity = v; bridge.applyMusicalControls(); }, {}],
      ['rhythmicComplexity', 'Rhythmic complexity → botanical.evolution', 0, 100, 1, () => bridge.musical.rhythmicComplexity, (v) => { bridge.musical.rhythmicComplexity = v; bridge.applyMusicalControls(); }, {}],
      ['randomness', 'Randomness → botanical.random', 0, 100, 1, () => bridge.musical.randomness, (v) => { bridge.musical.randomness = v; bridge.applyMusicalControls(); }, {}],
    ];
    for (const [id, label, min, max, step, getVal, setVal, opts] of musicalFields) {
      const r = rangeField(label, `musical-${id}`, min, max, step, getVal(), (v) => setVal(v), opts);
      refs.sliders[id] = { input: r.input, out: r.out, getValue: getVal };
      body.appendChild(r.field);
    }

    body.appendChild(buttonRow([
      { label: '▶ Transport', id: 'btn-transport-play', onClick: () => { bridge.engine.transport.play(); callbacks.onStatus('Transport playing'); } },
      { label: '⏸ Pause', id: 'btn-transport-pause', onClick: () => { bridge.engine.transport.pause(); callbacks.onStatus('Transport paused'); } },
      { label: '⏹ Stop', id: 'btn-transport-stop', onClick: () => { bridge.engine.transport.stop(); callbacks.onStatus('Transport stopped'); } },
    ]));
    body.appendChild(hint('Transport drives engine.transport clock (host scheduling). Distinct from generative start/stop.'));
  }));

  // --- Layers ---
  const layersSection = createSection('layers', 'Layers', (body) => {
    refs.layersBody = body;
  });
  root.appendChild(layersSection);

  function rebuildLayers() {
    if (!refs.layersBody) return;
    refs.layersBody.replaceChildren();
    refs.layersBody.appendChild(hint('No per-layer engine API. Each slider calls engine.setControl() for its ecology key.'));

    const sid = bridge.engine.getCurrentSpecies()?.id ?? 'seed';
    const defs = LAYER_DEFS[sid] ?? LAYER_DEFS.seed;

    for (const layer of defs) {
      const card = document.createElement('div');
      card.className = 'layer-card';
      const ecoVal = Math.round((bridge.ecology[layer.ecology] ?? 0.5) * 100);
      bridge.layerState[layer.id] = { ecology: layer.ecology, level: ecoVal };

      card.innerHTML = `<div class="layer-title">${layer.label} → ecology.${layer.ecology}</div>`;

      const r = rangeField('Level', `layer-${layer.id}-level`, 0, 100, 1, ecoVal, (v) => {
        bridge.setEcology(layer.ecology, v);
        bridge.layerState[layer.id].level = v;
      });
      card.appendChild(r.field);
      refs.layersBody.appendChild(card);
    }
  }
  rebuildLayers();

  // --- Timbre ---
  // --- Effects ---
  // --- Generative ---
  root.appendChild(createSection('generative', 'Generative Engine', (body) => {
    body.appendChild(hint('Generative engine reads ecology via setControl(). Sliders map to ecology + botanical proxies.'));
    for (const [id, label] of [
      ['phraseEvolution', 'Phrase evolution → ecology.growth'],
      ['mutation', 'Mutation → ecology.bacteria'],
      ['eventFrequency', 'Event frequency → ecology + botanical.density'],
      ['ambientEvolution', 'Ambient evolution → ecology.bloom'],
    ]) {
      const r = rangeField(label, `gen-${id}`, 0, 100, 1, bridge.generative[id], (v) => {
        bridge.generative[id] = v;
        bridge.applyGenerativeControls();
      });
      body.appendChild(r.field);
    }
  }));

  // --- Ecology (v2) ---
  root.appendChild(createSection('ecology', 'Ecological Controls (v2)', (body) => {
    body.appendChild(hint('Primary v2 control surface. UI 0–100 → engine.setControl() 0–1. Affects active species generative + timbre routing.'));
    for (const c of ['growth', 'bloom', 'roots', 'mold', 'bacteria']) {
      const r = rangeField(c.charAt(0).toUpperCase() + c.slice(1), `eco-${c}`, 0, 100, 1, Math.round(bridge.ecology[c] * 100), (v) => {
        bridge.setEcology(c, v);
      });
      body.appendChild(r.field);
    }
  }));

  // --- Botanical (v1) ---
  // --- Audio ---
  root.appendChild(createSection('audio', 'Audio Analysis', (body) => {
    body.appendChild(hint('engine.getAudioFeatures() and getWaveform() read the master bus, so every path (v1 presets, Plantasonic, Juno, v2 species) shows here. Bass under 200 Hz, mid to 2 kHz, treble above; centroid on a log scale; onset is the spectral flux detector in the engine (also an event).'));
    body.appendChild(buttonRow([
      { label: 'Trigger chord (v1)', id: 'btn-trigger-chord', onClick: () => {
        if (!bridge.audioStarted) { callbacks.onStatus('Start Audio first', 'error'); return; }
        bridge.triggerChord();
        callbacks.onStatus('v1 triggerChord()');
      }},
    ]));
  }));

  // --- Modulation (1.1) ---
  root.appendChild(createSection('modulation', 'Modulation', (body) => {
    buildModulationSection(body, bridge, callbacks);
  }));

  // --- MIDI ---
  root.appendChild(createSection('midi', 'MIDI', (body) => {
    refs.midiStatus = document.createElement('p');
    refs.midiStatus.className = 'hint';
    refs.midiStatus.textContent = 'Web MIDI: note on/off only. Requires generative running. Device select not wired yet.';
    body.appendChild(refs.midiStatus);

    body.appendChild(buttonRow([
      { label: 'Enable MIDI', id: 'btn-midi-enable', className: 'primary', onClick: async () => {
        if (!bridge.audioStarted) {
          callbacks.onStatus('Start Audio before enabling MIDI', 'error');
          return;
        }
        if (bridge.engine.getState() !== 'running') {
          callbacks.onStatus('Start Generative before MIDI (engine requires running state)', 'error');
          return;
        }
        const ok = await bridge.engine.enableMidi();
        bridge.midiEnabled = ok;
        refs.midiStatus.textContent = ok
          ? `MIDI connected — ${bridge.engine.midi.devices.length} input(s). Notes route to active species.`
          : 'Web MIDI unavailable in this browser';
        callbacks.onStatus(ok ? 'MIDI enabled' : 'MIDI unavailable', ok ? 'ok' : 'error');
      }},
      { label: 'Panic', id: 'btn-midi-panic', className: 'danger', onClick: () => { bridge.panic(); callbacks.onStatus('Panic — all notes off + stop'); } },
    ]));

    refs.midiMonitor = document.createElement('div');
    refs.midiMonitor.id = 'midi-monitor';
    refs.midiMonitor.className = 'hint';
    refs.midiMonitor.textContent = 'MIDI monitor idle';
    body.appendChild(refs.midiMonitor);
  }));

  // --- Keyboard ---
  root.appendChild(createSection('keyboard', 'Computer Keyboard', (body) => {
    body.appendChild(checkboxField('Keyboard enabled', 'kb-enable', true, () => {}).field);
    body.appendChild(hint('Fixed map: A–K + W/E/R → engine.noteOn/noteOff. Auto-starts generative if needed.'));

    refs.kbDisplay = document.createElement('div');
    refs.kbDisplay.id = 'keyboard-display';
    for (const key of Object.keys(KEY_MAP)) {
      const el = document.createElement('div');
      el.className = 'key';
      el.dataset.key = key;
      el.textContent = key.toUpperCase();
      refs.kbDisplay.appendChild(el);
    }
    body.appendChild(refs.kbDisplay);
  }));

  // --- Performance Macros ---
  const perfSection = createSection('performance', 'Performance Macros', (body) => {
    refs.macrosBody = body;
    body.appendChild(hint('Macros call setControl/setMold/applyBotanicalControls. Ecology routes affect v2 generative. Botanical routes affect v1 graph only.'));
  });
  root.appendChild(perfSection);

  function rebuildMacros() {
    if (!refs.macrosBody) return;
    const existing = refs.macrosBody.querySelectorAll('.field');
    existing.forEach((el) => el.remove());
    const sid = bridge.engine.getCurrentSpecies()?.id ?? 'seed';
    for (const macro of PERFORMANCE_MACROS) {
      const val = bridge.macroValues[macro.id] ?? 50;
      const r = rangeField(`${macro.label} (${sid})`, `macro-${macro.id}`, 0, 100, 1, val, (v) => {
        applyMacro(bridge, macro.id, v, sid);
      });
      refs.macrosBody.appendChild(r.field);
    }
  }
  rebuildMacros();

  // --- Utilities ---
  root.appendChild(createSection('utilities', 'Utilities', (body) => {
    body.appendChild(buttonRow([
      { label: 'Reset engine', id: 'util-reset-engine', onClick: () => { bridge.resetEngine(); syncSlidersFromBridge(); callbacks.onStatus('Engine reset'); } },
      { label: 'Reset preset', id: 'util-reset-preset', onClick: () => { bridge.resetCurrentPreset(); syncSlidersFromBridge(); callbacks.onStatus('Preset reset'); } },
      { label: 'Randomize preset', id: 'util-rand-preset', onClick: () => { bridge.randomizePreset(); syncSlidersFromBridge(); callbacks.onStatus('Preset randomized'); } },
      { label: 'Randomize musical', id: 'util-rand-musical', onClick: () => { bridge.randomizeMusical(); syncSlidersFromBridge(); callbacks.onStatus('Musical state randomized'); } },
      { label: 'Randomize timbre', id: 'util-rand-timbre', onClick: () => { bridge.randomizeTimbre(); syncSlidersFromBridge(); callbacks.onStatus('Timbre randomized'); } },
      { label: 'Panic', id: 'util-panic', className: 'danger', onClick: () => { bridge.panic(); callbacks.onStatus('Panic'); } },
    ]));
    body.appendChild(buttonRow([
      { label: 'Export JSON', id: 'util-export', onClick: () => { navigator.clipboard.writeText(JSON.stringify(bridge.exportConfiguration(), null, 2)); callbacks.onStatus('Configuration copied'); } },
      { label: 'Import JSON', id: 'util-import', onClick: () => {
        const raw = prompt('Paste configuration JSON:');
        if (raw) { bridge.importConfiguration(raw); syncSlidersFromBridge(); callbacks.onStatus('Configuration imported'); }
      }},
      { label: 'Copy state', id: 'util-copy-state', onClick: () => { navigator.clipboard.writeText(JSON.stringify(bridge.getDebugState(), null, 2)); callbacks.onStatus('Engine state copied'); } },
    ]));
    const importArea = document.createElement('textarea');
    importArea.placeholder = 'Paste preset or configuration JSON…';
    importArea.id = 'import-json-area';
    body.appendChild(importArea);
  }));

  // --- Legacy (v1) ---
  // ROADMAP decision 13: the v1 preset graph stays wired in the demo, grouped
  // here so a visitor can see which half of the engine to build on.
  root.appendChild(groupHeading('Legacy (v1), removed at 2.0', 'Root export only, deprecated: playPreset(), updateParameter(), applyBotanicalControls(), setMold(). Audible through Play Preset Chord. New hosts build on the sections above (plantasia-sound-engine/public).'));

  root.appendChild(createSection('timbre', 'Timbre', (body) => {
    refs.sliders = refs.sliders ?? {};
    body.appendChild(hint('v2 path: FM→ecology.bacteria, mod speed→botanical.life, stereo→ecology.roots, resonance→botanical.resonance. v1 path (Play Preset Chord): filter/attack/release/oscillator via updateParameter().'));

    const timbreWired = [
      ['filterCutoff', 'Filter cutoff (Hz)', 150, 9000, 10, { v1Only: true }],
      ['resonance', 'Resonance → botanical.resonance', 0, 100, 1, {}],
      ['attack', 'Attack', 0.01, 2, 0.01, { v1Only: true }],
      ['release', 'Release', 0.1, 4, 0.05, { v1Only: true }],
      ['fmAmount', 'FM amount → ecology.bacteria', 0, 100, 1, {}],
      ['modSpeed', 'Mod speed → botanical.life', 0, 100, 1, {}],
      ['stereoSpread', 'Stereo spread → ecology.roots', 0, 100, 1, {}],
    ];
    for (const [id, label, min, max, step, opts] of timbreWired) {
      const r = rangeField(label, `timbre-${id}`, min, max, step, bridge.timbre[id], (v) => {
        bridge.timbre[id] = v;
        bridge.applyTimbreControls();
      }, opts);
      refs.sliders['timbre_' + id] = { input: r.input, out: r.out, getValue: () => bridge.timbre[id] };
      body.appendChild(r.field);
    }

    const osc = selectField('Oscillator', 'osc-type', [
      { value: 'sine', label: 'Sine' },
      { value: 'triangle', label: 'Triangle' },
      { value: 'sawtooth', label: 'Sawtooth' },
      { value: 'square', label: 'Square' },
    ], 'sawtooth', (v) => { if (bridge.audioStarted) bridge.engine.updateParameter('oscillator', v); }, { v1Only: true });
    body.appendChild(osc.field);
  }));

  root.appendChild(createSection('effects', 'Effects', (body) => {
    body.appendChild(hint('Reverb/delay: v1 updateParameter + botanical.space. Distortion: engine.setMold(). Species FX chains have no per-effect host API.'));
    const effectList = [
      ['reverb', 'Reverb mix', {}],
      ['delay', 'Delay mix', {}],
      ['distortion', 'Distortion → mold', {}],
    ];
    for (const [id, label, opts] of effectList) {
      const r = rangeField(label, `fx-${id}`, 0, 100, 1, bridge.effects[id] ?? 50, (v) => {
        bridge.effects[id] = v;
        bridge.applyEffectsControls();
      }, opts);
      body.appendChild(r.field);
    }
  }));

  root.appendChild(createSection('botanical', 'Botanical Controls (v1)', (body) => {
    body.appendChild(hint('engine.applyBotanicalControls() — v1 audio graph. Audible on Play Preset Chord. Mold also syncs ecology.mold.'));
    for (const key of ['energy', 'growth', 'density', 'evolution', 'random', 'life', 'space', 'texture', 'harmony', 'resonance', 'mold']) {
      const r = rangeField(key, `bot-${key}`, 0, 100, 1, bridge.botanical[key], (v) => {
        if (key === 'mold') bridge.setMold(v);
        else bridge.setBotanical(key, v);
      });
      body.appendChild(r.field);
    }
  }));


  // --- Debug ---
  root.appendChild(createSection('debug', 'Debug Panel', (body) => {
    refs.debugLog = document.createElement('div');
    refs.debugLog.id = 'debug-log';
    body.appendChild(refs.debugLog);
    refs.validationEl = document.createElement('div');
    body.appendChild(refs.validationEl);
    body.appendChild(buttonRow([
      { label: 'Refresh', id: 'btn-debug-refresh', onClick: () => updateDebug() },
      { label: 'Validate', id: 'btn-debug-validate', onClick: () => { bridge.validate(); updateDebug(); } },
    ]));
  }));

  function updateDebug() {
    if (!refs.debugLog) return;
    const d = bridge.getDebugState();
    refs.debugLog.textContent = [
      `Audio: ${d.audioStarted ? 'unlocked' : 'LOCKED (click Start Audio)'}`,
      `Engine state: ${d.state}${d.generativeRunning ? ' + generative flag' : ''}`,
      `Preset: ${d.preset ?? 'none'} (${d.presetId})`,
      `Species: ${d.species ?? 'none'} (${d.speciesId ?? 'none'})`,
      `Ecology (0–1): ${d.ecologySummary}`,
      `Active notes: ${d.activeNotes.join(', ') || 'none'}`,
      `Transport: ${d.transport} @ ${d.bpm} BPM`,
      `Scheduler timers: ${d.timers}`,
      `MIDI: ${d.midiEnabled ? 'enabled' : 'disabled'} (${d.midiDevices} device(s) listed)`,
      `v1 level meter: ${d.audioStarted ? (d.level * 100).toFixed(0) + '%' : 'n/a'}`,
      `Recent events: ${bridge.eventLog.slice(0, 5).map((e) => e.type).join(', ') || 'none'}`,
    ].join('\n');

    if (refs.validationEl) {
      refs.validationEl.replaceChildren();
      for (const w of bridge.warnings) {
        const el = document.createElement('div');
        el.className = 'validation-item ' + (w.kind === 'error' ? 'error' : w.kind === 'warn' ? 'warn' : '');
        el.textContent = w.message;
        refs.validationEl.appendChild(el);
      }
    }
  }

  // Keyboard handlers
  window.addEventListener('keydown', (event) => {
    if (event.repeat || event.target.matches('input, textarea, select')) return;
    const kbEnable = document.getElementById('kb-enable');
    if (kbEnable && !kbEnable.checked) return;
    const mapping = KEY_MAP[event.key.toLowerCase()];
    if (!mapping) return;
    event.preventDefault();
    if (!bridge.audioStarted) {
      callbacks.onStatus('Start Audio before playing keys', 'error');
      return;
    }

    const ensureRunning = async () => {
      if (bridge.engine.getState() !== 'running') {
        try {
          await bridge.startGenerative();
          callbacks.onStatus('Auto-started generative for keyboard');
        } catch (error) {
          callbacks.onStatus(`Keyboard blocked: ${error.message}`, 'error');
          throw error;
        }
      }
    };

    void ensureRunning().then(() => {
      if (!heldKeys.has(mapping.note)) {
        heldKeys.add(mapping.note);
        try {
          bridge.noteOn(mapping.note, mapping.velocity);
        } catch (error) {
          callbacks.onStatus(`noteOn failed: ${error.message}`, 'error');
          heldKeys.delete(mapping.note);
          return;
        }
        const keyEl = refs.kbDisplay?.querySelector(`[data-key="${event.key.toLowerCase()}"]`);
        keyEl?.classList.add('down');
        if (refs.midiMonitor) refs.midiMonitor.textContent = `Note on ${mapping.note} vel ${mapping.velocity.toFixed(2)}`;
      }
    });
  });

  window.addEventListener('keyup', (event) => {
    const mapping = KEY_MAP[event.key.toLowerCase()];
    if (!mapping) return;
    heldKeys.delete(mapping.note);
    bridge.noteOff(mapping.note);
    refs.kbDisplay?.querySelector(`[data-key="${event.key.toLowerCase()}"]`)?.classList.remove('down');
  });


  // --- Playing (ROADMAP decisions on simplicity, 8 and 10) ---
  // The seven a player feels, at the top: species, five sliders, keys, a wheel, save and recall.
  const SNAPSHOT_KEY = 'plantasia-demo-snapshots';
  const readSnapshots = () => { try { return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? '[]'); } catch { return []; } };
  const writeSnapshots = (list) => localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list));

  function syncFromEngine() {
    const engine = bridge.engine;
    for (const c of ['growth', 'bloom', 'roots', 'mold', 'bacteria']) {
      const v = engine.getControl(c);
      bridge.ecology[c] = v;
      const input = document.getElementById(`eco-${c}`);
      const out = document.getElementById(`eco-${c}-out`);
      if (input) input.value = String(Math.round(v * 100));
      if (out) out.textContent = String(Math.round(v * 100));
    }
    const species = engine.getCurrentSpecies();
    if (species && refs.speciesSelect) refs.speciesSelect.value = species.id;
    refs.updateSpeciesMeta?.();
    rebuildLayers();
    rebuildMacros();
    bridge.generativeRunning = engine.getState() === 'running';
  }

  const wheelSection = createSection('wheel', 'Wheel', (body) => {
    body.appendChild(hint('One route, made once: CC1 to the filter cutoff through engine.modulate(). The slider feeds the engine through feedMidi(); a hardware wheel does the same through Enable MIDI below.'));
    let routed = false;
    const r = rangeField('Mod wheel (CC1)', 'wheel-cc1', 0, 127, 1, 0, (v) => {
      if (!bridge.audioStarted) return;
      if (!routed) {
        bridge.engine.modulate({ id: 'wheel', type: 'midi-cc', cc: 1 }, 'target:filterCutoffMult', -0.8);
        routed = true;
      }
      bridge.engine.feedMidi([0xb0, 1, Math.round(v)]);
    });
    body.appendChild(r.field);
  });

  const snapshotsSection = createSection('snapshots', 'Save and recall', (body) => {
    body.appendChild(hint('engine.getSnapshot() is the whole state as one JSON object: species, controls, tempo, routes, preferences, polyphony. applySnapshot() restores it, with a morph if you give it seconds. Saved in this browser only.'));
    const row = document.createElement('div');
    row.className = 'field';
    const name = document.createElement('input');
    name.type = 'text'; name.id = 'snap-name'; name.placeholder = 'name'; name.style.marginRight = '8px';
    const list = document.createElement('select');
    list.id = 'snap-list'; list.style.marginRight = '8px';
    const morph = document.createElement('input');
    morph.type = 'number'; morph.id = 'snap-morph'; morph.min = '0'; morph.max = '30'; morph.step = '0.5'; morph.value = '0'; morph.style.width = '64px';
    const morphLabel = document.createElement('label');
    morphLabel.htmlFor = 'snap-morph'; morphLabel.textContent = 'morph s '; morphLabel.style.marginRight = '8px';
    const json = document.createElement('textarea');
    json.id = 'snap-json'; json.rows = 4; json.spellcheck = false; json.style.width = '100%'; json.style.marginTop = '8px';
    const refreshList = () => {
      list.replaceChildren();
      for (const snap of readSnapshots()) list.appendChild(new Option(snap.name, snap.name));
    };
    refreshList();
    const status = (msg, kind) => callbacks.onStatus(msg, kind);
    row.append(name, list, morphLabel, morph);
    body.appendChild(row);
    body.appendChild(buttonRow([
      { label: 'Save', id: 'snap-save', onClick: () => {
        if (!bridge.audioStarted) { status('Start Audio first', 'error'); return; }
        try {
          const snapshot = bridge.engine.getSnapshot();
          const label = name.value.trim() || `${snapshot.speciesId} ${new Date().toLocaleTimeString()}`;
          const saved = readSnapshots().filter((s) => s.name !== label);
          saved.push({ name: label, snapshot });
          writeSnapshots(saved);
          refreshList();
          list.value = label;
          json.value = JSON.stringify(snapshot, null, 2);
          status(`Saved "${label}"`);
        } catch (error) { status(error.message, 'error'); }
      }},
      { label: 'Recall', id: 'snap-recall', onClick: async () => {
        if (!bridge.audioStarted) { status('Start Audio first', 'error'); return; }
        const entry = readSnapshots().find((s) => s.name === list.value);
        if (!entry) { status('Nothing saved', 'error'); return; }
        try {
          const morphSec = Number(morph.value) || 0;
          const done = bridge.engine.applySnapshot(entry.snapshot, morphSec > 0 ? { morphSec } : undefined);
          json.value = JSON.stringify(entry.snapshot, null, 2);
          status(morphSec > 0 ? `Morphing to "${entry.name}" over ${morphSec} s` : `Recalled "${entry.name}"`);
          syncFromEngine();
          await done;
          syncFromEngine();
        } catch (error) { status(error.message, 'error'); }
      }},
      { label: 'Delete', id: 'snap-delete', onClick: () => {
        writeSnapshots(readSnapshots().filter((s) => s.name !== list.value));
        refreshList();
      }},
      { label: 'Copy JSON', id: 'snap-copy', onClick: async () => {
        if (!bridge.audioStarted) { status('Start Audio first', 'error'); return; }
        try {
          json.value = JSON.stringify(bridge.engine.getSnapshot(), null, 2);
          await navigator.clipboard.writeText(json.value);
          status('Snapshot JSON copied');
        } catch { json.select(); }
      }},
      { label: 'Apply JSON', id: 'snap-apply', onClick: async () => {
        if (!bridge.audioStarted) { status('Start Audio first', 'error'); return; }
        try {
          await bridge.engine.applySnapshot(JSON.parse(json.value));
          syncFromEngine();
          status('Snapshot applied');
        } catch (error) { status(`${error.name}: ${error.message}`, 'error'); }
      }},
    ]));
    body.appendChild(json);
  });

  const playing = document.createElement('div');
  playing.id = 'playing';
  playing.appendChild(groupHeading('Playing', 'An instrument that plays itself and answers you. The seven methods a player feels: loadSpecies, start, noteOn and noteOff, setControl, modulate, applySnapshot. Everything below is depth.'));
  const byId = (id) => root.querySelector(`section[data-section-id="${id}"]`);
  for (const section of [byId('sound-worlds'), byId('ecology'), byId('keyboard'), wheelSection, snapshotsSection]) {
    if (section) playing.appendChild(section);
  }
  root.insertBefore(playing, root.firstChild);

  return {
    refs,
    rebuildLayers,
    rebuildMacros,
    refreshPresetMeta,
    syncSlidersFromBridge,
    updateDebug,
    updateSpeciesMeta: () => refs.updateSpeciesMeta?.(),
  };
}
