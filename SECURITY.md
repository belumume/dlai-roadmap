# Security Policy

## Supported Versions

DLAI Roadmap has no releases. Only the live site, built from `main`, is supported:
https://belumume.github.io/dlai-roadmap/

The site is static, with no backend or accounts of its own. Progress is saved only in the
learner's browser (`localStorage`), and full answers leave it only inside share URLs the learner
makes. The live site also sends anonymous, cookieless analytics to PostHog (EU): page views,
session recordings and events that include some chosen answers. See the
[Privacy section of the README](README.md#privacy).

## Reporting a Vulnerability

Please report privately, not in a public issue:

- Use **Report a vulnerability** on the repository's Security tab, if it is shown, or
- Send a direct message to [Learning Deep](https://community.deeplearning.ai/u/learningdeep/) on the
  DeepLearning.AI Community forum.

Include the affected page or file, steps to reproduce, and the impact you expect. You should get a
first reply within a week. Confirmed issues are fixed on `main`, which redeploys the site once CI
passes, and you will be told when the fix is live.

Dependency advisories are checked with `npm audit` as part of regular maintenance.
