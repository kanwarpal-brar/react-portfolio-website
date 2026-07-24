// render.js — orchestrator. Builds the static shell once (ring), then
// applies render(state) as a pure function of state (§3.3 in the plan):
// same state in -> same DOM out. Geometry (wheel placement + home spokes)
// is recomputed only when the board resizes, via scheduleGeometry().

import { RING_SLOTS, squareWheelPositions, graphLinePoints, largestClearRect } from './layout.js';
import { ringNodesHTML, cardHTML, wheelChildren, wheelItemHTML, pageTitle, cardAriaLabel } from './content.js';
import { currentState } from './router.js';

// Gaps (px). GAP_RING is the clearance the card (home) or the wheel band
// (sections) keeps from the outer ring nodes; GAP_CARD is the clearance the
// section card keeps from its surrounding wheel items. Both are guaranteed by
// deriving every band's size from the measured ring geometry (applyGeometry).
const GAP_RING = 20;
const GAP_CARD = 16;

// Card size caps so the card never grows absurdly large on big screens.
//  - HOME:    a document (bio + about). Wide, so the prose reflows into few
//             enough lines to fit the ring's limited vertical band (no scroll).
//  - SECTION: the work/projects hub — just a title + one-line tagline; the
//             wheel carries the content, so the hub is a single small node,
//             about the same size as a ring node, not a scaled-down card.
//  - LEAF:    resume/socials/cluster section views (no wheel) — a medium card.
//  - CHILD:   a work/project detail (no wheel) — large, so the full description
//             is visible without scrolling.
const HOME_CARD_MAX = { w: 900, h: 480 };
const SECTION_CARD_MAX = { w: 150, h: 72 };
const LEAF_CARD_MAX = { w: 540, h: 400 };
const CHILD_CARD_MAX = { w: 740, h: 470 };
// Floor below which we stop shrinking and let the collapse fallback take over.
const CARD_MIN = { w: 200, h: 130 };
// The hub node's own (much smaller) floor — its title + tagline content is
// tiny by design, so it must be allowed to shrink well below CARD_MIN before
// the composition collapses.
const SECTION_CARD_MIN = { w: 110, h: 52 };

// Below this height, width, or area, the concentric ring+wheel+card
// composition collapses to a card-only layout (gated on height/area, not
// width alone, so short laptop viewports collapse correctly — a pure width
// breakpoint would misclassify those as "desktop" and crush the layout).
const COLLAPSE_MIN_HEIGHT = 460;
const COLLAPSE_MIN_WIDTH = 620;
const COLLAPSE_MIN_AREA = 460 * 640;

const WHEEL_STAGGER_MS = 35;

/** id -> wheel-item element, for keyed reconciliation across renders. */
const wheelItems = new Map();
/** ids that were just created this render pass and are still ".entering". */
let pendingEnter = [];

// ---- one-time shell construction ------------------------------------------

export function initShell() {
  const ring = document.getElementById('ring');
  if (!ring || ring.dataset.built) return;
  ring.innerHTML = ringNodesHTML();
  ring.dataset.built = '1';
  for (const [id, slot] of Object.entries(RING_SLOTS)) {
    const btn = ring.querySelector(`[data-section="${id}"]`);
    if (btn) {
      btn.style.setProperty('--x', slot.x + '%');
      btn.style.setProperty('--y', slot.y + '%');
    }
  }
}

// ---- render(state) ----------------------------------------------------------

