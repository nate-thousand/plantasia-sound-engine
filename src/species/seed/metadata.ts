import type { EcologicalControl, SoundWorldMetadata } from '../../engine/SoundWorld.js';
import type { GenerativePreferences } from '../../engine/generative/types.js';

/** Default transport tempo for Seed generative patterns (BPM). */
export const SEED_DEFAULT_TEMPO = 72;

/**
 * Pentatonic scale derived from the Plantasonic flagship preset.
 * C major pentatonic spanning two octaves.
 */
export const SEED_DEFAULT_SCALE = [
  'C4',
  'D4',
  'E4',
  'G4',
  'A4',
  'C5',
  'D5',
  'E5',
] as const;

/** Ecological controls supported by Seed. */
export const SEED_SUPPORTED_CONTROLS: readonly EcologicalControl[] = [
  'growth',
  'bloom',
  'roots',
  'mold',
  'bacteria',
] as const;

export const SEED_SOUND_WORLD_METADATA: SoundWorldMetadata = {
  id: 'seed',
  name: 'Seed',
  concept: 'Birth, first growth, Plantasonic / Plantasia inspiration',
  description:
    'The reference Sound World — warm organic PolySynth voices with gentle tape color, subtle chorus, and pentatonic generative motion. Migrated from the Plantasonic flagship character.',
  inspiration: ['Plantasonic', 'Plantasia', 'analog polyphony'],
  character: ['warm', 'organic', 'gentle', 'analog', 'melodic'],
};

export const SEED_GENERATIVE_PREFERENCES: GenerativePreferences = {
  preferredScale: SEED_DEFAULT_SCALE,
  preferredTempo: SEED_DEFAULT_TEMPO,
  preferredDensity: 0.42,
  phraseLength: 4,
  probabilityBias: 0.38,
  dronePreference: 0.12,
  harmonyStyle: 'pentatonic',
  rhythmStyle: 'moderate',
};
