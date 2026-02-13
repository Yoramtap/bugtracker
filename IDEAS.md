# Ideas Backlog

Purpose: capture ideas now, execute later, with consistent parsing so each item is actionable.

## Status Legend
- `captured`: logged, not started
- `scoping`: requirements and feasibility being clarified
- `ready`: scoped and ready to implement
- `in-progress`: actively being worked
- `done`: implemented and verified

## Idea Intake Template
Use this template when adding a new idea:

```md
## IDEA-XXXX: <short title>
- Status: captured
- Priority: P1 | P2 | P3
- Area: integrations | automation | analytics | infra | ui | other
- Source: <who/where this came from>

### Desired Outcome
<one sentence success state>

### Parsed Scope
1. <deliverable 1>
2. <deliverable 2>
3. <deliverable 3>

### Dependencies
- <systems, credentials, repos, APIs>

### Next Action
- <single next step that moves this forward>

### Definition of Done
- [ ] <verifiable outcome 1>
- [ ] <verifiable outcome 2>
```

---

## IDEA-0001: Slack `/commands` for GitHub Reports
- Status: scoping
- Priority: P2
- Area: integrations
- Source: workspace idea capture (2026-02-13)

### Desired Outcome
Allow users in Slack to run a slash command and receive current GitHub report output.

### Parsed Scope
1. Define slash command contract (`/report`, `/bugtracker-report`, etc.) and expected response payload.
2. Build command handler that authenticates requests and fetches report data from GitHub.
3. Return formatted summary in Slack with links to full report artifacts.

### Dependencies
- Slack app + slash command setup and signing secret
- GitHub API token and report source definition
- Hosting/runtime for command endpoint

### Next Action
- Complete platform install/deploy steps (Slack app install approval + endpoint hosting), then wire `/bugs` Request URL.

### Definition of Done
- [ ] Slash command responds in Slack in under 3 seconds (ack + async reply if needed).
- [ ] Response includes report summary and at least one deep link to GitHub artifact/data.
- [ ] Request signature validation is enabled.

### Progress Log
- 2026-02-13: Confirmed v1 command should be `/bugs`, returning graph URL(s) from public repo.
- 2026-02-13: Prototyped endpoint approach in `bugtracker` repo (then reverted to keep repo static-only for now).
- 2026-02-13: Slack app config started (`Slash Commands` + `chat:write`) but install requires company admin approval.
- 2026-02-13: Deployment path identified (Vercel or similar function host) because GitHub Pages cannot receive slash-command webhooks.

### Current Blockers
- Slack workspace app installation requires org-level approval.
- Endpoint host setup is pending (Vercel project + env var for `SLACK_SIGNING_SECRET`).

### Resume Plan (When Unblocked)
1. Get Slack admin approval to install app in company workspace.
2. Deploy endpoint host and configure `SLACK_SIGNING_SECRET`.
3. Set Slack `/bugs` Request URL to deployed endpoint.
4. Validate commands: `/bugs`, `/bugs composition`, `/bugs uat`, `/bugs all`.

---

## IDEA-0002: Biweekly Report Data Refresh + Cross-Repo Publish
- Status: captured
- Priority: P1
- Area: automation
- Source: workspace idea capture (2026-02-13)

### Desired Outcome
Every 2 weeks, refresh all report data, transfer it to the `bugtracker` repo, and auto-commit/push so reports stay live.

### Parsed Scope
1. Schedule a biweekly automation job for data refresh (this repo).
2. Sync generated data/artifacts into `bugtracker` repo in a deterministic path.
3. Commit and push updates from `bugtracker` with clear commit metadata.
4. Add notification/logging for success/failure of each run.

### Dependencies
- Scheduler/runtime (GitHub Actions or equivalent)
- Access to both repos with push permission
- Stable output contract for generated report files

### Next Action
- Decide where automation should run (GitHub Actions recommended) and which branch/path in `bugtracker` receives updates.

### Definition of Done
- [ ] Job runs every 2 weeks without manual intervention.
- [ ] Updated artifacts are pushed to `bugtracker` automatically.
- [ ] Failed runs emit a visible alert/log entry.

---

## IDEA-0003: Analysis for Last Sprint's Data
- Status: captured
- Priority: P1
- Area: analytics
- Source: workspace idea capture (2026-02-13)

### Desired Outcome
Produce a concise, repeatable analysis of the most recent sprint with clear trends, risks, and recommendations.

### Parsed Scope
1. Define sprint analysis metrics (throughput, cycle time, carry-over, aging, blockers).
2. Generate analysis from latest available sprint dataset.
3. Publish a short narrative summary with charts/tables and action items.

### Dependencies
- Access to latest sprint data source and date boundaries
- Agreed metric definitions and thresholds
- Output destination (markdown report, dashboard, or both)

### Next Action
- Lock metric definitions for “last sprint analysis” so report logic is stable.

### Definition of Done
- [ ] Analysis document is generated for the latest completed sprint.
- [ ] Includes metric deltas vs previous sprint.
- [ ] Includes top 3 recommended actions based on findings.

---

## IDEA-0004: Mobile Agent Messaging (OpenClaw / Codex 5.3)
- Status: captured
- Priority: P2
- Area: automation
- Source: workspace idea capture (2026-02-13)

### Desired Outcome
Enable sending messages from phone to a Codex-based agent so requests can be queued and actioned later.

### Parsed Scope
1. Evaluate candidate runtime path (OpenClaw and/or Codex 5.3-compatible setup).
2. Define message ingress channel from phone (app, SMS bridge, or chat channel).
3. Implement task queue with acknowledgment, retry, and execution logs.
4. Add guardrails for auth, approvals, and high-risk command limits.

### Dependencies
- Hosted or reachable agent runtime
- Secure identity/auth path for phone-originated messages
- Durable queue/store for pending actions

### Next Action
- Select v1 channel (recommended: messaging app webhook) and confirm expected command examples.

### Definition of Done
- [ ] Phone message can create a queued task with confirmation.
- [ ] Task can be actioned later from queue with status updates.
- [ ] Access is restricted to approved sender identity.
