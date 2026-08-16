# kanwarpal.com — Agent Guide

See [`PLAN.md`](PLAN.md) for design philosophy and implementation notes.

## Development

Start the dev server (zero dependencies):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`. No build step — edit files directly, refresh to see changes.

`index.html` is a **generated build artifact** — never hand-edit it. It is
built from `index.template.html` + `js/data.js` + `js/content.js` by
`node scripts/build.mjs`. Edit `index.template.html` for shell/meta changes.

## Verification

1. Start dev server: `python3 -m http.server 8000`
2. Use Playwright to navigate to `http://localhost:8000/`
3. Take accessibility snapshot and screenshot
4. Verify hash routing (`#/work`, `#/projects`, `#/projects/hive`), no overlaps
   or off-board cards, panels do not scroll, and edge count == visible − 1
5. Check browser console for errors and test Tab/Enter/Esc. Keyboard activation
   must leave focus on the visible focused `.panel`, not `<body>`
6. Test 1440×900, 1366×768, 1280×800, 1024×768, 900×700 and 390×844 viewports

   Measure **settled** layout, not mid-pan: emulate reduced motion (or wait out
   the pan transition), or a probe will report false overlaps during it.
7. Verify a parent keeps its true bearing: if `A → B` goes down-left, then from
   `B`, `A` must be up-right.
8. Verify the pan is **rigid**: sample a node's screen position before and after
   navigating and confirm every node moved by the same delta.
9. Verify all edges are present in every world view, and that no two on-board
   cards overlap.
10. Run `node --test` and confirm the `js/layout.js` unit tests pass
11. If `js/data.js`/`js/content.js`/`index.template.html` changed, run
    `node scripts/build.mjs --check` and confirm it reports clean before committing
12. Run a Lighthouse audit (accessibility, best-practices, SEO) against the
    dev server

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
