import { execFile } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

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

const sourceFiles = await listFiles(sourceRoot);
const templateFiles = sourceFiles.filter((file) => file.endsWith(".njk"));
const styleFiles = sourceFiles.filter((file) => file.endsWith(".css"));
const scriptFiles = sourceFiles.filter((file) => file.endsWith(".js"));

for (const file of templateFiles) {
  const source = await readFile(file, "utf8");
  const relativePath = path.relative(projectRoot, file);
  assert(!/\sstyle\s*=/i.test(source), `${relativePath} contains an inline style attribute.`);
  assert(!/\son[a-z]+\s*=/i.test(source), `${relativePath} contains an inline event handler.`);
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

const pages = [
  { file: "index.html", language: "fr" },
  { file: "uk-version.html", language: "en" }
];
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

for (const page of pages) {
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

const [referencePage, localizedPage] = pages.map(({ file }) => renderedPages.get(file));
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
  console.log(`Static validation passed for ${pages.length} pages.`);
}
