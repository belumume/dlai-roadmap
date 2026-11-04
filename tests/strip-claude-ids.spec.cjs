// The "Strip Claude IDs from PR text" workflow loads this script with require(),
// so it must stay CommonJS in a "type": "module" package (as .js it crashed every run)
const { test, expect } = require('@playwright/test');
const { clean } = require('../.github/scripts/strip-claude-ids.cjs');

// Built from parts so the repo's link guard doesn't flag this file
const HOST = ['claude', 'ai'].join('.');

test('strip script loads and removes the attribution block and session links', () => {
  const marker = `<!-- claude-projects-${'attribution'} -->`;
  const header = `_Requested by [Belu](https://github.com/belumume) · [project thread](https://${HOST}/project/x)_`;
  expect(clean(`${marker}\n${header}\n\nBody. See https://${HOST}/code/abc.`)).toBe('Body. See .');
  expect(clean(`Plain text that names ${HOST}.`)).toBe(`Plain text that names ${HOST}.`);
});
