proc# TUI Portfolio — Requirements & Implementation

## 1. Requirements

### Goal

Complete teardown of the existing React/Next.js/TypeScript/SCSS/Tailwind/MUI
portfolio at `kanwarpal.com`. Replace with a minimal, terminal-inspired (TUI)
single-page site using plain HTML, CSS, and vanilla JavaScript.

### Constraints

- **Zero dependencies.** No framework, no build step, no `node_modules`.
  Plain ES modules loaded directly by the browser.
- **Single page.** All content pre-rendered in `index.html` for SEO and no-JS
  fallback. No runtime fetching.
- **Preserve all existing content.** Two bio blurbs, 7 work experiences,
  3 extra-curriculars, 9 projects, cluster page, resume PDF, social links.
- **Deploy to GitHub Pages** at `kanwarpal.com` via the existing CNAME.

### Interaction model

- **Central node graph.** Six top-level nodes arranged in a 2×3 grid: home,
  work, projects, resume, socials, cluster. Connected by dashed SVG strokes
  whose endpoints clip to the node's bounding rect (not the center).
- **Hierarchical navigation.** Each top-level parent node (work, projects) has
  child sections (individual jobs, individual projects). Children are
  accessible via hash paths (`#/projects/hive`, `#/work/carta-2024-payments`)
  or terminal commands (`cd projects/hive`).
- **Expand on click.** Clicking a top-level node expands it into a centered
  stage; siblings push to screen-edge corners. Clicking inside a parent node
  that has children renders child orbit nodes around the card.
- **Orbit children.** When a parent is expanded, up to `ORBIT_CAP` (currently
  8) children appear as small orbit nodes on an elliptical ring around the
  card. Clicking an orbit node deep-links into that child's view with a
  breadcrumb overlay (`← projects / hive`).
- **Breadcrumb back navigation.** Pressing `Esc` or clicking the breadcrumb
  parent chip returns to the parent level. Pressing `Esc` again returns to
  home.
- **Home as recruiter snapshot.** Home expanded shows the bio, a
  `[ view resume ]` button, and a tile grid with one tile per sibling section.
  Clicking a home tile navigates to that section (same as clicking the orbit
  node).
- **Hash routing.** `location.hash` (`#/`, `#/work`, `#/projects/hive`, …) is
  the single source of truth. Back/forward and deep-links work. Unknown paths
  fall back to `home`.
- **Shell-style terminal.** Permanent command input at the bottom of the
  screen. Supports: `cd <path>`, `cd ..`, `cd ../..`, `cd ~/work/carta-2024`,
  `ls`, `pwd`, `help`, `whoami`, `cat bio`, `open resume`, `clear`.
- **Keyboard shortcuts.** `Enter` runs, `↑/↓` history (`↓` past newest
  restores stashed in-progress text), `Tab` autocomplete (children of pwd
  suggested first), `/` focuses input, `Esc` climbs one level (or returns
  home), `Ctrl+L` clears output.
- **Mouse-friendly.** Non-technical users can navigate entirely by clicking
  nodes and tiles. A permanent hint line explains the basics.

### Visual style

- Monospace font, dark background (`#0d0d0d`), cyan accent (`#9cdcfe`).
- TUI chrome: top status bar, box-drawing node headers (`── work ──`),
  native caret via `caret-color: var(--accent)` (no fake cursor span).
- WCAG AAA color contrast (≥7:1 measured at `#0d0d0d` background):

  | Token | Value | Ratio |
  |-------|-------|-------|
  | `--fg` | `#d4d4d4` | ~11.8:1 |
  | `--fg-dim` | `#b8b8b8` | ~9.5:1 |
  | `--fg-mute` | `#9a9a9a` | ~7.0:1 |
  | `--accent` | `#9cdcfe` | ~9.1:1 |
  | `--accent-2` | `#d49ed4` | ~7.4:1 |
  | `--ok` | `#8db872` | ~7.1:1 |

- Responsive: desktop (1440), tablet (820), mobile (390), landscape-phone
  (`max-height: 500px and orientation: landscape`).

### Accessibility

- Nodes are keyboard-activatable (`tabindex="0"`, `role="button"`,
  `aria-expanded`, `aria-controls=<id>`, Enter/Space navigate).
- Single `<h1 class="visually-hidden">` inside `<main>`; nodes use `<h2>`.
- `<main>` is the sole landmark; nodes wrapped in `<nav aria-label="portfolio
  sections">` inside it. Terminal footer uses `<footer>`.
- Terminal output region uses `role="log"` (implicit `aria-live="polite"`;
  communicates log semantics to screen readers).
