/**
 * Master bus — the single node every output path feeds before the destination.
 *
 * v1 synth chain, the Plantasonic and Juno raw Web Audio graphs, and every v2
 * species all terminate here, so the analyser and meter hanging off this bus see
 * whatever the engine is producing regardless of which path is active.
 *
 * Hosts read it through `PlantasiaEngine.getWaveform()` / `getLevel()`.
 */
import * as Tone from 'tone';

/** FFT bins returned by {@link getMasterSpectrum}; fftSize is twice this. */
export const MASTER_FFT_BINS = 1024;

type MasterBusNodes = {
  bus: Tone.Gain;
  analyser: Tone.Analyser;
  fft: Tone.Analyser;
  meter: Tone.Meter;
};

let nodes: MasterBusNodes | null = null;

function ensureMasterBus(): MasterBusNodes {
  if (nodes) {
    return nodes;
  }
  const bus = new Tone.Gain(1);
  const analyser = new Tone.Analyser('waveform', 1024);
  const fft = new Tone.Analyser('fft', MASTER_FFT_BINS);
  fft.smoothing = 0;
  const meter = new Tone.Meter();
  bus.toDestination();
  bus.connect(analyser);
  bus.connect(fft);
  bus.connect(meter);
  nodes = { bus, analyser, fft, meter };
  return nodes;
}

/** Tone node for Tone-based chains: `node.connect(getMasterBus())`. */
export function getMasterBus(): Tone.Gain {
  return ensureMasterBus().bus;
}

/** Native input for raw Web Audio graphs: `gainNode.connect(getMasterBusInput())`. */
export function getMasterBusInput(): AudioNode {
  return ensureMasterBus().bus.input as unknown as AudioNode;
}

/** Time-domain samples in the range -1..1 from the master bus. */
export function getMasterWaveform(): Float32Array {
  const value = ensureMasterBus().analyser.getValue();
  return value instanceof Float32Array ? value : new Float32Array(0);
}

/** Magnitude spectrum in dB per bin from the master bus (unsmoothed). */
export function getMasterSpectrum(): Float32Array {
  const value = ensureMasterBus().fft.getValue();
  return value instanceof Float32Array ? value : new Float32Array(0);
}

/** Sample rate of the audio context the master bus lives in (0 when unknown). */
export function getMasterSampleRate(): number {
  try {
    const rate = Tone.getContext().sampleRate;
    return Number.isFinite(rate) ? rate : 0;
  } catch {
    return 0;
  }
}

/** Master level normalised 0..1 from a -60 dB floor. */
export function getMasterLevel(): number {
  const value = ensureMasterBus().meter.getValue();
  const db = typeof value === 'number' ? value : value[0] ?? -Infinity;
  if (!Number.isFinite(db)) {
    return 0;
  }
  return Math.min(1, Math.max(0, (db + 60) / 60));
}
