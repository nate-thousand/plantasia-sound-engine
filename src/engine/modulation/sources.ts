/**
 * Source runtimes. Each turns a descriptor into a `tick(dt)` that yields the
 * source's current value. The environment supplies what a source reads:
 * transport BPM and play state for beat sync, master bus features for the
 * follower, and MIDI values for the MIDI sources.
 */
import type { AudioFeatures } from '../analysis/AudioAnalyser.js';
import type {
  FollowerSourceDescriptor,
  LfoSourceDescriptor,
  ModulationSourceDescriptor,
  SampleHoldSourceDescriptor,
} from './types.js';

export type MidiReading = { value: number; active: boolean };

export interface ModulationEnvironment {
  bpm(): number;
  /** Increments every time the transport starts playing; beat synced sources reset phase on change. */
  transportPlayCount(): number;
  features(): AudioFeatures;
  /** Null when MIDI is not enabled or the message has never arrived. */
  midi(kind: 'cc' | 'aftertouch' | 'bend', controller?: number, channel?: number): MidiReading | null;
}

export interface ModulationSource {
  readonly id: string;
  readonly descriptor: ModulationSourceDescriptor;
  readonly polarity: 'unipolar' | 'bipolar';
  value: number;
  active: boolean;
  tick(dtSec: number, env: ModulationEnvironment): void;
  reset(phase?: number): void;
  update(descriptor: ModulationSourceDescriptor): void;
}

function periodSeconds(rate: { hz?: number; beats?: number }, bpm: number): number {
  if (rate.beats !== undefined && rate.beats > 0) {
    return (60 / Math.max(1, bpm)) * rate.beats;
  }
  const hz = rate.hz ?? 0.2;
  return hz > 0 ? 1 / hz : Infinity;
}

function shapeValue(shape: LfoSourceDescriptor['shape'], phase: number): number {
  switch (shape) {
    case 'triangle':
      return 1 - 4 * Math.abs(phase - 0.5);
    case 'square':
      return phase < 0.5 ? 1 : -1;
    case 'saw':
      return phase * 2 - 1;
    case 'sine':
    default:
      return Math.sin(phase * Math.PI * 2);
  }
}

class LfoSource implements ModulationSource {
  readonly id: string;
  descriptor: LfoSourceDescriptor;
  value = 0;
  active = true;
  private phase: number;
  private lastPlayCount = -1;

  constructor(id: string, descriptor: LfoSourceDescriptor) {
    this.id = id;
    this.descriptor = descriptor;
    this.phase = descriptor.phase ?? 0;
  }

  get polarity(): 'unipolar' | 'bipolar' {
    return this.descriptor.unipolar ? 'unipolar' : 'bipolar';
  }

  tick(dtSec: number, env: ModulationEnvironment): void {
    if (this.descriptor.beats !== undefined) {
      const count = env.transportPlayCount();
      if (this.lastPlayCount !== -1 && count !== this.lastPlayCount) {
        this.phase = this.descriptor.phase ?? 0;
      }
      this.lastPlayCount = count;
    }
    const period = periodSeconds(this.descriptor, env.bpm());
    if (Number.isFinite(period)) {
      this.phase = (this.phase + dtSec / period) % 1;
    }
    const raw = shapeValue(this.descriptor.shape, this.phase);
    this.value = this.descriptor.unipolar ? (raw + 1) / 2 : raw;
  }

  reset(phase = this.descriptor.phase ?? 0): void {
    this.phase = phase;
  }

  update(descriptor: ModulationSourceDescriptor): void {
    if (descriptor.type === 'lfo') {
      this.descriptor = descriptor;
    }
  }
}

class SampleHoldSource implements ModulationSource {
  readonly id: string;
  readonly polarity = 'bipolar' as const;
  descriptor: SampleHoldSourceDescriptor;
  value = 0;
  active = true;
  private held = 0;
  private from = 0;
  private sinceSample = Infinity;
  private lastPlayCount = -1;

  constructor(id: string, descriptor: SampleHoldSourceDescriptor) {
    this.id = id;
    this.descriptor = descriptor;
  }

