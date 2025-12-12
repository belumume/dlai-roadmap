const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://learn.deeplearning.ai/', { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });
  await page.waitForTimeout(3000);
  
  // Close modal if exists
  try {
    await page.click('button[aria-label="Close modal"]', { timeout: 2000 });
  } catch (e) {}
  
  // Get ALL links on the page
  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(h => h.includes('learn.deeplearning.ai') && 
        (h.includes('/courses/') || h.includes('/specializations/') || h.includes('/certificates/')));
  });
  
  const unique = [...new Set(allLinks)].sort();
  unique.forEach(url => console.log(url));
  console.log('\nTotal links: ' + unique.length);
  
  await browser.close();
})();
