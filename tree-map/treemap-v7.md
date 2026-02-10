# V7 — Paste-from-text helper (bootstrap without writing JSON)

## Goal

Provide a simple way to bootstrap the treemap without hand-authoring JSON by allowing the user to paste plain text (e.g., PRD bullets) and convert it into deliverables.

This slice reduces friction for initial data entry.

---

## Scope

### In scope

- A paste area where the user can paste a list of deliverables as text
- Parse pasted text into staged items (preview optional; apply required)
- Apply staged items to create deliverables in the treemap
- Persist resulting state via localStorage (V5)
- Conservative defaults when fields are missing

### Out of scope

- Deep PRD parsing, LLM-based extraction, or document upload parsing
- Complex multi-level hierarchy beyond initiative grouping
- Deduplication, merging, or update-by-title

---

## Input Format

The tool MUST accept a simple line-based format:

### Minimal (title only)

Each non-empty line becomes a deliverable title:

```
Port Settings page to new UI
Build feature A
Build feature B
```

### Optional initiative grouping

A line ending with `:` sets the current initiative for subsequent lines:

```
UI Modernization:
Port Settings page to new UI
Port Billing page to new UI

Project X:
Build feature A
Build feature B
```

Blank lines are ignored.

---

## Defaults

When creating deliverables from pasted text:

- `initiative`: last seen initiative header, else `"Unassigned"`
- `complexity`: `1`
- `status`: `"todo"`
- `progress`: `0`
- `id`: unique id per deliverable

---

## UI Affordances

| ID | Affordance | Description |
|----|------------|-------------|
| U16 | Paste textarea | Text area where user pastes lines/bullets |
| U17 | Apply pasted items button | Converts staged items into deliverables |
| U22 | Parsed items preview (optional) | List showing what will be created before apply |

---

## Code Affordances

| ID | Affordance | Responsibility |
|----|------------|----------------|
| N14 | `parsePastedText(text)` | Parse text into staged items |
| N15 | `applyParsedItems()` | Create deliverables from staged items, re-render, persist |

---

## State

| Store | Description |
|-------|-------------|
| `parsedItems[]` | Staged parsed items awaiting apply |

---

## Parsing Rules

- Trim whitespace from each line
- Ignore empty lines
- If line ends with `:`:
  - treat as initiative header (set current initiative)
  - do not create a deliverable
- Otherwise:
  - create a staged deliverable with defaults and current initiative
- Parsing MUST be deterministic and not rely on heuristics beyond the rules above

---

## Control Flow

1. User pastes text into textarea
2. `parsePastedText(text)` updates `parsedItems[]`
3. (Optional) preview renders staged items
4. User clicks Apply
5. `applyParsedItems()`:
   - Converts staged items into deliverables
   - Appends to `deliverables[]` (or replaces; implementation choice MUST be explicit—default is append)
   - Clears `parsedItems[]`
   - Triggers treemap re-render
   - Persists state via V5

---

## Append vs Replace Policy

Default behavior for this slice MUST be:

- **Append** parsed items to the existing deliverables list

If a replace behavior is desired later, add it as a separate control in a future slice.

---

## Acceptance Criteria

V7 is complete when:

- [ ] Pasting a list of lines creates staged parsed items
- [ ] Applying creates deliverables visible in the treemap immediately
- [ ] Initiative headers group subsequent deliverables correctly
- [ ] Defaults are applied consistently when fields are missing
- [ ] Result persists across refresh
