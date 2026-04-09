# kanwarpal.com

A minimal, terminal-inspired (TUI) portfolio for Kanwarpal Brar. Single-page,
plain HTML + CSS + vanilla JavaScript (ES modules). No build step, no
`node_modules`, no framework.

Live at https://kanwarpal.com.

## Layout

Central pane is a graph of six nodes (home, work, projects, resume, socials,
cluster). Click a node to expand it in place; click outside or press `Esc` to
return home. A shell-style command input at the bottom supports `cd <node>`,
`ls`, `help`, `pwd`, `whoami`, `cat bio`, `open resume`, and `clear`, plus
history (↑/↓), Tab completion, and Ctrl+L.

State is driven by `location.hash` (`#/home`, `#/work`, ...) so back/forward
and deep-links work.

## Project structure

```
assets/    Resume PDF, headshot (webp), favicon (svg)
css/       theme.css (tokens) + style.css (layout/components/animations)
js/        data.js, graph.js, terminal.js, main.js  (all ES modules)
index.html Single-page app; every node's content is pre-rendered for SEO and no-JS fallback.
.github/workflows/deploy.yml  Static deploy to GitHub Pages.
CNAME, robots.txt, sitemap.xml, .nojekyll
```

## Local development

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static server works. No dependencies to install.

## Updating content

All text content lives in `js/data.js`. Edit that file to change bio, work
experience, projects, etc. The rendered `index.html` also contains the same
content inline (for SEO + no-JS fallback) — keep them in sync when making
substantial edits, or regenerate them from `data.js` by hand.

To add a project: append an entry to the `projects` array in `js/data.js` and
mirror it inside the `<!-- PROJECTS -->` section of `index.html`.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which stages the site
files into `_site/` (excluding `.git`, `.github`, `README.md`, `LICENSE`) and
uploads them as a GitHub Pages artifact. The `CNAME` file at the repo root
keeps the `kanwarpal.com` custom domain.

Note: the first deploy after switching DNS/workflow may serve stale content
from the GitHub Pages CDN for a few minutes — that's normal.

## License

See `LICENSE`.
