/** Internal degradation module identifiers. */
export type MoldModuleId =
  | 'tapeWear'
  | 'harmonicDistortion'
  | 'delayCorruption'
  | 'granularMutation'
  | 'bufferGlitch'
  | 'spectralDecay'
  | 'pitchInstability'
  | 'textureEngine';

/** Multi-stage mold behavior bands. */
export type MoldStageId = 'aging' | 'decay' | 'mutation' | 'corruption' | 'overgrowth';

/** Per-module weighting for a Sound World mold personality. */
export type MoldModuleWeights = Record<MoldModuleId, number>;

/** Preset-specific mold personality — scales internal modules, not the public API. */
export type MoldProfile = {
  id: string;
  label: string;
  description: string;
  weights: MoldModuleWeights;
};

/** Resolved mold macro targets from all degradation modules. */
export type MoldEffectParams = {
  intensity: number;
  stages: Record<MoldStageId, number>;

  tapeWear: number;
  wowDepth: number;
  flutterDepth: number;
  saturation: number;

  harmonicDistortion: number;
  crackle: number;

  delayFeedbackBoost: number;
  delayInstability: number;
  delayBloom: number;
  reverseEcho: number;

  grainDensity: number;
  reverseGrains: number;
  microStutter: number;
  bufferRepeat: number;

  glitchBurst: number;
  tapeChew: number;
  bufferScramble: number;

  bitDepth: number;
  sampleRateReduction: number;
  spectralSmear: number;
  ringMod: number;

  pitchDriftCents: number;
  pitchSlip: number;
  randomPitchOffset: number;
  dropoutProbability: number;

  textureCrackle: number;
  textureAir: number;

  filterInstability: number;
  modulationDepth: number;
  stereoInstability: number;
  selfOscDelay: number;
  harmonicBloom: number;
};

export type EngineParameterMeta = {
  id: string;
  name: string;
  description: string;
  min: number;
  max: number;
  defaultValue: number;
  automatable: boolean;
  midiLearn: boolean;
};
