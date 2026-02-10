# V4 — Add and delete deliverables

## Goal

Allow users to create new deliverables and delete existing ones directly from the UI, with immediate treemap updates.

This slice enables basic list management without persistence.

---

## Scope

### In scope

- Add a new deliverable from the UI
  - Creates a deliverable with defaults
  - Newly created deliverable becomes selected
  - Editor panel is populated with the new deliverable (so user can adjust fields)
- Delete the currently selected deliverable
  - Removes it from the deliverables list
  - Clears selection (or selects a reasonable neighbor, implementation choice)
- Immediate treemap re-render after add/delete

### Out of scope

- Persistence across refresh
- Import / export JSON
- Paste-from-text helper

---

## UI Affordances

| ID | Affordance | Description |
|----|------------|-------------|
| U11 | + Add deliverable button | Creates a new deliverable |
| U12 | Delete deliverable button | Deletes the currently selected deliverable |

---

## Code Affordances

| ID | Affordance | Responsibility |
|----|------------|----------------|
| N9 | `createDeliverable()` | Create deliverable with defaults, append to list, select it |
| N10 | `deleteDeliverable(id)` | Remove deliverable by id and update selection |

---

## State

| Store | Description |
|-------|-------------|
| `deliverables[]` | Source of truth list updated on add/delete |
| `selectedDeliverableId` | Updated on add (to new id) and on delete (cleared or moved) |
| `draftDeliverable` | Hydrated to match newly selected deliverable |

---

## Default Values

New deliverables MUST be created with these defaults (unless overridden by the editor immediately after):

- `title`: `"New deliverable"`
- `initiative`: `"Unassigned"`
- `complexity`: `1`
- `status`: `"todo"`
- `progress`: `0`

`id` MUST be unique (e.g., UUID or timestamp-based).

---

## Control Flow

### Add

1. User clicks + Add
2. `createDeliverable()`:
   - Creates new deliverable with defaults
   - Appends to `deliverables[]`
   - Sets `selectedDeliverableId` to the new id
   - Hydrates `draftDeliverable` to match selection
   - Triggers treemap re-render

### Delete

1. User clicks Delete
2. `deleteDeliverable(id)`:
   - Removes the deliverable from `deliverables[]`
   - Updates `selectedDeliverableId` (cleared or moved to another item)
   - Hydrates/clears `draftDeliverable` accordingly
   - Triggers treemap re-render

---

## Guardrails

- Delete is disabled when no deliverable is selected
- Add is always enabled

---

## Acceptance Criteria

V4 is complete when:

- [ ] Clicking + Add creates a new deliverable tile in the treemap
- [ ] The new deliverable is selected automatically
- [ ] The editor panel shows the new deliverable fields immediately
- [ ] Clicking Delete removes the selected deliverable from the treemap
- [ ] Delete is disabled when nothing is selected
- [ ] No changes persist after refresh
