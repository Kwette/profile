# Emilie Murat Portfolio

Bilingual portfolio presenting selected product work, professional experience,
technical focus areas, and personal projects.

The site is intentionally built without a frontend framework. Nunjucks generates
the French and English pages from shared components and localized content, while
the browser interactions use native JavaScript modules.

## Tech stack

- HTML generated with [Nunjucks](https://mozilla.github.io/nunjucks/)
- Component-oriented CSS concatenated into a single stylesheet
- Native JavaScript modules
- Font Awesome icons
- Node.js build script

## Project structure

```text
.
├── examples/               Standalone reference demos, excluded from the build
├── images/                 Static images, documents, and favicon
├── tests/                  Node.js regression tests with simulated browser APIs
├── scripts/
│   ├── build.mjs           Static-site build pipeline
│   ├── check.mjs           Static validation of sources and generated pages
│   └── site-config.mjs     Localized outputs, CSS order, and static assets
├── src/
│   ├── components/         Shared Nunjucks components
│   ├── content/            Localized long-form content
│   │   ├── en/
│   │   └── fr/
│   ├── data/               Localized structured page data
│   ├── layouts/            Shared document layout
│   ├── pages/              Shared portfolio.njk page template
│   ├── scripts/            Browser-side JavaScript modules
│   └── styles/             CSS foundations and components
└── dist/                   Generated site, ignored by Git
```

Source files in `src/` are the source of truth. Files in `dist/` are recreated on
every build and must not be edited directly.

## Local development

The required Node.js version is declared in `.nvmrc`.

```bash
nvm use
yarn install
yarn validate
python3 -m http.server 8002 --directory dist
```

Then open [http://127.0.0.1:8002/](http://127.0.0.1:8002/).

After changing source files, run `yarn build` again and refresh the browser.
There is no watch mode or automatic rebuild. The build runs locally or in CI,
not when a visitor loads the page.

The build command:

1. renders both localized Nunjucks pages;
2. concatenates the ordered CSS sources into `dist/style.css`;
3. copies the native JavaScript modules and static assets into `dist/`.

`yarn validate` rebuilds the site and validates the generated pages, local asset
references, HTML identifiers, JavaScript imports, and source-level conventions.

`yarn test` runs the lightweight Node.js regression tests in `tests/`, then
`yarn validate`. The regression tests simulate browser APIs; they do not replace
browser-based layout and interaction checks. Use `yarn validate`, not
`yarn check`, which is a separate built-in Yarn command.

Regression tests cover scroll reveal boundaries and fallbacks, dialog focus
wrapping and closing, carousel navigation and swipe handling, and resume control
state during animation and viewport changes. These tests verify logic, not
rendered layout, native browser focus behavior, or real touch gestures.

## Architecture

- Shared structure belongs in `src/components/` and `src/layouts/`.
- Short localized values belong in `src/data/fr.json` and `src/data/en.json`.
- Long localized sections belong in `src/content/fr/` and `src/content/en/`.
- Browser features are isolated by responsibility in `src/scripts/`.
- Reusable visual contracts live in `src/styles/components/`.

The generated pages retain separate URLs so each language remains directly
linkable and can declare the correct document language.

Both pages use `src/pages/portfolio.njk`: French is generated as `index.html`
and English as `uk-version.html`. Output names and CSS concatenation order are
declared in `scripts/site-config.mjs`.

## Continuous integration and deployment

`.github/workflows/validate.yml` installs dependencies using the frozen lockfile
and runs `yarn test` on pushes and pull requests. This workflow tests and validates
the site; it does not deploy it.

The existing GitHub Pages site has historically been published from the
`gh-pages` branch. This source architecture generates the publishable site in
`dist/`, which is ignored by Git. Pushing this source branch does not publish
that directory. Before publishing the refactor, configure and verify a
deployment process that publishes the contents of `dist/`; do not assume that
merging the source files into `gh-pages` is sufficient.

## DRIME editor case study video

The dedicated editor case study uses `images/drime-editor.mp4`, configured through
`selectedWork.featured.caseStudy.video.src` in both localized data files.
If this value is empty, the product screenshot is shown instead. After replacing
the video or updating its path, rebuild the site. The video uses native controls,
metadata-only preload and no autoplay; closing the dialog pauses and resets it.
The four case-study steps share tab, keyboard, previous/next and progress behavior
with experience dialogs through `src/scripts/dialog-navigation.js` and
`src/styles/components/dialog-navigation.css`. Leaving the overview pauses the
video; reopening the dialog always returns to the first step.

## Reference demos

`examples/drime-player-demo.html` preserves a standalone DRIME player integration
for reference. It uses historical external dependencies and is intentionally not
copied into `dist/` or included in the production portfolio.

## Accessibility and interaction

The interface includes keyboard-operable carousels and dialogs, focus handling,
ARIA state updates, reduced-motion support, and responsive navigation. Content
remains available when decorative scroll animations are disabled.
