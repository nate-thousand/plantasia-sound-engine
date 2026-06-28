import * as Tone from 'tone';

/**
 * Bacteria voice architecture — lightweight, highly dynamic micro-voices.
 *
 * Many small events layered rather than a few large voices.
 * No melodic leads — particles, blips, impulses, and grain.
 */

export const BACTERIA_NOISE_ATTACK = 0.001;
export const BACTERIA_NOISE_DECAY = 0.045;
export const BACTERIA_NOISE_RELEASE = 0.02;

export const BACTERIA_SINE_ATTACK = 0.001;
export const BACTERIA_SINE_DECAY = 0.07;
export const BACTERIA_SINE_RELEASE = 0.04;

export const BACTERIA_FM_ATTACK = 0.001;
export const BACTERIA_FM_DECAY = 0.055;
export const BACTERIA_FM_RELEASE = 0.03;

export const BACTERIA_HIGHPASS_HZ = 420;
export const BACTERIA_HIGHPASS_Q = 0.7;

export const BACTERIA_FILTER_DRIFT_RATE = 0.13;
export const BACTERIA_FILTER_DRIFT_DEPTH = 0.28;

export const BACTERIA_PAN_DRIFT_RATE = 0.09;

export const BACTERIA_MAX_POLYPHONY = 16;

export type BacteriaParticleType = 'noise' | 'fm' | 'sine' | 'impulse';

export type BacteriaSynthNodes = {
  noiseSynth: Tone.NoiseSynth;
  fmPoly: Tone.PolySynth;
  sinePoly: Tone.PolySynth;
  pluck: Tone.PluckSynth;
  merge: Tone.Merge;
  highpass: Tone.Filter;
  panner: Tone.Panner;
  filterDriftLfo: Tone.LFO;
  panDriftLfo: Tone.LFO;
};

export function createBacteriaSynth(): BacteriaSynthNodes {
  const noiseSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: BACTERIA_NOISE_ATTACK,
      decay: BACTERIA_NOISE_DECAY,
      sustain: 0,
      release: BACTERIA_NOISE_RELEASE,
    },
  });
  noiseSynth.volume.value = -14;

  const fmPoly = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1.4,
    modulationIndex: 1.8,
    oscillator: { type: 'sine' },
    envelope: {
      attack: BACTERIA_FM_ATTACK,
      decay: BACTERIA_FM_DECAY,
      sustain: 0,
      release: BACTERIA_FM_RELEASE,
    },
    modulationEnvelope: {
      attack: 0.001,
      decay: 0.04,
      sustain: 0,
      release: 0.025,
    },
  });
  fmPoly.volume.value = -16;
  fmPoly.maxPolyphony = BACTERIA_MAX_POLYPHONY;

  const sinePoly = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: {
      attack: BACTERIA_SINE_ATTACK,
      decay: BACTERIA_SINE_DECAY,
      sustain: 0,
      release: BACTERIA_SINE_RELEASE,
    },
  });
  sinePoly.volume.value = -12;
  sinePoly.maxPolyphony = BACTERIA_MAX_POLYPHONY;

  const pluck = new Tone.PluckSynth({
    attackNoise: 1.2,
    dampening: 5200,
    resonance: 0.35,
    release: 0.06,
  });
  pluck.volume.value = -18;

  const merge = new Tone.Merge();
  const highpass = new Tone.Filter({
    type: 'highpass',
    frequency: BACTERIA_HIGHPASS_HZ,
    Q: BACTERIA_HIGHPASS_Q,
  });
  const panner = new Tone.Panner(0);

  const filterDriftLfo = new Tone.LFO({
    frequency: BACTERIA_FILTER_DRIFT_RATE,
    min: BACTERIA_HIGHPASS_HZ * (1 - BACTERIA_FILTER_DRIFT_DEPTH),
    max: BACTERIA_HIGHPASS_HZ * (1 + BACTERIA_FILTER_DRIFT_DEPTH),
    type: 'sine',
  });

  const panDriftLfo = new Tone.LFO({
    frequency: BACTERIA_PAN_DRIFT_RATE,
    min: -0.75,
    max: 0.75,
    type: 'triangle',
  });

  noiseSynth.connect(merge, 0, 0);
  fmPoly.connect(merge, 0, 1);
  sinePoly.connect(merge, 0, 0);
  pluck.connect(merge, 0, 1);
  merge.connect(highpass);
  highpass.connect(panner);

  filterDriftLfo.connect(highpass.frequency);
  panDriftLfo.connect(panner.pan);
  filterDriftLfo.start();
  panDriftLfo.start();

  return {
    noiseSynth,
    fmPoly,
    sinePoly,
    pluck,
    merge,
    highpass,
    panner,
    filterDriftLfo,
    panDriftLfo,
  };
}

export function disposeBacteriaSynth(nodes: BacteriaSynthNodes): void {
  nodes.filterDriftLfo.stop();
  nodes.panDriftLfo.stop();
  nodes.filterDriftLfo.dispose();
  nodes.panDriftLfo.dispose();
  nodes.noiseSynth.dispose();
  nodes.fmPoly.dispose();
  nodes.sinePoly.dispose();
  nodes.pluck.dispose();
  nodes.merge.dispose();
  nodes.highpass.dispose();
  nodes.panner.dispose();
}

export function triggerBacteriaParticle(
  nodes: BacteriaSynthNodes,
  type: BacteriaParticleType,
  note: string,
  velocity: number,
  time?: number,
): void {
  const v = Math.max(0.05, Math.min(1, velocity));
  switch (type) {
    case 'noise':
      nodes.noiseSynth.triggerAttackRelease(0.02 + Math.random() * 0.05, time, v * 0.6);
      break;
    case 'fm':
      nodes.fmPoly.triggerAttackRelease(note, 0.04 + Math.random() * 0.06, time, v * 0.55);
      break;
    case 'sine':
      nodes.sinePoly.triggerAttackRelease(note, 0.05 + Math.random() * 0.08, time, v * 0.5);
      break;
    case 'impulse':
      nodes.pluck.triggerAttack(note, time);
      break;
    default:
      break;
  }
}

export function releaseAllBacteria(nodes: BacteriaSynthNodes): void {
  nodes.fmPoly.releaseAll();
  nodes.sinePoly.releaseAll();
}
