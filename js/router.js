// router.js — hash <-> state. Pure routing logic; no DOM writes other than
// `location`/`history`. `render.js` reacts to state changes; this module
// only knows about parsing, validating, and producing hashes.

import { TREE } from './data.js';

/** All top-level route names, including 'home'. */
const NODES = ['home', 'work', 'projects', 'resume', 'socials', 'cluster'];
const SECTIONS = NODES.filter((n) => n !== 'home');
const VALID_SECTIONS = new Set(SECTIONS);

let _state = { view: 'home' };

/** Parse a location.hash string into a validated state object. */
export function parseState(hash) {
  const raw = (hash || '').replace(/^#\/?/, '').trim().toLowerCase();
  if (!raw || raw === 'home') return { view: 'home' };
  const parts = raw.split('/').filter(Boolean);
  const section = parts[0];
  if (!VALID_SECTIONS.has(section)) return { view: 'home' };
  if (parts.length < 2) return { view: 'section', section };
  const child = parts[1];
  const t = TREE[section];
  if (t && t.children && t.children.includes(child)) {
    return { view: 'child', section, child };
  }
  return { view: 'section', section };
}

function stateToHash(state) {
  if (state.view === 'home') return '#/home';
  if (state.view === 'section') return '#/' + state.section;
  return '#/' + state.section + '/' + state.child;
}

/** Normalize location.hash (invalid/missing -> #/home) without pushing history. */
export function normalizeHash() {
  _state = parseState(location.hash);
  const want = stateToHash(_state);
  if (location.hash !== want) history.replaceState(null, '', want);
}

/**
 * Navigate to a section/child path, e.g. navigate('work') or navigate('work/id').
 * Updates the in-memory state synchronously (so the caller can render
 * immediately) and updates location.hash if it differs. If the hash does
 * change, the resulting `hashchange` event re-parses it via applyHash() —
 * landing on the same state, so the extra render is a harmless no-op.
 */
export function navigate(nameOrPath) {
  const state = parseState('#/' + String(nameOrPath || '').toLowerCase());
  _state = state;
  const want = stateToHash(state);
  if (location.hash !== want) location.hash = want;
  return state;
}

/** Re-parse location.hash into the current state (call from a hashchange handler). */
export function applyHash() {
  _state = parseState(location.hash);
  return _state;
}

export function currentState() {
  return _state;
}
