import type { PerformanceTargets } from '../../engine/performance/types.js';
import { setRampParam, type RampParam } from '../../utils/ramp.js';
import {
  applyFlowersEffectsLevels,
  type FlowersEffectsLevels,
  type FlowersEffectsNodes,
} from './effects.js';
import {
  FLOWERS_ATTACK,
  FLOWERS_PWM_WIDTH,
  type FlowersSynthNodes,
} from './synth.js';

export type FlowersPerformanceBase = {
  filterHz: number;
  filterDepth: number;
  pwmWidth: number;
  detuneSpread: number;
  noiseGain: number;
  effectLevels: FlowersEffectsLevels;
};

export function applyFlowersPerformance(
  synth: FlowersSynthNodes,
  effects: FlowersEffectsNodes,
  base: FlowersPerformanceBase,
  targets: PerformanceTargets,
  audioStarted: boolean,
): void {
  const filterHz = base.filterHz * targets.filterCutoffMult;
  setRampParam(audioStarted, synth.filter.frequency as unknown as RampParam, filterHz);

  const filterDepth = base.filterDepth + targets.instabilityAdd * 0.08;
  synth.filterLfo.min = filterHz * (1 - filterDepth);
  synth.filterLfo.max = filterHz * (1 + filterDepth);

  const pwmWidth = FLOWERS_PWM_WIDTH * base.pwmWidth * (1 + targets.brightnessAdd * 0.35);
  synth.pwmPoly.set({
    oscillator: { type: 'pulse', width: pwmWidth },
    envelope: { attack: FLOWERS_ATTACK * targets.attackMult },
  });

  const spread = base.detuneSpread * (1 + targets.oscBlendAdd + targets.brightnessAdd * 0.2);
  synth.sawPoly.set({
    oscillator: { type: 'fatsawtooth', spread },
  });

  setRampParam(
    audioStarted,
    synth.noiseGain.gain as unknown as RampParam,
    base.noiseGain + targets.brightnessAdd * 0.012,
  );

  applyFlowersEffectsLevels(
    effects,
    synth.sawPoly,
    synth.pwmPoly,
    {
      ...base.effectLevels,
      chorusWet: base.effectLevels.chorusWet * targets.chorusDepthMult,
      chorusDepth: base.effectLevels.chorusDepth * targets.chorusDepthMult,
      ensembleWet: base.effectLevels.ensembleWet * targets.chorusDepthMult,
      reverbWet: Math.min(0.95, base.effectLevels.reverbWet + targets.reverbWetAdd),
      widenerWidth: base.effectLevels.widenerWidth * targets.stereoWidthMult,
      tapeDrive: base.effectLevels.tapeDrive + targets.saturationAdd,
      releaseScale: base.effectLevels.releaseScale * targets.releaseMult,
    },
    audioStarted,
  );
}
