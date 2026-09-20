import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Serves lab/ against the built dist. The lab is a local tuning tool, never deployed. */
export default defineConfig({
  root: path.resolve(rootDir, 'lab'),
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
