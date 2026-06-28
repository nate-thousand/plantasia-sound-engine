import * as Tone from 'tone';
import type { PlantasiaPreset, SynthSettings } from '../utils/types/presets.js';
import type { BotanicalControls } from '../utils/types/botanical.js';
import {
  playJunoFlowersPreset,
  setJunoModeActive,
  stopAllJunoVoices,
  applyJunoMold,
} from '../synths/junoFlowersAudio.js';
import {
  playPlantasonicPreset,
  setPlantasonicModeActive,
  setPlantasonicPerformance,
  stopAllPlantasonicVoices,
  applyPlantasonicMold,
} from '../synths/plantasonicAudio.js';
import {
  applyMold,
  createMoldNodes,
  getMoldValue,
  setActiveMoldProfile,
  wireMoldChain,
  type MoldHost,
} from '../mold/index.js';
import { getPresetMold } from '../presets/moldDefaults.js';
import { setRampParam, type RampParam } from '../utils/ramp.js';

/**
 * Botanical -> synthesis mapping. The UI only ever speaks in botanical terms;
 * this module is the single place that translates them into Tone.js parameters.
 *
 *   Energy   = oscillator intensity      Roots   = bass
 *   Growth   = envelope                  Leaves  = highs
 *   Density  = voices                    Bloom   = reverb
 *   Life     = modulation                Spores  = granular particles
 *   Space    = reverb size               Water   = delay
 *   Texture  = brightness/grain          Sunlight= brightness
 *   Harmony  = chord consonance          Wind    = LFO
 *   Resonance= filter resonance
 *   Mold     = living degradation macro (tape wear, mutation, corruption)
 */

/** Private master level — loudness is OS / browser controlled. */
const INTERNAL_MASTER_DB = -12;

type EngineNodes = {
  synth: Tone.PolySynth;
  filter: Tone.Filter;
  delay: Tone.FeedbackDelay;
  reverb: Tone.Reverb;
  lfo: Tone.LFO;
  analyser: Tone.Analyser;
  meter: Tone.Meter;
  moldNodes: ReturnType<typeof createMoldNodes>;
};

let nodes: EngineNodes | null = null;
let started = false;
let lastSettings: SynthSettings | null = null;

const NOTE_POOL = ['C3', 'E3', 'G3', 'B3', 'D4', 'A3'];

function buildOscillatorSettings(
  settings: SynthSettings,
): { type: string; spread?: number; count?: number } {
  if (settings.detuneCents && settings.detuneCents.length > 1) {
    const spread = Math.max(...settings.detuneCents.map((c) => Math.abs(c)));
    const type =
      settings.oscillator === 'sawtooth' ? 'fatsawtooth' : settings.oscillator;
    return { type, spread, count: settings.detuneCents.length };
  }
  return { type: settings.oscillator };
}

function ensureNodes(): EngineNodes {
  if (nodes) {
    return nodes;
  }

  const analyser = new Tone.Analyser('waveform', 1024);
  const meter = new Tone.Meter();
  const reverb = new Tone.Reverb({ decay: 3, wet: 0.4 });
  const delay = new Tone.FeedbackDelay({ delayTime: 0.25, feedback: 0.3, wet: 0.2 });
  const filter = new Tone.Filter({ frequency: 1800, type: 'lowpass', Q: 1 });
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.2, decay: 0.2, sustain: 0.6, release: 1.5 },
  });
  const lfo = new Tone.LFO({ frequency: 0.3, min: 800, max: 2400 });
  const moldNodes = createMoldNodes();

  synth.connect(filter);
  wireMoldChain(filter, delay, moldNodes);
  delay.connect(reverb);
  reverb.toDestination();
  reverb.connect(analyser);
  reverb.connect(meter);
  lfo.connect(filter.frequency);
  lfo.start();

  nodes = { synth, filter, delay, reverb, lfo, analyser, meter, moldNodes };
  return nodes;
}

function moldHost(): MoldHost {
  const engine = ensureNodes();
  return {
    delay: engine.delay,
    filter: engine.filter,
    lfo: engine.lfo,
    started,
    moldNodes: engine.moldNodes,
  };
}

function isJunoPreset(preset: PlantasiaPreset): boolean {
  return preset.botanical != null;
}

function isPlantasonicPreset(preset: PlantasiaPreset): boolean {
  return preset.plantasonic != null;
}

export async function initAudio(): Promise<void> {
  ensureNodes();
  if (!started) {
    await Tone.start();
    started = true;
    console.info('[Plantasia audio] Tone.js context started');
  }
}

function applySettings(settings: SynthSettings): void {
  const engine = ensureNodes();
  lastSettings = settings;

  if (settings.filterType) {
    engine.filter.type = settings.filterType;
  }

  engine.synth.set({
    oscillator: buildOscillatorSettings(settings) as Tone.SynthOptions['oscillator'],
    envelope: { attack: settings.envelope.attack, release: settings.envelope.release },
  });

  setRampParam(started, engine.filter.frequency as unknown as RampParam, settings.filterHz);
  setRampParam(started, engine.filter.Q as unknown as RampParam, settings.filterQ ?? 1);
  setRampParam(started, engine.delay.wet as unknown as RampParam, settings.effects.delay);
  if (settings.effects.echo != null) {
    setRampParam(started, engine.delay.feedback as unknown as RampParam, settings.effects.echo);
  }
  setRampParam(started, engine.reverb.wet as unknown as RampParam, settings.effects.reverb);

  if (settings.drift != null) {
    setRampParam(started, engine.lfo.frequency as unknown as RampParam, 0.04 + settings.drift * 0.08);
    const hfCap = settings.hfRolloff ?? 8000;
    engine.lfo.min = Math.max(400, settings.filterHz * (0.6 - settings.drift * 0.1));
    engine.lfo.max = Math.min(hfCap, settings.filterHz * (1.2 + settings.drift * 0.4));
  } else {
    engine.lfo.min = 800;
    engine.lfo.max = 2400;
    setRampParam(started, engine.lfo.frequency as unknown as RampParam, 0.3);
  }
}

