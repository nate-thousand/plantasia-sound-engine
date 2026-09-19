import type { EcologyControlState } from '../EcologyControls.js';
import { DensityEngine } from './DensityEngine.js';
import { ExpressionRouter } from './ExpressionRouter.js';
import { MacroEngine } from './MacroEngine.js';
import { VelocityEngine } from './VelocityEngine.js';
import {
  NEUTRAL_PERFORMANCE_TARGETS,
  type ExpressionProfile,
  type PerformanceTargets,
} from './types.js';

export type NotePerformanceContext = {
  shapedVelocity: number;
  targets: PerformanceTargets;
};

/**
 * Orchestrates velocity, density, macro, and routing for live + generative play.
 */
export class PerformanceEngine {
  private velocity = new VelocityEngine();
  private density = new DensityEngine();
  private macro = new MacroEngine();
  private router: ExpressionRouter;
  private targets: PerformanceTargets = { ...NEUTRAL_PERFORMANCE_TARGETS };
  private ecology: EcologyControlState = {
    growth: 0.42,
    bloom: 0.48,
    roots: 0.35,
    mold: 0.12,
    bacteria: 0.18,
  };

  constructor(profile: ExpressionProfile) {
    this.router = new ExpressionRouter(profile);
  }

  setProfile(profile: ExpressionProfile): void {
    this.router.setProfile(profile);
    this.recompute();
  }

  setEcology(ecology: EcologyControlState): void {
    this.ecology = { ...ecology };
    this.macro.setEcology(ecology);
    this.recompute();
  }

  getEcology(): Readonly<EcologyControlState> {
    return { ...this.ecology };
  }

  /** @param velocity 0–1 normalized */
  noteOn(note: string, velocity: number): NotePerformanceContext {
    this.density.noteOn(note);
    this.velocity.input(velocity);
    this.recompute();
    return {
      shapedVelocity: this.velocity.noteScale(velocity) * this.targets.noteVelocityScale,
      targets: { ...this.targets },
    };
  }

  noteOff(note: string): void {
    this.density.noteOff(note);
    this.recompute();
  }

  recordGenerativeActivity(
    kind: 'phrase' | 'chord' | 'drone' | 'ornament' | 'particle',
  ): void {
    this.density.recordGenerative(kind);
    this.recompute();
  }

  tick(): void {
    this.velocity.tick();
    this.density.tick();
    this.recompute();
  }

  getTargets(): Readonly<PerformanceTargets> {
    return { ...this.targets };
  }

  getDensityEngine(): DensityEngine {
    return this.density;
  }

  reset(): void {
    this.velocity.reset();
    this.density.reset();
    this.targets = { ...NEUTRAL_PERFORMANCE_TARGETS };
  }

  private recompute(): void {
    this.targets = this.router.route(
      this.velocity,
      this.density,
      this.macro,
      this.ecology,
    );
  }
}

export {
  DensityEngine,
  ExpressionRouter,
  MacroEngine,
  VelocityEngine,
  NEUTRAL_PERFORMANCE_TARGETS,
};
export type { ExpressionProfile, PerformanceTargets };
