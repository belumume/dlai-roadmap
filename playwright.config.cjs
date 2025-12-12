const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    headless: true,
    baseURL: 'http://localhost:5175',
  },
  webServer: {
    command: 'npm run dev',
    port: 5175,
    reuseExistingServer: true,
  },
});
