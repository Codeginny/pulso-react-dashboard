import { defineConfig, devices } from '@playwright/test';

const PUERTO_API = 4020;
const PUERTO_WEB = 5200;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PUERTO_WEB}`,
    trace: 'retain-on-failure',
    locale: 'es-AR',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: `PORT=${PUERTO_API} npx tsx src/index.ts`,
      cwd: '../api',
      port: PUERTO_API,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `PORT=${PUERTO_WEB} API_URL=http://localhost:${PUERTO_API} npx tsx server.ts`,
      port: PUERTO_WEB,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
