# PRD: Sprint Flow Timelapse Visualization (MVP)

## 1. Introduction/Overview

This feature introduces a very basic, experimental timelapse visualizer that replays how work moved across a Jira sprint board over time.

The core problem is that current board tooling shows current state and raw history, but not an easy visual replay of flow. The MVP focuses on making movement visible at an aggregate level so teams can quickly spot where flow slowed or piled up.

This PRD is intentionally minimal to support fast experimentation.

## 2. Goals

- Provide a basic replay of sprint board movement over time.
- Show aggregate flow only (no card details).
- Allow users to scrub and play/pause through sprint history.
- Keep MVP simple enough to iterate quickly with dummy data first.
- Ensure the architecture can later switch from dummy data to Jira-derived data.

### MVP Scope Boundary (Explicit)

- Include: one standalone timelapse page, one dummy sprint dataset, aggregate column counts, play/pause/scrub controls.
- Exclude: Jira fetching, multi-team view, exports, advanced analytics overlays, filters.

## 3. User Stories

### US-001: Load aggregate sprint movement timeline
**Description:** As a user, I want the visualizer to load a sprint movement dataset so that I can replay sprint flow.

**Acceptance Criteria:**
- [ ] The system can load a timeline dataset representing column counts over time.
- [ ] The initial MVP supports a local dummy dataset.
- [ ] The data shape is documented and deterministic for replay.
- [ ] Typecheck/lint passes.

### US-002: Render aggregate board state at a selected timestamp
**Description:** As a user, I want to see aggregate card counts by column at any point in time so that I can inspect flow without card-level noise.

**Acceptance Criteria:**
- [ ] The UI renders configured board columns (for example: To Do, In Progress, Review, QA, Done).
- [ ] Each column displays aggregate count for the selected timestamp.
- [ ] No card titles, keys, or assignee details are shown.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-003: Replay sprint movement as a basic timelapse
**Description:** As a user, I want to play and pause the timeline so that I can watch how work moved during the sprint.

**Acceptance Criteria:**
- [ ] Play starts progression through timestamps in order.
- [ ] Pause freezes playback at the current timestamp.
- [ ] Replay is deterministic across repeated runs of the same dataset.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-004: Scrub timeline manually
**Description:** As a user, I want a scrubber to jump forward and backward so that I can inspect specific moments in the sprint.

**Acceptance Criteria:**
- [ ] A timeline slider allows selecting any available timestamp.
- [ ] Selecting a timestamp updates board state immediately.
- [ ] Scrubbing backward and forward does not break state consistency.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-005: Keep a clear path to Jira-backed data
**Description:** As a developer, I want a defined adapter boundary for data ingestion so that we can move from dummy data to Jira token-based fetch/storage later.

**Acceptance Criteria:**
- [ ] Data loading is implemented behind a simple provider/adapter interface.
- [ ] One implementation uses local dummy data.
- [ ] A placeholder Jira-backed provider contract is defined for later integration.
- [ ] Typecheck/lint passes.

## 4. Functional Requirements

- FR-1: The system must reconstruct and render board aggregate state at time `t` from timeline data.
- FR-2: The system must support play and pause controls for timeline replay.
- FR-3: The system must support manual scrubbing to any recorded timestamp.
- FR-4: The replay must be deterministic for a fixed dataset.
- FR-5: The MVP data model must represent aggregate counts per column per timestamp.
- FR-6: The MVP must support local dummy data as the primary source.
- FR-7: The system must define a data-source boundary that can later support Jira token-based ingestion and persistence.
- FR-8: The UI must show aggregate-only information and must not expose card-level details.
- FR-9: The solution should remain simple to embed in an iframe later (for example, Confluence), but embedding implementation is not required in MVP.

## 5. Non-Goals (Out of Scope)

- Multi-team aggregation or team swimlanes.
- Exporting replay as video or shareable package.
- Heatmaps, dwell-time overlays, or advanced bottleneck analytics.
- Assignee/team/label filtering.
- Rich card metadata rendering (keys, summaries, assignees, labels).

## 6. Design Considerations

- Optimize for clarity over visual complexity.
- Emphasize movement and accumulation at column level.
- Keep controls minimal: play, pause, scrubber.
- Keep layout compatible with eventual iframe embedding constraints (fixed container, responsive sizing).
- Use hybrid transitions for MVP: short linear tween during autoplay, instant snap during manual scrubbing.

## 7. Technical Considerations

- Start with dummy data to unblock UI and interaction experiments quickly.
- Define a clean ingestion interface so Jira-backed fetch/storage can be plugged in later without UI rewrites.
- Sprint timeframe target is one sprint (up to two weeks), but MVP may use a reduced synthetic sample during development.
- Performance target for MVP: smooth and visibly responsive playback in a typical modern desktop browser.
- Transition behavior for MVP:
  - Autoplay: animate state changes with a short fixed-duration transition (for example, ~150ms) to make movement legible.
  - Scrubbing: apply state updates instantly with no transition to keep slider interaction immediate and deterministic.

### Dummy Data Contract (MVP)

```json
{
  "sprint": "Sprint 42",
  "columns": ["To Do", "In Progress", "Review", "QA", "Done"],
  "snapshots": [
    {
      "ts": "2026-02-01T09:00:00Z",
      "counts": {
        "To Do": 40,
        "In Progress": 8,
        "Review": 2,
        "QA": 0,
        "Done": 0
      }
    }
  ]
}
```

Rules:
- Each snapshot must include all configured columns.
- Replay order is the array order of `snapshots`.
- Counts are aggregate-only and must not include card metadata.
- For a stable MVP demo, keep total card count constant across snapshots.

## 8. Success Metrics

- A stakeholder can replay an entire sample sprint timeline end-to-end.
- A stakeholder can scrub to arbitrary points and observe consistent aggregate state updates.
- The prototype is simple enough that developers can iterate quickly on visualization behavior.
- The team can clearly identify at least one visible flow pattern (for example, accumulation in Review or QA) from a replay.

## 9. Open Questions

- What persistence approach should store Jira-derived timeline data (file, local DB, or service) when we move beyond dummy data?

### Resolved Decisions

- Initial column set for first demo: `To Do`, `In Progress`, `In Review`, `QA`, `UAT`, `Done`.
- Timestamp granularity for first Jira-backed dataset: event-level as source of truth.
  - Clarification: "event-level" means each Jira movement is stored with its exact timestamp.
  - We can still render playback using coarser visual steps later without losing source fidelity.

## 10. MVP Definition of Done

- A user can open the timelapse page and load the dummy dataset without backend dependencies.
- The board displays aggregate counts for each configured column at any selected timestamp.
- Play and pause work reliably from any timestamp.
- Scrubbing updates state instantly and deterministically.
- Autoplay shows short transitions; scrubbing does not animate.
- No card-level fields are rendered anywhere in the MVP UI.