export function playPreset(preset: PlantasiaPreset): void {
  ensureNodes();
  setActiveMoldProfile(preset);

  if (isPlantasonicPreset(preset)) {
    if (!started) {
      console.info('[Plantasia audio] preset staged (awaiting user gesture)', preset.name);
      return;
    }
    const engine = ensureNodes();
    engine.synth.volume.value = -100;
    setJunoModeActive(false);
    void playPlantasonicPreset(preset);
    applyMold(moldHost(), getPresetMold(preset));
    return;
  }

  if (isJunoPreset(preset)) {
    if (!started) {
      console.info('[Plantasia audio] preset staged (awaiting user gesture)', preset.name);
      return;
    }
    const engine = ensureNodes();
    engine.synth.volume.value = -100;
    setPlantasonicModeActive(false);
    void playJunoFlowersPreset(preset);
    applyMold(moldHost(), getPresetMold(preset));
    return;
  }

  setJunoModeActive(false);
  setPlantasonicModeActive(false);
  const engine = ensureNodes();
  engine.synth.volume.value = 0;
  applySettings(preset.synth);
  applyMold(moldHost(), getPresetMold(preset));
  if (!started) {
    console.info('[Plantasia audio] preset staged (awaiting user gesture)', preset.name);
    return;
  }
  engine.synth.triggerAttackRelease(['C3', 'G3', 'B3'], '2n');
}

export function stopAudio(): void {
  stopAllJunoVoices(true);
  stopAllPlantasonicVoices(true);
  setJunoModeActive(false);
  setPlantasonicModeActive(false);
  if (!nodes) {
    return;
  }
  nodes.synth.volume.value = 0;
  nodes.synth.releaseAll();
  console.info('[Plantasia audio] released all voices');
}

/**
 * Maps the live botanical controls onto the underlying synth graph. Called
 * whenever a circular control changes so audio tracks the organism.
 */
export function applyBotanicalControls(controls: BotanicalControls): void {
  const engine = ensureNodes();
  const brightness = 600 + (controls.texture / 100) * 6000;
  setRampParam(started, engine.filter.frequency as unknown as RampParam, brightness, 0.15);
  setRampParam(started, engine.filter.Q as unknown as RampParam, 0.5 + (controls.resonance / 100) * 12, 0.15);
  setRampParam(started, engine.delay.wet as unknown as RampParam, (controls.space / 100) * 0.6);
  setRampParam(started, engine.reverb.wet as unknown as RampParam, (controls.space / 100) * 0.7);
  setRampParam(started, engine.lfo.frequency as unknown as RampParam, 0.05 + (controls.life / 100) * 4);
  engine.synth.set({
    volume: INTERNAL_MASTER_DB,
    envelope: {
      attack: 0.02 + (1 - controls.growth / 100) * 0.6,
      release: 0.6 + (controls.growth / 100) * 3,
    },
  });

  applyMold(moldHost(), controls.mold);
  applyJunoMold(controls.mold);
  applyPlantasonicMold(controls.mold);
}

/** Set Mold macro (0–100). Drives simultaneous degradation processes. */
export function setMold(mold: number): void {
  applyMold(moldHost(), mold);
  applyJunoMold(mold);
  applyPlantasonicMold(mold);
}

export { getMoldValue };

export function triggerChord(notes: string[] = NOTE_POOL.slice(0, 3)): void {
  const engine = ensureNodes();
  if (!started) {
    return;
  }
  engine.synth.triggerAttackRelease(notes, '4n');
}

export function setTempo(bpm: number): void {
  const transport = Tone.getTransport();
  if (started) {
    transport.bpm.rampTo(bpm, 0.3);
  } else {
    transport.bpm.value = bpm;
  }
}

export function getWaveform(): Float32Array {
  const engine = ensureNodes();
  const value = engine.analyser.getValue();
  return value instanceof Float32Array ? value : new Float32Array(0);
}

export function getLevel(): number {
  const engine = ensureNodes();
  const value = engine.meter.getValue();
  const db = typeof value === 'number' ? value : value[0] ?? -Infinity;
  if (!Number.isFinite(db)) {
    return 0;
  }
  return Math.min(1, Math.max(0, (db + 60) / 60));
}

export function updateParameter(
  parameter: keyof SynthSettings | string,
  value: string | number,
): void {
  if (!lastSettings) {
    console.info('[Plantasia audio] update parameter (no preset yet)', { parameter, value });
    return;
  }

  const next: SynthSettings = {
    ...lastSettings,
    envelope: { ...lastSettings.envelope },
    effects: { ...lastSettings.effects },
  };

  switch (parameter) {
    case 'oscillator':
      next.oscillator = value as SynthSettings['oscillator'];
      break;
    case 'filterHz':
      next.filterHz = Number(value);
      break;
    case 'attack':
      next.envelope.attack = Number(value);
      break;
    case 'release':
      next.envelope.release = Number(value);
      break;
    case 'delay':
      next.effects.delay = Number(value);
      break;
    case 'reverb':
      next.effects.reverb = Number(value);
      break;
    default:
      console.info('[Plantasia audio] update parameter', { parameter, value });
      return;
  }

  applySettings(next);
}

/** Default note pool used by triggerChord. */
export const defaultNotePool = NOTE_POOL;

/** Update Plantasonic live performance controllers (growth, aftertouch, expression). */
export { setPlantasonicPerformance };
