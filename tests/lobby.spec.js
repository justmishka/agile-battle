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
    const dialogPromise = page.waitForEvent('dialog');
    page.click('#panel-create .btn'); // fire without awaiting — dialog blocks the click
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Enter your name');
    await dialog.accept();
  });

  test('join room without name and code shows alert', async ({ page }) => {
    await page.click('#tab-join');
    const dialogPromise = page.waitForEvent('dialog');
    page.click('#panel-join .btn'); // fire without awaiting
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Enter both');
    await dialog.accept();
  });

  test('create-name input accepts text and respects maxlength', async ({ page }) => {
    await page.fill('#create-name', 'Alice');
    await expect(page.locator('#create-name')).toHaveValue('Alice');
    await expect(page.locator('#create-name')).toHaveAttribute('maxlength', '20');
  });

  test('pressing Enter in create-name triggers create room', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });
    await page.locator('#create-name').press('Enter');
    await page.waitForTimeout(500);
    expect(dialogMessage).toContain('Enter your name');
  });

  test('pressing Enter in join fields triggers join', async ({ page }) => {
    await page.click('#tab-join');
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });
    await page.locator('#join-code').press('Enter');
    await page.waitForTimeout(500);
    expect(dialogMessage).toContain('Enter both');
  });

  test('join-code input transforms to uppercase', async ({ page }) => {
    await page.click('#tab-join');
    await page.fill('#join-code', 'ab3xy');
    // CSS text-transform:uppercase is visual only; check the style attribute
    const style = await page.locator('#join-code').getAttribute('style');
    expect(style).toContain('text-transform:uppercase');
  });
});
