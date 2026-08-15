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

// ---- child index (work + extra-curricular + project + social, keyed by id) --

const CHILD_INDEX = {};
for (const w of workExperience) CHILD_INDEX[w.id] = { kind: "work", data: w };
for (const e of extraCurricular) CHILD_INDEX[e.id] = { kind: "extra", data: e };
for (const p of projects) CHILD_INDEX[p.id] = { kind: "project", data: p };
for (const s of socials) CHILD_INDEX[s.id] = { kind: "social", data: s };

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

// ---- persistent world nodes (home + 5 sections) -----------------------------
//
// Every node on the board shares one shape: an outer positioned <div> holding
// a compact block (a nav <button>, shown normally) and an expanded block (the
// focused content, shown when the node carries .is-focused). Both blocks are
// built once; CSS toggles which is visible, so focusing a node never rebuilds
// DOM. The outer div is NOT a button because expanded content holds block
// elements and real links.

function nodeExpandedHTML(id) {
	if (id === "home") return homeCard();
	if (TREE[id]?.children.length) {
		return (
			`<p class="hub-title">${esc(id)}</p>` +
			`<p class="hub-tagline">${esc(hubTagline[id])}</p>`
		);
	}
	return SECTION_BODY[id] ? SECTION_BODY[id]() : "";
}

/** Static markup for #world: home plus the five sections, in TREE order. */
export function worldNodesHTML() {
	return ["home", ...TREE.home.children]
		.map(
			(id) =>
				`<div class="pnode pnode-${id === "home" ? "home" : "section"}" data-pnode="${esc(id)}">` +
				`<button type="button" class="pn-compact" data-nav="${esc(id)}">` +
				`<span class="sn-name">${esc(id)}</span>` +
				`</button>` +
				`<div class="pn-expanded" role="region" aria-label="${esc(id)}" tabindex="-1">` +
				nodeExpandedHTML(id) +
				`</div>` +
				`</div>`,
		)
		.join("\n");
}

// ---- fan (children of the active section) -----------------------------------

/** Children fanned around the active section, in both section and child
 * views (a focused child keeps its — hidden — siblings mounted). */
export function activeChildren(state) {
	const id =
		state.view === "section" || state.view === "child" ? state.section : null;
	return TREE[id]?.children || [];
}

/** Compact fan-item content: work → company + role + dates; projects → name +
 * tagline + stack; extracurriculars → name + role; socials → label + handle.
 * Long fields are clamped/ellipsed by CSS so they never spill their box. */
function childCompactHTML(id) {
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
	if (c.kind === "social") {
		return (
			`<span class="wi-title">${esc(c.data.label)}</span>` +
			`<span class="wi-desc">${esc(c.data.handle)}</span>`
		);
	}
	return (
		`<span class="wi-title">${esc(c.data.name)}</span>` +
		`<span class="wi-desc">${esc(c.data.role)}</span>`
	);
}

function socialBoxHTML(s) {
	const external = s.url.startsWith("http");
	return `<article class="exp-box social-box">
    <span class="exp-head"><span class="role">${esc(s.label)}</span></span>
    <span class="exp-desc">${esc(s.handle)}</span>
    <a href="${esc(s.url)}"${external ? ' target="_blank" rel="noopener"' : ""}>open ↗</a>
  </article>`;
}

/** Expanded fan-item content (the focused child's full detail). */
function childExpandedHTML(id) {
	const c = CHILD_INDEX[id];
	if (!c) return `<p>${esc(id)}</p>`;
	if (c.kind === "project")
		return `<div class="proj-grid single">${projBoxHTML(c.data, { linked: false })}</div>`;
	if (c.kind === "social") return socialBoxHTML(c.data);
	return expBoxHTML(c.kind, c.data, { linked: false });
}

/** Full markup for one fan node: compact nav button + expanded detail. */
export function childNodeHTML(id) {
	return (
		`<button type="button" class="fn-compact" data-child="${esc(id)}">` +
		childCompactHTML(id) +
		`</button>` +
		`<div class="fn-expanded" role="region" aria-label="${esc(id)} detail" tabindex="-1">` +
		childExpandedHTML(id) +
		`</div>`
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
    <h2>about</h2>
    <p>${esc(aboutBlurb)}</p>
  `;
}

// ---- section bodies (work / projects / resume / socials / cluster) ---------
// These are the FULL section renderings, used by the collapsed/mobile card
// and the no-JS prerender. (On the desktop board, sections with children
// expand to a small hub instead — see nodeExpandedHTML — because their
// children are already on the board as fan nodes.)

function expBoxHTML(kind, d, { linked = true } = {}) {
	const roleText = d.title || d.name || "";
	const coText = kind === "extra" ? d.role || "" : d.company || "";
	const when = d.date || "";
	const desc = d.paragraph || d.desc || "";
	// Buttons may only contain phrasing content (no <header>/<p>/<div>), so
	// both the clickable (card list) and static (child detail) renderings
	// share this all-<span> inner markup.
	const inner = `<span class="exp-head">
      <span class="exp-who"><span class="role">${esc(roleText)}</span> · <span class="co">${esc(coText)}</span></span>
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

function workSectionHTML() {
	return `
    <p class="node-lede">${esc(sectionLede("work"))}</p>
    <h2>work experience</h2>
    ${workExperience.map((w) => expBoxHTML("work", w)).join("\n")}
    <h2>extra-curriculars</h2>
    ${extraCurricular.map((e) => expBoxHTML("extra", e)).join("\n")}
  `;
}

function projectsSectionHTML() {
	return `
    <p class="node-lede">${esc(sectionLede("projects"))}</p>
    <h2>projects</h2>
    <div class="proj-grid">${projects.map((p) => projBoxHTML(p)).join("\n")}</div>
  `;
}

function resumeSectionHTML() {
	const filename = resumePath.split("/").pop();
	return `
    <p class="node-lede">${esc(sectionLede("resume"))}</p>
    <h2>resume</h2>
    <p>${esc(resumeBlurb)}</p>
    <a class="pdf-btn" href="${esc(resumePath)}" target="_blank" rel="noopener">[ open ${esc(filename)} ]</a>
    <p class="tip">${esc(resumeCopy.tip)}</p>
  `;
}

function socialsSectionHTML() {
	return `
    <p class="node-lede">${esc(sectionLede("socials"))}</p>
    <h2>connect</h2>
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
    <h2>${esc(clusterCopy.title.toLowerCase())}</h2>
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

// ---- top-level dispatch ------------------------------------------------------

/** Build the #card innerHTML for a given router state (collapsed/mobile
 * fallback only — the desktop board renders the world nodes instead). */
export function cardHTML(state) {
	if (state.view === "home") return homeCard();
	if (state.view === "section") {
		const body = SECTION_BODY[state.section];
		return body ? body() : "";
	}
	if (state.view === "child") {
		return (
			breadcrumbHTML(state.section, state.child) +
			childExpandedHTML(state.child)
		);
	}
	return "";
}

/** Every top-level view's HTML, for build-time prerendering (SEO / no-JS). */
export function prerenderAll() {
	return {
		home: homeCard(),
		work: workSectionHTML(),
		projects: projectsSectionHTML(),
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
