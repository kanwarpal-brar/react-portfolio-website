// layout.js — pure, DOM-free geometry. No document/window references, so this
// module is safe to unit-test with `node --test` and to import from the
// build script. Every function takes plain numbers/objects and returns
// plain numbers/objects.

/**
 * boardScale — the single viewport-adaptation factor for the whole world.
 * Every node size, position, and fan frame is defined at a reference scale
 * (s = 1) and multiplied by s, so all clearances between boxes are
 * scale-invariant: if the reference layout fits, every scaled layout fits.
 * The home-view world spans fitW × fitH px at s = 1; s is the smaller of the
 * two per-axis fits (the layout is wider than tall), capped at `max`.
 */
export function boardScale({ bw, bh, margin = 12, fitW, fitH, max = 1.3 }) {
	const sx = (bw - 2 * margin) / fitW;
	const sy = (bh - 2 * margin) / fitH;
	return Math.max(0, Math.min(max, sx, sy));
}

/**
 * rectPerimeterPoint — the point at arc-length `s` (clockwise from the
 * top-center) along the perimeter of a rectangle centered at the origin with
 * half-extents (halfW, halfH). Returns origin-relative {x, y}.
 */
export function rectPerimeterPoint(halfW, halfH, s) {
	const w = 2 * halfW;
	const h = 2 * halfH;
	const P = 2 * (w + h);
	s = ((s % P) + P) % P;
	if (s < halfW) return { x: s, y: -halfH }; // top edge, center → right
	s -= halfW;
	if (s < h) return { x: halfW, y: -halfH + s }; // right edge, top → bottom
	s -= h;
	if (s < w) return { x: halfW - s, y: halfH }; // bottom edge, right → left
	s -= w;
	if (s < h) return { x: -halfW, y: halfH - s }; // left edge, bottom → top
	s -= h;
	return { x: -halfW + s, y: -halfH }; // top edge, left → center
}

/**
 * squareWheelPositions — place `count` nodes evenly (by perimeter arc length)
 * around a rectangle ("square wheel") centered at (cx, cy) with half-extents
 * (halfW, halfH). Nodes are centered within their arc segment (offset by half
 * a step) so none sits exactly at the top-center (clear of the vertical spoke
 * to the section node) and the layout is left-right symmetric for even
 * counts. Returns an array of absolute {x, y} points, clockwise from the top.
 */
export function squareWheelPositions({ count, cx, cy, halfW, halfH }) {
	if (!count || count <= 0) return [];
	const P = 2 * (2 * halfW + 2 * halfH);
	const step = P / count;
	const positions = [];
	for (let i = 0; i < count; i++) {
		const s = (i + 0.5) * step;
		const p = rectPerimeterPoint(halfW, halfH, s);
		positions.push({ x: cx + p.x, y: cy + p.y });
	}
	return positions;
}

/**
 * rectEdgePoint — the point where the line from (nx, ny) to (cx, cy) crosses
 * the boundary of an axis-aligned rectangle centered at (cx, cy) with
 * half-width `hw` and half-height `hh`. Used to clip connector lines to a
 * box's edge instead of its center.
 */
export function rectEdgePoint(cx, cy, nx, ny, hw, hh) {
	const dx = nx - cx;
	const dy = ny - cy;
	if (dx === 0 && dy === 0) return { x: nx, y: ny };
	const tx = hw / Math.abs(dx);
	const ty = hh / Math.abs(dy);
	const t = Math.min(tx, ty);
	return { x: nx - dx * t, y: ny - dy * t };
}

/**
 * spokeLines — connector endpoints from one hub to its nodes, clipped to the
 * real box edges. Coordinates are supplied by the caller in one space
 * (screen or world); this helper deliberately has no knowledge of views.
 */
export function spokeLines({ hub, nodes, type, activeId = null }) {
	return nodes.map((node) => {
		const start = rectEdgePoint(node.x, node.y, hub.x, hub.y, hub.hw, hub.hh);
		const end = rectEdgePoint(hub.x, hub.y, node.x, node.y, node.hw, node.hh);
		return {
			id: node.id,
			type,
			active: node.id === activeId,
			x1: start.x,
			y1: start.y,
			x2: end.x,
			y2: end.y,
		};
	});
}
