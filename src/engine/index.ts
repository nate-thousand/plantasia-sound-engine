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
export { PlantasiaEngine, createPlantasiaEngine, type CreatePlantasiaEngineOptions } from './plantasiaEngine.js';
export {
  resolvePresetToSpecies,
  presetControlsToEcology,
  PRESET_SPECIES_MAP,
  type PresetSpeciesResolution,
} from './resolvePresetToSpecies.js';
export { SpeciesManager, DEFAULT_SPECIES_ID } from './SpeciesManager.js';
export {
  EngineLifecycleError,
  type EngineState,
  type EngineLifecycleErrorCode,
} from './EngineLifecycle.js';
export {
  EcologyControlScaleError,
  assertNormalizedEcologyValue,
} from './EcologyControlScaleError.js';
export {
  ReservedSpeciesIdError,
  RESERVED_BUILTIN_SPECIES_IDS,
  RECOMMENDED_SPECIES_ID_PREFIXES,
  isReservedBuiltinSpeciesId,
  assertCustomSpeciesId,
} from './reservedSpeciesIds.js';
export { createSpeciesManager, loadDefaultSpecies, type CreateSpeciesManagerOptions } from './createSpeciesManager.js';
export { createSpeciesRegistry, type CreateSpeciesRegistryOptions } from './createSpeciesRegistry.js';
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
export { registerBuiltinSpecies, registerFutureSpecies } from '../species/registerBuiltinSpecies.js';
export { FUTURE_SPECIES_METADATA } from '../species/future/metadata.js';
