import type { ExpressionProfile } from '../../engine/performance/types.js';

/** Flowers — dramatic chorus, blooming harmonics, expanding stereo. */
export const FLOWERS_EXPRESSION_PROFILE: ExpressionProfile = {
  id: 'flowers',
  character: ['dramatic', 'blooming', 'wide', 'musical'],
  velocity: {
    filterCutoff: 0.95,
    attack: 0.55,
    release: 0.62,
    brightness: 0.55,
    chorusDepth: 0.88,
    reverbWet: 0.58,
    saturation: 0.28,
    oscBlend: 0.42,
  },
  density: {
    filterOpen: 0.35,
    stereoWidth: 0.82,
    instability: 0.18,
    particleRate: 0.22,
    phraseActivity: 0.45,
  },
  macros: {
    growth: { stereoWidthMult: 0.1, filterCutoffMult: 0.08 },
    bloom: { chorusDepthMult: 0.22, reverbWetAdd: 0.14, brightnessAdd: 0.12 },
    roots: { filterCutoffMult: -0.06, releaseMult: 0.1 },
    mold: { saturationAdd: 0.1, instabilityAdd: 0.12 },
    bacteria: { generativeDensityAdd: 0.08, particleRateMult: 0.1 },
  },
  sensitivity: 0.85,
};
