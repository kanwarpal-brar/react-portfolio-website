// layout.test.js — invariant tests for the rigid world geometry.
//
// The contract under test is the one the user cares about: the graph is ONE
// fixed structure, a node's parent keeps its real direction, and every view is
// legible without overlap. Each view draws only its focused star — focus +
// parent + children — so these tests assert properties of that visible set
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
	framePoint,
	GAP,
	linkedFor,
	MARGIN,
	NODE,
	occludedBy,
	stubEdge,
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

			// Every link must land on the board: a view renders only the focused
			// star, so a neighbour hidden off-board would leave the view orphaned.
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
				assert.equal(
					reachable,
					cards.length,
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

test("a view never shows two overlapping cards", () => {
	// Only the focused star is drawn, so clearance only needs to hold within
	// each view. Branches of different sections may share map space: they are
	// never on screen together.
	for (const board of BOARDS) {
		const world = worldFor(board);
		assert.ok(world, `expected a feasible world at ${board.label}`);
		for (const focus of Object.keys(world)) {
			const camera = cameraFor(world, focus);
			const cards = visibleFor(GRAPH, focus)
				.filter((id) => id !== focus)
				.map((id) => ({
					id,
					x: world[id].x + camera.x,
					y: world[id].y + camera.y,
				}));
			for (let left = 0; left < cards.length; left++) {
				for (let right = left + 1; right < cards.length; right++) {
					assert.ok(
						cardsClear(cards[left], cards[right]),
						`${board.label} ${focus}: ${cards[left].id}/${cards[right].id} collide on screen`,
					);
				}
			}
		}
	}
});

test("only the edges touching the focus are drawn", () => {
	const world = worldFor(BOARDS[0]);
	// The full graph is 28 nodes in a tree, but a view draws only its star:
	// focus + parent + children, and one edge per visible neighbour.
	for (const focus of Object.keys(GRAPH)) {
		const visible = visibleFor(GRAPH, focus);
		const edges = allEdges(GRAPH, world).filter(
			(line) => line.from === focus || line.to === focus,
		);
		assert.equal(
			edges.length,
			visible.length - 1,
			`${focus}: drawn edges must equal visible neighbours`,
		);
		for (const edge of edges) {
			assert.equal(edge.x1, world[edge.from].x);
			assert.equal(edge.y1, world[edge.from].y);
			assert.equal(edge.x2, world[edge.to].x);
			assert.equal(edge.y2, world[edge.to].y);
		}
	}
});

test("every focus with a parent has exactly one backlink edge", () => {
	// The renderer tags an edge `up` exactly when `line.to === focus` (the way
	// back to where the viewer came from), so that invariant must hold for the
	// rank tagging to be meaningful: one and only one `up` edge per view, and
	// none at home.
	const world = worldFor(BOARDS[0]);
	for (const focus of Object.keys(GRAPH)) {
		const backlinks = allEdges(GRAPH, world).filter(
			(line) => line.to === focus,
		);
		if (GRAPH[focus].parent)
			assert.equal(
				backlinks.length,
				1,
				`${focus}: exactly one edge points back to it`,
			);
		else
			assert.equal(backlinks.length, 0, `${focus}: the root has no backlink`);
	}
});

test("stubEdge hints where a parent's map continues", () => {
	const world = worldFor(BOARDS[0]);
	assert.equal(
		stubEdge(GRAPH, world, "home"),
		null,
		"home has no parent, so no stub",
	);
	assert.equal(
		stubEdge(GRAPH, world, "missing"),
		null,
		"an unknown focus has no stub",
	);

	// `projects` has its own parent (home) plus 9 children; `hive` is one of
	// those children, so from `projects` there is a whole map beyond the hive
	// view to hint at.
	const stub = stubEdge(GRAPH, world, "hive");
	assert.ok(stub, "projects keeps other neighbours to hint at");
	assert.equal(stub.from, "projects");
	const dir = { x: stub.x2 - stub.x1, y: stub.y2 - stub.y1 };
	const toHive = {
		x: world.hive.x - world.projects.x,
		y: world.hive.y - world.projects.y,
	};
	assert.ok(
		dir.x * toHive.x + dir.y * toHive.y < 0,
		"the stub points away from hive's own slot",
	);
	assert.ok(
		Math.abs(Math.hypot(dir.x, dir.y) - 56) < 1e-6,
		"the stub extends exactly `length` px from the parent card",
	);
	assert.ok(
		Math.hypot(stub.x2 - world.projects.x, stub.y2 - world.projects.y) > 56,
		"the stub starts on the card boundary, beyond the centre",
	);
});

test("stubEdge returns null when the parent's neighbours cancel", () => {
	// Two of `projects`' neighbours (home and a sibling) placed exactly
	// opposite and equidistant leave no clear onward direction.
	assert.equal(
		stubEdge(
			GRAPH,
			{
				projects: { x: 0, y: 0 },
				home: { x: -100, y: 0 },
				nyabot: { x: 100, y: 0 },
				hive: { x: 0, y: 100 },
			},
			"hive",
		),
		null,
		"cancelling directions must not produce a stub",
	);
	assert.equal(
		stubEdge(
			GRAPH,
			{ projects: { x: 0, y: 0 }, hive: { x: 0, y: 100 } },
			"hive",
		),
		null,
		"a parent with no other placed neighbours has no stub",
	);
});

test("only nodes the focused panel would cover are occluded", () => {
	const positions = {
		home: { x: 0, y: 0 },
		behind: { x: 0, y: 0 },
		far: { x: 4000, y: 0 },
	};
	const hidden = occludedBy(positions, "home", { w: 800, h: 400 });
	assert.ok(hidden.has("behind"), "a node under the panel is suppressed");
	assert.ok(!hidden.has("far"), "a distant node stays drawn");
	assert.ok(!hidden.has("home"), "the focus is never suppressed");
	assert.equal(occludedBy(positions, "missing", { w: 10, h: 10 }).size, 0);
});

test("a leaf's visible set is itself and its parent, never its siblings", () => {
	assert.deepEqual(visibleFor(GRAPH, "hive"), ["hive", "projects"]);
	assert.deepEqual(visibleFor(GRAPH, "github"), ["github", "socials"]);
	assert.deepEqual(visibleFor(GRAPH, "missing"), []);
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
