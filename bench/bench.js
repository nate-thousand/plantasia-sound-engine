/**
 * Browser performance harness for the engine (ROADMAP decision 7).
 *
 * Measures, in a real browser against the built dist:
 *   noteOnLatencyMs   noteOn() call to first audible sample on the master bus
 *   controlSettleMs   setControl() call to the master bus features settling
 *   dropouts          discontinuities in the master bus output over a long run
 *                     while a mock visual loop burns main thread time
 *   engineMsPerFrame  main thread time inside engine calls per animation frame
 *
 * Exposes window.bench.run(options) and writes results to #out.
 */
import { createPlantasiaEngine, getMasterBus } from 'plantasia-sound-engine';
import * as Tone from 'tone';

const out = document.getElementById('out');
const log = (line) => {
  out.textContent += line + '\n';
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/** A tap on the master bus with a long window so no sample slips between reads. */
function createTap(fftSize = 4096) {
  const ctx = Tone.getContext().rawContext;
  const node = ctx.createAnalyser();
  node.fftSize = fftSize;
  node.smoothingTimeConstant = 0;
  getMasterBus().connect(node);
  const buffer = new Float32Array(fftSize);
  return {
    node,
    ctx,
    read() {
      node.getFloatTimeDomainData(buffer);
      return buffer;
    },
  };
}

const AUDIBLE = 0.001;

/** First index whose magnitude passes the audible floor, or -1. */
function firstAudibleIndex(buffer) {
  for (let i = 0; i < buffer.length; i += 1) {
    if (Math.abs(buffer[i]) > AUDIBLE) {
      return i;
    }
  }
  return -1;
}

async function unlockAudio() {
  await Tone.start();
  const ctx = Tone.getContext().rawContext;
  if (ctx.state !== 'running') {
    await ctx.resume();
  }
  return ctx;
}

/**
 * noteOn to audible. Waits for silence, calls noteOn, then polls the tap as
 * fast as the main thread allows. The first audible sample's position inside
 * the tap window gives the moment sound started, independent of poll timing.
 */
async function measureNoteOnLatency(engine, tap, runs = 5) {
  const results = [];
  for (let run = 0; run < runs; run += 1) {
    engine.allNotesOff();
    // wait for silence
    for (let i = 0; i < 400; i += 1) {
      if (firstAudibleIndex(tap.read()) === -1) {
        break;
      }
      await wait(10);
    }
    const sr = tap.ctx.sampleRate;
    const t0 = tap.ctx.currentTime;
    const p0 = performance.now();
    engine.noteOn('C4', 0.9);
    const callMs = performance.now() - p0;
    let latencyMs = null;
    const deadline = performance.now() + 1000;
    while (performance.now() < deadline) {
      const buffer = tap.read();
      const idx = firstAudibleIndex(buffer);
      if (idx !== -1) {
        // The window ends at the most recent render quantum; the audible
        // sample sits (length - idx) samples before that.
        const started = tap.ctx.currentTime - (buffer.length - idx) / sr;
        latencyMs = Math.max(0, (started - t0) * 1000);
        break;
      }
      await wait(1);
    }
    engine.noteOff('C4');
    results.push({ latencyMs, callMs });
    await wait(600);
  }
  return results;
}

/**
 * setControl to settle. Holds a note, steps a control, samples features every
 * 4 ms for 600 ms, and reports the first time after which every later sample
 * stays within 10 percent of the final value. Null when the control produced
 * no measurable change on the chosen feature.
 */
async function measureControlSettle(engine, control, from, to, feature = 'centroid') {
  engine.setControl(control, from);
  engine.noteOn('E3', 0.9);
  await wait(1200);
  const samples = [];
  const p0 = performance.now();
  engine.setControl(control, to);
  while (performance.now() - p0 < 600) {
    samples.push({ t: performance.now() - p0, v: engine.getAudioFeatures()[feature] });
    await wait(4);
  }
  engine.noteOff('E3');
  const before = samples[0].v;
  const final = samples.slice(-10).reduce((a, s) => a + s.v, 0) / 10;
  const delta = Math.abs(final - before);
  if (delta < 0.02) {
    return { control, feature, responseMs: null, settleMs: null, before, final, note: 'no measurable change' };
  }
  const tolerance = Math.max(0.01, delta * 0.1);
  let settleMs = null;
  for (let i = 0; i < samples.length; i += 1) {
    if (samples.slice(i).every((s) => Math.abs(s.v - final) <= tolerance)) {
      settleMs = samples[i].t;
      break;
    }
  }
  // Response: first sample that has moved 20 percent of the way to final.
  let responseMs = null;
  for (const s of samples) {
    if (Math.abs(s.v - before) >= delta * 0.2) {
      responseMs = s.t;
      break;
    }
  }
  return { control, feature, responseMs, settleMs, before, final };
}

/**
 * Long run: generative Seed at defaults with a mock visual loop burning
 * `burnMs` per frame. Counts dropouts as zero runs of at least 128 samples
 * bracketed by audible samples inside one tap window, or sample to sample
 * jumps above 0.5 while the window is audible. Also records engine main
 * thread cost per frame and achieved frame rate.
 */
/** Eight routes covering every source type and both destination kinds (decision 12 for 1.1.0). */
const EIGHT_ROUTES = [
  [{ id: 'lfo-a', type: 'lfo', hz: 0.2, shape: 'sine' }, 'bloom', 0.3],
  [{ id: 'lfo-b', type: 'lfo', beats: 4, shape: 'triangle' }, 'target:filterCutoffMult', 0.5],
  [{ id: 'lfo-c', type: 'lfo', hz: 0.07, shape: 'saw', unipolar: true }, 'roots', 0.2],
  [{ id: 'sh-a', type: 'sample-hold', beats: 1, slew: 0.1 }, 'target:reverbWetAdd', 0.4],
  [{ id: 'sh-b', type: 'sample-hold', hz: 0.5 }, 'mold', 0.15],
  [{ id: 'env-a', type: 'follower', band: 'bass', attack: 0.05, release: 0.4 }, 'target:brightnessAdd', 0.5],
  [{ id: 'wheel', type: 'midi-cc', cc: 1 }, 'growth', 0.3],
  [{ id: 'press', type: 'midi-aftertouch' }, 'target:saturationAdd', 0.5],
];

async function measureLongRun(engine, tap, { seconds = 60, burnMs = 8, routes = 0 } = {}) {
  const handles = [];
  for (const [source, destination, depth] of EIGHT_ROUTES.slice(0, routes)) {
    handles.push(engine.modulate(source, destination, depth));
  }
  if (routes > 0) {
    // give the MIDI sources something to read
    engine.feedMidi([0xb0, 1, 90]);
    engine.feedMidi([0xd0, 40]);
  }
  let dropouts = 0;
  let frames = 0;
  let engineMs = 0;
  let maxEngineMs = 0;
  const glitchSamples = [];
  const start = performance.now();
  const sr = tap.ctx.sampleRate;
  let lastGlitchSample = -Infinity;
  let lastWindow = null;
  let lastWindowTime = 0;
  const record = (kind, absSample, extra) => {
    // windows overlap between reads; count each position once
    if (absSample - lastGlitchSample < 64) {
      return;
    }
    lastGlitchSample = absSample;
    dropouts += 1;
    if (glitchSamples.length < 20) {
      glitchSamples.push({ t: +((performance.now() - start) / 1000).toFixed(2), kind, ...extra });
    }
  };
  while (performance.now() - start < seconds * 1000) {
    const f0 = performance.now();
    engine.getAudioFeatures();
    engine.getWaveform();
    const spent = performance.now() - f0;
    engineMs += spent;
    maxEngineMs = Math.max(maxEngineMs, spent);

    const buffer = tap.read();
    const now = tap.ctx.currentTime;
    const endSample = Math.round(now * sr);

    // Stale window: the audio thread stopped rendering while the clock moved on.
    if (lastWindow && now - lastWindowTime > buffer.length / sr) {
      let identical = true;
      for (let i = 0; i < buffer.length; i += 64) {
        if (buffer[i] !== lastWindow[i]) {
          identical = false;
          break;
        }
      }
      if (identical && firstAudibleIndex(buffer) !== -1) {
        record('stale', endSample, {});
      }
    }
    lastWindow = Float32Array.from(buffer);
    lastWindowTime = now;

    // Exact zero runs of at least one render quantum bracketed by signal, and
    // sample to sample jumps that no synth voice produces.
    let audibleSeen = false;
    let zeroRun = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const v = buffer[i];
      if (v === 0) {
        zeroRun += 1;
      } else {
        if (audibleSeen && zeroRun >= 128 && Math.abs(v) > AUDIBLE) {
          record('gap', endSample - (buffer.length - i), { run: zeroRun });
        }
        zeroRun = 0;
        if (Math.abs(v) > AUDIBLE) {
          audibleSeen = true;
        }
      }
      if (i > 0 && Math.abs(v - buffer[i - 1]) > 0.5) {
        record('jump', endSample - (buffer.length - i), { delta: +Math.abs(v - buffer[i - 1]).toFixed(2) });
      }
    }

    // mock visual work
    const burnUntil = performance.now() + burnMs;
    let x = 0;
    while (performance.now() < burnUntil) {
      x += Math.sqrt(x + 1);
    }
    frames += 1;
    await nextFrame();
  }
  const elapsed = (performance.now() - start) / 1000;
  for (const h of handles) {
    h.remove();
  }
  return {
    seconds: elapsed,
    burnMs,
    routes,
    frames,
    fps: frames / elapsed,
    dropouts,
    glitches: glitchSamples,
    engineMsPerFrame: engineMs / frames,
    engineMsMax: maxEngineMs,
  };
}

