/**
 * Audio analysis — per frame features from the master bus.
 *
 * Every value is raw for the frame it was read in; hosts own smoothing. The
 * one exception is `peak`, which holds and decays so a poll between frames
 * still sees a transient. Onset detection is spectral flux against an
 * adaptive threshold; it runs once per frame no matter how many callers read
 * in that frame, so a host poll and the engine's own tick never double count.
 */
import { audioNow } from '../clock.js';
import {
  getMasterLevel,
  getMasterSampleRate,
  getMasterSpectrum,
  getMasterWaveform,
  MASTER_FFT_BINS,
} from '../masterBus.js';

export type AudioFeatures = {
  /** AudioContext seconds when this frame was read. */
  time: number;
  /** Root mean square of the waveform, 0..1. */
  rms: number;
  /** Master level with hold and decay, 0..1. */
  peak: number;
  /** Peak bin below 200 Hz, 0..1 from a -80 dB floor. */
  bass: number;
  /** Peak bin from 200 Hz to 2 kHz, 0..1 from a -80 dB floor. */
  mid: number;
  /** Peak bin above 2 kHz, 0..1 from a -80 dB floor. */
  high: number;
  /** Spectral centroid on a log scale from 20 Hz to Nyquist, 0..1. */
  centroid: number;
  /** Onset strength for this frame, 0 when no onset was detected. */
  onset: number;
};

export type OnsetEvent = { time: number; strength: number };

export const BAND_EDGES_HZ = { bass: 200, mid: 2000 } as const;

/** Bins closer than this are the same frame. */
const FRAME_MERGE_SEC = 0.004;
/** Peak decays this many units per second after a hold. */
const PEAK_DECAY_PER_SEC = 2.5;
/** dB floor used to normalise band energy (peak bin per band). */
const BAND_FLOOR_DB = -80;
/** Below this peak bin level the frame counts as silent for centroid purposes. */
const SILENCE_DB = -80;
/** Minimum gap between two onsets. */
const ONSET_COOLDOWN_SEC = 0.08;
/** Flux history length for the adaptive threshold. */
const FLUX_HISTORY = 24;
/** Threshold multiplier over the running mean flux. */
const FLUX_RATIO = 2.5;
/** Absolute flux floor so silence never produces onsets. */
const FLUX_FLOOR = 0.05;

const SILENT_FEATURES: Omit<AudioFeatures, 'time'> = {
  rms: 0,
  peak: 0,
  bass: 0,
  mid: 0,
  high: 0,
  centroid: 0,
  onset: 0,
};

function dbToLinear(db: number): number {
  return Number.isFinite(db) ? 10 ** (db / 20) : 0;
}

function normaliseDb(db: number): number {
  if (!Number.isFinite(db)) {
    return 0;
  }
  return Math.min(1, Math.max(0, (db - BAND_FLOOR_DB) / -BAND_FLOOR_DB));
}

export class AudioAnalyser {
  private last: AudioFeatures | null = null;
  private peakHold = 0;
  private peakTime = 0;
  private prevMagnitudes: Float32Array | null = null;
  private fluxHistory: number[] = [];
  private lastOnsetTime = -Infinity;
  private onsetListeners = new Set<(event: OnsetEvent) => void>();

  /** Subscribe to onsets detected by {@link read}. Returns an unsubscribe function. */
  onOnset(handler: (event: OnsetEvent) => void): () => void {
    this.onsetListeners.add(handler);
    return () => this.onsetListeners.delete(handler);
  }

  /** Features for the current frame. Repeated calls within a frame return the same object. */
  read(): AudioFeatures {
    const time = audioNow();
    if (this.last && time - this.last.time < FRAME_MERGE_SEC) {
      return this.last;
    }

    let features: AudioFeatures;
    try {
      features = this.compute(time);
    } catch {
      features = { time, ...SILENT_FEATURES };
    }
    this.last = features;

    if (features.onset > 0) {
      const event = { time, strength: features.onset };
      for (const handler of this.onsetListeners) {
        handler(event);
      }
    }
    return features;
  }

