# PRD: PRDs + Stories Hub

## Introduction/Overview
Make `/prds` the single hub for both PRDs and their related build notes. PRD rows should expand to reveal related stories (visible only when expanded), and `/blog` should be removed as a navigational destination. The “Show older PRDs” control should live on `/prds`. PRDs with zero stories should not show an empty placeholder.

## Goals
- Consolidate PRDs and related stories into a single hub at `/prds`.
- Reduce navigation clutter by removing `/blog` as a destination.
- Maintain scanability with a collapsed-by-default list and an “Show older PRDs” control on `/prds`.

## User Stories

### US-001: Move story grouping into `/prds` accordion rows
**Description:** As a reader, I want to see related stories directly under each PRD when expanded so I can connect briefs to shipped work.

**Acceptance Criteria:**
- [ ] Expanded PRD rows render a nested list of related stories (link to `/blog/[slug]`).
- [ ] Stories only appear when the PRD is expanded (collapsed rows show no stories).
- [ ] Stories are ordered newest-first by story date.
- [ ] Typecheck passes.
- [ ] Verify in browser using dev-browser skill.

### US-002: Remove `/blog` as a destination
**Description:** As a reader, I want `/prds` to be the primary hub without a competing blog index.

**Acceptance Criteria:**
- [ ] Primary nav removes or redirects the “Build notes” link.
- [ ] `/blog` is removed from nav (or redirected to `/prds`, per decision) and not treated as a primary hub page.
- [ ] Typecheck passes.

### US-003: Move “Show older PRDs” control to `/prds`
**Description:** As a reader, I want older PRDs collapsed by default on the main hub to keep the page short.

**Acceptance Criteria:**
- [ ] `/prds` shows the newest PRDs by default and a “Show older PRDs” control.
- [ ] Older PRDs expand only when the control is opened.
- [ ] Control is visually distinct and accessible.
- [ ] Typecheck passes.
- [ ] Verify in browser using dev-browser skill.

### US-004: Hide empty story sections
**Description:** As a reader, I don’t want empty “no stories yet” placeholders under PRDs with no related stories.

**Acceptance Criteria:**
- [ ] PRDs with zero related stories show no story section when expanded.
- [ ] Typecheck passes.

## Functional Requirements
1. FR-1: `/prds` must render related stories for each PRD when expanded.
2. FR-2: Related stories must link to the corresponding `/blog/[slug]` pages.
3. FR-3: `/prds` must include a “Show older PRDs” control that collapses older entries.
4. FR-4: `/blog` must not be a primary navigation destination.
5. FR-5: PRDs with zero related stories must not show an empty state.

## Non-Goals (Out of Scope)
- Removing or deleting individual blog post pages (`/blog/[slug]`).
- Changing PRD content files in `tasks/`.
- Changing PRD detail page content layout.

## Design Considerations
- Use the existing editorial list styling from `/blog` for nested stories.
- Ensure the expand/collapse affordance remains clear and calm.
- Keep the “Show older PRDs” control visually distinct.

## Technical Considerations
- PRD-to-story mapping relies on tag metadata in `web/src/app/blog/posts.ts`.
- `getPrdEntries()` is server-side (filesystem reads).
- Story order should use the same date parsing logic used in `/blog`.

## Success Metrics
- Users can navigate PRDs and related stories from a single page.
- Navigation feels simpler with fewer top-level destinations.

## Open Questions
- Should `/blog` redirect to `/prds` or simply be removed from nav while still accessible?
- Should the PRD accordion allow deep-linking to an expanded state?
