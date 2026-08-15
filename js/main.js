// main.js — native hash-link navigation plus the small graph interactions.

import { applyHash, currentState, navigate, normalizeHash } from "./router.js";
import { initShell, render, scheduleGeometry } from "./render.js";

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

	window.addEventListener("hashchange", () => {
		const moveFocus = document.activeElement?.matches(".node-link") ?? false;
		render(applyHash(), { moveFocus });
	});
	window.addEventListener("resize", updateDimensions);

	const graph = document.querySelector("#graph");
	graph?.addEventListener("click", (event) => {
		if (!event.target.closest(".node") && currentState().view !== "home") go("home");
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape") return;
		const state = currentState();
		if (state.view === "child") go(state.section);
		else if (state.view === "section") go("home");
	});

	if (typeof ResizeObserver !== "undefined" && graph) {
		new ResizeObserver(scheduleGeometry).observe(graph);
	} else {
		window.addEventListener("resize", scheduleGeometry);
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
