// graph.js — node graph state, hash routing, SVG connection lines.
// Exports used by main.js; no side-effects at import time.

export const NODES = ['home', 'work', 'projects', 'socials', 'resume', 'cluster'];
const VALID = new Set(NODES);

// Track the element the user activated, to restore focus on collapse.
let lastTrigger = null;
export function setTrigger(el) { lastTrigger = el; }
export function getTrigger() { return lastTrigger; }

/** Read current node from location.hash. Defaults to 'home'. */
export function currentNode() {
  const raw = (location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
  return VALID.has(raw) ? raw : 'home';
}

/** Normalize the hash so it always reads "#/<name>". No-op if already correct. */
export function normalizeHash() {
  const node = currentNode();
  const want = '#/' + node;
  if (location.hash !== want) {
    // Use replaceState on first load so we don't pollute history.
    history.replaceState(null, '', want);
  }
}

/** Navigate to a node. Pushes history so back/forward work. */
export function navigate(name) {
  const n = String(name || '').toLowerCase();
  if (!VALID.has(n)) return false;
  const want = '#/' + n;
  if (location.hash === want) {
    applyState(); // same target — still re-apply (e.g., on reload)
    return true;
  }
  location.hash = want; // triggers hashchange → applyState via main.js
  return true;
}

/** Apply current state to the DOM. Idempotent. */
export function applyState() {
  const node = currentNode();
  const graph = document.getElementById('graph');
  if (!graph) return;

  const prev = graph.dataset.expanded;
  graph.dataset.expanded = node;

  // Toggle .expanded class (so CSS can target it without data-attr selectors everywhere)
  for (const name of NODES) {
    const el = document.getElementById('node-' + name);
    if (!el) continue;
    el.classList.toggle('expanded', name === node);
  }

  // Update document title for the current section
  const titles = {
    home: 'Kanwarpal Brar — Developer, Researcher, Innovator',
    work: 'work — Kanwarpal Brar',
    projects: 'projects — Kanwarpal Brar',
    socials: 'connect — Kanwarpal Brar',
    resume: 'resume — Kanwarpal Brar',
    cluster: 'cluster — Kanwarpal Brar',
  };
  document.title = titles[node] || titles.home;

  // Scroll the expanded node to top (in case of re-entering)
  const expanded = document.getElementById('node-' + node);
  if (expanded) expanded.scrollTop = 0;

  // Focus management:
  //  - on navigate-by-keyboard, move focus inside the expanded node for screen readers
  //  - on collapse (home), restore focus to the last trigger if it exists
  if (prev && prev !== node && node !== 'home') {
    // moving to a non-home node: focus the expanded node
    if (expanded && document.activeElement !== expanded) {
      // Only steal focus if the user is navigating via keyboard (to avoid stealing from cmd input)
      // We let main.js decide; here we just ensure tabindex is set appropriately.
    }
  } else if (prev && prev !== 'home' && node === 'home') {
    // collapsing back to home: restore focus to trigger, or default to body
    if (lastTrigger && document.contains(lastTrigger)) {
      try { lastTrigger.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  // Redraw SVG lines (positions may have changed due to layout)
  drawLines();
}

/**
 * Draw dashed SVG lines from each peripheral node to the graph center.
 * Hidden when a node is expanded.
 */
export function drawLines() {
  const svg = document.getElementById('graph-lines');
  const graph = document.getElementById('graph');
  if (!svg || !graph) return;

  const rect = graph.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  svg.setAttribute('width', rect.width);
  svg.setAttribute('height', rect.height);

  // Clear existing
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const expanded = currentNode();
  if (expanded !== 'home') {
    // When something other than home is expanded, lines look messy — hide them.
    // (We still keep the SVG around for the home default.)
    svg.style.opacity = '0';
    return;
  }
  svg.style.opacity = '';

  // Center is the center of the graph pane.
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  for (const name of NODES) {
    const el = document.getElementById('node-' + name);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const nx = r.left - rect.left + r.width / 2;
    const ny = r.top - rect.top + r.height / 2;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', cx);
    line.setAttribute('y1', cy);
    line.setAttribute('x2', nx);
    line.setAttribute('y2', ny);
    svg.appendChild(line);
  }
}

/** Single delegated click handler for the graph pane.
 *  Rules:
 *   - Click inside the expanded node: let default behavior run (follow links, scroll, etc.)
 *   - Click on a peripheral node: navigate to it (default <a href> navigation handles it)
 *   - Click on background/SVG overlay: collapse to home (only if not already home)
 */
export function handleGraphClick(e) {
  const graph = document.getElementById('graph');
  if (!graph) return;

  const clickedNode = e.target.closest('.node');
  const expandedName = currentNode();

  if (clickedNode) {
    // Clicked on a node element.
    if (clickedNode.dataset.name === expandedName) {
      // Click inside expanded node: allow links/etc to work normally.
      return;
    }
    // Clicked a peripheral node: record trigger, let the <a href> navigate naturally.
    setTrigger(clickedNode);
    return;
  }

  // Clicked graph background / SVG overlay.
  if (expandedName !== 'home') {
    e.preventDefault();
    setTrigger(null);
    navigate('home');
  }
}
