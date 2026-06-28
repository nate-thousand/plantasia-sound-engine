import type { EcologyControlState } from '../EcologyControls.js';
import {
  NEUTRAL_PERFORMANCE_TARGETS,
  type ExpressionProfile,
  type MacroWeights,
  type PerformanceTargetWeights,
  type PerformanceTargets,
} from './types.js';

function mergeMacro(
  out: PerformanceTargetWeights,
  partial: Partial<PerformanceTargetWeights>,
  strength: number,
): void {
  for (const key of Object.keys(partial) as (keyof PerformanceTargetWeights)[]) {
    const delta = partial[key];
    if (delta !== undefined) {
      out[key] += delta * strength;
    }
  }
}

/**
 * High-level expressive macros — growth, bloom, roots, mold, bacteria
 * influence many targets simultaneously.
 */
export class MacroEngine {
  private ecology: EcologyControlState = {
    growth: 0.42,
    bloom: 0.48,
    roots: 0.35,
    mold: 0.12,
    bacteria: 0.18,
  };

  setEcology(ecology: EcologyControlState): void {
    this.ecology = { ...ecology };
  }

  getEcology(): Readonly<EcologyControlState> {
    return { ...this.ecology };
  }

  expand(profile: ExpressionProfile): PerformanceTargetWeights {
    const out: PerformanceTargetWeights = {
      filterCutoffMult: 0,
      attackMult: 0,
      releaseMult: 0,
      brightnessAdd: 0,
      chorusDepthMult: 0,
      reverbWetAdd: 0,
      saturationAdd: 0,
      oscBlendAdd: 0,
      stereoWidthMult: 0,
      instabilityAdd: 0,
      particleRateMult: 0,
      generativeDensityAdd: 0,
    };

    const macros: MacroWeights = profile.macros;
    mergeMacro(out, macros.growth, this.ecology.growth);
    mergeMacro(out, macros.bloom, this.ecology.bloom);
    mergeMacro(out, macros.roots, this.ecology.roots);
    mergeMacro(out, macros.mold, this.ecology.mold);
    mergeMacro(out, macros.bacteria, this.ecology.bacteria);

    return out;
  }
}

export function macroToPerformanceTargets(
  macro: PerformanceTargetWeights,
): Partial<PerformanceTargets> {
  return {
    filterCutoffMult: 1 + macro.filterCutoffMult,
    attackMult: 1 + macro.attackMult,
    releaseMult: 1 + macro.releaseMult,
    brightnessAdd: macro.brightnessAdd,
    chorusDepthMult: 1 + macro.chorusDepthMult,
    reverbWetAdd: macro.reverbWetAdd,
    saturationAdd: macro.saturationAdd,
    oscBlendAdd: macro.oscBlendAdd,
    stereoWidthMult: 1 + macro.stereoWidthMult,
    instabilityAdd: macro.instabilityAdd,
    particleRateMult: 1 + macro.particleRateMult,
    generativeDensityAdd: macro.generativeDensityAdd,
  };
}

export { NEUTRAL_PERFORMANCE_TARGETS };
