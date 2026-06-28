import type { EcologicalControl, SpeciesId } from '../SoundWorld.js';
import type { GenerativeEventKind } from '../generative/types.js';

export type EngineEventMap = {
  speciesChanged: {
    speciesId: SpeciesId;
    previousSpeciesId: SpeciesId | null;
    presetId?: string;
  };
  notePlayed: {
    note: string;
    velocity: number;
    source: 'host' | 'generative' | 'midi';
    speciesId: SpeciesId | null;
  };
  controlChanged: {
    control: EcologicalControl;
    value: number;
    speciesId: SpeciesId | null;
  };
  generatorEvent: {
    kind: GenerativeEventKind;
    note?: string;
    velocity?: number;
    intensity?: number;
    speciesId: SpeciesId | null;
  };
  densityChanged: {
    density: number;
    speciesId: SpeciesId | null;
  };
};

export type EngineEventName = keyof EngineEventMap;

export type EngineEventHandler<K extends EngineEventName> = (
  payload: EngineEventMap[K],
) => void;

/** Context passed to Sound Worlds for semantic event emission (no Tone coupling). */
export interface EngineEventSink {
  emitNotePlayed(payload: Omit<EngineEventMap['notePlayed'], 'speciesId'>): void;
  emitGeneratorEvent(payload: Omit<EngineEventMap['generatorEvent'], 'speciesId'>): void;
  emitDensityChanged(payload: Omit<EngineEventMap['densityChanged'], 'speciesId'>): void;
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

  emit<K extends EngineEventName>(event: K, payload: EngineEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    for (const handler of set) {
      handler(payload);
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
      emitGeneratorEvent: (payload) => {
        this.emit('generatorEvent', { ...payload, speciesId: speciesId() });
      },
      emitDensityChanged: (payload) => {
        this.emit('densityChanged', { ...payload, speciesId: speciesId() });
      },
    };
  }
}
