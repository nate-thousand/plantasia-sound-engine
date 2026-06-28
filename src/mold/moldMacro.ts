import type { MoldEffectParams, MoldProfile } from './types.js';
import { resolveMoldStages } from './stages.js';
import { resolveModuleParameters } from './modules.js';
import { getActiveMoldProfile } from './profiles.js';

export { normalizeMold } from './normalize.js';

/**
 * Map Mold (0–100) to simultaneous degradation parameters across all internal modules.
 * Low values = subtle aging; high values = controlled sonic overgrowth.
 */
export function resolveMoldParameters(mold: number, profile?: MoldProfile): MoldEffectParams {
  const activeProfile = profile ?? getActiveMoldProfile();
  const stages = resolveMoldStages(mold);
  return resolveModuleParameters(mold, stages, activeProfile.weights);
}
