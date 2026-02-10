# Backlog-Only Static Site

Single-page backlog chart site using preloaded `snapshot.json`.

## What Is Included

- `index.html`: one page, no menus, no subpages
- `app.js`: interactive chart with team toggles
- `snapshot.json`: aggregate bug counts by team/date/priority

## Local Preview

From this folder:

```bash
python3 -m http.server 8080
```

Open: `http://localhost:8080`

## 2-Week Refresh Workflow (Local-Only Jira Credentials)

1. Refresh in private working repo:

```bash
cd /Users/yoramtap/Documents/AI/codex-loop/web
npm run backlog:refresh-trends
```

2. Copy updated snapshot into this site:

```bash
cp '/Users/yoramtap/Documents/AI/codex-loop/web/src/app/(site)/backlog/snapshot.json' \
  '/Users/yoramtap/Documents/AI/codex-loop/backlog-only-site/snapshot.json'
```

3. Commit and push this backlog-only site repo.

## Safety

- Jira credentials are **not** required in this folder.
- `snapshot.json` should remain aggregate-only (counts/labels/dates).
