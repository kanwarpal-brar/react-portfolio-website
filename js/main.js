// main.js — entry point. Boots the shell, wires routing + clicks + keyboard
// (Esc) + resize.

import { normalizeHash, applyHash, navigate, currentState } from "./router.js";
import {
	render,
	scheduleGeometry,
	applyGeometry,
	initShell,
} from "./render.js";

function debounce(fn, ms) {
	let t;
	return (...args) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...args), ms);
	};
}

/**
 * Navigate + render synchronously, with focus handling. Every in-app
 * navigation runs through here (node/breadcrumb clicks, background-click-home,
 * and Esc). The camera pan + node expand/collapse animations are pure CSS
 * transitions on the persistent world nodes, so there is nothing to measure
 * or choreograph here — render + a synchronous geometry pass is enough. The
 * follow-up hashchange re-renders the same state, which is a no-op visually.
 */
function goTo(path, trigger) {
	const state = navigate(path);
	render(state);
	// Commit positions/camera now (render only schedules geometry for the next
	// frame) so focus lands on the already-focused node.
	applyGeometry();
	const triggerOnScreen = trigger && document.contains(trigger);
	if (state.view !== "home") {
		// Move focus to the focused node's expanded region (or the card when
		// collapsed, where the world is hidden).
		const graph = document.getElementById("graph");
		const target = graph?.classList.contains("collapsed")
			? document.getElementById("card")
			: document.querySelector(
					".is-focused .pn-expanded, .is-focused .fn-expanded",
				);
		requestAnimationFrame(() => {
			try {
				target?.focus({ preventScroll: true });
			} catch (_) {}
		});
	} else if (triggerOnScreen) {
		try {
			trigger.focus({ preventScroll: true });
		} catch (_) {}
	}
}

function handleGraphClick(e) {
	if (e.target.closest("a")) return; // real links (repo/mailto/PDF) behave natively

	const btn = e.target.closest("button");
	if (!btn) {
		// Click on the bare board (not a node or content) returns home. Empty
		// space can be #graph itself or one of the world's full-size layers.
		const bare = ["graph", "world", "pnodes", "fan"].includes(e.target.id);
		if (bare && currentState().view !== "home") {
			goTo("home", null);
		}
		return;
	}

	if (btn.dataset.nav) {
		goTo(btn.dataset.nav, btn);
		return;
	}
	if (btn.dataset.child) {
		const state = currentState();
		if (state.section) goTo(state.section + "/" + btn.dataset.child, btn);
		return;
	}
}

function boot() {
	normalizeHash();
	initShell();
	render(applyHash());

	window.addEventListener("hashchange", () => {
		render(applyHash());
	});

	const graph = document.getElementById("graph");
	if (graph) {
		graph.addEventListener("click", handleGraphClick);
	}

	// Esc climbs one level (child → section → home), animated like a click.
	document.addEventListener("keydown", (e) => {
		if (e.key !== "Escape") return;
		const s = currentState();
		if (s.view === "child") goTo(s.section, null);
		else if (s.view === "section") goTo("home", null);
	});

	if (typeof ResizeObserver !== "undefined" && graph) {
		new ResizeObserver(scheduleGeometry).observe(graph);
	} else {
		window.addEventListener("resize", scheduleGeometry);
	}

	// Topbar viewport read-out: the actual window size in px, a small TUI
	// chrome touch. (Was a derived cols\u00d7rows char-grid estimate \u2014 accurate to
	// its own math, but meaningless as a "window size" at a glance since it
	// didn't correspond to any number the user could see elsewhere.)
	const updateDims = debounce(() => {
		const meta = document.getElementById("meta-dims");
		if (!meta) return;
		meta.textContent = `${window.innerWidth}\u00d7${window.innerHeight}`;
	}, 80);

	updateDims();
	window.addEventListener("resize", updateDims);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
