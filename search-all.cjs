const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const allUrls = new Set();
  
  // Check main courses page with filters
  await page.goto('https://www.deeplearning.ai/courses/', { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });
  
  // Scroll a lot
  for (let i = 0; i < 50; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
  }
  
  let links = await page.evaluate(() => 
    Array.from(document.querySelectorAll('a[href*="deeplearning.ai/"]'))
      .map(a => a.href)
      .filter(h => h.includes('/courses/') || h.includes('/short-courses/') || h.includes('/specializations/'))
  );
  links.forEach(l => allUrls.add(l));
  
  console.log('Found URLs:');
  [...allUrls].sort().forEach(url => {
    // Extract just the course slug
    const match = url.match(/\/(courses|short-courses|specializations)\/([^/?]+)/);
    if (match) console.log(match[1] + '/' + match[2]);
  });
  
  console.log('\nTotal unique: ' + allUrls.size);
  
  await browser.close();
})();
