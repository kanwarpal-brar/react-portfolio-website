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
is native mouse/touch/keyboard link navigation — there is **no terminal** and
no camera pan.

- `#nodes` contains **all 28 nodes once**. Each `.node` holds a compact native
  `<a>` (`.node-link.compact`) and a sibling full-detail `.panel`. They are
  siblings so panel links (resume, GitHub, email) are valid nested-free HTML.
- `render(state)` derives three roles: `focus`, `ring`, and `hidden`. The focus
  is a measured numeric-width/numeric-height detail panel; ring nodes are
  uniform `176×76` cards; hidden nodes are `inert`.
- `js/layout.js:ringPositions` places ring cards on an equal-arc ellipse then
  pushes them radially until they clear the focus panel. It returns `null`
  rather than overlap; the renderer then selects the CSS flow presentation.
- `#graph-lines` holds centre-to-centre decorative SVG lines. Opaque cards
  overpaint their endpoints. A short rAF pass follows the 420ms CSS transition
  so lines stay visually attached while nodes move.
- At `≤900px`, or if geometry cannot fit, the **same node DOM** becomes a
  normal scrolling flow column. `html.nojs` uses that same presentation — no
  card fallback or duplicate prerender tree exists.

Modules:

- `js/data.js` — single source of truth for all content and `TREE`
- `js/content.js` — isomorphic one-node-set markup and titles
- `js/layout.js` — pure derived ring geometry + edge coordinate helpers
- `js/router.js` — hash↔state parsing (`{home}`/`{section}`/`{child}`)
- `js/render.js` — roles, panel measurement, layout search, SVG edges
- `js/main.js` — boot, hashchange, `Esc`, background click, resize

`index.html` is a **generated build artifact** — never hand-edit it. It is
built from `index.template.html` + `js/data.js` + `js/content.js` by
`node scripts/build.mjs`. Edit `index.template.html` for shell/meta changes.

Home, work, projects, resume, socials and cluster are top-level nodes. A bare
board click returns home; `Esc` climbs child → section → home. Navigation
animates panel/card position and numeric size; reduced motion disables it.

## Verification

1. Start dev server: `python3 -m http.server 8000`
2. Use Playwright to navigate to `http://localhost:8000/`
3. Take accessibility snapshot and screenshot
4. Verify hash routing (`#/work`, `#/projects`, `#/projects/hive`), focus/ring
   geometry has no overlaps or off-board cards, panels do not scroll, and edges
   stay attached during the 420ms transition
5. Check browser console for errors and test Tab/Enter/Esc
6. Test 1440×900, 1366×768, 1280×800, 1024×768, 900×700 and 390×844 — the ring
   appears only when it fits; otherwise the same 28-node DOM is a flow column
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
