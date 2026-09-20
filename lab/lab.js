/**
 * Lab page (ROADMAP decision 9 after 1.1.0): a local tool for tuning the
 * engine by ear. Species select, a held note or chord, one control sweep with
 * the species ramp on or off, species A/B, a span editor that emits JSON, and
 * the analyser bands. Runs against the built dist on the root export.
 */
import { PlantasiaEngine, ECOLOGICAL_CONTROLS, MODULATABLE_TARGETS, MODULATION_TARGET_SPANS } from 'plantasia-sound-engine';
import * as Tone from 'tone';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const NOTES = ['C2', 'E2', 'G2', 'C3', 'E3', 'G3', 'A3', 'C4', 'E4', 'G4', 'C5'];
const CHORD_OFFSETS = { C: ['C', 'E', 'G'], E: ['E', 'G#', 'B'], G: ['G', 'B', 'D'], A: ['A', 'C', 'E'] };
const FEATURE_KEYS = ['rms', 'peak', 'bass', 'mid', 'high', 'centroid'];

const engine = new PlantasiaEngine();
const state = {
  unlocked: false,
  species: null,
  held: [],
  velocity: 0.9,
  ramp: true,
  auditions: new Map(),
  sweeping: false,
};

const setStatus = (text) => {
  $('status').textContent = text;
};

// ---------------------------------------------------------------------------
// Audio and species

async function unlock() {
  if (state.unlocked) return;
  await Tone.start();
  const ctx = Tone.getContext().rawContext;
  if (ctx.state !== 'running') await ctx.resume();
  await engine.init();
  state.unlocked = true;
  $('unlock').classList.add('on');
  setStatus('audio running');
}

function chordFor(note) {
  const root = note.slice(0, -1);
  const octave = Number(note.slice(-1));
  const names = CHORD_OFFSETS[root] ?? CHORD_OFFSETS.C;
  const ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let last = ORDER.indexOf(names[0]);
  let oct = octave;
  return names.map((n) => {
    const idx = ORDER.indexOf(n);
    if (idx < last) oct += 1;
    last = idx;
    return `${n}${oct}`;
  });
}

async function loadSpecies(id) {
  await unlock();
  const generative = $('generative').checked;
  setStatus(`loading ${id}`);
  await engine.loadSpecies(id);
  await engine.start({ generative });
  state.species = id;
  $('species').value = id;
  setStatus(`${id} running${generative ? ', generative' : ', played'}`);
  rehold();
}

function rehold() {
  if (!state.held.length || !state.species) return;
  for (const note of state.held) engine.noteOn(note, state.velocity);
}

function hold(notes) {
  if (!state.species) return;
  release();
  state.held = notes;
  rehold();
  $('held').textContent = `held: ${notes.join(' ')}`;
}

function release() {
  if (state.species) engine.allNotesOff();
  state.held = [];
  $('held').textContent = 'nothing held';
}

// ---------------------------------------------------------------------------
// Sweep

function setControl(control, value) {
  if (!state.species) return;
  engine.setControl(control, value, state.ramp ? undefined : 0);
  if (control === $('control').value) {
    $('controlValue').value = String(value);
    $('controlReadout').textContent = value.toFixed(2);
  }
}

async function autoSweep() {
  if (state.sweeping || !state.species) return;
  state.sweeping = true;
  $('autoSweep').classList.add('on');
  const control = $('control').value;
  const seconds = Math.max(1, Number($('sweepSec').value) || 6);
  const steps = Math.round(seconds * 30);
  for (let i = 0; i <= steps && state.sweeping; i += 1) {
    setControl(control, 0.1 + (0.85 * i) / steps);
    await wait(1000 / 30);
  }
  state.sweeping = false;
  $('autoSweep').classList.remove('on');
}

/** Decision 10 bar: for one control, is the A/B spectral difference larger than the A/A noise on at least one feature. */
async function measureControl(control, { low = 0.1, high = 0.95, ms = 2000, settle = 1500 } = {}) {
  const note = state.held[0] ?? $('note').value;
  const average = async () => {
    const acc = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0]));
    let n = 0;
    const p0 = performance.now();
    while (performance.now() - p0 < ms) {
      const f = engine.getAudioFeatures();
      for (const k of FEATURE_KEYS) acc[k] += f[k];
      n += 1;
      await wait(8);
    }
    return Object.fromEntries(FEATURE_KEYS.map((k) => [k, acc[k] / n]));
  };
  const holdAt = async (value) => {
    engine.setControl(control, value, 0);
    engine.allNotesOff();
    await wait(600);
    engine.noteOn(note, state.velocity);
    await wait(settle);
    const avg = await average();
    engine.noteOff(note);
    return avg;
  };
  const a1 = await holdAt(low);
  const a2 = await holdAt(low);
  const b = await holdAt(high);
  const row = {};
  for (const k of FEATURE_KEYS) row[k] = { aa: a2[k] - a1[k], ab: b[k] - a1[k] };
  return row;
}

