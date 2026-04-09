# TUI Portfolio — Requirements & Implementation

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

- **Central node graph.** Six nodes arranged in a 2×3 grid: home, work,
  projects, resume, socials, cluster. Connected by dashed SVG strokes.
- **Expand on click.** Clicking a node expands it into a centered stage;
  siblings shrink and fade to the periphery. Clicking outside (or pressing
  Esc) collapses back to home.
- **Hash routing.** `location.hash` (`#/home`, `#/work`, …) is the single
  source of truth. Back/forward and deep-links work.
- **Shell-style terminal.** Permanent command input at the bottom of the
  screen. Supports: `cd <node>`, `ls`, `help`, `pwd`, `whoami`, `cat bio`,
  `open resume`, `clear`.
- **Keyboard shortcuts.** `Enter` runs, `↑/↓` history, `Tab` autocomplete,
  `/` focuses input, `Esc` returns home, `Ctrl+L` clears output.
- **Mouse-friendly.** Non-technical users can navigate entirely by clicking
  nodes. A permanent hint line explains the basics.

### Visual style

- Monospace font, dark background (`#0d0d0d`), cyan accent (`#9cdcfe`).
- TUI chrome: top status bar, box-drawing node headers (`── work ──`),
  prompt with blinking cursor.
- WCAG AAA color contrast (≥7:1 for all text against background).
- Responsive: desktop (1440), tablet (820), mobile (390).

### Accessibility

- Nodes are keyboard-activatable (`tabindex="0"`, `role="link"`,
  Enter/Space navigate).
- Terminal output in `aria-live="polite"` region.
- Focus restored to originating element on collapse.
- `prefers-reduced-motion: reduce` disables all transitions and animations.
- No-JS fallback: `html.nojs` class stacks all nodes vertically with full
  content visible; terminal input hidden.

### Content per node

| Node | Content |
|------|---------|
| Home | Headshot, tagline, `parablurb` (short bio), `aboutBlurb` (long bio), getting-around hint |
| Work | 7 work experience entries (Carta ×2, UWaterloo, Arctic Wolf, Genesys, Cloudspark, Pillar To Post) + 3 extra-curriculars (UWHVZ, Improv, Tea Club) — text only, no club logos |
| Projects | 9 hard-coded repos in a responsive grid (concurrent-hashmap, simple-event-bus, simple-coroutine, thread-music, minecraft-helm, friend-point-service, flex-schedule, hive, NYABot) |
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

**State.** `location.hash` → `graph.js:currentNode()` → `#graph[data-expanded="<name>"]`.
JS sets one attribute; CSS handles all layout via attribute selectors.

**Nodes.** `<article class="node" role="link" tabindex="0" data-href="#/<name>">`
positioned absolutely via `--x`/`--y` CSS custom properties.
Using `<article>` (not `<a>`) because expanded nodes contain nested links
(repo URLs, mailto, PDF) and `<a>` inside `<a>` is invalid HTML.
Navigation is handled explicitly in the click handler and keydown listener.

**Expand/collapse (CSS-driven, GPU-friendly).**
- Peripheral: `transform: translate(-50%,-50%) scale(.65); opacity: .32; filter: blur(.3px)`
- Expanded: `transform: translate(-50%,-50%) scale(1)` centered at 50%/50%,
  `width: min(72ch, 78%); height: min(78%, 46em)`
- Only `transform`, `opacity`, and `filter` are transitioned (composited, no layout thrash).

**Click handler** (`graph.js:handleGraphClick`):
1. Click on a real `<a>` inside any node → pass through (repo link, PDF, mailto).
2. Click inside the expanded node (not on a link) → no-op.
3. Click on a peripheral node → `navigate(name)`.
4. Click on graph background → collapse to home.

**SVG lines.** `<svg id="graph-lines">` overlay with dashed strokes from
center to each node. Coordinates recalculated on `ResizeObserver`. Hidden
when any non-home node is expanded.

**Terminal.** Parser splits on `\s+`, lowercases the command token, dispatches
to a handler map. All output appended as `<span>` elements using `textContent`
(never `innerHTML`) to prevent XSS. History stored in-memory (not persisted);
Tab autocomplete uses longest-common-prefix matching.

**No-JS fallback.** `<html class="nojs">` with an inline `<script>` in `<head>`
that removes the class synchronously. CSS under `html.nojs` stacks all nodes
vertically at full width, shows all `.node-body` content, and hides the
terminal input.

### Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on push to
`main`. Stages site files into `_site/` via rsync (excluding `.git`, `.github`,
`README.md`, `LICENSE`, `.gitignore`, `.prettierrc`), then uploads via
`actions/upload-pages-artifact@v3` and deploys via `actions/deploy-pages@v4`.
`CNAME` and `.nojekyll` are included in the artifact automatically.

### Updating content

All text content lives in `js/data.js`. The rendered `index.html` contains the
same content inline (for SEO + no-JS fallback) — keep them in sync when making
edits. To add a project, append to the `projects` array in `data.js` and mirror
it in the `<!-- PROJECTS -->` section of `index.html`.

### Trade-offs

1. **Hard-coded projects** require manual sync when repos change. Accepted to
   avoid GitHub API rate-limiting.
2. **SVG dashed lines** (not literal box-drawing characters) for responsiveness.
   TUI feel comes from the chrome, node headers, monospace font, and palette.
3. **Hash fragments aren't separately indexed.** Mitigated by pre-rendering all
   content in the initial HTML.
4. **`<article role="link">` instead of `<a>`** loses native middle-click /
   right-click "open in new tab" on nodes. Acceptable since nodes are in-page
   sections, not separate pages.
