# PRD: Blog PRD-to-Story Index

## Introduction/Overview
The blog index should show PRDs as primary entries with nested related stories underneath. This makes PRD-to-story relationships visible at a glance, with the newest PRDs shown first. Relationships should be inferred from post metadata (tags) in `web/src/app/blog/posts.ts`.

## Goals
- Surface clear PRD-to-story relationships on `/blog`.
- Order PRD groups by newest PRD first.
- Use existing post metadata (tags) to infer relationships.

## User Stories

### US-001: Define PRD ↔ story mapping from post metadata
**Description:** As a maintainer, I want PRD-to-story relationships inferred from post metadata so I don’t have to maintain a separate mapping.

**Acceptance Criteria:**
- [ ] A deterministic mapping algorithm is defined using post metadata in `web/src/app/blog/posts.ts` (e.g., tags like `prd:<slug>`).
- [ ] The mapping can associate multiple stories to a single PRD.
- [ ] Stories without PRD tags are handled gracefully (e.g., excluded or grouped under “Unassigned”).
- [ ] Typecheck/lint passes.

### US-002: Render PRD groups with nested stories on `/blog`
**Description:** As a reader, I want to see each PRD with its related stories nested underneath so I can quickly scan what shipped for each PRD.

**Acceptance Criteria:**
- [ ] `/blog` renders a list of PRD groups (PRD title/link) with nested story links below each.
- [ ] PRD groups are ordered newest-first by PRD date.
- [ ] Within each PRD group, stories are ordered newest-first by story date.
- [ ] The layout is responsive and consistent with existing visual style.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-003: Update blog index empty and edge states
**Description:** As a reader, I want clear behavior when PRDs have no linked stories or when posts lack PRD tags.

**Acceptance Criteria:**
- [ ] If a PRD has no related stories, it still renders with a “No related stories yet” note (or is omitted if explicitly chosen).
- [ ] Stories without PRD tags are handled in a defined, documented way.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

## Functional Requirements
1. FR-1: The system must infer PRD-to-story relationships from post metadata (tags) in `web/src/app/blog/posts.ts`.
2. FR-2: The `/blog` index must render PRD groups with nested story links.
3. FR-3: PRD groups must be sorted by PRD date descending (newest first).
4. FR-4: Stories under each PRD must be sorted by story date descending.
5. FR-5: Define and implement handling for stories without PRD tags.

## Non-Goals (Out of Scope)
- Editing or creating PRDs.
- Changes to PRD detail pages outside `/blog`.
- Automated extraction of PRD metadata from external systems.

## Design Considerations
- Maintain the editorial, minimal list aesthetic used on `/blog`.
- Nested lists should be visually clear and accessible.

## Technical Considerations
- Requires a consistent tag format in `posts.ts` (e.g., `prd:<slug>`).
- Requires a PRD metadata source (title, slug, date). This may live in an existing PRD index file or be added to `posts.ts` if absent.

## Success Metrics
- Readers can immediately see which stories belong to which PRD without clicking into individual posts.

## Open Questions
- What tag format should be standardized for PRD linkage (e.g., `prd:<slug>`)?
- Where should PRD metadata (title, slug, date) live if not already available?
- How should stories without PRD tags be displayed (omitted, grouped, or listed separately)?
