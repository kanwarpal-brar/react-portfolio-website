// layout.js — pure geometry for the focus-and-ring node board.
// No DOM references: this module is deliberately small and unit-testable.

export const NODE = Object.freeze({ w: 176, h: 76 });
export const GAP = 20;
export const MARGIN = 12;

const SAMPLES = 720;
const TAU = Math.PI * 2;

function wrap(value, max) {
	return ((value % max) + max) % max;
}

/**
 * Points distributed by arc length, rather than angle, look evenly spaced on
 * a wide ellipse. The returned points are relative to the ellipse centre.
 */
function ellipsePoints(count, rx, ry, startAngle) {
	if (!count) return [];

	const lengths = [0];
	let previous = { x: rx, y: 0 };
	for (let index = 1; index <= SAMPLES; index++) {
		const angle = (index / SAMPLES) * TAU;
		const point = { x: rx * Math.cos(angle), y: ry * Math.sin(angle) };
		lengths.push(
			lengths[index - 1] +
				Math.hypot(point.x - previous.x, point.y - previous.y),
		);
		previous = point;
	}

	const perimeter = lengths.at(-1);
	const start = (wrap(startAngle, TAU) / TAU) * perimeter;
	return Array.from({ length: count }, (_, index) => {
		const target = wrap(start + (index * perimeter) / count, perimeter);
		let upper = 1;
		while (lengths[upper] < target) upper++;
		const lower = upper - 1;
		const fraction =
			lengths[upper] - lengths[lower] === 0
				? 0
				: (target - lengths[lower]) / (lengths[upper] - lengths[lower]);
		const angle = ((lower + fraction) / SAMPLES) * TAU;
		return { x: rx * Math.cos(angle), y: ry * Math.sin(angle) };
	});
}

function clearsPanel(point, panelW, panelH) {
	return (
		Math.abs(point.x) - (panelW + NODE.w) / 2 >= GAP ||
		Math.abs(point.y) - (panelH + NODE.h) / 2 >= GAP
	);
}

function nodesClear(a, b) {
	return (
		Math.max(Math.abs(a.x - b.x) - NODE.w, Math.abs(a.y - b.y) - NODE.h) >= GAP
	);
}

/**
 * Find compact-node positions around a centred focus panel.
 *
 * Nodes start on the largest ellipse that keeps their full boxes on-board.
 * A point that intersects the focus panel moves radially outward until it
 * clears either the panel's x or y extent. If that push exits the board, or
 * any pair of compact nodes is too close, the board is infeasible and `null`
 * is returned. Consumers then switch to the flow presentation.
 */
export function ringPositions({
	n,
	startAngle = -Math.PI / 2,
	panelW,
	panelH,
	boardW,
	boardH,
}) {
	if (!Number.isInteger(n) || n < 0) return null;
	if (n === 0) return [];
	if (![panelW, panelH, boardW, boardH].every(Number.isFinite)) return null;

	const rx = boardW / 2 - NODE.w / 2 - MARGIN;
	const ry = boardH / 2 - NODE.h / 2 - MARGIN;
	if (
		rx <= 0 ||
		ry <= 0 ||
		panelW <= 0 ||
		panelH <= 0 ||
		panelW + 2 * MARGIN > boardW ||
		panelH + 2 * MARGIN > boardH
	)
		return null;

	const radialPoints = ellipsePoints(n, rx, ry, startAngle);
	const points = [];
	for (const point of radialPoints) {
		const distance = Math.hypot(point.x, point.y);
		const ux = point.x / distance;
		const uy = point.y / distance;
		const clearX =
			Math.abs(ux) < Number.EPSILON
				? Infinity
				: (panelW / 2 + NODE.w / 2 + GAP) / Math.abs(ux);
		const clearY =
			Math.abs(uy) < Number.EPSILON
				? Infinity
				: (panelH / 2 + NODE.h / 2 + GAP) / Math.abs(uy);
		const radius = clearsPanel(point, panelW, panelH)
			? distance
			: Math.max(distance, Math.min(clearX, clearY));
		const pushed = { x: ux * radius, y: uy * radius };
		if (Math.abs(pushed.x) > rx + 0.001 || Math.abs(pushed.y) > ry + 0.001)
			return null;
		points.push({ x: boardW / 2 + pushed.x, y: boardH / 2 + pushed.y });
	}

	for (let left = 0; left < points.length; left++) {
		for (let right = left + 1; right < points.length; right++) {
			if (!nodesClear(points[left], points[right])) return null;
		}
	}
	return points;
}

/** Decorative SVG edge data. Node cards are opaque, so centre endpoints are
 * intentionally overpainted by their boxes rather than clipped to the edges. */
export function edgeLines({ from, to }) {
	return to.map((node) => ({
		id: node.id,
		x1: from.x,
		y1: from.y,
		x2: node.x,
		y2: node.y,
	}));
}
