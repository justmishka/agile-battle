import { test, expect } from '@playwright/test';

// Helpers
async function createRoom(browser, hostName) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.fill('#create-name', hostName);
  await page.click('#panel-create .btn');
  await expect(page.locator('#waiting-screen')).toBeVisible({ timeout: 10000 });
  const code = (await page.locator('#room-code-display').textContent()).trim();
  return { ctx, page, code };
}

async function joinRoom(browser, guestName, code) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.click('#tab-join');
  await page.fill('#join-name', guestName);
  await page.fill('#join-code', code);
  await page.click('#panel-join .btn');
  await expect(page.locator('#waiting-screen')).toBeVisible({ timeout: 10000 });
  return { ctx, page };
}

test.describe('Two-Player Flow', () => {
  test('host and guest can join the same room', async ({ browser }) => {
    const { ctx: hCtx, page: hPage, code } = await createRoom(browser, 'Alice');
    const { ctx: gCtx, page: gPage } = await joinRoom(browser, 'Bob', code);

    await expect(gPage.locator('#waiting-host-name')).toContainText('Alice', { timeout: 8000 });

    await hCtx.close();
    await gCtx.close();
  });

  test('host sees Start Battle button after guest joins', async ({ browser }) => {
    const { ctx: hCtx, page: hPage, code } = await createRoom(browser, 'Alice');
    const { ctx: gCtx } = await joinRoom(browser, 'Bob', code);

    await expect(hPage.locator('#start-battle-btn')).toBeVisible({ timeout: 8000 });

    await hCtx.close();
    await gCtx.close();
  });

  test('guest does not see Start Battle button', async ({ browser }) => {
    const { ctx: hCtx, page: hPage, code } = await createRoom(browser, 'Alice');
    const { ctx: gCtx, page: gPage } = await joinRoom(browser, 'Bob', code);

    await expect(hPage.locator('#start-battle-btn')).toBeVisible({ timeout: 8000 });
    await expect(gPage.locator('#start-battle-btn')).toBeHidden();

    await hCtx.close();
    await gCtx.close();
  });

  test('countdown screen appears for both players after host starts', async ({ browser }) => {
    const { ctx: hCtx, page: hPage, code } = await createRoom(browser, 'Alice');
    const { ctx: gCtx, page: gPage } = await joinRoom(browser, 'Bob', code);

    await expect(hPage.locator('#start-battle-btn')).toBeVisible({ timeout: 8000 });
    await hPage.click('#start-battle-btn');

    await expect(hPage.locator('#countdown-screen')).toBeVisible({ timeout: 5000 });
    await expect(gPage.locator('#countdown-screen')).toBeVisible({ timeout: 5000 });

    await hCtx.close();
    await gCtx.close();
  });

  test('quiz screen appears for both players after countdown', async ({ browser }) => {
    const { ctx: hCtx, page: hPage, code } = await createRoom(browser, 'Alice');
    const { ctx: gCtx, page: gPage } = await joinRoom(browser, 'Bob', code);

    await expect(hPage.locator('#start-battle-btn')).toBeVisible({ timeout: 8000 });
    await hPage.click('#start-battle-btn');

    // Countdown takes ~3 seconds, allow extra buffer
    await expect(hPage.locator('#quiz-screen')).toBeVisible({ timeout: 10000 });
    await expect(gPage.locator('#quiz-screen')).toBeVisible({ timeout: 10000 });

    await hCtx.close();
    await gCtx.close();
  });

  test('both players see the same question text', async ({ browser }) => {
    const { ctx: hCtx, page: hPage, code } = await createRoom(browser, 'Alice');
    const { ctx: gCtx, page: gPage } = await joinRoom(browser, 'Bob', code);

    await expect(hPage.locator('#start-battle-btn')).toBeVisible({ timeout: 8000 });
    await hPage.click('#start-battle-btn');

    await expect(hPage.locator('#quiz-screen')).toBeVisible({ timeout: 10000 });
    await expect(gPage.locator('#quiz-screen')).toBeVisible({ timeout: 10000 });

    const hostQuestion = await hPage.locator('#q-text').textContent();
    const guestQuestion = await gPage.locator('#q-text').textContent();
    expect(hostQuestion).toBe(guestQuestion);

    await hCtx.close();
    await gCtx.close();
  });

  test('quiz header shows both player names and scores', async ({ browser }) => {
    const { ctx: hCtx, page: hPage, code } = await createRoom(browser, 'Alice');
    const { ctx: gCtx, page: gPage } = await joinRoom(browser, 'Bob', code);

    await expect(hPage.locator('#start-battle-btn')).toBeVisible({ timeout: 8000 });
    await hPage.click('#start-battle-btn');

    await expect(hPage.locator('#quiz-screen')).toBeVisible({ timeout: 10000 });

    await expect(hPage.locator('#h-my-name')).toContainText('Alice');
    await expect(hPage.locator('#h-opp-name')).toContainText('Bob');
    await expect(hPage.locator('#h-my-pts')).toContainText('0');
    await expect(hPage.locator('#h-opp-pts')).toContainText('0');

    await hCtx.close();
    await gCtx.close();
  });

  test('room is full after two players join', async ({ browser }) => {
    const { ctx: hCtx, code } = await createRoom(browser, 'Alice');
    const { ctx: gCtx } = await joinRoom(browser, 'Bob', code);

    // Third player tries to join
    const { ctx: thirdCtx, page: thirdPage } = await (async () => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      return { ctx, page };
    })();

    await thirdPage.goto('/');
    await thirdPage.click('#tab-join');
    await thirdPage.fill('#join-name', 'Charlie');
    await thirdPage.fill('#join-code', code);

    const dialog = thirdPage.waitForEvent('dialog');
    await thirdPage.click('#panel-join .btn');
    const d = await dialog;
    expect(d.message()).toContain('full');
    await d.accept();

    await hCtx.close();
    await gCtx.close();
    await thirdCtx.close();
  });
});
