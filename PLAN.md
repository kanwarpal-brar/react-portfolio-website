# PLAN.md — design philosophy + current implementation, as bullets

Current behavior only — not a backlog, not a correctness guarantee.

## Product

- Single-page portfolio; content lives in `js/data.js`.
- 28 nodes: `home` + 5 sections (`work`, `projects`, `resume`, `socials`,
  `cluster`) + 22 leaf children under `work`/`projects`/`socials`.
- Hash routing (`js/router.js`): `#/home`, `#/work`, `#/projects/hive`, etc.
- Zero runtime dependencies; static hosting (GitHub Pages), no server; build
  tooling is just `node scripts/build.mjs`.

## Core philosophy

- Simple code: plain ES modules + CSS custom properties; no frameworks,
  bundlers, or graph/animation libraries.
- Graph aesthetic: nodes + SVG edges, not tabs/menus/breadcrumbs.
- Viewport traverses the graph: nodes expand/shrink on focus; the whole
  graph never has to be visible at once.

## Content / data

- `js/data.js`: single source of truth — `TREE` (no `parent` field) +
  per-kind arrays (work, projects, extra, socials).
- `js/content.js`: pure markup builder shared by browser + Node build;
  derives parent lookups, ids, routes, panel HTML from `data.js`.
- `js/router.js`: hash ↔ state, independent of rendering.
- DOM: `.node` wraps sibling `<a class="node-link compact">` +
  `<section class="panel">` — siblings, not nested, so panel content can
  hold real links.

## Graph model (`js/layout.js`)

- One rigid world: every node has a fixed `{x, y}` (`buildGraph`/
  `buildWorld`); navigation moves a camera (`cameraFor`), nodes never
  re-place.
- Children sit on a rectangular frame around their parent (`framePoint`/
  `frameFraction`), not an ellipse; a node's slot on its parent's frame is
  anchored to its true world direction, so bearing never flips between
  views.
- `buildWorld`: frame search shrinks from full board size to the node's own
  panel size, trying several rotations per size; largest frame wins.
  Returns `null` when nothing fits → caller falls back to flow.
- `viewIsValid`: every neighbour (parent + children) must fit on-board and
  clear the focused panel + each other — affordable since a view only
  needs focus + parent + children (`visibleFor`), never deeper.
- `occludedBy`: safety net hiding a visible node the focused panel still
  covers.
- `stubEdge`: one line hinting a parent's map continues past this view,
  toward the averaged direction of its other neighbours; `null` for `home`
  or cancelling directions.

## Rendering (`js/render.js`)

- Panel size measured off-screen at 11 candidate widths (`PANEL_WIDTHS`),
  each fit with tolerance (`REFLOW_TOLERANCE`).
- World candidates scored by neighbour-spacing vs. a target edge gap
  (`EDGE_GAP`); best score across all panel-width ceilings wins
  (`fillScore`/`solveWorld`).
- Only focus + parent + children (`visibleFor`) are drawn/interactive;
  everything else gets `data-hidden` + `inert`, not dimmed.
- Edges recompute per navigation (`edgeKey` folds in `focus`): only lines
  touching focus are drawn, tagged `up` (backlink) or `down` (onward); a
  non-null `stubEdge` adds one muted line (`drawEdges`).
- Camera-only transform (`--cam-x`/`--cam-y`); node sizes are measured px,
  never `auto`, so growth/shrink animates.
- Falls back to a static flow column (same DOM, no separate no-JS markup)
  below `1100px` (`FLOW_QUERY`) or when no world fits; 1440×900, 1366×768,
  and 1280×800 all render the graph (overflow clipped by `#graph`).

## Interaction (`js/main.js`)

- Keyboard Enter/Space intent tracked separately from `hashchange`, so
  focus lands on the new panel, not `<body>`; mouse activation doesn't
  steal it.
- `Esc` climbs child → section → home; empty-board click returns home.
- `ResizeObserver` invalidates the cached world and re-solves on resize.
- `boot()`: double `requestAnimationFrame` after the first `render()`
  removes the static `data-boot` attribute one frame after first paint
  (see Motion).

## Motion (`css/theme.css`, `css/style.css`)

- Pan `--t-pan: 478ms`; resize `--t-size: 366ms` starts at 8% of the
  pan (`--d-arrive`) and spans nearly all of it, so growth overlaps travel
  instead of bursting open at the end. Fade `--t-fade: 165ms`.
- Population `--t-pop: 320ms`: populating cards scale `0.94 → 1` on
  `var(--ease)`; departing cards shrink back over `--t-fade`.
- `data-boot` suppresses all transitions on first render (see Interaction).
- `prefers-reduced-motion: reduce` disables all transitions/animations.

## Build / verification

- `index.html` generated from `index.template.html` + data/content by
  `scripts/build.mjs`; `--check` enforces parity in CI.
- `test/layout.test.js`: pure geometry/graph unit tests via `node --test`,
  no DOM.
