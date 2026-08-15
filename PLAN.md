# Rebuild Plan — node-graph portfolio

Status: **implemented and verified.** Rebuild started from baseline commit
`c5e6e4f`; the implementation and generated artifact are in this change.

This document records the approved architecture, implementation steps, and
verification contract used for the completed rewrite.

---

## 1. Why a rewrite

The product idea is small: *nodes connected by edges, children under nodes,
an animated transition when you navigate.* The current implementation is
~1,900 lines and does not deliver it — verified live at 1440×900:

| # | Symptom | Root cause |
| --- | --------- | ----------- |
| 1 | `#/work` looks incoherent: 10 unequal boxes on a rectangle perimeter, dotted edges crossing boxes, hub (~121×32) **smaller than its children** (~150×80) | five independent hand-tuned size constants; no uniform node size |
| 2 | `#/work/<child>` pans until only the panel + parent remain, in empty space; bordered box inside bordered node | detail content lives *inside* a node, so the node must become panel-sized |
| 3 | Section→child visibly **swaps** parent content compact↔expanded on frame 1 | compact/expanded toggled with `display`, while the shell resizes |
| 4 | Node heights **snap** instead of animating | expanded height is content-driven (`auto`), which CSS cannot interpolate |
| 5 | Geometry is a constant matrix (5 sizes, 5 hand-placed slots, per-section fan frames) + a test suite whose only job is proving those numbers clear each other | no derived layout |

**One decision causes 1–4: *the focused node is also the detail container.***
Because a node must morph into a content panel, panels get bespoke sizes →
collisions → hand-placed slots; height must be `auto` → snapping; content must
swap → teleporting; a panel can't fit a phone → the board is discarded below
scale `0.78` → **a second content path** (`cardHTML`) duplicating everything.

A previous attempt patched these symptoms in place (crossfade state machine,
fixed hub size, slower timing). It produced new visual regressions and was
reverted. The model is the problem, not the tuning.

### Independent research (completed brief)

- Polished node-graph sites **never grow a node into its detail panel**; the
  graph stays a stable map. Four of five failures above are downstream of that.
