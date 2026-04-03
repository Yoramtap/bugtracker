# Pretext Layout Upgrade Brief

## Why This Is Worth Evaluating

`Pretext` is not just a text measurement helper. Its core idea is a different layout contract:

- do expensive text analysis and measurement once
- keep relayout cheap
- let JavaScript own line flow when CSS cannot express the desired result

That is interesting for us because this repo already has a split between:

- route/shell loading in `dashboard-bootstrap.js`
- render scheduling in `dashboard-app.js`
- visual primitives and card/chart composition in `dashboard-chart-core.js`, `dashboard-app.js`, and `dashboard-charts-product.js`

Today, our responsive strategy is mostly:

- hardcoded width/height branches
- `isCompactViewport()`-driven label shortening
- fixed chart/container assumptions
- CSS min-heights and per-surface compact tweaks

That is sensible, but it is also exactly the kind of approach a more programmable layout system can surpass.

Companion docs:

- [pretext-layout-spike-matrix.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-layout-spike-matrix.md)
- [pretext-spike-execution-plan.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-spike-execution-plan.md)
- [pretext-spike-scorecard-template.md](/Users/yoramtap/Documents/AI/tracker/tasks/pretext-spike-scorecard-template.md)

## What We Should Be Willing To Replace

If this evaluation works, we should be willing to replace parts of the current layout model, not just sprinkle a helper on top.

Candidates to retire or reduce:

- compact-only wording branches like `Done` vs `Shipped`, `Open` vs `Ongoing`, and other shortened label variants in `dashboard-charts-product.js`
- fixed chart width assumptions like `960` or viewport-minus-padding heuristics in `dashboard-charts-product.js:320-325` and `dashboard-app.js:1017-1026`
- card/list rows that assume a fixed label / track / value grid without negotiating with text in `dashboard-chart-core.js:290-329`
- embed-mode min-height assumptions in `dashboard-styles.css:2876-2886`

We should not try to replace everything. Raw chart geometry is still mostly a chart-design problem, not a text-engine problem.

## Where Pretext Can Actually Help

### 1. Programmable text composition

Good fit:

- dense summary cards
- multi-line labels with supporting subtext
- balanced text blocks
- obstacle-aware text flow around key metrics or illustrations
- layouts where we want text to "shrink-wrap" or choose a pleasing width

### 2. Predictive sizing

Good fit:

- surfaces where we want stable heights before paint
- embed/iframe contexts
- resize/orientation paths where we want cheap relayout
- virtualization-like cases if we ever render larger text-heavy lists

### 3. Dev-time verification

Good fit:

- detecting overflow before shipping
- proving label line counts stay within bounds
- testing compact and embed layouts without relying only on screenshots

### 4. Manual line routing

Good fit:

- SVG/canvas-adjacent labels or annotations
- editorial / narrative panels
- any future timelapse/story view where text must adapt to dynamic geometry

## Where It Is Probably Overkill

Low-fit areas:

- simple bars/points/axes where ordinary SVG layout is enough
- places where the main issue is data density rather than text flow
- surfaces that already work well with plain CSS and do not depend on text measurements

We should be skeptical of using `Pretext` for:

- generic line charts as-is
- every axis tick
- every card in the system by default

## Ranked Upgrade Targets

### 1. PR cycle / workflow breakdown cards

Primary files:

- `dashboard-app.js:1972-2076`
- `dashboard-heavy-panels.html:163-190`
- `dashboard-chart-core.js:257-329`

Why this is promising:

- already card-like and text-heavy
- already optimized for compact mode
- mixes labels, supporting copy, value badges, and progress tracks
- likely to benefit from better text negotiation without rewriting chart math

Current limitation:

- the row layout is fixed as label / track / value
- compact mode shortens wording instead of rethinking composition
- layout quality depends on CSS + fixed markup structure

Potential upside:

- denser but clearer stage cards
- better support for long team/stage labels
- more intentional mobile, embed, and narrow desktop layouts
- prepare-once / rerender-cheap path for resize

Risk:

- medium
- the card system is central enough to be meaningful, but still isolated enough for a spike

Recommended path:

- highest-priority direct prototype

### 2. Product cycle comparison and single-team cards

