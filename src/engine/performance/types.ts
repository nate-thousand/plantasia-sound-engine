import type { EcologyControlState } from '../EcologyControls.js';
import type { SpeciesId } from '../SoundWorld.js';

export type PerformanceCharacter =
  | 'gentle'
  | 'musical'
  | 'warm'
  | 'organic'
  | 'dramatic'
  | 'blooming'
  | 'wide'
  | 'unstable'
  | 'corrupting'
  | 'swarming'
  | 'microscopic';

/** Per-species weighting for velocity → target mapping. */
export type VelocityWeights = {
  filterCutoff: number;
  attack: number;
  release: number;
  brightness: number;
  chorusDepth: number;
  reverbWet: number;
  saturation: number;
  oscBlend: number;
};

/** Per-species weighting for density → target mapping. */
export type DensityWeights = {
  filterOpen: number;
  stereoWidth: number;
  instability: number;
  particleRate: number;
  phraseActivity: number;
};

/** Per-species weighting for ecological macros → targets. */
export type MacroWeights = {
  growth: Partial<PerformanceTargetWeights>;
  bloom: Partial<PerformanceTargetWeights>;
  roots: Partial<PerformanceTargetWeights>;
  mold: Partial<PerformanceTargetWeights>;
  bacteria: Partial<PerformanceTargetWeights>;
};

export type PerformanceTargetWeights = {
  filterCutoffMult: number;
  attackMult: number;
  releaseMult: number;
  brightnessAdd: number;
  chorusDepthMult: number;
  reverbWetAdd: number;
  saturationAdd: number;
  oscBlendAdd: number;
  stereoWidthMult: number;
  instabilityAdd: number;
  particleRateMult: number;
  generativeDensityAdd: number;
};

/** Routed expressive targets — species apply these to synth/effects. */
export type PerformanceTargets = {
  filterCutoffMult: number;
  attackMult: number;
  releaseMult: number;
  brightnessAdd: number;
  chorusDepthMult: number;
  reverbWetAdd: number;
  saturationAdd: number;
  oscBlendAdd: number;
  stereoWidthMult: number;
  instabilityAdd: number;
  particleRateMult: number;
  generativeDensityAdd: number;
  noteVelocityScale: number;
  legato: boolean;
};

export const NEUTRAL_PERFORMANCE_TARGETS: PerformanceTargets = {
  filterCutoffMult: 1,
  attackMult: 1,
  releaseMult: 1,
  brightnessAdd: 0,
  chorusDepthMult: 1,
  reverbWetAdd: 0,
  saturationAdd: 0,
  oscBlendAdd: 0,
  stereoWidthMult: 1,
  instabilityAdd: 0,
  particleRateMult: 1,
  generativeDensityAdd: 0,
  noteVelocityScale: 1,
  legato: false,
};

export type ExpressionProfile = {
  id: SpeciesId;
  character: PerformanceCharacter[];
  velocity: VelocityWeights;
  density: DensityWeights;
  macros: MacroWeights;
  /** Overall expressiveness 0–1. */
  sensitivity: number;
};

export type DensityState = {
  activeNotes: number;
  averageDensity: number;
  phraseActivity: number;
  harmonicActivity: number;
  droneActivity: number;
  generativeEvents: number;
};

export type ExpressionSources = {
  velocity: number;
  lastNoteVelocity: number;
  ecology: EcologyControlState;
  density: DensityState;
  legato: boolean;
  staccato: boolean;
  chordHeld: boolean;
};

export function clampPerformance(value: number, min = 0, max = 2): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}
