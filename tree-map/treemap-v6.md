# V6 — Import and export JSON

## Goal

Allow users to export the current treemap state to a JSON file and import a JSON file to restore or replace the current state.

This slice enables backup, sharing, and reset workflows.

---

## Scope

### In scope

- Export current state to a downloadable JSON file
- Import a JSON file and replace current state
- Validate imported JSON before applying
- Show a clear error when import fails
- Persist imported state to localStorage (via V5)

### Out of scope

- Merging imported data with existing data
- Versioning or migration of older schemas
- Paste-from-text helper

---

## Imported / Exported Shape

The file format MUST match the persisted state format from V5:

```json
{
  "deliverables": [ /* deliverable objects */ ],
  "selectedDeliverableId": "string | null"
}
```

Constraints:
- `deliverables` MUST be an array
- Each deliverable MUST match the schema defined in V1
- `selectedDeliverableId` MUST be null or reference an existing deliverable id

---

## UI Affordances

| ID | Affordance | Description |
|----|------------|-------------|
| U13 | Import JSON button | Opens file picker to select JSON file |
| U14 | File chooser | Browser file picker for JSON files |
| U15 | Export JSON button | Downloads current state as JSON file |
| U18 | Error message | Inline or toast error shown on import failure |

---

## Code Affordances

| ID | Affordance | Responsibility |
|----|------------|----------------|
| N12 | `parseAndValidateJson(file)` | Read file, parse JSON, validate schema |
| N16 | `applyImportedData(data)` | Replace current state with imported data |
| N13 | `serializeAndDownloadJson()` | Serialize current state and trigger download |
| N17 | `setError(message)` | Store and display import errors |

---

## Validation Rules

Import MUST fail if any of the following are true:

- File is not valid JSON
- Root object is not an object
- `deliverables` is missing or not an array
- Any deliverable is missing required fields
- Any deliverable has invalid `complexity`, `status`, or `progress`
- `selectedDeliverableId` references a non-existent deliverable

On failure:
- No state is mutated
- Error message is shown
- Existing state remains intact

---

## Control Flow

### Export

1. User clicks Export JSON
2. `serializeAndDownloadJson()`:
   - Reads current state
   - Serializes to JSON
   - Triggers browser download

### Import

1. User clicks Import JSON
2. File picker opens
3. User selects file
4. `parseAndValidateJson(file)` runs
5. If valid:
   - `applyImportedData(data)` replaces state
   - State is persisted via V5 logic
   - Treemap re-renders
6. If invalid:
   - `setError(message)` is called
   - Error message is displayed

---

## Acceptance Criteria

V6 is complete when:

- [ ] Export downloads a JSON file matching the current state
- [ ] Importing a previously exported file restores the treemap exactly
- [ ] Importing invalid JSON shows an error and does not change state
- [ ] Imported state persists across refresh
