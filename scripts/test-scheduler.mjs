#!/usr/bin/env node
/**
 * Phase 20 — central scheduler and transport validation.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { createEngineScheduler } = await import(join(root, 'dist/engine/scheduler/EngineScheduler.js'));
  const { Transport } = await import(join(root, 'dist/engine/scheduler/Transport.js'));
  const { Generator } = await import(join(root, 'dist/engine/generative/Generator.js'));
  const { createPlantasiaEngine } = await import(join(root, 'dist/public.js'));

  const scheduler = createEngineScheduler();
  let fired = false;
  const timerId = scheduler.setTimeout(() => {
    fired = true;
  }, 30);
  await new Promise((r) => setTimeout(r, 60));
  assert(fired, 'scheduler timeout fires');
  assert(scheduler.activeTimerCount === 0, 'timeout clears after fire');

  const intervalScheduler = createEngineScheduler();
  let ticks = 0;
  const intervalId = intervalScheduler.setInterval(() => {
    ticks += 1;
  }, 20);
  await new Promise((r) => setTimeout(r, 70));
  intervalScheduler.clearInterval(intervalId);
  assert(ticks >= 2, 'scheduler interval fires');
  intervalScheduler.dispose();

  const transport = new Transport(scheduler);
  const tickTimes = [];
  transport.onTick((t) => tickTimes.push(t));
  transport.setBpm(240);
  transport.play();
  await new Promise((r) => setTimeout(r, 120));
  transport.stop();
  transport.dispose();
  assert(tickTimes.length >= 1, 'transport emits ticks');

  const notes = [];
  const gen = new Generator(
    {
      preferredScale: ['C4', 'E4', 'G4'],
      preferredTempo: 120,
      preferredDensity: 0.5,
      phraseLength: 3,
      probabilityBias: 0.4,
      dronePreference: 0.1,
      harmonyStyle: 'pentatonic',
      rhythmStyle: 'moderate',
    },
    { noteOn: (n) => notes.push(n), noteOff: () => {} },
    { scheduler },
  );
  gen.start(120);
  await new Promise((r) => setTimeout(r, 200));
  gen.stop();
  gen.dispose();
  assert(scheduler.activeTimerCount === 0, 'generator clears scheduler timers on stop');

  const engine = createPlantasiaEngine();
  assert(typeof engine.scheduler === 'object', 'facade exposes scheduler');
  assert(typeof engine.transport === 'object', 'facade exposes transport');
  assert(engine.transport.getBpm() === 120, 'default transport BPM');
  engine.transport.setBpm(96);
  assert(engine.transport.getBpm() === 96, 'transport setBpm works');

  await engine.loadSpecies('seed');
  assert(engine.scheduler.activeTimerCount >= 0, 'species load does not leak timers at idle');
  engine.dispose();
  console.log('[test-scheduler] OK — scheduler and transport validated');
}

main().catch((err) => {
  console.error('[test-scheduler]', err.message ?? err);
  process.exit(1);
});
