/**
 * Unified demo bridge over PlantasiaEngine — tracks UI state and routes
 * controls to v2 ecology, v1 botanical, mold, and synth parameters.
 */

import {
  PlantasiaEngine,
  getPresetsByCategory,
  getPresetById,
  getPresetControls,
  getPresetMold,
  resolvePresetId,
  resolvePresetToSpecies,
  presetControlsToEcology,
  ECOLOGICAL_CONTROLS,
  initialBotanicalControls,
  validatePreset,
} from 'plantasia-sound-engine';

const FAVORITES_KEY = 'plantasia-demo-favorites';
const TEMP_PRESET_KEY = 'plantasia-demo-temp-preset';

export class EngineBridge {
  constructor() {
    this.engine = new PlantasiaEngine({ includeFuture: true });
    this.audioStarted = false;
    this.generativeRunning = false;
    this.currentPresetId = this.engine.presets[0]?.id ?? 'seed';
    this.ecology = { growth: 0.42, bloom: 0.48, roots: 0.35, mold: 0.12, bacteria: 0.18 };
    this.botanical = { ...this.engine.initialBotanicalControls };
    this.macroValues = {};
    this.layerState = {};
    this.musical = {
      rootNote: 'C',
      scale: 'pentatonic',
      tuning: 'equal',
      octave: 4,
      tempo: 72,
      swing: 0,
      quantization: 16,
      phraseDensity: 50,
      noteProbability: 70,
      melodicComplexity: 40,
      rhythmicComplexity: 35,
      phraseLength: 8,
      randomness: 22,
      silenceAmount: 15,
    };
    this.generative = {
      phraseEvolution: 45,
      memory: 55,
      mutation: 30,
      surprise: 25,
      repetitionAvoidance: 60,
      transitionSpeed: 50,
      eventFrequency: 55,
      modulationEvolution: 40,
      ambientEvolution: 48,
    };
    this.effects = {
      reverb: 44,
      delay: 35,
      chorus: 30,
      saturation: 20,
      distortion: 0,
      compressor: 50,
      eqLow: 50,
      eqMid: 50,
      eqHigh: 50,
    };
    this.timbre = {
      filterCutoff: 1800,
      resonance: 46,
      attack: 0.2,
      decay: 0.3,
      sustain: 0.6,
      release: 1.5,
      detune: 12,
      fmAmount: 18,
      modDepth: 35,
      modSpeed: 30,
      harmonicRichness: 55,
      analogDrift: 30,
      stereoSpread: 50,
      grit: 0,
      instability: 12,
    };
    this.performanceMode = 'v2';
    this.eventLog = [];
    this.activeNotes = new Set();
    this.midiActivity = [];
    this.keyboardActivity = [];
    this.midiEnabled = false;
    this.lastError = null;
    this.warnings = [];
    this._unsubs = [];
  }

  get presets() {
    return this.engine.presets;
  }

  get categories() {
    return ['signature', 'soundWorlds', 'ambient', 'textures', 'drones', 'percussion', 'flora'];
  }

  getPreset(id) {
    return getPresetById(resolvePresetId(id));
  }

  getPresetsInCategory(category) {
    try {
      return getPresetsByCategory(category);
    } catch {
      return [];
    }
  }

  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  toggleFavorite(id) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.push(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return favs;
  }

  saveTempPreset() {
    const data = this.exportConfiguration();
    localStorage.setItem(TEMP_PRESET_KEY, JSON.stringify(data));
    return data;
  }

