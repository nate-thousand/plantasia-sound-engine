/**
 * Modulation section (ROADMAP decision 14 for 1.1.0): a route builder, the
 * live state readout, and a three route preset. A harness that shows every
 * source and destination once; hosts own the real UI.
 */
import { buttonRow, hint } from './sections.js';

const CONTROLS = ['growth', 'bloom', 'roots', 'mold', 'bacteria'];
const TARGETS = [
  'filterCutoffMult', 'attackMult', 'releaseMult', 'brightnessAdd', 'chorusDepthMult', 'reverbWetAdd',
  'saturationAdd', 'oscBlendAdd', 'stereoWidthMult', 'instabilityAdd', 'particleRateMult',
  'generativeDensityAdd', 'noteVelocityScale',
];
const SOURCE_TYPES = ['lfo', 'sample-hold', 'follower', 'midi-cc', 'midi-aftertouch', 'midi-bend'];

const PRESET_ROUTES = [
  [{ id: 'breath', type: 'lfo', hz: 0.08, shape: 'sine' }, 'bloom', 0.35],
  [{ id: 'bass-env', type: 'follower', band: 'bass', attack: 0.05, release: 0.6 }, 'roots', 0.4],
  [{ id: 'wheel', type: 'midi-cc', cc: 1 }, 'target:filterCutoffMult', -0.8],
];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function labeled(label, input) {
  const field = el('div', 'field');
  const l = el('label', '', label);
  field.append(l, input);
  return field;
}

function select(options, value) {
  const s = document.createElement('select');
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o;
    if (o === value) opt.selected = true;
    s.appendChild(opt);
  }
  return s;
}

function number(value, min, max, step) {
  const n = document.createElement('input');
  n.type = 'number';
  n.value = String(value);
  n.min = String(min);
  n.max = String(max);
  n.step = String(step);
  return n;
}

function describeSource(source) {
  switch (source.type) {
    case 'lfo':
      return `lfo ${source.shape ?? 'sine'} ${source.beats !== undefined ? source.beats + ' beats' : (source.hz ?? 0.2) + ' Hz'}${source.unipolar ? ' unipolar' : ''}`;
    case 'sample-hold':
      return `s&h ${source.beats !== undefined ? source.beats + ' beats' : (source.hz ?? 0.2) + ' Hz'}${source.slew ? ' slew ' + source.slew : ''}`;
    case 'follower':
      return `follower ${source.band ?? 'rms'}`;
    case 'midi-cc':
      return `cc${source.cc}${source.channel ? ' ch' + source.channel : ''}`;
    default:
      return source.type;
  }
}

