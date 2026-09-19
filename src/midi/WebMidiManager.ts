import type { MidiDeviceInfo, MidiLearnMapping, MidiManager, MpeConfig } from './types.js';

export type MidiControlKind = 'cc' | 'aftertouch' | 'bend';

/** A decoded control message. CC and aftertouch are 0..1, bend is -1..1. Channels are 1..16. */
export type MidiControlMessage = {
  kind: MidiControlKind;
  controller?: number;
  value: number;
  channel: number;
};

export type WebMidiHandlers = {
  onNoteOn: (note: string, velocity: number) => void;
  onNoteOff: (note: string) => void;
  onControl?: (message: MidiControlMessage) => void;
};

export type MidiControlReading = { value: number; active: boolean };

function controlKey(kind: MidiControlKind, controller: number | undefined, channel: number | 'any'): string {
  return `${kind}:${controller ?? '-'}:${channel}`;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

function midiNoteToName(noteNumber: number): string {
  const octave = Math.floor(noteNumber / 12) - 1;
  const name = NOTE_NAMES[noteNumber % 12] ?? 'C';
  return `${name}${octave}`;
}

/**
 * Web MIDI input manager — routes note on/off to the active Sound World.
 * Gracefully no-ops when Web MIDI is unavailable (Node, unsupported browsers).
 */
export class WebMidiManager implements MidiManager {
  readonly learnMappings: readonly MidiLearnMapping[] = [];
  readonly mpe: MpeConfig = {
    enabled: false,
    masterChannel: 1,
    memberChannels: [2, 3, 4, 5],
  };

  private deviceList: MidiDeviceInfo[] = [];
  private access: MIDIAccess | null = null;
  private activeInput: MIDIInput | null = null;
  private handlers: WebMidiHandlers | null = null;
  /** Last value per control, keyed per channel and under 'any' for the most recent on any channel. */
  private readonly controls = new Map<string, number>();

  get devices(): readonly MidiDeviceInfo[] {
    return this.deviceList;
  }

  async connect(handlers: WebMidiHandlers, inputId?: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
      return false;
    }

    this.handlers = handlers;
    this.access = await navigator.requestMIDIAccess();
    this.refreshDevices();

    const inputs: MIDIInput[] = [];
    this.access.inputs.forEach((input) => inputs.push(input));
    const target =
      (inputId ? inputs.find((input) => input.id === inputId) : undefined) ?? inputs[0] ?? null;

    if (!target) {
      return false;
    }

    this.attachInput(target);
    this.access.onstatechange = () => this.refreshDevices();
    return true;
  }

  disconnect(): void {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }
    if (this.access) {
      this.access.onstatechange = null;
      this.access = null;
    }
    this.handlers = null;
    this.deviceList = [];
    this.controls.clear();
  }

  /** True while handlers are attached (after a successful connect, or a feed without hardware). */
  isConnected(): boolean {
    return this.handlers !== null;
  }

  /**
   * Last known value of a control. `active` is false until a message for it
   * has arrived. Omit `channel` for the most recent value on any channel.
   */
  read(kind: MidiControlKind, controller?: number, channel?: number): MidiControlReading {
    const value = this.controls.get(controlKey(kind, kind === 'cc' ? controller : undefined, channel ?? 'any'));
    if (value === undefined) {
      return { value: 0, active: false };
    }
    return { value, active: true };
  }

  /**
   * Feed raw MIDI bytes as if they came from the input. Lets hosts bridge
   * other transports (WebSocket, a virtual controller) and lets the harness
   * measure without hardware. Requires handlers, which `attach()` sets.
   */
  feed(data: Uint8Array | number[]): void {
    this.handleMessage(data instanceof Uint8Array ? data : Uint8Array.from(data));
  }

  /** Attach handlers without Web MIDI hardware, for {@link feed}. */
  attach(handlers: WebMidiHandlers): void {
    this.handlers = handlers;
  }

  private attachInput(input: MIDIInput): void {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
    }
    this.activeInput = input;
    input.onmidimessage = (event) => {
      if (event.data) {
        this.handleMessage(event.data);
      }
    };
  }

  private handleMessage(data: Uint8Array): void {
    if (!this.handlers || data.length < 2) {
      return;
    }
    const status = data[0] ?? 0;
    const command = status >> 4;
    const channel = (status & 0x0f) + 1;
    const d1 = data[1] ?? 0;
    const d2 = data[2] ?? 0;

    switch (command) {
      case 9: {
        const velocity = d2 / 127;
        if (velocity > 0) {
          this.handlers.onNoteOn(midiNoteToName(d1), velocity);
        } else {
          this.handlers.onNoteOff(midiNoteToName(d1));
        }
        return;
      }
      case 8:
        this.handlers.onNoteOff(midiNoteToName(d1));
        return;
      case 11:
        this.control({ kind: 'cc', controller: d1, value: d2 / 127, channel });
        return;
      case 13:
        this.control({ kind: 'aftertouch', value: d1 / 127, channel });
        return;
      case 14: {
        const raw = ((d2 << 7) | d1) - 8192;
        this.control({ kind: 'bend', value: Math.max(-1, Math.min(1, raw / 8192)), channel });
        return;
      }
      default:
        return;
    }
  }

  private control(message: MidiControlMessage): void {
    const controller = message.kind === 'cc' ? message.controller : undefined;
    this.controls.set(controlKey(message.kind, controller, message.channel), message.value);
    this.controls.set(controlKey(message.kind, controller, 'any'), message.value);
    this.handlers?.onControl?.(message);
  }

  private refreshDevices(): void {
    if (!this.access) {
      this.deviceList = [];
      return;
    }
    this.deviceList = [];
    this.access.inputs.forEach((input) => {
      this.deviceList.push({
        id: input.id,
        name: input.name ?? 'Unknown MIDI Input',
        manufacturer: input.manufacturer ?? undefined,
      });
    });
  }
}

export function createWebMidiManager(): WebMidiManager {
  return new WebMidiManager();
}
