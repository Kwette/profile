import { execFile } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { pages, styleSources } from "./site-config.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src");
const outputRoot = path.join(projectRoot, "dist");
const failures = [];
const executeFile = promisify(execFile);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : entryPath;
  }));
  return files.flat();
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function getAttributeValues(html, attribute) {
  const pattern = new RegExp(`\\b${attribute}=(['"])([^'"]*)\\1`, "gi");
  return Array.from(html.matchAll(pattern), (match) => match[2]);
}

function countElementsWithClass(html, className) {
  return getAttributeValues(html, "class").filter((value) =>
    value.split(/\s+/).includes(className)
  ).length;
}

const languageLinkKeys = new Set(["current", "href", "hreflang"]);

function comparableKeys(value, location) {
  return Object.keys(value)
    .filter((key) => !(/^navigation\.languages\[\d+\]$/.test(location) && languageLinkKeys.has(key)))
    .sort();
}

function compareDataStructure(reference, localized, location = "") {
  const label = location || "data";

  if (Array.isArray(reference)) {
    if (!Array.isArray(localized)) {
      failures.push(`${label} has different value types across locales.`);
      return;
    }
    assert(reference.length === localized.length, `${label} has different array lengths across locales.`);
    reference.slice(0, localized.length).forEach((item, index) => {
      compareDataStructure(item, localized[index], `${label}[${index}]`);
    });
    return;
  }

  if (reference === null || localized === null) {
    assert(reference === localized, `${label} has different nullable values across locales.`);
    return;
  }

  if (typeof reference === "object") {
    if (typeof localized !== "object" || Array.isArray(localized)) {
      failures.push(`${label} has different value types across locales.`);
      return;
    }
    const referenceKeys = comparableKeys(reference, label);
    const localizedKeys = comparableKeys(localized, label);
    assert(
      referenceKeys.join("|") === localizedKeys.join("|"),
      `${label} has different keys across locales (${referenceKeys.join(", ")} / ${localizedKeys.join(", ")}).`
    );
    referenceKeys.filter((key) => key in localized).forEach((key) => {
      compareDataStructure(reference[key], localized[key], location ? `${location}.${key}` : key);
    });
    return;
  }

  assert(typeof reference === typeof localized, `${label} has different value types across locales.`);
}

function validateLanguageSwitcher(data, language) {
  const links = data.navigation?.languages;
  assert(Array.isArray(links) && links.length > 1, `${language} navigation must provide language choices.`);
  if (!Array.isArray(links)) return;

  const currentLinks = links.filter((link) => link.current === true);
  assert(currentLinks.length === 1, `${language} navigation must mark exactly one current language.`);
  links.filter((link) => !link.current).forEach((link) => {
    assert(Boolean(link.href && link.hreflang), `${language} alternate languages must provide href and hreflang.`);
  });
}

const sourceFiles = await listFiles(sourceRoot);
const templateFiles = sourceFiles.filter((file) => file.endsWith(".njk"));
const styleFiles = sourceFiles.filter((file) => file.endsWith(".css"));
const scriptFiles = sourceFiles.filter((file) => file.endsWith(".js"));
const registeredStyleFiles = styleSources.map((file) => path.normalize(path.join(sourceRoot, file)));
const registeredStyleSet = new Set(registeredStyleFiles);

assert(
  registeredStyleFiles.length === registeredStyleSet.size,
  "CSS source configuration contains duplicate entries."
);
styleFiles.forEach((file) => {
  assert(registeredStyleSet.has(path.normalize(file)), `${path.relative(projectRoot, file)} is missing from the CSS source configuration.`);
});
registeredStyleFiles.forEach((file) => {
  assert(styleFiles.includes(file), `${path.relative(projectRoot, file)} is registered but does not exist.`);
});

for (const file of templateFiles) {
  const source = await readFile(file, "utf8");
  const relativePath = path.relative(projectRoot, file);
  assert(!/\sstyle\s*=/i.test(source), `${relativePath} contains an inline style attribute.`);
  assert(!/\son[a-z]+\s*=/i.test(source), `${relativePath} contains an inline event handler.`);
  assert(!/<\/br\s*>/i.test(source), `${relativePath} contains an invalid closing br tag.`);
  assert(!/^\s*-\s+\S/m.test(source), `${relativePath} contains a text bullet that should use a list element.`);
}

