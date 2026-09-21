# Portfolio Architecture

This document explains how the portfolio is structured, why the main technical
choices were made, and how to extend the site without reintroducing duplicated
markup or project-specific presentation code.

## 1. Scope and constraints

The portfolio is a bilingual static site hosted on GitHub Pages. It has no
application server, database, authentication, or runtime content API.

The architecture therefore optimizes for:

- simple and deterministic static generation;
- reusable presentation components;
- separate French and English URLs;
- native browser features and a small JavaScript footprint;
- accessible, keyboard-operable interactions;
- media-heavy case studies without a frontend framework;
- deployment as an immutable generated artifact.

Nunjucks is used as a build-time templating layer. It avoids duplicating the two
localized pages while keeping the delivered site as plain HTML, CSS, JavaScript,
images, documents, and videos.

## 2. Source of truth

Only source files are edited:

```text
src/
├── components/   Reusable Nunjucks presentation components
├── content/      Localized long-form Nunjucks content
├── data/         Localized structured JSON data
├── layouts/      Shared HTML document layout
├── pages/        Shared page composition
├── scripts/      Native browser JavaScript modules
└── styles/       Ordered CSS foundations and components
```

The `images/` directory contains deployable static assets. Despite its historical
name, it also contains documents and videos.

`dist/` is generated output. It is deleted and rebuilt by the build script and
must never be edited or treated as source code.

## 3. Page generation and localization

Both languages render the same page template:

- `src/pages/portfolio.njk` + `src/data/fr.json` -> `dist/index.html`;
- `src/pages/portfolio.njk` + `src/data/en.json` -> `dist/uk-version.html`.

The mapping is declared in `scripts/site-config.mjs`. The build verifies that the
language in each data file matches the expected HTML `lang` attribute.

Localized content follows two rules:

1. Short, repeated, or strongly structured values belong in locale JSON.
2. Long editorial sections with meaningful markup belong in `src/content/<lang>/`.

The French and English files intentionally have parallel structures. Shared HTML
belongs in a component instead of being copied into both locale directories.

## 4. Component model

Components are server-rendered Nunjucks templates. Their names describe a visual
or content responsibility rather than one specific project whenever the pattern
is reusable.

Examples include:

- `structured-content.njk` for shared editorial blocks and disclosures;
- `technology-groups.njk` for categorized technology lists;
- `context-panels.njk` for paired audience or product contexts;
- `info-tags.njk` for compact metadata markers;
- `result-summary.njk` for evidence and result summaries;
- `project-case-study.njk` for the common selected-project case-study shell.

Project-specific components such as `drime-experience.njk` remain composition
boundaries: they assemble generic components with DRIME data, but the reusable
visual behavior is not implemented through DRIME-specific CSS classes.

This split keeps the code practical. A generic component is introduced when
several experiences share a real presentation contract, not merely because two
pieces of markup happen to look similar once.

## 5. Dialog and carousel architecture

Case studies and professional experiences use the same dialog foundations.

`src/scripts/dialog-carousel.js` creates the shared dialog shell:

- branded header and close control;
- accessible tab list and tab panels;
- previous/next controls and progress;
- focus restoration to the element that opened the dialog;
- page-scroll locking while the modal is open;
- lifecycle hooks for project-specific media cleanup.

`src/scripts/dialog-navigation.js` owns panel selection, boundaries, ARIA state,
and keyboard navigation. `src/scripts/dialog.js` owns the animated close lifecycle.

Feature modules provide data and lifecycle behavior:

- `experience-dialog.js` initializes professional-experience dialogs;
- `project-case-study.js` initializes selected-project dialogs;
- `demo-gallery.js` manages the shared DRIME demonstration player;
- `project-archive.js` manages the previous-project archive;
- `technical-carousel.js` manages the technical-focus carousel.

Dialogs are generated once, then opened by one or more triggers. Media is paused
and reset when its owning dialog or section closes. Native video controls remain
the fallback for playback, seeking, volume, captions, and fullscreen behavior.

## 6. Browser initialization

`src/scripts/main.js` is the single browser entry point. On `DOMContentLoaded`, it
initializes each independent feature against semantic classes or `data-*`
attributes already present in the generated HTML.

Modules do not rely on a global application object. Each feature owns its event
listeners and DOM state. This keeps failures local and allows sections without a
matching element to remain inert.

Native APIs are preferred:

- `<dialog>` for modal semantics;
- ES modules for code organization;
- native `<video controls>` for media interaction;
- `matchMedia` for motion and responsive behavior;
- ARIA attributes for dynamic state announcements.

## 7. CSS organization

CSS is split into ordered source files and concatenated into one production
stylesheet. The exact order is explicit in `scripts/site-config.mjs`.

The layers are:

