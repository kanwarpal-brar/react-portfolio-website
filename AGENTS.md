# kanwarpal.com — Agent Guide

## Development

Start the dev server (zero dependencies):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`. No build step — edit files directly, refresh to see changes.

## Architecture

Single-page node-graph portfolio, state driven by `location.hash`. Navigation
is entirely mouse/touch/keyboard on the graph — there is **no terminal**.
The graph is a **pannable world** (`#world` inside `#graph`):

- Home sits at the world origin; the 5 sections (work/projects/resume/socials/
  cluster) sit at fixed slots around it (`render.js:SECTION_POS` — a squashed
  arrangement whose diagonal slots are nearly horizontal, so the wide expanded
  home clears them on the x-axis), and the active section's children fan out
  around the section (`#fan`). Exactly one node is focused at a time. The
  camera pan and the node's compact↔expanded size transition share one eased
  timing curve; `#world` receives `transform: translate()` via
  `--cam-x`/`--cam-y`.
- `#pnodes` — the 6 persistent nodes (home + 5 sections). Each holds a compact
  nav `<button>` (`.pn-compact`, shown normally) and an expanded content block
  (`.pn-expanded`, shown when `.is-focused`), both built once — CSS toggles
  which is visible, so focusing never rebuilds DOM. Sections with children
  (`.pnode-hub`: work/projects/socials) expand to a small title+tagline hub;
  childless sections (`.pnode-leaf`: resume/cluster) expand to full content.
- `#fan` — the active section's children (`.fnode`), created/destroyed by
  keyed reconciliation (`render.js:updateFan`) with the staggered
  enter/leave mechanic. A focused child glides `FOCUS_DIST` outward past its
  section as it expands; its siblings stay mounted but hidden (`.dimmed`).
- `#graph-lines` — SVG spokes inside `#world`: home→sections always, plus
  section→children while a fan is mounted. `render.js:drawSpokes` clips each
  line to the actual rendered node bounds. While a camera/node transition is
  running, it resamples those bounds each animation frame, so spokes remain
  exactly attached to the moving borders.
- `#card` — the collapsed/mobile fallback: a single scrolling card (with
  in-card child lists and breadcrumbs), shown only when the board collapses.

**Geometry is one scale factor, not iterative fitting** (`render.js:
applyGeometry`). Every node size and distance is defined at a reference scale
(s = 1) and multiplied by `s = boardScale(boardSize)` — so all clearances are
scale-invariant and `test/geometry.test.js` proves them once at the reference
scale instead of the runtime re-deriving boxes per frame. Sizes reach CSS as
custom properties (`--nc-w/h`, `--home-w/h`, `--hub-w/h`, `--leaf-w/h`,
`--child-w/h`, `--fan-w/h`); positions are world px in `--x`/`--y`. Expanded
boxes fix their width but hug content height up to the role cap (boxes only
ever get *smaller* than the proven size). Below `S_MIN` the board collapses
to the scrolling `#card` fallback.

Modules:

- `js/data.js` — single source of truth for all content (bios, work, projects)
- `js/content.js` — isomorphic HTML string builders consumed by both the
  browser (`render.js`) and the Node build script; no `document`/`window` refs
- `js/layout.js` — pure, DOM-free geometry (`boardScale`, square-wheel fan
  placement, generic `spokeLines` edge clipping); unit-tested via `node --test`
- `js/router.js` — hash↔state parsing (`{home}`/`{section}`/`{child}`), `navigate`
- `js/render.js` — the `render(state)` pipeline: keyed fan reconciliation,
  rAF-coalesced scale/positions/camera/spokes, collapse gating; owns the
  reference-scale geometry constants
- `js/main.js` — entry point, wires routing + graph clicks + Esc + ResizeObserver

`index.html` is a **generated build artifact** — never hand-edit it. It's
built from `index.template.html` + `js/data.js` + `js/content.js` by
`node scripts/build.mjs`. Edit `index.template.html` for shell/meta changes.

6 top-level nodes: home, work, projects, resume, socials, cluster. Navigate by
clicking nodes / fan items / in-card boxes; a bare-board click or `Esc` climbs
back toward home. Every navigation pans the camera and animates the focused
node's expand/collapse in place.

## Verification

1. Start dev server: `python3 -m http.server 8000`
2. Use Playwright to navigate to `http://localhost:8000/`
3. Take accessibility snapshot and screenshot
4. Verify: all 6 nodes render, hash routing works (`#/work`, `#/projects`,
   `#/projects/hive`), the camera pans to center the focused node, every
   visible connector meets both node borders, and no two on-screen boxes overlap
5. Check browser console for errors
6. Test responsive at 1440px, 1366×768, 900px, 600px, 390px — sections fan out
   their children when the scale allows and collapse to a scrolling card+list
   below `S_MIN`
7. Run `node --test` and confirm the `js/layout.js` unit tests pass
8. If `js/data.js`/`js/content.js`/`index.template.html` changed, run
   `node scripts/build.mjs --check` and confirm it reports clean before committing

## Content Updates

Edit `js/data.js` — this updates the live (JS-rendered) view immediately on
refresh. Then run `node scripts/build.mjs` (or `npm run build`) to regenerate
the committed `index.html` (prerendered/no-JS content + SEO meta), and commit
the result. CI's `node scripts/build.mjs --check` fails the build if
`index.html` is stale.

## Deployment

Push to `main` → GitHub Actions runs the `index.html` parity check
(`node scripts/build.mjs --check`), then deploys to GitHub Pages at
`kanwarpal.com`.
