import * as Tone from 'tone';
import type { MoldEffectParams } from './types.js';
import { resolveMoldParameters } from './moldMacro.js';
import { setRampParam, type RampParam } from '../utils/ramp.js';

/** Tone.js rejects LFO output when min === max (float leak ~1e-7). */
const LFO_MIN_SPAN = 1e-6;

function lfoBipolarSpan(depth: number): { min: number; max: number } {
  const span = Math.max(Math.abs(depth), LFO_MIN_SPAN);
  return { min: -span, max: span };
}

type MoldNodes = {
  tapeSaturation: Tone.Distortion;
  harmonicDistortion: Tone.Distortion;
  bitCrusher: Tone.BitCrusher;
  microDelay: Tone.FeedbackDelay;
  ringMod: Tone.Vibrato;
  textureCrackle: Tone.Noise;
  textureGain: Tone.Gain;
  wowLfo: Tone.LFO;
  flutterLfo: Tone.LFO;
  filterQLfo: Tone.LFO;
  panLfo: Tone.LFO;
  stereoPanner: Tone.Panner;
};

export type MoldHost = {
  delay: Tone.FeedbackDelay;
  filter: Tone.Filter;
  lfo: Tone.LFO;
  started: boolean;
  moldNodes: MoldNodes;
};

/** Create the modular degradation processor chain. */
export function createMoldNodes(): MoldNodes {
  const tapeSaturation = new Tone.Distortion({ distortion: 0, wet: 0 });
  const harmonicDistortion = new Tone.Distortion({ distortion: 0, wet: 0 });
  const bitCrusher = new Tone.BitCrusher(16);
  const microDelay = new Tone.FeedbackDelay({ delayTime: 0.03, feedback: 0, wet: 0 });
  const ringMod = new Tone.Vibrato({ frequency: 0.2, depth: 0, wet: 0 });
  const textureCrackle = new Tone.Noise({ type: 'brown', volume: -Infinity });
  const textureGain = new Tone.Gain(0);
  const wowLfo = new Tone.LFO({ frequency: 0.08, min: -LFO_MIN_SPAN, max: LFO_MIN_SPAN, type: 'sine' });
  const flutterLfo = new Tone.LFO({ frequency: 4.2, min: -LFO_MIN_SPAN, max: LFO_MIN_SPAN, type: 'sine' });
  const filterQLfo = new Tone.LFO({ frequency: 0.35, min: -LFO_MIN_SPAN, max: LFO_MIN_SPAN, type: 'triangle' });
  const panLfo = new Tone.LFO({ frequency: 0.05, min: -0.35, max: 0.35, type: 'sine' });
  const stereoPanner = new Tone.Panner(0);

  textureCrackle.connect(textureGain);
  textureCrackle.start();
  wowLfo.start();
  flutterLfo.start();
  filterQLfo.start();
  panLfo.start();
  panLfo.connect(stereoPanner.pan);

  return {
    tapeSaturation,
    harmonicDistortion,
    bitCrusher,
    microDelay,
    ringMod,
    textureCrackle,
    textureGain,
    wowLfo,
    flutterLfo,
    filterQLfo,
    panLfo,
    stereoPanner,
  };
}

/**
 * Insert mold processors between filter and delay:
 * tape wear → harmonic distortion → spectral decay → granular micro-delay → main delay.
 */
export function wireMoldChain(
  filter: Tone.Filter,
  delay: Tone.FeedbackDelay,
  moldNodes: MoldNodes,
): void {
  filter.disconnect();
  filter.connect(moldNodes.tapeSaturation);
  moldNodes.tapeSaturation.connect(moldNodes.harmonicDistortion);
  moldNodes.harmonicDistortion.connect(moldNodes.bitCrusher);
  moldNodes.bitCrusher.connect(moldNodes.microDelay);
  moldNodes.microDelay.connect(moldNodes.stereoPanner);
  moldNodes.stereoPanner.connect(delay);
  moldNodes.textureGain.connect(moldNodes.harmonicDistortion);
  moldNodes.wowLfo.connect(delay.delayTime);
  moldNodes.flutterLfo.connect(delay.delayTime);
  moldNodes.filterQLfo.connect(filter.Q);
  moldNodes.ringMod.connect(moldNodes.bitCrusher.wet);
}