Primary files:

- `dashboard-charts-product.js:1160-1277`
- `dashboard-chart-core.js:257-329`

Why this is promising:

- current compact mode visibly swaps vocabulary for space
- rows are repeated and structurally consistent
- easier to compare "current card layout" vs "programmable text layout"

Current limitation:

- label shortening is doing layout work
- footer summaries compress meaning into shorter text instead of better composition

Potential upside:

- preserve full meaning on smaller surfaces
- richer sublabels and better balance of row label / sample text / value
- consistent desktop/mobile/embed treatment from the same layout model

Risk:

- medium-low

Recommended path:

- include in the first spike if the PR cycle card spike goes well

### 3. Contributors card

Primary files:

- `dashboard-charts-product.js:1236-1277`
- `index.html:40-71`
- `dashboard-chart-core.js:257-329`

Why this is promising:

- simpler control case
- fewer moving parts
- good place to test predictive row heights and long-name handling

Current limitation:

- contributor names and summary strings still rely on the fixed row frame

Potential upside:

- better handling of long contributor names
- cleaner compact presentation without changing semantics

Risk:

- low

Recommended path:

- use as a control surface in benchmarks

### 4. Heavy panel shell / narrative composition

Primary files:

- `dashboard-heavy-panels.html`
- `dashboard-bootstrap.js:17-31`
- `dashboard-bootstrap.js:172-240`

Why this is promising:

- this is where we can use the "dynamic layout" upside, not just the "measure text" upside
- panel headers, help text, controls, summaries, and cards could be composed more editorially

Current limitation:

- panels are mostly stacked blocks with fixed shells
- route/section loading is thoughtful, but panel composition is still traditional DOM/CSS

Potential upside:

- new story-driven layouts
- better use of horizontal space on desktop/tablet
- more expressive embed presentations

Risk:

- medium-high
- more product/design change than engineering swap

Recommended path:

- second-wave spike after proving value on one card surface

### 5. Chart-adjacent labels and annotations

Primary files:

- `dashboard-charts-product.js:316-346`
- `dashboard-app.js:1016-1034`

Why this is promising:

- could improve legend labels, annotation callouts, and responsive text around charts

Current limitation:

- width, tick stride, and axis label choices are mostly viewport heuristics

Potential upside:

- better chart-adjacent text layout
- more deliberate compact behavior

Risk:

- medium-high
- easy to over-engineer without changing the real chart problem

Recommended path:

- do not start here
- use only after a successful card/narrative prototype

## Upgrade Shapes To Compare

We should compare three shapes, not one.

### Shape A: Direct Pretext adoption

Use `Pretext` directly on one or two text-heavy surfaces.

Use it for:

- multiline labels
- shrink-wrap or balanced widths
- predictive height
- manual line layout where the current DOM structure is too rigid

Best case:

- fastest path to seeing the real upside

Main risk:

- library/runtime integration cost
- over-adopting before we know which surfaces benefit

### Shape B: Pretext-inspired internal architecture

Do not adopt the library yet. Copy the model:

- a `prepare` phase that computes text/layout facts
- a cheap `layout` phase for width changes
- render from precomputed geometry

Best case:

- we capture most of the upside while preserving full control

Main risk:

- we rebuild the easy 20% and miss the hard 80%

### Shape C: Hybrid

Use `Pretext` directly only where custom line flow matters, and borrow the prepare/render split everywhere else.

Best case:

- highest chance of practical win

Main risk:

- complexity creep if boundaries are unclear

## Recommended Evaluation Program

### Phase 0: Baseline

No product changes yet. Measure the current system.

Reuse:

- route smoke in `scripts/smoke-dashboard.mjs`
- screenshot smoke in `scripts/smoke-dashboard-render.mjs`
- asset benchmark in `scripts/benchmark-dashboard-assets.mjs`
- existing render scheduling in `dashboard-app.js:2399-2438`

Add baseline measurements for:

- first render settle time
- resize settle time
- route switch settle time
- overflow count
- clipped/hidden text count
- abbreviation count
- screenshot matrix by width

### Phase 1: Card spike

Target:

- PR cycle / workflow breakdown card

Compare:

- current implementation
- direct `Pretext`
- Pretext-inspired internal prepare/render approach

