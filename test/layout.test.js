// test/layout.test.js — unit tests for js/layout.js (pure geometry).
// Run with: node --test

import { test } from "node:test";
import assert from "node:assert/strict";
import {
	boardScale,
	rectEdgePoint,
	spokeLines,
	rectPerimeterPoint,
	squareWheelPositions,
} from "../js/layout.js";

test("boardScale takes the smaller per-axis fit, capped at max", () => {
	const opts = { margin: 12, fitW: 1000, fitH: 500, max: 1.3 };
	// Both axes fit exactly -> 1
	assert.ok(Math.abs(boardScale({ bw: 1024, bh: 524, ...opts }) - 1) < 1e-9);
	// Height binds: (274 - 24) / 500 = 0.5 even though width fits at 1
	assert.ok(Math.abs(boardScale({ bw: 1024, bh: 274, ...opts }) - 0.5) < 1e-9);
	// Width binds: (524 - 24) / 1000 = 0.5
	assert.ok(Math.abs(boardScale({ bw: 524, bh: 524, ...opts }) - 0.5) < 1e-9);
	// Larger board caps at max
	assert.equal(boardScale({ bw: 5000, bh: 5000, ...opts }), 1.3);
	// Never negative, even on a degenerate board
	assert.equal(boardScale({ bw: 0, bh: 0, ...opts }), 0);
});

test("rectEdgePoint clips to the box centered at (nx,ny) along the ray toward (cx,cy)", () => {
	// Box is centered at the SECOND point (nx,ny); the ray comes from (cx,cy).
	// Box at (100,0), half 10x10, ray from the origin -> exits at its left edge.
	const p = rectEdgePoint(0, 0, 100, 0, 10, 10);
	assert.ok(Math.abs(p.x - 90) < 1e-9);
	assert.ok(Math.abs(p.y - 0) < 1e-9);
});

test("rectEdgePoint handles a coincident point without dividing by zero", () => {
	const p = rectEdgePoint(5, 5, 5, 5, 10, 10);
	assert.deepEqual(p, { x: 5, y: 5 });
});

test("rectEdgePoint clips diagonally on a non-square rect", () => {
	// Box at (100,100), half 40x10 (wide/short), ray from the origin: the
	// height constraint (ty=10/100) binds before the width constraint
	// (tx=40/100), so it exits through the top/bottom edge, not the sides.
	const p = rectEdgePoint(0, 0, 100, 100, 40, 10);
	assert.ok(Math.abs(p.y - 90) < 1e-9);
	assert.ok(Math.abs(p.x - 90) < 1e-9);
});

test("spokeLines returns [] for no nodes", () => {
	assert.deepEqual(
		spokeLines({
			hub: { x: 0, y: 0, hw: 1, hh: 1 },
			nodes: [],
			type: "section",
		}),
		[],
	);
});

test("rectPerimeterPoint walks clockwise from the top-center", () => {
	const hw = 40,
		hh = 20; // rect 80x40
	assert.deepEqual(rectPerimeterPoint(hw, hh, 0), { x: 0, y: -20 }); // top-center
	assert.deepEqual(rectPerimeterPoint(hw, hh, hw), { x: 40, y: -20 }); // top-right corner
	assert.deepEqual(rectPerimeterPoint(hw, hh, hw + hh), { x: 40, y: 0 }); // mid right edge
	assert.deepEqual(rectPerimeterPoint(hw, hh, hw + 2 * hh), { x: 40, y: 20 }); // bottom-right corner
	const P = 2 * (2 * hw + 2 * hh);
	assert.deepEqual(
		rectPerimeterPoint(hw, hh, P),
		rectPerimeterPoint(hw, hh, 0),
	); // wraps
});

test("squareWheelPositions returns [] for zero/undefined count", () => {
	assert.deepEqual(
		squareWheelPositions({ count: 0, cx: 0, cy: 0, halfW: 10, halfH: 10 }),
		[],
	);
	assert.deepEqual(
		squareWheelPositions({ cx: 0, cy: 0, halfW: 10, halfH: 10 }),
		[],
	);
});

test("squareWheelPositions places every node on the frame perimeter, none at exact top-center", () => {
	const cx = 100,
		cy = 100,
		halfW = 50,
		halfH = 30;
	const pts = squareWheelPositions({ count: 8, cx, cy, halfW, halfH });
	assert.equal(pts.length, 8);
	for (const p of pts) {
		const dx = Math.abs(p.x - cx);
		const dy = Math.abs(p.y - cy);
		const onEdge = Math.abs(dx - halfW) < 1e-9 || Math.abs(dy - halfH) < 1e-9;
		assert.ok(onEdge, `point off perimeter: (${p.x},${p.y})`);
		assert.ok(
			dx <= halfW + 1e-9 && dy <= halfH + 1e-9,
			`point outside frame: (${p.x},${p.y})`,
		);
		assert.ok(!(dx < 1e-9 && p.y < cy), "node at exact top-center");
	}
});

test("squareWheelPositions is left-right symmetric for even counts", () => {
	const pts = squareWheelPositions({
		count: 8,
		cx: 0,
		cy: 0,
		halfW: 40,
		halfH: 40,
	});
	for (const p of pts) {
		const mirror = pts.some(
			(q) => Math.abs(q.x + p.x) < 1e-9 && Math.abs(q.y - p.y) < 1e-9,
		);
		assert.ok(mirror, `no mirror for (${p.x},${p.y})`);
	}
});

test("spokeLines clips both real node edges and identifies the active node", () => {
	const lines = spokeLines({
		hub: { id: "home", x: 100, y: 100, hw: 20, hh: 20 },
		nodes: [
			{ id: "work", x: 100, y: 0, hw: 10, hh: 5 },
			{ id: "hive", x: 200, y: 100, hw: 10, hh: 5 },
		],
		type: "section",
		activeId: "work",
	});

	assert.equal(lines.length, 2);
	assert.deepEqual(lines[0], {
		id: "work",
		type: "section",
		active: true,
		x1: 100,
		y1: 80,
		x2: 100,
		y2: 5,
	});
	assert.deepEqual(lines[1], {
		id: "hive",
		type: "section",
		active: false,
		x1: 120,
		y1: 100,
		x2: 190,
		y2: 100,
	});
});
