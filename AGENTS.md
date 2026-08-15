# kanwarpal.com — Agent Guide

> **Graph rebuild complete.** [`PLAN.md`](PLAN.md) records the decisions and
> verification evidence; [`SPEC.md`](SPEC.md) holds durable requirements. This
> file describes the implementation now in the repository.

## Development

Start the dev server (zero dependencies):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`. No build step — edit files directly, refresh to see changes.

## Architecture

Single-page node-graph portfolio, state driven by `location.hash`. Navigation
is native mouse/touch/keyboard link navigation — there is **no terminal**.

The graph is **one rigid world moved by a camera**. Every node has a fixed
world coordinate; navigating only translates the camera so the focused node
lands at board centre. Nothing is re-placed per view. This is deliberate and
load-bearing: an earlier version rebuilt a ring per route, which re-slotted a
node's parent into the bottom position and made the parent look like a child.

- `#nodes` contains **all 28 nodes once**. Each `.node` holds a compact native
  `<a>` (`.node-link.compact`) and a sibling full-detail `.panel`. They are
  siblings so panel links (resume, GitHub, email) are valid nested-free HTML.
- **The whole map is always drawn.** All 28 nodes and all 27 edges are rendered
  in every view; only emphasis changes. `render(state)` marks `focus`, `linked`
  (parent plus children) and `distant`, and `data-depth` carries hop distance so
  CSS dims by distance. A view is a window onto the map, not a fresh star: nodes
  are free to sit past the board edge and be clipped.
- The only nodes withheld are those the focused panel would cover
  (`layout.js:occludedBy`); they are also made `inert` so they cannot be tabbed
  to while invisible.
- `js/layout.js:buildWorld` places each node's children on a **rectangular
  frame** around it, satisfying: each child clears the parent's panel, the
  parent card clears each child's own panel, neighbours clear each other, and
  the placement clears **every other node in the world**. That last rule is
  what the always-visible map requires — an earlier version only separated
  co-visible nodes and silently let branches from different sections overlap.
  Children that would land on another branch are pushed outward along their own
  spoke (preserving the edge direction) but never so far that their parent
  leaves the board. A frame is used rather than an ellipse because boards are
  wide but short and panels are tall: the room is at the sides.
- The parent's slot is anchored to its **true world direction**, so bearings
  stay globally consistent and a parent is never re-slotted below its child.
- The root's ring is deliberately confined to `ROOT_RING_ROOM` (62%) of the
  board. Letting home claim the full board is greedy: it looks generous on the
  home view but leaves `work` (10 children) with nowhere to put its subtree,
  and the solver has no backtracking.
- `#graph-lines` shares the camera transform with `#nodes`, so edges are drawn
  once in world space and pan welded to their cards. No per-frame redraw loop.
  Edges are re-emitted only when the world changes, and are ranked
  focus/near/far for emphasis.
- Panels are fitted **per node**: a leaf with one line gets a small panel, and
  only long content earns a wide one. Candidate worlds are scored against a
  target `EDGE_GAP` (36px), penalising both edge-hugging and centre-huddling,
  so the board is filled without cards touching the frame.
- At `≤1100px`, or if geometry cannot fit, the **same node DOM** becomes a
  normal scrolling flow column. `html.nojs` uses that same presentation — no
  card fallback or duplicate prerender tree exists. In practice the map needs
  roughly 860px of board height, so shorter desktops (1366×768, 1280×800) use
  flow; 1440×900 and taller get the map.

Modules:

- `js/data.js` — single source of truth for all content and `TREE`
- `js/content.js` — isomorphic one-node-set markup and titles
- `js/layout.js` — pure rigid-world geometry, camera, visibility, edge data
- `js/router.js` — hash↔state parsing (`{home}`/`{section}`/`{child}`)
- `js/render.js` — roles, panel measurement, world solve/cache, camera, edges
- `js/main.js` — boot, hashchange, `Esc`, background click, resize

`index.html` is a **generated build artifact** — never hand-edit it. It is
built from `index.template.html` + `js/data.js` + `js/content.js` by
`node scripts/build.mjs`. Edit `index.template.html` for shell/meta changes.

Home, work, projects, resume, socials and cluster are top-level nodes. A bare
board click returns home; `Esc` climbs child → section → home.

Motion is a camera move, tokenised in `css/theme.css`: `--t-pan` (700ms) with
`--ease-pan`, neighbours fading in mid-pan (`--d-neighbour`) and the focused
panel growing from `--d-arrive` (72% of the pan) so travel and arrival overlap
into one gesture. Sizes are always numeric px, never `auto`, so width/height
interpolate. Reduced motion disables all of it.

Keyboard focus moves to the newly focused `.panel`, but that panel fades in
*behind* the pan — and a `visibility: hidden` element cannot take focus, so
`render.js` waits for visibility instead of focusing on the next frame.

## Verification

1. Start dev server: `python3 -m http.server 8000`
2. Use Playwright to navigate to `http://localhost:8000/`
3. Take accessibility snapshot and screenshot
4. Verify hash routing (`#/work`, `#/projects`, `#/projects/hive`), no overlaps
   or off-board cards, panels do not scroll, and edge count == visible − 1
5. Check browser console for errors and test Tab/Enter/Esc. Keyboard activation
   must leave focus on the visible focused `.panel`, not `<body>`
6. Test 1440×900, 1366×768, 1280×800, 1024×768, 900×700 and 390×844 — the world
   appears only when it fits; otherwise the same 28-node DOM is a flow column

   Measure **settled** layout, not mid-pan: emulate reduced motion (or wait out
   `--t-pan`), or a probe will report false overlaps during the transition.
7. Verify a parent keeps its true bearing: if `A → B` goes down-left, then from
   `B`, `A` must be up-right. This is the regression that motivated the model.
8. Verify the pan is **rigid**: sample a node's screen position before and after
   navigating and confirm every node moved by the same delta. If deltas differ,
   something is re-placing nodes per view and the "one graph" illusion is gone.
9. Verify all 27 edges are present in every world view, and that no two on-board
   cards overlap (the map is fully drawn, so overlap is a global property).
10. Run `node --test` and confirm the `js/layout.js` unit tests pass
11. If `js/data.js`/`js/content.js`/`index.template.html` changed, run
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
