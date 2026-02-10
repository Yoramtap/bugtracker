# V2 — Tile selection and details readout

## Goal

Allow users to select a deliverable directly from the treemap and see its details in a read-only details panel.

This slice establishes **interaction and inspection** without allowing edits yet.

---

## Scope

### In scope

- Click a treemap tile to select a deliverable
- Visually indicate which tile is selected
- Display selected deliverable details in a side panel:
  - Title
  - Initiative
  - Complexity
  - Status
  - Progress

### Out of scope

- Editing any fields
- Adding or deleting deliverables
- Persistence beyond initial load
- Import / export JSON
- Paste-from-text helper

---

## Data Source

- Uses `deliverables[]` loaded in V1
- No new external data sources introduced

---

## UI Affordances

| ID | Affordance | Description |
|----|------------|-------------|
| U1 | Treemap tiles | Individual tiles representing deliverables (clickable) |
| U4 | Selected tile highlight | Visual indication of the currently selected deliverable |
| U20 | Details panel | Read-only panel showing fields of the selected deliverable |
| U21 | Empty details state | Message shown when no deliverable is selected |

---

## Code Affordances

| ID | Affordance | Responsibility |
|----|------------|----------------|
| N3 | `selectDeliverable(id)` | Handle tile click and update selection |
| N5 | `hydrateDetailsPanel()` | Populate details panel from selected deliverable |

---

## State

| Store | Description |
|-------|-------------|
| `selectedDeliverableId` | ID of the currently selected deliverable |

---

## Control Flow

1. User clicks a treemap tile
2. `selectDeliverable(id)` sets `selectedDeliverableId`
3. Selected tile highlight updates
4. `hydrateDetailsPanel()` reads deliverable data and renders details
5. If no tile is selected, empty details state is shown

---

## Acceptance Criteria

V2 is complete when:

- [ ] Clicking a treemap tile selects it
- [ ] Only one tile can be selected at a time
- [ ] Selected tile is visually distinguishable
- [ ] Details panel shows correct information for the selected deliverable
- [ ] Details panel shows an empty state when nothing is selected
