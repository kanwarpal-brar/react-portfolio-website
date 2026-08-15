// render.js — assign focus/ring/hidden roles, measure the focused panel,
// position the derived ring, and draw simple decorative edges.

import { edgeLines, NODE, ringPositions } from "./layout.js";
import { nodeIds, pageTitle } from "./content.js";
import { TREE } from "./data.js";

const PANEL_WIDTHS = [880, 820, 760, 700, 640, 580, 520, 480];
const TOP = -Math.PI / 2;
const BOTTOM = Math.PI / 2;

let geometryRaf = 0;
let edgeRaf = 0;
let edgeUntil = 0;
let edgeState = null;

function focusId(state) {
	if (state.view === "home") return "home";
	return state.view === "child" ? state.child : state.section;
}

function ringIds(state) {
	if (state.view === "home") return TREE.home.children;
	if (state.view === "section")
		return ["home", ...TREE[state.section].children];
	return [
		state.section,
		...TREE[state.section].children.filter((id) => id !== state.child),
	];
}

function startAngle(state) {
	return state.view === "home" ? TOP : BOTTOM;
}

function elementFor(id) {
	return document.querySelector(`[data-node="${CSS.escape(id)}"]`);
}

function measurePanel(node, width) {
	const panel = node.querySelector(".panel");
	if (!panel) return 0;
	const previousStyle = panel.getAttribute("style");
	// The panel is normally absolutely inset into its node. Measure it once as
	// an offscreen, auto-height box instead of asking CSS to interpolate `auto`.
	panel.style.cssText = `position:fixed;inset:auto;left:-10000px;top:0;width:${width}px;height:auto;visibility:hidden;pointer-events:none;display:block`;
	// scrollHeight excludes this box's own horizontal borders; reserve them so
	// the final border-box panel never clips a line by one or two pixels.
	const height = Math.ceil(panel.scrollHeight) + 2;
	if (previousStyle == null) panel.removeAttribute("style");
	else panel.setAttribute("style", previousStyle);
	return height;
}

function chooseLayout(graph, focus) {
	const board = graph.getBoundingClientRect();
	if (!board.width || !board.height) return { mode: "flow" };
	const state = graph._state;
	const ids = ringIds(state);
	if (window.matchMedia("(max-width: 900px)").matches) return { mode: "flow" };

	for (const width of PANEL_WIDTHS) {
		const height = measurePanel(focus, width);
		const points = ringPositions({
			n: ids.length,
			startAngle: startAngle(state),
			panelW: width,
			panelH: height,
			boardW: board.width,
			boardH: board.height,
		});
		if (points) return { mode: "ring", width, height, points, board };
	}
	return { mode: "flow" };
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

function setFocusDimensions(focus, layout) {
	focus.style.setProperty("--panel-w", `${layout.width}px`);
	focus.style.setProperty("--panel-h", `${layout.height}px`);
}

function setRingInteractivity(focus, ring) {
	for (const id of nodeIds()) {
		const node = elementFor(id);
		if (!node) continue;
		const isFocus = id === focus;
		const isRing = ring.has(id);
		node.inert = !isFocus && !isRing;
		const panel = node.querySelector(".panel");
		panel?.toggleAttribute("inert", !isFocus);
		const link = node.querySelector(".node-link");
		if (link) link.tabIndex = isFocus ? -1 : 0;
	}
}

function drawEdges(graph, focus, ids) {
	const svg = graph.querySelector("#graph-lines");
	if (!svg) return;
	if (graph.dataset.layout !== "ring") {
		svg.replaceChildren();
		return;
	}
	const board = graph.getBoundingClientRect();
	const focusRect = focus.getBoundingClientRect();
	const from = {
		x: focusRect.left - board.left + focusRect.width / 2,
		y: focusRect.top - board.top + focusRect.height / 2,
	};
	const to = ids
		.map((id) => {
			const node = elementFor(id);
			const rect = node?.getBoundingClientRect();
			return rect
				? {
						id,
						x: rect.left - board.left + rect.width / 2,
						y: rect.top - board.top + rect.height / 2,
					}
				: null;
		})
		.filter(Boolean);
	const lines = edgeLines({ from, to });
	svg.setAttribute("viewBox", `0 0 ${board.width} ${board.height}`);
	svg.replaceChildren(
		...lines.map((line) => {
			const element = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"line",
			);
			element.setAttribute("x1", line.x1);
			element.setAttribute("y1", line.y1);
			element.setAttribute("x2", line.x2);
			element.setAttribute("y2", line.y2);
			return element;
		}),
	);
}

