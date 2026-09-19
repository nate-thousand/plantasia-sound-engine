import type { MidiDeviceInfo, MidiLearnMapping, MidiManager, MpeConfig } from './types.js';

export type WebMidiHandlers = {
  onNoteOn: (note: string, velocity: number) => void;
  onNoteOff: (note: string) => void;
};

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
    const note = data[1] ?? 0;
    const velocity = (data[2] ?? 0) / 127;

    if (command === 9 && velocity > 0) {
      this.handlers.onNoteOn(midiNoteToName(note), velocity);
    } else if (command === 8 || (command === 9 && velocity === 0)) {
      this.handlers.onNoteOff(midiNoteToName(note));
    }
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
