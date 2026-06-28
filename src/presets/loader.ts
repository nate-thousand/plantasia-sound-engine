import type { PlantasiaPreset } from '../utils/types/presets.js';
import defaultManifest from './bundled/default.json' with { type: 'json' };
import plantasonic from './bundled/signature/plantasonic.json' with { type: 'json' };
import seed from './bundled/flora/seed.json' with { type: 'json' };
import root from './bundled/flora/root.json' with { type: 'json' };
import bloom from './bundled/flora/bloom.json' with { type: 'json' };
import fern from './bundled/flora/fern.json' with { type: 'json' };
import vine from './bundled/flora/vine.json' with { type: 'json' };
import junoFlowers from './bundled/flora/juno-flowers.json' with { type: 'json' };
import coral from './bundled/ambient/coral.json' with { type: 'json' };
import mycelium from './bundled/ambient/mycelium.json' with { type: 'json' };
import mutation from './bundled/textures/mutation.json' with { type: 'json' };
import crystal from './bundled/textures/crystal.json' with { type: 'json' };
import { resolvePresetId } from './aliases.js';
import { presetFromJson } from './serialize.js';

/** Preset load order preserved from v0.1.0 for stable behavior. */
const BUILTIN_PRESET_DATA = [
  plantasonic,
  seed,
  root,
  bloom,
  mycelium,
  mutation,
  fern,
  coral,
  vine,
  crystal,
  junoFlowers,
] as const;

/** All built-in presets shipped with the engine. */
export const presets: PlantasiaPreset[] = BUILTIN_PRESET_DATA.map((data) =>
  presetFromJson(data),
);

/** Default manifest describing categories and default preset id. */
export const presetManifest = defaultManifest;

/** Lookup a built-in preset by id or legacy alias (e.g. moss → seed). */
export function getPresetById(id: string): PlantasiaPreset | undefined {
  const canonical = resolvePresetId(id);
  return presets.find((preset) => preset.id === canonical);
}

/** List presets for a category name from the manifest. */
export function getPresetsByCategory(category: keyof typeof defaultManifest.categories): PlantasiaPreset[] {
  const ids = defaultManifest.categories[category] ?? [];
  return ids
    .map((id) => getPresetById(id))
    .filter((preset): preset is PlantasiaPreset => preset != null);
}
