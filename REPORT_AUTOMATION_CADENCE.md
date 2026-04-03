# Report Refresh + Publish Cadence

## Purpose

Run refresh, analysis, commit, and Pages deploy from this single repo.

Only the Jira API token stays private.

## Cadence

- Trigger moment: Friday at 09:00 local time
- Recurrence: every week

## End-to-End Flow

1. Run `npm run refresh:full`
2. Run `npm run analyze:brief`
3. Optionally run `npm run build:site` for local validation
4. Commit and push this repo
5. Verify the latest Pages deploy succeeded
6. Verify [the live dashboard](https://yoramtap.github.io/tracker/) returns HTTP 200

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
