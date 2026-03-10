import { test, expect } from '@playwright/test';

test.describe('Room Creation', () => {
  test('creates a room and shows waiting screen', async ({ page }) => {
    await page.goto('/');
    await page.fill('#create-name', 'TestHost');
    await page.click('#panel-create .btn');

    await expect(page.locator('#waiting-screen')).toBeVisible({ timeout: 10000 });
  });

  test('room code is 5 uppercase alphanumeric characters', async ({ page }) => {
    await page.goto('/');
    await page.fill('#create-name', 'Alice');
    await page.click('#panel-create .btn');

    await expect(page.locator('#waiting-screen')).toBeVisible({ timeout: 10000 });
    const code = await page.locator('#room-code-display').textContent();
    expect(code.trim()).toMatch(/^[A-Z0-9]{5}$/);
  });

  test('waiting screen shows host name', async ({ page }) => {
    await page.goto('/');
    await page.fill('#create-name', 'Alice');
    await page.click('#panel-create .btn');

    await expect(page.locator('#waiting-host-name')).toContainText('Alice', { timeout: 10000 });
  });

  test('start battle button is hidden before guest joins', async ({ page }) => {
    await page.goto('/');
    await page.fill('#create-name', 'Alice');
    await page.click('#panel-create .btn');

    await expect(page.locator('#waiting-screen')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#start-battle-btn')).toBeHidden();
  });

  test('guest slot shows Waiting... before guest joins', async ({ page }) => {
    await page.goto('/');
    await page.fill('#create-name', 'Alice');
    await page.click('#panel-create .btn');

    await expect(page.locator('#waiting-screen')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#join-waiting-guest')).toContainText('Waiting…');
  });

  test('joining non-existent room shows alert', async ({ page }) => {
    await page.goto('/');
    await page.click('#tab-join');
    await page.fill('#join-name', 'Bob');
    await page.fill('#join-code', 'ZZZZZ');

    const dialog = page.waitForEvent('dialog');
    await page.click('#panel-join .btn');
    const d = await dialog;
    expect(d.message()).toContain('not found');
    await d.accept();
  });
});