async function runMeasure() {
  if (!state.species || state.sweeping) return;
  const control = $('control').value;
  const out = $('measureOut');
  out.textContent = `measuring ${control} on ${state.species}: A at 0.10, A again, B at 0.95, 2 s averages after 1.5 s settle`;
  const before = Object.fromEntries(ECOLOGICAL_CONTROLS.map((c) => [c, engine.getControl(c)]));
  const wasHeld = state.held.slice();
  state.held = [];
  try {
    const row = await measureControl(control);
    const lines = [`${state.species} / ${control}`, 'feature     A/A      A/B     pass'];
    let passes = 0;
    for (const k of FEATURE_KEYS) {
      const { aa, ab } = row[k];
      const pass = Math.abs(ab) > Math.abs(aa) * 2 && Math.abs(ab) > 0.005;
      if (pass) passes += 1;
      lines.push(`${k.padEnd(10)} ${aa.toFixed(3).padStart(7)}  ${ab.toFixed(3).padStart(7)}   ${pass ? 'yes' : '.'}`);
    }
    lines.push(passes > 0 ? `bar met on ${passes} feature${passes > 1 ? 's' : ''}` : 'bar not met: A/B inside A/A noise on every feature');
    out.textContent = lines.join('\n');
  } finally {
    for (const [c, v] of Object.entries(before)) engine.setControl(c, v, 0);
    if (wasHeld.length) hold(wasHeld);
  }
}

// ---------------------------------------------------------------------------
// Spans

function renderSpans() {
  const spans = engine.getModulationTargetSpans();
  const table = $('spanTable');
  table.innerHTML = '<tr><th>target</th><th>span</th><th>default</th><th></th></tr>';
  for (const target of MODULATABLE_TARGETS) {
    const tr = document.createElement('tr');
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.05';
    input.min = '0';
    input.value = String(spans[target]);
    input.addEventListener('input', () => {
      const v = Number(input.value);
      if (Number.isFinite(v)) engine.setModulationTargetSpans({ [target]: v });
      $('spanJson').value = spanJson();
    });
    const audition = document.createElement('button');
    audition.textContent = 'Audition';
    audition.classList.toggle('on', state.auditions.has(target));
    audition.addEventListener('click', () => toggleAudition(target, audition));
    tr.innerHTML = `<td><code>${target}</code></td><td></td><td>${MODULATION_TARGET_SPANS[target]}</td><td></td>`;
    tr.children[1].appendChild(input);
    tr.children[3].appendChild(audition);
    table.appendChild(tr);
  }
  $('spanJson').value = spanJson();
}

function spanJson() {
  return JSON.stringify(engine.getModulationTargetSpans(), null, 2);
}

function toggleAudition(target, button) {
  const existing = state.auditions.get(target);
  if (existing) {
    existing.remove();
    state.auditions.delete(target);
    button.classList.remove('on');
    return;
  }
  const route = engine.modulate({ id: `lab-${target}`, type: 'lfo', shape: 'sine', hz: 0.5 }, `target:${target}`, 1);
  state.auditions.set(target, route);
  button.classList.add('on');
}

// ---------------------------------------------------------------------------
// Analyser

function buildBands() {
  const host = $('bands');
  host.innerHTML = '';
  for (const key of [...FEATURE_KEYS, 'onset']) {
    const label = document.createElement('span');
    label.textContent = key;
    const bar = document.createElement('div');
    bar.className = `bar${key === 'onset' ? ' onset' : ''}`;
    bar.innerHTML = '<i></i>';
    const value = document.createElement('span');
    value.className = 'status';
    value.textContent = '0.00';
    host.append(label, bar, value);
  }
}

