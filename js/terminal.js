// terminal.js — shell-style command input. All output via textContent (no innerHTML).

import { navigate, currentNode, NODES } from './graph.js';
import { parablurb, aboutBlurb, resumePath } from './data.js';

// ---------- command output ----------
const outEl = () => document.getElementById('cmdout');

function line(text, cls) {
  const out = outEl();
  if (!out) return;
  const span = document.createElement('span');
  if (cls) span.className = cls;
  span.textContent = (text == null ? '' : String(text)) + '\n';
  out.appendChild(span);
  // keep scrolled to bottom
  const region = out.parentElement;
  if (region) region.scrollTop = region.scrollHeight;
}

function echoPrompt(raw) {
  const out = outEl();
  if (!out) return;
  const prefix = document.createElement('span');
  prefix.className = 'cmd-prompt';
  prefix.textContent = `user@kanwarpal:${pwd()}$ `;
  const cmd = document.createElement('span');
  cmd.className = 'cmd-line';
  cmd.textContent = raw + '\n';
  out.appendChild(prefix);
  out.appendChild(cmd);
  const region = out.parentElement;
  if (region) region.scrollTop = region.scrollHeight;
}

function pwd() {
  const n = currentNode();
  return n === 'home' ? '~' : '~/' + n;
}

// ---------- command implementations ----------
const HELP_TEXT =
`commands:
  cd <dir>      enter a directory (try: cd projects)
  cd ~, cd /    return to home
  cd ..         go up a level
  ls            list directories
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

const LS_TEXT =
`drwxr-xr-x  home/
drwxr-xr-x  work/
drwxr-xr-x  projects/
drwxr-xr-x  resume/
drwxr-xr-x  socials/
drwxr-xr-x  cluster/`;

function cmdCd(args) {
  if (args.length === 0) { navigate('home'); return; }
  const raw = args.join(' ').trim().toLowerCase();
  if (raw === '~' || raw === '/' || raw === '') { navigate('home'); return; }
  if (raw === '..' || raw === '../' || raw === '../../') {
    if (currentNode() === 'home') { line('already at ~', 'cmd-err'); return; }
    navigate('home');
    return;
  }
  // strip leading ./ or / for convenience
  const target = raw.replace(/^\.?\//, '').replace(/\/$/, '');
  if (NODES.includes(target)) { navigate(target); return; }
  line(`cd: no such directory: ${target}`, 'cmd-err');
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
    // URL is hard-coded, never built from user input
    window.open(resumePath, '_blank', 'noopener');
    line('opening resume in a new tab…');
    return;
  }
  if (NODES.includes(target)) { navigate(target); return; }
  line(`open: unknown target: ${target}`, 'cmd-err');
}

const COMMANDS = {
  cd: cmdCd,
  ls: () => line(LS_TEXT),
  help: () => line(HELP_TEXT),
  clear: () => { const o = outEl(); if (o) o.textContent = ''; },
  pwd: () => line(pwd()),
  whoami: () => line('kanwarpal'),
  cat: cmdCat,
  open: cmdOpen,
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
let historyIdx = -1; // -1 = not browsing; 0..n = position from end

const ALL_COMPLETIONS = [
  'cd', 'cd ~', 'cd ..', 'ls', 'help', 'clear', 'pwd', 'whoami',
  'cat bio', 'open resume',
  ...NODES.map(n => `cd ${n}`),
];

function complete(input) {
  const lowered = input.toLowerCase();
  const matches = ALL_COMPLETIONS.filter(c => c.startsWith(lowered));
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  // longest common prefix
  let prefix = matches[0];
  for (const m of matches) {
    let i = 0;
    while (i < prefix.length && i < m.length && prefix[i] === m[i]) i++;
    prefix = prefix.slice(0, i);
  }
  if (prefix.length > lowered.length) return prefix;
  // show options
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
    run(raw);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      if (history.length === 0) return;
      e.preventDefault();
      if (historyIdx === -1) historyIdx = history.length - 1;
      else if (historyIdx > 0) historyIdx--;
      input.value = history[historyIdx] || '';
      // move caret to end
      setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
    } else if (e.key === 'ArrowDown') {
      if (historyIdx === -1) return;
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        historyIdx++;
        input.value = history[historyIdx] || '';
      } else {
        historyIdx = -1;
        input.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completed = complete(input.value);
      if (completed) input.value = completed;
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      const o = outEl(); if (o) o.textContent = '';
    } else if (e.key === 'Escape') {
      e.preventDefault();
      input.value = '';
      historyIdx = -1;
      navigate('home');
    }
  });

  // Global shortcuts: `/` focuses input, Esc collapses from anywhere
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input && !e.ctrlKey && !e.metaKey) {
      // don't hijack if user is typing in another input (there aren't any, but be safe)
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      e.preventDefault();
      input.focus();
    } else if (e.key === 'Escape' && document.activeElement !== input) {
      if (currentNode() !== 'home') {
        e.preventDefault();
        navigate('home');
      }
    }
  });
}

export function printWelcome() {
  line('kanwarpal@portfolio — welcome.');
  line("type 'help' to see commands, or click a node above.");
  line('');
}
