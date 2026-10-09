import posthog from 'posthog-js';

// Only the deployed site reports usage. Local development and automated
// browsers (Playwright, CI) would otherwise send test traffic to the live project.
const enabled = import.meta.env.PROD && !navigator.webdriver;

export function initAnalytics() {
  if (!enabled) return;
  posthog.init('phc_97p9Je7K9hYvBgK82mG2H2RVpjzwxHqeQPKeLCOgEYG', {
    api_host: 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export function track(event, properties) {
  if (!enabled) return;
  posthog.capture(event, properties);
}
