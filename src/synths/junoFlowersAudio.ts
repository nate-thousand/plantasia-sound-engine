import * as Tone from 'tone';
import type { JunoBotanicalConfig, JunoGrowthConfig } from '../utils/types/junoFlowers.js';
import type { PlantasiaPreset, SynthSettings } from '../utils/types/presets.js';
import { resolveMoldParameters } from '../mold/moldMacro.js';
import { applySignatureMold } from '../mold/applySignatureMold.js';

/** Fixed internal master level — loudness is OS / browser controlled. */
const INTERNAL_MASTER_LEVEL = 0.78;

/** Internal synth state passed to syncBotanical (mirrors juno-flowers index.html). */
export type JunoSynthState = {
  bpm: number;
  volume: number;
  filterHz: number;
  filterType: string;
  filterQ: number;
  lfoRate: number;
  lfoAmount: number;
  lfoDest: string;
  delayMix: number;
  echoFeedback: number;
  reverbDepth: number;
};

export type JunoEnginePreset = {
  sound: SynthSettings & {
    waveform: string;
    filterFreq: number;
    filterType: string;
    attack: number;
    release: number;
    delay: number;
    echo: number;
    reverb: number;
    pan?: number | (() => number);
  };
  botanical: JunoBotanicalConfig;
  growth: JunoGrowthConfig;
};

export const JUNO_SYNTH_SMOOTH = 0.045;

export const JUNO_GROWTH_STAGES = [
  'seed',
  'sprout',
  'leaves',
  'bud',
  'bloom',
  'pollination',
] as const;

export const JUNO_GROWTH_THRESHOLDS_MS = [0, 400, 1200, 2500, 4500, 8000];

export const JUNO_STAGE_BLEND: Record<
  string,
  {
    filter: number;
    chorus: number;
    reverb: number;
    delay: number;
    stereo: number;
    sat: number;
    shimmer: number;
    visual: number;
  }
> = {
  seed: { filter: 0.5, chorus: 0, reverb: 0.08, delay: 0, stereo: 0.25, sat: 0.08, shimmer: 0, visual: 0.15 },
  sprout: { filter: 0.68, chorus: 0.18, reverb: 0.22, delay: 0.12, stereo: 0.42, sat: 0.18, shimmer: 0.12, visual: 0.35 },
  leaves: { filter: 0.82, chorus: 0.32, reverb: 0.42, delay: 0.28, stereo: 0.58, sat: 0.32, shimmer: 0.22, visual: 0.55 },
  bud: { filter: 0.92, chorus: 0.52, reverb: 0.62, delay: 0.42, stereo: 0.72, sat: 0.42, shimmer: 0.38, visual: 0.75 },
  bloom: { filter: 1, chorus: 0.82, reverb: 0.82, delay: 0.58, stereo: 0.95, sat: 0.52, shimmer: 0.58, visual: 1 },
  pollination: { filter: 0.98, chorus: 0.72, reverb: 0.95, delay: 0.72, stereo: 1, sat: 0.48, shimmer: 0.72, visual: 1.1 },
};

export function toJunoEnginePreset(preset: PlantasiaPreset): JunoEnginePreset {
  const s = preset.synth;
  return {
    sound: {
      ...s,
      waveform: s.oscillator,
      filterFreq: s.filterHz,
      filterType: s.filterType ?? 'lowpass',
      attack: s.envelope.attack,
      release: s.envelope.release,
      delay: s.effects.delay,
      echo: s.effects.echo ?? 0.22,
      reverb: s.effects.reverb,
      pan: () => (Math.random() - 0.5) * 0.35,
    },
    botanical: preset.botanical!,
    growth: preset.growth ?? {
      speed: 1,
      bloomIntensity: 1,
      movementAmount: 1,
      particleAmount: 1,
    },
  };
}

