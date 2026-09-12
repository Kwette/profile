import assert from "node:assert/strict";
import test from "node:test";

test("scroll reveals remain safe for tall sections and accessibility fallbacks", async t => {
  const previous = Object.fromEntries(
    ["window", "document", "IntersectionObserver"].map(key =>
      [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  );
  t.after(() => {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });

  const classes = new Set();
  const item = {
    matches: () => false,
    style: { setProperty() {} },
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name)
    }
  };
  const motion = { matches: false };
  const observers = [];
  class Observer {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.targets = [];
      observers.push(this);
    }
    observe(target) { this.targets.push(target); }
  }
  globalThis.window = { matchMedia: () => motion, IntersectionObserver: Observer };
  globalThis.IntersectionObserver = Observer;
  globalThis.document = {
    querySelectorAll: () => [item],
    querySelector: () => null
  };

  const { initializeScrollEffects } = await import("../src/scripts/scroll-effects.js");
  initializeScrollEffects();
  assert.equal(observers.length, 2);
  const [enter, exit] = observers;
  assert.equal(enter.options.threshold, 0);
  assert.notEqual(enter.options.rootMargin, exit.options.rootMargin);
  assert.deepEqual(enter.targets, [item]);
  assert.deepEqual(exit.targets, [item]);

  const notify = (observer, isIntersecting) => observer.callback([
    { target: item, isIntersecting, intersectionRatio: 0.001 }
  ]);
  notify(enter, true);
  assert.ok(classes.has("is-revealed"), "a very low ratio must not block tall sections");
  notify(enter, false);
  notify(exit, true);
  assert.ok(classes.has("is-revealed"), "the boundary margin must not hide visible content");
  notify(exit, false);
  assert.ok(!classes.has("is-revealed"));
  notify(enter, true);
  assert.ok(classes.has("is-revealed"), "sections must reveal again on re-entry");

  classes.clear();
  motion.matches = true;
  initializeScrollEffects();
  assert.equal(observers.length, 2);
  assert.ok(!classes.has("reveal-item"), "reduced motion must leave content visible");

  motion.matches = false;
  delete window.IntersectionObserver;
  initializeScrollEffects();
  assert.equal(observers.length, 2);
  assert.ok(!classes.has("reveal-item"), "unsupported observers must leave content visible");
});
