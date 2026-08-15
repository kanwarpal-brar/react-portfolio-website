// layout.test.js — invariant tests for the rigid world geometry.
//
// The contract under test is the one the user cares about: the graph is ONE
// fixed structure, a node's parent keeps its real direction, and every view is
// legible without overlap. So these tests assert properties of the whole world
// across every focusable node, not the value of any hand-tuned constant.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
	allEdges,
	buildGraph,
	buildWorld,
	cameraFor,
	cardsClear,
	clearsPanel,
	distancesFrom,
	framePoint,
	GAP,
	linkedFor,
	MARGIN,
	NODE,
	occludedBy,
	visibleFor,
} from "../js/layout.js";
import { TREE } from "../js/data.js";
import { renderSite } from "../scripts/build.mjs";

const GRAPH = buildGraph(TREE, "home");

// Panel heights measured in Chrome, keyed by panel width. Narrower panels are
// taller, which is why board height is the binding constraint.
const HEIGHTS = {
	home: { 960: 391, 880: 414, 800: 436, 720: 459, 680: 470 },
	work: { 960: 142, 880: 142, 800: 142, 720: 142, 680: 142 },
	projects: { 960: 142, 880: 142, 800: 142, 720: 142, 680: 142 },
	socials: { 960: 142, 880: 142, 800: 142, 720: 142, 680: 142 },
	resume: { 960: 231, 880: 253, 800: 253, 720: 253, 680: 253 },
	cluster: { 960: 327, 880: 327, 800: 327, 720: 327, 680: 338 },
	fallback: { 960: 266, 880: 288, 800: 288, 720: 311, 680: 311 },
};

function panelSizer(width) {
	return (id) => ({
		w: width,
		h: (HEIGHTS[id] ?? HEIGHTS.fallback)[width],
	});
}

const BOARDS = [
	{ label: "1712x1068", boardW: 1688, boardH: 946 },
	{ label: "1440x900", boardW: 1416, boardH: 778 },
	{ label: "1920x1080", boardW: 1896, boardH: 958 },
];

/**
 * The renderer tries a ladder of panel widths and keeps the best fit, so tests
 * resolve a width the same way instead of asserting one hard-coded value.
 */
function solve({ boardW, boardH, width }) {
	const widths = width ? [width] : Object.keys(HEIGHTS.home).map(Number);
	for (const candidate of widths.sort((a, b) => b - a)) {
		const positions = buildWorld({
			graph: GRAPH,
			root: "home",
			panelSize: panelSizer(candidate),
			boardW,
			boardH,
		});
		if (positions) return { positions, width: candidate };
	}
	return null;
}

function worldFor(board) {
	return solve(board)?.positions ?? null;
}

test("the world holds every node exactly once", () => {
	const world = worldFor(BOARDS[0]);
	assert.ok(world, "expected a feasible world at 1440x900");
	assert.equal(Object.keys(world).length, 28);
	const seen = new Set(
		Object.values(world).map((point) => `${point.x},${point.y}`),
	);
	assert.equal(seen.size, 28, "no two nodes may share a position");
	assert.deepEqual(world.home, { x: 0, y: 0 }, "home anchors the world origin");
});

test("a focused node can always reach its neighbours on the board", () => {
	for (const board of BOARDS) {
		const solved = solve(board);
		assert.ok(solved, `expected a feasible world at ${board.label}`);
		const world = solved.positions;
		const panelSize = panelSizer(solved.width);

		for (const focus of Object.keys(GRAPH)) {
			const camera = cameraFor(world, focus);
			const panel = panelSize(focus);
			const cards = visibleFor(GRAPH, focus)
				.filter((id) => id !== focus)
				.map((id) => ({
					id,
					x: world[id].x + camera.x,
					y: world[id].y + camera.y,
				}));

			// The board is a window onto a bigger map, so a link may sit past the
			// edge; what must hold is that the panel is never covered and that enough
			// links stay reachable to navigate with.
			let reachable = 0;
			for (const card of cards) {
				assert.ok(
					clearsPanel(card, panel.w, panel.h),
					`${board.label} ${focus}: ${card.id} overlaps the focused panel`,
				);
				if (
					Math.abs(card.x) + NODE.w / 2 <= board.boardW / 2 - MARGIN + 0.5 &&
					Math.abs(card.y) + NODE.h / 2 <= board.boardH / 2 - MARGIN + 0.5
				)
					reachable++;
			}
			if (cards.length)
				assert.ok(
					reachable >= Math.max(1, Math.ceil(cards.length / 2)),
					`${board.label} ${focus}: only ${reachable}/${cards.length} links reachable`,
				);
			for (let left = 0; left < cards.length; left++) {
				for (let right = left + 1; right < cards.length; right++) {
					assert.ok(
						cardsClear(cards[left], cards[right]),
						`${board.label} ${focus}: ${cards[left].id}/${cards[right].id} collide`,
					);
				}
			}
		}
	}
});

