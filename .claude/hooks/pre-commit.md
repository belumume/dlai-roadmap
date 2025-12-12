---
event: PreToolUse
tools: ["Bash"]
---

If the user or Claude is about to run `git commit`:

1. **Check if tests were run this session**
   - If code was modified but tests weren't run, STOP and run tests first
   - Run: `npx playwright test --config=playwright.config.cjs`

2. **Only proceed with commit if tests pass**

This ensures no untested code gets committed.
