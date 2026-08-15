# kanwarpal.com

A minimal, terminal-inspired (TUI) portfolio for Kanwarpal Brar. Single-page,
plain HTML + CSS + vanilla JavaScript (ES modules). No runtime dependencies —
`package.json` exists only so Node treats `js/*.js` as ES modules for the
build script and unit tests.

Live at <https://kanwarpal.com>.

> **Rebuild complete.** [`PLAN.md`](PLAN.md) records the architecture,
> implementation steps, review findings, and verification evidence. [`SPEC.md`](SPEC.md)
> holds the durable requirements the implementation satisfies.

## The idea

The site is a **node graph**. Nodes are connected by edges; some nodes have
children; clicking a node navigates to it with an animated transition.

- **Home** is the root node.
- Five sections branch off it: **work**, **projects**, **resume**, **socials**,
  **cluster**.
- `work`, `projects` and `socials` have children (individual roles, projects and
  profiles). `resume` and `cluster` are leaves.
- The focused node shows its full content; the others stay on the board as
  compact cards so you can see where you are and where you can go.

State is driven by `location.hash` (`#/home`, `#/work`, `#/projects/hive`, …),
so deep links, back/forward and open-in-new-tab all work. Narrow viewports
render the same content as a single scrolling column instead of a graph.

## Project structure

```text
assets/               Resume PDF, headshot (webp), favicon (svg)
css/                  theme.css (tokens) + style.css (layout/components/motion)
js/                   data.js, content.js, layout.js, router.js, render.js,
                      main.js  (all ES modules)
test/                 node --test unit tests for the pure geometry
scripts/build.mjs     Generates index.html from index.template.html + js/data.js + js/content.js
index.template.html   Page shell template (edit this, not index.html)
index.html            GENERATED build artifact — never hand-edit
PLAN.md               Rebuild plan (layout algorithm, steps, risks)
SPEC.md               Durable requirements
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

Content should fit its panel without scrolling — if an entry is long enough to
overflow, shorten the copy rather than making the panel scroll.

## Tests

```bash
node --test
```

The geometry is pure and DOM-free, so the layout rules are unit-tested directly.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs the
build-parity check, then stages the site into `_site/` (excluding dev-only
files like `README.md`, `PLAN.md`, `SPEC.md`, `LICENSE`, `scripts/`, `test/`)
and uploads it as a GitHub Pages artifact. The `CNAME` file at the repo root
keeps the `kanwarpal.com` custom domain.

Note: the first deploy after switching DNS/workflow may serve stale content
from the GitHub Pages CDN for a few minutes — that's normal.

## License

See `LICENSE`.
