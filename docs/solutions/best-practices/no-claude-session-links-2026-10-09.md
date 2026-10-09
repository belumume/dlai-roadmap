# No Claude session links on GitHub

**Date:** 2026-10-09

## Problem

Claude Code's default attribution adds links to the Claude session, thread or project that did the work: a `Claude-Session` trailer on every commit, a "Requested by ... project thread" block and a session URL in every PR body, and a footer link in comments. Those links point into the owner's private workspace. The owner forbids them on every surface outside it, public or private. A rule in a prompt or memory is not enough, because the next session's system prompt asks for the links again.

## Fix

`scripts/claude-link-guard.cjs` holds one detector (any URL on the claude.ai domain, a `Claude-Session` trailer line, the hidden attribution marker comment) and runs at five points:

| Layer | Stops |
|-------|-------|
| `.githooks/commit-msg` | a commit message with a link |
| `.githooks/pre-push` | pushing new commits with a link |
| `.claude/settings.json` `PreToolUse` hook | Claude Code calling a GitHub tool, or running `git commit`/`git push`/`gh pr` and similar, with a link (exit 2 blocks the call) |
| `ci.yml` and `claude-link-guard.yml` on PRs and pushes | merging files or commit messages with a link; a direct push with one turns red |
| `claude-link-guard.yml` on PR, issue, comment and review events, nightly and on demand | text already posted: it is edited to remove the link |

`npm install` sets `core.hooksPath` to `.githooks` through the `prepare` script. A repo-level hooks path hides any global `core.hooksPath`, so each `.githooks` script runs its own check and then the global hook of the same name, if there is one. The patterns are assembled at runtime, so the guard and its tests never match themselves and the tree check needs no exclusions.

The Claude Code hook only inspects Bash and PowerShell commands where `git` (with `commit`, `push`, `tag` or `notes`) or `gh` (with `pr`, `issue`, `api`, `release` or `gist`) appears anywhere, plus any `--body-file`/`--file`/`-F` file they name, so searching for the pattern (`grep`) still works.

The GitHub connector Claude uses appends its own footer, with a link, to every comment it posts, after any hook has run. Only the workflow can catch that one, and it does within seconds of the comment appearing.

## Existing history

The owner had the history rewritten on 2026-10-09. `git filter-repo` removed the links from commit messages and files in this repo and 14 others, then every branch and tag was force-pushed with a lease. Commit hashes on `main` from #17 on changed, so rebase or re-clone any older local checkout instead of pushing it.

The old commits stay reachable on GitHub through pull request refs and cached views until GitHub Support purges them. One purge request covering all 15 repos was filed the same day. Never push from a checkout made before the rewrite: it would bring the old history back.
