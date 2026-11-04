---
title: "Math gates only math-heavy electives; electives rank by fit, not vendor"
date: 2026-11-04
category: logic-errors
module: pathway-generator
problem_type: logic_error
component: utility
symptoms:
  - "Learners with basic math got only beginner electives, even agent and RAG courses that need no math"
  - "Electives were ordered by a hardcoded partner ranking rather than fit"
  - "Learners who already code started with AI Python for Beginners and two non-technical overviews"
root_cause: logic_error
severity: medium
tags:
  - personalization
  - electives
---

# Math gates only math-heavy electives; electives rank by fit, not vendor

## What was wrong

- **Math filter applied to every elective.** The catalog has only beginner and intermediate courses (no "advanced"), so "Basic math only" limited all electives to beginner, including agent, RAG and coding courses that need Python, not math. A coder with rusty math lost every intermediate agent course.
- **Electives were sorted by a hardcoded partner tier** (DeepLearning.AI 100, Google/OpenAI/Meta 80, Anthropic/AWS 70, everyone else 30) plus hours. That is an opinion about companies, not about fit for the learner, and longer courses won ties and ate the time budget.
- **Coders started with non-technical overviews.** "Some programming" learners on Builder or Researcher got AI for Everyone, Generative AI for Everyone and AI Python for Beginners first.

## Fix

- Math applies only to courses in the `training` category (fine-tuning, pretraining, model internals). Other electives use the experience band alone.
- Electives rank by how many of the learner's interests a course covers, then by the course type the goal favours (depth for career-switch and research, short courses for upskill). Ties keep catalog order.
- `some-python` skips AI Python for Beginners; outside the Enterprise track it also skips the two "for Everyone" overviews.

## Guard rails

`tests/roadmap-fit.spec.cjs` checks each rule; most of its tests fail against the old generator, and the training-electives test guards the rule that stayed. It also checks that a foundation course skipped for a coder never comes back as an elective (AI Python for Beginners is tagged `coding`, so the elective filter has to exclude skipped trunk courses too).

## Lesson

A filter keyed to a value the data never contains ("advanced") silently changes meaning: the remaining band becomes the whole rule. When adding a difficulty filter, check the actual value distribution in courses.json first.
