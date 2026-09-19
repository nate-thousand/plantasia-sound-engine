/**
 * Modulation types (ROADMAP decisions for 1.1.0).
 *
 * Sources are plain descriptors the engine instantiates. Destinations are
 * the five ecology controls or `target:<PerformanceTargets key>`. Depth is
 * -1..1. Controls modulate as `clamp01(base + depth × source)`; targets as
 * `depth × source × span` added to the routed target value.
 */
import type { EcologicalControl } from '../SoundWorld.js';
import type { EcologyControlState } from '../EcologyControls.js';
import type { PerformanceTargets } from '../performance/types.js';

export type LfoShape = 'sine' | 'triangle' | 'square' | 'saw';
export type FollowerBand = 'rms' | 'bass' | 'mid' | 'high';

/** Rate for periodic sources: free running in Hz, or beats synced to the transport BPM. */
export type ModulationRate = { hz: number; beats?: undefined } | { beats: number; hz?: undefined };

type WithId = { id?: string };

export type LfoSourceDescriptor = WithId &
  ModulationRate & {
    type: 'lfo';
    shape?: LfoShape;
    /** Rise from the base (0..1) instead of swinging around it (-1..1). */
    unipolar?: boolean;
    /** Starting phase 0..1. */
    phase?: number;
  };

export type SampleHoldSourceDescriptor = WithId &
  ModulationRate & {
    type: 'sample-hold';
    /** Seconds to glide to each new value. 0 steps. */
    slew?: number;
  };

export type FollowerSourceDescriptor = WithId & {
  type: 'follower';
  /** Which master bus feature to follow. Default rms. */
  band?: FollowerBand;
  /** Attack and release in seconds. */
  attack?: number;
  release?: number;
};

export type MidiCcSourceDescriptor = WithId & {
  type: 'midi-cc';
  cc: number;
  channel?: number;
};

export type MidiAftertouchSourceDescriptor = WithId & {
  type: 'midi-aftertouch';
  channel?: number;
};

export type MidiBendSourceDescriptor = WithId & {
  type: 'midi-bend';
  channel?: number;
};

export type ModulationSourceDescriptor =
  | LfoSourceDescriptor
  | SampleHoldSourceDescriptor
  | FollowerSourceDescriptor
  | MidiCcSourceDescriptor
  | MidiAftertouchSourceDescriptor
  | MidiBendSourceDescriptor;

export type ModulationSourceType = ModulationSourceDescriptor['type'];

/** Numeric performance targets a route may address. `legato` is not one. */
export type ModulatableTarget = Exclude<keyof PerformanceTargets, 'legato'>;

export const MODULATABLE_TARGETS: readonly ModulatableTarget[] = [
  'filterCutoffMult',
  'attackMult',
  'releaseMult',
  'brightnessAdd',
  'chorusDepthMult',
  'reverbWetAdd',
  'saturationAdd',
  'oscBlendAdd',
  'stereoWidthMult',
  'instabilityAdd',
  'particleRateMult',
  'generativeDensityAdd',
  'noteVelocityScale',
] as const;

/**
 * How far depth 1 moves each target. Multipliers are around 1 (0.5 means
 * ×0.5 to ×1.5); adders are around 0. Tuned by ear in the demo (decision 6).
 */
export const MODULATION_TARGET_SPANS: Readonly<Record<ModulatableTarget, number>> = {
  filterCutoffMult: 0.5,
  attackMult: 0.75,
  releaseMult: 0.75,
  brightnessAdd: 0.5,
  chorusDepthMult: 0.5,
  reverbWetAdd: 0.3,
  saturationAdd: 0.4,
  oscBlendAdd: 0.5,
  stereoWidthMult: 0.5,
  instabilityAdd: 0.5,
  particleRateMult: 0.75,
  generativeDensityAdd: 0.4,
  noteVelocityScale: 0.5,
};

export type TargetDestination = `target:${ModulatableTarget}`;
export type ModulationDestination = EcologicalControl | TargetDestination;

export type ModulationRouteConfig = {
  id: string;
  source: ModulationSourceDescriptor;
  destination: ModulationDestination;
  depth: number;
};

/** What `modulate()` returns: a handle on one route. */
export interface ModulationRoute {
  readonly id: string;
  /** Change depth, destination, or source fields (same source id, updated descriptor). */
  set(partial: Partial<Omit<ModulationRouteConfig, 'id'>>): void;
  remove(): void;
}

export type ModulationSourceState = {
  type: ModulationSourceType;
  /** Current output, 0..1 or -1..1 by polarity. */
  value: number;
  /** False while the source has nothing to read (MIDI before enableMidi). */
  active: boolean;
};

/** Snapshot for per frame polling, like `getAudioFeatures()`. */
export type ModulationState = {
  time: number;
  sources: Record<string, ModulationSourceState>;
  controls: Record<EcologicalControl, { base: number; modulated: number }>;
  targets: Partial<Record<ModulatableTarget, number>>;
  routes: ModulationRouteConfig[];
};

/**
 * What the engine hands a species each tick through
 * `SoundWorld.applyModulation`. Controls are on the species scale (0..100),
 * already modulated; targets are offsets to add to the routed targets.
 */
export type SpeciesModulationFrame = {
  controls: Record<EcologicalControl, number>;
  targets: Partial<Record<ModulatableTarget, number>>;
  /** Seconds a species should ramp its parameters over. One tick. */
  rampSec: number;
  /** Routes in effect. 0 marks the clearing frame; the species drops its held frame. */
  routes: number;
};

/** Internal frame on the normalised scale before conversion. */
export type ModulationFrame = {
  controls: EcologyControlState;
  targets: Partial<Record<ModulatableTarget, number>>;
  routes: number;
};

/** Ticks per second for the modulation engine (decision 7). */
export const MODULATION_TICK_HZ = 30;
export const MODULATION_TICK_MS = 1000 / MODULATION_TICK_HZ;
export const MODULATION_RAMP_SEC = MODULATION_TICK_MS / 1000;