/**
 * Main thread cost of the modulation tick itself: time inside
 * ModulationEngine.tick plus the species hook, sampled by wrapping the
 * scheduler interval callback. Reported per tick and per second.
 */
async function measureModulationCost(engine, { seconds = 5, routes = 8 } = {}) {
  const handles = [];
  for (const [source, destination, depth] of EIGHT_ROUTES.slice(0, routes)) {
    handles.push(engine.modulate(source, destination, depth));
  }
  engine.feedMidi([0xb0, 1, 90]);
  engine.feedMidi([0xd0, 40]);
  // Wrap the scheduler so the modulation interval callback is timed.
  const scheduler = engine.scheduler;
  const original = scheduler.setInterval.bind(scheduler);
  let ticks = 0;
  let totalMs = 0;
  let maxMs = 0;
  scheduler.setInterval = (callback, intervalMs, owner) => {
    if (owner !== 'modulation') {
      return original(callback, intervalMs, owner);
    }
    return original(() => {
      const t0 = performance.now();
      callback();
      const spent = performance.now() - t0;
      ticks += 1;
      totalMs += spent;
      maxMs = Math.max(maxMs, spent);
    }, intervalMs, owner);
  };
  // restart the tick so the wrapper takes effect
  engine.stopSpecies();
  await engine.start({ generative: true });
  await wait(seconds * 1000);
  scheduler.setInterval = original;
  for (const h of handles) {
    h.remove();
  }
  return { routes, ticks, msPerTick: ticks ? totalMs / ticks : 0, msMax: maxMs, msPerSecond: totalMs / seconds };
}

