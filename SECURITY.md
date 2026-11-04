# Security Policy

## Supported Versions

DLAI Roadmap has no releases. Only the live site, built from `main`, is supported:
https://belumume.github.io/dlai-roadmap/

The site is static. It has no backend, accounts or server-side storage. Answers and progress stay
in the learner's browser (`localStorage`) and in share URLs they create themselves.

## Reporting a Vulnerability

Please report privately, not in a public issue:

- Use **Report a vulnerability** on the repository's Security tab, if it is shown, or
- Send a direct message to [Learning Deep](https://community.deeplearning.ai/u/learningdeep/) on the
  DeepLearning.AI Community forum.

Include the affected page or file, steps to reproduce, and the impact you expect. You should get a
first reply within a week. Confirmed issues are fixed on `main`, which redeploys the site once CI
passes, and you will be told when the fix is live.

Dependency advisories are checked with `npm audit` as part of regular maintenance.