export function render(state) {
  const graph = document.getElementById('graph');
  const card = document.getElementById('card');
  if (!graph || !card) return;

  // 1. attrs
  graph.dataset.view = state.view;
  if (state.section) graph.dataset.section = state.section;
  else delete graph.dataset.section;
  if (state.child) graph.dataset.child = state.child;
  else delete graph.dataset.child;

  // 2. content
  card.innerHTML = cardHTML(state);
  card.scrollTop = 0;
  card.setAttribute('aria-label', cardAriaLabel(state));

  // 3. ring active state
  const ring = document.getElementById('ring');
  if (ring) {
    for (const btn of ring.querySelectorAll('[data-section]')) {
      const isActive = state.section === btn.dataset.section;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    }
  }

  // 4. wheel (keyed reconciliation — see updateWheel)
  updateWheel(state);

  // 5. title
  document.title = pageTitle(state);

  // 6. spokes + wheel placement — needs post-layout measurement
  scheduleGeometry();
}

// ---- wheel reconciliation (keyed by child id) -------------------------------

function updateWheel(state) {
  const wheel = document.getElementById('wheel');
  if (!wheel) return;
  const ids = wheelChildren(state);
  wheel.hidden = ids.length === 0;
  if (ids.length === 0) {
    for (const el of wheelItems.values()) el.remove();
    wheelItems.clear();
    pendingEnter = [];
    return;
  }

  const seen = new Set(ids);
  pendingEnter = [];

  ids.forEach((id, i) => {
    let el = wheelItems.get(id);
    if (!el) {
      el = document.createElement('button');
      el.type = 'button';
      el.className = 'wheel-item entering';
      el.dataset.child = id;
      el.style.transitionDelay = i * WHEEL_STAGGER_MS + 'ms';
      el.innerHTML = wheelItemHTML(id);
      wheel.appendChild(el);
      wheelItems.set(id, el);
      pendingEnter.push(el);
    } else {
      el.style.transitionDelay = '';
      wheel.appendChild(el); // reorder to match `ids` order
    }
    el.classList.toggle('active', id === state.child);
  });

  // Anything tracked but no longer in `ids` is leaving: fade out in place
  // (no repositioning) and remove once the transition finishes.
  for (const [id, el] of Array.from(wheelItems.entries())) {
    if (seen.has(id)) continue;
    wheelItems.delete(id);
    el.classList.add('leaving');
    el.classList.remove('entering');
    const done = () => el.remove();
    el.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 500); // safety net if transitionend never fires
  }
}

// ---- geometry (rAF-coalesced; recomputed on resize) -------------------------

let _rafId = 0;
export function scheduleGeometry() {
  if (_rafId) cancelAnimationFrame(_rafId);
  _rafId = requestAnimationFrame(() => {
    _rafId = 0;
    applyGeometry();
  });
}

