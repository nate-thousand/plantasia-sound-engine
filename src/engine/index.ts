export type * from './SoundWorld.js';
export {
  EcologyControls,
  ECOLOGICAL_CONTROLS,
  DEFAULT_ECOLOGY_STATE,
  clampEcologyValue,
  toSpeciesControlValue,
  fromSpeciesControlValue,
  type EcologyControlState,
} from './EcologyControls.js';
export {
  Generator,
  PhraseEngine,
  HarmonyEngine,
  RhythmEngine,
  ProbabilityEngine,
  MemoryEngine,
  type GenerativePreferences,
  type GenerativeCallbacks,
  type GenerativeEcology,
  type GenerativeEventKind,
  type HarmonyStyle,
  type RhythmStyle,
} from './generative/index.js';
export {
  PerformanceEngine,
  ExpressionRouter,
  VelocityEngine,
  DensityEngine,
  MacroEngine,
  macroToPerformanceTargets,
  type ExpressionProfile,
  type PerformanceTargets,
  type DensityState,
} from './performance/index.js';
export { SpeciesManager, DEFAULT_SPECIES_ID } from './SpeciesManager.js';
export { createSpeciesManager, loadDefaultSpecies } from './createSpeciesManager.js';
export { createSpeciesRegistry } from './createSpeciesRegistry.js';
export {
  SpeciesRegistry,
  SpeciesLoader,
  SpeciesValidationError,
  SpeciesNotLoadableError,
  SpeciesLoadError,
  DuplicateSpeciesError,
  createStubSoundWorld,
  assertValidSpecies,
  assertValidPlaceholderMetadata,
  validateMetadata,
  validateSoundWorld,
  type SpeciesFactory,
  type SpeciesRegistration,
} from './registry/index.js';
export { registerBuiltinSpecies } from '../species/registerBuiltinSpecies.js';
export { FUTURE_SPECIES_METADATA } from '../species/future/metadata.js';
