// main.js — entry point. Boots the shell, wires routing + clicks + keyboard
// (Esc) + resize.

import { normalizeHash, applyHash, navigate, currentState } from './router.js';
import { render, scheduleGeometry, applyGeometry, initShell } from './render.js';
import { flipCardFrom, flipCardEnter } from './flip.js';

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Navigate + render synchronously, with focus handling and a card entrance
 * animation. Every in-app navigation runs through here (ring/tile/breadcrumb
 * clicks, background-click-home, and Esc, via the `goTo` callback), so
 * returning home animates the same as entering a section. When the trigger
 * element is still on-screen the card grows from it (FLIP); otherwise it plays
 * the generic settle-in. The follow-up hashchange re-renders but does not
 * re-animate, so there's no double entrance.
 */
function goTo(path, trigger) {
  const state = navigate(path);
  render(state);
  // Size the card to its FINAL box now (render only schedules geometry for the
  // next frame). flipCardFrom measures the card's box to compute the grow-from
  // transform, so it must be final before the flip — otherwise the animation is
  // scaled/aimed from a stale size.
  applyGeometry();
  const card = document.getElementById('card');
  if (state.view !== 'home') {
    requestAnimationFrame(() => { try { card?.focus({ preventScroll: true }); } catch (_) {} });
  } else if (trigger && document.contains(trigger)) {
    try { trigger.focus({ preventScroll: true }); } catch (_) {}
  }
  if (card) {
    if (trigger && document.contains(trigger)) flipCardFrom(trigger, card);
    else flipCardEnter(card);
  }
}

function handleGraphClick(e) {
  if (e.target.closest('a')) return; // real links (repo/mailto/PDF) behave natively

  const btn = e.target.closest('button');
  if (!btn) {
    // Click on the bare board (not card or content) returns home
    if (e.target.id === 'graph' && currentState().view !== 'home') {
      goTo('home', null);
    }
    return;
  }

  if (btn.classList.contains('snode')) {
    goTo(btn.dataset.section, btn);
    return;
  }
  if (btn.dataset.nav) {
    goTo(btn.dataset.nav, btn);
    return;
  }
  if (btn.dataset.child) {
    const state = currentState();
    if (state.section) goTo(state.section + '/' + btn.dataset.child, btn);
    return;
  }
}

function boot() {
  normalizeHash();
  initShell();
  render(applyHash());

  window.addEventListener('hashchange', () => {
    render(applyHash());
  });

  const graph = document.getElementById('graph');
  if (graph) {
    graph.addEventListener('click', handleGraphClick);
  }

  // Esc climbs one level (child → section → home), animated like a click.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const s = currentState();
    if (s.view === 'child') goTo(s.section, null);
    else if (s.view === 'section') goTo('home', null);
  });

  // Recompute geometry once the card's flip entrance settles, as a safety net
  // (geometry is already transform-immune, but this guarantees a final pass).
  const cardEl = document.getElementById('card');
  if (cardEl) {
    cardEl.addEventListener('transitionend', (e) => {
      if (e.target === cardEl && e.propertyName === 'transform') scheduleGeometry();
    });
  }

  if (typeof ResizeObserver !== 'undefined' && graph) {
    const ro = new ResizeObserver(() => scheduleGeometry());
    ro.observe(graph);
  } else {
    window.addEventListener('resize', () => scheduleGeometry());
  }
  window.addEventListener('orientationchange', () => scheduleGeometry());

  // Recompute once the monospace web font loads (ring nodes are sized in `ch`,
  // so their box changes when the real font replaces the fallback) and once the
  // page fully loads — belt-and-suspenders against an early first pass.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => scheduleGeometry());
  window.addEventListener('load', () => scheduleGeometry(), { once: true });

  // Topbar viewport read-out: the actual window size in px, a small TUI
  // chrome touch. (Was a derived cols\u00d7rows char-grid estimate \u2014 accurate to
  // its own math, but meaningless as a "window size" at a glance since it
  // didn't correspond to any number the user could see elsewhere.)
  const updateDims = debounce(() => {
    const meta = document.getElementById('meta-dims');
    if (!meta) return;
    meta.textContent = `${window.innerWidth}\u00d7${window.innerHeight}`;
  }, 80);

  updateDims();
  window.addEventListener('resize', updateDims);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
