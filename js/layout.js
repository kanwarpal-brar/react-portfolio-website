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
export const MARGIN = 12;

const TOP = -Math.PI / 2;
// How far a child may be nudged outward along its own spoke to escape another
// branch, and in what increment.
const PUSH_STEP = 8;
const PUSH_LIMIT = 120;
// Fraction of the board the root's ring may use, leaving room outside it for the
// sections' own children.
const ROOT_RING_ROOM = 0.62;

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
	let onBoard = 0;
	for (const offset of offsets) {
		if (!clearsPanel(offset, panel.w, panel.h)) return false;
		if (
			Math.abs(offset.x) <= limits.x + 0.5 &&
			Math.abs(offset.y) <= limits.y + 0.5
		)
			onBoard++;
	}
	for (let left = 0; left < offsets.length; left++) {
		for (let right = left + 1; right < offsets.length; right++) {
			if (!cardsClear(offsets[left], offsets[right])) return false;
		}
	}
	// The parent must always be reachable, so at least one link is required, and
	// a majority keeps a hub navigable without panning blindly.
	if (!offsets.length) return true;
	return onBoard >= Math.max(1, Math.ceil(offsets.length / 2));
}

/**
 * Every node stays on the map, so a placement must clear EVERY node already
 * placed — not just its own siblings. Without this, branches from different
 * sections silently overlap wherever their subtrees happen to meet.
 */
function clearOfEveryNode(positions, point, exclude) {
	for (const [id, other] of Object.entries(positions)) {
		if (exclude.has(id)) continue;
		if (!cardsClear(point, other)) return false;
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
 *   - neighbours clear each other and stay on-board when the node is centred;
 *   - the placement clears EVERY other node in the world, because the whole
 *     map stays visible and distant branches must not collide.
 * The parent's slot is anchored to its true world direction so directions stay
 * globally consistent, and children fill the remaining frame. Frames are tried
 * largest-first so the board is filled rather than leaving a hollow ring, and
 * each frame is also tried at several rotations so a branch can step around
 * another branch instead of failing outright.
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
	// The root's own ring is placed on a reduced frame rather than the full board.
	// Placing it at the edge is greedy: it looks generous on the home view but
	// leaves the busiest hubs (work has 10 children) with nowhere to put their own
	// subtree, and there is no backtracking to recover.
	const ringRoom = graph[root].children?.length ? ROOT_RING_ROOM : 1;

	while (queue.length) {
		const id = queue.shift();
		const children = graph[id].children ?? [];
		if (!children.length) continue;
		const frameRoom = id === root ? ringRoom : 1;

		const parent = graph[id].parent;
		const parentAngle = parent
			? Math.atan2(
					positions[parent].y - positions[id].y,
					positions[parent].x - positions[id].x,
				)
			: TOP;
		const slots = children.length + (parent ? 1 : 0);

		let placed = null;
		const family = new Set([id, ...children]);
		// A frame smaller than the node's own panel would drop children on top of
		// it, so the frame is clamped outward to the panel envelope. Children can
		// still be pushed further out, never closer in.
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
			const halfW = Math.max(limits.x * scale * frameRoom, minHalfW);
			const halfH = Math.max(limits.y * scale * frameRoom, minHalfH);
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
				// A hub near the edge of its parent's frame has children that wrap back
				// over the rest of the map. Rather than reject the whole frame, push the
				// offending child further out along its own spoke: the edge direction is
				// preserved, so the structure still reads correctly. The push also has to
				// respect the child's OWN panel, which will be centred here when the child
				// is focused — otherwise the hub would sit on top of it.
				const settled = [];
				children.forEach((child, index) => {
					const spoke = candidate[index];
					const length = Math.hypot(spoke.x, spoke.y) || 1;
					const ux = spoke.x / length;
					const uy = spoke.y / length;
					const childPanel = panelSize(child);
					// The push must not carry the child so far that its own parent falls off
					// the board when the child is focused, or the child becomes a dead end.
					const reaches = (point) =>
						Math.abs(positions[id].x - point.x) <= limits.x + 0.5 &&
						Math.abs(positions[id].y - point.y) <= limits.y + 0.5;
					let best = null;
					for (let push = 0; push < PUSH_LIMIT; push++) {
						const point = trial[child];
						if (!reaches(point)) break;
						const clearOfMap = clearOfEveryNode(positions, point, family);
						const clearOfSiblings = settled.every((other) =>
							cardsClear(point, trial[other]),
						);
						const room =
							!childPanel ||
							clearsPanel(
								{ x: positions[id].x - point.x, y: positions[id].y - point.y },
								childPanel.w,
								childPanel.h,
							);
						if (clearOfMap && clearOfSiblings && room) {
							best = point;
							break;
						}
						trial[child] = {
							x: point.x + ux * PUSH_STEP,
							y: point.y + uy * PUSH_STEP,
						};
					}
					if (best) trial[child] = best;
					settled.push(child);
				});
				if (
					!children.every((child) =>
						clearOfEveryNode(positions, trial[child], family),
					)
				)
					continue;
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
 * Hop distance from `focus` to every node, so the renderer can dim by depth.
 * The whole map stays on screen; distance is what tells the eye where it is.
 */
export function distancesFrom(graph, focus) {
	const distance = {};
	if (!graph?.[focus]) return distance;
	distance[focus] = 0;
	const queue = [focus];
	while (queue.length) {
		const id = queue.shift();
		for (const next of neighbourIds(graph, id)) {
			if (distance[next] !== undefined) continue;
			distance[next] = distance[id] + 1;
			queue.push(next);
		}
	}
	return distance;
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
