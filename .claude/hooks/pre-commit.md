---
event: PreToolUse
tools: ["Bash"]
---

If the user or Claude is about to run `git commit`:

**STOP and verify BEFORE proceeding:**

1. **Did you ADD NEW TESTS for the new features/changes?**
   - If you modified or added functionality, there MUST be a corresponding test
   - "Existing tests pass" is NOT sufficient - new code needs new tests

2. **Run the full test suite:**
   - `npx playwright test --config=playwright.config.cjs`
   - ALL tests must pass

3. **Only proceed with commit if:**
   - New tests were added for new functionality
   - All tests pass

Do NOT commit if you only ran existing tests without adding coverage for new changes.
