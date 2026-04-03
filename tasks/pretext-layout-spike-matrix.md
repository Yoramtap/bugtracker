# Pretext Layout Spike Matrix

## Goal

Turn the upgrade brief into a sequence of bounded experiments with clear evidence.

Companion docs:

- [pretext-layout-upgrade-brief.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-layout-upgrade-brief.md)
- [pretext-spike-execution-plan.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-spike-execution-plan.md)
- [pretext-spike-scorecard-template.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-spike-scorecard-template.md)

This document is intentionally operational.
It answers:

- what to spike
- in what order
- where to touch the code
- how to measure results
- what would count as a win
- what should cause us to stop

## Shared Rules

1. Do not start with the raw chart geometry layer.
2. Do not ship a permanent second layout system unless one spike clearly wins.
3. Every spike must compare against the current implementation on desktop, mobile, and embed-heavy surfaces.
4. Every spike must produce evidence in at least two forms:
   - screenshot/runtime evidence
   - code/complexity evidence

## Existing Validation Hooks We Should Reuse

### Visual smoke screenshots

- [scripts/smoke-dashboard-render.mjs:8](/Users/yoramtap/Documents/AI/tracker/scripts/smoke-dashboard-render.mjs#L8)
- Current scenarios are too broad and too few for this experiment.
- Extend this path later with viewport-specific captures and surface-specific routes.

### Route/resource/runtime assertions

- [scripts/smoke-dashboard.mjs:7](/Users/yoramtap/Documents/AI/tracker/scripts/smoke-dashboard.mjs#L7)
- [scripts/smoke-dashboard.mjs:16](/Users/yoramtap/Documents/AI/tracker/scripts/smoke-dashboard.mjs#L16)
- This script already checks visible panels, loaded resources, and route correctness.
- It is the right place to add structural canaries for new layout modes.

### Asset and payload benchmarking

- [scripts/benchmark-dashboard-assets.mjs:6](/Users/yoramtap/Documents/AI/tracker/scripts/benchmark-dashboard-assets.mjs#L6)
- [scripts/benchmark-dashboard-assets.mjs:43](/Users/yoramtap/Documents/AI/tracker/scripts/benchmark-dashboard-assets.mjs#L43)
- This is the existing performance baseline for route and asset weight.
- If a Pretext path materially increases JS weight, this script should be part of the decision.

## Evaluation Scorecard

Each spike should be scored on a 0-2 basis:

- `0` = worse or no real gain
- `1` = partial gain
- `2` = clear gain

Categories:

- `Layout quality`
- `Text density`
- `Desktop quality`
- `Mobile quality`
- `Embed/heavy-panel quality`
- `Resize/orientation behavior`
- `Implementation clarity`
- `Bundle impact`

If a spike cannot reach at least `11/16`, it should not be rolled forward as the new direction.

## Spike 0: Baseline

### Purpose

Establish what the current system is doing before we compare it to anything new.

### Surfaces

- PR cycle / lifecycle / product-cycle cards
- shipped timeline detail panel
- one heavy panel route

### Files to inspect or extend later

- [dashboard-charts-product.js](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-product.js)
- [dashboard-charts-shipped.js](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-shipped.js)
- [dashboard-heavy-panels.html](/Users/yoramtap/Documents/AI/tracker/dashboard-heavy-panels.html)
- [scripts/smoke-dashboard-render.mjs](/Users/yoramtap/Documents/AI/tracker/scripts/smoke-dashboard-render.mjs)
- [scripts/smoke-dashboard.mjs](/Users/yoramtap/Documents/AI/tracker/scripts/smoke-dashboard.mjs)

### Evidence to collect

- screenshots at `320`, `375`, `430`, `768`, `1280`
- current abbreviations
- current ellipsis use
- current hidden/skipped label rules
- current route payload and asset weight

### Current repo signals to count

- Copy shortening:
  - [dashboard-charts-product.js:1110](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-product.js#L1110)
  - [dashboard-charts-product.js:1156](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-product.js#L1156)
  - [dashboard-charts-product.js:1164](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-product.js#L1164)
  - [dashboard-charts-product.js:1172](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-product.js#L1172)
- Skipped labels:
  - [dashboard-charts-product.js:333](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-product.js#L333)
  - [dashboard-app.js:986](/Users/yoramtap/Documents/AI/tracker/dashboard-app.js#L986)
- Ellipsis:
  - [dashboard-styles.css:1792](/Users/yoramtap/Documents/AI/tracker/dashboard-styles.css#L1792)

### Pass condition

- We have a written baseline and screenshots we can compare against.

## Spike 1: Card-System Upgrade

### Purpose

Test whether Pretext is meaningfully better on the most text-sensitive card surface in the repo.

### Target surface

- PR cycle / lifecycle / product-cycle cards

### Files most likely to change

- [dashboard-charts-product.js:1074](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-product.js#L1074)
- [dashboard-charts-product.js:1211](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-product.js#L1211)
- [dashboard-chart-core.js:290](/Users/yoramtap/Documents/AI/tracker/dashboard-chart-core.js#L290)

### What to try

- Replace copy-shortening decisions with layout decisions
- Allow balanced multiline labels and submeta
- Let values, samples, and bars negotiate space rather than assuming one shell
- Keep chart geometry out of scope

### What not to do

- Do not rewrite the entire card rendering system
- Do not touch unrelated charts
- Do not invent a generalized DSL unless the spike proves necessary

### Success signals

- Fewer abbreviated labels
- Fewer “compact-only” text branches
- Better density without worse readability
- Cleaner code than the current branch-heavy layout assumptions

### Failure signals

- Same UI, more machinery
- Large wrapper abstraction with no visible payoff
- Harder-to-maintain card rendering than today

## Spike 2: Shipped Narrative Panel

### Purpose

Test whether Pretext can create a genuinely better mixed text/visual composition, not just better text wrapping.

### Target surface

- shipped timeline detail panel

### Files most likely to change

- [dashboard-charts-shipped.js:72](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-shipped.js#L72)
- [dashboard-charts-shipped.js:185](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-shipped.js#L185)
- [dashboard-styles.css:1792](/Users/yoramtap/Documents/AI/tracker/dashboard-styles.css#L1792)

### What to try

- Replace ellipsis-first list rendering with a layout-aware detail composition
- Explore an editorial treatment for month detail, grouped teams, and shipped idea summaries
- Preserve scannability while allowing fuller titles and area labels

### What not to do

- Do not keep the exact current visual shell if it blocks the point of the spike
- Do not optimize for only one viewport size

### Success signals

- Titles and metadata are more visible without making the panel noisy
- Month detail feels more like a product surface and less like a fallback list
- Desktop and mobile both improve

### Failure signals

- It looks “interesting” but less scannable
- It adds a lot of layout code for a marginal improvement

## Spike 3: Heavy-Panel / Embed Composition

### Purpose

Test the bigger upside: whether selected panels can become layout-aware scenes instead of fixed shells with CSS adjustments.

### Target surface

- one heavy panel or one embed-specific composition

### Files most likely to change

- [dashboard-heavy-panels.html](/Users/yoramtap/Documents/AI/tracker/dashboard-heavy-panels.html)
- [dashboard-styles.css:2876](/Users/yoramtap/Documents/AI/tracker/dashboard-styles.css#L2876)
- [dashboard-app.js:2426](/Users/yoramtap/Documents/AI/tracker/dashboard-app.js#L2426)

### What to try

- Let a panel rearrange hierarchy and copy placement based on constraints
- Test whether prepared layout facts can reduce shell assumptions
- Compare against current fixed min-height and rerender model

### What not to do

- Do not turn the entire dashboard into a new layout runtime
- Do not roll this out globally before a single panel proves out

### Success signals

- Clear improvement in embed quality
- Fewer shell-specific hacks
- Better mixed chart/copy composition

### Failure signals

- High scope with no clearly better user-facing result
- More rerender churn than today

## Spike 4: Chart Text Layer, Not Chart Geometry

### Purpose

Only after the earlier spikes: test whether the chart text layer benefits from the same model.

### Target surface

- legends, annotations, selected labels

### Files most likely to change

- [dashboard-charts-product.js:316](/Users/yoramtap/Documents/AI/tracker/dashboard-charts-product.js#L316)
- [dashboard-app.js:1016](/Users/yoramtap/Documents/AI/tracker/dashboard-app.js#L1016)
- [dashboard-chart-core.js:397](/Users/yoramtap/Documents/AI/tracker/dashboard-chart-core.js#L397)

### What to try

- Better legends
- Better callouts
- Better label density

### What not to do

- Do not use this spike to justify forcing Pretext into line-path geometry, axes, or scales

### Success signals

- Better text handling with minimal geometric complexity increase

### Failure signals

- Geometry logic becomes entangled with layout logic
- The chart feels harder to reason about than before

## Decision Tree

### Choose direct Pretext adoption if

- Spike 1 or Spike 2 clearly beats the current implementation
- the improvement is visible without explanation
- the code is not obviously worse
- asset growth is acceptable

### Choose architecture-only adoption if

- the main win comes from prepare/render separation
- the direct dependency does not produce meaningfully better composition
- we can reproduce the needed behavior in a smaller local abstraction

### Stop if

- two spikes in a row produce novelty without clear product improvement
- the code gets more complex faster than the UI gets better
- the experiment drifts into generic framework building

## Recommended Immediate Next Move

Start with:

1. Spike 0 baseline
2. Spike 1 card-system upgrade

This is the smallest path that can still prove whether this technology is actually a better direction for the repo.
