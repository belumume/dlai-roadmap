// Certificate badges: DLAI full courses and specializations award a paid
// certificate; short courses award none (checked against all catalog pages)
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173/dlai-roadmap/';

const shareUrl = (answers) => `${BASE_URL}?pathway=${Buffer.from(JSON.stringify(answers)).toString('base64')}`;
const card = (page, title) =>
  page.locator('div.rounded-xl', { has: page.getByRole('heading', { level: 4, name: title, exact: true }) }).last();

test.describe('Certificate badges', () => {
  test('Full courses show a paid-certificate badge; short courses do not', async ({ page }) => {
    await page.goto(shareUrl({
      experience: 'some-python', goal: 'upskill', timeCommitment: '5-10', targetRole: 'builder',
      mathBackground: 'moderate', timeline: '6-months', priorCourses: [], interests: ['agents'],
    }));
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });
    // Builder Agents phase holds Agentic AI (full course) and short courses
    await page.getByRole('button', { name: /^\d*\s*Agents/ }).click();

    await expect(card(page, 'Agentic AI').getByTestId('certificate-badge')).toHaveText('Certificate (paid)');
    await expect(card(page, 'AI Agents in LangGraph').getByTestId('certificate-badge')).toHaveCount(0);
  });

  test('Coursera specializations say the certificate needs paid enrollment', async ({ page }) => {
    await page.goto(shareUrl({
      experience: 'ml-basics', goal: 'research', timeCommitment: '20+', targetRole: 'researcher',
      mathBackground: 'expert', timeline: 'no-rush', priorCourses: [], interests: ['training'],
    }));
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });
    for (const phase of await page.getByRole('button', { name: /Areas of Interest|Deep Learning & Frameworks/ }).all()) {
      await phase.click();
    }
    // A Coursera specialization elective, and a DLAI specialization in the core path
    await expect(page.getByTestId('certificate-badge').filter({ hasText: 'Certificate (paid on Coursera)' }).first()).toBeVisible();
    await expect(card(page, 'Deep Learning Specialization').getByTestId('certificate-badge')).toHaveText('Certificate (paid)');
  });
});
