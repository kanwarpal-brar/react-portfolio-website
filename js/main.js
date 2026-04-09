// main.js — entry point. Wires router, graph interactions, and terminal.

import {
  applyState,
  normalizeHash,
  handleGraphClick,
  drawLines,
  setTrigger,
  navigate,
} from './graph.js';
import { initTerminal, printWelcome } from './terminal.js';

function boot() {
  // 1. Normalize hash (empty → #/home) so direct deep links work
  normalizeHash();

  // 2. Initial render of state
  applyState();

  // 3. Wire hashchange so back/forward updates the graph
  window.addEventListener('hashchange', () => {
    applyState();
  });

  // 4. Delegated click on the graph pane
  const graph = document.getElementById('graph');
  if (graph) {
    graph.addEventListener('click', handleGraphClick);
  }

  // 5. Keyboard activation: Enter or Space on a focused .node navigates to it.
  //    Nodes are <article role="link"> so we implement the activation semantics
  //    here. Also records the trigger for focus restoration on collapse.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const active = document.activeElement;
    if (!active || !active.classList || !active.classList.contains('node')) return;
    e.preventDefault();
    setTrigger(active);
    if (active.dataset.name) navigate(active.dataset.name);
  });

  // 6. Redraw SVG lines on resize
  const ro = new ResizeObserver(() => drawLines());
  if (graph) ro.observe(graph);
  window.addEventListener('orientationchange', () => drawLines());

  // 7. Wire up the terminal
  initTerminal();
  printWelcome();

  // 8. Small QoL: allow clicking anywhere in #bottom to focus the input
  const bottom = document.getElementById('bottom');
  const cmd = document.getElementById('cmd');
  if (bottom && cmd) {
    bottom.addEventListener('click', (e) => {
      // don't steal focus from links the user is clicking
      if (e.target.closest('a')) return;
      cmd.focus();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
