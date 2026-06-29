import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = process.env.SITE_DIR ?? 'demo';

export default defineConfig({
  root: path.resolve(rootDir, siteDir),
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
