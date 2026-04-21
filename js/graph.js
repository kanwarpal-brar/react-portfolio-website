// graph.js — hierarchical routing, orbit layout, SVG connection lines.

import { TREE, workExperience, extraCurricular, projects } from './data.js';

export const NODES = ['home', 'work', 'projects', 'socials', 'resume', 'cluster'];
const VALID = new Set(NODES);

// Flat child-content index keyed by child ID
const CHILD_CONTENT = {};
for (const w of workExperience) CHILD_CONTENT[w.id] = { kind: 'work',  data: w };
for (const e of extraCurricular) CHILD_CONTENT[e.id] = { kind: 'extra', data: e };
for (const p of projects)        CHILD_CONTENT[p.id] = { kind: 'project', data: p };

// Current path
let _path = ['home'];
export function currentPath() { return _path.slice(); }
export function currentNode() { return _path[0] || 'home'; }

// Focus restoration
let lastTrigger = null;
export function setTrigger(el) { lastTrigger = el; }
export function getTrigger() { return lastTrigger; }

/** Parse a hash string into a validated path array. */
function parsePath(hash) {
  const raw = (hash || '').replace(/^#\/?/, '').trim().toLowerCase();
  if (!raw) return ['home'];
  const parts = raw.split('/').filter(Boolean);
  const parent = parts[0];
  if (!VALID.has(parent)) return ['home'];
  if (parts.length < 2) return [parent];
  const childId = parts[1];
  const treeNode = TREE[parent];
  if (treeNode && treeNode.children && treeNode.children.includes(childId)) {
    return [parent, childId];
  }
  return [parent];
}

export function normalizeHash() {
  _path = parsePath(location.hash);
  const want = '#/' + _path.join('/');
  if (location.hash !== want) history.replaceState(null, '', want);
}

export function navigate(nameOrPath) {
  const path = parsePath('#/' + String(nameOrPath || '').toLowerCase());
  const want = '#/' + path.join('/');
  if (location.hash === want) { applyState(); return true; }
  location.hash = want;
  return true;
}

export function applyState() {
  _path = parsePath(location.hash);
  const [node, childId] = _path;
  const graph = document.getElementById('graph');
  if (!graph) return;

  const prev = graph.dataset.expanded;
  graph.dataset.expanded = node;

  for (const name of NODES) {
    const el = document.getElementById('node-' + name);
    if (!el) continue;
    el.classList.toggle('expanded', name === node);
    el.setAttribute('aria-expanded', name === node ? 'true' : 'false');
  }

  const titles = {
    home:     'Kanwarpal Brar — Developer, Researcher, Innovator',
    work:     'work — Kanwarpal Brar',
    projects: 'projects — Kanwarpal Brar',
    socials:  'connect — Kanwarpal Brar',
    resume:   'resume — Kanwarpal Brar',
    cluster:  'cluster — Kanwarpal Brar',
  };
  document.title = childId
    ? `${childId} — ${node} — Kanwarpal Brar`
    : (titles[node] || titles.home);

  const expandedEl = document.getElementById('node-' + node);
  if (expandedEl) {
    expandedEl.scrollTop = 0;
    if (childId) {
      renderChildView(expandedEl, node, childId);
    } else {
      restoreParentView(expandedEl);
    }
  }

  if (prev !== undefined && prev !== node && node !== 'home') {
    if (expandedEl) {
      requestAnimationFrame(() => {
        try { expandedEl.focus({ preventScroll: true }); } catch (_) {}
      });
    }
  } else if (prev !== undefined && prev !== 'home' && node === 'home') {
    if (lastTrigger && document.contains(lastTrigger)) {
      try { lastTrigger.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  updateOrbitNodes(_path);
  scheduleDrawLines();
}

// ---- Child view rendering ----

function restoreParentView(cardEl) {
  const overlay = cardEl.querySelector('.child-overlay');
  if (overlay) overlay.remove();
  const body = cardEl.querySelector('.node-body');
  if (body) body.style.display = '';
}

function renderChildView(cardEl, parentName, childId) {
  // Hide static body, show overlay
  const body = cardEl.querySelector('.node-body');
  if (body) body.style.display = 'none';

  let overlay = cardEl.querySelector('.child-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'child-overlay node-body';
    cardEl.appendChild(overlay);
  }
  overlay.textContent = '';

  // Breadcrumb
  const bc = document.createElement('div');
  bc.className = 'breadcrumb';
  const bcBtn = document.createElement('button');
  bcBtn.className = 'bc-parent';
  bcBtn.textContent = '← ' + parentName;
  bcBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(parentName); });
  const bcSep = document.createTextNode(' / ');
  const bcChild = document.createElement('span');
  bcChild.className = 'bc-child';
  bcChild.textContent = childId;
  bc.appendChild(bcBtn);
  bc.appendChild(document.createTextNode(' '));
  bc.appendChild(bcSep);
  bc.appendChild(document.createTextNode(' '));
  bc.appendChild(bcChild);
  overlay.appendChild(bc);

  const content = CHILD_CONTENT[childId];
  if (content) overlay.appendChild(buildChildContent(content));
}

function buildChildContent(content) {
  const container = document.createElement('div');
  const d = content.data;

  if (content.kind === 'project') {
    const proj = document.createElement('article');
    proj.className = 'proj';
    const pname = document.createElement('div');
    pname.className = 'pname';
    pname.textContent = d.name;
    const pdesc = document.createElement('div');
    pdesc.className = 'pdesc';
    pdesc.textContent = d.desc;
    const ptags = document.createElement('div');
    ptags.className = 'ptags';
    ptags.textContent = d.tags.map(t => '[' + t + ']').join(' ');
    proj.appendChild(pname);
    proj.appendChild(pdesc);
    proj.appendChild(ptags);
    if (d.url) {
      const link = document.createElement('a');
      link.href = d.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = '→ ' + d.url.replace('https://', '');
      proj.appendChild(link);
    }
    container.appendChild(proj);
  } else {
    // work or extra
    const box = document.createElement('article');
    box.className = 'exp-box';
    const header = document.createElement('header');
    const left = document.createElement('div');
    const roleSpan = document.createElement('span');
    roleSpan.className = 'role';
    roleSpan.textContent = d.title || d.name || '';
    const coSpan = document.createElement('span');
    coSpan.className = 'co';
    coSpan.textContent = (content.kind === 'extra') ? ' · ' + (d.role || '') : ' · ' + (d.company || '');
    left.appendChild(roleSpan);
    left.appendChild(coSpan);
    const when = document.createElement('span');
    when.className = 'when';
    when.textContent = d.date || d.role || '';
    header.appendChild(left);
    if (d.date) header.appendChild(when);
    const p = document.createElement('p');
    p.textContent = d.paragraph || d.desc || '';
    box.appendChild(header);
    box.appendChild(p);
    container.appendChild(box);
  }
  return container;
}

// ---- Orbit nodes ----

const ORBIT_CAP = 8;

function getOrbitChildren(path) {
  const [node, childId] = path;
  const treeNode = TREE[node];
  // 'recruiter' (home) uses in-card tiles; 'leaf' has no children
  if (!treeNode || !treeNode.children || treeNode.kind === 'leaf' || treeNode.kind === 'recruiter') return [];
  const children = treeNode.children;
  // At child level, show siblings (exclude current child)
  if (childId) return children.filter(c => c !== childId);
  // At parent level, show all children (capped)
  return children.slice(0, ORBIT_CAP);
}

function getOrbitLabel(id) {
  const c = CHILD_CONTENT[id];
  if (!c) return { name: id, sub: '' };
  if (c.kind === 'project') return { name: c.data.name, sub: '' };
  if (c.kind === 'work') return { name: c.data.company, sub: c.data.title.split(' ').slice(0, 3).join(' ') };
  if (c.kind === 'extra') return { name: c.data.name, sub: c.data.role };
  return { name: id, sub: '' };
}

function computeOrbitPositions(expandedEl, graphEl, count) {
  if (count === 0) return [];
  const gr = graphEl.getBoundingClientRect();
  if (!gr.width) return [];
  const er = expandedEl.getBoundingClientRect();

  const cx = gr.width  / 2;
  const cy = gr.height / 2;
  // Ellipse radii: card half-dims + a margin so orbit nodes sit just outside the card
  const margin = 72; // px
  const rx = Math.min(er.width  / 2 + margin, gr.width  * 0.44);
  const ry = Math.min(er.height / 2 + margin, gr.height * 0.44);

  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i / count);
    positions.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    });
  }
  return positions;
}

