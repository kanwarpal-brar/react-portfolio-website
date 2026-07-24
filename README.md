# kanwarpal.com

A minimal, terminal-inspired (TUI) portfolio for Kanwarpal Brar. Single-page,
plain HTML + CSS + vanilla JavaScript (ES modules). No runtime dependencies —
`package.json` exists only so Node treats `js/*.js` as ES modules for the
build script and unit tests.

Live at https://kanwarpal.com.

## Layout

A five-node ring (work, projects, resume, socials, cluster) sits around a
centered content card. The work/projects hub views also show a radial
"wheel" of child nodes (title + short description + tags/dates, capped at
`WHEEL_CAP`) placed as close to the (small) hub card as it can get without
crowding the ring or its own neighbors. Click a ring node, wheel item, or
in-card box to navigate; click the bare board or press `Esc` to climb back
toward home. Every navigation animates the card entrance, growing from the
clicked node's on-screen position.

The card and wheel are sized **inward from the measured ring** each frame
(`render.js:applyGeometry` + `layout.js:largestClearRect`), so they always
keep a gap to the ring at any viewport; when the ring + wheel + card can't
nest, the board collapses to a single scrolling card (sections then list
their children in-card so touch users can still drill in).

State is driven by `location.hash` (`#/home`, `#/work`, `#/projects/hive`,
...) so back/forward and deep-links work.

## Project structure

```
assets/              Resume PDF, headshot (webp), favicon (svg)
css/                  theme.css (tokens) + style.css (layout/components/motion)
js/                   data.js, content.js, layout.js, router.js, render.js,
                      flip.js, main.js  (all ES modules)
test/                 node --test unit tests for js/layout.js
scripts/build.mjs     Generates index.html from index.template.html + js/data.js + js/content.js
index.template.html   Page shell template (edit this, not index.html)
index.html            GENERATED build artifact — never hand-edit
.github/workflows/deploy.yml  CI build-parity check + static deploy to GitHub Pages
CNAME, robots.txt, sitemap.xml, .nojekyll
```

## Local development

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static server works. Editing `js/data.js` updates the live (JS-rendered)
view immediately on refresh — no build step needed for that.

## Updating content

All text content lives in `js/data.js` — the single source of truth. After
editing it, regenerate the committed `index.html` (used for SEO and the
no-JS fallback) and commit the result:

```bash
npm run build   # node scripts/build.mjs
```

CI runs `node scripts/build.mjs --check` and fails the deploy if `index.html`
is stale relative to `js/data.js`/`js/content.js`/`index.template.html`.

To add a project or work entry: append it (with a unique `id`) to the
relevant array in `js/data.js`, add that `id` to `TREE.<parent>.children`,
then run the build.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs the
build-parity check, then stages the site into `_site/` (excluding dev-only
files like `README.md`, `LICENSE`, `scripts/`, `test/`) and uploads it as a
GitHub Pages artifact. The `CNAME` file at the repo root keeps the
`kanwarpal.com` custom domain.

Note: the first deploy after switching DNS/workflow may serve stale content
from the GitHub Pages CDN for a few minutes — that's normal.

## License

See `LICENSE`.