export function buildJunoSynthState(preset: PlantasiaPreset): JunoSynthState {
  const s = preset.synth;
  return {
    bpm: 90,
    volume: 60,
    filterHz: s.filterHz,
    filterType: s.filterType ?? 'lowpass',
    filterQ: s.filterQ ?? 2.4,
    lfoRate: 0.18,
    lfoAmount: 180,
    lfoDest: 'flowers',
    delayMix: s.effects.delay,
    echoFeedback: s.effects.echo ?? 0.22,
    reverbDepth: s.effects.reverb,
  };
}

const shaperCurveCache = new Map<number, Float32Array>();

export function getJunoShaperCurve(amount = 0.2): Float32Array {
  const cacheKey = Math.round(amount * 100);
  const cached = shaperCurveCache.get(cacheKey);
  if (cached) return cached;

  const drive = 1.2 + amount * 2.2;
  const curve = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) {
    const x = (i - 32768) / 32768;
    curve[i] = Math.tanh(x * drive) * 0.78 + x * 0.22;
  }
  shaperCurveCache.set(cacheKey, curve);
  return curve;
}

export function smoothRandTarget(): number {
  return 0.15 + Math.random() * 0.7;
}

export function getJunoGrowthStage(holdMs: number, growthSpeed = 1) {
  const t = holdMs * growthSpeed;
  let idx = 0;
  for (let i = JUNO_GROWTH_THRESHOLDS_MS.length - 1; i >= 0; i--) {
    if (t >= JUNO_GROWTH_THRESHOLDS_MS[i]) idx = i;
  }
  const name = JUNO_GROWTH_STAGES[idx];
  return { index: idx, name, blend: JUNO_STAGE_BLEND[name] };
}

export type JunoBotanicalGraph = {
  audioCtx: AudioContext;
  liveBus: GainNode;
  rootsShelf: BiquadFilterNode;
  photoShaper: WaveShaperNode;
  liveFilter: BiquadFilterNode;
  pollenIn: GainNode;
  pollenDelayL: DelayNode;
  pollenDelayR: DelayNode;
  pollenMerge: GainNode;
  fxDry: GainNode;
  fxDelay: DelayNode;
  fxDelayFb: GainNode;
  fxDelayWet: GainNode;
  morningMistIn: GainNode;
  morningMistDelay: DelayNode;
  morningMistFb: GainNode;
  morningMistDamp: BiquadFilterNode;
  morningMistWet: GainNode;
  windPan: StereoPannerNode;
  windLfo: OscillatorNode;
  windGain: GainNode;
  masterLimiter: DynamicsCompressorNode;
};

