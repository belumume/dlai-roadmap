---
title: "Share-Link Answers Were Sent to PostHog"
date: 2026-11-04
category: logic-errors
module: analytics
problem_type: logic_error
component: utility
symptoms:
  - "Opening a share link sent its full ?pathway= answers (base64 JSON, including prior courses and interests) to PostHog in $current_url"
  - "The address bar was cleaned, but only after React's first effect"
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags:
  - privacy
  - analytics
  - posthog
  - share-url
---

# Share-Link Answers Were Sent to PostHog

## Problem
A share link carries every answer in `?pathway=` (base64 JSON). `main.jsx` started PostHog before React rendered, and `App` only removed the parameter in a `useEffect`. PostHog captured its first `$pageview`, `$pageleave` and `$web_vitals` with the full URL in `$current_url`. A production build opened with a share link sent the answers in all three event batches (checked 2026-11-04 with every PostHog request answered locally, so nothing reached the live project).

## Fix
1. `takePathwayFromURL()` (`src/utils/exportPDF.js`) reads the answers and removes only `pathway` from the URL, keeping other parameters and the hash. `main.jsx` calls it before `initAnalytics()` and passes the answers to `App` as a prop.
2. Stripping is not enough on its own. PostHog's web vitals report the URL the page was **opened** with (the navigation entry), not the current one. So `startPostHog()` also sets `mask_personal_data_properties: true` and `custom_personal_data_properties: ['pathway']`. PostHog then replaces the value with `<masked>` in every URL it records, including web vitals, heatmaps and session replay. The built-in list adds ad click IDs (gclid, fbclid and similar) but leaves `utm_*` alone, so traffic attribution is unchanged.

## Testing PostHog payloads
PostHog silently drops events from automated browsers. A test that wants to see real payloads needs a desktop Chrome user agent, and must hide `navigator.webdriver` and `navigator.userAgentData` (whose brands say "HeadlessChrome"). `tests/export-share.spec.cjs` does this in its own context and answers every PostHog request locally. Request bodies are gzip, or base64 when the URL says `compression=base64`.

Two tests cover the fix. One checks the URL is already clean at the first DOM change in `#root`. The other captures an event from a URL with `?pathway=` and checks the payload carries `pathway=<masked>` and keeps `utm_source`. Both fail on the old code.
