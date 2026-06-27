# Contributing

Thank you for contributing to Plantasia Sound Engine.

## Principles

1. **Do not break the public API** without a major version bump and CHANGELOG entry.
2. **Do not alter sound behavior** unintentionally — preset JSON changes and DSP edits require listening tests.
3. **Keep commits focused** — one logical change per commit with a clear message.
4. **Separate concerns** — engine core, synths, presets, and future subsystems live in dedicated folders.

## Setup

```bash
git clone https://github.com/nate-thousand/plantasia-sound-engine.git
cd plantasia-sound-engine
npm install
npm run build
```

## Development workflow

1. Edit source under `src/` or preset JSON under `presets/`.
2. Run `npm run sync-presets` if you changed root preset JSON.
3. Run `npm run build && npm run typecheck`.
4. Test: `node -e "import('./dist/index.js').then(m => console.log(m.presets.length))"`.
5. Browser: `npm run demo` or `npm run example:<name>`.
6. Update docs if you add exports or change behavior.

## Adding a preset

1. Create `presets/<category>/<id>.json` following existing schema.
2. Add the id to `presets/default.json` category list.
3. Add import + entry in `src/presets/loader.ts` (preserve order if compatibility matters).
4. Run `npm run build` and verify in `npm run example:presets`.

## Adding a subsystem feature

1. Implement in the appropriate folder (`effects/`, `midi/`, etc.).
2. Wire through `audioEngine.ts` or `PlantasiaEngine` only when ready.
3. Export from `src/index.ts` only when API is stable.
4. Add example under `examples/` and document in `docs/`.

## Code style

- TypeScript strict mode
- ESM with `.js` extensions in relative imports
- `NodeNext` module resolution
- Minimal comments — explain non-obvious logic only

## Pull requests

- Describe what changed and why
- Confirm build + demo work
- Note any sound-design impact
- Link related ROADMAP milestone items

## Reporting issues

Include: browser/Node version, steps to reproduce, expected vs actual behavior, and console logs.
