import type { PlantasiaPreset } from '../types/presets.js';
import type { JunoBotanicalConfig, JunoGrowthConfig } from '../types/junoFlowers.js';

/** Pentatonic-ish scale from the Juno Flowers reference engine. */
export const JUNO_FLOWERS_SCALE = [
  261.63, 293.66, 329.63, 392, 440, 523.25, 659.25,
] as const;

/** Botanical routing extracted from plantasia-engine.js LEGACY_PRESETS.junoflowers. */
export const JUNO_FLOWERS_BOTANICAL: JunoBotanicalConfig = {
  morningMist: { mix: 0.62, size: 0.46, damp: 0.74 },
  roots: { shelfGain: 4.2, sub: 0.32, sat: 0.28 },
  pollen: { width: 0.58, chorusRate: 0.34, chorusDepth: 0.58, shimmer: 0.42 },
  photosynthesis: { sat: 0.35, lift: 0.42, clip: 0.16 },
  canopy: { spread: 0.72, chorusWidth: 0.68, reverbWidth: 0.58 },
  wind: { depth: 0.38, rate: 0.055, drift: 0.22 },
};

/** Growth-stage behavior from the Juno Flowers reference engine. */
export const JUNO_FLOWERS_GROWTH: JunoGrowthConfig = {
  speed: 1.15,
  bloomIntensity: 1.28,
  movementAmount: 1.18,
  particleAmount: 1.35,
};

/**
 * Juno Flowers — warm analog sawtooth with detune, chorus, saturation,
 * delay, reverb, and botanical routing. Values sourced from plantasia-engine.js.
 */
export const junoFlowersPreset: PlantasiaPreset = {
  id: 'juno-flowers',
  name: 'Juno Flowers',
  species: 'Juno Flowers',
  description:
    'Warm vintage analog blooms with detuned sawtooth, pollen chorus, morning mist reverb, and rooted low-end body.',
  mood: 'warm / analog / dreamlike / botanical',
  asciiState: 'bloom',
  scale: [...JUNO_FLOWERS_SCALE],
  synth: {
    oscillator: 'sawtooth',
    filterType: 'lowpass',
    filterHz: 1750,
    filterQ: 2.4,
    envelope: { attack: 0.38, release: 2.6 },
    detuneCents: [-14, -7, 0, 7, 14],
    drift: 0.88,
    chorus: 0.68,
    saturation: 0.38,
    stereoWidth: 0.75,
    subAmount: 0.32,
    hfRolloff: 4200,
    effects: { delay: 0.32, echo: 0.22, reverb: 0.62 },
  },
  botanical: JUNO_FLOWERS_BOTANICAL,
  growth: JUNO_FLOWERS_GROWTH,
};
