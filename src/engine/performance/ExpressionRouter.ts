import type { EcologyControlState } from '../EcologyControls.js';
import { macroToPerformanceTargets, MacroEngine } from './MacroEngine.js';
import { VelocityEngine } from './VelocityEngine.js';
import { DensityEngine } from './DensityEngine.js';
import {
  clampPerformance,
  NEUTRAL_PERFORMANCE_TARGETS,
  type ExpressionProfile,
  type ExpressionSources,
  type PerformanceTargets,
} from './types.js';

/**
 * Centralized routing from performance sources → synth/effects targets.
 * Species define profiles; routing logic lives here — not in species code.
 */
export class ExpressionRouter {
  private profile: ExpressionProfile;

  constructor(profile: ExpressionProfile) {
    this.profile = profile;
  }

  setProfile(profile: ExpressionProfile): void {
    this.profile = profile;
  }

  route(
    velocity: VelocityEngine,
    density: DensityEngine,
    macro: MacroEngine,
    ecology: EcologyControlState,
  ): PerformanceTargets {
    const densityState = density.getState();
    const sources: ExpressionSources = {
      velocity: velocity.getSmoothed(),
      lastNoteVelocity: velocity.getLast(),
      ecology,
      density: densityState,
      legato: density.isLegato(),
      staccato: density.isStaccato(),
      chordHeld: density.isChordHeld(),
    };

    return this.routeFromSources(sources, macro);
  }

  routeFromSources(
    sources: ExpressionSources,
    macro: MacroEngine,
  ): PerformanceTargets {
    const { profile } = this;
    const sens = profile.sensitivity;
    const v = sources.velocity;
    const vw = profile.velocity;
    const dw = profile.density;
    const d = sources.density;

    const activity =
      d.averageDensity * 0.45 +
      d.phraseActivity * dw.phraseActivity * 0.25 +
      d.harmonicActivity * 0.2 +
      d.droneActivity * 0.1;

    const macroExpanded = macro.expand(profile);
    const macroTargets = macroToPerformanceTargets(macroExpanded);

    const velocityFilter = 1 + (v - 0.5) * vw.filterCutoff * sens * 0.6;
    const velocityAttack = 1 + (0.5 - v) * vw.attack * sens * 0.5;
    const velocityRelease = 1 + (v - 0.5) * vw.release * sens * 0.4;
    const brightness = v * vw.brightness * sens * 0.35;
    const chorus = 1 + (v - 0.5) * vw.chorusDepth * sens * 0.5;
    const reverb = (v - 0.3) * vw.reverbWet * sens * 0.25;
    const saturation = Math.max(0, (v - 0.4) * vw.saturation * sens * 0.4);
    const oscBlend = (v - 0.5) * vw.oscBlend * sens * 0.3;

    const densityFilter = 1 + activity * dw.filterOpen * sens * 0.35;
    const stereoWidth = 1 + activity * dw.stereoWidth * sens * 0.45;
    const instability = activity * dw.instability * sens * 0.5;
    const particleRate = 1 + activity * dw.particleRate * sens * 0.55;

    const legatoAttack = sources.legato ? 0.75 : 1;
    const staccatoRelease = sources.staccato ? 0.65 : 1;
    const chordBrightness = sources.chordHeld ? 0.08 * sens : 0;

    const noteVelocityScale =
      0.35 + Math.pow(sources.lastNoteVelocity, 1.15) * 0.65;

    return {
      filterCutoffMult: clampPerformance(
        velocityFilter * densityFilter * (macroTargets.filterCutoffMult ?? 1),
        0.4,
        2.2,
      ),
      attackMult: clampPerformance(
        velocityAttack * legatoAttack * (macroTargets.attackMult ?? 1),
        0.35,
        2.5,
      ),
      releaseMult: clampPerformance(
        velocityRelease * staccatoRelease * (macroTargets.releaseMult ?? 1),
        0.35,
        2.5,
      ),
      brightnessAdd:
        brightness + chordBrightness + (macroTargets.brightnessAdd ?? 0),
      chorusDepthMult: clampPerformance(
        chorus * (macroTargets.chorusDepthMult ?? 1),
        0.5,
        2,
      ),
      reverbWetAdd: reverb + (macroTargets.reverbWetAdd ?? 0),
      saturationAdd: saturation + (macroTargets.saturationAdd ?? 0),
      oscBlendAdd: oscBlend + (macroTargets.oscBlendAdd ?? 0),
      stereoWidthMult: clampPerformance(
        stereoWidth * (macroTargets.stereoWidthMult ?? 1),
        0.7,
        2,
      ),
      instabilityAdd: instability + (macroTargets.instabilityAdd ?? 0),
      particleRateMult: clampPerformance(
        particleRate * (macroTargets.particleRateMult ?? 1),
        0.5,
        2.5,
      ),
      generativeDensityAdd: macroTargets.generativeDensityAdd ?? 0,
      noteVelocityScale: clampPerformance(noteVelocityScale, 0.2, 1),
      legato: sources.legato,
    };
  }
}

export { NEUTRAL_PERFORMANCE_TARGETS };
