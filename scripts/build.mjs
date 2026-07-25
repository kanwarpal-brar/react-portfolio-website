#!/usr/bin/env node
// scripts/build.mjs — zero-dependency static build.
//
// Renders index.html from index.template.html by injecting content
// produced by js/content.js (the SAME renderer the browser uses at
// runtime), so the prerendered/no-JS HTML and the live DOM can never drift.
//
// Usage:
//   node scripts/build.mjs          # write index.html
//   node scripts/build.mjs --check  # write to a temp buffer and diff
//                                    # against the committed index.html;
//                                    # exits 1 on any difference (CI parity
//                                    # check — see .github/workflows/deploy.yml)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { identity, seo, socials, TREE } from '../js/data.js';
import { ringNodesHTML, homeCard, prerenderAll, pageTitle } from '../js/content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'index.template.html');
const OUTPUT_PATH = path.join(ROOT, 'index.html');

function jsonLd() {
  const sameAs = socials.filter((s) => s.url.startsWith('http')).map((s) => s.url);
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: identity.name,
      url: seo.siteUrl,
      image: seo.ogImage,
      jobTitle: 'Software Engineer',
      alumniOf: { '@type': 'CollegeOrUniversity', name: seo.alumniOf },
      sameAs,
      email: identity.email,
    },
    null,
    2
  );
}

function prerenderHTML() {
  const sections = prerenderAll();
  return TREE.home.children
    .map(
      (id) =>
        `      <article class="prerender-section" data-prerender data-section="${id}">\n` +
        `        <h2>── ${id} ──</h2>\n` +
        `        ${sections[id]}\n` +
        `      </article>`
    )
    .join('\n');
}

export function renderSite() {
  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  const tokens = {
    title: pageTitle({ view: 'home' }),
    description: seo.description,
    siteUrl: seo.siteUrl,
    ogImage: seo.ogImage,
    locale: seo.locale,
    name: identity.name,
    jsonld: jsonLd(),
    prerender: prerenderHTML(),
  };

  let html = template;
  for (const [key, value] of Object.entries(tokens)) {
    html = html.split(`{{${key}}}`).join(value);
  }
  html = html.replace('<!-- inject:ring -->', ringNodesHTML());
  html = html.replace('<!-- inject:home -->', homeCard());
  return html;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const html = renderSite();

  if (!checkOnly) {
    writeFileSync(OUTPUT_PATH, html, 'utf8');
    console.log(`built ${path.relative(ROOT, OUTPUT_PATH)} (${html.length} bytes)`);
    return;
  }

  let existing = '';
  try {
    existing = readFileSync(OUTPUT_PATH, 'utf8');
  } catch (_) {
    console.error(`✖ ${path.relative(ROOT, OUTPUT_PATH)} does not exist — run \`node scripts/build.mjs\` and commit it.`);
    process.exit(1);
  }

  if (existing !== html) {
    console.error(
      `✖ index.html is stale relative to js/data.js / js/content.js / index.template.html.\n` +
        `  Run \`node scripts/build.mjs\` and commit the result.`
    );
    process.exit(1);
  }
  console.log('✔ index.html matches the build output.');
}

main();
