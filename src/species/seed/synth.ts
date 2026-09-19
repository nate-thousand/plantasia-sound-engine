import * as Tone from 'tone';

/**
 * Seed voice architecture (Tone.js PolySynth).
 *
 * Oscillators (via fat stack):
 * - Primary: soft saw (`fatsawtooth`, 3 detuned voices)
 * - Character blends triangle/sine warmth through low filter and gentle saturation downstream
 *
 * Envelope: soft attack, long release — Plantasonic-inspired.
 * Filter: low-pass with slow drift LFO for analog movement.
 */

export const SEED_SYNTH_ATTACK = 0.18;
export const SEED_SYNTH_DECAY = 0.65;
export const SEED_SYNTH_SUSTAIN = 0.62;
export const SEED_SYNTH_RELEASE = 3.2;

export const SEED_FILTER_HZ = 1650;
export const SEED_FILTER_Q = 0.9;

/** Detune spread in cents across the fat oscillator stack (soft saw). */
export const SEED_OSC_SPREAD = 14;
export const SEED_OSC_COUNT = 3;

export const SEED_DRIFT_LFO_RATE = 0.055;
export const SEED_DRIFT_LFO_DEPTH = 0.12;

export const SEED_MAX_POLYPHONY = 8;

export type SeedSynthNodes = {
  poly: Tone.PolySynth;
  filter: Tone.Filter;
  driftLfo: Tone.LFO;
};

export function createSeedSynth(): SeedSynthNodes {
  const poly = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'fatsawtooth',
      spread: SEED_OSC_SPREAD,
      count: SEED_OSC_COUNT,
    },
    envelope: {
      attack: SEED_SYNTH_ATTACK,
      decay: SEED_SYNTH_DECAY,
      sustain: SEED_SYNTH_SUSTAIN,
      release: SEED_SYNTH_RELEASE,
    },
  });
  poly.maxPolyphony = SEED_MAX_POLYPHONY;

  const filter = new Tone.Filter({
    type: 'lowpass',
    frequency: SEED_FILTER_HZ,
    Q: SEED_FILTER_Q,
  });

  const driftLfo = new Tone.LFO({
    frequency: SEED_DRIFT_LFO_RATE,
    min: SEED_FILTER_HZ * (1 - SEED_DRIFT_LFO_DEPTH),
    max: SEED_FILTER_HZ * (1 + SEED_DRIFT_LFO_DEPTH),
    type: 'sine',
  });

  poly.connect(filter);
  driftLfo.connect(filter.frequency);
  driftLfo.start();

  return { poly, filter, driftLfo };
}

export function disposeSeedSynth(nodes: SeedSynthNodes): void {
  nodes.driftLfo.stop();
  nodes.driftLfo.dispose();
  nodes.poly.dispose();
  nodes.filter.dispose();
}
