// Skills Map tagging: every course names the DeepLearning.AI AI Engineering Skills Map
// skills it teaches, so roadmaps can be built from skills instead of fixed course lists.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const read = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data', file), 'utf8'));
const skills = read('skills.json');
const { courses } = read('courses.json');

const allSkills = skills.pillars.flatMap(p => p.skills.map(s => ({ ...s, pillar: p.id })));
const skillIds = new Set(allSkills.map(s => s.id));

test.describe('Skills Map tagging', () => {
  test('skills.json mirrors the four pillars and 20 numbered skills of DLAI\'s map', () => {
    const mapPillars = skills.pillars.filter(p => p.inSkillsMap);
    expect(mapPillars.map(p => p.skills.length)).toEqual([6, 5, 5, 4]);
    mapPillars.forEach((p, i) => {
      expect(p.skills.map(s => s.number)).toEqual(p.skills.map((_, j) => `${i + 1}.${j + 1}`));
    });
    // Skills outside DLAI's map carry no number, so nothing presents them as part of it
    for (const p of skills.pillars.filter(p => !p.inSkillsMap)) {
      for (const s of p.skills) expect(s.number, s.id).toBeNull();
    }
    expect(skillIds.size).toBe(allSkills.length);
    expect(skills.source.url).toBe('https://www.deeplearning.ai/resources/ai-engineering-skills');
  });

  test('every course is tagged with one to three known skills', () => {
    const problems = [];
    for (const c of courses) {
      const tags = c.skills_map;
      if (!Array.isArray(tags) || tags.length < 1 || tags.length > 3) {
        problems.push(`${c.id}: needs 1-3 skills_map entries`);
        continue;
      }
      if (new Set(tags).size !== tags.length) problems.push(`${c.id}: duplicate skills_map entry`);
      for (const t of tags) if (!skillIds.has(t)) problems.push(`${c.id}: unknown skill "${t}"`);
    }
    expect(problems).toEqual([]);
  });

  test('every skill has a course, unless it is listed as a gap, and no gap is stale', () => {
    const taught = new Set(courses.flatMap(c => c.skills_map));
    const gaps = new Set(Object.keys(skills.gaps));
    for (const g of gaps) expect(skillIds.has(g), `gap ${g} is not a skill`).toBe(true);
    const untaught = allSkills.map(s => s.id).filter(id => !taught.has(id));
    expect(untaught.sort()).toEqual([...gaps].sort());
  });

  test('anchor courses carry the skill they are known for first', () => {
    const primary = Object.fromEntries(courses.map(c => [c.id, c.skills_map[0]]));
    expect(primary['evaluating-and-improving-agentic-applications']).toBe('evals');
    expect(primary['retrieval-augmented-generation-rag']).toBe('grounding-with-data');
    expect(primary['agentic-ai']).toBe('agentic-systems');
    expect(primary['claude-code-a-highly-agentic-coding-assistant']).toBe('directing-workflow');
    expect(primary['deep-learning-specialization']).toBe('ml-foundations');
    expect(primary['ai-python-for-beginners']).toBe('python');
    expect(primary['ai-for-everyone']).toBe('ai-literacy');
  });
});
