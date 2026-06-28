import * as Tone from 'tone';
import { setRampParam, type RampParam } from '../../utils/ramp.js';
import { MOLD_DRONE_RELEASE } from './synth.js';

/** Tone.js rejects LFO output when min === max. */
const LFO_MIN_SPAN = 1e-6;

function lfoSpan(depth: number): { min: number; max: number } {
  const span = Math.max(Math.abs(depth), LFO_MIN_SPAN);
  return { min: -span, max: span };
}

/**
 * Mold effects — degradation is the species identity.
 *
 * Chain: band-pass → tape → soft distortion → bit crush → comb → micro delay
 *        → feedback delay → vibrato (wow/flutter) → long reverb → stereo drift
 *
 * LFOs continuously modulate delay time, feedback, comb resonance, filter, pan,
 * and vibrato depth so nothing stays static.
 */

export const MOLD_PRE_BANDPASS_HZ = 880;
export const MOLD_PRE_BANDPASS_Q = 1.6;

export const MOLD_TAPE_DRIVE = 0.12;
export const MOLD_TAPE_WET = 0.22;

export const MOLD_SOFT_DISTORTION = 0.18;
export const MOLD_SOFT_DIST_WET = 0.14;

export const MOLD_BITCRUSHER_BITS = 14;

export const MOLD_COMB_DELAY = 0.012;
export const MOLD_COMB_RESONANCE = 0.35;

export const MOLD_MICRO_DELAY_TIME = 0.06;
export const MOLD_MICRO_DELAY_FB = 0.42;
export const MOLD_MICRO_DELAY_WET = 0.08;

export const MOLD_FEEDBACK_DELAY_TIME = 0.52;
export const MOLD_FEEDBACK_DELAY_FB = 0.38;
export const MOLD_FEEDBACK_DELAY_WET = 0.28;

export const MOLD_VIBRATO_RATE = 0.14;
export const MOLD_VIBRATO_DEPTH = 0.04;
export const MOLD_VIBRATO_WET = 0.18;

export const MOLD_REVERB_DECAY = 9.5;
export const MOLD_REVERB_WET = 0.52;

export const MOLD_MASTER_GAIN = 0.72;

export type MoldEffectsNodes = {
  preBandpass: Tone.Filter;
  tapeSaturation: Tone.Distortion;
  softDistortion: Tone.Distortion;
  bitCrusher: Tone.BitCrusher;
  comb: Tone.FeedbackCombFilter;
  microDelay: Tone.FeedbackDelay;
  feedbackDelay: Tone.FeedbackDelay;
  vibrato: Tone.Vibrato;
  reverb: Tone.Reverb;
  panner: Tone.Panner;
  wowLfo: Tone.LFO;
  flutterLfo: Tone.LFO;
  combLfo: Tone.LFO;
  feedbackLfo: Tone.LFO;
  filterDriftLfo: Tone.LFO;
  vibratoDepthLfo: Tone.LFO;
  panLfo: Tone.LFO;
  master: Tone.Gain;
  analyser: Tone.Analyser;
};

