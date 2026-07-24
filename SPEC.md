# TUI Portfolio — Requirements & Implementation

## 1. Requirements

### Goal

Complete teardown of the previous React/Next.js/TypeScript/SCSS/Tailwind/MUI
portfolio at `kanwarpal.com`. Replace with a minimal, TUI-styled single-page
site using plain HTML, CSS, and vanilla JavaScript.

> **Update (2026-07):** The interactive shell-style terminal was removed —
> navigation is entirely graph-driven (ring nodes, wheel items, in-card boxes,
> a bare-board click / `Esc` to climb back), and its former vertical space now
> goes to the node board. The card and wheel are also no longer sized by fixed
> percentages: `render.js:applyGeometry` sizes them **inward from the measured
> ring** via `layout.js:largestClearRect`, so a gap to the ring/wheel is
> guaranteed at every viewport (and the board collapses to a scrolling
> card+list when the composition can't nest). Sections below that describe the
> terminal, the wheel *ellipse*, or percentage-based card sizing are retained
> for history but superseded by this note.
>
> **Update (2026-07, cont.):** `WHEEL_CAP` is now 10 (was 8), so every
> work/project child is reachable from the desktop wheel. The wheel is shown
> only in section (hub) views — child (detail) views hide it so the detail
> card gets the full board. Wheel items carry real content (title + 2-line
> description + tags/dates), not just a name. Card sizing is now
> view-dependent: the work/projects hub card is capped small
> (`SECTION_CARD_MAX`, ~320×168) since the wheel — not the hub — carries the
> content; home/leaf/child cards fill the ring envelope up to a per-view cap
> and then shrink to their natural content height (`fitCardHeight` in
> `render.js`) so short content doesn't leave a tall empty card and long
> content never needs to scroll. `flipCardFrom`'s grow-from-node transform now
> preserves the card's `translate(-50%,-50%)` centering base, so the entrance
> animates from the clicked node's actual on-screen position in every
> direction (previously it drifted down-right regardless of which node was
> clicked).
>
> **Update (2026-07, cont. 2):** Ring nodes now render an index (`01`–`05`)
> above an uppercase, letter-spaced name (`ringNodesHTML` in `content.js`),
> and `#card`'s border matches the ring spokes' dim default color on home
> specifically (`#graph[data-view="home"] #card`) — on home no spoke is
> "active" yet, so all five render dim; elsewhere the card's default accent
> border already agrees with its own (now-active) spoke. `SECTION_CARD_MAX`
> shrank to ~240×190 (from ~320×168) and the wheel frame is no longer parked
> at the ring-clearing ceiling by default — `applyGeometry` derives it from
> the card outward (`GAP_CARD` past `SECTION_CARD_MAX`) and only grows it
> toward the ceiling as far as `wheelItemsClear` says is needed to keep every
> item clear of its neighbors, closing the dead space a fixed ring-ceiling
> frame used to leave around a small hub card. `.wheel-item` width is still
> 19ch (the widest that avoids item-to-item overlap with all 10 work children
> at 1366×768, the tightest supported desktop viewport — see
> `wheelItemsClear`), but `.wi-title` now wraps to 2 lines instead of
> single-line-ellipsing, so long names (e.g. "Tea & Culture Club",
> "friend-point-service") render in full instead of truncating. The topbar
> readout (`#meta-dims`) now shows the literal `innerWidth×innerHeight`, not a
> derived character-grid estimate.

### Constraints

- **Zero runtime dependencies.** No framework, no third-party packages, no
  bundler. Plain ES modules loaded directly by the browser. `package.json`
  exists only so Node treats `js/*.js` as ES modules for the build script and
  unit tests (`"type": "module"`) — it declares no dependencies.
- **Single page, fully pre-rendered.** `index.html` is a generated build
  artifact containing the live shell (ring/wheel/card markup) *and* a hidden
  `#prerendered` section with every view's full content, for SEO and the
  no-JS fallback. No runtime fetching.
- **Preserve all existing content.** Two bio blurbs, 7 work experiences,
  3 extra-curriculars, 9 projects, cluster page, resume PDF, social links.
- **Deploy to GitHub Pages** at `kanwarpal.com` via the existing CNAME, gated
  on a CI check that the committed `index.html` matches a fresh build.

### Interaction model

- **Ring + wheel + card graph.** `#graph` is a board with three concentric
  layers plus a home-only SVG overlay:
  - `#ring` — 5 persistent section buttons (work, projects, resume, socials,
    cluster) in fixed pentagon slots (`RING_SLOTS` in `js/layout.js`). They
    never move; outside the home view they dim (via a muted color token, not
    opacity) but stay fully clickable, so a direct section-to-section jump
    always works without returning home first.
  - `#wheel` — a radial child menu for the `work` and `projects` sections
    (and their children), capped at 8 items, positioned on an ellipse around
    `#card` that is guaranteed never to overlap it (see Architecture below).
  - `#card` — the centered, scrolling, focused content for whatever the
    current route is: the home bio, a section body, or a child detail view.
  - `#graph-lines` — dashed SVG spokes from the card to each ring node,
    drawn only in the home view, clipped to each shape's bounding-box edge
    (not its center) via `rectEdgePoint()`.
- **Hierarchical navigation.** The `work` and `projects` sections have child
  entries (individual jobs/extra-curriculars, individual projects). Children
  are addressable via hash paths (`#/projects/hive`,
  `#/work/carta-2024-payments`) or terminal commands (`cd projects/hive`).
- **Three-state router.** `js/router.js` reduces `location.hash` to one of:
  `{view:'home'}`, `{view:'section', section}`, or
  `{view:'child', section, child}`. Invalid hashes fall back to `home`.
- **Wheel navigation.** Clicking a ring node with children (or navigating to
  it) populates `#wheel` with up to `WHEEL_CAP` (8) child buttons; clicking
  one deep-links into that child's view with a breadcrumb overlay inside the
  card (`← projects / hive`). Sections with more than 8 children still list
  every entry inside the card itself (e.g. `work`'s in-card grid) and via
  terminal `cd`/`ls`.
- **Breadcrumb back navigation.** Clicking the breadcrumb's parent chip, or
  pressing `Esc`, returns to the parent section. Pressing `Esc` again (or
  clicking the bare board/card padding) returns to home.
- **Home as recruiter snapshot.** Home shows the bio, a `[ view resume ]`
  button, and a tile grid with one tile per section. Clicking a home tile
  navigates to that section (same destination as its ring node or wheel
  item).
- **Hash routing.** `location.hash` (`#/home`, `#/work`, `#/projects/hive`,
  …) is the single source of truth, normalized/round-tripped by
  `router.js:normalizeHash()`. Back/forward and deep-links work. Unknown
  paths fall back to `home`.
- **Shell-style terminal.** Permanent command input at the bottom of the
  screen. Supports: `cd <path>`, `cd ..`, `cd ../..`, `cd ~/work/carta-2024`,
  `ls`, `pwd`, `help`, `whoami`, `cat bio`, `open resume`, `clear`.
- **Keyboard shortcuts.** `Enter` runs, `↑/↓` history (`↓` past newest
  restores stashed in-progress text), `Tab` autocomplete (children of pwd
  suggested first), `/` focuses input, `Esc` climbs one level (or returns
  home), `Ctrl+L` clears output.
- **Mouse-friendly.** Non-technical users can navigate entirely by clicking
  ring nodes, wheel items, or home tiles. A permanent hint line explains the
  basics.
- **Adaptive small-viewport fallback.** When the board is too short, too
  narrow, or too small in area for the ring+wheel+card composition to fit
  legibly, the layout collapses to a card-only view instead of degrading in
  place (see `COLLAPSE_MIN_*` in Architecture below) — this is a JS/CSS
  runtime behavior, independent of the no-JS `html.nojs` fallback.

### Visual style

- Monospace font, dark background (`#0d0d0d`), cyan accent (`#9cdcfe`).
- TUI chrome: top status bar, box-drawing card headers (`── work ──`),
  native caret via `caret-color: var(--accent)` (no fake cursor span).
- WCAG AAA color contrast, per the ratios documented in `css/theme.css`
  (measured against the `--bg` background, `#0d0d0d`):

  | Token | Value | Ratio |
  |-------|-------|-------|
  | `--fg` | `#d4d4d4` | ~13.9:1 |
  | `--fg-dim` | `#b8b8b8` | ~9.5:1 |
  | `--fg-mute` | `#9a9a9a` | ~7.0:1 |
  | `--accent` | `#9cdcfe` | ~9.7:1 |
  | `--accent-2` | `#d49ed4` | ~7.4:1 |
  | `--ok` | `#8db872` | ~7.1:1 |
  | `--warn` | `#dcdcaa` | ~12.4:1 |

- Responsive: desktop (1440), tablet (900px breakpoint), mobile (600px
  breakpoint), landscape-phone (`max-height: 500px and orientation:
  landscape`) — see `css/style.css`'s `@media` blocks. These viewport
  breakpoints govern chrome density (font size, padding) and are orthogonal
  to the JS-driven ring/wheel/card `.collapsed` fallback, which is gated on
  the *board's* measured height/width/area, not the viewport.

### Accessibility

- All interactive graph elements (`#ring` buttons, `#wheel` items, home
  tiles, breadcrumb chips, exp/proj boxes) are native `<button
  type="button">`, so they're keyboard-activatable and announced correctly
  without manual `role`/`tabindex` bookkeeping. Real external links (repo
  URLs, mailto, the resume PDF) remain plain `<a>` — because buttons may only
  contain phrasing content, `js/content.js` renders both the clickable
  (button) and static (child-detail `<article>`) forms of an entry from the
  same all-`<span>` inner markup.
- Single `<h1 class="visually-hidden">` inside `<main id="graph">`; card
  content uses `<h3>`. `<main>` and `<footer id="bottom">` are the page's
  landmarks.
- Terminal output region (`#cmdout-region`) uses `role="log"` (implicit
  `aria-live="polite"`), communicating log semantics to screen readers.
- Focus management (`render.js`): navigating to a non-home view moves focus
  to `#card`; returning to home restores focus to whatever element triggered
  the last navigation (tracked via `router.js:setTrigger`/`getTrigger`).
- **Two-tier motion model.** `prefers-reduced-motion: reduce` removes
  *movement* — wheel item repositioning/scale-in, the SVG spoke draw-in
  animation, and the FLIP card-grow entrance (which is already a full no-op
  under reduced motion, checked in JS by `flip.js`) — but deliberately does
  **not** disable every transition. Opacity/color crossfades (ring
  dim/active, wheel enter/leave fade, hover/focus) still play, so view
  changes still read as a switch rather than an instant jump-cut. See the
  `@media (prefers-reduced-motion: reduce)` block in `css/style.css`, which
  scopes `!important` overrides to `.wheel-item`'s `transition-property`/
  `transition-delay`, `.wheel-item.entering`/`.leaving`'s `transform`, and
  `#graph-lines line`'s `transition` — nothing else in the stylesheet is
  touched.
- No-JS fallback: an inline `<script>` in `<head>` synchronously strips the
  `nojs` class the instant JS runs, so JS users never see it. Without JS,
  `html.nojs` hides `#ring`/`#wheel`/`#graph-lines`/`#bottom` (the terminal),
  shows `#card` statically (full-width, no absolute positioning), and reveals
  `#prerendered` — a stack of `<article class="prerender-section">` blocks,
  one per section, each with a full, non-interactive rendering of that
  section's content in document order. `#prerendered` is built at build time
  by `scripts/build.mjs` calling `content.js:prerenderAll()`, so it can never
  drift from the live views.

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
├── index.html                          # GENERATED build artifact — never hand-edit. Live shell + hidden #prerendered content + SEO meta/JSON-LD
├── index.template.html                 # Build input: page shell/meta with {{token}} placeholders + <!-- inject:* --> markers
├── package.json                        # "type": "module" only, so Node treats js/*.js as ES modules; no dependencies
├── scripts/
│   └── build.mjs                       # Zero-dependency build script: renders index.html from index.template.html + js/content.js + js/data.js. `--check` mode is the CI parity gate.
├── test/
│   └── layout.test.js                  # node --test unit tests for js/layout.js's pure geometry
├── css/
│   ├── theme.css                       # Custom properties: palette, fonts, spacing, timing
│   └── style.css                       # Reset, chrome, ring/wheel/card board, terminal, collapse fallback, responsive, motion, a11y
├── js/
│   ├── data.js                         # All content exports (bios, work, projects, socials, cluster, resume path, TREE)
│   ├── content.js                      # Isomorphic HTML string builders — consumed by both render.js (browser) and build.mjs (Node); no document/window refs
│   ├── layout.js                       # Pure, DOM-free geometry (RING_SLOTS, largestClearRect, squareWheelPositions, rectEdgePoint, graphLinePoints); unit-tested
│   ├── router.js                       # hash <-> state parsing, navigate(), currentState()
│   ├── render.js                       # render(state) pipeline: ring/card DOM updates, keyed wheel reconciliation, rAF-coalesced ring-derived card/wheel sizing + collapse gating
│   ├── flip.js                         # Card entrance animations: flipCardFrom (grow from node) + flipCardEnter (settle-in); no-op under prefers-reduced-motion
│   └── main.js                         # Entry point; wires routing, graph clicks, Esc, ResizeObserver
│   (js/terminal.js was removed along with the interactive terminal.)
├── assets/
│   ├── Kanwarpal_Brar_Resume.pdf
│   ├── headshot.webp                   # ~12 KB
│   └── favicon.svg                     # Terminal prompt icon; 257 bytes
├── .github/workflows/deploy.yml        # setup-node + build parity check, then rsync stages into _site/, uploads via upload-pages-artifact@v3
├── .nvmrc                              # Node version pin, consumed by setup-node's node-version-file
├── CNAME                               # kanwarpal.com
├── .nojekyll                           # Disables Jekyll on GitHub Pages
├── robots.txt                          # Sitemap reference
├── sitemap.xml                         # Single URL: https://kanwarpal.com/
├── .gitignore                          # OS/editor junk, node_modules/, _site/
├── LICENSE
└── README.md
```

`js/graph.js` from the previous iteration no longer exists — its
responsibilities were split across `router.js` (state), `content.js`
(markup), `layout.js` (geometry), `render.js` (DOM orchestration), and
`flip.js` (entrance animation).

### Architecture

**State.** `location.hash` (`#/`, `#/work`, `#/projects/hive`) is parsed by
`router.js:parseState()` into one of three validated state shapes:
`{view:'home'}`, `{view:'section', section}`, `{view:'child', section,
child}`. `navigate()` updates the in-memory state synchronously and writes
`location.hash` if it changed; `applyHash()` re-parses on `hashchange`.
`render.js:render(state)` is a pure function of that state — same state in,
same DOM out — and is the only place that writes to `#graph`'s
`data-view`/`data-section`/`data-child` attributes, which CSS reads to drive
ring dim/active styling and section-specific card sizing.

**Single-source-of-truth content pipeline.** All copy (bios, work entries,
extra-curricular entries, project entries, section summaries, the `TREE` IA)
lives in `js/data.js`. `js/content.js` imports from `data.js` and exports
pure, isomorphic HTML-string builders (`cardHTML(state)`, `ringNodesHTML()`,
`prerenderAll()`, etc.) with **no** `document`/`window` references, so the
exact same module runs in two places:

- **Browser:** `render.js` calls `cardHTML(state)` / `wheelChildren(state)` /
  etc. to build the live DOM on every navigation.
- **Node (build time):** `scripts/build.mjs` calls the same functions —
  `prerenderAll()` for the hidden no-JS/SEO sections, `homeCard()` and
  `ringNodesHTML()` for the initial shell markup — and interpolates the
  results into `index.template.html`'s `{{token}}` placeholders and
  `<!-- inject:* -->` markers to produce `index.html`.

Because both consumers call the *same* functions, the prerendered HTML and
the live DOM can never drift on their own. The only way they can drift is if
someone edits `data.js`/`content.js`/`index.template.html` and forgets to
re-run the build — which is exactly what the CI parity check below catches.

**Build step + parity check.** `node scripts/build.mjs` writes `index.html`.
`node scripts/build.mjs --check` instead renders in memory and diffs against
the committed `index.html`, exiting 1 (with no write) if they differ. CI
(`.github/workflows/deploy.yml`) runs `setup-node` (pinned via `.nvmrc`) then
this `--check` step before staging the deploy artifact, so a stale
`index.html` fails the build instead of silently shipping.

**Ring + wheel + card board.** `js/layout.js` defines `RING_SLOTS`, a fixed
pentagon of `{x, y}` percentages for the 5 section buttons — these never
change between views. `render.js:initShell()` writes them once as `--x`/`--y`
custom properties on each `.snode`. On every render, ring buttons get
`.active`/`aria-current` toggled based on `state.section`, and CSS dims
non-active buttons via a muted color token (`--fg-mute`), never opacity — so
a ring node's opaque `background` still occludes the SVG spokes behind it
when they're visible, and the accessibility tree never reports a "hidden"
button that's actually clickable.

**Wheel keyed reconciliation.** `render.js:updateWheel()` diffs the outgoing
wheel-item set against the incoming `wheelChildren(state)` ids using a
`Map<id, element>` (`wheelItems`). Existing items are reordered/re-labeled
in place; new items are created with an `.entering` class (opacity 0, scaled
down, `transition: none`) and their `transitionDelay` staggered by
`WHEEL_STAGGER_MS` (35ms) per index, then have `.entering` removed on the
*next* animation frame so the browser has already painted the initial state
— turning the appearance into a transition instead of a jump-cut. Items that
fall out of the new id set get `.leaving` (fades/scales out in place, no
repositioning) and are removed on `transitionend` (with a `setTimeout`
safety net in case the event never fires, e.g. if the tab is backgrounded).

**Wheel ellipse sizing (sqrt(2) safety margin).** `applyGeometry()` computes
a candidate ellipse from the board's size (`WHEEL_RX_FACTOR` = 0.34,
`WHEEL_RY_FACTOR` = 0.3, fractions of the board's full width/height — an
ellipse, not a circle, so wide-short boards use the available horizontal
space instead of crushing the ring). That candidate clears the card *on-axis*
but an ellipse sized only from axis extremes can still clip a rectangle at a
diagonal angle — the worst case, 45°, needs each semi-axis scaled by
`Math.SQRT2`. So a second, minimum radius is derived directly from the
card's actual measured box plus a 16px gap plus the largest wheel item's own
half-size (`minRx`/`minRy` in `applyGeometry()`), and the larger of the two
candidates wins — guaranteeing every wheel item, at every angle, clears the
card. The result is then clamped to stay on-board (`maxRx`/`maxRy`), on the
assumption that a board too small for that should already be `.collapsed`.

**Collapse fallback (height/width/area-gated).** Below
`COLLAPSE_MIN_HEIGHT` (460px), `COLLAPSE_MIN_WIDTH` (620px), or
`COLLAPSE_MIN_AREA` (460 × 640 px²) measured on `#graph` itself,
`applyGeometry()` toggles a `.collapsed` class that CSS uses to hide
`#ring`/`#wheel`/`#graph-lines` and let `#card` fill the board edge-to-edge.
Gating on height/area (not width alone) matters because a short laptop
viewport can be plenty wide — a pure width breakpoint would misclassify it
as "desktop" and crush the ring+wheel composition into too little vertical
space.

**Geometry scheduling.** All layout math (`scheduleGeometry()` →
`applyGeometry()`) is coalesced through a single `requestAnimationFrame`
handle (`_rafId`), re-triggered by a `ResizeObserver` on `#graph` (with a
`window.resize`/`orientationchange` fallback), so rapid resize events never
queue redundant layout passes.

**SVG home spokes.** `<svg id="graph-lines">` is populated only in the home
view (and only when not `.collapsed`). `layout.js:homeLinePoints()` clips
each line's endpoints to the card's edge and to each ring node's own
bounding-box edge (via `rectEdgePoint()`, not either shape's center).
`render.js:drawSpokes()` paints each line at full `stroke-dashoffset` first,
then releases it to 0 on the next frame — a CSS `transition` handles the
draw-in on the full-motion tier; reduced motion strips that transition so
the same code just becomes an instant reveal.

**Click handling.** `main.js:handleGraphClick()`, a single delegated
listener on `#graph`:
1. Clicks on a real `<a>` (repo link, mailto, PDF) pass through natively.
2. `.snode` (ring button) → `navigate(section)`.
3. Any button with `data-nav` (home tile, breadcrumb parent chip) →
   `navigate(that id)`.
4. Any button with `data-child` (wheel item, exp/proj box) → navigate to
   `currentSection/childId`.
5. A bare click on `#graph` or `#card`'s own padding (not any button/link)
   → `navigate('home')` if not already home.
Every navigation goes through `main.js:goTo()`, which also records the
trigger element (for focus restoration) and, for non-home destinations,
kicks off the optional FLIP entrance (`flip.js:flipCardFrom()`).

**Terminal.** Parser splits on `\s+`, lowercases the command token, dispatches
to a handler map (`cd`, `ls`, `pwd`, `whoami`, `cat`, `open`, `help`,
`clear`). All output appended as `<span>` elements using `textContent`
(never `innerHTML`) to prevent XSS. History stored in-memory (not
persisted); `↓` past the newest entry restores the stashed `savedInput`.
`resolvePath()` handles absolute (`~/work/carta-2024`), relative
(`carta-2024`), and parent (`..`) traversal against `router.js`'s
`currentPath()`/`NODES`. Tab autocomplete lists children of pwd first, then
`parent/child` compound paths.

**No-JS fallback.** `<html class="nojs">` with an inline `<script>` in
`<head>` that removes the class synchronously. CSS under `html.nojs` hides
the interactive board entirely and reveals `#prerendered`'s stack of
`<article class="prerender-section">` blocks — one per section, in document
order, built at build time from `content.js:prerenderAll()`.

### Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on push to
`main`:
1. **Checkout.**
2. **Setup Node** (`actions/setup-node@v4`, version pinned via
   `node-version-file: '.nvmrc'`) — no `npm install`/`npm ci`, since there
   are zero dependencies.
3. **Parity check** — `node scripts/build.mjs --check` fails the build (exit
   1) if the committed `index.html` doesn't match a fresh build from
   `js/data.js`/`js/content.js`/`index.template.html`.
4. **Stage site** — rsyncs the repo into `_site/`, excluding non-site/dev
   artifacts: `.git`, `.github`, `_site`, `README.md`, `LICENSE`,
   `.gitignore`, `.prettierrc`, `.playwright-mcp`, `.opencode`, `SPEC.md`,
   `AGENTS.md`, stray `*.png` screenshots, and the Node-only build inputs
   that shouldn't ship (`index.template.html`, `scripts/`, `package.json`,
   `test/`). `index.html` itself, `js/`, `css/`, `assets/`, `CNAME`,
   `.nojekyll`, `robots.txt`, and `sitemap.xml` are **not** excluded — they
   are the deployed site.
5. **Upload** via `actions/upload-pages-artifact@v3` and **deploy** via
   `actions/deploy-pages@v4`. `CNAME` and `.nojekyll` are included in the
   artifact automatically.

### Updating content

`js/data.js` is the **single source of truth** for all content. Every
`workExperience`, `extraCurricular`, and `projects` entry carries a stable
`id` that is also used as the child key in `TREE`.

To add an entry:
1. Add the object (with a unique `id`) to the appropriate array in
   `data.js`.
2. Add its `id` to `TREE.<parent>.children`.
3. Run `node scripts/build.mjs` (or `npm run build`) to regenerate
   `index.html`, and commit the result. CI's `--check` step fails the
   deploy if this is skipped.

Editing `data.js` alone is enough to see the change locally — the live,
JS-rendered view reads `data.js` directly on every page load. Only the
*committed* `index.html` (used for the no-JS fallback, SEO meta, and as the
file GitHub Pages actually serves before JS boots) needs the build step.

### Trade-offs

1. **`index.html` generation is automated, but not enforced locally.**
   `scripts/build.mjs` + the `--check` CI gate remove the old "must
   hand-sync two files" failure mode, but a contributor can still forget to
   run the build before committing — the cost shifts from "silent content
   drift in production" to "a failed CI run that has to be re-pushed."
2. **SVG dashed lines** (not literal box-drawing characters) for
   responsiveness. TUI feel comes from the chrome, card headers, monospace
   font, and palette.
3. **Hash fragments aren't separately indexed.** Mitigated by prerendering
   every section's full content into `index.html`'s hidden `#prerendered`
   block at build time.
4. **All interactive graph elements are `<button type="button">`,** which
   loses native middle-click / right-click "open in new tab" (acceptable,
   since they're in-page view switches, not separate pages) but gains free,
   correct keyboard/screen-reader semantics. Because buttons may only
   contain phrasing content, `content.js` factors each entry's inner markup
   into shared all-`<span>` templates so the clickable (button) and static
   (child-detail `<article>`) renderings never diverge.
5. **`WHEEL_CAP = 8` caps the visible wheel ring**, same as the old
   `ORBIT_CAP`. When a section has more than 8 children (`work` currently
   has 10), only the first 8 appear on the wheel; the rest remain reachable
   via the section's own in-card list and terminal `cd`/`ls`.
6. **The `.collapsed` fallback is a second, independent breakpoint system**
   from the viewport `@media` queries in `css/style.css` — it's gated on the
   *board's* measured height/width/area via `ResizeObserver`, not the
   viewport, so it can trigger on a short-but-wide window that the CSS
   media queries alone would still treat as "desktop." This is more robust
   but means layout state now depends on JS measurement, not CSS alone.
