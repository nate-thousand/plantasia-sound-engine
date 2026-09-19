import type { PerformanceTargets } from '../../engine/performance/types.js';
import type { TemplateEffectsLevels } from './effects.js';

export type TemplatePerformanceBase = {
  filterHz: number;
  effectLevels: TemplateEffectsLevels;
};

/** Apply routed performance targets on top of ecological base levels. */
export function applyTemplatePerformance(
  base: TemplatePerformanceBase,
  targets: PerformanceTargets,
  _audioStarted: boolean,
): void {
  const _filterHz = base.filterHz * targets.filterCutoffMult;
  const _reverbWet = base.effectLevels.reverbWet + targets.reverbWetAdd;
  void _filterHz;
  void _reverbWet;
  // TODO: setRampParam on synth.filter, effects.reverb, etc.
}
