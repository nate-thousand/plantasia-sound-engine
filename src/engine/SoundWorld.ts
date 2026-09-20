/** Unique identifier for a registered Sound World. Open string — plugins define their own IDs. */
export type SpeciesId = string;

export type EcologicalControl =
  | 'growth'
  | 'bloom'
  | 'roots'
  | 'mold'
  | 'bacteria';

/** Lifecycle status for registered species. */
export const ECOLOGICAL_CONTROLS_LIST: readonly EcologicalControl[] = [
  'growth',
  'bloom',
  'roots',
  'mold',
  'bacteria',
] as const;

export interface SoundWorldMetadata {
  id: SpeciesId;
  name: string;
  concept: string;
  description: string;
  inspiration: string[];
  character: string[];
  /** Semantic version or milestone tag for the species plugin. */
  version?: string;
}

import type { SpeciesModulationFrame } from './modulation/types.js';
import type { GenerativePreferences } from './generative/types.js';

/** Options for {@link SoundWorld.start}. */
export interface SoundWorldStartOptions {
  /**
   * Start the species' generative system. Default true. Pass false for a
   * played instrument: the audio graph runs and `noteOn` works, nothing
   * plays on its own.
   */
  generative?: boolean;
}

export interface SoundWorld {
  metadata: SoundWorldMetadata;

  initialize(context: unknown): Promise<void> | void;
  /** May be async while the audio graph unlocks and starts generative systems. */
  start(options?: SoundWorldStartOptions): void | Promise<void>;
  stop(): void;

  noteOn(note: string, velocity?: number): void;
  noteOff(note: string): void;
  allNotesOff(): void;

  setControl(control: EcologicalControl, value: number): void;

  /**
   * Optional (1.1). Called at 30 Hz while modulation routes exist with the
   * modulated control values (0..100) and performance target offsets. A
   * species applies them with the frame's ramp; one more frame with the
   * unmodulated controls arrives when the last route is removed. Species
   * without this method are unaffected by modulation.
   */
  applyModulation?(frame: SpeciesModulationFrame): void;

  /**
   * Optional (1.1). Merge host preferences over the species' own generative
   * defaults. Species with a `Generator` forward to `Generator.setPreferences`.
   */
  setGenerativePreferences?(partial: Partial<GenerativePreferences>): void;
  /** Optional (1.1). Effective generative preferences after host overrides. */
  getGenerativePreferences?(): Readonly<GenerativePreferences>;

  dispose(): void;
}

/** Well-known active species IDs shipped with the engine. */
export const BUILTIN_ACTIVE_SPECIES = ['seed', 'flowers', 'mold', 'bacteria'] as const;

export type BuiltinActiveSpeciesId = (typeof BUILTIN_ACTIVE_SPECIES)[number];

