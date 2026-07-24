// layout.js — pure, DOM-free geometry. No document/window references, so this
// module is safe to unit-test with `node --test` and to import from the
// build script. Every function takes plain numbers/objects and returns
// plain numbers/objects.

/**
 * RING_SLOTS — fixed pentagon positions for the five persistent section
 * nodes, expressed as a percentage of the board (#graph). These never
 * change between views, so ring nodes never move.
 */
export const RING_SLOTS = {
  work: { x: 50, y: 8 },
  projects: { x: 88, y: 37 },
  cluster: { x: 73.5, y: 84 },
  socials: { x: 26.5, y: 84 },
  resume: { x: 12, y: 37 },
};

/**
 * rectPerimeterPoint — the point at arc-length `s` (clockwise from the
 * top-center) along the perimeter of a rectangle centered at the origin with
 * half-extents (halfW, halfH). Returns origin-relative {x, y}.
 */
export function rectPerimeterPoint(halfW, halfH, s) {
  const w = 2 * halfW;
  const h = 2 * halfH;
  const P = 2 * (w + h);
  s = ((s % P) + P) % P;
  if (s < halfW) return { x: s, y: -halfH };            // top edge, center → right
  s -= halfW;
  if (s < h) return { x: halfW, y: -halfH + s };        // right edge, top → bottom
  s -= h;
  if (s < w) return { x: halfW - s, y: halfH };         // bottom edge, right → left
  s -= w;
  if (s < h) return { x: -halfW, y: halfH - s };        // left edge, bottom → top
  s -= h;
  return { x: -halfW + s, y: -halfH };                  // top edge, left → center
}

/**
 * squareWheelPositions — place `count` nodes evenly (by perimeter arc length)
 * around a rectangle ("square wheel") centered at (cx, cy) with half-extents
 * (halfW, halfH). Nodes are centered within their arc segment (offset by half
 * a step) so none sits exactly at the top-center (clear of the vertical spoke
 * to the `work`/`projects` ring node) and the layout is left-right symmetric
 * for even counts. Returns an array of absolute {x, y} points, clockwise from
 * the top.
 */
export function squareWheelPositions({ count, cx, cy, halfW, halfH }) {
  if (!count || count <= 0) return [];
  const P = 2 * (2 * halfW + 2 * halfH);
  const step = P / count;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const s = (i + 0.5) * step;
    const p = rectPerimeterPoint(halfW, halfH, s);
    positions.push({ x: cx + p.x, y: cy + p.y });
  }
  return positions;
}

/**
 * rectEdgePoint — the point where the line from (nx, ny) to (cx, cy) crosses
 * the boundary of an axis-aligned rectangle centered at (cx, cy) with
 * half-width `hw` and half-height `hh`. Used to clip connector lines to a
 * box's edge instead of its center.
 */
export function rectEdgePoint(cx, cy, nx, ny, hw, hh) {
  const dx = nx - cx;
  const dy = ny - cy;
  if (dx === 0 && dy === 0) return { x: nx, y: ny };
  const tx = hw / Math.abs(dx);
  const ty = hh / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: nx - dx * t, y: ny - dy * t };
}

/**
 * largestClearRect — the largest axis-aligned rectangle, centered at (cx, cy)
 * and locked to aspect ratio aw:ah, whose edges stay at least `gap` px away
 * from every node box in `nodes` (each `{x, y, hw, hh}`). Returns
 * `{ halfW, halfH }`.
 *
 * A centered card of half-size (s·aw, s·ah) overlaps a node iff it is within
 * range on BOTH axes; so the node stays clear as long as
 *   s ≤ max( (|dx|-hw-gap)/aw , (|dy|-hh-gap)/ah )
 * (clearing on either axis is enough). The binding limit is the smallest such
 * `s` across all nodes. This is what lets the card grow into the corners that
 * point *between* the ring nodes instead of being crushed by the nearest one.
 */
export function largestClearRect(nodes, cx, cy, gap, aw, ah) {
  let s = Infinity;
  for (const n of nodes) {
    const tw = (Math.abs(n.x - cx) - n.hw - gap) / aw;
    const th = (Math.abs(n.y - cy) - n.hh - gap) / ah;
    s = Math.min(s, Math.max(tw, th));
  }
  if (!Number.isFinite(s) || s < 0) s = 0;
  return { halfW: s * aw, halfH: s * ah };
}

/** One spoke line from `n` (a ring or wheel node) to the card at (cx, cy),
 * clipped to both boxes' edges. Shared by the ring/wheel loops below, which
 * differ only in `type` and which state field marks the active node. */
function spokeLine(n, cx, cy, cardHalf, type, activeId) {
  const start = rectEdgePoint(n.x, n.y, cx, cy, cardHalf.w, cardHalf.h);
  const end = rectEdgePoint(cx, cy, n.x, n.y, n.hw, n.hh);
  return {
    id: n.id,
    type,
    active: n.id === activeId,
    x1: start.x, y1: start.y,
    x2: end.x, y2: end.y,
  };
}

/**
 * graphLinePoints — spoke endpoints for any view (home, section, child):
 * computes lines from card center/edge to ring nodes and/or wheel nodes.
 */
export function graphLinePoints({ cx, cy, cardHalf, ringNodes = [], wheelNodes = [], activeSection = null, activeChild = null }) {
  const lines = [];
  for (const n of ringNodes) lines.push(spokeLine(n, cx, cy, cardHalf, 'ring', activeSection));
  for (const n of wheelNodes) lines.push(spokeLine(n, cx, cy, cardHalf, 'wheel', activeChild));
  return lines;
}
