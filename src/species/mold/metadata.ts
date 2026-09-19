import type { EcologicalControl, SoundWorldMetadata } from '../../engine/SoundWorld.js';
import type { GenerativePreferences } from '../../engine/generative/types.js';

/** Slow transport tempo for atmospheric texture generation (BPM). */
export const MOLD_DEFAULT_TEMPO = 48;

/**
 * Sparse modal palette for drones and decay clusters.
 * Minor-ish intervals with room for harmonic ambiguity.
 */
export const MOLD_DEFAULT_SCALE = [
  'C2',
  'D2',
  'Eb2',
  'G2',
  'Bb2',
  'C3',
  'Eb3',
  'G3',
  'Bb3',
  'C4',
  'Eb4',
  'G4',
] as const;

/** Sparse cluster voicings — atmosphere, not melody. */
export const MOLD_CLUSTER_VOICINGS = [
  ['C3', 'Eb3', 'G3'],
  ['Bb2', 'F3', 'Ab3'],
  ['G2', 'C3', 'D3'],
  ['Eb3', 'G3', 'Bb3'],
] as const;

export const MOLD_SUPPORTED_CONTROLS: readonly EcologicalControl[] = [
  'growth',
  'bloom',
  'roots',
  'mold',
  'bacteria',
] as const;

/**
 * Mold — decay, decomposition, memory, transformation.
 *
 * ## Concept
 * Natural decomposition made audible. Not darkness for its own sake — the beauty
 * of material slowly returning to texture, air, and memory.
 *
 * ## Inspiration
 * Haunting ambient tape processes, slow-evolving atmospheres, and the engine's
 * living degradation macro — original sound world, not an artist recreation.
 *
 * ## Sonic character
 * Decaying, organic, textured, fragile, haunted, slow, unpredictable,
 * beautifully imperfect.
 *
 * ## Primary oscillators
 * - Brown / pink noise bed
 * - Sine drones (long attack, very long release)
 * - Soft FM textures (`PolySynth` + `FMSynth`)
 * - Filtered triangle harmonic voices
 *
 * ## Primary effects
 * Tape saturation, wow/flutter (`Vibrato` + LFO-modulated delay time),
 * feedback delay, comb filtering, band-pass filtering, soft distortion,
 * subtle bit reduction, long evolving reverb, stereo drift.
 *
 * ## Ecological control mapping
 * | Control | Mold mapping |
 * |---------|--------------|
 * | growth | Texture layers, harmonic density, additional drones |
 * | bloom | Shimmer, brighter overtones, spatial effects, reverb |
 * | roots | Deepens drones, lowers tonal center, low resonances |
 * | mold | Tape wear, flutter, feedback, distortion, sonic decay |
 * | bacteria | Random clicks, microscopic glitches, granular artifacts |
 *
 * ## Future expansion
 * - Sample playback layer (field recordings, degraded loops)
 * - Granular cloud engine for texture swarms
 * - Shared `src/mold/` macro integration for cross-species degradation
 * - Reverse buffer playback for ghost echoes
 * - Bundled preset alignment: `vine`, `crystal`, `mutation`
 */
export const MOLD_SOUND_WORLD_METADATA: SoundWorldMetadata = {
  id: 'mold',
  name: 'Mold',
  concept: 'Decay, decomposition, memory, transformation',
  description:
    'Evolving atmospheres of organic degradation — sine drones, soft FM haze, noise beds, and a continuously modulated effects chain that ages in real time.',
  inspiration: [
    'haunting ambient tape',
    'slow-evolving atmospheres',
    'living degradation',
    'natural decomposition',
  ],
  character: [
    'decaying',
    'organic',
    'textured',
    'fragile',
    'haunted',
    'slow',
    'unpredictable',
    'beautifully imperfect',
  ],
};

export const MOLD_GENERATIVE_PREFERENCES: GenerativePreferences = {
  preferredScale: MOLD_DEFAULT_SCALE,
  preferredTempo: MOLD_DEFAULT_TEMPO,
  preferredDensity: 0.22,
  phraseLength: 3,
  probabilityBias: 0.28,
  dronePreference: 0.72,
  harmonyStyle: 'modal',
  rhythmStyle: 'atmospheric',
  chordVoicings: MOLD_CLUSTER_VOICINGS,
};
