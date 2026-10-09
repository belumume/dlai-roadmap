# Which courses award a certificate

Date: 2026-10-09

The catalog payload on `https://www.deeplearning.ai/courses/` has no certificate field, so the course pages are the source.

On 2026-10-09 the pages of all 131 items in DLAI's catalog payload were checked (the catalog lists items our data doesn't carry, and our data adds 3 Coursera specializations, so the counts differ from `courses.json`):

- All 13 full courses and all 11 specializations say "Earn a certificate with PRO" (a paid DeepLearning.AI Pro membership; auditing for free gives none).
- Two specializations (AI for Medicine, NLP) have pages under `/courses/<slug>-specialization/`, not the `/specializations/<slug>/` path the payload's `marketingSlug` suggests; that path returns a 500, so check the `/courses/` one.
- None of the 107 short-course pages offer one. The "Unlock certificates" banner on short-course pages is a site-wide Pro advert, not a per-course offer; don't count it.
- The three Coursera specializations in our data award a "Shareable certificate" with paid enrollment.

So the rule in the app is `type !== 'short'`. If DLAI starts offering certificates on short courses, re-run the page check and add a real field to `courses.json`.
