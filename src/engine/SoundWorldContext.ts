import type { EngineEventSink } from './events/EngineEventBus.js';
import type { EngineScheduler } from './scheduler/EngineScheduler.js';

/** Optional context passed to {@link SoundWorld.initialize}. */
export interface SoundWorldContext {
  events?: EngineEventSink;
  scheduler?: EngineScheduler;
}

export function readSoundWorldContext(context: unknown): SoundWorldContext {
  if (!context || typeof context !== 'object') {
    return {};
  }
  const ctx = context as Partial<SoundWorldContext>;
  return {
    events: ctx.events,
    scheduler: ctx.scheduler,
  };
}
