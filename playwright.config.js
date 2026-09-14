import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:3100', channel: 'chrome', screenshot: 'only-on-failure' },
  webServer: { command: 'node server.mjs', env: { PORT: '3100', DATABASE_PATH: ':memory:', OPENAI_API_KEY: '', OPENAI_MODEL: '', GEMINI_API_KEY: '', GEMINI_MODEL: '' }, url: 'http://127.0.0.1:3100', reuseExistingServer: false },
  reporter: 'list',
});
