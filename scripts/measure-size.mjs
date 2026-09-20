#!/usr/bin/env node
/**
 * Bundle size measurement (ROADMAP decisions 3 and 12 after 1.1.0).
 *
 *   engine   dist/public.js and dist/index.js bundled with esbuild (ESM,
 *            minified, tree shaken, Tone included), minified and gzip bytes.
 *            Recorded; budgets are set from the first release's numbers.
 *   demo     the deployed site built with vite (demo/ against dist), total
 *            minified JS and CSS. Budget 500 KB, blocks.
 *
 * Writes bench/results/size.json. Run after `npm run build`.
 */
import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';
import { gzipSync } from 'node:zlib';
import { mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEMO_BUDGET_BYTES = 500 * 1024;
const KB = (n) => `${(n / 1024).toFixed(1)} KB`;

async function measureEntry(entry) {
  const result = await esbuild({
    entryPoints: [join(rootDir, entry)],
    bundle: true,
    minify: true,
    format: 'esm',
    treeShaking: true,
    write: false,
    logLevel: 'silent',
  });
  const code = result.outputFiles[0].contents;
  return { entry, minified: code.length, gzip: gzipSync(code).length };
}

async function measureDemo() {
  const outDir = join(rootDir, 'site');
  await viteBuild({
    configFile: join(rootDir, 'vite.site.config.ts'),
    logLevel: 'silent',
    build: { outDir, emptyOutDir: true },
  });
  const assets = join(outDir, 'assets');
  let js = 0;
  let css = 0;
  for (const name of readdirSync(assets)) {
    const size = statSync(join(assets, name)).size;
    if (name.endsWith('.js')) js += size;
    else if (name.endsWith('.css')) css += size;
  }
  return { js, css, total: js + css, budget: DEMO_BUDGET_BYTES };
}

const engine = [await measureEntry('dist/public.js'), await measureEntry('dist/index.js')];
const demo = await measureDemo();
const report = { date: new Date().toISOString().slice(0, 10), engine, demo };

mkdirSync(join(rootDir, 'bench', 'results'), { recursive: true });
writeFileSync(join(rootDir, 'bench', 'results', 'size.json'), JSON.stringify(report, null, 2));

for (const e of engine) {
  console.log(`[measure-size] ${e.entry}: ${KB(e.minified)} minified, ${KB(e.gzip)} gzip (recorded)`);
}
console.log(`[measure-size] demo site: ${KB(demo.total)} minified (js ${KB(demo.js)}, css ${KB(demo.css)}), budget ${KB(demo.budget)}`);

if (demo.total > DEMO_BUDGET_BYTES) {
  console.error(`[measure-size] FAIL demo site exceeds its ${KB(DEMO_BUDGET_BYTES)} budget by ${KB(demo.total - DEMO_BUDGET_BYTES)}`);
  process.exit(1);
}
console.log('[measure-size] OK');
