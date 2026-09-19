import type { EcologicalControl, SoundWorldMetadata } from '../../engine/SoundWorld.js';
import type { GenerativePreferences } from '../../engine/generative/types.js';

/** Default transport tempo for Flowers generative patterns (BPM). */
export const FLOWERS_DEFAULT_TEMPO = 64;

/** Dreamy major palette for chord blooms and arpeggios. */
export const FLOWERS_DEFAULT_SCALE = [
  'C3',
  'D3',
  'E3',
  'G3',
  'A3',
  'C4',
  'D4',
  'E4',
  'G4',
  'A4',
  'B4',
  'C5',
  'E5',
] as const;

/** Chord bloom voicings (note names). */
export const FLOWERS_CHORD_VOICINGS = [
  ['C4', 'E4', 'G4', 'B4'],
  ['A3', 'C4', 'E4', 'G4'],
  ['F3', 'A3', 'C4', 'E4'],
  ['G3', 'B3', 'D4', 'F4'],
] as const;

export const FLOWERS_SUPPORTED_CONTROLS: readonly EcologicalControl[] = [
  'growth',
  'bloom',
  'roots',
  'mold',
  'bacteria',
] as const;

export const FLOWERS_SOUND_WORLD_METADATA: SoundWorldMetadata = {
  id: 'flowers',
  name: 'Flowers',
  concept: 'Bloom, flowering, Juno-inspired synthesis',
  description:
    'Lush harmonic opening — PWM-style pads, wide chorus ensemble, hall reverb, and slow chord blooms inspired by classic Juno polyphony.',
  inspiration: ['Juno-106', 'Juno Flowers', 'Night Bloom'],
  character: ['lush', 'wide', 'soft', 'nostalgic', 'blooming', 'dreamlike', 'harmonic'],
};

export const FLOWERS_GENERATIVE_PREFERENCES: GenerativePreferences = {
  preferredScale: FLOWERS_DEFAULT_SCALE,
  preferredTempo: FLOWERS_DEFAULT_TEMPO,
  preferredDensity: 0.38,
  phraseLength: 5,
  probabilityBias: 0.36,
  dronePreference: 0.22,
  harmonyStyle: 'major',
  rhythmStyle: 'flowing',
  chordVoicings: FLOWERS_CHORD_VOICINGS,
};
