import type { PerformanceTargets } from '../../engine/performance/types.js';
import { setRampParam, type RampParam } from '../../utils/ramp.js';
import type { ChangeGate } from '../../shared/modulationFrame.js';
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
  rampSec = 0.2,
  gate?: ChangeGate,
): void {
  const filterHz = base.filterHz * Math.max(0.05, targets.filterCutoffMult);
  setRampParam(audioStarted, synth.filter.frequency as unknown as RampParam, filterHz, rampSec);

  const driftDepth = base.driftDepth + targets.instabilityAdd * 0.06;
  synth.driftLfo.min = filterHz * (1 - driftDepth);
  synth.driftLfo.max = filterHz * (1 + driftDepth);

  const spread = SEED_OSC_SPREAD * (1 + targets.oscBlendAdd + targets.brightnessAdd * 0.15);
  const attack = SEED_SYNTH_ATTACK * Math.max(0.05, targets.attackMult);
  if (!gate || gate.changed('spread', spread, 0.05) || gate.changed('attack', attack, 0.002)) {
    synth.poly.set({
      oscillator: { type: 'fatsawtooth', spread, count: 3 },
      envelope: { attack },
    });
  }

  applySeedEffectsLevels(
    effects,
    synth.poly,
    {
      ...base.effectLevels,
      chorusWet: base.effectLevels.chorusWet * Math.max(0, targets.chorusDepthMult),
      reverbWet: Math.min(0.95, Math.max(0, base.effectLevels.reverbWet + targets.reverbWetAdd)),
      tapeDrive: Math.max(0, base.effectLevels.tapeDrive + targets.saturationAdd),
      releaseScale: base.effectLevels.releaseScale * Math.max(0.05, targets.releaseMult),
    },
    audioStarted,
    rampSec,
    gate,
  );

  if (base.driftLfoRate > 0) {
    setRampParam(
      audioStarted,
      synth.driftLfo.frequency as unknown as RampParam,
      base.driftLfoRate * Math.max(0.05, targets.particleRateMult),
      rampSec,
    );
  }
}
