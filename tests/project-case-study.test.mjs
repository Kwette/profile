import assert from "node:assert/strict";
import test from "node:test";

test("case study opens, restores focus and resets its optional video", async t => {
  const previous = Object.fromEntries(["window", "document"].map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  const { initializeProjectCaseStudies } = await import("../src/scripts/project-case-study.js");
  for (const withVideo of [false, true]) {
    const events = new Map();
    let open;
    let keydown;
    let close;
    let focus = "trigger";
    const style = { overflow: "auto" };
    const content = { scrollTop: 200 };
    const node = () => ({
      events: new Map(),
      classList: { toggle() {} },
      setAttribute(name, value) { this[name] = value; },
      addEventListener(type, callback) { this.events.set(type, callback); },
      scrollIntoView() {}, focus() {}
    });
    const tabs = Array.from({ length: 4 }, node);
    const panels = Array.from({ length: 4 }, node);
    const previousButton = node();
    const nextButton = node();
    const progress = node();
    const video = withVideo ? {
      readyState: 1, currentTime: 42, paused: false,
      pause() { this.paused = true; }
    } : null;
    const closeButton = {
      addEventListener(type, callback) { close = callback; },
      focus() { focus = "close"; }
    };
    const dialog = {
      open: false, classList: { contains: () => false },
      querySelector(selector) {
        if (selector === "video") return video;
        if (selector === "[data-case-study-previous]") return previousButton;
        if (selector === "[data-case-study-next]") return nextButton;
        if (selector === ".dialog-progress") return progress;
        return selector === "[data-case-study-close]" ? closeButton : content;
      },
      querySelectorAll(selector) { return selector === ".dialog-tab" ? tabs : panels; },
      addEventListener(type, callback) { events.set(type, callback); },
      showModal() { this.open = true; },
      close() { this.open = false; events.get("close")(); }
    };
    const trigger = {
      getAttribute: () => "case-study",
      addEventListener(type, callback) {
        if (type === "click") open = callback;
        if (type === "keydown") keydown = callback;
      },
      focus() { focus = "trigger"; }
    };
    globalThis.document = {
      querySelectorAll: () => [trigger], getElementById: () => dialog,
      documentElement: { style }
    };
    initializeProjectCaseStudies();
    open();
    assert.ok(dialog.open);
    assert.equal(style.overflow, "hidden");
    assert.equal(content.scrollTop, 0);
    assert.equal(focus, "close");
    assert.equal(progress.textContent, "1 / 4");
    nextButton.events.get("click")();
    assert.equal(progress.textContent, "2 / 4");
    assert.ok(panels[0].hidden);
    if (video) assert.ok(video.paused);
    open();
    assert.equal(progress.textContent, "2 / 4");
    let prevented = false;
    events.get("cancel")({ preventDefault() { prevented = true; } });
    assert.ok(prevented);
    assert.ok(!dialog.open);
    assert.equal(style.overflow, "auto");
    assert.equal(focus, "trigger");
    if (video) {
      assert.ok(video.paused);
      assert.equal(video.currentTime, 0);
    }
    open();
    assert.equal(progress.textContent, "1 / 4");
    close();
    assert.ok(!dialog.open);
    assert.equal(style.overflow, "auto");
    for (const key of ["Enter", " "]) {
      let keyPrevented = false;
      keydown({ key, repeat: false, preventDefault() { keyPrevented = true; } });
      assert.ok(keyPrevented);
      assert.ok(dialog.open);
      close();
      assert.equal(focus, "trigger");
    }
    keydown({ key: "Enter", repeat: true, preventDefault() {} });
    assert.ok(!dialog.open);
  }
});
