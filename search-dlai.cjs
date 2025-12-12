const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.deeplearning.ai/short-courses/', { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });
  
  // Aggressive scrolling to trigger lazy loading
  for (let i = 0; i < 100; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
  }
  
  await page.waitForTimeout(2000);
  
  const courses = await page.evaluate(() => {
    return [...new Set(Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(h => h.includes('deeplearning.ai/short-courses/') && !h.endsWith('/short-courses/'))
    )];
  });
  
  courses.sort().forEach(url => console.log(url));
  console.log(`\nTotal short courses: ${courses.length}`);
  
  await browser.close();
})();
