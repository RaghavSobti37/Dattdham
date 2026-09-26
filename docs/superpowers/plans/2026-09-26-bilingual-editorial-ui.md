# Bilingual Editorial UI Implementation Plan

**Goal:** Replace literal browser translation with authored English/Hindi content and a calm, responsive Dattadham interface.

**Architecture:** Static HTML contains intentional translations as `data-en` and `data-hi` values. A small native JavaScript controller applies the selected language, persists it locally, and preserves the existing lead form endpoint.

**Tech Stack:** Semantic HTML, CSS, vanilla JavaScript, Vercel serverless lead endpoint.

## Global Constraints

- English is the default; Hindi is selected by an accessible persistent control.
- Keep the supplied Dattadham logo and Darshan image.
- Use authored translations; do not invoke browser or Google page translation.
- Preserve `/api/leads` form submission behavior.

### Task 1: Authored bilingual content and interface

**Files:**
- Modify: `index.html`
- Modify: `site.js`
- Test: `tests/bilingual-content.test.mjs`

- [ ] Write a static test that asserts every translated node has both English and Hindi values and that the language control is present.
- [ ] Verify it fails against the existing static page.
- [ ] Add semantic translated nodes, language control, metadata updates, and native language switching.
- [ ] Run the test and verify it passes.

### Task 2: Editorial visual system

**Files:**
- Modify: `site.css`

- [ ] Keep primary imagery and brand mark.
- [ ] Add a responsive editorial grid, Indian-inspired arch/flow ornament, typography hierarchy, accessible focus treatments, and reduced-motion handling.
- [ ] Verify static CSS invariants and page JavaScript syntax.

### Task 3: Integration verification

**Files:**
- Verify: `index.html`, `site.css`, `site.js`, `api/leads.js`

- [ ] Run static bilingual assertions, JavaScript syntax checks, and a local HTTP smoke test.
- [ ] Commit and push after checks pass.
