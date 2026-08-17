// layout.js — pure geometry for the rigid node world.
// No DOM references: this module is deliberately small and unit-testable.
//
// The whole graph has ONE fixed set of world coordinates. Navigation never
// re-places a node; it only moves the camera. That is what makes the structure
// read as a single map instead of a per-view rebuild, and it is why a node's
// parent keeps its real direction (up-and-right stays up-and-right) rather than
// being re-slotted underneath whatever happens to be focused.

export const NODE = Object.freeze({ w: 176, h: 76 });
export const GAP = 20;
export const MARGIN = 14;

const TOP = -Math.PI / 2;

/** Half-extents of the area a compact card centre may occupy on a board. */
function boardLimits(boardW, boardH) {
	return {
		x: boardW / 2 - NODE.w / 2 - MARGIN,
		y: boardH / 2 - NODE.h / 2 - MARGIN,
	};
}

/**
 * A point on a centred rectangular frame, parameterised by perimeter fraction.
 * `t = 0` is top-centre and increases clockwise.
 *
 * A frame rather than an ellipse is deliberate: boards are much wider than
 * they are tall, and a focused panel is tall. A frame keeps slots out at the
 * left/right edges where the room actually is, instead of forcing them above
 * and below the panel where they do not fit.
 */
export function framePoint(t, halfW, halfH) {
	const perimeter = 4 * halfW + 4 * halfH;
	let d = (((t % 1) + 1) % 1) * perimeter;
	if (d < halfW) return { x: d, y: -halfH };
	d -= halfW;
	if (d < 2 * halfH) return { x: halfW, y: -halfH + d };
	d -= 2 * halfH;
	if (d < 2 * halfW) return { x: halfW - d, y: halfH };
	d -= 2 * halfW;
	if (d < 2 * halfH) return { x: -halfW, y: halfH - d };
	d -= 2 * halfH;
	return { x: -halfW + d, y: -halfH };
}

/** Perimeter fraction whose direction from the centre best matches `angle`. */
function frameFraction(angle, halfW, halfH, steps = 720) {
	let best = 0;
	let bestDelta = Infinity;
	for (let step = 0; step < steps; step++) {
		const t = step / steps;
		const point = framePoint(t, halfW, halfH);
		const delta = Math.abs(
			Math.atan2(
				Math.sin(Math.atan2(point.y, point.x) - angle),
				Math.cos(Math.atan2(point.y, point.x) - angle),
			),
		);
		if (delta < bestDelta) {
			bestDelta = delta;
			best = t;
		}
	}
	return best;
}

/** Two compact cards clear each other as boxes, not as centre points. */
export function cardsClear(a, b) {
	return (
		Math.max(Math.abs(a.x - b.x) - NODE.w, Math.abs(a.y - b.y) - NODE.h) >= GAP
	);
}

/** A compact card at `point` clears a centred panel of `panelW × panelH`. */
export function clearsPanel(point, panelW, panelH) {
	return (
		Math.abs(point.x) - (panelW + NODE.w) / 2 >= GAP ||
		Math.abs(point.y) - (panelH + NODE.h) / 2 >= GAP
	);
}

/**
 * Normalise the content tree into a graph keyed by every node id, with a
 * `parent` link resolved from the existing `children` arrays. `js/data.js`
 * stays the single source of truth and needs no shape change.
 */
export function buildGraph(tree, root) {
	const graph = {};
	const add = (id, parent) => {
		graph[id] = { parent, children: [...(tree[id]?.children ?? [])] };
		for (const child of graph[id].children) add(child, id);
	};
	add(root, null);
	return graph;
}

function neighbourIds(graph, id) {
	const node = graph[id];
	if (!node) return [];
	return node.parent ? [node.parent, ...node.children] : [...node.children];
}

/**
 * A node's direct links, expressed as offsets from it. These are the cards that
 * must be reachable on the board when it is focused.
 */
function neighbourOffsets(graph, positions, id) {
	const origin = positions[id];
	return neighbourIds(graph, id)
		.filter((other) => positions[other])
		.map((other) => ({
			id: other,
			x: positions[other].x - origin.x,
			y: positions[other].y - origin.y,
		}));
}

