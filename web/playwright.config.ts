import { defineConfig } from '@playwright/test';

const local = !process.env.CI;
const launchOptions = local ? { executablePath: '/usr/bin/chromium' } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4321', reducedMotion: 'reduce', trace: 'retain-on-failure' },
  webServer: {
    // CI builds in its own step right before; locally build first so tests never hit a stale dist/.
    command: local ? 'pnpm build && pnpm preview --port 4321 --ignore-lock' : 'pnpm preview --port 4321 --ignore-lock',
    url: 'http://localhost:4321',
    reuseExistingServer: local,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'desktop',
      testMatch: ['lesson.spec.ts', 'cheatsheet.spec.ts', 'lab.spec.ts', 'diagrams.spec.ts'],
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, launchOptions },
    },
    {
      name: 'mobile',
      testMatch: 'mobile.spec.ts',
      use: { browserName: 'chromium', viewport: { width: 360, height: 780 }, launchOptions },
    },
  ],
});