  tick(dtSec: number, env: ModulationEnvironment): void {
    if (this.descriptor.beats !== undefined) {
      const count = env.transportPlayCount();
      if (this.lastPlayCount !== -1 && count !== this.lastPlayCount) {
        this.sinceSample = Infinity;
      }
      this.lastPlayCount = count;
    }
    const period = periodSeconds(this.descriptor, env.bpm());
    this.sinceSample += dtSec;
    if (this.sinceSample >= period) {
      this.from = this.value;
      this.held = Math.random() * 2 - 1;
      this.sinceSample = 0;
    }
    const slew = this.descriptor.slew ?? 0;
    if (slew > 0 && this.sinceSample < slew) {
      this.value = this.from + (this.held - this.from) * (this.sinceSample / slew);
    } else {
      this.value = this.held;
    }
  }

  reset(): void {
    this.sinceSample = Infinity;
  }

  update(descriptor: ModulationSourceDescriptor): void {
    if (descriptor.type === 'sample-hold') {
      this.descriptor = descriptor;
    }
  }
}

class FollowerSource implements ModulationSource {
  readonly id: string;
  readonly polarity = 'unipolar' as const;
  descriptor: FollowerSourceDescriptor;
  value = 0;
  active = true;

  constructor(id: string, descriptor: FollowerSourceDescriptor) {
    this.id = id;
    this.descriptor = descriptor;
  }

  tick(dtSec: number, env: ModulationEnvironment): void {
    const features = env.features();
    const target = features[this.descriptor.band ?? 'rms'];
    const attack = Math.max(0.001, this.descriptor.attack ?? 0.05);
    const release = Math.max(0.001, this.descriptor.release ?? 0.3);
    const tau = target > this.value ? attack : release;
    const coefficient = 1 - Math.exp(-dtSec / tau);
    this.value += (target - this.value) * coefficient;
  }

  reset(): void {
    this.value = 0;
  }

  update(descriptor: ModulationSourceDescriptor): void {
    if (descriptor.type === 'follower') {
      this.descriptor = descriptor;
    }
  }
}

class MidiSource implements ModulationSource {
  readonly id: string;
  descriptor: ModulationSourceDescriptor;
  value = 0;
  active = false;

  constructor(id: string, descriptor: ModulationSourceDescriptor) {
    this.id = id;
    this.descriptor = descriptor;
  }

  get polarity(): 'unipolar' | 'bipolar' {
    return this.descriptor.type === 'midi-bend' ? 'bipolar' : 'unipolar';
  }

  tick(_dtSec: number, env: ModulationEnvironment): void {
    const d = this.descriptor;
    const reading =
      d.type === 'midi-cc'
        ? env.midi('cc', d.cc, d.channel)
        : d.type === 'midi-aftertouch'
          ? env.midi('aftertouch', undefined, d.channel)
          : d.type === 'midi-bend'
            ? env.midi('bend', undefined, d.channel)
            : null;
    if (!reading) {
      this.active = false;
      this.value = 0;
      return;
    }
    this.active = reading.active;
    this.value = reading.value;
  }

  reset(): void {
    this.value = 0;
  }

  update(descriptor: ModulationSourceDescriptor): void {
    this.descriptor = descriptor;
  }
}

let anonymousCount = 0;

export function sourceId(descriptor: ModulationSourceDescriptor): string {
  if (descriptor.id) {
    return descriptor.id;
  }
  anonymousCount += 1;
  return `${descriptor.type}-${anonymousCount}`;
}

export function createSource(id: string, descriptor: ModulationSourceDescriptor): ModulationSource {
  switch (descriptor.type) {
    case 'lfo':
      return new LfoSource(id, descriptor);
    case 'sample-hold':
      return new SampleHoldSource(id, descriptor);
    case 'follower':
      return new FollowerSource(id, descriptor);
    case 'midi-cc':
    case 'midi-aftertouch':
    case 'midi-bend':
      return new MidiSource(id, descriptor);
    default: {
      const never: never = descriptor;
      throw new Error(`Unknown modulation source type: ${String((never as { type?: string }).type)}`);
    }
  }
}
