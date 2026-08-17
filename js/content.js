// content.js — isomorphic markup from the single data source. The builder runs
// in Node (scripts/build.mjs) and in the browser, so it has no DOM references.

import {
	aboutBlurb,
	clusterCopy,
	identity,
	parablurb,
	projects,
	resumeBlurb,
	resumeCopy,
	resumePath,
	sectionSummary,
	socials,
	TREE,
	workExperience,
	extraCurricular,
} from "./data.js";

export function esc(value) {
	return String(value == null ? "" : value).replace(
		/[&<>"']/g,
		(character) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[character],
	);
}

export const CHILD_INDEX = Object.fromEntries([
	...workExperience.map((data) => [data.id, { kind: "work", data }]),
	...extraCurricular.map((data) => [data.id, { kind: "extra", data }]),
	...projects.map((data) => [data.id, { kind: "project", data }]),
	...socials.map((data) => [data.id, { kind: "social", data }]),
]);

const PARENT_INDEX = Object.fromEntries(
	Object.entries(TREE).flatMap(([parent, tree]) =>
		tree.children.map((child) => [child, parent]),
	),
);

function countLabel(count, word) {
	return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function sectionLede(id) {
	switch (id) {
		case "work":
			return `${countLabel(workExperience.length, "role")} · ${sectionSummary.work}`;
		case "projects":
			return `${countLabel(projects.length, "project")} curated · ${sectionSummary.projects}`;
		case "resume":
			return sectionSummary.resume;
		case "socials":
			return sectionSummary.socials;
		case "cluster":
			return sectionSummary.cluster;
		default:
			return "";
	}
}

export function nodeIds() {
	return ["home", ...TREE.home.children, ...Object.keys(CHILD_INDEX)];
}

export function nodeRoute(id) {
	if (id === "home") return "#/home";
	if (TREE[id]) return `#/${id}`;
	return `#/${PARENT_INDEX[id]}/${id}`;
}

function compactHTML(id) {
	if (id === "home") return `<span class="compact-name">home</span>`;
	if (TREE[id]) {
		return `<span class="compact-name">${esc(id)}</span><span class="compact-meta">${esc(sectionLede(id))}</span>`;
	}
	const child = CHILD_INDEX[id];
	if (child.kind === "work") {
		return `<span class="compact-name">${esc(child.data.company)}</span><span class="compact-meta">${esc(child.data.title)}</span>`;
	}
	if (child.kind === "extra") {
		return `<span class="compact-name">${esc(child.data.name)}</span><span class="compact-meta">${esc(child.data.role)}</span>`;
	}
	if (child.kind === "project") {
		return `<span class="compact-name">${esc(child.data.name)}</span><span class="compact-meta">${esc(child.data.tags.slice(0, 3).join(" · "))}</span>`;
	}
	return `<span class="compact-name">${esc(child.data.label)}</span><span class="compact-meta">${esc(child.data.handle)}</span>`;
}

function homePanelHTML() {
	return `<div class="bio-grid">
  <img class="headshot" src="assets/headshot.webp" alt="${esc(identity.name)}" width="120" height="120" fetchpriority="high" decoding="async">
  <div><p class="tagline">${esc(identity.tagline)}</p><p>${esc(parablurb)}</p></div>
</div>
<a class="pdf-btn" href="${esc(resumePath)}" target="_blank" rel="noopener">[ view resume ]</a>
<h2>about</h2><p>${esc(aboutBlurb)}</p>`;
}

function sectionPanelHTML(id) {
	if (id === "resume") {
		const filename = resumePath.split("/").pop();
		return `<p class="node-lede">${esc(sectionLede(id))}</p><h2 class="node-title">resume</h2><p>${esc(resumeBlurb)}</p><a class="pdf-btn" href="${esc(resumePath)}" target="_blank" rel="noopener">[ open ${esc(filename)} ]</a><p class="tip">${esc(resumeCopy.tip)}</p>`;
	}
	if (id === "cluster") {
		return `<p class="node-lede">${esc(sectionLede(id))}</p><h2 class="node-title">${esc(clusterCopy.title.toLowerCase())}</h2><p class="warning">[!] Access to this infrastructure is strictly controlled.</p><p>${esc(clusterCopy.intro)} Endpoint: <strong><span class="redacted" aria-hidden="true">${esc(clusterCopy.redactedUrl)}</span></strong>.</p><p>To request access, email <a href="mailto:${esc(clusterCopy.contactEmail)}">${esc(clusterCopy.contactEmail)}</a> with:</p><ul>${clusterCopy.requirements.map((requirement) => `<li>${esc(requirement)}</li>`).join("")}</ul>`;
	}
	const count = TREE[id].children.length;
	const label = id === "socials" ? "connection" : "node";
	return `<p class="node-lede">${esc(sectionLede(id))}</p><h2 class="node-title">${esc(id)}</h2><p>${countLabel(count, label)} on this branch. Select one to explore it.</p>`;
}

function childPanelHTML(id) {
	const child = CHILD_INDEX[id];
	if (child.kind === "project") {
		return `<h2 class="node-title">${esc(child.data.name)}</h2><p>${esc(child.data.desc)}</p><p class="tags">${child.data.tags.map((tag) => `[${esc(tag)}]`).join(" ")}</p><a href="${esc(child.data.url)}" target="_blank" rel="noopener">→ ${esc(child.data.url.replace("https://", ""))}</a>`;
	}
	if (child.kind === "social") {
		const external = child.data.url.startsWith("http");
		return `<h2 class="node-title">${esc(child.data.label)}</h2><p>${esc(child.data.handle)}</p><a href="${esc(child.data.url)}"${external ? ' target="_blank" rel="noopener"' : ""}>open ↗</a>`;
	}
	const title = child.data.title || child.data.name;
	const subtitle = child.kind === "work" ? child.data.company : child.data.role;
	const date = child.data.date
		? `<p class="when">${esc(child.data.date)}</p>`
		: "";
	return `<h2 class="node-title">${esc(title)}</h2><p class="node-lede">${esc(subtitle)}</p>${date}<p>${esc(child.data.paragraph || child.data.desc)}</p>`;
}

function panelHTML(id) {
	if (id === "home") return homePanelHTML();
	if (TREE[id]) return sectionPanelHTML(id);
	return childPanelHTML(id);
}

/**
 * The one and only portfolio DOM. The compact navigation link is intentionally
 * a sibling of the expanded panel: panels contain real outbound links, and
 * nesting those links inside a node link would be invalid HTML.
 */
export function nodesHTML() {
	return nodeIds()
		.map(
			(id) => `<article class="node" data-node="${esc(id)}">
  <a class="node-link compact" href="${esc(nodeRoute(id))}">${compactHTML(id)}</a>
  <section class="panel" aria-label="${esc(id)} detail" tabindex="-1">${panelHTML(id)}</section>
</article>`,
		)
		.join("\n");
}

export function pageTitle(state) {
	if (state.view === "home") return `${identity.name} — ${identity.tagline}`;
	if (state.view === "child")
		return `${state.child} — ${state.section} — ${identity.name}`;
	const titles = {
		work: `work — ${identity.name}`,
		projects: `projects — ${identity.name}`,
		socials: `connect — ${identity.name}`,
		resume: `resume — ${identity.name}`,
		cluster: `cluster — ${identity.name}`,
	};
	return titles[state.section] || identity.name;
}
