import type { MoldEffectParams, MoldModuleWeights, MoldStageId } from './types.js';
import { normalizeMold } from './normalize.js';

function w(weights: MoldModuleWeights, key: keyof MoldModuleWeights, value: number): number {
  return value * weights[key];
}

/**
 * Compute resolved degradation parameters from stage blends and module weights.
 * Each stage activates different processes — see docs/SOUND_DESIGN.md.
 */
export function resolveModuleParameters(
  mold: number,
  stages: Record<MoldStageId, number>,
  weights: MoldModuleWeights,
): MoldEffectParams {
  const intensity = normalizeMold(mold) / 100;
  const ease = intensity * intensity * (3 - 2 * intensity);
  const { aging, decay, mutation, corruption, overgrowth } = stages;

  const tapeWear = w(weights, 'tapeWear', aging * 0.55 + decay * 0.2 + overgrowth * 0.15);
  const wowDepth = w(weights, 'tapeWear', 0.0012 + aging * 0.018 + overgrowth * 0.012);
  const flutterDepth = w(weights, 'tapeWear', 0.0006 + aging * 0.009 + overgrowth * 0.008);
  const saturation = w(weights, 'tapeWear', aging * 0.22 + decay * 0.12 + overgrowth * 0.08);

  const harmonicDistortion = w(
    weights,
    'harmonicDistortion',
    decay * 0.42 + corruption * 0.28 + overgrowth * 0.18,
  );
  const crackle = w(weights, 'textureEngine', decay * 0.18 + mutation * 0.08);

  const delayFeedbackBoost = w(
    weights,
    'delayCorruption',
    decay * 0.22 + mutation * 0.28 + corruption * 0.35 + overgrowth * 0.42,
  );
  const delayInstability = w(
    weights,
    'delayCorruption',
    decay * 0.25 + corruption * 0.32 + overgrowth * 0.28,
  );
  const delayBloom = w(weights, 'delayCorruption', mutation * 0.38 + overgrowth * 0.22);
  const reverseEcho = w(weights, 'delayCorruption', mutation * 0.15 + overgrowth * 0.35);

  const grainDensity = w(weights, 'granularMutation', mutation * 0.65 + overgrowth * 0.35);
  const reverseGrains = w(weights, 'granularMutation', mutation * 0.42 + overgrowth * 0.28);
  const microStutter = w(weights, 'granularMutation', mutation * 0.48 + corruption * 0.18);
  const bufferRepeat = w(weights, 'bufferGlitch', mutation * 0.32 + corruption * 0.28);

  const glitchBurst = w(weights, 'bufferGlitch', overgrowth * 0.42);
  const tapeChew = w(weights, 'bufferGlitch', overgrowth * 0.38 + decay * 0.12);
  const bufferScramble = w(weights, 'bufferGlitch', corruption * 0.45 + overgrowth * 0.25);

  const bitDepth = 16 - w(weights, 'spectralDecay', corruption * 10 + overgrowth * 4);
  const sampleRateReduction = w(
    weights,
    'spectralDecay',
    corruption * 0.72 + overgrowth * 0.28,
  );
  const spectralSmear = w(weights, 'spectralDecay', corruption * 0.55 + overgrowth * 0.22);
  const ringMod = w(weights, 'spectralDecay', corruption * 0.12 + overgrowth * 0.08);

  const pitchDriftCents = w(
    weights,
    'pitchInstability',
    aging * 6 + decay * 8 + corruption * 12 + overgrowth * 8,
  );
  const pitchSlip = w(weights, 'pitchInstability', decay * 0.35 + corruption * 0.28);
  const randomPitchOffset = w(
    weights,
    'pitchInstability',
    corruption * 0.42 + overgrowth * 0.35,
  );
  const dropoutProbability = w(weights, 'bufferGlitch', decay * 0.18 + corruption * 0.22);

  const textureCrackle = w(weights, 'textureEngine', decay * 0.12 + mutation * 0.06);
  const textureAir = w(weights, 'textureEngine', aging * 0.04 + mutation * 0.05);

  const filterInstability = w(
    weights,
    'tapeWear',
    aging * 4.5 + decay * 2.5 + corruption * 3.5,
  );
  const modulationDepth = w(
    weights,
    'pitchInstability',
    aging * 0.2 + mutation * 0.35 + overgrowth * 0.45,
  );
  const stereoInstability = w(
    weights,
    'tapeWear',
    aging * 0.28 + mutation * 0.22 + overgrowth * 0.35,
  );
  const selfOscDelay = w(weights, 'delayCorruption', corruption * 0.25 + overgrowth * 0.55);
  const harmonicBloom = w(weights, 'harmonicDistortion', mutation * 0.22 + overgrowth * 0.38);

  return {
    intensity: ease,
    stages,
    tapeWear,
    wowDepth,
    flutterDepth,
    saturation,
    harmonicDistortion,
    crackle,
    delayFeedbackBoost,
    delayInstability,
    delayBloom,
    reverseEcho,
    grainDensity,
    reverseGrains,
    microStutter,
    bufferRepeat,
    glitchBurst,
    tapeChew,
    bufferScramble,
    bitDepth: Math.max(4, bitDepth),
    sampleRateReduction,
    spectralSmear,
    ringMod,
    pitchDriftCents,
    pitchSlip,
    randomPitchOffset,
    dropoutProbability,
    textureCrackle,
    textureAir,
    filterInstability,
    modulationDepth,
    stereoInstability,
    selfOscDelay,
    harmonicBloom,
  };
}
