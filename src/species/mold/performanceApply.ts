import type { PerformanceTargets } from '../../engine/performance/types.js';
import { setRampParam, type RampParam } from '../../utils/ramp.js';
import {
  applyMoldEffectsLevels,
  type MoldEffectsLevels,
  type MoldEffectsNodes,
} from './effects.js';
import { MOLD_DRONE_ATTACK, type MoldSynthNodes } from './synth.js';

export type MoldPerformanceBase = {
  bandCenter: number;
  filterDepth: number;
  preBandCenter: number;
  effectLevels: MoldEffectsLevels;
};

export function applyMoldPerformance(
  synth: MoldSynthNodes,
  effects: MoldEffectsNodes,
  base: MoldPerformanceBase,
  targets: PerformanceTargets,
  audioStarted: boolean,
): void {
  const bandCenter = base.bandCenter * targets.filterCutoffMult;
  setRampParam(audioStarted, synth.bandpass.frequency as unknown as RampParam, bandCenter);

  const filterDepth = base.filterDepth + targets.instabilityAdd * 0.18;
  synth.filterDriftLfo.min = bandCenter * (1 - filterDepth);
  synth.filterDriftLfo.max = bandCenter * (1 + filterDepth);

  setRampParam(
    audioStarted,
    effects.preBandpass.frequency as unknown as RampParam,
    base.preBandCenter * targets.filterCutoffMult,
  );

  const instability = targets.instabilityAdd;
  applyMoldEffectsLevels(
    effects,
    synth.dronePoly,
    {
      ...base.effectLevels,
      tapeDrive: base.effectLevels.tapeDrive + targets.saturationAdd,
      softDistDrive: base.effectLevels.softDistDrive + targets.saturationAdd * 0.85,
      bitCrushWet: Math.min(0.85, base.effectLevels.bitCrushWet + instability * 0.12),
      bitCrushBits: Math.max(3, base.effectLevels.bitCrushBits - instability * 2),
      combResonance: Math.min(0.95, base.effectLevels.combResonance + instability * 0.15),
      microDelayFeedback: Math.min(
        0.92,
        base.effectLevels.microDelayFeedback + instability * 0.1,
      ),
      feedbackDelayFeedback: Math.min(
        0.95,
        base.effectLevels.feedbackDelayFeedback + instability * 0.12,
      ),
      vibratoDepth: base.effectLevels.vibratoDepth + instability * 0.04,
      wowDepth: base.effectLevels.wowDepth + instability * 0.002,
      flutterDepth: base.effectLevels.flutterDepth + instability * 0.001,
      reverbWet: Math.min(0.95, base.effectLevels.reverbWet + targets.reverbWetAdd),
      releaseScale: base.effectLevels.releaseScale * targets.releaseMult,
    },
    audioStarted,
  );

  synth.dronePoly.set({
    envelope: { attack: MOLD_DRONE_ATTACK * targets.attackMult },
  });
}
