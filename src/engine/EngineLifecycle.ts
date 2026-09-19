/** Explicit engine lifecycle states for {@link SpeciesManager}. */
export type EngineState = 'idle' | 'loaded' | 'running' | 'disposed';

export type EngineLifecycleErrorCode =
  | 'NO_SPECIES_LOADED'
  | 'ENGINE_NOT_STARTED'
  | 'ENGINE_DISPOSED';

/**
 * Thrown when a primary engine action is invoked in an invalid lifecycle state.
 * Cleanup actions (`stop`, `allNotesOff`) remain idempotent and do not throw.
 */
export class EngineLifecycleError extends Error {
  readonly code: EngineLifecycleErrorCode;
  readonly state: EngineState;

  constructor(code: EngineLifecycleErrorCode, state: EngineState, message: string) {
    super(message);
    this.name = 'EngineLifecycleError';
    this.code = code;
    this.state = state;
  }
}

export function assertNotDisposed(state: EngineState, action: string): void {
  if (state === 'disposed') {
    throw new EngineLifecycleError(
      'ENGINE_DISPOSED',
      state,
      `Cannot ${action} — engine has been disposed.`,
    );
  }
}

export function assertSpeciesLoaded(state: EngineState, action: string): void {
  assertNotDisposed(state, action);
  if (state === 'idle') {
    throw new EngineLifecycleError(
      'NO_SPECIES_LOADED',
      state,
      `Cannot ${action} — no species loaded. Call loadSpecies() first.`,
    );
  }
}

export function assertEngineRunning(state: EngineState, action: string): void {
  assertSpeciesLoaded(state, action);
  if (state !== 'running') {
    throw new EngineLifecycleError(
      'ENGINE_NOT_STARTED',
      state,
      `Cannot ${action} — engine is not started. Call start() after loadSpecies().`,
    );
  }
}