export function createJunoBotanicalGraph(audioCtx: AudioContext): JunoBotanicalGraph {
  const liveBus = audioCtx.createGain();
  liveBus.gain.value = 1;

  const rootsShelf = audioCtx.createBiquadFilter();
  rootsShelf.type = 'lowshelf';
  rootsShelf.frequency.value = 180;
  rootsShelf.gain.value = 0;

  const photoShaper = audioCtx.createWaveShaper();
  photoShaper.curve = getJunoShaperCurve() as Float32Array<ArrayBuffer>;
  photoShaper.oversample = '2x';

  const liveFilter = audioCtx.createBiquadFilter();
  liveFilter.type = 'lowpass';
  liveFilter.frequency.value = 1400;
  liveFilter.Q.value = 4;

  const pollenIn = audioCtx.createGain();
  pollenIn.gain.value = 1;
  const pollenDelayL = audioCtx.createDelay(0.05);
  const pollenDelayR = audioCtx.createDelay(0.05);
  pollenDelayL.delayTime.value = 0.012;
  pollenDelayR.delayTime.value = 0.018;
  const pollenMerge = audioCtx.createGain();
  pollenMerge.gain.value = 0;

  const fxDry = audioCtx.createGain();
  const fxDelay = audioCtx.createDelay(2);
  const fxDelayFb = audioCtx.createGain();
  const fxDelayWet = audioCtx.createGain();
  fxDry.gain.value = 1;
  fxDelayFb.gain.value = 0.25;
  fxDelayWet.gain.value = 0.2;

  const morningMistIn = audioCtx.createGain();
  const morningMistDelay = audioCtx.createDelay(1.2);
  const morningMistFb = audioCtx.createGain();
  const morningMistDamp = audioCtx.createBiquadFilter();
  const morningMistWet = audioCtx.createGain();
  morningMistDelay.delayTime.value = 0.38;
  morningMistFb.gain.value = 0.32;
  morningMistDamp.type = 'lowpass';
  morningMistDamp.frequency.value = 2200;
  morningMistWet.gain.value = 0.25;
  morningMistIn.gain.value = 0.55;

  const windPan = audioCtx.createStereoPanner();
  windPan.pan.value = 0;
  const windLfo = audioCtx.createOscillator();
  const windGain = audioCtx.createGain();
  windLfo.type = 'sine';
  windLfo.frequency.value = 0.07;
  windGain.gain.value = 0;
  windLfo.connect(windGain);
  windGain.connect(windPan.pan);
  windLfo.start();

  const masterLimiter = audioCtx.createDynamicsCompressor();
  masterLimiter.threshold.value = -4;
  masterLimiter.knee.value = 2;
  masterLimiter.ratio.value = 16;
  masterLimiter.attack.value = 0.003;
  masterLimiter.release.value = 0.12;

  liveBus.connect(rootsShelf);
  rootsShelf.connect(photoShaper);
  photoShaper.connect(liveFilter);

  liveFilter.connect(pollenIn);
  pollenIn.connect(fxDry);
  pollenIn.connect(pollenDelayL);
  pollenIn.connect(pollenDelayR);
  pollenDelayL.connect(pollenMerge);
  pollenDelayR.connect(pollenMerge);

  liveFilter.connect(fxDelay);
  fxDelay.connect(fxDelayFb);
  fxDelayFb.connect(fxDelay);
  fxDelay.connect(fxDelayWet);

  fxDry.connect(morningMistIn);
  morningMistIn.connect(morningMistDelay);
  morningMistDelay.connect(morningMistDamp);
  morningMistDamp.connect(morningMistFb);
  morningMistFb.connect(morningMistDelay);
  morningMistDelay.connect(morningMistWet);

  fxDry.connect(windPan);
  fxDelayWet.connect(windPan);
  morningMistWet.connect(windPan);
  pollenMerge.connect(windPan);

  return {
    audioCtx,
    liveBus,
    rootsShelf,
    photoShaper,
    liveFilter,
    pollenIn,
    pollenDelayL,
    pollenDelayR,
    pollenMerge,
    fxDry,
    fxDelay,
    fxDelayFb,
    fxDelayWet,
    morningMistIn,
    morningMistDelay,
    morningMistFb,
    morningMistDamp,
    morningMistWet,
    windPan,
    windLfo,
    windGain,
    masterLimiter,
  };
}

