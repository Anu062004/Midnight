import { test, expect } from '@playwright/test';
import { createGateway } from '../../gateway.mjs';
import { makeServer } from '../../server.mjs';

let server, origin, calls;
test.beforeEach(async () => {
  calls = [];
  server = makeServer({ gateway: createGateway({ midnight: { sign: () => ({ signature: 'synthetic test attestation' }) }, providerId: 'gemini', apiKey: 'synthetic', model: 'test-model', fetcher: async (_, options) => {
    calls.push(JSON.parse(options.body));
    return Response.json({ candidates: [{ content: { parts: [{ text: 'Hello [EMAIL_1]' }] }, finishReason: 'STOP' }] });
  } }) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterEach(() => new Promise(resolve => server.close(resolve)));
async function account(page) {
  await page.goto(`${origin}/#team`);
  await page.locator('#register-email').fill('synthetic-owner@example.com');
  await page.locator('#register-password').fill('SyntheticPassword123!');
  await page.locator('#register-organization').fill('Test team');
  await page.locator('#register-form button').click();
  await expect(page.locator('#team-details')).toBeVisible();
  await expect(page.locator('#member-list')).toContainText('Your user ID:');
}
async function scan(page) {
  await page.locator('[data-view="workspace"]').click();
  await page.locator('#composer').fill('Write a greeting to confidential-person@example.com');
  await page.locator('#scan').click();
  await expect(page.locator('#preview-state')).toHaveText('Ready for review');
}
test('account, reviewed delivery and human-only response restoration work through the real gateway', async ({ page }) => {
  const errors = [], payloads = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() === 'POST') payloads.push(request.postData()); });
  await account(page); await scan(page);
  await expect(page.locator('#send-live')).toBeDisabled();
  await page.locator('#reviewed').check();
  await page.locator('#send-live').click();
  await expect(page.locator('#response-title')).toHaveText('AI response');
  await expect(page.locator('#response-output')).toHaveText('Hello [EMAIL_1]');
  await page.locator('#restore').check();
  await expect(page.locator('#response-output')).toHaveText('Hello confidential-person@example.com');
  await expect(page.locator('#send-live')).toBeDisabled();
  expect(calls).toHaveLength(1);
  expect(JSON.stringify(calls)).not.toContain('confidential-person');
  expect(JSON.stringify(payloads)).not.toContain('confidential-person');
  await page.locator('[data-view="activity"]').click();
  await expect(page.locator('#gateway-activity-list')).toContainText('delivered');
  await page.locator('[data-view="team"]').click(); await page.locator('#logout').click();
  await expect(page.locator('#account-forms')).toBeVisible();
  expect(errors).toEqual([]);
});
test('publishing strict policy lets users prepare a job but blocks delivery without confirmed evidence', async ({ page }) => {
  await account(page);
  await page.locator('[data-view="policies"]').click();
  await page.locator('#evidence-mode').selectOption('strict');
  await page.locator('#policy-form button[type="submit"]').click();
  await expect(page.locator('#policy-version')).toContainText('v2');
  await scan(page); await page.locator('#reviewed').check(); await page.locator('#send-live').click();
  await expect(page.locator('#message')).toContainText('Deploy the evidence contract');
  await expect(page.locator('#anchor-job')).toBeVisible();
  expect(calls).toHaveLength(0);
  await page.locator('#anchor-job').click();
  await expect(page.locator('#message')).toContainText('Connect a funded Midnight Preprod wallet');
  expect(calls).toHaveLength(0);
});
