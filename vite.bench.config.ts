import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Serves bench/ against the built dist for the Playwright performance harness. */
export default defineConfig({
  root: path.resolve(rootDir, 'bench'),
  resolve: {
    alias: {
      'plantasia-sound-engine': path.resolve(rootDir, 'dist/index.js'),
    },
  },
  server: {
    fs: { allow: [rootDir] },
    open: false,
  },
});