for (const file of styleFiles) {
  const source = await readFile(file, "utf8");
  const relativePath = path.relative(projectRoot, file);
  assert(!/,\s*\{/.test(source), `${relativePath} contains a selector ending with a comma.`);
}

for (const file of scriptFiles) {
  const source = await readFile(file, "utf8");
  const relativePath = path.relative(projectRoot, file);

  try {
    await executeFile(process.execPath, ["--check", file]);
  } catch (error) {
    const details = error.stderr?.trim();
    failures.push(`${relativePath} contains invalid JavaScript${details ? `:\n${details}` : "."}`);
  }

  const imports = Array.from(source.matchAll(/\bfrom\s+["'](\.[^"']+)["']/g), (match) => match[1]);
  for (const specifier of imports) {
    const importedFile = path.resolve(path.dirname(file), specifier);
    assert(await exists(importedFile), `${relativePath} imports missing file ${specifier}.`);
  }
}

const [frenchData, englishData] = await Promise.all(
  ["fr", "en"].map(async (language) =>
    JSON.parse(await readFile(path.join(sourceRoot, "data", `${language}.json`), "utf8"))
  )
);
compareDataStructure(frenchData, englishData);
validateLanguageSwitcher(frenchData, "French");
validateLanguageSwitcher(englishData, "English");

const checkedPages = pages.map(({ output: file, language }) => ({ file, language }));
const requiredSectionIds = ["help", "apps", "technical-focus", "experience", "contact", "other-projects"];
const structuralClasses = [
  "selected-project",
  "technical-focus-tab",
  "experience-card",
  "experience-dialog",
  "personal-project-card",
  "archive-project",
  "community-item"
];
const renderedPages = new Map();

for (const page of checkedPages) {
  const pagePath = path.join(outputRoot, page.file);
  if (!(await exists(pagePath))) {
    failures.push(`dist/${page.file} was not generated.`);
    continue;
  }

  const html = await readFile(pagePath, "utf8");
  renderedPages.set(page.file, html);
  assert(html.startsWith("<!DOCTYPE html>"), `dist/${page.file} has no HTML doctype.`);
  assert(html.includes(`<html lang="${page.language}">`), `dist/${page.file} must declare lang="${page.language}".`);

  const ids = getAttributeValues(html, "id");
  const idSet = new Set(ids);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert(!duplicateIds.length, `dist/${page.file} contains duplicate IDs: ${duplicateIds.join(", ")}.`);

  for (const id of requiredSectionIds) {
    assert(idSet.has(id), `dist/${page.file} is missing required section #${id}.`);
  }

  for (const href of getAttributeValues(html, "href")) {
    if (!href.startsWith("#") || href === "#") continue;
    const target = decodeURIComponent(href.slice(1));
    assert(idSet.has(target), `dist/${page.file} links to missing anchor #${target}.`);
  }

  for (const attribute of ["aria-controls", "aria-labelledby", "aria-describedby"]) {
    for (const value of getAttributeValues(html, attribute)) {
      for (const target of value.trim().split(/\s+/).filter(Boolean)) {
        assert(idSet.has(target), `dist/${page.file} has ${attribute} pointing to missing #${target}.`);
      }
    }
  }

  const references = [
    ...getAttributeValues(html, "href"),
    ...getAttributeValues(html, "src")
  ];
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(reference)) continue;
    const localPath = reference.split(/[?#]/)[0];
    if (!localPath) continue;
    const resolvedPath = path.resolve(outputRoot, localPath.replace(/^\//, ""));
    assert(await exists(resolvedPath), `dist/${page.file} references missing file ${reference}.`);
  }
}

const [referencePage, localizedPage] = checkedPages.map(({ file }) => renderedPages.get(file));
if (referencePage && localizedPage) {
  for (const className of structuralClasses) {
    const referenceCount = countElementsWithClass(referencePage, className);
    const localizedCount = countElementsWithClass(localizedPage, className);
    assert(
      referenceCount === localizedCount,
      `Localized pages have different .${className} counts (${referenceCount} and ${localizedCount}).`
    );
  }
}

if (failures.length) {
  console.error(`Static validation failed with ${failures.length} error${failures.length === 1 ? "" : "s"}:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Static validation passed for ${checkedPages.length} pages.`);
}
