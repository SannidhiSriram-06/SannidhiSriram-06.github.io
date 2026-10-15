const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  outputDir: 'test-results',
  webServer: { command: 'npx -y serve -l 4173 .', url: 'http://localhost:4173', reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4173' },
});
