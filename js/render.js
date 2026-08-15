// render.js — orchestrator for the pan/tree board. Builds the static shell
// once (the six persistent world nodes), then applies render(state) as a pure
// function of state: same state in -> same DOM out. Geometry (scale, node
// positions, camera, spokes) is recomputed on resize via scheduleGeometry().
//
// The world model: home sits at the world origin; the five sections sit at
// fixed slots around it; a section's children fan out around the section.
// Exactly one node is focused at a time — it expands in place and the camera
// pans to center it (a CSS transform on #world). Connectors live in #world,
// so they always move with their nodes. All sizes and distances are
// defined at a reference scale and multiplied by a single board scale s, so
// every clearance is scale-invariant: test/geometry.test.js proves the
// reference layout's clearances, which proves them at every viewport.

import { boardScale, squareWheelPositions, spokeLines } from "./layout.js";
import {
	worldNodesHTML,
	childNodeHTML,
	activeChildren,
	cardHTML,
	pageTitle,
	cardAriaLabel,
} from "./content.js";
import { TREE } from "./data.js";
import { currentState } from "./router.js";

// ---- reference-scale (s = 1) geometry ---------------------------------------
// Every box size and position in the world, multiplied by the board scale s.
// Clearances these constants must satisfy are asserted in test/geometry.test.js.
export const GAP = 16;
export const COMPACT = { w: 132, h: 52 }; // every unfocused persistent node
export const HOME_MAX = { w: 820, h: 610 }; // home, focused (wide, so its prose stays short)
export const HUB_MAX = { w: 120, h: 46 }; // work/projects/socials, focused
export const LEAF_MAX = { w: 480, h: 400 }; // resume/cluster, focused
export const CHILD_MAX = { w: 440, h: 360 }; // focused fan child (detail)
export const FAN_ITEM = { w: 150, h: 80 }; // unfocused fan child

// Section world positions (home is the origin). NOT a regular pentagon: the
// diagonal slots sit nearly horizontal from center, so the wide expanded
// home clears them on the x-axis (and the top/bottom slots on the y-axis) —
// this is what lets home be wide enough that its content fits unscrolled.
export const SECTION_POS = {
	work: { x: 0, y: -352 },
	projects: { x: 494, y: -108 },
	cluster: { x: 306, y: 350 },
	socials: { x: -306, y: 350 },
	resume: { x: -494, y: -108 },
};

// Fan frame half-extents around each section. work has the most children
// (10) and the least vertical room (home is directly below), so its frame is
// wider than it is tall; socials has only 3 children, so its frame is small;
// projects uses a square frame.
export const FAN_FRAMES = {
	work: { halfW: 240, halfH: 190 },
	socials: { halfW: 210, halfH: 140 },
	default: { halfW: 250, halfH: 250 },
};

export const FOCUS_DIST = 356; // focused child glides this far outward past its section

// Home-view world extents at s = 1 (the camera centers home): 560 px left/
// right (projects/resume slots + a compact half-width) and 378 up (work slot)
// / 358 down (cluster/socials slots). The board must fit these for the home
// view to show every node. Asserted against SECTION_POS in geometry.test.js.
export const FIT_W = 1120;
export const FIT_H = 756;
const S_MAX = 1.3;
// Below this scale the composition would get unreadably small — collapse to
// the scrolling card fallback instead.
const S_MIN = 0.78;

const FAN_STAGGER_MS = 35;
const MOTION_MS = 440; // matches the camera's CSS transition plus a small buffer

/** id -> fan-item element, for keyed reconciliation across renders. */
const fanItems = new Map();
/** ids that were just created this render pass and are still ".entering". */
let pendingEnter = [];
let syncRaf = 0;
let syncUntil = 0;
let syncDraw = null;

// ---- one-time shell construction ------------------------------------------

