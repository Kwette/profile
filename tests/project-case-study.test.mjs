import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import nunjucks from "nunjucks";

for (const language of ["fr", "en"]) {
  test(`RecipeMatcher reuses five case-study views with local measurements in ${language}`, async () => {
    const data = JSON.parse(await readFile(new URL(`../src/data/${language}.json`, import.meta.url), "utf8"));
    const templates = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(fileURLToPath(new URL("../src/", import.meta.url))),
      { autoescape: true, throwOnUndefined: true }
    );
    templates.addFilter("json", value => JSON.stringify(value));
    const project = data.selectedWork.secondary[1];
    const study = project.caseStudy;
    const html = templates.render("components/secondary-case-study.njk", { ...data, caseStudyProject: project });
    assert.equal((html.match(/data-case-study-panel/g) || []).length, 5);
    assert.equal(study.tabs.length, 5);
    assert.ok(html.includes(project.image.src));
    assert.ok(html.includes("composition--progress"));
    assert.equal(study.optimization.metrics.length, 6);
    assert.ok(html.includes(study.optimization.contextLabel));
    assert.equal(study.progressTiles.length, 7);
    assert.equal(study.progressSteps.length, 4);
    assert.ok(study.progressSteps[0].detail.toLowerCase().includes("idempotent"));
    assert.ok(html.includes('class="dialog-content-panel dialog-optimization"'));
    assert.ok(!html.includes("dialog-statistics--volumes"));
    for (const metric of study.optimization.metrics.slice(2, 5)) {
      assert.ok(html.includes(metric.after));
      assert.ok(html.includes(metric.reduction));
    }
    assert.ok(html.includes("dialog-statistics--gains"));
    assert.ok(!study.progressTiles.some(item => item.title.includes("idempotent")));
    assert.ok(!("conceptPanels" in study));
    assert.ok(!html.includes("<video"));
    assert.deepEqual(study.stackGroups.map(group => group.technologies), [
      ["Ruby on Rails", "PostgreSQL"], ["JavaScript", "Stimulus", "Importmap"],
      [language === "fr" ? "Index composite" : "Composite index", "insert_all!", language === "fr" ? "Dataset JSON" : "JSON dataset"], ["Render"]
    ]);
    const stack = templates.render("components/experience-stack.njk", {
      ...data, experienceStack: { key: study.id, groups: study.stackGroups }
    });
    assert.ok(html.includes(stack.trim()));
    const page = templates.render("components/selected-work.njk", data);
    const card = page.match(new RegExp(`<article[^>]*id="${project.id}"[\\s\\S]*?</article>`))[0];
    assert.ok(card.includes(`aria-controls="${study.id}-${language}"`));
    assert.ok(card.includes("data-case-study-trigger"));
    assert.ok(!/<(?:a|button)\b/.test(card));
    const personalProjects = templates.render("components/personal-projects.njk", data);
    assert.ok(personalProjects.includes(`data-case-study-open="${study.id}-${language}"`));
    assert.ok(personalProjects.includes(`data-case-study-open="tripshare-case-study-${language}"`));
  });
  test(`Trip&Share supplies five slides and a single card action in ${language}`, async () => {
    const data = JSON.parse(await readFile(new URL(`../src/data/${language}.json`, import.meta.url), "utf8"));
    const templates = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(fileURLToPath(new URL("../src/", import.meta.url))),
      { autoescape: true, throwOnUndefined: true }
    );
    templates.addFilter("json", value => JSON.stringify(value));
    const project = data.selectedWork.secondary[0];
    const html = templates.render("components/secondary-case-study.njk", { ...data, caseStudyProject: project });
    assert.equal((html.match(/data-case-study-panel/g) || []).length, 5);
    assert.equal(project.caseStudy.tabs.length, 5);
    assert.ok(html.includes("Trip&amp;Share_logo.png"));
    assert.ok(html.includes(project.image.src));
    assert.ok(!html.includes("<video"));
    assert.ok(project.caseStudy.progressTiles.some(item => item.title.includes("Stripe")));
    assert.ok(project.caseStudy.stackGroups[2].technologies.includes("Stripe"));
    assert.deepEqual(project.caseStudy.stackGroups.map(group => group.technologies), [
      ["Ruby on Rails", "PostgreSQL"], ["HTML", "CSS / SCSS", "JavaScript"],
      ["Stripe"], ["Rails I18n", language === "fr" ? "Fichiers .yml" : ".yml files", language === "fr" ? "Interface FR / EN" : "FR / EN interface"]
    ]);
    const sharedStack = templates.render("components/experience-stack.njk", {
      ...data, experienceStack: { key: project.caseStudy.id, groups: project.caseStudy.stackGroups }
    });
    assert.ok(html.includes(sharedStack.trim()));
    assert.ok(!("note" in project.caseStudy.stackGroups[3]));
    assert.ok(!html.includes("experience-stack-grid--three"));
    assert.equal(project.caseStudy.progressTiles.length, 6);
    assert.equal(project.caseStudy.progressSteps.length, 4);
    for (const item of project.caseStudy.progressTiles) {
      const escaped = item.title.replaceAll("&", "&amp;");
      assert.ok(html.includes(`class="info-tag">${escaped}</li>`));
    }
    assert.ok(!html.includes("project-case-study-delivered"));
    assert.ok(!html.includes("dialog-content-pair--plain"));
    assert.ok(!("conclusion" in project.caseStudy));
    assert.ok(project.stack.includes("Stripe"));
    assert.equal(data.personalProjects.items.find(item => item.modifier === "blog").title, "Trip&Share | Blog");
    const page = templates.render("components/selected-work.njk", data);
    const card = page.match(new RegExp(`<article[^>]*id="${project.id}"[\\s\\S]*?</article>`))[0];
    assert.ok(card.includes('data-case-study-trigger'));
    assert.ok(card.includes('role="button"'));
    assert.ok(!/<(?:a|button)\b/.test(card));
  });
  test(`RideShare reuses the shared five-view case study in ${language}`, async () => {
    const data = JSON.parse(await readFile(new URL(`../src/data/${language}.json`, import.meta.url), "utf8"));
    const templates = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(fileURLToPath(new URL("../src/", import.meta.url))),
      { autoescape: true, throwOnUndefined: true }
    );
    templates.addFilter("json", value => JSON.stringify(value));
    const project = data.personalProjects.items.find(item => item.modifier === "ridesharing");
    const study = project.caseStudy;
    const source = templates.render("components/secondary-case-study.njk", { ...data, caseStudyProject: project });
    assert.equal((source.match(/data-case-study-panel/g) || []).length, 5);
    assert.equal(study.tabs.length, 5);
    assert.ok(source.includes(project.image.src));
    assert.equal(study.workflowSteps.length, 4);
    assert.equal(study.secondaryWorkflow.steps.length, 4);
    assert.ok(study.secondaryWorkflow.note.includes("SPA"));
    assert.equal(study.progressTiles.length, 9);
    assert.equal(study.progressSteps.length, 4);
    assert.ok(!study.stackGroups.some(group => /deploy|déploiement/i.test(group.label)));
    const page = templates.render("components/personal-projects.njk", data);
    const card = page.match(/<article[^>]*personal-project-ridesharing[\s\S]*?<\/article>/)[0];
    assert.ok(card.includes("data-case-study-trigger"));
    assert.ok(card.includes(`aria-controls="${study.id}-${language}"`));
    assert.ok(!/<(?:a|button)\b/.test(card));
    assert.ok(page.includes(`id="${study.id}-${language}"`));
  });
  test(`case study supplies five content groups in ${language}`, async () => {
    const data = JSON.parse(await readFile(new URL(`../src/data/${language}.json`, import.meta.url), "utf8"));
    const templates = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(fileURLToPath(new URL("../src/", import.meta.url))),
      { autoescape: true, throwOnUndefined: true }
    );
    templates.addFilter("json", value => JSON.stringify(value));
    const html = templates.render("components/project-case-study.njk", data);
    const study = data.selectedWork.featured.caseStudy;
    assert.equal((html.match(/data-case-study-panel/g) || []).length, 5);
    assert.equal((html.match(/class="dialog-content-rail"/g) || []).length, 5);
    assert.ok(!html.includes("<dialog"));
    assert.ok(html.includes(`data-title="${study.title}"`));
    assert.ok(!study.title.includes("DRIME"));
    assert.equal(html.split(study.role).length - 1, 1);
    assert.ok(html.includes(`${study.role} · ${study.meta}`));
    assert.ok(!html.includes("Projet professionnel"));
    assert.ok(!html.includes("Professional project"));
    assert.equal(study.workflowSteps.length, 5);
    assert.equal(study.tabs[3], data.experiences.stackTitle);
    assert.equal(study.stackPanels.length, 2);
    assert.ok(study.stackPanels.every(panel => panel.groups.length === 3));
    for (const group of study.stackPanels.flatMap(panel => panel.groups)) {
      for (const technology of group.technologies) {
        assert.ok(html.includes(`class="info-tag">${technology}</li>`));
      }
    }
    assert.ok(!html.includes("project-case-study-flow"));
    assert.ok(!html.includes("project-case-study-architecture"));
    assert.equal((html.match(/class="experience-stack"/g) || []).length, 1);
    assert.ok(!html.includes("experience-stack-grid--single"));
    assert.ok(html.includes(`>${study.tabs[3]}</h3>`));
    assert.equal((html.match(/class="experience-results dialog-results-panel"/g) || []).length, 1);
    assert.ok(html.includes('class="dialog-results-conclusion"'));
    assert.ok(html.includes(`poster="${data.selectedWork.featured.image.src}"`));
    const videoTag = html.match(/<video\b[^>]*>/)?.[0] || "";
    assert.ok(videoTag.includes(`src="${study.video.src}"`));
    assert.ok(videoTag.includes(" controls"));
    assert.ok(videoTag.includes('preload="metadata"'));
    assert.ok(!html.includes("autoplay"));
    assert.ok(!html.includes("#experience"));
    for (const experience of Object.values(data.experiences.stacks)) {
      const stack = templates.render("components/experience-stack.njk", {
        ...data, experienceStack: experience
      });
      const count = experience.groups.reduce((sum, group) => sum + group.technologies.length, 0);
      assert.equal((stack.match(/class="info-tag"/g) || []).length, count);
      assert.ok(stack.includes('class="experience-stack-grid"'));
    }
  });
}

