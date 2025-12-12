const { chromium } = require('playwright');

const courses = [
  'fast-prototyping-of-genai-apps-with-streamlit',
  'retrieval-augmented-generation-rag', 
  'generative-ai-for-everyone',
  'ai-for-everyone',
  'machine-learning-in-production',
  'generative-ai-with-llms'
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  for (const slug of courses) {
    const url = 'https://www.deeplearning.ai/courses/' + slug;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Find all bit.ly links (enroll buttons)
      const bitlyLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="bit.ly"]'))
          .map(a => ({ text: a.innerText.trim().substring(0, 30), href: a.href }));
      });
      
      console.log('\n' + slug + ':');
      bitlyLinks.forEach(l => console.log('  [' + l.text + '] ' + l.href));
    } catch (e) {
      console.log(slug + ': ERROR');
    }
  }
  
  await browser.close();
})();