export function createMoldEffects(): MoldEffectsNodes {
  const preBandpass = new Tone.Filter({
    type: 'bandpass',
    frequency: MOLD_PRE_BANDPASS_HZ,
    Q: MOLD_PRE_BANDPASS_Q,
  });

  const tapeSaturation = new Tone.Distortion({
    distortion: MOLD_TAPE_DRIVE,
    wet: MOLD_TAPE_WET,
  });

  const softDistortion = new Tone.Distortion({
    distortion: MOLD_SOFT_DISTORTION,
    wet: MOLD_SOFT_DIST_WET,
  });

  const bitCrusher = new Tone.BitCrusher(MOLD_BITCRUSHER_BITS);

  const comb = new Tone.FeedbackCombFilter({
    delayTime: MOLD_COMB_DELAY,
    resonance: MOLD_COMB_RESONANCE,
  });

  const microDelay = new Tone.FeedbackDelay({
    delayTime: MOLD_MICRO_DELAY_TIME,
    feedback: MOLD_MICRO_DELAY_FB,
    wet: MOLD_MICRO_DELAY_WET,
  });

  const feedbackDelay = new Tone.FeedbackDelay({
    delayTime: MOLD_FEEDBACK_DELAY_TIME,
    feedback: MOLD_FEEDBACK_DELAY_FB,
    wet: MOLD_FEEDBACK_DELAY_WET,
  });

  const vibrato = new Tone.Vibrato({
    frequency: MOLD_VIBRATO_RATE,
    depth: MOLD_VIBRATO_DEPTH,
    wet: MOLD_VIBRATO_WET,
  });

  const reverb = new Tone.Reverb({
    decay: MOLD_REVERB_DECAY,
    wet: MOLD_REVERB_WET,
  });

  const panner = new Tone.Panner(0);
  const master = new Tone.Gain(MOLD_MASTER_GAIN);
  const analyser = new Tone.Analyser('waveform', 1024);

  const wowLfo = new Tone.LFO({ frequency: 0.07, ...lfoSpan(0.002), type: 'sine' });
  const flutterLfo = new Tone.LFO({ frequency: 3.8, ...lfoSpan(0.0008), type: 'sine' });
  const combLfo = new Tone.LFO({ frequency: 0.11, min: 0.2, max: 0.55, type: 'triangle' });
  const feedbackLfo = new Tone.LFO({ frequency: 0.05, min: 0.25, max: 0.65, type: 'sine' });
  const filterDriftLfo = new Tone.LFO({
    frequency: 0.03,
    min: MOLD_PRE_BANDPASS_HZ * 0.65,
    max: MOLD_PRE_BANDPASS_HZ * 1.45,
    type: 'sine',
  });
  const vibratoDepthLfo = new Tone.LFO({ frequency: 0.08, min: 0.01, max: 0.08, type: 'sine' });
  const panLfo = new Tone.LFO({ frequency: 0.04, min: -0.55, max: 0.55, type: 'sine' });

  wowLfo.start();
  flutterLfo.start();
  combLfo.start();
  feedbackLfo.start();
  filterDriftLfo.start();
  vibratoDepthLfo.start();
  panLfo.start();

  wowLfo.connect(feedbackDelay.delayTime);
  flutterLfo.connect(feedbackDelay.delayTime);
  combLfo.connect(comb.resonance);
  feedbackLfo.connect(feedbackDelay.feedback);
  filterDriftLfo.connect(preBandpass.frequency);
  vibratoDepthLfo.connect(vibrato.depth);
  panLfo.connect(panner.pan);

  return {
    preBandpass,
    tapeSaturation,
    softDistortion,
    bitCrusher,
    comb,
    microDelay,
    feedbackDelay,
    vibrato,
    reverb,
    panner,
    wowLfo,
    flutterLfo,
    combLfo,
    feedbackLfo,
    filterDriftLfo,
    vibratoDepthLfo,
    panLfo,
    master,
    analyser,
  };
}

export function connectMoldEffects(input: Tone.ToneAudioNode, effects: MoldEffectsNodes): void {
  input.connect(effects.preBandpass);
  effects.preBandpass.connect(effects.tapeSaturation);
  effects.tapeSaturation.connect(effects.softDistortion);
  effects.softDistortion.connect(effects.bitCrusher);
  effects.bitCrusher.connect(effects.comb);
  effects.comb.connect(effects.microDelay);
  effects.microDelay.connect(effects.feedbackDelay);
  effects.feedbackDelay.connect(effects.vibrato);
  effects.vibrato.connect(effects.reverb);
  effects.reverb.connect(effects.panner);
  effects.panner.connect(effects.master);
  effects.master.connect(effects.analyser);
  effects.analyser.toDestination();
}

