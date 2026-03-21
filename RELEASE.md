# Release Guide

Use this file before any publish, release, or "ship to GitHub" request.

## Rule

Do not use a generic `git push` from this workshop repo as the release step.

This repo is the private workshop. The public release path is:

1. Refresh data here.
2. Export the approved public bundle to the `tracker` repo.
3. Commit and push from the `tracker` repo.
4. Let the Pages workflow deploy from `tracker`.

Before any release, explicitly ask:

- "Do you want me to update the dataset before release: yes or no?"

Do not assume the answer.
Do not run `npm run refresh:full` until that question has been answered.

## Standard Release Flow

From this repo:

```bash
cd /Users/yoramtap/Documents/AI/bugtracker-workshop
## ask first whether the dataset should be refreshed
npm run refresh:full
npm run export:public
```

Then from the public repo:

```bash
cd /Users/yoramtap/Documents/AI/tracker
git status
git add .
git commit -m "Describe the dashboard update"
git push
```

## What Gets Published

Only the approved dashboard bundle and aggregate snapshots should leave this repo.

The export step copies the public-safe files into `tracker`, including:

- `index.html`
- `dashboard-styles.css`
- `dashboard-preload.js`
- `dashboard-view-utils.js`
- `dashboard-data-utils.js`
- `dashboard-chart-core.js`
- `dashboard-charts-backlog.js`
- `dashboard-charts-delivery.js`
- `dashboard-charts-product.js`
- `dashboard-app.js`
- `agentation-local-loader.js`
- `backlog-snapshot.json`
- `contributors-snapshot.json`
- `product-cycle-snapshot.json`
- `pr-cycle-snapshot.json`
- vendored React/Recharts files

## What Not To Do

- Do not publish `.env.*` files.
- Do not push this workshop repo as the release target.
- Do not guess the release flow. Read this file first.

## Verification

Before calling a release done:

1. Confirm the user answered whether the dataset should be updated before release.
2. If the answer was `yes`, run `npm run refresh:full` before export.
3. If the answer was `no`, skip refresh and export the current approved state.
4. Confirm `npm run export:public` completed successfully.
5. Confirm the changes appear in `/Users/yoramtap/Documents/AI/tracker`.
6. Commit and push from `tracker`, not from `bugtracker-workshop`.
7. If needed, check the Pages workflow in `tracker`.