export function applyGeometry() {
  const graph = document.getElementById('graph');
  const card = document.getElementById('card');
  const ring = document.getElementById('ring');
  const wheel = document.getElementById('wheel');
  if (!graph || !card) return;

  const gr = graph.getBoundingClientRect();
  if (!gr.width || !gr.height) return;

  const state = currentState();

  // Card center is the board's geometric center (CSS pins #card there with
  // left/top:50% + translate(-50%,-50%)). Using the board center — not the
  // card's getBoundingClientRect — makes geometry immune to the flip
  // entrance transform (which scales/translates the card mid-animation).
  const cx = gr.width / 2;
  const cy = gr.height / 2;

  // Ring node boxes (graph-relative px), measured once and shared by the
  // card-sizing math, the wheel-fitting math, and the spoke drawing.
  const ringNodes = measureRingNodes(ring, gr);

  // On a cold load the first geometry pass can fire before the ring buttons
  // have layout (0-width): committing then would leave the card unsized and the
  // wheel unplaced, and nothing would re-run if the board size never changes.
  // Bail and retry next frame instead — the ring always lays out eventually.
  if (ring && ringNodes.length === 0) {
    scheduleGeometry();
    return;
  }

  const wheelVisible = !!(wheel && !wheel.hidden);

  // Largest half-size of any wheel item, so both the wheel band and the card
  // leave room for the actual boxes (not just their centers).
  let itemHW = 0;
  let itemHH = 0;
  if (wheelVisible) {
    for (const el of wheelItems.values()) {
      itemHW = Math.max(itemHW, el.offsetWidth / 2);
      itemHH = Math.max(itemHH, el.offsetHeight / 2);
    }
  }

  // --- size the card + wheel band, derived INWARD from the fixed ring -------
  // Sizing every band from the measured ring guarantees a gap to the ring
  // (GAP_RING) and, for sections, between the card and its wheel (GAP_CARD),
  // at any viewport — replacing the old fixed-percentage card that could
  // overlap the ring depending on aspect ratio. If the derived card would fall
  // below CARD_MIN, the composition genuinely doesn't fit, so we collapse to
  // the card-only layout instead of forcing an overlapping card.
  let collapsed =
    gr.height < COLLAPSE_MIN_HEIGHT || gr.width < COLLAPSE_MIN_WIDTH || gr.width * gr.height < COLLAPSE_MIN_AREA;
  let frame = null; // wheel-item-center frame (sections only)
  let cardW = 0;
  let cardH = 0;
  // The card is sized to its CONTENT height, clamped to this band, so short
  // content doesn't leave a big empty card and long content still never
  // scrolls. 0 = don't content-fit. Set for every view, including the
  // wheel-visible hub — its lede is even shorter than a leaf's.
  let bandH = 0;

  if (!collapsed && ringNodes.length) {
    if (wheelVisible) {
      // work/projects hub: the wheel carries the content, so the center card
      // stays small (SECTION_CARD_MAX) — it's mostly whitespace otherwise.
      // The wheel's ring-clearing ceiling: items may not sit any further out
      // than this without crowding the ring (GAP_RING). Aspect 2:1 spreads the
      // ceiling across the board's wide axis instead of stacking it vertically.
      const env = largestClearRect(ringNodes, cx, cy, GAP_RING, 2, 1);
      const maxHalfW = Math.max(0, env.halfW - itemHW);
      const maxHalfH = Math.max(0, env.halfH - itemHH);
      // The wheel's card-hugging floor: the closest items can sit to the small
      // hub card while still clearing it by GAP_CARD. Deriving the wheel from
      // the CARD (instead of always parking it out at the ring ceiling) is what
      // pulls it in off the ring and closes the dead space around the hub card
      // — the frame only falls back outward toward the ceiling above when the
      // tight radius would itself crowd the ring.
      const minHalfW = SECTION_CARD_MAX.w / 2 + GAP_CARD + itemHW;
      const minHalfH = SECTION_CARD_MAX.h / 2 + GAP_CARD + itemHH;
      const f = { halfW: Math.min(minHalfW, maxHalfW), halfH: Math.min(minHalfH, maxHalfH) };
      // Card-clearance alone doesn't guarantee the items clear EACH OTHER —
      // squareWheelPositions spaces N items by arc length, so a frame sized
      // just to clear the (small) card can still be too tight to fit every
      // item without overlapping its neighbor once N is large (e.g. all 10
      // work entries). Grow the frame outward — never past the ring ceiling —
      // until every pair of item boxes clears.
      const ids = wheelChildren(state);
      let guard = 0;
      while (
        (f.halfW < maxHalfW || f.halfH < maxHalfH) &&
        guard++ < 40 &&
        !wheelItemsClear(ids.length, f, cx, cy, itemHW, itemHH)
      ) {
        f.halfW = Math.min(maxHalfW, f.halfW * 1.06);
        f.halfH = Math.min(maxHalfH, f.halfH * 1.06);
      }
      // The card must still fit inside the wheel frame (one GAP_CARD + item-half
      // in) even though it's capped small — if even that floor won't nest, the
      // ring + wheel + card genuinely don't fit, so collapse. Uses the hub's
      // own (smaller) floor, not the shared CARD_MIN — a title + tagline node
      // stays legible far smaller than a card with a heading and paragraph.
      const availW = 2 * (f.halfW - itemHW - GAP_CARD);
      const availH = 2 * (f.halfH - itemHH - GAP_CARD);
      // If growth maxed out at the ring ceiling and items STILL overlap, the
      // board is too small to fit every item at its designed size — collapse
      // to the scrolling card+list rather than render overlapping, unreadable
      // boxes (this is the same bar the card-fit check above already holds
      // the composition to).
      if (
        availW < SECTION_CARD_MIN.w ||
        availH < SECTION_CARD_MIN.h ||
        !wheelItemsClear(ids.length, f, cx, cy, itemHW, itemHH)
      ) {
        collapsed = true;
      } else {
        frame = f;
        cardW = Math.min(SECTION_CARD_MAX.w, availW);
        cardH = Math.min(SECTION_CARD_MAX.h, availH);
        bandH = cardH; // hub node also hugs its own (tiny) content, see below
      }
    } else {
      // No wheel: the card fills the ring envelope up to its per-view cap.
      // Home is wide (2:1) so its prose reflows short enough to fit the ring's
      // vertical band; child/leaf views are nearer 3:2 for paragraph text.
      const isHome = state.view === 'home';
      const cap = isHome ? HOME_CARD_MAX : state.view === 'child' ? CHILD_CARD_MAX : LEAF_CARD_MAX;
      const aw = isHome ? 2 : 3;
      const ah = isHome ? 1 : 2;
      const env = largestClearRect(ringNodes, cx, cy, GAP_RING, aw, ah);
      if (2 * env.halfW < CARD_MIN.w || 2 * env.halfH < CARD_MIN.h) {
        collapsed = true;
      } else {
        cardW = Math.min(cap.w, 2 * env.halfW);
        cardH = Math.min(cap.h, 2 * env.halfH);
        bandH = cardH; // upper bound for the content-fit measurement below
      }
    }
  }

  graph.classList.toggle('collapsed', collapsed);
  if (!collapsed && cardW && cardH) {
    if (bandH) cardH = fitCardHeight(card, cardW, bandH, wheelVisible ? SECTION_CARD_MIN.h : CARD_MIN.h);
    setCardSize(card, Math.round(cardW), Math.round(cardH));
  } else {
    card.style.removeProperty('--card-w');
    card.style.removeProperty('--card-h');
  }

  // Card half-size from the final LAYOUT box (offsetWidth/Height ignore CSS
  // transforms, so spoke card-edge clips stay correct during the flip). The
  // read also flushes the size just set above.
  const cardHalf = { w: card.offsetWidth / 2, h: card.offsetHeight / 2 };

  // --- place wheel items on the frame perimeter ----------------------------
  if (wheelVisible && frame) {
    const ids = wheelChildren(state);
    const positions = squareWheelPositions({ count: ids.length, cx, cy, halfW: frame.halfW, halfH: frame.halfH });
    ids.forEach((id, i) => {
      const el = wheelItems.get(id);
      const pos = positions[i];
      if (el && pos) {
        el.style.setProperty('--x', pos.x + 'px');
        el.style.setProperty('--y', pos.y + 'px');
      }
    });
  }

  // spokes (rendered across all non-collapsed views)
  if (!collapsed) {
    drawSpokes(graph, wheel, gr, cx, cy, cardHalf, ringNodes, state);
  } else {
    clearSpokes();
  }

  // Reveal newly-entered wheel items on the NEXT frame, so the browser has
  // already painted their initial (positioned, but faded/scaled) state —
  // this is what makes the entrance a transition rather than a jump cut.
  if (pendingEnter.length) {
    const toReveal = pendingEnter;
    pendingEnter = [];
    requestAnimationFrame(() => {
      for (const el of toReveal) el.classList.remove('entering');
    });
  }
}