export function syncJunoBotanical(
  graph: JunoBotanicalGraph,
  synthState: JunoSynthState,
  preset: JunoEnginePreset,
): void {
  const t = graph.audioCtx.currentTime;
  const smooth = JUNO_SYNTH_SMOOTH;
  const bot = preset.botanical;
  const sound = preset.sound;

  graph.liveFilter.type = (synthState.filterType || sound.filterType || 'lowpass') as BiquadFilterType;
  graph.liveFilter.frequency.setTargetAtTime(synthState.filterHz, t, smooth);
  graph.liveFilter.Q.setTargetAtTime(sound.filterQ || synthState.filterQ || 4, t, smooth);

  const beatSec = 60 / (synthState.bpm || 90);
  graph.fxDelay.delayTime.setTargetAtTime(Math.max(0.04, beatSec * 0.375), t, smooth);

  const echoFb = Math.min(0.72, synthState.echoFeedback);
  graph.fxDelayFb.gain.setTargetAtTime(echoFb, t, smooth);

  const wet = Math.max(0, Math.min(1, synthState.delayMix));
  graph.fxDelayWet.gain.setTargetAtTime(wet * 0.58, t, smooth);
  graph.fxDry.gain.setTargetAtTime(1 - wet * 0.22, t, smooth);

  const mist = bot.morningMist;
  graph.morningMistWet.gain.setTargetAtTime(
    Math.min(0.55, mist.mix * 0.42 + synthState.reverbDepth * 0.22),
    t,
    smooth,
  );
  graph.morningMistIn.gain.setTargetAtTime(0.45 + mist.mix * 0.35, t, smooth);
  graph.morningMistDelay.delayTime.setTargetAtTime(mist.size || 0.38, t, smooth);
  graph.morningMistDamp.frequency.setTargetAtTime(800 + mist.damp * 3200, t, smooth);
  graph.morningMistFb.gain.setTargetAtTime(0.18 + mist.mix * 0.28, t, smooth);

  const roots = bot.roots;
  graph.rootsShelf.gain.setTargetAtTime(roots.shelfGain || 0, t, smooth);

  const pollen = bot.pollen;
  const chorusDepth = (pollen.chorusDepth || 0.3) * (pollen.width || 0.4);
  graph.pollenMerge.gain.setTargetAtTime(chorusDepth * 0.35, t, smooth);
  graph.pollenDelayL.delayTime.setTargetAtTime(0.008 + pollen.chorusRate * 0.02, t, smooth);
  graph.pollenDelayR.delayTime.setTargetAtTime(0.014 + pollen.chorusRate * 0.028, t, smooth);

  const photo = bot.photosynthesis;
  graph.photoShaper.curve = getJunoShaperCurve(photo.sat || 0.2) as Float32Array<ArrayBuffer>;

  const wind = bot.wind;
  graph.windLfo.frequency.setTargetAtTime(wind.rate || 0.07, t, smooth);
  graph.windGain.gain.setTargetAtTime((wind.depth || 0.25) * 0.45, t, smooth);
}

export type JunoVoiceParams = {
  freq: number;
  waveform: string;
  detuneCents?: number[];
  filterFreq: number;
  filterType?: string;
  velocityScale?: number;
};

export type JunoLiveVoice = {
  voiceId: string;
  gainNode: GainNode;
  voiceFilter: BiquadFilterNode;
  panNode: StereoPannerNode;
  delaySend: GainNode;
  reverbSend: GainNode;
  oscillators: AudioScheduledSourceNode[];
  lfo: OscillatorNode | null;
  release: number;
  imperfection: ReturnType<typeof initJunoVoiceImperfection>;
  living: ReturnType<typeof initJunoVoiceLiving>;
  growth: {
    holdStartMs: number;
    stageIndex: number;
    stage: string;
    blend: (typeof JUNO_STAGE_BLEND)[string];
  };
  growthCfg: JunoGrowthConfig;
  preset: JunoEnginePreset;
  botanical: JunoBotanicalConfig;
  sound: JunoEnginePreset['sound'];
};

function initJunoVoiceImperfection(preset: JunoEnginePreset) {
  const sound = preset.sound;
  const drift = sound.drift || 0.5;
  const width = sound.stereoWidth || 0.45;
  return {
    driftCents: (Math.random() - 0.5) * 10 * drift,
    filterOffset: (Math.random() - 0.5) * 140 * drift,
    attackScale: 0.86 + Math.random() * 0.28,
    releaseScale: 0.9 + Math.random() * 0.2,
    panBase: (Math.random() - 0.5) * 0.42 * width,
    phaseOffset: Math.random() * Math.PI * 2,
    chorusDepthVar: 0.65 + Math.random() * 0.7,
  };
}

