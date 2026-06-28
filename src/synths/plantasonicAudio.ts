import * as Tone from 'tone';
import type {
  PlantasonicConfig,
  PlantasonicEvolutionConfig,
} from '../utils/types/plantasonic.js';
import type { PlantasiaPreset } from '../utils/types/presets.js';
import { resolveMoldParameters } from '../mold/moldMacro.js';
import { applySignatureMold } from '../mold/applySignatureMold.js';

/** Fixed internal master level — loudness is OS / browser controlled. */
const INTERNAL_MASTER_LEVEL = 0.78;

/** Runtime performance state for Plantasonic MIDI mappings. */
export type PlantasonicPerformanceState = {
  growth: number;
  aftertouch: number;
  expression: number;
};

export type PlantasonicEnginePreset = {
  config: PlantasonicConfig;
  synth: PlantasiaPreset['synth'];
};

export const PLANTASONIC_SMOOTH = 0.05;

export const PLANTASONIC_EVOLUTION_STAGES = [
  'dormant',
  'sprout',
  'canopy',
  'bloom',
  'ecosystem',
] as const;

export const PLANTASONIC_EVOLUTION_THRESHOLDS_MS = [0, 600, 1800, 3800, 7000];

export const PLANTASONIC_STAGE_BLEND: Record<
  string,
  {
    filter: number;
    chorus: number;
    reverb: number;
    delay: number;
    stereo: number;
    harmonics: number;
    width: number;
  }
> = {
  dormant: { filter: 0.55, chorus: 0.12, reverb: 0.18, delay: 0.08, stereo: 0.3, harmonics: 0.15, width: 0.35 },
  sprout: { filter: 0.72, chorus: 0.28, reverb: 0.35, delay: 0.18, stereo: 0.48, harmonics: 0.32, width: 0.52 },
  canopy: { filter: 0.86, chorus: 0.48, reverb: 0.55, delay: 0.32, stereo: 0.65, harmonics: 0.52, width: 0.72 },
  bloom: { filter: 0.96, chorus: 0.72, reverb: 0.78, delay: 0.45, stereo: 0.85, harmonics: 0.78, width: 0.9 },
  ecosystem: { filter: 1, chorus: 0.88, reverb: 0.95, delay: 0.55, stereo: 1, harmonics: 0.92, width: 1 },
};

export function toPlantasonicEnginePreset(preset: PlantasiaPreset): PlantasonicEnginePreset {
  if (!preset.plantasonic) {
    throw new Error('Preset is missing plantasonic configuration');
  }
  return { config: preset.plantasonic, synth: preset.synth };
}

export function buildPlantasonicPerformanceState(): PlantasonicPerformanceState {
  return { growth: 0, aftertouch: 0, expression: 0.5 };
}

const shaperCurveCache = new Map<number, Float32Array>();

/** Warm tape-style saturation curve. */
export function getPlantasonicSaturationCurve(amount = 0.2): Float32Array {
  const cacheKey = Math.round(amount * 100);
  const cached = shaperCurveCache.get(cacheKey);
  if (cached) return cached;

  const drive = 1.1 + amount * 1.8;
  const curve = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) {
    const x = (i - 32768) / 32768;
    curve[i] = Math.tanh(x * drive) * 0.82 + x * 0.18;
  }
  shaperCurveCache.set(cacheKey, curve);
  return curve;
}

export function smoothRandTarget(): number {
  return 0.12 + Math.random() * 0.76;
}

export function getPlantasonicEvolutionStage(holdMs: number, speed = 1) {
  const t = holdMs * speed;
  let idx = 0;
  for (let i = PLANTASONIC_EVOLUTION_THRESHOLDS_MS.length - 1; i >= 0; i--) {
    if (t >= PLANTASONIC_EVOLUTION_THRESHOLDS_MS[i]) idx = i;
  }
  const name = PLANTASONIC_EVOLUTION_STAGES[idx];
  return { index: idx, name, blend: PLANTASONIC_STAGE_BLEND[name] };
}

