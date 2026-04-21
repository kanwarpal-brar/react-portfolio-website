// terminal.js — shell-style command input. All output via textContent (no innerHTML).

import { navigate, currentPath, currentNode, NODES } from './graph.js';

function navigateUp() {
  const path = currentPath();
  if (path.length > 1) navigate(path[0]); // child → parent
  else if (path[0] !== 'home') navigate('home'); // parent → home
}
import { parablurb, aboutBlurb, resumePath, TREE } from './data.js';

// ---------- command output ----------
const outEl = () => document.getElementById('cmdout');

function line(text, cls) {
  const out = outEl();
  if (!out) return;
  const span = document.createElement('span');
  if (cls) span.className = cls;
  span.textContent = (text == null ? '' : String(text)) + '\n';
  out.appendChild(span);
  const region = out.parentElement;
  if (region) region.scrollTop = region.scrollHeight;
}

function echoPrompt(raw) {
  const out = outEl();
  if (!out) return;
  const prefix = document.createElement('span');
  prefix.className = 'cmd-prompt';
  prefix.textContent = `user@kanwarpal:${pwdStr()}$ `;
  const cmd = document.createElement('span');
  cmd.className = 'cmd-line';
  cmd.textContent = raw + '\n';
  out.appendChild(prefix);
  out.appendChild(cmd);
  const region = out.parentElement;
  if (region) region.scrollTop = region.scrollHeight;
}

function pwdStr() {
  const path = currentPath();
  const node = path[0] || 'home';
  if (node === 'home') return '~';
  return '~/' + path.join('/');
}

// ---------- hierarchy helpers ----------

function getChildren(nodeName) {
  const t = TREE[nodeName];
  return (t && t.children) ? t.children : [];
}