Decision:

- if there is no material density or quality win here, do not broaden adoption

### Phase 2: Comparison-card spike

Target:

- product cycle cards
- contributors card as control

Goal:

- test whether the new approach generalizes across repeated row/card layouts

### Phase 3: Narrative/editorial spike

Target:

- one heavy panel shell or story-like dashboard mode

Goal:

- test the `dynamic layout` upside, not just the measurement upside

### Phase 4: Chart-adjacent experiment

Target:

- one annotation/legend/callout problem, not a whole chart rewrite

Goal:

- prove whether manual text layout helps chart readability enough to matter

## Benchmark And Canary Matrix

### Runtime metrics

- `prepareMs`: one-time text analysis/layout-prep time
- `layoutMs`: relayout time after width change
- `renderMs`: paint/render time after layout result is ready
- `resizeSettleMs`: time from resize/orientation event to stable DOM
- `routeSettleMs`: time from route/section change to stable DOM
- `renderCountPerResizeBurst`: how many rerenders happen during one resize burst

### Layout quality metrics

- `overflowCount`: number of nodes where text overflows container bounds
- `lineClampViolations`: number of nodes exceeding allowed line count
- `abbreviationCount`: how many strings are shortened purely for compact layout
- `labelCollisionCount`: overlapping label/value/track regions
- `emptySpaceRatio`: useful for card surfaces where improved density is a goal

### Stability metrics

- `domMeasurementReads`: calls to layout-sensitive APIs during hot paths
- `lineCountVarianceAcrossWidths`: whether copy jumps awkwardly between nearby widths
- `orientationRelayoutQuality`: whether narrow landscape/tablet states degrade

### Visual scenarios

Widths:

- `320`
- `375`
- `430`
- `560`
- `768`
- desktop default
- embed mode

Routes / states:

- default community
- all dashboard
- development-only
- product-only
- shipped-only
- after resize
- after orientation change
- after section switch

### Existing scripts we should extend

- `scripts/smoke-dashboard.mjs`
  - already captures visible panels, filled charts, loaded resources, and status failures
  - extend it with browser-evaluated layout metrics
- `scripts/smoke-dashboard-render.mjs`
  - turn from 2 screenshots into a width/scenario matrix
- `scripts/benchmark-dashboard-assets.mjs`
  - keep as a payload guardrail for any added runtime cost

## Hard Go / No-Go Criteria

Proceed only if a spike gives us at least two of the following:

- materially better information density without losing clarity
- fewer compact-only wording branches
- lower resize/orientation relayout cost
- better embed-mode presentation
- fewer overflow/clipping issues
- a cleaner layout model than the current branch-heavy approach

Stop or narrow the effort if:

- the win is mostly visual but not architectural
- the dependency/runtime cost is high and the improvement is local
- the new model only helps one niche surface
- chart-adjacent work starts becoming more complex than the readability gain warrants

## Immediate Recommendation

Start aggressively, but not everywhere.

1. Treat this as a possible layout-system upgrade, not a utility trial.
2. Prove it first on the PR cycle / workflow breakdown card surface.
3. In parallel, add the benchmark/canary harness so the comparison is measurable.
4. If the card spike wins, expand to product-cycle and contributors cards.
5. Only then spend time on editorial shell layouts or chart-adjacent annotations.

## Notes On Current Repo Assets We Can Reuse

- Route/script/shell loading is already explicit in `dashboard-bootstrap.js`, which makes A/B evaluation easier.
- Render queue and resize queue already exist in `dashboard-app.js`, which gives us stable instrumentation points.
- Card markup is centralized enough in `dashboard-chart-core.js` that one prototype can affect several surfaces quickly.
- The repo already values scripts and benchmarks, so adding a layout benchmark script fits the existing workflow.

## Final Position

We should not be attached to the current layout model.

This is one of the few cases where a new piece of technology could justify replacing parts of a working responsive system, because it changes what is possible:

- not just smaller screens
- not just fewer DOM reads
- but more intentional composition across desktop, embed, tablet, and mobile

The right stance is:

- open-minded about replacing the current approach
- disciplined about measuring the win
- ruthless about stopping if the upside turns out to be narrow