function initJunoVoiceLiving() {
  return {
    nextUpdateMs: 0,
    filterNorm: 0.5,
    panNorm: 0.5,
    detuneNorm: 0.5,
    chorusNorm: 0.5,
    reverbNorm: 0.5,
    delayNorm: 0.5,
    brightNorm: 0.5,
    targets: {
      filter: smoothRandTarget(),
      pan: smoothRandTarget(),
      detune: smoothRandTarget(),
      chorus: smoothRandTarget(),
      reverb: smoothRandTarget(),
      delay: smoothRandTarget(),
      bright: smoothRandTarget(),
    },
  };
}

function createJunoVoiceSource(
  waveform: string,
  audioCtx: AudioContext,
): { source: OscillatorNode; isNoise: false } {
  const o = audioCtx.createOscillator();
  if (waveform === 'saw' || waveform === 'sawtooth') {
    o.type = 'sawtooth';
  } else {
    o.type = waveform as OscillatorType;
  }
  return { source: o, isNoise: false };
}

function getJunoLfoDepth(dest: string, amount: number): number {
  if (dest === 'filter') return amount;
  if (dest === 'pitch') return amount;
  if (dest === 'pan') return amount / 600;
  if (dest === 'volume') return amount / 400;
  return 0;
}

export function createJunoLiveVoice(options: {
  audioCtx: AudioContext;
  params: JunoVoiceParams;
  preset: JunoEnginePreset;
  startTime: number;
  voiceId: string;
  synthState: JunoSynthState;
  graph: JunoBotanicalGraph;
}): JunoLiveVoice {
  const { audioCtx, params, preset, startTime, voiceId, synthState, graph } = options;
  const sound = preset.sound;
  const bot = preset.botanical;
  const growthCfg = preset.growth;
  const imperfection = initJunoVoiceImperfection(preset);
  const living = initJunoVoiceLiving();
  const growth = {
    holdStartMs: performance.now(),
    stageIndex: 0,
    stage: 'seed',
    blend: JUNO_STAGE_BLEND.seed,
  };

  const velScale = params.velocityScale ?? 1;
  const release = Math.min(sound.release * imperfection.releaseScale, 4);

  const voiceFilter = audioCtx.createBiquadFilter();
  voiceFilter.type = (sound.filterType || 'lowpass') as BiquadFilterType;
  const baseFilter = params.filterFreq || synthState.filterHz;
  voiceFilter.frequency.setValueAtTime(
    Math.min(sound.hfRolloff || 8000, baseFilter + imperfection.filterOffset),
    startTime,
  );
  voiceFilter.Q.setValueAtTime((sound.filterQ || 4) * (0.85 + Math.random() * 0.3), startTime);

  const voiceGain = audioCtx.createGain();
  const peak = 0.24 * velScale * (0.92 + growthCfg.bloomIntensity * 0.08);
  voiceGain.gain.setValueAtTime(peak, startTime);

  const panNode = audioCtx.createStereoPanner();
  const panVal = typeof sound.pan === 'function' ? sound.pan() : (sound.pan ?? 0);
  panNode.pan.setValueAtTime(panVal + imperfection.panBase, startTime);

  const delaySend = audioCtx.createGain();
  delaySend.gain.value = 0.15;
  const reverbSend = audioCtx.createGain();
  reverbSend.gain.value = 0.12;

  const lfoRate = synthState.lfoRate;
  const lfoAmt = synthState.lfoAmount;
  const lfoDest = synthState.lfoDest;
  const lfoDepth = getJunoLfoDepth(lfoDest, lfoAmt);

  let voiceLfo: OscillatorNode | null = null;
  let voiceLfoGain: GainNode | null = null;
  const voiceOscillators: AudioScheduledSourceNode[] = [];

  if (lfoDepth > 0 && lfoDest !== 'filter' && lfoDest !== 'flowers') {
    voiceLfo = audioCtx.createOscillator();
    voiceLfo.type = 'sine';
    voiceLfo.frequency.setValueAtTime(lfoRate, startTime);
    voiceLfoGain = audioCtx.createGain();
    voiceLfoGain.gain.setValueAtTime(lfoDepth, startTime);
    voiceLfo.connect(voiceLfoGain);
    voiceLfo.start(startTime);
    if (lfoDest === 'volume') voiceLfoGain.connect(voiceGain.gain);
    if (lfoDest === 'pan') voiceLfoGain.connect(panNode.pan);
  }

  const wf = params.waveform;
  const cents = sound.detuneCents || params.detuneCents || [-5, 0, 5];
  const driftBase = imperfection.driftCents;

  cents.forEach((offset) => {
    const phaseDrift = (Math.random() - 0.5) * 4;
    const voice = createJunoVoiceSource(wf, audioCtx);
    voice.source.frequency.setValueAtTime(params.freq, startTime);
    const detuneVal = offset + driftBase + phaseDrift;
    if (lfoDepth > 0 && lfoDest === 'pitch' && voiceLfoGain) {
      voiceLfoGain.connect(voice.source.detune);
      voice.source.detune.setValueAtTime(detuneVal, startTime);
    } else {
      voice.source.detune.setValueAtTime(detuneVal, startTime);
    }
    voice.source.connect(voiceGain);
    voice.source.start(startTime);
    voiceOscillators.push(voice.source);
  });

  if ((sound.subAmount || bot.roots.sub || 0) > 0.05) {
    const subAmt = (sound.subAmount || 0) + (bot.roots.sub || 0);
    const sub = audioCtx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(params.freq * 0.5, startTime);
    const subGain = audioCtx.createGain();
    subGain.gain.setValueAtTime(subAmt * 0.22 * velScale, startTime);
    sub.connect(subGain);
    subGain.connect(voiceGain);
    sub.start(startTime);
    voiceOscillators.push(sub);
  }

  voiceGain.connect(voiceFilter);
  voiceFilter.connect(panNode);
  panNode.connect(graph.liveBus);
  panNode.connect(delaySend);
  delaySend.connect(graph.fxDelay);
  panNode.connect(reverbSend);
  reverbSend.connect(graph.morningMistIn);

  return {
    voiceId,
    gainNode: voiceGain,
    voiceFilter,
    panNode,
    delaySend,
    reverbSend,
    oscillators: voiceOscillators,
    lfo: voiceLfo,
    release,
    imperfection,
    living,
    growth,
    growthCfg,
    preset,
    botanical: bot,
    sound,
  };
}