/** Pink noise buffer for texture layer (1/f approximation). */
function createPinkNoiseBuffer(audioCtx: AudioContext, durationSec = 4): AudioBuffer {
  const length = Math.floor(audioCtx.sampleRate * durationSec);
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

export type PlantasonicGraph = {
  audioCtx: AudioContext;
  liveBus: GainNode;
  tapeSat: WaveShaperNode;
  filterA: BiquadFilterNode;
  filterB: BiquadFilterNode;
  chorusIn: GainNode;
  chorusDelayL: DelayNode;
  chorusDelayR: DelayNode;
  chorusLfo: OscillatorNode;
  chorusLfoGain: GainNode;
  chorusMerge: GainNode;
  fxDry: GainNode;
  fxDelay: DelayNode;
  fxDelayFb: GainNode;
  fxDelayWet: GainNode;
  hallIn: GainNode;
  hallDelay: DelayNode;
  hallFb: GainNode;
  hallDamp: BiquadFilterNode;
  hallWet: GainNode;
  compressor: DynamicsCompressorNode;
  widthPanner: StereoPannerNode;
  widthLfo: OscillatorNode;
  widthLfoGain: GainNode;
  textureGain: GainNode;
  textureSource: AudioBufferSourceNode | null;
  masterGain: GainNode;
};

/** Build the Plantasonic effects chain: saturation → chorus → delay → reverb → compression → width. */
export function createPlantasonicGraph(audioCtx: AudioContext): PlantasonicGraph {
  const liveBus = audioCtx.createGain();
  liveBus.gain.value = 1;

  const tapeSat = audioCtx.createWaveShaper();
  tapeSat.curve = getPlantasonicSaturationCurve() as Float32Array<ArrayBuffer>;
  tapeSat.oversample = '2x';

  const filterA = audioCtx.createBiquadFilter();
  filterA.type = 'lowpass';
  filterA.frequency.value = 1650;
  filterA.Q.value = 0.707;

  const filterB = audioCtx.createBiquadFilter();
  filterB.type = 'lowpass';
  filterB.frequency.value = 1650;
  filterB.Q.value = 0.707;

  const chorusIn = audioCtx.createGain();
  chorusIn.gain.value = 1;
  const chorusDelayL = audioCtx.createDelay(0.05);
  const chorusDelayR = audioCtx.createDelay(0.05);
  chorusDelayL.delayTime.value = 0.014;
  chorusDelayR.delayTime.value = 0.021;
  const chorusLfo = audioCtx.createOscillator();
  const chorusLfoGain = audioCtx.createGain();
  chorusLfo.type = 'sine';
  chorusLfo.frequency.value = 0.22;
  chorusLfoGain.gain.value = 0.004;
  chorusLfo.connect(chorusLfoGain);
  chorusLfoGain.connect(chorusDelayL.delayTime);
  chorusLfoGain.connect(chorusDelayR.delayTime);
  chorusLfo.start();
  const chorusMerge = audioCtx.createGain();
  chorusMerge.gain.value = 0;

  const fxDry = audioCtx.createGain();
  const fxDelay = audioCtx.createDelay(2);
  const fxDelayFb = audioCtx.createGain();
  const fxDelayWet = audioCtx.createGain();
  fxDry.gain.value = 1;
  fxDelay.delayTime.value = 0.28;
  fxDelayFb.gain.value = 0.12;
  fxDelayWet.gain.value = 0.14;

  const hallIn = audioCtx.createGain();
  const hallDelay = audioCtx.createDelay(3);
  const hallFb = audioCtx.createGain();
  const hallDamp = audioCtx.createBiquadFilter();
  const hallWet = audioCtx.createGain();
  hallDelay.delayTime.value = 0.62;
  hallFb.gain.value = 0.48;
  hallDamp.type = 'lowpass';
  hallDamp.frequency.value = 2800;
  hallWet.gain.value = 0.42;
  hallIn.gain.value = 0.65;

  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 6;
  compressor.ratio.value = 2.4;
  compressor.attack.value = 0.012;
  compressor.release.value = 0.18;

  const widthPanner = audioCtx.createStereoPanner();
  widthPanner.pan.value = 0;
  const widthLfo = audioCtx.createOscillator();
  const widthLfoGain = audioCtx.createGain();
  widthLfo.type = 'sine';
  widthLfo.frequency.value = 0.035;
  widthLfoGain.gain.value = 0;
  widthLfo.connect(widthLfoGain);
  widthLfoGain.connect(widthPanner.pan);
  widthLfo.start();

  const textureGain = audioCtx.createGain();
  textureGain.gain.value = 0;

  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;

  liveBus.connect(tapeSat);
  tapeSat.connect(filterA);
  filterA.connect(filterB);

  filterB.connect(chorusIn);
  chorusIn.connect(fxDry);
  chorusIn.connect(chorusDelayL);
  chorusIn.connect(chorusDelayR);
  chorusDelayL.connect(chorusMerge);
  chorusDelayR.connect(chorusMerge);

  filterB.connect(fxDelay);
  fxDelay.connect(fxDelayFb);
  fxDelayFb.connect(fxDelay);
  fxDelay.connect(fxDelayWet);

  fxDry.connect(hallIn);
  hallIn.connect(hallDelay);
  hallDelay.connect(hallDamp);
  hallDamp.connect(hallFb);
  hallFb.connect(hallDelay);
  hallDelay.connect(hallWet);

  fxDry.connect(widthPanner);
  fxDelayWet.connect(widthPanner);
  hallWet.connect(widthPanner);
  chorusMerge.connect(widthPanner);
  textureGain.connect(widthPanner);

  widthPanner.connect(compressor);
  compressor.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  return {
    audioCtx,
    liveBus,
    tapeSat,
    filterA,
    filterB,
    chorusIn,
    chorusDelayL,
    chorusDelayR,
    chorusLfo,
    chorusLfoGain,
    chorusMerge,
    fxDry,
    fxDelay,
    fxDelayFb,
    fxDelayWet,
    hallIn,
    hallDelay,
    hallFb,
    hallDamp,
    hallWet,
    compressor,
    widthPanner,
    widthLfo,
    widthLfoGain,
    textureGain,
    textureSource: null,
    masterGain,
  };
}

export function syncPlantasonicGraph(
  graph: PlantasonicGraph,
  preset: PlantasonicEnginePreset,
  performance: PlantasonicPerformanceState,
): void {
  const t = graph.audioCtx.currentTime;
  const smooth = PLANTASONIC_SMOOTH;
  const cfg = preset.config;
  const fx = cfg.effects;
  const mod = cfg.modulation;
  const perf = cfg.performance;
  const growth = performance.growth;
  const expression = performance.expression;

  graph.tapeSat.curve = getPlantasonicSaturationCurve(fx.saturation) as Float32Array<ArrayBuffer>;

  const filterOpen =
    cfg.filter.cutoffHz *
    (1 + growth * perf.growth.filterOpen + performance.aftertouch * perf.aftertouch.filterOpen);
  graph.filterA.frequency.setTargetAtTime(filterOpen, t, smooth);
  graph.filterB.frequency.setTargetAtTime(filterOpen, t, smooth);
  const q = Math.max(0.4, cfg.filter.resonance);
  graph.filterA.Q.setTargetAtTime(q, t, smooth);
  graph.filterB.Q.setTargetAtTime(q, t, smooth);

  const chorusDepth =
    fx.chorus.depth * (1 + growth * perf.growth.chorusDepth) * (0.85 + mod.stereoMovement * 0.3);
  graph.chorusMerge.gain.setTargetAtTime(chorusDepth * 0.38, t, smooth);
  graph.chorusLfo.frequency.setTargetAtTime(fx.chorus.rate, t, smooth);
  graph.chorusLfoGain.gain.setTargetAtTime(0.002 + fx.chorus.depth * 0.006, t, smooth);
  graph.chorusDelayL.delayTime.setTargetAtTime(0.01 + fx.chorus.width * 0.012, t, smooth);
  graph.chorusDelayR.delayTime.setTargetAtTime(0.016 + fx.chorus.width * 0.018, t, smooth);

  const delayMix = fx.delay.mix * (0.6 + expression * perf.expression.ambience * 0.5);
  graph.fxDelayWet.gain.setTargetAtTime(delayMix * 0.55, t, smooth);
  graph.fxDry.gain.setTargetAtTime(1 - delayMix * 0.18, t, smooth);
  graph.fxDelay.delayTime.setTargetAtTime(fx.delay.time, t, smooth);
  graph.fxDelayFb.gain.setTargetAtTime(Math.min(0.35, fx.delay.feedback), t, smooth);

  const reverbMix =
    fx.reverb.mix * (1 + growth * perf.growth.reverbAmount) * (0.7 + expression * 0.5);
  graph.hallWet.gain.setTargetAtTime(Math.min(0.72, reverbMix * 0.62), t, smooth);
  graph.hallIn.gain.setTargetAtTime(0.5 + fx.reverb.mix * 0.35, t, smooth);
  graph.hallDelay.delayTime.setTargetAtTime(0.4 + fx.reverb.size * 0.45, t, smooth);
  graph.hallDamp.frequency.setTargetAtTime(1200 + fx.reverb.size * 2200, t, smooth);
  graph.hallFb.gain.setTargetAtTime(0.28 + fx.reverb.decay * 0.04, t, smooth);

  graph.compressor.threshold.setTargetAtTime(fx.compression.threshold, t, smooth);
  graph.compressor.ratio.setTargetAtTime(fx.compression.ratio, t, smooth);

  const width =
    fx.stereoWidth * (1 + growth * perf.growth.stereoWidth) * (0.8 + expression * 0.35);
  graph.widthLfoGain.gain.setTargetAtTime(width * mod.stereoMovement * 0.42, t, smooth);
  graph.widthLfo.frequency.setTargetAtTime(mod.vlfRate, t, smooth);

  const tex = cfg.texture;
  const texLevel =
    tex.pinkNoise + tex.tapeHiss + tex.air + tex.ambience * (0.5 + expression * 0.5);
  graph.textureGain.gain.setTargetAtTime(texLevel * 0.35, t, smooth);
}

function startTextureLayer(graph: PlantasonicGraph, cfg: PlantasonicConfig): void {
  if (graph.textureSource) {
    try {
      graph.textureSource.stop();
    } catch {
      /* already stopped */
    }
  }
  const tex = cfg.texture;
  if (tex.pinkNoise + tex.tapeHiss + tex.air + tex.ambience < 0.01) return;

  const buffer = createPinkNoiseBuffer(graph.audioCtx);
  const source = graph.audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(graph.textureGain);
  source.start();
  graph.textureSource = source;
}

export type PlantasonicVoiceParams = {
  freq: number;
  velocityScale?: number;
};

export type PlantasonicLiveVoice = {
  voiceId: string;
  gainNode: GainNode;
  voiceFilterA: BiquadFilterNode;
  voiceFilterB: BiquadFilterNode;
  panNode: StereoPannerNode;
  delaySend: GainNode;
  reverbSend: GainNode;
  oscillators: AudioScheduledSourceNode[];
  driftLfo: OscillatorNode | null;
  ampLfo: OscillatorNode | null;
  release: number;
  imperfection: ReturnType<typeof initPlantasonicImperfection>;
  living: ReturnType<typeof initPlantasonicLiving>;
  evolution: {
    holdStartMs: number;
    stageIndex: number;
    stage: string;
    blend: (typeof PLANTASONIC_STAGE_BLEND)[string];
  };
  evolutionCfg: PlantasonicEvolutionConfig;
  preset: PlantasonicEnginePreset;
  performance: PlantasonicPerformanceState;
};

function initPlantasonicImperfection(preset: PlantasonicEnginePreset) {
  const osc = preset.config.oscillators;
  const drift = osc.drift;
  return {
    driftCentsA: (Math.random() - 0.5) * 8 * drift,
    driftCentsB: (Math.random() - 0.5) * 8 * drift,
    filterOffset: (Math.random() - 0.5) * 120 * drift,
    attackScale: 0.88 + Math.random() * 0.24,
    releaseScale: 0.92 + Math.random() * 0.16,
    panBase: (Math.random() - 0.5) * 0.38 * preset.config.effects.stereoWidth,
    phaseOffset: Math.random() * Math.PI * 2,
  };
}

function initPlantasonicLiving() {
  return {
    nextUpdateMs: 0,
    filterNorm: 0.5,
    panNorm: 0.5,
    detuneNorm: 0.5,
    chorusNorm: 0.5,
    reverbNorm: 0.5,
    ampNorm: 0.5,
    targets: {
      filter: smoothRandTarget(),
      pan: smoothRandTarget(),
      detune: smoothRandTarget(),
      chorus: smoothRandTarget(),
      reverb: smoothRandTarget(),
      amp: smoothRandTarget(),
    },
  };
}

export function createPlantasonicLiveVoice(options: {
  audioCtx: AudioContext;
  params: PlantasonicVoiceParams;
  preset: PlantasonicEnginePreset;
  performance: PlantasonicPerformanceState;
  startTime: number;
  voiceId: string;
  graph: PlantasonicGraph;
}): PlantasonicLiveVoice {
  const { audioCtx, params, preset, performance, startTime, voiceId, graph } = options;
  const cfg = preset.config;
  const osc = cfg.oscillators;
  const env = cfg.envelope;
  const mod = cfg.modulation;
  const imperfection = initPlantasonicImperfection(preset);
  const living = initPlantasonicLiving();
  const evolution = {
    holdStartMs: globalThis.performance.now(),
    stageIndex: 0,
    stage: 'dormant',
    blend: PLANTASONIC_STAGE_BLEND.dormant,
  };

  const velScale = params.velocityScale ?? 1;
  const velBright = 1 + velScale * cfg.performance.velocityBrightness * 0.35;
  const release = Math.min(env.release * imperfection.releaseScale, 5);

  const voiceFilterA = audioCtx.createBiquadFilter();
  voiceFilterA.type = 'lowpass';
  const voiceFilterB = audioCtx.createBiquadFilter();
  voiceFilterB.type = 'lowpass';

  const baseFilter =
    cfg.filter.cutoffHz * velBright +
    imperfection.filterOffset +
    performance.growth * cfg.performance.growth.filterOpen * 600;
  const cappedFilter = Math.min(preset.synth.hfRolloff ?? 5000, baseFilter);
  voiceFilterA.frequency.setValueAtTime(cappedFilter, startTime);
  voiceFilterB.frequency.setValueAtTime(cappedFilter, startTime);
  const q = Math.max(0.4, cfg.filter.resonance * (0.9 + Math.random() * 0.2));
  voiceFilterA.Q.setValueAtTime(q, startTime);
  voiceFilterB.Q.setValueAtTime(q, startTime);

  const voiceGain = audioCtx.createGain();
  const attack = env.attack * imperfection.attackScale;
  const peak = 0.22 * velScale;
  voiceGain.gain.setValueAtTime(0.0001, startTime);
  voiceGain.gain.exponentialRampToValueAtTime(peak, startTime + attack);
  voiceGain.gain.exponentialRampToValueAtTime(
    peak * env.sustain,
    startTime + attack + env.decay,
  );

  const panNode = audioCtx.createStereoPanner();
  panNode.pan.setValueAtTime(imperfection.panBase, startTime);

  const delaySend = audioCtx.createGain();
  delaySend.gain.value = cfg.effects.delay.mix * 0.35;
  const reverbSend = audioCtx.createGain();
  reverbSend.gain.value = cfg.effects.reverb.mix * 0.28;

  const voiceOscillators: AudioScheduledSourceNode[] = [];

  const oscA = audioCtx.createOscillator();
  oscA.type = 'sawtooth';
  oscA.frequency.setValueAtTime(params.freq, startTime);
  const detuneA = osc.detuneCents[0] + imperfection.driftCentsA;
  oscA.detune.setValueAtTime(detuneA, startTime);
  const oscAGain = audioCtx.createGain();
  oscAGain.gain.setValueAtTime(0.55, startTime);
  oscA.connect(oscAGain);
  oscAGain.connect(voiceGain);
  oscA.start(startTime);
  voiceOscillators.push(oscA);

  const oscB = audioCtx.createOscillator();
  oscB.type = 'triangle';
  oscB.frequency.setValueAtTime(params.freq, startTime);
  const detuneB = osc.detuneCents[1] + imperfection.driftCentsB;
  oscB.detune.setValueAtTime(detuneB, startTime);
  const oscBGain = audioCtx.createGain();
  oscBGain.gain.setValueAtTime(0.45, startTime);
  oscB.connect(oscBGain);
  oscBGain.connect(voiceGain);
  oscB.start(startTime);
  voiceOscillators.push(oscB);

  if (osc.subAmount > 0.04) {
    const sub = audioCtx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(params.freq * 0.5, startTime);
    const subGain = audioCtx.createGain();
    subGain.gain.setValueAtTime(osc.subAmount * 0.18 * velScale, startTime);
    sub.connect(subGain);
    subGain.connect(voiceGain);
    sub.start(startTime);
    voiceOscillators.push(sub);
  }

  let driftLfo: OscillatorNode | null = null;
  if (mod.pitchDrift > 0.05) {
    driftLfo = audioCtx.createOscillator();
    driftLfo.type = 'sine';
    driftLfo.frequency.setValueAtTime(mod.vlfRate * (0.8 + Math.random() * 0.4), startTime);
    const driftGain = audioCtx.createGain();
    driftGain.gain.setValueAtTime(mod.pitchDrift * 6, startTime);
    driftLfo.connect(driftGain);
    driftGain.connect(oscA.detune);
    driftGain.connect(oscB.detune);
    driftLfo.start(startTime);
  }

  let ampLfo: OscillatorNode | null = null;
  if (mod.amplitudeVariation > 0.05) {
    ampLfo = audioCtx.createOscillator();
    ampLfo.type = 'sine';
    ampLfo.frequency.setValueAtTime(mod.vlfRate * 0.6, startTime);
    const ampGain = audioCtx.createGain();
    ampGain.gain.setValueAtTime(mod.amplitudeVariation * 0.04, startTime);
    ampLfo.connect(ampGain);
    ampGain.connect(voiceGain.gain);
    ampLfo.start(startTime);
  }

  voiceGain.connect(voiceFilterA);
  voiceFilterA.connect(voiceFilterB);
  voiceFilterB.connect(panNode);
  panNode.connect(graph.liveBus);
  panNode.connect(delaySend);
  delaySend.connect(graph.fxDelay);
  panNode.connect(reverbSend);
  reverbSend.connect(graph.hallIn);

  return {
    voiceId,
    gainNode: voiceGain,
    voiceFilterA,
    voiceFilterB,
    panNode,
    delaySend,
    reverbSend,
    oscillators: voiceOscillators,
    driftLfo,
    ampLfo,
    release,
    imperfection,
    living,
    evolution,
    evolutionCfg: cfg.evolution,
    preset,
    performance,
  };
}

export function tickPlantasonicLivingVoice(voice: PlantasonicLiveVoice, audioCtx: AudioContext): void {
  const nowMs = performance.now();
  const holdMs = nowMs - voice.evolution.holdStartMs;
  const gs = getPlantasonicEvolutionStage(holdMs, voice.evolutionCfg.speed);
  voice.evolution.stageIndex = gs.index;
  voice.evolution.stage = gs.name;
  voice.evolution.blend = gs.blend;

  if (nowMs >= voice.living.nextUpdateMs) {
    voice.living.nextUpdateMs = nowMs + 2000 + Math.random() * 2800;
    voice.living.targets = {
      filter: smoothRandTarget(),
      pan: smoothRandTarget(),
      detune: smoothRandTarget(),
      chorus: smoothRandTarget(),
      reverb: smoothRandTarget(),
      amp: smoothRandTarget(),
    };
  }

  const ease = 0.015;
  const living = voice.living;
  living.filterNorm += (living.targets.filter - living.filterNorm) * ease;
  living.panNorm += (living.targets.pan - living.panNorm) * ease;
  living.detuneNorm += (living.targets.detune - living.detuneNorm) * ease;
  living.chorusNorm += (living.targets.chorus - living.chorusNorm) * ease;
  living.reverbNorm += (living.targets.reverb - living.reverbNorm) * ease;
  living.ampNorm += (living.targets.amp - living.ampNorm) * ease;

  const blend = voice.evolution.blend;
  const cfg = voice.preset.config;
  const evo = voice.evolutionCfg;
  const imp = voice.imperfection;
  const perf = voice.performance;
  const t = audioCtx.currentTime;
  const smooth = 0.09;

  const filterMul =
    blend.filter * evo.filterShift * (0.72 + living.filterNorm * 0.55) *
    (1 + perf.growth * cfg.performance.growth.filterOpen * 0.25);
  const baseF = cfg.filter.cutoffHz;
  const targetF = Math.min(
    voice.preset.synth.hfRolloff ?? 5000,
    baseF * filterMul + imp.filterOffset + living.filterNorm * 220,
  );
  voice.voiceFilterA.frequency.setTargetAtTime(targetF, t, smooth);
  voice.voiceFilterB.frequency.setTargetAtTime(targetF, t, smooth);

  const panDepth = cfg.modulation.stereoMovement * blend.stereo * evo.stereoWiden;
  const panTarget = imp.panBase + (living.panNorm - 0.5) * panDepth * 2.2;
  voice.panNode.pan.setTargetAtTime(panTarget, t, smooth);

  const detuneWander = (living.detuneNorm - 0.5) * 6 * cfg.oscillators.drift * evo.modVariation;
  voice.oscillators.forEach((osc, i) => {
    if ('detune' in osc) {
      try {
        const baseDetune = i === 0 ? cfg.oscillators.detuneCents[0] : cfg.oscillators.detuneCents[1];
        const impDrift = i === 0 ? imp.driftCentsA : imp.driftCentsB;
        (osc as OscillatorNode).detune.setTargetAtTime(
          baseDetune + impDrift + detuneWander,
          t,
          smooth,
        );
      } catch {
        /* stopped osc */
      }
    }
  });

  const revSend =
    (blend.reverb + living.reverbNorm * 0.22) * evo.reverbExpand * cfg.effects.reverb.mix;
  voice.reverbSend.gain.setTargetAtTime(Math.min(0.68, revSend * 0.42), t, smooth);

  const harmonicLift =
    (blend.harmonics + living.ampNorm * 0.28) * evo.harmonicBloom *
    (1 + perf.growth * cfg.performance.growth.harmonicRichness * 0.3);
  voice.gainNode.gain.setTargetAtTime(
    Math.min(0.32, voice.gainNode.gain.value + harmonicLift * 0.015),
    t,
    smooth,
  );
}

export function releasePlantasonicVoice(
  voice: PlantasonicLiveVoice,
  audioCtx: AudioContext,
  immediate = false,
): void {
  const t = audioCtx.currentTime;
  const rel = immediate ? 0.008 : voice.release;
  const stopAt = t + rel + 0.04;

  try {
    voice.gainNode.gain.cancelScheduledValues(t);
    voice.gainNode.gain.setValueAtTime(Math.max(voice.gainNode.gain.value, 0.0001), t);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + rel);
  } catch {
    /* ignore */
  }

  voice.oscillators.forEach((o) => {
    try {
      o.stop(stopAt);
    } catch {
      /* ignore */
    }
  });
  [voice.driftLfo, voice.ampLfo].forEach((lfo) => {
    if (lfo) {
      try {
        lfo.stop(stopAt);
      } catch {
        /* ignore */
      }
    }
  });
}

