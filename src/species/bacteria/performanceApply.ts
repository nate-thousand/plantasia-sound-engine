import type { PerformanceTargets } from '../../engine/performance/types.js';
import { setRampParam, type RampParam } from '../../utils/ramp.js';
import type { ChangeGate } from '../../shared/modulationFrame.js';
import {
  applyBacteriaEffectsLevels,
  type BacteriaEffectsLevels,
  type BacteriaEffectsNodes,
} from './effects.js';
import type { BacteriaSynthNodes } from './synth.js';

export type BacteriaPerformanceBase = {
  highpassHz: number;
  filterDepth: number;
  panRate: number;
  effectLevels: BacteriaEffectsLevels;
};

export function applyBacteriaPerformance(
  synth: BacteriaSynthNodes,
  effects: BacteriaEffectsNodes,
  base: BacteriaPerformanceBase,
  targets: PerformanceTargets,
  audioStarted: boolean,
  rampSec = 0.2,
  gate?: ChangeGate,
): void {
  const highpass =
    base.highpassHz * Math.max(0.05, targets.filterCutoffMult) * (1 + targets.brightnessAdd * 0.12);
  setRampParam(audioStarted, synth.highpass.frequency as unknown as RampParam, highpass, rampSec);

  const filterDepth = base.filterDepth + targets.instabilityAdd * 0.12;
  synth.filterDriftLfo.min = highpass * (1 - filterDepth);
  synth.filterDriftLfo.max = highpass * (1 + filterDepth);

  const panRate = base.panRate * targets.particleRateMult;
  setRampParam(audioStarted, synth.panDriftLfo.frequency as unknown as RampParam, panRate, rampSec);

  applyBacteriaEffectsLevels(
    effects,
    {
      ...base.effectLevels,
      satDrive: base.effectLevels.satDrive + targets.saturationAdd,
      pannerDepth: base.effectLevels.pannerDepth * targets.stereoWidthMult,
      pannerRate: base.effectLevels.pannerRate * targets.particleRateMult,
      roomWet: Math.min(0.85, base.effectLevels.roomWet + targets.reverbWetAdd),
    },
    audioStarted,
    rampSec,
    gate,
  );
}

/** Scale manual noteOn particle probability from performance density. */
export function bacteriaParticleProbability(
  baseBacteriaControl: number,
  targets: PerformanceTargets,
): number {
  const base = 0.4 + baseBacteriaControl * 0.4;
  return Math.min(0.95, base + targets.generativeDensityAdd * 0.15);
}
