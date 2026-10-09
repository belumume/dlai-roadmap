import posthog from 'posthog-js';

// Only the deployed site reports usage. Local development and automated
// browsers (Playwright, CI) would otherwise send test traffic to the live project.
const enabled = import.meta.env.PROD && !navigator.webdriver;

// Cookieless: PostHog keeps its IDs in memory only, so nothing is written to
// cookies or localStorage and no consent banner is needed. Each page load
// counts as a new anonymous visitor.
export function startPostHog() {
  posthog.init('phc_97p9Je7K9hYvBgK82mG2H2RVpjzwxHqeQPKeLCOgEYG', {
    api_host: 'https://eu.i.posthog.com',
    persistence: 'memory',
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