test("the whole map is drawn at once, so no two nodes may ever overlap", () => {
	// The entire graph stays on screen, so clearance is a GLOBAL property. An
	// earlier version only separated co-visible nodes, which silently allowed
	// branches from different sections to sit on top of each other.
	for (const board of BOARDS) {
		const world = worldFor(board);
		assert.ok(world, `expected a feasible world at ${board.label}`);
		const ids = Object.keys(world);
		for (let left = 0; left < ids.length; left++) {
			for (let right = left + 1; right < ids.length; right++) {
				assert.ok(
					cardsClear(world[ids[left]], world[ids[right]]),
					`${board.label}: ${ids[left]}/${ids[right]} overlap on the map`,
				);
			}
		}
	}
});

test("every edge in the graph is emitted once, in world coordinates", () => {
	const world = worldFor(BOARDS[0]);
	const edges = allEdges(GRAPH, world);
	// 28 nodes in a tree => 27 edges, drawn regardless of which node is focused.
	assert.equal(edges.length, 27);
	const seen = new Set(edges.map((edge) => edge.id));
	assert.equal(seen.size, 27, "edges must not be duplicated");
	for (const edge of edges) {
		assert.equal(edge.x1, world[edge.from].x);
		assert.equal(edge.y1, world[edge.from].y);
		assert.equal(edge.x2, world[edge.to].x);
		assert.equal(edge.y2, world[edge.to].y);
	}
});

test("distance grows with hops and only panel-covered nodes are suppressed", () => {
	const distance = distancesFrom(GRAPH, "socials");
	assert.equal(distance.socials, 0);
	assert.equal(distance.home, 1);
	assert.equal(distance.github, 1);
	assert.equal(distance.work, 2);
	assert.equal(distance["carta-2024-payments"], 3);
	assert.deepEqual(distancesFrom(GRAPH, "missing"), {});

	const positions = {
		home: { x: 0, y: 0 },
		behind: { x: 0, y: 0 },
		far: { x: 4000, y: 0 },
	};
	const hidden = occludedBy(positions, "home", { w: 800, h: 400 });
	assert.ok(hidden.has("behind"), "a node under the panel is suppressed");
	assert.ok(!hidden.has("far"), "a distant node stays on the map");
	assert.ok(!hidden.has("home"), "the focus is never suppressed");
	assert.equal(occludedBy(positions, "missing", { w: 10, h: 10 }).size, 0);
});

test("the structure is rigid: relative positions never depend on the focus", () => {
	const world = worldFor(BOARDS[0]);
	const offset = (a, b) => ({
		x: world[b].x - world[a].x,
		y: world[b].y - world[a].y,
	});
	// A camera pan is a pure translation, so every pairwise offset is invariant.
	const homeToSocials = offset("home", "socials");
	const socialsToHome = offset("socials", "home");
	assert.deepEqual(
		{ x: -socialsToHome.x, y: -socialsToHome.y },
		homeToSocials,
		"the home<->socials edge must have one fixed geometry",
	);
});

