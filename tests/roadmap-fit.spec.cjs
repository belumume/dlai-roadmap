// Roadmap fit: math gates only math-heavy electives, coders skip beginner
// overviews, electives rank by fit (not vendor), and naming/copy stay consistent.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173/dlai-roadmap/';
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/courses.json'), 'utf8'));
const byTitle = new Map(data.courses.map(c => [c.title, c]));

function encode(answers) {
  return Buffer.from(JSON.stringify({ priorCourses: [], interests: [], ...answers })).toString('base64');
}

async function open(page, answers) {
  await page.goto(`${BASE_URL}?pathway=${encode(answers)}`);
  await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });
}

// Titles of the courses in one phase, in display order (expands the phase first)
async function phaseCourses(page, phaseName) {
  const phase = page.locator('div.relative.mb-6').filter({ has: page.getByRole('heading', { name: phaseName, exact: true }) });
  await expect(phase).toHaveCount(1);
  if (await phase.getByRole('heading', { level: 4 }).count() === 0) {
    await phase.getByRole('button', { name: new RegExp(phaseName) }).first().click();
  }
  await expect(phase.getByRole('heading', { level: 4 }).first()).toBeVisible();
  return phase.getByRole('heading', { level: 4 }).allTextContents();
}

const coder = {
  experience: 'some-python',
  goal: 'upskill',
  timeCommitment: '10-20',
  mathBackground: 'minimal',
  timeline: '12-months',
};

test.describe('Roadmap fit', () => {
  test('minimal math no longer limits agent and RAG electives to beginner level', async ({ page }) => {
    await open(page, { ...coder, targetRole: 'builder', interests: ['agents', 'rag'] });
    const electives = (await phaseCourses(page, 'Areas of Interest')).map(t => byTitle.get(t));
    expect(electives.length).toBeGreaterThan(0);
    expect(electives.some(c => c.difficulty === 'intermediate')).toBe(true);
  });

  test('minimal math still keeps training electives at beginner level', async ({ page }) => {
    await open(page, { ...coder, targetRole: 'builder', interests: ['training'] });
    const electives = (await phaseCourses(page, 'Areas of Interest')).map(t => byTitle.get(t));
    expect(electives.length).toBeGreaterThan(0);
    for (const c of electives) {
      if (c.categories.includes('training')) expect(c.difficulty, c.id).toBe('beginner');
    }
  });

  test('learners who code skip the Python primer and the non-technical overviews', async ({ page }) => {
    await open(page, { ...coder, targetRole: 'builder' });
    expect(await phaseCourses(page, 'Common Foundation')).toEqual(['Generative AI with Large Language Models']);
  });

  test('coders on the leadership track keep the "for Everyone" overviews', async ({ page }) => {
    await open(page, { ...coder, targetRole: 'enterprise' });
    expect(await phaseCourses(page, 'Common Foundation')).toEqual([
      'AI for Everyone',
      'Generative AI for Everyone',
      'Generative AI with Large Language Models',
    ]);
  });

  test('complete beginners keep the full foundation', async ({ page }) => {
    await open(page, { ...coder, experience: 'none', targetRole: 'builder' });
    const titles = new Map(data.courses.map(c => [c.id, c.title]));
    expect(await phaseCourses(page, 'Common Foundation')).toEqual(data.pathways.trunk.courses.map(id => titles.get(id)));
  });

  test('electives are ordered by how many of the learner\'s interests they cover', async ({ page }) => {
    const interests = ['agents', 'rag'];
    await open(page, { ...coder, mathBackground: 'strong', targetRole: 'builder', interests });
    const electives = (await phaseCourses(page, 'Areas of Interest')).map(t => byTitle.get(t));
    const matches = electives.map(c => c.categories.filter(cat => interests.includes(cat)).length);
    expect(matches[0]).toBe(2);
    expect(matches).toEqual([...matches].sort((a, b) => b - a));
  });

  test('skipped foundation courses do not come back as electives', async ({ page }) => {
    // AI Python for Beginners is in the coding category; a coder who picks coding must not get it back
    await open(page, { ...coder, goal: 'career-switch', targetRole: 'builder', interests: ['coding'] });
    const electives = await phaseCourses(page, 'Areas of Interest');
    expect(electives.length).toBeGreaterThan(0);
    expect(electives).not.toContain('AI Python for Beginners');
  });

  test('the enterprise track has one name everywhere', async ({ page }) => {
    expect(data.pathways.enterprise.name).toBe('Enterprise AI Leader');
    await open(page, { ...coder, targetRole: 'enterprise' });
    await expect(page.getByRole('heading', { name: 'Enterprise AI Leader' }).first()).toBeVisible();
    await page.goto(BASE_URL);
    await expect(page.getByText('Weeks, not months')).toHaveCount(0);
    await expect(page.getByText('Enterprise AI Leader', { exact: false })).toBeVisible();
  });

  test('no course URL carries tracking parameters', () => {
    expect(data.courses.filter(c => /[?&]utm_/.test(c.url)).map(c => c.id)).toEqual([]);
  });
});