let _orbitNodes = []; // current orbit DOM nodes

function updateOrbitNodes(path) {
  const graph = document.getElementById('graph');
  if (!graph) return;

  const children = getOrbitChildren(path);

  // Remove all existing orbit nodes
  for (const el of _orbitNodes) el.remove();
  _orbitNodes = [];

  if (children.length === 0) return;

  const expandedEl = document.getElementById('node-' + path[0]);
  if (!expandedEl) return;

  const positions = computeOrbitPositions(expandedEl, graph, children.length);
  const [, currentChild] = path;

  children.forEach((childId, i) => {
    const pos = positions[i];
    if (!pos) return;
    const div = document.createElement('div');
    div.className = 'orbit-node' + (childId === currentChild ? ' active' : '');
    div.tabIndex = 0;
    div.setAttribute('role', 'button');
    const pathStr = path[0] + '/' + childId;
    div.setAttribute('aria-label', childId + ' — click to expand');
    div.style.left = pos.x + 'px';
    div.style.top  = pos.y + 'px';

    const lbl = getOrbitLabel(childId);
    const nameDiv = document.createElement('div');
    nameDiv.className = 'on-name';
    nameDiv.textContent = lbl.name;
    div.appendChild(nameDiv);
    if (lbl.sub) {
      const subDiv = document.createElement('div');
      subDiv.className = 'on-co';
      subDiv.textContent = lbl.sub;
      div.appendChild(subDiv);
    }

    div.addEventListener('click', (e) => { e.stopPropagation(); navigate(pathStr); });
    div.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(pathStr); }
    });

    graph.appendChild(div);
    _orbitNodes.push(div);
  });
}

