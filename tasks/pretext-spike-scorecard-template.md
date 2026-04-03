# Pretext Spike Scorecard Template

Companion docs:

- [pretext-layout-upgrade-brief.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-layout-upgrade-brief.md)
- [pretext-layout-spike-matrix.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-layout-spike-matrix.md)
- [pretext-spike-execution-plan.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-spike-execution-plan.md)

## Scope

- Surface:
- Date:
- Branch / diff:
- Compared shapes:
  - Current
  - Shape A: direct `Pretext`
  - Shape B: internal prepare/render

## Benchmark Summary

| Metric              | Current | Shape A | Shape B | Winner | Notes |
| ------------------- | ------- | ------- | ------- | ------ | ----- |
| prepareMs           |         |         |         |        |       |
| layoutMs            |         |         |         |        |       |
| renderMs            |         |         |         |        |       |
| routeSettleMs       |         |         |         |        |       |
| resizeSettleMs      |         |         |         |        |       |
| domMeasurementReads |         |         |         |        |       |
| overflowCount       |         |         |         |        |       |
| lineClampViolations |         |         |         |        |       |
| abbreviationCount   |         |         |         |        |       |
| labelCollisionCount |         |         |         |        |       |

## Width Matrix

| Width / Mode | Current | Shape A | Shape B | Notes |
| ------------ | ------- | ------- | ------- | ----- |
| 320          |         |         |         |       |
| 375          |         |         |         |       |
| 430          |         |         |         |       |
| 560          |         |         |         |       |
| 768          |         |         |         |       |
| Desktop      |         |         |         |       |
| Embed        |         |         |         |       |

## Qualitative Comparison

| Dimension            | Current | Shape A | Shape B | Winner | Notes |
| -------------------- | ------- | ------- | ------- | ------ | ----- |
| Information density  |         |         |         |        |       |
| Clarity              |         |         |         |        |       |
| Wording preservation |         |         |         |        |       |
| Resize stability     |         |         |         |        |       |
| Embed quality        |         |         |         |        |       |
| Code simplicity      |         |         |         |        |       |
| Extensibility        |         |         |         |        |       |

## Compact-Logic Removal Check

Strings / branches removed or no longer needed:

-
-
-

Strings / branches still required:

-
-
-

## Risks Observed

-
-
-

## Final Call

Choose one:

- Go broader with direct `Pretext`
- Go broader with internal prepare/render
- Use hybrid
- Stop

## Why

-
-
-
