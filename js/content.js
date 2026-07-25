// content.js — isomorphic content builders. Runs in Node (build.mjs) AND in
// the browser (render.js): no `document`/`window` references here, only
// string templating from data.js. This is what keeps the prerendered
// index.html and the live DOM byte-identical in content.

import {
	identity,
	parablurb,
	aboutBlurb,
	resumeBlurb,
	resumePath,
	resumeCopy,
	socials,
	workExperience,
	extraCurricular,
	projects,
	clusterCopy,
	sectionSummary,
	hubTagline,
	TREE,
} from "./data.js";

/** Escape a value for safe interpolation into an HTML string. */
export function esc(value) {
	return String(value == null ? "" : value).replace(
		/[&<>"']/g,
		(c) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[c],
	);
}

// ---- child index (work + extra-curricular + project, keyed by id) --------

const CHILD_INDEX = {};
for (const w of workExperience) CHILD_INDEX[w.id] = { kind: "work", data: w };
for (const e of extraCurricular) CHILD_INDEX[e.id] = { kind: "extra", data: e };
for (const p of projects) CHILD_INDEX[p.id] = { kind: "project", data: p };

export function childInfo(id) {
	return CHILD_INDEX[id] || null;
}

// ---- ring (5 persistent section nodes) ------------------------------------

/** The five section ids, in TREE order (home's children). */
export function ringSections() {
	return TREE.home.children.slice();
}

export function ringNodesHTML() {
	return ringSections()
		.map(
			(id, i) =>
				`<button type="button" class="snode" data-section="${esc(id)}">` +
				`<span class="sn-idx">${String(i + 1).padStart(2, "0")}</span>` +
				`<span class="sn-name">${esc(id)}</span>` +
				`</button>`,
		)
		.join("");
}

// ---- ledes / summaries -----------------------------------------------------

function countLabel(n, word) {
	return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** One-line summary shown on the section card lede and the home tile. */
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

// ---- wheel (radial child menu) ---------------------------------------------

// Every work/project child fits in the wheel (10 work, 9 projects), so no node
// is stranded off the desktop board. squareWheelPositions spaces them evenly.
export const WHEEL_CAP = 10;

/**
 * Children to show in the radial wheel. Only the section (hub) view shows the
 * wheel; a child (detail) view hides it and gives the detail card the full
 * board so the description is readable without scrolling.
 */
export function wheelChildren(state) {
	if (state.view === "section") {
		const t = TREE[state.section];
		if (!t || !t.children || t.children.length === 0) return [];
		return t.children.slice(0, WHEEL_CAP);
	}
	return [];
}

/**
 * Inner HTML for a wheel item. Enlarged boxes (see .wheel-item in style.css)
 * carry real content: work → company + role + dates; projects → name + tagline
 * + tech stack; extracurriculars → name + role. Long fields are clamped/ellipsed
 * by CSS so they never spill their box.
 */
export function wheelItemHTML(id) {
	const c = CHILD_INDEX[id];
	if (!c) return `<span class="wi-title">${esc(id)}</span>`;
	if (c.kind === "project") {
		const tags = c.data.tags
			.slice(0, 3)
			.map((t) => esc(t))
			.join(" · ");
		return (
			`<span class="wi-title">${esc(c.data.name)}</span>` +
			`<span class="wi-desc">${esc(c.data.desc)}</span>` +
			(tags ? `<span class="wi-tags">${tags}</span>` : "")
		);
	}
	if (c.kind === "work") {
		return (
			`<span class="wi-title">${esc(c.data.company)}</span>` +
			`<span class="wi-desc">${esc(c.data.title)}</span>` +
			(c.data.date ? `<span class="wi-meta">${esc(c.data.date)}</span>` : "")
		);
	}
	return (
		`<span class="wi-title">${esc(c.data.name)}</span>` +
		`<span class="wi-desc">${esc(c.data.role)}</span>`
	);
}

// ---- home card --------------------------------------------------------------

export function homeCard() {
	return `
    <div class="bio-grid">
      <img class="headshot" src="assets/headshot.webp" alt="${esc(identity.name)}" width="120" height="120" fetchpriority="high" decoding="async">
      <div>
        <p class="tagline">${esc(identity.tagline)}</p>
        <p>${esc(parablurb)}</p>
      </div>
    </div>
    <a class="pdf-btn" href="${esc(resumePath)}" target="_blank" rel="noopener">[ view resume ]</a>
    <h3>about</h3>
    <p>${esc(aboutBlurb)}</p>
  `;
}

// ---- section bodies (work / projects / resume / socials / cluster) --------

function expBoxHTML(kind, d, { linked = true } = {}) {
	const roleText = d.title || d.name || "";
	const coText = kind === "extra" ? d.role || "" : d.company || "";
	const when = d.date || "";
	const desc = d.paragraph || d.desc || "";
	// Buttons may only contain phrasing content (no <header>/<p>/<div>), so
	// both the clickable (card list) and static (child detail) renderings
	// share this all-<span> inner markup.
	const inner = `<span class="exp-head">
      <span class="role">${esc(roleText)}</span> · <span class="co">${esc(coText)}</span>
      ${when ? `<span class="when">${esc(when)}</span>` : ""}
    </span>
    <span class="exp-desc">${esc(desc)}</span>`;
	if (linked) {
		return `<button type="button" class="exp-box" data-child="${esc(d.id)}">${inner}</button>`;
	}
	return `<article class="exp-box">${inner}</article>`;
}

function projBoxHTML(d, { linked = true } = {}) {
	return `<article class="proj">
    ${
			linked
				? `<button type="button" class="pname pname-btn" data-child="${esc(d.id)}">${esc(d.name)}</button>`
				: `<div class="pname">${esc(d.name)}</div>`
		}
    <div class="pdesc">${esc(d.desc)}</div>
    <div class="ptags">${d.tags.map((t) => "[" + esc(t) + "]").join(" ")}</div>
    <a href="${esc(d.url)}" target="_blank" rel="noopener">→ ${esc(d.url.replace("https://", ""))}</a>
  </article>`;
}

// Shared between the interactive hub (.sec-list) and the prerendered
// *FullHTML variants — both list every work/extra entry or project, just
// wrapped differently, so the entry markup itself is built once here.
function workListHTML() {
	return `${workExperience.map((w) => expBoxHTML("work", w)).join("\n")}
    <h3>extra-curriculars</h3>
    ${extraCurricular.map((e) => expBoxHTML("extra", e)).join("\n")}`;
}

function projectsListHTML() {
	return projects.map((p) => projBoxHTML(p)).join("\n");
}

function workSectionHTML() {
	// .hub-mini is the small title+tagline shown on the desktop board (the
	// wheel supplies the child nodes, so the hub node itself stays minimal).
	// .sec-full is the fuller heading+count CSS shows instead once collapsed,
	// above the same child list .sec-list reveals for mobile tapping — both
	// paths render the same entries, just gated by #graph.collapsed in CSS.
	return `
    <div class="hub-mini">
      <p class="hub-title">work</p>
      <p class="hub-tagline">${esc(hubTagline.work)}</p>
    </div>
    <div class="sec-full">
      <h3>work experience</h3>
      <p class="node-lede">${esc(workExperience.length)} roles · ${esc(extraCurricular.length)} extracurriculars</p>
    </div>
    <div class="sec-list">
      ${workListHTML()}
    </div>
  `;
}

function workSectionFullHTML() {
	return `
    <p class="node-lede">${esc(sectionLede("work"))}</p>
    <h3>work experience</h3>
    ${workListHTML()}
  `;
}

function projectsSectionHTML() {
	// See workSectionHTML(): .hub-mini/.sec-full are the desktop/collapsed
	// heading swap, .sec-list is the collapsed/mobile tap target list.
	return `
    <div class="hub-mini">
      <p class="hub-title">projects</p>
      <p class="hub-tagline">${esc(hubTagline.projects)}</p>
    </div>
    <div class="sec-full">
      <h3>projects</h3>
      <p class="node-lede">${esc(projects.length)} builds · systems, concurrency, devops</p>
    </div>
    <div class="sec-list proj-grid">${projectsListHTML()}</div>
  `;
}

function projectsSectionFullHTML() {
	return `
    <p class="node-lede">${esc(sectionLede("projects"))}</p>
    <h3>projects</h3>
    <div class="proj-grid">${projectsListHTML()}</div>
  `;
}

function resumeSectionHTML() {
	const filename = resumePath.split("/").pop();
	return `
    <p class="node-lede">${esc(sectionLede("resume"))}</p>
    <h3>resume</h3>
    <p>${esc(resumeBlurb)}</p>
    <a class="pdf-btn" href="${esc(resumePath)}" target="_blank" rel="noopener">[ open ${esc(filename)} ]</a>
    <p class="tip">${esc(resumeCopy.tip)}</p>
  `;
}

function socialsSectionHTML() {
	return `
    <p class="node-lede">${esc(sectionLede("socials"))}</p>
    <h3>connect</h3>
    <ul class="social-list">
      ${socials
				.map(
					(s) =>
						`<li><span class="k">${esc(s.label)}</span><a href="${esc(s.url)}"${
							s.url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""
						}>${esc(s.handle)}</a></li>`,
				)
				.join("\n")}
    </ul>
  `;
}

function clusterSectionHTML() {
	return `
    <p class="node-lede">${esc(sectionLede("cluster"))}</p>
    <h3>${esc(clusterCopy.title.toLowerCase())}</h3>
    <p class="warning">[!] Access to this infrastructure is strictly controlled.</p>
    <p>${esc(clusterCopy.intro)} Endpoint: <strong><span class="redacted" aria-hidden="true">${esc(clusterCopy.redactedUrl)}</span></strong>.</p>
    <p>To request access, email <a href="mailto:${esc(clusterCopy.contactEmail)}">${esc(clusterCopy.contactEmail)}</a> with:</p>
    <ul>${clusterCopy.requirements.map((r) => `<li>${esc(r)}</li>`).join("\n")}</ul>
  `;
}

const SECTION_BODY = {
	work: workSectionHTML,
	projects: projectsSectionHTML,
	resume: resumeSectionHTML,
	socials: socialsSectionHTML,
	cluster: clusterSectionHTML,
};

// ---- child (detail) view -----------------------------------------------------

function breadcrumbHTML(section, child) {
	return `<div class="breadcrumb">
    <button type="button" class="bc-parent" data-nav="${esc(section)}">← ${esc(section)}</button>
    <span class="bc-sep"> / </span>
    <span class="bc-child">${esc(child)}</span>
  </div>`;
}

function childDetailHTML(childId) {
	const c = CHILD_INDEX[childId];
	if (!c) return "<p>Not found.</p>";
	if (c.kind === "project")
		return `<div class="proj-grid single">${projBoxHTML(c.data, { linked: false })}</div>`;
	return expBoxHTML(c.kind, c.data, { linked: false });
}

// ---- top-level dispatch ------------------------------------------------------

/** Build the #card innerHTML for a given router state. */
export function cardHTML(state) {
	if (state.view === "home") return homeCard();
	if (state.view === "section") {
		const body = SECTION_BODY[state.section];
		return body ? body() : "";
	}
	if (state.view === "child") {
		return (
			breadcrumbHTML(state.section, state.child) + childDetailHTML(state.child)
		);
	}
	return "";
}

/** Every top-level view's HTML, for build-time prerendering (SEO / no-JS). */
export function prerenderAll() {
	return {
		home: homeCard(),
		work: workSectionFullHTML(),
		projects: projectsSectionFullHTML(),
		resume: resumeSectionHTML(),
		socials: socialsSectionHTML(),
		cluster: clusterSectionHTML(),
	};
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
	return titles[state.section] || `${identity.name}`;
}

export function cardAriaLabel(state) {
	if (state.view === "home") return "home";
	if (state.view === "child") return `${state.child} detail`;
	return `${state.section} section`;
}
