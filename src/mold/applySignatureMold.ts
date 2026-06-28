import type { MoldEffectParams } from './types.js';

/** Targets shared by signature synth graphs (Juno Flowers, Plantasonic). */
export type SignatureMoldTargets = {
  delayFeedback: (value: number) => void;
  delayTime?: (value: number) => void;
  delayWet?: (value: number) => void;
  filterQ?: (value: number) => void;
  chorusRate?: (value: number) => void;
  stereoDepth?: (value: number) => void;
  stereoRate?: (value: number) => void;
  saturation?: (value: number) => void;
  texture?: (value: number) => void;
  reverbSend?: (value: number) => void;
};

/**
 * Apply resolved mold parameters to a signature synth graph.
 * Profile-specific weighting is already baked into params.
 */
export function applySignatureMold(
  targets: SignatureMoldTargets,
  params: MoldEffectParams,
): void {
  const feedback = Math.min(
    0.92,
    0.18 + params.delayFeedbackBoost + params.selfOscDelay * 0.4,
  );
  targets.delayFeedback(feedback);

  if (targets.delayTime) {
    targets.delayTime(0.25 + params.wowDepth * 14 + params.delayInstability * 0.08);
  }

  if (targets.delayWet) {
    targets.delayWet(0.1 + params.delayBloom * 0.42 + params.reverseEcho * 0.18);
  }

  if (targets.filterQ) {
    targets.filterQ(Math.max(0.35, 0.9 + params.filterInstability * 0.12));
  }

  if (targets.chorusRate) {
    targets.chorusRate(0.2 + params.flutterDepth * 90 + params.grainDensity * 0.35);
  }

  if (targets.stereoDepth) {
    targets.stereoDepth(
      (0.2 + params.stereoInstability * 0.45) * (0.6 + params.harmonicBloom * 0.4),
    );
  }

  if (targets.stereoRate) {
    targets.stereoRate(0.05 + params.stereoInstability * 0.2 + params.modulationDepth * 0.15);
  }

  if (targets.saturation) {
    targets.saturation(params.saturation * 0.55 + params.harmonicDistortion * 0.25);
  }

  if (targets.texture) {
    const textureLevel = params.textureCrackle + params.textureAir + params.crackle * 0.4;
    targets.texture(textureLevel * 0.08);
  }

  if (targets.reverbSend) {
    targets.reverbSend(0.35 + params.delayBloom * 0.28 + params.reverseEcho * 0.22);
  }
}