- Focus moves to the expanded card wrapper on navigation; restored to the
  trigger element on collapse.
- `prefers-reduced-motion: reduce` disables all CSS transitions and animations.
- No-JS fallback: `html.nojs` class stacks all nodes vertically with full
  content visible; terminal input hidden. Child entries below parents remain
  in document order (no visual orbit deployed).

### Content per node

| Node | Content |
|------|---------|
| Home | Headshot, tagline, short bio, `[ view resume ]` PDF button, long about section, **section tile grid** (work / projects / resume / socials / cluster), getting-around hint |
| Work | 7 work experience entries (Carta ×2, UWaterloo, Arctic Wolf, Genesys, Cloudspark, Pillar To Post) + 3 extra-curriculars (UWHVZ, Improv, Tea Club). Each entry has its own `id` in `data.js` for hierarchical deep-linking. |
| Projects | 9 repos rendered in a responsive grid (concurrent-hashmap, simple-event-bus, simple-coroutine, thread-music, minecraft-helm, friend-point-service, flex-schedule, hive, NYABot). Each project has its own `id` in `data.js` for hierarchical deep-linking. |
| Resume | Blurb + `[ open Kanwarpal_Brar_Resume.pdf ]` button (opens in new tab) |
| Socials | GitHub, LinkedIn, email |
| Cluster | Private Kubernetes cluster access portal, `[REDACTED]` URL, access-request instructions |

---

## 2. Implementation

### File layout

```
/
├── index.html                          # Single page; 6 pre-rendered nodes, SVG overlay, terminal
├── css/
│   ├── theme.css                       # Custom properties: palette, fonts, spacing, timing
│   └── style.css                       # Reset, chrome, grid, expand/collapse, terminal, responsive, a11y
├── js/
│   ├── data.js                         # All content exports (bios, work, projects, socials, cluster, resume path)
│   ├── graph.js                        # State: currentNode(), navigate(), applyState(), SVG lines, click handler
│   ├── terminal.js                     # Command parser, history, keybindings, output (textContent only)
│   └── main.js                         # Entry point; wires routing, graph, terminal, ResizeObserver
├── assets/
│   ├── Kanwarpal_Brar_Resume.pdf       # Moved from public/
│   ├── headshot.webp                   # Converted from JPEG; ~12 KB
│   └── favicon.svg                     # Terminal prompt icon; 257 bytes
├── .github/workflows/deploy.yml        # Rsync stages into _site/, uploads via upload-pages-artifact@v3
├── CNAME                               # kanwarpal.com
├── .nojekyll                           # Disables Jekyll on GitHub Pages
├── robots.txt                          # Sitemap reference
├── sitemap.xml                         # Single URL: https://kanwarpal.com/
├── .gitignore                          # OS/editor junk + _site/
├── LICENSE
└── README.md
```

### Architecture

**State.** `location.hash` (`#/`, `#/work`, `#/projects/hive`) →
`graph.js:parsePath()` → validated `_path` array → `#graph[data-expanded="<name>"]`
attribute. JS owns the state atom; CSS applies all layout consequences via
attribute selectors. Unknown hashes fall back to `['home']`.

**`data.js` — single source of truth.** All content (bios, work entries,
extra-curricular entries, project entries) lives in `data.js` as typed objects
with stable `id` fields. The exported `TREE` constant declares the IA:

```js
export const TREE = {
  home:     { kind: 'recruiter', children: ['work','projects','resume','socials','cluster'] },
  work:     { kind: 'list',      children: ['carta-2024-payments', 'uwaterloo-2024', /* … */] },
  projects: { kind: 'list',      children: ['concurrent-hashmap', 'simple-event-bus', /* … */] },
  resume:   { kind: 'leaf' },
  socials:  { kind: 'leaf' },
  cluster:  { kind: 'leaf' },
};
```

`index.html` contains the same content pre-rendered for SEO and no-JS
fallback. Both must be kept in sync manually when adding/editing entries.

**Nodes.** `<article class="node" role="button" aria-expanded tabindex="0">`
positioned absolutely via `--x`/`--y` CSS custom properties.
Using `<article>` (not `<a>`) because expanded nodes contain nested links
(repo URLs, mailto, PDF) and `<a>` inside `<a>` is invalid HTML.

**Expand/collapse (CSS-driven, GPU-friendly).**
- Peripheral: `transform: translate(-50%,-50%) scale(.78); color: var(--fg-dim);`
  No opacity/blur on the whole element — dimming is applied per-property so
  the node's solid `background: var(--bg-card)` always occludes SVG lines.