  reset(): void {
    this.last = null;
    this.peakHold = 0;
    this.peakTime = 0;
    this.prevMagnitudes = null;
    this.fluxHistory = [];
    this.lastOnsetTime = -Infinity;
  }

  dispose(): void {
    this.reset();
    this.onsetListeners.clear();
  }

  private compute(time: number): AudioFeatures {
    const waveform = getMasterWaveform();
    let sum = 0;
    for (let i = 0; i < waveform.length; i += 1) {
      const sample = waveform[i] ?? 0;
      sum += sample * sample;
    }
    const rms = waveform.length ? Math.min(1, Math.sqrt(sum / waveform.length)) : 0;

    const level = getMasterLevel();
    const dt = this.peakTime ? Math.max(0, time - this.peakTime) : 0;
    this.peakHold = Math.max(level, this.peakHold - PEAK_DECAY_PER_SEC * dt);
    this.peakTime = time;
    const peak = this.peakHold;

    const spectrum = getMasterSpectrum();
    const sampleRate = getMasterSampleRate();
    if (!spectrum.length || sampleRate <= 0) {
      return { time, rms, peak, bass: 0, mid: 0, high: 0, centroid: 0, onset: 0 };
    }

    const binHz = sampleRate / (MASTER_FFT_BINS * 2);
    const nyquist = sampleRate / 2;
    const magnitudes = new Float32Array(spectrum.length);
    let bassPeakDb = -Infinity;
    let midPeakDb = -Infinity;
    let highPeakDb = -Infinity;
    let weightedHz = 0;
    let magnitudeSum = 0;
    let flux = 0;

    for (let i = 0; i < spectrum.length; i += 1) {
      const db = spectrum[i] ?? -Infinity;
      const magnitude = dbToLinear(db);
      magnitudes[i] = magnitude;
      const hz = i * binHz;

      if (hz < BAND_EDGES_HZ.bass) {
        bassPeakDb = Math.max(bassPeakDb, db);
      } else if (hz < BAND_EDGES_HZ.mid) {
        midPeakDb = Math.max(midPeakDb, db);
      } else {
        highPeakDb = Math.max(highPeakDb, db);
      }

      weightedHz += hz * magnitude;
      magnitudeSum += magnitude;

      if (this.prevMagnitudes) {
        const rise = magnitude - (this.prevMagnitudes[i] ?? 0);
        if (rise > 0) {
          flux += rise;
        }
      }
    }

    const bass = normaliseDb(bassPeakDb);
    const mid = normaliseDb(midPeakDb);
    const high = normaliseDb(highPeakDb);

    let centroid = 0;
    const loudestDb = Math.max(bassPeakDb, midPeakDb, highPeakDb);
    if (magnitudeSum > 0 && loudestDb > SILENCE_DB) {
      const centroidHz = Math.max(20, weightedHz / magnitudeSum);
      centroid = Math.min(1, Math.max(0, Math.log(centroidHz / 20) / Math.log(nyquist / 20)));
    }

    let onset = 0;
    if (this.prevMagnitudes) {
      const mean =
        this.fluxHistory.length > 0
          ? this.fluxHistory.reduce((a, b) => a + b, 0) / this.fluxHistory.length
          : 0;
      const threshold = Math.max(FLUX_FLOOR, mean * FLUX_RATIO);
      if (flux > threshold && time - this.lastOnsetTime >= ONSET_COOLDOWN_SEC) {
        onset = Math.min(1, (flux - threshold) / threshold);
        this.lastOnsetTime = time;
      }
      this.fluxHistory.push(flux);
      if (this.fluxHistory.length > FLUX_HISTORY) {
        this.fluxHistory.shift();
      }
    }
    this.prevMagnitudes = magnitudes;

    return { time, rms, peak, bass, mid, high, centroid, onset };
  }
}