async function run(options = {}) {
  const { longRunSeconds = 60, burnMs = 8, latencyRuns = 5 } = options;
  const ctx = await unlockAudio();
  const engine = createPlantasiaEngine();
  await engine.loadSpecies('seed');
  // Played instrument mode: graph running, generator idle, so point
  // measurements start from silence.
  await engine.start({ generative: false });
  const tap = createTap();

  log(`context sampleRate=${ctx.sampleRate} baseLatency=${ctx.baseLatency ?? 'n/a'} outputLatency=${ctx.outputLatency ?? 'n/a'} lookAhead=${Tone.getContext().lookAhead}`);

  const latency = await measureNoteOnLatency(engine, tap, latencyRuns);
  log('noteOn latency: ' + JSON.stringify(latency));

  // Each ecology control against the feature it should move most.
  const settle = [];
  for (const [control, feature] of [
    ['growth', 'rms'],
    ['bloom', 'high'],
    ['roots', 'bass'],
    ['mold', 'centroid'],
    ['bacteria', 'high'],
  ]) {
    settle.push(await measureControlSettle(engine, control, 0.1, 0.95, feature));
    engine.setControl(control, 0.5);
    await wait(400);
  }
  log('control settle: ' + JSON.stringify(settle));

  // Mod wheel to audible (decision 12 for 1.1.0), still in played mode.
  const wheel = await measureWheelResponse(engine, { runs: 5 });
  log('wheel response: ' + JSON.stringify(wheel));

  // Long run: generative Seed at default density.
  engine.stopSpecies();
  await engine.start();
  const longRun = await measureLongRun(engine, tap, { seconds: longRunSeconds, burnMs });
  log('long run: ' + JSON.stringify(longRun));

  // Long run again with eight modulation routes (decision 12 for 1.1.0).
  const longRunModulated = await measureLongRun(engine, tap, { seconds: longRunSeconds, burnMs, routes: 8 });
  log('long run, eight routes: ' + JSON.stringify(longRunModulated));

  const modulationCost = await measureModulationCost(engine, { seconds: 5, routes: 8 });
  log('modulation cost: ' + JSON.stringify(modulationCost));

  engine.dispose();
  const result = {
    userAgent: navigator.userAgent,
    sampleRate: ctx.sampleRate,
    baseLatency: ctx.baseLatency ?? null,
    outputLatency: ctx.outputLatency ?? null,
    lookAhead: Tone.getContext().lookAhead,
    latency,
    settle,
    wheel,
    longRun,
    longRunModulated,
    modulationCost,
  };
  window.benchResult = result;
  return result;
}