// ── Runtime: graph lifecycle, voice management, play/stop ──────────────────

let plantasonicGraph: PlantasonicGraph | null = null;
const plantasonicActiveVoices = new Map<string, PlantasonicLiveVoice>();
let plantasonicTickId: ReturnType<typeof setInterval> | null = null;
let plantasonicModeActive = false;
let plantasonicPerformance = buildPlantasonicPerformanceState();

export function isPlantasonicModeActive(): boolean {
  return plantasonicModeActive;
}

export async function ensurePlantasonicRuntime(): Promise<PlantasonicGraph> {
  await Tone.start();
  const audioCtx = Tone.getContext().rawContext as AudioContext;
  if (!plantasonicGraph) {
    plantasonicGraph = createPlantasonicGraph(audioCtx);
  }
  return plantasonicGraph;
}

export function setPlantasonicModeActive(active: boolean, _volume = INTERNAL_MASTER_LEVEL * 100): void {
  plantasonicModeActive = active;
  if (plantasonicGraph) {
    plantasonicGraph.masterGain.gain.value = active ? INTERNAL_MASTER_LEVEL : 0;
  }
}

/** Apply Mold macro degradation to the active Plantasonic graph. */
export function applyPlantasonicMold(mold: number): void {
  if (!plantasonicGraph) {
    return;
  }

  const params = resolveMoldParameters(mold);
  const t = plantasonicGraph.audioCtx.currentTime;
  const smooth = 0.045;

  applySignatureMold(
    {
      delayFeedback: (v) => plantasonicGraph!.fxDelayFb.gain.setTargetAtTime(v, t, smooth),
      delayTime: (v) => plantasonicGraph!.fxDelay.delayTime.setTargetAtTime(v, t, smooth),
      delayWet: (v) => plantasonicGraph!.fxDelayWet.gain.setTargetAtTime(v * 0.55, t, smooth),
      filterQ: (v) => {
        plantasonicGraph!.filterA.Q.setTargetAtTime(v, t, smooth);
        plantasonicGraph!.filterB.Q.setTargetAtTime(v, t, smooth);
      },
      chorusRate: (v) => plantasonicGraph!.chorusLfo.frequency.setTargetAtTime(v, t, smooth),
      stereoDepth: (v) => plantasonicGraph!.widthLfoGain.gain.setTargetAtTime(v * 0.42, t, smooth),
      stereoRate: (v) => plantasonicGraph!.widthLfo.frequency.setTargetAtTime(v, t, smooth),
      saturation: (v) => {
        plantasonicGraph!.tapeSat.curve = getPlantasonicSaturationCurve(v) as Float32Array<ArrayBuffer>;
      },
      texture: (v) => plantasonicGraph!.textureGain.gain.setTargetAtTime(v, t, smooth),
      reverbSend: (v) => plantasonicGraph!.hallWet.gain.setTargetAtTime(v * 0.62, t, smooth),
    },
    params,
  );
}

