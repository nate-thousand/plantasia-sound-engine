import { initialBotanicalControls } from '../utils/types/botanical.js';
import type { PlantasiaPreset } from '../utils/types/presets.js';
import type { SoundWorldControlSurface } from '../utils/types/soundWorld.js';

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function readControl(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clamp(value);
  }
  return null;
}

/** Read the Mold default for a preset (0–100). */
export function getPresetMold(preset: PlantasiaPreset): number {
  return readControl(preset.controls?.mold) ?? initialBotanicalControls.mold;
}

/** Derive fallback controls from synth settings when explicit defaults are absent. */
function deriveControlsFromSynth(preset: PlantasiaPreset): SoundWorldControlSurface {
  const synth = preset.synth;
  const tone = clamp(((synth.filterQ ?? 1) - 0.2) / 18 * 100);
  const texture = clamp((synth.filterHz - 150) / 8500 * 100);
  const bloom = clamp(((synth.effects.delay + synth.effects.reverb) / 1.3) * 100);
  const mold = getPresetMold(preset);
  const attack = synth.envelope.attack;
  const growthRate = clamp((1 - (attack - 0.02) / 0.6) * 100);
  const drift = clamp((synth.drift ?? 0.3) * 100);

  let mutation = 20;
  if (preset.asciiState === 'mutation') {
    mutation = 55;
  } else if (preset.species === 'Crystal') {
    mutation = 35;
  } else if (preset.id === 'mycelium') {
    mutation = 28;
  }

  const release = synth.envelope.release;
  const energy = clamp(Math.min(1, release / 4) * 60 + (synth.effects.reverb > 0.5 ? 25 : 10));

  return { mold, tone, texture, bloom, growthRate, drift, mutation, energy };
}

/**
 * Resolve the full control surface for a Sound World.
 * Explicit `controls` in preset JSON take precedence over synth-derived values.
 */
export function getPresetControls(preset: PlantasiaPreset): SoundWorldControlSurface {
  const derived = deriveControlsFromSynth(preset);
  const controls = preset.controls ?? {};

  return {
    mold: readControl(controls.mold) ?? derived.mold,
    tone: readControl(controls.tone) ?? derived.tone,
    texture: readControl(controls.texture) ?? derived.texture,
    bloom: readControl(controls.bloom) ?? derived.bloom,
    growthRate: readControl(controls.growthRate) ?? derived.growthRate,
    drift: readControl(controls.drift) ?? derived.drift,
    mutation: readControl(controls.mutation) ?? derived.mutation,
    energy: readControl(controls.energy) ?? derived.energy,
  };
}
