import { defineConfig, devices } from '@playwright/test'

const BACKEND_PORT = 5050
const FRONTEND_PORT = 5180

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `node scripts/e2e-server.mjs`,
      cwd: 'backend',
      url: `http://localhost:${BACKEND_PORT}/api/health`,
      env: { PORT: String(BACKEND_PORT) },
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      cwd: 'frontend',
      url: `http://localhost:${FRONTEND_PORT}`,
      env: { VITE_API_URL: `http://localhost:${BACKEND_PORT}/api` },
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
