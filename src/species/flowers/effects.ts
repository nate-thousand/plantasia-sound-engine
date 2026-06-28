import * as Tone from 'tone';
import { setRampParam, type RampParam } from '../../utils/ramp.js';
import { FLOWERS_RELEASE } from './synth.js';

/**
 * Flowers effects — chorus and space are central to the species identity.
 *
 * - Primary chorus: wide Juno-style ensemble movement
 * - Secondary chorus: slower ensemble widening layer
 * - Hall reverb: long dreamy tail
 * - Stereo delay: light spatial echo
 * - Stereo widener: harmonic bloom spread
 * - Tape color (mold): subtle warmth only
 */

export const FLOWERS_CHORUS_RATE = 0.18;
export const FLOWERS_CHORUS_DEPTH = 0.72;
export const FLOWERS_CHORUS_DELAY = 4.8;
export const FLOWERS_CHORUS_WET = 0.52;

export const FLOWERS_ENSEMBLE_RATE = 0.09;
export const FLOWERS_ENSEMBLE_DEPTH = 0.55;
export const FLOWERS_ENSEMBLE_WET = 0.38;

export const FLOWERS_HALL_DECAY = 6.2;
export const FLOWERS_HALL_WET = 0.48;

export const FLOWERS_DELAY_TIME = 0.32;
export const FLOWERS_DELAY_FEEDBACK = 0.18;
export const FLOWERS_DELAY_WET = 0.12;

export const FLOWERS_WIDENER_WIDTH = 0.62;

export const FLOWERS_TAPE_DRIVE = 0.08;
export const FLOWERS_TAPE_WET = 0.1;

export const FLOWERS_MASTER_GAIN = 0.76;

export type FlowersEffectsNodes = {
  tapeSaturation: Tone.Distortion;
  chorus: Tone.Chorus;
  ensembleChorus: Tone.Chorus;
  delay: Tone.FeedbackDelay;
  reverb: Tone.Reverb;
  widener: Tone.StereoWidener;
  master: Tone.Gain;
  analyser: Tone.Analyser;
};

export function createFlowersEffects(): FlowersEffectsNodes {
  const tapeSaturation = new Tone.Distortion({
    distortion: FLOWERS_TAPE_DRIVE,
    wet: FLOWERS_TAPE_WET,
  });

  const chorus = new Tone.Chorus({
    frequency: FLOWERS_CHORUS_RATE,
    delayTime: FLOWERS_CHORUS_DELAY,
    depth: FLOWERS_CHORUS_DEPTH,
    wet: FLOWERS_CHORUS_WET,
    spread: 180,
  });

  const ensembleChorus = new Tone.Chorus({
    frequency: FLOWERS_ENSEMBLE_RATE,
    delayTime: 6.2,
    depth: FLOWERS_ENSEMBLE_DEPTH,
    wet: FLOWERS_ENSEMBLE_WET,
    spread: 120,
  });

  const delay = new Tone.FeedbackDelay({
    delayTime: FLOWERS_DELAY_TIME,
    feedback: FLOWERS_DELAY_FEEDBACK,
    wet: FLOWERS_DELAY_WET,
  });

  const reverb = new Tone.Reverb({
    decay: FLOWERS_HALL_DECAY,
    wet: FLOWERS_HALL_WET,
  });

  const widener = new Tone.StereoWidener(FLOWERS_WIDENER_WIDTH);
  const master = new Tone.Gain(FLOWERS_MASTER_GAIN);
  const analyser = new Tone.Analyser('waveform', 1024);

  chorus.start();
  ensembleChorus.start();

  return {
    tapeSaturation,
    chorus,
    ensembleChorus,
    delay,
    reverb,
    widener,
    master,
    analyser,
  };
}

export function connectFlowersEffects(
  input: Tone.ToneAudioNode,
  effects: FlowersEffectsNodes,
): void {
  input.connect(effects.tapeSaturation);
  effects.tapeSaturation.connect(effects.chorus);
  effects.chorus.connect(effects.ensembleChorus);
  effects.ensembleChorus.connect(effects.delay);
  effects.delay.connect(effects.reverb);
  effects.reverb.connect(effects.widener);
  effects.widener.connect(effects.master);
  effects.master.connect(effects.analyser);
  effects.analyser.toDestination();
}

export function disposeFlowersEffects(nodes: FlowersEffectsNodes): void {
  nodes.tapeSaturation.dispose();
  nodes.chorus.dispose();
  nodes.ensembleChorus.dispose();
  nodes.delay.dispose();
  nodes.reverb.dispose();
  nodes.widener.dispose();
  nodes.master.dispose();
  nodes.analyser.dispose();
}

export type FlowersEffectsLevels = {
  tapeWet: number;
  tapeDrive: number;
  chorusWet: number;
  chorusDepth: number;
  ensembleWet: number;
  reverbWet: number;
  delayWet: number;
  widenerWidth: number;
  releaseScale: number;
};

export function applyFlowersEffectsLevels(
  effects: FlowersEffectsNodes,
  sawPoly: Tone.PolySynth,
  pwmPoly: Tone.PolySynth,
  levels: FlowersEffectsLevels,
  audioStarted: boolean,
): void {
  effects.tapeSaturation.distortion = levels.tapeDrive;
  setRampParam(audioStarted, effects.tapeSaturation.wet as unknown as RampParam, levels.tapeWet);
  setRampParam(audioStarted, effects.chorus.wet as unknown as RampParam, levels.chorusWet);
  setRampParam(audioStarted, effects.chorus.depth as unknown as RampParam, levels.chorusDepth);
  setRampParam(audioStarted, effects.ensembleChorus.wet as unknown as RampParam, levels.ensembleWet);
  setRampParam(audioStarted, effects.reverb.wet as unknown as RampParam, levels.reverbWet);
  setRampParam(audioStarted, effects.delay.wet as unknown as RampParam, levels.delayWet);
  setRampParam(audioStarted, effects.widener.width as unknown as RampParam, levels.widenerWidth);

  const release = FLOWERS_RELEASE * levels.releaseScale;
  sawPoly.set({ envelope: { release } });
  pwmPoly.set({ envelope: { release: release * 1.05 } });
}