let onsetFlash = 0;
function drawFrame() {
  requestAnimationFrame(drawFrame);
  if (!state.species) return;
  const f = engine.getAudioFeatures();
  const bars = $('bands').querySelectorAll('.bar i');
  const values = $('bands').querySelectorAll('span.status');
  if (f.onset) onsetFlash = 1;
  onsetFlash *= 0.9;
  const readings = [...FEATURE_KEYS.map((k) => f[k]), onsetFlash];
  readings.forEach((v, i) => {
    bars[i].style.width = `${Math.max(0, Math.min(1, v)) * 100}%`;
    values[i].textContent = v.toFixed(2);
  });
  const wf = engine.getWaveform();
  const canvas = $('wave');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#8fd6a4';
  ctx.beginPath();
  for (let i = 0; i < wf.length; i += 1) {
    const x = (i / wf.length) * canvas.width;
    const y = (0.5 - wf[i] * 0.5) * canvas.height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Wiring

function fillSelect(select, items, selected) {
  select.innerHTML = '';
  for (const { value, label } of items) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }
  if (selected) select.value = selected;
}

function init() {
  const species = engine.getAvailableSpecies().map((m) => ({ value: m.id, label: m.name }));
  fillSelect($('species'), species, 'seed');
  fillSelect($('speciesA'), species, 'seed');
  fillSelect($('speciesB'), species, species[1]?.value ?? 'seed');
  fillSelect($('note'), NOTES.map((n) => ({ value: n, label: n })), 'E3');
  fillSelect($('control'), ECOLOGICAL_CONTROLS.map((c) => ({ value: c, label: c })), 'bloom');
  buildBands();
  renderSpans();

  $('unlock').addEventListener('click', () => unlock().catch((e) => setStatus(String(e))));
  $('load').addEventListener('click', () => loadSpecies($('species').value).catch((e) => setStatus(String(e))));
  $('generative').addEventListener('change', () => {
    if (state.species) loadSpecies(state.species).catch((e) => setStatus(String(e)));
  });

  $('velocity').addEventListener('input', () => {
    state.velocity = Number($('velocity').value);
    $('velocityValue').textContent = state.velocity.toFixed(2);
  });
  $('holdNote').addEventListener('click', () => hold([$('note').value]));
  $('holdChord').addEventListener('click', () => hold(chordFor($('note').value)));
  $('release').addEventListener('click', release);

  $('ramp').addEventListener('change', () => {
    state.ramp = $('ramp').checked;
  });
  $('control').addEventListener('change', () => {
    if (!state.species) return;
    const v = engine.getControl($('control').value);
    $('controlValue').value = String(v);
    $('controlReadout').textContent = v.toFixed(2);
  });
  $('controlValue').addEventListener('input', () => setControl($('control').value, Number($('controlValue').value)));
  $('jumpLow').addEventListener('click', () => setControl($('control').value, 0.1));
  $('jumpHigh').addEventListener('click', () => setControl($('control').value, 0.95));
  $('resetControls').addEventListener('click', () => {
    for (const c of ECOLOGICAL_CONTROLS) setControl(c, 0.5);
  });
  $('autoSweep').addEventListener('click', () => {
    if (state.sweeping) state.sweeping = false;
    else autoSweep();
  });
  $('measure').addEventListener('click', () => runMeasure().catch((e) => ($('measureOut').textContent = String(e))));

  $('playA').addEventListener('click', () => loadSpecies($('speciesA').value).catch((e) => setStatus(String(e))));
  $('playB').addEventListener('click', () => loadSpecies($('speciesB').value).catch((e) => setStatus(String(e))));

  $('spanDefaults').addEventListener('click', () => {
    engine.setModulationTargetSpans({ ...MODULATION_TARGET_SPANS });
    renderSpans();
  });
  $('spanCopy').addEventListener('click', async () => {
    const json = spanJson();
    $('spanJson').value = json;
    try {
      await navigator.clipboard.writeText(json);
      setStatus('spans copied');
    } catch {
      $('spanJson').select();
    }
  });
  $('spanApply').addEventListener('click', () => {
    try {
      engine.setModulationTargetSpans(JSON.parse($('spanJson').value));
      renderSpans();
      setStatus('spans applied');
    } catch (e) {
      setStatus(`bad JSON: ${e.message}`);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      state.held.length ? release() : hold([$('note').value]);
    }
  });

  requestAnimationFrame(drawFrame);
  window.lab = { engine, state, measureControl, loadSpecies, hold, release };
}

init();
