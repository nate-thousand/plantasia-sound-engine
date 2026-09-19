/**
 * Public tier (ROADMAP decision 5): the surface a host builds on.
 *
 * `createPlantasiaEngine()` here returns the engine typed as
 * {@link PlantasiaEngineApi}: twenty four methods, the shipped presets, and
 * the events and features they produce. The root export
 * (`plantasia-sound-engine`) carries the same instance with the legacy v1
 * preset methods and engine internals for existing hosts.
 */
import {
  createPlantasiaEngine as createFullEngine,
  type CreatePlantasiaEngineOptions,
} from './engine/plantasiaEngine.js';
import type { PlantasiaEngineApi } from './engine/PlantasiaEngineApi.js';

export type { CreatePlantasiaEngineOptions };
export type { PlantasiaEngineApi, PlantasiaEngineApi as PlantasiaEngine };

/** Create an engine. Call {@link PlantasiaEngineApi.init} from a user gesture before playing. */
export function createPlantasiaEngine(options: CreatePlantasiaEngineOptions = {}): PlantasiaEngineApi {
  return createFullEngine(options);
}

// Events and analysis
export type {
  EngineEventMap,
  EngineEventName,
  EngineEventHandler,
  EngineEventInput,
  NoteSource,
  TimedEvent,
} from './engine/events/EngineEventBus.js';
export {
  BAND_EDGES_HZ,
  type AudioFeatures,
  type OnsetEvent,
} from './engine/analysis/AudioAnalyser.js';

// Lifecycle, errors, control ids
export {
  DEFAULT_SPECIES_ID,
  ECOLOGICAL_CONTROLS,
  EngineLifecycleError,
  EcologyControlScaleError,
  ReservedSpeciesIdError,
} from './engine/index.js';
export type {
  SpeciesId,
  EcologicalControl,
  EcologyControlState,
  EngineState,
  EngineLifecycleErrorCode,
  SoundWorld,
  SoundWorldMetadata,
  SoundWorldStartOptions,
} from './engine/index.js';

// Presets
export { presets, getPresetById } from './presets/loader.js';
export { resolvePresetId } from './presets/aliases.js';
export type { PlantasiaPreset } from './utils/types/presets.js';

// Plantasonic host adapter
export {
  createPlantasonicAdapter,
  PlantasonicAdapter,
  type PlantasonicLoadResult,
} from './integration/plantasonicAdapter.js';
