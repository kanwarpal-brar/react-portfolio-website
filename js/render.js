// render.js — one rigid world, moved by a camera.
//
// The graph has a single set of world coordinates built once per board size.
// Navigating never re-places a node: it moves the camera so the focused node
// sits at board centre. Because nodes keep their positions, the parent of a
// node keeps its real direction and the transition reads as a pan along the
// edge to the next node, rather than a per-view re-slotting.

import {
	allEdges,
	buildGraph,
	buildWorld,
	cameraFor,
	distancesFrom,
	linkedFor,
	NODE,
	occludedBy,
	visibleFor,
} from "./layout.js";
import { nodeIds, pageTitle } from "./content.js";
import { TREE } from "./data.js";

// Wider panels are shorter, and board height is the scarce resource, so this
// ladder is scored rather than taken widest-first.
const PANEL_WIDTHS = [960, 900, 880, 840, 800, 760, 720, 680, 640, 560, 480];
const FLOW_QUERY = "(max-width: 1100px)";
// A panel may shrink below the view's width while it costs no more than this
// much extra height. Short content then gets a tight panel instead of a wide
// one padded with dead space.
const REFLOW_TOLERANCE = 8;
// Preferred breathing room between a neighbour card and the board edge.
const EDGE_GAP = 36;
// Beyond this many hops the map is context rather than content, so all further
// nodes share the faintest tier instead of fading to nothing.
const MAX_DIM_TIER = 3;

const graphTree = buildGraph(TREE, "home");

let world = null;
let worldKey = "";
let edgeKey = "";
let geometryRaf = 0;

function focusId(state) {
	if (state.view === "home") return "home";
	return state.view === "child" ? state.child : state.section;
}

function elementFor(id) {
	return document.querySelector(`[data-node="${CSS.escape(id)}"]`);
}

/**
 * Measure a panel once, offscreen, at a given width. CSS never interpolates
 * `auto`: the renderer writes measured px so width/height animate numerically.
 */
function measurePanel(id, width) {
	const panel = elementFor(id)?.querySelector(".panel");
	if (!panel) return 0;
	const previous = panel.getAttribute("style");
	panel.style.cssText = `position:fixed;inset:auto;left:-10000px;top:0;width:${width}px;height:auto;visibility:hidden;pointer-events:none;display:block`;
	// scrollHeight excludes the box's own horizontal borders; reserve them so the
	// final border-box panel never clips a line by a pixel or two.
	const height = Math.ceil(panel.scrollHeight) + 2;
	if (previous == null) panel.removeAttribute("style");
	else panel.setAttribute("style", previous);
	return height;
}

/** Every panel measured at every candidate width: `{ id: { width: height } }`. */
function measureMatrix() {
	const matrix = {};
	for (const id of nodeIds()) {
		matrix[id] = {};
		for (const width of PANEL_WIDTHS)
			matrix[id][width] = measurePanel(id, width);
	}
	return matrix;
}

/**
 * Fit each panel individually, never wider than the view's ceiling. A node with
 * little to say gets a small panel; only long content earns a wide one.
 */
function fitSizes(matrix, ceiling) {
	const sizes = {};
	for (const id of nodeIds()) {
		const base = matrix[id][ceiling];
		let chosen = ceiling;
		for (const width of PANEL_WIDTHS) {
			if (width > ceiling) continue;
			if (matrix[id][width] <= base + REFLOW_TOLERANCE) chosen = width;
		}
		sizes[id] = { w: chosen, h: matrix[id][chosen] };
	}
	return sizes;
}

/**
 * How well a world fills the board. Neighbours pushed close to the edge score
 * badly, but so does a world that huddles near the centre and leaves the board
 * empty, so this rewards the placement whose neighbours sit nearest a target
 * band inside the edge.
 */
function fillScore(positions, boardW, boardH) {
	let total = 0;
	let count = 0;
	for (const id of Object.keys(positions)) {
		const camera = cameraFor(positions, id);
		for (const other of visibleFor(graphTree, id)) {
			if (other === id) continue;
			const x = positions[other].x + camera.x;
			const y = positions[other].y + camera.y;
			const slackX = boardW / 2 - Math.abs(x) - NODE.w / 2;
			const slackY = boardH / 2 - Math.abs(y) - NODE.h / 2;
			const slack = Math.min(slackX, slackY);
			// Off-board neighbours are allowed — the board is a window onto a larger
			// map — but they cost more than a well-placed card, so a world that keeps
			// links reachable still wins.
			total -=
				slack < 0
					? EDGE_GAP + Math.min(-slack, 400)
					: Math.abs(slack - EDGE_GAP);
			count++;
		}
	}
	return count ? total / count : -Infinity;
}

