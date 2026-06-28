/**
 * Recommended public API — unified facade and migration helpers.
 * Full legacy surface remains on the root entry (`plantasia-sound-engine`).
 */
export {
  PlantasiaEngine,
  createPlantasiaEngine,
  type CreatePlantasiaEngineOptions,
} from './engine/plantasiaEngine.js';

export {
  EngineEventBus,
  type EngineEventMap,
  type EngineEventName,
  type EngineEventHandler,
} from './engine/events/EngineEventBus.js';

export {
  createEngineScheduler,
  EngineScheduler,
  Transport,
  type TransportState,
} from './engine/scheduler/index.js';

export {
  createPlantasonicAdapter,
  PlantasonicAdapter,
  type PlantasonicLoadResult,
} from './integration/plantasonicAdapter.js';

export {
  resolvePresetToSpecies,
  presetControlsToEcology,
  PRESET_SPECIES_MAP,
  type PresetSpeciesResolution,
} from './engine/resolvePresetToSpecies.js';

export {
  DEFAULT_SPECIES_ID,
  EngineLifecycleError,
  EcologyControlScaleError,
  ReservedSpeciesIdError,
} from './engine/index.js';

export type {
  SpeciesId,
  SpeciesStatus,
  EcologicalControl,
  EcologyControlState,
  SoundWorldMetadata,
  EngineState,
} from './engine/index.js';

export {
  createSeedSoundWorld,
  createFlowersSoundWorld,
  createMoldSoundWorld,
  createBacteriaSoundWorld,
} from './species/index.js';

export { presets, getPresetById } from './presets/loader.js';
export { resolvePresetId } from './presets/aliases.js';