test("shared carousel structure, case-study lifecycle and optional video", async t => {
  const descriptors = Object.fromEntries(["window", "document"].map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  const { initializeProjectCaseStudies } = await import("../src/scripts/project-case-study.js");
  const { createDialogCarousel, initializeDialogCarousel } = await import("../src/scripts/dialog-carousel.js");
  for (const withVideo of [false, true]) {
    let focused;
    const node = tag => ({
      tagName: tag.toUpperCase(), children: [], events: new Map(),
      classList: { toggle() {}, contains: () => false },
      append(...children) { this.children.push(...children); },
      setAttribute(name, value) { this[name] = value; },
      getAttribute(name) { return this[name]; },
      addEventListener(type, callback) { this.events.set(type, callback); },
      scrollIntoView() {}, remove() {},
      focus() { focused = this; },
      showModal() { this.open = true; },
      close() { this.open = false; this.events.get("close")(); }
    });
    const style = { overflow: "auto" };
    const video = withVideo ? {
      readyState: 1, currentTime: 42, paused: false,
      pause() { this.paused = true; }
    } : null;
    const source = {
      id: "case-study", remove() {},
      dataset: {
        logoSrc: "logo.png", logoAlt: "DRIME", label: "Case study", title: "Editor",
        meta: "2021–2024", tabs: JSON.stringify(["1", "2", "3", "4", "5"]),
        closeLabel: "Close", sectionsLabel: "Steps", previousLabel: "Previous", nextLabel: "Next"
      },
      children: Array.from({ length: 5 }, () => ({
        querySelector: () => ({ children: [node("p")] })
      })),
      querySelector: () => video
    };
    const trigger = node("article");
    trigger["aria-controls"] = source.id;
    const body = node("body");
    globalThis.document = {
      createElement: node, body, documentElement: { style },
      querySelectorAll: () => [trigger], getElementById: () => source
    };
    initializeProjectCaseStudies();
    const dialog = body.children[0];
    assert.equal(dialog.className, "app-dialog dialog-carousel");
    const [header, tablist, content, footer] = dialog.children[0].children;
    assert.equal(header.className, "app-dialog__header dialog-brand-header");
    const close = header.children[2];
    const [previous, progress, next] = footer.children;
    const open = () => trigger.events.get("click")();
    open();
    assert.ok(dialog.open);
    assert.equal(style.overflow, "hidden");
    assert.equal(focused, close);
    assert.equal(progress.textContent, "1 / 5");
    next.events.get("click")();
    assert.equal(progress.textContent, "2 / 5");
    assert.ok(content.children[0].hidden);
    if (video) assert.ok(video.paused);
    open();
    assert.equal(progress.textContent, "2 / 5");
    dialog.events.get("cancel")({ preventDefault() {} });
    assert.ok(!dialog.open);
    assert.equal(style.overflow, "auto");
    assert.equal(focused, trigger);
    if (video) assert.equal(video.currentTime, 0);
    open();
    assert.equal(progress.textContent, "1 / 5");
    assert.ok(previous.disabled);
    close.events.get("click")();
    for (const key of ["Enter", " "]) {
      trigger.events.get("keydown")({ key, repeat: false, preventDefault() {} });
      assert.ok(dialog.open);
      close.events.get("click")();
      assert.equal(focused, trigger);
    }
    trigger.events.get("keydown")({ key: "Enter", repeat: true, preventDefault() {} });
    assert.ok(!dialog.open);
    assert.equal(tablist.children.filter(tab => tab["aria-selected"] === "true").length, 1);

    const experienceTrigger = node("button");
    const parts = createDialogCarousel({
      id: "experience", title: "Developer", meta: "2021–2024", labels: ["Overview", "Stack"],
      groups: [[node("p")], [node("p")]], closeLabel: "Close", sectionsLabel: "Steps",
      previousLabel: "Previous", nextLabel: "Next"
    });
    initializeDialogCarousel(parts, experienceTrigger);
    assert.equal(parts.dialog.className, dialog.className);
    assert.equal(parts.dialog.children[0].className, dialog.children[0].className);
    assert.equal(parts.content.className, content.className);
    assert.equal(parts.dialog.children[0].children[0].className, header.className);
    assert.ok(!experienceTrigger.events.has("keydown"));
    experienceTrigger.events.get("click")();
    assert.equal(parts.progress.textContent, "1 / 2");
    parts.next.events.get("click")();
    assert.equal(parts.progress.textContent, "2 / 2");
    parts.close.events.get("click")();
    assert.equal(style.overflow, "auto");
    assert.equal(focused, experienceTrigger);
  }
});
