# Release Guide

Use this file before any publish or live release.

This is the canonical manual release document for this repo.

## Rule

This repo is both the source repo and the Pages deploy repo.

- Do not commit `.env.*` files.
- Do not expose the Jira API token in logs, docs, or commits.
- Commit and deploy from this repo only.

## Standard Release Flow

Use this path when you want the clearest, least surprising release flow.

```bash
cd /Users/yoramtap/Documents/AI/tracker
npm run refresh:full
npm run analyze:brief
npm run build:site
git status
git add .
git commit -m "Describe the dashboard update"
git push
```

Notes:

- `build:site` builds the public Pages artifact into `dist/` for local validation.
- GitHub Pages rebuilds from source on push, so `dist/` is not the release target in git.
- If you intentionally want an export-only republish of the current data, skip `refresh:full` explicitly.

## Optional Helper

If the repo is already clean, you can use the helper instead of the manual sequence:

```bash
cd /Users/yoramtap/Documents/AI/tracker
npm run publish:site -- --refresh yes --message "Refresh dashboard data" --push
```

Use the helper only when:

- you want one command for refresh + analysis + build + commit + push
- the repo has no pre-existing uncommitted changes

If the repo is already dirty, use the manual flow above.

## Verification

Before calling a release done:

1. Confirm `npm run refresh:full` completed successfully.
2. Confirm `npm run analyze:brief` completed successfully and `reports/latest-analysis.md` exists.
3. Confirm `npm run build:site` completed successfully.
4. Confirm the repo changes look correct in `git status`.
5. Push `main`.
6. Confirm the latest Pages workflow completed successfully.
7. Confirm [the live dashboard](https://yoramtap.github.io/tracker/) returns HTTP 200.