let lastMoldValue = 0;

export function getMoldValue(): number {
  return lastMoldValue;
}

export function applyMold(host: MoldHost, mold: number): MoldEffectParams {
  const params = resolveMoldParameters(mold);
  lastMoldValue = mold;
  applyMoldParams(host, params);
  return params;
}

/** Drive all degradation modules from resolved macro parameters. */
export function applyMoldParams(host: MoldHost, params: MoldEffectParams): void {
  const { delay, lfo, started, moldNodes } = host;
  const t = params.intensity;

  // Tone.Distortion.distortion is a plain number, not a rampable Param.
  moldNodes.tapeSaturation.distortion = 0.08 + params.saturation * 0.42;
  setRampParam(started, moldNodes.tapeSaturation.wet as unknown as RampParam, params.tapeWear * 0.35);

  moldNodes.harmonicDistortion.distortion = params.harmonicDistortion * 0.55;
  setRampParam(
    started,
    moldNodes.harmonicDistortion.wet as unknown as RampParam,
    params.harmonicDistortion * 0.42,
  );

  setRampParam(started, moldNodes.bitCrusher.bits as unknown as RampParam, params.bitDepth);
  const crushMix = Math.min(0.88, params.spectralSmear * 0.75 + t * 0.04);
  setRampParam(started, moldNodes.bitCrusher.wet as unknown as RampParam, crushMix);

  setRampParam(
    started,
    moldNodes.microDelay.wet as unknown as RampParam,
    params.microStutter * 0.35 + params.bufferRepeat * 0.28,
  );
  setRampParam(
    started,
    moldNodes.microDelay.feedback as unknown as RampParam,
    Math.min(0.72, params.bufferRepeat * 0.55 + params.grainDensity * 0.18),
  );
  setRampParam(
    started,
    moldNodes.microDelay.delayTime as unknown as RampParam,
    0.018 + params.grainDensity * 0.045 + params.microStutter * 0.02,
  );

  setRampParam(started, moldNodes.ringMod.depth as unknown as RampParam, params.ringMod * 0.08);
  setRampParam(
    started,
    moldNodes.ringMod.frequency as unknown as RampParam,
    0.15 + params.ringMod * 2.5,
  );
  setRampParam(started, moldNodes.ringMod.wet as unknown as RampParam, params.ringMod * 0.25);

  const wow = lfoBipolarSpan(params.wowDepth);
  moldNodes.wowLfo.min = wow.min;
  moldNodes.wowLfo.max = wow.max;
  moldNodes.wowLfo.frequency.value = 0.05 + params.wowDepth * 5;
  const flutter = lfoBipolarSpan(params.flutterDepth);
  moldNodes.flutterLfo.min = flutter.min;
  moldNodes.flutterLfo.max = flutter.max;
  moldNodes.flutterLfo.frequency.value = 2.8 + params.flutterDepth * 120;

  const feedback = Math.min(0.9, 0.2 + params.delayFeedbackBoost + params.selfOscDelay * 0.35);
  setRampParam(started, delay.feedback as unknown as RampParam, feedback);
  setRampParam(started, delay.wet as unknown as RampParam, 0.12 + params.delayBloom * 0.35);

  const filterQ = lfoBipolarSpan(params.filterInstability * 0.04);
  moldNodes.filterQLfo.min = filterQ.min;
  moldNodes.filterQLfo.max = filterQ.max;

  setRampParam(started, lfo.frequency as unknown as RampParam, 0.04 + params.modulationDepth * 4.5);
  lfo.min = 400 - params.pitchDriftCents * 7;
  lfo.max = 2400 + params.pitchDriftCents * 11;

  moldNodes.panLfo.frequency.value = 0.04 + params.stereoInstability * 0.18;
  const pan = lfoBipolarSpan(params.stereoInstability * 0.55);
  moldNodes.panLfo.min = pan.min;
  moldNodes.panLfo.max = pan.max;

  const textureLevel = params.textureCrackle + params.textureAir + params.crackle * 0.5;
  setRampParam(started, moldNodes.textureGain.gain as unknown as RampParam, textureLevel * 0.045);
  moldNodes.textureCrackle.volume.value =
    textureLevel > 0.002 ? Tone.gainToDb(textureLevel * 0.12) : -Infinity;
}