/** Pin the card's box via CSS custom properties consumed by #card in style.css. */
function setCardSize(card, w, h) {
  card.style.setProperty('--card-w', w + 'px');
  card.style.setProperty('--card-h', h + 'px');
}

/**
 * Natural content height of the card at width `w`, clamped to the ring band
 * `bandH`. Temporarily lays the card out at auto height (capped at bandH) and
 * measures it, so the card hugs its content instead of always filling the band —
 * short detail/leaf views don't leave a tall empty card, and content that would
 * exceed the band is bounded (never scrolls in the non-collapsed layout).
 */
function fitCardHeight(card, w, bandH, minH = CARD_MIN.h) {
  card.style.setProperty('--card-w', w + 'px');
  const prevH = card.style.height;
  const prevMax = card.style.maxHeight;
  card.style.height = 'auto';
  card.style.maxHeight = bandH + 'px';
  const contentH = card.offsetHeight; // min(content, bandH), includes padding
  card.style.height = prevH;
  card.style.maxHeight = prevMax;
  return Math.max(minH, Math.min(bandH, contentH));
}

/** True if no two of `count` items placed on frame {halfW,halfH} would overlap. */
function wheelItemsClear(count, frame, cx, cy, itemHW, itemHH) {
  if (count <= 1) return true;
  const positions = squareWheelPositions({ count, cx, cy, halfW: frame.halfW, halfH: frame.halfH });
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = Math.abs(positions[i].x - positions[j].x);
      const dy = Math.abs(positions[i].y - positions[j].y);
      if (dx < itemHW * 2 && dy < itemHH * 2) return false;
    }
  }
  return true;
}

