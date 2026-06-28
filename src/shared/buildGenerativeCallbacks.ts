import type { GenerativeCallbacks } from '../engine/generative/types.js';
import type { EngineEventSink } from '../engine/events/EngineEventBus.js';

export function buildGenerativeCallbacks(
  handlers: {
    noteOn: (note: string, velocity: number) => void;
    noteOff: (note: string) => void;
    onGlitch?: (intensity: number) => void;
  },
  events?: EngineEventSink,
): GenerativeCallbacks {
  return {
    noteOn: (note, velocity) => {
      events?.emitNotePlayed({ note, velocity, source: 'generative' });
      handlers.noteOn(note, velocity);
    },
    noteOff: handlers.noteOff,
    onGeneratorEvent: (payload) => events?.emitGeneratorEvent(payload),
    onGlitch: (intensity) => {
      events?.emitGeneratorEvent({ kind: 'glitch', intensity });
      handlers.onGlitch?.(intensity);
    },
  };
}
