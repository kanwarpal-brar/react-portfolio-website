// layout.test.js — invariant tests for the derived focus-and-ring geometry.

import { test } from "node:test";
import assert from "node:assert/strict";
import { edgeLines, GAP, MARGIN, NODE, ringPositions } from "../js/layout.js";
import { renderSite } from "../scripts/build.mjs";

function assertValidRing({ points, panelW, panelH, boardW, boardH }) {
	assert.ok(points, "expected this board to fit a ring");
	for (const [index, point] of points.entries()) {
		assert.ok(point.x - NODE.w / 2 >= 0, `node ${index} escapes left`);
		assert.ok(point.x + NODE.w / 2 <= boardW, `node ${index} escapes right`);
		assert.ok(point.y - NODE.h / 2 >= 0, `node ${index} escapes top`);
		assert.ok(point.y + NODE.h / 2 <= boardH, `node ${index} escapes bottom`);
		const clearsPanel =
			Math.abs(point.x - boardW / 2) - (panelW + NODE.w) / 2 >= GAP ||
			Math.abs(point.y - boardH / 2) - (panelH + NODE.h) / 2 >= GAP;
		assert.ok(clearsPanel, `node ${index} overlaps the focus panel`);
	}
	for (let left = 0; left < points.length; left++) {
		for (let right = left + 1; right < points.length; right++) {
			const clearance = Math.max(
				Math.abs(points[left].x - points[right].x) - NODE.w,
				Math.abs(points[left].y - points[right].y) - NODE.h,
			);
			assert.ok(clearance >= GAP, `nodes ${left}/${right} are too close`);
		}
	}
}

const BOARD = { boardW: 1416, boardH: 790 };

test("ringPositions returns valid derived geometry for every real ring count", () => {
	for (const [name, n, panelW, panelH, startAngle] of [
		["home", 5, 880, 414, -Math.PI / 2],
		["work", 11, 880, 105, Math.PI / 2],
		["projects", 10, 880, 105, Math.PI / 2],
		["socials", 4, 880, 105, Math.PI / 2],
	]) {
		const points = ringPositions({
			n,
			panelW,
			panelH,
			startAngle,
			...BOARD,
		});
		assert.equal(points?.length, n, `${name} ring count`);
		assertValidRing({ points, panelW, panelH, ...BOARD });
	}
});

test("home begins at the top and leaves the bottom slot open", () => {
	const points = ringPositions({
		n: 5,
		panelW: 700,
		panelH: 414,
		boardW: 1256,
		boardH: 690,
		startAngle: -Math.PI / 2,
	});
	assert.ok(points);
	const centerX = 1256 / 2;
	const centerY = 690 / 2;
	const topmost = points.reduce((best, point) =>
		point.y < best.y ? point : best,
	);
	assert.ok(
		Math.abs(topmost.x - centerX) < 2,
		"home's first neighbour is top-centred",
	);
	assert.ok(
		!points.some(
			(point) => Math.abs(point.x - centerX) < 2 && point.y > centerY,
		),
		"no home neighbour occupies the bottom slot",
	);
});

test("ringPositions rejects infeasible nodes and panels instead of overflowing", () => {
	assert.equal(
		ringPositions({
			n: 11,
			panelW: 580,
			panelH: 105,
			boardW: 1000,
			boardH: 658,
			startAngle: Math.PI / 2,
		}),
		null,
	);
	assert.equal(
		ringPositions({
			n: 1,
			panelW: 880,
			panelH: 100,
			boardW: 880 + 2 * MARGIN - 1,
			boardH: 700,
		}),
		null,
	);
});

test("ringPositions handles empty and malformed requests", () => {
	assert.deepEqual(
		ringPositions({
			n: 0,
			panelW: 400,
			panelH: 200,
			boardW: 1000,
			boardH: 700,
		}),
		[],
	);
	assert.equal(
		ringPositions({ n: -1, panelW: 1, panelH: 1, boardW: 1, boardH: 1 }),
		null,
	);
});

test("ringPositions is deterministic and honours a one-node start angle", () => {
	const options = {
		n: 1,
		panelW: 300,
		panelH: 160,
		boardW: 1200,
		boardH: 800,
		startAngle: -Math.PI / 2,
	};
	const first = ringPositions(options);
	assert.deepEqual(first, ringPositions(options));
	assert.ok(
		first[0].y < options.boardH / 2,
		"single node begins above the focus panel",
	);
});

test("generated markup has one node set and no nested anchors", () => {
	const html = renderSite();
	assert.equal((html.match(/data-node=/g) || []).length, 28);
	let anchorDepth = 0;
	for (const token of html.match(/<\/?a\b[^>]*>/gi) || []) {
		if (token.startsWith("</")) anchorDepth--;
		else anchorDepth++;
		assert.ok(anchorDepth <= 1, "anchors must not nest");
	}
	assert.equal(anchorDepth, 0, "all anchors must close");
	assert.equal(html.includes('id="world"'), false);
	assert.equal(html.includes('id="card"'), false);
});

test("edgeLines returns centre-to-centre SVG coordinates", () => {
	assert.deepEqual(
		edgeLines({
			from: { x: 30, y: 40 },
			to: [
				{ id: "work", x: 100, y: 200 },
				{ id: "projects", x: 300, y: 400 },
			],
		}),
		[
			{ id: "work", x1: 30, y1: 40, x2: 100, y2: 200 },
			{ id: "projects", x1: 30, y1: 40, x2: 300, y2: 400 },
		],
	);
});
