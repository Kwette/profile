# Emilie Murat Portfolio

Bilingual portfolio presenting selected product work, professional experience,
technical focus areas, and personal projects.

The site is intentionally built without a frontend framework. Nunjucks generates
the French and English pages from shared components and localized content, while
the browser interactions use native JavaScript modules.

## Tech stack

- HTML generated with [Nunjucks](https://mozilla.github.io/nunjucks/)
- Component-oriented CSS compiled into a single stylesheet
- Native JavaScript modules
- Font Awesome icons
- Node.js build script

## Project structure

```text
.
├── images/                 Static images, documents, and favicon
├── scripts/
│   └── build.mjs           Static-site build pipeline
├── src/
│   ├── components/         Shared Nunjucks components
│   ├── content/            Localized long-form content
│   │   ├── en/
│   │   └── fr/
│   ├── data/               Localized structured page data
│   ├── layouts/            Shared document layout
│   ├── pages/              French and English page entry points
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
yarn build
python3 -m http.server 8002 --directory dist
```

Then open [http://127.0.0.1:8002/](http://127.0.0.1:8002/).

The build command:

1. renders both localized Nunjucks pages;
2. concatenates the ordered CSS sources into `dist/style.css`;
3. copies the native JavaScript modules and static assets into `dist/`.

## Architecture

- Shared structure belongs in `src/components/` and `src/layouts/`.
- Short localized values belong in `src/data/fr.json` and `src/data/en.json`.
- Long localized sections belong in `src/content/fr/` and `src/content/en/`.
- Browser features are isolated by responsibility in `src/scripts/`.
- Reusable visual contracts live in `src/styles/components/`.

The generated pages retain separate URLs so each language remains directly
linkable and can declare the correct document language.

## Accessibility and interaction

The interface includes keyboard-operable carousels and dialogs, focus handling,
ARIA state updates, reduced-motion support, and responsive navigation. Content
remains available when decorative scroll animations are disabled.
