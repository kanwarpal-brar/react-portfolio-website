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
`#graph` contains three concentric bands plus an SVG spoke overlay:

- `#graph-lines` — dashed spokes from the card to each ring node (and, in
  section/child views, to each wheel node)
- `#ring` — 5 persistent section buttons (work/projects/resume/socials/cluster)
  in fixed pentagon slots; dimmed but always clickable outside home
- `#wheel` — radial child-menu buttons, shown only in section (hub) views for
  work/projects (capped at `WHEEL_CAP`, currently 10 — covers every child so
  none is desktop-unreachable), placed on a rectangular frame sized to clear
  `#card` and the ring. Hidden in child (detail) views so the detail card gets
  the full board.
- `#card` — centered, focused content for the current view

**Geometry is derived inward from the fixed ring** (`render.js:applyGeometry`).
Each frame it measures the ring nodes, then computes the largest centered card
(`layout.js:largestClearRect`) that clears every ring node by `GAP_RING`. For
work/projects (wheel visible) it first carves out the wheel band and caps the
card small (`SECTION_CARD_MAX`) — the wheel carries the content, so the hub
card only needs a short lede. For home/leaf/child (no wheel) the card fills
the ring envelope up to a per-view cap, then `fitCardHeight` shrinks it to the
content's natural height (never below `CARD_MIN`) so short content doesn't
leave a tall empty card. The card's size is written as `--card-w`/`--card-h`
CSS vars. If the composition can't nest with a minimum-size card, the board
`.collapsed`s to a single scrolling card (whose section body reveals an in-card
child list — `.sec-list` — so touch users can still reach children). This makes
spacing correct at any viewport instead of depending on hard-coded percentages.

**The wheel frame is derived from the CARD, clamped by the RING.** Rather than
always parking wheel items out at the ring-clearing ceiling (which left a dead
gap between a small hub card and a far-out wheel), `applyGeometry` first
computes the closest radius the items can sit to the card (`GAP_CARD` out from
`SECTION_CARD_MAX`), then grows that radius outward — never past the
ring-clearing ceiling — only as far as needed for every wheel item to clear
its neighbors (`wheelItemsClear`, since `squareWheelPositions` spaces items by
arc length and a radius sized only for the card can still be too tight for
many items). If items still can't all clear each other at the ring ceiling,
the board collapses rather than render overlapping boxes.

Modules:

- `js/data.js` — single source of truth for all content (bios, work, projects)
- `js/content.js` — isomorphic HTML string builders consumed by both the
  browser (`render.js`) and the Node build script; no `document`/`window` refs
- `js/layout.js` — pure, DOM-free geometry (ring slots, `largestClearRect`,
  square-wheel placement, spoke clipping); unit-tested via `node --test`
- `js/router.js` — hash↔state parsing (`{home}`/`{section}`/`{child}`), `navigate`
- `js/render.js` — the `render(state)` pipeline: keyed wheel reconciliation,
  rAF-coalesced ring-derived card/wheel sizing and collapse gating
- `js/flip.js` — card entrance animations: `flipCardFrom` (grow from the
  clicked node) and `flipCardEnter` (settle-in when returning home / no source);
  both no-op under `prefers-reduced-motion`
- `js/main.js` — entry point, wires routing + graph clicks + Esc + ResizeObserver

`index.html` is a **generated build artifact** — never hand-edit it. It's
built from `index.template.html` + `js/data.js` + `js/content.js` by
`node scripts/build.mjs`. Edit `index.template.html` for shell/meta changes.

6 top-level nodes: home, work, projects, resume, socials, cluster. Navigate by
clicking ring nodes / wheel items / in-card boxes; a bare-board click or `Esc`
climbs back toward home. Every navigation animates the card entrance.

Responsive breakpoints: 900px (tablet), 600px (mobile), max-height 500px (landscape phone).

## Verification

1. Start dev server: `python3 -m http.server 8000`
2. Use Playwright to navigate to `http://localhost:8000/`
3. Take accessibility snapshot and screenshot
4. Verify: all 6 nodes render, hash routing works (`#/work`, `#/projects`,
   `#/projects/hive`), and the card clears the ring/wheel with a visible gap
5. Check browser console for errors
6. Test responsive at 1440px, 1366×768, 900px, 600px, 390px — sections show the
   radial wheel when it fits and collapse to a scrolling card+list when it can't
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