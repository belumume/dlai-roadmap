---
title: "Course Data Enrichment & Verification Methodology"
date: 2026-04-05
category: best-practices
module: course-catalog
problem_type: best_practice
component: documentation
severity: high
applies_when:
  - Adding new courses to courses.json
  - Auditing existing course data for accuracy
  - Community feedback raises concerns about course placement or timelines
  - Periodic catalog maintenance (quarterly)
tags:
  - data-quality
  - course-catalog
  - verification
  - curriculum-design
  - community-feedback
---

# Course Data Enrichment & Verification Methodology

## Context

Community feedback from a TF Mentor raised concerns about TensorFlow course placement, timeline accuracy, and category structure. Investigation revealed the concerns exposed real data quality issues: placeholder hours across 16 courses, wrong partner attributions, a deprecated course in enterprise core, and a missing community-consensus course from the researcher pathway. The root cause was reliance on estimated/placeholder data during initial courses.json enrichment rather than verified public sources.

## Guidance

### Hours Verification

Three sources exist for course duration data. All three disagree. The hierarchy:

**Specializations/certificates**: Use Coursera per-course sums. Add up each individual course's listed hours within a specialization. Example: DLS = 129h (five courses summed), not 60h (placeholder).

**Short courses**: Use DLAI marketing page durations. The "1 Hour 30 Minutes" format on deeplearning.ai/short-courses/ pages is the actual content duration.

Do not use: DLAI FAQ marketing estimates ("X months at Y hours/week") are inconsistent across courses. DLAI platform `totalDurationSeconds` metadata is backend data not displayed in UI. Neither is reliable.

When updating hours, verify against the appropriate source. Round-number hours (60, 40, 20) on non-short courses are likely unverified placeholders.

### Partner Verification

Check the DLAI website collaborator badge on the actual course page. TensorFlow courses display DLAI badges, not Google, despite being originally Coursera-hosted. The partner field should reflect the current DLAI platform attribution.

### Deprecation Monitoring

DLAI regularly deprecates courses without removing URLs. Detection methods:

- Forum announcements: search for `deprec @Community-Team`
- Visual indicator: deprecated courses show a pixelated/low-resolution DLAI logo
- Catalog search: deprecated courses don't appear in search but direct URLs still resolve
- Notebook state: deprecated courses often have broken notebooks (expired API keys, retired services)

When a deprecated course is in a pathway, identify the replacement and swap in the same commit.

### Pathway Design

Use community evidence over arbitrary framework preferences:

- DLS to TF Developer Certificate is unanimously recommended by every DLAI Super Mentor across years of forum threads
- PyTorch for Deep Learning (launched Nov 2025) is too new for community consensus. Include both frameworks; force no preference
- Community mentor recommendations (Super Mentors, trust level 4+) carry more weight than marketing positioning

### Prerequisite Chains

Cross-reference prerequisites against community mentor recommendations, not just the course's stated prerequisites. TF Developer Certificate officially lists "basic Python" as prerequisite. Every community mentor says "do DLS first." The prerequisite field should reflect realistic learning dependencies.

## Why This Matters

- A deprecated course (quality-safety-llm-applications, retired Mar 18, 2026) was in enterprise Security Core, directing learners to broken notebooks
- 16 courses at 60h placeholder made timelines show roughly half the actual duration
- Wrong partner attributions misrepresented DLAI's own courses as Google courses
- TF Developer Certificate missing from researcher core contradicted years of unanimous community mentor consensus

## When to Apply

- Adding new courses: verify hours, partner, prerequisites against official sources before committing
- Auditing existing data: prioritize round-number hours as likely placeholders
- Community feedback: treat concerns as potential data quality signals, not just UX feedback
- Quarterly: search forum for deprecation announcements, verify pathway courses are still active
- New DLAI launches: wait for Coursera/DLAI page data before adding, do not estimate

## Examples

**Hours (DLS):**
Before: `estimated_hours: 60` (DLS alone = 4 weeks at 15h/week)
After: `estimated_hours: 129` (Coursera sum, DLS alone = 9 weeks at 15h/week)

**Partner + prerequisite (TF Dev Cert):**
Before: `prerequisites: ["ai-python-for-beginners"]`, `partner: "Google"`, not in any pathway
After: `prerequisites: ["deep-learning-specialization"]`, `partner: "DeepLearning.AI"`, researcher core

**Deprecated course (Enterprise Security Core):**
Before: `quality-safety-llm-applications` (deprecated, broken WhyLabs notebooks)
After: `safe-and-reliable-ai-via-guardrails` (active, verified)

## Related

- PR #8: Hours, partner, prerequisite, and TF Dev Cert core fixes
- PR #10: Catalog sync (deprecated/replaced/new courses)
- DLAI forum deprecation announcements: search `deprec @Community-Team`