/** Update live performance controllers (mod wheel = growth, expression, aftertouch). */
export function setPlantasonicPerformance(state: Partial<PlantasonicPerformanceState>): void {
  plantasonicPerformance = { ...plantasonicPerformance, ...state };
  if (plantasonicGraph && plantasonicModeActive) {
    const preset = plantasonicActiveVoices.values().next().value?.preset;
    if (preset) {
      syncPlantasonicGraph(plantasonicGraph, preset, plantasonicPerformance);
    }
  }
}

function startPlantasonicTickLoop(): void {
  if (plantasonicTickId) return;
  plantasonicTickId = setInterval(() => {
    if (!plantasonicGraph || plantasonicActiveVoices.size === 0) {
      stopPlantasonicTickLoop();
      return;
    }
    plantasonicActiveVoices.forEach((voice) => {
      tickPlantasonicLivingVoice(voice, plantasonicGraph!.audioCtx);
    });
  }, 16);
}

function stopPlantasonicTickLoop(): void {
  if (plantasonicTickId) {
    clearInterval(plantasonicTickId);
    plantasonicTickId = null;
  }
}

export function stopAllPlantasonicVoices(immediate = false): void {
  if (!plantasonicGraph) return;
  plantasonicActiveVoices.forEach((voice) => {
    releasePlantasonicVoice(voice, plantasonicGraph!.audioCtx, immediate);
  });
  plantasonicActiveVoices.clear();
  stopPlantasonicTickLoop();
}

