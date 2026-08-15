#!/usr/bin/env node
// scripts/build.mjs — zero-dependency static build. The one nodesHTML() call
// supplies both browser DOM and the no-JS/SEO document, so they cannot drift.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { identity, seo, socials } from "../js/data.js";
import { esc, nodesHTML, pageTitle } from "../js/content.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMPLATE_PATH = path.join(ROOT, "index.template.html");
const OUTPUT_PATH = path.join(ROOT, "index.html");

function jsonLd() {
	return JSON.stringify(
		{
			"@context": "https://schema.org",
			"@type": "Person",
			name: identity.name,
			url: seo.siteUrl,
			image: seo.ogImage,
			jobTitle: "Software Engineer",
			alumniOf: { "@type": "CollegeOrUniversity", name: seo.alumniOf },
			sameAs: socials
				.filter((social) => social.url.startsWith("http"))
				.map((social) => social.url),
			email: identity.email,
		},
		null,
		2,
	).replace(/</g, "\\u003c");
}

export function renderSite() {
	let html = readFileSync(TEMPLATE_PATH, "utf8");
	const tokens = {
		title: esc(pageTitle({ view: "home" })),
		description: esc(seo.description),
		siteUrl: esc(seo.siteUrl),
		ogImage: esc(seo.ogImage),
		locale: esc(seo.locale),
		name: esc(identity.name),
		jsonld: jsonLd(),
	};
	for (const [key, value] of Object.entries(tokens)) {
		html = html.split(`{{${key}}}`).join(value);
	}
	return html.replace("<!-- inject:nodes -->", nodesHTML());
}

function main() {
	const checkOnly = process.argv.includes("--check");
	const html = renderSite();
	if (!checkOnly) {
		writeFileSync(OUTPUT_PATH, html, "utf8");
		console.log(
			`built ${path.relative(ROOT, OUTPUT_PATH)} (${html.length} bytes)`,
		);
		return;
	}

	let existing = "";
	try {
		existing = readFileSync(OUTPUT_PATH, "utf8");
	} catch {
		console.error(
			`✖ ${path.relative(ROOT, OUTPUT_PATH)} does not exist — run \`node scripts/build.mjs\` and commit it.`,
		);
		process.exit(1);
	}
	if (existing !== html) {
		console.error(
			"✖ index.html is stale relative to js/data.js / js/content.js / index.template.html.\n  Run `node scripts/build.mjs` and commit it.",
		);
		process.exit(1);
	}
	console.log("✔ index.html matches the build output.");
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	main();
}
