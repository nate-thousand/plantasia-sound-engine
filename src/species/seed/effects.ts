import * as Tone from 'tone';
import { setRampParam, type RampParam } from '../../utils/ramp.js';

/**
 * Seed effects chain (subtle Plantasonic-inspired color).
 *
 * - Tape saturation: warm `Tone.Distortion`, low wet mix
 * - Chorus: gentle stereo movement
 * - Delay: light feedback echo
 * - Reverb: small-room / spring-like tail via `Tone.Reverb`
 */

export const SEED_TAPE_DISTORTION = 0.14;
export const SEED_TAPE_WET = 0.16;

export const SEED_CHORUS_RATE = 0.22;
export const SEED_CHORUS_DEPTH = 0.35;
export const SEED_CHORUS_DELAY = 3.2;
export const SEED_CHORUS_WET = 0.26;

export const SEED_DELAY_TIME = 0.28;
export const SEED_DELAY_FEEDBACK = 0.12;
export const SEED_DELAY_WET = 0.14;

export const SEED_REVERB_DECAY = 3.4;
export const SEED_REVERB_WET = 0.36;

export const SEED_MASTER_GAIN = 0.78;

export type SeedEffectsNodes = {
  tapeSaturation: Tone.Distortion;
  chorus: Tone.Chorus;
  delay: Tone.FeedbackDelay;
  reverb: Tone.Reverb;
  master: Tone.Gain;
  analyser: Tone.Analyser;
};

export function createSeedEffects(): SeedEffectsNodes {
  const tapeSaturation = new Tone.Distortion({
    distortion: SEED_TAPE_DISTORTION,
    wet: SEED_TAPE_WET,
  });

  const chorus = new Tone.Chorus({
    frequency: SEED_CHORUS_RATE,
    delayTime: SEED_CHORUS_DELAY,
    depth: SEED_CHORUS_DEPTH,
    wet: SEED_CHORUS_WET,
  });

  const delay = new Tone.FeedbackDelay({
    delayTime: SEED_DELAY_TIME,
    feedback: SEED_DELAY_FEEDBACK,
    wet: SEED_DELAY_WET,
  });

  const reverb = new Tone.Reverb({
    decay: SEED_REVERB_DECAY,
    wet: SEED_REVERB_WET,
  });

  const master = new Tone.Gain(SEED_MASTER_GAIN);
  const analyser = new Tone.Analyser('waveform', 1024);

  chorus.start();

  return { tapeSaturation, chorus, delay, reverb, master, analyser };
}

export function connectSeedEffects(input: Tone.ToneAudioNode, effects: SeedEffectsNodes): void {
  input.connect(effects.tapeSaturation);
  effects.tapeSaturation.connect(effects.chorus);
  effects.chorus.connect(effects.delay);
  effects.delay.connect(effects.reverb);
  effects.reverb.connect(effects.master);
  effects.master.connect(effects.analyser);
  effects.analyser.toDestination();
}

export function disposeSeedEffects(nodes: SeedEffectsNodes): void {
  nodes.tapeSaturation.dispose();
  nodes.chorus.dispose();
  nodes.delay.dispose();
  nodes.reverb.dispose();
  nodes.master.dispose();
  nodes.analyser.dispose();
}

export type SeedEffectsLevels = {
  tapeWet: number;
  tapeDrive: number;
  chorusWet: number;
  reverbWet: number;
  delayWet: number;
  delayFeedback: number;
  releaseScale: number;
};

export function applySeedEffectsLevels(
  effects: SeedEffectsNodes,
  synthRelease: Tone.PolySynth,
  levels: SeedEffectsLevels,
  audioStarted: boolean,
): void {
  effects.tapeSaturation.distortion = levels.tapeDrive;
  setRampParam(audioStarted, effects.tapeSaturation.wet as unknown as RampParam, levels.tapeWet);
  setRampParam(audioStarted, effects.chorus.wet as unknown as RampParam, levels.chorusWet);
  setRampParam(audioStarted, effects.reverb.wet as unknown as RampParam, levels.reverbWet);
  setRampParam(audioStarted, effects.delay.wet as unknown as RampParam, levels.delayWet);
  setRampParam(
    audioStarted,
    effects.delay.feedback as unknown as RampParam,
    levels.delayFeedback,
  );

  const baseRelease = 3.2;
  synthRelease.set({
    envelope: {
      release: baseRelease * levels.releaseScale,
    },
  });
}