/**
 * Exploratory: hold a note, step one control, record every feature for
 * `ms` milliseconds at 4 ms. Returns the series plus per feature before,
 * final and response time (first sample 20 percent of the way to final).
 */
async function probeControl(engine, control, from, to, ms = 800, note = 'E3') {
  engine.setControl(control, from);
  engine.noteOn(note, 0.9);
  await wait(1500);
  const before = { ...engine.getAudioFeatures() };
  const series = [];
  const p0 = performance.now();
  engine.setControl(control, to);
  while (performance.now() - p0 < ms) {
    series.push({ t: +(performance.now() - p0).toFixed(1), ...engine.getAudioFeatures() });
    await wait(4);
  }
  engine.noteOff(note);
  const tail = series.slice(-25);
  const summary = {};
  for (const key of ['rms', 'peak', 'bass', 'mid', 'high', 'centroid']) {
    const final = tail.reduce((a, s) => a + s[key], 0) / tail.length;
    const delta = final - before[key];
    let responseMs = null;
    if (Math.abs(delta) >= 0.01) {
      for (const s of series) {
        if (Math.abs(s[key] - before[key]) >= Math.abs(delta) * 0.2) {
          responseMs = s.t;
          break;
        }
      }
    }
    summary[key] = { before: +before[key].toFixed(3), final: +final.toFixed(3), delta: +delta.toFixed(3), responseMs };
  }
  return { control, from, to, summary, series };
}

async function probe(options = {}) {
  const { species = 'seed', controls = ['growth', 'bloom', 'roots', 'mold', 'bacteria'], from = 0.1, to = 0.95, ms = 800 } = options;
  await unlockAudio();
  const engine = createPlantasiaEngine();
  await engine.loadSpecies(species);
  await engine.start({ generative: false });
  const results = [];
  for (const control of controls) {
    results.push(await probeControl(engine, control, from, to, ms));
    engine.setControl(control, 0.5);
    await wait(800);
  }
  engine.dispose();
  window.probeResult = results;
  return results.map((r) => ({ control: r.control, summary: r.summary }));
}

/**
 * Steady state A/B: for each control, hold a note at `low` then at `high`,
 * average features over `ms` after a settle wait, and report the difference
 * against a same-value A/A run so the voice's own motion has a baseline.
 */
