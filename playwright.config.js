const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
    launchOptions: process.env.PLAYWRIGHT_CHROME_BIN ? { executablePath: process.env.PLAYWRIGHT_CHROME_BIN } : {}
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory app',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false
  }
});
