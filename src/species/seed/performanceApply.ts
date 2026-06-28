import type { PerformanceTargets } from '../../engine/performance/types.js';
import { setRampParam, type RampParam } from '../../utils/ramp.js';
import {
  applySeedEffectsLevels,
  type SeedEffectsLevels,
  type SeedEffectsNodes,
} from './effects.js';
import { SEED_OSC_SPREAD, SEED_SYNTH_ATTACK, type SeedSynthNodes } from './synth.js';

export type SeedPerformanceBase = {
  filterHz: number;
  driftDepth: number;
  effectLevels: SeedEffectsLevels;
  driftLfoRate: number;
};

export function applySeedPerformance(
  synth: SeedSynthNodes,
  effects: SeedEffectsNodes,
  base: SeedPerformanceBase,
  targets: PerformanceTargets,
  audioStarted: boolean,
): void {
  const filterHz = base.filterHz * targets.filterCutoffMult;
  setRampParam(audioStarted, synth.filter.frequency as unknown as RampParam, filterHz);

  const driftDepth = base.driftDepth + targets.instabilityAdd * 0.06;
  synth.driftLfo.min = filterHz * (1 - driftDepth);
  synth.driftLfo.max = filterHz * (1 + driftDepth);

  const spread = SEED_OSC_SPREAD * (1 + targets.oscBlendAdd + targets.brightnessAdd * 0.15);
  synth.poly.set({
    oscillator: { type: 'fatsawtooth', spread, count: 3 },
    envelope: {
      attack: SEED_SYNTH_ATTACK * targets.attackMult,
    },
  });

  applySeedEffectsLevels(
    effects,
    synth.poly,
    {
      ...base.effectLevels,
      chorusWet: base.effectLevels.chorusWet * targets.chorusDepthMult,
      reverbWet: Math.min(0.95, base.effectLevels.reverbWet + targets.reverbWetAdd),
      tapeDrive: base.effectLevels.tapeDrive + targets.saturationAdd,
      releaseScale: base.effectLevels.releaseScale * targets.releaseMult,
    },
    audioStarted,
  );

  if (base.driftLfoRate > 0) {
    setRampParam(
      audioStarted,
      synth.driftLfo.frequency as unknown as RampParam,
      base.driftLfoRate * targets.particleRateMult,
    );
  }
}
