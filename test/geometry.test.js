// geometry.test.js — clearance proofs for the reference-scale (s = 1) world
// geometry constants in render.js. Every box size and position scales by the
// single board factor s, so if all clearances hold at s = 1 they hold at
// every viewport. These tests are what license render.js to skip all runtime
// clearance math.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
	GAP,
	COMPACT,
	HOME_MAX,
	HUB_MAX,
	LEAF_MAX,
	CHILD_MAX,
	FAN_ITEM,
	SECTION_POS,
	FAN_FRAMES,
	FOCUS_DIST,
	FIT_W,
	FIT_H,
} from "../js/render.js";
import { TREE } from "../js/data.js";
import { squareWheelPositions } from "../js/layout.js";

const SECTIONS = Object.keys(SECTION_POS);
const HOME = { x: 0, y: 0 };

/** Per-axis clearance check: two boxes centered at pa/pb with sizes sa/sb
 * clear each other iff they separate by GAP on at least one axis. */
function clears(pa, sa, pb, sb) {
	const dx = Math.abs(pa.x - pb.x) - sa.w / 2 - sb.w / 2;
	const dy = Math.abs(pa.y - pb.y) - sa.h / 2 - sb.h / 2;
	return dx >= GAP || dy >= GAP;
}

/** Conservative center distance for two boxes to clear at any angle. */
function clearance(a, b) {
	return Math.max(a.w / 2 + b.w / 2, a.h / 2 + b.h / 2) + GAP;
}

test("expanded home clears every compact section", () => {
	for (const id of SECTIONS) {
		assert.ok(
			clears(HOME, HOME_MAX, SECTION_POS[id], COMPACT),
			`home overlaps ${id}`,
		);
	}
});

test("an expanded section (hub or leaf) clears every other compact node", () => {
	for (const id of SECTIONS) {
		for (const size of [HUB_MAX, LEAF_MAX]) {
			assert.ok(
				clears(SECTION_POS[id], size, HOME, COMPACT),
				`expanded ${id} overlaps home`,
			);
			for (const other of SECTIONS) {
				if (other === id) continue;
				assert.ok(
					clears(SECTION_POS[id], size, SECTION_POS[other], COMPACT),
					`expanded ${id} overlaps ${other}`,
				);
			}
		}
	}
});

test("fan items clear each other on every section's frame", () => {
	for (const [id, tree] of Object.entries(TREE)) {
		if (id === "home" || tree.children.length === 0) continue;
		const count = tree.children.length;
		const frame = FAN_FRAMES[id] || FAN_FRAMES.default;
		const pos = squareWheelPositions({
			count,
			cx: 0,
			cy: 0,
			halfW: frame.halfW,
			halfH: frame.halfH,
		});
		for (let i = 0; i < pos.length; i++) {
			for (let j = i + 1; j < pos.length; j++) {
				const dx = Math.abs(pos[i].x - pos[j].x);
				const dy = Math.abs(pos[i].y - pos[j].y);
				assert.ok(
					dx >= FAN_ITEM.w || dy >= FAN_ITEM.h,
					`${id}: items ${i} and ${j} overlap`,
				);
			}
		}
	}
});

test("every fan frame clears home, the other sections, and its own expanded hub", () => {
	const need = clearance(FAN_ITEM, COMPACT);
	for (const id of SECTIONS) {
		const frame = FAN_FRAMES[id] || FAN_FRAMES.default;
		if (id === "resume" || id === "cluster") continue; // childless: no fan
		const sp = SECTION_POS[id];
		for (const other of [
			HOME,
			...SECTIONS.filter((o) => o !== id).map((o) => SECTION_POS[o]),
		]) {
			// The frame's reach toward this neighbor is its rectangle support
			// function in that direction (the corner, not just a half-extent).
			const dx = other.x - sp.x;
			const dy = other.y - sp.y;
			const d = Math.hypot(dx, dy);
			const extent =
				(frame.halfW * Math.abs(dx) + frame.halfH * Math.abs(dy)) / d;
			assert.ok(
				d - extent >= need,
				`${id} fan reaches a neighbor (${d - extent} < ${need})`,
			);
		}
		// Items sit on the frame perimeter, so each clears the expanded hub on
		// at least one axis by construction of the frame half-extents.
		assert.ok(frame.halfW >= FAN_ITEM.w / 2 + HUB_MAX.w / 2 + GAP);
		assert.ok(frame.halfH >= FAN_ITEM.h / 2 + HUB_MAX.h / 2 + GAP);
	}
});

test("a focused child glides outward clear of every compact node", () => {
	for (const id of SECTIONS) {
		const sp = SECTION_POS[id];
		const len = Math.hypot(sp.x, sp.y);
		const child = {
			x: sp.x + (sp.x / len) * FOCUS_DIST,
			y: sp.y + (sp.y / len) * FOCUS_DIST,
		};
		assert.ok(
			clears(child, CHILD_MAX, HOME, COMPACT),
			`${id} child overlaps home`,
		);
		for (const other of SECTIONS) {
			if (other === id) continue;
			assert.ok(
				clears(child, CHILD_MAX, SECTION_POS[other], COMPACT),
				`${id} child overlaps ${other}`,
			);
		}
		// …and of its own (compact) section.
		assert.ok(
			clears(child, CHILD_MAX, sp, COMPACT),
			`${id} child overlaps its section`,
		);
	}
});

test("FIT_W/FIT_H match the actual home-view world extents", () => {
	const halfC = { w: COMPACT.w / 2, h: COMPACT.h / 2 };
	const maxX = Math.max(
		...SECTIONS.map((id) => Math.abs(SECTION_POS[id].x) + halfC.w),
		HOME_MAX.w / 2,
	);
	const up = Math.max(
		...SECTIONS.map((id) => -SECTION_POS[id].y + halfC.h),
		HOME_MAX.h / 2,
	);
	const down = Math.max(
		...SECTIONS.map((id) => SECTION_POS[id].y + halfC.h),
		HOME_MAX.h / 2,
	);
	// The camera centers home, so the board must fit the larger extent on
	// each side of the origin, doubled.
	assert.equal(FIT_W, 2 * maxX);
	assert.equal(FIT_H, 2 * Math.max(up, down));
});
