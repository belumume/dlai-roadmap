const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Go to the learning platform
  await page.goto('https://learn.deeplearning.ai/courses');
  await page.waitForTimeout(3000);
  
  // Get all course links
  const courses = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/courses/"]');
    return Array.from(links).map(a => ({
      title: a.textContent.trim(),
      url: a.href
    })).filter(c => c.title && c.url.includes('/courses/'));
  });
  
  console.log(JSON.stringify(courses, null, 2));
  console.log(`\nTotal: ${courses.length} courses`);
  
  await browser.close();
})();
