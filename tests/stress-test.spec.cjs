// Stress test for DLAI Roadmap - all questionnaire combinations
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5175/dlai-roadmap/';

// All possible answer combinations
const OPTIONS = {
  experience: ['none', 'some-python', 'ml-basics', 'professional'],
  goal: ['career-switch', 'upskill', 'research', 'curiosity'],
  timeCommitment: ['2-5', '5-10', '10-20', '20+'],
  targetRole: ['builder', 'researcher', 'enterprise', 'undecided'],
  mathBackground: ['minimal', 'moderate', 'strong', 'expert'],
  timeline: ['3-months', '6-months', '12-months', 'no-rush'],
};

// Test combinations to stress test
const TEST_CASES = [
  // Extreme: Complete beginner, minimal math, career switch
  { experience: 'none', goal: 'career-switch', timeCommitment: '2-5', targetRole: 'builder', mathBackground: 'minimal', timeline: '12-months', interests: ['agents'] },
  // Extreme: Professional, expert math, research
  { experience: 'professional', goal: 'research', timeCommitment: '20+', targetRole: 'researcher', mathBackground: 'expert', timeline: '3-months', interests: ['training', 'safety'] },
  // Middle ground
  { experience: 'some-python', goal: 'upskill', timeCommitment: '5-10', targetRole: 'enterprise', mathBackground: 'moderate', timeline: '6-months', interests: ['deployment'] },
  // Undecided path
  { experience: 'ml-basics', goal: 'curiosity', timeCommitment: '10-20', targetRole: 'undecided', mathBackground: 'strong', timeline: 'no-rush', interests: ['general', 'rag', 'agents'] },
  // Skip all optional (no prior courses, skip interests)
  { experience: 'none', goal: 'career-switch', timeCommitment: '5-10', targetRole: 'builder', mathBackground: 'minimal', timeline: '6-months', interests: [], skipPrior: true, skipInterests: true },
];