function measureRingNodes(ring, gr) {
  const ringNodes = [];
  if (!ring) return ringNodes;
  for (const btn of ring.querySelectorAll('[data-section]')) {
    const r = btn.getBoundingClientRect();
    if (!r.width) continue;
    ringNodes.push({
      id: btn.dataset.section,
      x: r.left - gr.left + r.width / 2,
      y: r.top - gr.top + r.height / 2,
      hw: r.width / 2 - 2,
      hh: r.height / 2 - 2,
    });
  }
  return ringNodes;
}

function drawSpokes(graph, wheel, gr, cx, cy, cardHalf, ringNodes, state) {
  const svg = document.getElementById('graph-lines');
  if (!svg) return;
  svg.setAttribute('viewBox', `0 0 ${gr.width} ${gr.height}`);
  svg.setAttribute('width', gr.width);
  svg.setAttribute('height', gr.height);
  svg.innerHTML = '';
  svg.style.opacity = '';

  const wheelNodes = [];
  if (wheel && !wheel.hidden) {
    for (const el of wheelItems.values()) {
      // Derive target position from CSS custom properties (no mid-transition
      // drift) so spoke lines always point to the correct target.
      const tx = parseFloat(el.style.getPropertyValue('--x')) || 0;
      const ty = parseFloat(el.style.getPropertyValue('--y')) || 0;
      const hw = el.offsetWidth / 2 - 2;
      const hh = el.offsetHeight / 2 - 2;
      if (!el.offsetWidth) continue;
      wheelNodes.push({
        id: el.dataset.child,
        x: tx,
        y: ty,
        hw,
        hh,
      });
    }
  }

  const lines = graphLinePoints({
    cx,
    cy,
    cardHalf,
    ringNodes,
    wheelNodes,
    activeSection: state.section,
    activeChild: state.child,
  });

  for (const l of lines) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', l.x1);
    line.setAttribute('y1', l.y1);
    line.setAttribute('x2', l.x2);
    line.setAttribute('y2', l.y2);

    let cls = l.type === 'ring' ? 'line-ring' : 'line-wheel';
    if (l.active) cls += l.type === 'ring' ? ' line-ring-active' : ' line-wheel-active';
    line.setAttribute('class', cls);

    svg.appendChild(line);
  }
}

function clearSpokes() {
  const svg = document.getElementById('graph-lines');
  if (!svg) return;
  svg.innerHTML = '';
  svg.style.opacity = '0';
}
