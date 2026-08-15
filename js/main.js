// main.js — native hash-link navigation plus the small graph interactions.

import { applyHash, currentState, navigate, normalizeHash } from "./router.js";
import {
	initShell,
	invalidateWorld,
	render,
	scheduleGeometry,
} from "./render.js";

function updateDimensions() {
	const meta = document.querySelector("#meta-dims");
	if (meta) meta.textContent = `${window.innerWidth}×${window.innerHeight}`;
}

function go(path) {
	render(navigate(path), { moveFocus: true });
}

function boot() {
	normalizeHash();
	initShell();
	render(applyHash());
	updateDimensions();

	// Activating a node link makes that node the focus, and the focused node's
	// link is removed from the tab order — so by the time `hashchange` fires,
	// activeElement is already <body>. Record the intent at click/keydown time
	// instead, so keyboard users land on the panel they just opened.
	let keyboardNavigation = false;
	document.addEventListener("keydown", (event) => {
		if (event.key !== "Enter" && event.key !== " ") return;
		keyboardNavigation = Boolean(event.target?.closest?.(".node-link"));
	});
	document.addEventListener("pointerdown", () => {
		keyboardNavigation = false;
	});

	window.addEventListener("hashchange", () => {
		const moveFocus = keyboardNavigation;
		keyboardNavigation = false;
		render(applyHash(), { moveFocus });
	});
	window.addEventListener("resize", updateDimensions);

	const graph = document.querySelector("#graph");
	graph?.addEventListener("click", (event) => {
		if (!event.target.closest(".node") && currentState().view !== "home")
			go("home");
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape") return;
		const state = currentState();
		if (state.view === "child") go(state.section);
		else if (state.view === "section") go("home");
	});

	// A resize can change which panel width wins, so the cached world is dropped
	// and re-solved rather than re-used at the wrong size.
	const resolveGeometry = () => {
		invalidateWorld();
		scheduleGeometry();
	};
	if (typeof ResizeObserver !== "undefined" && graph) {
		new ResizeObserver(resolveGeometry).observe(graph);
	} else {
		window.addEventListener("resize", resolveGeometry);
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