export function initShell() {
	const pnodes = document.getElementById("pnodes");
	if (!pnodes || pnodes.dataset.built) return;
	// pi-lens-ignore: ast-grep:no-inner-html-js
	pnodes.innerHTML = worldNodesHTML();
	pnodes.dataset.built = "1";
	// Tag each section node with its role so CSS can size its expanded state.
	for (const node of pnodes.querySelectorAll("[data-pnode]")) {
		const id = node.dataset.pnode;
		if (id === "home") continue;
		node.classList.add(TREE[id].children.length ? "pnode-hub" : "pnode-leaf");
	}
}

// ---- render(state) ----------------------------------------------------------

export function render(state) {
	const graph = document.getElementById("graph");
	const card = document.getElementById("card");
	if (!graph || !card) return;

	// 1. attrs
	graph.dataset.view = state.view;
	if (state.section) graph.dataset.section = state.section;
	else delete graph.dataset.section;
	if (state.child) graph.dataset.child = state.child;
	else delete graph.dataset.child;

	// 2. collapsed-fallback card content (only visible when .collapsed)
	// pi-lens-ignore: ast-grep:no-inner-html-js
	card.innerHTML = cardHTML(state);
	card.scrollTop = 0;
	card.setAttribute("aria-label", cardAriaLabel(state));

	// 3. focus + active state on the persistent world nodes
	const pnodes = document.getElementById("pnodes");
	if (pnodes) {
		for (const node of pnodes.querySelectorAll("[data-pnode]")) {
			const id = node.dataset.pnode;
			const focused =
				(state.view === "home" && id === "home") ||
				(state.view === "section" && id === state.section);
			node.classList.toggle("is-focused", focused);
			const btn = node.querySelector(".pn-compact");
			if (!btn) continue;
			const isActive = state.section === id;
			btn.classList.toggle("active", isActive);
			if (isActive) btn.setAttribute("aria-current", "true");
			else btn.removeAttribute("aria-current");
		}
	}

	// 4. fan (keyed reconciliation — see updateFan)
	updateFan(state);

	// 5. title
	document.title = pageTitle(state);

	// 6. scale + positions + camera + spokes — needs layout, so rAF-coalesced
	scheduleGeometry();
}

// ---- fan reconciliation (keyed by child id) ---------------------------------

