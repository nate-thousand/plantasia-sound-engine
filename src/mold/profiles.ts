import type { MoldModuleWeights, MoldProfile } from './types.js';
import type { PlantasiaPreset } from '../utils/types/presets.js';

const BASE_WEIGHTS: MoldModuleWeights = {
  tapeWear: 1,
  harmonicDistortion: 1,
  delayCorruption: 1,
  granularMutation: 1,
  bufferGlitch: 1,
  spectralDecay: 1,
  pitchInstability: 1,
  textureEngine: 1,
};

function profile(
  id: string,
  label: string,
  description: string,
  weights: Partial<MoldModuleWeights>,
): MoldProfile {
  return { id, label, description, weights: { ...BASE_WEIGHTS, ...weights } };
}

/** Built-in Sound World mold personalities. */
export const MOLD_PROFILES: Record<string, MoldProfile> = {
  plantasonic: profile(
    'plantasonic',
    'Plantasonic',
    'Analog tape wear, gentle instability, warm saturation.',
    {
      tapeWear: 1.35,
      harmonicDistortion: 0.75,
      delayCorruption: 0.65,
      granularMutation: 0.45,
      bufferGlitch: 0.35,
      spectralDecay: 0.55,
      pitchInstability: 0.9,
      textureEngine: 0.7,
    },
  ),
  bloom: profile(
    'bloom',
    'Bloom',
    'Delicate granular petals, sparkling echoes, light reverse textures.',
    {
      tapeWear: 0.45,
      harmonicDistortion: 0.35,
      delayCorruption: 0.85,
      granularMutation: 1.25,
      bufferGlitch: 0.55,
      spectralDecay: 0.4,
      pitchInstability: 0.65,
      textureEngine: 0.5,
    },
  ),
  roots: profile(
    'roots',
    'Roots',
    'Heavy analog distortion, earthy crackle, slow rhythmic degradation.',
    {
      tapeWear: 1.1,
      harmonicDistortion: 1.35,
      delayCorruption: 0.75,
      granularMutation: 0.55,
      bufferGlitch: 0.65,
      spectralDecay: 0.7,
      pitchInstability: 0.8,
      textureEngine: 1.2,
    },
  ),
  rainforest: profile(
    'rainforest',
    'Rainforest',
    'Organic echoes, dense delay blooms, chaotic ambience.',
    {
      tapeWear: 0.7,
      harmonicDistortion: 0.6,
      delayCorruption: 1.35,
      granularMutation: 1.05,
      bufferGlitch: 0.85,
      spectralDecay: 0.65,
      pitchInstability: 0.95,
      textureEngine: 0.9,
    },
  ),
  winter: profile(
    'winter',
    'Winter',
    'Frozen artifacts, crystal-like bit reduction, glassy reverse tails.',
    {
      tapeWear: 0.55,
      harmonicDistortion: 0.45,
      delayCorruption: 0.95,
      granularMutation: 0.75,
      bufferGlitch: 0.7,
      spectralDecay: 1.35,
      pitchInstability: 0.6,
      textureEngine: 0.55,
    },
  ),
  'night-bloom': profile(
    'night-bloom',
    'Night Bloom',
    'Haunted tape loops, ghost delays, spectral shimmer, reverse ambience.',
    {
      tapeWear: 1.05,
      harmonicDistortion: 0.85,
      delayCorruption: 1.2,
      granularMutation: 1.15,
      bufferGlitch: 1.05,
      spectralDecay: 0.95,
      pitchInstability: 1.1,
      textureEngine: 0.85,
    },
  ),
  generic: profile(
    'generic',
    'Generic',
    'Balanced organic degradation across all modules.',
    {},
  ),
};

/** Map preset id / category to a mold profile. */
const PRESET_PROFILE_MAP: Record<string, string> = {
  plantasonic: 'plantasonic',
  bloom: 'bloom',
  root: 'roots',
  'juno-flowers': 'plantasonic',
  coral: 'rainforest',
  mycelium: 'rainforest',
  crystal: 'winter',
  mutation: 'night-bloom',
  fern: 'bloom',
  vine: 'roots',
  seed: 'generic',
};

export function resolveMoldProfile(preset?: PlantasiaPreset | null): MoldProfile {
  if (!preset) {
    return MOLD_PROFILES.generic;
  }

  const explicit = preset.moldProfile;
  if (explicit && MOLD_PROFILES[explicit]) {
    return MOLD_PROFILES[explicit];
  }

  const mapped = PRESET_PROFILE_MAP[preset.id];
  if (mapped && MOLD_PROFILES[mapped]) {
    return MOLD_PROFILES[mapped];
  }

  if (preset.category === 'signature') {
    return MOLD_PROFILES.plantasonic;
  }

  return MOLD_PROFILES.generic;
}

let activeMoldProfile: MoldProfile = MOLD_PROFILES.generic;

export function getActiveMoldProfile(): MoldProfile {
  return activeMoldProfile;
}

export function setActiveMoldProfile(preset: PlantasiaPreset): MoldProfile {
  activeMoldProfile = resolveMoldProfile(preset);
  return activeMoldProfile;
}
