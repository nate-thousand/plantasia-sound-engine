import * as Tone from 'tone';

/**
 * Mold voice architecture — layered texture sources, not melodic leads.
 *
 * Primary sources:
 * - Sine drones — slow attack, very long release
 * - Soft FM textures — hazy harmonic instability
 * - Filtered triangle harmonics — ghostly partials
 * - Brown noise bed — organic air and grain
 */

export const MOLD_DRONE_ATTACK = 2.6;
export const MOLD_DRONE_DECAY = 2.4;
export const MOLD_DRONE_SUSTAIN = 0.88;
export const MOLD_DRONE_RELEASE = 14;

export const MOLD_FM_ATTACK = 2.0;
export const MOLD_FM_RELEASE = 10;

export const MOLD_HARMONIC_ATTACK = 1.8;
export const MOLD_HARMONIC_RELEASE = 11;

export const MOLD_BANDPASS_HZ = 720;
export const MOLD_BANDPASS_Q = 2.4;

export const MOLD_NOISE_LEVEL = 0.012;
export const MOLD_FM_LEVEL = 0.22;
export const MOLD_HARMONIC_LEVEL = 0.18;

export const MOLD_FILTER_DRIFT_RATE = 0.04;
export const MOLD_FILTER_DRIFT_DEPTH = 0.35;

export const MOLD_MAX_POLYPHONY = 6;

export type MoldSynthNodes = {
  dronePoly: Tone.PolySynth;
  fmPoly: Tone.PolySynth;
  harmonicPoly: Tone.PolySynth;
  noise: Tone.Noise;
  noiseGain: Tone.Gain;
  merge: Tone.Merge;
  bandpass: Tone.Filter;
  filterDriftLfo: Tone.LFO;
  glitchNoise: Tone.Noise;
  glitchGain: Tone.Gain;
};

export function createMoldSynth(): MoldSynthNodes {
  const dronePoly = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: {
      attack: MOLD_DRONE_ATTACK,
      decay: MOLD_DRONE_DECAY,
      sustain: MOLD_DRONE_SUSTAIN,
      release: MOLD_DRONE_RELEASE,
    },
  });
  dronePoly.maxPolyphony = MOLD_MAX_POLYPHONY;

  const fmPoly = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1.01,
    modulationIndex: 1.4,
    oscillator: { type: 'sine' },
    envelope: {
      attack: MOLD_FM_ATTACK,
      decay: 1.6,
      sustain: 0.48,
      release: MOLD_FM_RELEASE,
    },
    modulationEnvelope: {
      attack: 1.8,
      decay: 1.2,
      sustain: 0.25,
      release: 8,
    },
  });
  fmPoly.volume.value = Tone.gainToDb(MOLD_FM_LEVEL);
  fmPoly.maxPolyphony = MOLD_MAX_POLYPHONY;

  const harmonicPoly = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: {
      attack: MOLD_HARMONIC_ATTACK,
      decay: 1.4,
      sustain: 0.42,
      release: MOLD_HARMONIC_RELEASE,
    },
  });
  harmonicPoly.volume.value = Tone.gainToDb(MOLD_HARMONIC_LEVEL);
  harmonicPoly.maxPolyphony = MOLD_MAX_POLYPHONY;

  const noise = new Tone.Noise({ type: 'brown', volume: -Infinity });
  const noiseGain = new Tone.Gain(MOLD_NOISE_LEVEL);

  const glitchNoise = new Tone.Noise({ type: 'pink', volume: -Infinity });
  const glitchGain = new Tone.Gain(0);

  const merge = new Tone.Merge();
  const bandpass = new Tone.Filter({
    type: 'bandpass',
    frequency: MOLD_BANDPASS_HZ,
    Q: MOLD_BANDPASS_Q,
  });

  const filterDriftLfo = new Tone.LFO({
    frequency: MOLD_FILTER_DRIFT_RATE,
    min: MOLD_BANDPASS_HZ * (1 - MOLD_FILTER_DRIFT_DEPTH),
    max: MOLD_BANDPASS_HZ * (1 + MOLD_FILTER_DRIFT_DEPTH),
    type: 'sine',
  });

  dronePoly.connect(merge, 0, 0);
  fmPoly.connect(merge, 0, 1);
  harmonicPoly.connect(merge, 0, 0);
  noise.connect(noiseGain);
  noiseGain.connect(bandpass);
  merge.connect(bandpass);
  glitchNoise.connect(glitchGain);
  glitchGain.connect(bandpass);

  filterDriftLfo.connect(bandpass.frequency);
  filterDriftLfo.start();
  noise.start();
  glitchNoise.start();

  return {
    dronePoly,
    fmPoly,
    harmonicPoly,
    noise,
    noiseGain,
    merge,
    bandpass,
    filterDriftLfo,
    glitchNoise,
    glitchGain,
  };
}

export function disposeMoldSynth(nodes: MoldSynthNodes): void {
  nodes.filterDriftLfo.stop();
  nodes.filterDriftLfo.dispose();
  nodes.noise.stop();
  nodes.glitchNoise.stop();
  nodes.noise.dispose();
  nodes.glitchNoise.dispose();
  nodes.noiseGain.dispose();
  nodes.glitchGain.dispose();
  nodes.dronePoly.dispose();
  nodes.fmPoly.dispose();
  nodes.harmonicPoly.dispose();
  nodes.merge.dispose();
  nodes.bandpass.dispose();
}

export type MoldLayerLevels = {
  fmLevel: number;
  harmonicLevel: number;
  noiseLevel: number;
};

export function triggerMoldAttack(
  nodes: MoldSynthNodes,
  note: string,
  velocity: number,
  layers: MoldLayerLevels,
  time?: number,
): void {
  nodes.dronePoly.triggerAttack(note, time, velocity * 0.72);

  if (layers.fmLevel > 0.01) {
    nodes.fmPoly.triggerAttack(note, time, velocity * layers.fmLevel);
  }
  if (layers.harmonicLevel > 0.01) {
    nodes.harmonicPoly.triggerAttack(note, time, velocity * layers.harmonicLevel * 0.85);
  }
}

export function triggerMoldRelease(nodes: MoldSynthNodes, note: string, time?: number): void {
  nodes.dronePoly.triggerRelease(note, time);
  nodes.fmPoly.triggerRelease(note, time);
  nodes.harmonicPoly.triggerRelease(note, time);
}

export function releaseAllMold(nodes: MoldSynthNodes): void {
  nodes.dronePoly.releaseAll();
  nodes.fmPoly.releaseAll();
  nodes.harmonicPoly.releaseAll();
}

/** Microscopic click / glitch burst for bacteria events. */
export function triggerMoldGlitch(nodes: MoldSynthNodes, intensity: number): void {
  const gain = 0.015 + intensity * 0.055;
  nodes.glitchGain.gain.cancelScheduledValues(Tone.now());
  nodes.glitchGain.gain.setValueAtTime(gain, Tone.now());
  nodes.glitchGain.gain.exponentialRampToValueAtTime(0.0001, Tone.now() + 0.04 + Math.random() * 0.06);
}
