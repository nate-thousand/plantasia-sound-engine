import type { ExpressionProfile } from '../../engine/performance/types.js';

/** Mold — increasing instability, tape wear, slow corruption, feedback growth. */
export const MOLD_EXPRESSION_PROFILE: ExpressionProfile = {
  id: 'mold',
  character: ['unstable', 'corrupting', 'organic'],
  velocity: {
    filterCutoff: 0.72,
    attack: 0.85,
    release: 0.78,
    brightness: 0.35,
    chorusDepth: 0.15,
    reverbWet: 0.48,
    saturation: 0.82,
    oscBlend: 0.28,
  },
  density: {
    filterOpen: 0.28,
    stereoWidth: 0.22,
    instability: 0.92,
    particleRate: 0.35,
    phraseActivity: 0.38,
  },
  macros: {
    growth: { filterCutoffMult: 0.06, oscBlendAdd: 0.05 },
    bloom: { reverbWetAdd: 0.12, releaseMult: 0.1 },
    roots: { filterCutoffMult: -0.05, releaseMult: 0.15 },
    mold: {
      saturationAdd: 0.18,
      instabilityAdd: 0.22,
      generativeDensityAdd: 0.08,
    },
    bacteria: { instabilityAdd: 0.14, particleRateMult: 0.12 },
  },
  sensitivity: 0.88,
};
