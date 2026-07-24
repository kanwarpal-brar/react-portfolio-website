// test/layout.test.js — unit tests for js/layout.js (pure geometry).
// Run with: node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RING_SLOTS, largestClearRect, rectEdgePoint, graphLinePoints, rectPerimeterPoint, squareWheelPositions } from '../js/layout.js';

test('RING_SLOTS has exactly the 5 section ids, each within [0,100]', () => {
  const ids = Object.keys(RING_SLOTS);
  assert.deepEqual(ids.sort(), ['cluster', 'projects', 'resume', 'socials', 'work'].sort());
  for (const slot of Object.values(RING_SLOTS)) {
    assert.ok(slot.x >= 0 && slot.x <= 100, `x out of range: ${slot.x}`);
    assert.ok(slot.y >= 0 && slot.y <= 100, `y out of range: ${slot.y}`);
  }
});

test('largestClearRect keeps a gap to every node and never overlaps one', () => {
  const cx = 100, cy = 100, gap = 10;
  const nodes = [
    { id: 'top', x: 100, y: 0, hw: 20, hh: 15 },     // straight above
    { id: 'right', x: 220, y: 100, hw: 20, hh: 15 }, // straight right
    { id: 'diag', x: 180, y: 180, hw: 20, hh: 15 },  // lower-right diagonal
  ];
  const { halfW, halfH } = largestClearRect(nodes, cx, cy, gap, 16, 10);
  assert.ok(halfW > 0 && halfH > 0);
  assert.ok(Math.abs(halfW / halfH - 1.6) < 1e-9, 'aspect ratio locked to 16:10');
  // A centered rect of (halfW, halfH) must clear every node on at least one axis by `gap`.
  for (const n of nodes) {
    const clearX = Math.abs(n.x - cx) - n.hw - halfW >= gap - 1e-6;
    const clearY = Math.abs(n.y - cy) - n.hh - halfH >= gap - 1e-6;
    assert.ok(clearX || clearY, `rect does not clear ${n.id}`);
  }
});

test('largestClearRect clamps to zero when nodes leave no room', () => {
  const nodes = [{ id: 'a', x: 0, y: 5, hw: 2, hh: 2 }];
  const { halfW, halfH } = largestClearRect(nodes, 0, 0, 10, 1, 1);
  assert.equal(halfW, 0);
  assert.equal(halfH, 0);
});

test('rectEdgePoint clips to the box centered at (nx,ny) along the ray toward (cx,cy)', () => {
  // Box is centered at the SECOND point (nx,ny); the ray comes from (cx,cy).
  // Box at (100,0), half 10x10, ray from the origin -> exits at its left edge.
  const p = rectEdgePoint(0, 0, 100, 0, 10, 10);
  assert.ok(Math.abs(p.x - 90) < 1e-9);
  assert.ok(Math.abs(p.y - 0) < 1e-9);
});

test('rectEdgePoint handles a coincident point without dividing by zero', () => {
  const p = rectEdgePoint(5, 5, 5, 5, 10, 10);
  assert.deepEqual(p, { x: 5, y: 5 });
});

test('rectEdgePoint clips diagonally on a non-square rect', () => {
  // Box at (100,100), half 40x10 (wide/short), ray from the origin: the
  // height constraint (ty=10/100) binds before the width constraint
  // (tx=40/100), so it exits through the top/bottom edge, not the sides.
  const p = rectEdgePoint(0, 0, 100, 100, 40, 10);
  assert.ok(Math.abs(p.y - 90) < 1e-9);
  assert.ok(Math.abs(p.x - 90) < 1e-9);
});

test('graphLinePoints returns [] for no nodes', () => {
  assert.deepEqual(graphLinePoints({ cx: 0, cy: 0, cardHalf: { w: 1, h: 1 } }), []);
});

test('rectPerimeterPoint walks clockwise from the top-center', () => {
  const hw = 40, hh = 20; // rect 80x40
  assert.deepEqual(rectPerimeterPoint(hw, hh, 0), { x: 0, y: -20 });          // top-center
  assert.deepEqual(rectPerimeterPoint(hw, hh, hw), { x: 40, y: -20 });        // top-right corner
  assert.deepEqual(rectPerimeterPoint(hw, hh, hw + hh), { x: 40, y: 0 });     // mid right edge
  assert.deepEqual(rectPerimeterPoint(hw, hh, hw + 2 * hh), { x: 40, y: 20 });// bottom-right corner
  const P = 2 * (2 * hw + 2 * hh);
  assert.deepEqual(rectPerimeterPoint(hw, hh, P), rectPerimeterPoint(hw, hh, 0)); // wraps
});

test('squareWheelPositions returns [] for zero/undefined count', () => {
  assert.deepEqual(squareWheelPositions({ count: 0, cx: 0, cy: 0, halfW: 10, halfH: 10 }), []);
  assert.deepEqual(squareWheelPositions({ cx: 0, cy: 0, halfW: 10, halfH: 10 }), []);
});

test('squareWheelPositions places every node on the frame perimeter, none at exact top-center', () => {
  const cx = 100, cy = 100, halfW = 50, halfH = 30;
  const pts = squareWheelPositions({ count: 8, cx, cy, halfW, halfH });
  assert.equal(pts.length, 8);
  for (const p of pts) {
    const dx = Math.abs(p.x - cx);
    const dy = Math.abs(p.y - cy);
    const onEdge = Math.abs(dx - halfW) < 1e-9 || Math.abs(dy - halfH) < 1e-9;
    assert.ok(onEdge, `point off perimeter: (${p.x},${p.y})`);
    assert.ok(dx <= halfW + 1e-9 && dy <= halfH + 1e-9, `point outside frame: (${p.x},${p.y})`);
    assert.ok(!(dx < 1e-9 && p.y < cy), 'node at exact top-center');
  }
});

test('squareWheelPositions is left-right symmetric for even counts', () => {
  const pts = squareWheelPositions({ count: 8, cx: 0, cy: 0, halfW: 40, halfH: 40 });
  for (const p of pts) {
    const mirror = pts.some((q) => Math.abs(q.x + p.x) < 1e-9 && Math.abs(q.y - p.y) < 1e-9);
    assert.ok(mirror, `no mirror for (${p.x},${p.y})`);
  }
});

test('graphLinePoints distinguishes ring vs wheel nodes and identifies active nodes', () => {
  const lines = graphLinePoints({
    cx: 100,
    cy: 100,
    cardHalf: { w: 20, h: 20 },
    ringNodes: [{ id: 'work', x: 100, y: 0, hw: 10, hh: 5 }],
    wheelNodes: [
      { id: 'carta', x: 200, y: 100, hw: 10, hh: 5 },
      { id: 'hive', x: 100, y: 200, hw: 10, hh: 5 },
    ],
    activeSection: 'work',
    activeChild: 'hive',
  });

  assert.equal(lines.length, 3);
  assert.deepEqual(lines[0], {
    id: 'work',
    type: 'ring',
    active: true,
    x1: 100,
    y1: 80,
    x2: 100,
    y2: 5,
  });
  assert.equal(lines[1].id, 'carta');
  assert.equal(lines[1].type, 'wheel');
  assert.equal(lines[1].active, false);

  assert.equal(lines[2].id, 'hive');
  assert.equal(lines[2].type, 'wheel');
  assert.equal(lines[2].active, true);
});
