// Catalog data integrity and pathway-phase safeguards
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173/dlai-roadmap/';
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/courses.json'), 'utf8'));
const categoriesSource = fs.readFileSync(path.join(__dirname, '../src/utils/categories.js'), 'utf8');

// Courses DLAI has retired (page shows a retirement notice and the catalog no longer lists them)
const RETIRED_IDS = [
  'build-llm-apps-with-langchain-js',
  'serverless-agentic-workflows-with-amazon-bedrock',
  'serverless-llm-apps-amazon-bedrock',
  'quality-safety-llm-applications',
];

function pathwayCourseIds() {
  const ids = [];
  for (const pathway of Object.values(data.pathways)) {
    if (pathway.courses) ids.push(...pathway.courses);
    for (const phase of pathway.phases || []) ids.push(...phase.courses);
  }
  return ids;
}

function encode(answers) {
  return Buffer.from(JSON.stringify({ priorCourses: [], interests: [], ...answers })).toString('base64');
}

test.describe('Catalog data integrity', () => {
  test('course ids and URLs are unique', () => {
    const ids = data.courses.map(c => c.id);
    const urls = data.courses.map(c => c.url);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  test('every pathway course and prerequisite exists in the catalog', () => {
    const ids = new Set(data.courses.map(c => c.id));
    const missingPathway = pathwayCourseIds().filter(id => !ids.has(id));
    const missingPrereqs = data.courses.flatMap(c =>
      c.prerequisites.filter(p => !ids.has(p)).map(p => `${c.id} -> ${p}`)
    );
    expect(missingPathway).toEqual([]);
    expect(missingPrereqs).toEqual([]);
  });

  test('retired courses are not in the catalog', () => {
    const ids = new Set(data.courses.map(c => c.id));
    expect(RETIRED_IDS.filter(id => ids.has(id))).toEqual([]);
  });

  test('every course has valid difficulty, hours, categories and enrichment', () => {
    const categoryIds = [...categoriesSource.matchAll(/^\s{2}(\w+): '/gm)].map(m => m[1]);
    expect(categoryIds.length).toBeGreaterThan(0);
    const problems = [];
    for (const c of data.courses) {
      if (!['beginner', 'intermediate', 'advanced'].includes(c.difficulty)) problems.push(`${c.id}: difficulty ${c.difficulty}`);
      if (!(typeof c.estimated_hours === 'number' && c.estimated_hours > 0)) problems.push(`${c.id}: hours ${c.estimated_hours}`);
      if (!['short', 'course', 'certificate'].includes(c.type)) problems.push(`${c.id}: type ${c.type}`);
      if (!c.categories.length || c.categories.some(cat => !categoryIds.includes(cat))) problems.push(`${c.id}: categories ${c.categories}`);
      if (!c.skills_taught?.length) problems.push(`${c.id}: no skills_taught`);
      if (!c.career_paths?.length) problems.push(`${c.id}: no career_paths`);
      if (!c.partner) problems.push(`${c.id}: no partner`);
    }
    expect(problems).toEqual([]);
  });

  test('short-course hours are not placeholders', () => {
    // Short courses used to default to 2h; real durations come from the DLAI course page
    const shorts = data.courses.filter(c => c.type === 'short');
    const atTwoHours = shorts.filter(c => c.estimated_hours === 2);
    expect(atTwoHours.length).toBeLessThan(shorts.length * 0.1);
  });
});

test.describe('Pathway phases with experienced learners', () => {
  test('professional enterprise roadmap keeps every required phase', async ({ page }) => {
    // Security Core and Privacy Tech courses are all beginner-level on DLAI.
    // Experienced learners skip beginner courses, but must never lose a whole phase.
    await page.goto(`${BASE_URL}?pathway=${encode({
      experience: 'professional',
      goal: 'upskill',
      timeCommitment: '10-20',
      targetRole: 'enterprise',
      mathBackground: 'strong',
      timeline: '6-months',
    })}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    for (const phase of data.pathways.enterprise.phases) {
      await expect(page.getByRole('heading', { name: phase.name, exact: true })).toBeVisible();
    }
  });

  test('professional builder roadmap keeps every required phase', async ({ page }) => {
    await page.goto(`${BASE_URL}?pathway=${encode({
      experience: 'professional',
      goal: 'upskill',
      timeCommitment: '10-20',
      targetRole: 'builder',
      mathBackground: 'strong',
      timeline: '6-months',
    })}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    for (const phase of data.pathways.builder.phases) {
      await expect(page.getByRole('heading', { name: phase.name, exact: true })).toBeVisible();
    }
  });

  test('total hours display as a whole number', async ({ page }) => {
    await page.goto(`${BASE_URL}?pathway=${encode({
      experience: 'none',
      goal: 'curiosity',
      timeCommitment: '5-10',
      targetRole: 'builder',
      mathBackground: 'moderate',
      timeline: '12-months',
      interests: ['agents', 'coding'],
    })}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    const hoursValue = page.getByText('Total Hours', { exact: true }).locator('xpath=../following-sibling::p[1]');
    await expect(hoursValue).toHaveText(/^\d+$/);
  });
});
