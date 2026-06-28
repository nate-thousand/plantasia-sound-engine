/** Dual-oscillator configuration for Plantasonic (saw + triangle). */
export type PlantasonicOscConfig = {
  oscA: 'saw' | 'sawtooth';
  oscB: 'triangle';
  /** Detune spread in cents between oscillators (typically 3–8). */
  detuneCents: [number, number];
  /** Slow analog drift amount (0–1). */
  drift: number;
  /** Optional sub-oscillator level (0–1). */
  subAmount: number;
};

/** 24 dB ladder-style lowpass filter. */
export type PlantasonicFilterConfig = {
  cutoffHz: number;
  /** Low resonance — filter softens rather than rings. */
  resonance: number;
  /** Envelope modulation depth (0–1). */
  envModDepth: number;
  /** Keyboard tracking amount (0–1). */
  tracking: number;
};

/** Full ADSR envelope for natural bloom and decay. */
export type PlantasonicEnvelopeConfig = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

/** Slow organic modulation — alive, not rhythmic. */
export type PlantasonicModulationConfig = {
  pitchDrift: number;
  filterMovement: number;
  stereoMovement: number;
  amplitudeVariation: number;
  /** Very low frequency modulation rate in Hz. */
  vlfRate: number;
};

/** Built-in effects chain (saturation → chorus → delay → reverb → compression → width). */
export type PlantasonicEffectsConfig = {
  saturation: number;
  chorus: { depth: number; rate: number; width: number };
  delay: { time: number; feedback: number; mix: number };
  reverb: { decay: number; mix: number; size: number };
  compression: { threshold: number; ratio: number };
  stereoWidth: number;
};

/** Subtle texture layer beneath the synth voice. */
export type PlantasonicTextureConfig = {
  pinkNoise: number;
  tapeHiss: number;
  air: number;
  ambience: number;
};

/** MIDI performance controller mappings. */
export type PlantasonicPerformanceConfig = {
  velocityBrightness: number;
  growth: {
    filterOpen: number;
    chorusDepth: number;
    reverbAmount: number;
    stereoWidth: number;
    harmonicRichness: number;
  };
  aftertouch: { filterOpen: number; modDepth: number };
  expression: { ambience: number };
};

/** Hold-time living evolution — sustained notes never stay static. */
export type PlantasonicEvolutionConfig = {
  speed: number;
  harmonicBloom: number;
  stereoWiden: number;
  filterShift: number;
  chorusDeepen: number;
  reverbExpand: number;
  modVariation: number;
};

/** Complete Plantasonic sound-world configuration. */
export type PlantasonicConfig = {
  oscillators: PlantasonicOscConfig;
  filter: PlantasonicFilterConfig;
  envelope: PlantasonicEnvelopeConfig;
  modulation: PlantasonicModulationConfig;
  effects: PlantasonicEffectsConfig;
  texture: PlantasonicTextureConfig;
  performance: PlantasonicPerformanceConfig;
  evolution: PlantasonicEvolutionConfig;
};