async function abControls(options = {}) {
  const { species = 'seed', controls = ['growth', 'bloom', 'roots', 'mold', 'bacteria'], low = 0.1, high = 0.95, ms = 2000, settle = 1500, note = 'E3' } = options;
  await unlockAudio();
  const engine = createPlantasiaEngine();
  await engine.loadSpecies(species);
  await engine.start({ generative: false });
  const KEYS = ['rms', 'peak', 'bass', 'mid', 'high', 'centroid'];
  const average = async () => {
    const acc = Object.fromEntries(KEYS.map((k) => [k, 0]));
    let n = 0;
    const p0 = performance.now();
    while (performance.now() - p0 < ms) {
      const f = engine.getAudioFeatures();
      for (const k of KEYS) acc[k] += f[k];
      n += 1;
      await wait(8);
    }
    return Object.fromEntries(KEYS.map((k) => [k, acc[k] / n]));
  };
  const hold = async (control, value) => {
    for (const c of ['growth', 'bloom', 'roots', 'mold', 'bacteria']) engine.setControl(c, 0.5);
    engine.setControl(control, value);
    engine.allNotesOff();
    await wait(600);
    engine.noteOn(note, 0.9);
    await wait(settle);
    const avg = await average();
    engine.noteOff(note);
    return avg;
  };
  const out = [];
  for (const control of controls) {
    const a1 = await hold(control, low);
    const a2 = await hold(control, low);
    const b = await hold(control, high);
    const row = { control };
    for (const k of KEYS) {
      row[k] = { aa: +(a2[k] - a1[k]).toFixed(3), ab: +(b[k] - a1[k]).toFixed(3) };
    }
    out.push(row);
  }
  engine.dispose();
  return out;
}

/**
 * Exploratory: hold a note with an LFO routed to a control or target and
 * sample the modulation state and features. Confirms modulation reaches the
 * graph in a real browser.
 */
async function probeModulation(options = {}) {
  const { species = 'seed', destination = 'target:filterCutoffMult', hz = 0.5, depth = 1, ms = 3000, note = 'E3' } = options;
  await unlockAudio();
  const engine = createPlantasiaEngine();
  await engine.loadSpecies(species);
  await engine.start({ generative: false });
  engine.noteOn(note, 0.9);
  await wait(1200);
  const baseline = [];
  for (let i = 0; i < 20; i++) { baseline.push(engine.getAudioFeatures().centroid); await wait(50); }
  const route = engine.modulate({ id: 'probe', type: 'lfo', hz, shape: 'sine' }, destination, depth);
  const series = [];
  const p0 = performance.now();
  while (performance.now() - p0 < ms) {
    const st = engine.getModulationState();
    const f = engine.getAudioFeatures();
    series.push({ t: +((performance.now() - p0) / 1000).toFixed(2), src: +st.sources.probe.value.toFixed(2), off: +(st.targets.filterCutoffMult ?? 0).toFixed(2), bloom: +st.controls.bloom.modulated.toFixed(2), centroid: +f.centroid.toFixed(3), high: +f.high.toFixed(3) });
    await wait(50);
  }
  route.remove();
  engine.noteOff(note);
  engine.dispose();
  const spread = (arr) => +(Math.max(...arr) - Math.min(...arr)).toFixed(3);
  return {
    baselineCentroidSpread: spread(baseline),
    modulatedCentroidSpread: spread(series.map((s) => s.centroid)),
    modulatedHighSpread: spread(series.map((s) => s.high)),
    sourceRange: [Math.min(...series.map((s) => s.src)), Math.max(...series.map((s) => s.src))],
    sample: series.filter((_, i) => i % 8 === 0),
  };
}

/**
 * Mod wheel to audible (decision 12 for 1.1.0). Holds a note, routes a
 * midi-cc source to target:filterCutoffMult at depth -1 (wheel up closes the
 * filter), feeds CC1 at 0 then steps it to 127, and reports the time from
 * the step to the first frame where the high band has moved a fifth of the
 * way to its final value.
 */
