const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://learn.deeplearning.ai/', { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });
  
  // Scroll to load everything
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  }
  
  // Get all course links
  const courses = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/courses/"]'))
      .map(a => a.href)
      .filter(h => h.includes('learn.deeplearning.ai/courses/'));
  });
  
  const unique = [...new Set(courses)].sort();
  unique.forEach(url => console.log(url));
  console.log('\nTotal: ' + unique.length);
  
  await browser.close();
})();
