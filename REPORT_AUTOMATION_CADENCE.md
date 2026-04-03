# Report Refresh + Publish Cadence

## Purpose

Define when the recurring refresh/publish workflow should run from this single repo.

Only the Jira API token stays private.

## Cadence

- Trigger moment: Friday at 09:00 local time
- Recurrence: every week

## Workflow Reference

The actual command sequence lives in [RELEASE.md](/Users/yoramtap/Documents/AI/tracker/RELEASE.md).

Automation should mirror that release flow rather than maintain its own separate checklist.

## Security Rationale

- Jira credentials stay only in `.env.backlog`, `.env.local`, or GitHub secrets.
- `.env.*` files are ignored and must never be committed.
- The repo content and published snapshots can be public.
- The only thing treated as secret is the API token.

## Automation Requirements

Any automation should:

1. Run on the weekly Friday 09:00 cadence.
2. Stop immediately on refresh failure.
3. Stop immediately on analysis failure.
4. Commit only when there are actual file changes.
5. Push to GitHub automatically.
6. Verify the latest Pages deploy succeeded.
7. Verify the live site responds.

## Current Practical Setup

- GitHub Pages deploys from this repo on push.
- Local refresh can stay in Codex automation or move to GitHub Actions later if you add Jira secrets there.
- Build, commit, and deploy all happen from this repo.
