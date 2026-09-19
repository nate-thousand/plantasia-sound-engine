import type { EcologicalControl, SpeciesId } from '../SoundWorld.js';
import type { GenerativeEventKind } from '../generative/types.js';
import { audioNow } from '../clock.js';
import type { ModulationRouteConfig } from '../modulation/types.js';

/** Every event carries the AudioContext time it happened at. */
export type TimedEvent = {
  /** AudioContext seconds. Stamped by the bus when the emitter does not supply one. */
  time: number;
};

export type NoteSource = 'host' | 'generative' | 'midi';

export type EngineEventMap = {
  speciesChanged: TimedEvent & {
    speciesId: SpeciesId;
    previousSpeciesId: SpeciesId | null;
    presetId?: string;
  };
  notePlayed: TimedEvent & {
    note: string;
    velocity: number;
    source: NoteSource;
    speciesId: SpeciesId | null;
  };
  noteReleased: TimedEvent & {
    note: string;
    source: NoteSource;
    speciesId: SpeciesId | null;
  };
  controlChanged: TimedEvent & {
    control: EcologicalControl;
    value: number;
    speciesId: SpeciesId | null;
  };
  generatorEvent: TimedEvent & {
    kind: GenerativeEventKind;
    note?: string;
    velocity?: number;
    intensity?: number;
    speciesId: SpeciesId | null;
  };
  densityChanged: TimedEvent & {
    density: number;
    speciesId: SpeciesId | null;
  };
  /** A transient on the master bus, detected by the engine's audio analyser. */
  onset: TimedEvent & {
    /** 0..1, how far the spectral flux exceeded the adaptive threshold. */
    strength: number;
  };
  /** A modulation route was added, changed or removed. Never per tick. */
  modulationChanged: TimedEvent & {
    routes: ModulationRouteConfig[];
  };
};

export type EngineEventName = keyof EngineEventMap;

/** Emitters may leave `time` out; the bus stamps it. */
export type EngineEventInput<K extends EngineEventName> = Omit<EngineEventMap[K], 'time'> &
  Partial<TimedEvent>;

export type EngineEventHandler<K extends EngineEventName> = (
  payload: EngineEventMap[K],
) => void;

type SinkInput<K extends EngineEventName> = Omit<EngineEventInput<K>, 'speciesId'>;

/** Context passed to Sound Worlds for semantic event emission (no Tone coupling). */
export interface EngineEventSink {
  emitNotePlayed(payload: SinkInput<'notePlayed'>): void;
  emitNoteReleased(payload: SinkInput<'noteReleased'>): void;
  emitGeneratorEvent(payload: SinkInput<'generatorEvent'>): void;
  emitDensityChanged(payload: SinkInput<'densityChanged'>): void;
}

type Listener = (payload: unknown) => void;

/**
 * Typed semantic event bus for host visualization layers.
 */
export class EngineEventBus {
  private listeners = new Map<EngineEventName, Set<Listener>>();

  on<K extends EngineEventName>(event: K, handler: EngineEventHandler<K>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(handler as Listener);
    this.listeners.set(event, set);
    return () => this.off(event, handler);
  }

  off<K extends EngineEventName>(event: K, handler: EngineEventHandler<K>): void {
    this.listeners.get(event)?.delete(handler as Listener);
  }

  /** True when at least one handler is subscribed to `event`. */
  hasListeners(event: EngineEventName): boolean {
    return (this.listeners.get(event)?.size ?? 0) > 0;
  }

  emit<K extends EngineEventName>(event: K, payload: EngineEventInput<K>): void {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    const stamped = (
      payload.time === undefined ? { ...payload, time: audioNow() } : payload
    ) as EngineEventMap[K];
    for (const handler of set) {
      handler(stamped);
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  createSink(speciesId: () => SpeciesId | null): EngineEventSink {
    return {
      emitNotePlayed: (payload) => {
        this.emit('notePlayed', { ...payload, speciesId: speciesId() });
      },
      emitNoteReleased: (payload) => {
        this.emit('noteReleased', { ...payload, speciesId: speciesId() });
      },
      emitGeneratorEvent: (payload) => {
        this.emit('generatorEvent', { ...payload, speciesId: speciesId() });
      },
      emitDensityChanged: (payload) => {
        this.emit('densityChanged', { ...payload, speciesId: speciesId() });
      },
    };
  }
}