export function tickJunoLivingVoice(voice: JunoLiveVoice, audioCtx: AudioContext): void {
  const nowMs = performance.now();
  const holdMs = nowMs - voice.growth.holdStartMs;
  const gs = getJunoGrowthStage(holdMs, voice.growthCfg.speed);
  voice.growth.stageIndex = gs.index;
  voice.growth.stage = gs.name;
  voice.growth.blend = gs.blend;

  if (nowMs >= voice.living.nextUpdateMs) {
    voice.living.nextUpdateMs = nowMs + 1800 + Math.random() * 2200;
    voice.living.targets = {
      filter: smoothRandTarget(),
      pan: smoothRandTarget(),
      detune: smoothRandTarget(),
      chorus: smoothRandTarget(),
      reverb: smoothRandTarget(),
      delay: smoothRandTarget(),
      bright: smoothRandTarget(),
    };
  }

  const ease = 0.018;
  const living = voice.living;
  living.filterNorm += (living.targets.filter - living.filterNorm) * ease;
  living.panNorm += (living.targets.pan - living.panNorm) * ease;
  living.detuneNorm += (living.targets.detune - living.detuneNorm) * ease;
  living.chorusNorm += (living.targets.chorus - living.chorusNorm) * ease;
  living.reverbNorm += (living.targets.reverb - living.reverbNorm) * ease;
  living.delayNorm += (living.targets.delay - living.delayNorm) * ease;
  living.brightNorm += (living.targets.bright - living.brightNorm) * ease;

  const blend = voice.growth.blend;
  const bot = voice.botanical;
  const sound = voice.sound;
  const imp = voice.imperfection;
  const t = audioCtx.currentTime;
  const smooth = 0.08;

  const filterMul = blend.filter * (0.7 + living.filterNorm * 0.6);
  const baseF = sound.filterFreq || 1400;
  const targetF = Math.min(
    sound.hfRolloff || 8000,
    baseF * filterMul + imp.filterOffset + living.filterNorm * 280,
  );
  voice.voiceFilter.frequency.setTargetAtTime(targetF, t, smooth);

  const panDepth = (bot.wind.depth || 0.25) * blend.stereo * voice.growthCfg.movementAmount;
  const panTarget = imp.panBase + (living.panNorm - 0.5) * panDepth * 2;
  voice.panNode.pan.setTargetAtTime(panTarget, t, smooth);

  const detuneWander = (living.detuneNorm - 0.5) * 8 * (sound.drift || 0.5);
  voice.oscillators.forEach((osc, i) => {
    if ('detune' in osc) {
      try {
        (osc as OscillatorNode).detune.setTargetAtTime(
          imp.driftCents + detuneWander + i * 0.5,
          t,
          smooth,
        );
      } catch {
        /* stopped osc */
      }
    }
  });

  const revSend = (blend.reverb + living.reverbNorm * 0.25) * (bot.morningMist.mix || 0.5);
  voice.reverbSend.gain.setTargetAtTime(Math.min(0.65, revSend * 0.35), t, smooth);

  const dlySend = (blend.delay + living.delayNorm * 0.2) * (sound.delay || 0.35);
  voice.delaySend.gain.setTargetAtTime(Math.min(0.55, dlySend * 0.4), t, smooth);

  const brightLift = (blend.shimmer + living.brightNorm * 0.3) * (bot.pollen.shimmer || 0.2);
  voice.gainNode.gain.setTargetAtTime(
    Math.min(0.38, voice.gainNode.gain.value + brightLift * 0.02),
    t,
    smooth,
  );
}

