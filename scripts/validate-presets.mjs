import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const { presets } = await import(join(root, 'dist/presets/loader.js'));
  const { validateAllPresets } = await import(join(root, 'dist/presets/validatePresets.js'));

  const issues = validateAllPresets(presets, { strict: true });
  if (issues.length === 0) {
    console.info(`[validate-presets] OK — ${presets.length} presets validated`);
  }
}

main().catch((error) => {
  console.error('[validate-presets]', error.message ?? error);
  process.exit(1);
});
