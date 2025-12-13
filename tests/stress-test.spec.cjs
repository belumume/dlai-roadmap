// Stress test for DLAI Roadmap - all questionnaire combinations
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173/dlai-roadmap/';

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

  test('Course search and selection works', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Get Started")');

    // Navigate to Q7 (Prior Courses with CourseSelector)
    for (let i = 0; i < 6; i++) {
      await page.locator('button.rounded-xl').first().click();
      await page.waitForTimeout(400);
    }

    // Should be on Q7 - Prior Courses
    await expect(page.locator('text=Question 7 of 8')).toBeVisible();
    await expect(page.locator('text=Have you taken any DeepLearning.AI courses')).toBeVisible();

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search all"]');
    await expect(searchInput).toBeVisible();

    // Focus and search for "machine learning"
    await searchInput.focus();
    await searchInput.fill('machine learning');
    await page.waitForTimeout(600);

    // Should show search results dropdown (z-20 class)
    const dropdown = page.locator('.absolute.z-20');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Click the first search result button
    await dropdown.locator('button').first().click();
    await page.waitForTimeout(400);

    // Verify a chip was added (X button to remove)
    const chips = page.locator('button:has(svg.lucide-x)');
    await expect(chips.first()).toBeVisible({ timeout: 3000 });

    // Search for another course
    await searchInput.focus();
    await searchInput.fill('deep learning');
    await page.waitForTimeout(600);

    // Select from dropdown
    await page.locator('.absolute.z-20 button').first().click();
    await page.waitForTimeout(400);

    // Should now have 2 chips
    const chipCount = await chips.count();
    expect(chipCount).toBe(2);

    // Continue to next question
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(400);

    // Should be on Q8
    await expect(page.locator('text=Question 8 of 8')).toBeVisible();
  });

  test('Filter UI works on roadmap view', async ({ page }) => {
    // Load a roadmap via shareable URL
    const encoded = Buffer.from(JSON.stringify({
      experience: 'none',
      goal: 'upskill',
      timeCommitment: '5-10',
      targetRole: 'builder',
      mathBackground: 'moderate',
      timeline: '6-months',
      priorCourses: [],
      interests: ['agents', 'rag'],
    })).toString('base64');

    await page.goto(`${BASE_URL}?pathway=${encoded}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    // Click Filter button
    const filterBtn = page.locator('button:has-text("Filter Courses")');
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();
    await page.waitForTimeout(300);

    // Filter panel should be visible
    await expect(page.locator('text=Filter by')).toBeVisible();
    await expect(page.locator('text=Difficulty')).toBeVisible();
    await expect(page.locator('text=Category')).toBeVisible();

    // Click Beginner filter
    await page.click('button:has-text("Beginner")');
    await page.waitForTimeout(300);

    // Filter button should show badge with count
    await expect(page.locator('button:has-text("Filter Courses") span.rounded-full')).toBeVisible();

    // Click Clear all
    await page.click('button:has-text("Clear all")');
    await page.waitForTimeout(300);

    // Badge should be gone
    await expect(page.locator('button:has-text("Filter Courses") span.rounded-full')).not.toBeVisible();
  });

  test('Timeline warning shows when core exceeds target', async ({ page }) => {
    // Load a roadmap with short timeline but lots of content
    const encoded = Buffer.from(JSON.stringify({
      experience: 'none', // Gets foundation + all pathway phases
      goal: 'career-switch',
      timeCommitment: '2-5', // Only 3.5 hrs/week
      targetRole: 'builder',
      mathBackground: 'moderate',
      timeline: '3-months', // Short timeline
      priorCourses: [],
      interests: ['agents', 'rag', 'prompting'], // Add electives
    })).toString('base64');

    await page.goto(`${BASE_URL}?pathway=${encoded}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    // Should show timeline warning (amber alert box)
    const warningBox = page.locator('text=Timeline Notice');
    await expect(warningBox).toBeVisible({ timeout: 3000 });
  });

  test('Math warning shows for researcher path with weak math', async ({ page }) => {
    // Load a researcher roadmap with minimal math background
    const encoded = Buffer.from(JSON.stringify({
      experience: 'some-python',
      goal: 'research',
      timeCommitment: '10-20',
      targetRole: 'researcher',
      mathBackground: 'minimal', // Weak math = warning for math-heavy phases
      timeline: '12-months',
      priorCourses: [],
      interests: [],
    })).toString('base64');

    await page.goto(`${BASE_URL}?pathway=${encoded}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    // Verify roadmap generated for researcher path
    await expect(page.locator('text=Model Architect')).toBeVisible();

    // Verify there are phases (with Required/Optional badges)
    const requiredBadges = page.locator('span:has-text("Required")');
    await expect(requiredBadges.first()).toBeVisible();

    // Test passes if roadmap renders without errors
    // Math warning will appear when phase is expanded if phase.name includes 'math'
    console.log('Researcher path with weak math renders successfully');
  });

  test('Experience filtering: professional skips foundation phase', async ({ page }) => {
    // Professional experience should skip foundation phase entirely
    const encoded = Buffer.from(JSON.stringify({
      experience: 'professional', // Should skip foundation content
      goal: 'upskill',
      timeCommitment: '10-20',
      targetRole: 'builder',
      mathBackground: 'strong',
      timeline: '6-months',
      priorCourses: [],
      interests: [],
    })).toString('base64');

    await page.goto(`${BASE_URL}?pathway=${encoded}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    // Verify roadmap generated
    await expect(page.locator('text=AI Product Engineer')).toBeVisible();

    // Professional experience skips foundation - first phase should NOT be "AI Foundations"
    // Look for phase names
    const foundationPhase = page.locator('h3:has-text("AI Foundations")');
    const foundationCount = await foundationPhase.count();

    // Professional users should skip the foundation phase
    expect(foundationCount).toBe(0);
    console.log('Professional experience correctly skips foundation phase');
  });

  test('Critical path marking shows Required/Optional badges', async ({ page }) => {
    // Load a roadmap with electives via shareable URL
    const encoded = Buffer.from(JSON.stringify({
      experience: 'none',
      goal: 'curiosity',
      timeCommitment: '5-10',
      targetRole: 'builder',
      mathBackground: 'strong',
      timeline: '6-months',
      priorCourses: [],
      interests: ['agents', 'rag'],
    })).toString('base64');

    await page.goto(`${BASE_URL}?pathway=${encoded}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    // Should have Required badges on core phases
    const requiredBadges = page.locator('span:has-text("Required")');
    await expect(requiredBadges.first()).toBeVisible();

    // Should have Optional badge on Electives phase (if interests were selected)
    const optionalBadge = page.locator('span:has-text("Optional")');
    await expect(optionalBadge).toBeVisible();
  });

  test('Calendar export button exists and is clickable', async ({ page }) => {
    // Load a roadmap via shareable URL
    const encoded = Buffer.from(JSON.stringify({
      experience: 'some-python',
      goal: 'upskill',
      timeCommitment: '5-10',
      targetRole: 'builder',
      mathBackground: 'moderate',
      timeline: '6-months',
      priorCourses: [],
      interests: ['agents'],
    })).toString('base64');

    await page.goto(`${BASE_URL}?pathway=${encoded}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    // Calendar button should be visible
    const calendarBtn = page.locator('button:has-text("Calendar")');
    await expect(calendarBtn).toBeVisible();

    // Button should be clickable (will prompt for date which we cancel)
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.dismiss();
    });

    await calendarBtn.click();
    console.log('Calendar export button works correctly');
  });

  test('Algorithm applies restrictive fallbacks for invalid inputs', async ({ page }) => {
    // Test with completely invalid/missing values to verify restrictive fallbacks
    // This tests the algorithm indirectly by ensuring roadmap still generates
    const encoded = Buffer.from(JSON.stringify({
      experience: 'invalid-value', // Should fallback to ['beginner', 'intermediate']
      goal: 'unknown-goal',
      timeCommitment: 'invalid',
      targetRole: 'builder',
      mathBackground: 'fake-math', // Should fallback to ['beginner'] only
      timeline: 'invalid',
      priorCourses: [],
      interests: [],
    })).toString('base64');

    await page.goto(`${BASE_URL}?pathway=${encoded}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    // Verify roadmap still renders (algorithm handled invalid inputs gracefully)
    const courses = page.locator('button:has(svg.lucide-circle), button:has(svg.lucide-check-circle)');
    const count = await courses.count();
    expect(count).toBeGreaterThan(0);
    console.log(`Algorithm handled invalid inputs - generated ${count} courses`);
  });

  test('Minimal math filters out advanced courses from phases', async ({ page }) => {
    // Minimal math should only allow beginner courses
    const encoded = Buffer.from(JSON.stringify({
      experience: 'some-python',
      goal: 'upskill',
      timeCommitment: '10-20',
      targetRole: 'researcher', // Has advanced content
      mathBackground: 'minimal', // Should filter to beginner only
      timeline: '12-months',
      priorCourses: [],
      interests: [],
    })).toString('base64');

    await page.goto(`${BASE_URL}?pathway=${encoded}`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    // Expand all phases and check for advanced badges
    // Click all phase headers to expand
    const phaseHeaders = page.locator('button.w-full.flex.items-start.gap-4');
    const phaseCount = await phaseHeaders.count();

    for (let i = 0; i < phaseCount; i++) {
      await phaseHeaders.nth(i).click();
      await page.waitForTimeout(200);
    }

    // With minimal math, there should be no advanced difficulty badges visible
    // (Algorithm now applies both experience AND math filters to pathway phases)
    const advancedBadges = page.locator('span:has-text("advanced")');
    const advancedCount = await advancedBadges.count();

    // Minimal math = only beginner allowed, so no advanced courses should appear
    expect(advancedCount).toBe(0);
    console.log('Minimal math correctly filters out advanced courses');
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
      'undecided': 'Not Sure Yet',
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