/**
 * Build the best world for this board: try every panel width and keep the one
 * whose tightest view has the most room. Returns `null` when nothing fits, and
 * the caller switches to the flow presentation.
 */
function solveWorld(boardW, boardH) {
	const matrix = measureMatrix();
	let best = null;
	for (const ceiling of PANEL_WIDTHS) {
		const sizes = fitSizes(matrix, ceiling);
		const positions = buildWorld({
			graph: graphTree,
			root: "home",
			panelSize: (id) => sizes[id],
			boardW,
			boardH,
		});
		if (!positions) continue;
		const score = fillScore(positions, boardW, boardH);
		if (score === -Infinity) continue;
		if (!best || score > best.score)
			best = { positions, sizes, score, ceiling };
	}
	return best;
}

function ensureWorld(boardW, boardH) {
	const key = `${Math.round(boardW)}x${Math.round(boardH)}`;
	if (worldKey === key) return world;
	worldKey = key;
	world = solveWorld(boardW, boardH);
	return world;
}

/**
 * Draw the whole graph's edges once, in world coordinates. The edge layer shares
 * the camera transform with the node layer, so lines pan welded to their cards
 * and are never redrawn mid-transition. Edges touching the focused node are
 * marked so CSS can bring them forward.
 */
function drawEdges(graph, focus) {
	const svg = graph.querySelector("#graph-lines");
	if (!svg) return;
	if (graph.dataset.layout !== "world" || !world) {
		svg.replaceChildren();
		edgeKey = "";
		return;
	}
	const board = graph.getBoundingClientRect();
	// The board is a window onto a larger world, so the SVG viewBox is centred on
	// the origin and overflow is left visible.
	svg.setAttribute(
		"viewBox",
		`${-board.width / 2} ${-board.height / 2} ${board.width} ${board.height}`,
	);
	const active = new Set(linkedFor(graphTree, focus));
	const key = `${worldKey}|${board.width}x${board.height}`;
	if (edgeKey !== key) {
		edgeKey = key;
		svg.replaceChildren(
			...allEdges(graphTree, world.positions).map((line) => {
				const element = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"line",
				);
				element.setAttribute("x1", line.x1);
				element.setAttribute("y1", line.y1);
				element.setAttribute("x2", line.x2);
				element.setAttribute("y2", line.y2);
				element.dataset.from = line.from;
				element.dataset.to = line.to;
				return element;
			}),
		);
	}
	for (const line of svg.children) {
		const touchesFocus =
			line.dataset.from === focus || line.dataset.to === focus;
		const adjacent =
			active.has(line.dataset.from) || active.has(line.dataset.to);
		if (touchesFocus) line.dataset.rank = "focus";
		else if (adjacent) line.dataset.rank = "near";
		else line.dataset.rank = "far";
	}
}

/**
 * Every node stays interactive, because every node stays on the map. Only the
 * focused node's panel is exposed, and only panel-occluded nodes are dropped
 * from the tab order along with being hidden.
 */
function setInteractivity(focus, hidden) {
	for (const id of nodeIds()) {
		const node = elementFor(id);
		if (!node) continue;
		const isFocus = id === focus;
		node.inert = hidden.has(id);
		node.querySelector(".panel")?.toggleAttribute("inert", !isFocus);
		const link = node.querySelector(".node-link");
		if (link) link.tabIndex = isFocus ? -1 : 0;
	}
}

function setFlowInteractivity() {
	for (const id of nodeIds()) {
		const node = elementFor(id);
		if (!node) continue;
		node.inert = false;
		node.querySelector(".panel")?.removeAttribute("inert");
		node.querySelector(".node-link")?.removeAttribute("tabindex");
	}
}

function clearWorldStyles(graph) {
	for (const id of nodeIds()) {
		const node = elementFor(id);
		if (!node) continue;
		node.style.removeProperty("--x");
		node.style.removeProperty("--y");
		node.style.removeProperty("--panel-w");
		node.style.removeProperty("--panel-h");
		node.removeAttribute("data-depth");
	}
	graph.style.removeProperty("--cam-x");
	graph.style.removeProperty("--cam-y");
	graph.querySelector("#graph-lines")?.replaceChildren();
	edgeKey = "";
}

