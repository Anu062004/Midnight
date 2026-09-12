import { test, expect } from '@playwright/test';

async function example(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try a synthetic example' }).click();
  await page.getByRole('button', { name: 'Scan text' }).click();
  await expect(page.locator('#preview-state')).toHaveText('Ready for review');
}

test('local scan, explicit review, restoration and copy never transmit original text or mappings', async ({ page, context }) => {
  const requests = [], errors = [];
  page.on('request', request => requests.push({ url: request.url(), body: request.postData(), method: request.method() }));
  page.on('pageerror', error => errors.push(error.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await example(page);
  await expect(page.locator('#outgoing')).not.toContainText('mira@example.com');
  await expect(page.locator('#outgoing')).not.toContainText('4242');
  await expect(page.locator('#outgoing')).toContainText('[EMAIL_1]');
  await expect(page.locator('#findings-count')).toHaveText('5');
  await expect(page.locator('#copy-preview')).toBeDisabled();
  await expect(page.locator('#try-response')).toBeDisabled();
  await page.locator('#reviewed').check();
  await page.locator('#try-response').click();
  await expect(page.locator('#response-output')).not.toContainText('mira@example.com');
  await page.locator('#restore').check();
  await expect(page.locator('#response-output')).toContainText('mira@example.com');
  await expect(page.locator('#response-output')).not.toContainText('sk-test');
  await expect(page.locator('#response-output')).not.toContainText('4242');
  await page.locator('#copy-response').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).not.toContain('mira@example.com');
  await page.locator('[data-view="activity"]').click();
  await expect(page.locator('.activity-item')).toHaveCount(2);
  await page.locator('.activity-item summary').first().click();
  await expect(page.locator('.activity-item').first()).toContainText('local_only');
  await expect(page.locator('.activity-item').first()).not.toContainText('mira@example.com');
  expect(requests.every(r => r.method === 'GET' && !r.body && new URL(r.url).origin === 'http://127.0.0.1:3100')).toBe(true);
  expect(JSON.stringify(requests)).not.toContain('mira');
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(errors).toEqual([]);
});

test('editing and session clearing invalidate previews and restoration', async ({ page }) => {
  await example(page);
  await page.locator('#reviewed').check();
  await page.locator('#try-response').click();
  await page.locator('#composer').fill('Changed input');
  await expect(page.locator('#outgoing')).toBeHidden();
  await expect(page.locator('#response-section')).toBeHidden();
  await expect(page.locator('#try-response')).toBeDisabled();
  await page.locator('#clear-session').click();
  await expect(page.locator('#composer')).toHaveValue('');
  await expect(page.locator('#activity-count')).toHaveText('0');
});

test('policy changes invalidate preview; blocked and unavailable-detector states fail closed', async ({ page }) => {
  await example(page);
  await page.locator('[data-view="policies"]').click();
  await page.locator('#rule-credential').selectOption('block');
  await page.getByRole('button', { name: 'Apply local rules' }).click();
  await page.locator('[data-view="workspace"]').click();
  await expect(page.locator('#outgoing')).toBeHidden();
  await page.locator('#scan').click();
  await expect(page.locator('#preview-state')).toHaveText('Blocked by local rule');
  await expect(page.locator('#reviewed')).toBeDisabled();
  await expect(page.locator('#copy-preview')).toBeDisabled();
  await page.locator('[data-view="policies"]').click();
  await page.locator('#require-semantic').check();
  await page.getByRole('button', { name: 'Apply local rules' }).click();
  await page.locator('[data-view="workspace"]').click();
  await page.locator('#scan').click();
  await expect(page.locator('#message')).toContainText('required detector is unavailable');
  await expect(page.locator('#outgoing')).toBeHidden();
});

test('expired tabs clear text, rules, activity and response without reload', async ({ page }) => {
  await page.clock.install();
  await example(page);
  await page.locator('#reviewed').check();
  await page.locator('#try-response').click();
  await page.clock.fastForward(15 * 60 * 1000);
  await expect(page.locator('#composer')).toHaveValue('');
  await expect(page.locator('#activity-count')).toHaveText('0');
  await expect(page.locator('#response-section')).toBeHidden();
});

test('late worker results cannot authorize input edited while scanning', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      postMessage(data) { setTimeout(() => super.postMessage(data), 300); }
    };
  });
  await page.goto('/');
  await page.locator('#composer').fill('mira@example.com');
  await page.locator('#scan').click();
  await page.locator('#composer').fill('Different input');
  await page.waitForTimeout(500);
  await expect(page.locator('#outgoing')).toBeHidden();
  await expect(page.locator('#try-response')).toBeDisabled();
});

test('Midnight failure is visible and never implies confirmed evidence', async ({ page }) => {
  await page.route('**/api/midnight/status', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"code":"MIDNIGHT_UNAVAILABLE"}' }));
  await page.goto('/#integrations');
  await page.locator('#check-midnight').click();
  await expect(page.locator('#midnight-state')).toHaveText('Unavailable');
  await expect(page.locator('#midnight-message')).toContainText('could not be verified');
  await expect(page.locator('#view-integrations').getByText('Not configured', { exact: true }).first()).toBeVisible();
});

test('wallet connect shows empty state when no Midnight wallet is installed', async ({ page }) => {
  await page.goto('/#integrations');
  await expect(page.getByText('Midnight wallets')).toBeVisible();
  await page.locator('#wallet-connect-mount button').click();
  await expect(page.getByText('No compatible Midnight wallet detected.')).toBeVisible();
  await expect(page.locator('.wallet-dialog')).toContainText('Network: preprod');
  await page.getByRole('button', { name: 'Close wallet dialog' }).click();
  await expect(page.locator('.wallet-overlay')).toBeHidden();
});

test('oversized text, empty input and unsafe HTML are handled locally', async ({ page }) => {
  await page.goto('/');
  await page.locator('#scan').click();
  await expect(page.locator('#message')).toContainText('Add some text');
  await page.locator('#composer').fill('a'.repeat(25001));
  await page.locator('#scan').click();
  await expect(page.locator('#message')).toContainText('25,000');
  await page.locator('#composer').fill('<img src=x onerror=alert(1)> mira@example.com');
  await page.locator('#scan').click();
  await expect(page.locator('#outgoing')).toContainText('<img src=x');
  await expect(page.locator('#outgoing img')).toHaveCount(0);
});

for (const width of [320, 375, 414, 768, 1440]) {
  test(`workspace and secondary views fit ${width}px without overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await example(page);
    for (const view of ['workspace', 'policies', 'activity', 'integrations']) {
      await page.locator(`[data-view="${view}"]`).click();
      const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.width);
      expect(overflow.body).toBeLessThanOrEqual(overflow.width);
      const wraps = await page.locator('button:visible, nav a:visible').evaluateAll(elements => elements.filter(el => {
        const range = document.createRange(); range.selectNodeContents(el);
        const tops = new Set([...range.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top)));
        // Inline icons have different metrics; text nodes are checked separately.
        return [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()).some(n => {
          range.selectNode(n); return range.getClientRects().length > 1;
        });
      }).map(el => el.textContent));
      expect(wraps).toEqual([]);
    }
  });
}
