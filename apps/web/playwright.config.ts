import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  /**
   * Viewport mobile senza l'emulazione "isMobile" di Chromium: quella introduce
   * un fattore di scala della pagina che disallinea le coordinate del clic dai
   * rettangoli degli elementi a posizione fissa. Qui interessa la larghezza
   * reale del telefono, non la simulazione dello zoom del browser mobile.
   */
  projects: [
    { name: 'mobile', use: { viewport: { width: 412, height: 840 }, hasTouch: true } },
    { name: 'small', use: { viewport: { width: 320, height: 720 }, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
