# PLAN.md — design philosophy + current implementation, as bullets

Not a claim of correctness. Numerous issues remain, informing future work.

## Product

- Single-page portfolio. Content: `js/data.js`.
- 28 nodes: `home`, 5 sections (`work`, `projects`, `resume`, `socials`,
  `cluster`), 22 leaf children under `work`/`projects`/`socials`.
- Routing: `location.hash` — `#/home`, `#/work`, `#/projects/hive`, etc.
  (`js/router.js`).
- Zero runtime dependencies, no build tooling beyond `node scripts/build.mjs`.
- Static hosting (GitHub Pages), no server.

## Core philosophy

- **A. Simple code.** No frameworks, bundlers, or graph/animation libraries.
  Plain ES modules + CSS custom properties. Static hosting only.
- **B. Graph aesthetic.** Nodes + edges, drawn as such (SVG lines between
  cards) — not tabs, menus, or breadcrumbs standing in for a graph.
- **C. Viewport traverses the graph.** Nodes expand/shrink on
  activate/deactivate. The full graph does **not** need to be visible at
  once — the viewport is a window, not a canvas that must contain everything.

## Content / data

- `js/data.js` — single source of truth: `TREE` (home + 5 sections,
  no `parent` field), plus per-kind data arrays (work, projects, extra,
  socials).
- `js/content.js` — pure markup builder, shared by browser and Node build.
  Derives `parent` lookups, node ids, routes, panel HTML from `data.js`.
- `js/router.js` — hash ↔ state, independent of rendering.
- DOM shape: `.node` wraps a compact `<a class="node-link compact">` and a
  sibling `<section class="panel">` — siblings, not nested, so panel content
  can contain real `<a>` links.

## Graph model (`js/layout.js`)

- One rigid world: every node has a fixed `{x, y}`; navigation moves a
  camera, never re-places nodes.
- Children placed on a rectangular frame around their parent (not an
  ellipse), angle-anchored to the parent's real direction.
- Frame search: shrink from full size, multiple rotations, then per-child
  outward push to avoid other branches.
- Constraints enforced: parent-panel clearance, child's-own-panel clearance,
  sibling clearance, clearance vs. every other placed node (global, not just
  local family).
- Root ring capped at a fraction of the board (`ROOT_RING_ROOM = 0.62`) so
  busy hubs (`work`, 10 children) have room for their own subtree.
- Off-board / distant nodes are permitted; only nodes the focused panel
  would visually cover are suppressed (`occludedBy`), and made `inert`.
- Hop-distance dimming (`distancesFrom`) via `data-depth`, capped at
  `MAX_DIM_TIER = 3`.
- Falls back to `null` → caller uses flow layout when no world fits.

## Rendering (`js/render.js`)

- Per-node panel size measured off-screen at 11 candidate widths
  (`PANEL_WIDTHS`), fit individually with a tolerance (`REFLOW_TOLERANCE`)
  so short content gets a small panel, not a forced uniform width.
- World candidates scored by how close neighbor spacing is to a target edge
  gap (`EDGE_GAP = 36`); best-scoring candidate wins.
- All 28 nodes + all 27 edges rendered persistently in every view;
  `data-role` (`focus`/`linked`/`distant`) and `data-depth` (hop distance)
  drive CSS emphasis/dimming.
- Camera-only transform (`--cam-x`/`--cam-y`) on pan; node sizes are numeric
  px (measured), never `auto`, so growth/shrink can animate.
- Below `1100px` viewport width (`FLOW_QUERY`), or if no world fits the
  board, falls back to a static flow column using the same DOM — no
  separate no-JS markup; `html.nojs` uses the same CSS path.
- In practice the world needs roughly 860px of board height, so 1366×768 and
  1280×800 fall back to flow; 1440×900 and taller get the graph.

## Interaction (`js/main.js`)

- Keyboard Enter/Space intent tracked separately from `hashchange` so focus
  lands on the newly-focused panel, not `<body>`.
- Mouse activation does not steal keyboard focus.
- `Esc` climbs child → section → home; empty-board click returns home.
- `ResizeObserver` invalidates the cached world and re-solves on resize.

## Motion (`css/theme.css`, `css/style.css`)

- Camera pan (`--t-pan: 700ms`) is the primary motion; node resize
  (`--t-size: 400ms`) and neighbor fade (`--t-fade: 220ms`) are shorter and
  timed to overlap with pan arrival (focused panel starts growing at 72% of
  the pan, `--d-arrive`).
- `prefers-reduced-motion: reduce` disables all transitions/animations.

## Build / verification

- `index.html` generated from `index.template.html` + data/content by
  `scripts/build.mjs`; `--check` enforces parity in CI.
- `test/layout.test.js` — pure geometry/graph unit tests via `node --test`,
  no DOM.
