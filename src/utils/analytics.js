import posthog from 'posthog-js';

// Only the deployed site reports usage. Local development and automated
// browsers (Playwright, CI) would otherwise send test traffic to the live project.
const enabled = import.meta.env.PROD && !navigator.webdriver;

// Cookieless: PostHog keeps its IDs in memory only, so nothing is written to
// cookies or localStorage and no consent banner is needed. Each page load
// counts as a new anonymous visitor. Surveys are off because a shown survey
// writes its own localStorage keys; the site does not use them.
// main.jsx strips ?pathway= (a share link's answers) before PostHog starts, but
// web vitals and session replay's network timeline report the URL the page was
// opened with. So PostHog masks pathway (and ad click IDs such as gclid) in the
// URLs it records, and replay's network entries are masked separately, because
// that setting doesn't reach them.
const maskPathway = (url) => url?.replace(/([?&]pathway=)[^&#]*/g, '$1<masked>');

export function startPostHog() {
  return posthog.init('phc_97p9Je7K9hYvBgK82mG2H2RVpjzwxHqeQPKeLCOgEYG', {
    api_host: 'https://eu.i.posthog.com',
    persistence: 'memory',
    disable_surveys: true,
    mask_personal_data_properties: true,
    custom_personal_data_properties: ['pathway'],
    session_recording: {
      // A custom mask turns off PostHog's own body scrubbing, so bodies are dropped
      // (the project doesn't record them anyway)
      maskCapturedNetworkRequestFn: (request) => ({
        ...request,
        name: maskPathway(request.name),
        requestBody: undefined,
        responseBody: undefined,
      }),
    },
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export function initAnalytics() {
  if (enabled) startPostHog();
}

export function track(event, properties) {
  if (!enabled) return;
  posthog.capture(event, properties);
}