function applyGeometry() {
	const graph = document.querySelector("#graph");
	if (!graph?._state) return;
	const focus = elementFor(focusId(graph._state));
	if (!focus) return;
	const ids = ringIds(graph._state);
	const layout = chooseLayout(graph, focus);
	graph.dataset.layout = layout.mode;

	if (layout.mode === "flow") {
		focus.style.removeProperty("--panel-w");
		focus.style.removeProperty("--panel-h");
		for (const id of nodeIds()) {
			const node = elementFor(id);
			node?.style.removeProperty("--x");
			node?.style.removeProperty("--y");
		}
		clearEdgeSync();
		graph.querySelector("#graph-lines")?.replaceChildren();
		setFlowInteractivity();
		return;
	}

	setRingInteractivity(focusId(graph._state), new Set(ids));
	setFocusDimensions(focus, layout);
	ids.forEach((id, index) => {
		const point = layout.points[index];
		const node = elementFor(id);
		if (!node) return;
		node.style.setProperty(
			"--x",
			`${Math.round(point.x - layout.board.width / 2)}px`,
		);
		node.style.setProperty(
			"--y",
			`${Math.round(point.y - layout.board.height / 2)}px`,
		);
		node.style.setProperty("--delay", `${index * 25}ms`);
	});
	// Store the newest topology before any edge frame is queued. Every later
	// frame reads this shared state, so rapid navigation cannot restore stale
	// focus/ring endpoints from a captured callback.
	edgeState = { focus, ids };
	edgeUntil = performance.now() + 440;
	requestAnimationFrame(() => {
		if (!edgeState) return;
		drawEdges(graph, edgeState.focus, edgeState.ids);
		syncEdges(graph);
	});
}

function clearEdgeSync() {
	if (edgeRaf) cancelAnimationFrame(edgeRaf);
	edgeRaf = 0;
	edgeState = null;
}

// Geometry is derived once per navigation. This short, read-only pass merely
// follows the CSS transition so centre-to-centre decorative lines stay joined
// to moving cards; it does not recalculate layout or inspect SVG transforms.
function syncEdges(graph) {
	if (edgeRaf) return;
	const tick = () => {
		if (edgeState) drawEdges(graph, edgeState.focus, edgeState.ids);
		if (edgeState && performance.now() < edgeUntil) {
			edgeRaf = requestAnimationFrame(tick);
		} else {
			edgeRaf = 0;
			edgeState = null;
		}
	};
	edgeRaf = requestAnimationFrame(tick);
}

export function scheduleGeometry() {
	cancelAnimationFrame(geometryRaf);
	geometryRaf = requestAnimationFrame(() => {
		geometryRaf = 0;
		applyGeometry();
	});
}

export function render(state, { moveFocus = false } = {}) {
	const graph = document.querySelector("#graph");
	if (!graph) return;
	clearEdgeSync();
	graph._state = state;
	graph.dataset.view = state.view;
	const focusIdValue = focusId(state);
	graph.dataset.focus = focusIdValue;
	document.title = pageTitle(state);

	const focus = elementFor(focusIdValue);
	if (!focus) return;
	const layout = chooseLayout(graph, focus);
	graph.dataset.layout = layout.mode;
	if (layout.mode === "ring") setFocusDimensions(focus, layout);

	const ring = new Set(ringIds(state));
	for (const id of nodeIds()) {
		const node = elementFor(id);
		if (!node) continue;
		let role = "hidden";
		if (id === focusIdValue) role = "focus";
		else if (ring.has(id)) role = "ring";
		node.dataset.role = role;
		const link = node.querySelector(".node-link");
		if (link) {
			if (id === focusIdValue) link.setAttribute("aria-current", "page");
			else link.removeAttribute("aria-current");
		}
	}
	if (layout.mode === "flow") setFlowInteractivity();
	else setRingInteractivity(focusIdValue, ring);
	scheduleGeometry();
	if (moveFocus) {
		requestAnimationFrame(() =>
			focus.querySelector(".panel")?.focus({ preventScroll: true }),
		);
	}
}

export function initShell() {
	// All node markup ships in index.html. This hook exists solely to keep the
	// entry point small and make the initial render contract explicit.
}

export { NODE };
