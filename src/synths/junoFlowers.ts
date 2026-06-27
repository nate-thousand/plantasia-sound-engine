import { getPresetById } from '../presets/loader.js';

/** Pentatonic-ish scale from the Juno Flowers reference engine. */
export const JUNO_FLOWERS_SCALE = [
  261.63, 293.66, 329.63, 392, 440, 523.25, 659.25,
] as const;

const junoPreset = getPresetById('juno-flowers');

if (!junoPreset?.botanical || !junoPreset.growth) {
  throw new Error('Juno Flowers preset is missing botanical or growth configuration');
}

/** Botanical routing extracted from plantasia-engine.js LEGACY_PRESETS.junoflowers. */
export const JUNO_FLOWERS_BOTANICAL = junoPreset.botanical;

/** Growth-stage behavior from the Juno Flowers reference engine. */
export const JUNO_FLOWERS_GROWTH = junoPreset.growth;

/** Juno Flowers signature preset (loaded from presets/flora/juno-flowers.json). */
export const junoFlowersPreset = junoPreset;

export type { PlantasiaPreset } from '../utils/types/presets.js';