- Fan-out ≥5 gets illegible fast — `#/work` has **10 children** (see §8 R1).
- `interpolate-size`/`calc-size()` is **not shippable** (Safari & Firefox 0%).
- **FLIP is wrong for prose** — `scale` distorts text and needs per-frame
  counter-scaling (the same fragility as today's `getScreenCTM` loop).
- Same-document **View Transitions is Baseline** (Chrome 111+, Safari 18+,
  Firefox 144+) — correct as *progressive enhancement* only.
- Reliable core: **fixed numeric width/height transitions + two
  absolutely-positioned crossfading content layers** (~25 lines, universal).
- Nodes should be real `<a href="#/…">`: W3C APG warns against `role="tree"`
  for site navigation. Real links give Tab order, Enter, focus ring,
  open-in-new-tab, screen-reader link list, and the no-JS fallback for free.
- **Reject every dependency** (d3-hierarchy, elkjs, cytoscape, anime.js,
  motion, GSAP). Confirms the zero-dependency decision.

---

## 2. Decisions (locked)

| Decision | Choice |
| --- | --- |
| Visual style | **Keep the TUI aesthetic and execute it well** — mono type, square corners, hairline edges, window chrome. Fix the craft: uniform cards, aligned edges, one type scale. |
| Detail panels | **Sized to fit their content. Never scroll.** If content cannot fit, **trim the copy** in `js/data.js`. |
| Scope | **Any rewrite permitted** where it improves visuals or code quality. |
| Dependencies | **Zero.** No runtime dependency, no bundler, no CDN. |

### Derived architectural rules

1. **The graph is a map; a panel is a panel.** The focused node renders the
   detail panel; all other nodes are **uniform 176×76 cards**. Nothing else
   ever changes size. This kills failure 1.
2. **One DOM, three presentations.** All 28 nodes exist once. Desktop = ring
   layout; narrow = flow layout (same DOM, no JS layout); no-JS = flow layout.
   Deletes `cardHTML` and `prerenderAll`.
3. **Panel height is measured, then written as a number.** Measure natural
   height at the chosen width, then set `height: <n>px` so CSS interpolates it.
   Kills failure 4 while honouring "fit content, never scroll".
4. **Content never swaps mid-flight.** Compact and expanded layers coexist,
   absolutely positioned, crossfading. Kills failure 3.
5. **Edges are drawn centre-to-centre and overpainted by opaque nodes.**
   Deletes all clipping and per-frame resampling. Kills the fragile code.
6. **Layout is derived, never tuned.** Positions come from board size, uniform
   node size, panel size, and child count. Kills failure 5.

---

## 3. The layout algorithm (verified, not aspirational)

Constants: `NODE 176×76`, `GAP 20`, `MARGIN 12`, panel widths
`[880, 820, 760, 700, 640, 580, 520, 480]`. **That is the whole constant set** —
no per-node or per-section constants remain.

```text
ringPositions({ n, startAngle, panelW, panelH, boardW, boardH }):
  rx = boardW/2 - NODE.w/2 - MARGIN        # inscribed ellipse: uses the whole board
  ry = boardH/2 - NODE.h/2 - MARGIN
  place n points at EQUAL ARC LENGTH around that ellipse, from startAngle
  for each point:                          # radial push -> clears panel by construction
    A = panelW/2 + GAP + NODE.w/2
    B = panelH/2 + GAP + NODE.h/2
    u = normalize(point)
    push = min(A/|u.x|, B/|u.y|)           # first radius clearing the panel box
    point = u * max(|point|, push)
    if point outside ellipse: FAIL
  if any two nodes closer than GAP: FAIL
  return points
```

`render` tries panel widths **widest-first** and takes the first that returns
positions; if none do, the view uses **flow layout**. Home starts at −90°
(12 o'clock); child rings start at +90° so children fan *away* from home.

Why this shape: the ellipse fills the board (no dead space), equal arc length
distributes evenly, and the radial push guarantees panel clearance
*by construction* rather than by asserted constants.

### Verified results (real content, real counts)

Rejected alternatives, measured: fixed 720px panel — home **fails** at 1366×768
by 15px; rect-perimeter placement — **11-node work ring fails** at 1366×768.

Panel `width×height` per view, or `flow`:

| viewport | home | work (11) | projects (10) | socials (4) | resume | cluster | work child | proj child |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1920×1080 | 880×414 | 880×105 | 880×105 | 880×105 | 880×202 | 880×293 | 880×214 | 880×150 |
| 1600×900 | 880×414 | 880×105 | 880×105 | 880×105 | 880×202 | 880×293 | 880×214 | 880×150 |
| 1440×900 | 880×414 | 880×105 | 880×105 | 880×105 | 880×202 | 880×293 | 880×214 | 880×150 |
| 1366×768 | 880×414 | 880×105 | 880×105 | 880×105 | 880×202 | 880×293 | 880×214 | 880×150 |
| 1280×800 | 820×414 | 820×105 | 820×105 | 820×105 | 820×202 | 820×293 | 820×236 | 820×150 |
| 1152×864 | 700×451 | 700×105 | 700×105 | 700×105 | 700×202 | 700×293 | 700×259 | 700×172 |
| 1024×768 | flow | flow | 580×105 | 580×105 | 580×202 | 580×293 | 580×281 | 580×172 |
| ≤900 wide | flow | flow | flow | flow | flow | flow | flow | flow |

Every desktop size resolves, **including the 1366×768 home case that failed
under both rejected approaches**. Numbers above use a text-metric estimate; the
implementation measures the real DOM, so heights will shift slightly — the
algorithm adapts automatically because it *searches* rather than assumes.

### Content budget (measured)

Longest strings, wrapped at a 560px content column: `aboutBlurb` 482 chars ≈ 8
lines; longest work paragraph (`uwaterloo-2024`) 461 ≈ 7 lines; every project
desc ≤ 2 lines. All fit the panels above ⇒ **no trimming required now.**
Trim only if step 6 measures a real overflow.

---

## 4. Target file layout

| File | Now | After | Change |
| --- | --- | --- | --- |
| `js/data.js` | 262 | ~262 | unchanged (content only; trim only if §6 finds overflow) |
| `js/router.js` | 66 | ~60 | keep; hash↔state is already correct |
| `js/layout.js` | 97 | ~70 | **rewrite**: `ringPositions` + `edgeLines` |
| `js/render.js` | 598 | ~180 | **rewrite**: roles, measure, place, draw |
| `js/content.js` | 383 | ~200 | **rewrite**: one node set; drop `cardHTML`/`prerenderAll` |
| `js/main.js` | 127 | ~60 | simplify: links do navigation |
| `css/style.css` | 829 | ~380 | **rewrite** |
| `css/theme.css` | 44 | ~44 | keep |
| `test/layout.test.js` | 152 | ~90 | **rewrite**: assert invariants |
| `test/geometry.test.js` | 168 | **deleted** | existed only to prove hand-tuned constants |
| `index.template.html` | 109 | ~90 | simplify |
| `scripts/build.mjs` | 120 | ~90 | keep (SEO/no-JS); emit one node set |
| `SPEC.md` | 454 | ~120 | **done**: was stale ring/wheel history; now the durable requirements |
| `README.md` | 86 | ~110 | **done**: rewritten to the node-graph model |
| `AGENTS.md` | 107 | ~110 | rewrite to match §3 (step 7) |
| `js/flip.js` | — | — | already deleted |

**~1,900 → ~750 lines** of implementation.

---

## 5. Steps

Each step must leave the repo working. Run `node --test` and
`node scripts/build.mjs --check` before moving on.

### Step 0 — Fix the red build (do this first, commit separately)

**`main` is currently failing CI at `c5e6e4f`**, independently of this rebuild.
`.github/workflows/deploy.yml` runs `node scripts/build.mjs --check`, and that
check fails: an auto-formatter reflowed the `<svg id="graph-lines">` element in
`index.template.html` across 4 lines *after* `index.html` was last generated, so
the committed artifact no longer matches its template. The only difference is
that whitespace, so the deployed site is visually unaffected — but **deploys are
blocked**.

Fix: run `node scripts/build.mjs` and commit the regenerated `index.html` on its
own, so the rebuild starts from a green baseline and the fix is not buried in a
large diff. Steps 1–7 then keep the gate green as they go.

### Step 1 — `js/layout.js` + tests

Write `ringPositions` (§3) and `edgeLines({from, to})` (centre-to-centre; no
clipping). Delete `boardScale`, `squareWheelPositions`, `rectPerimeterPoint`,
`rectEdgePoint`, `spokeLines`. Rewrite `test/layout.test.js` to assert
**invariants** for real counts (5 / 11 / 10 / 4): every node clears the panel by
≥ `GAP`, no two nodes overlap, all nodes on-board. Delete
`test/geometry.test.js`. **Gate:** `node --test` green.

### Step 2 — `js/content.js`

Emit **all 28 nodes once**. Each node = one `.node` wrapper with a compact
`<a href="#/…">` (label + one-line meta) and a sibling full-detail `.panel`.
The sibling structure keeps outbound links inside panels valid. Keep `esc`,
`pageTitle`. Delete
`cardHTML`, `prerenderAll`, `activeChildren`, `worldNodesHTML`, `childNodeHTML`,
`homeCard`, and the duplicate section-body builders. **Gate:** build runs.

### Step 3 — `js/render.js`

```text
render(state):
  1. assign each node a role: focus | ring | hidden      (from state + TREE)
  2. measure the focus panel's natural height at each candidate width
  3. ringPositions(...) widest-first -> positions, or flow
  4. write --x/--y/width/height as numbers; toggle role classes
  5. draw edges: focus->ring, centre-to-centre
```

No camera, no `#world` translate, no fan reconciliation, no `getScreenCTM`, no
per-frame resampling, no collapse-to-card path. Measurement uses a single
offscreen probe element (one reflow per navigation). **Gate:** all routes render.

### Step 4 — `css/style.css` (rewrite)

TUI chrome; uniform node cards; `.compact`/`.panel` absolutely positioned and
crossfading (rule 4); numeric size transitions (rule 3); `transform`/`opacity`
only for motion. Flow layout under `@media (max-width: 900px)` **reusing the
same DOM**. `html.nojs` = flow layout. `prefers-reduced-motion` = no transitions.
Motion: **420ms**, `cubic-bezier(0.4, 0, 0.2, 1)`; ring nodes stagger 25ms.

### Step 5 — `js/main.js`, template, build

Navigation is native (`<a href="#/…">`) — no click handler for nodes. `main.js`
keeps only: boot, `hashchange`→render, `Esc` (climb one level), background
click→home, `ResizeObserver`→re-layout, topbar dims. Template gets one node
container + SVG. `build.mjs` injects the same node set. **Gate:**
`node scripts/build.mjs --check` clean.

### Step 6 — Verify (Playwright)

For **every** route at **1440×900, 1366×768, 1280×800, 1024×768, 900×700,
390×844**, assert:

1. **No panel scrolls** (`scrollHeight <= clientHeight + 1`) — trim
   `js/data.js` if violated;
2. no two nodes overlap; every node within the board;
3. section→child: parent content does **not** swap on frame 1; sampled
   mid-transition frames show real intermediate positions;
4. edges visually attached at rest and mid-motion;
5. Tab/Enter/Esc work; hidden nodes are `inert`;
6. console clean; Lighthouse a11y + SEO = 1.0;
7. `prefers-reduced-motion` disables animation.

### Step 7 — Docs, review, commit

Rewrote `AGENTS.md`, aligned `SPEC.md` and `README.md`, ran fresh-context
review, applied the accepted findings, and made one atomic commit.

---

## 6. Definition of done

- Every route at every breakpoint: no overlap, no scrolling panel, no off-board node.
- Navigation slides; no content swap, no snapping height.
- Edges stay attached at rest and during motion.
- Keyboard operable; no-JS renders full content; Lighthouse a11y/SEO 1.0.
- ~750 lines total; one content path; no hand-tuned position constants.
- `node --test` + `node scripts/build.mjs --check` green; console clean.

---

## 7. Non-goals

Pan/zoom; drag; a second "mobile" content path; a graph library; SPA routing;
`role="tree"`; per-node tuning constants.

---

## 8. Risks

- **R1 — `#/work` has 11 ring nodes.** Verified to fit ≥1152px wide, but
  research says fan-out ≥5 strains legibility. **Mitigation:** if it looks
  crowded in step 6, split into `work/roles` + `work/extracurriculars` (a
  `data.js` TREE change, no layout change) — surfaced with a screenshot for a
  decision, never silently tuned.
- **R2 — Measured heights differ from the §3 estimate.** The search adapts
  automatically; worst case a view picks a narrower panel. Watch 1024×768.
- **R3 — Measuring per navigation costs a reflow.** One probe, one reflow, on
  navigation only (not per frame) — strictly cheaper than today's per-frame
  resampling.
- **R4 — Crossfade could still flash.** Both layers are always present; only
  `opacity` animates. If a flash appears, hold the outgoing layer for the full
  duration instead of adding state machinery.

---

## 9. Documentation ownership

The four documents must not contradict each other. Each owns one thing:

| Document | Owns | Must not contain |
| --- | --- | --- |
| `SPEC.md` | **Intent** — requirements, constraints, quality gates | Implementation detail, current file names |
| `PLAN.md` (this file) | **Mechanism** — the algorithm, steps, risks | Restated requirements |
| `README.md` | **Usage** — the idea, commands, repo conventions | Layout internals |
| `AGENTS.md` | **Working notes** — architecture as built, verification recipe | Anything not yet implemented |

On disagreement: `PLAN.md` wins for mechanism, `SPEC.md` wins for intent.

Alignment status:

- `SPEC.md` — **rewritten** (was 454 lines of stale ring/wheel history that
  contradicted both the code at `c5e6e4f` and this plan).
- `README.md` — **rewritten** (described the deleted ring/wheel design and
  listed `js/flip.js`, which no longer exists).
- `AGENTS.md` — **rewritten** for the focus/ring/flow implementation.
- `PLAN.md` — this completed implementation record.
