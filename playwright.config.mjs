import { defineConfig, devices } from '@playwright/test';

/**
 * Browser performance harness (ROADMAP decision 7). Not part of postbuild.
 * `npm run test:browser` builds dist, serves bench/ with vite, and runs the
 * measurements in Chromium and WebKit. Numbers land in docs/PERFORMANCE.md.
 */
export default defineConfig({
  testDir: './tests/browser',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5194',
    trace: 'off',
  },
  webServer: {
    command: 'npx vite --config vite.bench.config.ts --port 5194 --strictPort',
    url: 'http://localhost:5194',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
