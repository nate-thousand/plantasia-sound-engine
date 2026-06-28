import type { EcologyControlState } from '../EcologyControls.js';

export type HarmonyStyle = 'pentatonic' | 'major' | 'minor' | 'modal' | 'drone';

export type RhythmStyle = 'sparse' | 'moderate' | 'flowing' | 'swarm' | 'atmospheric';

/** Musical preferences supplied by each Sound World species. */
export interface GenerativePreferences {
  preferredScale: readonly string[];
  alternateScale?: readonly string[];
  preferredTempo: number;
  /** Baseline event density 0–1. */
  preferredDensity: number;
  /** Typical phrase length in notes (2–8). */
  phraseLength: number;
  /** Baseline trigger bias 0–1. */
  probabilityBias: number;
  /** Inclination toward sustained drones 0–1. */
  dronePreference: number;
  harmonyStyle: HarmonyStyle;
  rhythmStyle: RhythmStyle;
  chordVoicings?: readonly (readonly string[])[];
}

export type GenerativeEcology = EcologyControlState;

export type GenerativeEventKind =
  | 'phrase'
  | 'chord'
  | 'drone'
  | 'ornament'
  | 'particle'
  | 'glitch'
  | 'silence';

export interface GenerativeNoteEmit {
  note: string;
  velocity: number;
  holdMs: number;
  kind: GenerativeEventKind;
  delayMs?: number;
}

export interface GenerativeCallbacks {
  noteOn: (note: string, velocity: number) => void;
  noteOff: (note: string) => void;
  onGlitch?: (intensity: number) => void;
  onGeneratorEvent?: (payload: {
    kind: GenerativeEventKind;
    note?: string;
    velocity?: number;
    intensity?: number;
  }) => void;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

/** Simple note transpose by semitones — no Tone.js dependency. */
export function transposeNote(note: string, semitones: number): string {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(note);
  if (!match) {
    return note;
  }
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatMap: Record<string, string> = {
    Cb: 'B',
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
  };
  let name = match[1]!.toUpperCase() + (match[2] ?? '');
  if (flatMap[name]) {
    name = flatMap[name]!;
  }
  const octave = Number(match[3]);
  let idx = names.indexOf(name);
  if (idx < 0) {
    return note;
  }
  const midi = idx + (octave + 1) * 12 + semitones;
  const nextIdx = ((midi % 12) + 12) % 12;
  const nextOct = Math.floor(midi / 12) - 1;
  return `${names[nextIdx]}${nextOct}`;
}
