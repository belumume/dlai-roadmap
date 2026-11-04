// Export and share flows: PDF download, calendar (.ics) contents, shared-link cleanup
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const zlib = require('zlib');

const BASE_URL = 'http://localhost:5173/dlai-roadmap/';

const ANSWERS = {
  experience: 'some-python',
  goal: 'upskill',
  timeCommitment: '5-10',
  targetRole: 'builder',
  mathBackground: 'moderate',
  timeline: '6-months',
  priorCourses: [],
  interests: ['agents'],
};
const SHARE_URL = `${BASE_URL}?pathway=${Buffer.from(JSON.stringify(ANSWERS)).toString('base64')}`;

async function openSharedRoadmap(page) {
  await page.goto(SHARE_URL);
  await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });
}

test.describe('Export and share', () => {
  test('Shared link opens the roadmap and removes the answers from the address bar', async ({ page }) => {
    await openSharedRoadmap(page);
    expect(new URL(page.url()).search).toBe('');
  });

  test('Shared answers leave the address bar before the app renders, so analytics never sees them', async ({ page }) => {
    // PostHog starts before React renders and records location.href in its first
    // pageview and in session replay. Record the URL at the first DOM change in #root.
    await page.addInitScript(() => {
      new MutationObserver((records, observer) => {
        if (records.some((r) => r.target.id === 'root')) {
          window.__urlAtFirstRender = location.href;
          observer.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto(`${SHARE_URL}&utm_source=forum#top`);
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({ timeout: 5000 });

    const atFirstRender = new URL(await page.evaluate(() => window.__urlAtFirstRender));
    expect(atFirstRender.searchParams.has('pathway')).toBe(false);
    // Other parameters and the hash are kept
    expect(atFirstRender.searchParams.get('utm_source')).toBe('forum');
    expect(atFirstRender.hash).toBe('#top');
  });

  test('PDF export downloads a PDF and loads the PDF library only on demand', async ({ page }) => {
    const pdfRequests = [];
    page.on('request', (req) => {
      if (/jspdf/i.test(req.url())) pdfRequests.push(req.url());
    });

    await openSharedRoadmap(page);
    expect(pdfRequests).toEqual([]);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export PDF/ }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^DLAI-Roadmap-.+\.pdf$/);
    const header = fs.readFileSync(await download.path()).subarray(0, 5).toString();
    expect(header).toBe('%PDF-');
    expect(pdfRequests.length).toBeGreaterThan(0);
  });

  test('PDF export tells the user when the PDF library cannot load', async ({ page }) => {
    await openSharedRoadmap(page);
    // Simulates a tab left open across a deploy: the old jsPDF chunk is gone
    await page.route(/jspdf/i, (route) => route.abort());

    // Dismiss inside the handler: the click cannot finish while the alert is open
    const dialogs = [];
    page.on('dialog', async (dialog) => {
      dialogs.push({ type: dialog.type(), message: dialog.message() });
      await dialog.dismiss();
    });
    await page.getByRole('button', { name: /Export PDF/ }).click();
    await expect.poll(() => dialogs.length).toBe(1);
    expect(dialogs[0].type).toBe('alert');
    expect(dialogs[0].message).toContain('reload');
    await expect(page.getByRole('button', { name: /Export PDF/ })).toBeEnabled();
  });

  test.describe('Calendar export west of UTC', () => {
    test.use({ timezoneId: 'America/Los_Angeles' });

    test('starts on the chosen date and writes valid iCalendar', async ({ page }) => {
      await openSharedRoadmap(page);

      page.once('dialog', (dialog) => dialog.accept('2026-11-02'));
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /Calendar/ }).click(),
      ]);

      expect(download.suggestedFilename()).toBe('dlai-builder-pathway.ics');
      const ics = fs.readFileSync(await download.path(), 'utf8');

      // The first course starts on the date the learner typed, not the day before
      const starts = [...ics.matchAll(/DTSTART;VALUE=DATE:(\d{8})/g)].map((m) => m[1]).sort();
      expect(starts[0]).toBe('20261102');

      // Every line ends in CRLF and stays within the 75-octet limit (RFC 5545 3.1)
      const lines = ics.split('\r\n');
      expect(lines.every((l) => !l.includes('\n'))).toBe(true);
      for (const line of lines) {
        expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
      }

      // DTSTAMP is a UTC time close to now
      const stamp = ics.match(/DTSTAMP:(\d{8}T\d{6}Z)/)[1];
      const iso = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(9, 11)}:${stamp.slice(11, 13)}:${stamp.slice(13, 15)}Z`;
      expect(Math.abs(Date.parse(iso) - Date.now())).toBeLessThan(5 * 60 * 1000);
    });
  });

  test('Calendar export rejects an impossible date without downloading', async ({ page }) => {
    await openSharedRoadmap(page);

    const dialogs = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.type());
      if (dialog.type() === 'prompt') await dialog.accept('2026-02-30');
      else await dialog.dismiss();
    });
    let downloaded = false;
    page.on('download', () => { downloaded = true; });

    await page.getByRole('button', { name: /Calendar/ }).click();
    await expect.poll(() => dialogs).toEqual(['prompt', 'alert']);
    expect(downloaded).toBe(false);
  });

  test('Test runs send no analytics events to the live PostHog project', async ({ page }) => {
    const analyticsRequests = [];
    page.on('request', (req) => {
      if (/posthog\.com/.test(new URL(req.url()).hostname)) analyticsRequests.push(req.url());
    });

    await openSharedRoadmap(page);
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: /Calendar/ }).click();
    await page.waitForLoadState('networkidle');

    expect(analyticsRequests).toEqual([]);
  });
});

test.describe('Analytics storage', () => {
  // Mirrors the live project's remote config, which has session replay on
  const REMOTE_CONFIG = {
    analytics: { endpoint: '/i/v0/e/' },
    sessionRecording: {
      endpoint: '/s/',
      recorderVersion: 'v2',
      scriptConfig: { script: 'posthog-recorder' },
      networkPayloadCapture: { recordBody: true, recordHeaders: true },
      consoleLogRecordingEnabled: true,
      version: 1,
    },
    surveys: false,
    heatmaps: false,
  };

  test('PostHog stores nothing in cookies or browser storage, with session replay on', async ({ page, context }) => {
    // Serve PostHog locally so nothing reaches the live project
    await page.route(/posthog\.com/, (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname.endsWith('/config.js')) {
        return route.fulfill({
          contentType: 'application/javascript',
          body: `window._POSTHOG_REMOTE_CONFIG = window._POSTHOG_REMOTE_CONFIG || {};
            window._POSTHOG_REMOTE_CONFIG['phc_97p9Je7K9hYvBgK82mG2H2RVpjzwxHqeQPKeLCOgEYG'] = { config: ${JSON.stringify(REMOTE_CONFIG)}, siteApps: [] };`,
        });
      }
      const script = pathname.match(/\/static\/[^/]+\/([\w-]+\.js)$/);
      if (script) {
        const file = require.resolve(`posthog-js/dist/${script[1]}`);
        return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(file, 'utf8') });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto(BASE_URL);

    await page.evaluate(async () => {
      const { startPostHog } = await import('/dlai-roadmap/src/utils/analytics.js');
      window.__ph = startPostHog();
    });
    // Replay must really be recording, or this test would not cover it
    await expect.poll(() => page.evaluate(() => window.__ph.sessionRecording?.status), { timeout: 10000 }).toBe('active');
    await page.mouse.move(100, 100);
    await page.getByRole('button', { name: /Get Started/ }).click();
    await page.waitForTimeout(2000);

    const cookies = (await context.cookies()).map((c) => c.name);
    const stored = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
    expect(cookies.filter((n) => /ph_|posthog/i.test(n))).toEqual([]);
    expect(stored.filter((k) => /ph_|posthog/i.test(k))).toEqual([]);
  });

  test('PostHog surveys are disabled, so they cannot write their own storage keys', async ({ page }) => {
    const surveyScripts = [];
    await page.route(/posthog\.com/, (route) => {
      const { pathname } = new URL(route.request().url());
      if (/surveys/.test(pathname)) surveyScripts.push(pathname);
      if (pathname.endsWith('/config.js')) {
        return route.fulfill({
          contentType: 'application/javascript',
          body: `window._POSTHOG_REMOTE_CONFIG = window._POSTHOG_REMOTE_CONFIG || {};
            window._POSTHOG_REMOTE_CONFIG['phc_97p9Je7K9hYvBgK82mG2H2RVpjzwxHqeQPKeLCOgEYG'] = { config: ${JSON.stringify({ ...REMOTE_CONFIG, surveys: true })}, siteApps: [] };`,
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto(BASE_URL);
    await page.evaluate(async () => {
      const { startPostHog } = await import('/dlai-roadmap/src/utils/analytics.js');
      window.__ph = startPostHog();
    });
    await page.waitForLoadState('networkidle');

    expect(await page.evaluate(() => window.__ph.config.disable_surveys)).toBe(true);
    expect(surveyScripts).toEqual([]);
  });

  test('PostHog masks share-link answers in any URL it records', async ({ browser }) => {
    // PostHog drops events from headless and automated browsers, so look like a desktop Chrome.
    // main.jsx still sends nothing: analytics only starts in a production build.
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    });
    await context.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined });
      Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
    });
    const page = await context.newPage();
    // Web vitals report the URL the page was opened with, even after main.jsx
    // has removed ?pathway= from the address bar, so PostHog must mask it too.
    const bodies = [];
    await page.route(/posthog\.com/, (route) => {
      const request = route.request();
      const buffer = request.postDataBuffer();
      if (buffer) {
        let text;
        try { text = zlib.gunzipSync(buffer).toString(); } catch { text = buffer.toString(); }
        if (request.url().includes('compression=base64')) {
          text = Buffer.from(decodeURIComponent(text.replace(/^data=/, '')), 'base64').toString();
        }
        bodies.push(text);
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto(BASE_URL);
    const secret = Buffer.from(JSON.stringify(ANSWERS)).toString('base64');
    await page.evaluate(async (pathway) => {
      history.replaceState(null, '', `?utm_source=forum&pathway=${encodeURIComponent(pathway)}`);
      const { startPostHog } = await import('/dlai-roadmap/src/utils/analytics.js');
      const ph = startPostHog();
      ph.capture('mask_check');
    }, secret);
    await expect.poll(() => bodies.some((b) => b.includes('mask_check')), { timeout: 10000 }).toBe(true);

    const sent = bodies.join('\n');
    expect(sent).toContain('pathway=<masked>');
    expect(sent).toContain('utm_source=forum');
    expect(sent).not.toContain(secret.slice(0, 16));
    await context.close();
  });
});