export function releaseJunoVoice(voice: JunoLiveVoice, audioCtx: AudioContext, immediate = false): void {
  const t = audioCtx.currentTime;
  const rel = immediate ? 0.008 : voice.release;
  const stopAt = t + rel + 0.02;

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
  if (voice.lfo) {
    try {
      voice.lfo.stop(stopAt);
    } catch {
      /* ignore */
    }
  }
}

// ── Runtime: graph lifecycle, voice management, play/stop ──────────────────

let junoGraph: JunoBotanicalGraph | null = null;
let junoMasterGain: GainNode | null = null;
const junoActiveVoices = new Map<string, JunoLiveVoice>();
let junoTickId: ReturnType<typeof setInterval> | null = null;
let junoModeActive = false;

export function isJunoModeActive(): boolean {
  return junoModeActive;
}

export async function ensureJunoRuntime(): Promise<JunoBotanicalGraph> {
  await Tone.start();
  const audioCtx = Tone.getContext().rawContext as AudioContext;
  if (!junoGraph) {
    junoGraph = createJunoBotanicalGraph(audioCtx);
    junoMasterGain = audioCtx.createGain();
    junoMasterGain.gain.value = 0;
    // Match wireBotanicalOutputs() in plantasia-engine.js — without this link the
    // Juno graph is fully silent (voices reach windPan but never hit destination).
    junoGraph.windPan.connect(junoGraph.masterLimiter);
    junoGraph.masterLimiter.connect(junoMasterGain);
    junoMasterGain.connect(audioCtx.destination);
  }
  return junoGraph;
}

