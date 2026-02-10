# Treemap Deliverables Visualizer — Big Picture

**Selected shape:** A (Local single-page treemap with JSON/localStorage + import/export + paste helper)

---

## Frame

### Problem

- Product work is sliced into deliverables, but progress is hard to communicate quickly and visually.
- People need a simple webpage view that shows what’s **To do / In progress / Done** at a glance.
- Creating/maintaining the underlying data should be easy enough for personal/experimental use (not “write JSON from scratch every time”).

### Outcome

- A local webpage renders a treemap of deliverables:
  - **Tile size = complexity (1–5)**
  - **Tile color = status (To do / In progress / Done)**
- Users can inspect, edit, add, and remove deliverables in the UI.
- State survives refresh for personal ongoing use.
- Users can export/import JSON for backup/sharing and paste plain text to bootstrap without hand-authoring JSON.

---

## Shape

### Fit Check (R × A)

| Req | Requirement | Status | A |
|-----|-------------|--------|---|
| R0 | Render a treemap of deliverables in a simple webpage view | Core goal | ✅ |
| R1 | Tile size is based on complexity scale 1–5 | Must-have | ✅ |
| R2 | Tiles visually encode status: To do / In progress / Done | Must-have | ✅ |
| R3 | Deliverables can be inspected by clicking/selecting a tile | Must-have | ✅ |
| R4 | Users can edit a deliverable after it is plotted | Must-have | ✅ |
| R5 | Users can add and delete deliverables | Nice-to-have | ✅ |
| R6 | Progress can be represented as 0–100% in 10% increments | Nice-to-have | ✅ |
| R7 | State survives page refresh for personal use | Must-have | ✅ |
| R8 | Users can import/export JSON for backup/sharing | Nice-to-have | ✅ |
| R9 | Users can bootstrap data entry without writing JSON from scratch (paste helper) | Nice-to-have | ✅ |
| R10 | Hosted locally for now (experimental/personal use) | Must-have | ✅ |

### Parts

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | Render treemap from local JSON (group by initiative, size by complexity, color by status) | |
| **A2** | Tile selection and read-only details panel | |
| **A3** | Edit selected deliverable using draft + apply; re-render treemap on apply | |
| **A4** | Add/delete deliverables; update selection and re-render | |
| **A5** | Auto-persist state to localStorage; restore on load; fall back to `data.json` | |
| **A6** | Import/export state JSON with validation + safe failure behavior | |
| **A7** | Paste-from-text helper (initiative headers + line items) to bootstrap deliverables | |

### Breadboard

**Diagram is intentionally deferred until the end** (after early implementation confirms library event wiring and data transforms).
For now, the slice plans are the ground truth for wiring and acceptance.

---

## Slices

### Slices Grid

|  |  |  |
|:--|:--|:--|
| **[V1: TREEMAP RENDERS FROM LOCAL JSON](./treemap-v1.md)**<br>⏳ PENDING<br><br>• Load `data.json`<br>• Render treemap (group/size/color/labels)<br>• Empty state<br>• &nbsp;<br><br>*Demo: Open page → treemap renders* | **[V2: TILE SELECTION + DETAILS](./treemap-v2.md)**<br>⏳ PENDING<br><br>• Click tile to select<br>• Highlight selected tile<br>• Details panel shows fields<br>• Empty details state<br><br>*Demo: Click tile → see details* | **[V3: EDIT SELECTED (DRAFT + APPLY)](./treemap-v3.md)**<br>⏳ PENDING<br><br>• Edit title/initiative/status/complexity/progress<br>• Draft state<br>• Apply commits + re-renders<br>• &nbsp;<br><br>*Demo: Edit → Apply → treemap updates* |
| **[V4: ADD + DELETE](./treemap-v4.md)**<br>⏳ PENDING<br><br>• Add deliverable w/ defaults<br>• Auto-select new item<br>• Delete selected item<br>• &nbsp;<br><br>*Demo: Add tile, delete tile* | **[V5: LOCALSTORAGE PERSISTENCE](./treemap-v5.md)**<br>⏳ PENDING<br><br>• Persist state after mutations<br>• Restore on load<br>• Fallback to `data.json`<br>• Invalid storage → safe fallback<br><br>*Demo: Refresh → state remains* | **[V6: IMPORT / EXPORT JSON](./treemap-v6.md)**<br>⏳ PENDING<br><br>• Export current state<br>• Import + validate<br>• Safe failure (no mutation on error)<br>• Persist imported state<br><br>*Demo: Export → import restores* |
| **[V7: PASTE-FROM-TEXT BOOTSTRAP](./treemap-v7.md)**<br>⏳ PENDING<br><br>• Paste lines + optional initiative headers<br>• Deterministic parsing<br>• Apply appends deliverables<br>• Persist result<br><br>*Demo: Paste bullets → treemap populated* |  |  |

### Status Legend

- ✅ COMPLETE
- ⏳ PENDING