function updateFan(state) {
	const fan = document.getElementById("fan");
	if (!fan) return;
	const ids = activeChildren(state);
	if (ids.length === 0) {
		for (const el of fanItems.values()) el.remove();
		fanItems.clear();
		pendingEnter = [];
		return;
	}

	const seen = new Set(ids);
	pendingEnter = [];

	ids.forEach((id, i) => {
		let el = fanItems.get(id);
		if (!el) {
			el = document.createElement("div");
			el.className = "fnode entering";
			el.dataset.fnode = id;
			el.style.transitionDelay = i * FAN_STAGGER_MS + "ms";
			// pi-lens-ignore: ast-grep:no-inner-html-js
			el.innerHTML = childNodeHTML(id);
			fan.appendChild(el);
			fanItems.set(id, el);
			pendingEnter.push(el);
		} else {
			el.style.transitionDelay = "";
			fan.appendChild(el); // reorder to match `ids` order
		}
		const focused = id === state.child;
		const dimmed = state.view === "child" && !focused;
		el.classList.toggle("is-focused", focused);
		// In a child view the focused child's siblings hide (they stay mounted
		// so the fan folds back in place when the child closes).
		el.classList.toggle("dimmed", dimmed);
		el.inert = dimmed;
		const btn = el.querySelector(".fn-compact");
		if (btn) {
			btn.classList.toggle("active", focused);
			if (focused) btn.setAttribute("aria-current", "true");
			else btn.removeAttribute("aria-current");
		}
	});

	// Anything tracked but no longer in `ids` fades out in place, then leaves.
	for (const [id, el] of Array.from(fanItems.entries())) {
		if (seen.has(id)) continue;
		fanItems.delete(id);
		el.classList.add("leaving");
		el.classList.remove("entering");
		el.inert = true;
		const done = () => {
			clearTimeout(timeout);
			el.removeEventListener("transitionend", done);
			el.remove();
		};
		const timeout = setTimeout(done, 500);
		el.addEventListener("transitionend", done, { once: true });
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
	const graph = document.getElementById("graph");
	const world = document.getElementById("world");
	if (!graph || !world) return;

	const gr = graph.getBoundingClientRect();
	if (!gr.width || !gr.height) return;

	const state = currentState();
	const s = boardScale({
		bw: gr.width,
		bh: gr.height,
		margin: 12,
		fitW: FIT_W,
		fitH: FIT_H,
		max: S_MAX,
	});
	const collapsed = s < S_MIN;
	const card = document.getElementById("card");
	const activeInWorld = world.contains(document.activeElement);
	const activeInCard = card?.contains(document.activeElement);
	const collapseChanged = graph.classList.contains("collapsed") !== collapsed;
	graph.classList.toggle("collapsed", collapsed);
	if (collapsed) {
		clearSpokes();
		if (collapseChanged && activeInWorld)
			requestAnimationFrame(() => card?.focus({ preventScroll: true }));
		return;
	}
	if (collapseChanged && activeInCard)
		requestAnimationFrame(() =>
			document
				.querySelector(".is-focused .pn-expanded, .is-focused .fn-expanded")
				?.focus({ preventScroll: true }),
		);

	// Node box sizes, consumed by CSS custom properties.
	const gs = graph.style;
	const setSize = (name, size) => {
		gs.setProperty(`--${name}-w`, Math.round(size.w * s) + "px");
		gs.setProperty(`--${name}-h`, Math.round(size.h * s) + "px");
	};
	setSize("nc", COMPACT);
	setSize("home", HOME_MAX);
	setSize("hub", HUB_MAX);
	setSize("leaf", LEAF_MAX);
	setSize("child", CHILD_MAX);
	setSize("fan", FAN_ITEM);

	// Persistent node world positions: home at the origin, sections at their
	// fixed slots (scaled).
	const sectionPos = {};
	for (const [id, pos] of Object.entries(SECTION_POS)) {
		sectionPos[id] = { x: pos.x * s, y: pos.y * s };
		const node = world.querySelector(`[data-pnode="${id}"]`);
		if (node) {
			node.style.setProperty("--x", sectionPos[id].x + "px");
			node.style.setProperty("--y", sectionPos[id].y + "px");
		}
	}

	// Fan item positions around the active section. A focused child moves to a
	// clear outward detail slot; the camera then supplies the visible motion.
	const focusDist = FOCUS_DIST * s;
	const ids = activeChildren(state);
	const fanPos = {};
	if (ids.length && sectionPos[state.section]) {
		const sp = sectionPos[state.section];
		const frame = FAN_FRAMES[state.section] || FAN_FRAMES.default;
		const positions = squareWheelPositions({
			count: ids.length,
			cx: sp.x,
			cy: sp.y,
			halfW: frame.halfW * s,
			halfH: frame.halfH * s,
		});
		ids.forEach((id, i) => {
			fanPos[id] = positions[i];
		});
		if (state.view === "child" && fanPos[state.child]) {
			// Outward = the direction from home to the section.
			const len = Math.hypot(sp.x, sp.y) || 1;
			fanPos[state.child] = {
				x: sp.x + (sp.x / len) * focusDist,
				y: sp.y + (sp.y / len) * focusDist,
			};
		}
		for (const [id, el] of fanItems) {
			const p = fanPos[id];
			if (p) {
				el.style.setProperty("--x", p.x + "px");
				el.style.setProperty("--y", p.y + "px");
			}
		}
	}

	// Camera: center the focused node (home view -> the origin).
	let cam = { x: 0, y: 0 };
	if (state.view === "child" && fanPos[state.child]) cam = fanPos[state.child];
	else if (state.view !== "home") cam = sectionPos[state.section] || cam;
	// The very first pass jumps straight to the target — no boot-time pan.
	if (!world.dataset.camSet) {
		world.classList.add("jump");
		world.dataset.camSet = "1";
		requestAnimationFrame(() => world.classList.remove("jump"));
	}
	world.style.setProperty("--cam-x", -cam.x + "px");
	world.style.setProperty("--cam-y", -cam.y + "px");

	drawSpokes(gr, state, sectionPos);
	syncSpokesWhileMoving(() => drawSpokes(gr, state, sectionPos));

	// Reveal newly-entered fan items on the NEXT frame, so the browser has
	// already painted their initial (positioned, but faded/scaled) state —
	// this is what makes the entrance a transition rather than a jump cut.
	if (pendingEnter.length) {
		const toReveal = pendingEnter;
		pendingEnter = [];
		requestAnimationFrame(() => {
			for (const el of toReveal) {
				el.classList.remove("entering");
				el.inert = el.classList.contains("dimmed");
			}
		});
	}
}

// ---- spokes ------------------------------------------------------------------

/** Build a node descriptor in the SVG's local coordinate system from its
 * actual rendered rectangle. This samples an intermediate node position while
 * the established graph/camera slide is running, so each connector stays on
 * the moving border rather than jumping to the final destination early. */
function worldNode(el, id, svg) {
	if (!el) return null;
	const rect = el.getBoundingClientRect();
	const matrix = svg.getScreenCTM();
	if (!matrix) return null;
	return {
		id,
		x: (rect.left + rect.width / 2 - matrix.e) / matrix.a,
		y: (rect.top + rect.height / 2 - matrix.f) / matrix.d,
		hw: rect.width / (2 * matrix.a),
		hh: rect.height / (2 * matrix.d),
	};
}

function drawSpokes(gr, state, sectionPos) {
	const svg = document.getElementById("graph-lines");
	const world = document.getElementById("world");
	if (!svg || !world) return;

	// The SVG is the board size before #world's camera translation. Line
	// coordinates stay in that world-local space; CSS moves the whole layer.
	svg.setAttribute("viewBox", `0 0 ${gr.width} ${gr.height}`);
	svg.setAttribute("width", gr.width);
	svg.setAttribute("height", gr.height);

	const home = worldNode(
		world.querySelector('[data-pnode="home"]'),
		"home",
		svg,
	);
	if (!home) return;

	const sections = Object.keys(sectionPos)
		.map((id) =>
			worldNode(world.querySelector(`[data-pnode="${id}"]`), id, svg),
		)
		.filter(Boolean);
	const lines = spokeLines({
		hub: home,
		nodes: sections,
		type: "section",
		activeId: state.view === "section" ? state.section : null,
	});

	const ids = activeChildren(state);
	if (ids.length && sectionPos[state.section]) {
		const section = sections.find((node) => node.id === state.section);
		const visibleIds = state.view === "child" ? [state.child] : ids;
		const children = visibleIds
			.map((id) =>
				worldNode(world.querySelector(`[data-fnode="${id}"]`), id, svg),
			)
			.filter(Boolean);
		if (section && children.length)
			lines.push(
				...spokeLines({
					hub: section,
					nodes: children,
					type: "child",
					activeId: state.child,
				}),
			);
	}

	const elements = lines.map((line) => {
		const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
		el.setAttribute("x1", line.x1);
		el.setAttribute("y1", line.y1);
		el.setAttribute("x2", line.x2);
		el.setAttribute("y2", line.y2);
		el.setAttribute(
			"class",
			`line-${line.type}${line.active ? ` line-${line.type}-active` : ""}`,
		);
		return el;
	});
	svg.replaceChildren(...elements);
	svg.style.opacity = "";
}

function syncSpokesWhileMoving(draw) {
	syncDraw = draw;
	syncUntil = performance.now() + MOTION_MS;
	if (syncRaf) return;
	const tick = () => {
		syncDraw?.();
		if (performance.now() < syncUntil) syncRaf = requestAnimationFrame(tick);
		else {
			syncRaf = 0;
			syncDraw = null;
		}
	};
	syncRaf = requestAnimationFrame(tick);
}

function clearSpokes() {
	if (syncRaf) cancelAnimationFrame(syncRaf);
	syncRaf = 0;
	syncDraw = null;
	const svg = document.getElementById("graph-lines");
	if (!svg) return;
	svg.replaceChildren();
	svg.style.opacity = "0";
}