export function setJunoModeActive(active: boolean, _volume = INTERNAL_MASTER_LEVEL * 100): void {
  junoModeActive = active;
  if (junoMasterGain) {
    junoMasterGain.gain.value = active ? INTERNAL_MASTER_LEVEL : 0;
  }
}

/** Apply Mold macro degradation to the active Juno Flowers graph. */
export function applyJunoMold(mold: number): void {
  if (!junoGraph) {
    return;
  }

  const params = resolveMoldParameters(mold);
  const t = junoGraph.audioCtx.currentTime;
  const smooth = JUNO_SYNTH_SMOOTH;

  applySignatureMold(
    {
      delayFeedback: (v) => junoGraph!.fxDelayFb.gain.setTargetAtTime(v, t, smooth),
      delayTime: (v) => junoGraph!.fxDelay.delayTime.setTargetAtTime(v, t, smooth),
      filterQ: (v) => junoGraph!.liveFilter.Q.setTargetAtTime(v, t, smooth),
      stereoDepth: (v) => junoGraph!.windGain.gain.setTargetAtTime(v * 0.45, t, smooth),
      stereoRate: (v) => junoGraph!.windLfo.frequency.setTargetAtTime(v, t, smooth),
      saturation: (v) => {
        junoGraph!.photoShaper.curve = getJunoShaperCurve(v) as Float32Array<ArrayBuffer>;
      },
      reverbSend: (v) => junoGraph!.morningMistWet.gain.setTargetAtTime(v * 0.55, t, smooth),
    },
    params,
  );
}

function startJunoTickLoop(): void {
  if (junoTickId) return;
  junoTickId = setInterval(() => {
    if (!junoGraph || junoActiveVoices.size === 0) {
      stopJunoTickLoop();
      return;
    }
    junoActiveVoices.forEach((voice) => {
      tickJunoLivingVoice(voice, junoGraph!.audioCtx);
    });
  }, 16);
}

function stopJunoTickLoop(): void {
  if (junoTickId) {
    clearInterval(junoTickId);
    junoTickId = null;
  }
}

export function stopAllJunoVoices(immediate = false): void {
  if (!junoGraph) return;
  junoActiveVoices.forEach((voice) => {
    releaseJunoVoice(voice, junoGraph!.audioCtx, immediate);
  });
  junoActiveVoices.clear();
  stopJunoTickLoop();
}

/** Play preset through the full Juno Flowers botanical graph (original engine path). */
export async function playJunoFlowersPreset(
  preset: PlantasiaPreset,
  notes: string[] = ['C3', 'G3', 'B3'],
): Promise<void> {
  const graph = await ensureJunoRuntime();
  const enginePreset = toJunoEnginePreset(preset);
  const synthState = buildJunoSynthState(preset);

  syncJunoBotanical(graph, synthState, enginePreset);
  setJunoModeActive(true, synthState.volume);
  stopAllJunoVoices(true);

  const audioCtx = graph.audioCtx;
  const startTime = audioCtx.currentTime;
  const beatSec = 60 / synthState.bpm;
  const holdSec = beatSec * 2;

  notes.forEach((note, i) => {
    const freq = Tone.Frequency(note).toFrequency();
    const voice = createJunoLiveVoice({
      audioCtx,
      params: {
        freq,
        waveform: enginePreset.sound.waveform,
        detuneCents: enginePreset.sound.detuneCents,
        filterFreq: synthState.filterHz,
        filterType: synthState.filterType,
        velocityScale: 1,
      },
      preset: enginePreset,
      startTime,
      voiceId: `juno-${note}-${i}-${Date.now()}`,
      synthState,
      graph,
    });
    junoActiveVoices.set(voice.voiceId, voice);

    window.setTimeout(() => {
      const active = junoActiveVoices.get(voice.voiceId);
      if (active) {
        releaseJunoVoice(active, audioCtx);
        junoActiveVoices.delete(voice.voiceId);
      }
    }, holdSec * 1000);
  });

  startJunoTickLoop();
}