/**
 * The board is a window onto a larger map, so a neighbour is allowed to sit past
 * the edge. What must always hold is that the focused panel is never covered,
 * neighbours never collide, and enough of them stay on-board to navigate with.
 */
function viewIsValid(graph, positions, id, panelSize, limits) {
	const panel = panelSize(id);
	if (!panel) return false;
	const offsets = neighbourOffsets(graph, positions, id);
	for (const offset of offsets) {
		if (!clearsPanel(offset, panel.w, panel.h)) return false;
		if (
			Math.abs(offset.x) > limits.x + 0.5 ||
			Math.abs(offset.y) > limits.y + 0.5
		)
			return false;
	}
	for (let left = 0; left < offsets.length; left++) {
		for (let right = left + 1; right < offsets.length; right++) {
			if (!cardsClear(offsets[left], offsets[right])) return false;
		}
	}
	return true;
}

/**
 * Build one rigid world for the whole tree, or return `null` when the board
 * cannot host it. Consumers fall back to the flow presentation.
 *
 * Children of a node sit on a rectangular frame around it that satisfies every
 * view the placement participates in:
 *   - each child clears the parent's panel envelope (parent-focused view);
 *   - the parent card clears each child's own panel envelope (child-focused);
 *   - neighbours clear each other and stay on-board when the node is centred.
 * Only co-visible nodes must avoid each other — a view renders focus, parent,
 * and children, nothing else — so branches of different sections are free to
 * share map space. That per-branch independence is what lets every hub use the
 * full board for its own ring instead of a reduced one.
 *
 * The parent's slot is anchored to its true world direction so directions stay
 * globally consistent, and children fill the remaining frame. Frames are tried
 * largest-first so the board is filled rather than leaving a hollow ring, and
 * each frame is also tried at several rotations.
 */
export function buildWorld({ graph, root, panelSize, boardW, boardH }) {
	if (!graph?.[root]) return null;
	if (![boardW, boardH].every(Number.isFinite)) return null;
	const limits = boardLimits(boardW, boardH);
	if (limits.x <= 0 || limits.y <= 0) return null;

	const rootPanel = panelSize(root);
	if (!rootPanel) return null;
	if (rootPanel.w + 2 * MARGIN > boardW) return null;
	if (rootPanel.h + 2 * MARGIN > boardH) return null;

	const positions = { [root]: { x: 0, y: 0 } };
	const queue = [root];

	while (queue.length) {
		const id = queue.shift();
		const children = graph[id].children ?? [];
		if (!children.length) continue;

		const parent = graph[id].parent;
		const parentAngle = parent
			? Math.atan2(
					positions[parent].y - positions[id].y,
					positions[parent].x - positions[id].x,
				)
			: TOP;
		const slots = children.length + (parent ? 1 : 0);

		let placed = null;
		// A frame smaller than the node's own panel would drop children on top of
		// it, so the frame is clamped outward to the panel envelope.
		const ownPanel = panelSize(id);
		if (!ownPanel) return null;
		const minHalfW = ownPanel.w / 2 + NODE.w / 2 + GAP;
		const minHalfH = ownPanel.h / 2 + NODE.h / 2 + GAP;
		if (minHalfW > limits.x || minHalfH > limits.y) return null;
		search: for (let step = 0; step <= 76; step++) {
			// Largest frame first: a full board reads as one connected map, where a
			// small frame leaves a hollow centre surrounded by dead space.
			const scale = 1 - step * 0.01;
			if (scale < 0.24) break;
			const halfW = Math.max(limits.x * scale, minHalfW);
			const halfH = Math.max(limits.y * scale, minHalfH);
			const base = frameFraction(parentAngle, halfW, halfH);
			for (let turn = 0; turn < slots; turn++) {
				const candidate = children.map((_, index) =>
					framePoint(base + (index + 1 + turn) / slots, halfW, halfH),
				);
				const trial = { ...positions };
				children.forEach((child, index) => {
					trial[child] = {
						x: positions[id].x + candidate[index].x,
						y: positions[id].y + candidate[index].y,
					};
				});
				if (
					!children.every((child, index) =>
						children
							.slice(index + 1)
							.every((other) => cardsClear(trial[child], trial[other])),
					)
				)
					continue;
				// Validate the parent-focused view, plus the part of each child-focused
				// view this frame decides: the child's own children are placed later and
				// are validated by their own step, so partial offsets are skipped here.
				if (!viewIsValid(graph, trial, id, panelSize, limits)) continue;
				if (
					!children.every((child) =>
						viewIsValid(graph, trial, child, panelSize, limits),
					)
				)
					continue;
				placed = trial;
				break search;
			}
		}
		if (!placed) return null;
		children.forEach((child) => {
			positions[child] = placed[child];
			queue.push(child);
		});
	}
	return positions;
}

