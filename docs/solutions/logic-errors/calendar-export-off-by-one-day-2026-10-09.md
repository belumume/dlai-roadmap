---
title: "Calendar Export Started One Day Early West of UTC"
date: 2026-10-09
category: logic-errors
module: calendar-export
problem_type: logic_error
component: utility
symptoms:
  - "Learners in the Americas typed 2026-11-02 as their start date and the .ics file started on 2026-11-01"
  - "Impossible dates such as 2026-02-30 were accepted and silently rolled into March"
  - "DTSTAMP carried local time with a Z (UTC) suffix"
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags:
  - icalendar
  - timezones
  - date-parsing
---

# Calendar Export Started One Day Early West of UTC

## Problem
`exportAndDownloadCalendar` parsed the prompt answer with `new Date('YYYY-MM-DD')`. JavaScript parses a date-only ISO string as **UTC midnight**, while `formatICSDate` reads the date back with local getters (`getDate()`). Anywhere west of UTC, UTC midnight is still the previous local day, so every event in the file moved one day earlier.

The same file also wrote `DTSTAMP` from local hours with a `Z` suffix (wrong by the UTC offset), did not fold lines over 75 octets (RFC 5545 section 3.1), and accepted `2026-02-30` because `Date` rolls overflow days into the next month.

## Fix
- `parseLocalDate` matches `^\d{4}-\d{2}-\d{2}$`, builds `new Date(year, month - 1, day)` in local time, and rejects dates that roll over.
- The prompt default is today's local date, not `toISOString()` (which is UTC and can be tomorrow or yesterday).
- `DTSTAMP` comes from `toISOString()`, which is genuinely UTC.
- Every content line is folded to 75 octets, counting UTF-8 bytes (the milestone emoji are 4 bytes).

## Rule
Never pass a bare `YYYY-MM-DD` to `new Date()` when the value is a calendar date the user picked; parse the parts and build a local date. Use local getters for all-day `VALUE=DATE` fields and UTC for `...Z` timestamps.

## Test
`tests/export-share.spec.cjs` runs the export with `timezoneId: 'America/Los_Angeles'`, checks the first `DTSTART` equals the typed date, every line is at most 75 octets, `DTSTAMP` is within five minutes of now in UTC, and `2026-02-30` produces an alert and no download. On the pre-fix code the first check received `20261101`.
