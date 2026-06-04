const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  testMatch: /visual-.*\.spec\.js/,
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 420, height: 420 },
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev:renderer',
    url: 'http://127.0.0.1:5173/index.html',
    reuseExistingServer: true,
    timeout: 20000
  }
});