export function disposeMoldEffects(nodes: MoldEffectsNodes): void {
  nodes.wowLfo.stop();
  nodes.flutterLfo.stop();
  nodes.combLfo.stop();
  nodes.feedbackLfo.stop();
  nodes.filterDriftLfo.stop();
  nodes.vibratoDepthLfo.stop();
  nodes.panLfo.stop();
  nodes.wowLfo.dispose();
  nodes.flutterLfo.dispose();
  nodes.combLfo.dispose();
  nodes.feedbackLfo.dispose();
  nodes.filterDriftLfo.dispose();
  nodes.vibratoDepthLfo.dispose();
  nodes.panLfo.dispose();
  nodes.preBandpass.dispose();
  nodes.tapeSaturation.dispose();
  nodes.softDistortion.dispose();
  nodes.bitCrusher.dispose();
  nodes.comb.dispose();
  nodes.microDelay.dispose();
  nodes.feedbackDelay.dispose();
  nodes.vibrato.dispose();
  nodes.reverb.dispose();
  nodes.panner.dispose();
  nodes.master.dispose();
  nodes.analyser.dispose();
}

export type MoldEffectsLevels = {
  tapeWet: number;
  tapeDrive: number;
  softDistWet: number;
  softDistDrive: number;
  bitCrushWet: number;
  bitCrushBits: number;
  combResonance: number;
  microDelayWet: number;
  microDelayFeedback: number;
  feedbackDelayWet: number;
  feedbackDelayFeedback: number;
  vibratoWet: number;
  vibratoDepth: number;
  reverbWet: number;
  wowDepth: number;
  flutterDepth: number;
  releaseScale: number;
};

export function applyMoldEffectsLevels(
  effects: MoldEffectsNodes,
  dronePoly: Tone.PolySynth,
  levels: MoldEffectsLevels,
  audioStarted: boolean,
): void {
  effects.tapeSaturation.distortion = levels.tapeDrive;
  effects.softDistortion.distortion = levels.softDistDrive;

  setRampParam(audioStarted, effects.tapeSaturation.wet as unknown as RampParam, levels.tapeWet);
  setRampParam(audioStarted, effects.softDistortion.wet as unknown as RampParam, levels.softDistWet);
  setRampParam(audioStarted, effects.bitCrusher.wet as unknown as RampParam, levels.bitCrushWet);
  effects.bitCrusher.bits.value = levels.bitCrushBits;

  setRampParam(audioStarted, effects.comb.resonance as unknown as RampParam, levels.combResonance);
  setRampParam(audioStarted, effects.microDelay.wet as unknown as RampParam, levels.microDelayWet);
  setRampParam(
    audioStarted,
    effects.microDelay.feedback as unknown as RampParam,
    levels.microDelayFeedback,
  );
  setRampParam(
    audioStarted,
    effects.feedbackDelay.wet as unknown as RampParam,
    levels.feedbackDelayWet,
  );
  setRampParam(
    audioStarted,
    effects.feedbackDelay.feedback as unknown as RampParam,
    levels.feedbackDelayFeedback,
  );
  setRampParam(audioStarted, effects.vibrato.wet as unknown as RampParam, levels.vibratoWet);
  setRampParam(audioStarted, effects.vibrato.depth as unknown as RampParam, levels.vibratoDepth);
  setRampParam(audioStarted, effects.reverb.wet as unknown as RampParam, levels.reverbWet);

  const wowSpan = lfoSpan(levels.wowDepth);
  effects.wowLfo.min = wowSpan.min;
  effects.wowLfo.max = wowSpan.max;

  const flutterSpan = lfoSpan(levels.flutterDepth);
  effects.flutterLfo.min = flutterSpan.min;
  effects.flutterLfo.max = flutterSpan.max;

  dronePoly.set({
    envelope: {
      release: MOLD_DRONE_RELEASE * levels.releaseScale,
    },
  });
}
