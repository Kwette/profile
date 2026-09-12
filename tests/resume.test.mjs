import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";

test("resume controls", async t => {
  const previous = Object.fromEntries(["window", "document"].map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const motion = { matches: false };
  let mobile;
  globalThis.window = {
    matchMedia: query => query.includes("reduced-motion") ? motion : mobile
  };
  const { initializeResume } = await import("../src/scripts/resume.js");

  function fixture() {
    const classes = new Set();
    const attributes = new Map([["aria-expanded", "false"]]);
    const properties = new Map();
    const animations = [];
    let click;
    let change;
    mobile = {
      matches: false,
      addEventListener(type, callback) { change = callback; },
      update(value) { this.matches = value; change(); }
    };
    const card = {
      classList: {
        add: key => classes.add(key), remove: key => classes.delete(key),
        toggle(key, enabled) { if (enabled) classes.add(key); else classes.delete(key); }
      },
      style: {
        set overflow(value) { properties.set("overflow", value); },
        removeProperty: key => properties.delete(key)
      },
      getBoundingClientRect: () => ({ height: classes.has("is-expanded") ? 1000 : 200 }),
      getAnimations: () => animations.filter(animation => animation.pending),
      querySelectorAll: () => [],
      animate() {
        let resolve;
        let reject;
        const finished = new Promise((done, fail) => { resolve = done; reject = fail; });
        const animation = {
          finished, pending: true,
          finish() { this.pending = false; resolve(); },
          cancel() { this.pending = false; reject(new Error("Animation cancelled")); }
        };
        animations.push(animation);
        return animation;
      }
    };
    const label = { dataset: { openLabel: "Voir", closeLabel: "Masquer" }, textContent: "Voir" };
    const button = {
      disabled: false,
      closest: () => card, querySelector: () => label,
      setAttribute: (key, value) => attributes.set(key, value),
      getAttribute: key => attributes.get(key),
      addEventListener(type, callback) { click = callback; }
    };
    globalThis.document = { querySelectorAll: () => [button] };
    initializeResume();
    return { button, label, attributes, classes, properties, animations, mobile, click: () => click() };
  }

  await t.test("reduced motion toggles labels and state without animation", () => {
    motion.matches = true;
    const f = fixture();
    f.click();
    assert.equal(f.attributes.get("aria-expanded"), "true");
    assert.equal(f.label.textContent, "Masquer");
    assert.ok(f.classes.has("is-expanded"));
    f.click();
    assert.equal(f.label.textContent, "Voir");
    assert.ok(!f.classes.has("is-expanded"));
    assert.equal(f.animations.length, 0);
    motion.matches = false;
  });

  await t.test("animation completion clears temporary state and enables the control", async () => {
    const f = fixture();
    f.click();
    assert.ok(f.button.disabled);
    assert.equal(f.properties.get("overflow"), "hidden");
    f.animations[0].finish();
    await setImmediate();
    assert.ok(f.classes.has("is-expanded"));
    assert.ok(!f.button.disabled);
    assert.ok(!f.properties.has("overflow"));
    f.click();
    f.animations[1].finish();
    await setImmediate();
    assert.ok(!f.classes.has("is-expanded"));
  });

  await t.test("switching to mobile during opening cannot reopen the resume", async () => {
    const f = fixture();
    f.click();
    f.mobile.update(true);
    f.animations[0].finish();
    await setImmediate();
    assert.equal(f.attributes.get("aria-expanded"), "false");
    assert.equal(f.label.textContent, "Voir");
    assert.ok(!f.classes.has("is-expanded"));
    assert.ok(f.button.disabled);
    assert.ok(!f.properties.has("overflow"));
    f.mobile.update(false);
    assert.ok(!f.button.disabled);
    assert.ok(!f.classes.has("is-expanded"));
  });
});
