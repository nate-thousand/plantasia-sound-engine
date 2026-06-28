import type { OrganismState, SpeciesName } from './botanical.js';
import type { JunoBotanicalConfig, JunoGrowthConfig } from './junoFlowers.js';
import type { PlantasonicConfig } from './plantasonic.js';
import type {
  LiveVoiceRouting,
  PresetControlDefaults,
  PresetMidiConfig,
  PresetVisualConfig,
} from './soundWorld.js';

export type {
  LiveVoiceRouting,
  PresetControlDefaults,
  PresetMidiConfig,
  PresetVisualConfig,
  SoundWorldControlSurface,
} from './soundWorld.js';

export type SynthSettings = {
  oscillator: 'sine' | 'triangle' | 'sawtooth' | 'square';
  filterHz: number;
  filterQ?: number;
  filterType?: 'lowpass' | 'highpass' | 'bandpass';
  envelope: {
    attack: number;
    release: number;
  };
  effects: {
    delay: number;
    reverb: number;
    echo?: number;
  };
  /** Analog detune spread in cents (maps to multi-oscillator spread). */
  detuneCents?: number[];
  /** Slow oscillator drift amount (0–1). */
  drift?: number;
  /** Chorus wet mix (0–1). */
  chorus?: number;
  /** Analog saturation amount (0–1). */
  saturation?: number;
  /** Stereo width (0–1). */
  stereoWidth?: number;
  /** Sub/root layer amount (0–1). */
  subAmount?: number;
  /** High-frequency rolloff ceiling in Hz. */
  hfRolloff?: number;
};

export type PlantasiaPreset = {
  id: string;
  name: string;
  species: SpeciesName;
  description: string;
  mood: string;
  asciiState: OrganismState;
  /** Manifest category (signature, soundWorlds, ambient, textures, …). */
  category?: string;
  /** Explicit taxonomy tags for UI and discovery. */
  tags?: string[];
  synth: SynthSettings;
  /** Optional scale frequencies (Hz) for species-aware apps. */
  scale?: number[];
  /** Juno Flowers botanical routing (Morning Mist, Roots, Pollen, etc.). */
  botanical?: JunoBotanicalConfig;
  /** Hold-time growth/bloom behavior metadata. */
  growth?: JunoGrowthConfig;
  /** Plantasonic flagship sound-world routing. */
  plantasonic?: PlantasonicConfig;
  /** Explicit live-voice routing; inferred from blocks when omitted. */
  routing?: LiveVoiceRouting;
  /** Sound World visual identity — ASCII theme, palette, motion. */
  visual?: PresetVisualConfig;
  /** Per-preset MIDI performance defaults. */
  midi?: PresetMidiConfig;
  /** Intentional macro defaults for all creative controls. */
  controls?: PresetControlDefaults;
  /** Optional mold personality override (see MOLD_PROFILES). */
  moldProfile?: string;
};
