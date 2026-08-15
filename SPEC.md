# Specification — kanwarpal.com

The **durable requirements** for the site: what it must be and must do,
independent of how it is currently built.

- Implementation strategy, the layout algorithm and the migration steps live in
  [`PLAN.md`](PLAN.md).
- Day-to-day commands and repo conventions live in [`README.md`](README.md).

If this document and `PLAN.md` ever disagree, `PLAN.md` wins for *mechanism*
and this document wins for *intent*.

## 1. Purpose

A personal portfolio for Kanwarpal Brar (software engineer — distributed
systems, backend). It must let two audiences succeed quickly:

1. **Recruiters / hiring managers**, mostly non-technical: who is this person,
   what have they done, can I get the resume and contact details.
2. **Engineers**: what did they actually build, with links to source.

It doubles as a personal artifact: the presentation itself should read as
considered and well-made.

## 2. Product concept

The site is a **node graph**, not a scrolling page:

- Nodes are boxes connected by visible edges.
- **Home** is the root; five sections branch off it: `work`, `projects`,
  `resume`, `socials`, `cluster`.
- `work`, `projects`, `socials` have child nodes. `resume` and `cluster` are
  leaves.
- Selecting a node navigates to it with an animated transition; the focused node
  presents its content.

This is the product, not an experiment. The graph must remain legible to a
visitor who has never seen a node editor.

## 3. Constraints

| Constraint | Requirement |
| --- | --- |
| Hosting | Static files on GitHub Pages. No server, no server-side rendering. |
| Dependencies | **Zero runtime dependencies.** No framework, no bundler. A dependency may only be added with a concrete, quantified justification. |
| Source of truth | All content lives in `js/data.js`. |
| Generated output | `index.html` is a build artifact; never hand-edited; kept in sync by CI. |
| Browsers | Current Chrome, Safari, Firefox (desktop + mobile). Features without broad support may only be used as progressive enhancement. |
| Devices | Must work from a 390px-wide phone to a 1440px+ desktop. |

## 4. Interaction requirements

1. **Navigation** — clicking or activating a node navigates to it. Reaching any
   section or child takes at most two steps from home.
2. **Orientation** — it must always be visually clear which node is focused and
   which nodes can be reached from it.
3. **Going back** — `Esc` climbs one level (child → section → home); clicking
   empty board returns home.
4. **Addressability** — every view has a URL (`#/home`, `#/work`,
   `#/projects/hive`). Deep links, back/forward and open-in-new-tab work.
5. **Animation** — navigation is animated, and the animation must be
   *continuous*: no content swapping mid-flight, no snapping sizes, no element
   teleporting.
6. **Edges** — connectors stay visually attached to their nodes at rest and
   while moving.
7. **Narrow viewports** — when a graph cannot legibly fit, the same content is
   presented as a single scrolling column. This is a presentation change, not a
   different content set.

## 5. Content requirements

Each node type presents:

| Node | Content |
| --- | --- |
| home | Name, tagline, headshot, short bio, "about" paragraph, resume link |
| work | The roles list; each child = title, company, dates, description |
| projects | The projects list; each child = name, description, tags, repo link |
| resume | Blurb + link opening the PDF in a new tab |
| socials | github / linkedin / email, each with handle and link |
| cluster | Private-cluster access explanation + how to request access |

**Panels must fit their content without scrolling.** If content does not fit,
the copy is shortened in `js/data.js` — panels are never made scrollable to
accommodate long text.

## 6. Visual requirements

- **Terminal-inspired (TUI):** monospace type, dark palette, square corners,
  hairline borders, window chrome (title bar + hint bar).
- The aesthetic must be executed consistently: uniform node cards, one type
  scale, one spacing scale, edges that align to node centres.
- Visual hierarchy must be truthful — a parent must never render smaller or
  weaker than its own children.
- No decoration that implies interactivity where none exists.

## 7. Accessibility requirements

- Fully keyboard operable: nodes are reachable with Tab and activated with
  Enter; focus is always visible.
- Navigation is exposed as **links**, not a custom widget; no invented ARIA
  tree/graph roles.
- Off-view nodes must not be focusable or reachable by assistive tech.
- Decorative connectors are hidden from assistive tech.
- `prefers-reduced-motion` disables animation.
- Colour contrast meets WCAG AA or better; the palette in `css/theme.css`
  documents its ratios.
- **Without JavaScript**, the full content of every section is still rendered
  and readable.

## 8. SEO requirements

- The committed `index.html` contains the full prerendered content, title,
  description, Open Graph/Twitter tags, canonical URL and `Person` JSON-LD.
- CI fails if the generated HTML drifts from `js/data.js` / `js/content.js` /
  `index.template.html`.

## 9. Quality gates

A change is acceptable only when all of the following hold:

1. `node --test` passes.
2. `node scripts/build.mjs --check` reports clean.
3. Every route renders at 1440×900, 1366×768, 1280×800, 1024×768, 900×700 and
   390×844 with: no overlapping boxes, no node off-board, no scrolling panel.
4. Transitions show real intermediate motion — no content swap, no size snap.
5. Browser console is free of errors.
6. Lighthouse accessibility and SEO score 1.0.
7. Keyboard navigation and `Esc` behave per §4.

## 10. Non-goals

Pan/zoom or drag-to-explore; a graph/animation library; SPA routing or a
service worker; a CMS or comments; analytics; a separate mobile content set;
per-node hand-tuned layout constants.
