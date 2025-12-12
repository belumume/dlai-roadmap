const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://learn.deeplearning.ai/', { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });
  await page.waitForTimeout(3000);
  
  // Close any modals
  try {
    await page.click('button[aria-label="Close modal"]', { timeout: 2000 });
  } catch (e) {}
  
  // Scroll aggressively
  for (let i = 0; i < 100; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
  }
  
  const courses = await page.evaluate(() => {
    return [...new Set(
      Array.from(document.querySelectorAll('a[href*="/courses/"]'))
        .map(a => a.href)
        .filter(h => h.includes('learn.deeplearning.ai/courses/') && !h.includes('/lesson/'))
    )];
  });
  
  courses.sort().forEach(url => {
    const slug = url.split('/courses/')[1]?.replace(/\/$/, '').split('?')[0];
    if (slug) console.log(slug);
  });
  console.log('\nTotal: ' + courses.length);
  
  await browser.close();
})();
