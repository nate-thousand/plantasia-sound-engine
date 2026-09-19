import type { ExpressionProfile } from '../../engine/performance/types.js';

/** Tune velocity/density/macro weights for your species character. */
export const TEMPLATE_EXPRESSION_PROFILE: ExpressionProfile = {
  id: 'template-species',
  character: ['gentle', 'organic'],
  velocity: {
    filterCutoff: 0.7,
    attack: 0.6,
    release: 0.5,
    brightness: 0.4,
    chorusDepth: 0.3,
    reverbWet: 0.4,
    saturation: 0.2,
    oscBlend: 0.2,
  },
  density: {
    filterOpen: 0.4,
    stereoWidth: 0.3,
    instability: 0.1,
    particleRate: 0.2,
    phraseActivity: 0.3,
  },
  macros: {
    growth: { filterCutoffMult: 0.08 },
    bloom: { reverbWetAdd: 0.1, chorusDepthMult: 0.12 },
    roots: { releaseMult: 0.15 },
    mold: { saturationAdd: 0.08 },
    bacteria: { particleRateMult: 0.08 },
  },
  sensitivity: 0.7,
};
