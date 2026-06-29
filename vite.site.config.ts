import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const exampleDir = process.env.EXAMPLE_DIR ?? 'examples/basic-engine';

export default defineConfig({
  root: path.resolve(rootDir, exampleDir),
  build: {
    outDir: path.resolve(rootDir, 'site'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'plantasia-sound-engine': path.resolve(rootDir, 'dist/index.js'),
      'plantasia-sound-engine/public': path.resolve(rootDir, 'dist/public.js'),
    },
  },
});