/** Play preset through the Plantasonic flagship graph. */
export async function playPlantasonicPreset(
  preset: PlantasiaPreset,
  notes: string[] = ['C3', 'G3', 'B3'],
): Promise<void> {
  const graph = await ensurePlantasonicRuntime();
  const enginePreset = toPlantasonicEnginePreset(preset);
  const performance = plantasonicPerformance;

  syncPlantasonicGraph(graph, enginePreset, performance);
  startTextureLayer(graph, enginePreset.config);
  setPlantasonicModeActive(true, 62);
  stopAllPlantasonicVoices(true);

  const audioCtx = graph.audioCtx;
  const startTime = audioCtx.currentTime;
  const holdSec = 3.5;

  notes.forEach((note, i) => {
    const freq = Tone.Frequency(note).toFrequency();
    const voice = createPlantasonicLiveVoice({
      audioCtx,
      params: { freq, velocityScale: 0.85 + Math.random() * 0.15 },
      preset: enginePreset,
      performance,
      startTime,
      voiceId: `plantasonic-${note}-${i}-${Date.now()}`,
      graph,
    });
    voice.evolution.holdStartMs = globalThis.performance.now();
    plantasonicActiveVoices.set(voice.voiceId, voice);

    window.setTimeout(() => {
      const active = plantasonicActiveVoices.get(voice.voiceId);
      if (active) {
        releasePlantasonicVoice(active, audioCtx);
        plantasonicActiveVoices.delete(voice.voiceId);
      }
    }, holdSec * 1000);
  });

  startPlantasonicTickLoop();
}
