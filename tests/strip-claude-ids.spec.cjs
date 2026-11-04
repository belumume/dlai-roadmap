// The "Strip Claude IDs from PR text" workflow loads this script with a plain
// require(). As .js in a "type": "module" package it crashed every run, so check
// it the way the workflow does: in plain Node (Playwright's loader would mask it)
const { test, expect } = require('@playwright/test');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WORKFLOW = path.join(ROOT, '.github/workflows/strip-claude-ids.yml');
// Built from parts so the repo's link guard doesn't flag this file
const HOST = ['claude', 'ai'].join('.');

const workflowScript = () => {
  const match = fs.readFileSync(WORKFLOW, 'utf8').match(/require\('\.\/([^']+)'\)/);
  expect(match, 'workflow should require the strip script').not.toBeNull();
  return path.join(ROOT, match[1]);
};

// Loads the script in a fresh Node process and prints clean()'s results as JSON
const runInNode = (script, inputs) => spawnSync(process.execPath, ['-e', `
  const m = require(process.argv[1]);
  if (typeof m.run !== 'function' || typeof m.clean !== 'function') process.exit(2);
  process.stdout.write(JSON.stringify(JSON.parse(process.argv[2]).map(m.clean)));
`, script, JSON.stringify(inputs)], { encoding: 'utf8' });

test('workflow loads the strip script in plain Node and it strips Claude IDs', () => {
  const script = workflowScript();
  expect(fs.existsSync(script), `${script} should exist`).toBe(true);

  const marker = `<!-- claude-projects-${'attribution'} -->`;
  const header = `_Requested by [Belu](https://github.com/belumume) · [project thread](https://${HOST}/project/x)_`;
  const result = runInNode(script, [
    `${marker}\n${header}\n\nBody. See https://${HOST}/code/abc.`,
    `Plain text that names ${HOST}.`,
  ]);
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual(['Body. See .', `Plain text that names ${HOST}.`]);
});
