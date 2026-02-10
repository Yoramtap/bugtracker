# V3 — Edit selected deliverable (draft + apply)

## Goal

Allow users to edit the fields of the currently selected deliverable using a draft-and-apply model, with changes reflected immediately in the treemap upon apply.

This slice introduces **controlled mutation** without persistence or creation.

---

## Scope

### In scope

- Editable fields for the selected deliverable:
  - Title
  - Initiative
  - Complexity (1–5)
  - Status (To do / In progress / Done)
  - Progress (0–100 in 10% steps)
- Draft state that updates as the user edits fields
- Apply action that commits the draft to the deliverables list
- Immediate treemap re-render after apply

### Out of scope

- Adding new deliverables
- Deleting deliverables
- Persistence across refresh
- Import / export JSON
- Paste-from-text helper

---

## Data Source

- Uses `deliverables[]` loaded in V1
- Uses `selectedDeliverableId` introduced in V2

---

## UI Affordances

| ID | Affordance | Description |
|----|------------|-------------|
| U5 | Title input | Editable title field for selected deliverable |
| U6 | Initiative input | Editable initiative / group field |
| U7 | Complexity selector | Control to set complexity from 1–5 |
| U8 | Status selector | Control to set status (To do / In progress / Done) |
| U9 | Progress selector | Control to set progress (0–100 in 10% steps) |
| U10 | Apply button | Commits draft changes to the deliverable |

---

## Code Affordances

| ID | Affordance | Responsibility |
|----|------------|----------------|
| N6 | `updateDraft(field, value)` | Update draft state as fields change |
| N7 | `commitDraft()` | Apply draft to deliverables list and re-render treemap |

---

## State

| Store | Description |
|-------|-------------|
| `draftDeliverable` | Draft copy of the selected deliverable |
| `deliverables[]` | Source of truth list updated on apply |

---

## Control Flow

1. User edits any field in the editor panel
2. `updateDraft(field, value)` updates `draftDeliverable`
3. User clicks Apply
4. `commitDraft()`:
   - Updates the matching item in `deliverables[]`
   - Triggers treemap re-render
5. Updated values are visible immediately in the treemap

---

## Validation Rules

- Complexity must be an integer between 1 and 5
- Progress must be one of: 0, 10, 20, …, 100
- Status must be one of the defined values
- Apply is disabled if no deliverable is selected

---

## Acceptance Criteria

V3 is complete when:

- [ ] Editing fields updates draft state without mutating the treemap
- [ ] Clicking Apply updates the treemap immediately
- [ ] Changes to complexity affect tile size
- [ ] Changes to status affect tile color
- [ ] Changes to initiative move the tile to the correct group
- [ ] No changes persist after page refresh
