import type { EcologicalControl, SoundWorldMetadata } from '../../engine/SoundWorld.js';
import type { GenerativePreferences } from '../../engine/generative/types.js';

/** Default transport tempo (BPM). */
export const TEMPLATE_DEFAULT_TEMPO = 72;

/** Scale for generative output — pentatonic example. */
export const TEMPLATE_DEFAULT_SCALE = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'] as const;

/** Ecological controls this species responds to. */
export const TEMPLATE_SUPPORTED_CONTROLS: readonly EcologicalControl[] = [
  'growth',
  'bloom',
  'roots',
  'mold',
  'bacteria',
] as const;

/** Public-facing species identity — required for registry validation. */
export const TEMPLATE_SOUND_WORLD_METADATA: SoundWorldMetadata = {
  id: 'template-species',
  name: 'Template Species',
  concept: 'Replace with your Sound World concept',
  description: 'Placeholder description for a new Sound World plugin.',
  inspiration: ['your inspiration here'],
  character: ['character', 'tags'],
  status: 'disabled',
  version: '0.0.0-template',
};

/** Generative composition preferences — used by shared Generator. */
export const TEMPLATE_GENERATIVE_PREFERENCES: GenerativePreferences = {
  preferredScale: TEMPLATE_DEFAULT_SCALE,
  preferredTempo: TEMPLATE_DEFAULT_TEMPO,
  preferredDensity: 0.4,
  phraseLength: 4,
  probabilityBias: 0.35,
  dronePreference: 0.1,
  harmonyStyle: 'pentatonic',
  rhythmStyle: 'moderate',
};
