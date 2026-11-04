// Course repos: the roadmap points learners to DeepLearning.AI's public GitHub
// so they can check a course's code and library versions before enrolling
// (forum suggestion, Oct 2026)
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173/dlai-roadmap/';

const shareUrl = (answers) => `${BASE_URL}?pathway=${Buffer.from(JSON.stringify(answers)).toString('base64')}`;

test('Roadmap links to DeepLearning.AI course repos on GitHub', async ({ page }) => {
  await page.goto(shareUrl({
    experience: 'some-python', goal: 'upskill', timeCommitment: '5-10', targetRole: 'builder',
    mathBackground: 'moderate', timeline: '6-months', priorCourses: [], interests: [],
  }));
  await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

  const link = page.getByTestId('dlai-github').getByRole('link', { name: "DeepLearning.AI's GitHub" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://github.com/https-deeplearning-ai');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});
