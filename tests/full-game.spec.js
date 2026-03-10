import { test, expect } from '@playwright/test';

// Answer whatever question type is currently shown on a page
async function answerQuestion(page) {
  const typeBadge = await page.locator('#q-type-badge').textContent();
  if (typeBadge.includes('Multiple Choice')) {
    await page.locator('.option-btn').first().click().catch(() => {});
  } else if (typeBadge.includes('True')) {
    await page.locator('.tf-btn').first().click().catch(() => {});
  } else {
    await page.locator('.fill-input').fill('test').catch(() => {});
    await page.locator('.fill-submit').click().catch(() => {});
  }
}

test.describe('Full Game Flow', () => {
  test('two players can complete all 20 questions and reach final results', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes — 20 questions × 3.5s + 3 leaderboards × 5s

    // --- Setup ---
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

    // --- Start ---
    await expect(hPage.locator('#start-battle-btn')).toBeVisible({ timeout: 8000 });
    await hPage.click('#start-battle-btn');
    await expect(hPage.locator('#quiz-screen')).toBeVisible({ timeout: 10000 });
    await expect(gPage.locator('#quiz-screen')).toBeVisible({ timeout: 10000 });

    // --- Play all 20 questions ---
    for (let i = 0; i < 20; i++) {
      // Wait for question i+1 to appear on host
      await expect(hPage.locator('#q-counter')).toContainText(`Q ${i + 1} / 20`, { timeout: 15000 });

      // Both players answer
      await Promise.all([
        answerQuestion(hPage),
        answerQuestion(gPage),
      ]);

      // After Q5, Q10, Q15 — wait for leaderboard then quiz to resume
      if ((i + 1) % 5 === 0 && i + 1 < 20) {
        await expect(hPage.locator('#leaderboard-screen')).toBeVisible({ timeout: 8000 });
        await expect(hPage.locator('#quiz-screen')).toBeVisible({ timeout: 12000 });
      }
    }

    // --- Final results ---
    await expect(hPage.locator('#final-screen')).toBeVisible({ timeout: 15000 });
    await expect(gPage.locator('#final-screen')).toBeVisible({ timeout: 15000 });

    await expect(hPage.locator('#winner-name')).toBeVisible();
    await expect(hPage.locator('#final-scores')).toBeVisible();

    // Both players are listed in the final scores
    await expect(hPage.locator('#final-scores')).toContainText('Alice');
    await expect(hPage.locator('#final-scores')).toContainText('Bob');

    await hCtx.close();
    await gCtx.close();
  });
});