export function repositionOrbitNodes() {
  if (_orbitNodes.length === 0) return;
  const graph = document.getElementById('graph');
  if (!graph) return;
  const expandedEl = document.getElementById('node-' + _path[0]);
  if (!expandedEl) return;
  const positions = computeOrbitPositions(expandedEl, graph, _orbitNodes.length);
  _orbitNodes.forEach((div, i) => {
    const pos = positions[i];
    if (!pos) return;
    div.style.left = pos.x + 'px';
    div.style.top  = pos.y + 'px';
  });
}

// ---- RAF coalescer ----
let _rafId = 0;
function scheduleDrawLines() {
  if (_rafId) cancelAnimationFrame(_rafId);
  _rafId = requestAnimationFrame(() => {
    _rafId = 0;
    repositionOrbitNodes();
    drawLines();
  });
}
export { scheduleDrawLines };

// ---- SVG lines ----

function rectEdgePoint(cx, cy, nx, ny, hw, hh) {
  const dx = nx - cx;
  const dy = ny - cy;
  if (dx === 0 && dy === 0) return { x: nx, y: ny };
  const tx = hw / Math.abs(dx);
  const ty = hh / Math.abs(dy);
  const t  = Math.min(tx, ty);
  return { x: nx - dx * t, y: ny - dy * t };
}

export function drawLines() {
  const svg = document.getElementById('graph-lines');
  const graph = document.getElementById('graph');
  if (!svg || !graph) return;

  const rect = graph.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  svg.setAttribute('width',  rect.width);
  svg.setAttribute('height', rect.height);

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const node = currentNode();
  if (node !== 'home') {
    svg.style.opacity = '0';
    return;
  }
  svg.style.opacity = '';

  const cx = rect.width  / 2;
  const cy = rect.height / 2;
  const homeEl = document.getElementById('node-home');

  for (const name of NODES) {
    if (name === 'home') continue;
    const el = document.getElementById('node-' + name);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const nx = r.left - rect.left + r.width  / 2;
    const ny = r.top  - rect.top  + r.height / 2;

    let x1 = cx, y1 = cy;
    if (homeEl) {
      const hr = homeEl.getBoundingClientRect();
      const ep = rectEdgePoint(nx, ny, cx, cy, hr.width / 2 - 2, hr.height / 2 - 2);
      x1 = ep.x; y1 = ep.y;
    }
    const ep2 = rectEdgePoint(cx, cy, nx, ny, r.width / 2 - 2, r.height / 2 - 2);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', ep2.x);
    line.setAttribute('y2', ep2.y);
    svg.appendChild(line);
  }
}

// ---- Click handler ----

export function handleGraphClick(e) {
  const graph = document.getElementById('graph');
  if (!graph) return;

  if (e.target.closest('a')) return;
  if (e.target.closest('button.bc-parent')) return; // breadcrumb button handles itself

  // Orbit node click is handled by its own listener; guard here too
  if (e.target.closest('.orbit-node')) return;

  const clickedNode = e.target.closest('.node');
  const expandedName = currentNode();

  if (clickedNode) {
    if (clickedNode.dataset.name === expandedName) {
      // Check if click hit a peripheral node visually stacked under expanded card
      for (const name of NODES) {
        if (name === expandedName) continue;
        const el = document.getElementById('node-' + name);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top  && e.clientY <= r.bottom) {
          setTrigger(el);
          navigate(name);
          return;
        }
      }
      return;
    }
    setTrigger(clickedNode);
    navigate(clickedNode.dataset.name);
    return;
  }

  if (expandedName !== 'home') {
    setTrigger(null);
    navigate('home');
  }
}
