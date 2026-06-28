import type { ExpressionProfile } from '../../engine/performance/types.js';

/** Seed — gentle, musical, warm, organic expression. */
export const SEED_EXPRESSION_PROFILE: ExpressionProfile = {
  id: 'seed',
  character: ['gentle', 'musical', 'warm', 'organic'],
  velocity: {
    filterCutoff: 0.85,
    attack: 0.72,
    release: 0.48,
    brightness: 0.38,
    chorusDepth: 0.32,
    reverbWet: 0.42,
    saturation: 0.22,
    oscBlend: 0.18,
  },
  density: {
    filterOpen: 0.52,
    stereoWidth: 0.12,
    instability: 0.08,
    particleRate: 0.15,
    phraseActivity: 0.32,
  },
  macros: {
    growth: { filterCutoffMult: 0.1, attackMult: -0.06, oscBlendAdd: 0.04 },
    bloom: { chorusDepthMult: 0.16, reverbWetAdd: 0.1, releaseMult: 0.12 },
    roots: { filterCutoffMult: -0.08, releaseMult: 0.18, attackMult: 0.06 },
    mold: { saturationAdd: 0.08, instabilityAdd: 0.06 },
    bacteria: { generativeDensityAdd: 0.1, particleRateMult: 0.06 },
  },
  sensitivity: 0.72,
};
