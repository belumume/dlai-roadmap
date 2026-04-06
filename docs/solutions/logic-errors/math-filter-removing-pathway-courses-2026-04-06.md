---
title: "Math Difficulty Filter Removing All Pathway Courses for Minimal-Math Users"
date: 2026-04-06
category: logic-errors
module: pathway-generator
problem_type: logic_error
component: service_object
symptoms:
  - "Users with 'minimal' math background receive near-empty roadmaps (2-4 foundation courses only)"
  - "Different questionnaire inputs produce identical 2-course output for affected users"
  - "All builder and researcher pathway courses filtered out (96% are intermediate difficulty)"
  - "Community user reported identical results regardless of input choices (Jan 2026)"
root_cause: logic_error
resolution_type: code_fix
severity: critical
tags:
  - math-filter
  - pathway-generator
  - difficulty-filtering
  - personalization
  - questionnaire
  - empty-roadmap
---

# Math Difficulty Filter Removing All Pathway Courses for Minimal-Math Users

## Problem

The math difficulty filter in `pathwayGenerator.js` was applied to both pathway (core) courses and electives, but 96% of pathway courses are intermediate difficulty. Users selecting `mathBackground: 'minimal'` got zero pathway courses from builder or researcher roles, producing a near-empty roadmap with only foundation courses.

## Symptoms

- RichardNaimy (Jan 9, 2026): "I tried your tool twice with different inputs, but it returned the same two course recommendations both times: 1. AI Python for Beginners 2. Generative AI with LLMs"
- Selecting first option on all 8 questions (experience: none, math: minimal, role: builder) produced 4 courses / 29 hours / 1 phase instead of 14 courses / 49 hours / 5 phases
- Enterprise pathway slightly less affected (1 of 5 courses survived: safe-and-reliable-ai-via-guardrails, the only beginner-difficulty pathway course)
- The tool appeared non-personalized: different role selections, goals, and interests all produced the same truncated output when math was minimal

## What Didn't Work

No prior failed fixes. The bug was discovered by tracing the algorithm for a community user's likely inputs:

1. Read `pathwayGenerator.js` to understand the filter chain on line 90
2. Dispatched agent to audit difficulty levels of all 27 pathway courses across 3 roles: found 24 intermediate, 2 advanced, 1 beginner
3. Combined `allowedDifficulties` for minimal math (`['beginner']`) with the pathway filter, confirmed every builder/researcher course excluded
4. Researched Coursera/Udemy behavior: neither hides courses by level, both show with advisory warnings
5. Confirmed the experience filter (`allowedByExperience`) already handles readiness correctly: `'none'` allows beginner+intermediate

## Solution

Removed the math difficulty filter from pathway phase courses (line 90), keeping only the experience filter:

```javascript
// BEFORE (pathwayGenerator.js:90)
.filter(course => allowedByExperience.includes(course.difficulty) && allowedDifficulties.includes(course.difficulty));

// AFTER (pathwayGenerator.js:90)
.filter(course => allowedByExperience.includes(course.difficulty));
```

Math filter still applies to elective courses (lines 125-127):

```javascript
// Electives — math filter retained here
if (!allowedDifficulties.includes(c.difficulty)) return false;
if (!allowedByExperience.includes(c.difficulty)) return false;
```

The existing `mathWarning` on researcher's Math & ML Foundations phase (lines 94-96) is unchanged and still provides advisory guidance where math actually matters.

Updated Playwright test from asserting 0 advanced courses (validating broken behavior) to asserting 3+ phases for minimal-math builder (validating correct behavior). 20/20 tests pass.

## Why This Works

DLAI's difficulty labels (beginner/intermediate/advanced) describe overall prerequisite level (coding experience, prior coursework), not mathematical difficulty. "Intermediate" on chatgpt-prompt-engineering means "assumes some coding familiarity," not "requires calculus."

The experience filter already correctly gates readiness: `experience='none'` allows `['beginner', 'intermediate']`, letting beginners stretch into intermediate courses. The math filter was a second, redundant gate applying a math-specific interpretation to a label that carries no math-specific meaning.

Removing the math filter from pathway phases lets the experience filter do its intended job. The `mathWarning` provides advisory guidance where math genuinely matters (researcher's Math & ML Foundations phase). Elective filtering by math remains: optional courses should match the learner's comfort zone, but core pathway courses shouldn't be hidden.

## Prevention

1. **Verify filter semantics match field semantics.** When a filter uses a field's values, confirm the field actually measures what the filter assumes. Difficulty != math difficulty. A code comment at the filter site should document what each filter dimension measures.

2. **Test the cross-product of critical inputs.** The bug only manifested when `minimal` math intersected with roles whose courses are predominantly intermediate. Test combinatorial inputs (experience x mathBackground x targetRole), not just individual dimensions.

3. **Treat zero-result assertions as suspicious.** The prior test asserted 0 advanced courses as correct behavior for minimal math. Any test asserting a feature produces zero output should be reviewed: it may be validating a broken state rather than an intended one.

4. **Trace the algorithm with user-reported inputs.** When users report "not personalized" behavior, trace the generator with plausible input combinations before assuming UI issues. Richard's report could have been caught earlier with algorithm tracing.

## Related Issues

- PR #11: Fix math filter dead-ending roadmap for minimal-math users
- PR #8: Hours corrections, partner field fixes, TF Dev Cert pathway additions (same session)
- `docs/solutions/best-practices/course-data-enrichment-verification-methodology-2026-04-05.md` — related data quality methodology for course catalog
- Community report: RichardNaimy, Jan 9, 2026 (DLAI forum Introductions thread)
- Community escalation: Deepti_Prasad (TF Mentor), Apr 5, 2026 (DLAI forum DM)
