import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";

test("dialog keyboard and closing behavior", async t => {
  const previous = Object.fromEntries(["window", "document"].map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const motion = { matches: false };
  globalThis.window = { matchMedia: () => motion };
  globalThis.document = { activeElement: null };
  const { trapDialogFocus, closeAnimatedDialog } = await import("../src/scripts/dialog.js");

  await t.test("Tab wraps at both ends and leaves other keys alone", () => {
    const elements = Array.from({ length: 3 }, () => ({
      focus() { document.activeElement = this; }
    }));
    const dialog = { querySelectorAll: () => elements };
    const event = (shiftKey = false, key = "Tab") => ({
      key, shiftKey, prevented: false,
      preventDefault() { this.prevented = true; }
    });
    document.activeElement = elements[2];
    const forward = event();
    trapDialogFocus(dialog, forward);
    assert.equal(document.activeElement, elements[0]);
    assert.ok(forward.prevented);
    const backward = event(true);
    trapDialogFocus(dialog, backward);
    assert.equal(document.activeElement, elements[2]);
    assert.ok(backward.prevented);

    document.activeElement = elements[1];
    const middle = event();
    trapDialogFocus(dialog, middle);
    assert.ok(!middle.prevented);
    assert.equal(document.activeElement, elements[1]);
    document.activeElement = elements[2];
    const otherKey = event(false, "ArrowRight");
    trapDialogFocus(dialog, otherKey);
    assert.ok(!otherKey.prevented);
    assert.equal(document.activeElement, elements[2]);
    assert.doesNotThrow(() => trapDialogFocus({ querySelectorAll: () => [] }, event()));
  });

  function createDialog(finished = Promise.resolve()) {
    const classes = new Set();
    return {
      open: true, closeCount: 0, animationCount: 0,
      classList: {
        contains: name => classes.has(name),
        add: name => classes.add(name),
        remove: name => classes.delete(name)
      },
      close() { this.open = false; this.closeCount++; },
      animate() { this.animationCount++; return { finished }; }
    };
  }

  await t.test("animation completes once despite repeated close requests", async () => {
    let finish;
    const dialog = createDialog(new Promise(resolve => { finish = resolve; }));
    closeAnimatedDialog(dialog);
    closeAnimatedDialog(dialog);
    assert.equal(dialog.animationCount, 1);
    assert.equal(dialog.closeCount, 0);
    finish();
    await setImmediate();
    assert.equal(dialog.closeCount, 1);
    assert.ok(!dialog.classList.contains("is-closing"));
    closeAnimatedDialog(dialog);
    assert.equal(dialog.closeCount, 1);
  });

  await t.test("cancelled animation still closes and clears its state", async () => {
    const dialog = createDialog(Promise.reject(new Error("Animation cancelled")));
    closeAnimatedDialog(dialog);
    await setImmediate();
    assert.equal(dialog.closeCount, 1);
    assert.ok(!dialog.classList.contains("is-closing"));
  });

  await t.test("reduced motion closes immediately without animation", () => {
    motion.matches = true;
    const dialog = createDialog();
    closeAnimatedDialog(dialog);
    assert.equal(dialog.closeCount, 1);
    assert.equal(dialog.animationCount, 0);
    motion.matches = false;
  });
});
