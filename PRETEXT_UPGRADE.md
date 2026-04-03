# Pretext Upgrade Brief

## Executive Summary

- `Pretext` is most promising here as a layout-system upgrade for text-heavy and mixed-composition surfaces, not as a replacement for raw SVG chart geometry.
- The current dashboard is strong at payload/routing discipline, but its layout model still leans on breakpoint branches, fixed boxes, abbreviated labels, and CSS/DOM-led wrapping.
- The highest upside is not just `measure text faster`; it is unlocking new layouts:
  - width-tight cards and chips
  - obstacle-aware editorial panels
  - predictive panel sizing for embed and resize flows
  - development-time overflow checks for important labels and headings
- We now have a local default rollout on the workflow-breakdown and product-cycle card surfaces, plus a `layout=legacy` escape hatch for comparison and rollback.
- Recommendation: keep `Pretext` as the new local default for text-heavy card composition around charts, and keep the current chart primitives unless a later spike proves otherwise.

## Conclusion

`Pretext` has now earned three different roles in this repo:

1. **Direct `Pretext` surfaces**
   - Use the library where custom line layout is the product.
   - Proven fit so far: workflow breakdown and product-cycle narrative cards.
   - Best next fits: help/explainer panels, shipped detail layouts, and embed-first briefing compositions.

2. **Pretext-inspired architecture**
   - Even where we do not use the library, we should copy the core pattern:
     - prepare expensive layout facts once
     - keep resize/render paths arithmetic-only where possible
     - measure and snapshot the results

3. **Pretext-style validation**
   - Add layout canaries and benchmark snapshots, not just visual confidence.
   - This repo already has useful foundations for that.

## Opportunity Map

| Surface                               | Current file(s)                                                                  | Current pattern                                                          | Why upgrade                                                                             | Recommended path              |
| ------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------- |
| Workflow / lifecycle cards            | `dashboard-charts-product.js`, `dashboard-chart-core.js`, `dashboard-styles.css` | Fixed row grids, compact width branches, abbreviated labels              | Strong candidate for width-tight cards, denser summaries, predictive sizing             | Local default rollout         |
| Heavy-panel narrative shell           | `dashboard-heavy-panels.html`, `dashboard-styles.css`                            | Panel title + help + chart stacked conventionally                        | Good place for editorial layout, callouts, obstacle-aware story flow                    | Direct `Pretext` pilot        |
| Shipped detail list                   | `dashboard-charts-shipped.js`, `dashboard-styles.css`                            | Standard grid/list treatment                                             | Could benefit from tighter message bubbles and grouped detail blocks                    | Direct `Pretext` or hybrid    |
| Embed / resize behavior               | `dashboard-app.js`, `dashboard-chart-core.js`, `dashboard-styles.css`            | `requestAnimationFrame` rerender, compact viewport branches, min-heights | Strong candidate for predictive sizing and cheaper resize decisions                     | Pretext-inspired architecture |
| Chart legends / axis labels / markers | `dashboard-app.js`, `dashboard-charts-product.js`, `dashboard-chart-core.js`     | Width trimming, shorter labels, hidden ticks                             | Mixed upside; some wins possible, but chart redesign often beats text engine complexity | Hybrid / selective            |
| Raw SVG line geometry                 | `dashboard-app.js`, `dashboard-charts-product.js`                                | Width, margin, tick, and scale logic                                     | Mostly a chart-design problem, not a text-layout problem                                | Leave mostly as-is            |

## What We Should Be Willing To Replace

If the spikes succeed, we should be willing to replace parts of the current approach:

- viewport-only responsive decisions
- fixed card widths as the default sizing strategy
- label abbreviation as the first-line compact tactic
- static min-heights for some dense panels and embed cases
- DOM/CSS trial-and-error for new narrative surfaces

We should **not** assume the current mobile/compact layout branches are the final architecture.

## Current Constraints

### Technical

- The production dashboard is a static no-build app rooted at `index.html`.
- Core app logic lives in plain browser JS, not a bundler pipeline.
- `Pretext` ships browser-friendly logic, but direct production integration is more awkward here than in a bundled app.

### Architectural

- Current responsive behavior is mostly breakpoint-driven:
  - `dashboard-chart-core.js`
  - `dashboard-app.js`
  - `dashboard-charts-product.js`
  - `dashboard-styles.css`
- Current cards and rows are markup-driven with fixed grid columns and compact overrides.

## Requirements

### Must-Have

- R1. The upgrade must improve at least one production-relevant surface, not just a sandbox.
- R2. It must unlock a layout we currently do not express well with CSS + breakpoints alone.
- R3. Resize and orientation behavior must remain stable.
- R4. The solution must work with the repo’s current static hosting model or justify a scoped build step.
- R5. We must be able to benchmark and verify the improvement.

### Nice-To-Have

- R6. Reduce abbreviation and compact-only wording branches.
- R7. Make embed-mode and narrow-screen layouts more intentional.
- R8. Add development-time overflow checks for important labels/headings.

## Shapes

