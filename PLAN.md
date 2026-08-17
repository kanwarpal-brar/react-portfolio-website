# PLAN.md — design philosophy + current implementation, as bullets

Not a claim of correctness — this documents current behavior, not a
guarantee against future bugs. Issues get found and fixed opportunistically,
not tracked as a backlog here.

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

- One rigid world: every node has a fixed `{x, y}` (`buildGraph` +
  `buildWorld`); navigation only moves a camera (`cameraFor`), never
  re-places a node.
- Children sit on a rectangular frame around their parent (`framePoint` /
  `frameFraction`), not an ellipse — boards are wide and panels are tall, so
  a frame keeps slots at the left/right edges where the room actually is.
- The parent's own slot on that frame is anchored to its true world
  direction, so a node's bearing to its parent is fixed once and never flips
  between views.
- Frame search (`buildWorld`): shrinks from full board size down to a floor
  sized to the node's own panel, trying several rotations per size — largest
  frame wins so the board reads as one connected map, not a hollow ring.
- `viewIsValid` requires **every** neighbour (parent + all children) to fit
  on-board and clear both the focused panel and every other neighbour card —
  affordable because a view only ever has to fit focus + parent + children
  (`visibleFor`), never a whole branch's grandchildren.
- `occludedBy` is a safety net on top of `visibleFor`: it hides a visible
  node the focused panel would still cover — not the primary hiding
  mechanism.
- `buildWorld` returns `null` when nothing fits; the caller falls back to
  the flow presentation.
- `stubEdge` hints that a parent card's own map continues past what this
  view draws: one line from the parent's boundary, in the averaged unit
  direction of the parent's *other* neighbours — `null` when focus has no
  parent (`home`) or those neighbours have no clear common direction.

## Rendering (`js/render.js`)

- Per-node panel size measured off-screen at 11 candidate widths
  (`PANEL_WIDTHS`), fit individually with a tolerance (`REFLOW_TOLERANCE`) so
  short content gets a small panel, not a forced uniform width.
- World candidates scored by how close neighbour spacing is to a target edge
  gap (`EDGE_GAP`); the best-scoring candidate across all panel-width
  ceilings wins (`fillScore` / `solveWorld`).
- Only the focused node's own star — itself, its parent, its children
  (`visibleFor`) — is ever drawn or interactive; everything else gets
  `data-hidden` + `inert`, not dimmed. `data-role` is `focus` / `linked`
  only.
- Edges recompute on every navigation, not just on resize (`edgeKey` folds
  in `focus`): only lines touching the current focus are drawn, tagged `up`
  (the backlink, `to === focus`) or `down` (onward) so the way back reads
  distinctly from paths forward; a non-null `stubEdge` (`js/layout.js`) adds
  one more muted line hinting the map continues past the parent
  (`drawEdges`).
- Camera-only transform (`--cam-x`/`--cam-y`) on pan; node sizes are
  measured px, never `auto`, so growth/shrink can animate.
- Below `1100px` (`FLOW_QUERY`), or if no world fits, falls back to a static
  flow column using the same DOM — no separate no-JS markup; `html.nojs`
  shares the same CSS path.
- The world solver is per-board: boards with enough room (1440×900 and up)
  get the graph, and shorter but still feasible boards (1366×768, 1280×800)
  render the world too — overflow is clipped by `#graph`'s `overflow: hidden`
  since the board is a window onto a larger map. Only ≤1100px-wide viewports,
  or boards the solver cannot host, fall back to flow.

## Interaction (`js/main.js`)

- Keyboard Enter/Space intent tracked separately from `hashchange` so focus
  lands on the newly-focused panel, not `<body>`.
- Mouse activation does not steal keyboard focus.
- `Esc` climbs child → section → home; empty-board click returns home.
- `ResizeObserver` invalidates the cached world and re-solves on resize.
- `boot()` re-enables transitions with a double `requestAnimationFrame`
  after the first `render()` call — one frame to land after the first
  paint, then removing the static `data-boot` attribute — so a cold load
  can never animate from an unpainted state (see Motion).

## Motion (`css/theme.css`, `css/style.css`)

- Camera pan (`--t-pan: 637.5ms`) is the primary motion. Node resize
  (`--t-size: 487.5ms`) starts almost immediately (`--d-arrive`, 8% of the
  pan) and spans nearly the whole pan, so the focused card visibly grows
  *while* the camera is still moving, rather than sitting compact for most
  of the pan and bursting open in a short tail once the camera has already
  stopped. Neighbour fade (`--t-fade: 165ms`) is shorter still.
- Children appearing or disappearing around a focused node get their own
  motion (`--t-pop: 320ms`): populating cards grow `scale: 0.94 → 1` on
  `var(--ease)` (not the camera's `--ease-pan`), and departing cards shrink
  back out over `--t-fade`. This decouples the population from the camera
  curve that made the reveal read as a binary pop.
- The very first render is transition-free: `#graph[data-boot]` suppresses
  all node/layer/panel transitions until `boot()` clears it (see
  Interaction).
- `prefers-reduced-motion: reduce` disables all transitions/animations.

## Build / verification

- `index.html` generated from `index.template.html` + data/content by
  `scripts/build.mjs`; `--check` enforces parity in CI.
- `test/layout.test.js` — pure geometry/graph unit tests via `node --test`,
  no DOM.