  loadTempPreset() {
    const raw = localStorage.getItem(TEMP_PRESET_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  logEvent(type, detail) {
    const entry = { t: Date.now(), type, detail };
    this.eventLog.unshift(entry);
    if (this.eventLog.length > 100) this.eventLog.pop();
    return entry;
  }

  subscribeEvents(onEvent) {
    const names = ['speciesChanged', 'notePlayed', 'controlChanged', 'generatorEvent', 'densityChanged'];
    for (const name of names) {
      const unsub = this.engine.on(name, (payload) => {
        onEvent(name, payload);
        this.logEvent(name, payload);
        if (name === 'notePlayed' && payload.note) {
          this.activeNotes.add(payload.note);
          setTimeout(() => this.activeNotes.delete(payload.note), 800);
        }
      });
      this._unsubs.push(unsub);
    }
  }

  async startAudio() {
    await this.engine.init();
    this.audioStarted = true;
    this.applyAllControls();
    return true;
  }

  async loadCurrentPreset(startGenerative = false) {
    const preset = this.getPreset(this.currentPresetId);
    if (!preset) throw new Error('Preset not found');

    const resolution = resolvePresetToSpecies(this.currentPresetId);
    this.ecology = { ...resolution.ecology };
    const controls = getPresetControls(preset);
    this.macroValues = { ...controls };
    this.botanical = {
      ...this.engine.initialBotanicalControls,
      mold: getPresetMold(preset),
      growth: controls.growthRate,
      texture: controls.texture,
      space: controls.bloom,
      energy: controls.energy,
      evolution: controls.drift,
      random: controls.mutation,
      harmony: controls.tone,
    };
    this.syncMusicalFromPreset(preset);
    this.syncTimbreFromPreset(preset);
    this.syncEffectsFromPreset(preset);

    await this.engine.loadPreset(this.currentPresetId);
    this.engine.applyBotanicalControls(this.botanical);
    this.engine.setMold(getPresetMold(preset));
    this.applyEcologyToEngine();

    if (startGenerative) {
      await this.engine.start();
      this.generativeRunning = true;
    }
    this.logEvent('presetLoaded', { id: preset.id, name: preset.name });
    return preset;
  }

  syncMusicalFromPreset(preset) {
    const resolution = resolvePresetToSpecies(preset.id);
    const speciesId = resolution.speciesId;
    const tempoMap = { seed: 72, flowers: 64, mold: 48, bacteria: 88 };
    this.musical.tempo = tempoMap[speciesId] ?? 72;
    this.engine.setTempo(this.musical.tempo);
  }

  syncTimbreFromPreset(preset) {
    const s = preset.synth;
    this.timbre.filterCutoff = s.filterHz;
    this.timbre.resonance = (s.filterQ ?? 1) * 20;
    this.timbre.attack = s.envelope.attack;
    this.timbre.release = s.envelope.release;
    this.timbre.analogDrift = (s.drift ?? 0.3) * 100;
    this.timbre.stereoSpread = (s.stereoWidth ?? 0.5) * 100;
    this.timbre.detune = s.detuneCents?.[0] ?? 12;
  }

  syncEffectsFromPreset(preset) {
    this.effects.reverb = preset.synth.effects.reverb * 100;
    this.effects.delay = preset.synth.effects.delay * 100;
    this.effects.chorus = (preset.synth.chorus ?? 0.3) * 100;
    this.effects.saturation = (preset.synth.saturation ?? 0.2) * 100;
  }

  applyEcologyToEngine() {
    for (const c of ECOLOGICAL_CONTROLS) {
      this.engine.setControl(c, this.ecology[c]);
    }
  }

  setEcology(control, value) {
    this.ecology[control] = Math.max(0, Math.min(1, value / 100));
    if (this.audioStarted) {
      this.engine.setControl(control, this.ecology[control]);
    }
  }

  setBotanical(key, value) {
    this.botanical[key] = value;
    if (this.audioStarted) {
      this.engine.applyBotanicalControls(this.botanical);
    }
  }

  setMold(value) {
    this.botanical.mold = value;
    if (this.audioStarted) {
      this.engine.setMold(value);
      this.setEcology('mold', value);
    }
  }

  applyAllControls() {
    this.engine.applyBotanicalControls(this.botanical);
    this.engine.setMold(this.botanical.mold);
    this.applyEcologyToEngine();
    this.applyMusicalControls();
    this.applyGenerativeControls();
    this.applyTimbreControls();
    this.applyEffectsControls();
  }

  applyMusicalControls() {
    this.engine.setTempo(this.musical.tempo);
    this.setBotanical('density', this.musical.phraseDensity);
    this.setBotanical('random', this.musical.randomness);
    this.setBotanical('harmony', 40 + this.musical.melodicComplexity * 0.6);
    this.setBotanical('evolution', this.musical.rhythmicComplexity);
  }

  applyGenerativeControls() {
    this.setBotanical('evolution', this.generative.phraseEvolution);
    this.setBotanical('random', this.generative.mutation);
    this.setBotanical('life', this.generative.eventFrequency);
    this.setBotanical('density', this.generative.eventFrequency);
    this.setEcology('growth', this.generative.phraseEvolution);
    this.setEcology('bacteria', this.generative.mutation);
    this.setEcology('bloom', this.generative.ambientEvolution);
  }

  applyTimbreControls() {
    if (!this.audioStarted) return;
    this.engine.updateParameter('filterHz', this.timbre.filterCutoff);
    this.engine.updateParameter('attack', this.timbre.attack);
    this.engine.updateParameter('release', this.timbre.release);
    this.setBotanical('texture', Math.min(100, this.timbre.filterCutoff / 80));
    this.setBotanical('resonance', this.timbre.resonance);
    this.setBotanical('life', this.timbre.modSpeed);
    this.setEcology('bacteria', this.timbre.fmAmount);
    this.setEcology('roots', this.timbre.stereoSpread);
  }

  applyEffectsControls() {
    if (!this.audioStarted) return;
    this.engine.updateParameter('reverb', this.effects.reverb / 100);
    this.engine.updateParameter('delay', this.effects.delay / 100);
    this.setBotanical('space', this.effects.reverb);
    if (this.effects.distortion > 0) {
      this.setMold(Math.max(this.botanical.mold, this.effects.distortion));
    }
  }

  async selectPreset(id, autoStart = false) {
    this.currentPresetId = resolvePresetId(id);
    if (this.audioStarted) {
      await this.loadCurrentPreset(autoStart && this.generativeRunning);
    }
  }

  presetIndex() {
    return this.presets.findIndex((p) => p.id === this.currentPresetId);
  }

  async prevPreset() {
    const idx = this.presetIndex();
    const next = this.presets[(idx - 1 + this.presets.length) % this.presets.length];
    await this.selectPreset(next.id, false);
    return next;
  }

  async nextPreset() {
    const idx = this.presetIndex();
    const next = this.presets[(idx + 1) % this.presets.length];
    await this.selectPreset(next.id, false);
    return next;
  }

  async randomPreset() {
    const next = this.presets[Math.floor(Math.random() * this.presets.length)];
    await this.selectPreset(next.id, false);
    return next;
  }

  playPresetChord() {
    const preset = this.getPreset(this.currentPresetId);
    if (preset) this.engine.playPreset(preset);
  }

  async startGenerative() {
    if (!this.audioStarted) throw new Error('Start audio first');
    await this.loadCurrentPreset(false);
    await this.engine.start();
    this.generativeRunning = true;
  }

  stopAll() {
    this.engine.stop();
    this.generativeRunning = false;
    this.activeNotes.clear();
  }

  stopGenerative() {
    this.engine.stopSpecies();
    this.generativeRunning = false;
  }

  panic() {
    this.engine.allNotesOff();
    this.engine.stop();
    this.generativeRunning = false;
    this.activeNotes.clear();
  }

  noteOn(note, velocity = 0.8) {
    if (!this.audioStarted) {
      throw new Error('Audio not started');
    }
    if (this.engine.getState() !== 'running') {
      throw new Error('Engine not running — start generative first');
    }
    this.engine.noteOn(note, velocity);
    this.activeNotes.add(note);
    this.keyboardActivity.unshift({ note, velocity, t: Date.now() });
    if (this.keyboardActivity.length > 20) this.keyboardActivity.pop();
  }

  noteOff(note) {
    if (this.engine.getState() === 'idle' || this.engine.getState() === 'disposed') {
      return;
    }
    this.engine.noteOff(note);
    this.activeNotes.delete(note);
  }

  triggerChord() {
    this.engine.triggerChord();
  }

  exportPresetJson() {
    const preset = this.getPreset(this.currentPresetId);
    return JSON.stringify(preset, null, 2);
  }

  exportConfiguration() {
    return {
      presetId: this.currentPresetId,
      ecology: { ...this.ecology },
      botanical: { ...this.botanical },
      musical: { ...this.musical },
      generative: { ...this.generative },
      timbre: { ...this.timbre },
      effects: { ...this.effects },
      macroValues: { ...this.macroValues },
      layerState: { ...this.layerState },
    };
  }

  importConfiguration(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (data.presetId) this.currentPresetId = data.presetId;
    if (data.ecology) this.ecology = { ...this.ecology, ...data.ecology };
    if (data.botanical) this.botanical = { ...this.botanical, ...data.botanical };
    if (data.musical) this.musical = { ...this.musical, ...data.musical };
    if (data.generative) this.generative = { ...this.generative, ...data.generative };
    if (data.timbre) this.timbre = { ...this.timbre, ...data.timbre };
    if (data.effects) this.effects = { ...this.effects, ...data.effects };
    if (data.macroValues) this.macroValues = { ...this.macroValues, ...data.macroValues };
    if (data.layerState) this.layerState = { ...this.layerState, ...data.layerState };
    if (this.audioStarted) {
      void this.loadCurrentPreset(this.generativeRunning);
      this.applyAllControls();
    }
    return data;
  }

  randomizePreset() {
    const preset = this.getPreset(this.currentPresetId);
    if (!preset) return;
    const controls = getPresetControls(preset);
    for (const key of Object.keys(controls)) {
      controls[key] = Math.floor(Math.random() * 100);
    }
    this.macroValues = controls;
    this.ecology = presetControlsToEcology(controls);
    if (this.audioStarted) {
      this.applyEcologyToEngine();
      this.engine.applyBotanicalControls({
        ...this.botanical,
        mold: controls.mold,
        growth: controls.growthRate,
        texture: controls.texture,
        space: controls.bloom,
        energy: controls.energy,
        evolution: controls.drift,
        random: controls.mutation,
        harmony: controls.tone,
      });
      this.engine.setMold(controls.mold);
    }
  }

  randomizeMusical() {
    for (const key of Object.keys(this.musical)) {
      if (typeof this.musical[key] === 'number') {
        this.musical[key] = Math.floor(Math.random() * 100);
      }
    }
    this.musical.tempo = 40 + Math.floor(Math.random() * 100);
    this.musical.octave = 2 + Math.floor(Math.random() * 4);
    this.applyMusicalControls();
  }

  randomizeTimbre() {
    for (const key of Object.keys(this.timbre)) {
      if (key === 'filterCutoff') this.timbre[key] = 200 + Math.random() * 8000;
      else if (key === 'attack' || key === 'release') this.timbre[key] = Math.random() * 2;
      else if (key === 'sustain') this.timbre[key] = Math.random();
      else this.timbre[key] = Math.floor(Math.random() * 100);
    }
    this.applyTimbreControls();
  }

  resetEngine() {
    this.ecology = { growth: 0.42, bloom: 0.48, roots: 0.35, mold: 0.12, bacteria: 0.18 };
    this.botanical = { ...initialBotanicalControls };
    this.stopAll();
    if (this.audioStarted) {
      void this.loadCurrentPreset(false);
    }
  }

  resetCurrentPreset() {
    const preset = this.getPreset(this.currentPresetId);
    if (!preset) return;
    const resolution = resolvePresetToSpecies(this.currentPresetId);
    this.ecology = { ...resolution.ecology };
    const controls = getPresetControls(preset);
    this.macroValues = { ...controls };
    if (this.audioStarted) {
      void this.loadCurrentPreset(this.generativeRunning);
    }
  }

  getDebugState() {
    const preset = this.getPreset(this.currentPresetId);
    const species = this.engine.getCurrentSpecies();
    const ecologySummary = ECOLOGICAL_CONTROLS.map((c) => `${c}:${this.ecology[c].toFixed(2)}`).join(' ');
    return {
      state: this.engine.getState(),
      preset: preset?.name ?? null,
      presetId: this.currentPresetId,
      species: species?.name ?? null,
      speciesId: species?.id ?? null,
      generativeRunning: this.generativeRunning,
      audioStarted: this.audioStarted,
      ecologySummary,
      activeNotes: [...this.activeNotes],
      transport: this.engine.transport.getState(),
      bpm: this.engine.transport.getBpm(),
      timers: this.engine.scheduler.activeTimerCount,
      level: this.audioStarted ? this.engine.getLevel() : 0,
      midiEnabled: this.midiEnabled,
      midiDevices: this.engine.midi.devices.length,
      lastError: this.lastError,
    };
  }

  validate() {
    this.warnings = [];
    const preset = this.getPreset(this.currentPresetId);
    if (preset) {
      for (const issue of validatePreset(preset)) {
        this.warnings.push({ kind: 'warn', message: `[${issue.field}] ${issue.message}` });
      }
    }
    if (!this.audioStarted) {
      this.warnings.push({ kind: 'info', message: 'Audio locked — user gesture required (Start Audio)' });
    }
    if (this.audioStarted && this.engine.getState() !== 'running') {
      this.warnings.push({ kind: 'info', message: 'Species loaded but not running — Start Generative for noteOn/MIDI' });
    }
    this.warnings.push({ kind: 'info', message: 'Audio reactive mapping — not in engine (bindSensor scaffold)' });
    this.warnings.push({ kind: 'info', message: 'MIDI device selector — enableMidi uses first/default input only' });
    this.warnings.push({ kind: 'info', message: 'Waveform/level meters — v1 analyser; may not match v2 species output' });
    this.warnings.push({ kind: 'info', message: 'Botanical controls — v1 graph; use Play Preset Chord to hear' });
    return this.warnings;
  }
}

export const LAYER_DEFS = {
  seed: [
    { id: 'drone', label: 'Drone', ecology: 'roots' },
    { id: 'melody', label: 'Melody', ecology: 'growth' },
    { id: 'texture', label: 'Texture', ecology: 'bloom' },
    { id: 'gesture', label: 'Gesture', ecology: 'bacteria' },
  ],
  flowers: [
    { id: 'pulse', label: 'Pulse', ecology: 'bacteria' },
    { id: 'melody', label: 'Melody', ecology: 'growth' },
    { id: 'harmony', label: 'Harmony', ecology: 'bloom' },
    { id: 'texture', label: 'Texture', ecology: 'roots' },
    { id: 'ambience', label: 'Ambience', ecology: 'mold' },
  ],
  mold: [
    { id: 'drone', label: 'Drone', ecology: 'roots' },
    { id: 'harmonics', label: 'Harmonics', ecology: 'bloom' },
    { id: 'noise', label: 'Noise Bed', ecology: 'mold' },
    { id: 'glitch', label: 'Glitch', ecology: 'bacteria' },
  ],
  bacteria: [
    { id: 'grains', label: 'Grains', ecology: 'bacteria' },
    { id: 'impulse', label: 'Impulses', ecology: 'growth' },
    { id: 'ticks', label: 'Ticks', ecology: 'roots' },
    { id: 'noise', label: 'Noise', ecology: 'mold' },
  ],
};

export const PERFORMANCE_MACROS = [
  { id: 'bloom', label: 'Bloom' },
  { id: 'mold', label: 'Mold' },
  { id: 'air', label: 'Air' },
  { id: 'roots', label: 'Roots' },
  { id: 'growth', label: 'Growth' },
  { id: 'wind', label: 'Wind' },
  { id: 'rain', label: 'Rain' },
  { id: 'sunlight', label: 'Sunlight' },
  { id: 'drift', label: 'Drift' },
  { id: 'motion', label: 'Motion' },
  { id: 'harmony', label: 'Harmony' },
  { id: 'texture', label: 'Texture' },
];

/** Species-specific macro routing — each macro affects different controls per species. */
export function applyMacro(bridge, macroId, value, speciesId) {
  const v = value;
  const profiles = {
    seed: {
      bloom: () => { bridge.setEcology('bloom', v); bridge.setBotanical('space', v * 0.7); },
      mold: () => bridge.setMold(v),
      air: () => bridge.setBotanical('space', v),
      roots: () => bridge.setEcology('roots', v),
      growth: () => bridge.setEcology('growth', v),
      wind: () => bridge.setBotanical('evolution', v),
      rain: () => { bridge.setBotanical('space', v * 0.5); bridge.effects.delay = v; bridge.applyEffectsControls(); },
      sunlight: () => bridge.setBotanical('energy', v),
      drift: () => bridge.setBotanical('evolution', v * 0.6),
      motion: () => bridge.setBotanical('density', v),
      harmony: () => bridge.setBotanical('harmony', v),
      texture: () => bridge.setBotanical('texture', v),
    },
    flowers: {
      bloom: () => { bridge.setEcology('bloom', v); bridge.setBotanical('harmony', v * 0.8); },
      mold: () => bridge.setMold(v * 0.5),
      air: () => bridge.setBotanical('space', v * 1.2),
      roots: () => bridge.setEcology('roots', v * 0.4),
      growth: () => bridge.setEcology('growth', v * 1.1),
      wind: () => bridge.setBotanical('life', v),
      rain: () => bridge.setEcology('bloom', v * 0.6),
      sunlight: () => { bridge.setBotanical('energy', v); bridge.setBotanical('life', v * 0.7); },
      drift: () => bridge.setEcology('roots', v),
      motion: () => bridge.setEcology('bacteria', v),
      harmony: () => bridge.setBotanical('harmony', v * 1.3),
      texture: () => bridge.setBotanical('texture', v * 0.9),
    },
    mold: {
      bloom: () => bridge.setEcology('bloom', v * 0.5),
      mold: () => { bridge.setMold(v); bridge.setEcology('mold', v); },
      air: () => bridge.setBotanical('space', v * 0.3),
      roots: () => bridge.setEcology('roots', v * 1.2),
      growth: () => bridge.setEcology('growth', v * 0.4),
      wind: () => bridge.setBotanical('random', v),
      rain: () => bridge.setEcology('mold', v * 0.8),
      sunlight: () => bridge.setBotanical('energy', v * 0.3),
      drift: () => bridge.setEcology('mold', v),
      motion: () => bridge.setBotanical('evolution', v),
      harmony: () => bridge.setBotanical('harmony', v * 0.5),
      texture: () => { bridge.setBotanical('texture', v); bridge.setMold(v * 0.6); },
    },
    bacteria: {
      bloom: () => bridge.setEcology('bloom', v * 0.3),
      mold: () => bridge.setMold(v * 0.4),
      air: () => bridge.setBotanical('space', v * 0.2),
      roots: () => bridge.setEcology('roots', v * 0.6),
      growth: () => bridge.setEcology('growth', v * 0.8),
      wind: () => bridge.setBotanical('random', v * 1.5),
      rain: () => bridge.setEcology('bacteria', v),
      sunlight: () => bridge.setBotanical('life', v),
      drift: () => bridge.setEcology('bacteria', v),
      motion: () => { bridge.setEcology('bacteria', v); bridge.setBotanical('density', v); },
      harmony: () => bridge.setBotanical('harmony', v * 0.4),
      texture: () => bridge.setEcology('bacteria', v * 0.7),
    },
  };

  const profile = profiles[speciesId] ?? profiles.seed;
  const fn = profile[macroId];
  if (fn) fn();
  bridge.macroValues[macroId] = v;
}
