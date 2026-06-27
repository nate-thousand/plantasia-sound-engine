import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const exampleDir = process.env.EXAMPLE_DIR ?? 'examples/basic';

export default defineConfig({
  root: path.resolve(rootDir, exampleDir),
  resolve: {
    alias: {
      'plantasia-sound-engine': path.resolve(rootDir, 'dist/index.js'),
    },
  },
  server: {
    fs: { allow: [rootDir] },
    open: true,
  },
});
