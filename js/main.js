// main.js — entry point. Wires router, graph interactions, and terminal.

import {
  applyState,
  normalizeHash,
  handleGraphClick,
  scheduleDrawLines,
  setTrigger,
  navigate,
} from './graph.js';
import { initTerminal, printWelcome, updatePromptLabel } from './terminal.js';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function boot() {
  normalizeHash();
  applyState();
  requestAnimationFrame(() => scheduleDrawLines());

  window.addEventListener('hashchange', () => {
    applyState();
    updatePromptLabel();
  });

  const graph = document.getElementById('graph');
  if (graph) {
    graph.addEventListener('click', handleGraphClick);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const active = document.activeElement;
    if (!active || !active.classList) return;
    if (active.classList.contains('node')) {
      e.preventDefault();
      setTrigger(active);
      if (active.dataset.name) navigate(active.dataset.name);
    } else if (active.classList.contains('home-tile') && active.dataset.nav) {
      e.preventDefault();
      navigate(active.dataset.nav);
    }
  });

  // Home tile clicks
  const homeTiles = document.getElementById('home-tiles');
  if (homeTiles) {
    homeTiles.addEventListener('click', (e) => {
      const tile = e.target.closest('.home-tile');
      if (tile && tile.dataset.nav) navigate(tile.dataset.nav);
    });
  }

  // Redraw SVG lines on resize — feature-detect ResizeObserver, fall back to window resize.
  if (typeof ResizeObserver !== 'undefined' && graph) {
    const ro = new ResizeObserver(() => scheduleDrawLines());
    ro.observe(graph);
  } else {
    window.addEventListener('resize', () => scheduleDrawLines());
  }
  window.addEventListener('orientationchange', () => scheduleDrawLines());

  initTerminal();
  printWelcome();
  updatePromptLabel();

  const updateDims = debounce(function () {
    const meta = document.getElementById('meta-dims');
    if (!meta) return;
    const probe = document.createElement('pre');
    probe.style.cssText =
      'position:fixed;top:-9999px;visibility:hidden;font:inherit;line-height:inherit;margin:0;padding:0;';
    probe.textContent = 'x';
    document.body.appendChild(probe);
    const r = probe.getBoundingClientRect();
    document.body.removeChild(probe);
    const cw = r.width  || 9;
    const ch = r.height || 23;
    meta.textContent =
      `${Math.floor(window.innerWidth / cw)}\u00d7${Math.floor(window.innerHeight / ch)}`;
  }, 80);

  updateDims();
  window.addEventListener('resize', updateDims);

  const bottom = document.getElementById('bottom');
  const cmd = document.getElementById('cmd');
  if (bottom && cmd) {
    bottom.addEventListener('click', (e) => {
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