### Shape A: Standalone Lab + Production Pilot

- Build a local `Pretext` lab for dashboard-shaped layouts.
- Pilot one production-relevant card or narrative shell next.
- Lowest-risk path to real evidence.

### Shape B: Architecture-Only Upgrade

- Do not ship `Pretext` directly.
- Copy its prepare/render separation into our own layout view-model layer.
- Good if library integration friction is high but the model is clearly right.

### Shape C: Full Production Integration

- Add a bundling or vendoring story and use `Pretext` directly in the main dashboard.
- Highest upside, highest integration cost.

## Fit Check

| Req | Requirement                                                                                         | Status       | Shape A | Shape B | Shape C |
| --- | --------------------------------------------------------------------------------------------------- | ------------ | ------- | ------- | ------- |
| R1  | The upgrade must improve at least one production-relevant surface, not just a sandbox.              | Must-have    | ✅      | ✅      | ✅      |
| R2  | It must unlock a layout we currently do not express well with CSS + breakpoints alone.              | Must-have    | ✅      | ✅      | ✅      |
| R3  | Resize and orientation behavior must remain stable.                                                 | Must-have    | ✅      | ✅      | ⚠️      |
| R4  | The solution must work with the repo’s current static hosting model or justify a scoped build step. | Must-have    | ✅      | ✅      | ⚠️      |
| R5  | We must be able to benchmark and verify the improvement.                                            | Must-have    | ✅      | ✅      | ✅      |
| R6  | Reduce abbreviation and compact-only wording branches.                                              | Nice-to-have | ✅      | ✅      | ✅      |
| R7  | Make embed-mode and narrow-screen layouts more intentional.                                         | Nice-to-have | ✅      | ✅      | ✅      |
| R8  | Add development-time overflow checks for important labels/headings.                                 | Nice-to-have | ✅      | ✅      | ✅      |

## Recommendation

Start with **Shape A**, using **Shape B** principles from day one.

That means:

- build evidence in a standalone lab
- choose one production pilot
- keep the option open to integrate the real library later
- do not commit to a repo-wide build-step change unless the pilot proves the upside

## Pilot Order

1. **Pretext Layout Lab**
   - Goal: prove dashboard-relevant layouts, not generic typography demos.
   - Status: implemented in `experiments/pretext-layout-lab.html`.

2. **Workflow / lifecycle card pilot**
   - Candidate source files:
     - `dashboard-chart-core.js`
     - `dashboard-charts-product.js`
     - `dashboard-styles.css`
   - Goal: replace one fixed-grid compact treatment with a width-tight or editorial layout.

3. **Embed / heavy-panel narrative pilot**
   - Candidate source files:
     - `dashboard-heavy-panels.html`
     - `dashboard-app.js`
     - `dashboard-styles.css`
   - Goal: create one summary/callout panel that flows text around a focal metric or chart teaser.

## Success Metrics

### Product

- Less abbreviation on narrow and embedded surfaces
- Better information density without obvious clutter
- One new layout that looks intentionally designed rather than breakpoint-shrunk

### Technical

- No DOM-read hot path required for the pilot layout
- Stable rerender behavior on resize and orientation change
- Acceptable payload story for the chosen integration shape

### Verification

- Smoke screenshot coverage for the new surface
- Layout canary set for key labels/headings
- Benchmark snapshots for any added layout logic

## Existing Assets We Can Reuse

- Asset and route payload benchmark:
  - `scripts/benchmark-dashboard-assets.mjs`
- Screenshot smoke:
  - `scripts/smoke-dashboard-render.mjs`
- Resize scheduling path:
  - `dashboard-app.js`
- Existing card and chart surfaces for comparison:
  - `dashboard-chart-core.js`
  - `dashboard-charts-product.js`
  - `dashboard-heavy-panels.html`

## Immediate Implementation Added

- `experiments/pretext-layout-lab.html`
- `experiments/pretext-compare.html`
- `experiments/pretext-layout-lab.css`
- `experiments/pretext-layout-lab.js`
- default live workflow rollout at `?chart=pr`
- default live product-cycle rollout at `?chart=product-cycle&product-cycle-team=all&product-delivery-workflow-view=delivery`
- legacy override available with `layout=legacy`

This lab is intentionally standalone so we can test the real library and the real layout ideas without prematurely entangling the production dashboard.

## Go / No-Go Criteria

### Go

- The lab proves a layout we genuinely want in production.
- The workflow/lifecycle pilot reduces compact hacks or improves density meaningfully.
- Integration cost stays bounded.

### No-Go

- The win is cosmetic only.
- The best results are still easier with conventional CSS and chart redesign.
- The static-stack integration cost outweighs the value.

## Bottom Line

`Pretext` looks new and interesting because it changes what kinds of layouts are practical, not because it is a marginally faster text helper.

That is exactly why it is worth evaluating here. But we should evaluate it where its strengths actually matter:

- text geometry
- mixed composition
- editorial/dashboard shell layouts

Not every chart problem is a `Pretext` problem.