function applyGeometry() {
	const graph = document.querySelector("#graph");
	const state = graph?._state;
	if (!state) return;
	const focus = focusId(state);

	const board = graph.getBoundingClientRect();
	const flow =
		window.matchMedia(FLOW_QUERY).matches ||
		!board.width ||
		!board.height ||
		!ensureWorld(board.width, board.height);

	if (flow) {
		graph.dataset.layout = "flow";
		clearWorldStyles(graph);
		setFlowInteractivity();
		return;
	}

	graph.dataset.layout = "world";
	const { positions, sizes } = world;
	// World coordinates: written once per board size, identical for every view.
	for (const id of nodeIds()) {
		const node = elementFor(id);
		const point = positions[id];
		if (!node || !point) continue;
		node.style.setProperty("--x", `${Math.round(point.x)}px`);
		node.style.setProperty("--y", `${Math.round(point.y)}px`);
		node.style.setProperty("--panel-w", `${sizes[id].w}px`);
		node.style.setProperty("--panel-h", `${sizes[id].h}px`);
	}

	// The camera is the only thing navigation changes.
	const camera = cameraFor(positions, focus);
	graph.style.setProperty("--cam-x", `${Math.round(camera.x)}px`);
	graph.style.setProperty("--cam-y", `${Math.round(camera.y)}px`);

	// Depth dims the map by hop distance so the eye can tell where it is, while
	// the rest of the graph stays present as context.
	const distance = distancesFrom(graphTree, focus);
	const hidden = occludedBy(positions, focus, sizes[focus]);
	for (const id of nodeIds()) {
		const node = elementFor(id);
		if (!node) continue;
		const depth = distance[id] ?? MAX_DIM_TIER;
		node.dataset.depth = String(Math.min(depth, MAX_DIM_TIER));
		node.toggleAttribute("data-occluded", hidden.has(id));
	}

	setInteractivity(focus, hidden);
	drawEdges(graph, focus);
}

/**
 * Move keyboard focus to the newly focused panel. The panel fades in behind the
 * camera pan, and a `visibility: hidden` element cannot take focus, so this
 * waits for it to become visible rather than firing on the next frame and
 * silently dropping focus to <body>.
 */
function moveFocusToPanel(focus) {
	const panel = elementFor(focus)?.querySelector(".panel");
	if (!panel) return;
	const attempt = () => {
		if (getComputedStyle(panel).visibility === "hidden") return false;
		panel.focus({ preventScroll: true });
		return document.activeElement === panel;
	};
	if (attempt()) return;
	panel.addEventListener("transitionend", attempt, { once: true });
	// Belt and braces: transitions can be disabled (reduced motion) or coalesced,
	// so also retry on a short timer bounded by the pan itself.
	let elapsed = 0;
	const poll = setInterval(() => {
		elapsed += 50;
		if (attempt() || elapsed >= 1200) clearInterval(poll);
	}, 50);
}

export function scheduleGeometry() {
	cancelAnimationFrame(geometryRaf);
	geometryRaf = requestAnimationFrame(() => {
		geometryRaf = 0;
		applyGeometry();
	});
}

export function invalidateWorld() {
	worldKey = "";
	world = null;
}

export function render(state, { moveFocus = false } = {}) {
	const graph = document.querySelector("#graph");
	if (!graph) return;
	graph._state = state;
	graph.dataset.view = state.view;
	const focus = focusId(state);
	graph.dataset.focus = focus;
	document.title = pageTitle(state);

	// Every node stays on the map: only the focused one expands, its direct
	// links are highlighted, and everything else remains visible context.
	const linked = new Set(linkedFor(graphTree, focus));
	for (const id of nodeIds()) {
		const node = elementFor(id);
		if (!node) continue;
		let role = "distant";
		if (id === focus) role = "focus";
		else if (linked.has(id)) role = "linked";
		node.dataset.role = role;
		const link = node.querySelector(".node-link");
		if (link) {
			if (id === focus) link.setAttribute("aria-current", "page");
			else link.removeAttribute("aria-current");
		}
	}

	applyGeometry();
	if (moveFocus) moveFocusToPanel(focus);
}

export function initShell() {
	// All node markup ships in index.html. This hook exists solely to keep the
	// entry point small and make the initial render contract explicit.
}

export { NODE };
