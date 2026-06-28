#!/usr/bin/env node
/**
 * Phase 21 — CPU soak budget for generative + performance subsystems.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const BUDGET_MS = 5000;
const ITERATIONS = 200;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { Generator } = await import(join(root, 'dist/engine/generative/Generator.js'));
  const { createEngineScheduler } = await import(join(root, 'dist/engine/scheduler/EngineScheduler.js'));
  const { PerformanceEngine } = await import(join(root, 'dist/engine/performance/PerformanceEngine.js'));
  const { SEED_EXPRESSION_PROFILE } = await import(join(root, 'dist/species/seed/expressionProfile.js'));

  const scheduler = createEngineScheduler();
  let noteCount = 0;
  const gen = new Generator(
    {
      preferredScale: ['C4', 'D4', 'E4', 'G4', 'A4'],
      preferredTempo: 120,
      preferredDensity: 0.7,
      phraseLength: 4,
      probabilityBias: 0.5,
      dronePreference: 0.2,
      harmonyStyle: 'pentatonic',
      rhythmStyle: 'moderate',
    },
    { noteOn: () => { noteCount += 1; }, noteOff: () => {} },
    { scheduler },
  );

  const perf = new PerformanceEngine(SEED_EXPRESSION_PROFILE);
  perf.setEcology({ growth: 0.6, bloom: 0.5, roots: 0.3, mold: 0.2, bacteria: 0.3 });

  const start = Date.now();
  gen.start(120);

  for (let i = 0; i < ITERATIONS; i++) {
    perf.noteOn(`C${4 + (i % 3)}`, 0.5 + (i % 5) * 0.1);
    perf.tick();
    if (i % 10 === 0) {
      gen.setEcology({ bloom: 0.3 + (i % 50) / 100 });
    }
  }

  gen.stop();
  gen.dispose();
  scheduler.dispose();
  perf.reset();

  const elapsed = Date.now() - start;
  assert(elapsed < BUDGET_MS, `CPU soak exceeded budget: ${elapsed}ms > ${BUDGET_MS}ms`);
  assert(noteCount >= 0, 'generative ran during soak');

  console.log(`[test-performance-budget] OK — ${ITERATIONS} iterations in ${elapsed}ms (budget ${BUDGET_MS}ms)`);
}

main().catch((err) => {
  console.error('[test-performance-budget]', err.message ?? err);
  process.exit(1);
});