export function buildModulationSection(body, bridge, callbacks) {
  const engine = bridge.engine;
  body.appendChild(hint('engine.modulate(source, destination, depth): sources add to the host base and never overwrite it. Routes tick at 30 Hz while running and survive a species switch. getModulationState() drives the readout below; modulationChanged rebuilds the list.'));

  // --- builder ---
  const builder = el('div', 'mod-builder');
  const typeSel = select(SOURCE_TYPES, 'lfo');
  const idInput = document.createElement('input');
  idInput.type = 'text';
  idInput.placeholder = 'source id (optional, reuse to share)';
  const shapeSel = select(['sine', 'triangle', 'square', 'saw'], 'sine');
  const rateMode = select(['hz', 'beats'], 'hz');
  const rateVal = number(0.2, 0.01, 40, 0.01);
  const unipolar = document.createElement('input');
  unipolar.type = 'checkbox';
  const slew = number(0, 0, 5, 0.05);
  const band = select(['rms', 'bass', 'mid', 'high'], 'rms');
  const attack = number(0.05, 0.001, 5, 0.01);
  const release = number(0.3, 0.001, 10, 0.01);
  const cc = number(1, 0, 127, 1);
  const channel = number(0, 0, 16, 1);
  const destSel = select([...CONTROLS, ...TARGETS.map((t) => 'target:' + t)], 'bloom');
  const depth = document.createElement('input');
  depth.type = 'range';
  depth.min = '-1';
  depth.max = '1';
  depth.step = '0.05';
  depth.value = '0.5';
  const depthOut = el('span', 'mod-depth-out', '0.50');
  depth.addEventListener('input', () => { depthOut.textContent = Number(depth.value).toFixed(2); });

  const fields = {
    type: labeled('Source', typeSel),
    id: labeled('Id', idInput),
    shape: labeled('Shape', shapeSel),
    rateMode: labeled('Rate in', rateMode),
    rate: labeled('Rate', rateVal),
    unipolar: labeled('Unipolar (rise from base)', unipolar),
    slew: labeled('Slew (s)', slew),
    band: labeled('Band', band),
    attack: labeled('Attack (s)', attack),
    release: labeled('Release (s)', release),
    cc: labeled('CC number', cc),
    channel: labeled('Channel (0 = any)', channel),
    dest: labeled('Destination', destSel),
  };
  const depthField = el('div', 'field');
  const depthLabel = el('label', '', 'Depth ');
  depthLabel.appendChild(depthOut);
  depthField.append(depthLabel, depth);

  for (const f of Object.values(fields)) builder.appendChild(f);
  builder.appendChild(depthField);

  const VISIBLE = {
    'lfo': ['shape', 'rateMode', 'rate', 'unipolar'],
    'sample-hold': ['rateMode', 'rate', 'slew'],
    'follower': ['band', 'attack', 'release'],
    'midi-cc': ['cc', 'channel'],
    'midi-aftertouch': ['channel'],
    'midi-bend': ['channel'],
  };
  function refreshFields() {
    const show = new Set(['type', 'id', 'dest', ...VISIBLE[typeSel.value]]);
    for (const [key, f] of Object.entries(fields)) f.style.display = show.has(key) ? '' : 'none';
  }
  typeSel.addEventListener('change', refreshFields);
  refreshFields();

  function readSource() {
    const base = idInput.value.trim() ? { id: idInput.value.trim() } : {};
    const rate = rateMode.value === 'beats' ? { beats: Number(rateVal.value) } : { hz: Number(rateVal.value) };
    const ch = Number(channel.value) > 0 ? { channel: Number(channel.value) } : {};
    switch (typeSel.value) {
      case 'lfo': return { ...base, type: 'lfo', shape: shapeSel.value, ...rate, unipolar: unipolar.checked || undefined };
      case 'sample-hold': return { ...base, type: 'sample-hold', ...rate, slew: Number(slew.value) || undefined };
      case 'follower': return { ...base, type: 'follower', band: band.value, attack: Number(attack.value), release: Number(release.value) };
      case 'midi-cc': return { ...base, type: 'midi-cc', cc: Number(cc.value), ...ch };
      case 'midi-aftertouch': return { ...base, type: 'midi-aftertouch', ...ch };
      case 'midi-bend': return { ...base, type: 'midi-bend', ...ch };
      default: return { ...base, type: 'lfo', hz: 0.2 };
    }
  }

  /** Handles for routes made here, so depth edits go through route.set(). */
  const handles = new Map();
  function addRoute(source, destination, d) {
    const handle = engine.modulate(source, destination, d);
    handles.set(handle.id, handle);
    return handle;
  }

  body.appendChild(builder);
  body.appendChild(buttonRow([
    { label: 'Add route', id: 'mod-add', onClick: () => {
      try {
        addRoute(readSource(), destSel.value, Number(depth.value));
        callbacks.onStatus('Route added');
      } catch (error) {
        callbacks.onStatus(`Route rejected: ${error.message}`, 'error');
      }
    }},
    { label: 'Load three route preset', id: 'mod-preset', onClick: () => {
      for (const [source, destination, d] of PRESET_ROUTES) addRoute(source, destination, d);
      callbacks.onStatus('LFO on bloom, bass follower on roots, CC1 closes the filter');
    }},
    { label: 'Clear routes', id: 'mod-clear', onClick: () => {
      for (const r of engine.getModulationRoutes()) engine.removeModulation(r.id);
      callbacks.onStatus('Routes cleared');
    }},
  ]));

  // --- routes list ---
  const list = el('div', 'mod-routes');
  body.appendChild(list);
  let renderedIds = '';
  function renderRoutes(routes) {
    const ids = routes.map((r) => r.id).join(',');
    if (ids === renderedIds && routes.length > 0) {
      return; // depth edits arrive here too; keep the slider under the pointer
    }
    renderedIds = ids;
    list.replaceChildren();
    if (routes.length === 0) {
      list.appendChild(hint('No routes. Add one above, or load the preset.'));
      return;
    }
    for (const route of routes) {
      const row = el('div', 'mod-route');
      const title = el('div', 'mod-route-title', `${route.source.id}: ${describeSource(route.source)} → ${route.destination}`);
      const dp = document.createElement('input');
      dp.type = 'range'; dp.min = '-1'; dp.max = '1'; dp.step = '0.05'; dp.value = String(route.depth);
      const dpOut = el('span', 'mod-depth-out', route.depth.toFixed(2));
      dp.addEventListener('input', () => {
        dpOut.textContent = Number(dp.value).toFixed(2);
        const handle = handles.get(route.id);
        if (handle) {
          handle.set({ depth: Number(dp.value) });
        }
      });
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        engine.removeModulation(route.id);
        handles.delete(route.id);
      });
      const controls = el('div', 'mod-route-controls');
      controls.append(dp, dpOut, remove);
      row.append(title, controls);
      list.appendChild(row);
    }
  }
  renderRoutes(engine.getModulationRoutes());
  engine.on('modulationChanged', ({ routes }) => renderRoutes(routes));

  // --- live state ---
  const live = el('div', 'mod-live');
  body.appendChild(live);
  const sourceRows = new Map();
  const controlRows = new Map();
  function bar(container, label) {
    const row = el('div', 'mod-bar');
    const l = el('span', 'mod-bar-label', label);
    const track = el('div', 'mod-bar-track');
    const fill = el('div', 'mod-bar-fill');
    const base = el('div', 'mod-bar-base');
    track.append(base, fill);
    const val = el('span', 'mod-bar-val', '0');
    row.append(l, track, val);
    container.appendChild(row);
    return { row, fill, base, val };
  }
  const sourcesBox = el('div'); sourcesBox.appendChild(el('div', 'mod-live-title', 'Sources'));
  const controlsBox = el('div'); controlsBox.appendChild(el('div', 'mod-live-title', 'Controls: base | modulated'));
  const targetsBox = el('div'); targetsBox.appendChild(el('div', 'mod-live-title', 'Target offsets'));
  const targetsText = el('div', 'mod-targets', 'none');
  targetsBox.appendChild(targetsText);
  live.append(sourcesBox, controlsBox, targetsBox);
  for (const c of CONTROLS) controlRows.set(c, bar(controlsBox, c));

  function refreshLive() {
    if (!bridge.audioStarted) return;
    const st = engine.getModulationState();
    const ids = Object.keys(st.sources);
    for (const [id, row] of sourceRows) if (!ids.includes(id)) { row.row.remove(); sourceRows.delete(id); }
    for (const id of ids) {
      if (!sourceRows.has(id)) sourceRows.set(id, bar(sourcesBox, id));
      const row = sourceRows.get(id);
      const s = st.sources[id];
      const pct = Math.round(((s.value + 1) / 2) * 100);
      row.fill.style.left = s.value < 0 ? pct + '%' : '50%';
      row.fill.style.width = Math.abs(pct - 50) + '%';
      row.base.style.left = '50%';
      row.val.textContent = (s.active ? '' : 'inactive ') + s.value.toFixed(2);
      row.row.classList.toggle('inactive', !s.active);
    }
    for (const c of CONTROLS) {
      const row = controlRows.get(c);
      const { base, modulated } = st.controls[c];
      row.base.style.left = (base * 100) + '%';
      const lo = Math.min(base, modulated), hi = Math.max(base, modulated);
      row.fill.style.left = (lo * 100) + '%';
      row.fill.style.width = ((hi - lo) * 100) + '%';
      row.val.textContent = `${base.toFixed(2)} | ${modulated.toFixed(2)}`;
    }
    const entries = Object.entries(st.targets);
    targetsText.textContent = entries.length ? entries.map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v.toFixed(2)}`).join('  ') : 'none';
  }
  setInterval(refreshLive, 100);
}
