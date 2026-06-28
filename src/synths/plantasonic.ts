import { getPresetById } from '../presets/loader.js';

/** Pentatonic scale tuned for Plantasonic's lush harmonic palette. */
export const PLANTASONIC_SCALE = [
  261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25,
] as const;

const plantasonicPresetData = getPresetById('plantasonic');

if (!plantasonicPresetData?.plantasonic) {
  throw new Error('Plantasonic preset is missing plantasonic configuration');
}

/** Sound-world routing for the Plantasonic flagship preset. */
export const PLANTASONIC_CONFIG = plantasonicPresetData.plantasonic;

/** Plantasonic flagship preset (loaded from presets/signature/plantasonic.json). */
export const plantasonicPreset = plantasonicPresetData;

export type { PlantasiaPreset } from '../utils/types/presets.js';
