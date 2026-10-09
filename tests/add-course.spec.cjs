// Adding any catalog course to a generated roadmap, and removing it again.
// Added courses must survive the share link, the PDF and the calendar export.
const { test, expect } = require('@playwright/test');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173/dlai-roadmap/';

const ANSWERS = {
  experience: 'some-python',
  goal: 'upskill',
  timeCommitment: '5-10',
  targetRole: 'builder',
  mathBackground: 'moderate',
  timeline: '6-months',
  priorCourses: [],
  interests: ['agents'],
};
const DLS = 'Deep Learning Specialization';

function shareUrl(answers) {
  return `${BASE_URL}?pathway=${Buffer.from(JSON.stringify(answers)).toString('base64')}`;
}

async function openRoadmap(page, answers = ANSWERS) {
  await page.goto(shareUrl(answers));
  await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });
}

async function totalCourses(page) {
  // The summary card: label row, then the number
  const card = page.getByText('Total Courses', { exact: true }).locator('xpath=../..');
  return Number(await card.locator('p').innerText());
}

async function addCourse(page, query, title) {
  if (!(await page.getByTestId('add-course-panel').isVisible())) {
    await page.getByRole('button', { name: 'Add Course' }).click();
  }
  await page.getByRole('searchbox', { name: 'Search all courses' }).fill(query);
  await page.getByRole('button', { name: `Add ${title}`, exact: true }).click();
}

const addedPhase = (page) => page.getByText('Your Added Courses', { exact: true });
const courseTitle = (page, title) => page.getByRole('heading', { level: 4, name: title, exact: true });

test.describe('Add any course to a roadmap', () => {
  test('A course outside the chosen path can be found, added and removed', async ({ page }) => {
    await openRoadmap(page);
    const before = await totalCourses(page);
    await expect(addedPhase(page)).toHaveCount(0);

    await addCourse(page, 'deep learning spec', DLS);

    await expect(page.getByRole('status')).toHaveText(`Added ${DLS} to your roadmap`);
    await expect(addedPhase(page)).toBeVisible();
    await expect(page.getByText('Added', { exact: true })).toBeVisible();
    await expect(courseTitle(page, DLS)).toBeVisible();
    expect(await totalCourses(page)).toBe(before + 1);

    // Once added it is no longer offered
    await expect(page.getByRole('button', { name: `Add ${DLS}`, exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: `Remove ${DLS} from roadmap` }).click();
    await expect(addedPhase(page)).toHaveCount(0);
    await expect(courseTitle(page, DLS)).toHaveCount(0);
    expect(await totalCourses(page)).toBe(before);
  });

  test('Courses already in the roadmap are not offered, and only added courses can be removed', async ({ page }) => {
    await openRoadmap(page);
    await page.getByRole('button', { name: 'Add Course' }).click();
    // ChatGPT Prompt Engineering for Developers is in the Builder path
    await page.getByRole('searchbox', { name: 'Search all courses' }).fill('ChatGPT Prompt Engineering for Developers');
    await expect(page.getByText('No courses outside your roadmap match')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Remove .* from roadmap$/ })).toHaveCount(0);
  });

  test('Several added courses keep the order they were added in', async ({ page }) => {
    await openRoadmap(page);
    await addCourse(page, DLS, DLS);
    await addCourse(page, 'Machine Learning Spec', 'Machine Learning Specialization');

    const phase = page.locator('div.relative.mb-6', { has: addedPhase(page) });
    await expect(phase.getByRole('heading', { level: 4 })).toHaveText([DLS, 'Machine Learning Specialization']);
    await expect(phase.getByText('2 courses')).toBeVisible();
  });

  test('The share link carries added courses and reopens with them', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async (text) => { window.__copied = text; } },
      });
    });
    await openRoadmap(page);
    await addCourse(page, DLS, DLS);
    await page.getByRole('button', { name: 'Share' }).click();

    const copied = await page.evaluate(() => window.__copied);
    const encoded = new URL(copied).searchParams.get('pathway');
    const answers = JSON.parse(Buffer.from(encoded, 'base64').toString());
    expect(answers.addedCourses).toEqual(['deep-learning-specialization']);

    await page.goto(copied);
    await expect(addedPhase(page)).toBeVisible({ timeout: 5000 });
    await addedPhase(page).click();
    await expect(courseTitle(page, DLS)).toBeVisible();
  });

  test('A shared link ignores unknown or duplicate added course IDs', async ({ page }) => {
    await openRoadmap(page, {
      ...ANSWERS,
      addedCourses: ['not-a-real-course', 'deep-learning-specialization', 'deep-learning-specialization'],
    });
    await addedPhase(page).click();
    const phase = page.locator('div.relative.mb-6', { has: addedPhase(page) });
    await expect(phase.getByRole('heading', { level: 4 })).toHaveText([DLS]);
  });

  test('The PDF lists added courses', async ({ page }) => {
    await openRoadmap(page);
    await addCourse(page, DLS, DLS);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export PDF/ }).click(),
    ]);
    const pdf = fs.readFileSync(await download.path()).toString('latin1');
    expect(pdf.startsWith('%PDF-')).toBe(true);
    expect(pdf).toContain('Your Added Courses');
    expect(pdf).toContain(DLS);
  });

  test('The calendar export includes added courses', async ({ page }) => {
    await openRoadmap(page);
    await addCourse(page, DLS, DLS);

    page.once('dialog', (dialog) => dialog.accept('2026-11-02'));
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Calendar/ }).click(),
    ]);
    // Undo RFC 5545 line folding before searching
    const ics = fs.readFileSync(await download.path(), 'utf8').replace(/\r\n /g, '');
    expect(ics).toContain(`SUMMARY:${DLS}`);
    expect(ics).toContain('Your Added Courses Complete');
  });
});