async function measureWheelResponse(engine, { runs = 5, note = 'E3' } = {}) {
  const results = [];
  engine.modulate({ id: 'wheel', type: 'midi-cc', cc: 1 }, 'target:filterCutoffMult', -1);
  engine.noteOn(note, 0.9);
  for (let run = 0; run < runs; run += 1) {
    engine.feedMidi([0xb0, 1, 0]);
    await wait(900);
    const before = [];
    for (let i = 0; i < 10; i += 1) { before.push(engine.getAudioFeatures().high); await wait(16); }
    const baseline = before.reduce((a, b) => a + b, 0) / before.length;
    const p0 = performance.now();
    engine.feedMidi([0xb0, 1, 127]);
    const series = [];
    let stateMs = null;
    while (performance.now() - p0 < 700) {
      const t = performance.now() - p0;
      if (stateMs === null && (engine.getModulationState().targets.filterCutoffMult ?? 0) < -0.4) {
        stateMs = +t.toFixed(1);
      }
      series.push({ t, v: engine.getAudioFeatures().high });
      await wait(4);
    }
    const final = series.slice(-20).reduce((a, s) => a + s.v, 0) / 20;
    const delta = final - baseline;
    // Response: two consecutive samples at least half way to the final value,
    // so the band's own motion (about 0.03) cannot trigger it.
    let responseMs = null;
    if (Math.abs(delta) >= 0.06) {
      for (let i = 1; i < series.length; i += 1) {
        const a = Math.abs(series[i - 1].v - baseline) >= Math.abs(delta) * 0.5;
        const b = Math.abs(series[i].v - baseline) >= Math.abs(delta) * 0.5;
        if (a && b) { responseMs = series[i - 1].t; break; }
      }
    }
    results.push({ stateMs, responseMs: responseMs === null ? null : +responseMs.toFixed(1), baseline: +baseline.toFixed(3), final: +final.toFixed(3) });
  }
  engine.noteOff(note);
  engine.removeModulation(engine.getModulationRoutes().find((r) => r.source.id === 'wheel')?.id);
  return results;
}

async function probeWheel(options = {}) {
  await unlockAudio();
  const engine = createPlantasiaEngine();
  await engine.loadSpecies(options.species ?? 'seed');
  await engine.start({ generative: false });
  const results = await measureWheelResponse(engine, options);
  engine.dispose();
  return results;
}

/** Where the wheel latency goes: MIDI store, modulation state, then audio. */
async function probeWheelStages({ runs = 3, note = 'E3' } = {}) {
  await unlockAudio();
  const engine = createPlantasiaEngine();
  await engine.loadSpecies('seed');
  await engine.start({ generative: false });
  engine.modulate({ id: 'wheel', type: 'midi-cc', cc: 1 }, 'target:filterCutoffMult', -1);
  engine.noteOn(note, 0.9);
  const out = [];
  for (let run = 0; run < runs; run += 1) {
    engine.feedMidi([0xb0, 1, 0]);
    await wait(900);
    const baseHigh = engine.getAudioFeatures().high;
    const p0 = performance.now();
    engine.feedMidi([0xb0, 1, 127]);
    let tStore = null, tState = null, tAudio = null;
    while (performance.now() - p0 < 700) {
      const t = performance.now() - p0;
      if (tStore === null && engine.midi.read('cc', 1).value === 1) tStore = t;
      if (tState === null && (engine.getModulationState().targets.filterCutoffMult ?? 0) < -0.4) tState = t;
      if (tAudio === null && engine.getAudioFeatures().high < baseHigh - 0.07) tAudio = t;
      if (tStore !== null && tState !== null && tAudio !== null) break;
      await wait(2);
    }
    out.push({ tStore: +tStore?.toFixed(1), tState: +tState?.toFixed(1), tAudio: tAudio === null ? null : +tAudio.toFixed(1), baseHigh: +baseHigh.toFixed(3) });
  }
  engine.dispose();
  return out;
}

window.bench = { run, probe, probeControl, abControls, probeModulation, measureWheelResponse, probeWheel, probeWheelStages };
document.getElementById('unlock').addEventListener('click', () => {
  run({ longRunSeconds: 10 }).then((r) => log(JSON.stringify(r, null, 2)));
});
