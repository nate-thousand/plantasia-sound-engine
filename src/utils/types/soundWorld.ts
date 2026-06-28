/** Live keyboard/MIDI audio graph routing for a Sound World. */
export type LiveVoiceRouting = 'plantasonic' | 'botanical' | 'standard';

/** Visual identity for a Sound World — consumed by host apps for ASCII rendering. */
export type PresetVisualConfig = {
  /** Theme template key (e.g. moss, canopy, night-bloom). */
  asciiTheme?: string;
  /** Motion style identifier matching host theme registry. */
  motionStyle?: string;
  /** Hex color palette for ASCII rendering. */
  colorPalette?: string[];
  /** Overall visual density / contrast scale (0–1). */
  visualIntensity?: number;
  /** Optional artwork reference (URL or asset id). */
  artwork?: string;
  /** Animation tempo hint. */
  animationStyle?: 'slow' | 'normal' | 'fast';
};

/** Per-preset MIDI performance defaults (0–127 unless noted). */
export type PresetMidiConfig = {
  /** MIDI program change slot when host maps PC → preset. */
  program?: number;
  /** Default mod wheel position. */
  modWheel?: number;
  /** Default expression (CC 11) position. */
  expression?: number;
  /** Pitch bend range in semitones. */
  pitchBendRange?: number;
  /** Velocity response character. */
  velocityCurve?: 'soft' | 'normal' | 'bright';
};

/** Intentional macro defaults for a Sound World (0–100). */
export type PresetControlDefaults = {
  mold?: number;
  tone?: number;
  texture?: number;
  bloom?: number;
  growthRate?: number;
  drift?: number;
  mutation?: number;
  energy?: number;
};

export type SoundWorldControlSurface = {
  mold: number;
  tone: number;
  texture: number;
  bloom: number;
  growthRate: number;
  drift: number;
  mutation: number;
  energy: number;
};