- Expanded: `transform: translate(-50%,-50%) scale(1)` centered at 50%/50%;
  `width: min(72ch, 78%); height: min(78%, 46em)`.
- Non-home peripherals pushed to screen edges when an alternate node is
  expanded (e.g. `--x: 8%; --y: 20%`) to avoid overlapping the expanded card.
- Only `transform` and `color`-family properties are transitioned (no
  layout thrash).

**Click handler** (`graph.js:handleGraphClick`):
1. Click on a real `<a>` inside any node → pass through (repo link, PDF, mailto).
2. Click inside the expanded node (not on a link) → no-op.
3. Click on an orbit node → navigate to child path (`projects/hive`).
4. Click on a peripheral top-level node → `navigate(name)`.
5. Click on graph background → collapse to home.

**SVG lines.** `<svg id="graph-lines">` overlay with dashed strokes from
graph center to each top-level node. Line endpoints are clipped to the
node's bounding rect via `rectEdgePoint()` (not the node center). Coordinates
recalculated via a single `requestAnimationFrame` coalescer guard (`rafId`)
on `ResizeObserver` / orientation change to avoid redundant redraws. Hidden
when any non-home node is expanded.

**Polar orbit layout.** When a parent with children (`work`, `projects`) is
expanded, `updateOrbitNodes()` injects `.orbit-node` elements around the
card. Positions are computed with:

```
rx = cardW / 2 + ORBIT_RADIUS_X   // horizontal semi-axis
ry = cardH / 2 + ORBIT_RADIUS_Y   // vertical semi-axis
x_i = cx + rx * cos(2π·i/n)
y_i = cy + ry * sin(2π·i/n)       // n = min(children, ORBIT_CAP)
```

`ORBIT_CAP = 8` limits the ring to 8 nodes at desktop; the remaining children
are still accessible via the in-card grid or terminal commands.

**Breadcrumb overlay.** When a child path is active (`projects/hive`),
`renderChildView()` inserts a `.breadcrumb` bar inside the parent card showing
`← projects / hive`. Clicking the parent chip or pressing `Esc` calls
`navigateUp()` to return to the parent level.

**Terminal.** Parser splits on `\s+`, lowercases the command token, dispatches
to a handler map. All output appended as `<span>` elements using `textContent`
(never `innerHTML`) to prevent XSS. History stored in-memory (not persisted);
`↓` past the newest entry restores the stashed `savedInput`. `resolvePath()`
handles absolute (`~/work/carta-2024`), relative (`carta-2024`), and parent
(`..`) traversal. Tab autocomplete lists children of pwd first, then
`parent/child` compound paths.

**No-JS fallback.** `<html class="nojs">` with an inline `<script>` in `<head>`
that removes the class synchronously. CSS under `html.nojs` stacks all nodes
vertically at full width, shows all `.node-body` content (children remain in
document order below their parent), and hides the terminal input and orbit nodes.

### Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on push to
`main`. Stages site files into `_site/` via rsync (excluding `.git`, `.github`,
`README.md`, `LICENSE`, `.gitignore`, `.prettierrc`), then uploads via
`actions/upload-pages-artifact@v3` and deploys via `actions/deploy-pages@v4`.
`CNAME` and `.nojekyll` are included in the artifact automatically.

### Updating content

`js/data.js` is the **single source of truth** for all content. Every
`workExperience`, `extraCurricular`, and `projects` entry carries a stable
`id` that is also used as the child key in `TREE`. The pre-rendered
`index.html` must be kept in sync manually for SEO and no-JS fallback.

To add an entry:
1. Add the object (with a unique `id`) to the appropriate array in `data.js`.
2. Add its `id` to `TREE.<parent>.children`.
3. Mirror the rendered HTML in `index.html` under the correct section article.

### Trade-offs

1. **`data.js` / `index.html` must stay in sync** — no build step to automate
   this. Adding or editing content requires changes in two places. Accepted
   to meet the zero-dependencies constraint.
2. **SVG dashed lines** (not literal box-drawing characters) for responsiveness.
   TUI feel comes from the chrome, node headers, monospace font, and palette.
3. **Hash fragments aren't separately indexed.** Mitigated by pre-rendering all
   content in the initial HTML.
4. **`<article role="button">` instead of `<a>`** loses native middle-click /
   right-click "open in new tab" on nodes. Acceptable since nodes are in-page
   sections, not separate pages.
5. **`ORBIT_CAP = 8` caps the visible orbit ring.** When a parent has more
   than 8 children (e.g. `work` has 10), only the first 8 appear in the orbit.
   The remaining items are still accessible via the in-card content list and
   terminal `cd` / `ls` commands.
