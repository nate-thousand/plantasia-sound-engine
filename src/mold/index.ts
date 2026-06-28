export type {
  MoldEffectParams,
  MoldModuleId,
  MoldModuleWeights,
  MoldProfile,
  MoldStageId,
  EngineParameterMeta,
} from './types.js';
export { normalizeMold, resolveMoldParameters } from './moldMacro.js';
export { resolveMoldStages } from './stages.js';
export {
  MOLD_PROFILES,
  getActiveMoldProfile,
  resolveMoldProfile,
  setActiveMoldProfile,
} from './profiles.js';
export { applySignatureMold } from './applySignatureMold.js';
export type { SignatureMoldTargets } from './applySignatureMold.js';
export { ENGINE_PARAMETER_METADATA, MOLD_PARAMETER_META } from './parameterMetadata.js';
export {
  applyMold,
  applyMoldParams,
  createMoldNodes,
  getMoldValue,
  wireMoldChain,
  type MoldHost,
} from './applyMold.js';
