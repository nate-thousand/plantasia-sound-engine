/** Unique identifier for a registered Sound World. Open string — plugins define their own IDs. */
export type SpeciesId = string;

export type EcologicalControl =
  | 'growth'
  | 'bloom'
  | 'roots'
  | 'mold'
  | 'bacteria';

/** Lifecycle status for registered species. */
export type SpeciesStatus = 'active' | 'coming_soon' | 'disabled';

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
  /** Defaults to `active` when omitted. */
  status?: SpeciesStatus;
  /** Semantic version or milestone tag for the species plugin. */
  version?: string;
}

export interface SoundWorld {
  metadata: SoundWorldMetadata;

  initialize(context: unknown): Promise<void> | void;
  /** May be async while the audio graph unlocks and starts generative systems. */
  start(): void | Promise<void>;
  stop(): void;

  noteOn(note: string, velocity?: number): void;
  noteOff(note: string): void;
  allNotesOff(): void;

  setControl(control: EcologicalControl, value: number): void;

  dispose(): void;
}

/** Well-known active species IDs shipped with the engine. */
export const BUILTIN_ACTIVE_SPECIES = ['seed', 'flowers', 'mold', 'bacteria'] as const;

export type BuiltinActiveSpeciesId = (typeof BUILTIN_ACTIVE_SPECIES)[number];

export function isSpeciesLoadable(metadata: SoundWorldMetadata): boolean {
  return (metadata.status ?? 'active') === 'active';
}
