import {
  ECOLOGICAL_CONTROLS_LIST,
  type SoundWorld,
  type SoundWorldMetadata,
  type SpeciesStatus,
} from '../SoundWorld.js';

export class SpeciesValidationError extends Error {
  readonly speciesId: string | undefined;
  readonly issues: string[];

  constructor(message: string, issues: string[], speciesId?: string) {
    super(message);
    this.name = 'SpeciesValidationError';
    this.speciesId = speciesId;
    this.issues = issues;
  }
}

const REQUIRED_METADATA_FIELDS: (keyof SoundWorldMetadata)[] = [
  'id',
  'name',
  'concept',
  'description',
  'inspiration',
  'character',
];

const REQUIRED_METHODS: (keyof SoundWorld)[] = [
  'initialize',
  'start',
  'stop',
  'noteOn',
  'noteOff',
  'allNotesOff',
  'setControl',
  'dispose',
];

const VALID_STATUSES: SpeciesStatus[] = ['active', 'coming_soon', 'disabled'];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0)
  );
}

/** Validate species ID format (lowercase alphanumeric, hyphens, optional dot namespaces). */
export function validateSpeciesId(id: unknown): string[] {
  const issues: string[] = [];
  if (!isNonEmptyString(id)) {
    issues.push('metadata.id must be a non-empty string');
    return issues;
  }
  const valid =
    /^[a-z][a-z0-9.-]*$/.test(id) &&
    !id.includes('..') &&
    !id.startsWith('.') &&
    !id.endsWith('.');
  if (!valid) {
    issues.push(
      `metadata.id "${id}" must be lowercase alphanumeric with optional hyphens and dot namespaces (e.g. "seed", "night-bloom", "plantasonic.my-species")`,
    );
  }
  return issues;
}

/** Validate metadata fields without instantiating audio. */
export function validateMetadata(metadata: unknown): string[] {
  const issues: string[] = [];

  if (!metadata || typeof metadata !== 'object') {
    return ['metadata must be an object'];
  }

  const meta = metadata as Partial<SoundWorldMetadata>;

  for (const field of REQUIRED_METADATA_FIELDS) {
    const value = meta[field];
    if (field === 'inspiration' || field === 'character') {
      if (!isStringArray(value)) {
        issues.push(`metadata.${field} must be a non-empty string array`);
      }
    } else if (!isNonEmptyString(value)) {
      issues.push(`metadata.${field} must be a non-empty string`);
    }
  }

  if (meta.id !== undefined) {
    issues.push(...validateSpeciesId(meta.id));
  }

  if (meta.status !== undefined && !VALID_STATUSES.includes(meta.status)) {
    issues.push(`metadata.status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  return issues;
}

/** Validate a SoundWorld instance implements the full contract. */
export function validateSoundWorld(world: unknown): string[] {
  const issues: string[] = [];

  if (!world || typeof world !== 'object') {
    return ['species must be an object implementing SoundWorld'];
  }

  const candidate = world as Partial<SoundWorld>;

  if (!candidate.metadata) {
    issues.push('species.metadata is required');
  } else {
    issues.push(...validateMetadata(candidate.metadata));
  }

  for (const method of REQUIRED_METHODS) {
    if (typeof candidate[method] !== 'function') {
      issues.push(`species.${method} must be a function`);
    }
  }

  return issues;
}

/**
 * Validate an active species has ecological control support.
 * Checks that setControl accepts all five ecological controls without throwing.
 */
export function validateEcologicalControls(world: SoundWorld): string[] {
  const issues: string[] = [];
  const status = world.metadata.status ?? 'active';

  if (status !== 'active') {
    return issues;
  }

  for (const control of ECOLOGICAL_CONTROLS_LIST) {
    try {
      world.setControl(control, 50);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(`setControl("${control}") threw: ${message}`);
    }
  }

  return issues;
}

export type ValidationOptions = {
  /** When true, ecological setControl smoke test runs (default: true for active species). */
  testControls?: boolean;
};

/** Full validation — throws SpeciesValidationError on failure. */
export function assertValidSpecies(
  world: SoundWorld,
  options: ValidationOptions = {},
): void {
  const issues = validateSoundWorld(world);
  const status = world.metadata?.status ?? 'active';

  if (issues.length === 0 && status === 'active') {
    const testControls = options.testControls ?? true;
    if (testControls) {
      issues.push(...validateEcologicalControls(world));
    }
  }

  if (issues.length > 0) {
    throw new SpeciesValidationError(
      `Invalid species "${world.metadata?.id ?? 'unknown'}": ${issues[0]}`,
      issues,
      world.metadata?.id,
    );
  }
}

/** Validate metadata-only registration (coming_soon / disabled placeholders). */
export function assertValidPlaceholderMetadata(metadata: SoundWorldMetadata): void {
  const issues = validateMetadata(metadata);
  const status = metadata.status ?? 'active';

  if (status === 'active') {
    issues.push('placeholder registration requires status "coming_soon" or "disabled"');
  }

  if (issues.length > 0) {
    throw new SpeciesValidationError(
      `Invalid placeholder species "${metadata.id}": ${issues[0]}`,
      issues,
      metadata.id,
    );
  }
}

export { ECOLOGICAL_CONTROLS_LIST as ECOLOGICAL_CONTROLS };
