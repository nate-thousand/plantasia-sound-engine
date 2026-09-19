import type { ExpressionProfile } from '../../engine/performance/types.js';

/** Bacteria — particle swarms, microscopic movement, randomness, tiny bursts. */
export const BACTERIA_EXPRESSION_PROFILE: ExpressionProfile = {
  id: 'bacteria',
  character: ['swarming', 'microscopic'],
  velocity: {
    filterCutoff: 0.78,
    attack: 0.35,
    release: 0.42,
    brightness: 0.68,
    chorusDepth: 0.2,
    reverbWet: 0.38,
    saturation: 0.45,
    oscBlend: 0.55,
  },
  density: {
    filterOpen: 0.42,
    stereoWidth: 0.55,
    instability: 0.48,
    particleRate: 0.95,
    phraseActivity: 0.52,
  },
  macros: {
    growth: { particleRateMult: 0.1, brightnessAdd: 0.06 },
    bloom: { reverbWetAdd: 0.08, stereoWidthMult: 0.08 },
    roots: { filterCutoffMult: -0.06 },
    mold: { saturationAdd: 0.1, instabilityAdd: 0.1 },
    bacteria: {
      particleRateMult: 0.22,
      generativeDensityAdd: 0.18,
      instabilityAdd: 0.08,
    },
  },
  sensitivity: 0.9,
};
