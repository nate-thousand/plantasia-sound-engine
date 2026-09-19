/** MIDI input device descriptor (Web MIDI placeholder). */
export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer?: string;
}

/** MIDI Learn mapping (placeholder). */
export interface MidiLearnMapping {
  controlId: string;
  channel: number;
  noteOrCc: number;
  type: 'note' | 'cc';
}

/** MPE zone configuration (placeholder). */
export interface MpeConfig {
  enabled: boolean;
  masterChannel: number;
  memberChannels: number[];
}

/** Web MIDI facade — use {@link createWebMidiManager} from `./WebMidiManager.js`. */
export interface MidiManager {
  readonly devices: readonly MidiDeviceInfo[];
  readonly learnMappings: readonly MidiLearnMapping[];
  readonly mpe: MpeConfig;
}

/** @deprecated Use {@link createWebMidiManager} */
export function createMidiManager(): MidiManager {
  return {
    devices: [],
    learnMappings: [],
    mpe: { enabled: false, masterChannel: 1, memberChannels: [2, 3, 4, 5] },
  };
}
