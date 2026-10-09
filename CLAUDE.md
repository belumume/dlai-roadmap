# DLAI Roadmap - Project Context

## Project Overview
Personalized learning pathway generator for DeepLearning.AI's 100+ courses. Users answer 8 questions and receive a customized, timeline-based study plan they can export as PDF or share via URL.

**Live site:** https://belumume.github.io/dlai-roadmap/
**Repo:** https://github.com/belumume/dlai-roadmap

## Tech Stack
- React 19 + Vite 8
- Tailwind CSS 4
- jsPDF for PDF export
- GitHub Pages deployment
- Static JSON data (no backend)

## Key Files
- `src/data/courses.json` - 133 courses + pathway definitions (fully enriched)
- `src/utils/pathwayGenerator.js` - Core personalization algorithm
- `src/components/Questionnaire.jsx` - 8-question assessment
- `src/components/CourseSelector.jsx` - Searchable course picker (all 133 courses)
- `src/utils/categories.js` - Single source of truth for category labels
- `src/components/RoadmapView.jsx` - Generated roadmap display
- `src/utils/exportPDF.js` - PDF export + shareable URL functions
- `src/utils/exportCalendar.js` - iCalendar (.ics) export function
- `src/utils/analytics.js` - PostHog wrapper (`track`); cookieless (`persistence: 'memory'`), sends nothing in dev or automated browsers
- `tests/stress-test.spec.cjs` + `tests/catalog-data.spec.cjs` + `tests/branding-a11y.spec.cjs` + `tests/export-share.spec.cjs` - Playwright tests (43 tests)
- `.github/workflows/ci.yml` - lint, build and Playwright on every PR; `deploy.yml` reuses it so main deploys only when green
- `docs/solutions/` - documented solutions and methodology (data quality, curriculum design)

## Approved Plan Status

### COMPLETED
- [x] 8-question smart questionnaire
- [x] Personalized roadmap generation based on all 8 answers
- [x] 3 pathways: Builder, Researcher, Enterprise (+ Undecided → Builder)
- [x] Timeline view with phases and week ranges
- [x] Milestone markers per phase
- [x] Total hours/duration calculated
- [x] PDF export
- [x] Shareable URLs (auto-load on visit)
- [x] localStorage progress persistence
- [x] Searchable course selector (all 133 courses)
- [x] Skip button for multi-select questions
- [x] Interest categories match actual course categories
- [x] mathBackground filters elective difficulty
- [x] goal affects specialization preferences
- [x] Learning Deep attribution with profile link
- [x] Playwright test suite (43/43 passing), run in CI on every PR and before every deploy
- [x] Filter UI on roadmap view (category + difficulty filters)
- [x] Critical path vs optional marking (Required/Optional badges on phases)
- [x] Timeline warning display when core courses exceed target timeline
- [x] Math warning display for researcher path with weak math background
- [x] Experience-based difficulty filtering (professional/ml-basics skip foundation)
- [x] courses.json enrichment - All 133 courses have:
  - `prerequisites` - course dependency IDs
  - `skills_taught` - 3-4 skills per course
  - `career_paths` - builder/researcher/enterprise relevance
  - `partner` - company partnerships (OpenAI, LangChain, AWS, etc.)
- [x] Calendar export (.ics) - Export roadmap to iCalendar format
- [x] Algorithm robustness improvements:
  - Restrictive fallbacks for invalid inputs
  - Pathway core is never difficulty-filtered; experience and math filters apply to electives only
  - Zero weeks edge case guard for milestones
- [x] Quality-based elective sorting (partner tier + type + hours)
- [x] Dynamic Q8 course counts (was hardcoded)
- [x] Centralized category labels (`src/utils/categories.js`)
- [x] skills_taught displayed on course cards
- [x] NLP Specialization added to Researcher path (31 courses in pathways)
- [x] Pathway audit completed - 3 roles confirmed sufficient
- [x] Responsive design (mobile-first, icon-only buttons on mobile, 44px touch targets)
- [x] Category tabs in CourseSelector (9 categories + Popular/All tabs, scrollable checklist, per @Deminiko feedback)
- [x] Unofficial-status disclaimer (welcome, roadmap, PDF, page title) and WCAG AA text contrast; own visual identity kept on purpose (see `docs/solutions/best-practices/unofficial-branding-and-contrast-2026-10-09.md`)
- [x] Calendar export uses the learner's local date, RFC 5545 line folding and rejects impossible dates (see `docs/solutions/logic-errors/calendar-export-off-by-one-day-2026-10-09.md`)
- [x] jsPDF loaded on demand (initial bundle about 200 kB gzip, was 275 kB); zero `npm audit` findings

### ALL FEATURES COMPLETE - READY FOR LAUNCH

## Personalization Factors (all working)
| Factor | How It's Used |
|--------|---------------|
| experience | Skips foundation for professional/ml-basics |
| goal | Affects specialization priority and elective count |
| timeCommitment | Sets weekly pace (3.5-25 hrs) |
| targetRole | Selects pathway (builder/researcher/enterprise) |
| mathBackground | Narrows elective difficulty (falls back to the experience band when they conflict; never filters pathway phases) |
| timeline | Scales duration estimates |
| priorCourses | Removes completed courses from roadmap |
| interests | Adds matching elective courses |

## Testing
```bash
npm run dev                    # Start dev server
npm run lint                   # ESLint (src and tests)
npm run build                  # Production build
npm test                       # = npx playwright test --config=playwright.config.cjs
```
Node 22.12+ (`.nvmrc` = 24, used by CI).

**IMPORTANT:**
1. Always ADD NEW TESTS for new features before committing
2. Run ALL tests and verify they pass
3. Never commit code without test coverage for the changes

## Attribution
Built by [Learning Deep](https://community.deeplearning.ai/u/learningdeep/) for the DeepLearning.AI community.
