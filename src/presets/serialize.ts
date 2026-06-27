import type { PlantasiaPreset } from '../utils/types/presets.js';

/** Parse and validate a preset object loaded from JSON. */
export function presetFromJson(data: unknown): PlantasiaPreset {
  if (!data || typeof data !== 'object') {
    throw new Error('Preset JSON must be an object');
  }

  const preset = data as PlantasiaPreset;
  if (!preset.id || !preset.name || !preset.synth) {
    throw new Error('Preset JSON is missing required fields (id, name, synth)');
  }

  return preset;
}

/** Serialize a preset to formatted JSON. */
export function serializePreset(preset: PlantasiaPreset): string {
  return `${JSON.stringify(preset, null, 2)}\n`;
}

/** Deserialize a preset from a JSON string. */
export function deserializePreset(json: string): PlantasiaPreset {
  return presetFromJson(JSON.parse(json) as unknown);
}
