#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { PerformanceEngine } = await import(join(root, 'dist/engine/performance/PerformanceEngine.js'));
  const { NEUTRAL_PERFORMANCE_TARGETS } = await import(join(root, 'dist/engine/performance/types.js'));
  const { SEED_EXPRESSION_PROFILE } = await import(join(root, 'dist/species/seed/expressionProfile.js'));
  const { FLOWERS_EXPRESSION_PROFILE } = await import(
    join(root, 'dist/species/flowers/expressionProfile.js')
  );
  const { MOLD_EXPRESSION_PROFILE } = await import(join(root, 'dist/species/mold/expressionProfile.js'));
  const { BACTERIA_EXPRESSION_PROFILE } = await import(
    join(root, 'dist/species/bacteria/expressionProfile.js')
  );

  const profiles = [
    SEED_EXPRESSION_PROFILE,
    FLOWERS_EXPRESSION_PROFILE,
    MOLD_EXPRESSION_PROFILE,
    BACTERIA_EXPRESSION_PROFILE,
  ];
  assert(profiles.length === 4, 'four expression profiles');
  for (const p of profiles) {
    assert(p.sensitivity > 0 && p.sensitivity <= 1, `${p.id} sensitivity`);
    assert(p.character.length >= 2, `${p.id} character tags`);
  }

  const engine = new PerformanceEngine(SEED_EXPRESSION_PROFILE);
  const neutral = engine.getTargets();
  assert(neutral.filterCutoffMult === NEUTRAL_PERFORMANCE_TARGETS.filterCutoffMult, 'neutral filter');

  engine.setEcology({ growth: 0.8, bloom: 0.7, roots: 0.2, mold: 0.3, bacteria: 0.4 });
  const macroTargets = engine.getTargets();
  assert(macroTargets.filterCutoffMult !== neutral.filterCutoffMult, 'ecology shifts targets');

  const soft = engine.noteOn('C4', 0.2);
  assert(soft.shapedVelocity < 0.65, 'soft velocity shaped down');
  const hard = engine.noteOn('D4', 1);
  assert(hard.shapedVelocity > soft.shapedVelocity, 'hard velocity > soft');
  assert(hard.targets.filterCutoffMult > soft.targets.filterCutoffMult, 'velocity opens filter');

  engine.noteOff('C4');
  engine.noteOn('E4', 0.9);
  engine.noteOn('G4', 0.85);
  const dense = engine.getTargets();
  assert(dense.stereoWidthMult >= neutral.stereoWidthMult, 'density affects stereo for seed');

  engine.recordGenerativeActivity('phrase');
  engine.recordGenerativeActivity('chord');
  engine.tick();
  assert(engine.getTargets().generativeDensityAdd >= 0, 'generative activity tracked');

  const moldEngine = new PerformanceEngine(MOLD_EXPRESSION_PROFILE);
  moldEngine.setEcology({ growth: 0.3, bloom: 0.3, roots: 0.5, mold: 0.9, bacteria: 0.5 });
  for (let i = 0; i < 8; i++) {
    moldEngine.noteOn(`C${3 + (i % 4)}`, 0.7 + i * 0.03);
  }
  const moldDense = moldEngine.getTargets();
  assert(moldDense.instabilityAdd > neutral.instabilityAdd, 'mold density adds instability');

  const bacteriaEngine = new PerformanceEngine(BACTERIA_EXPRESSION_PROFILE);
  bacteriaEngine.setEcology({ growth: 0.4, bloom: 0.4, roots: 0.2, mold: 0.1, bacteria: 0.95 });
  bacteriaEngine.noteOn('A5', 0.9);
  bacteriaEngine.noteOn('B5', 0.85);
  const bacteriaTargets = bacteriaEngine.getTargets();
  assert(bacteriaTargets.particleRateMult > 1, 'bacteria density raises particle rate');

  engine.reset();
  assert(engine.getTargets().filterCutoffMult === NEUTRAL_PERFORMANCE_TARGETS.filterCutoffMult, 'reset');

  console.log('test-performance-engine: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
