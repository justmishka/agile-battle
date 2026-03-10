import { test, expect } from '@playwright/test';

test.describe('Lobby Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows lobby screen on load', async ({ page }) => {
    await expect(page.locator('#lobby-screen')).toBeVisible();
    await expect(page.locator('.logo')).toContainText('AgileBattle');
  });

  test('Create Room tab is active by default', async ({ page }) => {
    await expect(page.locator('#tab-create')).toHaveClass(/active-tab/);
    await expect(page.locator('#panel-create')).toBeVisible();
    await expect(page.locator('#panel-join')).toBeHidden();
  });

  test('can switch to Join Room tab', async ({ page }) => {
    await page.click('#tab-join');
    await expect(page.locator('#tab-join')).toHaveClass(/active-tab/);
    await expect(page.locator('#panel-join')).toBeVisible();
    await expect(page.locator('#panel-create')).toBeHidden();
  });

  test('can switch back to Create Room tab', async ({ page }) => {
    await page.click('#tab-join');
    await page.click('#tab-create');
    await expect(page.locator('#tab-create')).toHaveClass(/active-tab/);
    await expect(page.locator('#panel-create')).toBeVisible();
  });

  test('create room without name shows alert', async ({ page }) => {
    const dialog = page.waitForEvent('dialog');
    await page.click('#panel-create .btn');
    const d = await dialog;
    expect(d.message()).toContain('Enter your name');
    await d.accept();
  });

  test('join room without name and code shows alert', async ({ page }) => {
    await page.click('#tab-join');
    const dialog = page.waitForEvent('dialog');
    await page.click('#panel-join .btn');
    const d = await dialog;
    expect(d.message()).toContain('Enter both');
    await d.accept();
  });

  test('create-name input accepts text and respects maxlength', async ({ page }) => {
    await page.fill('#create-name', 'Alice');
    await expect(page.locator('#create-name')).toHaveValue('Alice');
    await expect(page.locator('#create-name')).toHaveAttribute('maxlength', '20');
  });

  test('pressing Enter in create-name triggers create room', async ({ page }) => {
    // No name entered — should show alert instead of crashing
    const dialog = page.waitForEvent('dialog');
    await page.locator('#create-name').press('Enter');
    const d = await dialog;
    expect(d.message()).toContain('Enter your name');
    await d.accept();
  });

  test('pressing Enter in join fields triggers join', async ({ page }) => {
    await page.click('#tab-join');
    // No values — should show alert
    const dialog = page.waitForEvent('dialog');
    await page.locator('#join-code').press('Enter');
    const d = await dialog;
    expect(d.message()).toContain('Enter both');
    await d.accept();
  });

  test('join-code input transforms to uppercase', async ({ page }) => {
    await page.click('#tab-join');
    await page.fill('#join-code', 'ab3xy');
    // CSS text-transform:uppercase is visual only; check the style attribute
    const style = await page.locator('#join-code').getAttribute('style');
    expect(style).toContain('text-transform:uppercase');
  });
});
