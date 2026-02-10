# V5 — Auto-persist via localStorage

## Goal

Persist the current treemap state locally so that a refresh restores:
- deliverables
- current selection (if applicable)

This slice makes the tool practical for ongoing personal use.

---

## Scope

### In scope

- Automatically persist state to browser `localStorage` after changes:
  - Apply edits (V3)
  - Add deliverable (V4)
  - Delete deliverable (V4)
- Load persisted state on startup if present
- Fall back to `data.json` (V1) if no persisted state exists

### Out of scope

- Import / export JSON
- Paste-from-text helper
- Multi-user sync, authentication, or server-side persistence

---

## State to Persist

Persist a single JSON object containing:

- `deliverables[]`
- `selectedDeliverableId` (nullable)

Example shape:

```json
{
  "deliverables": [ /* ... */ ],
  "selectedDeliverableId": "d1"
}
```

---

## UI Affordances

None added in this slice.

---

## Code Affordances

| ID | Affordance | Responsibility |
|----|------------|----------------|
| N8 | `persistState()` | Serialize and write state to localStorage |
| N4 | `loadState()` | Read localStorage first, else load `data.json` |

---

## Data Store

| Store | Description |
|-------|-------------|
| `localStorageState` | External store: `localStorage` key used by this tool |

---

## Storage Rules

- Use a single key, e.g. `treemapToolState`
- Writes MUST be atomic from the app perspective:
  - serialize fully, then setItem once
- If persisted data is invalid/unparseable:
  - ignore it
  - fall back to `data.json`

---

## Control Flow

### Startup

1. `initApp()` calls `loadState()`
2. `loadState()`:
   - tries to read/parse localStorage key
   - if valid: hydrates state from it
   - else: loads `data.json`
3. App renders treemap
4. If selection exists, details/editor are hydrated accordingly

### Mutations

After any mutation that changes deliverables or selection:
- `persistState()` is called

Mutations that MUST persist:
- commitDraft() (V3)
- createDeliverable() (V4)
- deleteDeliverable() (V4)
- selectDeliverable() (V2) (optional but recommended for restoring selection)

---

## Acceptance Criteria

V5 is complete when:

- [ ] After edits/add/delete, refreshing the page restores the same treemap
- [ ] Selection is restored after refresh (if a tile was selected)
- [ ] If localStorage is empty, the app loads from `data.json`
- [ ] If localStorage contains invalid JSON, the app safely falls back to `data.json`