/**
 * Camera offset that centres `focus` on the board. Nodes keep their world
 * coordinates; only this translation changes between views, which is what makes
 * navigation read as a pan along the edge to the next node.
 */
export function cameraFor(positions, focus) {
	const point = positions?.[focus];
	return point ? { x: -point.x, y: -point.y } : { x: 0, y: 0 };
}

/** Which nodes are drawn for a focused node: itself plus its direct links. */
export function visibleFor(graph, focus) {
	return graph?.[focus] ? [focus, ...neighbourIds(graph, focus)] : [];
}

/** The direct links of a focused node, i.e. everything an edge is drawn to. */
export function linkedFor(graph, focus) {
	return neighbourIds(graph, focus);
}

/**
 * A node is suppressed only when the focused panel would cover it. Everything
 * else stays drawn, even far off the board edge, so the graph reads as one
 * continuous map rather than a fresh star per view.
 */
export function occludedBy(positions, focus, panel) {
	const origin = positions?.[focus];
	const hidden = new Set();
	if (!origin || !panel) return hidden;
	for (const [id, point] of Object.entries(positions)) {
		if (id === focus) continue;
		const offset = { x: point.x - origin.x, y: point.y - origin.y };
		if (!clearsPanel(offset, panel.w, panel.h)) hidden.add(id);
	}
	return hidden;
}

/**
 * Every edge in the graph, in world coordinates, centre to centre. Edges are
 * a property of the map and not of the current view, so they are emitted once
 * and simply pan with the camera. Node cards are opaque, so endpoints are
 * intentionally overpainted by their boxes.
 */
export function allEdges(graph, positions) {
	const edges = [];
	for (const [id, node] of Object.entries(graph)) {
		for (const child of node.children) {
			if (!positions[id] || !positions[child]) continue;
			edges.push({
				id: `${id}~${child}`,
				from: id,
				to: child,
				x1: positions[id].x,
				y1: positions[id].y,
				x2: positions[child].x,
				y2: positions[child].y,
			});
		}
	}
	return edges;
}

/**
 * A one-ended continuation hint for the focused node's parent. The parent card
 * shown as a backlink may itself link onward to neighbours this view
 * deliberately never draws (`visibleFor`), so a short stub starts at the
 * parent card's boundary and points in the averaged unit direction of those
 * hidden neighbours. Returns `null` when the focus has no parent (`home`), or
 * when the parent's other neighbours have no clear common direction — none
 * placed, or vectors that cancel exactly.
 */
export function stubEdge(graph, positions, focus, length = 56) {
	const parent = graph[focus]?.parent;
	if (!parent || !positions[parent]) return null;
	const others = neighbourIds(graph, parent).filter(
		(id) => id !== focus && positions[id],
	);
	let dx = 0;
	let dy = 0;
	for (const other of others) {
		const vx = positions[other].x - positions[parent].x;
		const vy = positions[other].y - positions[parent].y;
		const norm = Math.hypot(vx, vy);
		if (!norm) continue;
		dx += vx / norm;
		dy += vy / norm;
	}
	const magnitude = Math.hypot(dx, dy);
	if (!magnitude) return null;
	const angle = Math.atan2(dy, dx);
	// Where the resultant direction meets the parent card's boundary, then
	// `length` px further outward — the same frame math used to seat children.
	const boundary = framePoint(
		frameFraction(angle, NODE.w / 2, NODE.h / 2),
		NODE.w / 2,
		NODE.h / 2,
	);
	return {
		from: parent,
		x1: positions[parent].x + boundary.x,
		y1: positions[parent].y + boundary.y,
		x2: positions[parent].x + boundary.x + (dx / magnitude) * length,
		y2: positions[parent].y + boundary.y + (dy / magnitude) * length,
	};
}
