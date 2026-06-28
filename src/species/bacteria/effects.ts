import * as Tone from 'tone';
import { setRampParam, type RampParam } from '../../utils/ramp.js';

/**
 * Bacteria effects — delicate spatial color; detail must remain audible.
 *
 * High-pass (at synth) → gentle saturation → auto-pan → micro ping-pong delay
 * → small room reverb. LFOs keep motion continuous.
 */

export const BACTERIA_SAT_DRIVE = 0.06;
export const BACTERIA_SAT_WET = 0.1;

export const BACTERIA_PANNER_RATE = 0.22;
export const BACTERIA_PANNER_DEPTH = 0.55;

export const BACTERIA_DELAY_TIME = 0.11;
export const BACTERIA_DELAY_FEEDBACK = 0.22;
export const BACTERIA_DELAY_WET = 0.14;

export const BACTERIA_ROOM_SIZE = 0.42;
export const BACTERIA_ROOM_DAMP = 3200;
export const BACTERIA_ROOM_WET = 0.22;

export const BACTERIA_MASTER_GAIN = 0.8;

export type BacteriaEffectsNodes = {
  saturation: Tone.Distortion;
  autoPanner: Tone.AutoPanner;
  microDelay: Tone.PingPongDelay;
  roomVerb: Tone.Freeverb;
  panModLfo: Tone.LFO;
  delayWetLfo: Tone.LFO;
  roomLfo: Tone.LFO;
  master: Tone.Gain;
  analyser: Tone.Analyser;
};

export function createBacteriaEffects(): BacteriaEffectsNodes {
  const saturation = new Tone.Distortion({
    distortion: BACTERIA_SAT_DRIVE,
    wet: BACTERIA_SAT_WET,
  });

  const autoPanner = new Tone.AutoPanner({
    frequency: BACTERIA_PANNER_RATE,
    depth: BACTERIA_PANNER_DEPTH,
    wet: 0.55,
  });

  const microDelay = new Tone.PingPongDelay({
    delayTime: BACTERIA_DELAY_TIME,
    feedback: BACTERIA_DELAY_FEEDBACK,
    wet: BACTERIA_DELAY_WET,
  });

  const roomVerb = new Tone.Freeverb({
    roomSize: BACTERIA_ROOM_SIZE,
    dampening: BACTERIA_ROOM_DAMP,
    wet: BACTERIA_ROOM_WET,
  });

  const panModLfo = new Tone.LFO({
    frequency: 0.07,
    min: 0.12,
    max: 0.38,
    type: 'sine',
  });

  const delayWetLfo = new Tone.LFO({
    frequency: 0.05,
    min: 0.06,
    max: 0.22,
    type: 'triangle',
  });

  const roomLfo = new Tone.LFO({
    frequency: 0.04,
    min: 0.28,
    max: 0.55,
    type: 'sine',
  });

  const master = new Tone.Gain(BACTERIA_MASTER_GAIN);
  const analyser = new Tone.Analyser('waveform', 1024);

  panModLfo.start();
  delayWetLfo.start();
  roomLfo.start();
  autoPanner.start();

  panModLfo.connect(autoPanner.frequency);
  delayWetLfo.connect(microDelay.wet);
  roomLfo.connect(roomVerb.roomSize);

  return {
    saturation,
    autoPanner,
    microDelay,
    roomVerb,
    panModLfo,
    delayWetLfo,
    roomLfo,
    master,
    analyser,
  };
}

export function connectBacteriaEffects(
  input: Tone.ToneAudioNode,
  effects: BacteriaEffectsNodes,
): void {
  input.connect(effects.saturation);
  effects.saturation.connect(effects.autoPanner);
  effects.autoPanner.connect(effects.microDelay);
  effects.microDelay.connect(effects.roomVerb);
  effects.roomVerb.connect(effects.master);
  effects.master.connect(effects.analyser);
  effects.analyser.toDestination();
}

export function disposeBacteriaEffects(nodes: BacteriaEffectsNodes): void {
  nodes.panModLfo.stop();
  nodes.delayWetLfo.stop();
  nodes.roomLfo.stop();
  nodes.autoPanner.stop();
  nodes.panModLfo.dispose();
  nodes.delayWetLfo.dispose();
  nodes.roomLfo.dispose();
  nodes.saturation.dispose();
  nodes.autoPanner.dispose();
  nodes.microDelay.dispose();
  nodes.roomVerb.dispose();
  nodes.master.dispose();
  nodes.analyser.dispose();
}

export type BacteriaEffectsLevels = {
  satWet: number;
  satDrive: number;
  pannerDepth: number;
  pannerRate: number;
  delayWet: number;
  delayFeedback: number;
  roomWet: number;
  roomSize: number;
  roomDampening: number;
};

export function applyBacteriaEffectsLevels(
  effects: BacteriaEffectsNodes,
  levels: BacteriaEffectsLevels,
  audioStarted: boolean,
): void {
  effects.saturation.distortion = levels.satDrive;
  setRampParam(audioStarted, effects.saturation.wet as unknown as RampParam, levels.satWet);
  setRampParam(audioStarted, effects.autoPanner.depth as unknown as RampParam, levels.pannerDepth);
  setRampParam(
    audioStarted,
    effects.autoPanner.frequency as unknown as RampParam,
    levels.pannerRate,
  );
  setRampParam(audioStarted, effects.microDelay.wet as unknown as RampParam, levels.delayWet);
  setRampParam(
    audioStarted,
    effects.microDelay.feedback as unknown as RampParam,
    levels.delayFeedback,
  );
  setRampParam(audioStarted, effects.roomVerb.wet as unknown as RampParam, levels.roomWet);
  setRampParam(audioStarted, effects.roomVerb.roomSize as unknown as RampParam, levels.roomSize);
  effects.roomVerb.dampening = levels.roomDampening;
}