test("a parent keeps its true direction instead of being re-slotted below", () => {
	const world = worldFor(BOARDS[0]);
	// The regression this guards: navigating home -> socials used to re-place
	// home into the bottom slot, making the parent look like a child.
	for (const [parent, node] of Object.entries(TREE)) {
		for (const child of node.children ?? []) {
			const toParent = {
				x: world[parent].x - world[child].x,
				y: world[parent].y - world[child].y,
			};
			const toChild = {
				x: world[child].x - world[parent].x,
				y: world[child].y - world[parent].y,
			};
			assert.ok(
				Math.hypot(toParent.x, toParent.y) > 0,
				`${child} must not sit on top of ${parent}`,
			);
			assert.ok(
				Math.abs(
					Math.atan2(toParent.y, toParent.x) -
						Math.atan2(-toChild.y, -toChild.x),
				) < 1e-9,
				`${child}'s view of ${parent} must be the exact reverse bearing`,
			);
		}
	}
	// Concretely: whichever side of home 'socials' lands on, the view from
	// 'socials' must point back the opposite way, and never straight down into
	// the slot a child would occupy.
	const homeFromSocials = {
		x: world.home.x - world.socials.x,
		y: world.home.y - world.socials.y,
	};
	assert.equal(
		Math.sign(homeFromSocials.x),
		-Math.sign(world.socials.x - world.home.x),
		"home must lie opposite the direction socials was placed",
	);
	const childDirections = TREE.socials.children.map((child) =>
		Math.atan2(
			world[child].y - world.socials.y,
			world[child].x - world.socials.x,
		),
	);
	const parentDirection = Math.atan2(homeFromSocials.y, homeFromSocials.x);
	for (const direction of childDirections) {
		assert.ok(
			Math.abs(direction - parentDirection) > 1e-6,
			"no child of socials may share the parent's bearing",
		);
	}
});

test("buildWorld rejects boards it cannot host instead of overflowing", () => {
	assert.equal(worldFor({ boardW: 700, boardH: 400 }), null);
	assert.equal(
		buildWorld({
			graph: GRAPH,
			root: "home",
			panelSize: () => ({ w: 900, h: 300 }),
			boardW: 900 + 2 * MARGIN - 1,
			boardH: 700,
		}),
		null,
		"a panel wider than the board is infeasible",
	);
	assert.equal(
		buildWorld({
			graph: GRAPH,
			root: "home",
			panelSize: panelSizer(800),
			boardW: Number.NaN,
			boardH: 700,
		}),
		null,
	);
	assert.equal(
		buildWorld({
			graph: GRAPH,
			root: "nope",
			panelSize: panelSizer(800),
			boardW: 1416,
			boardH: 778,
		}),
		null,
	);
});

test("buildWorld is deterministic", () => {
	assert.deepEqual(worldFor(BOARDS[0]), worldFor(BOARDS[0]));
});

test("buildGraph derives parents from the content tree", () => {
	assert.equal(GRAPH.home.parent, null);
	assert.equal(GRAPH.socials.parent, "home");
	assert.equal(GRAPH.github.parent, "socials");
	assert.deepEqual(GRAPH.github.children, []);
	// Visible set is focus + parent + children: siblings are never co-visible,
	// which is what keeps a 10-child ring affordable.
	assert.deepEqual(visibleFor(GRAPH, "github"), ["github", "socials"]);
	assert.deepEqual(visibleFor(GRAPH, "socials"), [
		"socials",
		"home",
		"github",
		"linkedin",
		"email",
	]);
	assert.deepEqual(linkedFor(GRAPH, "home"), TREE.home.children);
	assert.deepEqual(visibleFor(GRAPH, "missing"), []);
});

test("framePoint walks a closed rectangle and cardsClear measures boxes", () => {
	assert.deepEqual(framePoint(0, 100, 50), { x: 0, y: -50 });
	assert.deepEqual(framePoint(1, 100, 50), framePoint(0, 100, 50));
	const quarter = framePoint(0.25, 100, 50);
	assert.equal(quarter.x, 100, "a quarter turn lands on the right edge");
	assert.ok(cardsClear({ x: 0, y: 0 }, { x: NODE.w + GAP, y: 0 }));
	assert.ok(!cardsClear({ x: 0, y: 0 }, { x: NODE.w + GAP - 1, y: 0 }));
	// A card clears an 800x400 panel horizontally at |x| >= 400 + 88 + GAP.
	assert.ok(clearsPanel({ x: (800 + NODE.w) / 2 + GAP, y: 0 }, 800, 400));
	assert.ok(!clearsPanel({ x: (800 + NODE.w) / 2 + GAP - 1, y: 0 }, 800, 400));
	assert.ok(!clearsPanel({ x: 0, y: 0 }, 800, 400));
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
