/**
 * Engine snapshots (ROADMAP decisions 13 and 14 after 1.1.0): the whole host
 * facing state as one JSON object, and a timed morph between two of them.
 */
import type { EcologyControlState } from '../EcologyControls.js';
import { ECOLOGICAL_CONTROLS } from '../EcologyControls.js';
import type { GenerativePreferences } from '../generative/types.js';
import type { ModulationRouteConfig } from '../modulation/types.js';
import type { SpeciesId } from '../SoundWorld.js';

export const ENGINE_SNAPSHOT_VERSION = 1 as const;

export type EngineSnapshot = {
  version: typeof ENGINE_SNAPSHOT_VERSION;
  speciesId: SpeciesId;
  /** Host base values, 0..1. Modulation is not baked in. */
  controls: EcologyControlState;
  /** Transport BPM. */
  tempo: number;
  /** Serializable route configs. Ids are informational; `applySnapshot` assigns new ones. */
  routes: ModulationRouteConfig[];
  /** Host generative preference overrides, not the species' effective preferences. */
  preferences: Partial<GenerativePreferences>;
  /** Host voice cap, or null. Optional for snapshots written before 1.2. */
  polyphony?: number | null;
  /** Set when the species was loaded through `loadPreset`. */
  presetId?: string;
};

export type ApplySnapshotOptions = {
  /**
   * Interpolate controls and tempo from the current values to the snapshot's
   * over this many seconds. Routes, preferences, polyphony and the species
   * land at the start. 0 or omitted applies everything now.
   */
  morphSec?: number;
};

export type SnapshotErrorCode = 'UNSUPPORTED_VERSION' | 'UNKNOWN_SPECIES' | 'INVALID';

export class SnapshotError extends Error {
  readonly code: SnapshotErrorCode;

  constructor(code: SnapshotErrorCode, message: string) {
    super(message);
    this.name = 'SnapshotError';
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Throws `SnapshotError` unless `snapshot` is a version 1 snapshot naming a known species. */
export function validateSnapshot(snapshot: unknown, knownSpecies: readonly SpeciesId[]): EngineSnapshot {
  if (!isRecord(snapshot)) {
    throw new SnapshotError('INVALID', 'snapshot must be an object');
  }
  if (snapshot.version !== ENGINE_SNAPSHOT_VERSION) {
    throw new SnapshotError('UNSUPPORTED_VERSION', `snapshot version ${String(snapshot.version)} is not supported (expected ${ENGINE_SNAPSHOT_VERSION})`);
  }
  if (typeof snapshot.speciesId !== 'string' || !knownSpecies.includes(snapshot.speciesId)) {
    throw new SnapshotError('UNKNOWN_SPECIES', `snapshot names unknown species "${String(snapshot.speciesId)}"`);
  }
  if (!isRecord(snapshot.controls)) {
    throw new SnapshotError('INVALID', 'snapshot.controls must be an object');
  }
  for (const control of ECOLOGICAL_CONTROLS) {
    const value = snapshot.controls[control];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
      throw new SnapshotError('INVALID', `snapshot.controls.${control} must be a number 0..1`);
    }
  }
  if (typeof snapshot.tempo !== 'number' || !Number.isFinite(snapshot.tempo) || snapshot.tempo <= 0) {
    throw new SnapshotError('INVALID', 'snapshot.tempo must be a positive number');
  }
  if (!Array.isArray(snapshot.routes)) {
    throw new SnapshotError('INVALID', 'snapshot.routes must be an array');
  }
  for (const route of snapshot.routes) {
    if (!isRecord(route) || !isRecord(route.source) || typeof route.destination !== 'string' || typeof route.depth !== 'number') {
      throw new SnapshotError('INVALID', 'each snapshot route needs source, destination and depth');
    }
  }
  if (snapshot.preferences !== undefined && !isRecord(snapshot.preferences)) {
    throw new SnapshotError('INVALID', 'snapshot.preferences must be an object');
  }
  if (snapshot.polyphony !== undefined && snapshot.polyphony !== null && (!Number.isInteger(snapshot.polyphony) || (snapshot.polyphony as number) < 1 || (snapshot.polyphony as number) > 64)) {
    throw new SnapshotError('INVALID', 'snapshot.polyphony must be an integer 1..64 or null');
  }
  if (snapshot.presetId !== undefined && typeof snapshot.presetId !== 'string') {
    throw new SnapshotError('INVALID', 'snapshot.presetId must be a string');
  }
  return snapshot as unknown as EngineSnapshot;
}
