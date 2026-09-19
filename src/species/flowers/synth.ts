import * as Tone from 'tone';

/**
 * Flowers voice architecture — Juno-inspired subtractive synthesis.
 *
 * Primary sources:
 * - Saw stack (`fatsawtooth`) — main harmonic body
 * - Pulse / PWM layer (`pwm` oscillator) — nostalgic Juno character
 * - Sub oscillator (sine, −1 octave) — rooted warmth
 * - Pink noise bed — breath and shimmer at low level
 *
 * Envelope: slow attack, long release. Warm low-pass with slow LFO movement.
 */

export const FLOWERS_ATTACK = 0.42;
export const FLOWERS_DECAY = 0.85;
export const FLOWERS_SUSTAIN = 0.72;
export const FLOWERS_RELEASE = 4.8;

export const FLOWERS_FILTER_HZ = 2200;
export const FLOWERS_FILTER_Q = 1.1;

export const FLOWERS_SAW_SPREAD = 22;
export const FLOWERS_SAW_COUNT = 4;

export const FLOWERS_PWM_WIDTH = 0.48;
export const FLOWERS_PWM_MOD_FREQ = 0.35;

export const FLOWERS_SUB_LEVEL = 0.28;
export const FLOWERS_NOISE_LEVEL = 0.018;

export const FLOWERS_FILTER_LFO_RATE = 0.08;
export const FLOWERS_FILTER_LFO_DEPTH = 0.18;

export const FLOWERS_MAX_POLYPHONY = 10;

export type FlowersSynthNodes = {
  sawPoly: Tone.PolySynth;
  pwmPoly: Tone.PolySynth;
  subPoly: Tone.PolySynth;
  noise: Tone.Noise;
  noiseGain: Tone.Gain;
  merge: Tone.Merge;
  filter: Tone.Filter;
  filterLfo: Tone.LFO;
};

export function createFlowersSynth(): FlowersSynthNodes {
  const sawPoly = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'fatsawtooth',
      spread: FLOWERS_SAW_SPREAD,
      count: FLOWERS_SAW_COUNT,
    },
    envelope: {
      attack: FLOWERS_ATTACK,
      decay: FLOWERS_DECAY,
      sustain: FLOWERS_SUSTAIN,
      release: FLOWERS_RELEASE,
    },
  });
  sawPoly.maxPolyphony = FLOWERS_MAX_POLYPHONY;

  const pwmPoly = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'pulse',
      width: FLOWERS_PWM_WIDTH,
    },
    envelope: {
      attack: FLOWERS_ATTACK * 1.1,
      decay: FLOWERS_DECAY,
      sustain: FLOWERS_SUSTAIN * 0.9,
      release: FLOWERS_RELEASE,
    },
  });
  pwmPoly.volume.value = -8;
  pwmPoly.maxPolyphony = FLOWERS_MAX_POLYPHONY;

  const subPoly = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: {
      attack: FLOWERS_ATTACK * 1.4,
      decay: FLOWERS_DECAY,
      sustain: FLOWERS_SUSTAIN,
      release: FLOWERS_RELEASE * 1.2,
    },
  });
  subPoly.volume.value = Tone.gainToDb(FLOWERS_SUB_LEVEL);
  subPoly.maxPolyphony = FLOWERS_MAX_POLYPHONY;

  const noise = new Tone.Noise({ type: 'pink', volume: -Infinity });
  const noiseGain = new Tone.Gain(FLOWERS_NOISE_LEVEL);

  const merge = new Tone.Merge();
  const filter = new Tone.Filter({
    type: 'lowpass',
    frequency: FLOWERS_FILTER_HZ,
    Q: FLOWERS_FILTER_Q,
  });

  const filterLfo = new Tone.LFO({
    frequency: FLOWERS_FILTER_LFO_RATE,
    min: FLOWERS_FILTER_HZ * (1 - FLOWERS_FILTER_LFO_DEPTH),
    max: FLOWERS_FILTER_HZ * (1 + FLOWERS_FILTER_LFO_DEPTH),
    type: 'sine',
  });

  sawPoly.connect(merge, 0, 0);
  pwmPoly.connect(merge, 0, 1);
  subPoly.connect(merge, 0, 0);
  noise.connect(noiseGain);
  noiseGain.connect(filter);
  merge.connect(filter);
  filterLfo.connect(filter.frequency);
  filterLfo.start();
  noise.start();

  return { sawPoly, pwmPoly, subPoly, noise, noiseGain, merge, filter, filterLfo };
}

export function disposeFlowersSynth(nodes: FlowersSynthNodes): void {
  nodes.filterLfo.stop();
  nodes.filterLfo.dispose();
  nodes.noise.stop();
  nodes.noise.dispose();
  nodes.noiseGain.dispose();
  nodes.sawPoly.dispose();
  nodes.pwmPoly.dispose();
  nodes.subPoly.dispose();
  nodes.merge.dispose();
  nodes.filter.dispose();
}

/** Trigger all Flowers oscillator layers for one note. */
export function triggerFlowersAttack(
  nodes: FlowersSynthNodes,
  note: string,
  velocity: number,
  time?: number,
): void {
  nodes.sawPoly.triggerAttack(note, time, velocity);
  nodes.pwmPoly.triggerAttack(note, time, velocity * 0.85);
  const subNote = Tone.Frequency(note).transpose(-12).toNote();
  nodes.subPoly.triggerAttack(subNote, time, velocity * 0.7);
}

/** Release all Flowers oscillator layers for one note. */
export function triggerFlowersRelease(nodes: FlowersSynthNodes, note: string, time?: number): void {
  nodes.sawPoly.triggerRelease(note, time);
  nodes.pwmPoly.triggerRelease(note, time);
  const subNote = Tone.Frequency(note).transpose(-12).toNote();
  nodes.subPoly.triggerRelease(subNote, time);
}

export function releaseAllFlowers(nodes: FlowersSynthNodes): void {
  nodes.sawPoly.releaseAll();
  nodes.pwmPoly.releaseAll();
  nodes.subPoly.releaseAll();
}
