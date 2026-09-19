import { getPresetById } from '../presets/loader.js';
import { resolvePresetId } from '../presets/aliases.js';
import { getPresetControls } from '../presets/controlDefaults.js';
import type { SoundWorldControlSurface } from '../utils/types/soundWorld.js';
import type { EcologyControlState } from './EcologyControls.js';
import { fromSpeciesControlValue } from './EcologyControls.js';
import type { SpeciesId } from './SoundWorld.js';

/** Engine-owned v1 preset id → v2 species mapping. */
export const PRESET_SPECIES_MAP: Readonly<Record<string, SpeciesId>> = {
  plantasonic: 'seed',
  seed: 'seed',
  root: 'seed',
  coral: 'seed',
  bloom: 'flowers',
  fern: 'flowers',
  'juno-flowers': 'flowers',
  vine: 'mold',
  crystal: 'mold',
  mutation: 'mold',
  mycelium: 'bacteria',
};

export type PresetSpeciesResolution = {
  /** Canonical preset id after alias resolution. */
  presetId: string;
  speciesId: SpeciesId;
  /** Normalized ecological controls (0–1) derived from preset defaults. */
  ecology: EcologyControlState;
};

function toNormalized(value: number): number {
  return fromSpeciesControlValue(value);
}

/** Map v1 preset control surface (0–100) to v2 ecological controls (0–1). */
export function presetControlsToEcology(controls: SoundWorldControlSurface): EcologyControlState {
  const bloom = controls.bloom * 0.65 + controls.energy * 0.35;
  const roots = controls.drift * 0.55 + controls.texture * 0.45;

  return {
    growth: toNormalized(controls.growthRate),
    bloom: toNormalized(bloom),
    roots: toNormalized(roots),
    mold: toNormalized(controls.mold),
    bacteria: toNormalized(controls.mutation),
  };
}

/**
 * Resolve a legacy preset id (or alias) into a v2 species and ecology state.
 * @throws Error when preset or mapping is unknown
 */
export function resolvePresetToSpecies(presetId: string): PresetSpeciesResolution {
  const canonicalId = resolvePresetId(presetId);
  const speciesId = PRESET_SPECIES_MAP[canonicalId];

  if (!speciesId) {
    throw new Error(`No v2 species mapping for preset "${presetId}" (resolved: "${canonicalId}")`);
  }

  const preset = getPresetById(canonicalId);
  if (!preset) {
    throw new Error(`Preset not found: "${canonicalId}"`);
  }

  return {
    presetId: canonicalId,
    speciesId,
    ecology: presetControlsToEcology(getPresetControls(preset)),
  };
}
