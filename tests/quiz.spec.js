import { test, expect } from '@playwright/test';

// Reusable: spin up a full game and land both players on quiz screen
async function startGame(browser) {
  const hCtx = await browser.newContext();
  const hPage = await hCtx.newPage();
  await hPage.goto('/');
  await hPage.fill('#create-name', 'Alice');
  await hPage.click('#panel-create .btn');
  await expect(hPage.locator('#waiting-screen')).toBeVisible({ timeout: 10000 });
  const code = (await hPage.locator('#room-code-display').textContent()).trim();

  const gCtx = await browser.newContext();
  const gPage = await gCtx.newPage();
  await gPage.goto('/');
  await gPage.click('#tab-join');
  await gPage.fill('#join-name', 'Bob');
  await gPage.fill('#join-code', code);
  await gPage.click('#panel-join .btn');
  await expect(gPage.locator('#waiting-screen')).toBeVisible({ timeout: 10000 });

  await expect(hPage.locator('#start-battle-btn')).toBeVisible({ timeout: 8000 });
  await hPage.click('#start-battle-btn');

  await expect(hPage.locator('#quiz-screen')).toBeVisible({ timeout: 10000 });
  await expect(gPage.locator('#quiz-screen')).toBeVisible({ timeout: 10000 });

  return { hCtx, hPage, gCtx, gPage };
}

test.describe('Quiz Screen', () => {
  test('question counter starts at Q 1 / 20', async ({ browser }) => {
    const { hCtx, hPage, gCtx } = await startGame(browser);
    await expect(hPage.locator('#q-counter')).toContainText('Q 1 / 20');
    await hCtx.close();
    await gCtx.close();
  });

  test('timer starts at 15', async ({ browser }) => {
    const { hCtx, hPage, gCtx } = await startGame(browser);
    await expect(hPage.locator('#timer-num')).toContainText('15');
    await hCtx.close();
    await gCtx.close();
  });

  test('question has a category tag', async ({ browser }) => {
    const { hCtx, hPage, gCtx } = await startGame(browser);
    const tag = hPage.locator('#q-tag');
    await expect(tag).toBeVisible();
    const text = await tag.textContent();
    expect(['SCRUM', 'KANBAN', 'AGILE']).toContain(text.trim());
    await hCtx.close();
    await gCtx.close();
  });

  test('question text is not empty', async ({ browser }) => {
    const { hCtx, hPage, gCtx } = await startGame(browser);
    const qText = await hPage.locator('#q-text').textContent();
    expect(qText.trim().length).toBeGreaterThan(10);
    await hCtx.close();
    await gCtx.close();
  });

  test('MCQ question renders 4 option buttons', async ({ browser }) => {
    const { hCtx, hPage, gCtx } = await startGame(browser);

    // Skip if this question isn't MCQ — just check that answer area has content
    const answerArea = hPage.locator('#q-answer-area');
    await expect(answerArea).not.toBeEmpty();

    // If MCQ, verify 4 buttons
    const typeBadge = await hPage.locator('#q-type-badge').textContent();
    if (typeBadge.includes('Multiple Choice')) {
      await expect(hPage.locator('.option-btn')).toHaveCount(4);
    }

    await hCtx.close();
    await gCtx.close();
  });

  test('opponent answered indicator appears after opponent answers', async ({ browser }) => {
    const { hCtx, hPage, gCtx, gPage } = await startGame(browser);

    // Guest answers (click first available button/option)
    const typeBadge = await gPage.locator('#q-type-badge').textContent();
    if (typeBadge.includes('Multiple Choice')) {
      await gPage.locator('.option-btn').first().click();
    } else if (typeBadge.includes('True')) {
      await gPage.locator('.tf-btn').first().click();
    } else {
      await gPage.fill('.fill-input', 'test');
      await gPage.click('.fill-submit');
    }

    // Host should see opponent-answered indicator
    await expect(hPage.locator('#opp-answered')).toBeVisible({ timeout: 8000 });

    await hCtx.close();
    await gCtx.close();
  });

  test('my answer indicator appears after answering', async ({ browser }) => {
    const { hCtx, hPage, gCtx } = await startGame(browser);

    const typeBadge = await hPage.locator('#q-type-badge').textContent();
    if (typeBadge.includes('Multiple Choice')) {
      await hPage.locator('.option-btn').first().click();
    } else if (typeBadge.includes('True')) {
      await hPage.locator('.tf-btn').first().click();
    } else {
      await hPage.fill('.fill-input', 'test');
      await hPage.click('.fill-submit');
    }

    await expect(hPage.locator('#my-answer-indicator')).toBeVisible({ timeout: 5000 });

    await hCtx.close();
    await gCtx.close();
  });
});
