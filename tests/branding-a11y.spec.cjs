// Branding (unofficial status) and text contrast checks
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173/dlai-roadmap/';

const SHARED_ANSWERS = {
  experience: 'some-python',
  goal: 'upskill',
  timeCommitment: '5-10',
  targetRole: 'builder',
  mathBackground: 'moderate',
  timeline: '6-months',
  priorCourses: [],
  interests: ['agents'],
};
const SHARED_URL = `${BASE_URL}?pathway=${Buffer.from(JSON.stringify(SHARED_ANSWERS)).toString('base64')}`;

// WCAG 2.x relative luminance contrast ratio
function contrast(hexA, hexB) {
  const lum = (hex) => {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [hi, lo] = [lum(hexA), lum(hexB)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

test.describe('Branding and accessibility', () => {
  test('Welcome screen states the site is unofficial', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Unofficial/);
    await expect(page.getByTestId('unofficial-disclaimer')).toContainText('Not an official DeepLearning.AI product');
    await expect(page.getByTestId('unofficial-disclaimer')).toBeVisible();
  });

  test('Welcome footer does not overlap the feature cards on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    const footer = await page.getByTestId('welcome-footer').boundingBox();
    const lastCard = await page.getByText('Smart Sequencing').locator('xpath=ancestor::div[contains(@class,"card-neural")][1]').boundingBox();
    expect(footer.y).toBeGreaterThanOrEqual(lastCard.y + lastCard.height);
  });

  test('Active category tab label is readable on its cyan background', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Get Started")');
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`text=Question ${i} of 8`)).toBeVisible();
      await page.locator('button.rounded-xl').first().click();
    }
    await expect(page.locator('text=Question 7 of 8')).toBeVisible();
    const colors = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => getComputedStyle(b).backgroundColor === 'rgb(0, 212, 255)');
      return btn && { fg: getComputedStyle(btn).color };
    });
    expect(colors, 'an active cyan tab exists').toBeTruthy();
    const hex = '#' + colors.fg.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
    expect(contrast(hex, '#00d4ff')).toBeGreaterThanOrEqual(4.5);
  });

  test('Disclaimer credits the DLAI Community Program instead of denying affiliation', async ({ page }) => {
    await page.goto(BASE_URL);
    const disclaimer = page.getByTestId('unofficial-disclaimer');
    await expect(disclaimer).not.toContainText(/affiliated|endorsed/i);
    const link = disclaimer.getByRole('link', { name: 'DeepLearning.AI Community Program' });
    await expect(link).toHaveAttribute('href', /^https:\/\/community\.deeplearning\.ai\/t\//);
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('Roadmap view states the site is unofficial', async ({ page }) => {
    await page.goto(SHARED_URL);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });
    const disclaimer = page.getByTestId('unofficial-disclaimer');
    await disclaimer.scrollIntoViewIfNeeded();
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText('Not an official DeepLearning.AI product');
  });

  test('Text color tokens meet WCAG AA (4.5:1) on every surface', async ({ page }) => {
    await page.goto(BASE_URL);
    const tokens = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const names = ['--text-primary', '--text-secondary', '--text-muted', '--void', '--deep', '--surface', '--elevated'];
      return Object.fromEntries(names.map(n => [n, cs.getPropertyValue(n).trim()]));
    });
    for (const fg of ['--text-primary', '--text-secondary', '--text-muted']) {
      for (const bg of ['--void', '--deep', '--surface', '--elevated']) {
        const ratio = contrast(tokens[fg], tokens[bg]);
        expect(ratio, `${fg} ${tokens[fg]} on ${bg} ${tokens[bg]}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test('PDF export does not present itself as an official DeepLearning.AI document', async ({ page }) => {
    await page.goto(SHARED_URL);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button[title="Export PDF"], button:has-text("PDF")').first().click(),
    ]);
    const fs = require('fs');
    const pdf = fs.readFileSync(await download.path(), 'latin1');
    const pages = (pdf.match(/\/Type \/Page\b/g) || []).length;
    const footers = (pdf.match(/not an official DeepLearning\.AI product/g) || []).length;
    expect(pages).toBeGreaterThan(0);
    expect(footers).toBe(pages);
    expect(pdf).not.toContain('Generated by DeepLearning.AI');
  });
});