test.describe('DLAI Roadmap Stress Tests', () => {
  test('Welcome screen loads correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('h1')).toContainText('Learning Roadmap');
    await expect(page.locator('button:has-text("Get Started")')).toBeVisible();
  });

  test('Questionnaire has all 8 questions', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Get Started")');

    // Should start at question 1 of 8
    await expect(page.locator('text=Question 1 of 8')).toBeVisible();

    // Navigate through all 8 questions
    for (let i = 1; i <= 8; i++) {
      await expect(page.locator(`text=Question ${i} of 8`)).toBeVisible();

      // Click first option for single select (auto-advances)
      const firstOption = page.locator('button.rounded-xl').first();
      await firstOption.click();

      // For multi-select questions (7 & 8), need to click Continue or Skip
      if (i >= 7) {
        await page.waitForTimeout(500);
        const skipBtn = page.locator('button:has-text("Skip")');
        if (await skipBtn.isVisible()) {
          await skipBtn.click();
        }
      }
    }

    // Should now be on roadmap view
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });
  });

  for (const [idx, testCase] of TEST_CASES.entries()) {
    test(`Test case ${idx + 1}: ${testCase.targetRole} path with ${testCase.experience} experience`, async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Get Started")');

      // Q1: Experience
      await page.click(`button:has-text("${getLabel(testCase.experience, 'experience')}")`);
      await page.waitForTimeout(400);

      // Q2: Goal
      await page.click(`button:has-text("${getLabel(testCase.goal, 'goal')}")`);
      await page.waitForTimeout(400);

      // Q3: Time
      await page.click(`button:has-text("${getLabel(testCase.timeCommitment, 'time')}")`);
      await page.waitForTimeout(400);

      // Q4: Target Role
      await page.click(`button:has-text("${getLabel(testCase.targetRole, 'role')}")`);
      await page.waitForTimeout(400);

      // Q5: Math
      await page.click(`button:has-text("${getLabel(testCase.mathBackground, 'math')}")`);
      await page.waitForTimeout(400);

      // Q6: Timeline
      await page.click(`button:has-text("${getLabel(testCase.timeline, 'timeline')}")`);
      await page.waitForTimeout(400);

      // Q7: Prior Courses (multi-select)
      if (testCase.skipPrior) {
        await page.click('button:has-text("Skip")');
      } else {
        // Select first option and continue
        await page.locator('button.rounded-xl').first().click();
        await page.click('button:has-text("Continue")');
      }
      await page.waitForTimeout(400);

      // Q8: Interests (multi-select)
      if (testCase.skipInterests || testCase.interests.length === 0) {
        await page.click('button:has-text("Skip")');
      } else {
        for (const interest of testCase.interests) {
          const label = getInterestLabel(interest);
          await page.click(`button:has-text("${label}")`);
        }
        await page.click('button:has-text("Generate My Roadmap")');
      }

      // Verify roadmap loaded
      await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

      // Verify pathway name matches selection
      const expectedPathway = testCase.targetRole === 'undecided' ? 'AI Product Engineer' : getPathwayName(testCase.targetRole);
      await expect(page.locator(`text=${expectedPathway}`)).toBeVisible();

      // Verify there are courses
      const courseCards = page.locator('button:has(svg.lucide-circle), button:has(svg.lucide-check-circle)');
      const count = await courseCards.count();
      expect(count).toBeGreaterThan(0);

      // Test PDF export button exists and is clickable
      const exportBtn = page.locator('button:has-text("Export PDF")');
      await expect(exportBtn).toBeVisible();

      // Test Share button
      const shareBtn = page.locator('button:has-text("Share")');
      await expect(shareBtn).toBeVisible();
      await shareBtn.click();
      await expect(page.locator('text=Copied!')).toBeVisible({ timeout: 2000 });

      console.log(`✓ Test case ${idx + 1} passed: ${count} courses generated for ${testCase.targetRole} path`);
    });
  }

  test('Course completion persists in localStorage', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Get Started")');

    // Quick path through questionnaire
    for (let i = 0; i < 6; i++) {
      await page.locator('button.rounded-xl').first().click();
      await page.waitForTimeout(400);
    }
    await page.click('button:has-text("Skip")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Skip")');

    // Wait for roadmap
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    // Phase 1 is expanded by default (index 0)
    // Look for the Circle icon (completion toggle) - first phase courses should be visible
    await page.waitForTimeout(1000); // Let page fully render

    // Click the first course completion circle icon
    const circleButton = page.locator('svg.lucide-circle').first();
    await expect(circleButton).toBeVisible({ timeout: 5000 });
    await circleButton.click();
    await page.waitForTimeout(500);

    // Check localStorage was updated
    const storage = await page.evaluate(() => localStorage.getItem('dlai-roadmap-progress'));
    expect(storage).toBeTruthy();
    const parsed = JSON.parse(storage);
    expect(parsed.completedCourses.length).toBeGreaterThan(0);
  });

  test('Shareable URL loads roadmap directly', async ({ page }) => {
    // Create a shareable URL with test answers
    const testAnswers = {
      experience: 'some-python',
      goal: 'upskill',
      timeCommitment: '5-10',
      targetRole: 'builder',
      mathBackground: 'moderate',
      timeline: '6-months',
      priorCourses: [],
      interests: ['agents', 'rag'],
    };
    const encoded = Buffer.from(JSON.stringify(testAnswers)).toString('base64');

    await page.goto(`${BASE_URL}?pathway=${encoded}`);

    // Should skip directly to roadmap
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=AI Product Engineer')).toBeVisible();
  });
});

// Helper functions
function getLabel(value, type) {
  const labels = {
    experience: {
      'none': 'Complete Beginner',
      'some-python': 'Some Programming',
      'ml-basics': 'ML Fundamentals',
      'professional': 'Working Professional',
    },
    goal: {
      'career-switch': 'Career Transition',
      'upskill': 'Skill Enhancement',
      'research': 'Academic/Research',
      'curiosity': 'Personal Interest',
    },
    time: {
      '2-5': '2-5 hours/week',
      '5-10': '5-10 hours/week',
      '10-20': '10-20 hours/week',
      '20+': '20+ hours/week',
    },
    role: {
      'builder': 'AI Product Engineer',
      'researcher': 'Model Architect',
      'enterprise': 'Enterprise AI Leader',
      'undecided': 'Still Exploring',
    },
    math: {
      'minimal': 'Basic Math Only',
      'moderate': 'Some College Math',
      'strong': 'Strong Foundation',
      'expert': 'Math Background',
    },
    timeline: {
      '3-months': '3 Months',
      '6-months': '6 Months',
      '12-months': '1 Year',
      'no-rush': 'No Rush',
    },
  };
  return labels[type][value];
}

function getInterestLabel(value) {
  const labels = {
    'agents': 'AI Agents & Automation',
    'rag': 'RAG & Knowledge Systems',
    'prompting': 'Prompt Engineering',
    'coding': 'AI-Assisted Coding',
    'deployment': 'MLOps & Deployment',
    'training': 'Fine-tuning & Training',
    'safety': 'AI Safety & Ethics',
    'general': 'General AI/ML Topics',
  };
  return labels[value];
}

function getPathwayName(role) {
  const names = {
    'builder': 'AI Product Engineer',
    'researcher': 'Model Architect',
    'enterprise': 'Enterprise AI Architect',
  };
  return names[role];
}
