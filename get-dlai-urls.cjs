const { chromium } = require('playwright');

const coursesToCheck = [
  'fast-prototyping-of-genai-apps-with-streamlit',
  'retrieval-augmented-generation-rag',
  'generative-ai-for-everyone',
  'ai-for-everyone',
  'machine-learning-in-production',
  'generative-ai-with-llms',
  'deep-learning-specialization',
  'machine-learning-specialization'
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  for (const slug of coursesToCheck) {
    const url = 'https://www.deeplearning.ai/courses/' + slug;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Find learn.deeplearning.ai links
      const learnLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="learn.deeplearning.ai"]'))
          .map(a => a.href);
      });
      
      if (learnLinks.length > 0) {
        console.log(slug + ':');
        [...new Set(learnLinks)].forEach(l => console.log('  ' + l));
      } else {
        console.log(slug + ': NO learn.deeplearning.ai link found');
      }
    } catch (e) {
      console.log(slug + ': ERROR - ' + e.message.substring(0, 50));
    }
  }
  
  await browser.close();
})();