1. `tokens.css` for shared colors and design values;
2. `base.css` for element defaults;
3. `utilities.css` and `layout.css` for cross-page primitives;
4. `styles/components/*.css` for component contracts and responsive states.

The single generated stylesheet avoids a network request per component while
preserving maintainable source files. Component selectors should remain scoped to
their component. New project names should not be added to generic component CSS.

The resume styles retain more historical positioning and breakpoint rules than
the rest of the site. They work, but are the main CSS area to simplify in a later
refactor.

## 8. Build pipeline

`yarn build` runs `scripts/build.mjs` and performs these steps:

1. load and concatenate CSS in the configured order;
2. discover browser modules and static assets;
3. compute one SHA-256 content version from all local assets;
4. render both localized Nunjucks pages;
5. append the generated version to local HTML asset references;
6. append the same version to JavaScript module imports;
7. replace `dist/` and copy the generated files and static assets.

The cache version is content-derived and is not maintained by hand. A changed
image, video, document, stylesheet, or script changes the URL seen by browsers and
GitHub Pages caches. Unchanged builds produce the same version.

Using one site-wide version is deliberately simple for this portfolio. It trades
some cache granularity for deterministic behavior and a very small build system.

## 9. Validation and tests

The commands have distinct responsibilities:

- `yarn build` generates `dist/`;
- `yarn validate` builds, then runs static source/output validation;
- `yarn test` runs interaction regression tests, then `yarn validate`;
- `yarn preview` serves `dist/` locally with HTTP byte-range support for videos.

`scripts/check.mjs` checks generated pages and source conventions, including local
asset references, identifiers, required localized structures, and the absence of
manual cache versions in locale data.

The Node.js tests simulate the browser APIs needed by the interaction modules.
They cover dialog navigation and closing, focus behavior, carousel boundaries,
swipes, resume state changes, media lifecycle, and accessibility state updates.

They do not validate pixel layout, real browser media decoding, native controls,
or all touch behavior. Responsive browser checks remain necessary after visual or
interaction changes.

## 10. Deployment

The expected delivery flow is:

```text
feature branch -> review/merge -> gh-pages -> test/build -> Pages artifact -> deploy
```

`.github/workflows/validate.yml` runs `yarn test` on feature-branch pushes and pull
requests. It does not deploy.

`.github/workflows/deploy-pages.yml` runs after changes reach `gh-pages`. It:

1. installs the locked dependencies with the Node version from `.nvmrc`;
2. runs the complete test and validation command;
3. uploads only `dist/` as the Pages artifact;
4. deploys that artifact through GitHub Pages.

The repository's Pages source must be configured as **GitHub Actions**. Publishing
only `dist/` prevents source files, reference demos, and development metadata from
becoming part of the public site.

Dependabot checks npm and GitHub Actions dependencies monthly.

## 11. Security model

The public site is static, so it has no server-side secrets, user sessions, or
database attack surface. Security work focuses on the delivered browser surface:

- no credentials or private configuration belong in the repository;
- production links use HTTPS;
- external links should use `rel="noopener noreferrer"` where applicable;
- only the generated `dist/` artifact is deployed;
- dependencies remain locked and are checked by Dependabot;
- generated HTML is autoescaped by Nunjucks by default.

External fonts and icon libraries remain supply-chain and privacy dependencies.
Self-hosting them and adding a tested Content Security Policy would be optional
hardening, not a requirement for the current static portfolio.

## 12. Common changes

### Update copy

Change the matching French and English values together. Use locale JSON for short
structured copy and localized Nunjucks files for long editorial markup. Run
`yarn test` afterward.

### Add an asset

Place the optimized asset under `images/`, reference it without a manual query
string, and rebuild. The build generates its cache version automatically.

### Add a case-study section

First check whether an existing generic component represents the content. Supply
localized data to that component. Add a new component only when the content has a
distinct reusable structure or behavior.

### Add browser behavior

Keep DOM creation separate from lifecycle initialization when practical, expose a
small initializer, and call it from `main.js`. Add regression coverage for state
transitions and cleanup, especially for dialogs and media.

### Change deployment behavior

Keep `dist/` as the only deployment artifact. Validate the workflow on a feature
branch before merging it into `gh-pages`.

## 13. Known tradeoffs and future improvements

The current architecture is appropriate for the size and hosting model of the
site. The main remaining improvements are incremental:

- simplify the older resume CSS and reduce fixed positioning rules;
- add Playwright smoke tests at key responsive widths;
- optimize the remaining large media files;
- split the locale JSON files by domain if they become harder to review;
- self-host fonts/icons and add a CSP if stronger external-dependency isolation is
  desired;
- pin GitHub Actions to immutable commit SHAs for stricter supply-chain hardening.

These are maintenance improvements, not blockers for deployment.