/** Resolve a cd target relative to current path. Returns new path array or null. */
function resolvePath(target) {
  const path = currentPath();
  const node = path[0] || 'home';
  const raw = target.trim().toLowerCase();

  // Absolute shortcuts
  if (raw === '' || raw === '~' || raw === '/') return ['home'];
  if (raw === '..' || raw === '../') {
    if (path.length > 1) return [path[0]]; // child → parent
    if (node !== 'home') return ['home'];   // parent → home
    return null; // already at home
  }
  if (raw === '../..') {
    if (node !== 'home') return ['home'];
    return null;
  }

  // Strip leading ~/
  const stripped = raw.replace(/^~\//, '');
  // Strip leading ./
  const clean = stripped.replace(/^\.\//, '').replace(/\/$/, '');

  // Absolute top-level path
  if (NODES.includes(clean)) return [clean];

  // Multi-segment like projects/hive or work/carta-2024-payments
  const parts = clean.split('/');
  if (parts.length === 2) {
    const [parent, child] = parts;
    if (NODES.includes(parent)) {
      const children = getChildren(parent);
      if (children.includes(child)) return [parent, child];
      return null;
    }
  }

  // Single segment — try as child of current node first, then as top-level
  if (parts.length === 1) {
    const id = parts[0];
    // Child of current context?
    if (path.length === 1 && node !== 'home') {
      const children = getChildren(node);
      if (children.includes(id)) return [node, id];
    }
    if (path.length === 2) {
      // Sibling of current child?
      const siblings = getChildren(path[0]);
      if (siblings.includes(id)) return [path[0], id];
    }
    // Top-level node?
    if (NODES.includes(id)) return [id];
  }

  return null;
}

// ---------- command implementations ----------
const HELP_TEXT =
`commands:
  cd <dir>      enter a directory (try: cd projects or cd projects/hive)
  cd ~, cd /    return to home
  cd ..         go up a level
  ls            list current directory
  pwd           print working directory
  whoami        print current user
  cat bio       show bio
  open resume   open Kanwarpal_Brar_Resume.pdf in a new tab
  help          show this help
  clear         clear the terminal output

keybindings:
  Enter           run command
  ↑ / ↓           cycle history
  Tab             autocomplete
  /               focus this input
  Esc             return to home (cd ~)
  Ctrl+L          clear output`;

function cmdLs() {
  const path = currentPath();
  const node = path[0] || 'home';
  if (path.length === 1) {
    const children = getChildren(node);
    if (node === 'home' || children.length === 0) {
      // Show top-level nodes
      const dirs = NODES.map(n => `drwxr-xr-x  ${n}/`).join('\n');
      line(dirs);
    } else {
      line(children.map(c => `drwxr-xr-x  ${c}/`).join('\n'));
    }
  } else {
    // At child level — no sub-children
    line('(no entries)');
  }
}

function cmdCd(args) {
  if (args.length === 0) { navigate('home'); return; }
  const raw = args.join(' ').trim().toLowerCase();
  const newPath = resolvePath(raw);
  if (newPath === null) {
    if (raw === '..' || raw === '../') {
      line('already at ~', 'cmd-err');
    } else {
      line(`cd: no such directory: ${raw}`, 'cmd-err');
    }
    return;
  }
  navigate(newPath.join('/'));
}

function cmdCat(args) {
  const topic = (args[0] || '').toLowerCase();
  if (!topic) { line('cat: missing operand. try: cat bio', 'cmd-err'); return; }
  if (topic === 'bio' || topic === 'about' || topic === 'readme' || topic === 'readme.md') {
    line(parablurb);
    line('');
    line(aboutBlurb);
    return;
  }
  if (topic === 'resume' || topic === 'resume.pdf') {
    line('cat: resume.pdf: binary file. try: open resume', 'cmd-err');
    return;
  }
  line(`cat: ${topic}: no such file`, 'cmd-err');
}

function cmdOpen(args) {
  const target = (args[0] || '').toLowerCase();
  if (target === 'resume' || target === 'resume.pdf') {
    window.open(resumePath, '_blank', 'noopener');
    line('opening resume in a new tab…');
    return;
  }
  if (NODES.includes(target)) { navigate(target); return; }
  line(`open: unknown target: ${target}`, 'cmd-err');
}

const COMMANDS = {
  cd:     cmdCd,
  ls:     cmdLs,
  help:   () => line(HELP_TEXT),
  clear:  () => { const o = outEl(); if (o) o.textContent = ''; },
  pwd:    () => line(pwdStr()),
  whoami: () => line('kanwarpal'),
  cat:    cmdCat,
  open:   cmdOpen,
};

// ---------- parser ----------
function run(raw) {
  const trimmed = raw.trim();
  if (!trimmed) { echoPrompt(''); return; }
  echoPrompt(trimmed);
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const handler = COMMANDS[cmd];
  if (!handler) {
    line(`${cmd}: command not found`, 'cmd-err');
    return;
  }
  try { handler(args); }
  catch (err) { line('error: ' + (err && err.message || err), 'cmd-err'); }
}

// ---------- history & tab completion ----------
const history = [];
let historyIdx = -1;
let savedInput = '';

function getCompletions() {
  const path = currentPath();
  const node = path[0] || 'home';
  const children = getChildren(node);
  const base = [
    'cd', 'cd ~', 'cd ..', 'ls', 'help', 'clear', 'pwd', 'whoami',
    'cat bio', 'open resume',
    ...NODES.map(n => `cd ${n}`),
  ];
  if (children.length > 0) {
    base.push(...children.map(c => `cd ${c}`));
    base.push(...children.map(c => `cd ${node}/${c}`));
  }
  return base;
}

function complete(input) {
  const lowered = input.toLowerCase();
  const completions = getCompletions();
  const matches = completions.filter(c => c.startsWith(lowered));
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  let prefix = matches[0];
  for (const m of matches) {
    let i = 0;
    while (i < prefix.length && i < m.length && prefix[i] === m[i]) i++;
    prefix = prefix.slice(0, i);
  }
  if (prefix.length > lowered.length) return prefix;
  line(matches.join('  '));
  return null;
}

// ---------- wiring ----------
export function initTerminal() {
  const form = document.getElementById('cmdform');
  const input = document.getElementById('cmd');
  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value;
    if (raw.trim()) {
      history.push(raw);
      if (history.length > 100) history.shift();
    }
    historyIdx = -1;
    savedInput = '';
    run(raw);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      if (history.length === 0) return;
      e.preventDefault();
      if (historyIdx === -1) {
        savedInput = input.value;
        historyIdx = history.length - 1;
      } else if (historyIdx > 0) {
        historyIdx--;
      }
      input.value = history[historyIdx] || '';
      setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
    } else if (e.key === 'ArrowDown') {
      if (historyIdx === -1) return;
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        historyIdx++;
        input.value = history[historyIdx] || '';
      } else {
        historyIdx = -1;
        input.value = savedInput;
        savedInput = '';
      }
      setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completed = complete(input.value);
      if (completed) input.value = completed;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      input.value = '';
      historyIdx = -1;
      savedInput = '';
      navigateUp();
    }
  });

  // Global shortcuts — Ctrl+L, /, Esc (single handler on document)
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input && !e.ctrlKey && !e.metaKey) {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      e.preventDefault();
      input.focus();
    } else if (e.key === 'Escape' && document.activeElement !== input) {
      const path = currentPath();
      if (path.length > 1 || path[0] !== 'home') {
        e.preventDefault();
        navigateUp();
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      const o = outEl(); if (o) o.textContent = '';
    }
  });
}

export function printWelcome() {
  line('kanwarpal@portfolio — welcome.');
  line("type 'help' to see commands, or click a node above.");
  line('');
}

export function updatePromptLabel() {
  const label = document.getElementById('cmd-label');
  if (label) label.textContent = `user@kanwarpal:${pwdStr()}$ `;
}
