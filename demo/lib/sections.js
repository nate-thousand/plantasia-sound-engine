/** Collapsible section helper with localStorage persistence. */

const STORAGE_PREFIX = 'plantasia-demo-section-';

export function createSection(id, title, buildBody) {
  const section = document.createElement('section');
  section.className = 'section';
  section.dataset.sectionId = id;

  const stored = localStorage.getItem(STORAGE_PREFIX + id);
  if (stored === 'open') {
    section.classList.add('open');
  } else if (stored === null && ['presets', 'performance', 'debug'].includes(id)) {
    section.classList.add('open');
  }

  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'section-header';
  header.textContent = title;
  header.addEventListener('click', () => {
    section.classList.toggle('open');
    localStorage.setItem(STORAGE_PREFIX + id, section.classList.contains('open') ? 'open' : 'closed');
  });

  const body = document.createElement('div');
  body.className = 'section-body';
  buildBody(body);

  section.append(header, body);
  return section;
}

/** Create a labeled range slider wired to onInput. */
export function rangeField(label, id, min, max, step, initial, onInput, options = {}) {
  const field = document.createElement('div');
  field.className = 'field';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  const suffix = options.notWired ? ' (Not wired yet)' : options.v1Only ? ' (v1 path)' : '';
  labelEl.innerHTML = `${label}${suffix} <output id="${id}-out">${initial}</output>`;

  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(initial);
  if (options.notWired || options.disabled) {
    input.disabled = true;
    field.classList.add('not-wired');
  }

  const out = labelEl.querySelector('output');
  if (!options.notWired && !options.disabled) {
    input.addEventListener('input', () => {
      out.textContent = input.value;
      onInput(Number(input.value), input);
      input.dataset.changed = '1';
    });
  }

  field.append(labelEl, input);
  return { field, input, out };
}

/** Create select field. options: { notWired, disabled } */
export function selectField(label, id, options, initial, onChange, fieldOptions = {}) {
  const field = document.createElement('div');
  field.className = 'field';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;

  const select = document.createElement('select');
  select.id = id;
  for (const opt of options) {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    if (opt.value === initial) el.selected = true;
    select.appendChild(el);
  }
  select.addEventListener('change', () => onChange(select.value, select));
  if (fieldOptions.notWired || fieldOptions.disabled) {
    select.disabled = true;
    field.classList.add('not-wired');
  }

  field.append(labelEl, select);
  return { field, select };
}

/** Create checkbox toggle. */
export function checkboxField(label, id, initial, onChange) {
  const field = document.createElement('div');
  field.className = 'field toggle-row';

  const wrap = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.checked = initial;
  input.addEventListener('change', () => onChange(input.checked, input));

  wrap.append(input, document.createTextNode(' ' + label));
  field.append(wrap);
  return { field, input };
}

/** Button row helper. */
export function buttonRow(buttons) {
  const row = document.createElement('div');
  row.className = 'btn-row';
  for (const { label, id, className, onClick } of buttons) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = id;
    btn.textContent = label;
    if (className) btn.className = className;
    btn.addEventListener('click', onClick);
    row.appendChild(btn);
  }
  return row;
}

/** Hint paragraph. */
export function hint(text, kind = '') {
  const p = document.createElement('p');
  p.className = 'hint' + (kind ? ' ' + kind : '');
  p.textContent = text;
  return p;
}
