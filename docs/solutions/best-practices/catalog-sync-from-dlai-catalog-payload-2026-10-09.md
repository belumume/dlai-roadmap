---
title: "Catalog Sync from the DLAI Catalog Payload"
date: 2026-10-09
category: best-practices
module: course-catalog
problem_type: best_practice
component: documentation
severity: high
applies_when:
  - Running the periodic catalog sync
  - Adding or retiring courses in courses.json
  - Changing difficulty labels that the pathway generator filters on
tags:
  - data-quality
  - course-catalog
  - catalog-sync
  - difficulty-filtering
---

# Catalog Sync from the DLAI Catalog Payload

## Context

Six months after the April sync, a full refresh found 3 retired courses, 15 new ones, Data Engineering moved onto the DLAI platform, and widespread drift in the fields the generator depends on: 88 courses still carried the 2-hour placeholder, 53 difficulty labels disagreed with DLAI, 19 partner attributions were wrong (plus 5 "Google" badges that DLAI now shows as "Google Cloud"), and 9 instructors were wrong. None of the old difficulty values had come from DLAI, even though the April math-filter note assumed they had.

## Guidance

### Use the catalog payload, not the visible listing

`https://www.deeplearning.ai/courses/` renders only part of the catalog in HTML, but its Next.js flight payload (`self.__next_f.push(...)` chunks) embeds every listed item as an object starting with `{"courseId":`. Each one carries `slug`, `name`, `type` (`short_course` / `course` / `specialization`), `releasedAt`, `maintenanceMode`, `wpData.courseLevel`, `wpData.coursePartner[]` and `totalDurationSeconds`. Decode the chunks and parse each object; on 2026-10-09 this gave 131 items, matching the 131 course and specialization URLs in `https://www.deeplearning.ai/sitemap.xml`.

From the cloud container, deeplearning.ai is blocked by the egress proxy; fetch it through Firecrawl (`rawHtml` format).

### Field sources

- **Hours (short courses):** `totalDurationSeconds / 3600`, rounded to one decimal. For every page checked, it matched the duration in the course page header (e.g. 4561s and "1h16m").
- **Hours (full courses):** keep the verified Coursera sums from April (RAG 31h, Generative AI with LLMs 16h). These are the six full courses also on Coursera: RAG, Fast Prototyping with Streamlit, Generative AI with LLMs, AI for Everyone, Generative AI for Everyone and Machine Learning in Production. `totalDurationSeconds` can be lower than Coursera's effort estimate. Other full courses use `totalDurationSeconds`.
- **Hours (specializations):** keep the Coursera per-course sums from the April methodology; don't use `totalDurationSeconds`.
- **Difficulty:** `wpData.courseLevel`. The catalog splits roughly evenly between Beginner and Intermediate, so the label carries real information.
- **Partner:** the first `coursePartner` title, unless ours already matches one of the listed partners. Where we have "Google" and DLAI shows "Google Cloud", use "Google Cloud". Two badges name a product, not the partner organization (Gemini CLI, Haystack), so those keep the organization (Google, deepset).
- **Title:** update only when the text actually differs. Skip case and punctuation differences, because DLAI's own casing is inconsistent ("Safe and reliable AI via guardrails").

### Retirement needs two signals

A course listed in the payload is not automatically live:

- Retired courses that left the payload show a notice on their page ("This course has been retired").
- `quality-safety-llm-applications` is still in the payload and its page shows no notice, but DLAI's forum announced its deprecation on Mar 18, 2026 and nothing reverses that. Keep it out.
- `intro-to-federated-learning-c2` (Federated Fine-tuning of LLMs with Private Data) was dropped in April as "delisted". It is back in the payload and has no deprecation announcement, so it is back in the data as `federated-fine-tuning-llms-private-data`.

Search the forum for `deprec @Community-Team` before re-adding anything that was removed earlier.

### Check generator impact before syncing labels

Syncing difficulty to DLAI's labels moved the catalog from 108 intermediate / 8 beginner / 5 advanced to 69 intermediate / 64 beginner / 0 advanced. Many pathway core courses became Beginner.

The experience filter (ml-basics and professional skip Beginner) used to apply to pathway phases as well. With the real labels it would have:

- emptied Builder Prompting Fundamentals and Enterprise Security Core and Privacy Tech;
- dropped both math/ML specializations from Researcher Math & ML Foundations;
- cut experienced builders from 11 to 7 core courses.

This is the same failure as the April math-filter bug: a label that describes entry level was being used to hide required core courses. The generator now applies difficulty filters only to electives. Experience still skips the Foundation trunk, and learners remove courses they have already done through prior courses.

A related gap was exposed too: for ml-basics or professional learners with minimal math, the math band (beginner) and the experience band (intermediate+) don't overlap, so they used to get no electives at all. Electives now fall back to the experience band when the two bands don't overlap.

Before committing a label sync, simulate every role x experience x math combination and compare core course counts with the previous data.

### Partners also imply instructors and skills

When a partner attribution changes, the old record's instructor and skills were usually guessed from the wrong partner too (for example "Prefect" skills on an Astronomer/Airflow course). Re-check the instructor against the page's first listed instructor, and re-check the skills against the "What you'll learn" bullets.

### Coursera-only specializations

TensorFlow: Advanced Techniques, GANs, and TensorFlow: Data and Deployment are not in the DLAI catalog. On 2026-10-09 all three were still open for enrollment on Coursera, so they stay. Generative AI for Software Development is 34h by Coursera per-course sums (9 + 13 + 12), not 15h.

## Why This Matters

- Placeholder hours made every short course look like 2h; real short-course durations range from 0.5h to 3.2h, and full courses that were stuck at 2h run 10 to 13h.
- A blind difficulty sync would have silently removed required courses from experienced learners' roadmaps.

## Related

- `course-data-enrichment-verification-methodology-2026-04-05.md`
- `../logic-errors/math-filter-removing-pathway-courses-2026-04-06.md`
- `tests/catalog-data.spec.cjs` (data integrity and phase-preservation tests)
