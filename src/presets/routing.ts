import type { LiveVoiceRouting, PlantasiaPreset } from '../utils/types/presets.js';

export type { LiveVoiceRouting };

/**
 * Resolve which live-voice graph handles keyboard/MIDI input.
 * Explicit `preset.routing` overrides inferred blocks.
 */
export function getPresetLiveRouting(preset: PlantasiaPreset): LiveVoiceRouting {
  if (preset.routing) {
    return preset.routing;
  }
  if (preset.plantasonic != null) {
    return 'plantasonic';
  }
  if (preset.botanical != null) {
    return 'botanical';
  }
  return 'standard';
}
