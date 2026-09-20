import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Bars from ROADMAP decision 7. Only noteOn latency and dropouts block.
 * Control settle and engine main thread cost are recorded, not asserted.
 */
const NOTE_ON_LATENCY_MS = 15;
const LONG_RUN_SECONDS = Number(process.env.BENCH_SECONDS ?? 60);
const BURN_MS = 8;

test('engine performance bar', async ({ page, browserName }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto('/');
  // A real click unlocks audio in WebKit; Chromium is unlocked by launch flag.
  await page.click('#unlock', { trial: true });
  const result = await page.evaluate(
    ({ seconds, burnMs }) => window.bench.run({ longRunSeconds: seconds, burnMs }),
    { seconds: LONG_RUN_SECONDS, burnMs: BURN_MS },
  );

  mkdirSync(join(process.cwd(), 'bench', 'results'), { recursive: true });
  writeFileSync(
    join(process.cwd(), 'bench', 'results', `${browserName}.json`),
    JSON.stringify(result, null, 2),
  );

  const latencies = result.latency.map((r) => r.latencyMs).filter((v) => v !== null);
  const median = [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length / 2)];
  console.log(
    `[${browserName}] noteOn latency median ${median?.toFixed(1)} ms (runs ${latencies.map((v) => v.toFixed(1)).join(', ')}), ` +
      `call ${result.latency.map((r) => r.callMs.toFixed(2)).join('/')} ms, lookAhead ${result.lookAhead}s, ` +
      `baseLatency ${result.baseLatency}, outputLatency ${result.outputLatency}`,
  );
  for (const s of result.settle) {
    console.log(
      `[${browserName}] setControl ${s.control} -> ${s.feature}: ` +
        (s.settleMs === null
          ? `no measurable change (${s.before.toFixed(3)} -> ${s.final.toFixed(3)})`
          : `responds in ${s.responseMs?.toFixed(0)} ms, settles in ${s.settleMs.toFixed(0)} ms (${s.before.toFixed(3)} -> ${s.final.toFixed(3)})`),
    );
  }
  console.log(
    `[${browserName}] long run ${result.longRun.seconds.toFixed(0)}s: dropouts ${result.longRun.dropouts}, ` +
      `fps ${result.longRun.fps.toFixed(1)}, engine ${result.longRun.engineMsPerFrame.toFixed(3)} ms/frame (max ${result.longRun.engineMsMax.toFixed(2)})`,
  );

  const wheelTimes = result.wheel.map((r) => r.responseMs).filter((v) => v !== null);
  const wheelMedian = [...wheelTimes].sort((a, b) => a - b)[Math.floor(wheelTimes.length / 2)];
  const stateTimes = result.wheel.map((r) => r.stateMs).filter((v) => v !== null);
  const stateMedian = [...stateTimes].sort((a, b) => a - b)[Math.floor(stateTimes.length / 2)];
  console.log(
    `[${browserName}] wheel to modulation state median ${stateMedian?.toFixed(1)} ms; wheel to audible median ${wheelMedian?.toFixed(1)} ms ` +
      `(runs ${result.wheel.map((r) => (r.responseMs === null ? 'none' : r.responseMs.toFixed(1))).join(', ')})`,
  );
  console.log(
    `[${browserName}] long run, eight routes, ${result.longRunModulated.seconds.toFixed(0)}s: dropouts ${result.longRunModulated.dropouts}, ` +
      `fps ${result.longRunModulated.fps.toFixed(1)}, engine ${result.longRunModulated.engineMsPerFrame.toFixed(3)} ms/frame (max ${result.longRunModulated.engineMsMax.toFixed(2)})`,
  );
  console.log(
    `[${browserName}] modulation tick, eight routes: ${result.modulationCost.msPerTick.toFixed(3)} ms/tick (max ${result.modulationCost.msMax.toFixed(2)}), ${result.modulationCost.msPerSecond.toFixed(1)} ms/s over ${result.modulationCost.ticks} ticks`,
  );

  expect(errors, 'no page errors').toEqual([]);
  expect(latencies.length, 'every latency run produced sound').toBe(result.latency.length);
  expect(median, 'noteOn to audible').toBeLessThanOrEqual(NOTE_ON_LATENCY_MS);
  expect(result.longRun.dropouts, 'dropouts over the long run').toBe(0);
  expect(result.longRunModulated.dropouts, 'dropouts over the long run with eight routes').toBe(0);
});

/** Decision 3 after 1.1.0 (hardening): no species throws at a control extreme. Blocks. */
test('control extremes load every species', async ({ page, browserName }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto('/');
  await page.click('#unlock', { trial: true });
  const result = await page.evaluate(() => window.bench.probeExtremes());
  console.log(`[${browserName}] control extremes: ${result.runs} runs, ${result.failures.length} failures`);
  for (const f of result.failures) console.log(`[${browserName}]   ${f.species} at ${f.case}: ${f.error}`);
  expect(errors, 'no page errors').toEqual([]);
  expect(result.failures, 'no species throws at a control extreme').toEqual([]);
});
