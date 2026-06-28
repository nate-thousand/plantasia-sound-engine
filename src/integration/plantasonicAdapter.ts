import type { PlantasiaEngine } from '../engine/plantasiaEngine.js';
import { createPlantasiaEngine } from '../engine/plantasiaEngine.js';
import { getPresetById } from '../presets/loader.js';
import {
  resolvePresetToSpecies,
  type PresetSpeciesResolution,
} from '../engine/resolvePresetToSpecies.js';
import type { PlantasiaPreset } from '../utils/types/presets.js';
import type { EngineEventHandler, EngineEventName } from '../engine/events/EngineEventBus.js';

export type PlantasonicLoadResult = {
  preset: PlantasiaPreset;
  resolution: PresetSpeciesResolution;
};

/**
 * Plantasonic integration adapter — v2 Sound World audio with v1 preset metadata for visuals.
 * Host apps keep preset JSON for ASCII/visual profiles; audio runs through the unified facade.
 */
export class PlantasonicAdapter {
  readonly engine: PlantasiaEngine;

  constructor(engine?: PlantasiaEngine) {
    this.engine = engine ?? createPlantasiaEngine();
  }

  /** Load a bundled preset: v2 species audio + ecology, v1 visual metadata unchanged. */
  async loadPreset(presetId: string): Promise<PlantasonicLoadResult> {
    const preset = getPresetById(presetId);
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }
    const resolution = resolvePresetToSpecies(presetId);
    await this.engine.loadPreset(presetId);
    return { preset, resolution };
  }

  /** Subscribe to semantic events for visualization (glyph bursts, density motion, etc.). */
  on<K extends EngineEventName>(event: K, handler: EngineEventHandler<K>): () => void {
    return this.engine.on(event, handler);
  }

  /** Recommended startup sequence for browser hosts. */
  async startWithGesture(): Promise<void> {
    await this.engine.initialize();
    if (this.engine.getCurrentSpecies() === null) {
      await this.engine.loadDefaultSpecies();
    }
    await this.engine.start();
  }
}

export function createPlantasonicAdapter(engine?: PlantasiaEngine): PlantasonicAdapter {
  return new PlantasonicAdapter(engine);
}
