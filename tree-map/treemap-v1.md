# V1 — Treemap renders from local JSON

## Goal

Render a stock-market-style rectangular treemap from a local JSON file, showing product deliverables grouped by initiative, sized by complexity, and colored by status.

---

## Scope

### In scope

- Load deliverables from a local JSON file
- Render a treemap with:
  - Grouping by initiative
  - Area based on complexity (1–5)
  - Color based on status (To do / In progress / Done)
  - Labels visible inside tiles
- Show an empty state when there are zero deliverables

### Out of scope

- Tile selection and highlighting
- Editor panel
- Add / delete deliverables
- Persistence via localStorage
- Import / export JSON
- Paste-from-text helper

---

## Data Source

### File

`data.json` (local file; source of truth for V1)

### Schema

```json
[
  {
    "id": "string",
    "title": "string",
    "initiative": "string",
    "complexity": 1,
    "status": "todo | inprogress | done",
    "progress": 0
  }
]
```

Constraints:
- `complexity` MUST be an integer from 1–5
- `status` MUST be one of the listed values
- `progress` is present for forward compatibility but is NOT used in V1 rendering

---

## Rendering Rules

- Hierarchy path: `initiative → title`
- Tile value: `complexity`
- Color mapping (discrete buckets):
  - `todo`
  - `inprogress`
  - `done`
- Tile label: `title`
- Tooltip (optional, not required for V1):
  - title
  - initiative
  - complexity
  - status
  - progress

Exact colors, fonts, and spacing are not prescribed in this slice.

---

## UI Affordances

| ID | Affordance | Description |
|----|------------|-------------|
| U2 | Treemap visualization | Rectangular treemap rendered from deliverables |
| U19 | Empty state | Message shown when there are zero deliverables |

---

## Code Affordances

| ID | Affordance | Responsibility |
|----|------------|----------------|
| N1 | `initApp()` | Application bootstrap |
| N4 | `loadState()` | Load `data.json` into memory |
| N11 | `computeTreemapNodes()` | Transform deliverables into treemap-compatible structure |
| N2 | `renderTreemap()` | Render treemap or empty state |

---

## Control Flow

1. `initApp()` is called on page load
2. `loadState()` loads `data.json` into `deliverables[]`
3. `computeTreemapNodes(deliverables)` prepares hierarchical data
4. `renderTreemap()`:
   - Renders the treemap if data exists
   - Renders the empty state if not

---

## Suggested File Structure

```
/treemap-tool
  ├── index.html
  ├── app.js
  └── data.json
```

The tool is served via a simple static server.

---

## Acceptance Criteria

V1 is complete when:

- [ ] The page loads locally without errors
- [ ] The treemap renders from `data.json`
- [ ] Tile sizes correctly reflect the complexity scale
- [ ] Status colors are visually distinct
- [ ] Tile labels are visible without interaction
- [ ] The empty state renders when `data.json` is empty
