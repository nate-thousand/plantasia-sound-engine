import type { EcologicalControl, SoundWorldMetadata } from '../../engine/SoundWorld.js';
import type { GenerativePreferences } from '../../engine/generative/types.js';

/** Loose tempo reference for generator timing (BPM) — events are not grid-locked. */
export const BACTERIA_DEFAULT_TEMPO = 88;

/**
 * Microtonal-friendly chromatic pool for random walks and fragments.
 * High register bias — light, invisible, curious.
 */
export const BACTERIA_DEFAULT_SCALE = [
  'C5',
  'D5',
  'Eb5',
  'E5',
  'G5',
  'A5',
  'Bb5',
  'C6',
  'D6',
  'E6',
  'G6',
] as const;

/** Lower pool for roots-driven resonant events. */
export const BACTERIA_ROOTS_SCALE = [
  'C3',
  'Eb3',
  'G3',
  'Bb3',
  'C4',
  'Eb4',
] as const;

export const BACTERIA_SUPPORTED_CONTROLS: readonly EcologicalControl[] = [
  'growth',
  'bloom',
  'roots',
  'mold',
  'bacteria',
] as const;

/**
 * Bacteria — microscopic life, invisible activity, constant motion.
 *
 * ## Concept
 * Life beneath the surface — swarming particles, probability-driven micro-events,
 * and controlled unpredictability. The engine should feel alive, not random.
 *
 * ## Inspiration
 * Granular particles, cellular automata, mycelium networks, ambient ecosystem beds.
 *
 * ## Sonic character
 * Microscopic, curious, swarming, constantly evolving, organic, light, invisible, alive.
 *
 * ## Generator philosophy
 * The generator is the species identity. Probability-based triggering, random walks,
 * particle bursts, micro-fragments, and variable timing ensure sequences never repeat
 * exactly. No obvious melodies, no rhythmic loops — movement emerges naturally.
 *
 * ## Oscillator choices
 * - `NoiseSynth` — transient grain bursts
 * - Small FM voices — curious micro-tones
 * - Short sine blips — tiny tonal particles
 * - `PluckSynth` — filtered impulses / resonator pings
 *
 * ## Effects chain
 * High-pass → gentle saturation → auto-pan → micro ping-pong delay → small room reverb.
 * Delicate — detail must remain audible.
 *
 * ## Ecological control mapping
 * | Control | Bacteria mapping |
 * |---------|------------------|
 * | growth | Event density, simultaneous particles, activity expansion |
 * | bloom | Brighter harmonics, sparkle, resonator tails, stereo width |
 * | roots | Lower resonant events, slower movement, subtle drones |
 * | mold | Instability, corruption, randomness, occasional glitches |
 * | bacteria | **Primary** — particle count, trigger probability, swarm complexity |
 *
 * ## Future expansion
 * - Background ecosystem layer for other species hosts
 * - Spatial particle field (2D swarm positioning)
 * - Sample & Hold modulation via dedicated signal nodes
 * - Bundled preset alignment: `mycelium`, `mutation`
 */
export const BACTERIA_SOUND_WORLD_METADATA: SoundWorldMetadata = {
  id: 'bacteria',
  name: 'Bacteria',
  concept: 'Microscopic life, invisible activity, constant motion, emergence',
  description:
    'Particle swarms and probability-driven micro-events — many small sounds instead of few large ones, always evolving beneath the surface.',
  inspiration: ['granular particles', 'cellular automata', 'mycelium networks', 'ecosystem beds'],
  character: [
    'microscopic',
    'curious',
    'swarming',
    'constantly evolving',
    'organic',
    'light',
    'invisible',
    'alive',
  ],
};

export const BACTERIA_GENERATIVE_PREFERENCES: GenerativePreferences = {
  preferredScale: BACTERIA_DEFAULT_SCALE,
  alternateScale: BACTERIA_ROOTS_SCALE,
  preferredTempo: BACTERIA_DEFAULT_TEMPO,
  preferredDensity: 0.58,
  phraseLength: 3,
  probabilityBias: 0.48,
  dronePreference: 0.08,
  harmonyStyle: 'minor',
  rhythmStyle: 'swarm',
};
