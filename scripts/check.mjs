import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src");
const outputRoot = path.join(projectRoot, "dist");
const failures = [];

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
  const imports = Array.from(source.matchAll(/\bfrom\s+["'](\.[^"']+)["']/g), (match) => match[1]);
  for (const specifier of imports) {
    const importedFile = path.resolve(path.dirname(file), specifier);
    assert(await exists(importedFile), `${path.relative(projectRoot, file)} imports missing file ${specifier}.`);
  }
}

const pages = [
  { file: "index.html", language: "fr" },
  { file: "uk-version.html", language: "en" }
];

for (const page of pages) {
  const pagePath = path.join(outputRoot, page.file);
  if (!(await exists(pagePath))) {
    failures.push(`dist/${page.file} was not generated.`);
    continue;
  }

  const html = await readFile(pagePath, "utf8");
  assert(html.startsWith("<!DOCTYPE html>"), `dist/${page.file} has no HTML doctype.`);
  assert(html.includes(`<html lang="${page.language}">`), `dist/${page.file} must declare lang="${page.language}".`);

  const ids = Array.from(html.matchAll(/\bid=(["'])([^"']+)\1/g), (match) => match[2]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert(!duplicateIds.length, `dist/${page.file} contains duplicate IDs: ${duplicateIds.join(", ")}.`);

  const references = Array.from(
    html.matchAll(/\b(?:href|src)=(["'])([^"']+)\1/g),
    (match) => match[2]
  );
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(reference)) continue;
    const localPath = reference.split(/[?#]/)[0];
    if (!localPath) continue;
    const resolvedPath = path.resolve(outputRoot, localPath.replace(/^\//, ""));
    assert(await exists(resolvedPath), `dist/${page.file} references missing file ${reference}.`);
  }
}

if (failures.length) {
  console.error(`Static validation failed with ${failures.length} error${failures.length === 1 ? "" : "s"}:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Static validation passed for ${pages.length} pages.`);
}
