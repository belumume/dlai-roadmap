# DLAI Roadmap - Project Context

> **IMPORTANT FOR FUTURE SESSIONS:**
> - Read the full approved plan at: `~/.claude/plans/delegated-imagining-unicorn.md`
> - Update this CLAUDE.md file after completing work
> - Compare work against the approved plan, not just this summary

## Project Overview
Personalized learning pathway generator for DeepLearning.AI's 100+ courses. Users answer 8 questions and receive a customized, timeline-based study plan they can export as PDF or share via URL.

**Live site:** https://belumume.github.io/dlai-roadmap/
**Repo:** https://github.com/belumume/dlai-roadmap

## Tech Stack
- React + Vite
- Tailwind CSS
- jsPDF for PDF export
- GitHub Pages deployment
- Static JSON data (no backend)

## Key Files
- `src/data/courses.json` - 101 courses + pathway definitions
- `src/utils/pathwayGenerator.js` - Core personalization algorithm
- `src/components/Questionnaire.jsx` - 8-question assessment
- `src/components/CourseSelector.jsx` - Searchable course picker (all 101 courses)
- `src/components/RoadmapView.jsx` - Generated roadmap display
- `src/utils/exportPDF.js` - PDF export + shareable URL functions
- `tests/stress-test.spec.cjs` - Playwright tests (10 tests)

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
- [x] Searchable course selector (all 101 courses)
- [x] Skip button for multi-select questions
- [x] Interest categories match actual course categories
- [x] mathBackground filters elective difficulty
- [x] goal affects specialization preferences
- [x] Learning Deep attribution with profile link
- [x] Playwright test suite (10/10 passing)
- [x] Filter UI on roadmap view (category + difficulty filters)

### NOT COMPLETED
- [ ] **Calendar export (.ics)** - Plan marked this as "Optional"
- [ ] **courses.json enrichment** - Missing fields on all 101 courses:
  - `prerequisites` - not populated
  - `skills_taught` - not populated
  - `career_paths` - not populated
  - `partner` - not populated
- [ ] **Critical path vs optional marking** - Not explicitly shown in UI

## Personalization Factors (all working)
| Factor | How It's Used |
|--------|---------------|
| experience | Skips foundation for professional/ml-basics |
| goal | Affects specialization priority and elective count |
| timeCommitment | Sets weekly pace (3.5-25 hrs) |
| targetRole | Selects pathway (builder/researcher/enterprise) |
| mathBackground | Filters elective difficulty levels |
| timeline | Scales duration estimates |
| priorCourses | Removes completed courses from roadmap |
| interests | Adds matching elective courses |

## Testing
```bash
npm run dev                    # Start dev server
npm run build                  # Production build
npx playwright test --config=playwright.config.cjs  # Run tests
```

## Original Resources (from project start)
Located in: `C:\Users\elzai\PC\Downloads\deeplearning_ai roadmap resources.zip`
- courses.json (82 short + 19 long courses)
- RoadMap Project.docx (Branch Tree proposal)
- first meeting transcript.txt
- LT_Course_Forum Links.xlsx
- Forum discussion HTML files
- DL.AI.png (workflow diagram)

## Attribution
Built by [Learning Deep](https://community.deeplearning.ai/u/learningdeep/) for the DeepLearning.AI community.
