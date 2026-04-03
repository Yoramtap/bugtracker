# Pretext Spike Execution Plan

## Objective

Run a serious evaluation of `Pretext` as:

- a direct dependency for text-heavy layout
- a source of architectural patterns we may want to internalize
- a possible trigger to replace parts of the current responsive layout model

Companion docs:

- [pretext-layout-upgrade-brief.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-layout-upgrade-brief.md)
- [pretext-layout-spike-matrix.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-layout-spike-matrix.md)
- [pretext-spike-scorecard-template.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-spike-scorecard-template.md)

This plan assumes we are willing to reject the current approach where the new model proves meaningfully better.

## Success Criteria

The spike is successful only if we can show evidence, not just a nicer mockup.

Required:

- one production-adjacent surface is rebuilt in a new layout model
- the new surface is measured against the current one
- we can explain whether the win came from `Pretext` itself or from the prepare/render architecture

Desired:

- fewer compact-only text substitutions
- better narrow/embed layouts
- less brittle resize behavior
- a clearer composition model for text-heavy cards

## Recommended Spike Order

### Slice 1: Baseline instrumentation

Goal:

- measure the current layout model before touching product behavior

Likely files:

- `scripts/smoke-dashboard.mjs`
- `scripts/smoke-dashboard-render.mjs`
- `scripts/benchmark-dashboard-assets.mjs`
- `dashboard-app.js`

Add:

- route settle timing
- resize settle timing
- overflow counts
- screenshot matrix by width
- hot-path DOM measurement counters

Deliverable:

- a repeatable baseline for current card/layout behavior

Exit criteria:

- we can compare old vs new layouts on the same metrics

### Slice 2: Direct Pretext prototype on PR cycle card

Goal:

- test the most direct path to upside on the highest-value card surface

Target surface:

- workflow breakdown / PR cycle card

Likely files:

- `dashboard-app.js`
- `dashboard-chart-core.js`
- `dashboard-heavy-panels.html`
- possibly a new helper module for experimental text layout

What to prototype:

- multiline row labels
- supporting sample text with controlled line behavior
- predictive height
- improved compact/embed composition without shortened wording

Do not try to solve:

- all charts
- all cards
- all responsive states

Exit criteria:

- the prototype renders the same underlying data
- the layout is visibly more intentional at narrow and embed widths
- metrics are captured

### Slice 3: Pretext-inspired internal architecture prototype

Goal:

- test whether the win is architectural rather than library-specific

Target surface:

- same PR cycle card surface as Slice 2

Likely files:

- same as Slice 2, but with local preparation/layout helpers

What to prototype:

- a small `prepare` phase that precomputes text facts
- a width-aware `layout` step that is cheap to rerun
- render from prepared geometry rather than compact heuristics

Exit criteria:

- same surface, same data, same measurement matrix as Slice 2

### Slice 4: Compare and decide

Goal:

- choose one of three paths with discipline

Possible outcomes:

- direct `Pretext` adoption on selected surfaces
- internal prepare/render architecture without adopting the library
- hybrid
- stop

Deliverable:

- written comparison with benchmark results and decision

## Comparison Framework

### Compare current vs Shape A vs Shape B

Dimensions:

- density
- clarity
- wording preservation
- resize stability
- embed quality
- implementation complexity
- code surface area touched
- added bytes
- extensibility to narrative/editorial layouts

### Questions we must answer

- Did `Pretext` unlock something the current DOM/CSS model could not?
- If yes, was that because of the library's capabilities or just because we adopted a better architecture?
- Does the new model reduce or increase special-case compact logic?
- Is the improvement local to one card, or does it generalize?

## Benchmark Matrix

### Widths

- `320`
- `375`
- `430`
- `560`
- `768`
- desktop default
- embed mode

### States

- first paint
- settled route load
- after section switch
- after resize
- after orientation change

### Routes

- development-only
- all dashboard
- product-only
- shipped-only

### Metrics

- `prepareMs`
- `layoutMs`
- `renderMs`
- `routeSettleMs`
- `resizeSettleMs`
- `overflowCount`
- `lineClampViolations`
- `abbreviationCount`
- `domMeasurementReads`
- `labelCollisionCount`

## File-Touch Strategy

### Safe initial touch points

- `scripts/smoke-dashboard.mjs`
- `scripts/smoke-dashboard-render.mjs`
- experimental helpers in a new file
- one isolated render path in `dashboard-app.js` or `dashboard-charts-product.js`

### Files to avoid touching early

- broad CSS cleanup unrelated to the spike
- route loading logic in `dashboard-bootstrap.js` unless the prototype demands it
- unrelated chart renderers

## Risks

### Risk 1: We prove only that a redesign looks nicer

Mitigation:

- keep the same data and target surface
- benchmark the current and new versions

### Risk 2: We accidentally keep both complexity models

Mitigation:

- force a comparison between current, direct `Pretext`, and internal-architecture versions
- explicitly count compact-only branches we can remove

### Risk 3: We start in the wrong place

Mitigation:

- avoid line-chart internals first
- start with the card surface that already shows the current model's constraints

## Go / No-Go Checkpoint

After Slices 1 through 3, stop and choose:

### Go broader if:

- the new layout is materially better on multiple widths
- wording stays richer without clutter
- resize behavior stays equal or improves
- the code path feels cleaner, not just more powerful

### Stay narrow if:

- the win is real but only for one class of card

### Stop if:

- the result is prettier but not structurally better
- implementation complexity outweighs the gain
- the internal architecture spike matches the direct `Pretext` spike closely enough that the dependency does not earn its cost

## Immediate Next Move

If we want to execute this efficiently, the very next implementation step should be:

1. extend the smoke/render scripts into a layout benchmark harness
2. spike the PR cycle / workflow breakdown card in one isolated branch of code
3. compare direct `Pretext` vs internal prepare/render

That is the fastest path to learning whether this is a local trick or a real upgrade path for the repo.
