# Which courses award a certificate

Date: 2026-10-09

The catalog payload on `https://www.deeplearning.ai/courses/` has no certificate field, so the course pages are the source.

On 2026-10-09 all 131 catalog pages were checked:

- All 13 full courses and 9 of 11 specializations say "Earn a certificate with PRO" (a paid DeepLearning.AI Pro membership; auditing for free gives none).
- The other two specializations (AI for Medicine, NLP) live under `/courses/<slug>-specialization/` and describe a certificate for paid enrollment in their own words.
- None of the 107 short-course pages offer one. The "Unlock certificates" banner on short-course pages is a site-wide Pro advert, not a per-course offer; don't count it.
- The three Coursera specializations in our data award a "Shareable certificate" with paid enrollment.

So the rule in the app is `type !== 'short'`. If DLAI starts offering certificates on short courses, re-run the page check and add a real field to `courses.json`.
