import { test, expect } from '@playwright/test';

// Answer whatever question type is currently shown on a page
async function answerQuestion(page) {
  // Wait for round-result overlay to finish its exit transition (350ms CSS)
  // before trying to click answer buttons underneath it
  await page.waitForTimeout(400);

  const typeBadge = await page.locator('#q-type-badge').textContent();
  if (typeBadge.includes('Multiple Choice')) {
    await page.locator('.option-btn').first().click({ force: true }).catch(() => {});
  } else if (typeBadge.includes('True')) {
    await page.locator('.tf-btn').first().click({ force: true }).catch(() => {});
  } else {
    await page.locator('.fill-input').fill('test').catch(() => {});
    await page.locator('.fill-submit').click({ force: true }).catch(() => {});
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
      // Wait for quiz screen to be active
      await expect(hPage.locator('#quiz-screen')).toBeVisible({ timeout: 20000 });

      // Read current question number before answering
      const beforeCounter = await hPage.locator('#q-counter').textContent();

      // Both players answer whatever is currently showing
      await Promise.all([
        answerQuestion(hPage),
        answerQuestion(gPage),
      ]);

      if (i < 19) {
        // Wait for question to advance: either leaderboard appears or counter changes
        await Promise.race([
          // Path A: leaderboard checkpoint (Q5, Q10, Q15)
          hPage.locator('#leaderboard-screen').waitFor({ state: 'visible', timeout: 8000 })
            .then(() => expect(hPage.locator('#quiz-screen')).toBeVisible({ timeout: 12000 })),
          // Path B: counter changes to next question
          hPage.waitForFunction(
            prev => document.getElementById('q-counter')?.textContent !== prev,
            beforeCounter,
            { timeout: 8000 }
          ),
        ]).catch(() => {}); // if neither fires in time, keep going
      }
    }

    // --- Final results ---
    await expect(hPage.locator('#final-screen')).toBeVisible({ timeout: 20000 });
    await expect(gPage.locator('#final-screen')).toBeVisible({ timeout: 20000 });

    await expect(hPage.locator('#winner-name')).toBeVisible();
    await expect(hPage.locator('#final-scores')).toBeVisible();

    // Both players are listed in the final scores
    await expect(hPage.locator('#final-scores')).toContainText('Alice');
    await expect(hPage.locator('#final-scores')).toContainText('Bob');

    await hCtx.close();
    await gCtx.close();
  });
});
