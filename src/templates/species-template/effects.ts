/**
 * Template effects chain — replace with species-specific color and space.
 *
 * Responsibilities:
 * - createTemplateEffects() — build chain
 * - connectTemplateEffects(input, effects) — wire synth → effects → destination
 * - applyTemplateEffectsLevels() — map ecological + performance levels to nodes
 * - disposeTemplateEffects() — cleanup
 */

export type TemplateEffectsNodes = Record<string, never>;

export type TemplateEffectsLevels = {
  reverbWet: number;
  chorusWet: number;
  releaseScale: number;
};

export function createTemplateEffects(): TemplateEffectsNodes {
  return {};
}

export function connectTemplateEffects(
  _input: unknown,
  _effects: TemplateEffectsNodes,
): void {}

export function applyTemplateEffectsLevels(
  _effects: TemplateEffectsNodes,
  _levels: TemplateEffectsLevels,
  _audioStarted: boolean,
): void {}

export function disposeTemplateEffects(_nodes: TemplateEffectsNodes): void {}
